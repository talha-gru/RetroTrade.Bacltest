/**
 * RetroTrade Lab - Indicators & Technical Overlays Engine
 * Moving Averages, RSI, MACD, Bollinger Bands, Volume Profile & LuxAlgo Session Boxes
 */

class IndicatorsManager {
    constructor(chartManager) {
        this.chartManager = chartManager;
        
        // Indicator configurations with persistent toggle states
        this.config = this.loadConfig() || {
            ema20: { enabled: true, period: 20, color: '#00ff66', width: 1.5 },
            ema50: { enabled: true, period: 50, color: '#38bdf8', width: 1.5 },
            ema200: { enabled: false, period: 200, color: '#a855f7', width: 1.5 },
            sma50: { enabled: false, period: 50, color: '#fbbf24', width: 1.5 },
            bollinger: { enabled: false, period: 20, stdDev: 2, upperColor: '#ec4899', lowerColor: '#ec4899', midColor: '#9ca3af' },
            volumeProfile: { enabled: true, opacity: 0.35, pocColor: '#ff3344' },
            rsi: { enabled: false, period: 14, overbought: 70, oversold: 30, color: '#f59e0b' },
            macd: { enabled: false, fast: 12, slow: 26, signal: 9 },
            sessions: {
                enabled: true,
                showTokyo: true,   // 00:00 - 08:00 UTC (Purple)
                showLondon: true,  // 08:00 - 16:00 UTC (Cyan)
                showNewYork: true, // 13:00 - 21:00 UTC (Amber)
                showSydney: false, // 21:00 - 05:00 UTC (Green)
                opacity: 0.12
            }
        };

        this.seriesMap = {};
    }

    loadConfig() {
        try {
            const saved = localStorage.getItem('retrotrade_indicators_v2');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    saveConfig() {
        try {
            localStorage.setItem('retrotrade_indicators_v2', JSON.stringify(this.config));
        } catch (e) {}
    }

    toggleIndicator(key, state) {
        if (this.config[key] !== undefined) {
            if (typeof this.config[key] === 'object' && 'enabled' in this.config[key]) {
                this.config[key].enabled = (state !== undefined) ? state : !this.config[key].enabled;
            } else {
                this.config[key] = (state !== undefined) ? state : !this.config[key];
            }
            this.saveConfig();
            return this.config[key].enabled;
        }
        return false;
    }

    // Mathematical Indicator Calculations
    calculateSMA(data, period) {
        const result = [];
        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) continue;
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            result.push({ time: data[i].time, value: +(sum / period).toFixed(2) });
        }
        return result;
    }

    calculateEMA(data, period) {
        if (!data || data.length === 0) return [];
        const k = 2 / (period + 1);
        const emaData = [];
        let ema = data[0].close;

        for (let i = 0; i < data.length; i++) {
            if (i === 0) {
                emaData.push({ time: data[i].time, value: ema });
            } else {
                ema = (data[i].close * k) + (ema * (1 - k));
                emaData.push({ time: data[i].time, value: +ema.toFixed(2) });
            }
        }
        return emaData;
    }

    calculateBollinger(data, period = 20, multiplier = 2) {
        const upper = [];
        const middle = [];
        const lower = [];

        for (let i = 0; i < data.length; i++) {
            if (i < period - 1) continue;
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            const mean = sum / period;

            let varianceSum = 0;
            for (let j = 0; j < period; j++) {
                varianceSum += Math.pow(data[i - j].close - mean, 2);
            }
            const stdDev = Math.sqrt(varianceSum / period);

            const t = data[i].time;
            middle.push({ time: t, value: +mean.toFixed(2) });
            upper.push({ time: t, value: +(mean + (multiplier * stdDev)).toFixed(2) });
            lower.push({ time: t, value: +(mean - (multiplier * stdDev)).toFixed(2) });
        }

        return { upper, middle, lower };
    }

    calculateRSI(data, period = 14) {
        if (data.length <= period) return [];
        const rsiData = [];
        let gains = 0;
        let losses = 0;

        for (let i = 1; i <= period; i++) {
            const diff = data[i].close - data[i - 1].close;
            if (diff >= 0) gains += diff;
            else losses += Math.abs(diff);
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        for (let i = period + 1; i < data.length; i++) {
            const diff = data[i].close - data[i - 1].close;
            const currentGain = diff > 0 ? diff : 0;
            const currentLoss = diff < 0 ? Math.abs(diff) : 0;

            avgGain = ((avgGain * (period - 1)) + currentGain) / period;
            avgLoss = ((avgLoss * (period - 1)) + currentLoss) / period;

            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));
            rsiData.push({ time: data[i].time, value: +rsi.toFixed(2) });
        }

        return rsiData;
    }

    calculateMACD(data, fast = 12, slow = 26, signal = 9) {
        const emaFast = this.calculateEMA(data, fast);
        const emaSlow = this.calculateEMA(data, slow);
        
        // Align timestamps
        const slowMap = new Map(emaSlow.map(d => [d.time, d.value]));
        const macdLine = [];

        for (const f of emaFast) {
            if (slowMap.has(f.time)) {
                macdLine.push({ time: f.time, close: +(f.value - slowMap.get(f.time)).toFixed(2) });
            }
        }

        const signalLine = this.calculateEMA(macdLine, signal);
        const sigMap = new Map(signalLine.map(d => [d.time, d.value]));
        const histogram = [];

        for (const m of macdLine) {
            if (sigMap.has(m.time)) {
                const diff = +(m.close - sigMap.get(m.time)).toFixed(2);
                histogram.push({
                    time: m.time,
                    value: diff,
                    color: diff >= 0 ? '#00ff66' : '#ff3344'
                });
            }
        }

        return {
            macd: macdLine.map(d => ({ time: d.time, value: d.close })),
            signal: signalLine,
            histogram
        };
    }

    calculateVolumeProfile(candles, bucketsCount = 24) {
        if (!candles || candles.length === 0) return null;
        let minPrice = Infinity;
        let maxPrice = -Infinity;

        for (const c of candles) {
            if (c.low < minPrice) minPrice = c.low;
            if (c.high > maxPrice) maxPrice = c.high;
        }

        const step = (maxPrice - minPrice) / bucketsCount;
        const buckets = Array.from({ length: bucketsCount }, (_, i) => ({
            price: minPrice + (i * step) + (step / 2),
            buyVol: 0,
            sellVol: 0,
            totalVol: 0
        }));

        for (const c of candles) {
            const bIdx = Math.min(bucketsCount - 1, Math.max(0, Math.floor((c.close - minPrice) / step)));
            const isBuy = c.close >= c.open;
            if (isBuy) buckets[bIdx].buyVol += c.volume;
            else buckets[bIdx].sellVol += c.volume;
            buckets[bIdx].totalVol += c.volume;
        }

        let maxVol = 0;
        let pocIndex = 0;
        buckets.forEach((b, idx) => {
            if (b.totalVol > maxVol) {
                maxVol = b.totalVol;
                pocIndex = idx;
            }
        });

        return {
            buckets,
            pocPrice: buckets[pocIndex].price,
            maxVol
        };
    }

    // LuxAlgo-Style Trading Session Intervals Finder
    getTradingSessions(candles) {
        if (!candles || candles.length === 0) return [];
        const sessions = [];

        // Sessions Definitions (UTC hours)
        // Tokyo: 00:00 - 08:00
        // London: 08:00 - 16:00
        // New York: 13:00 - 21:00
        // Sydney: 21:00 - 05:00
        const sessionDefs = [
            { id: 'tokyo', name: 'Tokyo / Asian', startH: 0, endH: 8, color: '#a855f7', enabledKey: 'showTokyo' },
            { id: 'london', name: 'London Open', startH: 8, endH: 16, color: '#38bdf8', enabledKey: 'showLondon' },
            { id: 'newyork', name: 'New York', startH: 13, endH: 21, color: '#f59e0b', enabledKey: 'showNewYork' },
            { id: 'sydney', name: 'Sydney', startH: 21, endH: 5, color: '#10b981', enabledKey: 'showSydney' }
        ];

        // Sample last 200 candles to keep performance fast
        const sample = candles.slice(-200);

        for (const def of sessionDefs) {
            if (!this.config.sessions[def.enabledKey]) continue;

            let currentSession = null;

            for (const c of sample) {
                const date = new Date(c.time * 1000);
                const hour = date.getUTCHours();
                let inSession = false;

                if (def.startH < def.endH) {
                    inSession = (hour >= def.startH && hour < def.endH);
                } else {
                    inSession = (hour >= def.startH || hour < def.endH);
                }

                if (inSession) {
                    if (!currentSession) {
                        currentSession = {
                            id: def.id,
                            name: def.name,
                            color: def.color,
                            startTime: c.time,
                            endTime: c.time,
                            high: c.high,
                            low: c.low
                        };
                    } else {
                        currentSession.endTime = c.time;
                        currentSession.high = Math.max(currentSession.high, c.high);
                        currentSession.low = Math.min(currentSession.low, c.low);
                    }
                } else {
                    if (currentSession) {
                        sessions.push(currentSession);
                        currentSession = null;
                    }
                }
            }

            if (currentSession) sessions.push(currentSession);
        }

        return sessions;
    }
}

window.IndicatorsManager = IndicatorsManager;

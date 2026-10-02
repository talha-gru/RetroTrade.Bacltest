/**
 * RetroTrade Lab - Data Manager & Market Feeds (5-Year Multi-Timeframe)
 */
class MarketDataManager {
    constructor() {
        this.currentSymbol = 'XAU/USD';
        this.currentTimeframe = '1h';
        this.currentStartDate = '2024-01-01';
        this.currentStartTimestamp = 1704067200;
        this.data = [];
        this.specs = window.RetroData ? window.RetroData.specs : {};
    }

    loadSessionData(symbol, timeframe, startTimestamp) {
        this.currentSymbol = symbol || this.currentSymbol;
        this.currentTimeframe = timeframe || this.currentTimeframe;
        this.currentStartTimestamp = startTimestamp || this.currentStartTimestamp;

        if (window.RetroData && window.RetroData.getCandlesForSession) {
            this.data = window.RetroData.getCandlesForSession({
                symbol: this.currentSymbol,
                timeframe: this.currentTimeframe,
                startDateTimestamp: this.currentStartTimestamp,
                count: 1400
            });
        }
        return this.data;
    }

    loadSymbol(symbol, timeframe) {
        return this.loadSessionData(symbol, timeframe, this.currentStartTimestamp);
    }

    setTimeframe(timeframe) {
        this.currentTimeframe = timeframe;
        return this.loadSessionData(this.currentSymbol, timeframe, this.currentStartTimestamp);
    }

    setStartDate(dateStr) {
        this.currentStartDate = dateStr;
        const ts = Math.floor(new Date(dateStr).getTime() / 1000);
        if (!isNaN(ts)) {
            this.currentStartTimestamp = ts;
            return this.loadSessionData(this.currentSymbol, this.currentTimeframe, ts);
        }
        return this.data;
    }

    getSpec() {
        return (this.specs && this.specs[this.currentSymbol]) || {
            name: this.currentSymbol,
            contractSize: 1,
            pipSize: 0.01,
            pipValuePerLot: 1.00,
            defaultLot: 1.0,
            decimals: 2,
            minSpread: 0.1
        };
    }

    generateMarketScenario(type) {
        const spec = this.getSpec();
        const basePrice = this.data.length > 0 ? this.data[this.data.length - 1].close : (this.currentSymbol.includes('BTC') ? 64000 : 2350);
        let volatility = this.currentSymbol.includes('BTC') ? 0.007 : 0.003;
        let drift = 0.0002;

        if (type === 'bull') {
            drift = this.currentSymbol.includes('BTC') ? 0.001 : 0.0005;
        } else if (type === 'bear') {
            drift = this.currentSymbol.includes('BTC') ? -0.001 : -0.0005;
        } else if (type === 'volatile') {
            volatility *= 2.5;
            drift = 0;
        } else if (type === 'range') {
            volatility *= 0.5;
            drift = 0;
        }

        const intervalSec = (window.RetroData && window.RetroData.TF_SECONDS[this.currentTimeframe]) || 3600;
        const newCandles = [];
        let curr = basePrice;
        let t = Math.floor(Date.now() / 1000) - (800 * intervalSec);

        for (let i = 0; i < 800; i++) {
            const shock = (Math.random() - 0.495) * volatility * curr;
            const open = curr;
            const close = +(open + shock + (drift * curr)).toFixed(spec.decimals);
            const high = +(Math.max(open, close) + Math.random() * (curr * volatility * 0.5)).toFixed(spec.decimals);
            const low = +(Math.min(open, close) - Math.random() * (curr * volatility * 0.5)).toFixed(spec.decimals);
            const volume = Math.floor(1000 + Math.random() * 2000);

            newCandles.push({
                time: t,
                open,
                high,
                low,
                close,
                volume
            });
            curr = close;
            t += intervalSec;
        }

        this.data = newCandles;
        return this.data;
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return null;

        const candles = [];
        const header = lines[0].toLowerCase().split(',').map(h => h.trim());
        const timeIdx = header.findIndex(h => h.includes('time') || h.includes('date'));
        const openIdx = header.findIndex(h => h.includes('open'));
        const highIdx = header.findIndex(h => h.includes('high'));
        const lowIdx = header.findIndex(h => h.includes('low'));
        const closeIdx = header.findIndex(h => h.includes('close'));
        const volIdx = header.findIndex(h => h.includes('vol'));

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim());
            if (cols.length < 5) continue;

            let timeVal = cols[timeIdx];
            let timestamp = Math.floor(new Date(timeVal).getTime() / 1000);
            if (isNaN(timestamp)) {
                timestamp = parseInt(timeVal);
                if (timestamp > 1e11) timestamp = Math.floor(timestamp / 1000);
            }

            const open = parseFloat(cols[openIdx]);
            const high = parseFloat(cols[highIdx]);
            const low = parseFloat(cols[lowIdx]);
            const close = parseFloat(cols[closeIdx]);
            const volume = volIdx !== -1 ? parseFloat(cols[volIdx]) : 100;

            if (!isNaN(timestamp) && !isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
                candles.push({
                    time: timestamp,
                    open,
                    high,
                    low,
                    close,
                    volume
                });
            }
        }

        candles.sort((a, b) => a.time - b.time);
        if (candles.length > 0) {
            this.data = candles;
            return candles;
        }
        return null;
    }
}

window.MarketDataManager = MarketDataManager;

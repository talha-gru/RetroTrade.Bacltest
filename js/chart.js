/**
 * RetroTrade Lab - TradingView Lightweight Charts Manager (Elite Pro Suite)
 * With dynamic indicator series toggles (EMAs, Bollinger, Volume Profile, SMA, RSI, MACD)
 */

class ChartManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.chart = null;
        this.candleSeries = null;
        this.volumeSeries = null;
        this.currentCandles = [];

        // Dynamic indicator line series map
        this.indicatorSeries = {
            ema20: null,
            ema50: null,
            ema200: null,
            sma50: null,
            bbUpper: null,
            bbMiddle: null,
            bbLower: null,
            volumeProfilePoc: null
        };

        // Theme Settings
        this.theme = this.loadSavedTheme() || {
            upColor: '#00ff66',
            downColor: '#ffffff',
            wickUpColor: '#00ff66',
            wickDownColor: '#cbd5e1',
            borderUpColor: '#00ff66',
            borderDownColor: '#ffffff',
            backgroundColor: '#111318',
            gridVisible: true,
            gridColor: '#1f242b'
        };

        this.priceLines = {
            entry: null,
            sl: null,
            tp: null
        };

        this.initChart();
        this.handleResize();
    }

    loadSavedTheme() {
        try {
            const saved = localStorage.getItem('retrotrade_chart_theme_v2');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    saveTheme() {
        try {
            localStorage.setItem('retrotrade_chart_theme_v2', JSON.stringify(this.theme));
        } catch (e) {}
    }

    initChart() {
        if (!this.container) return;
        this.container.innerHTML = '';

        const chartOptions = {
            width: this.container.clientWidth,
            height: this.container.clientHeight || 540,
            layout: {
                background: { color: this.theme.backgroundColor },
                textColor: '#9ca3af',
                fontSize: 12,
                fontFamily: "'JetBrains Mono', 'Plus Jakarta Sans', monospace"
            },
            grid: {
                vertLines: {
                    color: this.theme.gridVisible ? this.theme.gridColor : 'transparent',
                    visible: this.theme.gridVisible
                },
                horzLines: {
                    color: this.theme.gridVisible ? this.theme.gridColor : 'transparent',
                    visible: this.theme.gridVisible
                }
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: {
                    width: 1,
                    color: this.theme.upColor,
                    style: LightweightCharts.LineStyle.Dashed,
                    labelBackgroundColor: '#1f242c'
                },
                horzLine: {
                    width: 1,
                    color: this.theme.upColor,
                    style: LightweightCharts.LineStyle.Dashed,
                    labelBackgroundColor: '#1f242c'
                }
            },
            rightPriceScale: {
                borderColor: '#242a33',
                scaleMargins: {
                    top: 0.08,
                    bottom: 0.18
                }
            },
            timeScale: {
                borderColor: '#242a33',
                timeVisible: true,
                secondsVisible: false
            }
        };

        this.chart = LightweightCharts.createChart(this.container, chartOptions);

        // Main Candlestick Series
        this.candleSeries = this.chart.addCandlestickSeries({
            upColor: this.theme.upColor,
            borderUpColor: this.theme.borderUpColor,
            wickUpColor: this.theme.wickUpColor,
            downColor: this.theme.downColor,
            borderDownColor: this.theme.borderDownColor,
            wickDownColor: this.theme.wickDownColor,
            priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01
            }
        });

        // Volume Series (toggleable)
        this.volumeSeries = this.chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            scaleMargins: { top: 0.82, bottom: 0 }
        });

        // Initialize Dynamic Line Series for indicators
        this.initIndicatorSeries();

        // Crosshair legend handler
        this.chart.subscribeCrosshairMove(param => {
            this.updateLegend(param);
        });

        window.addEventListener('resize', () => this.handleResize());
    }

    initIndicatorSeries() {
        // EMA 20
        this.indicatorSeries.ema20 = this.chart.addLineSeries({
            color: '#00ff66',
            lineWidth: 1.5,
            priceLineVisible: false,
            title: 'EMA 20'
        });

        // EMA 50
        this.indicatorSeries.ema50 = this.chart.addLineSeries({
            color: '#38bdf8',
            lineWidth: 1.5,
            priceLineVisible: false,
            title: 'EMA 50'
        });

        // EMA 200
        this.indicatorSeries.ema200 = this.chart.addLineSeries({
            color: '#a855f7',
            lineWidth: 1.5,
            priceLineVisible: false,
            title: 'EMA 200'
        });

        // SMA 50
        this.indicatorSeries.sma50 = this.chart.addLineSeries({
            color: '#fbbf24',
            lineWidth: 1.5,
            priceLineVisible: false,
            title: 'SMA 50'
        });

        // Bollinger Bands
        this.indicatorSeries.bbUpper = this.chart.addLineSeries({
            color: '#ec4899',
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            priceLineVisible: false,
            title: 'BB Upper'
        });
        this.indicatorSeries.bbMiddle = this.chart.addLineSeries({
            color: '#9ca3af',
            lineWidth: 1,
            priceLineVisible: false,
            title: 'BB Basis'
        });
        this.indicatorSeries.bbLower = this.chart.addLineSeries({
            color: '#ec4899',
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Dashed,
            priceLineVisible: false,
            title: 'BB Lower'
        });
    }

    setData(candles, precision = 2, indicatorsConfig = null) {
        if (!candles || candles.length === 0) return;
        this.currentCandles = candles;

        this.candleSeries.applyOptions({
            priceFormat: {
                type: 'price',
                precision: precision,
                minMove: 1 / Math.pow(10, precision)
            }
        });

        this.candleSeries.setData(candles);

        // Volume data
        const volumeData = candles.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close >= c.open ? 'rgba(0, 255, 102, 0.28)' : 'rgba(255, 255, 255, 0.25)'
        }));
        this.volumeSeries.setData(volumeData);

        // Apply Indicators
        this.updateIndicators(indicatorsConfig);

        const lastBar = candles[candles.length - 1];
        this.renderLegendBar(lastBar);
    }

    updateIndicators(config) {
        if (!config || !this.currentCandles || this.currentCandles.length < 20) return;

        const candles = this.currentCandles;
        const ind = window.indicatorsEngine || (window.IndicatorsManager ? new window.IndicatorsManager(this) : null);
        if (!ind) return;

        // EMA 20
        if (config.ema20 && config.ema20.enabled) {
            this.indicatorSeries.ema20.applyOptions({ visible: true });
            this.indicatorSeries.ema20.setData(ind.calculateEMA(candles, config.ema20.period || 20));
        } else {
            this.indicatorSeries.ema20.applyOptions({ visible: false });
        }

        // EMA 50
        if (config.ema50 && config.ema50.enabled) {
            this.indicatorSeries.ema50.applyOptions({ visible: true });
            this.indicatorSeries.ema50.setData(ind.calculateEMA(candles, config.ema50.period || 50));
        } else {
            this.indicatorSeries.ema50.applyOptions({ visible: false });
        }

        // EMA 200
        if (config.ema200 && config.ema200.enabled && candles.length > 100) {
            this.indicatorSeries.ema200.applyOptions({ visible: true });
            this.indicatorSeries.ema200.setData(ind.calculateEMA(candles, 200));
        } else {
            this.indicatorSeries.ema200.applyOptions({ visible: false });
        }

        // SMA 50
        if (config.sma50 && config.sma50.enabled) {
            this.indicatorSeries.sma50.applyOptions({ visible: true });
            this.indicatorSeries.sma50.setData(ind.calculateSMA(candles, 50));
        } else {
            this.indicatorSeries.sma50.applyOptions({ visible: false });
        }

        // Bollinger Bands
        if (config.bollinger && config.bollinger.enabled) {
            const bb = ind.calculateBollinger(candles, config.bollinger.period || 20, config.bollinger.stdDev || 2);
            this.indicatorSeries.bbUpper.applyOptions({ visible: true });
            this.indicatorSeries.bbMiddle.applyOptions({ visible: true });
            this.indicatorSeries.bbLower.applyOptions({ visible: true });
            this.indicatorSeries.bbUpper.setData(bb.upper);
            this.indicatorSeries.bbMiddle.setData(bb.middle);
            this.indicatorSeries.bbLower.setData(bb.lower);
        } else {
            this.indicatorSeries.bbUpper.applyOptions({ visible: false });
            this.indicatorSeries.bbMiddle.applyOptions({ visible: false });
            this.indicatorSeries.bbLower.applyOptions({ visible: false });
        }

        // Volume Profile POC line
        if (config.volumeProfile && config.volumeProfile.enabled) {
            const vp = ind.calculateVolumeProfile(candles);
            if (vp) {
                if (this.indicatorSeries.volumeProfilePoc) {
                    try { this.candleSeries.removePriceLine(this.indicatorSeries.volumeProfilePoc); } catch(e){}
                }
                this.indicatorSeries.volumeProfilePoc = this.candleSeries.createPriceLine({
                    price: vp.pocPrice,
                    color: '#ff3344',
                    lineWidth: 1.5,
                    lineStyle: LightweightCharts.LineStyle.Dotted,
                    axisLabelVisible: true,
                    title: `POC: ${vp.pocPrice.toFixed(2)}`
                });
            }
        } else if (this.indicatorSeries.volumeProfilePoc) {
            try { this.candleSeries.removePriceLine(this.indicatorSeries.volumeProfilePoc); } catch(e){}
            this.indicatorSeries.volumeProfilePoc = null;
        }
    }

    updateLastBar(candle) {
        if (!candle) return;
        this.candleSeries.update(candle);
        this.volumeSeries.update({
            time: candle.time,
            value: candle.volume,
            color: candle.close >= candle.open ? 'rgba(0, 255, 102, 0.3)' : 'rgba(255, 255, 255, 0.25)'
        });
        this.renderLegendBar(candle);
    }

    renderLegendBar(bar) {
        if (!bar) return;
        const oEl = document.getElementById('hud-open');
        const hEl = document.getElementById('hud-high');
        const lEl = document.getElementById('hud-low');
        const cEl = document.getElementById('hud-close');
        const chgEl = document.getElementById('hud-change');
        const volEl = document.getElementById('hud-volume');

        if (!oEl) return;

        const change = bar.close - bar.open;
        const changePct = ((change / bar.open) * 100).toFixed(2);
        const isUp = change >= 0;

        oEl.innerText = bar.open.toFixed(2);
        hEl.innerText = bar.high.toFixed(2);
        lEl.innerText = bar.low.toFixed(2);
        cEl.innerText = bar.close.toFixed(2);

        chgEl.innerText = `${isUp ? '+' : ''}${change.toFixed(2)} (${isUp ? '+' : ''}${changePct}%)`;
        chgEl.className = `font-mono font-bold ${isUp ? 'text-[#00ff66]' : 'text-white'}`;

        if (volEl && bar.volume) {
            volEl.innerText = bar.volume.toLocaleString();
        }
    }

    updateLegend(param) {
        if (!param || !param.time || !param.seriesData) return;
        const candleData = param.seriesData.get(this.candleSeries);
        if (candleData) {
            this.renderLegendBar(candleData);
        }
    }

    applyCustomTheme(newTheme) {
        this.theme = { ...this.theme, ...newTheme };
        this.saveTheme();

        if (this.chart) {
            this.chart.applyOptions({
                layout: { background: { color: this.theme.backgroundColor } },
                grid: {
                    vertLines: {
                        color: this.theme.gridVisible ? this.theme.gridColor : 'transparent',
                        visible: this.theme.gridVisible
                    },
                    horzLines: {
                        color: this.theme.gridVisible ? this.theme.gridColor : 'transparent',
                        visible: this.theme.gridVisible
                    }
                }
            });

            if (this.candleSeries) {
                this.candleSeries.applyOptions({
                    upColor: this.theme.upColor,
                    borderUpColor: this.theme.borderUpColor,
                    wickUpColor: this.theme.wickUpColor,
                    downColor: this.theme.downColor,
                    borderDownColor: this.theme.borderDownColor,
                    wickDownColor: this.theme.wickDownColor
                });
            }
        }
    }

    resetDefaultTheme() {
        const defaultTheme = {
            upColor: '#00ff66',
            downColor: '#ffffff',
            wickUpColor: '#00ff66',
            wickDownColor: '#cbd5e1',
            borderUpColor: '#00ff66',
            borderDownColor: '#ffffff',
            backgroundColor: '#111318',
            gridVisible: true,
            gridColor: '#1f242b'
        };
        this.applyCustomTheme(defaultTheme);
        return defaultTheme;
    }

    setOrderLines({ entryPrice, slPrice, tpPrice, type = 'LONG' }) {
        this.clearOrderLines();

        if (entryPrice) {
            this.priceLines.entry = this.candleSeries.createPriceLine({
                price: entryPrice,
                color: '#38bdf8',
                lineWidth: 2,
                lineStyle: LightweightCharts.LineStyle.Dashed,
                axisLabelVisible: true,
                title: `${type} @ ${entryPrice.toFixed(2)}`
            });
        }

        if (slPrice) {
            this.priceLines.sl = this.candleSeries.createPriceLine({
                price: slPrice,
                color: '#ff3344',
                lineWidth: 2,
                lineStyle: LightweightCharts.LineStyle.Solid,
                axisLabelVisible: true,
                title: `SL: ${slPrice.toFixed(2)}`
            });
        }

        if (tpPrice) {
            this.priceLines.tp = this.candleSeries.createPriceLine({
                price: tpPrice,
                color: '#00ff66',
                lineWidth: 2,
                lineStyle: LightweightCharts.LineStyle.Solid,
                axisLabelVisible: true,
                title: `TP: ${tpPrice.toFixed(2)}`
            });
        }
    }

    clearOrderLines() {
        if (this.priceLines.entry) {
            try { this.candleSeries.removePriceLine(this.priceLines.entry); } catch(e){}
            this.priceLines.entry = null;
        }
        if (this.priceLines.sl) {
            try { this.candleSeries.removePriceLine(this.priceLines.sl); } catch(e){}
            this.priceLines.sl = null;
        }
        if (this.priceLines.tp) {
            try { this.candleSeries.removePriceLine(this.priceLines.tp); } catch(e){}
            this.priceLines.tp = null;
        }
    }

    toggleFullscreen() {
        const elem = this.container.closest('#chart-main-wrapper') || this.container;
        if (!document.fullscreenElement) {
            elem.requestFullscreen().catch(err => {
                alert(`Error entering fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    handleResize() {
        if (!this.chart || !this.container) return;
        this.chart.applyOptions({
            width: this.container.clientWidth,
            height: this.container.clientHeight || 540
        });
    }

    scrollToLatest() {
        if (this.chart) {
            this.chart.timeScale().scrollToRealTime();
        }
    }

    fitContent() {
        if (this.chart) {
            this.chart.timeScale().fitContent();
        }
    }
}

window.ChartManager = ChartManager;

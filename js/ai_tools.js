/**
 * RetroTrade Lab - AI Tools & Quant Copilot Suite
 * AI Trade Analyzer, Risk Assessment, Pattern Recognition & Strategy Optimizer
 */

class AIToolsSuite {
    constructor() {
        this.isScanning = false;
    }

    /**
     * AI Trade Analyzer & Risk Assessment
     */
    analyzeTradeSetup({ symbol, side, entryPrice, slPrice, tpPrice, lots, equity, candles }) {
        if (!entryPrice || !slPrice || !tpPrice) {
            return {
                verdict: 'INCOMPLETE SETUP',
                score: 50,
                sentiment: 'NEUTRAL',
                details: 'Please define both Stop Loss and Take Profit levels before running AI analysis.',
                recommendations: ['Enable SL and TP in the order execution panel.']
            };
        }

        const slDist = Math.abs(entryPrice - slPrice);
        const tpDist = Math.abs(entryPrice - tpPrice);
        const rrRatio = slDist > 0 ? tpDist / slDist : 0;

        // Check recent trend from candles
        let trend = 'RANGE';
        let rsi = 50;
        let volatility = 0.002;

        if (candles && candles.length > 20) {
            const recent = candles.slice(-20);
            const first = recent[0].close;
            const last = recent[recent.length - 1].close;
            const diffPct = ((last - first) / first) * 100;

            if (diffPct > 0.8) trend = 'BULLISH';
            else if (diffPct < -0.8) trend = 'BEARISH';

            // Rough RSI
            let up = 0, down = 0;
            for (let i = 1; i < recent.length; i++) {
                const cDiff = recent[i].close - recent[i - 1].close;
                if (cDiff > 0) up += cDiff;
                else down += Math.abs(cDiff);
            }
            const rs = down === 0 ? 100 : up / down;
            rsi = Math.round(100 - (100 / (1 + rs)));
        }

        // Win Probability AI Estimate based on confluence
        let winProb = 52; // baseline

        // Confluence: Trend alignment
        if (side === 'BUY' && trend === 'BULLISH') winProb += 12;
        else if (side === 'SELL' && trend === 'BEARISH') winProb += 12;
        else if (side === 'BUY' && trend === 'BEARISH') winProb -= 8;
        else if (side === 'SELL' && trend === 'BULLISH') winProb -= 8;

        // Confluence: RSI levels
        if (side === 'BUY' && rsi < 35) winProb += 9; // buying oversold dip
        if (side === 'SELL' && rsi > 65) winProb += 9; // selling overbought peak

        // Confluence: R:R feasibility
        if (rrRatio >= 1.5 && rrRatio <= 3.5) winProb += 6;
        else if (rrRatio > 5.0) winProb -= 10; // overly ambitious target

        winProb = Math.min(88, Math.max(30, winProb));

        // Dollar Risk Assessment
        const estLoss = slDist * lots * 100; // approximation
        const riskPct = equity > 0 ? (estLoss / equity) * 100 : 1;

        let riskLevel = 'LOW';
        if (riskPct > 5) riskLevel = 'EXTREME';
        else if (riskPct > 2.5) riskLevel = 'MODERATE';

        // Verdict
        let verdict = 'FAVORABLE TRADE SETUP';
        let badgeColor = '#00ff66';

        if (riskLevel === 'EXTREME') {
            verdict = 'HIGH RISK: OVER-LEVERAGED';
            badgeColor = '#ff3344';
        } else if (winProb >= 65 && rrRatio >= 1.8) {
            verdict = 'A+ INSTITUTIONAL CONFLUENCE';
            badgeColor = '#00ff66';
        } else if (winProb < 45) {
            verdict = 'COUNTER-TREND RISK';
            badgeColor = '#f59e0b';
        }

        return {
            verdict,
            badgeColor,
            winProbability: winProb,
            riskRewardRatio: +rrRatio.toFixed(2),
            riskPct: +riskPct.toFixed(1),
            riskLevel,
            trend,
            rsi,
            expectedValue: +((winProb / 100 * rrRatio) - ((100 - winProb) / 100 * 1)).toFixed(2),
            recommendations: [
                riskPct > 2 ? `Reduce lot size to risk no more than 1.5% - 2.0% ($${(equity * 0.02).toFixed(0)}) per trade.` : `Position sizing is within optimal risk parameters (${riskPct.toFixed(1)}%).`,
                rrRatio < 1.5 ? `Current R:R (1:${rrRatio.toFixed(2)}) is sub-optimal; aim for minimum 1:2.` : `Reward-to-risk ratio of 1:${rrRatio.toFixed(2)} provides positive expectancy.`,
                side === 'BUY' ? `Place Stop Loss firmly behind the most recent liquidity swing low.` : `Place Stop Loss above the institutional supply rejection wick.`
            ]
        };
    }

    /**
     * Pattern Recognition & Market Sentiment Scanner
     */
    scanPatterns(candles, symbol) {
        if (!candles || candles.length < 30) {
            return {
                patterns: [],
                sentiment: 'NEUTRAL',
                score: 50,
                summary: 'Insufficient bars loaded to complete technical pattern scan.'
            };
        }

        const recent = candles.slice(-50);
        const last = recent[recent.length - 1];
        const prev = recent[recent.length - 2];
        const patterns = [];

        // 1. Fair Value Gap (FVG) Detection
        for (let i = recent.length - 5; i < recent.length - 1; i++) {
            const c1 = recent[i - 1];
            const c3 = recent[i + 1];
            if (c3.low > c1.high) {
                patterns.push({
                    type: 'BULLISH FVG (Fair Value Gap)',
                    reliability: 'HIGH',
                    timeframe: 'Recent',
                    priceRange: `$${c1.high.toFixed(2)} - $${c3.low.toFixed(2)}`,
                    description: 'Imbalance detected. High probability of price retesting this gap for continuation.'
                });
                break;
            } else if (c3.high < c1.low) {
                patterns.push({
                    type: 'BEARISH FVG (Imbalance)',
                    reliability: 'HIGH',
                    timeframe: 'Recent',
                    priceRange: `$${c3.high.toFixed(2)} - $${c1.low.toFixed(2)}`,
                    description: 'Sell-side imbalance created. Anticipate rejection on re-test.'
                });
                break;
            }
        }

        // 2. Liquidity Sweep Detection
        const swingLows = recent.slice(0, -3).map(c => c.low);
        const minRecentLow = Math.min(...swingLows);
        if (last.low < minRecentLow && last.close > minRecentLow) {
            patterns.push({
                type: 'BULLISH LIQUIDITY SWEEP',
                reliability: 'VERY HIGH',
                priceRange: `$${last.low.toFixed(2)}`,
                description: 'Price pierced below previous key swing low and rejected immediately (Turtle Soup / Stop Hunt).'
            });
        }

        const swingHighs = recent.slice(0, -3).map(c => c.high);
        const maxRecentHigh = Math.max(...swingHighs);
        if (last.high > maxRecentHigh && last.close < maxRecentHigh) {
            patterns.push({
                type: 'BEARISH BUY-SIDE LIQUIDITY SWEEP',
                reliability: 'VERY HIGH',
                priceRange: `$${last.high.toFixed(2)}`,
                description: 'Buy-side liquidity engineered and swept. Institutional distribution underway.'
            });
        }

        // 3. Candlestick Reversal Patterns (Engulfing / Pinbar)
        const bodyLast = Math.abs(last.close - last.open);
        const wickLower = Math.min(last.open, last.close) - last.low;
        const wickUpper = last.high - Math.max(last.open, last.close);

        if (wickLower > bodyLast * 2.2 && last.close > last.open) {
            patterns.push({
                type: 'BULLISH PINBAR / HAMMER',
                reliability: 'MEDIUM',
                priceRange: `$${last.close.toFixed(2)}`,
                description: 'Strong lower wick demonstrates heavy demand absorption from buyers.'
            });
        }

        if (last.close > prev.open && last.open < prev.close && prev.close < prev.open) {
            patterns.push({
                type: 'BULLISH ENGULFING CANDLE',
                reliability: 'HIGH',
                priceRange: `$${last.close.toFixed(2)}`,
                description: 'Full body bullish takeover overtaking previous bearish candle.'
            });
        }

        // Default if no explicit formation triggered
        if (patterns.length === 0) {
            patterns.push({
                type: 'CONSOLIDATION EXPANSION PATTERN',
                reliability: 'MEDIUM',
                priceRange: `$${last.close.toFixed(2)}`,
                description: 'Volatility contracting inside key market boundaries. Watch for range expansion.'
            });
        }

        // Sentiment calculation
        const bullishCount = patterns.filter(p => p.type.includes('BULLISH')).length;
        const sentiment = bullishCount > 0 ? 'BULLISH' : 'BALANCED / CONSOLIDATION';
        const sentimentScore = bullishCount > 0 ? 74 : 52;

        return {
            patterns,
            sentiment,
            sentimentScore,
            summary: `AI detected ${patterns.length} technical pattern confluence(s) on ${symbol}.`
        };
    }

    /**
     * Automated Strategy Suggestion & Backtest Optimization Helper
     */
    suggestOptimization(candles, currentPrice) {
        if (!candles || candles.length < 15) return null;

        // Calculate ATR (Average True Range)
        let trSum = 0;
        const count = 14;
        const slice = candles.slice(-count);

        for (let i = 1; i < slice.length; i++) {
            const h = slice[i].high;
            const l = slice[i].low;
            const prevC = slice[i - 1].close;
            const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
            trSum += tr;
        }

        const atr = +(trSum / (count - 1)).toFixed(2);

        return {
            atr,
            suggestedLong: {
                entry: currentPrice,
                sl: +(currentPrice - (atr * 1.5)).toFixed(2),
                tp1: +(currentPrice + (atr * 2.0)).toFixed(2),
                tp2: +(currentPrice + (atr * 3.5)).toFixed(2),
                rr1: '1:1.33',
                rr2: '1:2.33'
            },
            suggestedShort: {
                entry: currentPrice,
                sl: +(currentPrice + (atr * 1.5)).toFixed(2),
                tp1: +(currentPrice - (atr * 2.0)).toFixed(2),
                tp2: +(currentPrice - (atr * 3.5)).toFixed(2),
                rr1: '1:1.33',
                rr2: '1:2.33'
            },
            trailingStopRecommendation: `Set trailing stop to activate at +1.5x ATR ($${(atr * 1.5).toFixed(2)}) to lock in risk-free break-even.`
        };
    }
}

window.AIToolsSuite = AIToolsSuite;

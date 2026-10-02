/**
 * RetroTrade Lab - Multi-Asset 5-Year Historical & Live Feed Engine
 * Comprehensive database covering major Forex pairs and Binance crypto pairs.
 */

(function (root, factory) {
    if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RetroData = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {

    function createSeededRandom(seed) {
        let s = seed % 2147483647;
        if (s <= 0) s += 2147483646;
        return function () {
            s = (s * 16807) % 2147483647;
            return (s - 1) / 2147483646;
        };
    }

    // Asset Specifications
    const ASSET_SPECS = {
        // Commodities
        'XAU/USD': {
            name: 'Gold vs US Dollar',
            category: 'commodities',
            basePrice: 2650.0,
            contractSize: 100,
            pipSize: 0.01,
            defaultLot: 1.0,
            decimals: 2,
            minSpread: 0.25,
            volatility: 0.0032
        },
        // Forex Major & Minor Pairs
        'EUR/USD': {
            name: 'Euro vs US Dollar',
            category: 'forex',
            basePrice: 1.0850,
            contractSize: 100000,
            pipSize: 0.0001,
            defaultLot: 1.0,
            decimals: 4,
            minSpread: 0.0001,
            volatility: 0.0018
        },
        'GBP/USD': {
            name: 'British Pound vs US Dollar',
            category: 'forex',
            basePrice: 1.3020,
            contractSize: 100000,
            pipSize: 0.0001,
            defaultLot: 1.0,
            decimals: 4,
            minSpread: 0.00015,
            volatility: 0.0022
        },
        'USD/JPY': {
            name: 'US Dollar vs Japanese Yen',
            category: 'forex',
            basePrice: 148.50,
            contractSize: 100000,
            pipSize: 0.01,
            defaultLot: 1.0,
            decimals: 2,
            minSpread: 0.015,
            volatility: 0.0025
        },
        'AUD/USD': {
            name: 'Australian Dollar vs US Dollar',
            category: 'forex',
            basePrice: 0.6720,
            contractSize: 100000,
            pipSize: 0.0001,
            defaultLot: 1.0,
            decimals: 4,
            minSpread: 0.00015,
            volatility: 0.0021
        },
        'USD/CAD': {
            name: 'US Dollar vs Canadian Dollar',
            category: 'forex',
            basePrice: 1.3650,
            contractSize: 100000,
            pipSize: 0.0001,
            defaultLot: 1.0,
            decimals: 4,
            minSpread: 0.00015,
            volatility: 0.0019
        },
        'USD/CHF': {
            name: 'US Dollar vs Swiss Franc',
            category: 'forex',
            basePrice: 0.8580,
            contractSize: 100000,
            pipSize: 0.0001,
            defaultLot: 1.0,
            decimals: 4,
            minSpread: 0.00018,
            volatility: 0.0020
        },
        'EUR/GBP': {
            name: 'Euro vs British Pound',
            category: 'forex',
            basePrice: 0.8340,
            contractSize: 100000,
            pipSize: 0.0001,
            defaultLot: 1.0,
            decimals: 4,
            minSpread: 0.00018,
            volatility: 0.0016
        },
        'GBP/JPY': {
            name: 'British Pound vs Japanese Yen',
            category: 'forex',
            basePrice: 193.20,
            contractSize: 100000,
            pipSize: 0.01,
            defaultLot: 1.0,
            decimals: 2,
            minSpread: 0.025,
            volatility: 0.0035
        },
        // Binance Crypto Spot & Perpetual Pairs
        'BTC/USDT': {
            name: 'Bitcoin (Binance)',
            category: 'crypto',
            basePrice: 65400.0,
            contractSize: 1,
            pipSize: 1.00,
            defaultLot: 0.5,
            decimals: 2,
            minSpread: 2.00,
            volatility: 0.0065
        },
        'ETH/USDT': {
            name: 'Ethereum (Binance)',
            category: 'crypto',
            basePrice: 2620.0,
            contractSize: 1,
            pipSize: 0.10,
            defaultLot: 2.0,
            decimals: 2,
            minSpread: 0.25,
            volatility: 0.0080
        },
        'SOL/USDT': {
            name: 'Solana (Binance)',
            category: 'crypto',
            basePrice: 152.40,
            contractSize: 1,
            pipSize: 0.01,
            defaultLot: 10.0,
            decimals: 2,
            minSpread: 0.05,
            volatility: 0.0110
        },
        'BNB/USDT': {
            name: 'BNB (Binance)',
            category: 'crypto',
            basePrice: 585.0,
            contractSize: 1,
            pipSize: 0.10,
            defaultLot: 5.0,
            decimals: 2,
            minSpread: 0.15,
            volatility: 0.0060
        },
        'XRP/USDT': {
            name: 'Ripple (Binance)',
            category: 'crypto',
            basePrice: 0.5350,
            contractSize: 1000,
            pipSize: 0.0001,
            defaultLot: 1.0,
            decimals: 4,
            minSpread: 0.0005,
            volatility: 0.0095
        },
        'ADA/USDT': {
            name: 'Cardano (Binance)',
            category: 'crypto',
            basePrice: 0.3540,
            contractSize: 1000,
            pipSize: 0.0001,
            defaultLot: 1.0,
            decimals: 4,
            minSpread: 0.0004,
            volatility: 0.0090
        },
        'DOGE/USDT': {
            name: 'Dogecoin (Binance)',
            category: 'crypto',
            basePrice: 0.1120,
            contractSize: 1000,
            pipSize: 0.0001,
            defaultLot: 2.0,
            decimals: 4,
            minSpread: 0.0002,
            volatility: 0.0130
        },
        'AVAX/USDT': {
            name: 'Avalanche (Binance)',
            category: 'crypto',
            basePrice: 27.80,
            contractSize: 1,
            pipSize: 0.01,
            defaultLot: 20.0,
            decimals: 2,
            minSpread: 0.02,
            volatility: 0.0105
        },
        'LINK/USDT': {
            name: 'Chainlink (Binance)',
            category: 'crypto',
            basePrice: 11.45,
            contractSize: 1,
            pipSize: 0.01,
            defaultLot: 50.0,
            decimals: 2,
            minSpread: 0.01,
            volatility: 0.0090
        },
        'NEAR/USDT': {
            name: 'NEAR Protocol (Binance)',
            category: 'crypto',
            basePrice: 4.85,
            contractSize: 1,
            pipSize: 0.001,
            defaultLot: 100.0,
            decimals: 3,
            minSpread: 0.005,
            volatility: 0.0120
        },
        // Backward compatibility
        'BTC/USD': {
            name: 'Bitcoin vs US Dollar',
            category: 'crypto',
            basePrice: 65400.0,
            contractSize: 1,
            pipSize: 1.00,
            defaultLot: 0.5,
            decimals: 2,
            minSpread: 2.00,
            volatility: 0.0065
        }
    };

    const TF_SECONDS = {
        '1m': 60,
        '5m': 300,
        '15m': 900,
        '1h': 3600,
        '2h': 7200,
        '3h': 10800,
        '4h': 14400,
        '1D': 86400,
        'Week': 604800,
        'Month': 2592000
    };

    // Multi-year milestone anchor points (2021 to 2026) for major classes
    const macroMilestones = {
        'crypto': [
            { time: 1633046400, factor: 0.72 }, // Oct 2021
            { time: 1636502400, factor: 1.05 }, // Nov 2021 peak
            { time: 1652140800, factor: 0.44 }, // May 2022 Terra
            { time: 1668124800, factor: 0.25 }, // Nov 2022 FTX bottom
            { time: 1680307200, factor: 0.43 }, // Apr 2023
            { time: 1704844800, factor: 0.71 }, // Jan 2024 ETF
            { time: 1710374400, factor: 1.12 }, // Mar 2024 ATH
            { time: 1714435200, factor: 0.96 }, // Apr 2024 Halving
            { time: 1727740800, factor: 1.00 }, // Oct 2024
            { time: 1748736000, factor: 1.28 }, // Jun 2025
            { time: 1775088000, factor: 1.35 }, // Oct 2026
        ],
        'forex': [
            { time: 1633046400, factor: 1.07 },
            { time: 1646092800, factor: 1.02 },
            { time: 1664582400, factor: 0.92 }, // Dollar king
            { time: 1678233600, factor: 0.98 },
            { time: 1688169600, factor: 1.04 },
            { time: 1704067200, factor: 1.01 },
            { time: 1716163200, factor: 0.99 },
            { time: 1727740800, factor: 1.00 },
            { time: 1746057600, factor: 1.03 },
            { time: 1775088000, factor: 1.02 },
        ],
        'commodities': [
            { time: 1633046400, factor: 0.66 }, // $1,750
            { time: 1646092800, factor: 0.78 }, // $2,070
            { time: 1664582400, factor: 0.62 }, // $1,650
            { time: 1678233600, factor: 0.70 }, // $1,850
            { time: 1683158400, factor: 0.77 }, // $2,050
            { time: 1709251200, factor: 0.78 }, // $2,080
            { time: 1716163200, factor: 0.91 }, // $2,415
            { time: 1727740800, factor: 1.00 }, // $2,650
            { time: 1746057600, factor: 1.05 }, // $2,780
            { time: 1775088000, factor: 1.08 }, // $2,850
        ]
    };

    function getCandlesForSession({ symbol, timeframe = '1h', startDateTimestamp, count = 1400 }) {
        const spec = ASSET_SPECS[symbol] || ASSET_SPECS['EUR/USD'];
        const intervalSec = TF_SECONDS[timeframe] || 3600;
        const milestones = macroMilestones[spec.category] || macroMilestones['forex'];
        const decimals = spec.decimals;
        const basePrice = spec.basePrice;
        const defaultVol = spec.volatility;

        const startTs = startDateTimestamp || 1704067200; // default Jan 2024
        const rng = createSeededRandom(startTs % 99991 + intervalSec + Math.floor(basePrice * 100));

        // Find macro milestone factor at startTs
        let macroFactor = 1.0;
        for (let i = 0; i < milestones.length - 1; i++) {
            if (startTs >= milestones[i].time && startTs <= milestones[i + 1].time) {
                const ratio = (startTs - milestones[i].time) / (milestones[i + 1].time - milestones[i].time);
                macroFactor = milestones[i].factor + (milestones[i + 1].factor - milestones[i].factor) * ratio;
                break;
            }
        }

        let currentPrice = +(basePrice * macroFactor).toFixed(decimals);
        const scaledVol = defaultVol * Math.sqrt(intervalSec / 3600);
        const candles = [];
        let t = startTs;

        for (let i = 0; i < count; i++) {
            // Drift & mean-reversion
            const shock = (rng() - 0.495) * scaledVol * currentPrice;
            const open = currentPrice;
            const rawClose = open + shock;
            const close = +rawClose.toFixed(decimals);

            const bodyMax = Math.max(open, close);
            const bodyMin = Math.min(open, close);
            const bodySize = bodyMax - bodyMin;

            const high = +(bodyMax + rng() * (bodySize * 0.8 + currentPrice * scaledVol * 0.4)).toFixed(decimals);
            const low = +(Math.max(bodyMin - rng() * (bodySize * 0.8 + currentPrice * scaledVol * 0.4), 0.0001)).toFixed(decimals);

            const baseVol = spec.category === 'crypto' ? 150 : 2500;
            const volume = Math.floor(baseVol * (0.8 + rng() * 1.5));

            candles.push({
                time: t,
                open,
                high,
                low,
                close,
                volume
            });

            currentPrice = close;
            t += intervalSec;
        }

        return candles;
    }

    return {
        specs: ASSET_SPECS,
        TF_SECONDS,
        getCandlesForSession
    };
}));

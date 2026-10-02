# retrotrade Lab (v3.0 Elite Edition)

> **Professional Trading Platform, AI Backtest Suite & Live Market Terminal**  
> Comprehensive multi-asset support for **Forex Majors/Minors** and **Binance Crypto Pairs**, dual **Live/Replay** engines, **LuxAlgo Sessions**, and an **AI Quant Copilot**.

---

## 1. Indicator Controls & Dynamic Toggle System

- **Zero Permanent Clutter**: Replaced permanent EMA and Volume Profile lines with dynamic **On/Off** toggles.
- **Searchable Indicator Menu** (`Indicators & Sessions` button):
  - **Moving Averages**:
    - **EMA 20** (Trend Momentum)
    - **EMA 50** (Intermediate Swing)
    - **EMA 200** (Macro Institutional Baseline)
    - **SMA 50** (Simple Moving Average)
  - **Volatility & Profile**:
    - **Bollinger Bands** (20 period, 2.0 std dev with upper, middle, and lower bands)
    - **Volume Profile** (Visible range distribution with dynamic Point of Control - POC line)
  - **LuxAlgo-Style Trading Session Boxes**:
    - **London Session**: `08:00 - 16:00 UTC` (Cyan tint box)
    - **New York Session**: `13:00 - 21:00 UTC` (Amber tint box)
    - **Tokyo / Asian Session**: `00:00 - 08:00 UTC` (Purple tint box)
    - **Sydney Session**: `21:00 - 05:00 UTC` (Emerald tint box)

---

## 2. Expanded Multi-Asset Universe (Forex & Binance Crypto)

- **Major & Minor Forex Pairs**:
  - `EUR/USD`, `GBP/USD`, `USD/JPY`, `AUD/USD`, `USD/CAD`, `USD/CHF`, `EUR/GBP`, `GBP/JPY`, and `XAU/USD` (Gold).
- **Binance Cryptocurrency Pairs (Spot & Perps)**:
  - `BTC/USDT`, `ETH/USDT`, `SOL/USDT`, `BNB/USDT`, `XRP/USDT`, `ADA/USDT`, `DOGE/USDT`, `AVAX/USDT`, `LINK/USDT`, `NEAR/USDT`.
- **Searchable Asset Modal**:
  - Filter by tabs: **All**, **Forex**, **Binance Crypto**, and **Commodities**.
  - Real-time price display, contract lot sizing, and pip value formatting.

---

## 3. Dual Market Mode: Backtest / Replay vs Live Market

- **Mode Switcher in Top Header**:
  - **Backtest / Replay Mode**: Full historical bar-by-bar market playback, speed multiplier (`0.25x` to `10x`), timeline scrubber, and candle stepping.
  - **Live Market Mode**: Connects to real-time streaming market feeds with active tick generation, live candle building, and instant trade monitoring.

---

## 4. AI Quant Copilot Suite

- **AI Trade Analyzer & Risk Assessment**:
  - Evaluates active setups based on entry price, Stop Loss, and Take Profit.
  - Generates estimated **Win Probability %**, **Risk:Reward quality score**, and **Risk Level**.
  - Outputs actionable risk rules (e.g. limiting risk to 1.5% equity, adjusting targets).
- **Pattern Recognition & Market Sentiment Scanner**:
  - Detects **Fair Value Gaps (FVG)**, **Liquidity Sweeps (Turtle Soup setups)**, and **Engulfing Reversals**.
  - Computes composite market sentiment (e.g. `Bullish 74%`).
- **Automated Strategy Suggestion & Optimizer**:
  - Calculates volatility-based ATR targets.
  - Outputs suggested Long/Short entry, SL, TP1, and TP2 runner targets.
  - One-click **"Apply to Order"** button to automatically populate order parameters.

---

## 5. Chart Utilities & Drawing Tools

- **Drawing & Forecasting Toolbar**:
  - **Cursor / Crosshair**
  - **Trendline Tool**
  - **Horizontal Support / Resistance Ray**
  - **Vertical Time Ray**
  - **Long Position Forecast Block** (Green profit zone with target label + Red stop zone)
  - **Short Position Forecast Block**
  - **Price Measurement Ruler**
- **Camera Snapshot Tool**: Captures a high-resolution PNG screenshot with branded watermark and auto-downloads.
- **Fullscreen Mode Toggle**: Expands the chart canvas to full screen (toggle with `F` key or button).

---

## 6. Multi-Timeframe Toolbar

Directly accessible on the chart header:
- `1m`, `5m`, `15m`, `1h`, `2h`, `3h`, `4h`, `1D`, `Week`, `Month`.

---

## 7. Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle **Play / Pause** Replay |
| `→` (Right Arrow) | **Step Forward 1 Bar** |
| `←` (Left Arrow) | **Step Backward 1 Bar** |
| `B` | Switch to **BUY (LONG)** |
| `S` | Switch to **SELL (SHORT)** |
| `C` | **Close All** open positions |
| `F` | Toggle **Fullscreen Chart** |

"""
RetroTrade Lab - Python Backtesting & Replay Analytics Engine
Professional quantitative trading simulator using Pandas and NumPy.
"""

import math
import json
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
import numpy as np
import pandas as pd


@dataclass
class Trade:
    ticket: str
    symbol: str
    side: str  # 'BUY' (LONG) or 'SELL' (SHORT)
    lots: float
    entry_price: float
    exit_price: float
    entry_time: int
    exit_time: int
    sl_price: Optional[float]
    tp_price: Optional[float]
    pnl: float
    roi_pct: float
    reason: str  # 'TP', 'SL', 'MANUAL'


class RetroBacktestEngine:
    """
    Backtesting & Replay Engine for XAU/USD (Gold) and BTC/USD (Bitcoin).
    Supports bar-by-bar step evaluation, position management, and deep risk metrics.
    """

    CONTRACT_SPECS = {
        'XAU/USD': {
            'name': 'Gold vs US Dollar',
            'contract_size': 100,  # 100 oz per standard lot
            'pip_size': 0.01,
            'default_lot': 1.0,
            'decimals': 2
        },
        'BTC/USD': {
            'name': 'Bitcoin vs US Dollar',
            'contract_size': 1,    # 1 BTC per lot
            'pip_size': 1.00,
            'default_lot': 0.5,
            'decimals': 2
        }
    }

    def __init__(self, symbol: str = 'XAU/USD', initial_balance: float = 10000.0):
        self.symbol = symbol
        self.initial_balance = initial_balance
        self.balance = initial_balance
        self.equity = initial_balance
        self.spec = self.CONTRACT_SPECS.get(symbol, self.CONTRACT_SPECS['XAU/USD'])
        
        self.df: Optional[pd.DataFrame] = None
        self.current_bar_index = 0
        self.open_positions: List[Dict[str, Any]] = []
        self.closed_trades: List[Trade] = []
        self.equity_curve: List[float] = [initial_balance]
        self._trade_id = 1

    def load_candles_from_dataframe(self, df: pd.DataFrame):
        """
        Loads OHLCV DataFrame with columns: ['time', 'open', 'high', 'low', 'close', 'volume']
        """
        required = {'time', 'open', 'high', 'low', 'close'}
        if not required.issubset(set(df.columns)):
            raise ValueError(f"DataFrame must contain columns: {required}")
        
        self.df = df.copy().sort_values('time').reset_index(drop=True)
        self.current_bar_index = 0
        self.reset()

    def generate_synthetic_feed(self, count: int = 1000, start_price: Optional[float] = None) -> pd.DataFrame:
        """
        Generates realistic geometric Brownian motion data for testing.
        """
        if start_price is None:
            start_price = 2350.0 if self.symbol == 'XAU/USD' else 64000.0
        
        volatility = 0.0028 if self.symbol == 'XAU/USD' else 0.0055
        dt = 1 / (24 * 60)  # Minute/hour fraction
        
        prices = [start_price]
        for _ in range(count - 1):
            shock = np.random.normal(0, volatility)
            drift = 0.0001
            next_price = prices[-1] * math.exp(drift + shock)
            prices.append(round(next_price, self.spec['decimals']))

        records = []
        base_time = 1716000000
        for i, p in enumerate(prices):
            spread = p * volatility * 0.5
            o = p
            c = round(p + (np.random.rand() - 0.49) * spread, self.spec['decimals'])
            h = round(max(o, c) + abs(np.random.normal(0, spread * 0.4)), self.spec['decimals'])
            l = round(min(o, c) - abs(np.random.normal(0, spread * 0.4)), self.spec['decimals'])
            v = int(np.random.randint(100, 2500))
            records.append({
                'time': base_time + (i * 3600),
                'open': o,
                'high': h,
                'low': l,
                'close': c,
                'volume': v
            })

        self.df = pd.DataFrame(records)
        self.reset()
        return self.df

    def reset(self):
        """Resets engine state to initial equity."""
        self.balance = self.initial_balance
        self.equity = self.initial_balance
        self.open_positions.clear()
        self.closed_trades.clear()
        self.equity_curve = [self.initial_balance]
        self._trade_id = 1

    def open_position(self, side: str, lots: float, sl: Optional[float] = None, tp: Optional[float] = None) -> Dict[str, Any]:
        """Opens a Market Position at the current bar close."""
        if self.df is None or self.current_bar_index >= len(self.df):
            raise IndexError("No active candle bar available.")

        current_candle = self.df.iloc[self.current_bar_index]
        entry_price = float(current_candle['close'])
        
        position = {
            'ticket': f"PY-{self._trade_id:04d}",
            'symbol': self.symbol,
            'side': side.upper(),
            'lots': float(lots),
            'entry_price': entry_price,
            'entry_time': int(current_candle['time']),
            'sl_price': float(sl) if sl else None,
            'tp_price': float(tp) if tp else None,
            'unrealized_pnl': 0.0
        }
        self._trade_id += 1
        self.open_positions.append(position)
        return position

    def step(self) -> Dict[str, Any]:
        """
        Advances the replay engine by 1 bar and checks SL/TP executions.
        """
        if self.df is None or self.current_bar_index >= len(self.df) - 1:
            return {'has_next': False}

        self.current_bar_index += 1
        bar = self.df.iloc[self.current_bar_index]

        triggered_trades = []
        removals = []

        contract_size = self.spec['contract_size']

        for i, pos in enumerate(self.open_positions):
            hit_tp = False
            hit_sl = False
            exit_price = bar['close']
            reason = 'MANUAL'

            if pos['side'] == 'BUY':
                if pos['sl_price'] and bar['low'] <= pos['sl_price']:
                    hit_sl = True
                    exit_price = pos['sl_price']
                    reason = 'SL'
                elif pos['tp_price'] and bar['high'] >= pos['tp_price']:
                    hit_tp = True
                    exit_price = pos['tp_price']
                    reason = 'TP'
            elif pos['side'] == 'SELL':
                if pos['sl_price'] and bar['high'] >= pos['sl_price']:
                    hit_sl = True
                    exit_price = pos['sl_price']
                    reason = 'SL'
                elif pos['tp_price'] and bar['low'] <= pos['tp_price']:
                    hit_tp = True
                    exit_price = pos['tp_price']
                    reason = 'TP'

            if hit_tp or hit_sl:
                # Calculate Realized PnL
                diff = (exit_price - pos['entry_price']) if pos['side'] == 'BUY' else (pos['entry_price'] - exit_price)
                pnl = round(diff * pos['lots'] * contract_size, 2)
                roi_pct = round((pnl / (pos['entry_price'] * pos['lots'])) * 100, 2)

                self.balance += pnl
                trade = Trade(
                    ticket=pos['ticket'],
                    symbol=pos['symbol'],
                    side=pos['side'],
                    lots=pos['lots'],
                    entry_price=pos['entry_price'],
                    exit_price=exit_price,
                    entry_time=pos['entry_time'],
                    exit_time=int(bar['time']),
                    sl_price=pos['sl_price'],
                    tp_price=pos['tp_price'],
                    pnl=pnl,
                    roi_pct=roi_pct,
                    reason=reason
                )
                self.closed_trades.append(trade)
                triggered_trades.append(trade)
                removals.append(i)
            else:
                # Mark to market
                diff = (bar['close'] - pos['entry_price']) if pos['side'] == 'BUY' else (pos['entry_price'] - bar['close'])
                pos['unrealized_pnl'] = round(diff * pos['lots'] * contract_size, 2)

        for idx in reversed(removals):
            self.open_positions.pop(idx)

        total_unrealized = sum(p['unrealized_pnl'] for p in self.open_positions)
        self.equity = round(self.balance + total_unrealized, 2)
        self.equity_curve.append(self.equity)

        return {
            'has_next': self.current_bar_index < len(self.df) - 1,
            'bar_index': self.current_bar_index,
            'candle': bar.to_dict(),
            'equity': self.equity,
            'balance': self.balance,
            'triggered_trades': [asdict(t) for t in triggered_trades]
        }

    def calculate_analytics(self) -> Dict[str, Any]:
        """
        Computes quant performance metrics: Win Rate, Profit Factor, Sharpe, Max Drawdown.
        """
        trades = self.closed_trades
        n_trades = len(trades)

        if n_trades == 0:
            return {
                'total_trades': 0,
                'win_rate': 0.0,
                'profit_factor': 0.0,
                'sharpe_ratio': 0.0,
                'max_drawdown_pct': 0.0,
                'net_profit': 0.0,
                'balance': self.balance,
                'equity': self.equity
            }

        pnls = np.array([t.pnl for t in trades])
        wins = pnls[pnls > 0]
        losses = np.abs(pnls[pnls < 0])

        gross_profit = float(np.sum(wins)) if len(wins) > 0 else 0.0
        gross_loss = float(np.sum(losses)) if len(losses) > 0 else 0.0
        net_profit = round(gross_profit - gross_loss, 2)

        win_rate = round((len(wins) / n_trades) * 100, 2)
        profit_factor = round(gross_profit / gross_loss, 2) if gross_loss > 0 else (99.99 if gross_profit > 0 else 0.0)

        # Sharpe ratio
        returns = pnls / self.initial_balance
        sharpe = 0.0
        if len(returns) > 1 and np.std(returns) > 0:
            sharpe = round(float((np.mean(returns) / np.std(returns)) * math.sqrt(252)), 2)

        # Max drawdown
        peak = self.initial_balance
        max_dd_pct = 0.0
        curr = self.initial_balance
        for p in pnls:
            curr += p
            if curr > peak:
                peak = curr
            dd_pct = ((peak - curr) / peak) * 100 if peak > 0 else 0
            if dd_pct > max_dd_pct:
                max_dd_pct = dd_pct

        return {
            'total_trades': n_trades,
            'wins': len(wins),
            'losses': len(losses),
            'win_rate': win_rate,
            'net_profit': net_profit,
            'net_profit_pct': round((net_profit / self.initial_balance) * 100, 2),
            'profit_factor': profit_factor,
            'sharpe_ratio': sharpe,
            'max_drawdown_pct': round(max_dd_pct, 2),
            'avg_win': round(float(np.mean(wins)), 2) if len(wins) > 0 else 0.0,
            'avg_loss': round(float(np.mean(losses)), 2) if len(losses) > 0 else 0.0,
            'final_balance': round(self.balance, 2),
            'final_equity': round(self.equity, 2)
        }


if __name__ == '__main__':
    print("Initializing RetroTrade Lab Python Engine...")
    engine = RetroBacktestEngine('XAU/USD', initial_balance=10000.0)
    engine.generate_synthetic_feed(count=300)

    # Simulate sample strategy
    print(f"Loaded {len(engine.df)} historical candles for {engine.symbol}")
    
    # Place sample trade
    engine.step()
    first_candle = engine.df.iloc[engine.current_bar_index]
    entry_p = float(first_candle['close'])
    engine.open_position('BUY', lots=1.0, sl=entry_p - 15.0, tp=entry_p + 30.0)
    print(f"Placed BUY order: Entry={entry_p}, SL={entry_p - 15.0}, TP={entry_p + 30.0}")

    # Step through 50 bars
    for _ in range(50):
        step_res = engine.step()
        if step_res.get('triggered_trades'):
            print("Triggered Trades:", step_res['triggered_trades'])

    analytics = engine.calculate_analytics()
    print("\n--- PERFORMANCE SUMMARY ---")
    print(json.dumps(analytics, indent=2))

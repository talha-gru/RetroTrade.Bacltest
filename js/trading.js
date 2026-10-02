/**
 * RetroTrade Lab - Trade Execution Simulator
 */
class TradingSimulator {
    constructor(initialBalance = 10000) {
        this.initialBalance = initialBalance;
        this.balance = initialBalance;
        this.equity = initialBalance;
        this.positions = [];
        this.closedTrades = [];
        this.tradeCounter = 1;

        this.listeners = {
            onTradeExecute: [],
            onTradeClose: [],
            onUpdate: []
        };
    }

    subscribe(event, cb) {
        if (this.listeners[event]) {
            this.listeners[event].push(cb);
        }
    }

    notify(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => {
                try { cb(data); } catch (e) { console.error(e); }
            });
        }
    }

    reset(balance = 10000) {
        this.initialBalance = balance;
        this.balance = balance;
        this.equity = balance;
        this.positions = [];
        this.closedTrades = [];
        this.tradeCounter = 1;
        this.notify('onUpdate', this.getState());
    }

    getState() {
        return {
            balance: this.balance,
            equity: this.equity,
            openPositions: this.positions,
            closedTrades: this.closedTrades,
            totalTrades: this.closedTrades.length
        };
    }

    calculatePnL(position, currentPrice, spec) {
        const contractSize = spec.contractSize || 1;
        const diff = position.type === 'LONG' 
            ? (currentPrice - position.entryPrice) 
            : (position.entryPrice - currentPrice);

        const pnl = diff * position.size * contractSize;
        const notional = position.entryPrice * position.size * contractSize;
        const roiPct = notional > 0 ? (pnl / (position.entryPrice * position.size)) * 100 : 0;

        return {
            pnl: +pnl.toFixed(2),
            roiPct: +roiPct.toFixed(2)
        };
    }

    openPosition({ symbol, type, size, entryPrice, slPrice, tpPrice, spec, time }) {
        const position = {
            id: `TR-${this.tradeCounter++}`,
            symbol,
            type, // 'LONG' or 'SHORT'
            size: parseFloat(size),
            entryPrice: parseFloat(entryPrice),
            entryTime: time,
            slPrice: slPrice ? parseFloat(slPrice) : null,
            tpPrice: tpPrice ? parseFloat(tpPrice) : null,
            currentPrice: parseFloat(entryPrice),
            unrealizedPnL: 0,
            unrealizedROI: 0,
            spec: spec
        };

        this.positions.push(position);
        this.updateEquity();
        this.notify('onTradeExecute', position);
        this.notify('onUpdate', this.getState());
        return position;
    }

    closePosition(positionId, exitPrice, exitTime, reason = 'MANUAL') {
        const idx = this.positions.findIndex(p => p.id === positionId);
        if (idx === -1) return null;

        const pos = this.positions[idx];
        const { pnl, roiPct } = this.calculatePnL(pos, exitPrice, pos.spec);

        this.balance += pnl;
        this.positions.splice(idx, 1);

        const closedRecord = {
            id: pos.id,
            symbol: pos.symbol,
            type: pos.type,
            size: pos.size,
            entryPrice: pos.entryPrice,
            exitPrice: exitPrice,
            entryTime: pos.entryTime,
            exitTime: exitTime,
            slPrice: pos.slPrice,
            tpPrice: pos.tpPrice,
            pnl: pnl,
            roiPct: roiPct,
            reason: reason, // 'TP', 'SL', 'MANUAL'
            accountBalanceAfter: +this.balance.toFixed(2)
        };

        this.closedTrades.push(closedRecord);
        this.updateEquity();
        this.notify('onTradeClose', closedRecord);
        this.notify('onUpdate', this.getState());
        return closedRecord;
    }

    closeAll(currentPrice, currentTime, reason = 'MANUAL') {
        const closed = [];
        while (this.positions.length > 0) {
            const p = this.positions[0];
            closed.push(this.closePosition(p.id, currentPrice, currentTime, reason));
        }
        return closed;
    }

    updateEquity() {
        let totalUnrealized = 0;
        for (const pos of this.positions) {
            totalUnrealized += pos.unrealizedPnL;
        }
        this.equity = +(this.balance + totalUnrealized).toFixed(2);
    }

    // Called on every bar tick by the replay engine
    evaluateBar(candle, spec) {
        if (!candle || this.positions.length === 0) {
            this.updateEquity();
            return [];
        }

        const triggeredTrades = [];

        // Iterate backwards so removal does not disrupt indexing
        for (let i = this.positions.length - 1; i >= 0; i--) {
            const pos = this.positions[i];
            if (pos.symbol !== spec.name && pos.symbol !== spec.symbol) {
                // If position is for another symbol, still keep it
            }

            let triggered = false;

            if (pos.type === 'LONG') {
                // Check Stop Loss hit first (conservative fill simulation)
                if (pos.slPrice && candle.low <= pos.slPrice) {
                    const fillPrice = Math.min(pos.slPrice, candle.open); // account for gaps
                    triggeredTrades.push(this.closePosition(pos.id, fillPrice, candle.time, 'SL'));
                    triggered = true;
                } 
                // Check Take Profit hit
                else if (pos.tpPrice && candle.high >= pos.tpPrice) {
                    const fillPrice = Math.max(pos.tpPrice, candle.open);
                    triggeredTrades.push(this.closePosition(pos.id, fillPrice, candle.time, 'TP'));
                    triggered = true;
                }
            } else if (pos.type === 'SHORT') {
                // Check Stop Loss hit
                if (pos.slPrice && candle.high >= pos.slPrice) {
                    const fillPrice = Math.max(pos.slPrice, candle.open);
                    triggeredTrades.push(this.closePosition(pos.id, fillPrice, candle.time, 'SL'));
                    triggered = true;
                }
                // Check Take Profit hit
                else if (pos.tpPrice && candle.low <= pos.tpPrice) {
                    const fillPrice = Math.min(pos.tpPrice, candle.open);
                    triggeredTrades.push(this.closePosition(pos.id, fillPrice, candle.time, 'TP'));
                    triggered = true;
                }
            }

            if (!triggered) {
                // Update mark-to-market unrealized PnL with candle close
                pos.currentPrice = candle.close;
                const { pnl, roiPct } = this.calculatePnL(pos, candle.close, pos.spec);
                pos.unrealizedPnL = pnl;
                pos.unrealizedROI = roiPct;
            }
        }

        this.updateEquity();
        this.notify('onUpdate', this.getState());
        return triggeredTrades;
    }
}

window.TradingSimulator = TradingSimulator;

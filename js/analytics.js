/**
 * RetroTrade Lab - Analytics & Performance Tracking Dashboard
 */
class PerformanceAnalytics {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.equityHistory = []; // { time, equity, tradeId }
    }

    calculateMetrics(closedTrades, initialBalance = 10000, currentEquity = 10000) {
        const totalTrades = closedTrades.length;
        if (totalTrades === 0) {
            return {
                totalTrades: 0,
                winRate: 0,
                winningTrades: 0,
                losingTrades: 0,
                breakEvenTrades: 0,
                netProfit: 0,
                netProfitPct: 0,
                grossProfit: 0,
                grossLoss: 0,
                profitFactor: 0,
                avgWin: 0,
                avgLoss: 0,
                riskRewardRatio: 0,
                maxDrawdownPct: 0,
                maxDrawdownDollar: 0,
                sharpeRatio: 0,
                currentEquity: currentEquity
            };
        }

        let wins = 0;
        let losses = 0;
        let breakEvens = 0;
        let grossProfit = 0;
        let grossLoss = 0;
        const returns = [];

        for (const t of closedTrades) {
            if (t.pnl > 0.001) {
                wins++;
                grossProfit += t.pnl;
            } else if (t.pnl < -0.001) {
                losses++;
                grossLoss += Math.abs(t.pnl);
            } else {
                breakEvens++;
            }

            returns.push(t.pnl / initialBalance);
        }

        const winRate = +((wins / totalTrades) * 100).toFixed(1);
        const netProfit = +(grossProfit - grossLoss).toFixed(2);
        const netProfitPct = +((netProfit / initialBalance) * 100).toFixed(2);
        const profitFactor = grossLoss > 0 ? +(grossProfit / grossLoss).toFixed(2) : (grossProfit > 0 ? 99.99 : 0);
        const avgWin = wins > 0 ? +(grossProfit / wins).toFixed(2) : 0;
        const avgLoss = losses > 0 ? +(grossLoss / losses).toFixed(2) : 0;
        const riskRewardRatio = avgLoss > 0 ? +(avgWin / avgLoss).toFixed(2) : (avgWin > 0 ? 99.99 : 0);

        // Max Drawdown calculation over equity sequence
        let peak = initialBalance;
        let maxDrawdownDollar = 0;
        let maxDrawdownPct = 0;
        let runningBalance = initialBalance;

        for (const t of closedTrades) {
            runningBalance += t.pnl;
            if (runningBalance > peak) {
                peak = runningBalance;
            }
            const dd = peak - runningBalance;
            const ddPct = peak > 0 ? (dd / peak) * 100 : 0;
            if (dd > maxDrawdownDollar) {
                maxDrawdownDollar = dd;
            }
            if (ddPct > maxDrawdownPct) {
                maxDrawdownPct = ddPct;
            }
        }

        // Sharpe Ratio (assuming risk-free rate = 0, annualized by sqrt(252))
        let sharpeRatio = 0;
        if (returns.length > 1) {
            const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
            const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length - 1);
            const stdDev = Math.sqrt(variance);
            if (stdDev > 0) {
                sharpeRatio = +((meanReturn / stdDev) * Math.sqrt(252)).toFixed(2);
            }
        }

        return {
            totalTrades,
            winRate,
            winningTrades: wins,
            losingTrades: losses,
            breakEvenTrades: breakEvens,
            netProfit,
            netProfitPct,
            grossProfit: +grossProfit.toFixed(2),
            grossLoss: +grossLoss.toFixed(2),
            profitFactor,
            avgWin,
            avgLoss,
            riskRewardRatio,
            maxDrawdownPct: +maxDrawdownPct.toFixed(2),
            maxDrawdownDollar: +maxDrawdownDollar.toFixed(2),
            sharpeRatio,
            currentEquity
        };
    }

    renderEquityCurve(closedTrades, initialBalance = 10000, currentEquity = 10000) {
        if (!this.canvas || !this.ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        const ctx = this.ctx;
        ctx.clearRect(0, 0, width, height);

        // Build equity points array
        const points = [initialBalance];
        let running = initialBalance;
        for (const t of closedTrades) {
            running += t.pnl;
            points.push(running);
        }
        if (points.length === 1 && currentEquity !== initialBalance) {
            points.push(currentEquity);
        }

        if (points.length < 2) {
            // Draw placeholder baseline
            ctx.strokeStyle = '#262b32';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(20, height / 2);
            ctx.lineTo(width - 20, height / 2);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#6b7280';
            ctx.font = "11px 'JetBrains Mono', monospace";
            ctx.textAlign = 'center';
            ctx.fillText("Equity curve will plot here upon executing trades", width / 2, height / 2 - 10);
            return;
        }

        const minVal = Math.min(...points) * 0.995;
        const maxVal = Math.max(...points) * 1.005;
        const range = maxVal - minVal || 1;

        const padding = { top: 20, bottom: 25, left: 10, right: 20 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        // Draw subtle grid lines
        ctx.strokeStyle = '#1b1f24';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 3; i++) {
            const y = padding.top + (chartH / 3) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }

        // Coordinates mapping
        const coords = points.map((p, i) => {
            const x = padding.left + (i / (points.length - 1)) * chartW;
            const y = padding.top + chartH - ((p - minVal) / range) * chartH;
            return { x, y, val: p };
        });

        // Path for gradient fill
        ctx.beginPath();
        ctx.moveTo(coords[0].x, height - padding.bottom);
        coords.forEach(pt => ctx.lineTo(pt.x, pt.y));
        ctx.lineTo(coords[coords.length - 1].x, height - padding.bottom);
        ctx.closePath();

        const isOverallProfit = points[points.length - 1] >= initialBalance;
        const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
        
        if (isOverallProfit) {
            gradient.addColorStop(0, 'rgba(0, 255, 102, 0.25)');
            gradient.addColorStop(1, 'rgba(0, 255, 102, 0.0)');
        } else {
            gradient.addColorStop(0, 'rgba(255, 51, 68, 0.25)');
            gradient.addColorStop(1, 'rgba(255, 51, 68, 0.0)');
        }

        ctx.fillStyle = gradient;
        ctx.fill();

        // Stroke line
        ctx.beginPath();
        ctx.moveTo(coords[0].x, coords[0].y);
        for (let i = 1; i < coords.length; i++) {
            ctx.lineTo(coords[i].x, coords[i].y);
        }
        ctx.strokeStyle = isOverallProfit ? '#00ff66' : '#ff3344';
        ctx.lineWidth = 2;
        ctx.shadowColor = isOverallProfit ? 'rgba(0, 255, 102, 0.5)' : 'rgba(255, 51, 68, 0.5)';
        ctx.shadowBlur = 6;
        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow

        // Highlight latest point
        const lastPt = coords[coords.length - 1];
        ctx.fillStyle = isOverallProfit ? '#00ff66' : '#ff3344';
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    exportToCSV(closedTrades) {
        if (!closedTrades || closedTrades.length === 0) {
            alert("No trade history available to export.");
            return;
        }

        const headers = ["Ticket", "Symbol", "Side", "Lots", "Entry Price", "Exit Price", "Entry Time", "Exit Time", "P&L ($)", "ROI (%)", "Reason", "Account Balance"];
        const rows = closedTrades.map(t => [
            t.id,
            t.symbol,
            t.type,
            t.size,
            t.entryPrice,
            t.exitPrice,
            new Date(t.entryTime * 1000).toISOString(),
            new Date(t.exitTime * 1000).toISOString(),
            t.pnl,
            t.roiPct,
            t.reason,
            t.accountBalanceAfter
        ]);

        let csvContent = "data:text/csv;charset=utf-8," + [headers.join(",")].concat(rows.map(e => e.join(","))).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `retrotrade_trades_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    exportToJSON(closedTrades, metrics) {
        const data = {
            exportTime: new Date().toISOString(),
            metrics,
            trades: closedTrades
        };
        const jsonStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const link = document.createElement("a");
        link.setAttribute("href", jsonStr);
        link.setAttribute("download", `retrotrade_session_${Date.now()}.json`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

window.PerformanceAnalytics = PerformanceAnalytics;

/**
 * RetroTrade Lab - Interactive Drawing & Forecasting Tools
 * Long/Short Forecast Boxes, Trendlines, Horizontal Rays, LuxAlgo Sessions & Snapshot Utility
 */

class DrawingCanvasManager {
    constructor(containerId, chartManager) {
        this.container = document.getElementById(containerId);
        this.chartManager = chartManager;
        this.canvas = null;
        this.ctx = null;

        this.currentTool = 'cursor'; // 'cursor', 'trendline', 'horizontal', 'vertical', 'long_pos', 'short_pos', 'ruler'
        this.drawings = []; // array of placed drawings
        this.activeDrawing = null;
        this.isDrawing = false;
        this.sessions = []; // active session boxes

        this.initCanvas();
    }

    initCanvas() {
        if (!this.container) return;

        // Create overlay canvas if not present
        let canvas = document.getElementById('chart-drawing-overlay');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'chart-drawing-overlay';
            canvas.className = 'absolute inset-0 pointer-events-none z-20';
            this.container.appendChild(canvas);
        }

        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());
        this.setupEvents();
    }

    resize() {
        if (!this.canvas || !this.container) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
        this.ctx.scale(dpr, dpr);
        this.redraw();
    }

    setTool(tool) {
        this.currentTool = tool;
        if (!this.canvas) return;

        if (tool === 'cursor') {
            this.canvas.style.pointerEvents = 'none';
        } else {
            this.canvas.style.pointerEvents = 'auto';
            this.canvas.style.cursor = 'crosshair';
        }
    }

    setupEvents() {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousedown', (e) => {
            if (this.currentTool === 'cursor') return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.isDrawing = true;

            if (this.currentTool === 'trendline') {
                this.activeDrawing = { type: 'trendline', x1: x, y1: y, x2: x, y2: y, color: '#00ff66' };
            } else if (this.currentTool === 'horizontal') {
                this.drawings.push({ type: 'horizontal', y: y, color: '#38bdf8' });
                this.isDrawing = false;
                this.redraw();
            } else if (this.currentTool === 'vertical') {
                this.drawings.push({ type: 'vertical', x: x, color: '#f59e0b' });
                this.isDrawing = false;
                this.redraw();
            } else if (this.currentTool === 'long_pos') {
                // Long forecast: green profit top, red stop bottom
                this.activeDrawing = {
                    type: 'long_pos',
                    startX: x,
                    entryY: y,
                    width: 140,
                    targetY: y - 70,
                    stopY: y + 35
                };
                this.drawings.push(this.activeDrawing);
                this.isDrawing = false;
                this.redraw();
            } else if (this.currentTool === 'short_pos') {
                // Short forecast: green profit bottom, red stop top
                this.activeDrawing = {
                    type: 'short_pos',
                    startX: x,
                    entryY: y,
                    width: 140,
                    targetY: y + 70,
                    stopY: y - 35
                };
                this.drawings.push(this.activeDrawing);
                this.isDrawing = false;
                this.redraw();
            } else if (this.currentTool === 'ruler') {
                this.activeDrawing = { type: 'ruler', x1: x, y1: y, x2: x, y2: y };
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing || !this.activeDrawing) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.activeDrawing.type === 'trendline' || this.activeDrawing.type === 'ruler') {
                this.activeDrawing.x2 = x;
                this.activeDrawing.y2 = y;
                this.redraw();
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            if (this.isDrawing && this.activeDrawing) {
                this.drawings.push(this.activeDrawing);
                this.activeDrawing = null;
                this.isDrawing = false;
                this.redraw();
            }
        });
    }

    setSessions(sessionList) {
        this.sessions = sessionList || [];
        this.redraw();
    }

    clearDrawings() {
        this.drawings = [];
        this.activeDrawing = null;
        this.redraw();
    }

    redraw() {
        if (!this.ctx || !this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);

        // 1. Draw LuxAlgo Session Boxes if enabled
        this.renderSessionBoxes(rect.width, rect.height);

        // 2. Render Placed User Drawings
        const all = [...this.drawings];
        if (this.activeDrawing && this.isDrawing) all.push(this.activeDrawing);

        for (const d of all) {
            this.ctx.save();
            if (d.type === 'trendline') {
                this.ctx.strokeStyle = d.color || '#00ff66';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(d.x1, d.y1);
                this.ctx.lineTo(d.x2, d.y2);
                this.ctx.stroke();

                // Handles
                this.ctx.fillStyle = '#ffffff';
                this.ctx.beginPath();
                this.ctx.arc(d.x1, d.y1, 3.5, 0, Math.PI * 2);
                this.ctx.arc(d.x2, d.y2, 3.5, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (d.type === 'horizontal') {
                this.ctx.strokeStyle = d.color || '#38bdf8';
                this.ctx.lineWidth = 1.5;
                this.ctx.setLineDash([5, 4]);
                this.ctx.beginPath();
                this.ctx.moveTo(0, d.y);
                this.ctx.lineTo(rect.width, d.y);
                this.ctx.stroke();
            } else if (d.type === 'vertical') {
                this.ctx.strokeStyle = d.color || '#f59e0b';
                this.ctx.lineWidth = 1.5;
                this.ctx.setLineDash([5, 4]);
                this.ctx.beginPath();
                this.ctx.moveTo(d.x, 0);
                this.ctx.lineTo(d.x, rect.height);
                this.ctx.stroke();
            } else if (d.type === 'long_pos') {
                // Long forecast tool block
                const w = d.width || 140;
                // Target zone (green)
                this.ctx.fillStyle = 'rgba(0, 255, 102, 0.18)';
                this.ctx.strokeStyle = '#00ff66';
                this.ctx.lineWidth = 1.5;
                this.ctx.fillRect(d.startX, d.targetY, w, d.entryY - d.targetY);
                this.ctx.strokeRect(d.startX, d.targetY, w, d.entryY - d.targetY);

                // Stop zone (red)
                this.ctx.fillStyle = 'rgba(255, 51, 68, 0.18)';
                this.ctx.strokeStyle = '#ff3344';
                this.ctx.fillRect(d.startX, d.entryY, w, d.stopY - d.entryY);
                this.ctx.strokeRect(d.startX, d.entryY, w, d.stopY - d.entryY);

                // Entry middle line
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(d.startX, d.entryY);
                this.ctx.lineTo(d.startX + w, d.entryY);
                this.ctx.stroke();

                // Labels
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = "10px 'JetBrains Mono', monospace";
                this.ctx.fillText("TARGET (TP)", d.startX + 6, d.targetY + 14);
                this.ctx.fillText("STOP (SL)", d.startX + 6, d.stopY - 6);
                this.ctx.fillStyle = '#00ff66';
                this.ctx.fillText("R:R 2.00", d.startX + w - 50, d.entryY - 4);
            } else if (d.type === 'short_pos') {
                // Short forecast tool block
                const w = d.width || 140;
                // Stop zone (red, top)
                this.ctx.fillStyle = 'rgba(255, 51, 68, 0.18)';
                this.ctx.strokeStyle = '#ff3344';
                this.ctx.lineWidth = 1.5;
                this.ctx.fillRect(d.startX, d.stopY, w, d.entryY - d.stopY);
                this.ctx.strokeRect(d.startX, d.stopY, w, d.entryY - d.stopY);

                // Target zone (green, bottom)
                this.ctx.fillStyle = 'rgba(0, 255, 102, 0.18)';
                this.ctx.strokeStyle = '#00ff66';
                this.ctx.fillRect(d.startX, d.entryY, w, d.targetY - d.entryY);
                this.ctx.strokeRect(d.startX, d.entryY, w, d.targetY - d.entryY);

                // Entry line
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 1;
                this.ctx.beginPath();
                this.ctx.moveTo(d.startX, d.entryY);
                this.ctx.lineTo(d.startX + w, d.entryY);
                this.ctx.stroke();

                // Labels
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = "10px 'JetBrains Mono', monospace";
                this.ctx.fillText("STOP (SL)", d.startX + 6, d.stopY + 14);
                this.ctx.fillText("TARGET (TP)", d.startX + 6, d.targetY - 6);
                this.ctx.fillStyle = '#00ff66';
                this.ctx.fillText("R:R 2.00", d.startX + w - 50, d.entryY + 12);
            } else if (d.type === 'ruler') {
                // Ruler measurement box
                const rx = Math.min(d.x1, d.x2);
                const ry = Math.min(d.y1, d.y2);
                const rw = Math.abs(d.x2 - d.x1);
                const rh = Math.abs(d.y2 - d.y1);

                this.ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
                this.ctx.strokeStyle = '#38bdf8';
                this.ctx.lineWidth = 1;
                this.ctx.fillRect(rx, ry, rw, rh);
                this.ctx.strokeRect(rx, ry, rw, rh);

                this.ctx.fillStyle = '#38bdf8';
                this.ctx.font = "10px 'JetBrains Mono', monospace";
                this.ctx.fillText(`Δ ${rh.toFixed(0)} pts`, rx + 6, ry + 16);
            }
            this.ctx.restore();
        }
    }

    renderSessionBoxes(width, height) {
        if (!this.sessions || this.sessions.length === 0) return;

        // Render subtle session zones
        const sampleCount = Math.min(this.sessions.length, 6);
        const startIdx = Math.max(0, this.sessions.length - sampleCount);
        const colWidth = width / sampleCount;

        for (let i = startIdx; i < this.sessions.length; i++) {
            const s = this.sessions[i];
            const idx = i - startIdx;
            const x = idx * colWidth;

            this.ctx.save();
            this.ctx.fillStyle = `${s.color}15`; // hex with low alpha
            this.ctx.fillRect(x, 0, colWidth - 4, height);

            this.ctx.strokeStyle = `${s.color}66`;
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(x, 0, colWidth - 4, height);

            // Session Label at top
            this.ctx.fillStyle = s.color;
            this.ctx.font = "10px 'Plus Jakarta Sans', sans-serif";
            this.ctx.fillText(s.name, x + 6, 18);
            this.ctx.restore();
        }
    }

    // High-Resolution Snapshot Capture
    captureSnapshot() {
        if (!this.chartManager || !this.chartManager.chart) return;

        try {
            // TradingView Lightweight Charts built-in snapshot canvas
            const chartCanvas = this.chartManager.chart.takeScreenshot();
            
            // Create composite canvas to merge chart and drawings
            const composite = document.createElement('canvas');
            composite.width = chartCanvas.width;
            composite.height = chartCanvas.height;
            const cCtx = composite.getContext('2d');

            // Draw chart
            cCtx.drawImage(chartCanvas, 0, 0);

            // Draw drawing overlay
            if (this.canvas) {
                cCtx.drawImage(this.canvas, 0, 0, composite.width, composite.height);
            }

            // Watermark brand in bottom right
            cCtx.fillStyle = 'rgba(0, 255, 102, 0.8)';
            cCtx.font = "bold 14px 'Plus Jakarta Sans', sans-serif";
            cCtx.textAlign = 'right';
            cCtx.fillText("retrotrade LAB", composite.width - 20, composite.height - 20);

            // Download
            const dataUrl = composite.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `retrotrade_chart_${Date.now()}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            return dataUrl;
        } catch (e) {
            console.error("Snapshot error:", e);
            alert("Could not generate snapshot: " + e.message);
        }
    }
}

window.DrawingCanvasManager = DrawingCanvasManager;

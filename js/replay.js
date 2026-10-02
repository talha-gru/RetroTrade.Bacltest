/**
 * RetroTrade Lab - Bar-by-Bar Market Replay Engine
 */
class ReplayEngine {
    constructor() {
        this.fullData = [];
        this.currentIndex = 100; // Starting cut-off index to provide historical context
        this.isPlaying = false;
        this.playbackSpeed = 1.0; // 0.25x, 0.5x, 1x, 2x, 5x, 10x
        this.timer = null;
        this.onTickCallbacks = [];
        this.onStateChangeCallbacks = [];
    }

    loadData(candles, initialCutoff = 100) {
        this.pause();
        this.fullData = candles || [];
        this.currentIndex = Math.min(Math.max(initialCutoff, 20), Math.max(this.fullData.length - 1, 20));
        this.notifyTick();
        this.notifyStateChange();
    }

    subscribeTick(callback) {
        this.onTickCallbacks.push(callback);
    }

    subscribeStateChange(callback) {
        this.onStateChangeCallbacks.push(callback);
    }

    notifyTick() {
        const visibleCandles = this.fullData.slice(0, this.currentIndex + 1);
        const currentCandle = this.fullData[this.currentIndex] || null;

        for (const cb of this.onTickCallbacks) {
            try {
                cb(visibleCandles, currentCandle, this.currentIndex, this.fullData.length);
            } catch (err) {
                console.error("Replay tick callback error:", err);
            }
        }
    }

    notifyStateChange() {
        for (const cb of this.onStateChangeCallbacks) {
            try {
                cb({
                    isPlaying: this.isPlaying,
                    speed: this.playbackSpeed,
                    currentIndex: this.currentIndex,
                    totalBars: this.fullData.length,
                    progressPct: this.getProgressPct()
                });
            } catch (err) {
                console.error("Replay state change error:", err);
            }
        }
    }

    getProgressPct() {
        if (this.fullData.length <= 1) return 0;
        return ((this.currentIndex / (this.fullData.length - 1)) * 100).toFixed(1);
    }

    getCurrentCandle() {
        return this.fullData[this.currentIndex] || null;
    }

    play() {
        if (this.isPlaying) return;
        if (this.currentIndex >= this.fullData.length - 1) {
            // If at end, loop back or reset
            this.currentIndex = 50;
        }

        this.isPlaying = true;
        this.notifyStateChange();
        this.scheduleNextTick();
    }

    pause() {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        this.notifyStateChange();
    }

    togglePlay() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    scheduleNextTick() {
        if (!this.isPlaying) return;

        // Base 1000ms / playbackSpeed
        const intervalMs = Math.max(60, Math.floor(1000 / this.playbackSpeed));

        this.timer = setTimeout(() => {
            if (!this.isPlaying) return;

            if (this.currentIndex < this.fullData.length - 1) {
                this.currentIndex++;
                this.notifyTick();
                this.notifyStateChange();
                this.scheduleNextTick();
            } else {
                this.pause();
            }
        }, intervalMs);
    }

    setSpeed(speedMultiplier) {
        this.playbackSpeed = parseFloat(speedMultiplier);
        if (this.isPlaying) {
            if (this.timer) clearTimeout(this.timer);
            this.scheduleNextTick();
        }
        this.notifyStateChange();
    }

    stepForward() {
        if (this.currentIndex < this.fullData.length - 1) {
            this.currentIndex++;
            this.notifyTick();
            this.notifyStateChange();
        }
    }

    stepBackward() {
        if (this.currentIndex > 20) {
            this.currentIndex--;
            this.notifyTick();
            this.notifyStateChange();
        }
    }

    jumpToIndex(index) {
        index = Math.max(10, Math.min(index, this.fullData.length - 1));
        this.currentIndex = index;
        this.notifyTick();
        this.notifyStateChange();
    }

    jumpToPercent(percent) {
        const targetIdx = Math.floor((percent / 100) * (this.fullData.length - 1));
        this.jumpToIndex(targetIdx);
    }

    reset() {
        this.pause();
        this.currentIndex = 50;
        this.notifyTick();
        this.notifyStateChange();
    }
}

window.ReplayEngine = ReplayEngine;

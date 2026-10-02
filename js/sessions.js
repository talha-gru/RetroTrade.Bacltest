/**
 * RetroTrade Lab - Backtest Sessions Management System
 * Inspired by professional backtest session architectures like Traders Casa.
 */
class SessionManager {
    constructor() {
        this.STORAGE_KEY = 'retrotrade_backtest_sessions_v2';
        this.ACTIVE_SESSION_KEY = 'retrotrade_active_session_id';
        this.sessions = [];
        this.activeSessionId = null;
        this.listeners = [];
        
        this.init();
    }

    init() {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.sessions = JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse stored sessions:", e);
                this.sessions = this.getDefaultSessions();
            }
        } else {
            this.sessions = this.getDefaultSessions();
            this.persist();
        }

        const activeId = localStorage.getItem(this.ACTIVE_SESSION_KEY);
        if (activeId && this.sessions.some(s => s.id === activeId)) {
            this.activeSessionId = activeId;
        } else if (this.sessions.length > 0) {
            this.activeSessionId = this.sessions[0].id;
        }
    }

    getDefaultSessions() {
        return [
            {
                id: 'SES-01',
                name: 'Gold 2024 Macro Breakout',
                pair: 'XAU/USD',
                startingBalance: 10000,
                currentBalance: 12450.00,
                equity: 12450.00,
                startDate: '2024-03-01',
                startTimestamp: 1709251200,
                timeframe: '1h',
                createdAt: '2024-03-02',
                description: 'Testing trend continuation and key level breakouts during Gold\'s historic surge to $2,400+.',
                tradesCount: 14,
                winRate: 64.3,
                pnl: 2450.00,
                status: 'ACTIVE'
            },
            {
                id: 'SES-02',
                name: 'Bitcoin ETF Halving Replay',
                pair: 'BTC/USD',
                startingBalance: 5000,
                currentBalance: 6820.00,
                equity: 6820.00,
                startDate: '2024-01-10',
                startTimestamp: 1704844800,
                timeframe: '1h',
                createdAt: '2024-01-11',
                description: 'Simulating post-ETF approval liquidity sweeps and pre-halving volatility expansions.',
                tradesCount: 22,
                winRate: 59.1,
                pnl: 1820.00,
                status: 'ACTIVE'
            },
            {
                id: 'SES-03',
                name: 'Crypto Winter 2022 Short Strategy',
                pair: 'BTC/USD',
                startingBalance: 25000,
                currentBalance: 31200.00,
                equity: 31200.00,
                startDate: '2022-05-01',
                startTimestamp: 1651363200,
                timeframe: '4h',
                createdAt: '2022-05-02',
                description: 'Short bias testing following Terra/Luna crash and liquidity cascades down to $16,000.',
                tradesCount: 18,
                winRate: 72.2,
                pnl: 6200.00,
                status: 'PAUSED'
            },
            {
                id: 'SES-04',
                name: 'US Banking Crisis 2023 Scalp',
                pair: 'XAU/USD',
                startingBalance: 1000,
                currentBalance: 1480.00,
                equity: 1480.00,
                startDate: '2023-03-08',
                startTimestamp: 1678233600,
                timeframe: '15m',
                createdAt: '2023-03-09',
                description: 'Micro-account scaling challenge on safe-haven Gold inflows during SVB bank collapse.',
                tradesCount: 31,
                winRate: 67.7,
                pnl: 480.00,
                status: 'ACTIVE'
            }
        ];
    }

    persist() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.sessions));
        } catch (e) {
            console.error("Storage error:", e);
        }
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => {
            try { cb(this.sessions, this.getActiveSession()); } catch (e) { console.error(e); }
        });
    }

    getAll() {
        return this.sessions;
    }

    getById(id) {
        return this.sessions.find(s => s.id === id) || null;
    }

    getActiveSession() {
        return this.getById(this.activeSessionId) || this.sessions[0] || null;
    }

    setActive(id) {
        if (this.sessions.some(s => s.id === id)) {
            this.activeSessionId = id;
            localStorage.setItem(this.ACTIVE_SESSION_KEY, id);
            this.notify();
            return this.getActiveSession();
        }
        return null;
    }

    createSession({ name, pair, startingBalance, startDate, description, timeframe = '1h' }) {
        const id = `SES-${Date.now().toString().slice(-4)}`;
        const startTimestamp = Math.floor(new Date(startDate || '2024-01-01').getTime() / 1000);
        const balance = parseFloat(startingBalance) || 10000;

        const newSession = {
            id,
            name: name || `Session ${id}`,
            pair: pair || 'XAU/USD',
            startingBalance: balance,
            currentBalance: balance,
            equity: balance,
            startDate: startDate || '2024-01-01',
            startTimestamp: isNaN(startTimestamp) ? 1704067200 : startTimestamp,
            timeframe: timeframe || '1h',
            createdAt: new Date().toISOString().split('T')[0],
            description: description || 'Custom backtesting session with 5-year historical depth.',
            tradesCount: 0,
            winRate: 0,
            pnl: 0,
            status: 'ACTIVE'
        };

        this.sessions.unshift(newSession);
        this.activeSessionId = newSession.id;
        localStorage.setItem(this.ACTIVE_SESSION_KEY, newSession.id);
        this.persist();
        this.notify();
        return newSession;
    }

    updateSession(id, updates) {
        const idx = this.sessions.findIndex(s => s.id === id);
        if (idx !== -1) {
            this.sessions[idx] = { ...this.sessions[idx], ...updates };
            this.persist();
            this.notify();
            return this.sessions[idx];
        }
        return null;
    }

    deleteSession(id) {
        this.sessions = this.sessions.filter(s => s.id !== id);
        if (this.activeSessionId === id) {
            this.activeSessionId = this.sessions.length > 0 ? this.sessions[0].id : null;
            if (this.activeSessionId) {
                localStorage.setItem(this.ACTIVE_SESSION_KEY, this.activeSessionId);
            } else {
                localStorage.removeItem(this.ACTIVE_SESSION_KEY);
            }
        }
        this.persist();
        this.notify();
    }
}

window.SessionManager = SessionManager;

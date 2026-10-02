/**
 * RetroTrade Lab - Node.js Backend Server
 * Express & WebSocket/REST API for market replay, orders, and analytics.
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// In-Memory state for demonstration
let accountState = {
    balance: 10000.00,
    equity: 10000.00,
    positions: [],
    closedTrades: []
};

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', brand: 'retrotrade Lab', timestamp: Date.now() });
});

// Get Account State & Analytics
app.get('/api/account', (req, res) => {
    res.json(accountState);
});

// Reset Account
app.post('/api/account/reset', (req, res) => {
    const initial = req.body.balance || 10000.00;
    accountState = {
        balance: initial,
        equity: initial,
        positions: [],
        closedTrades: []
    };
    res.json({ message: 'Account reset successful', account: accountState });
});

// Serve frontend entrypoint
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n===========================================`);
        console.log(`  [retrotrade Lab] Server Running on:`);
        console.log(`  http://localhost:${PORT}`);
        console.log(`===========================================\n`);
    });
}

module.exports = app;

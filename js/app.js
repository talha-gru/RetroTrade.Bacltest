/**
 * RetroTrade Lab - Elite Professional Trading Platform Coordinator
 * Multi-Asset, Live Market Mode, AI Copilot, LuxAlgo Sessions, Indicators Toggle & Drawing Tools
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Engines
    const sessionManager = new SessionManager();
    const dataManager = new MarketDataManager();
    const chartManager = new ChartManager('tv-chart-container');
    const replayEngine = new ReplayEngine();
    const tradingSimulator = new TradingSimulator(10000);
    const analytics = new PerformanceAnalytics('equity-curve-canvas');
    const indicatorsManager = new IndicatorsManager(chartManager);
    const aiToolsSuite = new AIToolsSuite();
    const drawingManager = new DrawingCanvasManager('chart-main-wrapper', chartManager);

    window.indicatorsEngine = indicatorsManager;

    // Platform State
    let platformMode = 'REPLAY'; // 'REPLAY' or 'LIVE'
    let liveTickerInterval = null;
    let currentNavView = 'backtest';
    let currentSymbol = 'XAU/USD';
    let currentTimeframe = '1h';
    let orderSide = 'BUY';
    let activeCategory = 'all';

    // 2. Load Active Session / Asset
    const activeSession = sessionManager.getActiveSession();
    if (activeSession) {
        currentSymbol = activeSession.pair || 'XAU/USD';
        currentTimeframe = activeSession.timeframe || '1h';
        tradingSimulator.reset(activeSession.startingBalance);
        dataManager.loadSessionData(currentSymbol, currentTimeframe, activeSession.startTimestamp);
    } else {
        dataManager.loadSymbol(currentSymbol, currentTimeframe);
    }

    replayEngine.loadData(dataManager.data, 120);

    // 3. UI References
    const elements = {
        // Mode Switcher
        btnModeReplay: document.getElementById('btn-mode-replay'),
        btnModeLive: document.getElementById('btn-mode-live'),
        livePulseIndicator: document.getElementById('live-feed-pulse'),
        modeBadge: document.getElementById('current-mode-label'),

        // Pair Selector
        btnOpenAssetModal: document.getElementById('btn-open-asset-modal'),
        activeSymbolDisplay: document.getElementById('active-symbol-text'),
        activeCategoryBadge: document.getElementById('active-category-badge'),
        assetModal: document.getElementById('asset-modal'),
        btnCloseAssetModal: document.getElementById('btn-close-asset-modal'),
        assetSearchInput: document.getElementById('asset-search-input'),
        assetCategoryTabs: document.querySelectorAll('.asset-cat-tab'),
        assetListContainer: document.getElementById('asset-list-container'),

        // Timeframe Buttons
        tfButtons: document.querySelectorAll('.chart-tf-btn'),

        // Indicator Menu & Toggles
        btnOpenIndicators: document.getElementById('btn-open-indicators'),
        indicatorsModal: document.getElementById('indicators-modal'),
        btnCloseIndicators: document.getElementById('btn-close-indicators'),
        indicatorSearch: document.getElementById('indicator-search-input'),
        indicatorToggles: document.querySelectorAll('.indicator-checkbox'),

        // AI Tools Panel
        btnOpenAiPanel: document.getElementById('btn-open-ai-panel'),
        aiPanel: document.getElementById('ai-copilot-panel'),
        btnCloseAiPanel: document.getElementById('btn-close-ai-panel'),
        aiTabs: document.querySelectorAll('.ai-tab-btn'),
        aiTabContents: document.querySelectorAll('.ai-tab-content'),
        btnRunAiAnalysis: document.getElementById('btn-run-ai-analysis'),
        btnRunPatternScan: document.getElementById('btn-run-pattern-scan'),
        btnRunOptimizer: document.getElementById('btn-run-optimizer'),
        btnApplyAiSetup: document.getElementById('btn-apply-ai-setup'),

        // Drawing Toolbar
        drawingToolButtons: document.querySelectorAll('.drawing-tool-btn'),
        btnClearDrawings: document.getElementById('btn-clear-drawings'),

        // Chart Utilities (Fullscreen, Snapshot)
        btnFullscreen: document.getElementById('btn-chart-fullscreen'),
        btnSnapshot: document.getElementById('btn-chart-snapshot'),
        btnOpenSettings: document.getElementById('btn-open-settings'),

        // Replay Controls
        playBtn: document.getElementById('btn-replay-play'),
        stepFwdBtn: document.getElementById('btn-replay-step-fwd'),
        stepBackBtn: document.getElementById('btn-replay-step-back'),
        rewindBtn: document.getElementById('btn-replay-rewind'),
        speedBtns: document.querySelectorAll('.speed-btn'),
        scrubber: document.getElementById('replay-scrubber'),
        barCounter: document.getElementById('replay-bar-counter'),
        timeDisplay: document.getElementById('replay-time-display'),
        statusBadge: document.getElementById('replay-status-badge'),
        replayControlBar: document.getElementById('replay-control-bar'),

        // Order Execution
        btnBuySide: document.getElementById('btn-side-buy'),
        btnSellSide: document.getElementById('btn-side-sell'),
        lotInput: document.getElementById('order-lots'),
        riskPctInput: document.getElementById('order-risk-pct'),
        slToggle: document.getElementById('toggle-sl'),
        slInput: document.getElementById('order-sl'),
        tpToggle: document.getElementById('toggle-tp'),
        tpInput: document.getElementById('order-tp'),
        rrPreview: document.getElementById('order-rr-preview'),
        estProfitPreview: document.getElementById('order-est-profit'),
        estLossPreview: document.getElementById('order-est-loss'),
        btnExecute: document.getElementById('btn-execute-order'),
        btnCloseAll: document.getElementById('btn-close-all'),

        // Tables & Panels
        positionsTableBody: document.getElementById('positions-table-body'),
        positionsCountBadge: document.getElementById('positions-count-badge'),
        historyTableBody: document.getElementById('history-table-body'),
        historyCountBadge: document.getElementById('history-count-badge'),
        sessionsGrid: document.getElementById('sessions-grid-container'),
        btnNewSessionHeader: document.getElementById('btn-new-session-header'),
        btnNewSessionMain: document.getElementById('btn-new-session-main'),

        // Modals
        sessionModal: document.getElementById('session-modal'),
        settingsModal: document.getElementById('settings-modal'),
        btnCloseSettings: document.getElementById('btn-close-settings'),
        quickYearButtons: document.querySelectorAll('.quick-year-btn'),

        // Metrics
        metricEquity: document.getElementById('metric-equity'),
        metricBalance: document.getElementById('metric-balance'),
        metricNetProfit: document.getElementById('metric-net-profit'),
        metricWinRate: document.getElementById('metric-win-rate'),
        metricProfitFactor: document.getElementById('metric-profit-factor'),
        metricSharpe: document.getElementById('metric-sharpe'),
        metricMaxDrawdown: document.getElementById('metric-drawdown'),
        metricTradesCount: document.getElementById('metric-trades-count'),
        metricAvgWinLoss: document.getElementById('metric-avg-win-loss'),

        // Actions
        btnExportCsv: document.getElementById('btn-export-csv'),
        btnExportJson: document.getElementById('btn-export-json'),
        btnResetAccount: document.getElementById('btn-reset-account'),
        toastContainer: document.getElementById('toast-container'),

        // Sidebar Navigation
        sidebarItems: document.querySelectorAll('.sidebar-item'),
        navViews: document.querySelectorAll('.nav-view-panel')
    };

    // 4. Toast Notifications
    function showToast(title, message, type = 'info') {
        if (!elements.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `p-3 rounded-lg border text-sm shadow-xl flex items-start space-x-2 animate-slide-up pointer-events-auto ${
            type === 'success' ? 'bg-[#122619] border-[#00ff66]/50 text-white' :
            type === 'danger' ? 'bg-[#291316] border-[#ff3344]/50 text-white' :
            'bg-[#191d24] border-[#303742] text-gray-200'
        }`;

        const iconColor = type === 'success' ? '#00ff66' : type === 'danger' ? '#ff3344' : '#38bdf8';
        toast.innerHTML = `
            <div class="mt-0.5" style="color: ${iconColor};">
                <i data-lucide="${type === 'success' ? 'check-circle' : type === 'danger' ? 'alert-triangle' : 'info'}" class="w-4 h-4"></i>
            </div>
            <div class="flex-1">
                <div class="font-bold text-xs uppercase tracking-wider" style="color: ${iconColor};">${title}</div>
                <div class="text-xs text-gray-300 mt-0.5">${message}</div>
            </div>
        `;

        elements.toastContainer.appendChild(toast);
        if (window.lucide) window.lucide.createIcons();

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // 5. Dual Mode Switcher (Backtest / Replay Mode vs Live Market Mode)
    function setPlatformMode(mode) {
        platformMode = mode;
        if (mode === 'LIVE') {
            elements.btnModeLive.className = "flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-bold bg-[#00ff66] text-black shadow-md shadow-[#00ff66]/20 transition";
            elements.btnModeReplay.className = "flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-semibold text-gray-400 hover:text-white bg-transparent transition";
            elements.modeBadge.innerText = "LIVE MARKET STREAMING";
            elements.modeBadge.className = "text-[10px] font-mono font-bold text-[#00ff66] uppercase";
            elements.livePulseIndicator.className = "live-pulse";

            // Hide Replay bar in live mode
            if (elements.replayControlBar) {
                elements.replayControlBar.classList.add('opacity-40', 'pointer-events-none');
            }

            startLiveMarketFeed();
            showToast('Live Mode Engaged', `Connected to real-time price feed for ${currentSymbol}`, 'success');
        } else {
            elements.btnModeReplay.className = "flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-bold bg-[#00ff66] text-black shadow-md shadow-[#00ff66]/20 transition";
            elements.btnModeLive.className = "flex items-center space-x-1 px-3 py-1 rounded-md text-xs font-semibold text-gray-400 hover:text-white bg-transparent transition";
            elements.modeBadge.innerText = "BACKTEST / REPLAY";
            elements.modeBadge.className = "text-[10px] font-mono font-bold text-amber-400 uppercase";
            elements.livePulseIndicator.className = "w-2 h-2 rounded-full bg-amber-400";

            if (elements.replayControlBar) {
                elements.replayControlBar.classList.remove('opacity-40', 'pointer-events-none');
            }

            stopLiveMarketFeed();
            showToast('Backtest Mode Engaged', 'Historical bar-by-bar replay active.', 'info');
        }
    }

    function startLiveMarketFeed() {
        stopLiveMarketFeed();
        replayEngine.pause();

        const spec = dataManager.getSpec();
        const basePrice = spec.basePrice || 2650;
        let lastPrice = chartManager.currentCandles.length > 0 
            ? chartManager.currentCandles[chartManager.currentCandles.length - 1].close 
            : basePrice;

        liveTickerInterval = setInterval(() => {
            const shock = (Math.random() - 0.498) * (spec.volatility * 0.4) * lastPrice;
            lastPrice = +(lastPrice + shock).toFixed(spec.decimals);

            // Update latest candle tick
            if (chartManager.currentCandles.length > 0) {
                const currentBar = chartManager.currentCandles[chartManager.currentCandles.length - 1];
                currentBar.close = lastPrice;
                if (lastPrice > currentBar.high) currentBar.high = lastPrice;
                if (lastPrice < currentBar.low) currentBar.low = lastPrice;
                currentBar.volume += Math.floor(Math.random() * 5);

                chartManager.updateLastBar(currentBar);

                // Check active position SL/TP hits in live mode
                tradingSimulator.evaluateBar(currentBar, spec);
                updateActiveChartLines(lastPrice);
            }
        }, 800);
    }

    function stopLiveMarketFeed() {
        if (liveTickerInterval) {
            clearInterval(liveTickerInterval);
            liveTickerInterval = null;
        }
    }

    elements.btnModeReplay.addEventListener('click', () => setPlatformMode('REPLAY'));
    elements.btnModeLive.addEventListener('click', () => setPlatformMode('LIVE'));

    // 6. Multi-Asset Pair Selector Modal & Search
    function renderAssetList(searchQuery = '', category = 'all') {
        if (!elements.assetListContainer) return;
        const specs = window.RetroData ? window.RetroData.specs : {};
        const query = searchQuery.toLowerCase().trim();

        const filtered = Object.keys(specs).filter(sym => {
            const spec = specs[sym];
            const matchesCat = (category === 'all') || (spec.category === category);
            const matchesQuery = !query || sym.toLowerCase().includes(query) || spec.name.toLowerCase().includes(query);
            return matchesCat && matchesQuery;
        });

        if (filtered.length === 0) {
            elements.assetListContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500 font-mono text-xs">
                    No matching pairs found.
                </div>
            `;
            return;
        }

        elements.assetListContainer.innerHTML = filtered.map(sym => {
            const spec = specs[sym];
            const isSelected = sym === currentSymbol;
            const isForex = spec.category === 'forex';
            const isCrypto = spec.category === 'crypto';

            return `
                <div data-symbol="${sym}" class="asset-row p-3 rounded-lg flex items-center justify-between border cursor-pointer transition ${
                    isSelected ? 'bg-[#00ff66]/15 border-[#00ff66]/40' : 'bg-[#121418] hover:bg-[#191d24] border-[#242a34]'
                }">
                    <div class="flex items-center space-x-3">
                        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                            isForex ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' :
                            isCrypto ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                            'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
                        }">
                            ${spec.category}
                        </span>
                        <div>
                            <span class="text-xs font-bold text-white font-mono block">${sym}</span>
                            <span class="text-[11px] text-gray-400">${spec.name}</span>
                        </div>
                    </div>

                    <div class="text-right font-mono">
                        <span class="text-xs font-bold text-white block">$${spec.basePrice.toLocaleString()}</span>
                        <span class="text-[10px] text-[#00ff66]">+0.85%</span>
                    </div>
                </div>
            `;
        }).join('');

        elements.assetListContainer.querySelectorAll('.asset-row').forEach(row => {
            row.addEventListener('click', () => {
                const sym = row.dataset.symbol;
                switchAsset(sym);
                elements.assetModal.classList.add('hidden');
            });
        });
    }

    function switchAsset(symbol) {
        currentSymbol = symbol;
        const spec = (window.RetroData && window.RetroData.specs[symbol]) || {};

        if (elements.activeSymbolDisplay) elements.activeSymbolDisplay.innerText = symbol;
        if (elements.activeCategoryBadge) {
            elements.activeCategoryBadge.innerText = (spec.category || 'ASSET').toUpperCase();
        }

        const activeSes = sessionManager.getActiveSession();
        const startTs = activeSes ? activeSes.startTimestamp : dataManager.currentStartTimestamp;

        const candles = dataManager.loadSessionData(currentSymbol, currentTimeframe, startTs);
        replayEngine.loadData(candles, 120);

        // Update indicators & LuxAlgo session boxes
        refreshIndicatorsOnChart();
        syncOrderDefaults();

        if (platformMode === 'LIVE') startLiveMarketFeed();
        showToast('Pair Selected', `Chart switched to ${symbol} (${spec.name || ''})`, 'success');
    }

    if (elements.btnOpenAssetModal) {
        elements.btnOpenAssetModal.addEventListener('click', () => {
            renderAssetList('', activeCategory);
            elements.assetModal.classList.remove('hidden');
        });
    }
    if (elements.btnCloseAssetModal) {
        elements.btnCloseAssetModal.addEventListener('click', () => {
            elements.assetModal.classList.add('hidden');
        });
    }
    if (elements.assetSearchInput) {
        elements.assetSearchInput.addEventListener('input', (e) => {
            renderAssetList(e.target.value, activeCategory);
        });
    }

    elements.assetCategoryTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.assetCategoryTabs.forEach(t => t.className = "asset-cat-tab px-3 py-1 rounded text-xs font-semibold text-gray-400 hover:text-white bg-[#1a1e24]");
            tab.className = "asset-cat-tab px-3 py-1 rounded text-xs font-semibold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/40";
            activeCategory = tab.dataset.category;
            renderAssetList(elements.assetSearchInput.value, activeCategory);
        });
    });

    // 7. Dynamic Indicator Controls & Toggle System
    function refreshIndicatorsOnChart() {
        chartManager.updateIndicators(indicatorsManager.config);

        // LuxAlgo Session Highlight Boxes
        if (indicatorsManager.config.sessions.enabled) {
            const sessions = indicatorsManager.getTradingSessions(chartManager.currentCandles);
            drawingManager.setSessions(sessions);
        } else {
            drawingManager.setSessions([]);
        }
    }

    if (elements.btnOpenIndicators) {
        elements.btnOpenIndicators.addEventListener('click', () => {
            syncIndicatorTogglesUI();
            elements.indicatorsModal.classList.remove('hidden');
        });
    }
    if (elements.btnCloseIndicators) {
        elements.btnCloseIndicators.addEventListener('click', () => {
            elements.indicatorsModal.classList.add('hidden');
        });
    }

    function syncIndicatorTogglesUI() {
        elements.indicatorToggles.forEach(toggle => {
            const key = toggle.dataset.indicator;
            if (indicatorsManager.config[key]) {
                toggle.checked = !!indicatorsManager.config[key].enabled;
            }
        });
    }

    elements.indicatorToggles.forEach(toggle => {
        toggle.addEventListener('change', (e) => {
            const key = e.target.dataset.indicator;
            indicatorsManager.toggleIndicator(key, e.target.checked);
            refreshIndicatorsOnChart();
            showToast('Indicator Toggled', `${key.toUpperCase()} is now ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, 'info');
        });
    });

    // 8. Replay Engine Subscriber
    replayEngine.subscribeTick((visibleCandles, currentCandle, currentIndex, totalBars) => {
        if (platformMode === 'LIVE') return; // in live mode, live feed takes over

        const spec = dataManager.getSpec();
        chartManager.setData(visibleCandles, spec.decimals, indicatorsManager.config);

        if (indicatorsManager.config.sessions.enabled) {
            const sessions = indicatorsManager.getTradingSessions(visibleCandles);
            drawingManager.setSessions(sessions);
        }

        if (currentCandle) {
            const dateStr = new Date(currentCandle.time * 1000).toUTCString().replace('GMT', 'UTC');
            if (elements.timeDisplay) elements.timeDisplay.innerText = dateStr;
            if (elements.barCounter) elements.barCounter.innerText = `Bar ${currentIndex + 1} of ${totalBars}`;
            if (elements.scrubber) {
                elements.scrubber.max = totalBars - 1;
                elements.scrubber.value = currentIndex;
            }

            tradingSimulator.evaluateBar(currentCandle, spec);
            updateActiveChartLines(currentCandle.close);
        }
    });

    // 9. AI Tools Suite Integration
    function openAiPanel() {
        elements.aiPanel.classList.remove('hidden');
        runAiTradeAnalysis();
    }

    function closeAiPanel() {
        elements.aiPanel.classList.add('hidden');
    }

    if (elements.btnOpenAiPanel) elements.btnOpenAiPanel.addEventListener('click', openAiPanel);
    if (elements.btnCloseAiPanel) elements.btnCloseAiPanel.addEventListener('click', closeAiPanel);

    elements.aiTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            elements.aiTabs.forEach(t => t.className = "ai-tab-btn flex-1 py-1.5 text-xs font-semibold text-gray-400 hover:text-white border-b-2 border-transparent");
            tab.className = "ai-tab-btn flex-1 py-1.5 text-xs font-bold text-[#00ff66] border-b-2 border-[#00ff66]";

            const targetTab = tab.dataset.aiTab;
            elements.aiTabContents.forEach(c => {
                if (c.id === `ai-tab-${targetTab}`) c.classList.remove('hidden');
                else c.classList.add('hidden');
            });

            if (targetTab === 'analyzer') runAiTradeAnalysis();
            else if (targetTab === 'patterns') runPatternScan();
            else if (targetTab === 'optimizer') runStrategyOptimization();
        });
    });

    function runAiTradeAnalysis() {
        const candle = replayEngine.getCurrentCandle();
        if (!candle) return;

        const analysis = aiToolsSuite.analyzeTradeSetup({
            symbol: currentSymbol,
            side: orderSide,
            entryPrice: candle.close,
            slPrice: parseFloat(elements.slInput.value),
            tpPrice: parseFloat(elements.tpInput.value),
            lots: parseFloat(elements.lotInput.value) || 1.0,
            equity: tradingSimulator.equity,
            candles: chartManager.currentCandles
        });

        const verdictEl = document.getElementById('ai-verdict-title');
        const probEl = document.getElementById('ai-win-prob');
        const rrEl = document.getElementById('ai-rr-score');
        const riskEl = document.getElementById('ai-risk-level');
        const recListEl = document.getElementById('ai-recommendations-list');

        if (verdictEl) {
            verdictEl.innerText = analysis.verdict;
            verdictEl.style.color = analysis.badgeColor;
        }
        if (probEl) probEl.innerText = `${analysis.winProbability}%`;
        if (rrEl) rrEl.innerText = `1 : ${analysis.riskRewardRatio}`;
        if (riskEl) riskEl.innerText = analysis.riskLevel;

        if (recListEl) {
            recListEl.innerHTML = analysis.recommendations.map(r => `
                <li class="flex items-start space-x-1.5 text-xs text-gray-300">
                    <span class="text-[#00ff66] mt-0.5">•</span>
                    <span>${r}</span>
                </li>
            `).join('');
        }
    }

    function runPatternScan() {
        const scan = aiToolsSuite.scanPatterns(chartManager.currentCandles, currentSymbol);
        const listEl = document.getElementById('ai-patterns-list');
        const sentimentEl = document.getElementById('ai-sentiment-badge');

        if (sentimentEl) {
            sentimentEl.innerText = `${scan.sentiment} (${scan.sentimentScore}%)`;
            sentimentEl.className = `px-2 py-0.5 rounded text-xs font-mono font-bold ${
                scan.sentiment.includes('BULLISH') ? 'bg-[#00ff66]/15 text-[#00ff66]' : 'bg-gray-700 text-gray-300'
            }`;
        }

        if (listEl) {
            listEl.innerHTML = scan.patterns.map(p => `
                <div class="p-2.5 rounded-lg bg-[#111317] border border-[#232830] text-xs">
                    <div class="flex justify-between font-bold mb-1">
                        <span class="text-white">${p.type}</span>
                        <span class="text-[#00ff66] font-mono">${p.reliability}</span>
                    </div>
                    <p class="text-gray-400 text-[11px]">${p.description}</p>
                    <span class="text-[10px] text-gray-500 font-mono mt-1 block">Level: ${p.priceRange}</span>
                </div>
            `).join('');
        }
    }

    function runStrategyOptimization() {
        const candle = replayEngine.getCurrentCandle();
        if (!candle) return;

        const opt = aiToolsSuite.suggestOptimization(chartManager.currentCandles, candle.close);
        if (!opt) return;

        const target = orderSide === 'BUY' ? opt.suggestedLong : opt.suggestedShort;
        const entryEl = document.getElementById('ai-opt-entry');
        const slEl = document.getElementById('ai-opt-sl');
        const tp1El = document.getElementById('ai-opt-tp1');
        const tp2El = document.getElementById('ai-opt-tp2');
        const trailingEl = document.getElementById('ai-opt-trailing');

        if (entryEl) entryEl.innerText = `$${target.entry.toFixed(2)}`;
        if (slEl) slEl.innerText = `$${target.sl.toFixed(2)}`;
        if (tp1El) tp1El.innerText = `$${target.tp1.toFixed(2)} (${target.rr1})`;
        if (tp2El) tp2El.innerText = `$${target.tp2.toFixed(2)} (${target.rr2})`;
        if (trailingEl) trailingEl.innerText = opt.trailingStopRecommendation;

        if (elements.btnApplyAiSetup) {
            elements.btnApplyAiSetup.onclick = () => {
                elements.slInput.value = target.sl;
                elements.tpInput.value = target.tp2;
                updateRiskRewardDisplay();
                updateActiveChartLines(target.entry);
                showToast('AI Setup Applied', 'Stop Loss and Take Profit populated from volatility model.', 'success');
            };
        }
    }

    if (elements.btnRunAiAnalysis) elements.btnRunAiAnalysis.addEventListener('click', runAiTradeAnalysis);
    if (elements.btnRunPatternScan) elements.btnRunPatternScan.addEventListener('click', runPatternScan);
    if (elements.btnRunOptimizer) elements.btnRunOptimizer.addEventListener('click', runStrategyOptimization);

    // 10. Drawing Tools Integration
    elements.drawingToolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.drawingToolButtons.forEach(b => b.className = "drawing-tool-btn p-1.5 rounded hover:bg-[#232832] text-gray-400 hover:text-white transition");
            btn.className = "drawing-tool-btn p-1.5 rounded bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/40 transition";
            const tool = btn.dataset.tool;
            drawingManager.setTool(tool);
            showToast('Tool Selected', `Active tool: ${tool.toUpperCase()}`, 'info');
        });
    });

    if (elements.btnClearDrawings) {
        elements.btnClearDrawings.addEventListener('click', () => {
            drawingManager.clearDrawings();
            showToast('Drawings Cleared', 'All overlays and drawings removed from chart.', 'info');
        });
    }

    // 11. Fullscreen & Snapshot Utilities
    if (elements.btnFullscreen) {
        elements.btnFullscreen.addEventListener('click', () => {
            chartManager.toggleFullscreen();
        });
    }

    if (elements.btnSnapshot) {
        elements.btnSnapshot.addEventListener('click', () => {
            const img = drawingManager.captureSnapshot();
            if (img) {
                showToast('Snapshot Captured', 'High-res chart snapshot downloaded as PNG.', 'success');
            }
        });
    }

    // 12. Trading & Order Form Helpers
    function updateActiveChartLines(currentPrice) {
        if (tradingSimulator.positions.length > 0) {
            const active = tradingSimulator.positions[tradingSimulator.positions.length - 1];
            chartManager.setOrderLines({
                entryPrice: active.entryPrice,
                slPrice: active.slPrice,
                tpPrice: active.tpPrice,
                type: active.type
            });
        } else {
            const slVal = parseFloat(elements.slInput.value);
            const tpVal = parseFloat(elements.tpInput.value);
            const hasSl = elements.slToggle.checked && !isNaN(slVal);
            const hasTp = elements.tpToggle.checked && !isNaN(tpVal);

            if (hasSl || hasTp) {
                chartManager.setOrderLines({
                    entryPrice: currentPrice,
                    slPrice: hasSl ? slVal : null,
                    tpPrice: hasTp ? tpVal : null,
                    type: orderSide === 'BUY' ? 'LONG' : 'SHORT'
                });
            } else {
                chartManager.clearOrderLines();
            }
        }
    }

    function syncOrderDefaults() {
        const candle = replayEngine.getCurrentCandle();
        if (!candle) return;

        const spec = dataManager.getSpec();
        const price = candle.close;
        const defaultLot = spec.defaultLot || 1.0;
        elements.lotInput.value = defaultLot;

        const buffer = spec.category === 'crypto' ? (price * 0.015) : (price * 0.005);
        if (orderSide === 'BUY') {
            elements.slInput.value = (price - buffer).toFixed(spec.decimals);
            elements.tpInput.value = (price + (buffer * 2)).toFixed(spec.decimals);
        } else {
            elements.slInput.value = (price + buffer).toFixed(spec.decimals);
            elements.tpInput.value = (price - (buffer * 2)).toFixed(spec.decimals);
        }

        updateRiskRewardDisplay();
        updateActiveChartLines(price);
    }

    function updateRiskRewardDisplay() {
        const candle = replayEngine.getCurrentCandle();
        if (!candle) return;

        const entryPrice = candle.close;
        const slPrice = parseFloat(elements.slInput.value);
        const tpPrice = parseFloat(elements.tpInput.value);
        const lots = parseFloat(elements.lotInput.value) || 0;
        const spec = dataManager.getSpec();

        if (isNaN(slPrice) || isNaN(tpPrice) || lots <= 0) {
            elements.rrPreview.innerText = '1 : 2.0';
            return;
        }

        const slDist = Math.abs(entryPrice - slPrice);
        const tpDist = Math.abs(entryPrice - tpPrice);
        const rr = slDist > 0 ? (tpDist / slDist).toFixed(2) : '0';

        const estLoss = slDist * lots * (spec.contractSize || 1);
        const estProfit = tpDist * lots * (spec.contractSize || 1);

        elements.rrPreview.innerText = `1 : ${rr}`;
        elements.estLossPreview.innerText = `-$${estLoss.toFixed(2)}`;
        elements.estProfitPreview.innerText = `+$${estProfit.toFixed(2)}`;
    }

    // 13. Order Execution Events
    elements.btnBuySide.addEventListener('click', () => {
        orderSide = 'BUY';
        elements.btnBuySide.className = "flex-1 py-2 rounded-lg font-bold text-xs bg-[#00ff66] text-black shadow-lg shadow-[#00ff66]/20 transition flex items-center justify-center space-x-1";
        elements.btnSellSide.className = "flex-1 py-2 rounded-lg font-semibold text-xs bg-[#1f242b] text-gray-400 hover:text-white transition flex items-center justify-center space-x-1";
        elements.btnExecute.innerText = `PLACE BUY (LONG) ORDER`;
        elements.btnExecute.className = "w-full py-2.5 rounded-lg font-bold text-sm bg-[#00ff66] text-black shadow-lg hover:bg-[#1aff75] hover:shadow-[#00ff66]/40 transition uppercase tracking-wider flex items-center justify-center space-x-2";
        syncOrderDefaults();
    });

    elements.btnSellSide.addEventListener('click', () => {
        orderSide = 'SELL';
        elements.btnSellSide.className = "flex-1 py-2 rounded-lg font-bold text-xs bg-white text-black shadow-lg shadow-white/20 transition flex items-center justify-center space-x-1";
        elements.btnBuySide.className = "flex-1 py-2 rounded-lg font-semibold text-xs bg-[#1f242b] text-gray-400 hover:text-white transition flex items-center justify-center space-x-1";
        elements.btnExecute.innerText = `PLACE SELL (SHORT) ORDER`;
        elements.btnExecute.className = "w-full py-2.5 rounded-lg font-bold text-sm bg-white text-black shadow-lg hover:bg-gray-100 hover:shadow-white/40 transition uppercase tracking-wider flex items-center justify-center space-x-2";
        syncOrderDefaults();
    });

    [elements.slInput, elements.tpInput, elements.lotInput].forEach(inp => {
        inp.addEventListener('input', () => {
            updateRiskRewardDisplay();
            const candle = replayEngine.getCurrentCandle();
            if (candle) updateActiveChartLines(candle.close);
        });
    });

    elements.btnExecute.addEventListener('click', () => {
        const candle = replayEngine.getCurrentCandle();
        if (!candle) {
            showToast('Execution Error', 'No active bar available.', 'danger');
            return;
        }

        const size = parseFloat(elements.lotInput.value);
        if (isNaN(size) || size <= 0) {
            showToast('Invalid Lot Size', 'Please enter a valid volume greater than 0.', 'danger');
            return;
        }

        const spec = dataManager.getSpec();
        const slPrice = elements.slToggle.checked ? parseFloat(elements.slInput.value) : null;
        const tpPrice = elements.tpToggle.checked ? parseFloat(elements.tpInput.value) : null;

        const pos = tradingSimulator.openPosition({
            symbol: currentSymbol,
            type: orderSide === 'BUY' ? 'LONG' : 'SHORT',
            size: size,
            entryPrice: candle.close,
            slPrice: slPrice,
            tpPrice: tpPrice,
            spec: spec,
            time: candle.time
        });

        showToast('Order Filled', `${pos.type} ${pos.size} Lots @ ${pos.entryPrice.toFixed(2)}`, 'success');
        updateActiveChartLines(candle.close);
    });

    elements.btnCloseAll.addEventListener('click', () => {
        const candle = replayEngine.getCurrentCandle();
        if (!candle) return;
        const closed = tradingSimulator.closeAll(candle.close, candle.time, 'MANUAL');
        if (closed.length > 0) {
            showToast('Positions Flattened', `Closed ${closed.length} open position(s) at market.`, 'info');
        }
    });

    // 14. Timeframe Toolbar
    elements.tfButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            elements.tfButtons.forEach(b => b.className = "chart-tf-btn px-2 py-0.5 rounded text-xs font-semibold text-gray-400 hover:text-white bg-[#1a1e24] hover:bg-[#252b33] border border-transparent");
            btn.className = "chart-tf-btn px-2 py-0.5 rounded text-xs font-semibold bg-[#00ff66]/15 text-[#00ff66] border border-[#00ff66]/40";

            currentTimeframe = btn.dataset.tf;
            const active = sessionManager.getActiveSession();
            const startTs = active ? active.startTimestamp : dataManager.currentStartTimestamp;
            
            const newCandles = dataManager.loadSessionData(currentSymbol, currentTimeframe, startTs);
            replayEngine.loadData(newCandles, 120);
            refreshIndicatorsOnChart();
            syncOrderDefaults();
            showToast('Timeframe Adjusted', `${currentSymbol} switched to ${currentTimeframe}`, 'info');
        });
    });

    // 15. Replay Buttons
    elements.playBtn.addEventListener('click', () => replayEngine.togglePlay());
    elements.stepFwdBtn.addEventListener('click', () => replayEngine.stepForward());
    elements.stepBackBtn.addEventListener('click', () => replayEngine.stepBackward());
    elements.rewindBtn.addEventListener('click', () => replayEngine.reset());

    elements.speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const spd = btn.dataset.speed;
            replayEngine.setSpeed(spd);
        });
    });

    elements.scrubber.addEventListener('input', (e) => {
        replayEngine.jumpToIndex(parseInt(e.target.value));
    });

    // 16. Trading Simulator Updates
    tradingSimulator.subscribe('onUpdate', state => {
        renderPositionsTable(state.openPositions);
        renderHistoryTable(state.closedTrades);
        updateMetricsAndAnalytics(state);
    });

    function renderPositionsTable(positions) {
        if (!elements.positionsTableBody) return;
        elements.positionsCountBadge.innerText = positions.length;

        if (positions.length === 0) {
            elements.positionsTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-6 text-gray-500 font-mono text-xs">
                        No active open positions.
                    </td>
                </tr>
            `;
            return;
        }

        elements.positionsTableBody.innerHTML = positions.map(pos => {
            const isProfit = pos.unrealizedPnL >= 0;
            const pnlClass = isProfit ? 'text-[#00ff66]' : 'text-[#ff3344]';

            return `
                <tr class="border-b border-[#1f242b] hover:bg-[#1a1e24] transition font-mono text-xs">
                    <td class="py-2.5 px-3 text-gray-400 font-bold">${pos.id}</td>
                    <td class="py-2.5 px-3 text-white font-semibold">${pos.symbol}</td>
                    <td class="py-2.5 px-3 font-bold ${pos.type === 'LONG' ? 'text-[#00ff66]' : 'text-white'}">${pos.type}</td>
                    <td class="py-2.5 px-3 text-gray-300">${pos.size.toFixed(2)}</td>
                    <td class="py-2.5 px-3 text-gray-300">${pos.entryPrice.toFixed(2)}</td>
                    <td class="py-2.5 px-3 text-gray-400">${pos.slPrice ? pos.slPrice.toFixed(2) : '-'}</td>
                    <td class="py-2.5 px-3 text-gray-400">${pos.tpPrice ? pos.tpPrice.toFixed(2) : '-'}</td>
                    <td class="py-2.5 px-3 font-bold ${pnlClass}">
                        ${isProfit ? '+' : ''}$${pos.unrealizedPnL.toFixed(2)}
                    </td>
                    <td class="py-2.5 px-3 text-right">
                        <button data-close-id="${pos.id}" class="btn-close-pos px-2 py-1 rounded bg-[#252b33] hover:bg-[#ff3344]/20 hover:text-[#ff3344] text-gray-400 border border-gray-700 text-[11px] transition">
                            Close
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        document.querySelectorAll('.btn-close-pos').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.closeId;
                const candle = replayEngine.getCurrentCandle();
                if (candle) {
                    tradingSimulator.closePosition(id, candle.close, candle.time, 'MANUAL');
                }
            });
        });
    }

    function renderHistoryTable(closedTrades) {
        if (!elements.historyTableBody) return;
        elements.historyCountBadge.innerText = closedTrades.length;

        if (closedTrades.length === 0) {
            elements.historyTableBody.innerHTML = `
                <tr>
                    <td colspan="9" class="text-center py-5 text-gray-500 font-mono text-xs">
                        No closed trades yet.
                    </td>
                </tr>
            `;
            return;
        }

        elements.historyTableBody.innerHTML = closedTrades.slice().reverse().map(trade => {
            const isProfit = trade.pnl >= 0;
            const pnlClass = isProfit ? 'text-[#00ff66]' : 'text-[#ff3344]';

            return `
                <tr class="border-b border-[#1f242b] hover:bg-[#1a1e24] transition font-mono text-xs">
                    <td class="py-2 px-3 text-gray-400">${trade.id}</td>
                    <td class="py-2 px-3 text-white font-medium">${trade.symbol}</td>
                    <td class="py-2 px-3 font-semibold ${trade.type === 'LONG' ? 'text-[#00ff66]' : 'text-white'}">${trade.type}</td>
                    <td class="py-2 px-3 text-gray-300">${trade.size.toFixed(2)}</td>
                    <td class="py-2 px-3 text-gray-300">${trade.entryPrice.toFixed(2)}</td>
                    <td class="py-2 px-3 text-gray-300">${trade.exitPrice.toFixed(2)}</td>
                    <td class="py-2 px-3 font-bold ${pnlClass}">
                        ${isProfit ? '+' : ''}$${trade.pnl.toFixed(2)}
                    </td>
                    <td class="py-2 px-3 ${pnlClass}">${isProfit ? '+' : ''}${trade.roiPct.toFixed(1)}%</td>
                    <td class="py-2 px-3 text-gray-400">${trade.reason}</td>
                </tr>
            `;
        }).join('');
    }

    function updateMetricsAndAnalytics(state) {
        const metrics = analytics.calculateMetrics(state.closedTrades, tradingSimulator.initialBalance, state.equity);

        if (elements.metricEquity) elements.metricEquity.innerText = `$${state.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (elements.metricBalance) elements.metricBalance.innerText = `$${state.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (elements.metricNetProfit) {
            const isProf = metrics.netProfit >= 0;
            elements.metricNetProfit.innerText = `${isProf ? '+' : ''}$${metrics.netProfit.toFixed(2)} (${isProf ? '+' : ''}${metrics.netProfitPct}%)`;
            elements.metricNetProfit.className = `font-mono text-xs font-extrabold ${isProf ? 'text-[#00ff66]' : 'text-[#ff3344]'}`;
        }
        if (elements.metricWinRate) elements.metricWinRate.innerText = `${metrics.winRate}% (${metrics.winningTrades}W / ${metrics.losingTrades}L)`;
        if (elements.metricProfitFactor) elements.metricProfitFactor.innerText = metrics.profitFactor > 50 ? '∞' : metrics.profitFactor.toFixed(2);
        if (elements.metricSharpe) elements.metricSharpe.innerText = metrics.sharpeRatio.toFixed(2);
        if (elements.metricMaxDrawdown) elements.metricMaxDrawdown.innerText = `-${metrics.maxDrawdownPct}% ($${metrics.maxDrawdownDollar.toFixed(2)})`;
        if (elements.metricTradesCount) elements.metricTradesCount.innerText = metrics.totalTrades;
        if (elements.metricAvgWinLoss) elements.metricAvgWinLoss.innerText = `+$${metrics.avgWin.toFixed(0)} / -$${metrics.avgLoss.toFixed(0)}`;

        analytics.renderEquityCurve(state.closedTrades, tradingSimulator.initialBalance, state.equity);
    }

    // 17. Exports & Reset
    elements.btnExportCsv.addEventListener('click', () => analytics.exportToCSV(tradingSimulator.closedTrades));
    elements.btnExportJson.addEventListener('click', () => {
        const metrics = analytics.calculateMetrics(tradingSimulator.closedTrades, tradingSimulator.initialBalance, tradingSimulator.equity);
        analytics.exportToJSON(tradingSimulator.closedTrades, metrics);
    });

    elements.btnResetAccount.addEventListener('click', () => {
        if (confirm("Reset account balance back to initial capital?")) {
            tradingSimulator.reset(10000);
            chartManager.clearOrderLines();
            showToast('Account Reset', 'Balance restored to $10,000.00', 'info');
        }
    });

    // 18. Global Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
        if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

        if (e.code === 'Space') {
            e.preventDefault();
            if (platformMode === 'REPLAY') replayEngine.togglePlay();
        } else if (e.code === 'ArrowRight') {
            e.preventDefault();
            if (platformMode === 'REPLAY') replayEngine.stepForward();
        } else if (e.code === 'ArrowLeft') {
            e.preventDefault();
            if (platformMode === 'REPLAY') replayEngine.stepBackward();
        } else if (e.key === 'b' || e.key === 'B') {
            elements.btnBuySide.click();
        } else if (e.key === 's' || e.key === 'S') {
            elements.btnSellSide.click();
        } else if (e.key === 'c' || e.key === 'C') {
            elements.btnCloseAll.click();
        } else if (e.key === 'f' || e.key === 'F') {
            chartManager.toggleFullscreen();
        }
    });

    // Initial setup
    refreshIndicatorsOnChart();
    syncOrderDefaults();
    if (window.lucide) window.lucide.createIcons();
});

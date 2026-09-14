// ====================================================
// FALCON TRADE JOURNAL - COMPLETE SCRIPT.JS
// ====================================================

// ----------------------------------------------------
// 1. LOCAL STORAGE HELPERS
// ----------------------------------------------------
function getTrades() {
    return JSON.parse(localStorage.getItem('falcon_trades')) || [];
}

function saveTrades(trades) {
    localStorage.setItem('falcon_trades', JSON.stringify(trades));
}

// ----------------------------------------------------
// 2. AUTHENTICATION & SECURITY LOGIC
// ----------------------------------------------------
function checkAuth() {
    const isLoggedIn = localStorage.getItem('falcon_logged_in') === 'true';
    const currentPath = window.location.pathname;

    // Login වී සිටිය යුතු ආරක්ෂිත Pages
    const protectedPages = ['add-trade.html', 'history.html'];
    const isProtected = protectedPages.some(page => currentPath.includes(page));

    if (!isLoggedIn && isProtected) {
        alert("Please Sign In to access this feature!");
        window.location.href = 'login.html';
    }
}

function logout() {
    localStorage.removeItem('falcon_logged_in');
    localStorage.removeItem('falcon_current_user');
    alert("Logged out successfully!");
    window.location.href = 'index.html';
}

// ----------------------------------------------------
// 3. SETTINGS & PROFILE DROPDOWN MENU
// ----------------------------------------------------
function toggleSettingsDropdown(event) {
    event.stopPropagation();
    let dropdown = document.getElementById('settingsDropdown');

    if (!dropdown) {
        dropdown = createSettingsDropdown();
    } else {
        dropdown.remove();
        dropdown = createSettingsDropdown();
    }

    dropdown.classList.toggle('show');
}

function createSettingsDropdown() {
    const isLoggedIn = localStorage.getItem('falcon_logged_in') === 'true';
    const currentUser = localStorage.getItem('falcon_current_user') || 'Guest';

    const dropdown = document.createElement('div');
    dropdown.id = 'settingsDropdown';
    dropdown.className = 'settings-dropdown';

    let content = '';

    if (isLoggedIn) {
        content = `
            <div class="dropdown-header">
                <div class="profile-avatar">${currentUser.charAt(0).toUpperCase()}</div>
                <div class="profile-info">
                    <span class="profile-name">${currentUser}</span>
                    <span class="profile-status">● Active Account</span>
                </div>
            </div>
            <hr class="dropdown-divider">
            <a href="settings.html" class="dropdown-item">⚙️ Settings & Backup</a>
            <a href="#" onclick="logout()" class="dropdown-item logout-text">🚪 Logout</a>
        `;
    } else {
        content = `
            <div class="dropdown-header">
                <div class="profile-avatar guest">?</div>
                <div class="profile-info">
                    <span class="profile-name">Guest Trader</span>
                    <span class="profile-status offline">● Not Logged In</span>
                </div>
            </div>
            <hr class="dropdown-divider">
            <a href="login.html" class="dropdown-item login-text">🔑 Sign In / Sign Up</a>
        `;
    }

    dropdown.innerHTML = content;

    const settingsBtn = document.getElementById('settingsIconBtn');
    if (settingsBtn) {
        settingsBtn.style.position = 'relative';
        settingsBtn.appendChild(dropdown);
    }

    return dropdown;
}

// Close Dropdown on outside click
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('settingsDropdown');
    const settingsBtn = document.getElementById('settingsIconBtn');
    
    if (dropdown && settingsBtn && !settingsBtn.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

// ----------------------------------------------------
// 4. ADD TRADE FORM LOGIC
// ----------------------------------------------------
function initAddTrade() {
    const addTradeForm = document.getElementById('addTradeForm');
    if (!addTradeForm) return;

    // Default today's date
    const dateInput = document.getElementById('tradeDate');
    if (dateInput) dateInput.valueAsDate = new Date();

    addTradeForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const pnlValue = parseFloat(document.getElementById('pnl').value);

        const newTrade = {
            id: Date.now(),
            date: document.getElementById('tradeDate').value,
            pair: document.getElementById('tradePair').value.toUpperCase(),
            type: document.getElementById('tradeType').value,
            model: document.getElementById('tradeModel').value || 'General',
            pnl: pnlValue,
            status: pnlValue >= 0 ? 'WIN' : 'LOSS'
        };

        const trades = getTrades();
        trades.push(newTrade);
        saveTrades(trades);

        alert('Trade added successfully!');
        window.location.href = 'history.html';
    });
}

// ----------------------------------------------------
// UPDATED RENDER TRADE HISTORY (WITH DELETE BUTTON & ACTION)
// ----------------------------------------------------
function renderTradeHistory() {
    const tableBody = document.getElementById('tradeTableBody') || document.getElementById('recentTradesBody');
    if (!tableBody) return;

    const trades = getTrades();
    tableBody.innerHTML = '';

    const isDashboard = !!document.getElementById('recentTradesBody');

    if (trades.length === 0) {
        const colSpan = isDashboard ? 4 : 7; // Delete Column එකත් එක්ක Total 7 Columns
        tableBody.innerHTML = `<tr><td colspan="${colSpan}" style="text-align:center;">No trades recorded yet.</td></tr>`;
        return;
    }

    const displayTrades = isDashboard ? trades.slice().reverse().slice(0, 5) : trades.slice().reverse();

    displayTrades.forEach(t => {
        const isWin = t.pnl >= 0;
        const row = document.createElement('tr');
        
        // History Page එකට පමණක් Delete Button එක එකතු කිරීම
        const deleteActionTd = isDashboard ? '' : `
            <td>
                <button onclick="deleteTrade(${t.id})" class="btn-delete-icon" title="Delete Trade">
                    🗑️
                </button>
            </td>
        `;

        row.innerHTML = `
            <td>${t.date}</td>
            <td><strong>${t.pair}</strong></td>
            <td>${t.type}</td>
            <td><span class="badge-model">${t.model || 'N/A'}</span></td>
            <td>
                <span class="badge ${isWin ? 'badge-win' : 'badge-loss'}">
                    ${isWin ? 'WIN' : 'LOSS'}
                </span>
            </td>
            <td style="color: ${isWin ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                ${isWin ? '+' : ''}$${Math.abs(t.pnl).toFixed(2)}
            </td>
            ${deleteActionTd}
        `;
        tableBody.appendChild(row);
    });
}

// ----------------------------------------------------
// 6. DASHBOARD & CHARTS LOGIC
// ----------------------------------------------------
function initDashboard() {
    const totalTradesEl = document.getElementById('totalTrades');
    if (!totalTradesEl) return;

    const trades = getTrades();
    let wins = 0;
    let losses = 0;
    let totalPnl = 0;

    const sortedTrades = trades.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    let runningPnl = 0;
    const equityLabels = ['Start'];
    const equityData = [0];

    sortedTrades.forEach((t, index) => {
        totalPnl += t.pnl;
        if (t.pnl >= 0) wins++;
        else losses++;

        runningPnl += t.pnl;
        equityLabels.push(t.date || `Trade ${index + 1}`);
        equityData.push(runningPnl);
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) + '%' : '0%';

    // Summary Cards UI Updates
    document.getElementById('totalTrades').innerText = totalTrades;
    
    const winRateEl = document.getElementById('winRate');
    if (winRateEl) {
        winRateEl.innerText = winRate;
        winRateEl.className = 'value ' + (wins >= losses ? 'profit' : 'loss');
    }

    const totalPnlEl = document.getElementById('totalPnl');
    if (totalPnlEl) {
        totalPnlEl.innerText = (totalPnl >= 0 ? "+$" : "-$") + Math.abs(totalPnl).toFixed(2);
        totalPnlEl.className = 'value ' + (totalPnl >= 0 ? 'profit' : 'loss');
    }

    // Render Recent Table
    renderTradeHistory();

    // Render Charts if Chart.js exists
    if (window.Chart) {
        // Line Chart (Equity Curve)
        const ctxEquity = document.getElementById('equityChart');
        if (ctxEquity) {
            if (window.equityChartInstance) window.equityChartInstance.destroy();
            window.equityChartInstance = new Chart(ctxEquity.getContext('2d'), {
                type: 'line',
                data: {
                    labels: equityLabels,
                    datasets: [{
                        label: 'Cumulative PnL ($)',
                        data: equityData,
                        borderColor: totalPnl >= 0 ? '#27ae60' : '#e74c3c',
                        backgroundColor: totalPnl >= 0 ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // Pie Chart (Win vs Loss)
        const ctxWinLoss = document.getElementById('winLossChart');
        if (ctxWinLoss) {
            if (window.winLossChartInstance) window.winLossChartInstance.destroy();
            window.winLossChartInstance = new Chart(ctxWinLoss.getContext('2d'), {
                type: 'pie',
                data: {
                    labels: ['Wins', 'Losses'],
                    datasets: [{
                        data: [wins, losses],
                        backgroundColor: ['#27ae60', '#e74c3c']
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }
    }
}

// ----------------------------------------------------
// 7. AUTO-RUN INITIALIZATION ON PAGE LOAD
// ----------------------------------------------------
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initAddTrade();
    initDashboard();
    renderTradeHistory();
});

// ----------------------------------------------------
// TRADE DELETE LOGIC
// ----------------------------------------------------
function deleteTrade(tradeId) {
    if (confirm("Are you sure you want to delete this trade?")) {
        let trades = getTrades();
        // තෝරාගත් ID එක හැර අන් සියලුම Trades ඉතිරි කරගැනීම
        trades = trades.filter(t => t.id !== tradeId);
        saveTrades(trades);

        alert("Trade deleted successfully!");
        
        // Table සහ Dashboard auto update කිරීම
        renderTradeHistory();
        if (typeof initDashboard === 'function') {
            initDashboard();
        }
    }
}

// Timeframe Filtering Logic
function filterTimeframe(period, e) {
    // Hide custom date picker if switching to standard periods
    const customWrapper = document.getElementById('customDateWrapper');
    if (customWrapper) customWrapper.style.display = 'none';

    // Tab Button active styling update
    if (e && e.target) {
        document.querySelectorAll('.tf-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
    }

    const trades = JSON.parse(localStorage.getItem('falcon_trades')) || [];
    const now = new Date();

    const filteredTrades = trades.filter(trade => {
        const tradeDate = new Date(trade.date);
        
        if (period === 'daily') {
            return tradeDate.toDateString() === now.toDateString();
        } 
        else if (period === 'weekly') {
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(now.getDate() - 7);
            return tradeDate >= oneWeekAgo && tradeDate <= now;
        } 
        else if (period === 'monthly') {
            return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
        }
        
        return true; // 'all' time
    });

    calculateTimeframeStats(filteredTrades);
}

// Function to calculate and render stats for selected timeframe
function calculateTimeframeStats(tradesList) {
    let totalPnL = 0;
    let wins = 0;
    let totalGrossProfit = 0;
    let totalGrossLoss = 0;

    tradesList.forEach(trade => {
        const pnl = parseFloat(trade.pnl) || 0;
        totalPnL += pnl;

        if (pnl > 0) {
            wins++;
            totalGrossProfit += pnl;
        } else if (pnl < 0) {
            totalGrossLoss += Math.abs(pnl);
        }
    });

    const totalTrades = tradesList.length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) : 0;
    const profitFactor = totalGrossLoss > 0 ? (totalGrossProfit / totalGrossLoss).toFixed(2) : (totalGrossProfit > 0 ? totalGrossProfit.toFixed(2) : "0.00");

    // UI Update
    const pnlElem = document.getElementById('tfNetPnL');
    pnlElem.innerText = (totalPnL >= 0 ? '+$' : '-$') + Math.abs(totalPnL).toFixed(2);
    pnlElem.className = 'tf-card-value ' + (totalPnL >= 0 ? 'profit-text' : 'loss-text');

    document.getElementById('tfTotalTrades').innerText = totalTrades;
    document.getElementById('tfWinRate').innerText = winRate + '%';
    document.getElementById('tfProfitFactor').innerText = profitFactor;
}

// Page load වෙනවිට මුලින්ම 'All Time' stats load කිරීම
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('tfNetPnL')) {
        const trades = JSON.parse(localStorage.getItem('falcon_trades')) || [];
        calculateTimeframeStats(trades);
    }
});

// Toggle Custom Date Picker Input Display
function toggleCustomRange(e) {
    document.querySelectorAll('.tf-btn').forEach(btn => btn.classList.remove('active'));
    if (e && e.target) e.target.classList.add('active');

    const wrapper = document.getElementById('customDateWrapper');
    if (wrapper) {
        wrapper.style.display = wrapper.style.display === 'none' || wrapper.style.display === '' ? 'flex' : 'none';
    }
}

// Apply Custom Date Filter Logic
function applyCustomDateFilter() {
    const startVal = document.getElementById('startDate').value;
    const endVal = document.getElementById('endDate').value;

    if (!startVal || !endVal) {
        alert("Please select both Start Date and End Date!");
        return;
    }

    const startDate = new Date(startVal);
    startDate.setHours(0, 0, 0, 0); // Start of day

    const endDate = new Date(endVal);
    endDate.setHours(23, 59, 59, 999); // End of day

    if (startDate > endDate) {
        alert("Start Date cannot be greater than End Date!");
        return;
    }

    const trades = JSON.parse(localStorage.getItem('falcon_trades')) || [];
    
    const customFiltered = trades.filter(trade => {
        const tradeDate = new Date(trade.date);
        return tradeDate >= startDate && tradeDate <= endDate;
    });

    calculateTimeframeStats(customFiltered);
}
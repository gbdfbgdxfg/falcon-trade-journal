// ----------------------------------------------------
// UPDATED AUTHENTICATION LOGIC
// ----------------------------------------------------

function checkAuth() {
    const isLoggedIn = localStorage.getItem('falcon_logged_in') === 'true';
    const currentPath = window.location.pathname;

    // Login වෙන්න අවශ්‍ය වන ආරක්ෂිත Pages (Protected Pages)
    const protectedPages = ['add-trade.html', 'history.html'];

    // පරිශීලකයා බලන්න හදන Page එක Protected එකක්දැයි පරීක්ෂා කිරීම
    const isProtected = protectedPages.some(page => currentPath.includes(page));

    // Sign In වී නැතිව Protected Page එකකට ගියොත් පමණක් login.html එකට Redirect වේ
    if (!isLoggedIn && isProtected) {
        alert("Please Sign In to access this feature!");
        window.location.href = 'login.html';
    }
}

// Sign In සහ Sign Up Form මාරු කිරීම
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');
    const glider = document.getElementById('tabGlider');

    if (tab === 'login') {
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        if (glider) glider.style.transform = 'translateX(0%)';
    } else {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        if (glider) glider.style.transform = 'translateX(100%)';
    }
}

// Sign In & Sign Up Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();

    // Account Creation
    const regForm = document.getElementById('registerForm');
    if (regForm) {
        regForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = document.getElementById('regUsername').value.trim();
            const pass = document.getElementById('regPassword').value;

            if (user && pass) {
                localStorage.setItem('falcon_user_' + user, pass);
                alert('Account created successfully! Please Sign In.');
                switchAuthTab('login');
                regForm.reset();
            }
        });
    }

    // Login Process
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const user = document.getElementById('loginUsername').value.trim();
            const pass = document.getElementById('loginPassword').value;

            const savedPass = localStorage.getItem('falcon_user_' + user);

            if (savedPass && savedPass === pass) {
                localStorage.setItem('falcon_logged_in', 'true');
                localStorage.setItem('falcon_current_user', user);
                window.location.href = 'index.html';
            } else {
                alert('Invalid Username or Password!');
            }
        });
    }
});

// Log Out Function
function logout() {
    localStorage.removeItem('falcon_logged_in');
    localStorage.removeItem('falcon_current_user');
    window.location.href = 'login.html';

}// LocalStorage එකෙන් Trades ලබාගැනීම
function getTrades() {
    const trades = localStorage.getItem('falcon_trades');
    return trades ? JSON.parse(trades) : [];
}

// Trades Save කිරීම
function saveTrades(trades) {
    localStorage.setItem('falcon_trades', JSON.stringify(trades));
}

// ----------------------------------------------------
// 1. ADD TRADE PAGE LOGIC
// ----------------------------------------------------
function initAddTrade() {
    const form = document.getElementById('addTradeForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const newTrade = {
            id: Date.now(),
            date: document.getElementById('tradeDate').value,
            pair: document.getElementById('tradePair').value.toUpperCase(),
            type: document.getElementById('tradeType').value,
            entry: parseFloat(document.getElementById('entryPrice').value),
            exit: parseFloat(document.getElementById('exitPrice').value),
            pnl: parseFloat(document.getElementById('pnl').value),
            notes: document.getElementById('tradeNotes').value
        };

        const trades = getTrades();
        trades.push(newTrade);
        saveTrades(trades);

        alert('Trade added successfully!');
        form.reset();
    });
}

// ----------------------------------------------------
// 2. DASHBOARD PAGE LOGIC (index.html)
// ----------------------------------------------------
function initDashboard() {
    const totalTradesEl = document.getElementById('totalTrades');
    if (!totalTradesEl) return;

    const trades = getTrades();
    let wins = 0;
    let losses = 0;
    let totalPnl = 0;

    // Date අනුව Trades Sort කිරීම (Equity Curve එක නිවැරදිව ඇඳීමට)
    const sortedTrades = trades.slice().sort((a, b) => new Date(a.date) - new Date(b.date));

    // Equity Curve Data සකස් කිරීම
    let runningPnl = 0;
    const equityLabels = ['Start'];
    const equityData = [0];

    // Pair Breakdown Data සකස් කිරීම
    const pairPnlMap = {};

    sortedTrades.forEach((t, index) => {
        totalPnl += t.pnl;
        if (t.pnl >= 0) wins++;
        else losses++;

        // Cumulative PnL calculation
        runningPnl += t.pnl;
        equityLabels.push(t.date || `Trade ${index + 1}`);
        equityData.push(runningPnl);

        // Pair calculation
        if (!pairPnlMap[t.pair]) {
            pairPnlMap[t.pair] = 0;
        }
        pairPnlMap[t.pair] += t.pnl;
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) + '%' : '0%';

    // Summary Cards UI Update
    totalTradesEl.innerText = totalTrades;
    
    const winRateEl = document.getElementById('winRate');
    winRateEl.innerText = winRate;
    winRateEl.className = 'value ' + (wins >= losses ? 'profit' : 'loss');

    const totalPnlEl = document.getElementById('totalPnl');
    totalPnlEl.innerText = (totalPnl >= 0 ? "+$" : "-$") + Math.abs(totalPnl).toFixed(2);
    totalPnlEl.className = 'value ' + (totalPnl >= 0 ? 'profit' : 'loss');

    // Recent Trades Table (Top 5 Newest)
    const tbody = document.getElementById('recentTradesBody');
    if (tbody) {
        tbody.innerHTML = '';
        const recent = trades.slice().reverse().slice(0, 5);
        if (recent.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No trades recorded yet.</td></tr>';
        } else {
            recent.forEach(t => {
                const row = `<tr>
                    <td>${t.date}</td>
                    <td><strong>${t.pair}</strong></td>
                    <td>${t.type}</td>
                    <td class="${t.pnl >= 0 ? 'profit' : 'loss'}">${t.pnl >= 0 ? '+$' : '-$'}${Math.abs(t.pnl).toFixed(2)}</td>
                </tr>`;
                tbody.innerHTML += row;
            });
        }
    }

    // ----------------------------------------------------
    // CHARTS RENDERING LOGIC
    // ----------------------------------------------------

    // Chart 1: Equity Curve (Line Chart)
    if (window.equityChartInstance) window.equityChartInstance.destroy();
    const ctxEquity = document.getElementById('equityChart');
    if (ctxEquity) {
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
                    tension: 0.3,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // Chart 2: Win / Loss Ratio (Pie Chart)
    if (window.winLossChartInstance) window.winLossChartInstance.destroy();
    const ctxWinLoss = document.getElementById('winLossChart');
    if (ctxWinLoss) {
        window.winLossChartInstance = new Chart(ctxWinLoss.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Wins', 'Losses'],
                datasets: [{
                    data: [wins, losses],
                    backgroundColor: ['#27ae60', '#e74c3c'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }

    // Chart 3: Pair Breakdown (Bar Chart)
    if (window.pairChartInstance) window.pairChartInstance.destroy();
    const ctxPair = document.getElementById('pairChart');
    if (ctxPair) {
        const pairLabels = Object.keys(pairPnlMap);
        const pairValues = Object.values(pairPnlMap);
        const barColors = pairValues.map(v => v >= 0 ? '#27ae60' : '#e74c3c');

        window.pairChartInstance = new Chart(ctxPair.getContext('2d'), {
            type: 'bar',
            data: {
                labels: pairLabels.length > 0 ? pairLabels : ['No Data'],
                datasets: [{
                    label: 'Net PnL ($)',
                    data: pairValues.length > 0 ? pairValues : [0],
                    backgroundColor: barColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }
}

// ----------------------------------------------------
// 3. TRADE HISTORY PAGE LOGIC (history.html)
// ----------------------------------------------------
function initHistory() {
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;

    renderHistoryTable();
}

function renderHistoryTable() {
    const tbody = document.getElementById('historyTableBody');
    const trades = getTrades().slice().reverse(); // Newest first
    tbody.innerHTML = '';

    if (trades.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No trade history available.</td></tr>';
        return;
    }

    trades.forEach(t => {
        const row = `<tr>
            <td>${t.date}</td>
            <td><strong>${t.pair}</strong></td>
            <td>${t.type}</td>
            <td>${t.entry}</td>
            <td>${t.exit}</td>
            <td class="${t.pnl >= 0 ? 'profit' : 'loss'}">${t.pnl >= 0 ? '+$' : '-$'}${Math.abs(t.pnl).toFixed(2)}</td>
            <td>${t.notes || '-'}</td>
            <td><button class="btn-delete" onclick="deleteTrade(${t.id})">Delete</button></td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

function deleteTrade(id) {
    if (confirm("Are you sure you want to delete this trade?")) {
        let trades = getTrades();
        trades = trades.filter(t => t.id !== id);
        saveTrades(trades);
        renderHistoryTable();
    }
}

// Auto Init Page Functions
document.addEventListener('DOMContentLoaded', function() {
    initAddTrade();
    initDashboard();
    initHistory();
});

// Settings Dropdown Toggle & Dynamic Menu Rendering
function toggleSettingsDropdown(event) {
    event.stopPropagation();
    let dropdown = document.getElementById('settingsDropdown');
    
    if (!dropdown) {
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
                    <span class="profile-status">● Logged In</span>
                </div>
            </div>
            <hr class="dropdown-divider">
            <a href="settings.html" class="dropdown-item">👤 View Profile & Backup</a>
            <a href="#" onclick="logout()" class="dropdown-item logout-text">🚪 Logout</a>
        `;
    } else {
        content = `
            <div class="dropdown-header">
                <div class="profile-avatar guest">?</div>
                <div class="profile-info">
                    <span class="profile-name">Guest User</span>
                    <span class="profile-status offline">● Not Signed In</span>
                </div>
            </div>
            <hr class="dropdown-divider">
            <a href="login.html" class="dropdown-item login-text">🔑 Sign In / Register</a>
        `;
    }

    dropdown.innerHTML = content;
    
    // Navbar එක ඇතුළට Dropdown එක Inject කිරීම
    const settingsBtn = document.getElementById('settingsIconBtn');
    settingsBtn.style.position = 'relative';
    settingsBtn.appendChild(dropdown);

    return dropdown;
}

// පිටත තැනක් ක්ලික් කළ විට Dropdown එක Auto Hide වීම
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('settingsDropdown');
    const settingsBtn = document.getElementById('settingsIconBtn');
    
    if (dropdown && !settingsBtn.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});
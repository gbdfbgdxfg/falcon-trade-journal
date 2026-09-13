// LocalStorage එකෙන් Trades ලබාගැනීම
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
    if (!totalTradesEl) return; // Dashboard නොවන පිටු සඳහා run නොවේ

    const trades = getTrades();
    let wins = 0;
    let losses = 0;
    let totalPnl = 0;

    trades.forEach(t => {
        totalPnl += t.pnl;
        if (t.pnl >= 0) wins++;
        else losses++;
    });

    const totalTrades = trades.length;
    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) + '%' : '0%';

    // UI Updates
    totalTradesEl.innerText = totalTrades;
    
    const winRateEl = document.getElementById('winRate');
    winRateEl.innerText = winRate;
    winRateEl.className = 'value ' + (wins >= losses ? 'profit' : 'loss');

    const totalPnlEl = document.getElementById('totalPnl');
    totalPnlEl.innerText = (totalPnl >= 0 ? "+$" : "-$") + Math.abs(totalPnl).toFixed(2);
    totalPnlEl.className = 'value ' + (totalPnl >= 0 ? 'profit' : 'loss');

    // Recent Trades Table (Top 5)
    const tbody = document.getElementById('recentTradesBody');
    tbody.innerHTML = '';
    
    const recent = trades.slice().reverse().slice(0, 5);
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No trades recorded yet.</td></tr>';
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

    // Dynamic Chart Update
    if (window.winLossChartInstance) {
        window.winLossChartInstance.destroy();
    }

    const ctx = document.getElementById('winLossChart').getContext('2d');
    window.winLossChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: ['Winning Trades', 'Losing Trades'],
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
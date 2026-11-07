/**
 * dashboard.js
 * Renders the Dashboard overview page: KPI stat cards, sales/category
 * charts, recent orders, top products and a performance summary — all
 * computed live from DB (mock data + any user edits).
 */

function computeDashboardStats() {
  const totalSales = DB.orders.reduce((sum, o) => sum + (o.status !== 'Cancelled' ? o.total : 0), 0);
  const totalOrders = DB.orders.length;
  const totalCustomers = DB.customers.length;
  const totalProducts = DB.products.length;

  return { totalSales, totalOrders, totalCustomers, totalProducts };
}

function renderStatCard({ icon, label, value, trend }) {
  const trendUp = trend >= 0;
  return `
    <div class="stat-card">
      <div class="stat-card__icon" data-icon="${icon}"></div>
      <div class="stat-card__body">
        <span class="stat-card__label">${label}</span>
        <span class="stat-card__value">${value}</span>
        <span class="stat-card__trend ${trendUp ? 'is-up' : 'is-down'}">
          <span data-icon="${trendUp ? 'arrow-up' : 'arrow-down'}"></span>${Math.abs(trend)}%
        </span>
      </div>
    </div>
  `;
}

function renderDashboard() {
  const stats = computeDashboardStats();

  const statGrid = document.getElementById('dashStats');
  statGrid.innerHTML = [
    renderStatCard({ icon: 'chart', label: 'Total Sales', value: formatCurrency(stats.totalSales), trend: 12 }),
    renderStatCard({ icon: 'cart', label: 'Total Orders', value: formatNumber(stats.totalOrders), trend: 6 }),
    renderStatCard({ icon: 'users', label: 'Total Customers', value: formatNumber(stats.totalCustomers), trend: 15 }),
    renderStatCard({ icon: 'box', label: 'Total Products', value: formatNumber(stats.totalProducts), trend: 4 }),
  ].join('');
  hydrateIcons(statGrid);

  renderDashboardSalesChart('year');
  renderDashboardCategoryChart();
  renderDashboardRecentOrders();
  renderDashboardTopProducts();
  renderDashboardPerformanceSummary(stats);

  document.getElementById('dashSalesRange').onchange = (e) => renderDashboardSalesChart(e.target.value);
}

function getChartColors() {
  const styles = getComputedStyle(document.body);
  return {
    primary: styles.getPropertyValue('--accent').trim(),
    primarySoft: styles.getPropertyValue('--accent-soft').trim(),
    grid: styles.getPropertyValue('--chart-grid').trim(),
    text: styles.getPropertyValue('--text-secondary').trim(),
    palette: ['#3B6FE0', '#22C1A0', '#F5A623', '#E0563B', '#8B5CF6', '#38BDF8'],
  };
}

function destroyChart(id) {
  if (App.charts[id]) {
    App.charts[id].destroy();
    delete App.charts[id];
  }
}

/**
 * Chart.js is vendored locally. If it fails to load (missing file,
 * a blocked script, etc.) we must not let that throw and
 * silently kill the rest of the page's rendering — every chart canvas
 * falls back to a friendly inline message instead.
 */
function isChartLibAvailable() {
  return typeof Chart !== 'undefined';
}

function showChartFallback(canvas, message) {
  if (!canvas || !canvas.parentElement) return;
  let note = canvas.parentElement.querySelector('.chart-fallback');
  if (!note) {
    note = document.createElement('div');
    note.className = 'chart-fallback';
    canvas.parentElement.appendChild(note);
  }
  note.textContent = message;
  canvas.style.display = 'none';
}

function clearChartFallback(canvas) {
  if (!canvas || !canvas.parentElement) return;
  const note = canvas.parentElement.querySelector('.chart-fallback');
  if (note) note.remove();
  canvas.style.display = '';
}

function renderDashboardSalesChart(range) {
  const colors = getChartColors();
  let data = DB.monthlyRevenue;
  if (range === '6m') data = DB.monthlyRevenue.slice(-6);
  if (range === '30d') data = DB.monthlyRevenue.slice(-1);

  const ctx = document.getElementById('chartDashSales');
  destroyChart('chartDashSales');

  if (!isChartLibAvailable()) {
    showChartFallback(ctx, 'Chart library could not be loaded. Check that js/vendor/chart.umd.min.js exists and refresh.');
    return;
  }
  clearChartFallback(ctx);

  try {
  App.charts.chartDashSales = new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map((d) => d.label),
      datasets: [{
        label: 'Revenue',
        data: data.map((d) => d.revenue),
        borderColor: colors.primary,
        backgroundColor: colors.primarySoft,
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: colors.primary,
      }],
    },
    options: chartBaseOptions(colors, { currency: true }),
  });
  } catch (e) {
    console.error('Failed to render sales chart:', e);
    showChartFallback(ctx, 'This chart could not be displayed.');
  }
}

function renderDashboardCategoryChart() {
  const colors = getChartColors();
  const totals = {};
  DB.products.forEach((p) => { totals[p.category] = (totals[p.category] || 0) + p.sold * p.price; });
  const labels = Object.keys(totals);
  const values = Object.values(totals);

  const ctx = document.getElementById('chartDashCategory');
  destroyChart('chartDashCategory');

  if (!isChartLibAvailable()) {
    showChartFallback(ctx, 'Chart library could not be loaded. Check that js/vendor/chart.umd.min.js exists and refresh.');
    return;
  }
  clearChartFallback(ctx);

  try {
    App.charts.chartDashCategory = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors.palette, borderWidth: 0 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'bottom', labels: { color: colors.text, boxWidth: 10, padding: 14, font: { family: 'Plus Jakarta Sans' } } },
        },
      },
    });
  } catch (e) {
    console.error('Failed to render category chart:', e);
    showChartFallback(ctx, 'This chart could not be displayed.');
  }
}

function chartBaseOptions(colors, { currency = false } = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: currency ? { label: (ctx) => ' ' + formatCurrency(ctx.parsed.y) } : undefined,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: colors.text, font: { family: 'Plus Jakarta Sans' } } },
      y: {
        grid: { color: colors.grid },
        ticks: {
          color: colors.text,
          font: { family: 'Plus Jakarta Sans' },
          callback: (val) => currency ? currencySymbol() + (val >= 1000 ? (val / 1000) + 'k' : val) : val,
        },
      },
    },
  };
}

function renderDashboardRecentOrders() {
  const recent = [...DB.orders].slice(0, 5);
  const wrap = document.getElementById('dashRecentOrders');
  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr>
      </thead>
      <tbody>
        ${recent.map((o) => `
          <tr>
            <td class="mono">${o.id}</td>
            <td>${escapeHtml(o.customerName)}</td>
            <td>${formatDate(o.date)}</td>
            <td>${formatCurrency(o.total)}</td>
            <td><span class="badge ${statusClass(o.status)}">${o.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function renderDashboardTopProducts() {
  const top = [...DB.products].sort((a, b) => b.sold - a.sold).slice(0, 5);
  const wrap = document.getElementById('dashTopProducts');
  wrap.innerHTML = top.map((p, i) => `
    <div class="top-product-row">
      <span class="top-product-rank">${i + 1}</span>
      ${productThumbHtml(p, 'sm')}
      <div class="top-product-info">
        <span class="top-product-name">${escapeHtml(p.name)}</span>
        <span class="top-product-sold">${p.sold} sold</span>
      </div>
      <span class="top-product-revenue">${formatCurrency(p.sold * p.price)}</span>
    </div>
  `).join('');
  hydrateIcons(wrap);
}

function renderDashboardPerformanceSummary(stats) {
  const avgOrderValue = stats.totalOrders ? stats.totalSales / stats.totalOrders : 0;
  const activeCustomers = DB.customers.filter((c) => c.status === 'Active').length;
  const lowStockCount = DB.products.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock').length;
  const deliveredRate = DB.orders.length
    ? Math.round((DB.orders.filter((o) => o.status === 'Delivered').length / DB.orders.length) * 100)
    : 0;

  const wrap = document.getElementById('dashPerfSummary');
  wrap.innerHTML = `
    <div class="perf-item">
      <span class="perf-item__label">Average Order Value</span>
      <span class="perf-item__value">${formatCurrency(avgOrderValue)}</span>
    </div>
    <div class="perf-item">
      <span class="perf-item__label">Active Customers</span>
      <span class="perf-item__value">${formatNumber(activeCustomers)} <small>/ ${formatNumber(DB.customers.length)}</small></span>
    </div>
    <div class="perf-item">
      <span class="perf-item__label">Delivery Success Rate</span>
      <span class="perf-item__value">${deliveredRate}%</span>
    </div>
    <div class="perf-item">
      <span class="perf-item__label">Products Needing Attention</span>
      <span class="perf-item__value ${lowStockCount > 0 ? 'is-warning' : ''}">${lowStockCount}</span>
    </div>
  `;
}

pageRenderers.dashboard = renderDashboard;

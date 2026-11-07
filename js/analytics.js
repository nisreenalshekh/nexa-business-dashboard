/**
 * analytics.js
 * Analytics page: date-range driven charts (revenue, orders, customer
 * growth, category performance) plus summary statistics.
 */

function getAnalyticsRangeData(range) {
  if (range === '30d') return DB.monthlyRevenue.slice(-1);
  if (range === '6m') return DB.monthlyRevenue.slice(-6);
  return DB.monthlyRevenue;
}

function renderAnalytics() {
  const range = document.getElementById('analyticsRange').value || '6m';
  renderAnalyticsStats(range);
  renderAnalyticsCharts(range);

  document.getElementById('analyticsRange').onchange = (e) => {
    renderAnalyticsStats(e.target.value);
    renderAnalyticsCharts(e.target.value);
  };
}

function renderAnalyticsStats(range) {
  const data = getAnalyticsRangeData(range);
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);
  const newCustomers = data.reduce((s, d) => s + d.customers, 0);
  const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

  const grid = document.getElementById('analyticsStats');
  grid.innerHTML = [
    renderStatCard({ icon: 'chart', label: 'Total Revenue', value: formatCurrency(totalRevenue), trend: 12 }),
    renderStatCard({ icon: 'cart', label: 'Total Orders', value: formatNumber(totalOrders), trend: 8 }),
    renderStatCard({ icon: 'users', label: 'New Customers', value: formatNumber(newCustomers), trend: 15 }),
    renderStatCard({ icon: 'box', label: 'Avg. Order Value', value: formatCurrency(avgOrderValue), trend: 4 }),
  ].join('');
  hydrateIcons(grid);
}

function renderAnalyticsCharts(range) {
  const data = getAnalyticsRangeData(range);
  const colors = getChartColors();

  const revenueCanvas = document.getElementById('chartAnalyticsRevenue');
  const ordersCanvas = document.getElementById('chartAnalyticsOrders');
  const customersCanvas = document.getElementById('chartAnalyticsCustomers');
  const categoryCanvas = document.getElementById('chartAnalyticsCategory');

  destroyChart('chartAnalyticsRevenue');
  destroyChart('chartAnalyticsOrders');
  destroyChart('chartAnalyticsCustomers');
  destroyChart('chartAnalyticsCategory');

  if (!isChartLibAvailable()) {
    const msg = 'Chart library could not be loaded. Check your internet connection and refresh.';
    [revenueCanvas, ordersCanvas, customersCanvas, categoryCanvas].forEach((c) => showChartFallback(c, msg));
    return;
  }
  [revenueCanvas, ordersCanvas, customersCanvas, categoryCanvas].forEach(clearChartFallback);

  try {
    App.charts.chartAnalyticsRevenue = new Chart(revenueCanvas, {
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
        }],
      },
      options: chartBaseOptions(colors, { currency: true }),
    });
  } catch (e) { console.error('Failed to render revenue chart:', e); showChartFallback(revenueCanvas, 'This chart could not be displayed.'); }

  try {
    App.charts.chartAnalyticsOrders = new Chart(ordersCanvas, {
      type: 'bar',
      data: {
        labels: data.map((d) => d.label),
        datasets: [{ label: 'Orders', data: data.map((d) => d.orders), backgroundColor: colors.palette[1], borderRadius: 6, maxBarThickness: 34 }],
      },
      options: chartBaseOptions(colors),
    });
  } catch (e) { console.error('Failed to render orders chart:', e); showChartFallback(ordersCanvas, 'This chart could not be displayed.'); }

  try {
    App.charts.chartAnalyticsCustomers = new Chart(customersCanvas, {
      type: 'line',
      data: {
        labels: data.map((d) => d.label),
        datasets: [{
          label: 'New Customers',
          data: data.map((d) => d.customers),
          borderColor: colors.palette[2],
          backgroundColor: 'transparent',
          tension: 0.4,
          pointRadius: 3,
        }],
      },
      options: chartBaseOptions(colors),
    });
  } catch (e) { console.error('Failed to render customer growth chart:', e); showChartFallback(customersCanvas, 'This chart could not be displayed.'); }

  try {
    const categoryTotals = {};
    DB.products.forEach((p) => { categoryTotals[p.category] = (categoryTotals[p.category] || 0) + p.sold; });
    App.charts.chartAnalyticsCategory = new Chart(categoryCanvas, {
      type: 'bar',
      data: {
        labels: Object.keys(categoryTotals),
        datasets: [{ label: 'Units Sold', data: Object.values(categoryTotals), backgroundColor: colors.palette, borderRadius: 6, maxBarThickness: 34 }],
      },
      options: { ...chartBaseOptions(colors), indexAxis: 'y' },
    });
  } catch (e) { console.error('Failed to render category performance chart:', e); showChartFallback(categoryCanvas, 'This chart could not be displayed.'); }
}

pageRenderers.analytics = renderAnalytics;

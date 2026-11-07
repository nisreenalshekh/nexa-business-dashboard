/**
 * reports.js
 * Reports page: four tabbed report views built from the same DB, with a
 * CSV export and browser print action for whichever report is active.
 */

const ReportsState = { active: 'sales' };

const REPORT_TITLES = {
  sales: 'Sales Report',
  products: 'Product Report',
  customers: 'Customer Report',
  revenue: 'Revenue Summary',
};

function renderReports() {
  document.querySelectorAll('.report-tab').forEach((tab) => {
    tab.classList.toggle('is-active', tab.dataset.report === ReportsState.active);
    tab.onclick = () => {
      ReportsState.active = tab.dataset.report;
      renderReports();
    };
  });

  document.getElementById('reportTitle').textContent = REPORT_TITLES[ReportsState.active];
  document.getElementById('reportBody').innerHTML = buildReportBody(ReportsState.active);

  document.getElementById('btnPrintReport').onclick = () => window.print();
  document.getElementById('btnExportReport').onclick = () => exportReportCsv(ReportsState.active);
}

function buildReportBody(type) {
  if (type === 'sales') {
    const rows = DB.orders.slice(0, 20);
    return `
      <table class="data-table">
        <thead><tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Status</th></tr></thead>
        <tbody>
          ${rows.map((o) => `
            <tr>
              <td class="mono">${o.id}</td>
              <td>${escapeHtml(o.customerName)}</td>
              <td>${formatDate(o.date)}</td>
              <td>${o.items.reduce((s, i) => s + i.qty, 0)}</td>
              <td>${formatCurrency(o.total)}</td>
              <td><span class="badge ${statusClass(o.status)}">${o.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  if (type === 'products') {
    const rows = [...DB.products].sort((a, b) => b.sold - a.sold);
    return `
      <table class="data-table">
        <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Units Sold</th><th>Revenue</th></tr></thead>
        <tbody>
          ${rows.map((p) => `
            <tr>
              <td>${escapeHtml(p.name)}</td>
              <td>${escapeHtml(p.category)}</td>
              <td>${formatCurrency(p.price)}</td>
              <td>${p.stock}</td>
              <td>${p.sold}</td>
              <td>${formatCurrency(p.sold * p.price)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  if (type === 'customers') {
    const rows = [...DB.customers].sort((a, b) => b.totalSpent - a.totalSpent);
    return `
      <table class="data-table">
        <thead><tr><th>Customer</th><th>Email</th><th>Orders</th><th>Total Spent</th><th>Status</th></tr></thead>
        <tbody>
          ${rows.map((c) => `
            <tr>
              <td>${escapeHtml(c.name)}</td>
              <td>${escapeHtml(c.email)}</td>
              <td>${c.totalOrders}</td>
              <td>${formatCurrency(c.totalSpent)}</td>
              <td><span class="badge ${statusClass(c.status)}">${c.status}</span></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // revenue summary
  const rows = DB.monthlyRevenue;
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  return `
    <div class="stat-grid stat-grid--report">
      <div class="stat-card"><div class="stat-card__body"><span class="stat-card__label">Total Revenue (12mo)</span><span class="stat-card__value">${formatCurrency(totalRevenue)}</span></div></div>
      <div class="stat-card"><div class="stat-card__body"><span class="stat-card__label">Total Orders (12mo)</span><span class="stat-card__value">${formatNumber(totalOrders)}</span></div></div>
      <div class="stat-card"><div class="stat-card__body"><span class="stat-card__label">Avg. Monthly Revenue</span><span class="stat-card__value">${formatCurrency(totalRevenue / rows.length)}</span></div></div>
    </div>
    <table class="data-table">
      <thead><tr><th>Month</th><th>Revenue</th><th>Orders</th><th>New Customers</th></tr></thead>
      <tbody>
        ${rows.map((r) => `
          <tr>
            <td>${r.label}</td>
            <td>${formatCurrency(r.revenue)}</td>
            <td>${r.orders}</td>
            <td>${r.customers}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function exportReportCsv(type) {
  let headers = [];
  let rows = [];

  if (type === 'sales') {
    headers = ['Order ID', 'Customer', 'Date', 'Items', 'Total', 'Status'];
    rows = DB.orders.map((o) => [o.id, o.customerName, o.date, o.items.reduce((s, i) => s + i.qty, 0), o.total, o.status]);
  } else if (type === 'products') {
    headers = ['Product', 'Category', 'Price', 'Stock', 'Units Sold', 'Revenue'];
    rows = DB.products.map((p) => [p.name, p.category, p.price, p.stock, p.sold, (p.sold * p.price).toFixed(2)]);
  } else if (type === 'customers') {
    headers = ['Customer', 'Email', 'Orders', 'Total Spent', 'Status'];
    rows = DB.customers.map((c) => [c.name, c.email, c.totalOrders, c.totalSpent, c.status]);
  } else {
    headers = ['Month', 'Revenue', 'Orders', 'New Customers'];
    rows = DB.monthlyRevenue.map((r) => [r.label, r.revenue, r.orders, r.customers]);
  }

  const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `nexa-${type}-report.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast('Report exported as CSV');
}

pageRenderers.reports = renderReports;

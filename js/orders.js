/**
 * orders.js
 * Orders page: search by ID/customer, status + date filtering, pagination,
 * and a read-only order details modal with status update capability.
 */

const OrdersState = { page: 1, pageSize: 6, search: '', status: '', date: '' };

function getFilteredOrders() {
  let list = [...DB.orders];
  if (OrdersState.search) {
    const term = OrdersState.search.toLowerCase();
    list = list.filter((o) => o.id.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term));
  }
  if (OrdersState.status) list = list.filter((o) => o.status === OrdersState.status);
  if (OrdersState.date) list = list.filter((o) => o.date === OrdersState.date);
  return list;
}

function renderOrders() {
  renderOrdersTable();

  document.getElementById('orderSearch').oninput = (e) => {
    OrdersState.search = e.target.value;
    OrdersState.page = 1;
    renderOrdersTable();
  };
  document.getElementById('orderStatusFilter').onchange = (e) => {
    OrdersState.status = e.target.value;
    OrdersState.page = 1;
    renderOrdersTable();
  };
  document.getElementById('orderDateFilter').onchange = (e) => {
    OrdersState.date = e.target.value;
    OrdersState.page = 1;
    renderOrdersTable();
  };
}

function renderOrdersTable() {
  const all = getFilteredOrders();
  const totalPages = Math.max(1, Math.ceil(all.length / OrdersState.pageSize));
  OrdersState.page = Math.min(OrdersState.page, totalPages);
  const start = (OrdersState.page - 1) * OrdersState.pageSize;
  const pageItems = all.slice(start, start + OrdersState.pageSize);

  const wrap = document.getElementById('ordersTableWrap');

  if (all.length === 0) {
    wrap.innerHTML = emptyState('cart', 'No orders found', 'Try adjusting your search, status or date filters.');
    hydrateIcons(wrap);
    document.getElementById('ordersPagination').innerHTML = '';
    return;
  }

  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr><th>Order ID</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        ${pageItems.map((o) => `
          <tr>
            <td class="mono">${o.id}</td>
            <td>${escapeHtml(o.customerName)}</td>
            <td>${formatDate(o.date)}</td>
            <td>${o.items.reduce((s, i) => s + i.qty, 0)} items</td>
            <td>${formatCurrency(o.total)}</td>
            <td><span class="badge ${statusClass(o.paymentStatus)}">${o.paymentStatus}</span></td>
            <td><span class="badge ${statusClass(o.status)}">${o.status}</span></td>
            <td>
              <button class="btn btn--ghost btn--sm" data-view="${o.id}">View</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  hydrateIcons(wrap);

  wrap.querySelectorAll('[data-view]').forEach((btn) => btn.addEventListener('click', () => openOrderModal(btn.dataset.view)));

  renderPagination(document.getElementById('ordersPagination'), all.length, OrdersState.pageSize, OrdersState.page, (p) => {
    OrdersState.page = p;
    renderOrdersTable();
  });
}

function openOrderModal(orderId) {
  const order = DB.orders.find((o) => o.id === orderId);
  if (!order) return;
  const customer = DB.customers.find((c) => c.id === order.customerId);

  openModal(`
    <div class="modal__head">
      <h3>Order ${order.id}</h3>
      <button class="icon-btn" id="modalCloseBtn"><span data-icon="close"></span></button>
    </div>
    <div class="modal__body">
      <div class="order-detail-grid">
        <div>
          <span class="detail-label">Customer</span>
          <span class="detail-value">${escapeHtml(customer ? customer.name : order.customerName)}</span>
        </div>
        <div>
          <span class="detail-label">Date</span>
          <span class="detail-value">${formatDate(order.date)}</span>
        </div>
        <div>
          <span class="detail-label">Payment Method</span>
          <span class="detail-value">${escapeHtml(order.paymentMethod)}</span>
        </div>
        <div>
          <span class="detail-label">Payment Status</span>
          <span class="badge ${statusClass(order.paymentStatus)}">${order.paymentStatus}</span>
        </div>
      </div>

      <h4 class="order-items-title">Items</h4>
      <table class="data-table data-table--compact">
        <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
        <tbody>
          ${order.items.map((i) => `
            <tr>
              <td>${escapeHtml(i.name)}</td>
              <td>${i.qty}</td>
              <td>${formatCurrency(i.price)}</td>
              <td>${formatCurrency(i.price * i.qty)}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="3">Total</td><td>${formatCurrency(order.total)}</td></tr>
        </tfoot>
      </table>

      <div class="form-group">
        <label>Order Status</label>
        <select id="orderStatusSelect">
          ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === order.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>

      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" id="modalCancelBtn">Close</button>
        <button type="button" class="btn btn--primary" id="saveOrderStatusBtn">Update Status</button>
      </div>
    </div>
  `, { size: 'lg' });

  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);
  document.getElementById('saveOrderStatusBtn').addEventListener('click', () => {
    const newStatus = document.getElementById('orderStatusSelect').value;
    order.status = newStatus;
    order.paymentStatus = newStatus === 'Cancelled' ? 'Refunded' : (newStatus === 'Pending' ? 'Unpaid' : 'Paid');
    persist();
    closeModal();
    renderOrdersTable();
    showToast(`Order ${order.id} marked as ${newStatus}`);
  });
}

pageRenderers.orders = renderOrders;

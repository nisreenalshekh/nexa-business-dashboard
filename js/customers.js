/**
 * customers.js
 * Customers page: searchable / filterable / sortable table with pagination,
 * plus Add and Edit modals backed by DB.customers.
 */

const CustomersState = { page: 1, pageSize: 6, search: '', status: '', sort: 'newest' };

function getFilteredCustomers() {
  let list = [...DB.customers];
  if (CustomersState.search) {
    const term = CustomersState.search.toLowerCase();
    list = list.filter((c) => c.name.toLowerCase().includes(term) || c.email.toLowerCase().includes(term));
  }
  if (CustomersState.status) list = list.filter((c) => c.status === CustomersState.status);

  switch (CustomersState.sort) {
    case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'spent': list.sort((a, b) => b.totalSpent - a.totalSpent); break;
    case 'orders': list.sort((a, b) => b.totalOrders - a.totalOrders); break;
    default: list.sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1));
  }
  return list;
}

function renderCustomers() {
  renderCustomersTable();

  document.getElementById('customerSearch').oninput = (e) => {
    CustomersState.search = e.target.value;
    CustomersState.page = 1;
    renderCustomersTable();
  };
  document.getElementById('customerStatusFilter').onchange = (e) => {
    CustomersState.status = e.target.value;
    CustomersState.page = 1;
    renderCustomersTable();
  };
  document.getElementById('customerSort').onchange = (e) => {
    CustomersState.sort = e.target.value;
    renderCustomersTable();
  };
  document.getElementById('btnAddCustomer').onclick = () => openCustomerModal();
}

function renderCustomersTable() {
  const all = getFilteredCustomers();
  const totalPages = Math.max(1, Math.ceil(all.length / CustomersState.pageSize));
  CustomersState.page = Math.min(CustomersState.page, totalPages);
  const start = (CustomersState.page - 1) * CustomersState.pageSize;
  const pageItems = all.slice(start, start + CustomersState.pageSize);

  const wrap = document.getElementById('customersTableWrap');

  if (all.length === 0) {
    wrap.innerHTML = emptyState('users', 'No customers found', 'Try adjusting your search or filters, or add a new customer.');
    hydrateIcons(wrap);
    document.getElementById('customersPagination').innerHTML = '';
    return;
  }

  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr><th>Customer</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Status</th><th>Actions</th></tr>
      </thead>
      <tbody>
        ${pageItems.map((c) => `
          <tr>
            <td>
              <div class="cell-person">
                <img class="avatar avatar--sm" src="${c.avatar}" alt="" data-name="${escapeHtml(c.name)}" />
                <span class="cell-strong">${escapeHtml(c.name)}</span>
              </div>
            </td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.phone)}</td>
            <td>${c.totalOrders}</td>
            <td>${formatCurrency(c.totalSpent)}</td>
            <td><span class="badge ${statusClass(c.status)}">${c.status}</span></td>
            <td>
              <div class="row-actions">
                <button class="icon-btn icon-btn--sm" data-edit="${c.id}" title="Edit"><span data-icon="edit"></span></button>
                <button class="icon-btn icon-btn--sm icon-btn--danger" data-delete="${c.id}" title="Delete"><span data-icon="trash"></span></button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  hydrateIcons(wrap);

  wrap.querySelectorAll('[data-edit]').forEach((btn) => btn.addEventListener('click', () => openCustomerModal(btn.dataset.edit)));
  wrap.querySelectorAll('[data-delete]').forEach((btn) => btn.addEventListener('click', () => deleteCustomer(btn.dataset.delete)));

  renderPagination(document.getElementById('customersPagination'), all.length, CustomersState.pageSize, CustomersState.page, (p) => {
    CustomersState.page = p;
    renderCustomersTable();
  });
}

function openCustomerModal(customerId) {
  const editing = !!customerId;
  const customer = editing ? DB.customers.find((c) => c.id === customerId) : null;

  openModal(`
    <div class="modal__head">
      <h3>${editing ? 'Edit Customer' : 'Add Customer'}</h3>
      <button class="icon-btn" id="modalCloseBtn"><span data-icon="close"></span></button>
    </div>
    <form id="customerForm" class="modal__body" novalidate>
      <div class="form-group">
        <label>Full Name</label>
        <input type="text" name="name" data-required data-error-for="name" value="${editing ? escapeHtml(customer.name) : ''}" placeholder="e.g. Sarah Ahmed" />
        <span class="form-error" data-error-for="name">Full name is required.</span>
      </div>
      <div class="form-group">
        <label>Email Address</label>
        <input type="email" name="email" data-required data-validate="email" data-error-for="email" value="${editing ? escapeHtml(customer.email) : ''}" placeholder="name@example.com" />
        <span class="form-error" data-error-for="email">Enter a valid email address.</span>
      </div>
      <div class="form-group">
        <label>Phone Number</label>
        <input type="tel" name="phone" data-required data-validate="phone" data-error-for="phone" value="${editing ? escapeHtml(customer.phone) : ''}" placeholder="05XXXXXXXX" />
        <span class="form-error" data-error-for="phone">Enter a valid phone number.</span>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select name="status">
          <option value="Active" ${editing && customer.status === 'Active' ? 'selected' : ''}>Active</option>
          <option value="Inactive" ${editing && customer.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" id="modalCancelBtn">Cancel</button>
        <button type="submit" class="btn btn--primary">${editing ? 'Save Changes' : 'Add Customer'}</button>
      </div>
    </form>
  `);

  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);

  document.getElementById('customerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form)) return;

    const payload = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      status: form.status.value,
    };

    if (editing) {
      Object.assign(customer, payload);
      showToast('Customer updated successfully');
    } else {
      DB.customers.unshift({
        id: nextId('C', DB.customers),
        totalOrders: 0,
        totalSpent: 0,
        joinedAt: new Date().toISOString().slice(0, 10),
        avatar: `https://i.pravatar.cc/64?img=${(DB.customers.length % 70) + 1}`,
        ...payload,
      });
      showToast('Customer added successfully');
    }
    persist();
    closeModal();
    renderCustomersTable();
  });
}

function deleteCustomer(customerId) {
  const customer = DB.customers.find((c) => c.id === customerId);
  if (!customer) return;
  confirmDialog({
    title: 'Delete this customer?',
    message: `"${customer.name}" and their record will be permanently removed. This action cannot be undone.`,
    confirmLabel: 'Delete',
    onConfirm: () => {
      DB.customers = DB.customers.filter((c) => c.id !== customerId);
      persist();
      renderCustomersTable();
      showToast('Customer deleted', 'error');
    },
  });
}

pageRenderers.customers = renderCustomers;

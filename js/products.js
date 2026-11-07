/**
 * products.js
 * Products page: searchable / filterable / sortable table with pagination,
 * plus Add, Edit and Delete flows backed by DB.products and localStorage.
 */

const ProductsState = { page: 1, pageSize: 6, search: '', category: '', status: '', sort: 'newest' };

function getFilteredProducts() {
  let list = [...DB.products];

  if (ProductsState.search) {
    const term = ProductsState.search.toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term));
  }
  if (ProductsState.category) list = list.filter((p) => p.category === ProductsState.category);
  if (ProductsState.status) list = list.filter((p) => p.status === ProductsState.status);

  switch (ProductsState.sort) {
    case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break;
    case 'price-asc': list.sort((a, b) => a.price - b.price); break;
    case 'price-desc': list.sort((a, b) => b.price - a.price); break;
    case 'stock': list.sort((a, b) => a.stock - b.stock); break;
    default: list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
  return list;
}

function renderProducts() {
  const categorySelect = document.getElementById('productCategoryFilter');
  if (categorySelect.options.length === 0) {
    categorySelect.innerHTML = '<option value="">All Categories</option>' +
      CATEGORIES.map((c) => `<option value="${c}">${c}</option>`).join('');
  }

  renderProductsTable();

  document.getElementById('productSearch').oninput = (e) => {
    ProductsState.search = e.target.value;
    ProductsState.page = 1;
    renderProductsTable();
  };
  document.getElementById('productCategoryFilter').onchange = (e) => {
    ProductsState.category = e.target.value;
    ProductsState.page = 1;
    renderProductsTable();
  };
  document.getElementById('productStatusFilter').onchange = (e) => {
    ProductsState.status = e.target.value;
    ProductsState.page = 1;
    renderProductsTable();
  };
  document.getElementById('productSort').onchange = (e) => {
    ProductsState.sort = e.target.value;
    renderProductsTable();
  };
  document.getElementById('btnAddProduct').onclick = () => openProductModal();
}

function renderProductsTable() {
  const all = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(all.length / ProductsState.pageSize));
  ProductsState.page = Math.min(ProductsState.page, totalPages);
  const start = (ProductsState.page - 1) * ProductsState.pageSize;
  const pageItems = all.slice(start, start + ProductsState.pageSize);

  const wrap = document.getElementById('productsTableWrap');

  if (all.length === 0) {
    wrap.innerHTML = emptyState('box', 'No products found', 'Try adjusting your search or filters, or add a new product.');
    hydrateIcons(wrap);
    document.getElementById('productsPagination').innerHTML = '';
    return;
  }

  wrap.innerHTML = `
    <table class="data-table">
      <thead>
        <tr>
          <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${pageItems.map((p) => `
          <tr>
            <td>${productThumbHtml(p)}</td>
            <td class="cell-strong">${escapeHtml(p.name)}</td>
            <td>${escapeHtml(p.category)}</td>
            <td>${formatCurrency(p.price)}</td>
            <td>${p.stock}</td>
            <td><span class="badge ${statusClass(p.status)}">${p.status}</span></td>
            <td>
              <div class="row-actions">
                <button class="icon-btn icon-btn--sm" data-edit="${p.id}" title="Edit"><span data-icon="edit"></span></button>
                <button class="icon-btn icon-btn--sm icon-btn--danger" data-delete="${p.id}" title="Delete"><span data-icon="trash"></span></button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  hydrateIcons(wrap);

  wrap.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => openProductModal(btn.dataset.edit));
  });
  wrap.querySelectorAll('[data-delete]').forEach((btn) => {
    btn.addEventListener('click', () => deleteProduct(btn.dataset.delete));
  });

  renderPagination(document.getElementById('productsPagination'), all.length, ProductsState.pageSize, ProductsState.page, (p) => {
    ProductsState.page = p;
    renderProductsTable();
  });
}

function emptyState(icon, title, message) {
  return `
    <div class="empty-state">
      <div class="empty-state__icon" data-icon="${icon}"></div>
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function openProductModal(productId) {
  const editing = !!productId;
  const product = editing ? DB.products.find((p) => p.id === productId) : null;

  openModal(`
    <div class="modal__head">
      <h3>${editing ? 'Edit Product' : 'Add Product'}</h3>
      <button class="icon-btn" id="modalCloseBtn"><span data-icon="close"></span></button>
    </div>
    <form id="productForm" class="modal__body" novalidate>
      <div class="form-group">
        <label>Product Name</label>
        <input type="text" name="name" data-required data-error-for="name" value="${editing ? escapeHtml(product.name) : ''}" placeholder="e.g. Wireless Headphones" />
        <span class="form-error" data-error-for="name">Product name is required.</span>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Category</label>
          <select name="category" data-required data-error-for="category">
            ${CATEGORIES.map((c) => `<option value="${c}" ${editing && product.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Price ($)</label>
          <input type="number" step="0.01" min="0" name="price" data-required data-validate="number" data-error-for="price" value="${editing ? product.price : ''}" placeholder="0.00" />
          <span class="form-error" data-error-for="price">Enter a valid price.</span>
        </div>
      </div>
      <div class="form-group">
        <label>Stock Quantity</label>
        <input type="number" min="0" step="1" name="stock" data-required data-validate="number" data-error-for="stock" value="${editing ? product.stock : ''}" placeholder="0" />
        <span class="form-error" data-error-for="stock">Enter a valid stock amount.</span>
      </div>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost" id="modalCancelBtn">Cancel</button>
        <button type="submit" class="btn btn--primary">${editing ? 'Save Changes' : 'Add Product'}</button>
      </div>
    </form>
  `);

  document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
  document.getElementById('modalCancelBtn').addEventListener('click', closeModal);

  document.getElementById('productForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form)) return;

    const stock = parseInt(form.stock.value, 10);
    const status = stock === 0 ? 'Out of Stock' : stock <= 15 ? 'Low Stock' : 'In Stock';
    const payload = {
      name: form.name.value.trim(),
      category: form.category.value,
      price: parseFloat(form.price.value),
      stock,
      status,
    };

    if (editing) {
      Object.assign(product, payload);
      showToast('Product updated successfully');
    } else {
      DB.products.unshift({
        id: nextId('P', DB.products),
        image: 'assets/images/products/default.svg',
        createdAt: new Date().toISOString().slice(0, 10),
        sold: 0,
        ...payload,
      });
      showToast('Product added successfully');
    }
    persist();
    closeModal();
    renderProductsTable();
  });
}

function deleteProduct(productId) {
  const product = DB.products.find((p) => p.id === productId);
  if (!product) return;
  confirmDialog({
    title: 'Delete this product?',
    message: `"${product.name}" will be permanently removed. This action cannot be undone.`,
    confirmLabel: 'Delete',
    onConfirm: () => {
      DB.products = DB.products.filter((p) => p.id !== productId);
      persist();
      renderProductsTable();
      showToast('Product deleted', 'error');
    },
  });
}

pageRenderers.products = renderProducts;

/**
 * app.js
 * Application shell: page routing, theme handling, toast notifications,
 * modal/confirm dialog helpers, and shared formatting utilities used by
 * every page module.
 */

const App = {
  currentPage: 'dashboard',
  charts: {}, // holds Chart.js instances keyed by canvas id so they can be destroyed/rebuilt
};

/* ---------------------------------------------------------------- *
 * Formatting helpers
 * ---------------------------------------------------------------- */
const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', ILS: '₪', JOD: 'JD ' };

/** Symbol for the currency chosen in Settings → Business Info. */
function currencySymbol() {
  const code = (typeof DB !== 'undefined' && DB.settings && DB.settings.business && DB.settings.business.currency) || 'USD';
  return CURRENCY_SYMBOLS[code] || '$';
}

function formatCurrency(value) {
  return currencySymbol() + Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatNumber(value) {
  return Number(value).toLocaleString('en-US');
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Next unique id like P0031 — based on the highest existing id, so deletes never cause duplicates. */
function nextId(prefix, list) {
  const max = list.reduce((m, item) => {
    const n = parseInt(String(item.id).slice(prefix.length), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return prefix + String(max + 1).padStart(4, '0');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = String(str ?? '');
  return div.innerHTML;
}

/* ---------------------------------------------------------------- *
 * Avatars — initials fallback so the UI never depends on an external
 * image host being reachable, and so a picture can be removed cleanly.
 * ---------------------------------------------------------------- */
const AVATAR_PALETTE = ['#3B6FE0', '#22C1A0', '#F5A623', '#E0563B', '#8B5CF6', '#38BDF8', '#EC4899'];

function getInitials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function avatarColorFor(name) {
  const str = String(name || '');
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

/**
 * Swaps a broken/missing <img class="avatar"> for an initials badge.
 * Works for any avatar in the app (profile, customers, etc.) as long as
 * the <img> carries a data-name attribute.
 */
function replaceWithInitialsAvatar(img) {
  if (!img || img.dataset.fallenBack) return;
  img.dataset.fallenBack = 'true';
  const name = img.dataset.name || '?';
  const span = document.createElement('span');
  span.className = img.className + ' avatar-initials';
  if (img.id) span.id = img.id;
  span.dataset.name = name;
  span.style.background = avatarColorFor(name);
  span.textContent = getInitials(name);
  span.title = name;
  img.replaceWith(span);
  return span;
}

// Image load errors don't bubble, so this listener must use the capture phase.
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img.tagName !== 'IMG') return;
  if (img.classList.contains('avatar')) replaceWithInitialsAvatar(img);
  else if (img.dataset.thumbIcon) replaceThumbWithIcon(img);
}, true);

/**
 * Syncs the profile name / email / avatar across every place they appear:
 * the sidebar footer, the topbar user chip, and the account dropdown.
 */
function refreshProfileUI() {
  const profile = DB.settings.profile;
  const avatarTargets = ['sidebarAvatar', 'topbarAvatar', 'userMenuAvatar'];

  avatarTargets.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.name = profile.name;
    if (profile.avatar) {
      if (el.tagName !== 'IMG') {
        const img = document.createElement('img');
        img.className = el.className.replace('avatar-initials', '').trim();
        img.id = id;
        img.alt = '';
        img.dataset.name = profile.name;
        el.replaceWith(img);
      }
      const imgEl = document.getElementById(id);
      imgEl.dataset.fallenBack = '';
      imgEl.src = profile.avatar;
    } else if (el.tagName === 'IMG') {
      replaceWithInitialsAvatar(el);
    } else {
      // Already an initials span — just refresh its content in place.
      el.style.background = avatarColorFor(profile.name);
      el.textContent = getInitials(profile.name);
      el.title = profile.name;
    }
  });

  const nameTargets = ['sidebarUserName', 'topbarUserName', 'userMenuName'];
  nameTargets.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = profile.name;
  });
  const emailEl = document.getElementById('userMenuEmail');
  if (emailEl) emailEl.textContent = profile.email;

  renderGreeting();
}

const CATEGORY_STYLE = {
  'Electronics': { color: '#3B6FE0', icon: 'box' },
  'Fashion': { color: '#E0563B', icon: 'users' },
  'Home & Living': { color: '#22C1A0', icon: 'grid' },
  'Sports': { color: '#F5A623', icon: 'chart' },
  'Beauty': { color: '#8B5CF6', icon: 'sun' },
  'Stationery': { color: '#38BDF8', icon: 'file' },
};

function productThumbHtml(product, size = 'md') {
  const style = CATEGORY_STYLE[product.category] || { color: '#94A3B8', icon: 'box' };
  const image = escapeHtml(product.image || 'assets/images/products/default.svg');
  // Fallback is handled by the delegated capture-phase error listener below
  // (no inline onerror, which broke because of nested quotes).
  return `<span class="thumb thumb--${size} thumb--image" style="background:${style.color}22;color:${style.color}"><img src="${image}" alt="" loading="lazy" data-thumb-icon="${style.icon}" /></span>`;
}

/** Replaces a product image that failed to load with the category icon. */
function replaceThumbWithIcon(img) {
  const wrap = img.parentElement;
  if (!wrap) return;
  wrap.innerHTML = `<span data-icon="${img.dataset.thumbIcon || 'box'}"></span>`;
  hydrateIcons(wrap);
}

function statusClass(status) {
  const map = {
    'In Stock': 'badge--success',
    'Low Stock': 'badge--warning',
    'Out of Stock': 'badge--danger',
    'Active': 'badge--success',
    'Inactive': 'badge--muted',
    'Pending': 'badge--warning',
    'Processing': 'badge--info',
    'Shipped': 'badge--info',
    'Delivered': 'badge--success',
    'Cancelled': 'badge--danger',
    'Paid': 'badge--success',
    'Unpaid': 'badge--warning',
    'Refunded': 'badge--muted',
  };
  return map[status] || 'badge--muted';
}

/* ---------------------------------------------------------------- *
 * Toast notifications
 * ---------------------------------------------------------------- */
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  const iconName = type === 'success' ? 'check' : type === 'error' ? 'close' : 'alert';
  toast.innerHTML = `<span class="toast__icon" data-icon="${iconName}"></span><span class="toast__msg">${escapeHtml(message)}</span>`;
  container.appendChild(toast);
  hydrateIcons(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 250);
  }, 3200);
}

/* ---------------------------------------------------------------- *
 * Modal system
 * ---------------------------------------------------------------- */
const modalOverlay = document.getElementById('modalOverlay');
const modalRoot = document.getElementById('modalRoot');

function openModal(innerHtml, { size = 'md' } = {}) {
  modalRoot.className = `modal modal--${size}`;
  modalRoot.innerHTML = innerHtml;
  modalOverlay.classList.add('is-open');
  hydrateIcons(modalRoot);
  document.body.classList.add('no-scroll');
  const firstInput = modalRoot.querySelector('input, select, textarea, button');
  if (firstInput) firstInput.focus();
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
  document.body.classList.remove('no-scroll');
  setTimeout(() => { modalRoot.innerHTML = ''; }, 200);
}

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) closeModal();
});

function confirmDialog({ title, message, confirmLabel = 'Confirm', danger = true, onConfirm }) {
  openModal(`
    <div class="modal__confirm">
      <div class="modal__confirm-icon ${danger ? 'is-danger' : ''}" data-icon="alert"></div>
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="modal__actions modal__actions--center">
        <button class="btn btn--ghost" id="confirmCancelBtn">Cancel</button>
        <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" id="confirmOkBtn">${escapeHtml(confirmLabel)}</button>
      </div>
    </div>
  `, { size: 'sm' });

  document.getElementById('confirmCancelBtn').addEventListener('click', closeModal);
  document.getElementById('confirmOkBtn').addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}

/* ---------------------------------------------------------------- *
 * Form validation helper
 * ---------------------------------------------------------------- */
function validateForm(form) {
  let valid = true;
  form.querySelectorAll('[data-required]').forEach((field) => {
    const errorEl = form.querySelector(`[data-error-for="${field.name}"]`);
    let fieldValid = true;

    if (!field.value || !field.value.trim()) {
      fieldValid = false;
    } else if (field.dataset.validate === 'email') {
      fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
    } else if (field.dataset.validate === 'phone') {
      fieldValid = /^[0-9+\-\s()]{7,}$/.test(field.value.trim());
    } else if (field.dataset.validate === 'number') {
      fieldValid = !isNaN(parseFloat(field.value)) && parseFloat(field.value) >= 0;
    }

    field.classList.toggle('is-invalid', !fieldValid);
    if (errorEl) errorEl.style.display = fieldValid ? 'none' : 'block';
    if (!fieldValid) valid = false;
  });
  return valid;
}

/* ---------------------------------------------------------------- *
 * Navigation / routing
 * ---------------------------------------------------------------- */
const pageRenderers = {}; // populated by each page module: pageRenderers.dashboard = renderDashboard, etc.

function goToPage(pageName) {
  if (!document.getElementById(`page-${pageName}`)) return;
  App.currentPage = pageName;

  document.querySelectorAll('.page').forEach((p) => p.classList.remove('is-active'));
  document.getElementById(`page-${pageName}`).classList.add('is-active');

  document.querySelectorAll('.nav-item').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.page === pageName);
  });

  closeMobileSidebar();

  if (typeof pageRenderers[pageName] === 'function') {
    pageRenderers[pageName]();
  }

  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => goToPage(btn.dataset.page));
});

document.addEventListener('click', (e) => {
  const gotoBtn = e.target.closest('[data-goto]');
  if (gotoBtn) goToPage(gotoBtn.dataset.goto);
});

/* ---------------------------------------------------------------- *
 * Mobile sidebar
 * ---------------------------------------------------------------- */
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openMobileSidebar() {
  sidebar.classList.add('is-open');
  sidebarOverlay.classList.add('is-visible');
}
function closeMobileSidebar() {
  sidebar.classList.remove('is-open');
  sidebarOverlay.classList.remove('is-visible');
}
document.getElementById('menuToggle').addEventListener('click', openMobileSidebar);
document.getElementById('sidebarClose').addEventListener('click', closeMobileSidebar);
sidebarOverlay.addEventListener('click', closeMobileSidebar);

/* ---------------------------------------------------------------- *
 * Theme (dark / light)
 * ---------------------------------------------------------------- */
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  const icon = document.querySelector('#themeToggle [data-icon]');
  if (icon) {
    icon.setAttribute('data-icon', theme === 'dark' ? 'sun' : 'moon');
    icon.dataset.hydrated = '';
    hydrateIcons(document.getElementById('themeToggle'));
  }
  DB.settings.appearance.theme = theme;
  persist();
  Object.keys(App.charts).forEach((key) => {
    if (App.charts[key]) rebuildChartTheme(App.charts[key]);
  });
}

function rebuildChartTheme(chart) {
  const styles = getComputedStyle(document.body);
  const gridColor = styles.getPropertyValue('--chart-grid').trim();
  const textColor = styles.getPropertyValue('--text-secondary').trim();
  if (chart.options.scales) {
    Object.values(chart.options.scales).forEach((scale) => {
      if (scale.grid) scale.grid.color = gridColor;
      if (scale.ticks) scale.ticks.color = textColor;
    });
  }
  chart.update();
}

document.getElementById('themeToggle').addEventListener('click', () => {
  const current = document.body.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

/* ---------------------------------------------------------------- *
 * Notifications dropdown
 * ---------------------------------------------------------------- */
function buildNotifications() {
  const notifications = [];

  DB.orders.slice(0, 2).forEach((o) => {
    notifications.push({
      icon: 'cart',
      title: `New order ${o.id} received`,
      desc: `${o.customerName} placed an order for ${formatCurrency(o.total)}.`,
      time: formatDate(o.date),
    });
  });

  DB.products.filter((p) => p.status === 'Low Stock' || p.status === 'Out of Stock').slice(0, 2).forEach((p) => {
    notifications.push({
      icon: 'box',
      title: `${p.name} is ${p.status.toLowerCase()}`,
      desc: `Only ${p.stock} left in stock. Consider restocking soon.`,
      time: 'Today',
    });
  });

  const newestCustomer = [...DB.customers].sort((a, b) => (a.joinedAt < b.joinedAt ? 1 : -1))[0];
  if (newestCustomer) {
    notifications.push({
      icon: 'users',
      title: 'New customer registered',
      desc: `${newestCustomer.name} just joined Nexa.`,
      time: formatDate(newestCustomer.joinedAt),
    });
  }

  return notifications;
}

let notifUnread = true;

function renderNotifications() {
  const list = document.getElementById('notifList');
  const notifications = buildNotifications();

  if (notifications.length === 0) {
    list.innerHTML = emptyState('inbox', 'No notifications', "You're all caught up.");
    hydrateIcons(list);
    return;
  }

  list.innerHTML = notifications.map((n) => `
    <div class="notif-item">
      <div class="notif-item__icon" data-icon="${n.icon}"></div>
      <div class="notif-item__body">
        <span class="notif-item__title">${escapeHtml(n.title)}</span>
        <span class="notif-item__desc">${escapeHtml(n.desc)}</span>
        <span class="notif-item__time">${escapeHtml(n.time)}</span>
      </div>
    </div>
  `).join('');
  hydrateIcons(list);
}

function setNotifUnread(state) {
  notifUnread = state;
  const dot = document.getElementById('notifDot');
  dot.style.display = state ? '' : 'none';
}

const notifBtn = document.getElementById('notifBtn');
const notifPanel = document.getElementById('notifPanel');

function toggleNotifPanel(forceState) {
  const willOpen = typeof forceState === 'boolean' ? forceState : !notifPanel.classList.contains('is-open');
  notifPanel.classList.toggle('is-open', willOpen);
  notifBtn.setAttribute('aria-expanded', String(willOpen));
  if (willOpen) {
    renderNotifications();
    setNotifUnread(false);
  }
}

notifBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleUserMenu(false);
  toggleNotifPanel();
});

document.getElementById('notifMarkAllBtn').addEventListener('click', () => {
  setNotifUnread(false);
  showToast('All notifications marked as read');
});

document.addEventListener('click', (e) => {
  if (notifPanel.classList.contains('is-open') && !notifPanel.contains(e.target) && e.target !== notifBtn) {
    toggleNotifPanel(false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && notifPanel.classList.contains('is-open')) toggleNotifPanel(false);
});

/* ---------------------------------------------------------------- *
 * User account dropdown (avatar / name / chevron in the topbar)
 * ---------------------------------------------------------------- */
const userMenuBtn = document.getElementById('userMenuBtn');
const userMenuPanel = document.getElementById('userMenuPanel');

function toggleUserMenu(forceState) {
  const willOpen = typeof forceState === 'boolean' ? forceState : !userMenuPanel.classList.contains('is-open');
  userMenuPanel.classList.toggle('is-open', willOpen);
  userMenuBtn.setAttribute('aria-expanded', String(willOpen));
}

userMenuBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleNotifPanel(false);
  toggleUserMenu();
});

document.addEventListener('click', (e) => {
  if (userMenuPanel.classList.contains('is-open') && !userMenuPanel.contains(e.target) && e.target !== userMenuBtn) {
    toggleUserMenu(false);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && userMenuPanel.classList.contains('is-open')) toggleUserMenu(false);
});

document.querySelectorAll('[data-user-action]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.userAction;
    toggleUserMenu(false);

    if (action === 'profile' || action === 'settings') {
      goToPage('settings');
      SettingsState.tab = 'profile';
      renderSettings();
    } else if (action === 'theme') {
      const current = document.body.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    } else if (action === 'logout') {
      confirmDialog({
        title: 'Log out of Nexa?',
        message: "You'll need to sign back in to access your dashboard.",
        confirmLabel: 'Log Out',
        onConfirm: () => showToast('This is a frontend-only demo, so logout is simulated.', 'info'),
      });
    }
  });
});

/* ---------------------------------------------------------------- *
 * Global search (searches products, customers, orders and jumps to page)
 * ---------------------------------------------------------------- */
document.getElementById('globalSearch').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const term = e.target.value.trim().toLowerCase();
  if (!term) return;

  const inProducts = DB.products.some((p) => p.name.toLowerCase().includes(term));
  const inCustomers = DB.customers.some((c) => c.name.toLowerCase().includes(term));
  const inOrders = DB.orders.some((o) => o.id.toLowerCase().includes(term) || o.customerName.toLowerCase().includes(term));

  if (inOrders) {
    goToPage('orders');
    document.getElementById('orderSearch').value = term;
    document.getElementById('orderSearch').dispatchEvent(new Event('input'));
  } else if (inProducts) {
    goToPage('products');
    document.getElementById('productSearch').value = term;
    document.getElementById('productSearch').dispatchEvent(new Event('input'));
  } else if (inCustomers) {
    goToPage('customers');
    document.getElementById('customerSearch').value = term;
    document.getElementById('customerSearch').dispatchEvent(new Event('input'));
  } else {
    showToast(`No results found for "${e.target.value.trim()}"`, 'error');
  }
});

/* ---------------------------------------------------------------- *
 * Pagination helper — shared by Products / Customers / Orders tables
 * ---------------------------------------------------------------- */
function renderPagination(container, totalItems, pageSize, currentPage, onPageChange) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) {
    container.innerHTML = totalItems > 0
      ? `<span class="pagination__info">Showing all ${totalItems} results</span>`
      : '';
    return;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  let pages = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) pages.push(i);
    else if (pages[pages.length - 1] !== '...') pages.push('...');
  }

  container.innerHTML = `
    <span class="pagination__info">Showing ${start} to ${end} of ${totalItems} results</span>
    <div class="pagination__controls">
      <button class="page-btn" data-page-nav="prev" ${currentPage === 1 ? 'disabled' : ''}>&lsaquo;</button>
      ${pages.map((p) => p === '...'
        ? `<span class="page-ellipsis">&hellip;</span>`
        : `<button class="page-btn ${p === currentPage ? 'is-active' : ''}" data-page-nav="${p}">${p}</button>`
      ).join('')}
      <button class="page-btn" data-page-nav="next" ${currentPage === totalPages ? 'disabled' : ''}>&rsaquo;</button>
    </div>
  `;

  container.querySelectorAll('[data-page-nav]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nav = btn.dataset.pageNav;
      let next = currentPage;
      if (nav === 'prev') next = Math.max(1, currentPage - 1);
      else if (nav === 'next') next = Math.min(totalPages, currentPage + 1);
      else next = parseInt(nav, 10);
      onPageChange(next);
    });
  });
}

/* ---------------------------------------------------------------- *
 * Init
 * ---------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  applyTheme(DB.settings.appearance.theme || 'light');

  const dateEl = document.getElementById('todayDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  }

  refreshProfileUI();
  goToPage('dashboard');
});

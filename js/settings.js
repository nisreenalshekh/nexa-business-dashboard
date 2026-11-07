/**
 * settings.js
 * Settings page: tabbed panel for Profile, Business Info, Notifications
 * and Appearance, all reading from / writing to DB.settings.
 */

const SettingsState = { tab: 'profile' };

function renderSettings() {
  document.querySelectorAll('.settings-nav__item').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.tab === SettingsState.tab);
    btn.onclick = () => {
      SettingsState.tab = btn.dataset.tab;
      renderSettings();
    };
  });

  const panel = document.getElementById('settingsPanel');
  panel.innerHTML = buildSettingsPanel(SettingsState.tab);
  hydrateIcons(panel);
  bindSettingsPanelEvents(SettingsState.tab);
}

function buildSettingsPanel(tab) {
  const s = DB.settings;

  if (tab === 'profile') {
    const hasAvatar = !!s.profile.avatar;
    return `
      <h3>Profile Information</h3>
      <p class="settings-panel__sub">Update your personal account details.</p>
      <form id="profileForm" class="settings-form" novalidate>
        <div class="profile-avatar-row">
          ${hasAvatar
            ? `<img class="avatar avatar--lg" id="profileAvatarPreview" src="${s.profile.avatar}" alt="" data-name="${escapeHtml(s.profile.name)}" />`
            : `<span class="avatar avatar--lg avatar-initials" id="profileAvatarPreview" style="background:${avatarColorFor(s.profile.name)}">${getInitials(s.profile.name)}</span>`
          }
          <div class="profile-avatar-actions">
            <input type="file" id="avatarFileInput" accept="image/*" hidden />
            <button type="button" class="btn btn--ghost btn--sm" id="changeAvatarBtn">Change Picture</button>
            ${hasAvatar ? `<button type="button" class="btn btn--ghost btn--sm" id="removeAvatarBtn">Remove Picture</button>` : ''}
          </div>
        </div>
        <span class="form-hint" id="avatarError" style="display:none;"></span>
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" name="name" data-required data-error-for="name" value="${escapeHtml(s.profile.name)}" />
          <span class="form-error" data-error-for="name">Name is required.</span>
        </div>
        <div class="form-group">
          <label>Email Address</label>
          <input type="email" name="email" data-required data-validate="email" data-error-for="email" value="${escapeHtml(s.profile.email)}" />
          <span class="form-error" data-error-for="email">Enter a valid email address.</span>
        </div>
        <div class="form-group">
          <label>Phone Number</label>
          <input type="tel" name="phone" data-required data-validate="phone" data-error-for="phone" value="${escapeHtml(s.profile.phone)}" />
          <span class="form-error" data-error-for="phone">Enter a valid phone number.</span>
        </div>
        <div class="modal__actions modal__actions--start">
          <button type="submit" class="btn btn--primary">Save Changes</button>
        </div>
      </form>
    `;
  }

  if (tab === 'business') {
    return `
      <h3>Business Information</h3>
      <p class="settings-panel__sub">These details appear on invoices and reports.</p>
      <form id="businessForm" class="settings-form" novalidate>
        <div class="form-group">
          <label>Business Name</label>
          <input type="text" name="businessName" data-required data-error-for="businessName" value="${escapeHtml(s.business.businessName)}" />
          <span class="form-error" data-error-for="businessName">Business name is required.</span>
        </div>
        <div class="form-group">
          <label>Industry</label>
          <input type="text" name="industry" value="${escapeHtml(s.business.industry)}" />
        </div>
        <div class="form-group">
          <label>Address</label>
          <input type="text" name="address" value="${escapeHtml(s.business.address)}" />
        </div>
        <div class="form-group">
          <label>Currency</label>
          <select name="currency">
            ${['USD', 'EUR', 'GBP', 'ILS', 'JOD'].map((c) => `<option value="${c}" ${s.business.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="modal__actions modal__actions--start">
          <button type="submit" class="btn btn--primary">Save Changes</button>
        </div>
      </form>
    `;
  }

  if (tab === 'notifications') {
    const n = s.notifications;
    return `
      <h3>Notification Preferences</h3>
      <p class="settings-panel__sub">Choose what you want to be notified about.</p>
      <div class="toggle-list">
        ${toggleRow('orderUpdates', 'Order Updates', 'Get notified when an order status changes.', n.orderUpdates)}
        ${toggleRow('lowStockAlerts', 'Low Stock Alerts', 'Get notified when a product is running low.', n.lowStockAlerts)}
        ${toggleRow('customerActivity', 'Customer Activity', 'Get notified about new customer sign-ups.', n.customerActivity)}
        ${toggleRow('weeklySummary', 'Weekly Summary', 'Receive a weekly performance summary email.', n.weeklySummary)}
      </div>
    `;
  }

  // appearance
  return `
    <h3>Appearance</h3>
    <p class="settings-panel__sub">Customize how Nexa looks for you.</p>
    <div class="appearance-options">
      <button class="theme-option ${s.appearance.theme === 'light' ? 'is-active' : ''}" data-theme-choice="light">
        <span class="theme-preview theme-preview--light"></span>
        Light Mode
      </button>
      <button class="theme-option ${s.appearance.theme === 'dark' ? 'is-active' : ''}" data-theme-choice="dark">
        <span class="theme-preview theme-preview--dark"></span>
        Dark Mode
      </button>
    </div>
  `;
}

function toggleRow(key, title, desc, checked) {
  return `
    <label class="toggle-row">
      <div>
        <span class="toggle-row__title">${title}</span>
        <span class="toggle-row__desc">${desc}</span>
      </div>
      <span class="switch">
        <input type="checkbox" data-toggle="${key}" ${checked ? 'checked' : ''} />
        <span class="switch__track"></span>
      </span>
    </label>
  `;
}

function bindSettingsPanelEvents(tab) {
  if (tab === 'profile') {
    document.getElementById('changeAvatarBtn').addEventListener('click', () => {
      document.getElementById('avatarFileInput').click();
    });

    document.getElementById('avatarFileInput').addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      const errorEl = document.getElementById('avatarError');
      errorEl.style.display = 'none';
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        errorEl.textContent = 'Please choose an image file.';
        errorEl.style.display = 'block';
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        errorEl.textContent = 'Image is too large. Please choose one under 2MB.';
        errorEl.style.display = 'block';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        DB.settings.profile.avatar = reader.result;
        persist();
        refreshProfileUI();
        renderSettings();
        showToast('Profile picture updated');
      };
      reader.onerror = () => {
        errorEl.textContent = 'Could not read that image. Please try another file.';
        errorEl.style.display = 'block';
      };
      reader.readAsDataURL(file);
    });

    const removeBtn = document.getElementById('removeAvatarBtn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        confirmDialog({
          title: 'Remove profile picture?',
          message: "You'll see your initials instead until you add a new picture.",
          confirmLabel: 'Remove',
          onConfirm: () => {
            DB.settings.profile.avatar = null;
            persist();
            refreshProfileUI();
            renderSettings();
            showToast('Profile picture removed');
          },
        });
      });
    }

    document.getElementById('profileForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(e.target)) return;
      const f = e.target;
      DB.settings.profile.name = f.name.value.trim();
      DB.settings.profile.email = f.email.value.trim();
      DB.settings.profile.phone = f.phone.value.trim();
      persist();
      refreshProfileUI();
      showToast('Profile updated successfully');
    });
  }

  if (tab === 'business') {
    document.getElementById('businessForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validateForm(e.target)) return;
      const f = e.target;
      DB.settings.business.businessName = f.businessName.value.trim();
      DB.settings.business.industry = f.industry.value.trim();
      DB.settings.business.address = f.address.value.trim();
      DB.settings.business.currency = f.currency.value;
      persist();
      showToast('Business information updated');
    });
  }

  if (tab === 'notifications') {
    document.querySelectorAll('[data-toggle]').forEach((input) => {
      input.addEventListener('change', () => {
        DB.settings.notifications[input.dataset.toggle] = input.checked;
        persist();
        showToast('Notification preference saved');
      });
    });
  }

  if (tab === 'appearance') {
    document.querySelectorAll('[data-theme-choice]').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.themeChoice);
        renderSettings();
        showToast(`${btn.dataset.themeChoice === 'dark' ? 'Dark' : 'Light'} mode enabled`);
      });
    });
  }
}

function renderGreeting() {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greetingText').textContent = `${greeting}, ${DB.settings.profile.name}`;
}

pageRenderers.settings = renderSettings;

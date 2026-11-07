/**
 * icons.js
 * Minimal inline SVG icon set. Icons are injected into any element with
 * a `data-icon="name"` attribute via hydrateIcons(). Using a lookup table
 * keeps markup semantic while avoiding an external icon font dependency.
 */

const ICONS = {
  grid: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  box: '<svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.2c2.7.4 4.5 2.5 4.5 5.8"/></svg>',
  cart: '<svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.7l2 12.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7.5H6"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M4 20V10"/><path d="M11 20V4"/><path d="M18 20v-7"/></svg>',
  file: '<svg viewBox="0 0 24 24"><path d="M6 2h8l5 5v15H6z"/><path d="M14 2v5h5"/><path d="M9 13h6"/><path d="M9 17h6"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a1.7 1.7 0 0 0 .35 1.9l.06.06a2.1 2.1 0 1 1-3 3l-.07-.07a1.7 1.7 0 0 0-1.9-.34 1.7 1.7 0 0 0-1 1.55V20a2.1 2.1 0 0 1-4.2 0v-.1a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.9.34l-.07.07a2.1 2.1 0 1 1-3-3l.06-.06a1.7 1.7 0 0 0 .35-1.9 1.7 1.7 0 0 0-1.55-1H2a2.1 2.1 0 0 1 0-4.2h.1a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.35-1.9l-.06-.07a2.1 2.1 0 1 1 3-3l.07.06a1.7 1.7 0 0 0 1.9.35H8.3a1.7 1.7 0 0 0 1-1.55V2a2.1 2.1 0 0 1 4.2 0v.1a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.9-.35l.07-.06a2.1 2.1 0 1 1 3 3l-.06.07a1.7 1.7 0 0 0-.35 1.9V8.3a1.7 1.7 0 0 0 1.55 1H22a2.1 2.1 0 0 1 0 4.2h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
  menu: '<svg viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/></svg>',
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.2"/><path d="M12 2v2.4M12 19.6V22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M2 12h2.4M19.6 12H22M4.9 19.1l1.7-1.7M17.4 6.6l1.7-1.7"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M18 8.5a6 6 0 1 0-12 0c0 6.5-2.5 8-2.5 8h17s-2.5-1.5-2.5-8z"/><path d="M10 20.5a2 2 0 0 0 4 0"/></svg>',
  'chevron-down': '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M10 11v6M14 11v6"/><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>',
  eye: '<svg viewBox="0 0 24 24"><path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  printer: '<svg viewBox="0 0 24 24"><path d="M6 9V3h12v6"/><rect x="4" y="9" width="16" height="8" rx="1.5"/><path d="M6 17v4h12v-4"/></svg>',
  download: '<svg viewBox="0 0 24 24"><path d="M12 3v13"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>',
  alert: '<svg viewBox="0 0 24 24"><path d="M12 2l10.4 18H1.6z"/><path d="M12 9.5v4.2"/><circle cx="12" cy="17" r="0.9"/></svg>',
  'arrow-up': '<svg viewBox="0 0 24 24"><path d="M12 19V5"/><path d="M6 11l6-6 6 6"/></svg>',
  'arrow-down': '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M18 13l-6 6-6-6"/></svg>',
  inbox: '<svg viewBox="0 0 24 24"><path d="M3 12h4.5l1.5 3h6l1.5-3H21"/><path d="M5 4h14l2 8v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 13l4.5 4.5L19.5 7"/></svg>',
};

function hydrateIcons(scope) {
  const root = scope || document;
  root.querySelectorAll('[data-icon]').forEach((el) => {
    const name = el.getAttribute('data-icon');
    if (ICONS[name] && !el.dataset.hydrated) {
      el.innerHTML = ICONS[name];
      el.classList.add('icon');
      el.dataset.hydrated = 'true';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => hydrateIcons());

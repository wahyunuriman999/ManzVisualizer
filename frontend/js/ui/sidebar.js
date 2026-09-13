import { i18n } from '../core/i18n.js';
import { setTheme, getCurrentTheme } from './theme.js';
import { EventBus } from '../app.js';

const navItems = [
  { id: 'home', icon: '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>', path: '#/home' },
  { id: 'data', icon: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9h2v9h-2z"/>', path: '#/data-source' },
  { id: 'table', icon: '<path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h10v2H7zm0 4h10v2H7zm0 4h10v2H7z"/>', path: '#/data-table' },
  { id: 'dashboard', icon: '<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>', path: '#/dashboard' },
  { id: 'pivot', icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H5v-4h5v4zm0-6H5V7h5v4zm6 6h-5v-4h5v4zm0-6h-5V7h5v4z"/>', path: '#/pivot' },
  { id: 'reports', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>', path: '#/reports' },
  { id: 'ai', icon: '<path d="M21 11c0-2.8-2.2-5-5-5H8c-2.8 0-5 2.2-5 5v2c0 2.8 2.2 5 5 5h8c2.8 0 5-2.2 5-5v-2zm-4 3H7v-4h10v4z"/>', path: '#/ai-studio' }
];

export function initSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  // Header
  const header = document.createElement('div');
  header.className = 'sidebar-header';
  header.innerHTML = `<span data-i18n="app_title">${i18n.t('app_title')}</span>`;
  sidebar.appendChild(header);

  // Nav Items
  const navContainer = document.createElement('div');
  navContainer.className = 'sidebar-nav';
  
  navItems.forEach(item => {
    const a = document.createElement('a');
    a.className = 'sidebar-item';
    a.href = item.path;
    a.innerHTML = `
      <svg viewBox="0 0 24 24">${item.icon}</svg>
      <span data-i18n="nav_${item.id}">${i18n.t(`nav_${item.id}`)}</span>
    `;
    navContainer.appendChild(a);
  });
  sidebar.appendChild(navContainer);

  // Footer with settings & theme switcher & lang switcher
  const footer = document.createElement('div');
  footer.className = 'sidebar-footer';
  
  // Theme Select
  const themeSelect = document.createElement('select');
  themeSelect.className = 'bg-transparent border border-gray-500 rounded p-1 text-sm text-gray-300 w-full mb-2 outline-none';
  ['dark', 'light', 'ocean', 'solarized'].forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    if(getCurrentTheme() === t) opt.selected = true;
    themeSelect.appendChild(opt);
  });
  themeSelect.addEventListener('change', (e) => setTheme(e.target.value, EventBus));
  footer.appendChild(themeSelect);

  // Lang Select
  const langSelect = document.createElement('select');
  langSelect.className = 'bg-transparent border border-gray-500 rounded p-1 text-sm text-gray-300 w-full outline-none';
  const langs = [
    {code: 'en', label: '🇬🇧 English'},
    {code: 'id', label: '🇮🇩 Indonesian'},
    {code: 'ar', label: '🇸🇦 Arabic'},
    {code: 'zh', label: '🇨🇳 Chinese'},
    {code: 'es', label: '🇪🇸 Spanish'},
    {code: 'fr', label: '🇫🇷 French'}
  ];
  langs.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l.code;
    opt.textContent = l.label;
    if(i18n.current === l.code) opt.selected = true;
    langSelect.appendChild(opt);
  });
  langSelect.addEventListener('change', (e) => {
    i18n.setLang(e.target.value, EventBus);
  });
  footer.appendChild(langSelect);

  sidebar.appendChild(footer);
}

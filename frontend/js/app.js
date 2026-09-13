import { initSidebar } from './ui/sidebar.js';
import { initTheme, setTheme } from './ui/theme.js';
import { i18n } from './core/i18n.js';

// GLOBAL APP STATE
export const AppState = {
  currentSession: null,
  currentPage: 'home',
  currentProject: null,
  theme: 'dark',
  filters: {},
  dashboardLayout: [],
  apiBase: 'http://localhost:8050',
  dataProfile: null,
};

// EVENT BUS
export const EventBus = {
  listeners: {},
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  },
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  },
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(cb => cb(data));
  },
};

// ROUTER
const Router = {
  routes: {
    'home': () => import('./pages/home.js?v=1.4'),
    'data-source': () => import('./pages/data-source.js?v=1.4'),
    'data-table': () => import('./pages/data-table.js?v=1.4'),
    'dashboard': () => import('./pages/dashboard.js?v=1.4'),
    'pivot': () => import('./pages/pivot.js?v=1.4'),
    'reports': () => import('./pages/reports.js?v=1.4'),
    'ai-studio': () => import('./pages/ai-studio.js?v=1.4')
  },
  async navigate(hash) {
    const page = hash.replace('#/', '') || 'home';
    if (!this.routes[page]) return;
    
    AppState.currentPage = page;
    const container = document.getElementById('page-container');
    container.innerHTML = '<div class="flex items-center justify-center h-full"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>';
    
    try {
      const module = await this.routes[page]();
      container.innerHTML = '';
      if(module.default && module.default.render) {
        module.default.render(container);
      }
      
      // Update sidebar active
      document.querySelectorAll('.sidebar-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('href') === `#/${page}`) {
          el.classList.add('active');
        }
      });
      
      // Update breadcrumb
      const breadcrumb = document.getElementById('breadcrumb');
      if (breadcrumb) {
        const langKey = `nav_${page.replace('-', '_')}`;
        breadcrumb.setAttribute('data-i18n', langKey);
        breadcrumb.textContent = i18n.t(langKey);
      }
    } catch (e) {
      console.error(e);
      container.innerHTML = `<div class="text-red-500">Error loading page: ${e.message}</div>`;
    }
  }
};

// API HELPER
export const API = {
  async request(path, options = {}) {
    try {
      const response = await fetch(`${AppState.apiBase}${path}`, options);
      if (!response.ok) {
        let detail = response.statusText;
        try {
          const errData = await response.json();
          detail = errData.detail ? (typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail)) : response.statusText;
        } catch(e) {}
        throw new Error(detail);
      }
      return await response.json();
    } catch (error) {
      Toast.error(error.message);
      throw error;
    }
  },
  get(path) { return this.request(path); },
  post(path, body) {
    return this.request(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  },
  postForm(path, formData) {
    return this.request(path, { method: 'POST', body: formData });
  }
};

// TOAST NOTIFICATIONS
export const Toast = {
  id: 0,
  show(msg, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const currentId = `toast-${++this.id}`;
    toast.id = currentId;
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    if (type === 'error') toast.style.borderLeftColor = 'red';
    if (type === 'success') toast.style.borderLeftColor = 'green';
    
    container.appendChild(toast);
    setTimeout(() => this.dismiss(currentId), 3000);
    return currentId;
  },
  success(msg) { return this.show(msg, 'success'); },
  error(msg) { return this.show(msg, 'error'); },
  info(msg) { return this.show(msg, 'info'); },
  loading(msg) { return this.show(msg, 'info'); }, // Simplification
  dismiss(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
};

// PROJECT MANAGER
export const ProjectManager = {
  save() { 
    localStorage.setItem('manz_project', JSON.stringify(AppState.currentProject));
    Toast.success('Project saved');
  },
  load() { return JSON.parse(localStorage.getItem('manz_project')); },
};

// INIT
document.addEventListener('DOMContentLoaded', () => {
  i18n.init(EventBus);
  initTheme(EventBus);
  initSidebar();
  
  window.addEventListener('hashchange', () => Router.navigate(window.location.hash));
  
  const initialHash = window.location.hash || '#/home';
  if (window.location.hash !== initialHash) {
    window.location.hash = initialHash;
  } else {
    Router.navigate(initialHash);
  }
  
  document.getElementById('btn-save-project')?.addEventListener('click', () => {
    ProjectManager.save();
  });
});

export const THEMES = ['dark', 'light', 'ocean', 'solarized'];

export const echartsThemes = {
  dark: { backgroundColor: 'transparent', textStyle: { color: '#94a3b8' } },
  light: { backgroundColor: 'transparent', textStyle: { color: '#374151' } },
  ocean: { backgroundColor: 'transparent', textStyle: { color: '#7dd3fc' } },
  solarized: { backgroundColor: 'transparent', textStyle: { color: '#93a1a1' } },
};

export function setTheme(name, EventBus) {
  if (!THEMES.includes(name)) return;
  
  const html = document.documentElement;
  THEMES.forEach(t => html.classList.remove(`theme-${t}`));
  html.classList.add(`theme-${name}`);
  
  localStorage.setItem('manz_theme', name);
  
  if (EventBus) {
    EventBus.emit('theme:changed', name);
  }
}

export function getCurrentTheme() {
  return localStorage.getItem('manz_theme') || 'dark';
}

export function initTheme(EventBus) {
  const t = getCurrentTheme();
  setTheme(t, EventBus);
}

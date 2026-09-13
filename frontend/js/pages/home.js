import { i18n } from '../core/i18n.js';

export default {
  render(container) {
    container.innerHTML = `
      <div class="max-w-5xl mx-auto py-10 fade-in">
        <div class="text-center mb-12">
          <h1 class="text-4xl font-bold mb-4" data-i18n="app_title">${i18n.t('app_title')}</h1>
          <p class="text-xl text-gray-400">Professional Data Intelligence</p>
          <div class="mt-8">
            <a href="#/data-source" class="btn btn-primary text-lg px-8 py-3 rounded-full shadow-lg hover:shadow-xl">
              New Project
            </a>
          </div>
        </div>
        
        <h2 class="text-2xl font-semibold mb-6 border-b border-gray-700 pb-2">Recent Projects</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6" id="projects-grid">
          <div class="glass-card flex items-center justify-center text-gray-500 italic h-32">
            No recent projects found.
          </div>
        </div>
      </div>
    `;
  }
};

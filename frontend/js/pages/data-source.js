import { DataEngine } from '../core/data-engine.js';
import { Toast, AppState, API } from '../app.js';
import { i18n } from '../core/i18n.js';

export default {
  render(container) {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto fade-in glass-card">
        <h2 class="text-2xl font-bold mb-6" data-i18n="nav_data_source">${i18n.t('nav_data_source')}</h2>
        
        <div class="flex gap-4 mb-6 border-b border-gray-600 pb-2">
          <button class="tab-btn font-semibold text-blue-400 border-b-2 border-blue-400 pb-1" data-target="tab-file">File Upload</button>
          <button class="tab-btn font-semibold text-gray-400 hover:text-gray-200" data-target="tab-rest">REST API</button>
          <button class="tab-btn font-semibold text-gray-400 hover:text-gray-200" data-target="tab-samples">Sample Data</button>
        </div>
        
        <div id="tab-file" class="tab-content">
          <div class="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer" id="drop-zone">
            <div class="text-4xl mb-4">📁</div>
            <p class="text-lg mb-2">Drag and drop your file here</p>
            <p class="text-sm text-gray-500 mb-6">Supports Excel (.xlsx), CSV, JSON</p>
            <input type="file" id="file-input" class="hidden" accept=".csv,.json,.xlsx">
            <button class="btn btn-secondary" onclick="document.getElementById('file-input').click()" data-i18n="btn_upload">${i18n.t('btn_upload')}</button>
          </div>
        </div>

        <div id="tab-rest" class="tab-content hidden">
          <p class="text-gray-400 mb-4">Connect to a live REST API or Google Sheets Export URL.</p>
          <input type="text" id="url-input" class="w-full bg-gray-800 border border-gray-700 p-3 rounded mb-4 text-white" placeholder="https://api.example.com/data">
          <button class="btn btn-primary" id="btn-fetch-url" data-i18n="btn_connect">${i18n.t('btn_connect')}</button>
        </div>

        <div id="tab-samples" class="tab-content hidden">
          <p class="text-gray-400 mb-4">Load built-in datasets to explore ManzStudio features.</p>
          <div id="samples-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="animate-pulse flex space-x-4"><div class="flex-1 space-y-4 py-1"><div class="h-4 bg-gray-600 rounded w-3/4"></div></div></div>
          </div>
        </div>
      </div>
    `;

    // Tab logic
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('text-blue-400', 'border-b-2', 'border-blue-400');
          b.classList.add('text-gray-400');
        });
        e.target.classList.remove('text-gray-400');
        e.target.classList.add('text-blue-400', 'border-b-2', 'border-blue-400');
        
        container.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        container.querySelector(`#${e.target.getAttribute('data-target')}`).classList.remove('hidden');
      });
    });

    const fileInput = container.querySelector('#file-input');
    const dropZone = container.querySelector('#drop-zone');
    const samplesList = container.querySelector('#samples-list');

    // Load samples list
    API.get('/api/data/samples').then(samples => {
      samplesList.innerHTML = '';
      if(!samples || samples.length === 0) {
        samplesList.innerHTML = '<p class="text-gray-500">No samples available.</p>';
        return;
      }
      samples.forEach(s => {
        const div = document.createElement('div');
        div.className = 'glass-card p-4 flex justify-between items-center cursor-pointer hover:bg-gray-800 transition-colors';
        div.innerHTML = `
          <div>
            <h4 class="font-bold text-lg">${s.label}</h4>
            <p class="text-xs text-gray-500">${s.name}</p>
          </div>
          <button class="btn btn-primary text-sm px-3 py-1">Load</button>
        `;
        div.onclick = () => loadSessionFromApi(() => API.get(`/api/data/sample/${s.name}`), s.name);
        samplesList.appendChild(div);
      });
    }).catch(e => {
      samplesList.innerHTML = '<p class="text-red-500">Failed to load samples.</p>';
    });

    // Handle File Upload
    const handleFile = (file) => {
      if(!file) return;
      const formData = new FormData();
      formData.append('file', file);
      loadSessionFromApi(() => API.postForm('/api/data/upload', formData), file.name);
    };

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('border-blue-500'); });
    dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('border-blue-500'); });
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500');
      if(e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    // Handle URL
    container.querySelector('#btn-fetch-url').addEventListener('click', () => {
      const url = container.querySelector('#url-input').value;
      if(!url) return;
      loadSessionFromApi(() => API.post('/api/data/url', { url }), 'URL Data');
    });

    // Helper to call API, get full dataset, and update DataEngine
    async function loadSessionFromApi(apiCallFn, projectName) {
      Toast.loading('Processing data on server...');
      try {
        const profile = await apiCallFn(); // Returns DataProfileResponse
        const sessionId = profile.session_id;
        
        Toast.loading('Fetching full dataset for UI...');
        const fullData = await API.get(`/api/data/preview/${sessionId}?limit=0`);
        
        DataEngine.setData(fullData, profile);
        AppState.currentSession = sessionId;
        AppState.dataProfile = profile;
        AppState.currentProject = { name: projectName, date: new Date().toISOString() };
        
        Toast.success(`Successfully loaded ${profile.row_count} rows!`);
        window.location.hash = '#/data-table';
      } catch (err) {
        Toast.error('Failed to load data: ' + err.message);
      }
    }
  }
};

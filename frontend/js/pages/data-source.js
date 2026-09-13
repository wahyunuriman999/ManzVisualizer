import { DataEngine } from '../core/data-engine.js';
import { Toast, AppState } from '../app.js';
import { i18n } from '../core/i18n.js';

export default {
  render(container) {
    container.innerHTML = `
      <div class="max-w-4xl mx-auto fade-in glass-card">
        <h2 class="text-2xl font-bold mb-6" data-i18n="nav_data">${i18n.t('nav_data')}</h2>
        
        <div class="flex gap-4 mb-6 border-b border-gray-600 pb-2">
          <button class="font-semibold text-blue-400 border-b-2 border-blue-400 pb-1">File Upload</button>
          <button class="font-semibold text-gray-400 hover:text-gray-200">REST API</button>
          <button class="font-semibold text-gray-400 hover:text-gray-200">Sample Data</button>
        </div>
        
        <div id="tab-file">
          <div class="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-blue-500 transition-colors cursor-pointer" id="drop-zone">
            <div class="text-4xl mb-4">📁</div>
            <p class="text-lg mb-2">Drag and drop your file here</p>
            <p class="text-sm text-gray-500 mb-6">Supports CSV, JSON</p>
            <input type="file" id="file-input" class="hidden" accept=".csv,.json">
            <button class="btn btn-secondary" onclick="document.getElementById('file-input').click()" data-i18n="btn_upload">${i18n.t('btn_upload')}</button>
          </div>
        </div>
      </div>
    `;

    const fileInput = container.querySelector('#file-input');
    const dropZone = container.querySelector('#drop-zone');

    const handleFile = (file) => {
      if(!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          let data = [];
          
          if(file.name.endsWith('.json')) {
            data = JSON.parse(text);
          } else {
            // Basic CSV parser
            const lines = text.split('\\n').filter(l => l.trim());
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            for(let i=1; i<lines.length; i++) {
              const vals = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
              const row = {};
              headers.forEach((h, idx) => { row[h] = isNaN(vals[idx]) ? vals[idx] : Number(vals[idx]); });
              data.push(row);
            }
          }
          
          const profile = {
            columns: Object.keys(data[0] || {}).map(k => ({
              name: k,
              type: typeof data[0][k] === 'number' ? 'number' : 'string'
            }))
          };

          DataEngine.setData(data, profile);
          AppState.currentProject = { name: file.name, date: new Date().toISOString() };
          Toast.success(`Loaded ${data.length} rows`);
          window.location.hash = '#/data-table';
        } catch (err) {
          Toast.error('Failed to parse file: ' + err.message);
        }
      };
      reader.readAsText(file);
    };

    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('border-blue-500'); });
    dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('border-blue-500'); });
    dropZone.addEventListener('drop', e => {
      e.preventDefault();
      dropZone.classList.remove('border-blue-500');
      if(e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
  }
};

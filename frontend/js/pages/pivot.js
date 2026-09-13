import { DataEngine } from '../core/data-engine.js';
import { Toast, AppState, API } from '../app.js';
import { i18n } from '../core/i18n.js';

export default {
  state: {
    rows: [],
    columns: [],
    values: [],
    aggfunc: 'sum'
  },

  render(container) {
    if (!DataEngine.getColumns().length) {
      container.innerHTML = `<div class="glass-card p-10 text-center"><p class="text-xl">No data loaded.</p><a href="#/data-source" class="text-blue-400 mt-4 inline-block">Go to Data Sources</a></div>`;
      return;
    }
    
    container.innerHTML = `
      <div class="flex flex-col h-full gap-4 fade-in">
        <h2 class="text-2xl font-bold" data-i18n="nav_pivot">${i18n.t('nav_pivot')}</h2>
        <div class="flex h-full gap-4 min-h-[500px]">
          
          <!-- Sidebar: Field List -->
          <div class="w-64 glass-card flex flex-col gap-2 p-4">
            <h3 class="font-bold text-lg mb-2">Fields</h3>
            <p class="text-xs text-gray-400 mb-2">Drag fields to the boxes below</p>
            <div class="flex flex-col gap-2 overflow-y-auto" id="pivot-fields">
              ${DataEngine.getColumns().map(c => `
                <div class="p-2 bg-gray-700 rounded border border-gray-600 cursor-grab text-sm select-none" draggable="true" data-field="${c.name}">
                  ${c.name}
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Main Content -->
          <div class="flex-grow flex flex-col gap-4">
            <!-- Drop Zones -->
            <div class="glass-card p-4 flex gap-4 bg-gray-800 border-2 border-gray-700">
              
              <div class="flex-1 flex flex-col gap-2">
                <span class="text-xs text-gray-400 font-bold tracking-wider">ROWS</span>
                <div class="drop-zone flex-1 border-2 border-dashed border-gray-600 rounded p-2 min-h-[60px] flex flex-wrap gap-2 items-start" data-zone="rows"></div>
              </div>

              <div class="flex-1 flex flex-col gap-2">
                <span class="text-xs text-gray-400 font-bold tracking-wider">COLUMNS</span>
                <div class="drop-zone flex-1 border-2 border-dashed border-gray-600 rounded p-2 min-h-[60px] flex flex-wrap gap-2 items-start" data-zone="columns"></div>
              </div>

              <div class="flex-1 flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <span class="text-xs text-gray-400 font-bold tracking-wider">VALUES</span>
                  <select id="agg-select" class="bg-gray-700 text-xs text-white border border-gray-600 rounded px-1">
                    <option value="sum">Sum</option>
                    <option value="mean">Average</option>
                    <option value="count">Count</option>
                    <option value="max">Max</option>
                    <option value="min">Min</option>
                  </select>
                </div>
                <div class="drop-zone flex-1 border-2 border-dashed border-gray-600 rounded p-2 min-h-[60px] flex flex-wrap gap-2 items-start" data-zone="values"></div>
              </div>
              
              <div class="flex flex-col justify-end">
                <button id="btn-update-pivot" class="btn btn-primary whitespace-nowrap h-10 px-6">Apply</button>
              </div>

            </div>
            
            <!-- Result Table -->
            <div class="glass-card flex-grow overflow-auto p-0 relative" id="pivot-result-container">
              <div class="absolute inset-0 flex items-center justify-center text-gray-500" id="pivot-placeholder">
                Drag fields into Rows, Columns, and Values, then click Apply.
              </div>
              <div id="pivot-table-wrapper" class="w-full h-full p-4 overflow-auto hidden">
                <table class="w-full text-left border-collapse text-sm" id="pivot-table">
                  <thead class="bg-gray-800 text-gray-300" id="pivot-thead"></thead>
                  <tbody id="pivot-tbody"></tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    // Drag and Drop Logic
    const fields = container.querySelectorAll('#pivot-fields > div');
    const dropZones = container.querySelectorAll('.drop-zone');

    let draggedField = null;

    fields.forEach(f => {
      f.addEventListener('dragstart', e => {
        draggedField = e.target.getAttribute('data-field');
        e.dataTransfer.setData('text/plain', draggedField);
      });
    });

    dropZones.forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('border-blue-500');
        zone.classList.remove('border-gray-600');
      });
      zone.addEventListener('dragleave', e => {
        e.preventDefault();
        zone.classList.remove('border-blue-500');
        zone.classList.add('border-gray-600');
      });
      zone.addEventListener('drop', e => {
        e.preventDefault();
        zone.classList.remove('border-blue-500');
        zone.classList.add('border-gray-600');
        
        const fieldName = e.dataTransfer.getData('text/plain');
        if (fieldName) {
          const zoneName = zone.getAttribute('data-zone');
          if (!this.state[zoneName].includes(fieldName)) {
            this.state[zoneName].push(fieldName);
            this.renderDropZone(zone, zoneName);
          }
        }
      });
    });

    container.querySelector('#btn-update-pivot').addEventListener('click', () => {
      this.state.aggfunc = container.querySelector('#agg-select').value;
      this.fetchPivotData(container);
    });
  },

  renderDropZone(zoneEl, zoneName) {
    zoneEl.innerHTML = this.state[zoneName].map((field, idx) => `
      <div class="bg-blue-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 shadow">
        ${field}
        <button class="hover:text-red-300 ml-1" data-zone="${zoneName}" data-idx="${idx}">✖</button>
      </div>
    `).join('');

    // Attach delete handlers
    zoneEl.querySelectorAll('button').forEach(btn => {
      btn.onclick = (e) => {
        const z = e.target.getAttribute('data-zone');
        const i = parseInt(e.target.getAttribute('data-idx'));
        this.state[z].splice(i, 1);
        this.renderDropZone(zoneEl, z);
      };
    });
  },

  async fetchPivotData(container) {
    if (this.state.rows.length === 0 && this.state.columns.length === 0) {
      Toast.error("Please add at least one Row or Column");
      return;
    }
    if (this.state.values.length === 0) {
      Toast.error("Please add at least one Value field");
      return;
    }

    const placeholder = container.querySelector('#pivot-placeholder');
    const tableWrapper = container.querySelector('#pivot-table-wrapper');
    
    placeholder.textContent = "Loading...";
    placeholder.classList.remove('hidden');
    tableWrapper.classList.add('hidden');

    try {
      const result = await API.post('/api/analysis/pivot', {
        session_id: AppState.currentSession,
        rows: this.state.rows,
        columns: this.state.columns,
        values: this.state.values,
        aggfunc: this.state.aggfunc,
        filters: {}
      });

      this.renderTable(container, result);
      
      placeholder.classList.add('hidden');
      tableWrapper.classList.remove('hidden');
    } catch (err) {
      placeholder.textContent = "Failed to load pivot table.";
      console.error(err);
    }
  },

  renderTable(container, result) {
    const thead = container.querySelector('#pivot-thead');
    const tbody = container.querySelector('#pivot-tbody');
    
    if (!result.data || result.data.length === 0) {
      thead.innerHTML = '';
      tbody.innerHTML = '<tr><td class="p-4 text-center">No results</td></tr>';
      return;
    }

    const columns = Object.keys(result.data[0]);
    
    thead.innerHTML = `
      <tr>
        ${columns.map(c => `<th class="p-2 border-b border-gray-700">${c}</th>`).join('')}
      </tr>
    `;

    tbody.innerHTML = result.data.map(row => `
      <tr class="hover:bg-gray-800 transition-colors">
        ${columns.map(c => {
          let val = row[c];
          if (typeof val === 'number') {
            val = val.toLocaleString(undefined, { maximumFractionDigits: 2 });
          }
          return `<td class="p-2 border-b border-gray-700">${val ?? ''}</td>`;
        }).join('')}
      </tr>
    `).join('');
  }
};

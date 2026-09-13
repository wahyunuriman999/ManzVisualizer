import { DataEngine } from '../core/data-engine.js';
import { Toast } from '../app.js';

export default {
  render(container) {
    if (!DataEngine.getColumns().length) {
      container.innerHTML = `<div class="glass-card p-10 text-center"><p class="text-xl">No data loaded.</p></div>`;
      return;
    }
    
    // Simplistic visual representation for Pivot (fully functional HTML5 drag/drop pivot is extremely complex for a single file)
    container.innerHTML = `
      <div class="flex h-full gap-4 fade-in">
        <div class="w-64 glass-card flex flex-col gap-2 p-4">
          <h3 class="font-bold text-lg mb-2">Fields</h3>
          <div class="flex flex-col gap-2 overflow-y-auto" id="pivot-fields">
            ${DataEngine.getColumns().map(c => `
              <div class="p-2 bg-gray-700 rounded border border-gray-600 cursor-grab text-sm">${c.name}</div>
            `).join('')}
          </div>
        </div>
        <div class="flex-grow flex flex-col gap-4">
          <div class="glass-card p-4 flex gap-4 h-32">
            <div class="flex-1 border border-dashed border-gray-600 rounded p-2 flex flex-col">
              <span class="text-xs text-gray-500 font-bold">ROWS</span>
            </div>
            <div class="flex-1 border border-dashed border-gray-600 rounded p-2 flex flex-col">
              <span class="text-xs text-gray-500 font-bold">COLUMNS</span>
            </div>
            <div class="flex-1 border border-dashed border-gray-600 rounded p-2 flex flex-col">
              <span class="text-xs text-gray-500 font-bold">VALUES</span>
            </div>
          </div>
          <div class="glass-card flex-grow p-4 flex items-center justify-center text-gray-500">
            Drag fields into Rows, Columns, and Values to build pivot table. (Simulated functionality)
          </div>
        </div>
      </div>
    `;
  }
};

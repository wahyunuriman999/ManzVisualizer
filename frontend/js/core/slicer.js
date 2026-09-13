import { DataEngine } from './data-engine.js';
import { EventBus } from '../app.js';

export const Slicer = {
  createDropdownSlicer(container, col) {
    const data = DataEngine.getRawData();
    const unique = [...new Set(data.map(r => String(r[col])))].filter(x => x && x !== 'undefined');
    
    container.innerHTML = `
      <div class="slicer p-2 border border-gray-600 rounded bg-gray-800">
        <label class="text-xs font-bold block mb-1">${col}</label>
        <select multiple class="w-full bg-gray-700 text-white text-sm p-1 rounded h-24">
          ${unique.map(u => `<option value="${u}">${u}</option>`).join('')}
        </select>
      </div>
    `;
    
    const select = container.querySelector('select');
    select.addEventListener('change', () => {
      const selected = Array.from(select.selectedOptions).map(o => o.value);
      if (selected.length === 0) DataEngine.removeFilter(col);
      else DataEngine.applyFilter(col, selected);
    });
  },

  createResetButton(container) {
    container.innerHTML = `<button class="btn btn-secondary text-sm">Clear All Filters</button>`;
    container.querySelector('button').addEventListener('click', () => {
      DataEngine.clearAllFilters();
      // Unselect all dropdowns
      document.querySelectorAll('.slicer select').forEach(s => s.selectedIndex = -1);
    });
  }
};

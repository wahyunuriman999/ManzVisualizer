import { DataEngine } from '../core/data-engine.js';
import { EventBus, Toast } from '../app.js';
import { ExportEngine } from '../core/export.js';

export default {
  gridApi: null,
  
  render(container) {
    const data = DataEngine.getFilteredData();
    const columns = DataEngine.getColumns();

    if (!data.length) {
      container.innerHTML = `<div class="glass-card p-10 text-center"><p class="text-xl">No data loaded.</p><a href="#/data-source" class="text-blue-400 mt-4 inline-block">Go to Data Sources</a></div>`;
      return;
    }

    container.innerHTML = `
      <div class="flex flex-col h-full fade-in gap-4">
        <div class="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-700">
          <div class="flex gap-2 items-center">
            <span class="font-semibold text-lg ml-2">Data Explorer</span>
            <span class="bg-gray-700 px-2 py-1 rounded text-xs text-gray-300 ml-4">${data.length} Rows</span>
          </div>
          <div>
            <button id="btn-export-csv" class="btn btn-secondary text-sm">Export CSV</button>
          </div>
        </div>
        <div id="ag-grid-container" class="ag-theme-alpine-dark flex-grow w-full rounded overflow-hidden shadow-lg border border-gray-700"></div>
      </div>
    `;

    const gridDiv = container.querySelector('#ag-grid-container');
    
    const gridOptions = {
      columnDefs: columns.map(c => ({
        field: c.name,
        sortable: true,
        filter: c.type === 'number' ? 'agNumberColumnFilter' : 'agTextColumnFilter',
        resizable: true,
      })),
      rowData: data,
      pagination: true,
      paginationPageSize: 100,
      rowSelection: 'multiple',
      defaultColDef: {
        flex: 1,
        minWidth: 100,
      }
    };

    // Instantiate ag-grid
    this.gridApi = agGrid.createGrid(gridDiv, gridOptions);

    container.querySelector('#btn-export-csv').addEventListener('click', () => {
      ExportEngine.downloadCSV();
    });
    
    // Listen for data updates from other parts of the app
    const onDataFiltered = ({ data }) => {
      if(this.gridApi) this.gridApi.setGridOption('rowData', data);
    };
    EventBus.on('data:filtered', onDataFiltered);
    
    // Cleanup on navigate away
    this.cleanup = () => { EventBus.off('data:filtered', onDataFiltered); };
  }
};

import { DataEngine } from '../core/data-engine.js';
import { ChartFactory } from '../core/chart-factory.js';
import { Slicer } from '../core/slicer.js';
import { openModal } from '../ui/modal.js';
import { EventBus, AppState, Toast } from '../app.js';
import { ExportEngine } from '../core/export.js';

export default {
  grid: null,
  charts: {},
  
  render(container) {
    if (!DataEngine.getColumns().length) {
      container.innerHTML = `<div class="glass-card p-10 text-center"><p class="text-xl">No data loaded.</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="flex flex-col h-full fade-in gap-4">
        <div class="flex justify-between items-center bg-gray-800 p-3 rounded border border-gray-700">
          <div class="flex gap-2 items-center" id="slicers-container">
            <!-- Slicers go here -->
          </div>
          <div class="flex gap-2">
            <button id="btn-add-widget" class="btn btn-primary">+ Add Widget</button>
            <button id="btn-screenshot" class="btn btn-secondary">Screenshot</button>
          </div>
        </div>
        
        <div class="flex-grow overflow-auto relative bg-gray-900 rounded border border-gray-700 p-2" id="dashboard-canvas">
          <div class="grid-stack"></div>
        </div>
      </div>
    `;

    // Init GridStack
    this.grid = GridStack.init({
      column: 12,
      cellHeight: 80,
      margin: 10,
      float: true
    }, container.querySelector('.grid-stack'));

    // Slicers
    const sc = container.querySelector('#slicers-container');
    const catCols = DataEngine.getCategoricalCols();
    if(catCols.length > 0) Slicer.createDropdownSlicer(sc, catCols[0]);
    Slicer.createResetButton(sc);

    // Add Widget
    container.querySelector('#btn-add-widget').onclick = () => this.openChartConfigModal();
    container.querySelector('#btn-screenshot').onclick = () => ExportEngine.screenshotDashboard();

    // Event Bus
    const onDataFiltered = () => {
      Object.keys(this.charts).forEach(id => {
        const config = this.charts[id].config;
        ChartFactory.update(this.charts[id].instance, config);
      });
    };
    EventBus.on('data:filtered', onDataFiltered);
    
    // Save layout logic (simplified)
    this.grid.on('change', () => { AppState.dashboardLayout = this.grid.save(); });
    
    this.cleanup = () => { EventBus.off('data:filtered', onDataFiltered); };
  },

  openChartConfigModal() {
    const cols = DataEngine.getColumns();
    const numCols = DataEngine.getNumericCols();
    const catCols = DataEngine.getCategoricalCols();
    
    const html = `
      <div class="flex flex-col gap-3">
        <label>Title</label><input type="text" id="cfg-title" class="p-2 bg-gray-800 rounded border border-gray-600 text-white" value="New Chart">
        <label>Type</label>
        <select id="cfg-type" class="p-2 bg-gray-800 rounded border border-gray-600 text-white">
          <option value="bar">Bar Chart</option>
          <option value="bar-horizontal">Horizontal Bar</option>
          <option value="line">Line Chart</option>
          <option value="area">Area Chart</option>
          <option value="pie">Pie Chart</option>
          <option value="donut">Donut Chart</option>
          <option value="scatter">Scatter Plot</option>
          <option value="funnel">Funnel Chart</option>
          <option value="waterfall">Waterfall Chart</option>
          <option value="kpi">KPI Card</option>
        </select>
        <label>Category (X-Axis)</label>
        <select id="cfg-x" class="p-2 bg-gray-800 rounded border border-gray-600 text-white">
          ${catCols.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <label>Value (Y-Axis)</label>
        <select id="cfg-y" class="p-2 bg-gray-800 rounded border border-gray-600 text-white">
          ${numCols.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <label>Aggregation</label>
        <select id="cfg-agg" class="p-2 bg-gray-800 rounded border border-gray-600 text-white">
          <option value="sum">Sum</option>
          <option value="avg">Average</option>
          <option value="count">Count</option>
        </select>
      </div>
    `;

    openModal('Configure Chart', html, () => {
      let title = document.getElementById('cfg-title').value;
      const xCol = document.getElementById('cfg-x').value;
      const yCol = document.getElementById('cfg-y').value;
      const aggFunc = document.getElementById('cfg-agg').value;
      
      if (!title || title === 'New Chart') {
        const aggName = aggFunc.charAt(0).toUpperCase() + aggFunc.slice(1);
        title = `${aggName} of ${yCol} by ${xCol}`;
      }

      const config = {
        id: 'widget_' + Date.now(),
        title: title,
        type: document.getElementById('cfg-type').value,
        xCol: xCol,
        yCol: yCol,
        aggFunc: aggFunc
      };
      this.addWidget(config);
    });
  },

  addWidget(config) {
    const el = document.createElement('div');
    el.className = 'grid-stack-item';
    el.setAttribute('gs-w', 4);
    el.setAttribute('gs-h', 4);
    
    el.innerHTML = `
      <div class="grid-stack-item-content glass-card flex flex-col relative group">
        <div class="text-sm text-gray-400 font-semibold mb-2 flex justify-between">
          <span>${config.title}</span>
          <button class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onclick="this.closest('.grid-stack-item').remove()">✖</button>
        </div>
        <div class="chart-container flex-grow w-full h-full" id="${config.id}"></div>
      </div>
    `;
    this.grid.addWidget(el);
    
    setTimeout(() => {
      const chartDiv = document.getElementById(config.id);
      if(chartDiv) {
        const instance = ChartFactory.create(chartDiv, config);
        this.charts[config.id] = { instance, config };
        
        // Handle resize
        const resizeObserver = new ResizeObserver(() => ChartFactory.resize(instance));
        resizeObserver.observe(chartDiv);
      }
    }, 100);
  }
};

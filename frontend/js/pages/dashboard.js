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
    
    // Expose editWidget globally so the inline onclick can find it
    window.editWidget = (id) => this.openChartConfigModal(this.charts[id].config);
    
    this.cleanup = () => { EventBus.off('data:filtered', onDataFiltered); };
  },

  openChartConfigModal(existingConfig = null) {
    const cols = DataEngine.getColumns();
    const numCols = DataEngine.getNumericCols();
    const catCols = DataEngine.getCategoricalCols();
    
    const html = `
      <div class="flex gap-4 h-[400px]">
        <div class="w-1/2 flex flex-col gap-3 overflow-y-auto pr-2">
          <h4 class="font-bold text-blue-400 border-b border-gray-700 pb-2 mb-1">Data Configuration</h4>
          <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</label>
          <input type="text" id="cfg-title" class="p-2 bg-gray-800 rounded border border-gray-600 text-white" value="${existingConfig ? existingConfig.title : 'New Chart'}">
          
          <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</label>
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

          <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category (X-Axis)</label>
          <select id="cfg-x" class="p-2 bg-gray-800 rounded border border-gray-600 text-white">
            ${catCols.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>

          <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Value (Y-Axis)</label>
          <select id="cfg-y" class="p-2 bg-gray-800 rounded border border-gray-600 text-white">
            ${numCols.map(c => `<option value="${c}">${c}</option>`).join('')}
          </select>

          <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Aggregation</label>
          <select id="cfg-agg" class="p-2 bg-gray-800 rounded border border-gray-600 text-white">
            <option value="sum">Sum</option>
            <option value="avg">Average</option>
            <option value="count">Count</option>
          </select>
        </div>

        <div class="w-1/2 flex flex-col gap-3 overflow-y-auto pl-4 border-l border-gray-700">
          <h4 class="font-bold text-purple-400 border-b border-gray-700 pb-2 mb-1">Formatting & Styling</h4>
          
          <label class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Color Palette</label>
          <select id="cfg-palette" class="p-2 bg-gray-800 rounded border border-gray-600 text-white">
            <option value="default">Default Modern</option>
            <option value="pastel">Soft Pastel</option>
            <option value="vibrant">Vibrant & Bold</option>
            <option value="monochrome">Monochrome Blue</option>
            <option value="ocean">Ocean Depth</option>
          </select>

          <label class="flex items-center gap-3 mt-4 text-sm font-semibold cursor-pointer">
            <input type="checkbox" id="cfg-labels" class="w-4 h-4 rounded bg-gray-800 border-gray-600 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-900" ${(!existingConfig || existingConfig.showLabels !== false) ? 'checked' : ''}>
            Show Data Labels
          </label>
        </div>
      </div>
    `;

    openModal(existingConfig ? 'Edit Widget' : 'Configure Chart', html, () => {
      let title = document.getElementById('cfg-title').value;
      const xCol = document.getElementById('cfg-x').value;
      const yCol = document.getElementById('cfg-y').value;
      const aggFunc = document.getElementById('cfg-agg').value;
      const palette = document.getElementById('cfg-palette').value;
      const showLabels = document.getElementById('cfg-labels').checked;
      
      if (!title || title === 'New Chart') {
        const aggName = aggFunc.charAt(0).toUpperCase() + aggFunc.slice(1);
        title = `${aggName} of ${yCol} by ${xCol}`;
      }

      if (existingConfig) {
        existingConfig.title = title;
        existingConfig.type = document.getElementById('cfg-type').value;
        existingConfig.xCol = xCol;
        existingConfig.yCol = yCol;
        existingConfig.aggFunc = aggFunc;
        existingConfig.paletteName = palette;
        existingConfig.showLabels = showLabels;
        
        // Update DOM title
        const widgetHeader = document.querySelector(`#${existingConfig.id}`).previousElementSibling.querySelector('span');
        if (widgetHeader) widgetHeader.textContent = title;
        
        // Re-render chart
        ChartFactory.update(this.charts[existingConfig.id].instance, existingConfig);
      } else {
        const config = {
          id: 'widget_' + Date.now(),
          title: title,
          type: document.getElementById('cfg-type').value,
          xCol: xCol,
          yCol: yCol,
          aggFunc: aggFunc,
          paletteName: palette,
          showLabels: showLabels
        };
        this.addWidget(config);
      }
    });

    if (existingConfig) {
      setTimeout(() => {
        document.getElementById('cfg-type').value = existingConfig.type;
        document.getElementById('cfg-x').value = existingConfig.xCol;
        document.getElementById('cfg-y').value = existingConfig.yCol;
        document.getElementById('cfg-agg').value = existingConfig.aggFunc;
        document.getElementById('cfg-palette').value = existingConfig.paletteName || 'default';
      }, 50);
    }
  },

  addWidget(config) {
    const el = document.createElement('div');
    el.className = 'grid-stack-item';
    el.setAttribute('gs-w', 4);
    el.setAttribute('gs-h', 4);
    
    el.innerHTML = `
      <div class="grid-stack-item-content glass-card flex flex-col relative group">
        <div class="text-sm text-gray-400 font-semibold mb-2 flex justify-between items-center z-10">
          <span class="truncate pr-2">${config.title}</span>
          <div class="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button class="text-blue-400 hover:text-blue-300" onclick="window.editWidget('${config.id}')">⚙️</button>
            <button class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-lg" onclick="this.closest('.grid-stack-item').remove()">&times;</button>
          </div>
        </div>
        <div class="chart-container flex-grow w-full h-full absolute inset-0 pt-8 pb-2 px-2" id="${config.id}"></div>
      </div>
    `;
    this.grid.addWidget(el);
    
    setTimeout(() => {
      const chartDiv = document.getElementById(config.id);
      if(chartDiv) {
        const instance = ChartFactory.create(chartDiv, config);
        this.charts[config.id] = { instance, config };
        
        const resizeObserver = new ResizeObserver(() => ChartFactory.resize(instance));
        resizeObserver.observe(chartDiv);
      }
    }, 100);
  }
};

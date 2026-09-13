import { EventBus } from '../app.js';

let _rawData = [];
let _filteredData = [];
let _filters = {};
let _profile = null;

function _applyAllFilters() {
  _filteredData = _rawData.filter(row => {
    for (const [col, values] of Object.entries(_filters)) {
      if (!values.has(row[col])) return false;
    }
    return true;
  });
}

export const DataEngine = {
  setData(data, profile) {
    _rawData = data || [];
    _filteredData = [..._rawData];
    _profile = profile || { columns: [] };
    EventBus.emit('data:loaded', { data: _filteredData, profile: _profile });
  },

  getFilteredData() { return _filteredData; },
  getRawData() { return _rawData; },
  getProfile() { return _profile; },
  getColumns() { return _profile?.columns || []; },
  
  getNumericCols() {
    return (this.getColumns()).filter(c => c.type === 'number' || c.type === 'float' || c.type === 'integer').map(c => c.name);
  },
  getCategoricalCols() {
    return (this.getColumns()).filter(c => c.type === 'string' || c.type === 'boolean').map(c => c.name);
  },

  applyFilter(col, values) {
    _filters[col] = new Set(Array.isArray(values) ? values : [values]);
    _applyAllFilters();
    EventBus.emit('data:filtered', { filters: _filters, data: _filteredData });
  },

  removeFilter(col) {
    delete _filters[col];
    _applyAllFilters();
    EventBus.emit('data:filtered', { filters: _filters, data: _filteredData });
  },

  clearAllFilters() {
    _filters = {};
    _filteredData = [..._rawData];
    EventBus.emit('data:filtered', { filters: {}, data: _filteredData });
  },

  getActiveFilters() { return { ..._filters }; },

  aggregate(data, groupBy, valueCol, aggFunc) {
    const groups = {};
    data.forEach(row => {
      const key = row[groupBy];
      if (!groups[key]) groups[key] = [];
      if (row[valueCol] !== undefined && row[valueCol] !== null) {
        groups[key].push(Number(row[valueCol]));
      }
    });

    return Object.keys(groups).map(key => {
      const vals = groups[key];
      let val = 0;
      if (vals.length > 0) {
        switch(aggFunc) {
          case 'sum': val = vals.reduce((a,b)=>a+b, 0); break;
          case 'avg': val = vals.reduce((a,b)=>a+b, 0) / vals.length; break;
          case 'min': val = Math.min(...vals); break;
          case 'max': val = Math.max(...vals); break;
          case 'count': val = vals.length; break;
          default: val = vals.reduce((a,b)=>a+b, 0);
        }
      } else if (aggFunc === 'count') {
        val = 0;
      }
      return { label: key, value: val };
    });
  }
};

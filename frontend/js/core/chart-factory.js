import { DataEngine } from './data-engine.js';
import { echartsThemes, getCurrentTheme } from '../ui/theme.js';
import { EventBus } from '../app.js';

export const COLOR_PALETTES = {
  default:    ['#6366f1','#22d3ee','#f59e0b','#10b981','#f43f5e','#8b5cf6','#ec4899','#14b8a6'],
  pastel:     ['#a5b4fc','#67e8f9','#fcd34d','#6ee7b7','#fca5a5','#c4b5fd','#f9a8d4','#5eead4'],
  vibrant:    ['#ff3b3f','#ff9f00','#ffde00','#2ec4b6','#5c6ef8','#ff6bba','#00c9a7','#ff7c43'],
  monochrome: ['#1e3a5f','#2d5986','#3c78ad','#5a9fd4','#88bef5','#b3d4f5','#d6e9fa','#edf4fd'],
  ocean:      ['#0077b6','#00b4d8','#90e0ef','#caf0f8','#023e8a','#48cae4','#0096c7','#ade8f4'],
};

function formatLabel(str) {
  if (str === null || str === undefined) return '';
  const s = String(str);
  if (s.includes('T00:00:00')) {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });
  }
  if (s.length > 20) return s.substring(0, 17) + '...';
  return s;
}

function formatNumber(num) {
  if (num === null || num === undefined) return '';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString();
}

const commonAxis = {
  axisLabel: { formatter: formatLabel, color: '#94a3b8' },
  splitLine: { lineStyle: { color: '#334155', type: 'dashed' } },
  axisLine: { lineStyle: { color: '#475569' } }
};

// Aggregate helper
function agg(data, xCol, yCol, aggFunc = 'sum') {
  if (!xCol || !data.length) return [];
  const groups = {};
  data.forEach(row => {
    const key = String(row[xCol] ?? 'N/A');
    if (!groups[key]) groups[key] = [];
    const v = parseFloat(row[yCol]);
    if (!isNaN(v)) groups[key].push(v);
  });
  return Object.entries(groups).map(([label, vals]) => {
    let value = 0;
    if (aggFunc === 'sum')    value = vals.reduce((a,b) => a+b, 0);
    else if (aggFunc === 'avg' || aggFunc === 'mean') value = vals.reduce((a,b)=>a+b,0)/vals.length||0;
    else if (aggFunc === 'count') value = vals.length;
    else if (aggFunc === 'min')   value = Math.min(...vals);
    else if (aggFunc === 'max')   value = Math.max(...vals);
    else if (aggFunc === 'median') { const s=[...vals].sort((a,b)=>a-b); value=s.length%2?s[Math.floor(s.length/2)]:(s[s.length/2-1]+s[s.length/2])/2; }
    return { label, value: Math.round(value * 100) / 100 };
  }).sort((a,b)=>b.value-a.value);
}

const CHART_TYPES = {
  bar: (d, c) => ({
    tooltip: { trigger:'axis', formatter: (p) => `${formatLabel(p[0].name)}<br/><span style="font-weight:bold">${p[0].value.toLocaleString()}</span>` },
    grid: { left:'5%', right:'5%', bottom:'12%', top:'15%', containLabel:true },
    xAxis: { type:'category', data:d.map(r=>r.label), axisLabel:{ ...commonAxis.axisLabel, rotate:30 }, axisLine: commonAxis.axisLine },
    yAxis: { type:'value', axisLabel:{ formatter: formatNumber, color: '#94a3b8' }, splitLine: commonAxis.splitLine },
    series: [{ data:d.map(r=>r.value), type:'bar', barMaxWidth: 50, itemStyle:{ borderRadius: [4,4,0,0], color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[0] },
      label:{ show: c.showLabels !== false, position:'top', formatter:v=>formatNumber(v.value), color:'#cbd5e1', fontSize: 10 } }]
  }),
  'bar-horizontal': (d, c) => ({
    tooltip:{trigger:'axis', formatter: (p) => `${formatLabel(p[0].name)}<br/><span style="font-weight:bold">${p[0].value.toLocaleString()}</span>`},
    grid:{left:'5%',right:'10%',bottom:'5%',top:'15%',containLabel:true},
    xAxis:{type:'value', axisLabel:{ formatter: formatNumber, color: '#94a3b8' }, splitLine: commonAxis.splitLine},
    yAxis:{type:'category', data:d.map(r=>r.label), axisLabel: commonAxis.axisLabel, axisLine: commonAxis.axisLine},
    series:[{data:d.map(r=>r.value),type:'bar', barMaxWidth: 40, itemStyle:{ borderRadius: [0,4,4,0], color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[1] },
      label:{show: c.showLabels !== false, position:'right', formatter:v=>formatNumber(v.value), color:'#cbd5e1', fontSize: 10}}]
  }),
  'bar-stacked': (d, c) => ({
    tooltip:{trigger:'axis',axisPointer:{type:'shadow'}}, grid:{left:'5%',right:'5%',containLabel:true},
    xAxis: { type:'category', data:d.map(r=>r.label), axisLabel: { ...commonAxis.axisLabel, rotate:30 }, axisLine: commonAxis.axisLine },
    yAxis: { type:'value', axisLabel:{ formatter: formatNumber, color: '#94a3b8' }, splitLine: commonAxis.splitLine },
    series:[{data:d.map(r=>r.value),type:'bar',stack:'total',itemStyle:{color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[2]}}]
  }),
  line: (d, c) => ({
    tooltip:{trigger:'axis', formatter: (p) => `${formatLabel(p[0].name)}<br/><span style="font-weight:bold">${p[0].value.toLocaleString()}</span>`},
    grid:{left:'5%',right:'5%',bottom:'12%',top:'15%',containLabel:true},
    xAxis: { type:'category', data:d.map(r=>r.label), axisLabel: { ...commonAxis.axisLabel, rotate:30 }, axisLine: commonAxis.axisLine },
    yAxis: { type:'value', axisLabel:{ formatter: formatNumber, color: '#94a3b8' }, splitLine: commonAxis.splitLine },
    series:[{data:d.map(r=>r.value),type:'line', smooth:true, symbolSize:6,
      lineStyle:{width:3, color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[3]},
      itemStyle:{color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[3]}}]
  }),
  area: (d, c) => ({
    tooltip:{trigger:'axis', formatter: (p) => `${formatLabel(p[0].name)}<br/><span style="font-weight:bold">${p[0].value.toLocaleString()}</span>`},
    grid:{left:'5%',right:'5%',bottom:'12%',top:'15%',containLabel:true},
    xAxis: { type:'category', data:d.map(r=>r.label), axisLabel: { ...commonAxis.axisLabel, rotate:30 }, axisLine: commonAxis.axisLine },
    yAxis: { type:'value', axisLabel:{ formatter: formatNumber, color: '#94a3b8' }, splitLine: commonAxis.splitLine },
    series:[{data:d.map(r=>r.value),type:'line', smooth:true, symbol:'none',
      areaStyle:{ opacity:0.3, color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[4] },
      lineStyle:{width:2, color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[4]},
      itemStyle:{color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[4]}}]
  }),
  pie: (d, c) => ({
    tooltip: { trigger:'item', formatter: (p) => `${formatLabel(p.name)}<br/>${p.value.toLocaleString()} (${p.percent}%)` },
    legend: { type: 'scroll', orient: 'horizontal', bottom: 0, textStyle: { color: '#cbd5e1', fontSize: 10 }, formatter: formatLabel },
    series: [{ type:'pie', radius:['30%', '65%'], center:['50%','45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 4, borderColor: '#0f172a', borderWidth: 2 },
      label: { show: c.showLabels !== false, position: 'outside', formatter: p => formatLabel(p.name) },
      emphasis: { label: { show: true, fontSize: 12, fontWeight: 'bold' } },
      labelLine: { show: false },
      data:d.map((r,i)=>({name:r.label,value:r.value,itemStyle:{color:(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[i%8]}}))
    }]
  }),
  donut: (d, c) => CHART_TYPES.pie(d, c),
  scatter: (d, c) => ({
    tooltip:{trigger:'item', formatter: (p) => `${formatLabel(p.name)}<br/><span style="font-weight:bold">${p.value[1].toLocaleString()}</span>`},
    grid:{left:'5%',right:'5%',bottom:'12%',top:'15%',containLabel:true},
    xAxis: { type:'category', data:d.map(r=>r.label), axisLabel: { ...commonAxis.axisLabel, rotate:30 }, axisLine: commonAxis.axisLine },
    yAxis: { type:'value', axisLabel:{ formatter: formatNumber, color: '#94a3b8' }, splitLine: commonAxis.splitLine },
    series:[{data:d.map((r,i)=>[i,r.value]),type:'scatter',symbolSize:12,
      itemStyle:{color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[5], opacity:0.8}}]
  }),
  bubble: (d, c) => CHART_TYPES.scatter(d, c),
  heatmap: (d, c) => ({
    tooltip:{position:'top'}, grid:{left:'5%',right:'5%',bottom:'10%',top:'10%',containLabel:true},
    xAxis:{type:'category',data:d.map(r=>r.label), axisLabel: commonAxis.axisLabel},
    yAxis:{type:'category',data:['Value'], axisLabel: commonAxis.axisLabel},
    visualMap:{min:Math.min(...d.map(r=>r.value)),max:Math.max(...d.map(r=>r.value)),calculable:true,orient:'horizontal',left:'center',bottom:0, textStyle:{color:'#94a3b8'}},
    series:[{type:'heatmap',data:d.map((r,i)=>[i,0,r.value]),label:{show: c.showLabels !== false}}]
  }),
  treemap: (d, c) => ({
    tooltip:{formatter: p => `${formatLabel(p.name)}<br/>${p.value.toLocaleString()}`},
    series:[{type:'treemap',roam:false,
      data:d.map((r,i)=>({name:r.label,value:r.value,itemStyle:{color:(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[i%8]}})),
      label:{formatter: p => formatLabel(p.name)}}]
  }),
  funnel: (d, c) => ({
    tooltip:{trigger:'item', formatter: (p) => `${formatLabel(p.name)}<br/>${p.value.toLocaleString()}`},
    series:[{type:'funnel',left:'10%',top:60,bottom:60,width:'80%',
      min:0,max:Math.max(...d.map(r=>r.value)),minSize:'0%',maxSize:'100%',
      sort:'descending',gap:2,
      label:{show: c.showLabels !== false,position:'inside', formatter: p => formatLabel(p.name)},
      itemStyle:{borderColor:'#fff',borderWidth:1},
      data:d.map((r,i)=>({name:r.label,value:r.value,itemStyle:{color:(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[i%8]}}))}]
  }),
  gauge: (d, c) => {
    const total = d.reduce((s,r)=>s+r.value,0);
    const val = d[0]?.value || 0;
    const pct = total ? Math.round(val/total*100) : 0;
    return {
      series:[{type:'gauge',startAngle:90,endAngle:-270,
        pointer:{show:false},
        progress:{show: c.showLabels !== false,overlap:false,roundCap:true,clip:false,
          itemStyle:{borderWidth:1,borderColor:'#0f172a'}},
        axisLine:{lineStyle:{width:18, color:[[1,'#1e293b']]}},
        splitLine:{show:false},axisTick:{show:false},
        axisLabel:{show:false},
        data:[{value:pct,name:formatLabel(d[0]?.label||'Value'),
          title:{offsetCenter:['0%','-15%'],color:'#cbd5e1',fontSize:12},
          detail:{valueAnimation:true,offsetCenter:['0%','10%'],fontSize:24,fontWeight:'bold',color:'#38bdf8'}}],
        detail:{formatter:'{value}%'}}]
    };
  },
  kpi: null,
  histogram: (d, c) => {
    const bins = 10;
    const vals = d.map(r=>r.value).sort((a,b)=>a-b);
    const min = vals[0]||0, max = vals[vals.length-1]||1;
    const step = (max-min)/bins;
    const buckets = Array.from({length:bins},(_,i)=>{
      const lo=min+i*step, hi=lo+step;
      return {label:`${formatNumber(lo)}-${formatNumber(hi)}`, count: vals.filter(v=>v>=lo&&v<hi).length};
    });
    return {
      tooltip:{trigger:'axis'}, grid:{left:'5%',right:'5%',bottom:'10%',top:'15%',containLabel:true},
      xAxis:{type:'category',data:buckets.map(b=>b.label),axisLabel:{...commonAxis.axisLabel, rotate:30}, axisLine: commonAxis.axisLine},
      yAxis:{type:'value', axisLabel:{ formatter: formatNumber, color: '#94a3b8' }, splitLine: commonAxis.splitLine},
      series:[{type:'bar',data:buckets.map(b=>b.count),barWidth:'99%',
        itemStyle:{color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[0]}}]
    };
  },
  boxplot: (d, c) => {
    const vals = d.map(r=>r.value).sort((a,b)=>a-b);
    const q=(arr,q)=>arr[Math.floor((arr.length-1)*q)];
    const boxData = [[q(vals,0),q(vals,0.25),q(vals,0.5),q(vals,0.75),q(vals,1)]];
    return {
      tooltip:{trigger:'item'}, grid:{left:'10%',right:'10%',bottom:'10%',top:'15%',containLabel:true},
      xAxis:{type:'category',data:['Distribution'], axisLabel: commonAxis.axisLabel, axisLine: commonAxis.axisLine},
      yAxis:{type:'value', axisLabel:{ formatter: formatNumber, color: '#94a3b8' }, splitLine: commonAxis.splitLine},
      series:[{type:'boxplot',data:boxData,
        itemStyle:{color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[0]}}]
    };
  },
  waterfall: (d, c) => {
    let running = 0;
    const helper = [], bar = [];
    d.forEach(r => {
      helper.push(running);
      bar.push(r.value);
      running += r.value;
    });
    return {
      tooltip:{trigger:'axis',axisPointer:{type:'shadow'},
        formatter: params => {
          const real=params[1]; return `${formatLabel(real.name)}<br/>${real.value.toLocaleString()}`;
        }},
      grid:{left:'5%',right:'5%',bottom:'12%',top:'15%',containLabel:true},
      xAxis:{type:'category',data:d.map(r=>r.label),axisLabel:{...commonAxis.axisLabel, rotate:30}, axisLine: commonAxis.axisLine},
      yAxis:{type:'value', axisLabel:{ formatter: formatNumber, color: '#94a3b8' }, splitLine: commonAxis.splitLine},
      series:[
        {type:'bar',stack:'total',itemStyle:{borderColor:'transparent',color:'transparent'},
         emphasis:{itemStyle:{borderColor:'transparent',color:'transparent'}},data:helper},
        {type:'bar',stack:'total',data:bar, itemStyle:{borderRadius: [4,4,0,0], color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[0]},
         label:{show: c.showLabels !== false,position:'top',formatter:v=>formatNumber(v.value), color:'#cbd5e1', fontSize: 10}}
      ]
    };
  },
  radar: (d, c) => ({
    tooltip:{},
    radar:{indicator:d.slice(0,8).map(r=>({name:formatLabel(r.label),max:Math.max(...d.map(x=>x.value))*1.2}))},
    series:[{type:'radar',data:[{value:d.slice(0,8).map(r=>r.value),name:'Values',
      areaStyle:{opacity:0.2},lineStyle:{color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[0]},
      itemStyle:{color:c.palette?.[0]||(COLOR_PALETTES[c.paletteName]||COLOR_PALETTES.default)[0]}}]}]
  }),
};

export const CHART_TYPE_LIST = [
  {type:'bar',          label:'Bar',        icon:'📊'},
  {type:'bar-horizontal',label:'Horiz Bar', icon:'📉'},
  {type:'bar-stacked',  label:'Stacked Bar', icon:'📚'},
  {type:'line',         label:'Line',       icon:'📈'},
  {type:'area',         label:'Area',       icon:'🏔️'},
  {type:'pie',          label:'Pie',        icon:'🥧'},
  {type:'donut',        label:'Donut',      icon:'⭕'},
  {type:'scatter',      label:'Scatter',    icon:'✦'},
  {type:'bubble',       label:'Bubble',     icon:'🔵'},
  {type:'heatmap',      label:'Heatmap',    icon:'🟥'},
  {type:'treemap',      label:'Treemap',    icon:'🗂️'},
  {type:'funnel',       label:'Funnel',     icon:'🔻'},
  {type:'gauge',        label:'Gauge',      icon:'🕐'},
  {type:'kpi',          label:'KPI Card',   icon:'🔢'},
  {type:'histogram',    label:'Histogram',  icon:'📶'},
  {type:'boxplot',      label:'Box Plot',   icon:'📦'},
  {type:'waterfall',    label:'Waterfall',  icon:'💧'},
  {type:'radar',        label:'Radar',      icon:'🕸️'},
];

export const ChartFactory = {
  _instances: {},

  create(container, config) {
    const data = DataEngine.getFilteredData();
    const aggData = agg(data, config.xCol, config.yCol, config.aggFunc || 'sum');

    if (config.type === 'kpi') {
      const vals = data.map(r => parseFloat(r[config.yCol])).filter(v => !isNaN(v));
      const total = vals.reduce((a,b) => a+b, 0);
      const avg = vals.length ? total/vals.length : 0;
      const displayVal = (config.aggFunc==='avg'||config.aggFunc==='mean') ? avg : total;
      container.innerHTML = `
        <div class="kpi-card" style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100%;padding:1rem;text-align:center;">
          <div style="font-size:2.5rem;font-weight:800;color:var(--accent)">${formatNumber(displayVal)}</div>
          <div style="font-size:0.9rem;color:var(--text-secondary);margin-top:0.5rem">${config.title || config.yCol || 'KPI'}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.25rem">${vals.length.toLocaleString()} records</div>
        </div>`;
      const kpiInst = { _isKpi:true, resize:()=>{}, dispose:()=>{ container.innerHTML=''; }, config };
      this._instances[config.id] = kpiInst;
      return kpiInst;
    }

    const generator = CHART_TYPES[config.type] || CHART_TYPES.bar;
    const option = generator(aggData, config);

    // Apply title
    option.title = { text: config.title || '', left:'center', textStyle:{ color: getCurrentTheme()==='dark'||getCurrentTheme()==='ocean' ? '#94a3b8' : '#374151', fontSize:13 } };
    option.backgroundColor = 'transparent';

    const theme = getCurrentTheme();
    const chart = echarts.init(container, theme === 'dark' || theme === 'ocean' ? 'dark' : null, { renderer:'canvas' });
    chart.setOption(option);

    // Cross-filter on click
    chart.on('click', params => {
      if (params.name) {
        DataEngine.applyFilter(config.xCol, params.name);
      }
    });

    this._instances[config.id] = chart;

    // Auto-update on data filter
    EventBus.on('data:filtered', () => this.update(chart, config));

    return chart;
  },

  update(inst, config) {
    if (!inst || inst._isKpi) return;
    const data = DataEngine.getFilteredData();
    const aggData = agg(data, config.xCol, config.yCol, config.aggFunc || 'sum');
    const generator = CHART_TYPES[config.type] || CHART_TYPES.bar;
    inst.setOption(generator(aggData, config), { notMerge:false });
  },

  resize(inst) {
    if (inst && !inst._isKpi && inst.resize) inst.resize();
  },

  dispose(inst) {
    if (inst && !inst._isKpi && inst.dispose) inst.dispose();
  },

  downloadPNG(inst, filename = 'chart.png') {
    if (!inst || inst._isKpi) return;
    const url = inst.getDataURL({ type:'png', pixelRatio:2, backgroundColor:'#0f172a' });
    const a = document.createElement('a');
    a.download = filename;
    a.href = url;
    a.click();
  },

  getPNGBase64(inst) {
    if (!inst || inst._isKpi) return null;
    return inst.getDataURL({ type:'png', pixelRatio:2 });
  },

  // Aggregate (exported for external use)
  aggregate: agg,
};

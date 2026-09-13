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
    tooltip: { trigger:'axis' }, grid: { left:'5%', right:'5%', bottom:'10%', containLabel:true },
    xAxis: { type:'category', data:d.map(r=>r.label), axisLabel:{rotate:30} },
    yAxis: { type:'value' },
    series: [{ data:d.map(r=>r.value), type:'bar', itemStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[0]},
      label:{show:true, position:'top', formatter:v=>v.value.toLocaleString()} }]
  }),
  'bar-horizontal': (d, c) => ({
    tooltip:{trigger:'axis'}, grid:{left:'15%',right:'5%',containLabel:true},
    xAxis:{type:'value'},
    yAxis:{type:'category', data:d.map(r=>r.label)},
    series:[{data:d.map(r=>r.value),type:'bar',itemStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[1]}}]
  }),
  'bar-stacked': (d, c) => ({
    tooltip:{trigger:'axis',axisPointer:{type:'shadow'}}, grid:{left:'5%',right:'5%',containLabel:true},
    xAxis:{type:'category',data:d.map(r=>r.label)},
    yAxis:{type:'value'},
    series: d.slice(0,4).map((item,i) => ({
      name:item.label, type:'bar', stack:'total',
      data: d.map((_,j) => j===i ? item.value : 0),
      itemStyle:{color:COLOR_PALETTES.default[i]}
    }))
  }),
  line: (d, c) => ({
    tooltip:{trigger:'axis'}, grid:{left:'5%',right:'5%',bottom:'10%',containLabel:true},
    xAxis:{type:'category',data:d.map(r=>r.label),boundaryGap:false},
    yAxis:{type:'value'},
    series:[{data:d.map(r=>r.value),type:'line',smooth:true,
      areaStyle:{opacity:0.15},
      lineStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[0],width:3},
      itemStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[0]}}]
  }),
  area: (d, c) => ({
    tooltip:{trigger:'axis'}, grid:{left:'5%',right:'5%',bottom:'10%',containLabel:true},
    xAxis:{type:'category',data:d.map(r=>r.label),boundaryGap:false},
    yAxis:{type:'value'},
    series:[{data:d.map(r=>r.value),type:'line',smooth:true,
      areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(99,102,241,0.5)'},{offset:1,color:'rgba(99,102,241,0.0)'}]}},
      lineStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[0],width:2}}]
  }),
  pie: (d, c) => ({
    tooltip:{trigger:'item',formatter:'{b}: {c} ({d}%)'},
    legend:{orient:'vertical',left:'left'},
    series:[{type:'pie',radius:'60%',data:d.map(r=>({name:r.label,value:r.value})),
      itemStyle:{borderRadius:5,borderWidth:2,borderColor:'transparent'},
      label:{formatter:'{b}\n{d}%'}}]
  }),
  donut: (d, c) => ({
    tooltip:{trigger:'item',formatter:'{b}: {c} ({d}%)'},
    legend:{bottom:'0'},
    series:[{type:'pie',radius:['40%','70%'],avoidLabelOverlap:false,
      data:d.map(r=>({name:r.label,value:r.value})),
      label:{show:true,position:'center',formatter:()=>d.length+'',fontSize:28,fontWeight:'bold'},
      emphasis:{label:{show:true}}}]
  }),
  scatter: (d, c) => ({
    tooltip:{trigger:'item',formatter: p=>`${p.name}: (${p.value[0]}, ${p.value[1]})`},
    grid:{left:'5%',right:'5%',containLabel:true},
    xAxis:{type:'value',scale:true},
    yAxis:{type:'value',scale:true},
    series:[{type:'scatter',data:d.map(r=>[r.label,r.value]),
      itemStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[3],opacity:0.7},symbolSize:12}]
  }),
  bubble: (d, c) => ({
    tooltip:{trigger:'item'},
    grid:{left:'5%',right:'5%',containLabel:true},
    xAxis:{type:'value',scale:true}, yAxis:{type:'value',scale:true},
    series:[{type:'scatter',data:d.map((r,i)=>[i, r.value, r.value/5]),
      symbolSize: v => Math.sqrt(v[2])*3,
      itemStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[2],opacity:0.8}}]
  }),
  heatmap: (d, c) => {
    const days=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    const data = d.slice(0,7).map((r,i)=>d.slice(0,Math.min(7,d.length)).map((r2,j)=>[j,i,Math.round(r.value/(i+1))])).flat();
    return {
      tooltip:{position:'top',formatter:p=>`${p.value[2]}`},
      grid:{left:'10%',right:'5%',containLabel:true},
      xAxis:{type:'category',data:d.slice(0,7).map(r=>r.label)},
      yAxis:{type:'category',data:days},
      visualMap:{min:0,max:Math.max(...data.map(d=>d[2])),calculable:true,orient:'horizontal',left:'center',bottom:'0'},
      series:[{name:'data',type:'heatmap',data,label:{show:true},emphasis:{itemStyle:{shadowBlur:10,shadowColor:'rgba(0,0,0,0.5)'}}}]
    };
  },
  treemap: (d, c) => ({
    tooltip:{trigger:'item',formatter:'{b}: {c}'},
    series:[{type:'treemap',data:d.map((r,i)=>({name:r.label,value:r.value,
      itemStyle:{color:COLOR_PALETTES.default[i%8]}})),
      label:{show:true,formatter:'{b}\n{c}'},roam:false}]
  }),
  funnel: (d, c) => ({
    tooltip:{trigger:'item',formatter:'{b}: {c}'},
    series:[{type:'funnel',left:'10%',top:60,bottom:60,width:'80%',
      min:0,max:Math.max(...d.map(r=>r.value)),minSize:'0%',maxSize:'100%',
      sort:'descending',gap:2,
      data:d.map((r,i)=>({name:r.label,value:r.value,itemStyle:{color:COLOR_PALETTES.default[i%8]}})),
      label:{show:true,position:'inside'}}]
  }),
  gauge: (d, c) => {
    const total = d.reduce((s,r)=>s+r.value,0);
    const val = d[0]?.value || 0;
    const pct = total ? Math.round(val/total*100) : 0;
    return {
      series:[{type:'gauge',startAngle:90,endAngle:-270,
        pointer:{show:false},
        progress:{show:true,overlap:false,roundCap:true,clip:false,
          itemStyle:{borderWidth:1,borderColor:'#464646'}},
        axisLine:{lineStyle:{width:18}},
        splitLine:{show:false},axisTick:{show:false},
        axisLabel:{show:false},
        data:[{value:pct,name:d[0]?.label||'Value',
          title:{offsetCenter:['0%','-15%'],color:'inherit',fontSize:14},
          detail:{valueAnimation:true,offsetCenter:['0%','10%'],width:'60%',
            overflow:'truncate',fontSize:30,fontWeight:'bold',color:'inherit'}}],
        detail:{width:50,height:14,fontSize:14,color:'inherit',formatter:'{value}%'}}]
    };
  },
  kpi: null, // handled separately
  histogram: (d, c) => {
    const bins = 10;
    const vals = d.map(r=>r.value).sort((a,b)=>a-b);
    const min = vals[0]||0, max = vals[vals.length-1]||1;
    const step = (max-min)/bins;
    const buckets = Array.from({length:bins},(_,i)=>{
      const lo=min+i*step, hi=lo+step;
      return {label:`${lo.toFixed(0)}-${hi.toFixed(0)}`, count: vals.filter(v=>v>=lo&&v<hi).length};
    });
    return {
      tooltip:{trigger:'axis'},
      grid:{left:'5%',right:'5%',containLabel:true},
      xAxis:{type:'category',data:buckets.map(b=>b.label),axisLabel:{rotate:30}},
      yAxis:{type:'value'},
      series:[{type:'bar',data:buckets.map(b=>b.count),barWidth:'99%',
        itemStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[0]}}]
    };
  },
  boxplot: (d, c) => {
    const vals = d.map(r=>r.value).sort((a,b)=>a-b);
    const q=(arr,q)=>arr[Math.floor(arr.length*q)];
    const boxData = [[q(vals,0),q(vals,0.25),q(vals,0.5),q(vals,0.75),q(vals,1)]];
    return {
      tooltip:{trigger:'item'},
      grid:{left:'10%',right:'10%',containLabel:true},
      xAxis:{type:'category',data:['Distribution']},
      yAxis:{type:'value'},
      series:[{type:'boxplot',data:boxData,
        itemStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[0]}}]
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
          const real=params[1]; return `${real.name}: ${real.value.toLocaleString()}`;
        }},
      grid:{left:'5%',right:'5%',containLabel:true},
      xAxis:{type:'category',data:d.map(r=>r.label),axisLabel:{rotate:30}},
      yAxis:{type:'value'},
      series:[
        {type:'bar',stack:'total',itemStyle:{borderColor:'transparent',color:'transparent'},
         emphasis:{itemStyle:{borderColor:'transparent',color:'transparent'}},data:helper},
        {type:'bar',stack:'total',data:bar,
         itemStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[0]},
         label:{show:true,position:'top',formatter:v=>v.value.toLocaleString()}}
      ]
    };
  },
  radar: (d, c) => ({
    tooltip:{},
    radar:{indicator:d.slice(0,8).map(r=>({name:r.label,max:Math.max(...d.map(x=>x.value))*1.2}))},
    series:[{type:'radar',data:[{value:d.slice(0,8).map(r=>r.value),name:'Values',
      areaStyle:{opacity:0.2},lineStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[0]},
      itemStyle:{color:c.palette?.[0]||COLOR_PALETTES.default[0]}}]}]
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
          <div style="font-size:2.5rem;font-weight:800;color:var(--accent)">${displayVal.toLocaleString(undefined,{maximumFractionDigits:0})}</div>
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
        const { EventBus: EB } = await import('../app.js').catch(()=>({EventBus:null}));
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

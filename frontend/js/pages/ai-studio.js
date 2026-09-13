import { Toast, AppState, API } from '../app.js';
import { DataEngine } from '../core/data-engine.js';
import { ChartFactory } from '../core/chart-factory.js';

export default {
  render(container) {
    if (!AppState.currentSession) {
      container.innerHTML = `<div class="glass-card p-10 text-center"><p class="text-xl">Please load data first in Data Sources.</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="flex flex-col h-full gap-4 fade-in">
        <div class="glass-card flex gap-4 p-2 border-b-2 border-gray-700">
          <button class="tab-btn px-4 py-2 font-bold text-blue-400 border-b-2 border-blue-400" data-tab="nlq">Data Q&A</button>
          <button class="tab-btn px-4 py-2 font-bold text-gray-400 hover:text-gray-200" data-tab="insights">Auto-Insights</button>
        </div>
        
        <!-- NLQ Tab -->
        <div id="tab-nlq" class="tab-content flex-grow flex flex-col gap-4">
          <div class="glass-card p-6 flex flex-col gap-4">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-bold">Ask your data anything</h3>
              <div class="flex gap-2 items-center text-sm">
                <span class="text-gray-400">AI Provider:</span>
                <select id="ai-provider" class="bg-gray-800 border border-gray-600 rounded p-1">
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI GPT-4o</option>
                  <option value="anthropic">Anthropic Claude</option>
                </select>
                <input type="password" id="ai-key" class="bg-gray-800 border border-gray-600 rounded p-1 w-48" placeholder="Enter API Key...">
              </div>
            </div>
            
            <div class="flex gap-2">
              <input type="text" id="nlq-input" class="flex-grow p-4 bg-gray-800 border border-gray-600 rounded text-white text-lg focus:border-blue-500 outline-none" placeholder="e.g. Which region has the highest revenue?">
              <button id="nlq-send" class="btn btn-primary px-8 text-lg font-bold">Ask</button>
            </div>
          </div>
          
          <div class="glass-card flex-grow overflow-auto p-6" id="nlq-results">
            <div class="text-gray-500 text-center mt-20 flex flex-col items-center">
              <span class="text-6xl mb-4 opacity-50">🤖</span>
              <p>Type a question above to generate SQL, Python, or Charts automatically using AI.</p>
            </div>
          </div>
        </div>

        <!-- Insights Tab -->
        <div id="tab-insights" class="tab-content hidden flex-grow flex flex-col gap-4">
          <div class="glass-card p-6 flex justify-between items-center">
            <div>
              <h3 class="text-lg font-bold">AI Auto-Insights</h3>
              <p class="text-sm text-gray-400">Discover hidden patterns, trends, and anomalies in your dataset.</p>
            </div>
            <button id="btn-generate-insights" class="btn btn-primary px-6">Generate Insights ✨</button>
          </div>
          <div id="insights-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-2 overflow-auto">
            <div class="col-span-full text-center text-gray-500 mt-10">Click Generate Insights to begin analysis.</div>
          </div>
        </div>
      </div>
    `;

    // Tab Logic
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        container.querySelectorAll('.tab-btn').forEach(b => {
          b.classList.remove('text-blue-400', 'border-b-2', 'border-blue-400');
          b.classList.add('text-gray-400');
        });
        e.target.classList.remove('text-gray-400');
        e.target.classList.add('text-blue-400', 'border-b-2', 'border-blue-400');
        
        container.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
        container.querySelector(`#tab-${e.target.getAttribute('data-tab')}`).classList.remove('hidden');
      });
    });

    const providerSel = container.querySelector('#ai-provider');
    const keyInp = container.querySelector('#ai-key');

    providerSel.addEventListener('change', () => {
      keyInp.value = localStorage.getItem(`manz_key_${providerSel.value}`) || '';
      localStorage.setItem('manz_ai_provider', providerSel.value);
    });
    
    providerSel.value = localStorage.getItem('manz_ai_provider') || 'gemini';
    keyInp.value = localStorage.getItem(`manz_key_${providerSel.value}`) || '';

    keyInp.addEventListener('change', () => {
      localStorage.setItem(`manz_key_${providerSel.value}`, keyInp.value);
    });

    // NLQ Logic
    container.querySelector('#nlq-send').onclick = async () => {
      const question = container.querySelector('#nlq-input').value;
      if (!question) return;
      if (!keyInp.value) return Toast.error('Please enter an API Key first');

      const results = container.querySelector('#nlq-results');
      results.innerHTML = `<div class="flex flex-col items-center mt-20"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div><p class="text-blue-400">AI is analyzing your question...</p></div>`;
      
      try {
        const res = await API.post('/api/ai/nlq', {
          session_id: AppState.currentSession,
          question: question,
          provider: providerSel.value,
          api_key: keyInp.value
        });

        let html = `
          <h4 class="font-bold text-xl mb-4 text-blue-300">Answer:</h4>
          <p class="text-gray-200 mb-6 text-lg leading-relaxed">${res.explanation}</p>
        `;

        if (res.sql_query) {
          html += `
            <h5 class="font-bold mb-2 text-gray-400">Generated Query:</h5>
            <div class="bg-gray-900 p-4 rounded border border-gray-700 font-mono text-sm text-green-400 mb-6 shadow-inner">
              ${res.sql_query}
            </div>
          `;
        }

        if (res.result && res.result.length > 0) {
          const cols = Object.keys(res.result[0]);
          html += `
            <h5 class="font-bold mb-2 text-gray-400">Data Result (First 100 rows):</h5>
            <div class="overflow-auto border border-gray-700 rounded mb-6 max-h-64 shadow">
              <table class="w-full text-left border-collapse">
                <thead class="bg-gray-800 sticky top-0 shadow">
                  <tr>${cols.map(c => `<th class="p-2 border-b border-gray-700 font-bold">${c}</th>`).join('')}</tr>
                </thead>
                <tbody>
                  ${res.result.map((row, i) => `
                    <tr class="${i%2===0?'bg-gray-900':'bg-gray-800'} hover:bg-blue-900 transition-colors">
                      ${cols.map(c => `<td class="p-2 border-b border-gray-700">${row[c]}</td>`).join('')}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }
        results.innerHTML = html;
      } catch (err) {
        results.innerHTML = `<div class="p-4 bg-red-900/50 border border-red-500 rounded text-red-200">${err.message}</div>`;
      }
    };

    // Insights Logic
    container.querySelector('#btn-generate-insights').onclick = async () => {
      if (!keyInp.value) return Toast.error('Please enter an API Key first');
      const c = container.querySelector('#insights-container');
      c.innerHTML = `<div class="col-span-full flex flex-col items-center mt-20"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div><p class="text-purple-400">Scanning millions of data points for patterns...</p></div>`;
      
      try {
        const res = await API.post('/api/ai/insights', {
          session_id: AppState.currentSession,
          provider: providerSel.value,
          api_key: keyInp.value
        });

        c.innerHTML = '';
        if (!res.insights || res.insights.length === 0) {
          c.innerHTML = '<div class="col-span-full text-center text-gray-500">No significant insights found.</div>';
          return;
        }

        const icons = { trend:'📈', anomaly:'🚨', correlation:'🔗', distribution:'📊', recommendation:'💡' };
        const colors = { high:'border-red-500', medium:'border-yellow-500', low:'border-blue-500' };

        res.insights.forEach(ins => {
          c.innerHTML += `
            <div class="glass-card p-5 border-l-4 ${colors[ins.severity] || 'border-gray-500'} hover:-translate-y-1 transition-transform shadow-lg">
              <div class="flex items-center gap-2 mb-3">
                <span class="text-2xl">${icons[ins.type] || '📌'}</span>
                <h4 class="font-bold text-lg leading-tight">${ins.title}</h4>
              </div>
              <p class="text-gray-300 text-sm leading-relaxed">${ins.description}</p>
              <div class="mt-4 flex gap-2">
                <span class="text-xs px-2 py-1 bg-gray-800 rounded uppercase tracking-wider text-gray-400">${ins.type}</span>
                <span class="text-xs px-2 py-1 bg-gray-800 rounded uppercase tracking-wider text-gray-400">${ins.severity} priority</span>
              </div>
            </div>
          `;
        });
      } catch (err) {
        c.innerHTML = `<div class="col-span-full p-4 bg-red-900/50 border border-red-500 rounded text-red-200">${err.message}</div>`;
      }
    };
  }
};

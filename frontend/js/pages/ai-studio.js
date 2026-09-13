import { Toast } from '../app.js';
import { DataEngine } from '../core/data-engine.js';

export default {
  render(container) {
    container.innerHTML = `
      <div class="flex flex-col h-full gap-4 fade-in">
        <div class="glass-card flex gap-4 p-2 border-b-2 border-gray-700">
          <button class="tab-btn px-4 py-2 font-bold text-blue-400 border-b-2 border-blue-400" data-tab="nlq">Natural Language Query</button>
          <button class="tab-btn px-4 py-2 font-bold text-gray-400 hover:text-gray-200" data-tab="insights">Auto-Insights</button>
          <button class="tab-btn px-4 py-2 font-bold text-gray-400 hover:text-gray-200" data-tab="anomalies">Anomaly Detection</button>
        </div>
        
        <div id="tab-nlq" class="flex-grow flex flex-col gap-4">
          <div class="glass-card p-6 flex flex-col gap-4">
            <div class="flex justify-between">
              <h3 class="text-lg font-bold">Ask your data</h3>
              <div class="flex gap-2 items-center text-sm">
                <span class="text-gray-400">Provider:</span>
                <select id="nlq-provider" class="bg-gray-800 border border-gray-600 rounded p-1">
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI GPT-4o</option>
                  <option value="anthropic">Anthropic Claude</option>
                  <option value="cohere">Cohere Command-R</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
                <input type="password" id="nlq-key" class="bg-gray-800 border border-gray-600 rounded p-1 w-32" placeholder="API Key">
                <input type="text" id="nlq-model" class="hidden bg-gray-800 border border-gray-600 rounded p-1 w-32" placeholder="Model Name">
              </div>
            </div>
            
            <div class="flex gap-2">
              <input type="text" id="nlq-input" class="flex-grow p-3 bg-gray-800 border border-gray-600 rounded text-white text-lg" placeholder="e.g. What is the total sales by region?">
              <button id="nlq-send" class="btn btn-primary px-6"><svg class="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
            </div>
          </div>
          
          <div class="glass-card flex-grow overflow-auto p-6" id="nlq-results">
            <div class="text-gray-500 text-center mt-20">Results will appear here.</div>
          </div>
        </div>
      </div>
    `;

    const providerSel = container.querySelector('#nlq-provider');
    const keyInp = container.querySelector('#nlq-key');
    const modelInp = container.querySelector('#nlq-model');

    const updateUI = () => {
      const p = providerSel.value;
      if (p === 'ollama') {
        keyInp.classList.add('hidden');
        modelInp.classList.remove('hidden');
        modelInp.value = localStorage.getItem('manz_model_ollama') || '';
      } else {
        keyInp.classList.remove('hidden');
        modelInp.classList.add('hidden');
        keyInp.value = localStorage.getItem(`manz_key_${p}`) || '';
      }
    };

    providerSel.addEventListener('change', updateUI);
    providerSel.value = localStorage.getItem('manz_ai_provider') || 'gemini';
    updateUI();

    container.querySelector('#nlq-send').onclick = () => {
      const query = container.querySelector('#nlq-input').value;
      if(!query) return;
      const results = container.querySelector('#nlq-results');
      results.innerHTML = `<div class="animate-pulse text-blue-400">Analyzing query: "${query}"...</div>`;
      
      setTimeout(() => {
        results.innerHTML = `
          <h4 class="font-bold text-lg mb-2">Answer:</h4>
          <p class="text-gray-300 mb-4">Based on your dataset, here is the breakdown.</p>
          <div class="bg-gray-800 p-4 rounded border border-gray-700 font-mono text-sm text-green-400 mb-4">
            SELECT region, SUM(sales) FROM dataset GROUP BY region;
          </div>
        `;
      }, 1000);
    };
  }
};

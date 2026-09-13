import { Toast, AppState, API } from '../app.js';
import { ExportEngine } from '../core/export.js';

let lastGeneratedReport = "";

export default {
  render(container) {
    if (!AppState.currentSession) {
      container.innerHTML = \`<div class="glass-card p-10 text-center"><p class="text-xl">Please load data first in Data Sources.</p></div>\`;
      return;
    }

    container.innerHTML = \`
      <div class="flex h-full gap-6 fade-in">
        <div class="w-1/3 glass-card flex flex-col gap-4 p-5">
          <h2 class="text-xl font-bold mb-2">Report Config</h2>
          
          <label class="text-sm font-semibold">Title</label>
          <input type="text" id="rep-title" class="p-2 bg-gray-800 rounded border border-gray-600 text-white" value="Executive Summary">
          
          <label class="text-sm font-semibold mt-2">AI Provider</label>
          <select id="ai-provider" class="p-2 bg-gray-800 rounded border border-gray-600 text-white">
            <option value="gemini">Google Gemini</option>
            <option value="openai">OpenAI GPT-4o</option>
            <option value="anthropic">Anthropic Claude</option>
          </select>
          
          <div id="api-key-container" class="flex flex-col gap-1">
            <label class="text-sm font-semibold mt-2">API Key</label>
            <input type="password" id="ai-key" class="p-2 bg-gray-800 rounded border border-gray-600 text-white" placeholder="Enter API Key">
          </div>
          
          <label class="text-sm font-semibold mt-2">Context / Notes</label>
          <textarea id="rep-notes" class="p-2 bg-gray-800 rounded border border-gray-600 text-white h-24" placeholder="What should the report focus on?"></textarea>
          
          <button id="btn-generate" class="btn btn-primary mt-4 py-3 text-lg font-bold">Generate Report</button>
        </div>
        
        <div class="w-2/3 glass-card flex flex-col p-5">
          <div class="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
            <h2 class="text-xl font-bold">Report Viewer</h2>
            <div class="flex gap-2">
              <button id="btn-pdf" class="btn btn-secondary text-sm">Export PDF</button>
              <button id="btn-pptx" class="btn btn-secondary text-sm">Export PPTX</button>
            </div>
          </div>
          <div id="report-content" class="flex-grow overflow-y-auto max-w-none text-gray-300 markdown-body">
            <p class="text-center text-gray-500 italic mt-20">Click Generate to create an AI-powered report based on your data.</p>
          </div>
        </div>
      </div>
    \`;

    const providerSel = container.querySelector('#ai-provider');
    const keyInp = container.querySelector('#ai-key');

    providerSel.addEventListener('change', () => {
      keyInp.value = localStorage.getItem(\`manz_key_\${providerSel.value}\`) || '';
      localStorage.setItem('manz_ai_provider', providerSel.value);
    });
    
    providerSel.value = localStorage.getItem('manz_ai_provider') || 'gemini';
    keyInp.value = localStorage.getItem(\`manz_key_\${providerSel.value}\`) || '';

    keyInp.addEventListener('change', () => {
      localStorage.setItem(\`manz_key_\${providerSel.value}\`, keyInp.value);
    });

    container.querySelector('#btn-generate').onclick = async () => {
      const title = document.getElementById('rep-title').value;
      const notes = document.getElementById('rep-notes').value;
      const provider = providerSel.value;
      const apiKey = keyInp.value;

      if (!apiKey) return Toast.error('Please enter an API Key first');

      const content = container.querySelector('#report-content');
      content.innerHTML = \`<div class="flex flex-col items-center justify-center h-full gap-4 mt-10 text-blue-400">
        <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
        <p class="text-lg">Generating highly detailed executive report with \${provider}...</p>
      </div>\`;
      
      try {
        const res = await API.post('/api/ai/report', {
          session_id: AppState.currentSession,
          provider: provider,
          api_key: apiKey,
          title: title,
          notes: notes
        });

        lastGeneratedReport = res.report;
        content.innerHTML = marked.parse(res.report);
        
        Toast.success('Report generated successfully.');
      } catch (err) {
        content.innerHTML = \`<div class="p-4 bg-red-900/50 border border-red-500 rounded text-red-200">\${err.message}</div>\`;
      }
    };

    container.querySelector('#btn-pdf').onclick = () => {
      if (!lastGeneratedReport) return Toast.error('Please generate a report first');
      ExportEngine.exportPDF(document.getElementById('rep-title').value, lastGeneratedReport);
    };

    container.querySelector('#btn-pptx').onclick = () => {
      if (!lastGeneratedReport) return Toast.error('Please generate a report first');
      ExportEngine.exportPPTX(document.getElementById('rep-title').value, lastGeneratedReport);
    };
  }
};

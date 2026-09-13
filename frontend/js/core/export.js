import { AppState, API, Toast } from '../app.js';
import { DataEngine } from './data-engine.js';

export const ExportEngine = {
  downloadCSV() {
    const data = DataEngine.getFilteredData();
    if (!data.length) return Toast.info('No data to export');
    
    const cols = Object.keys(data[0]);
    const csv = [
      cols.join(','),
      ...data.map(row => cols.map(c => `"${String(row[c] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    triggerDownload(csv, 'manzstudio-data.csv', 'text/csv');
  },

  async screenshotDashboard() {
    const canvas = document.getElementById('dashboard-canvas');
    if (!canvas) return Toast.error('Dashboard not found');
    
    try {
      Toast.info('Generating screenshot...');
      const h2c = await html2canvas(canvas, { backgroundColor: '#0f172a' });
      const link = document.createElement('a');
      link.download = 'manzstudio-dashboard.png';
      link.href = h2c.toDataURL();
      link.click();
    } catch(e) {
      Toast.error('Screenshot failed');
    }
  },

  async exportPDF(title, reportText) {
    Toast.info('PDF export simulated (requires backend)');
  },

  async exportPPTX(title) {
    Toast.info('PPTX export simulated (requires backend)');
  }
};

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

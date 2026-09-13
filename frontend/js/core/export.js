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
    Toast.info('Generating PDF...');
    try {
      const res = await fetch('http://localhost:8050/api/export/pdf?report_text=' + encodeURIComponent(reportText||''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: AppState.currentSession,
          format: 'pdf',
          title: title,
          charts_data: []
        })
      });
      if (!res.ok) throw new Error('PDF Generation failed');
      const blob = await res.blob();
      triggerDownloadBlob(blob, `${title}.pdf`);
      Toast.success('PDF Exported');
    } catch(e) {
      Toast.error(e.message);
    }
  },

  async exportPPTX(title, reportText) {
    Toast.info('Generating PPTX...');
    try {
      const res = await fetch('http://localhost:8050/api/export/pptx?report_text=' + encodeURIComponent(reportText||''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: AppState.currentSession,
          format: 'pptx',
          title: title,
          charts_data: []
        })
      });
      if (!res.ok) throw new Error('PPTX Generation failed');
      const blob = await res.blob();
      triggerDownloadBlob(blob, `${title}.pptx`);
      Toast.success('PPTX Exported');
    } catch(e) {
      Toast.error(e.message);
    }
  }
};

function triggerDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

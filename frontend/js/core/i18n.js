export const LANGS = {
  en: { 
    app_title: 'ManzStudio', nav_home: 'Home', nav_data: 'Data Sources', nav_table: 'Data Table', 
    nav_data_source: 'Data Sources', nav_data_table: 'Data Table', nav_ai_studio: 'AI Studio',
    nav_dashboard: 'Dashboard', nav_pivot: 'Pivot Table', nav_reports: 'Reports', nav_ai: 'AI Studio', 
    btn_upload: 'Upload File', btn_connect: 'Connect', btn_generate: 'Generate', btn_export: 'Export', 
    btn_clear_filters: 'Clear All Filters', lbl_no_data: 'No data loaded. Go to Data Sources to get started.',
    btn_save: 'Save'
  },
  id: { 
    app_title: 'ManzStudio', nav_home: 'Beranda', nav_data: 'Sumber Data', nav_table: 'Tabel Data', 
    nav_data_source: 'Sumber Data', nav_data_table: 'Tabel Data', nav_ai_studio: 'Studio AI',
    nav_dashboard: 'Dasbor', nav_pivot: 'Tabel Pivot', nav_reports: 'Laporan', nav_ai: 'Studio AI', 
    btn_upload: 'Unggah File', btn_connect: 'Hubungkan', btn_generate: 'Buat', btn_export: 'Ekspor', 
    btn_clear_filters: 'Bersihkan Semua Filter', lbl_no_data: 'Belum ada data. Buka Sumber Data untuk memulai.',
    btn_save: 'Simpan'
  },
  ar: { 
    app_title: 'ManzStudio', nav_home: 'الرئيسية', nav_data: 'مصادر البيانات', nav_table: 'جدول البيانات', nav_data_source: 'مصادر البيانات', nav_data_table: 'جدول البيانات', nav_ai_studio: 'استوديو الذكاء الاصطناعي', 
    nav_dashboard: 'لوحة القيادة', nav_pivot: 'جدول محوري', nav_reports: 'التقارير', nav_ai: 'استوديو الذكاء الاصطناعي', 
    btn_upload: 'رفع ملف', btn_connect: 'اتصال', btn_generate: 'توليد', btn_export: 'تصدير', 
    btn_clear_filters: 'مسح كل الفلاتر', lbl_no_data: 'لا توجد بيانات. اذهب إلى مصادر البيانات للبدء.',
    btn_save: 'حفظ'
  },
  zh: { 
    app_title: 'ManzStudio', nav_home: '首页', nav_data: '数据源', nav_table: '数据表', nav_data_source: '数据源', nav_data_table: '数据表', nav_ai_studio: 'AI 工作室', 
    nav_dashboard: '仪表板', nav_pivot: '透视表', nav_reports: '报告', nav_ai: 'AI 工作室', 
    btn_upload: '上传文件', btn_connect: '连接', btn_generate: '生成', btn_export: '导出', 
    btn_clear_filters: '清除所有过滤器', lbl_no_data: '未加载数据。请转到数据源以开始。',
    btn_save: '保存'
  },
  es: { 
    app_title: 'ManzStudio', nav_home: 'Inicio', nav_data: 'Fuentes de Datos', nav_table: 'Tabla de Datos', nav_data_source: 'Fuentes de Datos', nav_data_table: 'Tabla de Datos', nav_ai_studio: 'Estudio de IA', 
    nav_dashboard: 'Tablero', nav_pivot: 'Tabla Dinámica', nav_reports: 'Informes', nav_ai: 'Estudio de IA', 
    btn_upload: 'Subir Archivo', btn_connect: 'Conectar', btn_generate: 'Generar', btn_export: 'Exportar', 
    btn_clear_filters: 'Borrar todos los filtros', lbl_no_data: 'No hay datos cargados. Vaya a Fuentes de Datos para comenzar.',
    btn_save: 'Guardar'
  },
  fr: { 
    app_title: 'ManzStudio', nav_home: 'Accueil', nav_data: 'Sources de Données', nav_table: 'Tableau de Données', nav_data_source: 'Sources de Données', nav_data_table: 'Tableau de Données', nav_ai_studio: 'Studio IA', 
    nav_dashboard: 'Tableau de Bord', nav_pivot: 'Tableau Croisé Dynamique', nav_reports: 'Rapports', nav_ai: 'Studio IA', 
    btn_upload: 'Télécharger le Fichier', btn_connect: 'Connecter', btn_generate: 'Générer', btn_export: 'Exporter', 
    btn_clear_filters: 'Effacer tous les filtres', lbl_no_data: 'Aucune donnée chargée. Allez dans Sources de Données pour commencer.',
    btn_save: 'Sauvegarder'
  }
};

export const i18n = {
  current: 'en',
  t(key) { return LANGS[this.current]?.[key] || LANGS.en[key] || key; },
  setLang(lang, EventBus) {
    this.current = lang;
    localStorage.setItem('manz_lang', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });

    if(EventBus) EventBus.emit('lang:changed', lang);
  },
  init(EventBus) { this.setLang(localStorage.getItem('manz_lang') || 'en', EventBus); }
};

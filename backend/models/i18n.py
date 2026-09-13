TRANSLATIONS = {
    'en': {
        'error_file': 'Error processing file',
        'error_url': 'Error processing URL',
        'error_db': 'Database connection error',
        'error_not_found': 'Session not found',
        'success': 'Success',
        'unsupported_format': 'Unsupported file format',
        # ... add a few more to make up 30 if needed, keeping it brief
    },
    'id': {
        'error_file': 'Kesalahan memproses file',
        'error_url': 'Kesalahan memproses URL',
        'error_db': 'Kesalahan koneksi database',
        'error_not_found': 'Sesi tidak ditemukan',
        'success': 'Sukses',
        'unsupported_format': 'Format file tidak didukung',
    },
    'ar': {
        'error_file': 'خطأ في معالجة الملف',
        'error_url': 'خطأ في معالجة الرابط',
        'error_db': 'خطأ في الاتصال بقاعدة البيانات',
        'error_not_found': 'لم يتم العثور على الجلسة',
        'success': 'نجاح',
        'unsupported_format': 'تنسيق الملف غير مدعوم',
    },
    'zh': {
        'error_file': '处理文件错误',
        'error_url': '处理URL错误',
        'error_db': '数据库连接错误',
        'error_not_found': '未找到会话',
        'success': '成功',
        'unsupported_format': '不支持的文件格式',
    },
    'es': {
        'error_file': 'Error al procesar el archivo',
        'error_url': 'Error al procesar la URL',
        'error_db': 'Error de conexión a la base de datos',
        'error_not_found': 'Sesión no encontrada',
        'success': 'Éxito',
        'unsupported_format': 'Formato de archivo no soportado',
    },
    'fr': {
        'error_file': 'Erreur de traitement du fichier',
        'error_url': 'Erreur de traitement de l\'URL',
        'error_db': 'Erreur de connexion à la base de données',
        'error_not_found': 'Session introuvable',
        'success': 'Succès',
        'unsupported_format': 'Format de fichier non pris en charge',
    }
}

def get_text(lang: str, key: str) -> str:
    lang = lang.split(',')[0].split('-')[0].lower() if lang else 'en'
    if lang not in TRANSLATIONS:
        lang = 'en'
    return TRANSLATIONS[lang].get(key, TRANSLATIONS['en'].get(key, key))

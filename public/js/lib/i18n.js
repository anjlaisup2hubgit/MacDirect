// Language support. Keys are the English text, so English needs no entries and any
// missing translation falls back to English. The choice is stored in localStorage and
// applied on page load; changing it reloads the page. Database content is not translated.
// Static HTML is translated through data-i18n (text) and data-i18n-attr="attr:Text|attr:Text".
const I18N_LANGS = { en: 'English', zh: '简体中文', es: 'Español' };
const I18N = {
  zh: {
    'User settings': '用户设置', 'User Settings': '用户设置',
    "What's Happening": '近期活动', 'Add event plan': '添加活动计划', 'Add Event Plan': '添加活动计划',
    'Food and drinks': '餐饮', 'Food and Drinks': '餐饮',
    'On-campus Societies': '校内社团', 'Search societies': '搜索社团', 'Search food and drinks': '搜索餐饮',
    'Filter by category': '按类别筛选', 'Close': '关闭',
    'No societies found.': '没有找到社团。', 'No food outlets found.': '没有找到餐饮店。',
    'Could not load societies.': '无法加载社团。', 'Could not load food outlets.': '无法加载餐饮店。',
    'All': '全部', 'Following': '已关注', 'Follow': '关注',
    'Month': '月', 'Day': '日', 'Previous month': '上个月', 'Next month': '下个月',
    'No events on this day.': '当天没有活动。', 'No events found.': '没有找到活动。', 'Could not load events.': '无法加载活动。',
    'Mon': '周一', 'Tue': '周二', 'Wed': '周三', 'Thu': '周四', 'Fri': '周五', 'Sat': '周六', 'Sun': '周日',
    'Display name': '显示名称', 'Language': '语言', 'Saved.': '已保存。', 'Could not save.': '无法保存。',
    'Signed in': '已登录', 'Admin': '管理员', 'Student': '学生', 'Log out': '退出登录',
    'Leader of': '负责人：', 'Leader request pending for': '负责人申请待审核：', 'Leader request declined for': '负责人申请被拒绝：',
    'You are browsing as a guest. Following societies and the event plan need an account.': '您正以访客身份浏览。关注社团和活动计划需要账号。',
    'Log in or sign up': '登录或注册', 'Not now': '暂不',
    'Log in to follow societies': '登录后才能关注社团', 'Log in to add event plans': '登录后才能添加活动计划',
    'Log in to add event plans. Guests can browse everything but cannot save.': '登录后才能添加活动计划。访客可以浏览全部内容，但无法保存。',
    'Event name': '活动名称', 'Category': '类别', 'Date': '日期', 'Time': '时间', 'Building': '建筑', 'Description': '描述',
    'Add event': '添加活动', "Added! Find it in What's Happening.": '已添加！可在“近期活动”中查看。',
    'Log in': '登录', 'Sign up': '注册', 'Email': '邮箱', 'Password': '密码', 'Society': '社团',
    'I lead a society (an admin will approve this)': '我是社团负责人（需管理员批准）',
    'Continue as guest': '以访客身份继续', 'Your Macquarie campus map': '你的麦考瑞校园地图',
    'Login is not set up yet. You can continue as a guest.': '登录尚未设置。您可以以访客身份继续。',
    'Check your email to confirm your account, then log in.': '请查收邮件确认账号，然后登录。',
    'Search buildings or ask mcqAI': '搜索建筑或询问 mcqAI', 'Search campus or ask mcqAI': '搜索校园或询问 mcqAI',
    'About mcqAI': '关于 mcqAI', 'Ask mcqAI': '询问 mcqAI',
    'mcqAI is your campus assistant. Search for a building, or type a question and choose "Ask mcqAI".': 'mcqAI 是你的校园助手。搜索建筑，或输入问题并选择“询问 mcqAI”。',
    'Google Maps': '谷歌地图', 'meets here.': '在此聚会。', 'No photo available': '暂无照片', 'Website': '网站',
    'Societies held here': '在此的社团', 'No societies listed here.': '此处没有列出社团。',
    'Social': '社交', 'Academic': '学术', 'Career': '职业', 'Community': '社区', 'e.g. 1CC': '例如 1CC', 'a society': '某社团',
  },
  es: {
    'User settings': 'Ajustes', 'User Settings': 'Ajustes',
    "What's Happening": 'Eventos', 'Add event plan': 'Añadir plan', 'Add Event Plan': 'Añadir plan de evento',
    'Food and drinks': 'Comida y bebida', 'Food and Drinks': 'Comida y bebida',
    'On-campus Societies': 'Sociedades', 'Search societies': 'Buscar sociedades', 'Search food and drinks': 'Buscar comida y bebida',
    'Filter by category': 'Filtrar por categoría', 'Close': 'Cerrar',
    'No societies found.': 'No se encontraron sociedades.', 'No food outlets found.': 'No se encontraron locales.',
    'Could not load societies.': 'No se pudieron cargar las sociedades.', 'Could not load food outlets.': 'No se pudieron cargar los locales.',
    'All': 'Todas', 'Following': 'Siguiendo', 'Follow': 'Seguir',
    'Month': 'Mes', 'Day': 'Día', 'Previous month': 'Mes anterior', 'Next month': 'Mes siguiente',
    'No events on this day.': 'No hay eventos este día.', 'No events found.': 'No se encontraron eventos.', 'Could not load events.': 'No se pudieron cargar los eventos.',
    'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié', 'Thu': 'Jue', 'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom',
    'Display name': 'Nombre visible', 'Language': 'Idioma', 'Saved.': 'Guardado.', 'Could not save.': 'No se pudo guardar.',
    'Signed in': 'Sesión iniciada', 'Admin': 'Administrador', 'Student': 'Estudiante', 'Log out': 'Cerrar sesión',
    'Leader of': 'Líder de', 'Leader request pending for': 'Solicitud de líder pendiente para', 'Leader request declined for': 'Solicitud de líder rechazada para',
    'You are browsing as a guest. Following societies and the event plan need an account.': 'Estás navegando como invitado. Seguir sociedades y el plan de eventos requieren una cuenta.',
    'Log in or sign up': 'Iniciar sesión o registrarse', 'Not now': 'Ahora no',
    'Log in to follow societies': 'Inicia sesión para seguir sociedades', 'Log in to add event plans': 'Inicia sesión para añadir planes de eventos',
    'Log in to add event plans. Guests can browse everything but cannot save.': 'Inicia sesión para añadir planes de eventos. Los invitados pueden explorar todo pero no guardar.',
    'Event name': 'Nombre del evento', 'Category': 'Categoría', 'Date': 'Fecha', 'Time': 'Hora', 'Building': 'Edificio', 'Description': 'Descripción',
    'Add event': 'Añadir evento', "Added! Find it in What's Happening.": '¡Añadido! Búscalo en Eventos.',
    'Log in': 'Iniciar sesión', 'Sign up': 'Registrarse', 'Email': 'Correo', 'Password': 'Contraseña', 'Society': 'Sociedad',
    'I lead a society (an admin will approve this)': 'Dirijo una sociedad (un administrador lo aprobará)',
    'Continue as guest': 'Continuar como invitado', 'Your Macquarie campus map': 'Tu mapa del campus de Macquarie',
    'Login is not set up yet. You can continue as a guest.': 'El inicio de sesión aún no está configurado. Puedes continuar como invitado.',
    'Check your email to confirm your account, then log in.': 'Revisa tu correo para confirmar la cuenta y luego inicia sesión.',
    'Search buildings or ask mcqAI': 'Busca edificios o pregunta a mcqAI', 'Search campus or ask mcqAI': 'Busca en el campus o pregunta a mcqAI',
    'About mcqAI': 'Acerca de mcqAI', 'Ask mcqAI': 'Pregunta a mcqAI',
    'mcqAI is your campus assistant. Search for a building, or type a question and choose "Ask mcqAI".': 'mcqAI es tu asistente del campus. Busca un edificio o escribe una pregunta y elige "Pregunta a mcqAI".',
    'Google Maps': 'Google Maps', 'meets here.': 'se reúne aquí.', 'No photo available': 'Sin foto disponible', 'Website': 'Sitio web',
    'Societies held here': 'Sociedades en este lugar', 'No societies listed here.': 'No hay sociedades aquí.',
    'Social': 'Social', 'Academic': 'Académico', 'Career': 'Profesional', 'Community': 'Comunidad', 'e.g. 1CC': 'p. ej. 1CC', 'a society': 'una sociedad',
  },
};

function i18nLang() {
  try { const l = localStorage.getItem('imcq-lang'); return I18N_LANGS[l] ? l : 'en'; } catch (err) { return 'en'; }
}
function setLang(lang) {
  try { localStorage.setItem('imcq-lang', lang); } catch (err) { console.error(err); }
}
function t(key) {
  const d = I18N[i18nLang()];
  return (d && d[key]) || key;
}

(function () {
  document.documentElement.lang = { en: 'en', zh: 'zh-CN', es: 'es' }[i18nLang()];
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split('|').forEach((pair) => {
      const i = pair.indexOf(':');
      el.setAttribute(pair.slice(0, i), t(pair.slice(i + 1)));
    });
  });
})();

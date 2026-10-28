// Language support. Keys are the English text, so English needs no entries and any
// missing translation falls back to English. The choice is stored in localStorage and
// applied on page load; changing it reloads the page. Database content is not translated.
// Static HTML is translated through data-i18n (text) and data-i18n-attr="attr:Text|attr:Text".
const I18N_LANGS = { en: 'English', zh: '简体中文', es: 'Español', vi: 'Tiếng Việt' };
const I18N = {
  zh: {
    'User settings': '用户设置', 'User Settings': '用户设置', 'Settings': '设置', 'Restaurant': '餐厅',
    'Calendar': '日历', 'Add event plan': '添加活动计划', 'Add Event Plan': '添加活动计划',
    'Restaurants': '餐厅',
    'On-campus Societies': '校内社团', 'Search societies': '搜索社团', 'Search restaurants': '搜索餐厅', 'Society': '社团', 'Food': '餐饮', 'Society overview': '社团概览', 'Food overview': '餐饮概览', 'Sort by': '排序', 'Name A–Z': '名称 A–Z', 'Name Z–A': '名称 Z–A', 'More actions': '更多操作', 'Show on map': '在地图上显示',
    'Filter by category': '按类别筛选', 'Close': '关闭',
    'No societies found.': '没有找到社团。', 'No food outlets found.': '没有找到餐饮店。',
    'Could not load societies.': '无法加载社团。', 'Could not load food outlets.': '无法加载餐饮店。',
    'All': '全部', 'Following': '已关注', 'Follow': '关注',
    'Month': '月', 'Day': '日', 'Previous month': '上个月', 'Next month': '下个月',
    'No events on this day.': '当天没有活动。', 'No events found.': '没有找到活动。', 'Could not load events.': '无法加载活动。',
    'Mon': '周一', 'Tue': '周二', 'Wed': '周三', 'Thu': '周四', 'Fri': '周五', 'Sat': '周六', 'Sun': '周日',
    'Display name': '显示名称', 'Language': '语言', 'Saved.': '已保存。', 'Could not save.': '无法保存。',
    'Change password': '修改密码', 'New password': '新密码', 'Confirm new password': '确认新密码',
    'Passwords do not match.': '两次输入的密码不一致。', 'Password changed.': '密码已修改。',
    'Followed societies': '已关注的社团', 'You are not following any societies.': '你还没有关注任何社团。', 'Unfollow': '取消关注',
    
    'Signed in': '已登录', 'Admin': '管理员', 'Student': '学生', 'Log out': '退出登录',
    'Leader of': '负责人：', 'Leader requests': '负责人申请', 'No pending requests.': '没有待处理的申请。', 'Approve': '批准', 'Reject': '拒绝', 'Leader request pending for': '负责人申请待审核：', 'Leader request declined for': '负责人申请被拒绝：',
    'You are browsing as a guest. Following societies, the calendar and the event plan need an account.': '您正以访客身份浏览。关注社团、日历和活动计划需要账号。',
    'Log in or sign up': '登录或注册', 'Not now': '暂不',
    'Post': '发布', 'Post to which society?': '发布到哪个社团？', 'Post to followers of': '发布给以下社团的关注者：', 'Log in to follow societies': '登录后才能关注社团', 'Log in to add event plans': '登录后才能添加活动计划',
    'Log in to add event plans. Guests can browse everything but cannot save.': '登录后才能添加活动计划。访客可以浏览全部内容，但无法保存。',
    'Event name': '活动名称', 'Category': '类别', 'Date': '日期', 'Time': '时间', 'Building': '建筑', 'Description': '描述',
    'Post event': '发布活动', 'Edit': '编辑', 'Delete': '删除', 'Delete this event?': '删除此活动？', 'Cancel': '取消', 'Save event': '保存活动', 'Remove': '移除', 'Remove this plan?': '移除此计划？', 'Add event': '添加活动', 'Edit events': '编辑活动', 'Your society has not posted any events yet.': '你的社团还没有发布任何活动。', 'Added! Find it in Calendar.': '已添加！可在“日历”中查看。', 'Log in to view the calendar': '登录后才能查看日历', 'Follow societies to see their events here.': '关注社团后，其活动会显示在这里。', 'Calendar view': '日历视图', 'Week starts on': '每周开始于', 'Monday': '星期一', 'Sunday': '星期日', 'Add to calendar': '添加到日历', 'Google': '谷歌', 'Apple / Outlook': '苹果 / Outlook', 'Societies': '社团',
    'Log in': '登录', 'Sign up': '注册', 'Email': '邮箱', 'Password': '密码', 'Society': '社团',
    'I lead a society': '我是社团负责人', 'An admin will approve this': '需管理员批准',
    'Wrong email or password.': '邮箱或密码错误。', 'This email is already registered. Try logging in.': '此邮箱已注册。请尝试登录。',
    'Password must be at least 6 characters.': '密码至少需要 6 个字符。', 'Something went wrong. Please try again.': '出了点问题。请重试。',
    'Please wait...': '请稍候...', 'or': '或',
    'Continue as guest': '以访客身份继续', 'Your Macquarie campus map': '你的麦考瑞校园地图',
    'Login is not set up yet. You can continue as a guest.': '登录尚未设置。您可以以访客身份继续。',
    'Check your email to confirm your account, then log in.': '请查收邮件确认账号，然后登录。',
    'Search buildings, societies, restaurants or ask mcqAI': '搜索建筑、社团、餐厅或询问 mcqAI', 'Search campus or ask mcqAI': '搜索校园或询问 mcqAI',
    'About mcqAI': '关于 mcqAI', 'Ask mcqAI': '询问 mcqAI',
    'mcqAI is your campus assistant. Search for a building, or type a question and choose "Ask mcqAI".': 'mcqAI 是你的校园助手。搜索建筑，或输入问题并选择“询问 mcqAI”。',
    'Google Maps': '谷歌地图', 'meets here.': '在此聚会。', 'No photo available': '暂无照片', 'Website': '网站',
    'Societies held here': '在此的社团', 'No societies listed here.': '此处没有列出社团。',
    'Social': '社交', 'Academic': '学术', 'Career': '职业', 'Community': '社区', 'e.g. 1CC': '例如 1CC', 'a society': '某社团',
    'My plan': '我的计划', 'Society event': '社团活动', 'Cover photo': '封面照片', 'Hashtags (up to 5, e.g. social games)': '话题标签（最多 5 个，例如 social games）', 'Save hashtags': '保存标签', 'Today': '今天', 'Opening hours': '营业时间', 'Closed': '休息', 'Add for': '添加到', 'Just me (private)': '仅自己（私人）', 'Remove current photo': '移除当前照片', 'Event photo (optional; JPEG, PNG or WebP, up to 5 MB)': '活动照片（可选；JPEG、PNG 或 WebP，最大 5 MB）', 'Society cover photo': '社团封面照片', 'Choose image (JPEG, PNG or WebP, up to 5 MB)': '选择图片（JPEG、PNG 或 WebP，最大 5 MB）', 'Choose a JPEG, PNG or WebP image.': '请选择 JPEG、PNG 或 WebP 图片。', 'The image must be 5 MB or smaller.': '图片不能超过 5 MB。',
    'Delete account': '删除账户', 'Delete my account': '删除我的账户', 'Your follows, event plans and leader requests will be removed. Society events you posted stay. This cannot be undone.': '你的关注、活动计划和负责人申请将被删除。你发布的社团活动会保留。此操作无法撤销。', 'Type DELETE (in capital letters, in English) to confirm.': '请输入 DELETE（英文大写）以确认。', 'You are the only admin, so you cannot delete your account.': '你是唯一的管理员，因此无法删除账户。',
  },
  es: {
    'User settings': 'Ajustes', 'User Settings': 'Ajustes', 'Settings': 'Ajustes', 'Restaurant': 'Restaurante',
    'Calendar': 'Calendario', 'Add event plan': 'Añadir plan', 'Add Event Plan': 'Añadir plan de evento',
    'Restaurants': 'Restaurantes',
    'On-campus Societies': 'Sociedades', 'Search societies': 'Buscar sociedades', 'Search restaurants': 'Buscar restaurantes', 'Society': 'Sociedad', 'Food': 'Comida', 'Society overview': 'Resumen de sociedades', 'Food overview': 'Resumen de comida', 'Sort by': 'Ordenar por', 'Name A–Z': 'Nombre A–Z', 'Name Z–A': 'Nombre Z–A', 'More actions': 'Más acciones', 'Show on map': 'Ver en el mapa',
    'Filter by category': 'Filtrar por categoría', 'Close': 'Cerrar',
    'No societies found.': 'No se encontraron sociedades.', 'No food outlets found.': 'No se encontraron locales.',
    'Could not load societies.': 'No se pudieron cargar las sociedades.', 'Could not load food outlets.': 'No se pudieron cargar los locales.',
    'All': 'Todas', 'Following': 'Siguiendo', 'Follow': 'Seguir',
    'Month': 'Mes', 'Day': 'Día', 'Previous month': 'Mes anterior', 'Next month': 'Mes siguiente',
    'No events on this day.': 'No hay eventos este día.', 'No events found.': 'No se encontraron eventos.', 'Could not load events.': 'No se pudieron cargar los eventos.',
    'Mon': 'Lun', 'Tue': 'Mar', 'Wed': 'Mié', 'Thu': 'Jue', 'Fri': 'Vie', 'Sat': 'Sáb', 'Sun': 'Dom',
    'Display name': 'Nombre visible', 'Language': 'Idioma', 'Saved.': 'Guardado.', 'Could not save.': 'No se pudo guardar.',
    'Change password': 'Cambiar contraseña', 'New password': 'Nueva contraseña', 'Confirm new password': 'Confirmar nueva contraseña',
    'Passwords do not match.': 'Las contraseñas no coinciden.', 'Password changed.': 'Contraseña cambiada.',
    'Followed societies': 'Sociedades que sigues', 'You are not following any societies.': 'No sigues ninguna sociedad.', 'Unfollow': 'Dejar de seguir',
    
    'Signed in': 'Sesión iniciada', 'Admin': 'Administrador', 'Student': 'Estudiante', 'Log out': 'Cerrar sesión',
    'Leader of': 'Líder de', 'Leader requests': 'Solicitudes de líder', 'No pending requests.': 'No hay solicitudes pendientes.', 'Approve': 'Aprobar', 'Reject': 'Rechazar', 'Leader request pending for': 'Solicitud de líder pendiente para', 'Leader request declined for': 'Solicitud de líder rechazada para',
    'You are browsing as a guest. Following societies, the calendar and the event plan need an account.': 'Estás navegando como invitado. Seguir sociedades, el calendario y el plan de eventos requieren una cuenta.',
    'Log in or sign up': 'Iniciar sesión o registrarse', 'Not now': 'Ahora no',
    'Post': 'Publicar', 'Post to which society?': '¿En qué sociedad publicar?', 'Post to followers of': 'Publicar para los seguidores de', 'Log in to follow societies': 'Inicia sesión para seguir sociedades', 'Log in to add event plans': 'Inicia sesión para añadir planes de eventos',
    'Log in to add event plans. Guests can browse everything but cannot save.': 'Inicia sesión para añadir planes de eventos. Los invitados pueden explorar todo pero no guardar.',
    'Event name': 'Nombre del evento', 'Category': 'Categoría', 'Date': 'Fecha', 'Time': 'Hora', 'Building': 'Edificio', 'Description': 'Descripción',
    'Post event': 'Publicar evento', 'Edit': 'Editar', 'Delete': 'Eliminar', 'Delete this event?': '¿Eliminar este evento?', 'Cancel': 'Cancelar', 'Save event': 'Guardar evento', 'Remove': 'Quitar', 'Remove this plan?': '¿Quitar este plan?', 'Add event': 'Añadir evento', 'Edit events': 'Editar eventos', 'Your society has not posted any events yet.': 'Tu sociedad aún no ha publicado eventos.', 'Added! Find it in Calendar.': '¡Añadido! Búscalo en Calendario.', 'Log in to view the calendar': 'Inicia sesión para ver el calendario', 'Follow societies to see their events here.': 'Sigue sociedades para ver aquí sus eventos.', 'Calendar view': 'Vista del calendario', 'Week starts on': 'La semana empieza el', 'Monday': 'Lunes', 'Sunday': 'Domingo', 'Add to calendar': 'Añadir al calendario', 'Google': 'Google', 'Apple / Outlook': 'Apple / Outlook', 'Societies': 'Sociedades',
    'Log in': 'Iniciar sesión', 'Sign up': 'Registrarse', 'Email': 'Correo', 'Password': 'Contraseña', 'Society': 'Sociedad',
    'I lead a society': 'Dirijo una sociedad', 'An admin will approve this': 'Un administrador lo aprobará',
    'Wrong email or password.': 'Correo o contraseña incorrectos.', 'This email is already registered. Try logging in.': 'Este correo ya está registrado. Prueba a iniciar sesión.',
    'Password must be at least 6 characters.': 'La contraseña debe tener al menos 6 caracteres.', 'Something went wrong. Please try again.': 'Algo salió mal. Inténtalo de nuevo.',
    'Please wait...': 'Espera un momento...', 'or': 'o',
    'Continue as guest': 'Continuar como invitado', 'Your Macquarie campus map': 'Tu mapa del campus de Macquarie',
    'Login is not set up yet. You can continue as a guest.': 'El inicio de sesión aún no está configurado. Puedes continuar como invitado.',
    'Check your email to confirm your account, then log in.': 'Revisa tu correo para confirmar la cuenta y luego inicia sesión.',
    'Search buildings, societies, restaurants or ask mcqAI': 'Busca edificios, sociedades, restaurantes o pregunta a mcqAI', 'Search campus or ask mcqAI': 'Busca en el campus o pregunta a mcqAI',
    'About mcqAI': 'Acerca de mcqAI', 'Ask mcqAI': 'Pregunta a mcqAI',
    'mcqAI is your campus assistant. Search for a building, or type a question and choose "Ask mcqAI".': 'mcqAI es tu asistente del campus. Busca un edificio o escribe una pregunta y elige "Pregunta a mcqAI".',
    'Google Maps': 'Google Maps', 'meets here.': 'se reúne aquí.', 'No photo available': 'Sin foto disponible', 'Website': 'Sitio web',
    'Societies held here': 'Sociedades en este lugar', 'No societies listed here.': 'No hay sociedades aquí.',
    'Social': 'Social', 'Academic': 'Académico', 'Career': 'Profesional', 'Community': 'Comunidad', 'e.g. 1CC': 'p. ej. 1CC', 'a society': 'una sociedad',
    'My plan': 'Mi plan', 'Society event': 'Evento del club', 'Cover photo': 'Foto de portada', 'Hashtags (up to 5, e.g. social games)': 'Hashtags (hasta 5, p. ej. social games)', 'Save hashtags': 'Guardar hashtags', 'Today': 'Hoy', 'Opening hours': 'Horario', 'Closed': 'Cerrado', 'Add for': 'Añadir para', 'Just me (private)': 'Solo yo (privado)', 'Remove current photo': 'Quitar la foto actual', 'Event photo (optional; JPEG, PNG or WebP, up to 5 MB)': 'Foto del evento (opcional; JPEG, PNG o WebP, hasta 5 MB)', 'Society cover photo': 'Foto de portada del club', 'Choose image (JPEG, PNG or WebP, up to 5 MB)': 'Elegir imagen (JPEG, PNG o WebP, hasta 5 MB)', 'Choose a JPEG, PNG or WebP image.': 'Elige una imagen JPEG, PNG o WebP.', 'The image must be 5 MB or smaller.': 'La imagen debe pesar 5 MB o menos.',
    'Delete account': 'Eliminar cuenta', 'Delete my account': 'Eliminar mi cuenta', 'Your follows, event plans and leader requests will be removed. Society events you posted stay. This cannot be undone.': 'Se eliminarán tus seguimientos, planes de eventos y solicitudes de líder. Los eventos de sociedades que publicaste se mantienen. Esto no se puede deshacer.', 'Type DELETE (in capital letters, in English) to confirm.': 'Escribe DELETE (en mayúsculas y en inglés) para confirmar.', 'You are the only admin, so you cannot delete your account.': 'Eres el único administrador, así que no puedes eliminar tu cuenta.',
  },
  vi: {
    'User settings': 'Cài đặt', 'User Settings': 'Cài đặt', 'Settings': 'Cài đặt', 'Restaurant': 'Nhà hàng',
    'Calendar': 'Lịch', 'Add event plan': 'Thêm kế hoạch', 'Add Event Plan': 'Thêm kế hoạch sự kiện',
    'Restaurants': 'Nhà hàng',
    'On-campus Societies': 'Câu lạc bộ', 'Search societies': 'Tìm câu lạc bộ', 'Search restaurants': 'Tìm nhà hàng', 'Society': 'Câu lạc bộ', 'Food': 'Đồ ăn', 'Society overview': 'Tổng quan câu lạc bộ', 'Food overview': 'Tổng quan đồ ăn', 'Sort by': 'Sắp xếp theo', 'Name A–Z': 'Tên A–Z', 'Name Z–A': 'Tên Z–A', 'More actions': 'Thêm thao tác', 'Show on map': 'Xem trên bản đồ',
    'Filter by category': 'Lọc theo danh mục', 'Close': 'Đóng',
    'No societies found.': 'Không tìm thấy câu lạc bộ.', 'No food outlets found.': 'Không tìm thấy quán ăn.',
    'Could not load societies.': 'Không thể tải câu lạc bộ.', 'Could not load food outlets.': 'Không thể tải quán ăn.',
    'All': 'Tất cả', 'Following': 'Đang theo dõi', 'Follow': 'Theo dõi',
    'Month': 'Tháng', 'Day': 'Ngày', 'Previous month': 'Tháng trước', 'Next month': 'Tháng sau',
    'No events on this day.': 'Không có sự kiện trong ngày này.', 'No events found.': 'Không tìm thấy sự kiện.', 'Could not load events.': 'Không thể tải sự kiện.',
    'Mon': 'T2', 'Tue': 'T3', 'Wed': 'T4', 'Thu': 'T5', 'Fri': 'T6', 'Sat': 'T7', 'Sun': 'CN',
    'Display name': 'Tên hiển thị', 'Language': 'Ngôn ngữ', 'Saved.': 'Đã lưu.', 'Could not save.': 'Không thể lưu.',
    'Change password': 'Đổi mật khẩu', 'New password': 'Mật khẩu mới', 'Confirm new password': 'Xác nhận mật khẩu mới',
    'Passwords do not match.': 'Mật khẩu không khớp.', 'Password changed.': 'Đã đổi mật khẩu.',
    'Followed societies': 'CLB đang theo dõi', 'You are not following any societies.': 'Bạn chưa theo dõi CLB nào.', 'Unfollow': 'Bỏ theo dõi',
    
    'Signed in': 'Đã đăng nhập', 'Admin': 'Quản trị viên', 'Student': 'Sinh viên', 'Log out': 'Đăng xuất',
    'Leader of': 'Chủ nhiệm CLB', 'Leader requests': 'Yêu cầu làm chủ nhiệm', 'No pending requests.': 'Không có yêu cầu nào đang chờ.', 'Approve': 'Duyệt', 'Reject': 'Từ chối', 'Leader request pending for': 'Yêu cầu làm chủ nhiệm CLB đang chờ duyệt cho', 'Leader request declined for': 'Yêu cầu làm chủ nhiệm CLB bị từ chối cho',
    'You are browsing as a guest. Following societies, the calendar and the event plan need an account.': 'Bạn đang xem với tư cách khách. Theo dõi câu lạc bộ, lịch và kế hoạch sự kiện cần có tài khoản.',
    'Log in or sign up': 'Đăng nhập hoặc đăng ký', 'Not now': 'Để sau',
    'Post': 'Đăng', 'Post to which society?': 'Đăng cho câu lạc bộ nào?', 'Post to followers of': 'Đăng cho người theo dõi của', 'Log in to follow societies': 'Đăng nhập để theo dõi câu lạc bộ', 'Log in to add event plans': 'Đăng nhập để thêm kế hoạch sự kiện',
    'Log in to add event plans. Guests can browse everything but cannot save.': 'Đăng nhập để thêm kế hoạch sự kiện. Khách có thể xem mọi thứ nhưng không thể lưu.',
    'Event name': 'Tên sự kiện', 'Category': 'Danh mục', 'Date': 'Ngày', 'Time': 'Giờ', 'Building': 'Tòa nhà', 'Description': 'Mô tả',
    'Post event': 'Đăng sự kiện', 'Edit': 'Sửa', 'Delete': 'Xóa', 'Delete this event?': 'Xóa sự kiện này?', 'Cancel': 'Hủy', 'Save event': 'Lưu sự kiện', 'Remove': 'Xóa', 'Remove this plan?': 'Xóa kế hoạch này?', 'Add event': 'Thêm sự kiện', 'Edit events': 'Sửa sự kiện', 'Your society has not posted any events yet.': 'CLB của bạn chưa đăng sự kiện nào.', 'Added! Find it in Calendar.': 'Đã thêm! Xem trong mục Lịch.', 'Log in to view the calendar': 'Đăng nhập để xem lịch', 'Follow societies to see their events here.': 'Theo dõi câu lạc bộ để xem sự kiện của họ tại đây.', 'Calendar view': 'Chế độ xem lịch', 'Week starts on': 'Tuần bắt đầu vào', 'Monday': 'Thứ Hai', 'Sunday': 'Chủ Nhật', 'Add to calendar': 'Thêm vào lịch', 'Google': 'Google', 'Apple / Outlook': 'Apple / Outlook', 'Societies': 'Câu lạc bộ',
    'Log in': 'Đăng nhập', 'Sign up': 'Đăng ký', 'Email': 'Email', 'Password': 'Mật khẩu', 'Society': 'Câu lạc bộ',
    'I lead a society': 'Tôi là chủ nhiệm một câu lạc bộ', 'An admin will approve this': 'Quản trị viên sẽ duyệt',
    'Wrong email or password.': 'Email hoặc mật khẩu không đúng.', 'This email is already registered. Try logging in.': 'Email này đã được đăng ký. Hãy thử đăng nhập.',
    'Password must be at least 6 characters.': 'Mật khẩu phải có ít nhất 6 ký tự.', 'Something went wrong. Please try again.': 'Đã xảy ra lỗi. Vui lòng thử lại.',
    'Please wait...': 'Vui lòng chờ...', 'or': 'hoặc',
    'Continue as guest': 'Tiếp tục với tư cách khách', 'Your Macquarie campus map': 'Bản đồ khuôn viên Macquarie của bạn',
    'Login is not set up yet. You can continue as a guest.': 'Đăng nhập chưa được thiết lập. Bạn có thể tiếp tục với tư cách khách.',
    'Check your email to confirm your account, then log in.': 'Hãy kiểm tra email để xác nhận tài khoản, rồi đăng nhập.',
    'Search buildings, societies, restaurants or ask mcqAI': 'Tìm tòa nhà, câu lạc bộ, nhà hàng hoặc hỏi mcqAI', 'Search campus or ask mcqAI': 'Tìm trong khuôn viên hoặc hỏi mcqAI',
    'About mcqAI': 'Giới thiệu mcqAI', 'Ask mcqAI': 'Hỏi mcqAI',
    'mcqAI is your campus assistant. Search for a building, or type a question and choose "Ask mcqAI".': 'mcqAI là trợ lý khuôn viên của bạn. Hãy tìm một tòa nhà, hoặc nhập câu hỏi và chọn "Hỏi mcqAI".',
    'Google Maps': 'Google Maps', 'meets here.': 'họp tại đây.', 'No photo available': 'Chưa có ảnh', 'Website': 'Trang web',
    'Societies held here': 'Các câu lạc bộ tại đây', 'No societies listed here.': 'Không có câu lạc bộ nào tại đây.',
    'Social': 'Giao lưu', 'Academic': 'Học thuật', 'Career': 'Nghề nghiệp', 'Community': 'Cộng đồng', 'e.g. 1CC': 'ví dụ 1CC', 'a society': 'một câu lạc bộ',
    'My plan': 'Kế hoạch của tôi', 'Society event': 'Sự kiện câu lạc bộ', 'Cover photo': 'Ảnh bìa', 'Hashtags (up to 5, e.g. social games)': 'Hashtag (tối đa 5, ví dụ social games)', 'Save hashtags': 'Lưu hashtag', 'Today': 'Hôm nay', 'Opening hours': 'Giờ mở cửa', 'Closed': 'Đóng cửa', 'Add for': 'Thêm cho', 'Just me (private)': 'Chỉ mình tôi (riêng tư)', 'Remove current photo': 'Xóa ảnh hiện tại', 'Event photo (optional; JPEG, PNG or WebP, up to 5 MB)': 'Ảnh sự kiện (tùy chọn; JPEG, PNG hoặc WebP, tối đa 5 MB)', 'Society cover photo': 'Ảnh bìa câu lạc bộ', 'Choose image (JPEG, PNG or WebP, up to 5 MB)': 'Chọn ảnh (JPEG, PNG hoặc WebP, tối đa 5 MB)', 'Choose a JPEG, PNG or WebP image.': 'Hãy chọn ảnh JPEG, PNG hoặc WebP.', 'The image must be 5 MB or smaller.': 'Ảnh phải từ 5 MB trở xuống.',
    'Delete account': 'Xóa tài khoản', 'Delete my account': 'Xóa tài khoản của tôi', 'Your follows, event plans and leader requests will be removed. Society events you posted stay. This cannot be undone.': 'Các lượt theo dõi, kế hoạch sự kiện và yêu cầu làm trưởng nhóm của bạn sẽ bị xóa. Sự kiện câu lạc bộ bạn đã đăng vẫn được giữ lại. Không thể hoàn tác.', 'Type DELETE (in capital letters, in English) to confirm.': 'Nhập DELETE (viết hoa, bằng tiếng Anh) để xác nhận.', 'You are the only admin, so you cannot delete your account.': 'Bạn là quản trị viên duy nhất nên không thể xóa tài khoản.',
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
  document.documentElement.lang = { en: 'en', zh: 'zh-CN', es: 'es', vi: 'vi' }[i18nLang()];
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split('|').forEach((pair) => {
      const i = pair.indexOf(':');
      el.setAttribute(pair.slice(0, i), t(pair.slice(i + 1)));
    });
  });
})();

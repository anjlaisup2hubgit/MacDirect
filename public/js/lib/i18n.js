// Language support. Keys are the English text, so English needs no entries and any
// missing translation falls back to English. The choice is stored in localStorage and
// applied on page load; changing it reloads the page. Database content is not translated.
// Static HTML is translated through data-i18n (text) and data-i18n-attr="attr:Text|attr:Text".
const I18N_LANGS = { en: 'English', zh: '简体中文 (Chinese, Simplified)', ar: 'العربية (Arabic)', yue: '粵語 (Cantonese)', vi: 'Tiếng Việt (Vietnamese)', hi: 'हिन्दी (Hindi)', el: 'Ελληνικά (Greek)', fil: 'Filipino (Tagalog)', it: 'Italiano (Italian)', ko: '한국어 (Korean)', pa: 'ਪੰਜਾਬੀ (Punjabi)', ne: 'नेपाली (Nepali)' };
const I18N_LOCALES = { en: 'en-AU', zh: 'zh-CN', ar: 'ar', yue: 'zh-HK', vi: 'vi', hi: 'hi', el: 'el', fil: 'fil', it: 'it', ko: 'ko', pa: 'pa', ne: 'ne' };
// Only the chosen language's strings are loaded (js/lib/lang/<code>.js); English needs none.
const I18N = {};
(function () {
  const l = i18nLang();
  if (l !== 'en') document.write('<script src="js/lib/lang/' + l + '.js"></script>');
})();
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
function i18nApply() {
  document.documentElement.lang = i18nLang() === 'en' ? 'en' : I18N_LOCALES[i18nLang()];
  document.documentElement.dir = i18nLang() === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    el.dataset.i18nAttr.split('|').forEach((pair) => {
      const i = pair.indexOf(':');
      el.setAttribute(pair.slice(0, i), t(pair.slice(i + 1)));
    });
  });
}
// English has no file to wait for; other languages call i18nApply() at the end of their file.
if (i18nLang() === 'en') i18nApply();

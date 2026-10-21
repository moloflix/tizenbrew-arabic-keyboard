/*!
 * Arabic Keyboard for TizenBrew - MIT License
 * Single-file, dependency-free, ES5-only (old Tizen browsers).
 */
(function () {
  'use strict';
  if (window.__tvakLoaded) return;
  window.__tvakLoaded = true;

  var VERSION = '1.5.3';
  var CONFIG = {
    browserBar: true,       // شريط التصفح (رجوع/للأمام/تحديث/رابط) في وضع المؤشر + صفحة رئيسية
    backGoesBack: true,     // زر Back يرجع للصفحة السابقة بدل الخروج (إن لم تعالجه الصفحة)
    homeUrl: 'https://example.com/?tvak=home',
    homeBackground: 'https://cdn.jsdelivr.net/gh/moloflix/tizenbrew-arabic-keyboard@v1.4.0/assets/bg.webp',
    favorites: [            // المواقع المفضلة: [الاسم، الرابط، الأيقونة: search|media|movie|cartoon]
      ['بحث', 'https://www.google.com', 'search'],
      ['ميديا', 'https://laaroza.casa/home.24', 'media'],
      ['أفلام أجنبية', 'https://www.fushaar.com/', 'movie'],
      ['أفلام كرتون', 'https://arabic-toons.com/', 'cartoon']
    ],
    barTop: 56,             // المسافة بين شريط التصفح وأعلى الشاشة (بوحدات 1080p) لتفادي قص أطراف الشاشة
    blockAds: true,         // حظر النوافذ المنبثقة وإخفاء الإعلانات المعروفة
    blockBackTraps: true,   // يمنع صفحات الإعلانات من دفع نفس الرابط في السجل (فخ زر الرجوع)
    backHoldMs: 800,        // ضغطة طويلة على زر الرجوع تأخذك للصفحة الرئيسية (مخرج طوارئ)
    showHint: false,         // رسالة قصيرة عند تحميل الصفحة تُظهر الإصدار (للتأكد أن الموديول يعمل)
    showKeyCodes: false,     // يعرض رمز أي زر غير معروف تضغطه (للتشخيص)
    debugBanner: false,      // شريط أحمر يعرض الإصدار ورمز كل زر والأخطاء (للتشخيص فقط)
    autoOpen: true,         // افتح الكيبورد تلقائياً عند التركيز على حقل نص
    refocusFallback: false, // فعّلها (true) إذا ظهر كيبورد التلفزيون الأصلي رغم readonly/inputmode
    suppressMs: 1000        // مدة منع الفتح التلقائي بعد الإغلاق (يمنع الحلقات مع SPA)
  };

  // ---------- تشخيص مستقل (inline styles فقط، لا يعتمد على بقية الكود) ----------
  var diagTimer = null;
  function errText(err) {
    var st = err && err.stack ? String(err.stack).split('\n').slice(0, 3).join(' ').replace(/\s+/g, ' ') : '';
    return ((err && err.message) || String(err)) + ' ' + st;
  }
  function diag(text, ms) {
    if (!CONFIG.debugBanner) return;
    try {
      var host = document.body || document.documentElement;
      if (!host) return;
      var d = document.getElementById('tvak-diag');
      if (!d) {
        d = document.createElement('div');
        d.id = 'tvak-diag';
        d.style.cssText = 'position:fixed;top:12px;left:12px;right:12px;z-index:2147483647;background:#c00;color:#fff;' +
          'font:bold 30px Arial,sans-serif;padding:12px 20px;border-radius:8px;pointer-events:none;direction:ltr;text-align:left;';
      }
      if (d.parentNode !== host) host.appendChild(d);
      d.textContent = text;
      d.style.display = 'block';
      if (diagTimer) clearTimeout(diagTimer);
      diagTimer = setTimeout(function () { d.style.display = 'none'; }, ms || 4000);
    } catch (e) {}
  }
  diag('TVAK v' + VERSION + ' loaded', 6000);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { diag('TVAK v' + VERSION + ' ready', 6000); });
  }
  window.addEventListener('error', function (e) {
    if (!e.filename) diag('TVAK error: ' + errText(e.error || { message: e.message }) + ' line ' + e.lineno, 20000);
  });

  // ---------- CSS (مضمّن لأن TizenBrew يحقن ملف JS واحد فقط) ----------
  // ملاحظة: بدون flex gap ولا CSS variables لتوافق المتصفحات القديمة.
  var TVAK_CSS = [
    // ---- الكيبورد (زجاج) ----
    '#tvak-root{all:initial;position:fixed;left:0;bottom:0;z-index:2147483647;display:none;',
    'direction:ltr;unicode-bidi:normal;box-sizing:border-box;background:rgba(14,14,22,0.55);',
    '-webkit-backdrop-filter:blur(36px) saturate(170%);backdrop-filter:blur(36px) saturate(170%);',
    'border-top:1px solid rgba(255,255,255,0.22);padding:14px 28px 12px;',
    'font-family:Arial,"Noto Sans Arabic",sans-serif;-webkit-transform-origin:0 100%;transform-origin:0 100%;}',
    '#tvak-root.tvak-open{display:block;}',
    '#tvak-root .tvak-preview{display:block;box-sizing:border-box;margin:0 auto 12px;max-width:1100px;height:56px;',
    'line-height:56px;padding:0 24px;background:rgba(0,0,0,0.35);color:#f6f6f8;font-size:28px;border-radius:28px;',
    'border:1px solid rgba(255,255,255,0.22);border-bottom:3px solid rgba(120,170,255,0.9);overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}',
    '#tvak-root .tvak-row{display:-webkit-flex;display:flex;-webkit-justify-content:center;justify-content:center;margin-bottom:8px;}',
    '#tvak-root .tvak-key{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;',
    '-webkit-justify-content:center;justify-content:center;min-width:68px;height:68px;padding:0 14px;margin:0 4px;',
    'background:rgba(255,255,255,0.13);color:#fff;font-size:30px;line-height:1;border-radius:18px;box-sizing:border-box;',
    'font-family:Arial,"Noto Sans Arabic",sans-serif;border:1px solid rgba(255,255,255,0.26);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.38),0 6px 18px rgba(0,0,0,0.28);}',
    '#tvak-root .tvak-wide{min-width:104px;font-size:24px;background:rgba(255,255,255,0.07);}',
    '#tvak-root .tvak-arrow{min-width:84px;font-size:34px;}',
    '#tvak-root .tvak-space{-webkit-flex:1;flex:1;max-width:460px;font-size:22px;background:rgba(255,255,255,0.13);}',
    '#tvak-root .tvak-action{background:rgba(47,123,255,0.5);}',
    '#tvak-root .tvak-on{background:rgba(40,190,120,0.45);}',
    '#tvak-root .tvak-active{background:rgba(255,255,255,0.9);color:#111;border-color:#fff;',
    'box-shadow:0 0 0 3px rgba(120,170,255,0.9),0 0 26px rgba(255,255,255,0.45);-webkit-transform:scale(1.08);transform:scale(1.08);}',
    // ---- المؤشر والرسائل ----
    '#tvak-cursor{all:initial;position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;display:none;}',
    '#tvak-cursor.tvak-on{display:block;}',
    '#tvak-toast{all:initial;position:fixed;bottom:56px;left:50%;direction:rtl;z-index:2147483647;pointer-events:none;display:none;',
    'background:rgba(20,20,28,0.6);-webkit-backdrop-filter:blur(24px);backdrop-filter:blur(24px);border:1px solid rgba(255,255,255,0.25);',
    'color:#fff;font-family:Arial,"Noto Sans Arabic",sans-serif;font-size:26px;',
    'padding:12px 28px;border-radius:30px;-webkit-transform:translateX(-50%);transform:translateX(-50%);white-space:nowrap;}',
    '#tvak-toast.tvak-on{display:block;}',
    // ---- شريط التصفح (زجاج) ----
    '#tvak-bar{all:initial;position:fixed;top:0;left:0;z-index:2147483646;display:none;box-sizing:border-box;',
    'background:rgba(14,14,22,0.5);-webkit-backdrop-filter:blur(30px) saturate(170%);backdrop-filter:blur(30px) saturate(170%);',
    'border:1px solid rgba(255,255,255,0.28);border-radius:46px;box-shadow:0 14px 40px rgba(0,0,0,0.38);padding:12px 24px;direction:ltr;',
    'font-family:Arial,"Noto Sans Arabic",sans-serif;-webkit-transform-origin:0 0;transform-origin:0 0;}',
    '#tvak-bar.tvak-on{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;}',
    '#tvak-bar .tvak-bbtn{position:relative;display:block;-webkit-flex:none;flex:none;',
    'width:58px;height:58px;margin-right:10px;',
    'background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.3);border-radius:29px;box-sizing:border-box;',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.4),0 6px 18px rgba(0,0,0,0.25);}',
    '#tvak-bar .tvak-bbtn svg{position:absolute;display:block;left:50%;top:50%;width:30px;height:30px;margin:-15px 0 0 -15px;}',
    '#tvak-bar .tvak-bgo{background:rgba(47,123,255,0.55);margin-right:0;}',
    '#tvak-bar .tvak-burl{-webkit-flex:1;flex:1;min-width:0;height:58px;margin:0 10px 0 6px;padding:0 28px;',
    'background:rgba(255,255,255,0.12);color:#fff;font-size:24px;border:1px solid rgba(255,255,255,0.3);border-radius:29px;',
    'box-sizing:border-box;box-shadow:inset 0 1px 0 rgba(255,255,255,0.3);outline:none;-webkit-appearance:none;}',
    // ---- الصفحة الرئيسية (بأسلوب Brave) ----
    '#tvak-home{all:initial;position:fixed;top:0;left:0;z-index:2147483640;display:-webkit-flex;display:flex;',
    '-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center;box-sizing:border-box;overflow:hidden;',
    'background-color:#0a0a14;direction:rtl;color:#fff;font-family:Arial,"Noto Sans Arabic",sans-serif;',
    '-webkit-transform-origin:0 0;transform-origin:0 0;}',
    '#tvak-home .tvak-hshade{position:absolute;left:0;top:0;right:0;bottom:0;',
    'background:linear-gradient(rgba(0,0,0,0.32),rgba(0,0,0,0.08) 45%,rgba(0,0,0,0.5));}',
    '#tvak-home .tvak-hcol{position:relative;display:block;width:100%;padding-top:96px;text-align:center;}',
    '#tvak-home .tvak-hclock{display:block;font-size:132px;font-weight:300;letter-spacing:3px;direction:ltr;text-shadow:0 6px 36px rgba(0,0,0,0.55);}',
    '#tvak-home .tvak-hdate{display:block;font-size:30px;opacity:0.88;margin-bottom:52px;text-shadow:0 2px 16px rgba(0,0,0,0.6);}',
    '#tvak-home .tvak-hsearch{display:block;box-sizing:border-box;width:900px;height:86px;margin:0 auto 64px;padding:0 44px;',
    'font-size:30px;color:#fff;text-align:center;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.35);',
    'border-radius:43px;-webkit-backdrop-filter:blur(26px) saturate(170%);backdrop-filter:blur(26px) saturate(170%);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.4),0 12px 40px rgba(0,0,0,0.35);outline:none;-webkit-appearance:none;}',
    '#tvak-home .tvak-hgrid{display:-webkit-flex;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap;-webkit-justify-content:center;justify-content:center;}',
    '#tvak-home .tvak-fav{display:-webkit-flex;display:flex;',
    'width:210px;height:210px;margin:18px;border-radius:44px;box-sizing:border-box;',
    'background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.3);',
    '-webkit-backdrop-filter:blur(22px) saturate(170%);backdrop-filter:blur(22px) saturate(170%);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.4),0 14px 38px rgba(0,0,0,0.35);}',
    '#tvak-home .tvak-finner{display:block;margin:auto;text-align:center;}',
    '#tvak-home .tvak-ficon{position:relative;display:block;text-align:center;line-height:108px;',
    'width:108px;height:108px;border-radius:54px;margin:0 auto 14px;',
    'font-size:46px;font-weight:bold;color:#fff;border:1px solid rgba(255,255,255,0.4);',
    'box-shadow:inset 0 1px 0 rgba(255,255,255,0.5);}',
    '#tvak-home .tvak-ficon svg{position:absolute;display:block;left:50%;top:50%;width:60px;height:60px;margin:-30px 0 0 -30px;}',
    '#tvak-home .tvak-flabel{display:block;font-size:26px;text-shadow:0 2px 10px rgba(0,0,0,0.5);}',
    // ---- تمييز العنصر تحت المؤشر ----
    '#tvak-home .tvak-hsearch::-webkit-input-placeholder{color:rgba(255,255,255,0.82);}',
    '#tvak-bar .tvak-burl::-webkit-input-placeholder{color:rgba(255,255,255,0.7);}',
    '#tvak-bar .tvak-bbtn.tvak-hov{background:rgba(255,255,255,0.34);box-shadow:0 0 0 3px rgba(120,170,255,0.9),0 0 22px rgba(255,255,255,0.4);}',
    '#tvak-bar .tvak-bgo.tvak-hov{background:rgba(70,140,255,0.85);}',
    '#tvak-bar .tvak-burl.tvak-hov{background:rgba(255,255,255,0.26);box-shadow:0 0 0 3px rgba(120,170,255,0.9);}',
    '#tvak-home .tvak-hsearch.tvak-hov{background:rgba(255,255,255,0.26);box-shadow:0 0 0 4px rgba(120,170,255,0.9),0 12px 40px rgba(0,0,0,0.35);}',
    '#tvak-home .tvak-fav.tvak-hov{background:rgba(255,255,255,0.3);box-shadow:0 0 0 4px rgba(120,170,255,0.9),0 0 36px rgba(255,255,255,0.35);',
    '-webkit-transform:scale(1.06);transform:scale(1.06);}'
  ].join('');

  // ---------- Layouts ----------
  // الصف الأول في العربي = أقصى اليمين (الاتجاه RTL)
  var LETTERS = {
    ar: [
      ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج', 'د'],
      ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك', 'ط'],
      ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ', 'ذ']
    ],
    en: [
      ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '-', '/']
    ],
    num: [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['،', '؟', '!', '@', '#', ':', '/', '_', '-', '.'],
      ['(', ')', '"', "'", '+', '=', '%', '&', '*', '?']
    ]
  };
  // فتحة، ضمة، كسرة، سكون، شدة، تنوين فتح/ضم/كسر
  var DIACRITICS = ['َ', 'ُ', 'ِ', 'ْ', 'ّ', 'ً', 'ٌ', 'ٍ'];
  var DIACRITIC_RE = /^[ً-ْ]$/;

  var DIRS = { ar: 'rtl', en: 'ltr', num: 'ltr' };

  var LABELS = {
    '{space}': 'مسافة',
    '{bksp}': '⌫',
    '{close}': 'إغلاق',
    '{num}': '123',
    '{abc}': 'ا ب ت',
    '{lang}': 'EN / ع',
    '{tashkeel}': 'تشكيل',
    '{left}': '←',
    '{right}': '→'
  };

  var KEY_BACK = [10009, 27]; // Tizen Back + Esc (للتجربة على الكمبيوتر)
  var TEXT_TYPES = ['text', 'search', 'url', 'email', 'tel', 'password', ''];

  // ---------- Persistence (قد يرمي خطأ في الوضع الخاص أو الأصل المعتم) ----------
  function load(k) {
    try { return window.localStorage.getItem('tvak.' + k); } catch (e) { return null; }
  }
  function save(k, v) {
    try { window.localStorage.setItem('tvak.' + k, v); } catch (e) {}
  }

  var savedMode = load('mode');
  var state = {
    open: false,
    mode: savedMode === 'en' ? 'en' : 'ar',
    lastLetterMode: savedMode === 'en' ? 'en' : 'ar',
    tashkeel: load('tashkeel') === '1',
    row: 0,
    col: 0,
    target: null,
    saved: null,
    dismissed: null,
    noAutoUntil: 0
  };

  var root = null;
  var styleEl = null;
  var keyEls = [];
  var previewEl = null;
  var observer = null;
  var resolveTimer = null;
  var refocusing = false;
  var swallowUp = {};
  var synthetic = false;
  var backTimer = null;
  var backHeld = false;

  function now() { return new Date().getTime(); }

  // ---------- Helpers ----------
  function inDoc(el) {
    return !!el && !!document.documentElement && document.documentElement.contains(el);
  }

  function isTextField(el) {
    if (!el || !el.tagName) return false;
    if (root && root.contains(el)) return false;
    var tag = el.tagName.toLowerCase();
    if (tag === 'textarea') return !el.disabled && (!el.readOnly || el === state.target);
    if (tag === 'input') {
      if (el.disabled) return false;
      if (el.readOnly && el !== state.target) return false;
      var t = (el.getAttribute('type') || '').toLowerCase();
      return TEXT_TYPES.indexOf(t) !== -1;
    }
    return !!el.isContentEditable;
  }

  function isMultiline(el) {
    return !!el && (el.isContentEditable || (el.tagName && el.tagName.toLowerCase() === 'textarea'));
  }

  function getRows() {
    var m = state.mode;
    var rows = LETTERS[m].slice(0);
    var bottom;
    if (m === 'ar' && state.tashkeel) rows.push(DIACRITICS);
    if (m === 'num') bottom = ['{abc}', '{lang}', '{left}', '{space}', '{right}', '{bksp}', '{enter}', '{close}'];
    else if (m === 'ar') bottom = ['{num}', '{lang}', '{tashkeel}', '{left}', '{space}', '{right}', '{bksp}', '{enter}', '{close}'];
    else bottom = ['{num}', '{lang}', '{left}', '{space}', '{right}', '{bksp}', '{enter}', '{close}'];
    rows.push(bottom);
    return rows;
  }

  function labelOf(key) {
    if (key === '{enter}') return isMultiline(state.target) ? '⏎' : 'إدخال ⏎';
    if (LABELS[key]) return LABELS[key];
    if (DIACRITIC_RE.test(key)) return 'ـ' + key; // تطويلة لعرض العلامة
    return key;
  }

  // ---------- UI ----------
  function ensureUI() {
    if (!root) {
      root = document.createElement('div');
      root.id = 'tvak-root';
      styleEl = document.createElement('style');
      styleEl.id = 'tvak-style';
      styleEl.textContent = TVAK_CSS;
    }
    var host = document.body || document.documentElement;
    if (!host) return false;
    // الصفحات قد تعيد بناء DOM؛ نعيد الإلحاق عند الحاجة
    if (root.parentNode !== host) host.appendChild(root);
    var sh = document.head || document.documentElement;
    if (styleEl.parentNode !== sh) sh.appendChild(styleEl);
    return true;
  }

  function layoutUI() {
    if (!root) return;
    var w = window.innerWidth || document.documentElement.clientWidth || 1920;
    var h = window.innerHeight || document.documentElement.clientHeight || 1080;
    var s = uiScale();
    root.style.width = Math.round(w / s) + 'px';
    var tf = 'scale(' + s + ')';
    root.style.webkitTransform = tf;
    root.style.transform = tf;
  }

  function render() {
    var rows = getRows();
    root.setAttribute('dir', DIRS[state.mode]);
    while (root.firstChild) root.removeChild(root.firstChild); // بدون innerHTML (Trusted Types)
    keyEls = [];
    previewEl = document.createElement('div');
    previewEl.className = 'tvak-preview';
    root.appendChild(previewEl);
    for (var r = 0; r < rows.length; r++) {
      var rowEl = document.createElement('div');
      rowEl.className = 'tvak-row';
      var els = [];
      for (var c = 0; c < rows[r].length; c++) {
        var key = rows[r][c];
        var k = document.createElement('div');
        k.className = 'tvak-key';
        if (key.charAt(0) === '{') {
          k.className += ' tvak-wide';
          if (key === '{space}') k.className += ' tvak-space';
          if (key === '{left}' || key === '{right}') k.className += ' tvak-arrow';
          if (key === '{enter}' || key === '{close}') k.className += ' tvak-action';
          if (key === '{tashkeel}' && state.tashkeel) k.className += ' tvak-on';
        }
        k.textContent = labelOf(key);
        // ترتيب بصري ثابت يساراً→يميناً (مثل كيبورد الهاتف: ض أقصى اليسار و د أقصى اليمين)
        rowEl.appendChild(k);
        els.push(k);
      }
      root.appendChild(rowEl);
      keyEls.push(els);
    }
    clampCursor();
    paintActive();
    updatePreview();
  }

  function updatePreview() {
    var el = state.target;
    if (!previewEl || !el) return;
    var txt, pos;
    if (el.isContentEditable) {
      txt = el.textContent || '';
      pos = txt.length;
    } else {
      txt = el.value || '';
      pos = txt.length;
      try { if (el.selectionStart !== null) pos = el.selectionStart; } catch (e) {}
      if ((el.getAttribute('type') || '').toLowerCase() === 'password') {
        txt = txt.replace(/[\s\S]/g, '•');
      }
    }
    txt = txt.replace(/\n/g, ' ');
    var pr = el.getAttribute('dir') === 'rtl';
    previewEl.style.direction = pr ? 'rtl' : 'ltr';
    previewEl.style.textAlign = pr ? 'right' : 'left';
    previewEl.textContent = txt.slice(0, pos) + '|' + txt.slice(pos);
  }

  function paintActive() {
    for (var r = 0; r < keyEls.length; r++) {
      for (var c = 0; c < keyEls[r].length; c++) {
        var on = r === state.row && c === state.col;
        var el = keyEls[r][c];
        var has = / tvak-active/.test(el.className);
        if (on && !has) el.className += ' tvak-active';
        else if (!on && has) el.className = el.className.replace(' tvak-active', '');
      }
    }
  }

  function clampCursor() {
    var rows = getRows();
    if (state.row < 0) state.row = 0;
    if (state.row > rows.length - 1) state.row = rows.length - 1;
    var len = rows[state.row].length;
    if (state.col < 0) state.col = 0;
    if (state.col > len - 1) state.col = len - 1;
  }

  function focusBottomKey(name) {
    var rows = getRows();
    var last = rows.length - 1;
    state.row = last;
    state.col = Math.max(0, rows[last].indexOf(name));
  }

  // ---------- Target binding (منع الكيبورد الأصلي + RTL) ----------
  function suppressNative(el) {
    try { el.setAttribute('inputmode', 'none'); } catch (e) {}
  }

  function applyDir() {
    var s = state.saved;
    if (!s) return;
    try { s.el.setAttribute('dir', DIRS[state.lastLetterMode]); } catch (e) {}
  }

  function bind(el) {
    if (state.target === el && state.saved) return;
    unbind();
    var s = {
      el: el,
      readonly: el.hasAttribute('readonly'),
      dir: el.getAttribute('dir'),
      value: el.value,
      id: el.id || '',
      name: el.getAttribute('name') || '',
      type: (el.getAttribute('type') || '').toLowerCase(),
      aria: el.getAttribute('aria-label') || '',
      placeholder: el.getAttribute('placeholder') || ''
    };
    state.saved = s;
    state.target = el;
    suppressNative(el);
    // readonly يمنع كيبورد Tizen في المتصفحات التي لا تدعم inputmode؛ القيمة تبقى قابلة للتعديل برمجياً
    if (!el.isContentEditable) {
      try { el.setAttribute('readonly', ''); } catch (e) {}
    }
    applyDir();
    if (CONFIG.refocusFallback && document.activeElement === el) {
      var a = null, b = null;
      try { a = el.selectionStart; b = el.selectionEnd; } catch (e) {}
      refocusing = true;
      try { el.blur(); el.focus(); } catch (e2) {}
      refocusing = false;
      try { if (a !== null) el.setSelectionRange(a, b); } catch (e3) {}
    }
  }

  function unbind() {
    var s = state.saved;
    state.saved = null;
    state.target = null;
    if (!s) return;
    var el = s.el;
    try {
      if (!s.readonly) el.removeAttribute('readonly');
      // نترك inputmode=none عمداً حتى لا يظهر الكيبورد الأصلي لاحقاً
      if (s.dir === null) el.setAttribute('dir', 'auto'); else el.setAttribute('dir', s.dir);
    } catch (e) {}
    if (inDoc(el) && !el.isContentEditable && el.value !== s.value) {
      fireEvent(el, 'change');
    }
  }

  function fireEvent(el, type, data, inputType) {
    var ev;
    try {
      if (type === 'input' && typeof window.InputEvent === 'function') {
        ev = new InputEvent('input', { bubbles: true, data: data || null, inputType: inputType || 'insertText' });
      } else {
        ev = new Event(type, { bubbles: true });
      }
    } catch (e) {
      ev = document.createEvent('Event');
      ev.initEvent(type, true, false);
    }
    el.dispatchEvent(ev);
  }

  // الصفحات (React/SPA) قد تستبدل الحقل بعنصر جديد: نبحث عن بديل أو نغلق
  function findReplacement() {
    var s = state.saved;
    var active = document.activeElement;
    if (isTextField(active)) return active;
    if (!s) return null;
    if (s.id) {
      var byId = document.getElementById(s.id);
      if (isTextField(byId)) return byId;
    }
    var list = document.querySelectorAll('input,textarea');
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (!isTextField(c) && c !== state.target) continue;
      if (s.name && c.getAttribute('name') === s.name) return c;
      if (s.aria && c.getAttribute('aria-label') === s.aria) return c;
      if (s.placeholder && c.getAttribute('placeholder') === s.placeholder) return c;
    }
    return null;
  }

  function resolveTarget() {
    var el = state.target;
    if (el && inDoc(el)) return el;
    if (!state.open) return null;
    var next = findReplacement();
    if (!next) { closeKeyboard(); return null; }
    state.saved = null; // الحقل القديم ميت، لا نستعيد خصائصه
    state.target = null;
    bind(next);
    try { if (document.activeElement !== next) next.focus(); } catch (e) {}
    render();
    return next;
  }

  function watch() {
    if (observer || typeof MutationObserver !== 'function' || !document.documentElement) return;
    observer = new MutationObserver(function () {
      if (resolveTimer) return;
      resolveTimer = setTimeout(function () {
        resolveTimer = null;
        if (state.open) resolveTarget();
      }, 150);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function unwatch() {
    if (observer) { observer.disconnect(); observer = null; }
    if (resolveTimer) { clearTimeout(resolveTimer); resolveTimer = null; }
  }

  // ---------- Text editing ----------
  function setNativeValue(el, value) {
    var proto = el.tagName.toLowerCase() === 'textarea'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    var desc = Object.getOwnPropertyDescriptor(proto, 'value');
    if (desc && desc.set) desc.set.call(el, value); // يتجاوز مُتتبّع قيمة React
    else el.value = value;
  }

  function getSel(el) {
    var val = el.value || '';
    var start = null, end = null;
    try { start = el.selectionStart; end = el.selectionEnd; } catch (e) {}
    if (start === null || start === undefined) { start = end = val.length; }
    return { val: val, start: start, end: end };
  }

  function insertText(text) {
    var el = resolveTarget();
    if (!el) return;
    if (el.isContentEditable) {
      try { el.focus(); } catch (e) {}
      if (text === '\n') document.execCommand('insertLineBreak');
      else document.execCommand('insertText', false, text);
      return;
    }
    var s = getSel(el);
    var max = el.maxLength;
    if (max > -1 && s.val.length - (s.end - s.start) + text.length > max) return;
    setNativeValue(el, s.val.slice(0, s.start) + text + s.val.slice(s.end));
    var pos = s.start + text.length;
    try { el.setSelectionRange(pos, pos); } catch (e2) {}
    fireEvent(el, 'input', text, 'insertText');
    updatePreview();
  }

  function backspace() {
    var el = resolveTarget();
    if (!el) return;
    if (el.isContentEditable) {
      try { el.focus(); } catch (e) {}
      document.execCommand('delete');
      return;
    }
    var s = getSel(el);
    var start = s.start;
    if (s.start === s.end) {
      if (start === 0) return;
      start -= 1;
    }
    setNativeValue(el, s.val.slice(0, start) + s.val.slice(s.end));
    try { el.setSelectionRange(start, start); } catch (e2) {}
    fireEvent(el, 'input', null, 'deleteContentBackward');
    updatePreview();
  }

  // dir: -1 = يسار الشاشة، +1 = يمين الشاشة (في RTL اليسار = الأمام منطقياً)
  function moveCaret(dir) {
    var el = resolveTarget();
    if (!el) return;
    var rtl = el.getAttribute('dir') === 'rtl';
    var delta = rtl ? -dir : dir;
    if (el.isContentEditable) {
      try {
        window.getSelection().modify('move', delta > 0 ? 'forward' : 'backward', 'character');
      } catch (e) {}
      updatePreview();
      return;
    }
    var s = getSel(el);
    var pos;
    if (s.start !== s.end) pos = delta < 0 ? s.start : s.end;
    else pos = Math.max(0, Math.min(s.val.length, s.start + delta));
    try { el.setSelectionRange(pos, pos); } catch (e2) {}
    updatePreview();
  }

  function keyEvent(type, code, name) {
    var ev;
    try {
      ev = new KeyboardEvent(type, { key: name, code: name, keyCode: code, which: code, bubbles: true, cancelable: true });
    } catch (e) {
      ev = document.createEvent('Event');
      ev.initEvent(type, true, true);
    }
    if (ev.keyCode !== code) {
      try {
        Object.defineProperty(ev, 'keyCode', { get: function () { return code; } });
        Object.defineProperty(ev, 'which', { get: function () { return code; } });
      } catch (e2) {}
    }
    return ev;
  }

  function submit() {
    var el = resolveTarget();
    if (!el) return;
    if (isMultiline(el)) { insertText('\n'); return; }
    var form = el.form;
    closeKeyboard(); // أولاً: يعيد readonly ويطلق change قبل الإرسال
    var prevented = false;
    var types = ['keydown', 'keypress', 'keyup'];
    synthetic = true; // حتى لا يلتقط معالجنا Enter المصطنع ويعيد فتح الكيبورد
    try {
      for (var i = 0; i < types.length; i++) {
        var ev = keyEvent(types[i], 13, 'Enter');
        if (el.dispatchEvent(ev) === false) prevented = true;
      }
    } finally {
      synthetic = false;
    }
    // الأحداث المصطنعة لا تُشغّل الإرسال الضمني، فنرسل النموذج إن لم تعالجها الصفحة
    if (form && !prevented) {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
      } else {
        var sev = document.createEvent('Event');
        sev.initEvent('submit', true, true);
        if (form.dispatchEvent(sev)) form.submit();
      }
    }
  }

  // ---------- Open / close ----------
  function scrollFieldIntoView(el) {
    try {
      var r = el.getBoundingClientRect();
      var k = root.getBoundingClientRect();
      if (r.bottom > k.top || r.top < 0) {
        try { el.scrollIntoView({ block: 'center' }); } catch (e) { el.scrollIntoView(); }
      }
    } catch (e2) {}
  }

  function openKeyboard(el, explicit) {
    if (!ensureUI()) return;
    bind(el);
    if (el.id === 'tvak-url') {
      state.prevLetter = state.lastLetterMode;
      state.mode = 'en';
      state.lastLetterMode = 'en';
      applyDir();
      try { el.setSelectionRange(0, (el.value || '').length); } catch (e) {}
    }
    state.open = true;
    state.dismissed = null;
    state.row = 0;
    state.col = 0;
    root.className = 'tvak-open';
    layoutUI();
    render();
    watch();
    scrollFieldIntoView(el);
  }

  function closeKeyboard() {
    if (!state.open) return;
    var el = state.target;
    state.open = false;
    if (root) root.className = '';
    if (state.prevLetter) {
      state.lastLetterMode = state.prevLetter;
      state.mode = state.prevLetter;
      state.prevLetter = null;
    }
    unwatch();
    unbind();
    state.dismissed = el;
    state.noAutoUntil = now() + CONFIG.suppressMs;
  }

  function switchMode(mode, keyName) {
    state.mode = mode;
    if (mode === 'ar' || mode === 'en') {
      state.lastLetterMode = mode;
      save('mode', mode);
    }
    applyDir();
    render();
    if (keyName) { focusBottomKey(keyName); paintActive(); }
    else { state.row = 0; state.col = 0; paintActive(); }
  }

  function pressActive() {
    var key = getRows()[state.row][state.col];
    switch (key) {
      case '{space}': insertText(' '); break;
      case '{bksp}': backspace(); break;
      case '{left}': moveCaret(-1); break;
      case '{right}': moveCaret(1); break;
      case '{enter}': submit(); break;
      case '{close}': closeKeyboard(); break;
      case '{num}': switchMode('num', '{abc}'); break;
      case '{abc}': switchMode(state.lastLetterMode, '{num}'); break;
      case '{lang}': switchMode(state.lastLetterMode === 'ar' ? 'en' : 'ar', '{lang}'); break;
      case '{tashkeel}':
        state.tashkeel = !state.tashkeel;
        save('tashkeel', state.tashkeel ? '1' : '0');
        render();
        focusBottomKey('{tashkeel}');
        paintActive();
        break;
      default: insertText(key);
    }
  }

  // ---------- Pointer mode (مؤشر ماوس افتراضي للريموت) ----------
  var PTR_TOGGLE = [403, 404, 405, 406]; // الأحمر/الأخضر/الأصفر/الأزرق (مسجّلة في keys داخل package.json)
  var ptr = {
    on: false, placed: false, x: 0, y: 0, count: 0, hover: null,
    el: null, toast: null, toastTimer: null, holdTimer: null, holdFired: false,
    ignoreOk: false, fromParent: false, waitTimer: null
  };

  function uiScale() {
    var w = window.innerWidth || document.documentElement.clientWidth || 1920;
    var h = window.innerHeight || document.documentElement.clientHeight || 1080;
    var s = Math.min(w / 1920, h / 1080); // 1080p => 1، 4K (3840x2160) => 2
    if (s < 0.3) s = 0.3;
    if (s > 2.5) s = 2.5;
    return s;
  }

  function ensurePointerUI() {
    if (!ensureUI()) return false;
    var host = document.body || document.documentElement;
    if (!host) return false;
    if (!ptr.toast) {
      var t = document.createElement('div');
      t.id = 'tvak-toast';
      ptr.toast = t;
    }
    if (!ptr.el) {
      var c = document.createElement('div');
      c.id = 'tvak-cursor';
      try {
        // createElementNS بدل innerHTML: بعض المواقع (Google) تفرض Trusted Types فتمنع innerHTML
        var ns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', '0 0 24 24');
        var path = document.createElementNS(ns, 'path');
        path.setAttribute('d', 'M3 2 L3 19 L7.5 14.8 L10.5 21.5 L13.2 20.3 L10.2 13.8 L16.5 13.8 Z');
        path.setAttribute('fill', '#fff');
        path.setAttribute('stroke', '#000');
        path.setAttribute('stroke-width', '1.5');
        path.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(path);
        c.appendChild(svg);
      } catch (e) {
        c.textContent = '➤'; // بديل نصي (يشير لأعلى اليسار بعد التدوير)
        c.style.color = '#fff';
        c.style.fontSize = '36px';
        c.style.webkitTransform = 'rotate(-135deg)';
        c.style.transform = 'rotate(-135deg)';
      }
      ptr.el = c;
    }
    if (ptr.el.parentNode !== host) host.appendChild(ptr.el);
    if (ptr.toast.parentNode !== host) host.appendChild(ptr.toast);
    return true;
  }

  function showToast(text) {
    if (!ptr.toast) return;
    ptr.toast.textContent = text;
    ptr.toast.className = 'tvak-on';
    if (ptr.toastTimer) clearTimeout(ptr.toastTimer);
    ptr.toastTimer = setTimeout(function () { ptr.toast.className = ''; }, 2500);
  }

  function positionCursor() {
    if (!ptr.el) return;
    var size = Math.round(38 * uiScale());
    ptr.el.style.width = size + 'px';
    ptr.el.style.height = size + 'px';
    ptr.el.style.left = Math.round(ptr.x - size * 0.12) + 'px';
    ptr.el.style.top = Math.round(ptr.y - size * 0.08) + 'px';
  }

  function elAt() {
    try { return document.elementFromPoint(ptr.x, ptr.y); } catch (e) { return null; }
  }

  function mouseEv(type, el) {
    var ev;
    try {
      ev = new MouseEvent(type, {
        bubbles: true, cancelable: true, view: window,
        clientX: ptr.x, clientY: ptr.y, button: 0, buttons: type === 'mousedown' ? 1 : 0
      });
    } catch (e) {
      ev = document.createEvent('MouseEvents');
      ev.initMouseEvent(type, true, true, window, 0, 0, 0, ptr.x, ptr.y, false, false, false, false, 0, null);
    }
    el.dispatchEvent(ev);
  }

  function pointerEv(type, el) {
    if (typeof window.PointerEvent !== 'function') return;
    try {
      el.dispatchEvent(new PointerEvent(type, {
        bubbles: true, cancelable: true, view: window, clientX: ptr.x, clientY: ptr.y,
        pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: type === 'pointerdown' ? 1 : 0
      }));
    } catch (e) {}
  }

  function hitOf(el) {
    var n = el;
    for (var i = 0; i < 4 && n && n.nodeType === 1; i++) {
      var c = n.getAttribute ? n.getAttribute('class') : '';
      if (c && (' ' + c + ' ').indexOf(' tvak-hit ') !== -1) return n;
      n = n.parentNode;
    }
    return null;
  }

  function setHit(h) {
    if (h === ptr.hit) return;
    if (ptr.hit) ptr.hit.className = ptr.hit.className.replace(' tvak-hov', '');
    if (h && h.className.indexOf('tvak-hov') === -1) h.className += ' tvak-hov';
    ptr.hit = h;
  }

  function doHover() {
    var el = elAt();
    if (!el) return;
    setHit(hitOf(el));
    if (el !== ptr.hover) {
      if (ptr.hover) mouseEv('mouseout', ptr.hover);
      mouseEv('mouseover', el);
      ptr.hover = el;
    }
    mouseEv('mousemove', el);
  }

  function scrollAt(dx, dy) {
    var n = elAt();
    while (n && n.nodeType === 1 && n !== document.body && n !== document.documentElement) {
      var cs = window.getComputedStyle(n);
      var before;
      if (dy && (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && n.scrollHeight > n.clientHeight) {
        before = n.scrollTop; n.scrollTop += dy;
        if (n.scrollTop !== before) return;
      }
      if (dx && (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && n.scrollWidth > n.clientWidth) {
        before = n.scrollLeft; n.scrollLeft += dx;
        if (n.scrollLeft !== before) return;
      }
      n = n.parentNode;
    }
    window.scrollBy(dx, dy);
  }

  function movePointer(dx, dy, step) {
    var w = window.innerWidth || 1920;
    var h = window.innerHeight || 1080;
    var m = 6;
    var nx = ptr.x + dx * step;
    var ny = ptr.y + dy * step;
    // عند الحافة نمرّر الصفحة (أو الحاوية تحت المؤشر)
    if (ny < m && dy < 0) scrollAt(0, -step * 2);
    else if (ny > h - m && dy > 0) scrollAt(0, step * 2);
    if (nx < m && dx < 0) scrollAt(-step * 2, 0);
    else if (nx > w - m && dx > 0) scrollAt(step * 2, 0);
    ptr.x = Math.max(m, Math.min(w - m, nx));
    ptr.y = Math.max(m, Math.min(h - m, ny));
    positionCursor();
    doHover();
  }

  function textFieldAbove(el) {
    var n = el;
    for (var i = 0; i < 5 && n; i++) {
      if (n.nodeType === 1 && isTextField(n)) return n;
      n = n.parentNode;
    }
    return null;
  }

  function handoffToFrame(frame) {
    var r = frame.getBoundingClientRect();
    try {
      frame.contentWindow.postMessage({ tvak: 'ptr', x: ptr.x - r.left, y: ptr.y - r.top }, '*');
    } catch (e) { return; }
    try { frame.focus(); } catch (e2) {}
    exitPointer(false);
    // إن لم يرد الإطار (لا يحمل السكربت) نستعيد المؤشر هنا
    ptr.waitTimer = setTimeout(function () {
      ptr.waitTimer = null;
      try { window.focus(); } catch (e3) {}
      enterPointer();
      showToast('هذا الإطار لا يدعم المؤشر');
    }, 700);
  }

  function clickPointer() {
    var el = elAt();
    if (!el) return;
    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    diag('click ' + tag + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' +
      el.className.split(' ')[0] : '') + ' "' + String(el.textContent || '').replace(/\s+/g, ' ').slice(0, 24) +
      '" @' + Math.round(ptr.x) + ',' + Math.round(ptr.y) + ' of ' + window.innerWidth + 'x' + window.innerHeight, 5000);
    if (tag === 'iframe' || tag === 'frame') { handoffToFrame(el); return; }
    pointerEv('pointerdown', el);
    mouseEv('mousedown', el);
    var field = textFieldAbove(el);
    if (field) { try { field.focus(); } catch (e) {} }
    pointerEv('pointerup', el);
    mouseEv('mouseup', el);
    if (typeof el.click === 'function') el.click(); else mouseEv('click', el);
  }

  function enterPointer(x, y) {
    if (state.open) closeKeyboard();
    if (!ensurePointerUI()) return;
    var w = window.innerWidth || 1920;
    var h = window.innerHeight || 1080;
    if (typeof x === 'number') { ptr.x = x; ptr.y = y; }
    else if (!ptr.placed) { ptr.x = w / 2; ptr.y = h / 2; }
    ptr.x = Math.max(6, Math.min(w - 6, ptr.x));
    ptr.y = Math.max(6, Math.min(h - 6, ptr.y));
    ptr.placed = true;
    ptr.on = true;
    ptr.el.className = 'tvak-on';
    positionCursor();
    showBar();
    showToast('وضع المؤشر: الأسهم للتحريك، زر الموافقة للنقر، زر الرجوع للخروج');
    if (ptr.fromParent) {
      try { window.parent.postMessage({ tvak: 'ptr-ack' }, '*'); } catch (e) {}
    }
  }

  function exitPointer(notifyParent) {
    ptr.on = false;
    ptr.count = 0;
    hideBar();
    setHit(null);
    if (ptr.el) ptr.el.className = '';
    if (ptr.hover) { try { mouseEv('mouseout', ptr.hover); } catch (e) {} ptr.hover = null; }
    if (notifyParent !== false && ptr.fromParent) {
      ptr.fromParent = false;
      try { window.parent.postMessage({ tvak: 'ptr-back' }, '*'); } catch (e2) {}
    }
  }

  // يعيد true إن عولج المفتاح
  function onPointerKey(e, code) {
    if (PTR_TOGGLE.indexOf(code) !== -1 || KEY_BACK.indexOf(code) !== -1) {
      if (!e.repeat) exitPointer();
      return true;
    }
    var dx = 0, dy = 0;
    if (code === 37) dx = -1;
    else if (code === 39) dx = 1;
    else if (code === 38) dy = -1;
    else if (code === 40) dy = 1;
    if (dx || dy) {
      ptr.count = e.repeat ? Math.min(ptr.count + 1, 20) : 0; // تسارع عند الضغط المستمر
      var base = 14 * Math.max(0.6, (window.innerWidth || 1920) / 1920);
      movePointer(dx, dy, base + ptr.count * 4);
      return true;
    }
    if (code === 13) {
      if (!e.repeat && !ptr.ignoreOk) clickPointer();
      return true;
    }
    return false;
  }

  function onMessage(e) {
    var d = e.data;
    if (!d || typeof d !== 'object' || !d.tvak) return;
    if (d.tvak === 'ptr' && e.source === window.parent) {
      ptr.fromParent = true;
      try { window.focus(); } catch (x) {}
      enterPointer(d.x, d.y);
    } else if (d.tvak === 'ptr-ack') {
      if (ptr.waitTimer) { clearTimeout(ptr.waitTimer); ptr.waitTimer = null; }
    } else if (d.tvak === 'ptr-back' && e.source !== window) {
      try { window.focus(); } catch (y) {}
      ptr.fromParent = false;
      enterPointer();
    }
  }

  // ---------- شريط التصفح + الصفحة الرئيسية ----------
  var bar = null;
  var urlInput = null;
  var home = null;
  var homeClock = null;
  var homeDate = null;
  var homeSearch = null;
  var clockTimer = null;

  function mkEl(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // أيقونات SVG بدون innerHTML (Trusted Types)
  var ICONS = {
    back: ['M15 5 L8 12 L15 19'],
    forward: ['M9 5 L16 12 L9 19'],
    reload: ['M20 12 A8 8 0 1 1 17.2 6', 'M20 3.5 L20 9 L14.5 9'],
    home: ['M4 11 L12 4 L20 11', 'M6 10 L6 20 L10 20 L10 14 L14 14 L14 20 L18 20 L18 10'],
    go: ['M5 12 L19 12', 'M13 6 L19 12 L13 18']
  };

  function icon(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    var paths = ICONS[name];
    for (var i = 0; i < paths.length; i++) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', paths[i]);
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', '#fff');
      p.setAttribute('stroke-width', '2.2');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(p);
    }
    return svg;
  }

  // أيقونات البلاطات (SVG بدون innerHTML): مسارات 24x24 مع تدرج لوني لكل أيقونة
  var TILE_ICONS = {
    search: { grad: ['#4c8dff', '#8b5cf6'], shapes: [
      { d: 'M10.5 4 A6.5 6.5 0 1 0 10.5 17 A6.5 6.5 0 1 0 10.5 4 Z' },
      { d: 'M15.4 15.4 L20 20' }
    ] },
    media: { grad: ['#ff5f7e', '#ff9a5c'], shapes: [
      { d: 'M6 5 H18 A2 2 0 0 1 20 7 V17 A2 2 0 0 1 18 19 H6 A2 2 0 0 1 4 17 V7 A2 2 0 0 1 6 5 Z' },
      { d: 'M10 9 L15.5 12 L10 15 Z', fill: true }
    ] },
    movie: { grad: ['#ffb347', '#ff6b4a'], shapes: [
      { d: 'M4 10 H20 V19 A1 1 0 0 1 19 20 H5 A1 1 0 0 1 4 19 Z' },
      { d: 'M4 9 L3.2 5.6 L19.9 3.2 L20 7.2 Z' },
      { d: 'M8.6 8.4 L9.5 4.6' },
      { d: 'M13.6 7.7 L14.5 3.9' }
    ] },
    cartoon: { grad: ['#3ddc97', '#3aa8ff'], shapes: [
      { d: 'M12 4 A8 8 0 1 0 12 20 A8 8 0 1 0 12 4 Z' },
      { d: 'M9 9.2 A1.2 1.2 0 1 0 9.01 9.2 Z', fill: true },
      { d: 'M15 9.2 A1.2 1.2 0 1 0 15.01 9.2 Z', fill: true },
      { d: 'M8.4 13.4 Q12 18 15.6 13.4' }
    ] }
  };

  function tileIcon(spec) {
    var ns = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    for (var i = 0; i < spec.shapes.length; i++) {
      var p = document.createElementNS(ns, 'path');
      p.setAttribute('d', spec.shapes[i].d);
      p.setAttribute('fill', spec.shapes[i].fill ? '#fff' : 'none');
      p.setAttribute('stroke', '#fff');
      p.setAttribute('stroke-width', '1.7');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(p);
    }
    return svg;
  }

  function toUrl(t) {
    t = String(t || '').replace(/^\s+|\s+$/g, '');
    if (!t) return null;
    if (/^[a-z][a-z0-9+.\-]*:\/\//i.test(t)) return t;
    if (/\s/.test(t) || t.indexOf('.') === -1) {
      return 'https://www.google.com/search?q=' + encodeURIComponent(t);
    }
    return 'https://' + t;
  }

  function goTo(t) {
    var u = toUrl(t);
    if (u) { diag('→ ' + u, 3000); location.href = u; }
  }

  function scaleBox(el) {
    var w = window.innerWidth || 1920;
    var s = uiScale();
    el.style.width = Math.round(w / s) + 'px';
    var tf = 'scale(' + s + ')';
    el.style.webkitTransform = tf;
    el.style.transform = tf;
  }

  function ensureBar() {
    var host = document.body || document.documentElement;
    if (!host || !ensureUI()) return false;
    if (!bar) {
      bar = mkEl('div');
      bar.id = 'tvak-bar';
      var items = [
        ['back', function () { history.back(); }],
        ['forward', function () { history.forward(); }],
        ['reload', function () { location.reload(); }],
        ['home', function () { location.href = CONFIG.homeUrl; }]
      ];
      for (var i = 0; i < items.length; i++) {
        (function (it) {
          var b = mkEl('div', 'tvak-bbtn tvak-hit');
          b.appendChild(icon(it[0]));
          b.addEventListener('click', it[1]);
          bar.appendChild(b);
        })(items[i]);
      }
      urlInput = document.createElement('input');
      urlInput.type = 'text';
      urlInput.id = 'tvak-url';
      urlInput.className = 'tvak-burl tvak-hit';
      urlInput.setAttribute('dir', 'ltr');
      urlInput.setAttribute('placeholder', 'اكتب رابطاً أو كلمة للبحث');
      urlInput.addEventListener('keydown', function (e) {
        if (e.keyCode === 13) goTo(urlInput.value);
      });
      bar.appendChild(urlInput);
      var go = mkEl('div', 'tvak-bbtn tvak-bgo tvak-hit');
      go.appendChild(icon('go'));
      go.addEventListener('click', function () { goTo(urlInput.value); });
      bar.appendChild(go);
    }
    if (bar.parentNode !== host) host.appendChild(bar);
    return true;
  }

  function layoutBar() {
    var s = uiScale();
    var w = window.innerWidth || 1920;
    var side = 48 * s;
    bar.style.left = Math.round(side) + 'px';
    bar.style.top = Math.round(CONFIG.barTop * s) + 'px';
    bar.style.width = Math.round((w - side * 2) / s) + 'px';
    var tf = 'scale(' + s + ')';
    bar.style.webkitTransform = tf;
    bar.style.transform = tf;
  }

  function showBar() {
    if (!CONFIG.browserBar || !ensureBar()) return;
    layoutBar();
    if (urlInput && !state.open) urlInput.value = location.href;
    bar.className = 'tvak-on';
  }

  function hideBar() {
    if (bar) bar.className = '';
  }

  function isHomePage() {
    try {
      return location.hostname === 'example.com' && /(^|[?&])tvak=home(&|$)/.test(location.search);
    } catch (e) { return false; }
  }

  function two(n) { return (n < 10 ? '0' : '') + n; }

  function updateClock() {
    if (!homeClock) return;
    var d = new Date();
    homeClock.textContent = two(d.getHours()) + ':' + two(d.getMinutes());
    var txt = '';
    try {
      txt = d.toLocaleDateString('ar', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (e) {}
    homeDate.textContent = txt;
  }

  function tileColor(i) {
    var hues = [215, 340, 150, 35, 275, 190];
    return 'hsla(' + hues[i % hues.length] + ',75%,58%,0.55)';
  }

  function buildHome() {
    if (!CONFIG.browserBar || !isHomePage() || !document.body) return;
    if (home && home.parentNode === document.body) return;
    home = mkEl('div');
    home.id = 'tvak-home';
    if (CONFIG.homeBackground) {
      home.style.backgroundImage = 'url("' + CONFIG.homeBackground + '")';
      home.style.backgroundSize = 'cover';
      home.style.backgroundPosition = 'center';
    }
    home.appendChild(mkEl('div', 'tvak-hshade'));
    var col = mkEl('div', 'tvak-hcol');
    homeClock = mkEl('div', 'tvak-hclock');
    homeDate = mkEl('div', 'tvak-hdate');
    col.appendChild(homeClock);
    col.appendChild(homeDate);

    homeSearch = document.createElement('input');
    homeSearch.type = 'text';
    homeSearch.id = 'tvak-hsearch';
    homeSearch.className = 'tvak-hsearch tvak-hit';
    homeSearch.setAttribute('placeholder', 'ابحث في Google أو اكتب رابطاً');
    homeSearch.addEventListener('keydown', function (e) {
      if (e.keyCode === 13) goTo(homeSearch.value);
    });
    col.appendChild(homeSearch);

    var grid = mkEl('div', 'tvak-hgrid');
    for (var i = 0; i < CONFIG.favorites.length; i++) {
      (function (f, idx) {
        var c = mkEl('div', 'tvak-fav tvak-hit');
        var ic = mkEl('div', 'tvak-ficon');
        var spec = TILE_ICONS[f[2]];
        if (spec) {
          ic.style.background = 'linear-gradient(135deg,' + spec.grad[0] + ',' + spec.grad[1] + ')';
          ic.appendChild(tileIcon(spec));
        } else {
          ic.textContent = String(f[0]).charAt(0).toUpperCase();
          ic.style.background = tileColor(idx);
        }
        var inner = mkEl('div', 'tvak-finner');
        inner.appendChild(ic);
        inner.appendChild(mkEl('div', 'tvak-flabel', f[0]));
        c.appendChild(inner);
        c.addEventListener('click', function () { location.href = f[1]; });
        grid.appendChild(c);
      })(CONFIG.favorites[i], i);
    }
    col.appendChild(grid);
    home.appendChild(col);
    document.body.appendChild(home);
    scaleBox(home);
    home.style.height = Math.round((window.innerHeight || 1080) / uiScale()) + 'px';
    try { document.title = 'الصفحة الرئيسية'; } catch (e2) {}
    updateClock();
    if (clockTimer) clearInterval(clockTimer);
    clockTimer = setInterval(updateClock, 20000);
    enterPointer(); // نبدأ بوضع المؤشر ليتمكن المستخدم من الاختيار مباشرة
  }

  function onReady(fn) {
    if (document.body) fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ---------- Remote control ----------
  function eat(e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  }

  function goHome() {
    if (ensurePointerUI()) showToast('الصفحة الرئيسية');
    try { window.top.location.href = CONFIG.homeUrl; } catch (e) { location.href = CONFIG.homeUrl; }
  }

  function onKeyDown(e) {
    try {
      if (!synthetic && e.keyCode === 10009 && !e.repeat && CONFIG.backHoldMs > 0) {
        if (backTimer) clearTimeout(backTimer);
        backHeld = false;
        backTimer = setTimeout(function () {
          backTimer = null;
          backHeld = true;
          goHome();
        }, CONFIG.backHoldMs);
      }
      if (!synthetic) diag('key ' + e.keyCode + (e.repeat ? ' (repeat)' : ''), 2500);
      handleKeyDown(e);
    } catch (err) {
      diag('TVAK keydown error: ' + errText(err), 20000);
    }
  }

  function handleKeyDown(e) {
    if (synthetic) return;
    var code = e.keyCode;

    if (!state.open) {
      if (CONFIG.showKeyCodes && !ptr.on && [37, 38, 39, 40, 13, 10009].indexOf(code) === -1 && PTR_TOGGLE.indexOf(code) === -1) {
        if (ensurePointerUI()) showToast('رمز المفتاح: ' + code);
      }
      // الألوان: تشغيل/إيقاف وضع المؤشر
      if (PTR_TOGGLE.indexOf(code) !== -1) {
        eat(e);
        swallowUp[code] = true;
        if (!e.repeat) { if (ptr.on) exitPointer(); else enterPointer(); }
        return;
      }
      if (ptr.on) {
        if (onPointerKey(e, code)) { swallowUp[code] = true; eat(e); }
        return;
      }
      if (code === 13) {
        if (isTextField(document.activeElement)) {
          // OK على حقل نص: افتح الكيبورد صراحةً (يتجاوز منع الفتح التلقائي)
          eat(e);
          swallowUp[code] = true;
          if (!e.repeat) openKeyboard(document.activeElement, true);
        } else if (!e.repeat) {
          // بديل عن الزر الأحمر: ضغطة طويلة على OK تشغّل المؤشر
          if (ptr.holdTimer) clearTimeout(ptr.holdTimer);
          ptr.holdFired = false;
          ptr.holdTimer = setTimeout(function () {
            ptr.holdTimer = null;
            ptr.holdFired = true;
            ptr.ignoreOk = true;
            enterPointer();
          }, 800);
        }
      }
      return;
    }

    var rtl = false; // تخطيط الكيبورد لا ينعكس؛ اتجاه الحقل منفصل
    var rows = getRows();
    var handled = true;

    if (KEY_BACK.indexOf(code) !== -1) {
      closeKeyboard(); // نمنع Back من الوصول للمتصفح فلا يخرج
    } else if (code === 37 || code === 39) {
      var dx = code === 37 ? -1 : 1;
      state.col += rtl ? -dx : dx;
      clampCursor(); paintActive();
    } else if (code === 38 || code === 40) {
      var oldLen = rows[state.row].length;
      var ratio = oldLen > 1 ? state.col / (oldLen - 1) : 0;
      state.row += code === 38 ? -1 : 1;
      if (state.row < 0) state.row = 0;
      if (state.row > rows.length - 1) state.row = rows.length - 1;
      state.col = Math.round(ratio * (rows[state.row].length - 1));
      clampCursor(); paintActive();
    } else if (code === 13) {
      var pk = rows[state.row][state.col];
      if (!e.repeat || pk === '{bksp}' || pk === '{left}' || pk === '{right}') {
        pressActive();
      }
    } else {
      handled = false;
    }

    if (handled) {
      swallowUp[code] = true;
      eat(e);
    }
  }

  function onKeyUp(e) {
    if (!synthetic && e.keyCode === 10009) {
      if (backTimer) { clearTimeout(backTimer); backTimer = null; }
      if (backHeld) { backHeld = false; eat(e); return; }
    }
    try { handleKeyUp(e); } catch (err) { diag('TVAK keyup error: ' + errText(err), 20000); }
  }

  function handleKeyUp(e) {
    if (synthetic) return;
    if (e.keyCode === 13) {
      if (ptr.holdTimer) { clearTimeout(ptr.holdTimer); ptr.holdTimer = null; }
      ptr.ignoreOk = false;
      if (ptr.holdFired) { ptr.holdFired = false; eat(e); return; }
    }
    if (swallowUp[e.keyCode]) {
      delete swallowUp[e.keyCode];
      eat(e);
    }
  }

  // ---------- Focus handling ----------
  function onFocus(e) {
    try { handleFocus(e); } catch (err) { diag('TVAK focus error: ' + errText(err), 20000); }
  }

  function handleFocus(e) {
    var el = e.target;
    if (!isTextField(el)) {
      if (state.open && el && el.nodeType === 1 && el !== document.body && el !== document.documentElement) {
        closeKeyboard();
      }
      return;
    }
    suppressNative(el);
    if (refocusing) return;
    if (state.open) {
      if (el !== state.target) { bind(el); render(); }
      return;
    }
    if (!CONFIG.autoOpen) return;
    if (el === state.dismissed) return;
    if (now() < state.noAutoUntil) return;
    openKeyboard(el, false);
  }

  function onBlur(e) {
    if (e.target === state.dismissed) state.dismissed = null;
  }

  function onResize() {
    if (state.open) layoutUI();
  }

  // ---------- حظر الإعلانات المنبثقة ----------
  // ملاحظة: لا يمكن حظر الشبكة من داخل الصفحة؛ هذا يعالج النوافذ المنبثقة والطبقات الشفافة والعناصر المعروفة فقط.
  var AD_SELECTORS = [
    'ins.adsbygoogle', '.adsbygoogle',
    'iframe[src*="doubleclick.net"]', 'iframe[src*="googlesyndication.com"]', 'iframe[src*="adservice.google"]',
    'iframe[src*="adsterra"]', 'iframe[src*="exoclick"]', 'iframe[src*="popads"]', 'iframe[src*="juicyads"]',
    'iframe[src*="propellerads"]', 'iframe[src*="clickadu"]', 'iframe[src*="hilltopads"]',
    'a[href*="exoclick.com"]', 'a[href*="popads.net"]', 'a[href*="juicyads.com"]', 'a[href*="adsterra.com"]',
    'a[href*="propellerads.com"]', 'a[href*="trafficjunky.net"]', 'a[href*="clickadu.com"]', 'a[href*="hilltopads.net"]',
    '[id^="div-gpt-ad"]', '[id*="google_ads_iframe"]', '.ad-banner', '.ads-banner', '.advertisement', '.adsbox'
  ];
  var adCount = 0;
  var adStyle = null;
  var lastAdToast = 0;

  function adBlocked() {
    adCount++;
    var t = now();
    if (t - lastAdToast > 1500) {
      lastAdToast = t;
      if (ensurePointerUI()) showToast('تم حظر إعلان (' + adCount + ')');
    }
  }

  function hostOf(u) {
    try {
      var a = document.createElement('a');
      a.href = u;
      return a.hostname;
    } catch (e) { return ''; }
  }

  function sameSite(u) {
    var h = hostOf(u);
    var me = location.hostname;
    if (!h || h === me) return true;
    return h.slice(-(me.length + 1)) === '.' + me || me.slice(-(h.length + 1)) === '.' + h;
  }

  function attachAdStyle() {
    var host = document.head || document.documentElement;
    if (!host) return;
    if (!adStyle) {
      adStyle = document.createElement('style');
      adStyle.id = 'tvak-adstyle';
      adStyle.textContent = AD_SELECTORS.join(',') + '{display:none !important;}';
    }
    if (adStyle.parentNode !== host) host.appendChild(adStyle);
  }

  // طبقة شفافة بحجم الشاشة وهي رابط خارجي = خطف نقرات: نحذفها (لا نلمس iframe حتى لا نكسر المشغّل)
  function sweepOverlays() {
    var w = window.innerWidth || 1920;
    var h = window.innerHeight || 1080;
    var pts = [[0.5, 0.5], [0.25, 0.3], [0.75, 0.7]];
    for (var i = 0; i < pts.length; i++) {
      var el;
      try { el = document.elementFromPoint(w * pts[i][0], h * pts[i][1]); } catch (e) { el = null; }
      var n = el;
      for (var j = 0; j < 6 && n && n.nodeType === 1 && n !== document.body && n !== document.documentElement; j++) {
        if (n.tagName === 'A' && n.href && !sameSite(n.href)) {
          var cs = window.getComputedStyle(n);
          if (cs.position === 'fixed' || cs.position === 'absolute') {
            var r = n.getBoundingClientRect();
            var clear = parseFloat(cs.opacity) < 0.1 || cs.backgroundColor === 'rgba(0, 0, 0, 0)' || cs.backgroundColor === 'transparent';
            var txt = (n.textContent || '').replace(/\s+/g, '');
            if (r.width >= w * 0.8 && r.height >= h * 0.8 && clear && txt.length < 3) {
              if (n.parentNode) n.parentNode.removeChild(n);
              adBlocked();
              break;
            }
          }
        }
        n = n.parentNode;
      }
    }
  }

  function installAdBlock() {
    if (!CONFIG.blockAds) return;
    try {
      window.open = function () {
        adBlocked();
        // كائن وهمي حتى لا تعتبر الصفحة أن المنبثقة فشلت وتحوّلك بالقوة لرابط الإعلان
        return {
          closed: true, close: function () {}, focus: function () {}, blur: function () {},
          postMessage: function () {}, location: { href: '' }, document: { write: function () {}, close: function () {} }
        };
      };
    } catch (e) {}
    try {
      var origClick = HTMLAnchorElement.prototype.click;
      HTMLAnchorElement.prototype.click = function () {
        if (this.target === '_blank' && !sameSite(this.href)) { adBlocked(); return; }
        return origClick.apply(this, arguments);
      };
    } catch (e2) {}
    document.addEventListener('click', function (e) {
      var n = e.target;
      for (var i = 0; i < 6 && n && n.nodeType === 1; i++) {
        if (n.tagName === 'A') break;
        n = n.parentNode;
      }
      if (n && n.nodeType === 1 && n.tagName === 'A' && n.target === '_blank' && !sameSite(n.href)) {
        e.preventDefault();
        e.stopPropagation();
        adBlocked();
      }
    }, true);
    if (CONFIG.blockBackTraps) {
      try {
        var origPush = history.pushState;
        history.pushState = function (st, title, url) {
          // الفخ: دفع نفس الرابط (أو بدون رابط) مراراً حتى لا يخرج الرجوع من الصفحة
          if (url === undefined || url === null || url === '') return;
          var a = document.createElement('a');
          a.href = url;
          if (a.href === location.href) return;
          return origPush.apply(this, arguments);
        };
      } catch (e4) {}
    }
    attachAdStyle();
    if (!document.documentElement) document.addEventListener('DOMContentLoaded', attachAdStyle);
    setInterval(function () {
      try { attachAdStyle(); sweepOverlays(); } catch (e3) {}
    }, 2000);
  }

  // ---------- Init ----------
  // لا نعتمد على document.body: قد يكون الحقن مبكراً. الواجهة تُنشأ عند أول فتح.
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('resize', onResize);
  window.addEventListener('message', onMessage, false);
  // Back كمتصفح: يرجع للصفحة السابقة إن لم تعالج الصفحة المفتاح بنفسها (يُنفَّذ بعد معالجات الصفحة)
  window.addEventListener('keydown', function (e) {
    if (!CONFIG.backGoesBack || e.keyCode !== 10009 || e.defaultPrevented || synthetic) return;
    if (state.open || ptr.on) return;
    if (window.history && history.length > 1) {
      e.preventDefault();
      history.back();
    }
  }, false);
  onReady(buildHome);
  installAdBlock();
  document.addEventListener('focus', onFocus, true);
  document.addEventListener('blur', onBlur, true);

  // حقل أخذ التركيز (autofocus) قبل تسجيل المستمعات
  function hello() {
    if (CONFIG.showHint && ensurePointerUI()) {
      showToast('الكيبورد العربي v' + VERSION + ' جاهز · أحمر أو OK مطوّلة = مؤشر');
    }
  }

  function checkInitialFocus() {
    hello();
    var a = document.activeElement;
    if (a && isTextField(a)) onFocus({ target: a });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkInitialFocus);
  } else {
    checkInitialFocus();
  }
})();

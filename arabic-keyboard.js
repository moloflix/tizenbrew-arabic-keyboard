/*!
 * Arabic Keyboard for TizenBrew - MIT License
 * Single-file, dependency-free, ES5-only (old Tizen browsers).
 */
(function () {
  'use strict';
  if (window.__tvakLoaded) return;
  window.__tvakLoaded = true;

  var VERSION = '1.2.1';
  var CONFIG = {
    showHint: true,         // رسالة قصيرة عند تحميل الصفحة تُظهر الإصدار (للتأكد أن الموديول يعمل)
    showKeyCodes: true,     // يعرض رمز أي زر غير معروف تضغطه (للتشخيص)
    autoOpen: true,         // افتح الكيبورد تلقائياً عند التركيز على حقل نص
    refocusFallback: false, // فعّلها (true) إذا ظهر كيبورد التلفزيون الأصلي رغم readonly/inputmode
    suppressMs: 1000        // مدة منع الفتح التلقائي بعد الإغلاق (يمنع الحلقات مع SPA)
  };

  // ---------- CSS (مضمّن لأن TizenBrew يحقن ملف JS واحد فقط) ----------
  // ملاحظة: بدون flex gap ولا CSS variables لتوافق المتصفحات القديمة.
  var TVAK_CSS = [
    '#tvak-root{all:initial;position:fixed;left:0;bottom:0;z-index:2147483647;display:none;',
    'direction:ltr;unicode-bidi:normal;box-sizing:border-box;background:rgba(24,24,26,0.97);border-top:1px solid #4a4a4f;',
    'padding:14px 28px 12px;font-family:Arial,"Noto Sans Arabic",sans-serif;',
    '-webkit-transform-origin:0 100%;transform-origin:0 100%;}',
    '#tvak-root.tvak-open{display:block;}',
    '#tvak-root .tvak-preview{display:block;box-sizing:border-box;margin:0 auto 12px;max-width:1100px;height:56px;',
    'line-height:56px;padding:0 20px;background:#0e0e10;color:#f2f2f4;font-size:28px;border-radius:8px;',
    'border-bottom:3px solid #2f7bff;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}',
    '#tvak-root .tvak-row{display:-webkit-flex;display:flex;-webkit-justify-content:center;justify-content:center;margin-bottom:8px;}',
    '#tvak-root .tvak-key{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;',
    '-webkit-justify-content:center;justify-content:center;min-width:68px;height:68px;padding:0 14px;margin:0 4px;',
    'background:#3a3a3e;color:#ececee;font-size:30px;line-height:1;border-radius:8px;box-sizing:border-box;',
    'font-family:Arial,"Noto Sans Arabic",sans-serif;border:2px solid transparent;}',
    '#tvak-root .tvak-wide{min-width:104px;font-size:24px;background:#2b2b2e;}',
    '#tvak-root .tvak-arrow{min-width:84px;font-size:34px;}',
    '#tvak-root .tvak-space{-webkit-flex:1;flex:1;max-width:460px;font-size:22px;background:#3a3a3e;}',
    '#tvak-root .tvak-action{background:#2f7bff;color:#fff;}',
    '#tvak-root .tvak-on{background:#1f5f43;}',
    '#tvak-root .tvak-active{background:#fff;color:#111;border-color:#2f7bff;box-shadow:0 0 0 3px rgba(47,123,255,0.8);}',
    '#tvak-cursor{all:initial;position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;display:none;}',
    '#tvak-cursor.tvak-on{display:block;}',
    '#tvak-toast{all:initial;position:fixed;top:24px;left:50%;z-index:2147483647;pointer-events:none;display:none;',
    'background:rgba(20,20,22,0.92);color:#fff;font-family:Arial,"Noto Sans Arabic",sans-serif;font-size:26px;',
    'padding:12px 24px;border-radius:10px;-webkit-transform:translateX(-50%);transform:translateX(-50%);white-space:nowrap;}',
    '#tvak-toast.tvak-on{display:block;}'
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
      ['z', 'x', 'c', 'v', 'b', 'n', 'm', '.', '-']
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
    root.innerHTML = '';
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
        // الترتيب البصري صريح (لا نعتمد على دعم direction في متصفح التلفزيون):
        // في العربي أول مفتاح منطقياً يكون أقصى اليمين
        if (DIRS[state.mode] === 'rtl') rowEl.insertBefore(k, rowEl.firstChild);
        else rowEl.appendChild(k);
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
    if (!ptr.el) {
      ptr.el = document.createElement('div');
      ptr.el.id = 'tvak-cursor';
      ptr.el.innerHTML = '<svg width="100%" height="100%" viewBox="0 0 24 24">' +
        '<path d="M3 2 L3 19 L7.5 14.8 L10.5 21.5 L13.2 20.3 L10.2 13.8 L16.5 13.8 Z" ' +
        'fill="#fff" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/></svg>';
      ptr.toast = document.createElement('div');
      ptr.toast.id = 'tvak-toast';
    }
    var host = document.body || document.documentElement;
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

  function doHover() {
    var el = elAt();
    if (!el) return;
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
    showToast('وضع المؤشر: الأسهم للتحريك، OK للنقر، Back للخروج');
    if (ptr.fromParent) {
      try { window.parent.postMessage({ tvak: 'ptr-ack' }, '*'); } catch (e) {}
    }
  }

  function exitPointer(notifyParent) {
    ptr.on = false;
    ptr.count = 0;
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

  // ---------- Remote control ----------
  function eat(e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
  }

  function onKeyDown(e) {
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

    var rtl = DIRS[state.mode] === 'rtl';
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

  // ---------- Init ----------
  // لا نعتمد على document.body: قد يكون الحقن مبكراً. الواجهة تُنشأ عند أول فتح.
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);
  window.addEventListener('resize', onResize);
  window.addEventListener('message', onMessage, false);
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

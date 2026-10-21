/*!
 * Arabic Keyboard for TizenBrew - MIT License
 * Single-file, dependency-free, ES5-only (old Tizen browsers).
 */
(function () {
  'use strict';
  if (window.__tvakLoaded) return;
  window.__tvakLoaded = true;

  var CONFIG = {
    autoOpen: true,         // افتح الكيبورد تلقائياً عند التركيز على حقل نص
    refocusFallback: false, // فعّلها (true) إذا ظهر كيبورد التلفزيون الأصلي رغم readonly/inputmode
    suppressMs: 1000        // مدة منع الفتح التلقائي بعد الإغلاق (يمنع الحلقات مع SPA)
  };

  // ---------- CSS (مضمّن لأن TizenBrew يحقن ملف JS واحد فقط) ----------
  // ملاحظة: بدون flex gap ولا CSS variables لتوافق المتصفحات القديمة.
  var TVAK_CSS = [
    '#tvak-root{all:initial;position:fixed;left:0;bottom:0;z-index:2147483647;display:none;',
    'box-sizing:border-box;background:rgba(18,18,24,0.97);border-top:2px solid #3a3a4a;',
    'padding:14px 24px 10px;font-family:Arial,"Noto Sans Arabic",sans-serif;',
    '-webkit-transform-origin:0 100%;transform-origin:0 100%;}',
    '#tvak-root.tvak-open{display:block;}',
    '#tvak-root .tvak-row{display:-webkit-flex;display:flex;-webkit-justify-content:center;justify-content:center;margin-bottom:8px;}',
    '#tvak-root .tvak-key{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;',
    '-webkit-justify-content:center;justify-content:center;min-width:64px;height:64px;padding:0 14px;margin:0 4px;',
    'background:#2b2b38;color:#fff;font-size:30px;line-height:1;border-radius:10px;box-sizing:border-box;',
    'font-family:Arial,"Noto Sans Arabic",sans-serif;}',
    '#tvak-root .tvak-wide{min-width:110px;font-size:24px;}',
    '#tvak-root .tvak-space{-webkit-flex:1;flex:1;max-width:520px;font-size:22px;}',
    '#tvak-root .tvak-action{background:#3b4a7a;}',
    '#tvak-root .tvak-on{background:#2f6b4a;}',
    '#tvak-root .tvak-active{background:#ffcc00;color:#000;-webkit-transform:scale(1.08);transform:scale(1.08);}'
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
    '{tashkeel}': 'تشكيل'
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
    if (m === 'num') bottom = ['{abc}', '{lang}', '{space}', '{bksp}', '{enter}', '{close}'];
    else if (m === 'ar') bottom = ['{num}', '{lang}', '{tashkeel}', '{space}', '{bksp}', '{enter}', '{close}'];
    else bottom = ['{num}', '{lang}', '{space}', '{bksp}', '{enter}', '{close}'];
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
    var s = Math.min(w / 1920, h / 1080); // 1080p => 1، 4K (3840x2160) => 2
    if (s < 0.3) s = 0.3;
    if (s > 2.5) s = 2.5;
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
          if (key === '{enter}' || key === '{close}') k.className += ' tvak-action';
          if (key === '{tashkeel}' && state.tashkeel) k.className += ' tvak-on';
        }
        k.textContent = labelOf(key);
        rowEl.appendChild(k);
        els.push(k);
      }
      root.appendChild(rowEl);
      keyEls.push(els);
    }
    clampCursor();
    paintActive();
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
      // OK على حقل نص: افتح الكيبورد صراحةً (يتجاوز منع الفتح التلقائي)
      if (code === 13 && isTextField(document.activeElement)) {
        eat(e);
        swallowUp[code] = true;
        if (!e.repeat) openKeyboard(document.activeElement, true);
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
      if (!e.repeat || rows[state.row][state.col] === '{bksp}') {
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
  document.addEventListener('focus', onFocus, true);
  document.addEventListener('blur', onBlur, true);

  // حقل أخذ التركيز (autofocus) قبل تسجيل المستمعات
  function checkInitialFocus() {
    var a = document.activeElement;
    if (a && isTextField(a)) onFocus({ target: a });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkInitialFocus);
  } else {
    checkInitialFocus();
  }
})();

/* ================================================================
   INTERFACE: Parameter Helpers
   ================================================================ */

function val(id) { return parseFloat(document.getElementById('p-' + id).value) || 1; }
function sel(id) { return document.getElementById('p-' + id).value; }
function adj(id, delta) {
  const el  = document.getElementById('p-' + id);
  const min = parseFloat(el.min);
  const max = parseFloat(el.max);
  let v = parseFloat((parseFloat(el.value) + delta).toFixed(2));
  if (!isNaN(min)) v = Math.max(min, v);
  if (!isNaN(max)) v = Math.min(max, v);
  el.value = v;
  update();
}
function clampInput(el) {
  const min = parseFloat(el.min);
  const max = parseFloat(el.max);
  let v = parseFloat(el.value);
  if (!isNaN(min) && v < min) { el.value = min; }
  else if (!isNaN(max) && v > max) { el.value = max; }
  update();
}


/* ================================================================
   INTERFACE: Lock / Unlock
   ================================================================ */

function renderLockIcons() {
  document.querySelectorAll('.interface-lock-btn').forEach(btn => {
    btn.innerHTML = locks[btn.dataset.param] ? SVG_LOCK : SVG_UNLOCK;
    btn.classList.toggle('locked', !!locks[btn.dataset.param]);
  });
}

function toggleLock(el) {
  locks[el.dataset.param] = !locks[el.dataset.param];
  renderLockIcons();
}

function lockAll() {
  document.querySelectorAll('.interface-lock-btn').forEach(el => { locks[el.dataset.param] = true; });
  renderLockIcons();
  Object.keys(colorLocks).forEach(k => colorLocks[k] = true);
  document.querySelectorAll('.brand-swatch-lock').forEach(el => {
    colorLocks[el.dataset.colorKey] = true;
    el.classList.add('locked');
    el.innerHTML = SVG_LOCK;
  });
}

function unlockAll() {
  document.querySelectorAll('.interface-lock-btn').forEach(el => { locks[el.dataset.param] = false; });
  renderLockIcons();
  Object.keys(colorLocks).forEach(k => colorLocks[k] = false);
  document.querySelectorAll('.brand-swatch-lock').forEach(el => {
    colorLocks[el.dataset.colorKey] = false;
    el.classList.remove('locked');
    el.innerHTML = SVG_UNLOCK;
  });
}

function toggleColorLock(el) {
  const k = el.dataset.colorKey;
  colorLocks[k] = !colorLocks[k];
  el.classList.toggle('locked', colorLocks[k]);
  el.innerHTML = colorLocks[k] ? SVG_LOCK : SVG_UNLOCK;
  el.title = colorLocks[k] ? 'Unlock' : 'Lock';
}


/* ================================================================
   INTERFACE: Mode Toggle (Light / Dark)
   ================================================================ */

document.getElementById('modeTabs').addEventListener('click', e => {
  const tab = e.target.closest('.interface-pill-tab');
  if (!tab) return;
  document.querySelectorAll('#modeTabs .interface-pill-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  const wasDark = isDark;
  isDark = tab.dataset.mode === 'dark';
  document.getElementById('main').classList.toggle('dark-mode', isDark);
  /* Mirror canvas shade when switching modes (50↔950, 100↔900, 200↔800, 300↔700, 400↔600, 500↔500) */
  if (canvasBg && kb.shade.scale && wasDark !== isDark) {
    const steps = kb.shade.scale;
    const mirrorIdx = steps.length - 1 - kb.shade.index;
    kb.shade.index = Math.max(0, Math.min(steps.length - 1, mirrorIdx));
    canvasBg = steps[kb.shade.index].hex;
  }
  update();
});


/* ================================================================
   INTERFACE: Page Switcher (Overview / Components)
   ================================================================ */

let activePage = 'overview';

document.getElementById('pageTabs').addEventListener('click', e => {
  const tab = e.target.closest('.interface-pill-tab');
  if (!tab) return;
  document.querySelectorAll('#pageTabs .interface-pill-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activePage = tab.dataset.page;
  document.getElementById('page-overview').style.display    = activePage === 'overview'   ? '' : 'none';
  document.getElementById('page-components').style.display  = activePage === 'components' ? '' : 'none';
  document.getElementById('page-article').style.display     = activePage === 'article'    ? '' : 'none';
  update();
});


/* ================================================================
   INTERFACE: Google Fonts Paste on Sans/Serif Dropdowns
   ================================================================
   Paste a Google Fonts URL (e.g. https://fonts.google.com/specimen/Plus+Jakarta+Sans)
   into the Sans or Serif <select>. The font name is extracted, loaded via
   Google Fonts API, added as a new option, and selected. */

function parseGoogleFontsUrl(text) {
  const t = text.trim();
  /* Match: https://fonts.google.com/specimen/Font+Name+Here?... */
  const m = t.match(/fonts\.google\.com\/specimen\/([^?&#/]+)/);
  if (!m) return null;
  return decodeURIComponent(m[1].replace(/\+/g, ' '));
}

function applyPastedFont(selectEl, fontName) {
  loadFont(fontName);
  /* Add option if not already in the dropdown */
  const exists = Array.from(selectEl.options).some(o => o.value === fontName);
  if (!exists) {
    const opt = document.createElement('option');
    opt.value = fontName;
    opt.textContent = fontName;
    selectEl.appendChild(opt);
  }
  selectEl.value = fontName;
  update();
}

/* Mark font selects as paste targets + make them focusable without opening */
['p-fontSans', 'p-fontSerif'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add('font-paste-target');
});

/* Global paste handler: if a font-paste-target is hovered or focused,
   intercept the paste and apply the Google Font URL.
   This works without clicking into the dropdown first. */
let hoveredFontSelect = null;
document.addEventListener('mouseover', e => {
  const sel = e.target.closest('.font-paste-target');
  hoveredFontSelect = sel || null;
});
document.addEventListener('mouseout', e => {
  if (hoveredFontSelect && !e.relatedTarget?.closest('.font-paste-target')) {
    hoveredFontSelect = null;
  }
});

document.addEventListener('paste', e => {
  /* Determine target: focused font select, or hovered font select */
  const focused = document.activeElement?.classList.contains('font-paste-target') ? document.activeElement : null;
  const target = focused || hoveredFontSelect;
  if (!target) return;

  const text = (e.clipboardData || window.clipboardData).getData('text');
  const fontName = parseGoogleFontsUrl(text);
  if (fontName) {
    e.preventDefault();
    applyPastedFont(target, fontName);
  }
});


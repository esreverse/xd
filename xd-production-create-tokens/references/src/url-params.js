/* ================================================================
   URL PARAMETERS — read/write tool state from URL hash
   ================================================================
   Format: #fontScale=1.0&fontLineHeight=1.1&borderRadius=1.2&brand-a=A699E5
   On load: parse hash → apply to inputs/colors → update()
   On change: update() calls syncUrlParams() → hash updates live
   ================================================================ */

/* URL param name → HTML element ID */
const URL_PARAM_MAP = {
  fontScale:           'p-scale',
  fontLineHeight:      'p-lh',
  fontParagraphHeight: 'p-ph',
  space:               'p-space',
  borderRadius:        'p-roundness',
  dimension:           'p-dimension',
  borderWidth:         'p-borderWidth',
  fontPairing:         'p-pairing',
  fontInterface:       'p-fontInterface',
  fontSans:            'p-fontSans',
  fontSerif:           'p-fontSerif',
  fontWeight:          'p-weight',
};

/* Reverse map: HTML ID → URL param name */
const ID_TO_PARAM = Object.fromEntries(Object.entries(URL_PARAM_MAP).map(([k, v]) => [v, k]));

/* Parse hash string into key-value object */
function parseHash() {
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  const params = {};
  for (const pair of hash.split('&')) {
    const [k, v] = pair.split('=');
    if (k && v !== undefined) params[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return params;
}

/* Apply URL params to the tool on load */
function applyUrlParams() {
  const params = parseHash();
  if (Object.keys(params).length === 0) return;

  /* ── Slider/Select params ── */
  for (const [urlKey, elId] of Object.entries(URL_PARAM_MAP)) {
    if (params[urlKey] === undefined) continue;
    const el = document.getElementById(elId);
    if (!el) continue;

    /* For font dropdowns: load the font first if needed */
    if (urlKey === 'fontSans' || urlKey === 'fontSerif') {
      loadFont(params[urlKey]);
      /* Add option if not in dropdown */
      const exists = Array.from(el.options).some(o => o.value === params[urlKey]);
      if (!exists) {
        const opt = document.createElement('option');
        opt.value = params[urlKey];
        opt.textContent = params[urlKey];
        el.appendChild(opt);
      }
    }
    el.value = params[urlKey];
  }

  /* ── Brand colors: brand-a through brand-f ── */
  const brandLetters = 'abcdef'.split('');
  const hasBrandParams = brandLetters.some(l => params[`brand-${l}`]);
  if (hasBrandParams) COLORS.brand = []; /* clear defaults when URL specifies brand colors */
  for (const letter of brandLetters) {
    const key = `brand-${letter}`;
    if (!params[key]) continue;
    const hex = '#' + params[key];
    const color = { name: typeof autoColorName === 'function' ? autoColorName(hex) : key, hex, key, hslH: null, hslS: null, hslL: null };
    COLORS.brand.push(color);
    storeHsl(color);
  }

  /* ── Accent colors: accent-a through accent-f ── */
  const hasAccentParams = brandLetters.some(l => params[`accent-${l}`]);
  if (hasAccentParams) COLORS.accent = []; /* clear defaults when URL specifies accent colors */
  for (const letter of brandLetters) {
    const key = `accent-${letter}`;
    if (!params[key]) continue;
    const hex = '#' + params[key];
    const color = { name: key, hex, key, hslH: null, hslS: null, hslL: null };
    COLORS.accent.push(color);
    storeHsl(color);
  }

  /* ── Feedback colors: info, success, warning, error ── */
  const feedbackKeys = ['info', 'success', 'warning', 'error'];
  for (const key of feedbackKeys) {
    if (!params[key]) continue;
    const hex = '#' + params[key];
    const existing = COLORS.feedback.find(c => c.key === key);
    if (existing) {
      existing.hex = hex;
      storeHsl(existing);
    }
  }

  /* ── Foundation colors ── */
  if (params['lightClear'])  { FOUNDATION.lightClear.hex  = '#' + params['lightClear'];  storeHsl(FOUNDATION.lightClear); }
  if (params['lightCloudy']) { FOUNDATION.lightCloudy.hex = '#' + params['lightCloudy']; storeHsl(FOUNDATION.lightCloudy); }
  if (params['darkClear'])   { FOUNDATION.darkClear.hex   = '#' + params['darkClear'];   storeHsl(FOUNDATION.darkClear); }
  if (params['darkCloudy'])  { FOUNDATION.darkCloudy.hex  = '#' + params['darkCloudy'];  storeHsl(FOUNDATION.darkCloudy); }

  /* ── Dark mode ── */
  if (params['mode'] === 'dark' && !isDark) {
    isDark = true;
    document.getElementById('main').classList.add('dark-mode');
    /* Sync toggle UI */
    document.querySelectorAll('#modeTabs .interface-pill-tab').forEach(t => t.classList.remove('active'));
    const darkTab = document.querySelector('#modeTabs .interface-pill-tab[data-mode="dark"]');
    if (darkTab) darkTab.classList.add('active');
  }

  /* ── Combo colors: combo1, combo2, … ──
     Format: bgSource.fgSource.bgShade.fgShade.inverted
     _ = null/default */
  for (let i = 0; i < 9; i++) {
    const key = `combo${i + 1}`;
    if (!params[key]) continue;
    const p = params[key].split('.');
    if (p.length < 2) continue;
    const v = (j) => p[j] === '_' ? null : p[j];
    const combo = { id: `combo-${COLOR_LETTERS[i] || i + 1}`, bgSource: p[0], fgSource: p[1], bgShade: v(2) !== null ? parseInt(p[2]) : null, fgShade: v(3) !== null ? parseInt(p[3]) : null, inverted: p[4] === '1' };
    if (i < COMBO_STATE.length) Object.assign(COMBO_STATE[i], combo);
    else COMBO_STATE.push(combo);
  }

  /* ── Button variants: btnP, btnSS, btnSU, btnTS, btnTU ──
     Format: colorSource.variant.bw.radius.ist.px.py.fgSrc.fgShade.bgSrc.bgShade.foundationBg
     _ = null/default, ist = 3 digits (inverted, swapped, tinted as 0/1) */
  const BTN_PARAM_IDS = { btnP: 'primary', btnSS: 'secondary-selected', btnSU: 'secondary-unselected', btnTS: 'tertiary-selected', btnTU: 'tertiary-unselected' };
  for (const [paramKey, stateId] of Object.entries(BTN_PARAM_IDS)) {
    if (!params[paramKey]) continue;
    const s = ACTION_STATE.find(a => a.id === stateId);
    if (!s) continue;
    const p = params[paramKey].split('.');
    if (p.length < 7) continue;
    const v = (i) => p[i] === '_' ? null : p[i];
    s.colorSource = v(0) || s.colorSource;
    if (p[1]) s.variant = p[1];
    s.bw = parseInt(p[2]) || 0;
    s.radius = v(3) !== null ? parseInt(p[3]) : null;
    const ist = p[4] || '000';
    s.inverted = ist[0] === '1';
    s.swapped  = ist[1] === '1';
    s.tinted   = ist[2] === '1';
    s.paddingX = parseInt(p[5]) ?? s.paddingX;
    s.paddingY = parseInt(p[6]) ?? s.paddingY;
    if (p.length > 7)  s.fgSource      = v(7);
    if (p.length > 8)  s.fgShade       = v(8) !== null ? parseInt(p[8]) : null;
    if (p.length > 9)  s.bgSource      = v(9);
    if (p.length > 10) s.bgShade       = v(10) !== null ? parseInt(p[10]) : null;
    if (p.length > 11) s._foundationBg = v(11);
  }
}

/* Build hash string from current tool state */
function syncUrlParams() {
  const parts = [];

  /* ── Slider/Select params ── */
  for (const [urlKey, elId] of Object.entries(URL_PARAM_MAP)) {
    const el = document.getElementById(elId);
    if (!el) continue;
    parts.push(`${urlKey}=${encodeURIComponent(el.value)}`);
  }

  /* ── Brand colors ── */
  for (const c of COLORS.brand) {
    parts.push(`${c.key}=${c.hex.replace('#', '')}`);
  }

  /* ── Accent colors ── */
  for (const c of COLORS.accent) {
    parts.push(`${c.key}=${c.hex.replace('#', '')}`);
  }

  /* ── Feedback colors ── */
  for (const c of COLORS.feedback) {
    parts.push(`${c.key}=${c.hex.replace('#', '')}`);
  }

  /* ── Foundation colors ── */
  parts.push(`lightClear=${FOUNDATION.lightClear.hex.replace('#', '')}`);
  parts.push(`lightCloudy=${FOUNDATION.lightCloudy.hex.replace('#', '')}`);
  parts.push(`darkClear=${FOUNDATION.darkClear.hex.replace('#', '')}`);
  parts.push(`darkCloudy=${FOUNDATION.darkCloudy.hex.replace('#', '')}`);

  /* ── Mode ── */
  if (isDark) parts.push('mode=dark');

  /* ── Combo colors ──
     Format: bgSource.fgSource.bgShade.fgShade.inverted */
  COMBO_STATE.forEach((c, i) => {
    const n = (v) => v == null ? '_' : v;
    const val = [c.bgSource, c.fgSource, n(c.bgShade), n(c.fgShade), c.inverted ? 1 : 0].join('.');
    parts.push(`combo${i + 1}=${encodeURIComponent(val)}`);
  });

  /* ── Button variants ──
     Format: colorSource.variant.bw.radius.ist.px.py[.fgSrc.fgShade.bgSrc.bgShade.foundationBg] */
  const BTN_SYNC_IDS = { primary: 'btnP', 'secondary-selected': 'btnSS', 'secondary-unselected': 'btnSU', 'tertiary-selected': 'btnTS', 'tertiary-unselected': 'btnTU' };
  for (const s of ACTION_STATE) {
    const key = BTN_SYNC_IDS[s.id];
    if (!key) continue;
    const n = (v) => v == null ? '_' : v;
    const ist = `${s.inverted ? 1 : 0}${s.swapped ? 1 : 0}${s.tinted ? 1 : 0}`;
    let val = [n(s.colorSource), s.variant, s.bw, n(s.radius), ist, s.paddingX, s.paddingY].join('.');
    /* Append freeform + foundation fields only when non-default */
    if (s.fgSource || s.bgSource || s._foundationBg) {
      val += '.' + [n(s.fgSource), n(s.fgShade), n(s.bgSource), n(s.bgShade), n(s._foundationBg)].join('.');
    }
    parts.push(`${key}=${encodeURIComponent(val)}`);
  }

  /* Update URL without triggering navigation */
  const newHash = '#' + parts.join('&');
  if (window.location.hash !== newHash) {
    history.replaceState(null, '', newHash);
  }
}

/* Init is handled by update.js DOMContentLoaded — applyUrlParams() is called there before first update() */

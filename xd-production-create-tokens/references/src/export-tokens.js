/* Maintained via /xd-brand-visual-identity · Updated: 2026-03-24 · Version: 1 */
/* ================================================================
   EXPORT TOKENS — generates 4 DTCG JSON files
   ================================================================ */

function exportTokens() {
  try { return _exportTokensImpl(); } catch (e) { console.error('Export error:', e); alert('Export failed: ' + e.message + '\n\nSee browser console (F12) for stack trace.'); }
}
function _exportTokensImpl() {
  /* ── Parameters ── */
  const sf  = val('space');
  const df  = val('dimension');
  const rf  = val('roundness');
  const sh  = val('scale');
  const bw  = Math.round(val('borderWidth'));
  const lh  = val('lh');
  const ph  = val('ph');

  /* ── Calculations ── */
  const spacing = calcSpacing(sf);
  const sizing  = calcSizing(df);
  const radius  = calcRadius(rf);
  const borders = calcBorderWidth(bw);
  const typo    = calcTypography(sh);

  /* ── Font state ── */
  const sansStack  = `'${sel('fontSans')}', -apple-system, BlinkMacSystemFont, sans-serif`;
  const serifStack = `'${sel('fontSerif')}', Georgia, 'Times New Roman', serif`;
  const monoStack  = "'SF Mono', 'JetBrains Mono', 'Fira Code', monospace";
  const interfaceType = sel('fontInterface');
  const interfaceStack = interfaceType === 'serif' ? serifStack : sansStack;
  const pairing = sel('pairing');
  const weightMode = sel('weight');
  const w = WEIGHTS[weightMode];

  /* ── DTCG helpers ── */
  const dim = (v, unit = 'px') => ({ $value: `${v}${unit}`, $type: 'dimension' });
  const col = (hex) => ({ $value: hex, $type: 'color' });
  const num = (v) => ({ $value: v, $type: 'number' });

  /* ── Alpha blend helper ── */
  const blendHex = (fgHex, bgHex, alpha) => {
    const fg = hexToRgb(fgHex), bg = hexToRgb(bgHex);
    return rgbToHex(
      fg.r * alpha + bg.r * (1 - alpha),
      fg.g * alpha + bg.g * (1 - alpha),
      fg.b * alpha + bg.b * (1 - alpha)
    );
  };
  const findAlpha = (fgHex, bgHex, startAlpha, target, worstBg) => {
    for (let a = startAlpha; a <= 1.0; a += 0.01) {
      const hex = blendHex(fgHex, bgHex, a);
      if (contrastRatio(hex, worstBg) >= target) return { hex, alpha: Math.round(a * 100) };
    }
    return { hex: fgHex, alpha: 100 };
  };

  /* ── Scale cache (avoids redundant generateOklchScale calls for same hex) ── */
  const scaleCache = new Map();
  const getScale = (hex) => { if (!scaleCache.has(hex)) scaleCache.set(hex, generateOklchScale(hex)); return scaleCache.get(hex); };

  /* ── Shared constants ── */
  const allBrandAccent = [...COLORS.brand, ...COLORS.accent];
  const lightCloudyHex = FOUNDATION.lightCloudy.hex;
  const darkCloudyHex = FOUNDATION.darkCloudy.hex;
  const AA = 4.5;
  const AAA = 7.0;

  /* ── Weight helpers ── */
  const WEIGHT_SCALE = [
    { name: 'light', val: 300 },
    { name: 'regular', val: 400 },
    { name: 'medium', val: 500 },
    { name: 'semibold', val: 600 },
    { name: 'bold', val: 700 },
    { name: 'extrabold', val: 800 },
  ];
  const weightName = (v) => (WEIGHT_SCALE.find(s => s.val === v) || [...WEIGHT_SCALE].reverse().find(s => s.val <= v) || { name: 'regular' }).name;
  const strongWeight = (base) => Math.min(base + 200, 900);

  /* ── Font family alias refs ── */
  const headingFamily = pairing.startsWith('serif') ? '{core.font.family-serif}' : '{core.font.family-sans}';
  const bodyFamily = pairing.endsWith('serif') ? '{core.font.family-serif}' : '{core.font.family-sans}';

  /* ================================================================
     CORE TOKENS
     ================================================================ */

  const core = {
    color: {
      light: { clear: col(FOUNDATION.lightClear.hex), cloudy: col(FOUNDATION.lightCloudy.hex) },
      dark:  { clear: col(FOUNDATION.darkClear.hex),  cloudy: col(FOUNDATION.darkCloudy.hex) },
      transparent: col('rgba(0,0,0,0)'),
      placeholder: col('rgba(128,128,128,0.5)'),
    },
    space: {},
    size: {},
    radius: { 0: dim(0), 9999: dim(9999) },
    border: { width: {} },
    font: {},
    shadow: {},
    opacity: {},
    breakpoint: {},
  };

  /* ── Core color: alpha tokens ── */
  const _lc = FOUNDATION.lightClear.hex;
  const _lk = FOUNDATION.lightCloudy.hex;
  const _dc = FOUNDATION.darkClear.hex;
  const _dk = FOUNDATION.darkCloudy.hex;
  /* rgba from base clear hex + alpha (0–1) */
  const rgbaBase = (baseHex, a) => {
    const rgb = hexToRgb(baseHex);
    return `rgba(${Math.round(rgb.r*255)},${Math.round(rgb.g*255)},${Math.round(rgb.b*255)},${a.toFixed(2)})`;
  };
  /* Compute alphas — name = resolved alpha (no suffix) */
  const dA_secondary    = findAlpha(_dc, _lc, 0.40, AA, _lk);
  const dA_secondaryAAA = findAlpha(_dc, _lc, 0.40, AAA, _lk);
  const dA_tertiary  = 40;
  const dA_shine     = 10;
  const dA_subtle    = findAlpha(_dc, _lc, 0.05, 1.1, _lc);
  const dA_dash      = 15;                                        /* fixed 15% for dashes/lines */
  const lA_secondary    = findAlpha(_lc, _dc, 0.40, AA, _dk);
  const lA_secondaryAAA = findAlpha(_lc, _dc, 0.40, AAA, _dk);
  const lA_tertiary  = 40;
  const lA_shine     = 10;
  const lA_subtle    = findAlpha(_lc, _dc, 0.05, 1.1, _dc);
  const lA_dash      = 15;                                        /* fixed 15% for dashes/lines */
  /* Store resolved alpha names for semantic references */
  const _dN = { secondary: dA_secondary.alpha, secondaryAAA: dA_secondaryAAA.alpha, tertiary: dA_tertiary, shine: dA_shine, subtle: dA_subtle.alpha, dash: dA_dash };
  const _lN = { secondary: lA_secondary.alpha, secondaryAAA: lA_secondaryAAA.alpha, tertiary: lA_tertiary, shine: lA_shine, subtle: lA_subtle.alpha, dash: lA_dash };
  /* Dark alpha tokens (dark fg on light bg) — token name = a[resolved alpha] */
  core.color.dark[`clear-a${_dN.secondary}`]    = col(rgbaBase(_dc, _dN.secondary / 100));
  core.color.dark[`clear-a${_dN.secondaryAAA}`] = col(rgbaBase(_dc, _dN.secondaryAAA / 100));
  core.color.dark[`clear-a${_dN.tertiary}`]     = col(rgbaBase(_dc, _dN.tertiary / 100));
  core.color.dark[`clear-a${_dN.shine}`]        = col(rgbaBase(_dc, _dN.shine / 100));
  core.color.dark[`clear-a${_dN.subtle}`]       = col(rgbaBase(_dc, _dN.subtle / 100));
  core.color.dark[`clear-a${_dN.dash}`]         = col(rgbaBase(_dc, _dN.dash / 100));
  /* Light alpha tokens (light fg on dark bg) */
  core.color.light[`clear-a${_lN.secondary}`]    = col(rgbaBase(_lc, _lN.secondary / 100));
  core.color.light[`clear-a${_lN.secondaryAAA}`] = col(rgbaBase(_lc, _lN.secondaryAAA / 100));
  core.color.light[`clear-a${_lN.tertiary}`]     = col(rgbaBase(_lc, _lN.tertiary / 100));
  core.color.light[`clear-a${_lN.shine}`]        = col(rgbaBase(_lc, _lN.shine / 100));
  core.color.light[`clear-a${_lN.subtle}`]       = col(rgbaBase(_lc, _lN.subtle / 100));
  core.color.light[`clear-a${_lN.dash}`]         = col(rgbaBase(_lc, _lN.dash / 100));

  /* ── Core spacing (integer = value / 4 base grid) ── */
  spacing.forEach(s => { core.space[Math.round(s.val / 4)] = dim(s.val); });

  /* ── Core sizing (integer = value / 4 base grid, deduplicated) ── */
  sizing.forEach(s => { core.size[Math.round(s.val / 4)] = dim(s.val); });

  /* ── Core radius (sequential integer keys: 0=none, 1–5=S–2XL, 9999=pill) ── */
  ['S', 'M', 'L', 'XL', '2XL'].forEach((k, i) => { if (radius[k] != null) core.radius[i + 1] = dim(radius[k]); });

  /* ── Core border width ── */
  for (let i = 0; i <= 6; i++) { core.border.width[i] = dim(i * 0.5); }

  /* ── Core font (flat dash-separated keys per conventions) ── */
  core.font['family-sans']      = { $value: sansStack, $type: 'fontFamily' };
  core.font['family-serif']     = { $value: serifStack, $type: 'fontFamily' };
  core.font['family-mono']      = { $value: monoStack, $type: 'fontFamily' };
  core.font['family-interface'] = { $value: interfaceStack, $type: 'fontFamily' };
  WEIGHT_SCALE.forEach(ws => { core.font[`weight-${ws.name}`] = { $value: ws.val, $type: 'fontWeight' }; });
  typo.forEach((t, i) => { core.font['size-' + i] = dim(t.size); });
  core.font['lineHeight-heading']   = { $value: parseFloat((1.0 * lh).toFixed(2)), $type: 'number' };
  core.font['lineHeight-interface'] = { $value: parseFloat((1.1 * lh).toFixed(2)), $type: 'number' };
  core.font['lineHeight-paragraph'] = { $value: parseFloat((1.4 * lh).toFixed(2)), $type: 'number' };
  core.font['tracking-normal'] = dim(0, 'em');
  core.font['tracking-caps']   = dim(0.08, 'em');
  core.font['paragraphHeight-interface'] = dim(Math.round(16 * ph * 0.75));
  core.font['paragraphHeight-paragraph'] = dim(Math.round(16 * ph));

  /* ── Core color palettes ── */
  allBrandAccent.forEach(c => {
    const scale = getScale(c.hex);
    core.color[c.key] = {};
    scale.forEach(s => { core.color[c.key][s.step] = col(s.hex); });
  });
  COLORS.feedback.forEach(c => {
    const scale = getScale(c.hex);
    const paletteName = coreKey(c.key);
    core.color[paletteName] = {};
    scale.forEach(s => { core.color[paletteName][s.step] = col(s.hex); });
  });

  /* ── Core breakpoints ── */
  Object.entries({ S: 395, M: 768, L: 1024, XL: 1280, '2XL': 1536 }).forEach(([k, v]) => { core.breakpoint[k] = dim(v); });

  /* ── Core shadow colors (alpha derived from dark.clear) ── */
  const _dcRgb = hexToRgb(_dc);
  [6, 8, 10, 12, 14, 18].forEach(a => {
    const rgba = `rgba(${Math.round(_dcRgb.r*255)},${Math.round(_dcRgb.g*255)},${Math.round(_dcRgb.b*255)},${(a/100).toFixed(2)})`;
    core.shadow[`color-${a}`] = col(rgba);
  });
  /* Focus: dedicated palette — defaults to info hex but is its own core.color.focus scale */
  const _focusHex = (COLORS.feedback.find(c => c.key === 'info') || { hex: '#3B82F6' }).hex;
  const _focusScale = getScale(_focusHex);
  core.color.focus = {};
  _focusScale.forEach(s => { core.color.focus[s.step] = col(s.hex); });
  const _focusRgb500 = hexToRgb(_focusScale[5]?.hex || _focusHex);
  core.shadow['color-focus'] = col(`rgba(${Math.round(_focusRgb500.r*255)},${Math.round(_focusRgb500.g*255)},${Math.round(_focusRgb500.b*255)},0.50)`);

  /* ── Core opacity ── */
  core.opacity[0]   = num(0);
  core.opacity[40]  = num(0.4);
  core.opacity[100] = num(1);

  /* ================================================================
     SEMANTIC TOKENS (light mode)
     ================================================================ */

  /* ── Color helpers (reused by semantic + dark) ── */
  const closestIdx = (hex, scale) => {
    const ok = hexToOklch(hex);
    let bestIdx = 0, bestD = Infinity;
    scale.forEach((s, i) => { const d = Math.abs(s.L - ok.L); if (d < bestD) { bestD = d; bestIdx = i; } });
    return bestIdx;
  };
  const closestStep = (hex, scale) => {
    return scale[closestIdx(hex, scale)]?.step || '500';
  };
  const contrastRef = (bgHex) => {
    const isLight = hexToOklch(fgPrimary(bgHex)).L > 0.6;
    return isLight ? '{core.color.light.clear}' : '{core.color.dark.clear}';
  };

  const semantic = {
    color: {
      foundation: {
        themed: {
          'base-clear':         col('{core.color.light.clear}'),
          'base-cloudy':        col('{core.color.light.cloudy}'),
          'base-higher':        col('{core.color.light.clear}'),
          'base-lower':         col('{core.color.light.cloudy}'),
          'contrast-primary':   col('{core.color.dark.clear}'),
          'contrast-secondary': col(`{core.color.dark.clear-a${_dN.secondary}}`),
          'contrast-tertiary':  col(`{core.color.dark.clear-a${_dN.tertiary}}`),
          focus:                col('{core.color.focus.500}'),
          'base-shine':         col(`{core.color.light.clear-a${_lN.shine}}`),
          'base-shade':         col(`{core.color.dark.clear-a${_dN.shine}}`),
          dash:                 col(`{core.color.dark.clear-a${_dN.dash}}`),
        },
        inverted: {
          'base-clear':         col('{core.color.dark.clear}'),
          'base-cloudy':        col('{core.color.dark.cloudy}'),
          'base-higher':        col('{core.color.dark.cloudy}'),
          'base-lower':         col('{core.color.dark.clear}'),
          'contrast-primary':   col('{core.color.light.clear}'),
          'contrast-secondary': col(`{core.color.light.clear-a${_lN.secondary}}`),
          'contrast-tertiary':  col(`{core.color.light.clear-a${_lN.tertiary}}`),
          focus:                col('{core.color.focus.400}'),
          'base-shine':         col(`{core.color.light.clear-a${_lN.shine}}`),
          'base-shade':         col(`{core.color.dark.clear-a${_dN.shine}}`),
          dash:                 col(`{core.color.light.clear-a${_lN.dash}}`),
        },
      },
    },
    space: { padding: {}, gap: {}, 'margin-x': {}, 'margin-y': {}, article: {} },
    size: { icon: {}, action: {} },
    radius: {},
    border: { width: {} },
    typography: { interface: {}, paragraph: {}, heading: {}, caps: {}, code: {} },
    elevation: {},
    opacity: { enabled: { $value: '{core.opacity.100}', $type: 'number' }, disabled: { $value: '{core.opacity.40}', $type: 'number' } },
    grid: { margin: {}, gutter: {} },
  };

  /* ── Semantic spacing (t-shirt → core grid unit = value/4) ── */
  const spKey = (name) => { const s = spacing.find(x => x.name === name); return s ? Math.round(s.val / 4) : 0; };
  const spRef = (name) => ({ $value: `{core.space.${spKey(name)}}`, $type: 'dimension' });
  const padMap = { none: '0', '2XS': '2XS', XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL', '2XL': '2XL' };
  Object.entries(padMap).forEach(([tshirt, coreName]) => {
    if (!spacing.find(x => x.name === coreName)) return;
    semantic.space.padding[tshirt] = spRef(coreName);
    semantic.space['margin-x'][tshirt] = spRef(coreName);
    semantic.space['margin-y'][tshirt] = spRef(coreName);
  });
  semantic.space.gap.none = spRef('0');
  ['XS','S','M','L','XL'].forEach(k => { if (spacing.find(x => x.name === k)) semantic.space.gap[k] = spRef(k); });
  ['XS','S','M','L','XL'].forEach(k => { if (spacing.find(x => x.name === k)) semantic.space.article[k] = spRef(k); });

  /* ── Semantic sizing (t-shirt → core grid unit = value/4) ── */
  sizing.forEach(s => {
    const [group, size] = s.name.split('.');
    if (semantic.size[group]) semantic.size[group][size] = { $value: `{core.size.${Math.round(s.val / 4)}}`, $type: 'dimension' };
  });

  /* ── Semantic radius (t-shirt → core sequential integer) ── */
  semantic.radius.none = { $value: '{core.radius.0}', $type: 'dimension' };
  ['S', 'M', 'L', 'XL', '2XL'].forEach((k, i) => { if (radius[k] != null) semantic.radius[k] = { $value: `{core.radius.${i + 1}}`, $type: 'dimension' }; });
  semantic.radius.pill = { $value: '{core.radius.9999}', $type: 'dimension' };

  /* ── Semantic border width ── */
  borders.forEach((b, i) => { semantic.border.width[b.name] = { $value: `{core.border.width.${i}}`, $type: 'dimension' }; });

  /* ── Semantic typography (composites) ── */
  /* Direct index mapping: semantic style → size-N index
     caps:      S=0(10), M=1(12), L=2(14)
     interface: XS=1(12), S=2(14), M=3(16), L=4(18), XL=5(20)
     paragraph: XS=1(12), S=2(14), M=3(16), L=4(18), XL=5(20)
     heading:   S=5(20), M=6(24), L=7(28), XL=8(32), 2XL=9(36) */
  const typoSizeIdx = {
    'caps.S': 0, 'caps.M': 1, 'caps.L': 2,
    'interface.XS': 1, 'interface.S': 2, 'interface.M': 3, 'interface.L': 4, 'interface.XL': 5,
    'paragraph.XS': 1, 'paragraph.S': 2, 'paragraph.M': 3, 'paragraph.L': 4, 'paragraph.XL': 5,
    'heading.S': 5, 'heading.M': 6, 'heading.L': 7, 'heading.XL': 8, 'heading.2XL': 9,
  };
  const typoComposite = (category, size, isStrong) => {
    const key = `${category}.${size}`;
    const sizeIdx = typoSizeIdx[key];
    if (sizeIdx == null) return null;
    let familyRef, lhRef, phRef, wVal;
    if (category === 'heading') {
      familyRef = headingFamily;
      lhRef = '{core.font.lineHeight-heading}';
      phRef = null;
      wVal = w.heading;
    } else if (category === 'paragraph') {
      familyRef = bodyFamily;
      lhRef = '{core.font.lineHeight-paragraph}';
      phRef = '{core.font.paragraphHeight-paragraph}';
      wVal = isStrong ? strongWeight(w.base) : w.base;
    } else if (category === 'caps') {
      familyRef = '{core.font.family-interface}';
      lhRef = '{core.font.lineHeight-interface}';
      phRef = null;
      wVal = w.heading; /* caps always semibold/bold */
    } else {
      familyRef = '{core.font.family-interface}';
      lhRef = '{core.font.lineHeight-interface}';
      phRef = '{core.font.paragraphHeight-interface}';
      wVal = isStrong ? strongWeight(w.base) : w.base;
    }
    const val = {
      fontFamily: familyRef,
      fontWeight: `{core.font.weight-${weightName(wVal)}}`,
      fontSize: `{core.font.size-${sizeIdx}}`,
      lineHeight: lhRef,
      letterSpacing: '{core.font.tracking-normal}',
    };
    if (phRef) val.paragraphSpacing = phRef;
    return { $value: val, $type: 'typography' };
  };
  ['XS','S','M','L','XL'].forEach(size => {
    semantic.typography.interface[size] = typoComposite('interface', size, false);
    semantic.typography.interface[`${size}-strong`] = typoComposite('interface', size, true);
  });
  ['XS','S','M','L','XL'].forEach(size => {
    semantic.typography.paragraph[size] = typoComposite('paragraph', size, false);
    semantic.typography.paragraph[`${size}-strong`] = typoComposite('paragraph', size, true);
  });
  ['S','M','L','XL','2XL'].forEach(size => {
    semantic.typography.heading[size] = typoComposite('heading', size, false);
  });
  ['S','M','L'].forEach(size => {
    const idx = typoSizeIdx[`caps.${size}`];
    if (idx == null) return;
    semantic.typography.caps[size] = {
      $type: 'typography',
      $value: {
        fontFamily: '{core.font.family-interface}',
        fontWeight: `{core.font.weight-${weightName(strongWeight(w.base))}}`,
        fontSize: `{core.font.size-${idx}}`,
        lineHeight: '{core.font.lineHeight-interface}',
        letterSpacing: '{core.font.tracking-caps}',
        textTransform: 'uppercase',
      },
    };
  });
  semantic.typography.code.M = {
    $type: 'typography',
    $value: {
      fontFamily: '{core.font.family-mono}',
      fontWeight: '{core.font.weight-regular}',
      fontSize: '{core.font.size-3}', /* 16px — code.M = interface.M */
      lineHeight: '{core.font.lineHeight-paragraph}',
      letterSpacing: '{core.font.tracking-normal}',
    },
  };

  /* ── Semantic elevation (DTCG shadow composites) ── */
  const _sh = (color, oY, blur, spread) => ({ color, offsetX: '0px', offsetY: `${oY}px`, blur: `${blur}px`, spread: `${spread || 0}px` });
  semantic.elevation[0] = { $value: [], $type: 'shadow' };
  semantic.elevation[1] = { $value: [_sh('{core.shadow.color-12}', 1, 3), _sh('{core.shadow.color-8}', 1, 2)], $type: 'shadow' };
  semantic.elevation[2] = { $value: [_sh('{core.shadow.color-12}', 4, 16), _sh('{core.shadow.color-6}', 1, 4)], $type: 'shadow' };
  semantic.elevation[3] = { $value: [_sh('{core.shadow.color-14}', 8, 32), _sh('{core.shadow.color-8}', 2, 8)], $type: 'shadow' };
  semantic.elevation[4] = { $value: [_sh('{core.shadow.color-18}', 16, 48), _sh('{core.shadow.color-10}', 4, 16)], $type: 'shadow' };
  semantic.elevation.focus = { $value: [_sh('{core.shadow.color-focus}', 0, 0, 3)], $type: 'shadow' };

  /* ── Semantic action colors ── */
  const errorColor = COLORS.feedback.find(c => c.key === 'error');
  const redScale  = errorColor ? getScale(errorColor.hex) : [];
  /* Resolve a colorSource key to the canonical palette key */
  function canonicalKey(src) {
    if (!src || src === '_brand1') return COLORS.brand[0]?.key || 'brand-a';
    return src;
  }

  /* Core key for a palette source (feedback keys map to palette names) */
  function coreKey(src) {
    const m = { info: 'blue', success: 'green', warning: 'amber', error: 'red' };
    return m[src] || src;
  }

  /* Resolve a source + shade to a semantic or core token reference.
     Returns { ref: token string, hex: resolved hex, coreKey, idx } */
  function resolveTokenRef(source, shade) {
    if (!source) return null;
    const key = canonicalKey(source);
    const ck = coreKey(key);
    const palette = allBrandAccent;
    const colorDef = palette.find(c => c.key === key);
    /* Combo sources reference semantic combo tokens */
    if (key.startsWith('combo-')) {
      const combo = COMBO_STATE.find(c => c.id === key);
      if (!combo) return null;
      /* Combo base = semantic.color.combo-a.themed.base (no shade stepping) */
      return { ref: `{semantic.color.${key}.themed.base}`, hex: null, coreKey: ck, idx: null };
    }
    if (!colorDef) return null;
    const scale = getScale(colorDef.hex);
    const idx = shade != null ? shade : closestIdx(colorDef.hex, scale);
    const step = scale[idx]?.step || '500';
    const hex = scale[idx]?.hex || colorDef.hex;
    return { ref: `{core.color.${ck}.${step}}`, hex, coreKey: ck, idx, scale };
  }

  /* Canonical variant: always derived from group, ignoring mutable state.variant.
     Primary = solid, Secondary = outline, Tertiary = ghost. */
  function canonicalVariant(state) {
    if (state.group === 'Primary') return 'solid';
    if (state.group === 'Secondary') return 'outline';
    return 'ghost';
  }

  /* Build one mode of an action set.
     Mirrors resolveButtonTokens() logic from render-components.js.
     For inverted mode: same logic but with inverted flag toggled.
     For freeform: themed = inverted (identical). */
  function buildActionMode(stateId, forceInverted) {
    const state = ACTION_STATE.find(s => s.id === stateId);
    const variant = state.variant;
    const key = canonicalKey(state.colorSource);
    const ck = coreKey(key);
    const isFreeform = state.fgSource || state.bgSource;
    /* For inverted mode: toggle the inverted flag (unless freeform → same as themed) */
    const inv = isFreeform ? state.inverted : (forceInverted ? !state.inverted : state.inverted);
    const swp = state.swapped;
    const tnt = state.tinted;
    const mode = inv ? 'inverted' : 'themed';

    let baseRef, contrastRef2, baseCk, baseIdx, baseScale;

    if (isFreeform) {
      /* ── Freeform mode: themed = inverted (identical) ── */
      const fgRes = resolveTokenRef(state.fgSource, state.fgShade);
      const bgRes = resolveTokenRef(state.bgSource, state.bgShade);
      baseRef = (variant !== 'solid' || !bgRes) ? col('{core.color.transparent}') : col(bgRes.ref);
      contrastRef2 = fgRes ? col(fgRes.ref) : col('{semantic.color.foundation.themed.contrast-primary}');
      baseCk = bgRes?.coreKey || ck; baseIdx = bgRes?.idx; baseScale = bgRes?.scale;
    } else if (variant === 'solid') {
      /* ── Solid: apply I/S/T modifiers ── */
      const baseToken = `{semantic.color.${key}.${mode}.base}`;
      const cpToken = tnt
        ? `{semantic.color.${key}.${mode}.contrast-secondary}`
        : `{semantic.color.${key}.${mode}.contrast-primary}`;
      baseRef = col(swp ? cpToken : baseToken);
      contrastRef2 = col(swp ? baseToken : cpToken);
      /* Resolve hex for higher/lower */
      const palette = allBrandAccent;
      const colorDef = palette.find(c => c.key === key);
      if (colorDef) {
        const scale = getScale(colorDef.hex);
        let idx = closestIdx(colorDef.hex, scale);
        if (inv) { idx = scale.length - 1 - idx; if (idx < 0) idx = 0; }
        if (swp && !tnt) {
          baseCk = ck; baseIdx = null; baseScale = scale;
        } else if (swp && tnt) {
          const ct = contrastTinted(scale[idx].hex, scale, fgPrimary(scale[idx].hex));
          const csIdx = ct.fromScale ? closestIdx(ct.hex, scale) : idx;
          baseCk = ck; baseIdx = csIdx; baseScale = scale;
        } else {
          baseCk = ck; baseIdx = idx; baseScale = scale;
        }
      }
    } else {
      /* ── Outline / Ghost ── */
      baseRef = col('{core.color.transparent}');
      contrastRef2 = col(`{semantic.color.${key}.${mode}.base}`);
      baseCk = ck; baseIdx = null;
      const palette = allBrandAccent;
      const colorDef = palette.find(c => c.key === key);
      if (colorDef) baseScale = getScale(colorDef.hex);
    }

    /* base-higher / base-lower: ±1 core step from resolved base */
    let hRef = baseRef, lRef = baseRef;
    if (baseIdx != null && baseScale) {
      const hIdx = Math.max(0, baseIdx - 1);
      const lIdx = Math.min(baseScale.length - 1, baseIdx + 1);
      hRef = col(`{core.color.${baseCk}.${baseScale[hIdx]?.step || '400'}}`);
      lRef = col(`{core.color.${baseCk}.${baseScale[lIdx]?.step || '600'}}`);
    }

    return { base: baseRef, 'base-higher': hRef, 'base-lower': lRef, contrast: contrastRef2 };
  }

  function buildActionSet(stateId) {
    return {
      themed:   buildActionMode(stateId, false),
      inverted: buildActionMode(stateId, true),
    };
  }

  /* Destructive: red palette indices for themed/inverted */
  const redPaletteName = 'red';
  const redOrigThemedIdx = redScale.length ? closestIdx(errorColor.hex, redScale) : 5;
  let redOrigInvIdx = redScale.length ? redScale.length - 1 - redOrigThemedIdx : 5;
  if (redOrigInvIdx === redOrigThemedIdx) redOrigInvIdx = Math.min((redScale.length || 11) - 1, redOrigThemedIdx + 1);

  function buildDestructiveMode(idx) {
    if (!redScale.length) {
      return { base: col(`{core.color.${redPaletteName}.500}`), 'base-higher': col(`{core.color.${redPaletteName}.400}`), 'base-lower': col(`{core.color.${redPaletteName}.600}`), contrast: col(contrastRef('#C11B25')) };
    }
    const baseStep = redScale[idx].step;
    const hIdx = Math.max(0, idx - 1);
    const lIdx = Math.min(redScale.length - 1, idx + 1);
    return {
      base:           col(`{core.color.${redPaletteName}.${baseStep}}`),
      'base-higher':  col(`{core.color.${redPaletteName}.${redScale[hIdx].step}}`),
      'base-lower':   col(`{core.color.${redPaletteName}.${redScale[lIdx].step}}`),
      contrast:       col(contrastRef(redScale[idx].hex)),
    };
  }

  semantic.color.action = {
    primary:                buildActionSet('primary'),
    'secondary-selected':   buildActionSet('secondary-selected'),
    'secondary-unselected': buildActionSet('secondary-unselected'),
    'tertiary-selected':    buildActionSet('tertiary-selected'),
    'tertiary-unselected':  buildActionSet('tertiary-unselected'),
    destructive: {
      themed:   buildDestructiveMode(redOrigThemedIdx),
      inverted: buildDestructiveMode(redOrigInvIdx),
    },
  };

  /* ── Shared color helpers (used by brand/accent, feedback, combo, HC) ── */

  /* Resolve themed/inverted indices from a brand index and scale */
  function resolveThemedInvertedIdx(hex, scale) {
    const brandIdx = closestIdx(hex, scale);
    let mirrorIdx = scale.length - 1 - brandIdx;
    if (mirrorIdx === brandIdx) mirrorIdx = Math.min(scale.length - 1, brandIdx + 1);
    const brandIsLight = fgPrimary(scale[brandIdx].hex) === FOUNDATION.darkClear.hex;
    const themedIdx   = brandIsLight ? brandIdx   : mirrorIdx;
    const invertedIdx = brandIsLight ? mirrorIdx  : brandIdx;
    return { themedIdx, invertedIdx, themedCp: FOUNDATION.darkClear.hex, invertedCp: FOUNDATION.lightClear.hex };
  }

  /* Walk from idx toward darker/lighter until AA/AAA against foundation cloudy */
  function buildWithOnFoundation(idx, scale, ck) {
    let wlSec = null, wlPri = null;
    for (let i = idx; i < scale.length; i++) {
      if (!wlSec && contrastRatio(scale[i].hex, lightCloudyHex) >= AA) wlSec = scale[i].step;
      if (!wlPri && contrastRatio(scale[i].hex, lightCloudyHex) >= AAA) wlPri = scale[i].step;
    }
    if (!wlSec) wlSec = scale[scale.length - 1].step;
    if (!wlPri) wlPri = scale[scale.length - 1].step;
    let wdSec = null, wdPri = null;
    for (let i = idx; i >= 0; i--) {
      if (!wdSec && contrastRatio(scale[i].hex, darkCloudyHex) >= AA) wdSec = scale[i].step;
      if (!wdPri && contrastRatio(scale[i].hex, darkCloudyHex) >= AAA) wdPri = scale[i].step;
    }
    if (!wdSec) wdSec = scale[0].step;
    if (!wdPri) wdPri = scale[0].step;
    return {
      'with-light-primary':   col(`{core.color.${ck}.${wlPri}}`),
      'with-light-secondary': col(`{core.color.${ck}.${wlSec}}`),
      'with-dark-primary':    col(`{core.color.${ck}.${wdPri}}`),
      'with-dark-secondary':  col(`{core.color.${ck}.${wdSec}}`),
    };
  }

  /* Surface tint tokens for a color scale */
  function buildSurfaceTokens(isLight, scale, ck) {
    const surfIdx = isLight ? 1 : Math.min(scale.length - 1, 7);
    const surfStep = scale[surfIdx].step;
    const surfHex = scale[surfIdx].hex;
    let scIdx = surfIdx;
    if (isLight) {
      while (scIdx < scale.length - 1 && contrastRatio(scale[scIdx].hex, surfHex) < AA) scIdx++;
    } else {
      while (scIdx > 0 && contrastRatio(scale[scIdx].hex, surfHex) < AA) scIdx--;
    }
    return {
      surface:              col(`{core.color.${ck}.${surfStep}}`),
      'surface-contrast':   col(`{core.color.${ck}.${scale[scIdx].step}}`),
    };
  }

  /* Build a full color set (base, contrast, with-on-foundation, surface) */
  function buildColorSet(idx, cpHex, isLight, scale, ck) {
    const baseStep = scale[idx].step;
    const hIdx = Math.max(0, idx - 1);
    const lIdx = Math.min(scale.length - 1, idx + 1);
    const cpRef = hexToOklch(cpHex).L > 0.6 ? '{core.color.light.clear}' : '{core.color.dark.clear}';
    const ct2 = contrastTinted(scale[idx].hex, scale, cpHex);
    const csRef = ct2.fromScale ? `{core.color.${ck}.${closestStep(ct2.hex, scale)}}` : cpRef;
    return {
      tokens: {
        base: col(`{core.color.${ck}.${baseStep}}`),
        'base-higher': col(`{core.color.${ck}.${scale[hIdx].step}}`),
        'base-lower': col(`{core.color.${ck}.${scale[lIdx].step}}`),
        'contrast-primary': col(cpRef),
        'contrast-secondary': col(csRef),
        ...buildWithOnFoundation(idx, scale, ck),
        ...buildSurfaceTokens(isLight, scale, ck),
      },
      cpRef,
    };
  }

  /* ── Semantic brand/accent colors (themed + inverted) ── */
  allBrandAccent.forEach(c => {
    const scale = getScale(c.hex);
    const { themedIdx, invertedIdx, themedCp, invertedCp } = resolveThemedInvertedIdx(c.hex, scale);

    const themedSet  = buildColorSet(themedIdx, themedCp, true, scale, c.key);
    const invertedSet = buildColorSet(invertedIdx, invertedCp, false, scale, c.key);

    semantic.color[c.key] = {
      themed:   themedSet.tokens,
      inverted: invertedSet.tokens,
    };
  });

  /* ── Semantic combo colors (themed + inverted) ── */
  COMBO_STATE.forEach(c => {
    const palette = colorPalette();
    const bgColor = palette.find(p => p.key === c.bgSource);
    const fgColor = palette.find(p => p.key === c.fgSource);
    if (!bgColor || !fgColor) return;
    const bgScale = getScale(bgColor.hex);
    const fgScale = getScale(fgColor.hex);
    const bgCK = coreKey(c.bgSource);
    const fgCK = coreKey(c.fgSource);
    /* Use configured shade index, or derive from the color's current hex */
    const bgIdx = c.bgShade ?? closestIdx(bgColor.hex, bgScale);
    const fgIdx = c.fgShade ?? closestIdx(fgColor.hex, fgScale);
    const bgStep    = bgScale[bgIdx]?.step || '500';
    const bgHigher  = bgScale[Math.max(0, bgIdx - 1)]?.step || bgStep;
    const bgLower   = bgScale[Math.min(bgScale.length - 1, bgIdx + 1)]?.step || bgStep;
    const fgStep    = fgScale[fgIdx]?.step || '500';
    const fgHigher  = fgScale[Math.max(0, fgIdx - 1)]?.step || fgStep;
    const fgLower   = fgScale[Math.min(fgScale.length - 1, fgIdx + 1)]?.step || fgStep;
    const bgHex = bgScale[bgIdx]?.hex || bgColor.hex;
    const fgHex = fgScale[fgIdx]?.hex || fgColor.hex;

    semantic.color[c.id] = {
      themed: {
        base:                col(`{core.color.${bgCK}.${bgStep}}`),
        'base-higher':       col(`{core.color.${bgCK}.${bgHigher}}`),
        'base-lower':        col(`{core.color.${bgCK}.${bgLower}}`),
        'contrast-primary':  col(contrastRef(bgHex)),
        'contrast-secondary': col(`{core.color.${fgCK}.${fgStep}}`),
        ...buildWithOnFoundation(bgIdx, bgScale, bgCK),
      },
      inverted: {
        base:                col(`{core.color.${fgCK}.${fgStep}}`),
        'base-higher':       col(`{core.color.${fgCK}.${fgHigher}}`),
        'base-lower':        col(`{core.color.${fgCK}.${fgLower}}`),
        'contrast-primary':  col(contrastRef(fgHex)),
        'contrast-secondary': col(`{core.color.${bgCK}.${bgStep}}`),
        ...buildWithOnFoundation(fgIdx, fgScale, fgCK),
      },
    };
  });

  /* ── Semantic feedback colors (themed + inverted) ── */
  semantic.color.feedback = {};
  COLORS.feedback.forEach(c => {
    const scale = getScale(c.hex);
    const paletteName = coreKey(c.key);
    const { themedIdx, invertedIdx, themedCp, invertedCp } = resolveThemedInvertedIdx(c.hex, scale);

    const themedSet  = buildColorSet(themedIdx, themedCp, true, scale, paletteName);
    const invertedSet = buildColorSet(invertedIdx, invertedCp, false, scale, paletteName);

    semantic.color.feedback[c.key] = {
      themed:   themedSet.tokens,
      inverted: invertedSet.tokens,
    };
  });

  /* ── Semantic grid ── */
  /* Grid references core.space tokens (4 breakpoints matching production skill) */
  /* Grid references core.space by integer index: M=4, S=3, L=5, XL=6, 2XL=7, 3XL=8 */
  semantic.grid.margin = { XS: spRef('M'), S: spRef('XL'), M: spRef('2XL'), L: spRef('3XL') };
  semantic.grid.gutter = { XS: spRef('S'), S: spRef('M'), M: spRef('L'), L: spRef('L') };

  /* ================================================================
     DARK MODE OVERRIDES (semantic.tokens.theme-dark.json)
     ================================================================ */

  const dark = {
    color: {
      foundation: {
        themed: {
          'base-clear':         col('{core.color.dark.clear}'),
          'base-cloudy':        col('{core.color.dark.cloudy}'),
          'base-higher':        col('{core.color.dark.cloudy}'),
          'base-lower':         col('{core.color.dark.clear}'),
          'contrast-primary':   col('{core.color.light.clear}'),
          'contrast-secondary': col(`{core.color.light.clear-a${_lN.secondary}}`),
          'contrast-tertiary':  col(`{core.color.light.clear-a${_lN.tertiary}}`),
          focus:                col('{core.color.focus.400}'),
          'base-shine':         col(`{core.color.light.clear-a${_lN.shine}}`),
          'base-shade':         col(`{core.color.dark.clear-a${_dN.shine}}`),
          dash:                 col(`{core.color.light.clear-a${_lN.dash}}`),
        },
        inverted: {
          'base-clear':         col('{core.color.light.clear}'),
          'base-cloudy':        col('{core.color.light.cloudy}'),
          'base-higher':        col('{core.color.light.clear}'),
          'base-lower':         col('{core.color.light.cloudy}'),
          'contrast-primary':   col('{core.color.dark.clear}'),
          'contrast-secondary': col(`{core.color.dark.clear-a${_dN.secondary}}`),
          'contrast-tertiary':  col(`{core.color.dark.clear-a${_dN.tertiary}}`),
          focus:                col('{core.color.focus.500}'),
          'base-shine':         col(`{core.color.light.clear-a${_lN.shine}}`),
          'base-shade':         col(`{core.color.dark.clear-a${_dN.shine}}`),
          dash:                 col(`{core.color.dark.clear-a${_dN.dash}}`),
        },
      },
    },
  };

  /* Dark overrides: brand + accent — simply swap themed ↔ inverted from light mode */
  allBrandAccent.forEach(c => {
    if (!semantic.color[c.key]) return;
    dark.color[c.key] = {
      themed:   { ...semantic.color[c.key].inverted },
      inverted: { ...semantic.color[c.key].themed },
    };
  });

  /* Dark overrides: feedback — simply swap themed ↔ inverted from light mode */
  dark.color.feedback = {};
  COLORS.feedback.forEach(c => {
    if (!semantic.color.feedback[c.key]) return;
    dark.color.feedback[c.key] = {
      themed:   { ...semantic.color.feedback[c.key].inverted },
      inverted: { ...semantic.color.feedback[c.key].themed },
    };
  });

  /* Dark overrides: action — swap themed ↔ inverted (same pattern as brand/feedback) */
  dark.color.action = {};
  Object.keys(semantic.color.action).forEach(k => {
    dark.color.action[k] = {
      themed:   { ...semantic.color.action[k].inverted },
      inverted: { ...semantic.color.action[k].themed },
    };
  });

  /* Dark overrides: combos — swap themed ↔ inverted from light mode */
  COMBO_STATE.forEach(c => {
    if (!semantic.color[c.id]) return;
    dark.color[c.id] = {
      themed:   { ...semantic.color[c.id].inverted },
      inverted: { ...semantic.color[c.id].themed },
    };
  });

  /* ================================================================
     COMPONENT TOKENS
     ================================================================ */

  const ref = (v) => ({ $value: v });

  const bwNames = ['none','XS','S','M','L','XL','2XL'];

  /* ================================================================
     COMPONENT BUTTON TOKENS — dynamic from ACTION_STATE
     ================================================================
     3 sets × 5 types = 15 variants, each with bg/fg/border.
     - Default: reads ACTION_STATE (user-configured colorSource, variant, I/S/T)
     - Themed: foundation themed colors (black on light, white on dark)
     - Inverted: foundation inverted colors (white on light, black on dark)
     Themed/Inverted use canonicalVariant (Primary=solid, Secondary=outline, Tertiary=ghost).
     ================================================================ */

  /* Build Default set from ACTION_STATE — references semantic.color.action tokens.
     The action tokens already have the I/S/T modifiers resolved:
     base = background color, contrast = foreground color.
     Variant comes from state.variant (user-configured), NOT canonicalVariant.
     Solid: bg = action base, fg = action contrast.
     Outline: bg = transparent, fg = action base, border = action base.
     Ghost: bg = transparent, fg = action base, border = transparent. */
  const defaultSet = {};
  ACTION_STATE.forEach(state => {
    const variant = state.variant;
    const actionPath = `semantic.color.action.${state.id}`;
    const bwName = variant === 'outline' ? (bwNames[state.bw] || 'M') : 'none';
    let bg, fg, borderColor;
    if (variant === 'solid') {
      bg = ref(`{${actionPath}.themed.base}`);
      fg = ref(`{${actionPath}.themed.contrast}`);
      borderColor = ref('{core.color.transparent}');
    } else if (variant === 'outline') {
      bg = ref('{core.color.transparent}');
      fg = ref(`{${actionPath}.themed.base}`);
      borderColor = ref(`{${actionPath}.themed.base}`);
    } else {
      /* ghost */
      bg = ref('{core.color.transparent}');
      fg = ref(`{${actionPath}.themed.base}`);
      borderColor = ref('{core.color.transparent}');
    }
    defaultSet[state.id] = { bg, fg, 'border-color': borderColor, 'border-width': ref(`{semantic.border.width.${bwName}}`) };
  });

  /* Build Themed + Inverted sets: foundation colors, canonical variant per button.
     Primary=solid, Secondary=outline, Tertiary=ghost — always, regardless of UI state. */
  const themedSet = {};
  const invSet = {};
  ACTION_STATE.forEach(state => {
    const variant = canonicalVariant(state);
    const cpTh  = '{semantic.color.foundation.themed.contrast-primary}';
    const bgTh  = '{semantic.color.foundation.themed.base-clear}';
    const cpInv = '{semantic.color.foundation.inverted.contrast-primary}';
    const bgInv = '{semantic.color.foundation.inverted.base-clear}';
    const bwName = variant === 'outline' ? (bwNames[state.bw] || 'M') : 'none';

    let fgTh, fgInv, bgTh2, bgInv2, brdTh, brdInv;
    if (variant === 'solid') {
      bgTh2 = ref(cpTh); fgTh = ref(bgTh); bgInv2 = ref(cpInv); fgInv = ref(bgInv);
      brdTh = ref('{core.color.transparent}'); brdInv = ref('{core.color.transparent}');
    } else if (variant === 'outline') {
      bgTh2 = ref('{core.color.transparent}'); fgTh = ref(cpTh);
      bgInv2 = ref('{core.color.transparent}'); fgInv = ref(cpInv);
      brdTh = ref(cpTh); brdInv = ref(cpInv);
    } else {
      /* ghost */
      bgTh2 = ref('{core.color.transparent}'); fgTh = ref(cpTh);
      bgInv2 = ref('{core.color.transparent}'); fgInv = ref(cpInv);
      brdTh = ref('{core.color.transparent}'); brdInv = ref('{core.color.transparent}');
    }
    themedSet[state.id] = { bg: bgTh2, fg: fgTh, 'border-color': brdTh, 'border-width': ref(`{semantic.border.width.${bwName}}`) };
    invSet[state.id]    = { bg: bgInv2, fg: fgInv, 'border-color': brdInv, 'border-width': ref(`{semantic.border.width.${bwName}}`) };
  });

  /* Destructive button: solid variant — references semantic destructive action tokens,
     not foundation. Included in default/themed/inverted like all other button types. */
  defaultSet.destructive = {
    bg: ref('{semantic.color.action.destructive.themed.base}'),
    fg: ref('{semantic.color.action.destructive.themed.contrast}'),
    'border-color': ref('{core.color.transparent}'),
    'border-width': ref('{semantic.border.width.none}'),
  };
  /* Themed destructive: semantic destructive themed colors, solid variant */
  themedSet.destructive = {
    bg: ref('{semantic.color.action.destructive.themed.base}'),
    fg: ref('{semantic.color.action.destructive.themed.contrast}'),
    'border-color': ref('{core.color.transparent}'),
    'border-width': ref('{semantic.border.width.none}'),
  };
  /* Inverted destructive: semantic destructive inverted colors, solid variant */
  invSet.destructive = {
    bg: ref('{semantic.color.action.destructive.inverted.base}'),
    fg: ref('{semantic.color.action.destructive.inverted.contrast}'),
    'border-color': ref('{core.color.transparent}'),
    'border-width': ref('{semantic.border.width.none}'),
  };

  /* Resolve brand color for card fg-eyebrow */
  const brandKey = COLORS.brand[0]?.key || 'brand-a';

  const component = {
    /* ================================================================
       BUTTON
       ================================================================ */
    button: {
      'default':     defaultSet,
      'themed':      themedSet,
      'inverted':    invSet,
      size: {
        S: {
          height:              ref('{semantic.size.action.S}'),
          'padding-x':         ref('{semantic.space.padding.M}'),
          'gap-icon-to-label': ref('{semantic.space.gap.XS}'),
          icon:                ref('{semantic.size.icon.S}'),
          typography:          ref('{semantic.typography.interface.XS}'),
          'border-radius':     ref('{semantic.radius.M}'),
          'border-radius-pill': ref('{semantic.radius.pill}'),
        },
        M: {
          height:              ref('{semantic.size.action.M}'),
          'padding-x':         ref('{semantic.space.padding.M}'),
          'gap-icon-to-label': ref('{semantic.space.gap.XS}'),
          icon:                ref('{semantic.size.icon.M}'),
          typography:          ref('{semantic.typography.interface.S}'),
          'border-radius':     ref('{semantic.radius.M}'),
          'border-radius-pill': ref('{semantic.radius.pill}'),
        },
      },
      'hover-overlay':    ref('{semantic.color.foundation.themed.base-shine}'),
      'pressed-overlay':  ref('{semantic.color.foundation.themed.base-shade}'),
      'opacity-enabled':  ref('{semantic.opacity.enabled}'),
      'opacity-disabled': ref('{semantic.opacity.disabled}'),
    },
    /* ================================================================
       INPUT
       ================================================================ */
    input: {
      color: {
        bg:               ref('{semantic.color.foundation.themed.base-clear}'),
        'bg-error':       ref('{semantic.color.feedback.error.themed.surface}'),
        'fg-value':       ref('{semantic.color.foundation.themed.contrast-primary}'),
        'fg-placeholder': ref('{semantic.color.foundation.themed.contrast-tertiary}'),
        'fg-label':       ref('{semantic.color.foundation.themed.contrast-primary}'),
        'fg-helper':      ref('{semantic.color.foundation.themed.contrast-secondary}'),
        'fg-error':       ref('{semantic.color.feedback.error.themed.surface-contrast}'),
        border:           ref('{semantic.color.foundation.themed.base-shade}'),
        'border-active':  ref('{semantic.color.foundation.themed.contrast-secondary}'),
        'border-error':   ref('{semantic.color.feedback.error.themed.surface-contrast}'),
      },
      size: {
        S: {
          height:              ref('{semantic.size.action.S}'),
          'padding-x':         ref('{semantic.space.padding.S}'),
          'gap-icon-to-value': ref('{semantic.space.gap.XS}'),
          'typography-value':  ref('{semantic.typography.interface.XS}'),
          'typography-label':  ref('{semantic.typography.interface.XS}'),
          'border-radius':     ref('{semantic.radius.M}'),
          'border-width':      ref('{semantic.border.width.S}'),
        },
        M: {
          height:              ref('{semantic.size.action.M}'),
          'padding-x':         ref('{semantic.space.padding.S}'),
          'gap-icon-to-value': ref('{semantic.space.gap.XS}'),
          'typography-value':  ref('{semantic.typography.interface.S}'),
          'typography-label':  ref('{semantic.typography.interface.XS}'),
          'border-radius':     ref('{semantic.radius.M}'),
          'border-width':      ref('{semantic.border.width.S}'),
        },
      },
      'opacity-enabled':  ref('{semantic.opacity.enabled}'),
      'opacity-disabled': ref('{semantic.opacity.disabled}'),
    },
    /* ================================================================
       CARD
       ================================================================ */
    card: {
      color: {
        bg:           ref('{semantic.color.foundation.themed.base-clear}'),
        'fg-title':   ref('{semantic.color.foundation.themed.contrast-primary}'),
        'fg-body':    ref('{semantic.color.foundation.themed.contrast-primary}'),
        'fg-meta':    ref('{semantic.color.foundation.themed.contrast-secondary}'),
        'fg-eyebrow': ref(`{semantic.color.${brandKey}.themed.with-light-secondary}`),
        border:       ref('{semantic.color.foundation.themed.base-shade}'),
        placeholder:  ref('{core.color.placeholder}'),
      },
      space: {
        'padding-x':            ref('{semantic.space.padding.M}'),
        'padding-y':            ref('{semantic.space.padding.M}'),
        'gap-eyebrow-to-title': ref('{semantic.space.gap.XS}'),
        'gap-title-to-body':    ref('{semantic.space.gap.M}'),
        'gap-body-to-meta':     ref('{semantic.space.gap.L}'),
      },
      'border-width':  ref('{semantic.border.width.none}'),
      'border-radius': ref('{semantic.radius.L}'),
      typography: {
        eyebrow: ref('{semantic.typography.caps.S}'),
        title:   ref('{semantic.typography.heading.M}'),
        body:    ref('{semantic.typography.interface.S}'),
        meta:    ref('{semantic.typography.interface.XS}'),
      },
      elevation: {
        default: ref('{semantic.elevation.1}'),
        hover:   ref('{semantic.elevation.2}'),
      },
      'opacity-enabled':  ref('{semantic.opacity.enabled}'),
      'opacity-disabled': ref('{semantic.opacity.disabled}'),
    },
    /* ================================================================
       ARTICLE
       ================================================================ */
    article: {
      space: {
        'wrapper-padding-top':    ref('{semantic.space.article.M}'),
        'h2-margin-before':       ref('{semantic.space.article.XL}'),
        'h3-margin-before':       ref('{semantic.space.article.L}'),
        'h4-margin-before':       ref('{semantic.space.article.M}'),
        'paragraph-margin-before': ref('{semantic.space.article.S}'),
        'list-margin-before':     ref('{semantic.space.article.S}'),
        'list-item-margin-before': ref('{semantic.space.article.XS}'),
        'media-margin-before':    ref('{semantic.space.article.L}'),
        'media-caption-margin-before': ref('{semantic.space.article.XS}'),
        'blockquote-margin-before': ref('{semantic.space.article.L}'),
        'codeblock-margin-before': ref('{semantic.space.article.M}'),
      },
    },
  };

  /* ================================================================
     OPTIONAL COLLECTIONS
     ================================================================ */

  const optBreakpoints = document.getElementById('export-breakpoints')?.checked;
  const optContrast    = document.getElementById('export-contrast')?.checked;
  const optDensity     = document.getElementById('export-density')?.checked;
  const optColors      = document.getElementById('export-colors')?.checked;

  /* ── Breakpoints: 5 modes — recalculate font size scale per breakpoint ── */
  /* S = default sh, M = sh * 1.1, L+ = sh * 1.2.
     Font sizes are recomputed (not index-shifted). Heading composites stay unchanged —
     the underlying font/size-N values change per mode automatically. */
  let breakpointModes = null;
  if (optBreakpoints) {
    /* sh boost per breakpoint: +0.2 per step from S. headingStep = 4*sh, so +0.2 = +0.8px per heading level */
    const bpConfig = { S: { width: 395, shAdd: 0 }, M: { width: 768, shAdd: 0.20 }, L: { width: 1024, shAdd: 0.40 }, XL: { width: 1280, shAdd: 0.60 }, '2XL': { width: 1536, shAdd: 0.80 } };

    breakpointModes = {};
    Object.entries(bpConfig).forEach(([bp, cfg]) => {
      const mode = { breakpoint: { width: dim(cfg.width) } };

      /* Recalculate typography scale with boosted sh */
      const bpTypo = calcTypography(sh + cfg.shAdd);

      /* Only export font sizes that differ from the S (default) mode */
      if (cfg.shAdd > 0) {
        mode.font = {};
        bpTypo.forEach((t, i) => {
          if (t.size !== typo[i].size) {
            mode.font[`size-${i}`] = dim(t.size);
          }
        });
        /* Remove font key if nothing changed (unlikely but safe) */
        if (Object.keys(mode.font).length === 0) delete mode.font;
      }

      breakpointModes[bp] = mode;
    });
  }

  /* ── Accessibility: High Contrast (AAA 7:1 — override tokens that don't meet AAA) ── */
  let contrastHighContrast = null;
  if (optContrast) {
    contrastHighContrast = { color: { foundation: { themed: {}, inverted: {} } } };
    /* Foundation HC: reference the AAA alpha tokens from Core (no hardcoded hex) */
    contrastHighContrast.color.foundation.themed['contrast-secondary'] = col(`{core.color.dark.clear-a${_dN.secondaryAAA}}`);
    contrastHighContrast.color.foundation.inverted['contrast-secondary'] = col(`{core.color.light.clear-a${_lN.secondaryAAA}}`);

    /* ── Helper: shift baseIdx away from cp until AAA contrast is met ── */
    function hcShiftBase(baseIdx, cpHex, scale) {
      if (contrastRatio(cpHex, scale[baseIdx].hex) >= AAA) return baseIdx;
      const cpIsLight = hexToOklch(cpHex).L > 0.6;
      let idx = baseIdx;
      if (cpIsLight) {
        while (idx < scale.length - 1 && contrastRatio(cpHex, scale[idx].hex) < AAA) idx++;
      } else {
        while (idx > 0 && contrastRatio(cpHex, scale[idx].hex) < AAA) idx--;
      }
      return idx;
    }

    /* ── Helper: walk scale from startIdx toward cp direction until threshold met vs bgHex ── */
    function hcWalkScale(bgHex, scale, cpHex, threshold) {
      const bgL = hexToOklch(bgHex).L;
      const cpL = hexToOklch(cpHex).L;
      const towardDark = cpL < bgL;
      const candidates = scale
        .map(s => ({ hex: s.hex, step: s.step, ratio: contrastRatio(s.hex, bgHex), L: s.L }))
        .filter(s => {
          if (s.ratio < threshold) return false;
          if (Math.abs(s.L - bgL) < 0.05) return false;
          return towardDark ? s.L < bgL : s.L > bgL;
        });
      if (!candidates.length) return null;
      /* Pick minimum passing ratio = closest to base = most tinted */
      candidates.sort((a, b) => a.ratio - b.ratio);
      return candidates[0];
    }

    /* ── Helper: collect only tokens whose $value differs from origTokens ── */
    function diffTokens(newTokens, origTokens) {
      const diff = {};
      for (const [k, v] of Object.entries(newTokens)) {
        if (!origTokens[k] || JSON.stringify(v) !== JSON.stringify(origTokens[k])) {
          diff[k] = v;
        }
      }
      return diff;
    }

    /* ── Generic HC set builder (works for brand, accent, feedback) ── */
    function hcBuildSet(origIdx, cpHex, isLight, scale, coreKey) {
      /* 1. Shift base until contrast-primary vs base >= 7:1 */
      const baseIdx = hcShiftBase(origIdx, cpHex, scale);
      const baseHex = scale[baseIdx].hex;

      /* cpRef never changes — always the same foundation reference */
      const cpRef = hexToOklch(cpHex).L > 0.6 ? '{core.color.light.clear}' : '{core.color.dark.clear}';

      /* 2. contrast-secondary: walk from (shifted) base toward cp until >= 7:1 vs base */
      const csWalk = hcWalkScale(baseHex, scale, cpHex, AAA);
      const newCsRef = csWalk ? `{core.color.${coreKey}.${csWalk.step}}` : cpRef;

      /* 3. with-light-primary: walk from base toward dark until >= 7:1 vs light.cloudy */
      let wlPri = null;
      for (let i = baseIdx; i < scale.length; i++) {
        if (contrastRatio(scale[i].hex, lightCloudyHex) >= AAA) { wlPri = scale[i].step; break; }
      }
      if (!wlPri) wlPri = scale[scale.length - 1].step;

      /* 4. with-light-secondary: walk from base toward dark until >= 4.5:1 vs light.cloudy */
      let wlSec = null;
      for (let i = baseIdx; i < scale.length; i++) {
        if (contrastRatio(scale[i].hex, lightCloudyHex) >= AA) { wlSec = scale[i].step; break; }
      }
      if (!wlSec) wlSec = scale[scale.length - 1].step;

      /* 5. with-dark-primary: walk from base toward light until >= 7:1 vs dark.cloudy */
      let wdPri = null;
      for (let i = baseIdx; i >= 0; i--) {
        if (contrastRatio(scale[i].hex, darkCloudyHex) >= AAA) { wdPri = scale[i].step; break; }
      }
      if (!wdPri) wdPri = scale[0].step;

      /* 6. with-dark-secondary: walk from base toward light until >= 4.5:1 vs dark.cloudy */
      let wdSec = null;
      for (let i = baseIdx; i >= 0; i--) {
        if (contrastRatio(scale[i].hex, darkCloudyHex) >= AA) { wdSec = scale[i].step; break; }
      }
      if (!wdSec) wdSec = scale[0].step;

      /* 7. surface-contrast: surface = step 100 (idx 1) for themed, step 700 (idx 7) for inverted */
      const surfIdx = isLight ? 1 : Math.min(scale.length - 1, 7);
      const surfStep = scale[surfIdx].step;
      const surfHex = scale[surfIdx].hex;
      let scIdx = surfIdx;
      if (isLight) {
        while (scIdx < scale.length - 1 && contrastRatio(scale[scIdx].hex, surfHex) < AAA) scIdx++;
      } else {
        while (scIdx > 0 && contrastRatio(scale[scIdx].hex, surfHex) < AAA) scIdx--;
      }

      /* Assemble new HC tokens */
      const newHIdx = Math.max(0, baseIdx - 1);
      const newLIdx = Math.min(scale.length - 1, baseIdx + 1);
      const newTokens = {
        base:                 col(`{core.color.${coreKey}.${scale[baseIdx].step}}`),
        'base-higher':        col(`{core.color.${coreKey}.${scale[newHIdx].step}}`),
        'base-lower':         col(`{core.color.${coreKey}.${scale[newLIdx].step}}`),
        'contrast-secondary': col(newCsRef),
        'with-light-primary':   col(`{core.color.${coreKey}.${wlPri}}`),
        'with-light-secondary': col(`{core.color.${coreKey}.${wlSec}}`),
        'with-dark-primary':    col(`{core.color.${coreKey}.${wdPri}}`),
        'with-dark-secondary':  col(`{core.color.${coreKey}.${wdSec}}`),
        surface:              col(`{core.color.${coreKey}.${surfStep}}`),
        'surface-contrast':   col(`{core.color.${coreKey}.${scale[scIdx].step}}`),
      };

      /* Reconstruct original tokens via buildColorSet */
      const origTokens = buildColorSet(origIdx, cpHex, isLight, scale, coreKey).tokens;

      /* Only include tokens that actually changed */
      return diffTokens(newTokens, origTokens);
    }

    /* ── Action buttons (solid only — ghost/outline have transparent bg, no contrast to fix) ── */
    ACTION_STATE.forEach(state => {
      const isFreeform = state.fgSource || state.bgSource;
      const key = canonicalKey(state.colorSource);
      const variant = canonicalVariant(state);
      if (isFreeform || key.startsWith('combo-') || variant !== 'solid') return;

      const palette = allBrandAccent;
      const colorDef = palette.find(c => c.key === key);
      if (!colorDef) return;

      const scale = getScale(colorDef.hex);
      const ck = coreKey(key);
      const { themedIdx: actThemedIdx, invertedIdx: actInvertedIdx, themedCp: themedCpHex, invertedCp: invCpHex } = resolveThemedInvertedIdx(colorDef.hex, scale);

      const themedBaseHex = scale[actThemedIdx].hex;
      const invBaseHex = scale[actInvertedIdx].hex;

      const themedNeedsHc  = contrastRatio(themedCpHex, themedBaseHex) < AAA;
      const invertedNeedsHc = contrastRatio(invCpHex, invBaseHex) < AAA;

      if (!themedNeedsHc && !invertedNeedsHc) return;

      contrastHighContrast.color.action = contrastHighContrast.color.action || {};
      contrastHighContrast.color.action[state.id] = {};

      if (themedNeedsHc) {
        /* Shift base toward lighter end until AAA met against dark.clear */
        const shiftedIdx = hcShiftBase(actThemedIdx, themedCpHex, scale);
        const newBase = scale[shiftedIdx].step;
        const origBase = scale[actThemedIdx].step;
        const diff = {};
        if (newBase !== origBase) {
          diff.base = col(`{core.color.${ck}.${newBase}}`);
          diff['base-higher'] = col(`{core.color.${ck}.${scale[Math.max(0, shiftedIdx - 1)].step}}`);
          diff['base-lower'] = col(`{core.color.${ck}.${scale[Math.min(scale.length - 1, shiftedIdx + 1)].step}}`);
        }
        if (Object.keys(diff).length) contrastHighContrast.color.action[state.id].themed = diff;
      }

      if (invertedNeedsHc) {
        /* Shift base toward darker end until AAA met against light.clear */
        const shiftedIdx = hcShiftBase(actInvertedIdx, invCpHex, scale);
        const newBase = scale[shiftedIdx].step;
        const origBase = scale[actInvertedIdx].step;
        const diff = {};
        if (newBase !== origBase) {
          diff.base = col(`{core.color.${ck}.${newBase}}`);
          diff['base-higher'] = col(`{core.color.${ck}.${scale[Math.max(0, shiftedIdx - 1)].step}}`);
          diff['base-lower'] = col(`{core.color.${ck}.${scale[Math.min(scale.length - 1, shiftedIdx + 1)].step}}`);
        }
        if (Object.keys(diff).length) contrastHighContrast.color.action[state.id].inverted = diff;
      }

      if (!Object.keys(contrastHighContrast.color.action[state.id]).length) delete contrastHighContrast.color.action[state.id];
    });

    /* ── Brand/Accent colors ── */
    allBrandAccent.forEach(c => {
      const scale = getScale(c.hex);
      const { themedIdx, invertedIdx, themedCp, invertedCp } = resolveThemedInvertedIdx(c.hex, scale);

      const themedDiff = hcBuildSet(themedIdx, themedCp, true, scale, c.key);
      const invertedDiff = hcBuildSet(invertedIdx, invertedCp, false, scale, c.key);
      if ((themedDiff && Object.keys(themedDiff).length) || (invertedDiff && Object.keys(invertedDiff).length)) {
        contrastHighContrast.color[c.key] = {};
        if (themedDiff && Object.keys(themedDiff).length) contrastHighContrast.color[c.key].themed = themedDiff;
        if (invertedDiff && Object.keys(invertedDiff).length) contrastHighContrast.color[c.key].inverted = invertedDiff;
      }
    });

    /* ── Feedback colors ── */
    COLORS.feedback.forEach(c => {
      const scale = getScale(c.hex);
      const paletteName = coreKey(c.key);
      const { themedIdx, invertedIdx, themedCp, invertedCp } = resolveThemedInvertedIdx(c.hex, scale);

      const themedDiff = hcBuildSet(themedIdx, themedCp, true, scale, paletteName);
      const invertedDiff = hcBuildSet(invertedIdx, invertedCp, false, scale, paletteName);
      if ((themedDiff && Object.keys(themedDiff).length) || (invertedDiff && Object.keys(invertedDiff).length)) {
        contrastHighContrast.color.feedback = contrastHighContrast.color.feedback || {};
        contrastHighContrast.color.feedback[c.key] = {};
        if (themedDiff && Object.keys(themedDiff).length) contrastHighContrast.color.feedback[c.key].themed = themedDiff;
        if (invertedDiff && Object.keys(invertedDiff).length) contrastHighContrast.color.feedback[c.key].inverted = invertedDiff;
        if (!Object.keys(contrastHighContrast.color.feedback[c.key]).length) delete contrastHighContrast.color.feedback[c.key];
      }
    });

    /* ── Destructive (red palette) ── */
    if (redScale.length) {
      function hcDestructiveSet(origIdx) {
        const cpHex = fgPrimary(redScale[origIdx].hex);
        const shiftedIdx = hcShiftBase(origIdx, cpHex, redScale);

        const origHIdx = Math.max(0, origIdx - 1);
        const origLIdx = Math.min(redScale.length - 1, origIdx + 1);
        const origTokens = {
          base:          col(`{core.color.${redPaletteName}.${redScale[origIdx].step}}`),
          'base-higher': col(`{core.color.${redPaletteName}.${redScale[origHIdx].step}}`),
          'base-lower':  col(`{core.color.${redPaletteName}.${redScale[origLIdx].step}}`),
          contrast:      col(contrastRef(redScale[origIdx].hex)),
        };

        const newHIdx = Math.max(0, shiftedIdx - 1);
        const newLIdx = Math.min(redScale.length - 1, shiftedIdx + 1);
        const newTokens = {
          base:          col(`{core.color.${redPaletteName}.${redScale[shiftedIdx].step}}`),
          'base-higher': col(`{core.color.${redPaletteName}.${redScale[newHIdx].step}}`),
          'base-lower':  col(`{core.color.${redPaletteName}.${redScale[newLIdx].step}}`),
          contrast:      col(contrastRef(redScale[shiftedIdx].hex)),
        };

        return diffTokens(newTokens, origTokens);
      }

      const destrThemedDiff = hcDestructiveSet(redOrigThemedIdx);
      const destrInvDiff = hcDestructiveSet(redOrigInvIdx);
      if ((destrThemedDiff && Object.keys(destrThemedDiff).length) || (destrInvDiff && Object.keys(destrInvDiff).length)) {
        contrastHighContrast.color.action = contrastHighContrast.color.action || {};
        contrastHighContrast.color.action.destructive = {};
        if (destrThemedDiff && Object.keys(destrThemedDiff).length) contrastHighContrast.color.action.destructive.themed = destrThemedDiff;
        if (destrInvDiff && Object.keys(destrInvDiff).length) contrastHighContrast.color.action.destructive.inverted = destrInvDiff;
        if (!Object.keys(contrastHighContrast.color.action.destructive).length) delete contrastHighContrast.color.action.destructive;
      }
    }
  }

  /* ── Density: Compact (space ×0.75, size ×0.75 per group, integer snap, monotonic) ── */
  let densityCompact = null;
  if (optDensity) {
    densityCompact = { core: { space: {}, size: {} } };
    /* Space: compact ≈ 0.75× default, integer snap, enforce monotonic +1 */
    const spCompact = spacing.map(s => s.val === 0 ? 0 : Math.max(1, Math.round(s.val * 0.75)));
    for (let i = 1; i < spCompact.length; i++) {
      if (spCompact[i] <= spCompact[i - 1]) spCompact[i] = spCompact[i - 1] + 1;
    }
    spacing.forEach((s, i) => {
      densityCompact.core.space[Math.round(s.val / 4)] = dim(spCompact[i]);
    });
    /* Size: compact ≈ 0.75× per group (icon/action), integer snap, enforce monotonic +1 */
    const sizeByGroup = {};
    sizing.forEach(s => { (sizeByGroup[s.group] ??= []).push(s); });
    Object.values(sizeByGroup).forEach(group => {
      const cv = group.map(s => Math.max(1, Math.round(s.val * 0.75)));
      for (let i = 1; i < cv.length; i++) {
        if (cv[i] <= cv[i - 1]) cv[i] = cv[i - 1] + 1;
      }
      group.forEach((s, i) => {
        densityCompact.core.size[Math.round(s.val / 4)] = dim(cv[i]);
      });
    });
  }

  /* ── Colors: each brand/accent/combo as a switchable collection ── */
  /* Colors reference {semantic.color.*} tokens — NOT copies of Core refs.
     The implementation tool (Figma/CSS) builds the alias chain:
     Colors → Accessibility → Semantic → Core */
  let colorCollections = null;
  if (optColors) {
    colorCollections = {};
    const makeColorRef = (colorKey, tokens) => {
      const result = {};
      for (const [mode, modeTokens] of Object.entries(tokens)) {
        result[mode] = {};
        for (const [token] of Object.entries(modeTokens)) {
          result[mode][token] = col(`{semantic.color.${colorKey}.${mode}.${token}}`);
        }
      }
      return result;
    };
    allBrandAccent.forEach(c => {
      if (!semantic.color[c.key]) return;
      colorCollections[c.key] = { semantic: { color: {} } };
      colorCollections[c.key].semantic.color[c.key] = makeColorRef(c.key, semantic.color[c.key]);
    });
    COMBO_STATE.forEach(c => {
      if (!semantic.color[c.id]) return;
      colorCollections[c.id] = { semantic: { color: {} } };
      colorCollections[c.id].semantic.color[c.id] = makeColorRef(c.id, semantic.color[c.id]);
    });
  }

  /* ── Download ── */
  function downloadJson(obj, filename) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 200);
  }

  let delay = 0;
  const dl = (obj, name) => { setTimeout(() => downloadJson(obj, name), delay); delay += 150; };

  /* Base exports (always) */
  dl(core, 'core.tokens.json');
  dl(semantic, 'semantic.tokens.json');
  dl(dark, 'semantic.theme.dark.tokens.json');
  dl({ component }, 'component.tokens.json');

  /* Optional collections */
  if (breakpointModes) {
    Object.entries(breakpointModes).forEach(([bp, obj]) => {
      dl(obj, `core.breakpoint.${bp.toLowerCase()}.tokens.json`);
    });
  }
  if (contrastHighContrast) dl(contrastHighContrast, 'semantic.accessibility.high-contrast.tokens.json');
  if (densityCompact) dl(densityCompact, 'core.density.compact.tokens.json');
  if (document.getElementById('export-typography')?.checked) {
    dl({
      core: {
        font: {
          'family-sans':      { $value: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", $type: 'fontFamily' },
          'family-serif':     { $value: "'Lora', Georgia, 'Times New Roman', serif", $type: 'fontFamily' },
          'family-mono':      { $value: "'JetBrains Mono', 'Fira Code', monospace", $type: 'fontFamily' },
          'family-interface': { $value: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", $type: 'fontFamily' },
          'weight-light':     { $value: 300, $type: 'fontWeight' },
          'weight-regular':   { $value: 400, $type: 'fontWeight' },
          'weight-medium':    { $value: 500, $type: 'fontWeight' },
          'weight-semibold':  { $value: 600, $type: 'fontWeight' },
          'weight-bold':      { $value: 700, $type: 'fontWeight' },
          'weight-extrabold': { $value: 800, $type: 'fontWeight' },
        }
      }
    }, 'core.typography.web.tokens.json');
  }
  if (colorCollections) {
    Object.entries(colorCollections).forEach(([key, obj]) => {
      dl(obj, `semantic.colors.${key}.tokens.json`);
    });
  }

  /* ── Token Architecture README ── */
  const archLines = [];
  const h1 = t => archLines.push(`# ${t}\n`);
  const h2 = t => archLines.push(`\n## ${t}\n`);
  const h3 = t => archLines.push(`\n### ${t}\n`);
  const p = t => archLines.push(`${t}\n`);
  const li = t => archLines.push(`- ${t}`);
  const code = t => archLines.push('```\n' + t + '\n```\n');

  h1('Token Architecture');
  p('Auto-generated. Describes the resolve order, collections, and references for this token export.');

  /* Resolve order */
  h2('Resolve Order');
  const layers = ['Core', 'Semantic (Light/Dark)'];
  if (optContrast) layers.push('Accessibility (High Contrast)');
  if (optColors) layers.push('Color Collections');
  layers.push('Component');
  code(layers.join(' → '));
  const coreModifiers = [];
  if (document.getElementById('export-typography')?.checked) coreModifiers.push('Typography — overrides `core.font.*`');
  if (optDensity) coreModifiers.push('Density — overrides `core.space.*`, `core.size.*`');
  if (optBreakpoints) coreModifiers.push('Breakpoints — 5 modes with `breakpoint.width` + recomputed font sizes');
  if (coreModifiers.length) {
    p('Core-level modifiers (override Core values, all downstream layers resolve automatically):');
    coreModifiers.forEach(m => li(m));
    archLines.push('');
  }

  h2('Reference Chain');
  p('Each layer references the layer directly below it in the resolve order — not the original source. When optional layers are absent, references skip to the next available layer.');
  p('The implementation tool determines how chaining works (CSS cascade, Figma variable aliases, Style Dictionary source file order). Read the relevant Tool Conventions (`~/.claude/resources/Tool Conventions/`) for platform-specific implementation details.');
  archLines.push('');
  const chainStack = ['Semantic'];
  if (optContrast) chainStack.push('Accessibility');
  if (optColors) chainStack.push('Color Collections');
  chainStack.push('Component');
  archLines.push('| Layer | References |');
  archLines.push('|---|---|');
  archLines.push('| Core | (absolute values) |');
  chainStack.forEach((layer, i) => {
    const prev = i === 0 ? 'Core' : chainStack[i - 1];
    archLines.push('| ' + layer + ' | → ' + prev + ' |');
  });
  archLines.push('');

  /* Base collections (always) */
  h2('Base Collections (Always Exported)');

  h3('core.tokens.json');
  p('Raw values: spacing, sizing, radius, border-width, font families & weights, font sizes, line heights, color palettes (foundation + brand + accent + feedback), shadows, opacity, breakpoints.');
  p('**Modes:** None. Single set of absolute values.');

  h3('semantic.tokens.json');
  p('Default theme (Light). Maps core values to semantic meaning: foundation colors (themed/inverted), brand/accent/feedback colors (themed/inverted with base, contrast-primary, contrast-secondary), typography composites, elevation, layout.');
  p('**Modes:** themed, inverted. References core tokens.');

  h3('semantic.theme.dark.tokens.json');
  p('Dark mode overrides. Only contains tokens that differ from the light default — primarily color assignments where light/dark foundations swap.');
  p('**Modes:** themed, inverted. Overrides semantic.tokens.json.');

  h3('component.tokens.json');
  let componentTarget = 'semantic';
  if (optColors) componentTarget = 'Color Collection';
  else if (optContrast) componentTarget = 'Accessibility';
  p('Component-scoped tokens (button, input, card, etc.). References ' + componentTarget + ' tokens — never core directly. JSON files use logical references (`{semantic.*}`), but the implementation tool builds the alias chain through intermediate collections when present (see Reference Chain above).');

  /* Optional: Typography */
  if (document.getElementById('export-typography')?.checked) {
    h2('Typography Collection');
    h3('core.typography.web.tokens.json');
    p('Overrides `core.font.family-*` and `core.font.weight-*` with Web-specific values (Inter, Lora, JetBrains Mono).');
    p('**Purpose:** This collection exists so platform-specific font files can be added alongside it:');
    li('`core.typography.ios.tokens.json` — SF Pro, New York, SF Mono');
    li('`core.typography.android.tokens.json` — Roboto, Noto Serif, Roboto Mono');
    archLines.push('');
    p('Each file overrides the same `core.font.*` keys. The active platform mode determines which file is loaded. All semantic and component tokens reference `core.font.*` and resolve automatically.');
  }

  /* Optional: Density */
  if (optDensity) {
    h2('Density Collection');
    h3('core.density.compact.tokens.json');
    p('Overrides `core.space.*` and `core.size.*` with values shifted 2 steps down the scale. All semantic tokens referencing these core tokens automatically shrink.');
    p('**Implementation:** Load this file after core.tokens.json. It replaces the same keys with smaller values. No semantic or component changes needed.');
  }

  /* Optional: Breakpoints */
  if (optBreakpoints) {
    h2('Breakpoints Collection');
    p('5 modes representing screen sizes. Each mode contains the breakpoint width and recomputed font sizes for the scaled portion of the type scale:');
    li('`core.breakpoint.s.tokens.json` — 395px (Mobile, default scale)');
    li('`core.breakpoint.m.tokens.json` — 768px (Tablet, scale +0.20)');
    li('`core.breakpoint.l.tokens.json` — 1024px (Desktop, scale +0.40)');
    li('`core.breakpoint.xl.tokens.json` — 1280px (Large Desktop, scale +0.60)');
    li('`core.breakpoint.2xl.tokens.json` — 1536px (Wide Desktop, scale +0.80)');
    archLines.push('');
    p('Each file contains `breakpoint.width` and `font.size-*` overrides for sizes that change at that breakpoint. Only scaled sizes (headings) change — fixed interface/paragraph sizes stay constant.');
    p('**In Figma:** Create a single Breakpoint collection with 5 modes. Font size tokens change per mode; heading composites resolve automatically.');
    p('**Component switching:** S = Mobile, M+ = Desktop. Use these modes to switch component variants (e.g. mobile nav → desktop nav).');
  }

  /* Optional: Accessibility only */
  if (optContrast && !optColors) {
    h2('Accessibility Collection');
    h3('semantic.accessibility.high-contrast.tokens.json');
    p('Overrides `contrast-secondary` shade assignments for brand, accent, and feedback colors. Selects shades that meet WCAG AAA (7:1) contrast ratio instead of AA (4.5:1).');
    p('**Implementation:** Load after semantic.tokens.json. Overrides the same `semantic.color.*.themed.contrast-secondary` and `.inverted.contrast-secondary` keys with higher-contrast shade references. All downstream component tokens resolve automatically.');
  }

  /* Optional: Colors only */
  if (optColors && !optContrast) {
    h2('Color Collections');
    p('Each brand, accent, and combo color is exported as a separate switchable collection:');
    Object.keys(colorCollections).forEach(key => {
      li('`semantic.colors.' + key + '.tokens.json`');
    });
    archLines.push('');
    p('Each file contains `semantic.color.[key].themed.*` and `.inverted.*` — the full set of base, base-higher, base-lower, contrast-primary, and contrast-secondary assignments.');
    p('**Implementation:** These are alternative semantic sets. In Figma, create a variable collection per color with modes "themed" and "inverted". Components referencing `semantic.color.[key].*` will resolve to whichever collection is active.');
  }

  /* Optional: Colors + Accessibility combined */
  if (optColors && optContrast) {
    h2('Accessibility + Color Collections (Combined)');

    h3('Resolve Order With Both Active');
    code('Core → Semantic (Light/Dark) → Accessibility (High Contrast) → Color Collections → Component');
    p('High Contrast sits BETWEEN Semantic and Color Collections. This means:');
    li('Color Collections reference semantic tokens');
    li('When HC is active, it overrides the semantic shade assignments');
    li('Color Collections inherit the HC-adjusted values automatically');
    archLines.push('');

    h3('semantic.accessibility.high-contrast.tokens.json');
    p('Overrides `contrast-secondary` shade assignments to meet WCAG AAA (7:1). Applies to all brand, accent, and feedback colors.');
    p('**Key:** This file overrides semantic tokens. Color Collections that reference these semantic tokens will automatically pick up the HC values when HC is active.');

    h3('Color Collection Files');
    Object.keys(colorCollections).forEach(key => {
      li('`semantic.colors.' + key + '.tokens.json`');
    });
    archLines.push('');
    p('Each contains themed + inverted assignments. When HC is also active, the shades referenced by these collections are the HC-adjusted ones.');

    h3('Implementation Note');
    p('Accessibility MUST resolve before Color Collections in every tool. See the Reference Chain section above for the general principle. Platform-specific details:');
    li('**Figma:** Create the HC collection before color collections in the variable resolve order');
    li('**CSS:** Load stylesheets in order — semantic → HC → color collections');
    li('**Tokens Studio / Style Dictionary:** Set source file order so HC processes first');
    archLines.push('');
    p('See Tool Conventions (`~/.claude/resources/Tool Conventions/`) for full implementation guides.');
  }

  /* ── Parameters (tool state snapshot for reverse intake) ── */
  h2('Parameters');
  p('Current tool state at export time. Use these to reconstruct the URL hash or pre-fill the tool on re-import.');
  archLines.push('');

  h3('Multipliers');
  archLines.push('| Parameter | Value |');
  archLines.push('|---|---|');
  for (const [urlKey, elId] of Object.entries(URL_PARAM_MAP)) {
    const el = document.getElementById(elId);
    if (el) archLines.push(`| ${urlKey} | ${el.value} |`);
  }
  archLines.push('');

  h3('Brand Colors');
  archLines.push('| Key | Hex |');
  archLines.push('|---|---|');
  for (const c of COLORS.brand) {
    archLines.push(`| ${c.key} | ${c.hex} |`);
  }
  archLines.push('');

  if (COLORS.accent.length > 0) {
    h3('Accent Colors');
    archLines.push('| Key | Hex |');
    archLines.push('|---|---|');
    for (const c of COLORS.accent) {
      archLines.push(`| ${c.key} | ${c.hex} |`);
    }
    archLines.push('');
  }

  h3('Foundation Colors');
  archLines.push('| Token | Hex |');
  archLines.push('|---|---|');
  archLines.push(`| lightClear | ${FOUNDATION.lightClear.hex} |`);
  archLines.push(`| lightCloudy | ${FOUNDATION.lightCloudy.hex} |`);
  archLines.push(`| darkClear | ${FOUNDATION.darkClear.hex} |`);
  archLines.push(`| darkCloudy | ${FOUNDATION.darkCloudy.hex} |`);
  archLines.push('');

  h3('URL Hash');
  p('Paste this after the HTML file path to restore all settings:');
  code(window.location.hash || '(no hash — default values)');

  /* Download architecture file */
  const archBlob = new Blob([archLines.join('\n')], { type: 'text/markdown' });
  const archA = document.createElement('a');
  archA.href = URL.createObjectURL(archBlob);
  archA.download = 'README.md';
  archA.style.display = 'none';
  document.body.appendChild(archA);
  setTimeout(() => { archA.click(); setTimeout(() => { document.body.removeChild(archA); URL.revokeObjectURL(archA.href); }, 200); }, delay);
}

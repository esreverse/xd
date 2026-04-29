/* Maintained via /xd-brand-visual-identity · Updated: 2026-03-24 · Version: 1 */
/* ================================================================
   EXPORT TOKENS — generates 4 DTCG JSON files
   ================================================================ */

async function exportTokens() {
  try { return await _exportTokensImpl(); } catch (e) { console.error('Export error:', e); alert('Export failed: ' + e.message + '\n\nSee browser console (F12) for stack trace.'); }
}
async function _exportTokensImpl() {
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
  const dA_tertiary  = 40;
  const dA_shine     = 10;
  const dA_subtle    = findAlpha(_dc, _lc, 0.05, 1.1, _lc);
  const dA_dash      = 15;                                        /* fixed 15% for dashes/lines */
  const lA_secondary    = findAlpha(_lc, _dc, 0.40, AA, _dk);
  const lA_tertiary  = 40;
  const lA_shine     = 10;
  const lA_subtle    = findAlpha(_lc, _dc, 0.05, 1.1, _dc);
  const lA_dash      = 15;                                        /* fixed 15% for dashes/lines */
  /* Store resolved alpha names for semantic references */
  const _dN = { secondary: dA_secondary.alpha, tertiary: dA_tertiary, shine: dA_shine, subtle: dA_subtle.alpha, dash: dA_dash };
  const _lN = { secondary: lA_secondary.alpha, tertiary: lA_tertiary, shine: lA_shine, subtle: lA_subtle.alpha, dash: lA_dash };
  /* Dark alpha tokens (dark fg on light bg) — token name = a[resolved alpha] */
  core.color.dark[`clear-a${_dN.secondary}`]    = col(rgbaBase(_dc, _dN.secondary / 100));
  core.color.dark[`clear-a${_dN.tertiary}`]     = col(rgbaBase(_dc, _dN.tertiary / 100));
  core.color.dark[`clear-a${_dN.shine}`]        = col(rgbaBase(_dc, _dN.shine / 100));
  core.color.dark[`clear-a${_dN.subtle}`]       = col(rgbaBase(_dc, _dN.subtle / 100));
  core.color.dark[`clear-a${_dN.dash}`]         = col(rgbaBase(_dc, _dN.dash / 100));
  /* Light alpha tokens (light fg on dark bg) */
  core.color.light[`clear-a${_lN.secondary}`]    = col(rgbaBase(_lc, _lN.secondary / 100));
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
    space: {},
    size: { icon: {}, action: {} },
    radius: {},
    border: { width: {} },
    typography: { interface: {}, paragraph: {}, heading: {}, caps: {}, code: {} },
    elevation: {},
    opacity: { enabled: { $value: '{core.opacity.100}', $type: 'number' }, disabled: { $value: '{core.opacity.40}', $type: 'number' } },
  };

  /* ── Semantic spacing (t-shirt → core grid unit = value/4) ── */
  const spKey = (name) => { const s = spacing.find(x => x.name === name); return s ? Math.round(s.val / 4) : 0; };
  const spRef = (name) => ({ $value: `{core.space.${spKey(name)}}`, $type: 'dimension' });
  semantic.space.none = spRef('0');
  ['2XS','XS','S','M','L','XL','2XL','3XL'].forEach(k => { if (spacing.find(x => x.name === k)) semantic.space[k] = spRef(k); });

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
      /* ── Outline / Ghost ──
         Base = visible color (outline + text); higher/lower = ±1 step for hover/pressed washes.
         Contrast = page canvas (foundation base-clear) since there is no filled surface. */
      const visibleBaseToken = `{semantic.color.${key}.${mode}.base}`;
      baseRef = col(visibleBaseToken);
      contrastRef2 = col(`{semantic.color.foundation.${mode}.base-clear}`);
      const palette = allBrandAccent;
      const colorDef = palette.find(c => c.key === key);
      if (colorDef) {
        const scale = getScale(colorDef.hex);
        let idx = closestIdx(colorDef.hex, scale);
        if (inv) { idx = scale.length - 1 - idx; if (idx < 0) idx = 0; }
        baseCk = ck; baseIdx = idx; baseScale = scale;
      } else {
        baseCk = ck; baseIdx = null;
      }
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

  /* ── Shared color helpers (used by brand/accent, feedback, combo) ── */

  /* Resolve themed/inverted indices from a brand index and scale */
  function resolveThemedInvertedIdx(hex, scale) {
    const brandIdx = closestIdx(hex, scale);
    let mirrorIdx = scale.length - 1 - brandIdx;
    if (mirrorIdx === brandIdx) mirrorIdx = Math.min(scale.length - 1, brandIdx + 1);
    const brandIsLight = fgPrimary(scale[brandIdx].hex) === FOUNDATION.darkClear.hex;
    let themedIdx   = brandIsLight ? brandIdx   : mirrorIdx;
    let invertedIdx = brandIsLight ? mirrorIdx  : brandIdx;
    const themedCpHex   = FOUNDATION.darkClear.hex;
    const invertedCpHex = FOUNDATION.lightClear.hex;
    /* Ensure AA (>= 4.5:1) between base and contrast-primary for both modes.
       Themed cp is dark → move base toward lighter (lower index) for more contrast.
       Inverted cp is light → move base toward darker (higher index) for more contrast. */
    while (themedIdx > 0 && contrastRatio(scale[themedIdx].hex, themedCpHex) < 4.5) themedIdx--;
    while (invertedIdx < scale.length - 1 && contrastRatio(scale[invertedIdx].hex, invertedCpHex) < 4.5) invertedIdx++;
    return { themedIdx, invertedIdx, themedCp: themedCpHex, invertedCp: invertedCpHex };
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

  /* Build a full color set (base, contrast-primary/secondary, with-on-foundation, surface+contrast) — 9 tokens */
  function buildColorSet(idx, cpHex, isLight, scale, ck) {
    const baseStep = scale[idx].step;
    const cpRef = hexToOklch(cpHex).L > 0.6 ? '{core.color.light.clear}' : '{core.color.dark.clear}';
    const ct2 = contrastTinted(scale[idx].hex, scale, cpHex);
    const csRef = ct2.fromScale ? `{core.color.${ck}.${closestStep(ct2.hex, scale)}}` : cpRef;
    return {
      tokens: {
        base: col(`{core.color.${ck}.${baseStep}}`),
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
    const bgStep = bgScale[bgIdx]?.step || '500';
    const fgStep = fgScale[fgIdx]?.step || '500';
    const bgHex  = bgScale[bgIdx]?.hex  || bgColor.hex;
    const fgHex  = fgScale[fgIdx]?.hex  || fgColor.hex;
    const bgIsLight = hexToOklch(bgHex).L > 0.6;
    const fgIsLight = hexToOklch(fgHex).L > 0.6;

    semantic.color[c.id] = {
      themed: {
        base:                 col(`{core.color.${bgCK}.${bgStep}}`),
        'contrast-primary':   col(contrastRef(bgHex)),
        'contrast-secondary': col(`{core.color.${fgCK}.${fgStep}}`),
        ...buildWithOnFoundation(bgIdx, bgScale, bgCK),
        ...buildSurfaceTokens(bgIsLight, bgScale, bgCK),
      },
      inverted: {
        base:                 col(`{core.color.${fgCK}.${fgStep}}`),
        'contrast-primary':   col(contrastRef(fgHex)),
        'contrast-secondary': col(`{core.color.${bgCK}.${bgStep}}`),
        ...buildWithOnFoundation(fgIdx, fgScale, fgCK),
        ...buildSurfaceTokens(fgIsLight, fgScale, fgCK),
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
     Themed/Inverted inherit the variant from the Default set (state.variant).
     ================================================================ */

  /* Build Default set from ACTION_STATE — references semantic.color.action tokens.
     The action tokens already have the I/S/T modifiers resolved:
     base = background color, contrast = foreground color.
     Variant comes from state.variant (user-configured).
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

  /* Build Themed + Inverted sets: foundation colors, variant inherited from Default set. */
  const themedSet = {};
  const invSet = {};
  ACTION_STATE.forEach(state => {
    const variant = state.variant;
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
          'padding-x':         ref('{semantic.space.M}'),
          'gap-icon-to-label': ref('{semantic.space.XS}'),
          icon:                ref('{semantic.size.icon.S}'),
          typography:          ref('{semantic.typography.interface.XS}'),
          'border-radius':     ref('{semantic.radius.M}'),
          'border-radius-pill': ref('{semantic.radius.pill}'),
        },
        M: {
          height:              ref('{semantic.size.action.M}'),
          'padding-x':         ref('{semantic.space.M}'),
          'gap-icon-to-label': ref('{semantic.space.XS}'),
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
          'padding-x':         ref('{semantic.space.S}'),
          'gap-icon-to-value': ref('{semantic.space.XS}'),
          'typography-value':  ref('{semantic.typography.interface.XS}'),
          'typography-label':  ref('{semantic.typography.interface.XS}'),
          'border-radius':     ref('{semantic.radius.M}'),
          'border-width':      ref('{semantic.border.width.S}'),
        },
        M: {
          height:              ref('{semantic.size.action.M}'),
          'padding-x':         ref('{semantic.space.S}'),
          'gap-icon-to-value': ref('{semantic.space.XS}'),
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
        'padding-x':            ref('{semantic.space.M}'),
        'padding-y':            ref('{semantic.space.M}'),
        'gap-eyebrow-to-title': ref('{semantic.space.XS}'),
        'gap-title-to-body':    ref('{semantic.space.M}'),
        'gap-body-to-meta':     ref('{semantic.space.L}'),
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
        'wrapper-padding-top':    ref('{semantic.space.M}'),
        'h2-margin-before':       ref('{semantic.space.XL}'),
        'h3-margin-before':       ref('{semantic.space.L}'),
        'h4-margin-before':       ref('{semantic.space.M}'),
        'paragraph-margin-before': ref('{semantic.space.S}'),
        'list-margin-before':     ref('{semantic.space.S}'),
        'list-item-margin-before': ref('{semantic.space.XS}'),
        'media-margin-before':    ref('{semantic.space.L}'),
        'media-caption-margin-before': ref('{semantic.space.XS}'),
        'blockquote-margin-before': ref('{semantic.space.L}'),
        'codeblock-margin-before': ref('{semantic.space.M}'),
      },
    },
  };

  /* ================================================================
     OPTIONAL COLLECTIONS
     ================================================================ */

  const optBreakpoints = document.getElementById('export-breakpoints')?.checked;
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

  /* ── Build ZIP ── */
  const zip = new JSZip();
  const addJson = (obj, name) => zip.file(name, JSON.stringify(obj, null, 2));

  /* Base exports (always) */
  addJson(core, 'core.tokens.json');
  addJson(semantic, 'semantic.tokens.json');
  addJson(dark, 'semantic.theme.dark.tokens.json');
  addJson({ component }, 'component.tokens.json');

  /* Optional collections */
  if (breakpointModes) {
    Object.entries(breakpointModes).forEach(([bp, obj]) => {
      addJson(obj, `core.breakpoint.${bp.toLowerCase()}.tokens.json`);
    });
  }
  if (densityCompact) addJson(densityCompact, 'core.density.compact.tokens.json');
  if (document.getElementById('export-typography')?.checked) {
    addJson({
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
      addJson(obj, `semantic.colors.${key}.tokens.json`);
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
  const componentTarget = optColors ? 'Color Collection' : 'semantic';
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

  /* Optional: Colors */
  if (optColors) {
    h2('Color Collections');
    p('Each brand, accent, and combo color is exported as a separate switchable collection:');
    Object.keys(colorCollections).forEach(key => {
      li('`semantic.colors.' + key + '.tokens.json`');
    });
    archLines.push('');
    p('Each file contains `semantic.color.[key].themed.*` and `.inverted.*` — the 9-token role set: base, contrast-primary, contrast-secondary, surface, surface-contrast, with-light-primary, with-light-secondary, with-dark-primary, with-dark-secondary.');
    p('**Implementation:** Create ONE Colors variable collection in Figma. Each brand/accent/combo color becomes a **mode** in that collection (e.g. modes: Brand A, Brand B, Accent A, Accent B, Accent C). All modes contain the same semantic token keys with their respective color values. Apply the Full Proxy Rule: pass through all other semantic color tokens (foundation, feedback, action) as identical aliases in every mode.');
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

  h3('Feedback Colors');
  archLines.push('| Key | Hex |');
  archLines.push('|---|---|');
  for (const c of COLORS.feedback) {
    archLines.push(`| ${c.key} | ${c.hex} |`);
  }
  archLines.push('');

  h3('Design Decisions');
  archLines.push('| Parameter | Value |');
  archLines.push('|---|---|');
  document.querySelectorAll('.export-overlay-radio-row input[type="radio"][name^="dd-"]:checked').forEach(radio => {
    archLines.push(`| ${radio.name} | ${radio.value} |`);
  });
  archLines.push('');

  h3('URL Hash');
  p('Paste this after the HTML file path to restore all settings:');
  code(window.location.hash || '(no hash — default values)');

  /* ── DESIGN.md (Google Stitch format) ── */
  const dLines = [];
  const dh1 = (t) => dLines.push(`# ${t}`, '');
  const dh2 = (t) => dLines.push('', '', `## ${t}`, '');
  const dh3 = (t) => dLines.push('', '', `### ${t}`, '');
  const dp = (t) => dLines.push(t, '');

  const styleNameVal = document.getElementById('export-style-name').value.trim() || 'Untitled Style';
  const styleDescVal = document.getElementById('export-style-desc').value.trim();

  dh1('DESIGN.md');
  dp('> Generated by xd-design-tokens-create');
  dp('> All values below reflect the current parametric state. Token names reference the exported DTCG files (core.tokens.json, semantic.tokens.json, component.tokens.json).');

  /* Section 0: Context */
  if (styleDescVal) {
    dh2('0. Context');
    dp(styleDescVal);
  }

  /* Section 1: Visual Theme & Atmosphere — Design Decisions */
  dh2('1. Visual Theme & Atmosphere');
  dp('Design decisions that go beyond what design tokens can capture. Only selected decisions are listed — unset parameters are left to the designer\'s judgement.');

  const ddGroups = {};
  document.querySelectorAll('.export-overlay-radio-row input[type="radio"][name^="dd-"]:checked').forEach(radio => {
    const group = radio.closest('.export-overlay-group');
    const groupTitle = group ? group.querySelector('.export-overlay-group-title')?.textContent : 'Other';
    if (!ddGroups[groupTitle]) ddGroups[groupTitle] = [];
    const paramTitle = radio.closest('.export-overlay-param')?.querySelector('.export-overlay-param-title')?.textContent || radio.name;
    const label = radio.parentElement?.textContent?.trim() || radio.value;
    const desc = radio.dataset.desc || '';
    ddGroups[groupTitle].push(`- **${paramTitle}:** ${label} — ${desc}`);
  });

  for (const [group, items] of Object.entries(ddGroups)) {
    dh3(group);
    items.forEach(item => dLines.push(item));
    dLines.push('');
  }

  /* ── Section 2: Color Palette & Roles ── */
  dh2('2. Color Palette & Roles');
  dp('Semantic color assignments with hex values. All colors reference `semantic.tokens.json` roles. Light mode values shown; dark mode inverts foundation pairs automatically.');

  dh3('Foundation');
  dLines.push(
    '| Token | Role | Light | Dark |',
    '|-------|------|-------|------|',
    `| \`foundation.themed.base-clear\` | Clear light/dark backgrounds | \`${FOUNDATION.lightClear.hex}\` | \`${FOUNDATION.darkClear.hex}\` |`,
    `| \`foundation.themed.base-cloudy\` | Cloudy light/dark backgrounds | \`${FOUNDATION.lightCloudy.hex}\` | \`${FOUNDATION.darkCloudy.hex}\` |`,
    `| \`foundation.themed.base-higher\` | Elevated surfaces | \`${FOUNDATION.lightClear.hex}\` | \`${FOUNDATION.darkCloudy.hex}\` |`,
    `| \`foundation.themed.base-lower\` | Background, base surfaces | \`${FOUNDATION.lightCloudy.hex}\` | \`${FOUNDATION.darkClear.hex}\` |`,
    `| \`foundation.themed.contrast-primary\` | Primary text, headings | \`${FOUNDATION.darkClear.hex}\` | \`${FOUNDATION.lightClear.hex}\` |`,
    `| \`foundation.themed.contrast-secondary\` | Secondary text, labels | \`${rgbaBase(_dc, _dN.secondary / 100)}\` | \`${rgbaBase(_lc, _lN.secondary / 100)}\` |`,
    `| \`foundation.themed.contrast-tertiary\` | Placeholder text, disabled | \`${rgbaBase(_dc, _dN.tertiary / 100)}\` | \`${rgbaBase(_lc, _lN.tertiary / 100)}\` |`,
    `| \`foundation.themed.focus\` | Focus rings | \`${(COLORS.feedback.find(c => c.key === 'info') || {hex:'#3B82F6'}).hex}\` | (auto) |`,
    `| \`foundation.themed.dash\` | Dividers, borders | \`${rgbaBase(_dc, _dN.dash / 100)}\` | \`${rgbaBase(_lc, _lN.dash / 100)}\` |`,
    `| \`foundation.themed.base-shine\` | Subtle highlight overlay | \`${rgbaBase(_lc, 0.10)}\` | \`${rgbaBase(_lc, 0.10)}\` |`,
    `| \`foundation.themed.base-shade\` | Subtle shadow overlay | \`${rgbaBase(_dc, 0.10)}\` | \`${rgbaBase(_dc, 0.10)}\` |`,
    ''
  );

  dh3('Foundation (Inverted)');
  dp('Inverted tokens swap the theme — light tokens resolve to dark values and vice versa. Used for contrast sections, tooltips, and inverted UI elements.');
  dLines.push(
    '| Token | Role | Light | Dark |',
    '|-------|------|-------|------|',
    `| \`foundation.inverted.base-clear\` | Clear dark/light backgrounds | \`${FOUNDATION.darkClear.hex}\` | \`${FOUNDATION.lightClear.hex}\` |`,
    `| \`foundation.inverted.base-cloudy\` | Cloudy dark/light backgrounds | \`${FOUNDATION.darkCloudy.hex}\` | \`${FOUNDATION.lightCloudy.hex}\` |`,
    `| \`foundation.inverted.contrast-primary\` | Primary text on inverted background | \`${FOUNDATION.lightClear.hex}\` | \`${FOUNDATION.darkClear.hex}\` |`,
    `| \`foundation.inverted.contrast-secondary\` | Secondary text on inverted background | \`${rgbaBase(_lc, _lN.secondary / 100)}\` | \`${rgbaBase(_dc, _dN.secondary / 100)}\` |`,
    ''
  );

  /* Resolve an alias chain {core.color.xxx.step} to a hex via the core scale map */
  function resolveTokenHex(tokenPath, parentObj) {
    const parts = tokenPath.split('.');
    let node = parentObj;
    for (const p of parts) { if (!node || typeof node !== 'object') return null; node = node[p]; }
    if (!node) return null;
    const v = node.$value || node;
    if (typeof v !== 'string') return null;
    const m = v.match(/\{core\.color\.([^.]+)\.([^}]+)\}/);
    if (!m) return v.startsWith('#') ? v : null;
    const [, ck, step] = m;
    const scale = core.color?.[ck];
    if (!scale) return null;
    const stepNode = scale[step];
    if (!stepNode) return null;
    const sv = stepNode.$value || stepNode;
    return typeof sv === 'string' ? sv : null;
  }

  const roleOrder = ['base','contrast-primary','contrast-secondary','surface','surface-contrast','with-light-primary','with-light-secondary','with-dark-primary','with-dark-secondary'];
  const roleUse = {
    base: 'Brand color base',
    'contrast-primary': 'Primary text on brand color',
    'contrast-secondary': 'Secondary text on brand color',
    surface: 'Light brand color as background',
    'surface-contrast': 'Dark brand color on surface',
    'with-light-primary': 'Primary brand color on light foundation',
    'with-light-secondary': 'Secondary brand color on light foundation',
    'with-dark-primary': 'Primary brand color on dark foundation',
    'with-dark-secondary': 'Secondary brand color on dark foundation',
  };

  function roleTableRowsFor(tokenPrefix, semanticNode) {
    const rows = [];
    roleOrder.forEach(role => {
      const node = semanticNode?.[role];
      if (!node) return;
      const v = node.$value || node;
      const hex = (typeof v === 'string' && v.startsWith('#')) ? v : resolveTokenHex(`color.${tokenPrefix}.themed.${role}`, semantic) || '—';
      rows.push(`| \`${tokenPrefix}.themed.${role}\` | ${hex} | ${roleUse[role] || ''} |`);
    });
    return rows;
  }

  dh3('Brand Colors');
  dp('Each brand color generates a full OKLCH 11-step scale (50–950) in `core.tokens.json`. Semantic tokens reference the scale step closest to the defined hex. Each color exposes the full 9-token role set below.');
  COLORS.brand.forEach(c => {
    dLines.push(`**${c.name || c.key}** — source \`${c.hex}\``, '');
    dLines.push('| Token | Hex | Use |', '|-------|-----|-----|');
    dLines.push(...roleTableRowsFor(c.key, semantic.color[c.key]?.themed));
    dLines.push('');
  });
  dLines.push('Each brand/accent color also has `inverted` variants that swap base and contrast roles for dark-on-light vs. light-on-dark contexts.', '');

  if (COLORS.accent.length > 0) {
    dh3('Accent Colors');
    dp('Optional additional colors beyond the brand palette. Same OKLCH scale generation and 9-token role set as brand colors.');
    COLORS.accent.forEach(c => {
      dLines.push(`**${c.name || c.key}** — source \`${c.hex}\``, '');
      dLines.push('| Token | Hex | Use |', '|-------|-----|-----|');
      dLines.push(...roleTableRowsFor(c.key, semantic.color[c.key]?.themed));
      dLines.push('');
    });
  }

  dh3('Feedback Colors');
  dp('Semantic status colors. Same 9-token role set as brand/accent.');
  const feedbackUse = { info: 'Informational messages, links', success: 'Success states, confirmations', warning: 'Warnings, caution states', error: 'Errors, destructive actions' };
  COLORS.feedback.forEach(c => {
    dLines.push(`**${c.name || c.key}** (${feedbackUse[c.key] || ''}) — source \`${c.hex}\``, '');
    dLines.push('| Token | Hex | Use |', '|-------|-----|-----|');
    dLines.push(...roleTableRowsFor(`feedback.${c.key}`, semantic.color.feedback?.[c.key]?.themed));
    dLines.push('');
  });

  dh3('Action Colors');
  dLines.push(
    '| Token | Role | Value |',
    '|-------|------|-------|',
    '| `action.primary.themed.base` | Primary action background | = `brand-a.themed.base` |',
    '| `action.primary.themed.contrast` | Primary action text | = `brand-a.themed.contrast-primary` |',
    '| `action.destructive.themed.base` | Destructive action background | = `feedback.error.themed.base` |',
    '| `action.destructive.themed.contrast` | Destructive action text | = `feedback.error.themed.contrast-primary` |',
    ''
  );

  if (typeof COMBO_STATE !== 'undefined' && COMBO_STATE.length > 0) {
    dh3('Combo Colors');
    dp('Pre-configured color pairings for content sections. Each combo assigns a background source + foreground source with specific shade steps. Same 9-token role set as brand/accent.');
    COMBO_STATE.forEach(c => {
      dLines.push(`**${c.id}** — bg \`${c.bgSource}\`, fg \`${c.fgSource}\`${c.use ? ' — ' + c.use : ''}`, '');
      dLines.push('| Token | Hex | Use |', '|-------|-----|-----|');
      dLines.push(...roleTableRowsFor(c.id, semantic.color[c.id]?.themed));
      dLines.push('');
    });
  }

  /* ── Section 3: Typography Rules ── */
  dh2('3. Typography Rules');
  dp('Font families, weights, and the complete type scale. All values reference `core.tokens.json` and `semantic.tokens.json`.');

  dh3('Font Families');
  dLines.push(
    '| Token | Stack | Use |',
    '|-------|-------|-----|',
    `| \`core.font.family-sans\` | \`${sansStack}\` | ${pairing.startsWith('sans') ? 'Headings' : 'Body/UI'} |`,
    `| \`core.font.family-serif\` | \`${serifStack}\` | ${pairing.startsWith('serif') ? 'Headings' : 'Display/accent'} |`,
    `| \`core.font.family-interface\` | (= ${interfaceType}) | UI elements, labels, body |`,
    `| \`core.font.family-mono\` | \`${monoStack}\` | Code, technical values |`,
    ''
  );

  dh3('Font Weights');
  dLines.push('| Token | Value | Use |', '|-------|-------|-----|');
  WEIGHT_SCALE.forEach(ws => {
    let use = '';
    if (ws.val === w.base) use = 'Body text, paragraphs';
    else if (ws.val === w.heading) use = 'Headings';
    else if (ws.val === 300) use = 'Decorative, large display';
    else if (ws.val === 500) use = 'Subtle emphasis';
    else if (ws.val === 700) use = 'Strong emphasis';
    else if (ws.val === 800) use = 'Extra bold emphasis';
    dLines.push(`| \`core.font.weight-${ws.name}\` | ${ws.val} | ${use} |`);
  });
  dLines.push('');

  dh3('Type Scale');
  dp(`Sizes are parametric (scale hierarchy parameter \`sh\`). Values shown at current \`sh = ${sh}\`. Fixed sizes stay constant regardless of \`sh\`; scaled sizes grow/shrink with the parameter.`);
  dLines.push('| Token | Category | Size | Fixed | Line Height | Use |', '|-------|----------|------|-------|-------------|-----|');
  const typoMeta = [
    { cat: 'heading', sizes: ['2XL','XL','L','M','S'], lh: 'heading', fixed: (s) => s === 'S', uses: { '2XL': 'Page titles, hero headlines', 'XL': 'Section headings', 'L': 'Subsection headings', 'M': 'Card titles, group headers', 'S': 'Small headings, labels' } },
    { cat: 'interface', sizes: ['XL','L','M','S','XS'], lh: 'interface', fixed: () => true, uses: { 'XL': 'Large UI elements', 'L': 'Navigation, prominent labels', 'M': 'Default body text, buttons', 'S': 'Secondary labels, metadata', 'XS': 'Captions, badges, timestamps' } },
    { cat: 'paragraph', sizes: ['XL','L','M','S','XS'], lh: 'paragraph', fixed: () => true, uses: { 'XL': 'Lead paragraphs, intros', 'L': 'Featured body text', 'M': 'Default long-form reading', 'S': 'Footnotes, fine print', 'XS': 'Legal text, disclaimers' } },
    { cat: 'caps', sizes: ['L','M','S'], lh: 'interface', fixed: () => true, uses: { 'L': 'Prominent category labels', 'M': 'Section labels, tab headers', 'S': 'Overlines, label categories' } },
    { cat: 'code', sizes: ['M'], lh: 'paragraph', fixed: () => true, uses: { 'M': 'Code blocks, token values' } },
  ];
  const lhValues = { heading: parseFloat((1.0 * lh).toFixed(2)), interface: parseFloat((1.1 * lh).toFixed(2)), paragraph: parseFloat((1.4 * lh).toFixed(2)) };
  const dTypoSizeIdx = {
    'caps.S': 0, 'caps.M': 1, 'caps.L': 2,
    'interface.XS': 1, 'interface.S': 2, 'interface.M': 3, 'interface.L': 4, 'interface.XL': 5,
    'paragraph.XS': 1, 'paragraph.S': 2, 'paragraph.M': 3, 'paragraph.L': 4, 'paragraph.XL': 5,
    'heading.S': 5, 'heading.M': 6, 'heading.L': 7, 'heading.XL': 8, 'heading.2XL': 9,
    'code.M': 3,
  };
  typoMeta.forEach(group => {
    group.sizes.forEach(size => {
      const idx = dTypoSizeIdx[`${group.cat}.${size}`];
      const px = idx != null && typo[idx] ? typo[idx].size : '?';
      const isFixed = group.fixed(size);
      dLines.push(`| \`semantic.typography.${group.cat}.${size}\` | ${group.cat.charAt(0).toUpperCase() + group.cat.slice(1)} | ${px}px | ${isFixed ? 'yes' : 'no'} | ${lhValues[group.lh]}× | ${group.uses[size]} |`);
    });
  });
  dLines.push('');
  dp('**Category semantics:** Interface = compact UI (buttons, labels, nav). Paragraph = reading text (articles, descriptions). Caps = uppercase labels (always letter-spaced). Code = monospaced technical content.');

  dh3('Line Heights');
  dp('Line-height values are unitless multipliers of font-size. Never use px or %.');
  dLines.push(
    '| Token | Value | Use |',
    '|-------|-------|-----|',
    `| \`core.font.lineHeight-heading\` | ${lhValues.heading} | Headings — tight |`,
    `| \`core.font.lineHeight-interface\` | ${lhValues.interface} | UI elements — compact |`,
    `| \`core.font.lineHeight-paragraph\` | ${lhValues.paragraph} | Reading text — comfortable |`,
    ''
  );

  dh3('Paragraph Spacing');
  dp(`Paragraph spacing is parametric (\`ph\`). At current \`ph = ${ph}\`, the space between paragraphs equals \`16 × ${ph}\` = ${Math.round(16 * ph)}px. This is separate from line height and only applies between block-level text elements.`);

  /* Section 4 (Component Tokens) removed by design: component tokens live in component.tokens.json and are not surfaced in DESIGN.md. */
  if (false) {
  dh2('4. Component Tokens');
  dp('Styling rules for interactive elements. All tokens reference `component.tokens.json`.');

  dh3('Buttons');
  /* Primary (Solid) */
  dp('**Primary (Solid)**');
  const _radM = radius.M != null ? radius.M : 4;
  const _padM = spacing.find(s => s.name === 'M')?.val || 16;
  const _padXS = spacing.find(s => s.name === 'XS')?.val || 8;
  const _bwS = borders.find ? borders[2]?.val || 1 : 1;
  dLines.push(
    '| Property | Token | Value |',
    '|----------|-------|-------|',
    '| Background | `component.button.primary.themed.bg` | = `action.primary.themed.base` |',
    '| Text | `component.button.primary.themed.fg` | = `action.primary.themed.contrast` |',
    `| Border radius | \`component.button.primary.radius\` | = \`semantic.radius.M\` (${_radM}px) |`,
    `| Padding X | \`component.button.primary.padding-x\` | = \`semantic.space.M\` (${_padM}px) |`,
    '| Font | `semantic.typography.interface.M` | ' + (typo[3]?.size || 16) + 'px |',
    '| Disabled | opacity 0.4 | — |',
    '| Focus | `semantic.elevation.focus` | Focus ring |',
    ''
  );

  dp('**Secondary (Outline)**');
  dLines.push(
    '| Property | Token | Value |',
    '|----------|-------|-------|',
    '| Background | transparent | — |',
    '| Text | color source base | — |',
    `| Border width | \`semantic.border.width.M\` | ${borders[3]?.val || 1.5}px |`,
    '| Border color | color source base | — |',
    ''
  );

  dp('**Tertiary (Ghost)**');
  dLines.push(
    '| Property | Token | Value |',
    '|----------|-------|-------|',
    '| Background | transparent | — |',
    '| Text | color source base | — |',
    '| Border | none | — |',
    ''
  );

  dh3('Cards');
  const _radL = radius.L != null ? radius.L : 8;
  const _padL = spacing.find(s => s.name === 'L')?.val || 24;
  dLines.push(
    '| Property | Token | Value |',
    '|----------|-------|-------|',
    '| Background | `component.card.themed.bg` | = `foundation.themed.base-cloudy` |',
    `| Border radius | \`component.card.radius\` | = \`semantic.radius.L\` (${_radL}px) |`,
    `| Padding | \`component.card.padding\` | = \`semantic.space.L\` (${_padL}px) |`,
    '| Shadow | `component.card.elevation` | = `semantic.elevation.1` |',
    `| Border | \`component.card.border-width\` | = \`semantic.border.width.XS\` (${borders[1]?.val || 0.5}px) |`,
    '| Border color | `component.card.themed.border` | = `foundation.themed.dash` |',
    ''
  );

  dh3('Input Fields');
  const _radMi = radius.M != null ? radius.M : 4;
  dLines.push(
    '| Property | Token | Value |',
    '|----------|-------|-------|',
    '| Background | `component.input.themed.bg` | = `foundation.themed.base-clear` |',
    `| Border | \`component.input.border-width\` | = \`semantic.border.width.S\` (${borders[2]?.val || 1}px) |`,
    '| Border color | `component.input.themed.border` | = `foundation.themed.dash` |',
    `| Border radius | \`component.input.radius\` | = \`semantic.radius.M\` (${_radMi}px) |`,
    '| Text | `component.input.themed.fg` | = `foundation.themed.contrast-primary` |',
    '| Placeholder | `component.input.themed.placeholder` | = `foundation.themed.contrast-tertiary` |',
    `| Label | \`semantic.typography.interface.S\` | ${typo[2]?.size || 14}px, above field |`,
    `| Helper | \`semantic.typography.interface.XS\` | ${typo[1]?.size || 12}px, below field |`,
    '| Focus border | `component.input.themed.focus-border` | = `foundation.themed.focus` |',
    '| Focus ring | `semantic.elevation.focus` | Focus ring |',
    '| Error border | `component.input.themed.error-border` | = `feedback.error.themed.base` |',
    '| Error helper | `component.input.themed.error-text` | = `feedback.error.themed.base` |',
    ''
  );

  } /* end of removed Section 4 */

  /* ── Section 4: Layout & Spacing ── */
  dh2('4. Layout & Spacing');
  dp('Spacing scale, sizing, radius, and borders. Spacing/sizing snap to a 4px grid; border widths allow 0.5px sub-pixel values.');

  dh3('Spacing Scale');
  dp(`Parametric via \`space_factor\` (\`sf\`). Values shown at current \`sf = ${sf}\`.`);
  dLines.push('| Token | Name | Value | Use |', '|-------|------|-------|-----|');
  const spUse = { '0': 'No spacing', '2XS': 'Tight internal gaps', 'XS': 'Icon gaps, inline spacing', 'S': 'Related element spacing', 'M': 'Default component padding', 'L': 'Group spacing, card padding', 'XL': 'Section spacing', '2XL': 'Major section breaks', '3XL': 'Page section separators' };
  spacing.forEach(s => {
    dLines.push(`| \`semantic.space.${s.name}\` | ${s.name} | ${s.val}px | ${spUse[s.name] || ''} |`);
  });
  dLines.push('', 'One flat T-shirt scale. Usage (padding, gap, margin) is determined by the consumer — component tokens or layout.', '', 'For page-level whitespace beyond 3XL, use **layout tokens** rather than extending the scale.', '');

  dh3('Sizing Scale');
  dp(`Parametric via \`dimension_factor\` (\`df\`). Values shown at current \`df = ${df}\`.`);
  dLines.push('| Token | Name | Value | Use |', '|-------|------|-------|-----|');
  const szUse = { 'icon.S': 'Inline icons', 'icon.M': 'Default icons', 'icon.L': 'Prominent icons', 'icon.XL': 'Feature icons, illustrations', 'action.XS': 'Compact touch targets', 'action.S': 'Small buttons, tags', 'action.M': 'Default buttons, inputs', 'action.L': 'Prominent actions', 'action.XL': 'Hero CTAs' };
  sizing.forEach(s => {
    const [group, size] = s.name.split('.');
    dLines.push(`| \`semantic.size.${s.name}\` | ${group.charAt(0).toUpperCase() + group.slice(1)} ${size} | ${s.val}px | ${szUse[s.name] || ''} |`);
  });
  dLines.push('');

  dh3('Radius Scale');
  dp(`Parametric via \`roundness_factor\` (\`rf\`). Values snap to the radius scale \`[0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64]\`. Values shown at current \`rf = ${rf}\`.`);
  dLines.push('| Token | Name | Value | Use |', '|-------|------|-------|-----|');
  dLines.push('| `semantic.radius.none` | None | 0px | Sharp corners |');
  const radUse = { 'S': 'Subtle rounding (badges)', 'M': 'Buttons, inputs, chips', 'L': 'Cards, modals', 'XL': 'Large containers', '2XL': 'Hero sections' };
  ['S','M','L','XL','2XL'].forEach(k => {
    if (radius[k] != null) dLines.push(`| \`semantic.radius.${k}\` | ${k} | ${radius[k]}px | ${radUse[k] || ''} |`);
  });
  dLines.push('| `semantic.radius.pill` | Pill | 9999px | Pills, tags, full-round |', '');

  dh3('Border Width Scale');
  dp(`Parametric via \`border_width\` multiplier (\`bw\`). Values shown at current \`bw = ${bw}\`.`);
  dLines.push('| Token | Name | Value | Use |', '|-------|------|-------|-----|');
  const bwUse = { 'none': 'No border', 'XS': 'Hairline dividers', 'S': 'Default borders', 'M': 'Emphasized borders', 'L': 'Strong outlines', 'XL': 'Accent borders', '2XL': 'Heavy decorative borders' };
  borders.forEach(b => {
    dLines.push(`| \`semantic.border.width.${b.name}\` | ${b.name} | ${b.val}px | ${bwUse[b.name] || ''} |`);
  });
  dLines.push('');

  /* ── Section 5: Depth & Elevation ── */
  dh2('5. Depth & Elevation');
  dp('Shadow system and surface hierarchy. Shadow colors use foundation dark.clear at computed alpha levels (6%–18%) for consistent depth across themes.');
  dLines.push(
    '| Token | Level | Shadow | Use |',
    '|-------|-------|--------|-----|',
    '| `semantic.elevation.0` | 0 | none | Flat surfaces |',
    '| `semantic.elevation.1` | 1 | `0 1px 3px` @12%, `0 1px 2px` @8% | Cards, raised panels |',
    '| `semantic.elevation.2` | 2 | `0 4px 16px` @12%, `0 1px 4px` @6% | Popovers, dropdowns |',
    '| `semantic.elevation.3` | 3 | `0 8px 32px` @14%, `0 2px 8px` @8% | Modals, dialogs |',
    '| `semantic.elevation.4` | 4 | `0 16px 48px` @18%, `0 4px 16px` @10% | Toasts, notifications |',
    '| `semantic.elevation.focus` | Focus | `0 0 0 3px` focus color | Focus indicator ring |',
    ''
  );

  dh3('Surface Hierarchy');
  dLines.push(
    '| Level | Surface | Elevation | Token |',
    '|-------|---------|-----------|-------|',
    '| Base | Page background | 0 | `foundation.themed.base-clear` |',
    '| Raised | Cards, panels | 1 | `foundation.themed.base-cloudy` |',
    '| Floating | Dropdowns, popovers | 2 | `foundation.themed.base-clear` |',
    '| Overlay | Modals, dialogs | 3 | `foundation.themed.base-clear` |',
    '| Toast | Notifications | 4 | `foundation.themed.base-clear` |',
    ''
  );

  /* Section 6: Construction Rules (static) */
  dh2('6. Construction Rules');
  dp('Mandatory structural requirements for every design output, regardless of medium, scope, or context.');

  dh3('Reuse Mandate');
  dp('Before creating anything, inventory what already exists:');
  dLines.push(
    '1. **Variables/Tokens**: If Figma Variables, CSS custom properties, or token files exist — use them exclusively. Never hardcode any value. Never define core or semantic tokens, those collections are complete. Other optional collections (for e.g. breakpoints, density, typography, colors) may be edited if necessary. Always align with the user before CRUD-operations on tokens.',
    '2. **Components**: If a component library exists — use existing components. Only create new components when no suitable match exists. Check the library before building from primitives. Always align with the user before CRUD-operations on components.',
    '3. **Screens/Flows**: If screens or flows already exist in the project — follow their patterns. Match existing layout structures, spacing rhythms, and component usage. New screens should look like they belong to the same product.',
    ''
  );

  dh3('Layout Structure');
  dp('All layout must use **structured layout** — the tool\'s native layout engine (Auto Layout in Figma, Flexbox/Grid in CSS/HTML, layout containers in Pencil, etc.). The term "structured layout" is used throughout; apply the equivalent mechanism in the active tool.');
  dLines.push(
    '- **Containers always**: Every element lives inside a layout container. No loose shapes, text nodes, or ungrouped elements.',
    '- **Structured layout always**: Every container uses the tool\'s layout engine. No manual positioning inside layout containers.',
    '- **Full spectrum**: Structured layout covers everything from the outermost page container down to the smallest component — nested layouts at every level.',
    '- **Direction**: Choose horizontal, vertical, wrap, or grid based on content flow.',
    '- **Spacing**: Use gap tokens from Section 5. No manual offset hacks.',
    '- **Padding**: Use padding tokens from Section 4. Apply to container elements.',
    '- **Constraints**: Elements that must escape structured layout (floating buttons, overlays, fixed headers, sticky footers) use explicit positioning constraints — set to top-left, top-right, bottom-left, bottom-right, center, or stretch. Never leave positioning at default when position matters.',
    ''
  );

  dh3('Professional Quality');
  dp('The output must look like a shipped product, not a wireframe or rough prototype:');
  dLines.push(
    '- Pixel-perfect alignment (structured layout handles this automatically)',
    '- Correct typography hierarchy (heading > subheading > body > caption)',
    '- Realistic placeholder text — not "Lorem ipsum" (exception: long-form body where content is not the focus)',
    '- Proper image placeholders with aspect ratios matching intended content',
    '- All interactive states considered (default, hover, focus, active, disabled)',
    '- Edge cases handled (empty states, loading states, error states, overflow)',
    '- Consistent spacing throughout — no "eyeballed" gaps',
    ''
  );

  dh3('Token Usage Hierarchy');
  dp('Always reference the highest available token layer. On setup, inspect which token collections exist and use the topmost level available:');
  dLines.push(
    '1. **Semantic tokens** — Use for everything: layout, spacing, typography, colors on screens and pages (e.g. `semantic.space.M`, `foundation.themed.base-clear`). Semantic tokens are the default layer for all work — no scoped component-token layer exists in this system.',
    '2. **Optional collections** — Some projects have additional token sets (e.g. density, breakpoints, color overrides). When these exist, they override the semantic defaults for their scope. Check what\'s available before starting.',
    '3. **Core tokens** — Never reference directly. Core tokens are primitives consumed by the semantic layer. If you find yourself writing `core.color.brand-a.500`, use the semantic equivalent `brand-a.themed.base` instead.',
    ''
  );

  /* Section 7: Do's and Don'ts (static, expanded) */
  dh2('7. Do\'s and Don\'ts');
  dp('Design guardrails and anti-patterns.');

  dh3('Do');
  dLines.push(
    '- Use semantic tokens exclusively — never reference core tokens directly',
    '- Maintain minimum AA contrast (4.5:1) for all text on backgrounds',
    '- Use `contrast-primary` for headings and body text, `contrast-secondary` for labels and metadata',
    '- Keep spacing on the 4px grid — all spacing values snap to multiples of 4',
    '- Use elevation tokens for depth — never hardcode box-shadow values',
    '- Let the parametric system calculate values — adjust parameters, not individual tokens',
    '- Use `foundation.themed` tokens for theme-aware surfaces',
    '- Use `foundation.inverted` for contrast sections (e.g. dark footer on light page)',
    '- Use structured layout for every container — no manual positioning',
    '- Use existing variables/components before building new ones — align with the user on all CRUD-operations on variables and components',
    '- Set explicit positioning constraints on elements that break out of structured layout',
    '- Design for all relevant states (default, hover, focus, active, disabled, empty, loading, error)',
    ''
  );

  dh3('Don\'t');
  dLines.push(
    '- Don\'t hardcode hex values — always reference semantic tokens',
    '- Don\'t mix font families within a single text block',
    '- Don\'t use more than 3 elevation levels on a single screen',
    '- Don\'t use `contrast-tertiary` for readable text — it\'s only for placeholders and disabled states',
    '- Don\'t combine multiple brand colors on a single interactive element',
    '- Don\'t use the spacing scale for page-level layout gaps above 3XL — use layout tokens instead',
    '- Don\'t skip the themed/inverted pattern — even single-theme products should use it for future-proofing',
    '- Don\'t leave containers without structured layout (except canvas-level wrappers)',
    '- Don\'t create new components when an existing one can be configured via variants/props',
    '- Don\'t reference core tokens directly — always use the semantic layer equivalent',
    ''
  );

  /* Section 8: Design Scope (static) */
  dh2('8. Design Scope');
  dp('This DESIGN.md applies to any design context. The same tokens, construction rules, and quality bar apply whether the task is:');
  dLines.push(
    '| Context | What it means | Componentize? |',
    '|---------|---------------|---------------|',
    '| Design from image/reference | Reproduce the visual style using these tokens | Discuss with user |',
    '| Single component | Build one component following construction rules | Yes |',
    '| Atoms | Smallest elements (button, input, badge, icon) | Always — these are components by definition |',
    '| Molecules | Simple groups of atoms (search bar, form field with label) | Very likely — discuss with user |',
    '| Organisms | Complex sections (header, card grid, sidebar navigation) | Maybe — discuss with user |',
    '| Templates / Pages | Full screen layouts composed of organisms | No — compose from existing components |',
    '| Flows | Multi-screen sequences with transitions | No — compose from existing components |',
    ''
  );
  dp('**Componentization rule**: Not everything needs to become a reusable component. Atoms are always components. Molecules very likely. Organisms and above: discuss with the user whether reuse is expected. Templates, Pages, and Flows are compositions — they consume components but are not components themselves.');

  /* Section 9: Resolution Hierarchy (static) */
  dh2('9. Resolution Hierarchy');
  dp('When rules from different sources conflict, resolve in this order (highest wins):');
  dLines.push(
    '1. **This DESIGN.md** — Project-specific tokens and construction rules',
    '2. **Tool conventions** — Tool-specific structure and mechanics',
    '3. **Design principles** — General design knowledge',
    ''
  );
  dp('Example: A design principle says "cards can use shadows OR borders" but this DESIGN.md says "elevation = flat" — flat wins.');

  zip.file('DESIGN.md', dLines.join('\n'));

  /* Add README to ZIP */
  zip.file('README.md', archLines.join('\n'));

  /* Generate and download ZIP */
  const blob = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const styleName = document.getElementById('export-style-name').value.trim();
  a.download = (styleName ? styleName.replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase() : 'xd-visual-identity') + '.zip';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 200);
}

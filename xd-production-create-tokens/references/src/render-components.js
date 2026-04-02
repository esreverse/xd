/* ================================================================
   RENDER: Components
   ================================================================ */

/* Color palette: brand + accent, for legacy F/B number keys */
function colorPalette() { return [...COLORS.brand, ...COLORS.accent]; }

/* Unified palette: brand + accent + combos, for C number keys */
function unifiedPalette() {
  return [
    ...COLORS.brand.map(c => ({ key: c.key, type: 'brand' })),
    ...COLORS.accent.map(c => ({ key: c.key, type: 'accent' })),
    ...COMBO_STATE.map(c => ({ key: c.id, type: 'combo' })),
  ];
}

/* Hex to HSL string (uses existing rgbToHsl) */
function hexToHslStr(hex) {
  const { r, g, b } = hexToRgb(hex);
  const hsl = rgbToHsl(r, g, b);
  return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
}

const RADIUS_TOKENS = ['none', 'S', 'M', 'L', 'XL', '2XL', 'pill'];

function renderCards(f, w, r, defaultBrand, defaultScale, sh, sf, lh, ph, df) {
  const spacing  = calcSpacing(val('space'));
  const borders  = calcBorderWidth(Math.round(val('borderWidth')));
  const typo     = calcTypography(sh);
  const typoMap  = Object.fromEntries(typo.map(t => [t.name, t.size]));
  const sizing   = calcSizing(df || 1);
  const szMap    = Object.fromEntries(sizing.map(s => [s.name, s.val]));
  const _lh      = lh || 1.1;
  const _ph      = ph || 1.2;

  /* Parametric card tokens from spacing/typography scales */
  const sp = Object.fromEntries(spacing.map(s => [s.name, s.val]));
  const ct = {
    /* Typography — sizes */
    h1:     typoMap['heading.L']     || 28,
    h2:     typoMap['heading.M']     || 24,
    title:  typoMap['heading.S']     || 20,
    h3:     typoMap['interface.M']   || 16,
    body:   typoMap['interface.S']   || 14,
    meta:   typoMap['interface.XS']  || 12,
    caps:   typoMap['caps.S']        || 10,
    bigNum: typoMap['heading.2XL']   || 36,
    display: Math.round((typoMap['heading.2XL'] || 36) + 4 * (sh || 1)),
    /* Typography — line heights (match CSS custom properties in update.js) */
    lhH:  (1.0 * _lh).toFixed(2),   /* heading: --font-lineheight-heading */
    lhI:  (1.1 * _lh).toFixed(2),   /* interface: --font-lineheight-interface */
    lhP:  (1.4 * _lh).toFixed(2),   /* paragraph: --font-lineheight-paragraph */
    /* Typography — weights */
    wH:   w.heading || 700,          /* heading weight */
    wB:   w.base    || 400,          /* base weight */
    /* Spacing */
    gapXL: sp.XL || 32,
    gapL:  sp.L  || 20,
    gapM:  sp.M  || 16,
    gapS:  sp.S  || 12,
    gapXS: sp.XS || 8,
    gap2XS: sp['2XS'] || 4,
    /* Sizing — action heights for buttons */
    btnM:  szMap['action.M']  || 40,
    btnS:  szMap['action.S']  || 32,
    btnXS: szMap['action.XS'] || 24,
  };

  /* Resolve card tokens — two-color model consistent with buttons.
     bg + fg are the two controllable colors. Everything else derives:
     fgS = cloudy/base-lower variant of fg
     subtle = very faint variant of fg (for dividers/surfaces)
     brandHex/scale = accent color from colorSource (independent of I/S/T) */
  function resolveCardTokens(state) {
    const inv = state.inverted;

    /* Foundation clear + cloudy pairs */
    const fClear1 = isDark ? FOUNDATION.lightClear.hex  : FOUNDATION.darkClear.hex;   /* fg in themed */
    const fClear2 = isDark ? FOUNDATION.darkClear.hex   : FOUNDATION.lightClear.hex;   /* bg in themed */
    const fCloud1 = isDark ? FOUNDATION.lightCloudy.hex : FOUNDATION.darkCloudy.hex;
    const fCloud2 = isDark ? FOUNDATION.darkCloudy.hex  : FOUNDATION.lightCloudy.hex;

    /* Inverted flips the foundation sides */
    const baseFg    = inv ? fClear2 : fClear1;
    const baseBg    = inv ? fClear1 : fClear2;
    const cloudyFg  = inv ? fCloud2 : fCloud1;
    const cloudyBg  = inv ? fCloud1 : fCloud2;

    /* Resolve color source for accent/brand elements */
    let brandHex, brandScale;
    if (state.colorSource) {
      const src = state.colorSource;
      if (src.startsWith('combo-')) {
        const combo = COMBO_STATE.find(c => c.id === src);
        const sets = combo ? buildComboTokenSets(combo) : null;
        if (sets) {
          const set = inv ? sets.inverted : sets.themed;
          brandHex = set.base;
          brandScale = generateOklchScale(brandHex);
        }
      }
      if (!brandHex) {
        const palette = colorPalette();
        const color = palette.find(c => c.key === src);
        brandHex = color?.hex || defaultBrand;
        brandScale = color ? generateOklchScale(brandHex) : defaultScale;
      }
    } else {
      brandHex = defaultBrand;
      brandScale = defaultScale;
    }

    /* ================================================================
       I/S/T
       ================================================================
       I (Invert): Light↔Dark theme. bg/fg flip, brand shade mirrors.
       T (Tint):   Primary text (fg) → Secondary text (fgS).
       S (Swap):   Brand(color) ↔ fg(black). Only colors swap.
       ================================================================ */
    const swp = state.swapped;
    const tnt = state.tinted;

    /* ── Brand sets ── */
    const brandSets  = buildBrandTokenSets(brandHex);
    const set        = inv ? brandSets.themed : brandSets.inverted;
    const brandBase  = set.base;
    const brandBaseCp = set['contrast-primary'];

    /* ── Foundation: inv flips light/dark. Swap puts brand as card bg. ── */
    const bg  = swp ? brandBase : baseBg;
    const fg  = swp ? brandBaseCp : baseFg;
    const fgS = fgSecondary(bg).hex;
    const bgIsLight = hexToOklch(bg).L > 0.5;
    const subtle = bgIsLight ? 'rgba(20,20,18,0.06)' : 'rgba(250,250,248,0.08)';

    /* ── Tint: primary text → brand color (same as accent/caps/buttons) ── */
    const textFg = tnt ? brandBase : fg;

    /* ── Swap: brand ↔ white. Card bg=brand, accent=white, buttons=white ── */
    const accent   = swp ? baseBg : brandBase;
    const accentCp = swp ? baseFg : brandBaseCp;
    const bodyFg   = textFg;

    /* Buttons/badge: S → white bg + brand text */
    const btnBg  = swp ? baseBg : brandBase;
    const btnFg  = swp ? brandBase : brandBaseCp;

    /* Quote: S inverts — white bg + brand text (statt brand bg + white text) */
    const quoteBg = swp ? baseBg : brandBase;
    const quoteFg = swp ? brandBase : brandBaseCp;

    /* Border */
    const bwVal = borders[state.borderWidth]?.val || 0;
    const hasBorder = bwVal > 0;
    const borderColor = hasBorder ? (state.id === 'card-16' ? subtle : fg) : 'transparent';

    const px = spacing[state.paddingX]?.val ?? 16;
    const py = spacing[state.paddingY]?.val ?? 16;
    const radName = RADIUS_TOKENS[state.borderRadius] ?? 'M';
    const radVal = radName === 'none' ? 0 : radName === 'pill' ? 9999 : (r[radName] ?? r.M);
    const radPx = radVal + 'px';

    return {
      bg, fg, fgS, subtle, brandHex, brandScale,
      accent, accentCp, btnBg, btnFg, quoteBg, quoteFg, bodyFg,
      s100: brandScale[1]?.hex, s200: brandScale[2]?.hex, s300: brandScale[3]?.hex,
      s500: brandScale[5]?.hex, s700: brandScale[7]?.hex, s900: brandScale[9]?.hex,
      px, py, radPx, bwVal, borderColor, hasBorder,
    };
  }

  const card = (i, html, bgOverride, tokenInfo) => {
    const s = CARD_STATE[i];
    const t = resolveCardTokens(s);
    const bg = bgOverride || t.bg;
    const borderStyle = t.hasBorder ? `border:${t.bwVal}px solid ${t.borderColor};` : '';
    const tokenHtml = tokenInfo ? `<div class="comp-input-detail" style="margin-top:8px;padding:0 4px">${tokenInfo}</div>` : '';
    return `<div style="display:flex;flex-direction:column;min-height:0;flex:1"><div class="comp-card" data-card-id="${i}" style="background:${bg};${borderStyle}border-radius:${t.radPx};position:relative;padding:${t.py}px ${t.px}px;flex:1;display:flex;flex-direction:column">${html}</div>${tokenHtml}</div>`;
  };

  /* Shared helpers */
  const capsStyle = `font-family:${f.iface || f.body};font-weight:${ct.wH};font-size:${ct.meta}px;line-height:${ct.lhI};text-transform:uppercase;letter-spacing:0.08em`;
  const btnStyle = (rad, size) => `display:inline-flex;align-items:center;justify-content:center;height:${size || ct.btnS}px;padding:0 ${ct.gapM}px;border-radius:${rad};font-family:${f.iface || f.body};font-weight:${ct.wH};font-size:${ct.body}px;line-height:${ct.lhI}`;

  /* Job card HTML — shared by case 2 and 5 */
  const jobCardHtml = (t) => `<div style="display:flex;flex-direction:column;justify-content:space-between;height:100%"><div style="display:flex;flex-direction:column;gap:${ct.gapXS}px"><div style="${capsStyle};color:${t.accent}">JOB</div><div style="font-family:${f.body};font-weight:${ct.wH};font-size:${ct.h2}px;color:${t.bodyFg};line-height:${ct.lhH}">Proident culpa sit dolore ipsum sit tempor</div></div><div style="display:flex;justify-content:space-between;align-items:center"><div style="display:flex;flex-direction:column;gap:${ct.gap2XS}px"><div style="font-family:${f.body};font-weight:${ct.wH};font-size:${ct.h3}px;color:${t.bodyFg};line-height:${ct.lhI}">120 €/h</div><div style="font-family:${f.body};font-weight:${ct.wB};font-size:${ct.meta}px;color:${t.fgS};line-height:${ct.lhI}">Munich, Germany</div></div><div style="${btnStyle(r.S + 'px', ct.btnM)};background:${t.btnBg};color:${t.btnFg}">Apply now</div></div></div>`;

  const cards = CARD_STATE.map((s, i) => {
    const t = resolveCardTokens(s);
    switch (i) {
      /* 0: Product Card — image + caps category + title + price + pill button */
      case 0: return card(i, `<div style="flex:1;min-height:80px;background:${t.subtle};margin:-${t.py}px -${t.px}px 0"></div><div style="display:flex;flex-direction:column;gap:${ct.gapL}px;padding-top:${ct.gapL}px"><div style="display:flex;flex-direction:column;gap:${ct.gapXS}px"><div style="${capsStyle};color:${t.accent}">NIKE</div><div style="font-family:${f.body};font-weight:${ct.wB};font-size:${ct.body}px;color:${t.bodyFg};line-height:${ct.lhP}">Nike Dunk High "Green Satin" Sneakers</div></div><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:${f.body};font-weight:${ct.wB};font-size:${ct.meta}px;color:${t.fgS};line-height:${ct.lhI}">Price</div><div style="font-family:${f.body};font-weight:${ct.wH};font-size:${ct.h3}px;color:${t.bodyFg};line-height:${ct.lhI}">€ 120,00</div></div><div style="${btnStyle('9999px')};background:${t.btnBg};color:${t.btnFg}">Buy now</div></div></div>`);
      /* 1: News Card — image + caps + headline + body + meta */
      case 1: return card(i, `<div style="flex:1;min-height:120px;background:${t.subtle};border-radius:${r.L}px"></div><div style="display:flex;flex-direction:column;gap:${ct.gapXS}px;margin-top:${ct.gapL}px"><div style="${capsStyle};color:${t.accent}">POPULAR</div><div style="font-family:${f.body};font-weight:${ct.wH};font-size:${ct.h2}px;color:${t.bodyFg};line-height:${ct.lhH}">Proident culpa sit dolore</div><div style="font-family:${f.body};font-weight:${ct.wB};font-size:${ct.body}px;color:${t.bodyFg};line-height:${ct.lhP}">Consectetur non aliquip officia laborum enim. Incididunt occaecat id quis sunt id voluptate in adipisicing anim ipsum labore cillum. Labore in amet excepteur culpa aute mollit.<br>Consectetur qui tempor excepteur incididunt occaecat quis esse qui cillum minim elit minim.</div></div>`);
      /* 2: Job Card */
      case 2: return card(i, jobCardHtml(t));
      /* 3: Quote Card — brand bg, centered quote, author */
      case 3: return card(i, `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;flex:1;text-align:center;gap:${ct.gapXL}px"><div style="font-family:${f.heading};font-weight:${ct.wB};font-size:${ct.h2}px;color:${t.quoteFg};line-height:${ct.lhP}">Zwischen Reiz und Reaktion liegt ein Raum. In diesem Raum liegt unsere Macht zur Wahl unserer Reaktion. In unserer Reaktion liegen unsere Entwicklung und unsere Freiheit.</div><div style="font-family:${f.body};font-weight:${ct.wH};font-size:${ct.body}px;color:${t.quoteFg};line-height:${ct.lhI}">Viktor Frankl</div></div>`, t.quoteBg);
      /* 4: Feature News — brand image area + two-paragraph text */
      case 4: return card(i, `<div style="flex:1;min-height:120px;background:${t.accent};margin:-${t.py}px -${t.px}px 0"></div><div style="display:flex;flex-direction:column;gap:${ct.gapS}px;padding-top:${ct.gapM}px"><div style="display:flex;flex-direction:column;gap:${ct.gapXS}px"><div style="${capsStyle};color:${t.accent}">NEWS</div><div style="font-family:${f.body};font-weight:${ct.wH};font-size:${ct.h2}px;color:${t.bodyFg};line-height:${ct.lhH}">Proident culpa sit dolore ipsum sit tempor</div><div style="font-family:${f.body};font-weight:${ct.wB};font-size:${ct.body}px;color:${t.bodyFg};line-height:${ct.lhI}">Consectetur non aliquip officia laborum enim. Incididunt occaecat id quis sunt id voluptate in adipisicing anim ipsum labore cillum.</div></div><div style="font-family:${f.body};font-weight:${ct.wB};font-size:${ct.meta}px;color:${t.fgS};line-height:${ct.lhI}">Yesterday, 5:05 pm</div></div>`);
      /* 5: Job Card 2 (stacked below card 2) */
      case 5: return card(i, jobCardHtml(t));
      /* 6: Distance — big number stat with badge */
      case 6: return card(i, `<div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:space-between;flex:1"><div style="display:inline-flex;align-items:center;height:${ct.btnXS}px;padding:0 ${ct.gapXS}px;border-radius:9999px;background:${t.btnBg};color:${t.btnFg};font-family:${f.iface || f.body};font-weight:${ct.wH};font-size:${ct.caps}px;line-height:${ct.lhI};text-transform:uppercase;letter-spacing:0.08em">PERSONAL BEST</div><div style="width:100%"><div style="font-family:${f.iface || f.body};font-weight:${ct.wH};font-size:${ct.h3}px;color:${t.accent};line-height:${ct.lhI}">Distance</div><div style="font-family:${f.iface || f.body};font-weight:${ct.wH};font-size:${ct.display}px;color:${t.accent};line-height:${ct.lhH}">29.7 km</div><div style="font-family:${f.body};font-weight:${ct.wB};font-size:${ct.meta}px;color:${t.fgS};line-height:${ct.lhI};margin-top:${ct.gapXS}px">30% increase compared to last week</div></div></div>`);
      /* 7: Stats — 4 metric rows */
      case 7: {
        const statRow = (label, value) => `<div style="display:flex;justify-content:space-between;align-items:center"><div style="font-family:${f.body};font-weight:${ct.wB};font-size:${ct.meta}px;color:${t.bodyFg};line-height:${ct.lhI}">${label}</div><div style="font-family:${f.iface || f.body};font-weight:${ct.wH};font-size:${ct.h2}px;color:${t.accent};line-height:${ct.lhI}">${value}</div></div>`;
        return card(i, `<div style="display:flex;flex-direction:column;justify-content:space-between;flex:1">${statRow('Avg.<br>Distance', '4.2 km')}${statRow('Avg.<br>Speed', '21.4 km/h')}${statRow('Avg.<br>Cadence', '63.4 rpm')}${statRow('Avg.<br>Watt', '145 W')}</div>`);
      }
    }
  });

  /* Layout: single grid, 3 cols, 2 rows à 480px. Col 3 has stacked half-height cards. */
  const stack = (...ids) => `<div style="display:flex;flex-direction:column;gap:${ct.gapL}px;min-height:0">${ids.map(id => cards[id]).filter(Boolean).join('')}</div>`;
  document.getElementById('comp-cards').innerHTML =
    `<div class="comp-cards-grid cols-3" style="grid-template-rows:minmax(480px,auto) minmax(480px,auto)">${cards[0]}${cards[1]}${stack(2, 5)}${cards[3]}${cards[4]}${stack(6, 7)}</div>`;

  /* Re-acquire hovered comp card */
  if (hoveredCompCard) {
    const id = hoveredCompCard.dataset.cardId;
    hoveredCompCard = document.querySelector(`.comp-card[data-card-id="${id}"]`);
  }
}

/* Build token sets for a brand color — the single source of truth.
   themed.contrast-primary  = dark.clear (light mode) / light.clear (dark mode)
   inverted.contrast-primary = light.clear (light mode) / dark.clear (dark mode)
   base = closest step to brand hex that achieves AA against contrast-primary. */
function buildBrandTokenSets(brandHex) {
    const scale = generateOklchScale(brandHex);
    const brandOk = hexToOklch(brandHex);
    const brandIdx = scale.reduce((best, s, i) =>
      Math.abs(s.L - brandOk.L) < Math.abs(scale[best].L - brandOk.L) ? i : best, 0);

    const themedCp  = isDark ? FOUNDATION.lightClear.hex : FOUNDATION.darkClear.hex;
    const invertCp  = isDark ? FOUNDATION.darkClear.hex  : FOUNDATION.lightClear.hex;

    let mirrorIdx = scale.length - 1 - brandIdx;
    if (mirrorIdx === brandIdx) { mirrorIdx = brandIdx + 1; }
    const lightIdx = Math.min(brandIdx, mirrorIdx);
    const darkIdx  = Math.max(brandIdx, mirrorIdx);

    let themedIdx = isDark ? darkIdx : lightIdx;
    let invertIdx = isDark ? lightIdx : darkIdx;

    while (themedIdx > 0 && themedIdx < scale.length - 1 && contrastRatio(scale[themedIdx].hex, themedCp) < 4.5) {
      themedIdx += isDark ? 1 : -1;
    }
    while (invertIdx > 0 && invertIdx < scale.length - 1 && contrastRatio(scale[invertIdx].hex, invertCp) < 4.5) {
      invertIdx += isDark ? -1 : 1;
    }

    function makeSet(baseIdx, cp) {
      const baseHex = scale[baseIdx].hex;
      const higher  = scale[Math.max(0, baseIdx - 1)]?.hex || baseHex;
      const lower   = scale[Math.min(scale.length - 1, baseIdx + 1)]?.hex || baseHex;
      const cs      = contrastTinted(baseHex, scale, cp);
      return {
        base: baseHex, 'base-higher': higher, 'base-lower': lower,
        'contrast-primary': cp, 'contrast-secondary': cs.hex,
      };
    }

    return {
      themed:   makeSet(themedIdx, themedCp),
      inverted: makeSet(invertIdx, invertCp),
      scale,
    };
}

function buildComboTokenSets(combo) {
    const palette = colorPalette();
    const bgColor = palette.find(c => c.key === combo.bgSource);
    const fgColor = palette.find(c => c.key === combo.fgSource);
    if (!bgColor || !fgColor) return null;

    const bgScale = generateOklchScale(bgColor.hex);
    const fgScale = generateOklchScale(fgColor.hex);

    const bgHex = combo.bgShade != null ? bgScale[combo.bgShade].hex : bgColor.hex;
    const fgHex = combo.fgShade != null ? fgScale[combo.fgShade].hex : fgColor.hex;

    function makeComboSet(baseHex, baseScale, csHex) {
      const ok = hexToOklch(baseHex);
      const idx = baseScale.reduce((best, s, i) =>
        Math.abs(s.L - ok.L) < Math.abs(baseScale[best].L - ok.L) ? i : best, 0);
      const higher = baseScale[Math.max(0, idx - 1)]?.hex || baseHex;
      const lower  = baseScale[Math.min(baseScale.length - 1, idx + 1)]?.hex || baseHex;
      return {
        base: baseHex,
        'base-higher': higher,
        'base-lower': lower,
        'contrast-primary': fgPrimary(baseHex),
        'contrast-secondary': csHex,
      };
    }

    return {
      themed:   makeComboSet(bgHex, bgScale, fgHex),
      inverted: makeComboSet(fgHex, fgScale, bgHex),
    };
}


function renderComponents(r, bw, df) {
  const bwTokens  = calcBorderWidth(Math.round(bw));
  const defaultR  = r.M + 'px';
  const interfaceType = sel('fontInterface');
  const interfaceFont= interfaceType === 'serif' ? sel('fontSerif') : sel('fontSans');
  const interfaceFontStack = interfaceType === 'serif'
    ? `'${interfaceFont}', Georgia, serif`
    : `'${interfaceFont}', -apple-system, sans-serif`;

  const radiusVal = (state) => {
    if (state.radius === null) return defaultR;
    const tok = RADIUS_TOKENS[state.radius];
    if (tok === 'pill') return '9999px';
    return (r[tok] ?? r.M) + 'px';
  };

  /* One shade lighter for hover */
  const oneLighter = (hex) => {
    if (!hex || hex === 'transparent') return null;
    try {
      const scale = generateOklchScale(hex);
      const ok = hexToOklch(hex);
      const idx = scale.reduce((best, s, i) => {
        const d = Math.abs(s.L - ok.L);
        return d < best.d ? { i, d } : best;
      }, { i: 0, d: Infinity }).i;
      return scale[Math.max(0, idx - 1)]?.hex ?? hex;
    } catch { return hex; }
  };

  /* Subtle hover bg for transparent buttons */
  const subtleHover = isDark ? 'rgba(250,250,248,0.06)' : 'rgba(20,20,18,0.04)';

  /* Resolve button tokens from colorSource + variant + I/S/T state.
     colorSource === null → Foundation mode (monochrome)
     colorSource === 'combo-X' → buildComboTokenSets
     colorSource === brand/accent key → buildBrandTokenSets
     Returns surfaceHex: the color that touches the canvas (for contrast check) */
  /* Resolve Foundation token key to hex value */
  function hexToRgba(hex, alpha) {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${alpha})`;
  }
  function resolveFoundationHex(token, inv) {
    const themed = !inv;
    switch (token) {
      case '_f-base-clear':
        return themed ? (isDark ? FOUNDATION.darkClear.hex : FOUNDATION.lightClear.hex)
                      : (isDark ? FOUNDATION.lightClear.hex : FOUNDATION.darkClear.hex);
      case '_f-base-cloudy':
        return themed ? (isDark ? FOUNDATION.darkCloudy.hex : FOUNDATION.lightCloudy.hex)
                      : (isDark ? FOUNDATION.lightCloudy.hex : FOUNDATION.darkCloudy.hex);
      case '_f-base-shine':
        return hexToRgba(FOUNDATION.lightClear.hex, 0.10);
      case '_f-base-shade':
        return hexToRgba(FOUNDATION.darkClear.hex, 0.10);
      case '_f-contrast-primary':
        return themed ? (isDark ? FOUNDATION.lightClear.hex : FOUNDATION.darkClear.hex)
                      : (isDark ? FOUNDATION.darkClear.hex : FOUNDATION.lightClear.hex);
      case '_f-contrast-secondary':
        return fgSecondary(themed
          ? (isDark ? FOUNDATION.darkCloudy.hex : FOUNDATION.lightCloudy.hex)
          : (isDark ? FOUNDATION.lightCloudy.hex : FOUNDATION.darkCloudy.hex),
          themed
          ? (isDark ? FOUNDATION.darkClear.hex : FOUNDATION.lightClear.hex)
          : (isDark ? FOUNDATION.lightClear.hex : FOUNDATION.darkClear.hex)).hex;
      case '_f-contrast-tertiary': {
        const cpHex = themed ? (isDark ? FOUNDATION.lightClear.hex : FOUNDATION.darkClear.hex)
                             : (isDark ? FOUNDATION.darkClear.hex : FOUNDATION.lightClear.hex);
        return hexToRgba(cpHex, 0.40);
      }
      default: return null;
    }
  }

  /* Token-style foundation sub-path: _f-base-clear → base-clear */
  function tokenFoundationSub(key) {
    return key.replace('_f-', '');
  }

  function resolveButtonTokens(state) {
    let bg, fg, brd, surfaceHex;
    let fgHex = null; /* always the solid hex behind fg, for display */
    let fgName = '–', bgName = '–';
    const bwPx = bwTokens[state.bw]?.val ?? bwTokens[3].val;

    if (state.fgSource || state.bgSource) {
      /* ── Freeform mode: FG and BG set independently ── */
      const STEPS = ['50','100','200','300','400','500','600','700','800','900','950'];
      const palette = colorPalette();
      function resolveFreePick(source, shade) {
        if (!source) return null;
        /* Foundation token sources (from F0/B0) */
        if (source.startsWith('_f-')) return resolveFoundationHex(source, state.inverted);
        const color = palette.find(c => c.key === source);
        if (!color) return null;
        const scale = generateOklchScale(color.hex);
        const idx = shade ?? compActions._findShadeIndex(scale, color.hex);
        return scale[Math.max(0, Math.min(scale.length - 1, idx))]?.hex || color.hex;
      }
      function freeName(source, shade) {
        if (!source) return '–';
        if (source.startsWith('_f-')) return `foundation.${tokenFoundationSub(source)}`;
        const step = shade != null ? (STEPS[shade] || shade) : '';
        return step ? `${source}/${step}` : source;
      }
      const fgHexFree = resolveFreePick(state.fgSource, state.fgShade);
      const bgHexFree = resolveFreePick(state.bgSource, state.bgShade);

      bg  = bgHexFree || 'transparent';
      fg  = fgHexFree || 'transparent';
      brd = fg; /* border color always = fg, visibility via width */
      if (state.variant !== 'solid') { bg = 'transparent'; }
      surfaceHex = bg !== 'transparent' ? bg : fg;
      fgHex = fg;
      fgName = freeName(state.fgSource, state.fgShade);
      bgName = state.variant !== 'solid' ? 'Transparent' : freeName(state.bgSource, state.bgShade);
    } else if (state.colorSource === '_foundation') {
      /* ── C0: Foundation combined mode ── */
      const inv = state.inverted;
      const cpHex = resolveFoundationHex('_f-contrast-primary', inv);
      const bgToken = state._foundationBg || '_f-base-clear';
      const bgHexF = resolveFoundationHex(bgToken, inv);

      if (state.variant === 'solid') {
        const tintedFg = state.tinted
          ? resolveFoundationHex('_f-contrast-secondary', inv)
          : cpHex;
        bg = state.swapped ? tintedFg : bgHexF;
        fg = state.swapped ? bgHexF : tintedFg;
        brd = fg;
        const fgToken = state.tinted ? 'foundation.contrast-secondary' : 'foundation.contrast-primary';
        const bgTokenName = `foundation.${tokenFoundationSub(bgToken)}`;
        fgName = state.swapped ? bgTokenName : fgToken;
        bgName = state.swapped ? fgToken : bgTokenName;
      } else {
        bg = 'transparent';
        fg = cpHex;
        brd = (state.variant === 'outline') ? cpHex : fg;
        fgName = 'foundation.contrast-primary';
        bgName = 'Transparent';
      }
      if (state.variant === 'solid') surfaceHex = bg;
      else if (state.variant === 'outline') surfaceHex = brd !== 'transparent' ? brd : fg;
      else surfaceHex = fg;
      fgHex = fg;
    } else {
      /* ── Color mode: resolve token set ── */
      let sets = null;
      let src = state.colorSource;
      /* Resolve _brand1 placeholder to actual first brand color key */
      if (src === '_brand1') {
        src = COLORS.brand[0]?.key || (colorPalette()[0]?.key) || src;
      }
      const srcLabel = src;

      if (src.startsWith('combo-')) {
        const combo = COMBO_STATE.find(c => c.id === src);
        if (combo) sets = buildComboTokenSets(combo);
      }
      if (!sets) {
        const palette = colorPalette();
        const color = palette.find(c => c.key === src);
        const hex = color?.hex || COLORS.brand[0]?.hex || '#2563EB';
        sets = buildBrandTokenSets(hex);
      }

      const set = state.inverted ? sets.inverted : sets.themed;
      const base = set.base;
      const cp   = set['contrast-primary'];
      const cs   = set['contrast-secondary'];

      const modeName = state.inverted ? 'inverted' : 'themed';
      if (state.variant === 'solid') {
        /* Solid: I/S/T fully applied. Border color = fg (visible when W > 0). */
        const contrast = state.tinted ? cs : cp;
        bg = state.swapped ? contrast : base;
        fg = state.swapped ? base     : contrast;
        brd = fg;
        const contrastName = state.tinted ? `${srcLabel}.${modeName}.contrast-secondary` : `${srcLabel}.${modeName}.contrast-primary`;
        const baseName = `${srcLabel}.${modeName}.base`;
        fgName = state.swapped ? baseName : contrastName;
        bgName = state.swapped ? contrastName : baseName;
      } else {
        /* Outline + Ghost: always base, I/S/T state preserved but not shown */
        bg = 'transparent';
        fg = base;
        brd = (state.variant === 'outline') ? base : fg;
        fgName = `${srcLabel}.${modeName}.base`;
        bgName = 'Transparent';
      }

      /* Surface + fgHex for color mode */
      if (state.variant === 'solid') surfaceHex = bg;
      else if (state.variant === 'outline') surfaceHex = brd !== 'transparent' ? brd : fg;
      else surfaceHex = fg;
      fgHex = fg;
    }

    return { bg, fg, brd, bwPx, surfaceHex, fgHex, fgName, bgName };
  }

  /* Effective canvas background for contrast checks */
  const effectiveCanvasBg = canvasBg
    || (isDark ? FOUNDATION.darkCloudy.hex : FOUNDATION.lightCloudy.hex);

  const btn = (state) => {
    const { bg, fg, brd, bwPx, surfaceHex, fgHex, fgName, bgName } = resolveButtonTokens(state);
    const brdCSS = `${bwPx}px solid ${brd}`;
    const rVal   = radiusVal(state);
    const rLabelRaw = state.radius !== null ? RADIUS_TOKENS[state.radius] : 'M';
    const rLabel = rLabelRaw === 'none' ? 'None' : rLabelRaw;
    const bwLabel = bwTokens[state.bw]?.name ?? 'M';
    const hBg   = (bg !== 'transparent' && !bg.startsWith('rgba')) ? (oneLighter(bg) ?? bg) : subtleHover;
    const spacing = calcSpacing(val('space'));
    const px = state.paddingX != null ? (spacing[state.paddingX]?.val ?? 24) : null;
    const py = state.paddingY != null ? (spacing[state.paddingY]?.val ?? 8) : null;
    const padStyle = (px != null || py != null) ? `padding:${py ?? 8}px ${px ?? 24}px;` : '';

    /* Color display: semantic token name */
    const fgDisplay = fgName;
    const bgDisplay = bgName;
    const brdDisplay = bwPx > 0 ? bwLabel : 'None';
    const pxLabel = spacing[state.paddingX]?.name ?? 'M';
    const pxVal = px ?? 24;

    /* Contrast: solid = fg vs bg (internal). outline/ghost = fg vs canvas (external). */
    let cRatio = null;
    const isHex = (v) => v && !v.startsWith('rgba') && v !== 'transparent';
    if (state.variant === 'solid' && isHex(bg) && isHex(fg)) {
      cRatio = contrastRatio(fg, bg);
    } else if (isHex(fg)) {
      cRatio = contrastRatio(fg, effectiveCanvasBg);
    }
    const contrastBadge = cRatio
      ? `<span class="brand-contrast-badge ${contrastCls(cRatio)}">${cRatio.toFixed(1)}:1 ${contrastLbl(cRatio)}</span>`
      : '';

    /* Mode label */
    const isFreeform = state.fgSource || state.bgSource;
    let modeLabel;
    if (isFreeform) {
      /* Freeform: FG: brand-a/200 / BG: brand-b/950 */
      const STEPS = ['50','100','200','300','400','500','600','700','800','900','950'];
      function freeLabel(src, shade) {
        if (!src) return '–';
        if (src.startsWith('_f-')) return `foundation.${tokenFoundationSub(src)}`;
        const step = shade != null ? (STEPS[shade] || shade) : '';
        return step ? `${src}/${step}` : src;
      }
      const fgLabel = freeLabel(state.fgSource, state.fgShade);
      const bgLabel = freeLabel(state.bgSource, state.bgShade);
      modeLabel = `FG: ${fgLabel} / BG: ${bgLabel}`;
    } else if (state.colorSource === '_foundation') {
      /* C0: Foundation combined mode — same I/S/T flags as C1-9, plus BG token in Title Case */
      const foundBgName = `foundation.${tokenFoundationSub(state._foundationBg || '_f-base-clear')}`;
      modeLabel = `Inverted <span style="font-size:1.6em;line-height:1;vertical-align:-0.1em">${state.inverted ? '✓' : '−'}</span> / Swapped <span style="font-size:1.6em;line-height:1;vertical-align:-0.1em">${state.swapped ? '✓' : '−'}</span> / Tinted <span style="font-size:1.6em;line-height:1;vertical-align:-0.1em">${state.tinted ? '✓' : '−'}</span> / BG: ${foundBgName}`;
    } else {
      /* Combined or Foundation: Themed/Inverted / Swapped/Unswapped / Tinted/Clear */
      modeLabel = `Inverted <span style="font-size:1.6em;line-height:1;vertical-align:-0.1em">${state.inverted ? '✓' : '−'}</span> / Swapped <span style="font-size:1.6em;line-height:1;vertical-align:-0.1em">${state.swapped ? '✓' : '−'}</span> / Tinted <span style="font-size:1.6em;line-height:1;vertical-align:-0.1em">${state.tinted ? '✓' : '−'}</span>`;
    }

    return `
    <div class="comp-action-item">
      <div class="comp-action-btn" data-action-id="${state.id}" style="background:${bg};color:${fg};border:${brdCSS};border-radius:${rVal};font-family:${interfaceFontStack};--btn-hover:${hBg};${padStyle}${state.variant === 'ghost' ? 'border:1.5px dashed ' + (isDark ? 'rgba(250,250,248,0.15)' : 'rgba(20,20,18,0.15)') + ' !important;' : ''}">${state.label}</div>
      <div class="comp-action-detail">
        <span>Variant: ${state.variant.charAt(0).toUpperCase() + state.variant.slice(1)}</span>
        <span>FG: ${fgDisplay}</span>
        <span>BG: ${bgDisplay}</span>
        <span>Border: ${brdDisplay}</span>
        <span>Radius: ${rLabel}</span>
        <span>Padding: ${pxLabel}</span>
        <span>Mode: ${modeLabel}</span>
        ${contrastBadge}
      </div>
    </div>`;
  };

  const groups = {};
  ACTION_STATE.forEach(s => { (groups[s.group] ??= []).push(s); });

  /* Size definitions from dimension + spacing tokens (per convention:
     height = semantic.size.action.[S|M|L], padding-x = semantic.space.padding.M,
     padding-y = core.space.2 = 8px, font-size = fixed per size) */
  const sizing = calcSizing(df);
  const spacing = calcSpacing(val('space'));
  const actionToken = (name) => sizing.find(s => s.name === name)?.val;
  const spToken = (name) => spacing.find(s => s.name === name)?.val;
  const btnPadX = spToken('M') || 16;
  const sizes = {
    S: { h: actionToken('action.S') || 32, px: btnPadX, fs: 12 },
    M: { h: actionToken('action.M') || 40, px: btnPadX, fs: 14 },
    L: { h: actionToken('action.L') || 48, px: btnPadX, fs: 16 },
  };

  /* Render a button at a specific size, optional pill */
  const sizedBtn = (state, size, pill) => {
    const { bg, fg, brd, bwPx } = resolveButtonTokens(state);
    const brdCSS = `${bwPx}px solid ${brd}`;
    const rVal   = pill ? '9999px' : radiusVal(state);
    const hBg    = bg !== 'transparent' ? (oneLighter(bg) ?? bg) : subtleHover;
    const sz     = sizes[size];
    const ghostOutline = state.variant === 'ghost' ? 'border:1.5px dashed ' + (isDark ? 'rgba(250,250,248,0.15)' : 'rgba(20,20,18,0.15)') + ' !important;' : '';
    return `<div class="comp-action-btn" style="height:${sz.h}px;padding:0 ${sz.px}px;font-size:${sz.fs}px;background:${bg};color:${fg};border:${brdCSS};border-radius:${rVal};font-family:${interfaceFontStack};--btn-hover:${hBg};${ghostOutline}">${state.label}</div>`;
  };

  /* Token editor: one row per group with token info */
  const editorHtml = `<div class="comp-action-grid">` +
    Object.entries(groups).map(([name, items]) => `
    <div class="comp-action-group">
      <div class="comp-action-group-title">${name}</div>
      ${items.length > 1
        ? `<div class="comp-action-pair">${items.map(s => btn(s)).join('')}</div>`
        : btn(items[0])}
    </div>`).join('') +
  `</div>`;

  /* Size grid: rows = Primary/Secondary-sel/Secondary-unsel/Tertiary-sel/Tertiary-unsel, cols = M/S/Pill */
  const gridRows = ACTION_STATE.map(state => {
    return `<div class="comp-size-label">${state.group}${state.label.includes('Action') ? '' : ' · ' + state.label}</div>` +
      ['M', 'S'].map(sz => sizedBtn(state, sz, false)).join('') +
      (sizedBtn(state, 'S', true));
  }).join('');

  const gridHtml = `
    <div class="comp-size-grid" style="grid-template-columns: auto repeat(3, minmax(auto, 200px))">
      <div></div><div class="comp-size-header">M</div><div class="comp-size-header">S</div><div class="comp-size-header">Pill</div>
      ${gridRows}
    </div>`;

  document.getElementById('comp-action').innerHTML = editorHtml +
    `<div style="margin-top:80px">${gridHtml}</div>`;

  /* Re-acquire hovered action after DOM rebuild */
  if (hoveredAction) {
    const id = hoveredAction.dataset.actionId;
    hoveredAction = document.querySelector(`.comp-action-btn[data-action-id="${id}"]`);
  }
}


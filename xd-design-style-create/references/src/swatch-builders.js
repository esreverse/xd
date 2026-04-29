/* ================================================================
   SWATCH BUILDERS
   ================================================================ */

/* Contrast badge helpers (shared by swatch cards and combo cards) */
const contrastCls = r => r >= 7 ? 'aaa' : r >= 4.5 ? 'aa' : 'fail';
const contrastLbl = r => r >= 7 ? 'AAA' : r >= 4.5 ? 'AA'  : 'Fail';

function buildSwatchMeta(color, hsl, oklch) {
  return `<div class="brand-swatch-meta">
    ${color.hex} &middot; hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)<br>
    oklch(${oklch.L.toFixed(2)} ${oklch.C.toFixed(3)} ${oklch.H.toFixed(0)})
  </div>`;
}

function buildContrastBadges(ratioP, ratioS) {
  return `<div class="brand-swatch-badges">
    <span class="brand-contrast-badge ${contrastCls(ratioP)}">P ${ratioP.toFixed(1)}:1 ${contrastLbl(ratioP)}</span>
    <span class="brand-contrast-badge ${contrastCls(ratioS)}">S ${ratioS.toFixed(1)}:1 ${contrastLbl(ratioS)}</span>
  </div>`;
}

function buildFoundationCard(color, foundationKey, sharedSecondary) {
  const cPrimary = fgPrimary(color.hex);
  const cSecondary = sharedSecondary;
  const oklch  = hexToOklch(color.hex);
  const hsl    = color.hslH !== null
    ? { h: color.hslH, s: color.hslS, l: color.hslL }
    : (() => { const rgb = hexToRgb(color.hex); return rgbToHsl(rgb.r, rgb.g, rgb.b); })();
  const lockKey = 'foundation-' + foundationKey;
  const isLocked = !!colorLocks[lockKey];
  const lockBtn  = `<button class="brand-swatch-lock ${isLocked ? 'locked' : ''}" data-color-key="${lockKey}" onclick="event.stopPropagation();toggleColorLock(this)" title="${isLocked ? 'Unlock' : 'Lock'}">${isLocked ? SVG_LOCK : SVG_UNLOCK}</button>`;
  return `
    <div class="brand-swatch-card" tabindex="0" data-color-type="foundation" data-color-key="${foundationKey}" onclick="randomizeFoundationOne('${foundationKey}')">
      <div class="brand-swatch-top" style="background:${color.hex}">
        <div class="brand-swatch-top-actions">${lockBtn}</div>
        <span class="brand-contrast-sample" style="color:${cPrimary}">C Primary</span>
        <span class="brand-contrast-sample" style="color:${cSecondary.hex}">C Secondary ${cSecondary.alpha}%</span>
      </div>
      <div class="brand-swatch-bottom">
        <div class="brand-swatch-name">${color.name}</div>
        ${buildSwatchMeta(color, hsl, oklch)}
        ${buildContrastBadges(contrastRatio(cPrimary, color.hex), contrastRatio(cSecondary.hex, color.hex))}
      </div>
    </div>`;
}

/* group is required for brand/accent/feedback to enable lock/remove buttons */
function buildSwatchCard(color, group) {
  const scale  = generateOklchScale(color._baseHex || color.hex);
  const oklch  = hexToOklch(color.hex);
  const hsl    = (color.hslH != null)
    ? { h: color.hslH, s: color.hslS, l: color.hslL }
    : (() => { const rgb = hexToRgb(color.hex); return rgbToHsl(rgb.r, rgb.g, rgb.b); })();
  const lc     = FOUNDATION.lightClear.hex;
  const dc     = FOUNDATION.darkClear.hex;

  /* Card shows the exact defined color; find which scale step it maps to */
  const displayHex  = color.hex;
  const activeStep  = scale.find(s => s.hex === displayHex) || scale.reduce((a, b) => Math.abs(b.L - oklch.L) < Math.abs(a.L - oklch.L) ? b : a);

  /* Use activeStep.hex for contrast computation — matches the scale labels below */
  const cPrimary = fgPrimary(activeStep.hex);
  const cSecondary = fgSecondary(activeStep.hex);
  const cTinted = (group === 'brand' || group === 'accent' || group === 'feedback') ? contrastTinted(activeStep.hex, scale, cPrimary) : null;

  const steps = scale.map(s => {
    const rL    = contrastRatio(dc, s.hex);
    const rD    = contrastRatio(lc, s.hex);
    const ratio = Math.max(rL, rD);
    const level = ratio >= 7 ? '3' : ratio >= 4.5 ? '2' : ratio >= 3 ? '1' : '-';
    const isActive = s.hex === displayHex;
    return { hex: s.hex, fg: rL > rD ? dc : lc, level, isActive };
  });

  /* Top-right actions overlaid on colored area: lock left, × right */
  const isLocked  = !!colorLocks[color.key];
  const lockBtn   = `<button class="brand-swatch-lock ${isLocked ? 'locked' : ''}" data-color-key="${color.key}" onclick="event.stopPropagation();toggleColorLock(this)" title="${isLocked ? 'Unlock' : 'Lock'}">${isLocked ? SVG_LOCK : SVG_UNLOCK}</button>`;
  const canRemove = (group === 'brand' && color.key !== 'brand-a') || group === 'accent';
  const removeBtn = canRemove
    ? `<button class="brand-swatch-remove-btn" onclick="event.stopPropagation();removeColor('${group}','${color.key}')" title="Remove">&times;</button>`
    : '';

  const contrastLabels = cTinted
    ? `<span class="brand-contrast-sample" style="color:${cPrimary}">C Primary</span>
       <span class="brand-contrast-sample" style="color:${cTinted.hex}">C Secondary ${cTinted.fromScale ? cTinted.step : '→ Primary'}</span>`
    : `<span class="brand-contrast-sample" style="color:${cPrimary}">C Primary</span>`;

  return `
    <div class="brand-swatch-card" tabindex="0" data-color-type="${group}" data-color-key="${color.key}" onclick="randomizeColorOne('${group}','${color.key}')">
      <div class="brand-swatch-top" style="background:${activeStep.hex}">
        <span class="brand-swatch-shade" style="color:${cPrimary}">${activeStep.step}</span>
        <div class="brand-swatch-top-actions">${lockBtn}${removeBtn}</div>
        ${contrastLabels}
      </div>
      <div class="brand-swatch-bottom">
        <div class="brand-swatch-name">${color.name}</div>
        ${buildSwatchMeta(color, hsl, oklch)}
        ${buildContrastBadges(contrastRatio(cPrimary, displayHex), cTinted?.ratio ?? contrastRatio(cPrimary, displayHex))}
        <div class="brand-gradient-strip">
          ${steps.map(s => `<div class="brand-gradient-step" data-hex="${s.hex}" style="background:${s.hex};outline:${s.isActive ? '1.5px solid ' + s.fg : 'none'};outline-offset:-1.5px"><span style="color:${s.fg};font-size:9px;font-family:'SF Mono',monospace;font-weight:600">${s.level}</span></div>`).join('')}
        </div>
      </div>
    </div>`;
}


/* ================================================================
   COMBO CARDS
   ================================================================ */

function buildComboCard(combo) {
  const palette = colorPalette();
  const bgColor = palette.find(c => c.key === combo.bgSource);
  const fgColor = palette.find(c => c.key === combo.fgSource);
  if (!bgColor || !fgColor) return '';

  const bgScale = generateOklchScale(bgColor.hex);
  const fgScale = generateOklchScale(fgColor.hex);

  /* Use original hex or stepped shade, then apply inverted */
  let bgHex = combo.bgShade != null ? bgScale[combo.bgShade].hex : bgColor.hex;
  let fgHex = combo.fgShade != null ? fgScale[combo.fgShade].hex : fgColor.hex;
  if (combo.inverted) { const tmp = bgHex; bgHex = fgHex; fgHex = tmp; }

  /* Find step labels */
  const bgOk = hexToOklch(bgHex);
  const bgStep = bgScale.reduce((best, s) => Math.abs(s.L - bgOk.L) < Math.abs(best.L - bgOk.L) ? s : best).step;
  const fgOk = hexToOklch(fgHex);
  const fgStep = fgScale.reduce((best, s) => Math.abs(s.L - fgOk.L) < Math.abs(best.L - fgOk.L) ? s : best).step;

  /* contrast-primary: opaque black/white against BG */
  const cp = fgPrimary(bgHex);
  const cpRatio = contrastRatio(cp, bgHex);

  /* contrast-secondary: the FG color itself against BG */
  const csRatio = contrastRatio(fgHex, bgHex);

  return `
    <div class="brand-swatch-card brand-combo-card" data-color-type="combo" data-color-key="${combo.id}">
      <div class="brand-swatch-top" style="background:linear-gradient(to top right, ${bgHex} 50%, ${fgHex} 50%)">
        <span class="brand-swatch-shade" style="color:${cp}">${bgStep}${combo.inverted ? ' inv' : ''}</span>
        <div class="brand-swatch-top-actions">
          <button class="brand-swatch-remove-btn" onclick="event.stopPropagation();removeCombo('${combo.id}')" title="Remove">&times;</button>
        </div>
        <span class="brand-contrast-sample" style="color:${cp}">C Primary</span>
        <span class="brand-contrast-sample" style="color:${fgHex}">C Secondary ${fgStep}</span>
      </div>
      <div class="brand-swatch-bottom">
        <div class="brand-swatch-name">Combo ${combo.id.split('-')[1]?.toUpperCase() || 'A'} · ${bgColor.name} + ${fgColor.name}</div>
        ${buildContrastBadges(cpRatio, csRatio)}
      </div>
    </div>`;
}

function nextComboKey() {
  const used = new Set(COMBO_STATE.map(c => c.id));
  for (const l of COLOR_LETTERS) {
    const k = 'combo-' + l;
    if (!used.has(k)) return k;
  }
  return null;
}

function addCombo() {
  const palette = colorPalette();
  if (palette.length < 2) return;
  const id = nextComboKey();
  if (!id) return;
  COMBO_STATE.push({ id, bgSource: palette[0].key, fgSource: palette[1].key, bgShade: null, fgShade: null, inverted: false });
  update();
}

function removeCombo(id) {
  const idx = COMBO_STATE.findIndex(c => c.id === id);
  if (idx >= 0) { COMBO_STATE.splice(idx, 1); update(); }
}

function renderCombos() {
  const html = COMBO_STATE.map(c => buildComboCard(c)).join('');
  const addBtn = colorPalette().length >= 2
    ? `<button class="brand-swatch-add" onclick="addCombo()" title="Add combo">+</button>` : '';
  document.getElementById('swatches-combo').innerHTML = html + addBtn;
}


/* ================================================================
   ADD / REMOVE COLORS (Brand & Accent)
   ================================================================ */

function nextColorKey(group) {
  const used = new Set(COLORS[group].map(c => c.key));
  for (const l of COLOR_LETTERS) {
    const k = group + '-' + l;
    if (!used.has(k)) return k;
  }
  return null;
}

function addColor(group) {
  /* no limit */
  const key = nextColorKey(group);
  if (!key) return;
  const hex = randomHex();
  const color = { name: autoColorName(hex), hex, key, hslH: null, hslS: null, hslL: null };
  storeHsl(color);
  COLORS[group].push(color);
  update();
}

function removeColor(group, key) {
  /* brand must keep at least one color */
  if (group === 'brand' && COLORS.brand.length <= 1) return;
  COLORS[group] = COLORS[group].filter(c => c.key !== key);
  update();
}


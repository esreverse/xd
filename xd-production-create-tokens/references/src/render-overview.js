/* ================================================================
   RENDER: Overview
   ================================================================ */

/* ================================================================
   RENDER: Panel Color Palette
   ================================================================ */

function renderPanelPalette() {
  const swatch = (c, num, group) => {
    const fg = fgPrimary(c.hex);
    return `<button class="interface-palette-swatch brand-swatch-card" data-color-type="${group}" data-color-key="${c.key}" style="background:${c.hex};color:${fg}" onclick="randomizeColorOne('${group}','${c.key}')" title="${c.name} — ${c.hex}">${num}</button>`;
  };

  document.getElementById('panel-palette-brand').innerHTML =
    `<div class="interface-palette-row">${COLORS.brand.map((c, i) => swatch(c, i + 1, 'brand')).join('')}</div>`;

  const accentWrap = document.getElementById('panel-palette-accent-wrap');
  if (COLORS.accent.length) {
    const offset = COLORS.brand.length;
    accentWrap.style.display = '';
    document.getElementById('panel-palette-accent').innerHTML =
      `<div class="interface-palette-row">${COLORS.accent.map((c, i) => swatch(c, offset + i + 1, 'accent')).join('')}</div>`;
  } else {
    accentWrap.style.display = 'none';
  }

  /* Combo thumbnails: diagonal split */
  const comboWrap = document.getElementById('panel-palette-combo-wrap');
  if (COMBO_STATE.length) {
    comboWrap.style.display = '';
    const palette = colorPalette();
    document.getElementById('panel-palette-combo').innerHTML =
      `<div class="interface-palette-row">${COMBO_STATE.map(combo => {
        const bgColor = palette.find(c => c.key === combo.bgSource);
        const fgColor = palette.find(c => c.key === combo.fgSource);
        if (!bgColor || !fgColor) return '';
        const bgScale = generateOklchScale(bgColor.hex);
        const fgScale = generateOklchScale(fgColor.hex);
        let bgHex = combo.bgShade != null ? bgScale[combo.bgShade].hex : bgColor.hex;
        let fgHex = combo.fgShade != null ? fgScale[combo.fgShade].hex : fgColor.hex;
        if (combo.inverted) { const tmp = bgHex; bgHex = fgHex; fgHex = tmp; }
        const comboIdx = COMBO_STATE.indexOf(combo);
        const label = palette.length + comboIdx + 1;
        return `<button class="interface-palette-swatch brand-swatch-card" data-color-type="combo" data-color-key="${combo.id}" style="background:linear-gradient(to top right, ${bgHex} 50%, ${fgHex} 50%);color:${bgHex}" title="${bgColor.name} + ${fgColor.name}">${label}</button>`;
      }).join('')}</div>`;
  } else {
    comboWrap.style.display = 'none';
  }
}


function renderOverview(f, w, r, rf, sh, lh, sf, df, bw) {
  const typo    = calcTypography(sh);
  const spacing = calcSpacing(sf);
  const sizing  = calcSizing(df);
  const borders = calcBorderWidth(bw);
  const chip = v => `<span class="brand-section-multiplier">${v}</span>`;

  /* Brand / Accent swatches with add button */
  ['brand', 'accent'].forEach(group => {
    let html = COLORS[group].map(c => buildSwatchCard(c, group)).join('');
    if (true) {
      html += `<button class="brand-swatch-add" onclick="addColor('${group}')" title="Add color">+</button>`;
    }
    document.getElementById('swatches-' + group).innerHTML = html;
  });

  /* Feedback swatches (no add/remove) */
  document.getElementById('swatches-feedback').innerHTML =
    COLORS.feedback.map(c => buildSwatchCard(c, 'feedback')).join('');

  /* Combo swatches */
  renderCombos();

  /* Foundation swatches — contrast-secondary calculated once per pair against cloudy (worst case) */
  const csLight = fgSecondary(FOUNDATION.lightCloudy.hex, FOUNDATION.lightClear.hex);
  const csDark  = fgSecondary(FOUNDATION.darkCloudy.hex, FOUNDATION.darkClear.hex);
  document.getElementById('swatches-foundation').innerHTML =
    Object.entries(FOUNDATION)
      .map(([key, fc]) => buildFoundationCard(fc, key, key.startsWith('light') ? csLight : csDark)).join('');

  /* Typography */
  const typoPreview = calcTypographyPreview(typo);
  document.getElementById('typo-preview').innerHTML = [...typoPreview].reverse().map(t => {
    const isCaps = t.cat === 'caps';
    const isCode = t.cat === 'code';
    const isHeading = t.cat === 'heading';
    const family = isCode ? f.mono : (isHeading ? f.heading : (isCaps ? (f.iface || f.body) : (t.cat === 'interface' ? (f.iface || f.body) : f.body)));
    const weight = (isHeading || isCaps) ? w.heading : w.base;
    const lhVal = isHeading ? 1.0 * lh : (t.cat === 'paragraph' || isCode ? 1.4 * lh : 1.1 * lh);
    const extraStyle = isCaps ? 'text-transform:uppercase;letter-spacing:0.08em;' : '';
    return `<div class="brand-typo-row">
      <div style="font-size:${t.size}px;font-family:${family};font-weight:${weight};line-height:${lhVal};${extraStyle}color:var(--color-contrast-primary)">
        The quick brown fox jumps over the lazy dog
      </div>
      <div class="brand-typo-meta">
        <span class="brand-typo-token-name">${t.name}</span>
        <span>${t.size}px</span>
        <span>w${weight}</span>
        <span>lh ${lhVal.toFixed(2)}</span>
      </div>
    </div>`;
  }).join('');

  /* Spacing — boxes are exact pixel size */
  const displaySpacing = spacing.filter(s => s.name !== '0');
  document.getElementById('spacing-preview').innerHTML =
    displaySpacing.map(s => {
      const vis = Math.max(2, s.val);
      return `
      <div class="brand-spacing-item">
        <div style="width:${vis}px;height:${vis}px;background:var(--color-contrast-primary);border-radius:2px"></div>
        <div class="brand-token-label-group">
          <span class="brand-spacing-label">${s.name}</span>
          <span class="brand-spacing-value">${s.val}px</span>
        </div>
      </div>`;
    }).join('');

  /* Sizing — icons and actions in one row, visual gap between groups */
  const renderSizingRow = items => items.map(s => `
      <div class="brand-sizing-item">
        <div style="width:${s.val}px;height:${s.val}px;background:var(--color-contrast-primary);border-radius:2px"></div>
        <div class="brand-token-label-group">
          <span class="brand-sizing-label">${s.name}</span>
          <span class="brand-sizing-value">${s.val}px</span>
        </div>
      </div>`).join('');
  document.getElementById('sizing-preview').innerHTML =
    `<div style="display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end">` +
      renderSizingRow(sizing.filter(s => s.group === 'icon')) +
      `<div style="width:40px"></div>` +
      renderSizingRow(sizing.filter(s => s.group === 'action')) +
    `</div>`;

  /* Border Radius */
  const radii = [
    { n: 'none', v: r.none }, { n: 'S', v: r.S }, { n: 'M', v: r.M },
    { n: 'L', v: r.L }, { n: 'XL', v: r.XL }, { n: '2XL', v: r['2XL'] }, { n: 'pill', v: r.pill },
  ];
  document.getElementById('radius-preview').innerHTML = radii.map(x => `
    <div class="brand-radius-item">
      <div class="brand-radius-box" style="background:var(--color-contrast-primary);border-radius:${x.v >= 9999 ? '50%' : x.v + 'px'}"></div>
      <div class="brand-token-label-group">
        <div class="brand-radius-token">${x.n}</div>
        <div class="brand-radius-label">${x.v >= 9999 ? '9999px' : x.v + 'px'}</div>
      </div>
    </div>`).join('');

  /* Border widths */
  document.getElementById('border-preview').innerHTML = borders.map(b => `
    <div class="brand-border-item">
      <div class="brand-border-box" style="border-width:${b.val}px"></div>
      <div class="brand-token-label-group">
        <div class="brand-border-token">${b.name}</div>
        <div class="brand-border-label">${b.val === 0 ? '0' : b.val + 'px'}</div>
      </div>
    </div>`).join('');

  /* Section title badges */
  document.getElementById('section-title-typo').innerHTML    = `Typography Scale ${chip(sh.toFixed(2))}`;
  document.getElementById('section-title-spacing').innerHTML = `Space ${chip(sf.toFixed(2))}`;
  document.getElementById('section-title-radius').innerHTML  = `Border Radius ${chip(rf.toFixed(2))}`;
  document.getElementById('section-title-sizing').innerHTML  = `Size ${chip(df.toFixed(2))}`;
  document.getElementById('section-title-border').innerHTML  = `Border Width ${chip(bw.toFixed(2))}`;
}


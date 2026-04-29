/* ================================================================
   RENDER: Input Fields
   ================================================================ */

function renderInputFields(r, bw, df) {
  const interfaceType = sel('fontInterface');
  const interfaceFont = interfaceType === 'serif' ? sel('fontSerif') : sel('fontSans');
  const fontStack = interfaceType === 'serif'
    ? `'${interfaceFont}', Georgia, serif`
    : `'${interfaceFont}', -apple-system, sans-serif`;

  const spacing  = calcSpacing(val('space'));
  const sizing   = calcSizing(df);
  const borders  = calcBorderWidth(Math.round(bw));
  const typo     = calcTypography(val('scale'));
  const typoMap  = Object.fromEntries(typo.map(t => [t.name, t.size]));
  const sp       = Object.fromEntries(spacing.map(s => [s.name, s.val]));
  const actionH  = (name) => sizing.find(s => s.name === name)?.val;

  /* ── Semantic Token Map ──
     Every visual property resolved from a named semantic token.
     The token object: { ref: 'semantic.xxx', val: <resolved CSS value> } */
  const T = {
    /* Color — foundation.themed */
    bgClear:      { ref: 'color.foundation.themed.base-clear',          val: isDark ? FOUNDATION.darkClear.hex  : FOUNDATION.lightClear.hex },
    bgCloudy:     { ref: 'color.foundation.themed.base-cloudy',         val: isDark ? FOUNDATION.darkCloudy.hex : FOUNDATION.lightCloudy.hex },
    fgPrimary:    { ref: 'color.foundation.themed.contrast-primary',    val: isDark ? FOUNDATION.lightClear.hex : FOUNDATION.darkClear.hex },
    fgSecondary:  { ref: 'color.foundation.themed.contrast-secondary',  val: fgSecondary(isDark ? FOUNDATION.darkCloudy.hex : FOUNDATION.lightCloudy.hex, isDark ? FOUNDATION.darkClear.hex : FOUNDATION.lightClear.hex).hex },
    fgTertiary:   { ref: 'color.foundation.themed.contrast-tertiary',   val: isDark ? 'rgba(250,250,248,0.40)' : 'rgba(20,20,18,0.40)' },
    borderSubtle: { ref: 'color.foundation.themed.base-shade',          val: isDark ? 'rgba(20,20,18,0.10)' : 'rgba(20,20,18,0.10)' },
    /* Color — feedback.error */
    errorBase:    { ref: 'color.feedback.error.themed.surface-contrast', val: (COLORS.feedback.find(c => c.key === 'error')?.hex || '#EF4444') },
    errorHigher:  { ref: 'color.feedback.error.themed.surface',          val: (() => { const e = COLORS.feedback.find(c => c.key === 'error'); if (!e) return '#FEF2F2'; const sc = generateOklchScale(e.hex); return isDark ? (sc[9]?.hex || e.hex) : (sc[0]?.hex || e.hex); })() },
    /* Space */
    padding:      { ref: 'space.padding.S',   val: sp.S },
    gap:          { ref: 'space.gap.XS',      val: sp.XS },
    gapSection:   { ref: 'space.gap.L',       val: sp.L },
    /* Size — action heights */
    heightS:      { ref: 'size.action.S',     val: actionH('action.S') },
    heightM:      { ref: 'size.action.M',     val: actionH('action.M') },
    /* Radius — from Button primary */
    radius:       { ref: 'radius.M',          val: r.M },
    /* Border width — single width for all states */
    borderW:      { ref: 'border.width.' + (borders[2]?.name || 'S'),   val: borders[2]?.val },
    /* Typography */
    typoValue:    { ref: 'typography.interface.S',   val: typoMap['interface.S'] },
    typoLabel:    { ref: 'typography.interface.XS',  val: typoMap['interface.XS'] },
    typoHelper:   { ref: 'typography.interface.XS',  val: typoMap['interface.XS'] },
    /* Opacity */
    opDisabled:   { ref: 'opacity.disabled',  val: 0.4 },
    opEnabled:    { ref: 'opacity.enabled',   val: 1 },
  };

  /* ── Token-annotated label ── */
  const tl = (token) => `<span>${token.ref}</span>`;

  /* ── Metadata display (analog to buttons) — token-style notation ── */
  const tokenLabel = (token) => {
    if (!token) return '–';
    /* color.foundation.themed.contrast-primary → foundation/contrast-primary
       color.feedback.error.themed.surface       → error/surface
       color.action.primary.base                 → action/base */
    const parts = token.ref.split('.');
    if (parts[0] === 'color' && parts.length >= 3) {
      if (parts[1] === 'foundation') return `foundation/${parts[parts.length - 1]}`;
      if (parts[1] === 'feedback')   return `${parts[2]}/${parts[parts.length - 1]}`;
      if (parts[1] === 'action')     return `action/${parts[parts.length - 1]}`;
    }
    return parts[parts.length - 1];
  };
  const inputMeta = (st) => {
    const m = [];
    if (st.fg) m.push(`<span>FG: ${tokenLabel(st.fg)}</span>`);
    if (st.bg) m.push(`<span>BG: ${tokenLabel(st.bg)}</span>`);
    if (st.border && st.borderClr) m.push(`<span>Border: ${st.border.ref.split('.').pop()} · ${tokenLabel(st.borderClr)}</span>`);
    if (st.height) m.push(`<span>Height: ${st.height.ref.split('.').pop()}</span>`);
    if (st.padding) m.push(`<span>Padding: ${st.padding.ref.split('.').pop()}</span>`);
    if (st.radius) m.push(`<span>Radius: ${st.radius.ref.split('.').pop()}</span>`);
    if (st.opacity && st.opacity.val !== 1) m.push(`<span>Opacity: Disabled (${Math.round(st.opacity.val * 100)}%)</span>`);
    return m.join('');
  };

  /* ── Base input style (Default state) ── */
  const mkStyle = (overrides = {}) => {
    const o = {
      height:     T.heightM,
      padding:    T.padding,
      border:     T.borderW,
      borderClr:  T.borderSubtle,
      radius:     T.radius,
      bg:         T.bgClear,
      fg:         T.fgPrimary,
      font:       T.typoValue,
      opacity:    T.opEnabled,
      ...overrides,
    };
    let s = `height:${o.height.val}px;padding:0 ${o.padding.val}px;`;
    s += `border:${o.border.val}px solid ${o.borderClr.val};`;
    s += `border-radius:${o.radius.val}px;`;
    s += `background:${o.bg.val};`;
    s += `color:${o.fg.val};`;
    s += `font-family:${fontStack};font-size:${o.font.val}px;`;
    s += `display:flex;align-items:center;box-sizing:border-box;width:100%;`;
    if (o.opacity.val !== 1) s += `opacity:${o.opacity.val};`;
    return s;
  };

  /* ── 4 States (no Focus — global, no Disabled — shown as Label+Helper with opacity) ── */
  const statesDef = [
    {
      label: 'Default',
      style: mkStyle(),
      content: `<span style="color:${T.fgTertiary.val}">Placeholder</span>`,
      meta: { fg: T.fgTertiary, bg: T.bgClear, border: T.borderW, borderClr: T.borderSubtle, height: T.heightM, padding: T.padding, radius: T.radius },
    },
    {
      label: 'Active',
      style: mkStyle({ borderClr: T.fgSecondary }),
      content: `John Doe`,
      meta: { fg: T.fgPrimary, bg: T.bgClear, border: T.borderW, borderClr: T.fgSecondary, height: T.heightM, padding: T.padding, radius: T.radius },
    },
    {
      label: 'Filled',
      style: mkStyle(),
      content: `John Doe`,
      meta: { fg: T.fgPrimary, bg: T.bgClear, border: T.borderW, borderClr: T.borderSubtle, height: T.heightM, padding: T.padding, radius: T.radius },
    },
    {
      label: 'Error',
      style: mkStyle({ borderClr: T.errorBase, bg: T.errorHigher, fg: T.errorBase }),
      content: `Invalid email`,
      meta: { fg: T.errorBase, bg: T.errorHigher, border: T.borderW, borderClr: T.errorBase, height: T.heightM, padding: T.padding, radius: T.radius },
    },
  ];

  const stateLabel = `<div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--color-contrast-secondary);font-family:var(--font-mono);margin-bottom:${T.gap.val}px">`;

  const row1 = `<div class="comp-input-states">${statesDef.map(st => `
    <div class="comp-input-item">
      ${stateLabel}${st.label}</div>
      <div style="${st.style}">${st.content}</div>
      <div class="comp-input-detail">${inputMeta(st.meta)}</div>
    </div>`).join('')}</div>`;

  /* ── Row 2: Textarea | Search ── */
  const row2 = `<div class="comp-input-states" style="margin-top:80px">
    <div class="comp-input-item">
      ${stateLabel}Textarea</div>
      <div style="height:${T.heightM.val * 3}px;padding:${T.padding.val}px;border:${T.borderW.val}px solid ${T.borderSubtle.val};border-radius:${T.radius.val}px;background:${T.bgClear.val};font-family:${fontStack};font-size:${T.typoValue.val}px;box-sizing:border-box;width:100%;color:${T.fgTertiary.val};line-height:1.5">Write your message here…</div>
      <div class="comp-input-detail">${inputMeta({ fg: T.fgTertiary, bg: T.bgClear, border: T.borderW, borderClr: T.borderSubtle, padding: T.padding, radius: T.radius })}</div>
    </div>
    <div class="comp-input-item">
      ${stateLabel}Search Input</div>
      <div style="${mkStyle()}gap:${T.gap.val}px;color:${T.fgTertiary.val}">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="flex-shrink:0"><circle cx="7" cy="7" r="5" stroke="${T.fgSecondary.val}" stroke-width="1.5"/><line x1="10.5" y1="10.5" x2="14" y2="14" stroke="${T.fgSecondary.val}" stroke-width="1.5" stroke-linecap="round"/></svg>
        <span>Search</span>
      </div>
      <div class="comp-input-detail">${inputMeta({ fg: T.fgTertiary, bg: T.bgClear, border: T.borderW, borderClr: T.borderSubtle, height: T.heightM, padding: T.padding, radius: T.radius })}</div>
    </div>
  </div>`;

  /* ── Row 3: Label+Helper | Disabled ── */
  const labelHelperHtml = (disabled) => `<div style="display:flex;flex-direction:column;gap:${T.gap.val}px;font-family:${fontStack}${disabled ? ';opacity:' + T.opDisabled.val : ''}">
      <label style="font-size:${T.typoLabel.val}px;font-weight:500;color:${T.fgPrimary.val}">Email Address</label>
      <div style="${mkStyle()}"><span style="color:${T.fgTertiary.val}">user@example.com</span></div>
      <span style="font-size:${T.typoHelper.val}px;color:${T.fgSecondary.val}">We'll never share your email with anyone.</span>
    </div>`;

  const row3 = `<div class="comp-input-states" style="margin-top:80px">
    <div class="comp-input-item">
      ${stateLabel}With Label + Helper</div>
      ${labelHelperHtml(false)}
      <div class="comp-input-detail">${inputMeta({ fg: T.fgTertiary, bg: T.bgClear, border: T.borderW, borderClr: T.borderSubtle, height: T.heightM, padding: T.padding, radius: T.radius })}</div>
    </div>
    <div class="comp-input-item">
      ${stateLabel}Disabled</div>
      ${labelHelperHtml(true)}
      <div class="comp-input-detail">${inputMeta({ fg: T.fgTertiary, bg: T.bgClear, border: T.borderW, borderClr: T.borderSubtle, height: T.heightM, padding: T.padding, radius: T.radius, opacity: T.opDisabled })}</div>
    </div>
  </div>`;

  document.getElementById('comp-input').innerHTML = row1 + row2 + row3;
}


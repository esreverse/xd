/* ================================================================
   UPDATE -- re-calculates tokens and re-renders
   ================================================================ */

function update() {
  const sh   = val('scale');
  const lh   = val('lh');
  const ph   = val('ph');
  const sf   = val('space');
  const rf   = val('roundness');
  const df   = val('dimension');
  const bw   = val('borderWidth');
  const pair = sel('pairing');
  const wh   = sel('weight');
  const f    = getSelectedFonts();
  const w    = WEIGHTS[wh];
  const r    = calcRadius(rf);
  const bwt  = calcBorderWidth(bw);
  const root = document.documentElement.style;

  root.setProperty('--font-family-heading', f.heading);
  root.setProperty('--font-family-body',    f.body);
  root.setProperty('--font-lineheight-heading',   1.0 * lh);
  root.setProperty('--font-lineheight-interface', 1.1 * lh);
  root.setProperty('--font-lineheight-paragraph', 1.4 * lh);
  root.setProperty('--radius-none', '0px');
  root.setProperty('--radius-s',    r.S + 'px');
  root.setProperty('--radius-m',    r.M + 'px');
  root.setProperty('--radius-l',    r.L + 'px');
  root.setProperty('--radius-xl',   r.XL + 'px');
  root.setProperty('--radius-2xl',  r['2XL'] + 'px');
  root.setProperty('--radius-pill', '9999px');
  root.setProperty('--border-width-none', '0px');
  root.setProperty('--border-width-s',    bwt[1].val + 'px');
  root.setProperty('--border-width-m',    bwt[2].val + 'px');
  root.setProperty('--border-width-l',    bwt[3].val + 'px');
  root.setProperty('--border-width-xl',   bwt[4].val + 'px');

  /* Calculate contrast-secondary against CLOUDY surface (worst case).
     Same alpha used for both clear and cloudy. */
  if (isDark) {
    const cs = fgSecondary(FOUNDATION.darkCloudy.hex, FOUNDATION.darkClear.hex);
    root.setProperty('--color-base-clear',     FOUNDATION.darkClear.hex);
    root.setProperty('--color-base-cloudy',    FOUNDATION.darkCloudy.hex);
    root.setProperty('--color-contrast-primary',   FOUNDATION.lightClear.hex);
    root.setProperty('--color-contrast-secondary', cs.hex);
  } else {
    const cs = fgSecondary(FOUNDATION.lightCloudy.hex, FOUNDATION.lightClear.hex);
    root.setProperty('--color-base-clear',     FOUNDATION.lightClear.hex);
    root.setProperty('--color-base-cloudy',    FOUNDATION.lightCloudy.hex);
    root.setProperty('--color-contrast-primary',   FOUNDATION.darkClear.hex);
    root.setProperty('--color-contrast-secondary', cs.hex);
  }

  /* Page background: canvas override > article=clear > cloudy */
  if (canvasBg) {
    const bgHex = canvasBg;
    const bgIsLight = hexToOklch(bgHex).L > 0.6;
    document.getElementById('main').style.background = bgHex;
    root.setProperty('--color-base-clear',     bgHex);
    root.setProperty('--color-base-cloudy',    bgHex);
    root.setProperty('--color-contrast-primary',   bgIsLight ? FOUNDATION.darkClear.hex : FOUNDATION.lightClear.hex);
    root.setProperty('--color-contrast-secondary', fgSecondary(bgHex).hex);
  } else {
    const mainBg = activePage === 'article'
      ? (isDark ? FOUNDATION.darkClear.hex : FOUNDATION.lightClear.hex)
      : (isDark ? FOUNDATION.darkCloudy.hex : FOUNDATION.lightCloudy.hex);
    document.getElementById('main').style.background = mainBg;
  }

  renderPanelPalette();
  if (activePage === 'overview')   renderOverview(f, w, r, rf, sh, lh, sf, df, bw);
  if (activePage === 'components') {
    const brand = COLORS.brand[0]?.hex || '#2563EB';
    renderCards(f, w, r, brand, generateOklchScale(brand), sh, sf, lh, ph, df);
    renderComponents(r, bw, df);
    renderInputFields(r, bw, df);
  }
  if (activePage === 'article')    renderArticle(f, w, r, sh, lh, ph, sf);

  /* Re-acquire hover reference after DOM rebuild (old node is detached) */
  if (hoveredCard) {
    const t = hoveredCard.dataset.colorType;
    const k = hoveredCard.dataset.colorKey;
    hoveredCard = document.querySelector(`.brand-swatch-card[data-color-type="${t}"][data-color-key="${k}"]`);
    hoveredStep = null;  /* step DOM is gone; mouseover will re-set if still hovering */
  }

  /* Sync current state to URL hash */
  if (typeof syncUrlParams === 'function') syncUrlParams();
}


/* ================================================================
   INIT
   ================================================================ */

document.addEventListener('DOMContentLoaded', () => {
  /* Populate font dropdowns */
  const sansSel  = document.getElementById('p-fontSans');
  const serifSel = document.getElementById('p-fontSerif');
  SANS_FONTS.forEach(f => { const o = document.createElement('option'); o.value = f; o.textContent = f; sansSel.appendChild(o); });
  SERIF_FONTS.forEach(f => { const o = document.createElement('option'); o.value = f; o.textContent = f; serifSel.appendChild(o); });
  sansSel.value  = 'Inter';
  serifSel.value = 'Playfair Display';

  renderLockIcons();
  /* Store HSL for all initial colors */
  [...COLORS.brand, ...COLORS.accent, ...COLORS.feedback].forEach(c => storeHsl(c));
  Object.values(FOUNDATION).forEach(c => storeHsl(c));
  /* Apply URL parameters before first render */
  if (typeof applyUrlParams === 'function') applyUrlParams();
  update();
  /* Snapshot initial hex values for Backspace reset */
  [...COLORS.brand, ...COLORS.accent, ...COLORS.feedback].forEach(c => { INITIAL_HEX[c.key] = c.hex; });
  Object.entries(FOUNDATION).forEach(([k, c]) => { INITIAL_HEX['foundation-' + k] = c.hex; });
});


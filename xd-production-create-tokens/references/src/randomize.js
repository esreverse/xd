/* ================================================================
   RANDOMIZE
   ================================================================ */

function randomize() {
  /* --- Numeric parameters: full range --- */
  const numParams = [
    { id: 'roundness',   min: 0.25, max: 4.0, step: 0.25 },
    { id: 'space',       min: 0.6,  max: 2.0, step: 0.1  },
    { id: 'dimension',   min: 0.7,  max: 1.4, step: 0.05 },
    { id: 'scale',       min: 0.5,  max: 2.0, step: 0.05 },
    { id: 'lh',          min: 0.8,  max: 1.3, step: 0.05 },
    { id: 'ph',          min: 0.3,  max: 1.8, step: 0.1  },
    { id: 'borderWidth', min: 1,    max: 4,   step: 1    },
  ];
  numParams.forEach(({ id, min, max, step }) => {
    if (locks[id]) return;
    const raw = min + Math.random() * (max - min);
    document.getElementById('p-' + id).value = parseFloat((Math.round(raw / step) * step).toFixed(2));
  });

  /* --- Select parameters --- */
  const selectParams = [
    { id: 'pairing', options: ['sans-sans', 'serif-serif', 'serif-sans', 'sans-serif'] },
    { id: 'weight',  options: ['uniform', 'moderate', 'strong'] },
  ];
  /* Randomize fonts */
  if (!locks['fontSans']) {
    const f = SANS_FONTS[Math.floor(Math.random() * SANS_FONTS.length)];
    document.getElementById('p-fontSans').value = f;
    loadFont(f);
  }
  if (!locks['fontSerif']) {
    const f = SERIF_FONTS[Math.floor(Math.random() * SERIF_FONTS.length)];
    document.getElementById('p-fontSerif').value = f;
    loadFont(f);
  }
  if (!locks['fontInterface']) {
    document.getElementById('p-fontInterface').value = Math.random() < 0.7 ? 'sans' : 'serif';
  }
  selectParams.forEach(({ id, options }) => {
    if (locks[id]) return;
    document.getElementById('p-' + id).value = options[Math.floor(Math.random() * options.length)];
  });

  /* --- Brand / Accent colors --- */
  ['brand', 'accent'].forEach(group => {
    COLORS[group].forEach(color => {
      if (colorLocks[color.key]) return;
      delete color._baseHex;
      color.hex  = randomHex();
      color.name = autoColorName(color.hex);
      storeHsl(color);
    });
  });

  /* --- Feedback colors --- */
  COLORS.feedback.forEach(color => {
    if (colorLocks[color.key]) return;
    randomizeColorOne('feedback', color.key);
  });

  /* --- Foundation colors: process as pairs; if one locked, other inherits its H+S --- */
  [['lightClear', 'lightCloudy'], ['darkClear', 'darkCloudy']].forEach(([a, b]) => {
    const aLocked = colorLocks['foundation-' + a];
    const bLocked = colorLocks['foundation-' + b];
    if (aLocked && bLocked) return;
    /* Determine shared H+S: free pair → new random; one locked → inherit from locked */
    const H = aLocked ? (FOUNDATION[a].hslH ?? 10) : bLocked ? (FOUNDATION[b].hslH ?? 10) : Math.round(Math.random() * 20);
    const S = aLocked ? (FOUNDATION[a].hslS ?? 8)  : bLocked ? (FOUNDATION[b].hslS ?? 8)  : Math.round(Math.random() * 20);
    if (!aLocked) setFoundation(a, H, S);
    if (!bLocked) setFoundation(b, H, S);
  });

  update();
}


/* ================================================================
   COLOR GENERATION HELPERS
   ================================================================ */

/* Store HSL reference values on any color object from its current hex */
function storeHsl(color) {
  const { r, g, b } = hexToRgb(color.hex);
  const hsl = rgbToHsl(r, g, b);
  color.hslH = hsl.h; color.hslS = hsl.s; color.hslL = hsl.l;
}

/* Write one foundation slot: picks a random L within its range, stores H/S/L exactly */
function setFoundation(key, H, S) {
  const { Lmin, Lmax } = FOUNDATION_DEFS[key];
  const L = Math.round(Lmin + Math.random() * (Lmax - Lmin));
  FOUNDATION[key].hex  = hslToHex(H, S, L);
  FOUNDATION[key].hslH = Math.round(H);
  FOUNDATION[key].hslS = Math.round(S);
  FOUNDATION[key].hslL = L;
}

/* Single brand/accent/feedback click — always randomizes (ignores lock) */
function randomizeColorOne(group, key) {
  const color = COLORS[group]?.find(c => c.key === key);
  if (!color) return;
  if (group === 'feedback') {
    const range = FEEDBACK_RANGES[key];
    if (!range) return;
    const H = (range.hMin + Math.random() * (range.hMax - range.hMin)) % 360;
    const L = 0.45 + Math.random() * 0.25;
    const C = 0.12 + Math.random() * 0.16;
    const { r, g, b } = oklchToRgb(L, C, H);
    color.hex = rgbToHex(r, g, b);
  } else {
    delete color._baseHex;
    color.hex  = randomHex();
    color.name = autoColorName(color.hex);
  }
  storeHsl(color);
  update();
}

/* Single foundation click — pair logic: partner adapts H+S; if partner locked, only L changes */
function randomizeFoundationOne(foundationKey) {
  const myDef      = FOUNDATION_DEFS[foundationKey];
  if (!myDef) return;
  const partnerKey    = myDef.partner;
  const partnerLocked = !!colorLocks['foundation-' + partnerKey];
  const H = partnerLocked ? (FOUNDATION[partnerKey].hslH ?? 10) : Math.round(Math.random() * 20);
  const S = partnerLocked ? (FOUNDATION[partnerKey].hslS ?? 8)  : Math.round(Math.random() * 20);
  if (!partnerLocked) setFoundation(partnerKey, H, S);
  setFoundation(foundationKey, H, S);
  update();
}


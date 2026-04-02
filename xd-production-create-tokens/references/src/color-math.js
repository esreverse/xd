/* ================================================================
   COLOR UTILITIES
   ================================================================ */

function hexToRgb(hex) {
  hex = hex.replace('#', '');
  return {
    r: parseInt(hex.substring(0, 2), 16) / 255,
    g: parseInt(hex.substring(2, 4), 16) / 255,
    b: parseInt(hex.substring(4, 6), 16) / 255,
  };
}

function rgbToHex(r, g, b) {
  const c = v => Math.max(0, Math.min(255, Math.round(v * 255))).toString(16).padStart(2, '0');
  return ('#' + c(r) + c(g) + c(b)).toUpperCase();
}

/* h: 0–360, s: 0–100, l: 0–100 → hex */
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r, g, b;
  if      (h < 60)  { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else              { r = c; g = 0; b = x; }
  return rgbToHex(r + m, g + m, b + m);
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function linearToSrgb(c) {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function rgbToOklch(r, g, b) {
  const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
  const l_ = 0.4122214708*lr + 0.5363325363*lg + 0.0514459929*lb;
  const m_ = 0.2119034982*lr + 0.6806995451*lg + 0.1073969566*lb;
  const s_ = 0.0883024619*lr + 0.2817188376*lg + 0.6299787005*lb;
  const lc = Math.cbrt(l_), mc = Math.cbrt(m_), sc = Math.cbrt(s_);
  const L  = 0.2104542553*lc + 0.7936177850*mc - 0.0040720468*sc;
  const a  = 1.9779984951*lc - 2.4285922050*mc + 0.4505937099*sc;
  const bv = 0.0259040371*lc + 0.7827717662*mc - 0.8086757660*sc;
  const C  = Math.sqrt(a*a + bv*bv);
  let H    = Math.atan2(bv, a) * (180 / Math.PI);
  if (H < 0) H += 360;
  return { L, C, H };
}

function oklchToLinearRgb(L, C, H) {
  const hRad = H * (Math.PI / 180);
  const a = C * Math.cos(hRad), b = C * Math.sin(hRad);
  const lc = L + 0.3963377774*a + 0.2158037573*b;
  const mc = L - 0.1055613458*a - 0.0638541728*b;
  const sc = L - 0.0894841775*a - 1.2914855480*b;
  const l_ = lc*lc*lc, m_ = mc*mc*mc, s_ = sc*sc*sc;
  return {
    r:  4.0767416621*l_ - 3.3077115913*m_ + 0.2309699292*s_,
    g: -1.2684380046*l_ + 2.6097574011*m_ - 0.3413193965*s_,
    b: -0.0041960863*l_ - 0.7034186147*m_ + 1.7076147010*s_,
  };
}

function oklchToRgb(L, C, H) {
  const lin = oklchToLinearRgb(L, C, H);
  return {
    r: linearToSrgb(Math.max(0, Math.min(1, lin.r))),
    g: linearToSrgb(Math.max(0, Math.min(1, lin.g))),
    b: linearToSrgb(Math.max(0, Math.min(1, lin.b))),
  };
}

function oklchInGamut(L, C, H) {
  const lin = oklchToLinearRgb(L, C, H);
  return lin.r >= -0.001 && lin.r <= 1.001 && lin.g >= -0.001 && lin.g <= 1.001 && lin.b >= -0.001 && lin.b <= 1.001;
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if      (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else                h = ((r - g) / d + 4) * 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hexToOklch(hex) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToOklch(r, g, b);
}

/* Fixed L values — equal sRGB spacing, identical across ALL palettes.
   Step 800 green has the same L as step 800 blue. */
const OKLCH_STEPS = [
  {step:50,L:0.983},{step:100,L:0.947},{step:200,L:0.873},{step:300,L:0.797},
  {step:400,L:0.720},{step:500,L:0.641},{step:600,L:0.559},{step:700,L:0.474},
  {step:800,L:0.385},{step:900,L:0.291},{step:950,L:0.240},
];

/* Max in-gamut chroma for a given L and H */
function maxGamutChroma(L, H) {
  let lo = 0, hi = 0.4;
  for (let i = 0; i < 16; i++) { const mid = (lo + hi) / 2; if (oklchInGamut(L, mid, H)) lo = mid; else hi = mid; }
  return lo;
}

/* Generate an 11-step OKLCH scale from a single hex.
   Pure function: same hex → same scale. Always.
   - L values are fixed (sRGB-equal, never shift)
   - H is extracted from the hex
   - Saturation = input C / max gamut C at the input's closest step */
function generateOklchScale(hex) {
  const ok = hexToOklch(hex);

  /* Achromatic: C too low to extract a meaningful hue */
  if (ok.C < 0.003) {
    const scale = OKLCH_STEPS.map(s => {
      const rgb = oklchToRgb(s.L, 0, 0);
      return { step: s.step, hex: rgbToHex(rgb.r, rgb.g, rgb.b), L: s.L };
    });
    let closest = 0;
    scale.forEach((s, i) => { if (Math.abs(s.L - ok.L) < Math.abs(scale[closest].L - ok.L)) closest = i; });
    scale[closest] = { step: scale[closest].step, hex: hex.toUpperCase(), L: ok.L };
    return scale;
  }

  /* Find closest step to snap the input onto */
  let closest = 0;
  OKLCH_STEPS.forEach((s, i) => { if (Math.abs(s.L - ok.L) < Math.abs(OKLCH_STEPS[closest].L - ok.L)) closest = i; });

  /* Saturation ratio: how much of the gamut does the input use at its step? */
  const maxCAtInput = maxGamutChroma(OKLCH_STEPS[closest].L, ok.H);
  const saturation = maxCAtInput > 0.001 ? Math.min(1, ok.C / maxCAtInput) : 1;

  /* Build scale: each step gets max gamut × saturation */
  const scale = OKLCH_STEPS.map(s => {
    const C = maxGamutChroma(s.L, ok.H) * saturation;
    const rgb = oklchToRgb(s.L, C, ok.H);
    return { step: s.step, hex: rgbToHex(rgb.r, rgb.g, rgb.b), L: s.L };
  });

  /* Snap the input hex onto its closest step */
  scale[closest] = { step: scale[closest].step, hex: hex.toUpperCase(), L: ok.L };
  return scale;
}

function relativeLuminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(hex1, hex2) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  const l1 = relativeLuminance(c1.r, c1.g, c1.b);
  const l2 = relativeLuminance(c2.r, c2.g, c2.b);
  /* Round to 1 decimal so display and AA/AAA checks are consistent */
  return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 10) / 10;
}

function fgPrimary(bgHex) {
  /* Pick whichever foundation color has higher contrast against bg */
  const lc = FOUNDATION.lightClear.hex;
  const dc = FOUNDATION.darkClear.hex;
  return contrastRatio(lc, bgHex) >= contrastRatio(dc, bgHex) ? lc : dc;
}

function fgSecondary(bgHex, blendBgHex) {
  const fg = fgPrimary(bgHex);
  const blendBg = blendBgHex || bgHex;
  const fgRgb = hexToRgb(fg), bgRgb = hexToRgb(blendBg);
  for (let alpha = 0.40; alpha <= 1.0; alpha += 0.01) {
    const r = fgRgb.r * alpha + bgRgb.r * (1 - alpha);
    const g = fgRgb.g * alpha + bgRgb.g * (1 - alpha);
    const b = fgRgb.b * alpha + bgRgb.b * (1 - alpha);
    const blended = rgbToHex(r, g, b);
    if (contrastRatio(blended, bgHex) >= 4.5) return { hex: blended, alpha: Math.round(alpha * 100) };
  }
  return { hex: fg, alpha: 100 };
}

function contrastTinted(bgHex, scale, cpHex) {
  /* Find the closest scale step toward contrast-primary that achieves AA (>= 4.5:1).
     cpHex = contrast-primary hex (light.clear or dark.clear) — determines search direction. */
  const bgL = hexToOklch(bgHex).L;
  const cpL = cpHex ? hexToOklch(cpHex).L : (bgL > 0.5 ? 0 : 1);
  const towardDark = cpL < bgL;
  const candidates = scale
    .map(s => ({ hex: s.hex, step: s.step, ratio: contrastRatio(s.hex, bgHex), L: s.L }))
    .filter(s => {
      if (s.ratio < 4.5) return false;
      if (Math.abs(s.L - bgL) < 0.05) return false;
      return towardDark ? s.L < bgL : s.L > bgL; /* only in cp direction */
    });
  if (!candidates.length) {
    const fp = fgPrimary(bgHex);
    return { hex: fp, step: null, ratio: contrastRatio(fp, bgHex), fromScale: false };
  }
  /* Pick the one with minimum passing contrast — closest to base = most tinted */
  candidates.sort((a, b) => a.ratio - b.ratio);
  return { hex: candidates[0].hex, step: candidates[0].step, ratio: candidates[0].ratio, fromScale: true };
}

/* Auto-name a color from its hue and lightness */
function autoColorName(hex) {
  const rgb = hexToRgb(hex);
  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b);
  if (s < 12) return l > 60 ? 'Snow' : l > 35 ? 'Stone' : 'Ink';
  const ranges = [
    [0,  15,  ['Blush',    'Rose',      'Crimson']],
    [15, 40,  ['Peach',    'Coral',     'Tangerine']],
    [40, 65,  ['Honey',    'Gold',      'Saffron']],
    [65, 90,  ['Spring',   'Lime',      'Chartreuse']],
    [90, 150, ['Sage',     'Emerald',   'Forest']],
    [150,190, ['Aqua',     'Teal',      'Cyan']],
    [190,230, ['Sky',      'Azure',     'Ocean']],
    [230,270, ['Lavender', 'Cobalt',    'Indigo']],
    [270,310, ['Orchid',   'Violet',    'Plum']],
    [310,340, ['Pink',     'Fuchsia',   'Magenta']],
    [340,360, ['Blush',    'Rose',      'Cherry']],
  ];
  let pool = ['Silver', 'Slate', 'Charcoal'];
  for (const [lo, hi, names] of ranges) {
    if (h >= lo && h < hi) { pool = names; break; }
  }
  return l > 65 ? pool[0] : l < 35 ? pool[2] : pool[1];
}

/* Generate a random visually appealing hex (brand/accent range) */
function randomHex() {
  const h = Math.round(Math.random() * 360);
  const s = Math.round(Math.random() * 100);
  const l = Math.round(Math.random() * 100);
  return hslToHex(h, s, l);
}


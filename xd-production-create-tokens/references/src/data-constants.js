/* ================================================================
   DATA: Fonts & Weights
   ================================================================ */

const SANS_FONTS = [
  'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Nunito',
  'Raleway', 'Work Sans', 'DM Sans', 'Space Grotesk', 'Outfit', 'Plus Jakarta Sans',
  'Manrope', 'Figtree', 'Sora', 'Albert Sans', 'Urbanist', 'Rubik', 'Barlow',
];
const SERIF_FONTS = [
  'Playfair Display', 'Merriweather', 'Lora', 'PT Serif', 'Libre Baskerville',
  'Source Serif 4', 'Crimson Text', 'EB Garamond', 'Cormorant', 'Spectral',
  'Bitter', 'Noto Serif', 'DM Serif Display', 'Fraunces', 'Instrument Serif',
  'Young Serif', 'Brygada 1918', 'Literata', 'Newsreader', 'Gelasio',
];

const loadedFonts = new Set(['Inter', 'Playfair Display']);
function loadFont(name) {
  if (loadedFonts.has(name)) return;
  loadedFonts.add(name);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

function getSelectedFonts() {
  const sans  = sel('fontSans');
  const serif = sel('fontSerif');
  loadFont(sans);
  loadFont(serif);
  const sansStack  = `'${sans}', -apple-system, sans-serif`;
  const serifStack = `'${serif}', Georgia, serif`;
  const monoStack  = `'JetBrains Mono', 'SF Mono', monospace`;
  const pair = sel('pairing');
  const interfaceFont = sel('fontInterface');
  const ifaceStack = interfaceFont === 'serif' ? serifStack : sansStack;
  const map = {
    'sans-sans':    { heading: sansStack,  body: sansStack,  iface: ifaceStack, mono: monoStack },
    'serif-serif':  { heading: serifStack, body: serifStack, iface: ifaceStack, mono: monoStack },
    'serif-sans':   { heading: serifStack, body: sansStack,  iface: ifaceStack, mono: monoStack },
    'sans-serif':   { heading: sansStack,  body: serifStack, iface: ifaceStack, mono: monoStack },
  };
  return map[pair] || map['serif-sans'];
}

const WEIGHTS = {
  uniform:  { base: 400, heading: 400 },
  moderate: { base: 400, heading: 600 },
  strong:   { base: 400, heading: 800 },
};


/* ================================================================
   DATA: Colors
   ================================================================ */

const COLORS = {
  brand: [
    { name: 'Steel Blue', hex: '#465F76', key: 'brand-a', hslH: null, hslS: null, hslL: null },
    { name: 'Coral', hex: '#EC8272', key: 'brand-b', hslH: null, hslS: null, hslL: null },
  ],
  accent: [],
  feedback: [
    { name: 'Info',              hex: '#3B82F6', key: 'info',    hslH: null, hslS: null, hslL: null },
    { name: 'Success',           hex: '#22C55E', key: 'success', hslH: null, hslS: null, hslL: null },
    { name: 'Warning',           hex: '#EAB308', key: 'warning', hslH: null, hslS: null, hslL: null },
    { name: 'Error/Destructive', hex: '#EF4444', key: 'error',   hslH: null, hslS: null, hslL: null },
  ],
};

const FOUNDATION = {
  lightClear:  { name: 'light.clear',  hex: '#FAFAF8', hslH: null, hslS: null, hslL: null },
  lightCloudy: { name: 'light.cloudy', hex: '#F0EFE9', hslH: null, hslS: null, hslL: null },
  darkCloudy:  { name: 'dark.cloudy',  hex: '#1E1D1A', hslH: null, hslS: null, hslL: null },
  darkClear:   { name: 'dark.clear',   hex: '#141412', hslH: null, hslS: null, hslL: null },
};

/* Shared constants — used by both global randomize() and single-click handlers */
const FEEDBACK_RANGES = {
  info:    { hMin: 200, hMax: 260 },
  success: { hMin:  95, hMax: 160 },
  warning: { hMin:  70, hMax: 110 },
  error:   { hMin: 340, hMax: 400 },
};
const FOUNDATION_DEFS = {
  lightClear:  { Lmin:  95, Lmax: 100, partner: 'lightCloudy' },
  lightCloudy: { Lmin:  90, Lmax:  95, partner: 'lightClear'  },
  darkCloudy:  { Lmin:  10, Lmax:  20, partner: 'darkClear'   },
  darkClear:   { Lmin:   0, Lmax:  10, partner: 'darkCloudy'  },
};

const COLOR_LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');
const MAX_COLORS    = 6;


/* ================================================================
   STATE
   ================================================================ */

const locks = {};
const colorLocks = {};
let isDark = false;

/* Keyboard interaction state */
const INITIAL_HEX = {};
let hoveredCard     = null;
let hoveredStep     = null;
let hoveredAction   = null;
let hoveredCompCard = null;   /* .comp-card element */
let hoveredCanvas   = false;  /* true when hovering page bg, not cards/controls */

/* Canvas override: null = default, hex = custom background */
let canvasBg = null;

/* Combo state: pairs of brand/accent colors */
const COMBO_STATE = [
];

/* Component card state: colorSource = unified palette key, null = foundation */
const CARD_STATE = [
  /* 0: Product  */ { id: 'card-0', colorSource: null, inverted: false, swapped: false, tinted: false, paddingX: 5, paddingY: 5, borderWidth: 0, borderRadius: 5 },
  /* 1: News     */ { id: 'card-1', colorSource: null, inverted: false, swapped: false, tinted: false, paddingX: 4, paddingY: 4, borderWidth: 0, borderRadius: 4 },
  /* 2: Job      */ { id: 'card-2', colorSource: null, inverted: false, swapped: false, tinted: false, paddingX: 5, paddingY: 5, borderWidth: 0, borderRadius: 4 },
  /* 3: Quote    */ { id: 'card-3', colorSource: null, inverted: false, swapped: false, tinted: false, paddingX: 6, paddingY: 6, borderWidth: 0, borderRadius: 5 },
  /* 4: Feature  */ { id: 'card-4', colorSource: null, inverted: false, swapped: false, tinted: false, paddingX: 4, paddingY: 4, borderWidth: 0, borderRadius: 4 },
  /* 5: Job 2    */ { id: 'card-5', colorSource: null, inverted: false, swapped: false, tinted: false, paddingX: 5, paddingY: 5, borderWidth: 0, borderRadius: 4 },
  /* 6: Distance */ { id: 'card-6', colorSource: null, inverted: false, swapped: false, tinted: false, paddingX: 5, paddingY: 5, borderWidth: 0, borderRadius: 3 },
  /* 7: Stats    */ { id: 'card-7', colorSource: null, inverted: false, swapped: false, tinted: false, paddingX: 5, paddingY: 5, borderWidth: 0, borderRadius: 3 },
];

/* Component action button state: colorSource = unified palette key (never null — always a brand/accent color).
   Freeform mode: fgSource/bgSource set independently (like combo). C returns to combined mode. */
const ACTION_STATE = [
  { id: 'primary',              label: 'Primary Action', group: 'Primary',   colorSource: '_brand1', variant: 'solid',   bw: 0, radius: null, inverted: true, swapped: false, tinted: false, paddingX: 5, paddingY: 2, fgSource: null, fgShade: null, bgSource: null, bgShade: null },
  { id: 'secondary-selected',   label: 'Selected',       group: 'Secondary', colorSource: 'brand-b', variant: 'outline', bw: 3, radius: null, inverted: true, swapped: false, tinted: false, paddingX: 5, paddingY: 2, fgSource: null, fgShade: null, bgSource: null, bgShade: null },
  { id: 'secondary-unselected', label: 'Unselected',     group: 'Secondary', colorSource: 'brand-b', variant: 'outline', bw: 3, radius: null, inverted: true, swapped: false, tinted: false, paddingX: 5, paddingY: 2, fgSource: null, fgShade: null, bgSource: null, bgShade: null },
  { id: 'tertiary-selected',    label: 'Selected',       group: 'Tertiary',  colorSource: 'brand-b', variant: 'ghost',   bw: 0, radius: null, inverted: true, swapped: false, tinted: false, paddingX: 5, paddingY: 2, fgSource: null, fgShade: null, bgSource: null, bgShade: null },
  { id: 'tertiary-unselected',  label: 'Unselected',     group: 'Tertiary',  colorSource: 'brand-b', variant: 'ghost',   bw: 0, radius: null, inverted: true, swapped: false, tinted: false, paddingX: 5, paddingY: 2, fgSource: null, fgShade: null, bgSource: null, bgShade: null },
];


/* ================================================================
   SVG ICONS
   ================================================================ */

const SVG_LOCK   = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:var(--lock-opacity,1)"><rect x="3.5" y="7" width="9" height="7" rx="1.5"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2"/></svg>`;
const SVG_UNLOCK = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:var(--lock-opacity,1)"><rect x="3.5" y="7" width="9" height="7" rx="1.5"/><path d="M5.5 7V4.5a2.5 2.5 0 015 0"/></svg>`;


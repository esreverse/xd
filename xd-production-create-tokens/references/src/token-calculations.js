/* ================================================================
   SNAP FUNCTIONS
   ================================================================ */

function snap4(x) { return Math.max(4, Math.round(x / 4) * 4); }
function snap2(x) { return Math.max(10, Math.round(x / 2) * 2); }
function snapTo(scale, x) {
  return scale.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a);
}
function snapMonotonic(values, step) {
  for (let i = 1; i < values.length; i++) {
    if (values[i] <= values[i - 1]) values[i] = values[i - 1] + step;
  }
  return values;
}

const RADIUS_SCALE = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64];


/* ================================================================
   TOKEN CALCULATIONS
   ================================================================ */

function calcRadius(rf) {
  let vals = [
    snapTo(RADIUS_SCALE, 2 * rf),
    snapTo(RADIUS_SCALE, 4 * rf),
    snapTo(RADIUS_SCALE, 8 * rf),
    snapTo(RADIUS_SCALE, 16 * rf),
    snapTo(RADIUS_SCALE, 32 * rf),
  ];
  vals = snapMonotonic(vals, 1);
  return { none: 0, S: vals[0], M: vals[1], L: vals[2], XL: vals[3], '2XL': vals[4], pill: 9999 };
}

function calcSpacing(sf) {
  const multipliers = [
    { name: '0',   m: 0    },
    { name: '2XS', m: 0.5  },
    { name: 'XS',  m: 1    },
    { name: 'S',   m: 1.5  },
    { name: 'M',   m: 3    },
    { name: 'L',   m: 5    },
    { name: 'XL',  m: 8    },
    { name: '2XL', m: 12   },
    { name: '3XL', m: 16   },
  ];
  let rawVals = multipliers.map(s => s.m === 0 ? 0 : snap4(4 * sf * s.m));
  let nonZero = snapMonotonic(rawVals.slice(1), 4);
  return multipliers.map((s, i) => ({ name: s.name, val: [0, ...nonZero][i] }));
}

function calcBorderWidth(bw) {
  /* Parametric: base values × multiplier. bw=1 → [0, 0.5, 1, 1.5, 2, 2.5, 3], bw=4 → [0, 2, 4, 6, 8, 10, 12] */
  const bases = [0, 0.5, 1, 1.5, 2, 2.5, 3];
  const vals = bases.map(b => Math.round(b * bw)); /* snap to integer px */
  return [
    { name: 'none', val: 0 },
    { name: 'XS',   val: vals[1] },
    { name: 'S',    val: vals[2] },
    { name: 'M',    val: vals[3] },
    { name: 'L',    val: vals[4] },
    { name: 'XL',   val: vals[5] },
    { name: '2XL',  val: vals[6] },
  ];
}

function calcSizing(df) {
  /* Icons and actions are independent scales — each gets its own monotonic pass */
  const iconBases   = [{ name: 'icon.S', base: 16 }, { name: 'icon.M', base: 24 }, { name: 'icon.L', base: 32 }, { name: 'icon.XL', base: 48 }];
  const actionBases = [{ name: 'action.XS', base: 24 }, { name: 'action.S', base: 32 }, { name: 'action.M', base: 40 }, { name: 'action.L', base: 48 }, { name: 'action.XL', base: 56 }];
  const iconVals   = snapMonotonic(iconBases.map(b => snap4(b.base * df)), 4);
  const actionVals = snapMonotonic(actionBases.map(b => snap4(b.base * df)), 4);
  return [
    ...iconBases.map((b, i)   => ({ name: b.name, val: iconVals[i],   group: 'icon'   })),
    ...actionBases.map((b, i) => ({ name: b.name, val: actionVals[i], group: 'action' })),
  ];
}

function calcTypography(sh) {
  /* Font size scale: size-0 to size-9
     Fixed: 10, 12, 14, 16, 18, 20 (interface/paragraph/heading base)
     Scaled: headings from 20px upward in 4px × sh steps */
  const headingBase = 20;
  const headingStep = 4 * sh;
  let sizes = [
    { name: 'caps.S',       token: '0',   size: 10, fixed: true,  cat: 'caps' },
    { name: 'interface.XS', token: 'XS',  size: 12, fixed: true,  cat: 'interface' },
    { name: 'interface.S',  token: 'S',   size: 14, fixed: true,  cat: 'interface' },
    { name: 'interface.M',  token: 'M',   size: 16, fixed: true,  cat: 'interface' },
    { name: 'interface.L',  token: 'L',   size: 18, fixed: true,  cat: 'interface' },
    { name: 'heading.S',    token: 'XL',  size: headingBase,                         fixed: true,  cat: 'heading' },
    { name: 'heading.M',    token: '2XL', size: Math.round(headingBase + headingStep * 1), fixed: false, cat: 'heading' },
    { name: 'heading.L',    token: '3XL', size: Math.round(headingBase + headingStep * 2), fixed: false, cat: 'heading' },
    { name: 'heading.XL',   token: '4XL', size: Math.round(headingBase + headingStep * 3), fixed: false, cat: 'heading' },
    { name: 'heading.2XL',  token: '5XL', size: Math.round(headingBase + headingStep * 4), fixed: false, cat: 'heading' },
  ];
  let scaledVals = snapMonotonic(sizes.filter(s => !s.fixed).map(s => s.size), 1);
  let j = 0;
  return sizes.map(s => { if (!s.fixed) s.size = scaledVals[j++]; return s; });
}

/* Extended typography for preview display — all categories
   Uses font size index directly: typo[i].size maps to size-i */
function calcTypographyPreview(typo) {
  const sz = (i) => typo[i]?.size || 16;
  return [
    /* Order: code → caps → interface → paragraph → heading (reversed for display: heading first) */
    { name: 'code.M',        size: sz(3),  cat: 'code' },       /* size-3 = 16 */
    { name: 'caps.S',        size: sz(0),  cat: 'caps' },       /* size-0 = 10 */
    { name: 'caps.M',        size: sz(1),  cat: 'caps' },       /* size-1 = 12 */
    { name: 'caps.L',        size: sz(2),  cat: 'caps' },       /* size-2 = 14 */
    { name: 'interface.XS',  size: sz(1),  cat: 'interface' },  /* size-1 = 12 */
    { name: 'interface.S',   size: sz(2),  cat: 'interface' },  /* size-2 = 14 */
    { name: 'interface.M',   size: sz(3),  cat: 'interface' },  /* size-3 = 16 */
    { name: 'interface.L',   size: sz(4),  cat: 'interface' },  /* size-4 = 18 */
    { name: 'interface.XL',  size: sz(5),  cat: 'interface' },  /* size-5 = 20 */
    { name: 'paragraph.XS',  size: sz(1),  cat: 'paragraph' }, /* size-1 = 12 */
    { name: 'paragraph.S',   size: sz(2),  cat: 'paragraph' }, /* size-2 = 14 */
    { name: 'paragraph.M',   size: sz(3),  cat: 'paragraph' }, /* size-3 = 16 */
    { name: 'paragraph.L',   size: sz(4),  cat: 'paragraph' }, /* size-4 = 18 */
    { name: 'paragraph.XL',  size: sz(5),  cat: 'paragraph' }, /* size-5 = 20 */
    { name: 'heading.S',     size: sz(5),  cat: 'heading' },   /* size-5 = 20 */
    { name: 'heading.M',     size: sz(6),  cat: 'heading' },   /* size-6 = 24 */
    { name: 'heading.L',     size: sz(7),  cat: 'heading' },   /* size-7 = 28 */
    { name: 'heading.XL',    size: sz(8),  cat: 'heading' },   /* size-8 = 32 */
    { name: 'heading.2XL',   size: sz(9),  cat: 'heading' },   /* size-9 = 36 */
  ];
}

/* ================================================================
   KEYBOARD & HOVER INTERACTIONS
   ================================================================ */

/* --- Hover tracking (event delegation survives DOM rebuilds) --- */

document.addEventListener('mouseover', e => {
  if (!hslDragging) {
    hoveredCard   = e.target.closest('.brand-swatch-card');
    hoveredStep   = e.target.closest('.brand-gradient-step');
  }
  hoveredAction   = e.target.closest('.comp-action-btn');
  hoveredCompCard = e.target.closest('.comp-card');
  hoveredCanvas   = !hoveredCard && !hoveredAction && !hoveredCompCard && !!e.target.closest('#main');
});

document.addEventListener('mouseout', e => {
  const rt = e.relatedTarget;
  if (!hslDragging && (!rt || !rt.closest || rt.closest('.brand-swatch-card') !== hoveredCard)) { hoveredCard = null; hoveredStep = null; }
  if (!rt || !rt.closest || rt.closest('.comp-action-btn') !== hoveredAction) { hoveredAction = null; }
  if (!rt || !rt.closest || rt.closest('.comp-card') !== hoveredCompCard) { hoveredCompCard = null; }
  if (!rt || !rt.closest('#main')) { hoveredCanvas = false; }
});

/* ================================================================
   KEYBOARD STATE MACHINE
   ================================================================ */

const ARROWS   = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const HSL_KEYS = new Set(['h', 's', 'l']);
const COMP_KEYS = new Set(['c', 'r', 'w', 'p', 'f', 'b']);

function isInInput() {
  const t = document.activeElement.tagName;
  return t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA';
}

/* Unified keyboard state */
const kb = {
  modifier: null,    /* active modifier key: 'h'|'s'|'l'|'c'|'r'|'w'|'p' */
  acted: false,      /* whether a sub-key (digit/arrow) was used during hold */
  repeatDelay: null,
  repeatTimer: null,
  shade: { scale: null, index: -1 },  /* OKLCH shade scale for C stepping */
  foundationBgCycle: 0,      /* C0: 0=base-shine, 1=base-shade */
  foundationFgCycle: 0,      /* F0: 0=contrast-primary, 1=contrast-secondary, 2=contrast-tertiary */
  foundationBgFreeformCycle: 0, /* B0: 0=base-clear, 1=base-cloudy, 2=base-shine, 3=base-shade */

  reset() { this.modifier = null; this.acted = false; this.stopRepeat(); },
  resetShade() { this.shade.scale = null; this.shade.index = -1; },
  startRepeat(fn) {
    this.stopRepeat();
    this.repeatDelay = setTimeout(() => { this.repeatTimer = setInterval(fn, 40); }, 300);
  },
  stopRepeat() {
    clearTimeout(this.repeatDelay);
    clearInterval(this.repeatTimer);
    this.repeatDelay = this.repeatTimer = null;
  },
};

/* Reset modifier state when window loses focus (prevents stuck modifiers) */
window.addEventListener('blur', () => { clearTimeout(kb._modTimeout); kb.reset(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { clearTimeout(kb._modTimeout); kb.reset(); } });


/* --- Resolvers --- */

function resolveHoveredColor() {
  if (!hoveredCard) return null;
  const type = hoveredCard.dataset.colorType;
  const key  = hoveredCard.dataset.colorKey;
  if (type === 'foundation') return FOUNDATION[key] ? { obj: FOUNDATION[key], type, key } : null;
  const color = COLORS[type]?.find(c => c.key === key);
  return color ? { obj: color, type, key } : null;
}

function resolveHoveredAction() {
  if (!hoveredAction) return null;
  const id = hoveredAction.dataset.actionId;
  return ACTION_STATE.find(s => s.id === id) || null;
}

function maybeRename(resolved) {
  if (resolved.type !== 'foundation' && resolved.type !== 'feedback')
    resolved.obj.name = autoColorName(resolved.obj.hex);
}


/* --- Color card actions --- */

const colorActions = {
  copy() {
    const hex = (hoveredStep && hoveredStep.dataset.hex)
      ? hoveredStep.dataset.hex
      : resolveHoveredColor()?.obj?.hex;
    if (!hex) return;
    const ta = document.createElement('textarea');
    ta.value = hex; ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); ta.remove();
  },

  paste(text) {
    const m = text.trim().match(/^#?([0-9A-Fa-f]{6})$/);
    if (!m) return;
    const resolved = resolveHoveredColor();
    if (!resolved) return;
    const pastedHex = '#' + m[1].toUpperCase();

    /* Search all existing color cards for a gradient step matching this hex.
       If found: clone the source color (identical gradient). If not: use hex as-is. */
    const allColors = [...COLORS.brand, ...COLORS.accent, ...COLORS.feedback];
    let donor = null;
    for (const c of allColors) {
      if (c === resolved.obj) continue; /* skip self */
      const scale = generateOklchScale(c._baseHex || c.hex);
      if (scale.some(s => s.hex === pastedHex) || c.hex === pastedHex) {
        donor = c;
        break;
      }
    }

    if (donor) {
      /* Clone donor completely — identical gradient, just different selected step */
      resolved.obj.hex = pastedHex;
      resolved.obj._baseHex = donor._baseHex || donor.hex;
    } else {
      /* External paste — no match, generate fresh */
      resolved.obj.hex = pastedHex;
      delete resolved.obj._baseHex;

    }
    storeHsl(resolved.obj); maybeRename(resolved); update();
  },

  reset() {
    const resolved = resolveHoveredColor();
    if (!resolved) return;
    const fullKey = resolved.type === 'foundation' ? 'foundation-' + resolved.key : resolved.key;
    const initial = INITIAL_HEX[fullKey];
    if (!initial) return;
    resolved.obj.hex = initial;
    storeHsl(resolved.obj); maybeRename(resolved); update();
  },

  randomizeComponent(comp) {
    const resolved = resolveHoveredColor();
    if (!resolved) return;
    const c = resolved.obj;
    if (c.hslH == null) storeHsl(c);
    if (comp === 'h') {
      const fb = resolved.type === 'feedback' && FEEDBACK_RANGES[resolved.key];
      c.hslH = fb ? Math.round((fb.hMin + Math.random() * (fb.hMax - fb.hMin)) % 360)
                   : Math.round(Math.random() * 360);
    } else if (comp === 's') {
      c.hslS = Math.round(Math.random() * 100);
    } else if (comp === 'l') {
      const fd = resolved.type === 'foundation' && FOUNDATION_DEFS[resolved.key];
      c.hslL = fd ? Math.round(fd.Lmin + Math.random() * (fd.Lmax - fd.Lmin))
                   : Math.round(Math.random() * 100);
    }
    c.hex = hslToHex(c.hslH, c.hslS, c.hslL);
    delete c._baseHex;
    maybeRename(resolved); update();
  },

  adjustComponent(delta) {
    const resolved = resolveHoveredColor();
    if (!resolved || !kb.modifier) return;
    const c = resolved.obj;
    if (c.hslH == null) storeHsl(c);
    /* Snap to integer on first step so ±1 feels consistent */
    if (kb.modifier === 'h') c.hslH = ((Math.round(c.hslH) + delta) % 360 + 360) % 360;
    if (kb.modifier === 's') c.hslS = Math.max(0, Math.min(100, Math.round(c.hslS) + delta));
    if (kb.modifier === 'l') c.hslL = Math.max(0, Math.min(100, Math.round(c.hslL) + delta));
    c.hex = hslToHex(c.hslH, c.hslS, c.hslL);
    delete c._baseHex;    maybeRename(resolved); update();
  },

  setComponentAbsolute(value) {
    const resolved = resolveHoveredColor();
    if (!resolved || !kb.modifier) return;
    const c = resolved.obj;
    if (c.hslH == null) storeHsl(c);
    if (kb.modifier === 'h') c.hslH = Math.round(value * 360);
    if (kb.modifier === 's') c.hslS = Math.round(value * 100);
    if (kb.modifier === 'l') c.hslL = Math.round(value * 100);
    c.hex = hslToHex(c.hslH, c.hslS, c.hslL);
    delete c._baseHex;    maybeRename(resolved); update();
  },

  stepShade(delta) {
    const resolved = resolveHoveredColor();
    if (!resolved || resolved.type === 'foundation') return;
    const c = resolved.obj;
    /* Store the original hex before any stepping — the scale is always generated from this.
       _baseHex is set once on first step and cleared on H/S/L change or paste. */
    if (!c._baseHex) c._baseHex = c.hex;
    const scale = generateOklchScale(c._baseHex);
    /* Find current index on the stable scale */
    if (!kb.shade.scale || kb.shade._baseHex !== c._baseHex) {
      kb.shade.scale = scale;
      kb.shade._baseHex = c._baseHex;
      kb.shade.index = scale.reduce((best, s, i) => {
        const d = Math.abs(s.L - hexToOklch(c.hex).L);
        return d < best.d ? { i, d } : best;
      }, { i: 0, d: Infinity }).i;
    }
    kb.shade.index = Math.max(0, Math.min(scale.length - 1, kb.shade.index + delta));
    c.hex = scale[kb.shade.index].hex;
    storeHsl(c); maybeRename(resolved); update();
  },

  duplicate() {
    const resolved = resolveHoveredColor();
    if (!resolved) return;
    const { type, key, obj } = resolved;
    if (type !== 'brand' && type !== 'accent') return;
    /* no limit */
    const newKey = nextColorKey(type);
    if (!newKey) return;
    const clone = { name: obj.name, hex: obj.hex, key: newKey, hslH: obj.hslH, hslS: obj.hslS, hslL: obj.hslL, _baseHex: obj._baseHex };
    const idx = COLORS[type].findIndex(c => c.key === key);
    COLORS[type].splice(idx + 1, 0, clone);
    INITIAL_HEX[newKey] = clone.hex;
    update();
    /* Re-acquire hoveredCard after DOM rebuild so Backspace works on the new card */
    hoveredCard = document.querySelector(`.brand-swatch-card[data-color-key="${newKey}"]`);
  },
};

document.addEventListener('paste', e => {
  if (isInInput() || !hoveredCard) return;
  e.preventDefault();
  colorActions.paste(e.clipboardData.getData('text'));
});


/* --- HSL drag: hold H/S/L + drag mouse — delta-based, 3px = 1 unit --- */
let hslDragging = false;
let hslDragModifier = null;
let hslDragStartX = 0;       /* clientX at drag start */
let hslDragAccum = 0;        /* accumulated sub-pixel remainder */

function hslDragApplyDelta(clientX) {
  const resolved = resolveHoveredColor();
  if (!resolved) return;
  const c = resolved.obj;
  if (c.hslH == null) storeHsl(c);

  const rawDelta = clientX - hslDragStartX;
  hslDragStartX = clientX;
  hslDragAccum += rawDelta;

  /* 3px mouse movement = 1 unit change */
  const steps = Math.trunc(hslDragAccum / 3);
  if (steps === 0) return;
  hslDragAccum -= steps * 3;

  if (hslDragModifier === 'h') {
    c.hslH = ((Math.round(c.hslH) + steps) % 360 + 360) % 360;
  } else if (hslDragModifier === 's') {
    c.hslS = Math.max(0, Math.min(100, Math.round(c.hslS) + steps));
  } else if (hslDragModifier === 'l') {
    c.hslL = Math.max(0, Math.min(100, Math.round(c.hslL) + steps));
  }
  c.hex = hslToHex(c.hslH, c.hslS, c.hslL);
  delete c._baseHex;  maybeRename(resolved); update();
}

document.addEventListener('mousedown', e => {
  if (!hoveredCard || !kb.modifier || !HSL_KEYS.has(kb.modifier)) return;
  if (isInInput()) return;
  e.preventDefault();
  hslDragging = true;
  hslDragModifier = kb.modifier;
  hslDragStartX = e.clientX;
  hslDragAccum = 0;
  kb.acted = true;
  document.body.style.userSelect = 'none';
  document.body.style.cursor = 'ew-resize';
});

document.addEventListener('mousemove', e => {
  if (!hslDragging) return;
  e.preventDefault();
  hslDragApplyDelta(e.clientX);
});

document.addEventListener('mouseup', () => {
  if (!hslDragging) return;
  hslDragging = false;
  hslDragModifier = null;
  hslDragAccum = 0;
  document.body.style.userSelect = '';
  document.body.style.cursor = '';
});


/* --- Component action actions --- */

const compActions = {
  /* Find closest shade index for a hex in a scale */
  _findShadeIndex(scale, hex) {
    const ok = hexToOklch(hex);
    return scale.reduce((best, s, i) => {
      const d = Math.abs(s.L - ok.L);
      return d < best.d ? { i, d } : best;
    }, { i: 0, d: Infinity }).i;
  },

  /* Pick random palette color at a random shade */
  _randomPaletteShade() {
    const palette = colorPalette();
    const base = palette.length ? palette[Math.floor(Math.random() * palette.length)].hex : randomHex();
    const scale = generateOklchScale(base);
    return scale[Math.floor(Math.random() * scale.length)].hex;
  },

  applyDigit(digit) {
    const state = resolveHoveredAction();
    if (!state) return;
    const mod = kb.modifier;

    if (mod === 'f' || mod === 'b') {
      if (digit === 0) {
        /* ── FOUNDATION FREEFORM ── */
        if (mod === 'f') {
          /* F0: cycle contrast-primary → contrast-secondary → contrast-tertiary */
          const CYCLE = ['_f-contrast-primary', '_f-contrast-secondary', '_f-contrast-tertiary'];
          state.fgSource = CYCLE[kb.foundationFgCycle % CYCLE.length];
          state.fgShade = null;
          kb.foundationFgCycle = (kb.foundationFgCycle + 1) % CYCLE.length;
          if (!state.bgSource) { state.bgSource = '_f-base-clear'; state.bgShade = null; }
        } else {
          /* B0: cycle base-clear → base-cloudy → base-shine → base-shade */
          const CYCLE = ['_f-base-clear', '_f-base-cloudy', '_f-base-shine', '_f-base-shade'];
          state.bgSource = CYCLE[kb.foundationBgFreeformCycle % CYCLE.length];
          state.bgShade = null;
          kb.foundationBgFreeformCycle = (kb.foundationBgFreeformCycle + 1) % CYCLE.length;
          if (!state.fgSource) { state.fgSource = '_f-contrast-primary'; state.fgShade = null; }
        }
        state.colorSource = null;
        /* Freeform resets I/S/T */
        state.inverted = false; state.swapped = false; state.tinted = false;
      } else {
        /* ── FREEFORM MODE ──
           F/B + 1-N: pick from brand+accent palette (no combos).
           First entry: BOTH channels get the chosen color — BG=base, FG=contrast-secondary.
           Subsequent: only the pressed channel changes. */
        const palette = colorPalette(); /* brand + accent only */
        if (digit > palette.length) return; /* ignore out of range */
        const chosen = palette[digit - 1];
        const scale = generateOklchScale(chosen.hex);
        /* Use the ADJUSTED themed base from buildBrandTokenSets (same as combined mode shows) */
        const sets = buildBrandTokenSets(chosen.hex);
        const themedBaseHex = sets.themed.base;
        const themedBaseIdx = compActions._findShadeIndex(scale, themedBaseHex);

        const isFirstEntry = !state.fgSource && !state.bgSource;

        if (isFirstEntry) {
          /* Both channels: BG = themed base shade, FG = contrast-secondary shade */
          const csHex = sets.themed['contrast-secondary'];
          const csIdx = compActions._findShadeIndex(scale, csHex);
          state.bgSource = chosen.key; state.bgShade = themedBaseIdx;
          state.fgSource = chosen.key; state.fgShade = csIdx;
        } else {
          /* Only update the pressed channel — use themed base */
          const prop = mod === 'f' ? 'fg' : 'bg';
          state[prop + 'Source'] = chosen.key;
          state[prop + 'Shade'] = themedBaseIdx;
        }
        state.colorSource = null; /* exit combined mode */
        /* Freeform resets I/S/T */
        state.inverted = false; state.swapped = false; state.tinted = false;
      }
    } else if (mod === 'c') {
      /* C+0: Foundation combined mode; C+1-9: unified palette */
      if (digit === 0) {
        /* C0: Foundation combined — cycles BG: base-clear → base-cloudy → base-shine → base-shade */
        const BG_CYCLE = ['_f-base-clear', '_f-base-cloudy', '_f-base-shine', '_f-base-shade'];
        state.colorSource = '_foundation';
        state.fgSource = null; state.fgShade = null;
        state.bgSource = null; state.bgShade = null;
        state._foundationBg = BG_CYCLE[kb.foundationBgCycle % BG_CYCLE.length];
        kb.foundationBgCycle = (kb.foundationBgCycle + 1) % BG_CYCLE.length;
        update(); return;
      }
      const up = unifiedPalette();
      if (digit > up.length) return; /* ignore out of range */
      if (up[digit - 1]) state.colorSource = up[digit - 1].key;
      /* Returning to combined mode clears freeform */
      state.fgSource = null; state.fgShade = null;       state.bgSource = null; state.bgShade = null;     } else if (mod === 'w') {
      if (digit === 0) state.bw = 0;
      else {
        const bwTokens = calcBorderWidth(Math.round(val('borderWidth')));
        if (digit < bwTokens.length) state.bw = digit;
      }
    } else if (mod === 'r') {
      const next = digit === 0 ? 0 : (digit < RADIUS_TOKENS.length ? digit : null);
      if (next !== null) ACTION_STATE.forEach(s => { s.radius = next; });
    }
    update();
  },

  stepColorSource(delta) {
    const state = resolveHoveredAction();
    if (!state) return;
    const up = unifiedPalette();
    if (!up.length) return;
    if (state.colorSource === null) {
      state.colorSource = delta > 0 ? up[0].key : up[up.length - 1].key;
    } else {
      const idx = up.findIndex(p => p.key === state.colorSource);
      const next = idx + delta;
      if (next < 0) state.colorSource = null;
      else if (next >= up.length) state.colorSource = null;
      else state.colorSource = up[next].key;
    }
    update();
  },

  stepWidth(delta) {
    const state = resolveHoveredAction();
    if (!state) return;
    const max = calcBorderWidth(Math.round(val('borderWidth'))).length - 1;
    state.bw = Math.max(0, Math.min(max, state.bw + delta));
    update();
  },

  stepRadius(delta) {
    const state = resolveHoveredAction();
    if (!state) return;
    const cur = state.radius ?? 2; /* default M = index 2 */
    const next = Math.max(0, Math.min(RADIUS_TOKENS.length - 1, cur + delta));
    ACTION_STATE.forEach(s => { s.radius = next; });
    update();
  },

  /* F/B + arrows: step through the shade of the FG or BG color */
  stepFgBg(mod, delta) {
    const state = resolveHoveredAction();
    if (!state) return;
    const prop = mod === 'f' ? 'fg' : 'bg';
    const srcKey = state[prop + 'Source'];
    if (!srcKey) return; /* no color set yet — need F/B + digit first */
    const palette = colorPalette();
    const color = palette.find(c => c.key === srcKey);
    if (!color) return;
    const scale = generateOklchScale(color.hex);
    const curShade = state[prop + 'Shade'] ?? compActions._findShadeIndex(scale, color.hex);
    const next = Math.max(0, Math.min(scale.length - 1, curShade + delta));
    state[prop + 'Shade'] = next;
    update();
  },

  randomize() {
    const state = resolveHoveredAction();
    if (!state) return;
    const mod = kb.modifier;

    if (mod === 'c') {
      const up = unifiedPalette();
      if (up.length) state.colorSource = up[Math.floor(Math.random() * up.length)].key;
    } else if (mod === 'w') {
      state.bw = Math.floor(Math.random() * calcBorderWidth(Math.round(val('borderWidth'))).length);
    } else if (mod === 'r') {
      const next = Math.floor(Math.random() * RADIUS_TOKENS.length);
      ACTION_STATE.forEach(s => { s.radius = next; });
    }
    update();
  },

  reset() {
    const state = resolveHoveredAction();
    if (!state) return;
    state.colorSource = '_brand1'; state.swapped = false;
    state.fgSource = null; state.fgShade = null;     state.bgSource = null; state.bgShade = null;     state.bw = state.group === 'Secondary' ? 3 : 0;
    /* Reset variant to group default */
    if (state.group === 'Primary') state.variant = 'solid';
    else if (state.group === 'Secondary') state.variant = 'outline';
    else state.variant = 'ghost';
    state.inverted = false; state.tinted = false;
    /* Padding + radius sync across all buttons */
    ACTION_STATE.forEach(a => { a.paddingX = 5; a.paddingY = 2; a.radius = null; });
    kb.resetShade(); update();
  },
};


/* --- Canvas actions (F + digits/arrows on page background) --- */

const canvasActions = {
  applyDigit(digit) {
    const palette = colorPalette();
    if (digit === 0 || digit > palette.length) return; /* ignore 0 + out of range */
    const base = palette[digit - 1]?.hex;
    if (!base) return;
    kb.shade.scale = generateOklchScale(base);
    /* Light mode → step 200 (light tint), Dark mode → step 800 (dark shade) */
    const targetStep = isDark ? 800 : 200;
    kb.shade.index = kb.shade.scale.findIndex(s => s.step === targetStep);
    if (kb.shade.index < 0) kb.shade.index = 0;
    canvasBg = kb.shade.scale[kb.shade.index].hex;
    update();
  },

  applyShade(delta) {
    /* Lazy-init from current canvasBg */
    if (!kb.shade.scale) {
      const hex = canvasBg || (isDark ? FOUNDATION.darkCloudy.hex : FOUNDATION.lightCloudy.hex);
      kb.shade.scale = generateOklchScale(hex);
      kb.shade.index = compActions._findShadeIndex(kb.shade.scale, hex);
    }
    kb.shade.index = Math.max(0, Math.min(kb.shade.scale.length - 1, kb.shade.index + delta));
    canvasBg = kb.shade.scale[kb.shade.index].hex;
    update();
  },

  randomize() {
    canvasBg = compActions._randomPaletteShade();
    update();
  },

  reset() {
    canvasBg = null; kb.resetShade(); update();
  },
};


/* --- Card actions (C + digits/arrows on comp cards) --- */

const cardActions = {
  _resolve() {
    if (!hoveredCompCard) return null;
    const id = parseInt(hoveredCompCard.dataset.cardId);
    return CARD_STATE[id] ?? null;
  },

  applyDigit(digit) {
    const state = this._resolve();
    if (!state) return;
    const up = unifiedPalette();
    if (digit === 0) { state.colorSource = null; kb.resetShade(); }
    else {
      if (up[digit - 1]) state.colorSource = up[digit - 1].key;
    }
    update();
  },

  stepColorSource(delta) {
    const state = this._resolve();
    if (!state) return;
    const up = unifiedPalette();
    if (!up.length) return;
    if (state.colorSource === null) {
      state.colorSource = delta > 0 ? up[0].key : up[up.length - 1].key;
    } else {
      const idx = up.findIndex(p => p.key === state.colorSource);
      const next = idx + delta;
      if (next < 0) state.colorSource = null;
      else if (next >= up.length) state.colorSource = null;
      else state.colorSource = up[next].key;
    }
    update();
  },

  randomize() {
    const state = this._resolve();
    if (!state) return;
    const up = unifiedPalette();
    if (up.length) state.colorSource = up[Math.floor(Math.random() * up.length)].key;
    update();
  },

  toggleInverted() {
    const state = this._resolve();
    if (!state) return;
    state.inverted = !state.inverted;
    update();
  },

  toggleSwapped() {
    const state = this._resolve();
    if (!state) return;
    state.swapped = !state.swapped;
    update();
  },

  toggleTinted() {
    const state = this._resolve();
    if (!state) return;
    state.tinted = !state.tinted;
    update();
  },

  stepPaddingX(delta) {
    const state = this._resolve();
    if (!state) return;
    const spacing = calcSpacing(val('space'));
    state.paddingX = Math.max(0, Math.min(spacing.length - 1, state.paddingX + delta));
    update();
  },

  stepPaddingY(delta) {
    const state = this._resolve();
    if (!state) return;
    const spacing = calcSpacing(val('space'));
    state.paddingY = Math.max(0, Math.min(spacing.length - 1, state.paddingY + delta));
    update();
  },

  stepWidth(delta) {
    const state = this._resolve();
    if (!state) return;
    const max = calcBorderWidth(Math.round(val('borderWidth'))).length - 1;
    state.borderWidth = Math.max(0, Math.min(max, state.borderWidth + delta));
    update();
  },

  stepRadius(delta) {
    const state = this._resolve();
    if (!state) return;
    state.borderRadius = Math.max(0, Math.min(RADIUS_TOKENS.length - 1, state.borderRadius + delta));
    update();
  },

  reset() {
    const state = this._resolve();
    if (!state) return;
    state.colorSource = null; state.inverted = false; state.swapped = false; state.tinted = false;
    state.paddingX = 4; state.paddingY = 4; state.borderWidth = 0; state.borderRadius = 3;
    kb.resetShade(); update();
  },
};


/* --- Event handlers --- */

document.addEventListener('keydown', e => {
  const noMod = !e.metaKey && !e.ctrlKey && !e.altKey;

  /* Enter — disabled (randomize only via click on color swatches) */

  /* --- Combo cards: Cmd+D / Backspace (need meta keys, so outside noMod block) --- */
  if (hoveredCard && hoveredCard.dataset.colorType === 'combo' && !isInInput()) {
    const comboId = hoveredCard.dataset.colorKey;
    const combo = COMBO_STATE.find(c => c.id === comboId);
    if (combo) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        e.preventDefault();
        const newId = nextComboKey();
        if (!newId) return;
        const idx = COMBO_STATE.findIndex(c => c.id === comboId);
        COMBO_STATE.splice(idx + 1, 0, { id: newId, bgSource: combo.bgSource, fgSource: combo.fgSource, bgShade: combo.bgShade, fgShade: combo.fgShade, inverted: combo.inverted });
        update();
        return;
      }
      if (e.key === 'Backspace' && noMod) { e.preventDefault(); clearTimeout(kb._modTimeout); kb.modifier = null; kb.acted = false; removeCombo(comboId); return; }
    }
  }

  /* --- Combo cards: F/B + digits/arrows, I toggle (noMod keys) --- */
  if (hoveredCard && hoveredCard.dataset.colorType === 'combo' && !isInInput() && noMod) {
    const comboId = hoveredCard.dataset.colorKey;
    const combo = COMBO_STATE.find(c => c.id === comboId);
    if (combo) {
      if (e.key === 'i' && !kb.modifier) {
        e.preventDefault();
        combo.inverted = !combo.inverted;
        update();
        return;
      }
      if (('fb').includes(e.key) && !kb.modifier) { kb.modifier = e.key; return; }
      /* When inverted, b/f swap their targets: b→fg (visually base), f→bg (visually contrast) */
      const isBase = (mod) => combo.inverted ? mod === 'f' : mod === 'b';
      if (kb.modifier && ('fb').includes(kb.modifier) && e.key >= '1' && e.key <= '9') {
        e.preventDefault(); kb.acted = true;
        const palette = colorPalette();
        const target = palette[parseInt(e.key) - 1];
        if (target) {
          if (isBase(kb.modifier)) { combo.bgSource = target.key; combo.bgShade = null; }
          else { combo.fgSource = target.key; combo.fgShade = null; }
          clearTimeout(kb._modTimeout); kb.modifier = null; kb.acted = false;
          update();
        }
        return;
      }
      /* F/B + arrows: step shade through OKLCH scale */
      if (kb.modifier && ('fb').includes(kb.modifier) && ARROWS.has(e.key)) {
        e.preventDefault(); kb.acted = true;
        const delta = (e.key === 'ArrowUp' || e.key === 'ArrowRight') ? 1 : -1;
        const srcKey = isBase(kb.modifier) ? combo.bgSource : combo.fgSource;
        const srcColor = colorPalette().find(c => c.key === srcKey);
        if (srcColor) {
          const scale = generateOklchScale(srcColor.hex);
          const prop = isBase(kb.modifier) ? 'bgShade' : 'fgShade';
          if (combo[prop] == null) {
            const ok = hexToOklch(srcColor.hex);
            combo[prop] = scale.reduce((best, s, i) => Math.abs(s.L - ok.L) < Math.abs(scale[best].L - ok.L) ? i : best, 0);
          }
          combo[prop] = Math.max(0, Math.min(scale.length - 1, combo[prop] + delta));
          update();
        }
        return;
      }
    }
  }

  /* --- Color cards (H/S/L + arrows, clipboard, reset) --- */
  if (hoveredCard) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'c') { e.preventDefault(); colorActions.copy(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') { e.preventDefault(); colorActions.duplicate(); return; }
    if (e.key === 'Backspace' && !isInInput()) { e.preventDefault(); colorActions.reset(); return; }
    if ((HSL_KEYS.has(e.key) || (e.key === 'b' && !hoveredAction)) && !isInInput() && noMod) { kb.modifier = e.key; return; }
    if (kb.modifier && HSL_KEYS.has(kb.modifier) && ARROWS.has(e.key)) {
      e.preventDefault(); kb.acted = true;
      const delta = (e.key === 'ArrowUp' || e.key === 'ArrowRight') ? 1 : -1;
      if (!e.repeat) { colorActions.adjustComponent(delta); kb.startRepeat(() => colorActions.adjustComponent(delta)); }
      return;
    }
    /* B + arrows: step through OKLCH shade scale (only for color cards, not action buttons) */
    if (kb.modifier === 'b' && !hoveredAction && ARROWS.has(e.key)) {
      e.preventDefault(); kb.acted = true;
      const delta = (e.key === 'ArrowUp' || e.key === 'ArrowRight') ? 1 : -1;
      if (!e.repeat) { colorActions.stepShade(delta); kb.startRepeat(() => colorActions.stepShade(delta)); }
      return;
    }
  }

  /* --- Component actions (C/R/W/P + digits/arrows, V/S/I/T toggles, reset) --- */
  if (hoveredAction && !isInInput() && noMod) {
    if (COMP_KEYS.has(e.key) && !kb.modifier) { kb.modifier = e.key; return; }
    if (kb.modifier && COMP_KEYS.has(kb.modifier)) {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault(); kb.acted = true;
        clearTimeout(kb._modTimeout);
        compActions.applyDigit(parseInt(e.key));
        return;
      }
      /* Arrows: C/W/R/P */
      if (ARROWS.has(e.key)) {
        e.preventDefault(); kb.acted = true;
        clearTimeout(kb._modTimeout);
        const delta = (e.key === 'ArrowUp' || e.key === 'ArrowRight') ? 1 : -1;
        if (kb.modifier === 'f' || kb.modifier === 'b') { compActions.stepFgBg(kb.modifier, delta); }
        else if (kb.modifier === 'c') { compActions.stepColorSource(delta); }
        else if (kb.modifier === 'w') { compActions.stepWidth(delta); }
        else if (kb.modifier === 'r') { compActions.stepRadius(delta); }
        else if (kb.modifier === 'p') {
          const s = resolveHoveredAction();
          if (s) {
            const spacing = calcSpacing(val('space'));
            let newPx = s.paddingX, newPy = s.paddingY;
            if (e.key === 'ArrowUp') newPy = Math.min(s.paddingY + 1, spacing.length - 1);
            else if (e.key === 'ArrowDown') newPy = Math.max(s.paddingY - 1, 0);
            else if (e.key === 'ArrowRight') newPx = Math.min(s.paddingX + 1, spacing.length - 1);
            else if (e.key === 'ArrowLeft') newPx = Math.max(s.paddingX - 1, 0);
            ACTION_STATE.forEach(a => { a.paddingX = newPx; a.paddingY = newPy; });
            update();
          }
        }
        return;
      }
      /* Modifier + Backspace: reset that specific property */
      if (e.key === 'Backspace') {
        e.preventDefault(); kb.acted = true;
        clearTimeout(kb._modTimeout);
        const s = resolveHoveredAction();
        if (s) {
          if (kb.modifier === 'f') { s.fgSource = null; s.fgShade = null; }
          else if (kb.modifier === 'b') { s.bgSource = null; s.bgShade = null; }
          else if (kb.modifier === 'c') { s.colorSource = '_brand1'; s.fgSource = null; s.fgShade = null; s.bgSource = null; s.bgShade = null; kb.resetShade(); }
          else if (kb.modifier === 'w') s.bw = 2;
          else if (kb.modifier === 'r') ACTION_STATE.forEach(a => { a.radius = null; });
          else if (kb.modifier === 'p') ACTION_STATE.forEach(a => { a.paddingX = 5; a.paddingY = 2; });
          update();
        }
        kb.modifier = null; kb.acted = false;
        return;
      }
    }
    /* V: cycle variant (solid → outline → ghost) */
    if (e.key === 'v' && !kb.modifier) {
      e.preventDefault();
      const s = resolveHoveredAction();
      if (s) {
        const variants = ['solid', 'outline', 'ghost'];
        const idx = variants.indexOf(s.variant);
        s.variant = variants[(idx + 1) % 3];
        /* Sync bw: outline → 3, others → 0 */
        s.bw = s.variant === 'outline' ? 3 : 0;
        update();
      }
      return;
    }
    /* S/I/T toggles — disabled in freeform mode (F/B sets colors directly) */
    if (e.key === 's' && !kb.modifier) { e.preventDefault(); const s = resolveHoveredAction(); if (s && !s.fgSource && !s.bgSource) { s.swapped = !s.swapped; update(); } return; }
    if (e.key === 'i' && !kb.modifier) { e.preventDefault(); const s = resolveHoveredAction(); if (s && !s.fgSource && !s.bgSource) { s.inverted = !s.inverted; update(); } return; }
    if (e.key === 't' && !kb.modifier) { e.preventDefault(); const s = resolveHoveredAction(); if (s && !s.fgSource && !s.bgSource) { s.tinted = !s.tinted; update(); } return; }

    /* Backspace: reset all (also clears any active modifier) */
    if (e.key === 'Backspace') { e.preventDefault(); clearTimeout(kb._modTimeout); kb.modifier = null; kb.acted = false; compActions.reset(); return; }
  }

  /* --- Component cards (C + digits/arrows, W/R/P + arrows, S/I/T toggles) --- */
  if (hoveredCompCard && !isInInput() && noMod) {
    /* Modifier keys */
    if ('cwrp'.includes(e.key) && !kb.modifier) { kb.modifier = e.key; return; }

    /* C + digits: unified palette color */
    if (kb.modifier === 'c' && e.key >= '0' && e.key <= '9') {
      e.preventDefault(); kb.acted = true;
      clearTimeout(kb._modTimeout);
      cardActions.applyDigit(parseInt(e.key));
      return;
    }

    /* C/W/R/P + arrows */
    if (ARROWS.has(e.key) && 'cwrp'.includes(kb.modifier)) {
      e.preventDefault(); kb.acted = true;
      clearTimeout(kb._modTimeout);
      const delta = (e.key === 'ArrowUp' || e.key === 'ArrowRight') ? 1 : -1;
      if (kb.modifier === 'c') cardActions.stepColorSource(delta);
      else if (kb.modifier === 'w') cardActions.stepWidth(delta);
      else if (kb.modifier === 'r') cardActions.stepRadius(delta);
      else if (kb.modifier === 'p') {
        if (e.key === 'ArrowUp') cardActions.stepPaddingY(1);
        else if (e.key === 'ArrowDown') cardActions.stepPaddingY(-1);
        else if (e.key === 'ArrowRight') cardActions.stepPaddingX(1);
        else if (e.key === 'ArrowLeft') cardActions.stepPaddingX(-1);
      }
      return;
    }

    /* Modifier + Backspace: reset that property */
    if (e.key === 'Backspace' && kb.modifier) {
      e.preventDefault(); kb.acted = true;
      clearTimeout(kb._modTimeout);
      const s = cardActions._resolve();
      if (s) {
        if (kb.modifier === 'c') { s.colorSource = null; kb.resetShade(); }
        else if (kb.modifier === 'w') s.borderWidth = 0;
        else if (kb.modifier === 'r') s.borderRadius = 3;
        else if (kb.modifier === 'p') { s.paddingX = 4; s.paddingY = 4; }
        update();
      }
      kb.modifier = null; kb.acted = false;
      return;
    }

    /* S/I/T toggles */
    if (e.key === 's' && !kb.modifier) { e.preventDefault(); cardActions.toggleSwapped(); return; }
    if (e.key === 'i' && !kb.modifier) { e.preventDefault(); cardActions.toggleInverted(); return; }
    if (e.key === 't' && !kb.modifier) { e.preventDefault(); cardActions.toggleTinted(); return; }

    /* Plain Backspace: reset all */
    if (e.key === 'Backspace' && !kb.modifier) { e.preventDefault(); cardActions.reset(); return; }
  }

  /* --- Canvas background (C + digits/arrows on page bg) --- */
  if (hoveredCanvas && !isInInput() && noMod) {
    if (e.key === 'c' && !kb.modifier) { kb.modifier = 'c'; return; }
    if (kb.modifier === 'c') {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault(); kb.acted = true;
        clearTimeout(kb._modTimeout);
        canvasActions.applyDigit(parseInt(e.key));
        return;
      }
      if (ARROWS.has(e.key)) {
        e.preventDefault(); kb.acted = true;
        clearTimeout(kb._modTimeout);
        canvasActions.applyShade((e.key === 'ArrowUp' || e.key === 'ArrowRight') ? 1 : -1);
        return;
      }
    }
    if (e.key === 'Backspace') { e.preventDefault(); canvasActions.reset(); return; }
  }
});

document.addEventListener('keyup', e => {
  if (!kb.modifier) return;
  /* HSL release — skip reset while mouse-drag is active */
  if (HSL_KEYS.has(e.key) && e.key === kb.modifier) {
    if (hslDragging) return;
    /* No tap-randomize — just release modifier */
    kb.reset();
  }
  /* B release on color card — shade stepping has no tap action */
  if (e.key === 'b' && kb.modifier === 'b' && hoveredCard) {
    kb.reset(); kb.resetShade();
    return;
  }
  /* Comp / Canvas release — modifier stays active for follow-up key.
     Tap randomize is delayed — canceled if a follow-up key arrives within 400ms. */
  if (e.key === kb.modifier && COMP_KEYS.has(e.key)) {
    clearTimeout(kb._modTimeout);
    /* Release modifier — no tap-randomize, immediate release */
    kb.modifier = null; kb.acted = false;
  }
  if (ARROWS.has(e.key)) kb.stopRepeat();
});

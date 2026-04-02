/* ================================================================
   KEY LEGEND PILL
   Left-side pill showing available keyboard shortcuts.
   - Chips for each available key when hovering interactive elements
   - Description text when a modifier key is held
   ================================================================ */

const keyLegend = (() => {
  const el = document.getElementById('key-legend');
  let rafId = null;

  /* --- Key descriptions (matches hotkey table at page bottom) --- */

  const KEY_DESC = {
    /* Color cards (brand, accent, feedback) */
    colorCard: {
      H: '<strong>Hue</strong> — Hold + ←→ or Drag',
      S: '<strong>Saturation</strong> — Hold + ←→ or Drag',
      L: '<strong>Lightness</strong> — Hold + ←→ or Drag',
      B: '<strong>Shade</strong> — Hold + ←→',
    },
    /* Foundation color cards (no B/shade stepping) */
    foundationCard: {
      H: '<strong>Hue</strong> — Hold + ←→ or Drag',
      S: '<strong>Saturation</strong> — Hold + ←→ or Drag',
      L: '<strong>Lightness</strong> — Hold + ←→ or Drag',
    },
    /* Combo cards */
    comboCard: {
      F: '<strong>Foreground</strong> — Hold + 1–9 or ←→',
      B: '<strong>Background</strong> — Hold + 1–9 or ←→',
      I: '<strong>Invert</strong>',
    },
    /* Action buttons */
    actionBtn: {
      C: '<strong>Color</strong> — Hold + 1–9 / 0: Foundation / ←→',
      F: '<strong>Foreground</strong> — Hold + 1–9 / ←→ / 0: Foundation',
      B: '<strong>Background</strong> — Hold + 1–9 / ←→ / 0: Foundation',
      W: '<strong>Border Width</strong> — Hold + ←→ / 0: None',
      R: '<strong>Border Radius</strong> — Hold + ←→ / 0: None',
      P: '<strong>Padding</strong> — Hold + ←→ ↑↓',
      V: '<strong>Variant</strong> — Solid → Outline → Ghost',
      S: '<strong>Swap</strong> FG / BG',
      I: '<strong>Invert</strong> — Themed / Inverted',
      T: '<strong>Tint</strong> — Contrast Primary / Secondary',
    },
    /* Component cards */
    compCard: {
      C: '<strong>Color</strong> — Hold + 1–9 / 0: Reset / ←→',
      W: '<strong>Border Width</strong> — Hold + ←→',
      R: '<strong>Border Radius</strong> — Hold + ←→',
      P: '<strong>Padding</strong> — Hold + ←→ ↑↓',
      S: '<strong>Swap</strong> FG / BG',
      I: '<strong>Invert</strong>',
      T: '<strong>Tint</strong>',
    },
    /* Canvas */
    canvas: {
      C: '<strong>Canvas Color</strong> — Hold + 1–9 / ←→',
    },
    /* Font dropdowns */
    fontSelect: {},
  };

  /* --- Default hints (no modifier held) --- */

  const DEFAULT_HINT = {
    colorCard:      '⌘C Copy · ⌘D Duplicate · ⌫ Reset',
    foundationCard: '⌘C Copy · ⌫ Reset',
    comboCard:      '⌘D Duplicate · ⌫ Delete',
    actionBtn:      '⌫ Reset',
    compCard:       '⌫ Reset',
    canvas:         '⌫ Reset',
    fontSelect:     '⌘V Paste Google Fonts URL',
  };

  /* --- Key lists per element type --- */

  function getKeys(type) {
    const desc = KEY_DESC[type];
    return desc ? Object.keys(desc) : null;
  }

  /* --- Detect element type --- */

  function detectElement() {
    if (hoveredAction) return 'actionBtn';
    if (hoveredCard) {
      if (hoveredCard.dataset.colorType === 'combo') return 'comboCard';
      if (hoveredCard.dataset.colorType === 'foundation') return 'foundationCard';
      return 'colorCard';
    }
    if (hoveredCompCard) return 'compCard';
    if (hoveredCanvas) return 'canvas';
    if (hoveredFontSelect) return 'fontSelect';
    return null;
  }

  /* --- Render --- */

  function render(type, activeModifier) {
    const keys = getKeys(type);
    if (!keys) return '';

    const badges = keys.map(k => {
      const isActive = activeModifier && k.toUpperCase() === activeModifier.toUpperCase();
      const isDimmed = activeModifier && !isActive;
      const cls = isActive ? ' active' : isDimmed ? ' dimmed' : '';
      return `<span class="key-badge${cls}">${k}</span>`;
    }).join('');

    let desc = '';
    if (activeModifier) {
      const modUpper = activeModifier.toUpperCase();
      const text = KEY_DESC[type]?.[modUpper];
      if (text) desc = `<span class="key-legend-desc">${text}</span>`;
    } else {
      const hint = DEFAULT_HINT[type];
      if (hint) desc = `<span class="key-legend-desc">${hint}</span>`;
    }

    return badges + desc;
  }

  /* --- Update --- */

  function update() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = null;
      const type = detectElement();

      if (!type) {
        el.classList.remove('visible');
        return;
      }

      const modifier = kb.modifier;
      const html = render(type, modifier);

      if (!html) {
        el.classList.remove('visible');
        return;
      }

      el.innerHTML = html;
      el.classList.add('visible');
    });
  }

  /* --- Poll hover + modifier state --- */

  let prevHoveredAction = null;
  let prevHoveredCard = null;
  let prevHoveredCompCard = null;
  let prevHoveredCanvas = false;
  let prevHoveredFontSelect = null;
  let prevModifier = null;

  function poll() {
    if (
      hoveredAction !== prevHoveredAction ||
      hoveredCard !== prevHoveredCard ||
      hoveredCompCard !== prevHoveredCompCard ||
      hoveredCanvas !== prevHoveredCanvas ||
      hoveredFontSelect !== prevHoveredFontSelect ||
      kb.modifier !== prevModifier
    ) {
      prevHoveredAction = hoveredAction;
      prevHoveredCard = hoveredCard;
      prevHoveredCompCard = hoveredCompCard;
      prevHoveredCanvas = hoveredCanvas;
      prevHoveredFontSelect = hoveredFontSelect;
      prevModifier = kb.modifier;
      update();
    }
    requestAnimationFrame(poll);
  }

  requestAnimationFrame(poll);

  return { update };
})();

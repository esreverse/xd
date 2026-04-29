# Figma Variables Conventions

Figma-specific implementation of design tokens as Figma Variables, Text Styles, and Effect Styles.
Canonical token structure and naming grammar: `design-token-conventions.md`.



## 1. Token to Figma Mapping

| Token category | Figma implementation |
|---|---|
| Color, Spacing, Sizing, Radius, Border Width, Opacity | Variable |
| Font Family, Font Weight, Font Size, Line Height, Letter Spacing, Paragraph Spacing | Variable |
| Typography composites (`semantic.typography.*`) | Text Style (properties bound to variables) |
| Elevation/Shadow composites (`semantic.elevation.*`) | Effect Style (shadow color bound to variable) |
| `breakpoint/width` | Variable (reference only — Figma has no responsive concept) |
| Border (composite) | Not in Figma (code only, or Tokens Studio plugin) |



## 2. Collections


### 2a. Overview

Three collections are **required**: Core, Semantic, Component.
Four collections are **optional**, each toggled by a checkbox in the export tool.

| Collection | Required? | Modes | Purpose |
|---|---|---|---|
| Core | **required** | — | Absolute atomic values |
| Typography | optional | Default, Web | Owns `font/family-*`, `font/weight-*` |
| Density | optional | Default, Compact | Owns `space/*`, `size/*` |
| Breakpoints | optional | S, M, L, XL, 2XL | Owns `font/size-*`, `font/lineHeight-*`, `font/paragraphHeight-*`, `font/tracking-*`, `breakpoint/width` |
| Semantic | **required** | Light, Dark | Owns all semantic tokens, including all palette variants |
| Colors | optional | one mode per brand/accent/combo palette only (e.g. Brand A, Brand B, Accent A, Combo A) | Palette switch — swaps the active brand/accent/combo per mode |
| Component | **required** | — | Aliases each component token to the right source collection |

**Alias chain:** `Component → Colors → Semantic → Core`. Each layer references only the layer directly below it. Optional collections (Typography / Density / Breakpoints) are carve-outs of Core — Semantic aliases into them for the tokens they own.


### 2b. Variable Naming — Collection Prefix

Every Figma variable name starts with its collection name in lowercase, followed by `/`:

| Collection | Example |
|---|---|
| Core | `core/color/light/clear`, `core/radius/4` |
| Typography | `typography/font/family-sans` |
| Density | `density/space/4` |
| Breakpoints | `breakpoints/font/size-3` |
| Semantic | `semantic/color/foundation/themed/base-clear` |
| Colors | `colors/themed/base` |
| Component | `component/button/primary/bg` |

The exported JSON does NOT include the collection prefix (it uses `{core.color.*}` references). **You MUST prepend the collection prefix to every variable name when creating it in Figma.** No variable may exist without its collection prefix as the first path segment.


### 2c. Sidebar Order

Collections MUST appear in the Figma sidebar in this exact order. Override Figma's alphabetical default by reordering via the Plugin API after creating the last collection. Omit any collection that does not exist in the current sync.

```
1. Component
2. Colors
3. Semantic
4. Typography
5. Breakpoints
6. Density
7. Core
```



## 3. Core

Core holds all atomic tokens. When an optional collection exists, its tokens **move out of Core** and live in the optional collection instead — **Core MUST NOT contain duplicates**.

| Optional Collection | Tokens that move out of Core |
|---|---|
| Typography | `font/family-*`, `font/weight-*` |
| Density | `space/*`, `size/*` |
| Breakpoints | `font/size-*`, `font/lineHeight-*`, `font/tracking-*`, `font/paragraphHeight-*`, `breakpoint/width` |

This restructuring happens at Figma sync time. The exported JSON files remain tool-agnostic: Core's `core.tokens.json` always contains all atomic tokens; optional files define per-mode override values.


### Variable Scopes

Set `scopes` explicitly on every variable — never rely on `ALL_SCOPES`. Scopes determine which property pickers offer the variable.

| Token | Scope |
|---|---|
| `color/*` | `["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"]` (color tokens are reused across all of these — narrow further only when a token is single-purpose) |
| `radius/*` | `["CORNER_RADIUS"]` |
| `space/*`, `size/*` | `["GAP", "WIDTH_HEIGHT"]` |
| `font/family-*` | `["FONT_FAMILY"]` |
| `font/weight-*` | `["FONT_WEIGHT"]` |
| `font/size-*` | `["FONT_SIZE"]` |
| `font/lineHeight-*` | `["LINE_HEIGHT"]` |
| `font/tracking-*` | `["LETTER_SPACING"]` |
| `font/paragraphHeight-*` | `["PARAGRAPH_SPACING"]` |
| `opacity/*` | `["OPACITY"]` |

**Opacity values are unitless percent numbers, NOT 0–1 multipliers.** Figma OPACITY-bound variables interpret the FLOAT as a direct percent value: `100` → 100 %, `40` → 40 %, `0` → 0 %. Storing `1` results in 1 % opacity (almost transparent) — a silent rendering bug. The DTCG token JSON uses 0–1 multipliers (`{"$value": 1, "$type": "number"}`) for tool neutrality; multiply by 100 when writing to Figma.



## 4. Optional Collections

Each optional collection takes ownership of its slice (see §3) and exposes multi-mode values. When the collection does not exist, its tokens stay in Core and Semantic aliases into Core directly.


### 4a. Typography

Two modes: **Default**, **Web**.

- Default mode values: read from `core.tokens.json`
- Web mode values: read from `core.typography.web.tokens.json`


### 4b. Density

Two modes: **Default**, **Compact**.

- Default mode values: read from `core.tokens.json`
- Compact mode values: read from `core.density.compact.tokens.json`


### 4c. Breakpoints

Five modes: **S, M, L, XL, 2XL**. Each mode starts with the **Core value as baseline**, then applies sparse overrides from the matching breakpoint file.

For every affected Core token, create a Breakpoints variable (same leaf path). For each mode, look up the token in `core.breakpoint.{s|m|l|xl|2xl}.tokens.json`:
- If present → use the `$value` from the override file.
- If absent → use the Core `$value` as baseline.

The breakpoint files are sparse by design: they list only the tokens that diverge at that viewport. `breakpoint/width` is a single value per mode (viewport width), not a matrix.



## 5. Semantic

Semantic owns all semantic tokens with two modes: **Light** and **Dark**.

**Ownership.** Semantic owns:
- All foundation, action, feedback, and elevation tokens.
- All palette variants — `semantic/color/brand-a/...`, `semantic/color/brand-b/...`, `semantic/color/accent-a/...`, `semantic/color/combo-a/...`, etc. Each palette variant holds direct color values (not aliases to a single shared palette).
- All feedback states — `semantic/color/feedback/info/...`, `semantic/color/feedback/success/...`, etc.

**Aliasing.** Foundation/action/feedback tokens alias to Core (or to the optional collection that owns the token). Palette variants do NOT alias to Core — they hold the palette values directly, since the palette is what makes them distinct.


### Themed vs Inverted

Semantic color tokens split into two groups inside the Light/Dark modes:

| Group | Behavior |
|---|---|
| `themed` | Responds to the current theme. Light mode → lighter contrasts to base; Dark mode → darker contrasts to base. |
| `inverted` | Always shows the opposite of the current theme. Light mode → dark value; Dark mode → light value. |

When creating Semantic variables, the two modes receive **different values** for `inverted/*` tokens — do not copy the themed values.


### Mode Inheritance

Downstream collections (Colors, Component) inherit Light/Dark transitively from whatever they alias. A Component token bound to a Semantic variable automatically responds to Light/Dark; one bound through Colors automatically responds to the palette mode on top of that.



## 6. Colors

A palette switch layer. Optional. **Contains only the 11 palette-role tokens × 2 schemes = 22 variables** — same set regardless of how many palettes exist:

```
colors/{themed|inverted}/base
colors/{themed|inverted}/base-higher
colors/{themed|inverted}/base-lower
colors/{themed|inverted}/contrast-primary
colors/{themed|inverted}/contrast-secondary
colors/{themed|inverted}/with-light-primary
colors/{themed|inverted}/with-light-secondary
colors/{themed|inverted}/with-dark-primary
colors/{themed|inverted}/with-dark-secondary
colors/{themed|inverted}/surface
colors/{themed|inverted}/surface-contrast
```

**Scope.** Only brand/accent/combo palettes route through Colors, because they participate in palette switching. Foundation, action, feedback, and elevation tokens stay in Semantic — Colors does not proxy them.

**Aliasing.** Colors variables alias to Semantic — never directly to Core. The chain is `Component → Colors → Semantic → Core`. Colors is a palette-switch indirection layer on top of Semantic; it never bypasses Semantic.

**Modes.** One mode per brand/accent/combo palette. Scan the export folder for `semantic.colors.{brand-*|accent-*|combo-*}.tokens.json` files — each becomes one mode (Brand A, Brand B, Accent A, Combo A, …). Other `semantic.colors.*.tokens.json` files (e.g. feedback) are ignored here — those tokens live in Semantic only.

**Naming — what NOT to do.**
- Do NOT include the palette name in the variable path (no `colors/brand-a/…`, no `colors/color/...`). The 22 palette-role slots above are the only Colors variables.
- Do NOT create raw palette steps (no `colors/50`, `colors/100`, …, `colors/950`).


### Procedure

1. Detect every `semantic.colors.{brand-*|accent-*|combo-*}.tokens.json` file → one mode per file, named by palette (`Brand A`, `Brand B`, `Accent A`, `Combo A`, …).
2. For each of the 22 palette-role slots (`themed|inverted` × 11 roles), create ONE Colors variable named `colors/{scheme}/{role}`.
3. Per mode, set the variable's value to an alias targeting `semantic/color/{palette}/{scheme}/{role}` for that mode's palette.

```
Variable: colors/themed/base
  Mode "Brand A"  → semantic/color/brand-a/themed/base
  Mode "Brand B"  → semantic/color/brand-b/themed/base
  Mode "Accent A" → semantic/color/accent-a/themed/base
  Mode "Combo A"  → semantic/color/combo-a/themed/base

Variable: colors/inverted/surface-contrast
  Mode "Brand A"  → semantic/color/brand-a/inverted/surface-contrast
  Mode "Accent A" → semantic/color/accent-a/inverted/surface-contrast
```

Switching the Colors mode on a frame swaps the entire palette for every component bound through Colors.



## 7. Component — Alias Routing

Routing is decided by the Component token's direct reference category. **Category = the first path segment after `semantic.color.`** in the Component token's `$value`. Check only the immediate reference — do not resolve alias chains transitively.

| Direct reference category | Routing |
|---|---|
| `brand-*`, `accent-*`, `combo-*` | Colors → Semantic (take first that exists) |
| `action`, `feedback`, `foundation` | Semantic |
| `{core.*}` (direct Core reference) | Core |

Only brand/accent/combo route through Colors — they are switchable palettes. Feedback (info/success/warning/error), action, and foundation are semantic states, not palettes, and stay in Semantic.


### Namespace Transformation for Colors Routing

When routing through Colors, the palette identifier is **dropped** from the variable path — it is replaced by the Colors mode. This is what enables palette switching.

| Source reference | Routed alias |
|---|---|
| `{semantic.color.brand-a.themed.base}` | `colors/themed/base` |
| `{semantic.color.brand-b.themed.base}` | `colors/themed/base` (same variable, different mode!) |
| `{semantic.color.accent-a.inverted.surface-contrast}` | `colors/inverted/surface-contrast` |

All brand/accent/combo tokens collapse onto the same 22 palette-role slots. The palette comes from the selected Colors mode. **Do NOT create variables like `colors/brand-a/themed/base`** — that defeats the entire palette-switching mechanism.


### Worked Examples

`component.button.default.themed.primary.bg` → `{semantic.color.action.primary.themed.base}`
- Category: `action` → Semantic
- Alias to `semantic/color/action/primary/themed/base`

`card.color.fg-eyebrow` → `{semantic.color.brand-a.themed.with-light-secondary}`
- Category: `brand-a` → Colors → Semantic
- With Colors present → alias to `colors/themed/with-light-secondary` (brand-a is dropped!)
- Without Colors → alias to `semantic/color/brand-a/themed/with-light-secondary`

`input.color.bg-error` → `{semantic.color.feedback.error.themed.surface}`
- Category: `feedback` → Semantic (feedback never routes through Colors)
- Alias to `semantic/color/feedback/error/themed/surface`

`card.color.placeholder` → `{core.color.placeholder}`
- Direct Core reference → alias to `core/color/placeholder` regardless of which optional collections exist.



## 8. Text Styles

Text Styles are created from `semantic.typography.*` composite tokens. Each composite resolves to one Text Style with properties bound to variables.


### 8a. Property Mapping

| Text Style property | Figma API property | Source | Notes |
|---|---|---|---|
| Font Family | `fontName.family` | bind to `typography/font/family-{role}` | Falls back to `core/font/family-*` if Typography collection absent |
| Font Weight | `fontWeight` | bind to `typography/font/weight-{weight}` | **Use `fontWeight`, not `fontStyle`.** `fontStyle` expects a STRING variable; weight tokens are FLOAT. |
| Font Size | `fontSize` | bind to `breakpoints/font/size-{n}` | Falls back to `core/font/size-*` if Breakpoints collection absent |
| Line Height | `lineHeight` | **literal px**, not bound | `{ value: round(fontSize × lineHeightRatio), unit: 'PIXELS' }`. Figma number variables are unitless — Line Height cannot be expressed as a percentage through a Variable. |
| Letter Spacing — non-caps | `letterSpacing` | not set | Leave at Figma default. |
| Letter Spacing — caps | `letterSpacing` | **literal**, not bound | `{ value: round(fontSize × trackingCapsEm, 2), unit: 'PIXELS' }` for `textCase = 'UPPER'` styles. Compute per style from the em multiplier in `core/font/tracking-caps` (e.g. `0.08`). |
| Paragraph Spacing | `paragraphSpacing` | bind to `breakpoints/font/paragraphHeight-{n}` | Omit for headings. Falls back to `core/font/paragraphHeight-*` if Breakpoints collection absent. |

**Variable value formats** (when creating the source variables in §3/§4):
- `font/size-*`, `font/paragraphHeight-*` → px number (FLOAT), strip `px`
- `font/lineHeight-*` → unitless multiplier (FLOAT), e.g. `1.47` for 147 % (kept as canonical reference; Text Styles use computed px)
- `font/tracking-*` → unitless em multiplier (FLOAT), e.g. `0.08` for 8 % (kept as canonical reference; for caps Text Styles, multiplied by per-style fontSize and applied as literal px — see §8a)
- `font/weight-*` → number, use as-is
- `opacity/*` → percent number 0–100 (FLOAT), e.g. `100` for fully opaque (NOT `1`). The DTCG source uses 0–1; multiply by 100 when writing to Figma.

**Trade-off.** Text Styles have no modes, so Line Height (px) does not adapt to Breakpoints (S–2XL). Font Size still does because it is bound to a Variable.


### 8b. Build Sequence

The Plugin API is empirically sequence-sensitive: deviating silently drops bindings without throwing. For each Text Style, execute these steps in order, in the same script:

```
(a) Load the font (with fallback)
    await figma.loadFontAsync({ family, style })
    On throw: figma.listAvailableFontsAsync(), pick a compatible fallback,
    record the substitution in the return value. NEVER swallow with empty catch.

(b) Set placeholder character — required before binding
    style.characters = "Aa"
    A newly created TextStyle with empty `characters` silently drops the
    paragraphSpacing binding.

(c) Set fontName — must be a NEW object (fontName is frozen)
    style.fontName = { family, style }

(d) Set fontSize as a literal — concrete value before binding
    style.fontSize = <px literal>

(e) Bind variables
    style.setBoundVariable('fontFamily', familyVar)
    style.setBoundVariable('fontWeight', weightVar)
    style.setBoundVariable('fontSize', sizeVar)
    style.setBoundVariable('paragraphSpacing', paraVar)   // omit for headings

(f) Set lineHeight as literal px
    style.lineHeight = { unit: 'PIXELS', value: round(fontSize × ratio) }

(g) Caps only: textCase first, letterSpacing last
    style.textCase = 'UPPER'
    style.letterSpacing = { unit: 'PIXELS', value: round(fontSize × trackingCapsEm, 2) }
    // trackingCapsEm = the em multiplier from core/font/tracking-caps (e.g. 0.08).
    // Computed per style — NOT a fixed literal.

(h) Verify inline — throw on failure
    Read style.boundVariables. Assert fontFamily, fontWeight, fontSize are
    populated (plus paragraphSpacing for non-heading styles). If any is
    missing, throw with the style name and missing keys.
```

`setBoundVariable` is the silent-failure surface of the Plugin API — step (h) catches API regressions at the point of failure, so no separate post-sync check is needed.


### 8c. Idempotency

If a style with the target name already exists, do NOT skip blindly — a previous failed sync may have created it unbound. Re-run steps (a)–(h). Skip only if the existing style would already pass step (h).



## 9. Effect Styles

Effect Styles are created from `semantic.elevation.*` composite tokens. One Effect Style per elevation level.

Bind the shadow color property to its corresponding color variable (e.g. `semantic/color/foundation/themed/shadow`). Numeric shadow properties (x, y, blur, spread) are set as literal values — Figma does not support variable bindings for these.


### Build Sequence

```
(a) Build each DropShadowEffect literal
    { type, color, offset, radius, spread, visible, blendMode }

(b) Bind color — capture the returned NEW effect object
    effect = figma.variables.setBoundVariableForEffect(effect, 'color', colorVar)
    Effect objects are immutable. Assigning the original (unbound) effect
    silently drops the binding.

(c) Assign the array as a NEW array
    style.effects = [...boundEffects]

(d) Verify inline — throw on failure
    Read back style.effects. Assert every DropShadowEffect has
    boundVariables.color populated. If any is missing, throw with the
    style name.
```

**Empty elevation levels** (e.g. `elevation/0` with no shadows): set `style.effects = []`. Do not skip the style. Skip step (d) for these — there are no shadows to bind.



## 10. Build Order

Build collections in this order. Each step's collection only references collections built in earlier steps, so every alias target already exists when needed. **Do not reorder.**

1. **Scan the export folder** — detect which optional collections are requested.
2. **Build Core** (§3) — atomic values, with tokens carved out for any optional collection that owns them.
3. **Build optional collections** (§4) — Typography / Density / Breakpoints, each for the slice it owns.
4. **Build Semantic** (§5) — Light/Dark, aliasing into Core and any optional collection that now owns the token.
5. **Build Colors** (§6) — if present. 22 palette-role slots, one mode per palette, aliasing into Semantic.
6. **Build Component** (§7) — alias each component token per the routing rules.
7. **Build Text Styles & Effect Styles** (§8, §9) — bind properties to the variables created above.
8. **Reorder collections in the sidebar** (§2c) — Component, Colors, Semantic, Typography, Breakpoints, Density, Core.



## 11. Self-Test

After the build script completes, run a read-only `use_figma` script that walks every variable alias and checks the list below. Style bindings are already verified inline (§8h, §9d) — if the build script returned without throwing, all style bindings are correct.

Expected chain: `Component → Colors → Semantic → Core` (with Typography / Breakpoints / Density as carve-outs of Core).

Only check items for collections that actually exist in the current sync.

- [ ] Every variable name starts with its collection prefix (`core/`, `semantic/`, `colors/`, `component/`, `typography/`, `breakpoints/`, `density/`)
- [ ] Component aliases follow §7 routing (highest available of: Colors → Semantic, or Core for direct Core references)
- [ ] *If Colors exists:* every Colors variable aliases to **Semantic** (never directly to Core); each mode points to the corresponding `semantic/color/{palette}/...` path
- [ ] Semantic foundation/action/feedback/elevation tokens alias to Core (and to Typography / Breakpoints / Density for the tokens they own)
- [ ] Semantic palette variants (`semantic/color/{brand-*|accent-*|combo-*}/...`) hold direct color values, not aliases
- [ ] Semantic `inverted/*` holds different values in Light vs Dark
- [ ] *If Typography / Breakpoints / Density exists:* their token paths are removed from Core; Semantic aliases into them for the tokens they own
- [ ] No dangling aliases, no cycles, no sideways or upstream references

Write the verification script against the **current** Plugin API — do not paste a cached snippet. Use the `figma-use` skill's typings reference (`plugin-api-standalone.d.ts`) to look up current method names and shapes.

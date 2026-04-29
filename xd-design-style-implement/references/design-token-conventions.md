# Design Token Conventions

Canonical reference for token structure, naming, hierarchy, and default values.
All token names, tiers, and values defined here are the authoritative source.

> Updated: 2026-03-31 · Version: 2

Read by `xd-production-implement-tokens` for default mode values.

Tool-specific implementation:
- `figma-token-conventions.md` (in this directory)



## Conventions


### Naming Grammar

```
[tier].[type].[category].[group].[concept]-[modifier]
```

- `.` separates conceptual hierarchy levels — creates a group in Figma Variables
- `-` separates modifiers of the same concept — stays in the name, no new group
- Max 5 levels deep: `semantic.color.foundation.themed.contrast-primary`
- Not every token uses all levels: `core.color.light.clear` (4 levels)

**Explicit FG naming rule:** When multiple FG variants exist,
all must be explicitly named — no implicit "default".
`fg` → `contrast-primary` when `contrast-secondary` exists.
Does not apply to BG, base, or border tokens.


### Tiers

```
core.*       Raw values. What the token IS. Never use directly in UI.
semantic.*   What the token MEANS. Theme boundary. Only layer swapped in dark mode.
component.*  Scoped to one component. Always references semantic, never core.
```


### Size Scale

```
...3XS · 2XS · XS · S · SM · M · ML · L · XL · 2XL · 3XL · 4XL · 5XL
```

Intermediate steps (SM, ML) only when actually needed — not preemptively. Numbered notation beyond XL and before XS.


### Alias Syntax (DTCG)

Curly-brace reference to another token. Used in token values to express relationships.

```
{semantic.color.foundation.themed.contrast-primary}  →  resolves to the referenced token's value
```




## 1. Color

**$type:** `color`


### Complete Token Syntax

Core and semantic token syntax is fixed and complete — not extensible beyond the patterns below.
New colors (brand-b, accent-c, etc.) use existing syntax. No new token concepts.
Component tokens are examples — new components extend the pattern as needed.

```
CORE:
  core.color.[light|dark].[clear|cloudy]
  core.color.[light|dark].clear-a[N]  (N = resolved alpha %)
  core.color.transparent
  core.color.placeholder
  core.color.[brand-a|brand-b|...].[50|100|200|300|400|500|600|700|800|900|950]
  core.color.[accent-a|accent-b|...].[50|100|200|300|400|500|600|700|800|900|950]
  core.color.focus.[50|100|200|300|400|500|600|700|800|900|950]
  core.color.[blue|red|green|amber].[50|100|200|300|400|500|600|700|800|900|950]

SEMANTIC:
  semantic.color.foundation.[themed|inverted].
    [base-clear|base-cloudy|base-higher|base-lower|base-shine|base-shade|
     contrast-primary|contrast-secondary|contrast-tertiary|focus|dash]

  semantic.color.[brand|accent]-[a-z].[themed|inverted].
    [base|base-higher|base-lower|contrast-primary|contrast-secondary|
     with-light-primary|with-light-secondary|with-dark-primary|with-dark-secondary|
     surface|surface-contrast]

  semantic.color.combo-[a-z].[themed|inverted].
    [base|base-higher|base-lower|contrast-primary|contrast-secondary|
     with-light-primary|with-light-secondary|with-dark-primary|with-dark-secondary|
     surface|surface-contrast]

  semantic.color.feedback.[info|success|warning|error].[themed|inverted].
    [base|base-higher|base-lower|contrast-primary|contrast-secondary|
     with-light-primary|with-light-secondary|with-dark-primary|with-dark-secondary|
     surface|surface-contrast]

  semantic.color.action.[primary|secondary-selected|secondary-unselected|
    tertiary-selected|tertiary-unselected|destructive].[themed|inverted].
    [base|base-higher|base-lower|contrast]

COMPONENT (examples):
  component.button.[default|themed|inverted].[primary|secondary-selected|secondary-unselected|
    tertiary-selected|tertiary-unselected|destructive].[bg|fg|border-color|border-width]
  component.button.size.[S|M].[height|padding-x|gap-icon-to-label|icon|typography|border-radius|border-radius-pill]
  component.input.color.[bg|bg-error|fg-value|fg-placeholder|fg-label|fg-helper|fg-error|border|border-active|border-error]
  component.input.size.[S|M].[height|padding-x|gap-icon-to-value|typography-value|typography-label|border-radius|border-width]
  component.card.[color|space|typography|elevation].*
```


### Constraints

```
  Brand:    at least 1 required (brand-a). Additional optional (brand-b, brand-c, ...).
  Accent:   optional (0+).
  Feedback: exactly 4 — info, success, warning, error. Fixed set.
  Combo:    optional (0+). Named combo-a, combo-b, etc. base and contrast-secondary may come from different palettes. surface/surface-contrast are derived from the base palette.
  Action:   exactly 4 — primary, secondary, tertiary, destructive. Fixed set.
```


### Core — Foundation

Hand-picked values. No algorithmic derivation.

```
core.color.[light|dark].[clear|cloudy]
  light.clear    light.cloudy
  dark.clear     dark.cloudy

core.color.[light|dark].clear-a[N]
  Alpha tokens: RGB = base clear color (unchanged), only alpha varies.
  Token name contains the resolved alpha percentage — e.g. `clear-a62` = 62% alpha.
  Exported as rgba() — e.g. dark.clear-a62 = rgba(20,20,18,0.62).
  The alpha value is computed by the Brand Visual Identity tool:
    contrast-secondary:  Search from 40% alpha upward (in 1% steps) until >= 4.5:1 (AA) against base-cloudy (worst case).
    contrast-tertiary:   Fixed 40%.
    base-shine / base-shade: Fixed 10%.
    dash:                Fixed 15%. Used for dashes / lines / subtle dividers.
  Alpha values differ between light and dark (asymmetric contrast).
  Light mode uses dark.clear-a[N], dark mode uses light.clear-a[N].
  Per tool:
    CSS:           rgba() values used directly
    Figma:         COLOR variable with alpha channel (RGB from base clear, A from resolved alpha)
    Tokens Studio: Reference base clear token + alpha modifier (where supported)

core.color.transparent   = rgba(0,0,0,0)
core.color.placeholder   = rgba(128,128,128,0.5)
```


### Core — Color Palettes

Each color gets a full OKLCH scale. Steps: 50 · 100 · 200 · 300 · 400 · 500 · 600 · 700 · 800 · 900 · 950.
Brand/accent defined via Brand Visual Identity. Action/feedback generated algorithmically.

```
  core.color.[brand-a|brand-b|...].[50–950]     Brand — OKLCH scale
  core.color.[accent-a|accent-b|...].[50–950]   Accent — OKLCH scale
  core.color.focus.[50–950]                      Focus ring — derived from info hex, independent palette
  core.color.blue.[50–950]                       Feedback info
  core.color.red.[50–950]                        Feedback error + Action destructive (shared)
  core.color.green.[50–950]                      Feedback success
  core.color.amber.[50–950]                      Feedback warning
```


### Two Mode Groups

```
themed.*      Responds to current theme. Default usage.
inverted.*    Always shows the opposite of the current theme.
```


### Semantic — Foundation

```
semantic.color.foundation.[themed|inverted].
  [base-clear|base-cloudy|base-higher|base-lower|
   contrast-primary|contrast-secondary|contrast-tertiary|focus|
   base-shine|base-shade|dash]

  base-clear    light: light.clear / dark: dark.clear       Purest surface.
  base-cloudy   light: light.cloudy / dark: dark.cloudy     Base surface.
  base-higher   light: light.clear / dark: dark.cloudy      Elevated.
  base-lower    light: light.cloudy / dark: dark.clear      Recessed.
  contrast-primary    light: dark.clear / dark: light.clear     >= 7:1.
  contrast-secondary  light: dark.clear-a50+ / dark: light.clear-a50+   >= 4.5:1 against base-cloudy (worst case).
  contrast-tertiary   light: dark.clear-a40 / dark: light.clear-a40     Fixed 40%.
  focus               Dedicated focus palette (core.color.focus). Themed: focus.500 on light, focus.400 on dark. Inverted: mirrored.
  base-shine    light.clear-a10                           Mode-independent.
  base-shade    dark.clear-a10                            Mode-independent.
  dash          light: dark.clear-a15 / dark: light.clear-a15   Fixed 15%. Dashes, lines, subtle dividers.

Inverted mirrors all BG/FG values. Base-shine/base-shade/dash stay the same pattern (swap light↔dark).
```


### Semantic — Brand, Accent, Feedback, Combo (Unified Model)

Brand, Accent, Feedback, and Combo all use the same **11-token set** per color.
Every token is usable as BG or FG. AA/AAA contrast guaranteed at build time.
Combos derive `surface` / `surface-contrast` from their base palette (see section below).

```
semantic.color.[brand|accent]-[a-z].[themed|inverted].
  [base|base-higher|base-lower|contrast-primary|contrast-secondary|
   with-light-primary|with-light-secondary|with-dark-primary|with-dark-secondary|
   surface|surface-contrast]

semantic.color.combo-[a-z].[themed|inverted].
  [base|base-higher|base-lower|contrast-primary|contrast-secondary|
   with-light-primary|with-light-secondary|with-dark-primary|with-dark-secondary]

semantic.color.feedback.[info|success|warning|error].[themed|inverted].
  [base|base-higher|base-lower|contrast-primary|contrast-secondary|
   with-light-primary|with-light-secondary|with-dark-primary|with-dark-secondary|
   surface|surface-contrast]
```

Token definitions — internal contrast (color as BG):
- **base** — the color itself. Used as BG or FG.
- **base-higher** — exactly one step lighter in the OKLCH scale (e.g. 500 → 400). Hover state.
- **base-lower** — exactly one step darker in the OKLCH scale (e.g. 500 → 600). Pressed state.
- **contrast-primary** — maximum contrast: white or black (opaque foundation color). AA against base.
- **contrast-secondary** — from the color's own palette, most colorful step with AA (>= 4.5:1) against base.

Token definitions — external contrast (color as FG on foundation BG):
- **with-light-secondary** — from base, walk darker until AA (4.5:1) against light.cloudy. For text on light backgrounds.
- **with-light-primary** — from base, walk darker until AAA (7:1) against light.cloudy, or darkest available (950).
- **with-dark-secondary** — from base, walk lighter until AA (4.5:1) against dark.cloudy. For text on dark backgrounds.
- **with-dark-primary** — from base, walk lighter until AAA (7:1) against dark.cloudy, or lightest available (50).

Token definitions — surface (color as subtle background tint):
- **surface** — themed: Step 50 (lightest tint). inverted: Step 700 (dark tint, color still recognizable).
- **surface-contrast** — AA text color against the surface. themed: walk from 50 toward 950. inverted: walk from 700 toward 50.

For Combo colors, `surface` and `surface-contrast` are derived from the **base palette** of the combo (not the contrast-secondary palette).

`with-light`/`with-dark` are **absolute** — always checked against light.cloudy / dark.cloudy regardless of themed/inverted.

Mode behavior:
- **themed** — light: light-end base / dark: adjusted base. All contrast values mirror.
- **inverted** — always the opposite of themed.

Category differences:
- **Brand** — at least 1 required. Additional colors optional.
- **Accent** — fully optional (0+).
- **Feedback** — exactly 4: info (blue), success (green), warning (amber), error (red).
- **Combo** — optional (0+). Named combo-a, combo-b, etc. base and contrast-secondary may come from different palettes. surface/surface-contrast derive from the base palette.

Step selection is illustrative — actual steps chosen during build.


### Semantic — Action

Uses themed/inverted like Brand/Accent/Feedback. No with-light/dark.
States (hover, pressed, disabled) live at component level.
Action colors are **dynamic** — resolved from ACTION_STATE (user-configurable in the HTML tool).
Each action group (primary, secondary, tertiary) has a `colorSource` pointing to any Brand/Accent palette.
Default: `_brand1` (first brand color). Dark mode swaps themed ↔ inverted.

```
semantic.color.action.[primary|secondary-selected|secondary-unselected|
  tertiary-selected|tertiary-unselected|destructive].[themed|inverted].
  [base|base-higher|base-lower|contrast]

  primary / secondary-selected / secondary-unselected / tertiary-selected / tertiary-unselected:
    Tokens mirror exactly what the HTML tool UI shows as FG/BG.
    base = background (semantic ref or core ref, can be transparent).
    contrast = foreground (semantic ref or core ref).
    base-higher, base-lower = ±1 core shade step from resolved base.
    I/S/T modifiers are already resolved in the semantic tokens.

  destructive:
    base, base-higher, base-lower → core.color.red steps (closestIdx + adjacent).
    contrast → foundation color (light.clear or dark.clear) with AA against base.
```


### Dark Mode

Same token names, different Core references. Only themed layer is swapped.
Component tokens remain unchanged. Inverted mode provides the opposite of themed.


### Component — Button, Input, Card

Component tokens are examples — they demonstrate the pattern for scoping tokens to a component.
Core and semantic tokens are the complete, authoritative set. Component tokens extend as needed.

```
Button (3 color modes × 6 types = 18 variants, each with bg, fg, border-color, border-width):
  component.button.[default|themed|inverted].[primary|secondary-selected|secondary-unselected|
    tertiary-selected|tertiary-unselected|destructive].[bg|fg|border-color|border-width]

  Default: uses ACTION_STATE color tokens (dynamic palette per button type). border-width per variant.
    primary:              bg=base, fg=contrast, border-color=fg, border-width=none
    secondary-selected:   bg=transparent, fg=base, border-color=fg, border-width=M
    secondary-unselected: bg=transparent, fg=base, border-color=fg, border-width=M
    tertiary-selected:    bg=transparent, fg=base, border-color=fg, border-width=none
    tertiary-unselected:  bg=transparent, fg=base, border-color=fg, border-width=none
    destructive:          bg=action.destructive.themed.base, fg=action.destructive.themed.contrast, border-width=none

  Themed: foundation themed colors (solid variant for all types including destructive).
  Inverted: foundation inverted colors (solid variant for all types including destructive).

  Size (component.button.size.[S|M]):
    S:  height=action.S, padding-x=space.M, gap-icon-to-label=space.XS,
        icon=icon.S, typography=interface.XS, border-radius=radius.M, border-radius-pill=radius.pill
    M:  height=action.M, padding-x=space.M, gap-icon-to-label=space.XS,
        icon=icon.M, typography=interface.S, border-radius=radius.M, border-radius-pill=radius.pill

  Shared (flat on component.button):
    hover-overlay, pressed-overlay, opacity-enabled, opacity-disabled

  Hover/Pressed: base-shine/base-shade overlay (universal).
  Contrast: solid=fg↔bg (internal), outline/ghost=fg↔canvas (external).
  Disabled via opacity, not color.

Input (states: Default, Active, Filled, Error, Disabled):
  component.input.
    color.
      bg                {semantic.color.foundation.themed.base-clear}
      bg-error          {semantic.color.feedback.error.themed.surface}
      fg-value          {semantic.color.foundation.themed.contrast-primary}
      fg-placeholder    {semantic.color.foundation.themed.contrast-tertiary}
      fg-label          {semantic.color.foundation.themed.contrast-primary}
      fg-helper         {semantic.color.foundation.themed.contrast-secondary}
      fg-error          {semantic.color.feedback.error.themed.surface-contrast}
      border            {semantic.color.foundation.themed.base-shade}
      border-active     {semantic.color.foundation.themed.contrast-secondary}
      border-error      {semantic.color.feedback.error.themed.surface-contrast}

  Size (component.input.size.[S|M]):
    S:  height=action.S, padding-x=space.S, gap-icon-to-value=space.XS,
        typography-value=interface.XS, typography-label=interface.XS,
        border-radius=radius.M, border-width=border.width.S
    M:  height=action.M, padding-x=space.S, gap-icon-to-value=space.XS,
        typography-value=interface.S, typography-label=interface.XS,
        border-radius=radius.M, border-width=border.width.S

  Shared (flat on component.input):
    opacity-enabled, opacity-disabled

  Focus: global (semantic.elevation.focus) — not per component.
  Icon color = fg color of the respective state. No separate icon token.

  States (component code, not tokens):
    Default: bg + border + fg-placeholder
    Active: border-active
    Error: bg-error + border-error + fg-error
    Disabled: opacity-disabled on entire field

Card (generic card):
  component.card.
    color.
      bg                {semantic.color.foundation.themed.base-clear}
      fg-title          {semantic.color.foundation.themed.contrast-primary}
      fg-body           {semantic.color.foundation.themed.contrast-primary}
      fg-meta           {semantic.color.foundation.themed.contrast-secondary}
      fg-eyebrow        {semantic.color.[brand-a].themed.with-light-secondary}
      border            {semantic.color.foundation.themed.base-shade}
      placeholder        {core.color.placeholder}
    space.
      padding-x                {semantic.space.M}
      padding-y                {semantic.space.M}
      gap-eyebrow-to-title     {semantic.space.XS}
      gap-title-to-body        {semantic.space.M}
      gap-body-to-meta         {semantic.space.L}
    border-width               {semantic.border.width.none}
    border-radius              {semantic.radius.L}
    typography.
      eyebrow           {semantic.typography.caps.S}
      title             {semantic.typography.heading.M}
      body              {semantic.typography.interface.S}
      meta              {semantic.typography.interface.XS}
    elevation.
      default           {semantic.elevation.1}
      hover             {semantic.elevation.2}
    opacity-enabled/disabled
```



## 2. Spacing

**$type:** `dimension` · Base grid: 4px.
Core and semantic token syntax is fixed and complete. Component tokens are examples.

### Core

```
  core.space.[integer]
```


### Semantic

```
  semantic.space.[t-shirt]
```

One flat T-shirt scale: `none · 2XS · XS · S · M · L · XL · 2XL · 3XL`. Usage (padding, gap, margin) is determined by the consumer — component tokens or layout.


### Component — Button, Input, Card

```
  component.button.size.[S|M].padding-x          {semantic.space.M}
  component.button.size.[S|M].gap-icon-to-label   {semantic.space.XS}

  component.input.size.[S|M].padding-x            {semantic.space.S}
  component.input.size.[S|M].gap-icon-to-value     {semantic.space.XS}

  component.card.space.padding-x/y                 {semantic.space.M}
  component.card.space.gap-eyebrow-to-title        {semantic.space.XS}
  component.card.space.gap-title-to-body           {semantic.space.M}
  component.card.space.gap-body-to-meta            {semantic.space.L}
```



## 3. Sizing

**$type:** `dimension`
Core and semantic token syntax is fixed and complete. Component tokens are examples.

### Core

```
  core.size.[integer]
```


### Semantic

```
  semantic.size.[icon|action].[t-shirt]
```


### Component — Button, Input, Card

```
  component.button.size.[S|M].height    {semantic.size.action.[S|M]}
  component.button.size.[S|M].icon      {semantic.size.icon.[S|M]}

  component.input.size.[S|M].height     {semantic.size.action.[S|M]}
```



## 4. Border Radius

**$type:** `dimension`"
Core and semantic token syntax is fixed and complete. Component tokens are examples.

```
CORE:      core.radius.[integer]
SEMANTIC:  semantic.radius.[none|t-shirt|pill]
COMPONENT: component.[button|input|card|badge|dialog].radius[-pill]
```

Radius is a brand decision. Parametric — calculated from a radius factor.


### Core

Sequential integer keys. The value is the calculated px value, the key is just a counter.

```
  core.radius.0        → 0px (none)
  core.radius.1        → S value in px
  core.radius.2        → M value in px
  core.radius.3        → L value in px
  core.radius.4        → XL value in px
  core.radius.5        → 2XL value in px
  core.radius.9999     → 9999px (pill)
```

Keys are NOT px values. `core.radius.1` does not mean 1px — it means the first radius step.


### Semantic

T-shirt size aliases that reference core tokens.

```
  semantic.radius.none   → {core.radius.0}
  semantic.radius.S      → {core.radius.1}
  semantic.radius.M      → {core.radius.2}
  semantic.radius.L      → {core.radius.3}
  semantic.radius.XL     → {core.radius.4}
  semantic.radius.2XL    → {core.radius.5}
  semantic.radius.pill   → {core.radius.9999}
```


### Component

```
  component.button.size.[S|M].border-radius       {semantic.radius.M}
  component.button.size.[S|M].border-radius-pill   {semantic.radius.pill}
  component.input.size.[S|M].border-radius         {semantic.radius.M}
  component.card.border-radius                     {semantic.radius.L}
```



## 5. Border Width

**$type:** `dimension`
Core and semantic token syntax is fixed and complete. Component tokens are examples.

```
CORE:      core.border.width.[integer]
SEMANTIC:  semantic.border.width.[none|t-shirt]
COMPONENT: component.[input|card].border.width
```


### Core

```
  core.border.width.[integer]
```


### Semantic

```
  semantic.border.width.[none|t-shirt]
```


### Component

```
  component.button.[default|themed|inverted].[id].border-width   {semantic.border.width.[none|t-shirt]}
  component.input.size.[S|M].border-width                        {semantic.border.width.S}
  component.card.border-width                                    {semantic.border.width.none}
```



## 6. Border

Atomic tokens (color, width, style) always exist as individual tokens.
Composite border tokens are optional — supported by some tools (e.g. Tokens Studio), not by Figma Variables.
Tools without composite support compose borders at component level from the atomic tokens.



## 7. Typography

**$type:** `typography`
Atomic tokens (family, weight, size, lineHeight, letterSpacing, paragraphHeight) always exist individually.
Composite typography tokens are optional — generated when the tool supports them.
Tools without composite support reference atomic tokens directly.
Core and semantic token syntax is fixed and complete. Component tokens are examples.

```
CORE:
  core.font.family-[sans|serif|mono|interface]
  core.font.weight-[light|regular|medium|semibold|bold|extrabold]
  core.font.size-[integer]
  core.font.lineHeight-[heading|interface|paragraph]
  core.font.tracking-[normal|caps]
  core.font.paragraphHeight-[interface|paragraph]

SEMANTIC:
  semantic.typography.[interface|paragraph].[XS|S|M|L|XL][-strong]
  semantic.typography.heading.[S|M|L|XL|2XL]
  semantic.typography.caps.[S|M|L]
  semantic.typography.code.[M]

COMPONENT (examples):
  component.button.typography-[S|M]
  component.input.typography-[value|label|helper]
  component.card.typography-[title|body|meta]
```


### Three Typography Categories

**Heading** — Display-level text. Short, prominent, single-line. Tight line height (1.0).
Uses the heading font from the pairing (sans or serif depending on brand).

**Paragraph** — Body text, multi-line content. Generous line height (1.4) and paragraph spacing.
Uses the body font from the pairing. All long-form readable text.

**Interface** — UI labels, buttons, inputs, navigation, single-line. Compact line height (1.1).
Uses the interface font (typically sans). All interactive and functional text.


### Font Pairing

The pairing defines which font stacks are used for heading vs. paragraph/interface.
Four pairing strategies:

```
serif-sans     Heading = serif, Paragraph + Interface = sans (default)
sans-sans      Heading + Paragraph + Interface = sans
serif-serif    Heading + Paragraph + Interface = serif
sans-serif     Heading = sans, Paragraph + Interface = serif
```


### Interface Font

Font for interface elements (buttons, inputs, labels, navigation).
Defaults to sans, but can be overridden to serif.

```
  core.font.family-interface    references family-sans or family-serif
```


### Core

```
  core.font.family-[sans|serif|mono|interface]
  core.font.weight-[name]
  core.font.size-[integer]
  core.font.lineHeight-[heading|interface|paragraph]
  core.font.tracking-[normal|caps]
  core.font.paragraphHeight-[interface|paragraph]
```


### The -strong Concept

`-strong` = semantic emphasis. Only fontWeight changes — family, size, lineHeight stay identical.
The weight mapped to -strong is a brand decision in the Core token.
Heading tokens have no -strong variants — headings carry their own weight.


### Semantic

```
semantic.typography.[interface|paragraph].[XS|S|M|L|XL][-strong]

  interface  UI labels, single-line. lineHeight-interface, paragraphHeight-interface.
  paragraph  Body text, multi-line. lineHeight-paragraph, paragraphHeight-paragraph.
  -strong    Same dimensions, bolder weight.

semantic.typography.heading.[S|M|L|XL|2XL]
  Display-level. lineHeight-heading. No -strong variant.
  Weight depends on the weight parameter (uniform/moderate/strong).

semantic.typography.caps.[S|M|L]
  Uppercase labels. letterSpacing caps, textTransform uppercase.

semantic.typography.code.[M]
  Monospace. lineHeight-paragraph.
```


### Component — Button, Input, Card

```
  component.button.size.S.typography          {semantic.typography.interface.XS}
  component.button.size.M.typography          {semantic.typography.interface.S}

  component.input.size.S.typography-value     {semantic.typography.interface.XS}
  component.input.size.S.typography-label     {semantic.typography.interface.XS}
  component.input.size.M.typography-value     {semantic.typography.interface.S}
  component.input.size.M.typography-label     {semantic.typography.interface.XS}

  component.card.typography.eyebrow           {semantic.typography.caps.S}
  component.card.typography.title             {semantic.typography.heading.M}
  component.card.typography.body              {semantic.typography.interface.S}
  component.card.typography.meta              {semantic.typography.interface.XS}
```



## 8. Article Spacing

**$type:** `dimension`
Core and semantic token syntax is fixed and complete. Component tokens are examples.


### Spacing Model — margin-before Only

Each article element carries only margin-before (CSS: margin-block-start). No margin-after.
Prevents double whitespace between consecutive elements.

Wrapper: vertical Auto Layout frame, gap: 0, padding-top = wrapper-padding-top token.
First-child case handled by wrapper padding — no element needs a zero-override.

Article spacing uses the flat `semantic.space.[t-shirt]` scale — no separate article sub-category.


### Component — Article

```
  component.article.space.wrapper-padding-top     {semantic.space.M}
  component.article.h2.margin-before              {semantic.space.XL}
  component.article.h3.margin-before              {semantic.space.L}
  component.article.h4.margin-before              {semantic.space.M}
  component.article.paragraph.margin-before       {semantic.space.S}
  component.article.list.margin-before            {semantic.space.S}
  component.article.list-item.margin-before       {semantic.space.XS}
  component.article.media.margin-before           {semantic.space.L}
  component.article.media-caption.margin-before   {semantic.space.XS}
  component.article.blockquote.margin-before      {semantic.space.L}
  component.article.codeblock.margin-before       {semantic.space.M}
```



## 9. Shadow / Elevation (Composite)

Core and semantic token syntax is fixed and complete. Component tokens are examples.

**$type:** `shadow`
Composite token. Atomic sub-values (offset, blur, spread, color) exist at Core level.
Composite shadow tokens are optional — tools without composite support use the atomics.


### Core

```
  core.shadow.[property]-[variant]
```


### Semantic

```
  semantic.elevation.[0–4|focus]
```


### Component

```
  component.card.elevation.default    {semantic.elevation.1}
  component.card.elevation.hover      {semantic.elevation.2}
```



## 10. Opacity

**$type:** `number`
Core and semantic token syntax is fixed and complete. Component tokens are examples.

For selective transparency (background only) use Core alpha variants in color tokens.


### Core

```
  core.opacity.[integer]
```


### Semantic

```
  semantic.opacity.[enabled|disabled]
```


### Component

```
  component.button.opacity-enabled/disabled    {semantic.opacity.enabled/disabled}
  component.input.opacity-enabled/disabled     {semantic.opacity.enabled/disabled}
  component.card.opacity-enabled/disabled      {semantic.opacity.enabled/disabled}
```



## 11. Grid / Breakpoints

**$type:** `dimension`

Components define internal spacing (padding, gap).
Outer position in the grid is set by the layout system — components do not have margin.

Grid margin and gutter are layout decisions that reference the flat `semantic.space.[t-shirt]` scale directly — no separate `semantic.grid` group.


### Core

```
  core.breakpoint.[t-shirt]
```



## Reference Chain — Full Example

```
core.color.[ACTION_STATE palette].500
  aliased by semantic.color.action.primary.base
  aliased by component.button.default.primary.bg
  CSS output: --button-primary-bg: [resolved hex]
```

Theme switch — only semantic themed layer is swapped:

```
semantic.color.foundation.themed.base-clear
  light mode  {core.color.light.clear}
  dark mode   {core.color.dark.clear}
```



## Build Notes

**1. Freeze all alpha tokens**
Every Core alpha token must be calculated and frozen during build.
The number suffix reflects the frozen value — rename after calculation.

**2. Generate action/feedback palette via OKLCH**
Foundation colors are hand-picked. Action/feedback (blue, red, green, amber) are
generated algorithmically via OKLCH: hue + chroma curve + target steps. On demand only.

**3. Brand/accent/feedback color setup (base/contrast)**
For each brand, accent, and feedback color:
1. Generate OKLCH scale (50–950).
2. Select base step: the hero color for themed mode.
3. Select base-higher: lighter step than base.
4. Select base-lower: darker step than base.
5. contrast-primary: light.clear or dark.clear (opaque) — whichever achieves >= 4.5:1 against base.
6. contrast-secondary: pick step from same palette — most colorful step with >= 4.5:1 against base.
8. Verify pairings:
   - contrast-primary on base
   - contrast-secondary on base

**4. Verify all color pairings**
- action.primary.contrast on action.primary.base
- action.secondary-selected.contrast on action.secondary-selected.base
- action.secondary-unselected.contrast on action.secondary-unselected.base
- action.tertiary-selected.contrast on action.tertiary-selected.base
- action.tertiary-unselected.contrast on action.tertiary-unselected.base
- action.destructive.contrast on action.destructive.base
- All brand/accent/feedback contrast pairings (see Build Note 3)

**5. Focus ring on colored BG**
FG-focus on action.primary.base = 1:1. Use 2px transparent offset or separate focus-ring token.

**6. Spacing is a flat scale**
`semantic.space.[t-shirt]` is a single flat scale. Usage (padding, gap, margin) is determined by the consumer — component tokens or layout code.

**7. Article spacing in Figma**
Figma Auto Layout has one gap value — CSS adjacent sibling logic not possible.
Wrapper gap=0, each element carries padding-top = its margin-before token. Article component tokens reference the flat `semantic.space` scale.

**8. Dark mode and inverted mode**
Only themed layer swapped. Inverted mode provides the opposite of themed.
Core tokens are always mode-independent.

**9. Optional export collections**
The export tool supports optional collections (checkbox-gated):
- **Breakpoints** — 5 modes (S–2XL), recalculated font sizes per breakpoint
- **Compact Density** — space ×0.75 (integer snap, monotonic), size ×0.75 per group (integer snap, monotonic)
- **Colors** — each brand/accent/combo as a switchable collection referencing semantic tokens



## DTCG $type Reference

| $type | Kind | Sections | Composite optional? |
|---|---|---|---|
| color | Atomic | 1 | — |
| dimension | Atomic | 2–5, 8, 16 | — |
| fontFamily | Atomic | 7 | — |
| fontWeight | Atomic | 7 | — |
| dimension | Atomic | 7 (paragraphHeight) | Figma: paragraph spacing · CSS: margin-block-end |
| number | Atomic | 10 | — |
| typography | Composite | 7 | Yes — atomic tokens always exist, composite optional |
| shadow | Composite | 9 | Yes — atomic sub-values at Core, composite optional |
| border | Composite | 6 | Yes — composed from color + width + style atomics |
| strokeStyle | Composite | 6 | Yes |

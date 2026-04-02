# Parameter Reference

Multiplier Map and Parametric Token Tree for the Brand Visual Identity tool.
Extracted from the token generation logic — used by Mode A (Dialogue) to derive parameter values.



## Parameter Multiplier Map

Each Design Character value maps to a numeric multiplier or enum used in the token tree. Read these from `Brand/visual-identity.md`.

**Custom values:** Every parameter accepts `custom`. When set, the visual identity document contains the actual values or rules. Skip multiplier lookup and use those values directly in the token tree — no snap logic is applied.


### Shape & Space

**roundness** — direct number (`radius_factor`), default 1.0

Radius values snap to `radius_scale = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24]`. Fine-grained at small values for subtle distinctions. `none` (0) and `pill` (9999) are constants — only S/M/L/XL scale with the factor.

| Reference | `radius_factor` | Effect |
|-----------|-----------------|--------|
| 0.5 (sharp) | 0.5 | radius.S=1, M=2, L=4 |
| 1.0 | 1.0 | radius.S=2, M=4, L=8 |
| 2.0 (round) | 2.0 | radius.S=4, M=8, L=16 |

**space** — direct number (`space_factor`), default 1.0

Spacing uses T-shirt sizes snapped to multiples of 4px. Monotonic enforcement ensures no two adjacent sizes collapse to the same value (see Snap Functions).

| Reference | `space_factor` | Effect |
|-----------|----------------|--------|
| 0.75 (compact) | 0.75 | Tighter padding, gaps, margins |
| 1.0 | 1.0 | Baseline 4px unit |
| 1.5 (spacious) | 1.5 | More breathing room |

**dimension** — direct number (`size_factor`), default 1.0

Sizing for icons and controls. Values snap to multiples of 4px.

| Reference | `size_factor` | Effect |
|-----------|---------------|--------|
| 0.85 (compact) | 0.85 | Smaller controls + icons |
| 1.0 | 1.0 | Reference values |
| 1.25 (large) | 1.25 | Larger touch targets + icons |

**elevation**

| Value | `shadow_enabled` | Effect |
|-------|-------------------|--------|
| flat | false | No drop shadows anywhere |
| shadow | true | Shadows for z-stacking only (dropdowns, FABs, modals, floating elements) |


### Typography

**type_pairing** — determines font family assignment:

| Value | Heading | Body | Character |
|-------|---------|------|-----------|
| sans-sans | Sans-Serif | Sans-Serif | Modern, clean, tech |
| serif-serif | Serif | Serif | Traditional, editorial |
| serif-sans | Serif | Sans-Serif | Editorial headlines, readable body |
| sans-serif | Sans-Serif | Serif | Modern headlines, classic body |

**interface_font** — font for interface elements (buttons, inputs, labels, navigation):

| Value | `family-interface` | Effect |
|-------|---------------------|--------|
| sans | references family-sans | Default — clean, functional |
| serif | references family-serif | Distinctive, editorial UI |


**weight_hierarchy**

| Value | `weight_base` | `weight_heading` | Effect |
|-------|---------------|-------------------|--------|
| uniform | 400 | 400 | All text similar weight — hierarchy only through size |
| moderate | 400 | 600 | Headlines semi-bold, body regular |
| strong | 400 | 800 | Large weight differences — bold headlines, light body |

**scale_hierarchy** — direct number, default 1.0

Modifier on base ratio 1.25. Only scales from 16px upward (interface.XS/S/M are fixed). `effective_ratio = 1.25 × scale_hierarchy`.

| Reference | `scale_hierarchy` | Effect |
|-----------|-------------------|--------|
| 0.9 (flat) | 0.9 | Small size differences — homogeneous |
| 1.0 | 1.0 | Clear hierarchy — standard |
| 1.13 (dramatic) | 1.13 | Large headings — editorial feel |

**line_height** — direct number (`lh_modifier`), default 1.0

Three baselines: `heading` = 1.0, `interface` = 1.1, `paragraph` = 1.4. The parameter applies a modifier to all three.

| Reference | `lh_modifier` | Heading | Interface | Paragraph | Effect |
|-----------|---------------|---------|-----------|-----------|--------|
| 0.88 (tight) | 0.88 | ~0.88 | ~1.0 | ~1.23 | Dense, compact |
| 1.0 | 1.0 | 1.0 | 1.1 | 1.4 | Standard readability |
| 1.18 (relaxed) | 1.18 | ~1.18 | ~1.3 | ~1.65 | Open, breathable |

**paragraph_height** — direct number (`ph_modifier`), default 1.0

Spacing between paragraphs. Applied as `core.font.paragraphHeight-interface` and `core.font.paragraphHeight-paragraph`. Calculated relative to body font size (16px).

| Reference | `ph_modifier` | Interface | Paragraph | Effect |
|-----------|---------------|-----------|-----------|--------|
| 0.5 (tight) | 0.5 | 8px | 8px | Compact text blocks |
| 1.0 | 1.0 | 12px | 16px | Standard paragraph spacing |
| 1.5 (relaxed) | 1.5 | 16px | 24px | Generous spacing between paragraphs |


## Parametric Token Tree

Technology-agnostic generation logic. The `unit` base is always `4px`. Multipliers come from the Parameter Multiplier Map above. All raw values pass through type-specific snap functions before becoming final token values.

```
── Snap Functions
│   snap_4(x)          = max(4, round(x / 4) × 4)
│   snap_2(x)          = max(10, round(x / 2) × 2)
│   snap_to(scale, x)  = scale[argmin(|scale[i] - x|)]
│   snap_monotonic(values[], step):
│       for i = 1 to len(values):
│           if values[i] <= values[i-1]:
│               values[i] = values[i-1] + step
│
│   radius_scale   = [0, 1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48]
│
── Radius (snap_to radius_scale)
│   none   = 0 (constant)
│   S      = snap_to(radius_scale, 2 × radius_factor)
│   M      = snap_to(radius_scale, 4 × radius_factor)
│   L      = snap_to(radius_scale, 8 × radius_factor)
│   XL     = snap_to(radius_scale, 16 × radius_factor)
│   2XL    = snap_to(radius_scale, 32 × radius_factor)
│   pill   = 9999 (constant)
│   → apply snap_monotonic(step=1) to ensure S < M < L < XL < 2XL
│
── Spacing (T-shirt sizes, snap_4, monotonic)
│   Raw values = unit × space_factor × multiplier.
│   After snap_4, apply snap_monotonic(step=4) to guarantee ascending scale.
│
│   0      = 0
│   2XS    = snap_4(unit × space_factor × 0.5)      //  balanced: 4
│   XS     = snap_4(unit × space_factor × 1)         //  balanced: 4
│   S      = snap_4(unit × space_factor × 1.5)       //  balanced: 8
│   SM     = snap_4(unit × space_factor × 2)          //  balanced: 8
│   M      = snap_4(unit × space_factor × 3)          //  balanced: 12
│   ML     = snap_4(unit × space_factor × 4)          //  balanced: 16
│   L      = snap_4(unit × space_factor × 5)          //  balanced: 20
│   XL     = snap_4(unit × space_factor × 8)          //  balanced: 32
│   2XL    = snap_4(unit × space_factor × 12)         //  balanced: 48
│   3XL    = snap_4(unit × space_factor × 16)         //  balanced: 64
│   → apply snap_monotonic(step=4) across full scale
│
── Sizing (snap_4, monotonic)
│   Raw values = base × size_factor. Base values from conventions.
│
│   icon.S     = snap_4(16 × size_factor)     //  balanced: 16
│   icon.M     = snap_4(24 × size_factor)     //  balanced: 24
│   icon.L     = snap_4(32 × size_factor)     //  balanced: 32
│   icon.XL    = snap_4(48 × size_factor)     //  balanced: 48
│   action.XS  = snap_4(24 × size_factor)     //  balanced: 24
│   action.S   = snap_4(32 × size_factor)     //  balanced: 32
│   action.M   = snap_4(40 × size_factor)     //  balanced: 40
│   action.L   = snap_4(48 × size_factor)     //  balanced: 48
│   action.XL  = snap_4(56 × size_factor)     //  balanced: 56
│   → apply snap_monotonic(step=4) within icon and action groups
│
── Shadow (only if shadow_enabled)
│   Shadows only for elevated elements.
│   none   = none
│   S      = 0 1px 2px rgba(0,0,0, 0.05)
│   M      = 0 2px 4px rgba(0,0,0, 0.08)
│   L      = 0 4px 12px rgba(0,0,0, 0.12)
│   XL     = 0 8px 24px rgba(0,0,0, 0.16)
│
── Font Families (from type_pairing)
│   heading  = typeface mapped to heading slot by type_pairing
│   body     = typeface mapped to body slot by type_pairing
│   mono     = always monospace
│
── Typography Scale (body = 16px, effective_ratio = 1.25 × scale_hierarchy, snap_2)
│   interface.XS  = 12px (fixed)
│   interface.S   = 14px (fixed)
│   interface.M   = 16px (fixed anchor)
│   paragraph.M   = snap_2(16 × effective_ratio^0.5)
│   heading.S     = snap_2(16 × effective_ratio)
│   heading.M     = snap_2(16 × effective_ratio²)
│   heading.L     = snap_2(16 × effective_ratio³)
│   heading.XL    = snap_2(16 × effective_ratio⁴)
│   heading.2XL   = snap_2(16 × effective_ratio⁵)
│   → apply snap_monotonic(step=2) to ensure ascending scale
│
── Typography Weights
│   body       = weight_base
│   heading    = weight_heading (depends on weight parameter: uniform/moderate/strong)
│   strong     = weight_base + 200
│
── Line Heights (heading = 1.0, interface = 1.1, paragraph = 1.4)
│   heading    = 1.0 × lh_modifier
│   interface  = 1.1 × lh_modifier
│   paragraph  = 1.4 × lh_modifier
│
── Paragraph Heights (body_size = 16px)
│   paragraphHeight-interface  = body_size × ph_modifier × 0.75
│   paragraphHeight-paragraph  = body_size × ph_modifier
│
── Color (OKLCH scale generation)
│   For each color defined in Brand/visual-identity.md:
│   Steps: 50 · 100 · 200 · 300 · 400 · 500 · 600 · 700 · 800 · 900 · 950
│
│   Brand colors (at least 1):
│     core.color.brand-a.50 through core.color.brand-a.950
│     Generate steps via OKLCH: input = hex, output = lightness curve
│
│   Accent colors (optional):
│     core.color.accent-a.50 through core.color.accent-a.950
│     Same OKLCH generation
│
│   Action color:
│     core.color.blue.50–950  (action primary)
│
│   Feedback colors (info/success/warning/error):
│     core.color.blue.50–950 (info, shared with action)
│     core.color.green.50–950, amber.50–950, red.50–950
│     Action destructive shares red palette with feedback error.
│
│   Foundation colors (hand-picked, from visual-identity.md or defaults):
│     core.color.light.clear, light.cloudy, dark.clear, dark.cloudy
│     Alpha variants: a50+, a40, a10, a05+, a01+ (see conventions)
│     core.color.transparent
│     core.color.placeholder
│
│   Semantic tokens per brand/accent/feedback color (themed/inverted):
│     .themed.base            = themed (light: light–mid step / dark: adjusted step)
│     .themed.base-higher     = exactly one step lighter than base
│     .themed.base-lower      = exactly one step darker than base
│     .themed.contrast-primary  = themed (light: dark.clear / dark: light.clear)
│     .themed.contrast-secondary = from palette, most colorful step with >= 4.5:1 against base
│     Inverted mirrors all values.
│
│   Combo colors (optional, 0+):
│     Uses existing brand/accent palette scales — no own OKLCH generation.
│     Each combo pairs a BG source (palette + shade) with a FG source (palette + shade).
│     semantic.color.combo-[a-z].themed:
│       .base             = BG hex (from BG palette/shade)
│       .base-higher      = BG palette, one step lighter
│       .base-lower       = BG palette, one step darker
│       .contrast-primary = fgPrimary(base) — light.clear or dark.clear
│       .contrast-secondary = FG hex (from FG palette/shade)
│     semantic.color.combo-[a-z].inverted (BG↔FG swap):
│       .base             = FG hex becomes base
│       .base-higher      = FG palette, one step lighter
│       .base-lower       = FG palette, one step darker
│       .contrast-primary = fgPrimary(inverted base)
│       .contrast-secondary = BG hex
│     No auto-AA adjustment — user picks pairing consciously.
│
── Static Values (no brand parameter — fixed defaults)
│
│   Border Width (core.border.width.[n], n × 0.5px, 1:1 semantic mapping):
│     core:     0=0  1=0.5  2=1.0  3=1.5  4=2.0  5=2.5  6=3.0
│     semantic: none=0, XS=1, S=2, M=3, L=4, XL=5, 2XL=6
│
│   Opacity:
│     core:     0=0  40=0.40  100=1
│     semantic: enabled={core.opacity.100}, disabled={core.opacity.40}
│
│   Breakpoints:
│     core:     S=395  M=768  L=1024  XL=1280  2XL=1536px
│
│   Grid:
│     semantic.grid.margin: S={core.space.5}  M={core.space.8}  L={core.space.10}  XL={core.space.12}
│     semantic.grid.gutter: S={core.space.4}  M={core.space.5}  L={core.space.6}   XL={core.space.6}
│     Column count: 4 (S) · 8 (M) · 12 (L+)
│
│   Article Spacing:
│     semantic.space.article: S=12  M=16  L=24  XL=40  2XL=64px
│
│   Typography (static atomics):
│     core.font.weight:   light=300  regular=400  medium=500  semibold=600  bold=700  extrabold=800
│     core.font.tracking: normal=0em  caps=0.08em
│
```

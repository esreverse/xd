# XD Skills

Two Claude Code skills for building production-ready design tokens and syncing them into Figma.

| Skill | Purpose |
|---|---|
| [`xd-design-style-create`](xd-design-style-create) | Generate a complete DTCG token system visually. |
| [`xd-design-style-implement`](xd-design-style-implement) | Sync the exported tokens into Figma Variables, Text Styles, and Effect Styles. |

The two skills chain naturally: `create` produces the token files, `implement` writes them into Figma. Both work standalone — use one without the other if you already have tokens, or only need the visual exploration.



## Installation

Both skills are plain Claude Code commands — no plugin or marketplace needed.

```bash
git clone https://github.com/esreverse/xd.git
cp -R xd/xd-design-style-create    ~/.claude/commands/
cp -R xd/xd-design-style-implement ~/.claude/commands/
```

The `~/.claude/commands/` directory is where Claude Code looks for user-defined skills. Restart your Claude Code session — the slash commands `/xd-design-style-create` and `/xd-design-style-implement` are now available.

To update later, `git pull` in the cloned repo and re-copy.



## `xd-design-style-create`

Open a WYSIWYG visual explorer in the browser, configure a complete design system, export DTCG tokens.


### Inputs — what you can start from

The skill auto-detects existing sources and offers them as entry modes:

- **Image / screenshot** — paste any UI screenshot; colors, typography, spacing, and elevation are extracted as starting parameters
- **URL** — point at any live website; the skill fetches the page, reads CSS variables, fonts, palette, radii, shadows
- **Figma file or frame** — extracts text styles, color styles, and effect styles via the Figma MCP
- **Token JSON** — DTCG, Style Dictionary, or Tokens Studio format
- **DESIGN.md** — Google Stitch format manifests are mapped to all relevant parameters
- **`visual-identity.md`** — the skill reads the URL hash from the file's `## URL Hash` section for 100 % parameter pre-fill
- **Existing `README.md`** — re-opens a previously exported style at exactly its parametric state
- **Free-text description** — "spacy dark blue rounded with lightweight fonts" → Claude maps the description to parameters
- **Dialogue** — no source; step-by-step interview through Design Decisions, numeric parameters, and color choices
- **Manual** — open the tool with defaults and configure everything visually


### Visual Explorer — what it can do

The HTML tool is a fully parametric, real-time design system explorer. Everything is driven by URL parameters, so any state is a shareable link.

**Live preview includes:**
- A complete component library — buttons (primary/secondary/ghost), inputs, cards, navigation, dialogs, tooltips, badges, chips, tables, alerts, tabs
- Typography composites — headings (H1–H6), body, caption, eyebrow, code — all WCAG-checked against background pairings
- Article layouts demonstrating real text content with proper rhythm
- Surface stack examples (page → section → card → element)
- All states — default, hover, active, focus, disabled, error
- Light and dark mode side by side

**Color system:**
- Up to 6 brand colors (`brand-a` through `brand-f`)
- Multiple accent colors with independent contrast curves
- Combo colors for visual emphasis
- Feedback colors (info, success, warning, error) with full themed/inverted scheme
- Foundation tint (warm / cool / neutral) — defines the gray family
- Automatic generation of `themed`, `inverted`, `with-light`, `with-dark`, `surface`, and `surface-contrast` variants per palette
- Live **WCAG AA contrast checks** on every text-on-background pairing — failures highlighted

**Typography:**
- Sans + serif font pairing with role assignment (heading vs. body)
- Direct Google Fonts integration — paste any font URL and it loads
- Independent weight, scale, and tracking control per role
- Per-breakpoint scale overrides (S / M / L / XL / 2XL)

**Other dimensions:**
- Spacing density (compact ↔ spacious)
- Border radius scale (sharp ↔ rounded)
- Elevation (flat / drop shadows)
- Surface style (solids / gradients / meshes)
- Component style (outlined / subtle / solid)


### Outputs — what gets exported

A folder under `Design/styles/{name}/` containing:

- **DTCG token files** — split by collection so each can be imported independently:
  - `core.tokens.json` — atomic values (colors, radii, spacing, typography atomics)
  - `semantic.tokens.json` + `semantic.theme.dark.tokens.json` — themed/inverted color roles, feedback states, foundation, action, elevation
  - `semantic.colors.{brand-a|brand-b|accent-a|combo-a|…}.tokens.json` — one per palette
  - `core.density.compact.tokens.json` — optional density override
  - `core.typography.web.tokens.json` — optional Web platform typography override
  - `core.breakpoint.{s|m|l|xl|2xl}.tokens.json` — optional sparse breakpoint overrides
  - `component.tokens.json` — component-level aliases
- **`DESIGN.md`** — readable design system manifest in Google Stitch format (9 sections: Brand, Color Palette, Typography, Components, Layout, Depth, Iconography, Motion, Accessibility)
- **`README.md`** — contains the full URL hash so the exact configuration can be re-opened in the tool later



## `xd-design-style-implement`

Take the exported DTCG token files and write them into a Figma file as native Variables, Text Styles, and Effect Styles.


### What it implements

**Variable Collections** (built bottom-up, automatic alias chain `Component → Colors → Semantic → Core`):

- **Core** — atomic values, with carve-outs when optional collections own a slice
- **Typography** *(optional)* — `Default` / `Web` modes; owns `font/family-*`, `font/weight-*`
- **Density** *(optional)* — `Default` / `Compact` modes; owns `space/*`, `size/*`
- **Breakpoints** *(optional)* — `S, M, L, XL, 2XL` modes; owns `font/size-*`, `font/lineHeight-*`, `font/paragraphHeight-*`, `font/tracking-*`, `breakpoint/width`
- **Semantic** — `Light` / `Dark` modes; owns all themed/inverted roles, feedback states, foundation, action, elevation, and palette variants
- **Colors** *(optional)* — one mode per brand/accent/combo palette; 22 palette-role slots that route palette switching at runtime
- **Component** — aliases each component token to the right source via routing rules

**Text Styles** — one per `semantic.typography.*` composite. Font family, weight, size, and paragraph spacing are bound to variables; line height is computed in px; bindings are verified inline at write time so silent API failures throw immediately.

**Effect Styles** — one per `semantic.elevation.*` composite. Shadow color is variable-bound; numeric properties (offset, radius, spread) are literal because Figma doesn't accept variable bindings for those.

**Naming** — every variable carries its collection prefix (`core/`, `semantic/`, `colors/`, `component/`, `typography/`, `breakpoints/`, `density/`).

**Sidebar order** — collections are reordered after creation: Component → Colors → Semantic → Typography → Breakpoints → Density → Core.


### Requirements

Access to the Figma Plugin API via the official Figma MCP server (`mcp.figma.com`) or the Figma Console MCP. The skill writes via `use_figma`.



## Conventions

The Figma sync follows a strict architecture documented in [`figma-variables-conventions.md`](xd-design-style-implement/references/figma-variables-conventions.md). Token grammar is documented in [`design-token-conventions.md`](xd-design-style-implement/references/design-token-conventions.md).



## License

MIT

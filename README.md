# XD Skills

Two Claude Code skills for building production-ready design tokens and syncing them into Figma.

| Skill | Purpose |
|---|---|
| [`xd-design-style-create`](xd-design-style-create) | Generate a complete DTCG token system visually. |
| [`xd-design-style-implement`](xd-design-style-implement) | Sync the exported tokens into Figma Variables, Text Styles, and Effect Styles. |

The two skills chain naturally: `create` produces the token files, `implement` writes them into Figma. Both work standalone — use one without the other.



## Installation

```bash
git clone https://github.com/esreverse/xd.git
cp -R xd/xd-design-style-create    ~/.claude/commands/
cp -R xd/xd-design-style-implement ~/.claude/commands/
```

Restart your Claude Code session — `/xd-design-style-create` and `/xd-design-style-implement` are now available. To update later, `git pull` in the cloned repo and re-copy.



## `xd-design-style-create`

Open a WYSIWYG visual explorer in the browser, configure a complete design system, export DTCG tokens.

**Every state lives in the URL.** All parameters — colors, typography, spacing, design decisions — are encoded as a URL hash, so any configuration can be bookmarked, shared, embedded in docs, or restored months later by opening the link.



### Starting Points

Begin from any of these — Claude maps the source to the parametric tool:

- **Image / screenshot** — colors, typography, spacing, elevation extracted as starting parameters
- **URL** — live website; CSS variables, fonts, palette, radii, shadows
- **Figma file or frame** — text styles, color styles, effect styles via Figma MCP
- **Token JSON** — DTCG, Style Dictionary, or Tokens Studio
- **DESIGN.md** — Google Stitch format manifest
- **Existing `README.md`** — re-opens a previously exported style at exactly its parametric state
- **Free-text description** — "spacy dark blue rounded with lightweight fonts"
- **Dialogue** — step-by-step interview, no source needed
- **Manual** — open the tool with defaults and configure visually



### Visual Explorer

A fully parametric, real-time design system explorer.

**Live preview** — a complete component library (buttons, inputs, cards, navigation, dialogs, tables, alerts, tabs, …), typography composites (H1–H6, body, caption, eyebrow, code), article layouts, surface stacks, every state (default / hover / active / focus / disabled / error), light and dark mode side by side.

**Color system** — up to 6 brand colors, multiple accent and combo colors, feedback colors (info / success / warning / error), foundation tint (warm / cool / neutral). Each palette automatically generates `themed`, `inverted`, `with-light`, `with-dark`, `surface`, and `surface-contrast` variants. **Live WCAG AA contrast checks** on every text-on-background pairing.

**Typography** — sans + serif pairing with role assignment, direct Google Fonts integration, independent weight and scale control per role.

**Other dimensions** — spacing density, border radius scale, elevation (flat / drop shadows), surface style (solids / gradients / meshes), component style (outlined / subtle / solid).



### Exports

A folder under `Design/styles/{name}/` containing:

- **DTCG token files**, split by collection so each can be imported independently — covering core, semantic (light + dark), per-palette color sets, plus optional density, typography, and breakpoint collections; component-level aliases as `component.tokens.json`
- **`DESIGN.md`** — readable design system manifest in Google Stitch format
- **`README.md`** — contains the full URL hash to re-open the exact configuration in the tool later



## `xd-design-style-implement`

Take the exported DTCG token files and write them into a Figma file as native Variables, Text Styles, and Effect Styles.



### What It Implements

**Variable Collections**, built bottom-up with the alias chain `Component → Colors → Semantic → Core`:

- **Core** — atomic values
- **Typography**, **Density**, **Breakpoints** *(optional)* — multi-mode collections that own their slice of tokens
- **Semantic** (Light / Dark) — themed/inverted roles, feedback states, foundation, action, elevation, palette variants
- **Colors** *(optional)* — palette switch layer, one mode per brand/accent/combo
- **Component** — aliases each component token to the right source via routing rules

**Text Styles** — one per typography composite. Font family, weight, size, paragraph spacing bound to variables; bindings verified inline at write time so silent API failures throw immediately.

**Effect Styles** — one per elevation level. Shadow color is variable-bound.

**Naming and order** — every variable carries its collection prefix; collections are reordered in the sidebar after creation (Component → Colors → Semantic → Typography → Breakpoints → Density → Core).



### Requirements

Access to the Figma Plugin API via the official Figma MCP server (`mcp.figma.com`) or the Figma Console MCP. The skill writes via `use_figma`.



## Conventions

The Figma sync follows a strict architecture documented in [`figma-variables-conventions.md`](xd-design-style-implement/references/figma-variables-conventions.md). Token grammar is documented in [`design-token-conventions.md`](xd-design-style-implement/references/design-token-conventions.md).



## License

Use, copy, modify, and redistribute freely. Provided as-is, without warranty.

# XD Skills

Claude Code skills for the **XD design pipeline** — the design phase of a structured Discovery → Strategy → Identity → **Design** → Development workflow. The skills in this repository turn brand identity into production-ready design tokens and sync them into Figma.

> Standalone usable. The skills work outside the XD pipeline as long as DTCG token files exist in the expected shape.



## Skills

| Skill | Purpose |
|---|---|
| [`xd-design-style-create`](xd-design-style-create) | Generate DTCG design tokens visually using a WYSIWYG HTML tool. Three entry modes (Import, Dialogue, Manual) — supports Figma files, websites, screenshots, and existing token JSON as sources. Exports DTCG token files + `DESIGN.md` + a parametrised `README.md`. |
| [`xd-design-style-implement`](xd-design-style-implement) | Sync exported DTCG token files to Figma Variables, Text Styles, and Effect Styles. Restructures tokens for the Figma collection architecture (`Component → Colors → Semantic → Core` alias chain), enforces the collection-prefix naming convention, and verifies bindings inline. |

The two skills are designed to chain: `xd-design-style-create` produces the token files; `xd-design-style-implement` reads them and writes them into Figma.



## Installation

Each skill is a self-contained folder. Copy or symlink it into your Claude Code commands directory:

```bash
git clone https://github.com/esreverse/xd.git
cp -R xd/xd-design-style-create  ~/.claude/commands/
cp -R xd/xd-design-style-implement ~/.claude/commands/
```

Skills are picked up automatically by Claude Code on the next session.



## Usage

Invoke either skill via its slash command in any Claude Code session:

```
/xd-design-style-create
/xd-design-style-implement
```

Or mention the skill naturally — Claude will trigger it based on the `description` in each skill's frontmatter.


### Typical Flow

1. Run `/xd-design-style-create` to define the visual style. The skill opens an HTML tool in the browser; configure colors, typography, spacing, radii, and elevation visually. Export produces a folder under `Design/styles/{name}/` containing all DTCG token files plus a `DESIGN.md` manifest.
2. Run `/xd-design-style-implement` and provide a Figma file URL. The skill reads the token files, restructures them per the Figma conventions, and writes Variables, Text Styles, and Effect Styles into the file.



## Requirements

- **Claude Code** with skill support
- **`xd-design-style-create`** — a modern browser to run the HTML tool (no install required)
- **`xd-design-style-implement`** — access to the Figma Plugin API via the official Figma MCP server (`mcp.figma.com`) or the Figma Console MCP. The skill writes via `use_figma`.



## Repository Structure

```
xd-design-style-create/
├── SKILL.md                 # Skill entry point + frontmatter
└── references/
    ├── DESIGN.md            # Design system manifest template
    ├── parameter-reference.md
    ├── xd-style.html        # WYSIWYG token generator (browser tool)
    └── src/                 # HTML tool source modules

xd-design-style-implement/
├── SKILL.md                 # Skill entry point + frontmatter
└── references/
    ├── design-token-conventions.md     # DTCG token grammar
    └── figma-variables-conventions.md  # Figma collection architecture
```

Each skill's `SKILL.md` contains the agent-facing instructions; `references/` holds the supporting material the agent reads at execution time.



## Conventions

The Figma sync follows a strict architecture documented in [`figma-variables-conventions.md`](xd-design-style-implement/references/figma-variables-conventions.md):

- **Alias chain** — `Component → Colors → Semantic → Core` (each layer references only the layer below)
- **Collection prefixes** — every variable name starts with its collection (`core/`, `semantic/`, `colors/`, `component/`, `typography/`, `breakpoints/`, `density/`)
- **Colors collection** — palette switch layer with one mode per brand/accent/combo palette only; feedback/foundation/action stay in Semantic
- **Inline binding verification** — Text Style and Effect Style bindings are verified at write time and throw on failure



## License

MIT

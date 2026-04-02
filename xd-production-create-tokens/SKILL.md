---
name: xd-production-create-tokens
description: "Create DTCG design tokens visually. Three modes: Import (extract from Figma/website/image/token JSON), Dialogue (step-by-step questions), Manual (open tool directly). Exports DTCG token files + README with parameters for reverse intake."
---

Create design tokens visually using the Brand Visual Identity WYSIWYG tool.



## Agent

`xd-production` (when used inside the XD pipeline). Works standalone without agent context.



## Entry Mode Selection

On start, check if `Production/tokens/README.md` (or a README.md in the session context) contains a `## Parameters` section with a URL hash.

AskUserQuestion with options:
1. **Load** – restore from README.md found at [path] (only show if README with Parameters section was found)
2. **Import** – extract from website, Figma, image, or token JSON
3. **Dialogue** – step-by-step questions (11 questions)
4. **Manual** – open tool with defaults, configure everything visually

**Load:** Read the URL hash from README `## Parameters` → open the tool with that hash. Done.
**Import / Dialogue / Manual:** See sections below.

**Opening the tool:** The skill's HTML tool is at `references/brand-visual-identity.html` (relative to the skill folder). Do NOT use `open` — it strips the hash fragment. Instead, output the full `file://` URL for the user to open or paste into the browser:
```
file:///[absolute-path-to-skill]/references/brand-visual-identity.html#param1=value1&param2=value2
```
For Manual mode (no hash), output the URL without hash.



## Dialogue

Derive parameter values from brand context via structured interview.


### Preparation

If brand context is available (agent provides it, or project folders exist), use it to inform recommendations. Otherwise, ask each question without recommendations – the user decides from scratch.

See `references/parameter-reference.md` for full multiplier logic and parametric token tree.


### Interview – Shape & Space

For each question: if brand context is available, state which option you recommend and why (1 sentence).

**Roundness** "How angular should the design feel?"
AskUserQuestion (header: "Roundness") with options:
1. Sharp (0.5) – geometric, precise, technical
2. Default (1.0) – balanced, neutral
3. Round (2.0) – soft, approachable, friendly
4. Custom – enter a number

**Space** "How much breathing room between elements?"
AskUserQuestion (header: "Space") with options:
1. Compact (0.75) – dense, information-heavy, utilitarian
2. Default (1.0) – balanced whitespace
3. Spacious (1.5) – open, premium, editorial
4. Custom – enter a number

**Dimension** "How large should controls and icons be?"
AskUserQuestion (header: "Dimension") with options:
1. Compact (0.85) – smaller controls, dense interfaces
2. Default (1.0) – standard sizing
3. Large (1.25) – larger touch targets, accessibility-forward
4. Custom – enter a number


### Interview – Typography

**Weight Hierarchy** "How much weight contrast between headings and body?"
AskUserQuestion (header: "Weight Hierarchy") with options:
1. Uniform – all text similar weight, hierarchy through size only
2. Moderate – headlines semi-bold (600), body regular (400)
3. Strong – bold headlines (800), light body (400)

**Scale Hierarchy** "How dramatic should the type scale be?"
AskUserQuestion (header: "Scale Hierarchy") with options:
1. Flat (0.9) – small size differences, homogeneous
2. Default (1.0) – clear hierarchy
3. Dramatic (1.13) – large headings, editorial feel
4. Custom – enter a number

**Line Height** "How tight or loose should line spacing be?"
AskUserQuestion (header: "Line Height") with options:
1. Tight (0.88) – dense, compact, data-heavy
2. Default (1.0) – standard readability
3. Relaxed (1.18) – open, breathable, editorial
4. Custom – enter a number

**Paragraph Height** "How much space between paragraphs?"
AskUserQuestion (header: "Paragraph Height") with options:
1. Tight (0.5) – compact text blocks
2. Default (1.0) – standard paragraph spacing
3. Relaxed (1.5) – generous separation
4. Custom – enter a number

**Font Pairing** "Should headings use a different font category than body text?"
AskUserQuestion (header: "Font Pairing") with options:
1. Sans-Sans – same sans-serif for everything (clean, modern)
2. Serif-Sans – serif headings + sans body (editorial, classic contrast)
3. Sans-Serif – sans headings + serif body (uncommon, distinctive)

Interface font is always Sans by default. Specific font families are selected directly in the tool. In Import mode, fonts are pre-filled from the source (see Import section).


### Interview – Colors

**Brand Colors** Open question (Skip = default blue #2563EB):
"How many brand colors (1–6)? Describe the direction (e.g. 'warm teal + amber', 'monochrome blue'). Propose initial hex values as starting points. Or Skip to use defaults."

**Accent Colors** Open question (Skip = no accent colors):
"How many accent colors (0–6)? Zero is valid. Propose hex values if needed. Or Skip."

**Foundation Colors** "Which tint for neutral surfaces?"
AskUserQuestion (header: "Foundation Colors") with options:
1. Warm – warm neutrals (yellowish whites, warm greys)
2. Cool – cool neutrals (bluish whites, cool greys)
3. Neutral – untinted pure greys


### Interview – Elevation

**Elevation** "Should the design use drop shadows?"
AskUserQuestion (header: "Elevation") with options:
1. Flat – no shadows, overlays use scrim backdrop
2. Shadow – shadows for z-stacking (dropdowns, modals, floating elements)

Motion, feedback, component style, and surface style use standard defaults. Adjusted in `Brand/visual-identity.md` if needed.


### After Interview

1. Summarize all confirmed values in a table
2. Build URL hash from token-generating parameters (see URL Parameter Schema below)
3. Output the full `file://` URL with hash for the user to paste into the browser
4. User adjusts colors, fonts, and remaining parameters visually, then exports DTCG token files



## Import

Extract parameters from an existing source.

**Step 1 – Ask for source.** Do NOT use AskUserQuestion here. Instead, output this as plain text and wait for the user to respond with their source (URL, file path, description, or image):

> Paste or describe your source. Supported inputs:
> - Website URL
> - Figma file or frame URL (MCP needed)
> - Screenshot or image
> - Token JSON file (DTCG, Style Dictionary, Tokens Studio, etc.)
> - README.md from a previous export
> - Free text description (e.g. 'A spacy dark blue rounded design with lightweight fonts.')

**Step 2 – Analyze.** Fetch/read the source and extract as many parameters as possible.

**CRITICAL – Domain restriction:** When the source is a URL, only fetch pages on the SAME domain (exact hostname match). Do NOT follow links to external domains, third-party resources, or CDNs. Example: if the user provides `https://example.com/about`, you may fetch other pages under `example.com` but MUST NOT fetch `cdn.example.net`, `fonts.googleapis.com`, or any other host. This applies to all WebFetch calls during the entire Import flow.

Extract:
- Typography: font families (exact CSS names), weight contrast, scale hierarchy
- Spacing: density (compact/spacious)
- Roundness: border radii
- Colors: brand palette hex values, accent colors, foundation tint
- Elevation: shadows or flat
- Fonts: see "Font handling" below

**Step 3 – Show extraction summary.** Present a table of all extracted parameters with values and confidence. Clearly mark which parameters could NOT be extracted. Example: "Extracted 9/13 parameters. 4 still open."

**Step 4 – Ask remaining parameters.** For each parameter that could NOT be extracted, ask the corresponding Dialogue question (same AskUserQuestion format, numbered as "1/N remaining"). Include a recommendation if the source gives directional hints. Each question includes a **Skip** option – skipped parameters use tool defaults and can be adjusted visually later.

Format for remaining questions:
```
1/N remaining – [Parameter Name]: "[Question text]"
AskUserQuestion with the same options as in Dialogue mode.
```

**AskUserQuestion formatting rules (applies to ALL modes):**
- Labels and descriptions MUST be plain text — no Markdown (no `**bold**`, no `_italic_`, no backticks)
- Keep labels short (1–5 words)
- Use description field for context, not the label
- Import Step 1 (source input) is NOT an AskUserQuestion — it is plain text output, waiting for the user to respond freely

**Step 5 – Build URL and output.** Build the URL hash from extracted + answered values. Output the full `file://` URL for the user.

**Font handling in Import mode:**
- Extract the actual font families used by the source (CSS `font-family`, Figma text styles, etc.)
- Determine serif vs. sans classification and heading vs. body role from the source
- If a font is available on Google Fonts, pass it directly via `fontSans` / `fontSerif` URL params – the tool loads any Google Font automatically via `loadFont()`. Unknown fonts are added as new dropdown options.
- If a font is proprietary (e.g. "ABCWhyte", "SF Pro"), find the closest Google Font match based on classification (geometric, humanist, transitional, etc.) and metrics. Present the match with a brief rationale – do NOT ask generic font questions disconnected from the source.
- Set `fontPairing` based on what the source actually uses: `sans-sans` if all sans, `serif-sans` if headings are serif + body is sans, etc.
- The tool also supports pasting Google Fonts URLs (e.g. `https://fonts.google.com/specimen/Plus+Jakarta+Sans`) directly into the Sans/Serif dropdowns for manual override.



## Manual

1. Output the `file://` URL without hash for the user to open in the browser
2. User adjusts parameters and colors visually
3. User exports DTCG token files via the Export button
4. **Re-run:** Use Load mode to restore from exported README



## URL Parameter Schema

Hash format: `#fontScale=1.0&fontLineHeight=1.1&brand-a=A699E5`

| URL Param | HTML ID | Type | Notes |
|---|---|---|---|
| `fontScale` | `p-scale` | number | Scale hierarchy modifier |
| `fontLineHeight` | `p-lh` | number | Line height modifier |
| `fontParagraphHeight` | `p-ph` | number | Paragraph height modifier |
| `space` | `p-space` | number | Space factor |
| `borderRadius` | `p-roundness` | number | Radius factor |
| `dimension` | `p-dimension` | number | Size factor |
| `borderWidth` | `p-borderWidth` | number | Border width factor |
| `fontPairing` | `p-pairing` | select | Type pairing preset |
| `fontInterface` | `p-fontInterface` | select | Interface font choice |
| `fontSans` | `p-fontSans` | select | Sans-serif font family |
| `fontSerif` | `p-fontSerif` | select | Serif font family |
| `fontWeight` | `p-weight` | select | Weight hierarchy preset |
| `brand-a` … `brand-f` | color functions | hex (no #) | Brand colors |
| `accent-a` … `accent-f` | color functions | hex (no #) | Accent colors |
| `lightClear` | foundation | hex (no #) | Light clear foundation |
| `lightCloudy` | foundation | hex (no #) | Light cloudy foundation |
| `darkClear` | foundation | hex (no #) | Dark clear foundation |
| `darkCloudy` | foundation | hex (no #) | Dark cloudy foundation |
| `mode` | dark/light toggle | string | `dark` for dark mode |

**Font handling:** When setting font params, `loadFont()` is called before the dropdown value is set. Unknown fonts are added as new options.

**Live sync:** Every `update()` call triggers `syncUrlParams()` — the URL hash reflects the current tool state at all times.



## Post-Export

The tool exports DTCG token files (not a single config JSON):
- `core.tokens.json` – primitive values
- `semantic.tokens.json` – semantic mapping (light mode)
- `semantic.theme.dark.tokens.json` – dark mode overrides
- `component.tokens.json` – component tokens
- Optional: breakpoint, density, typography, high-contrast, color collection files
- `README.md` – token architecture documentation

After the user exports:

1. Instruct user to save all files to a folder (in XD projects: `Production/tokens/`)
2. The exported `README.md` contains a `## Parameters` section with all multipliers, colors, and the full URL hash – this is the reverse intake source for future re-runs
3. **In project context:** Update `Brand/visual-identity.md` with the confirmed values
4. Inform user about next step: `/xd-production-implement-tokens` to sync tokens to Figma/CSS/Tokens Studio



## Output

- `Production/tokens/*.tokens.json` – DTCG token files (exported from tool)
- `Production/tokens/README.md` – token architecture (exported from tool)
- `Brand/visual-identity.md` – human-readable reference (updated)

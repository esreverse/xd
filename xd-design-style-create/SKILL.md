---
name: xd-design-style-create
description: "Create DTCG design tokens visually. Three modes: Import (extract from Figma/website/image/visual-identity.md/token JSON), Dialogue (step-by-step questions), Manual (open tool directly). Exports DTCG token files + DESIGN.md + README with parameters."
---

Create design tokens visually using the Brand Visual Identity WYSIWYG tool.



## Agent

`xd-design` (when used inside the XD pipeline). Works standalone without agent context.



## Entry Mode Selection

On start, check for existing sources that can pre-fill the tool:
1. `Identity/visual-identity.md` — check for `## URL Hash` section
2. `Design/styles/*/README.md` — check for `## Parameters` section with a URL hash
3. A README.md in the session context

AskUserQuestion with options:
1. **Load from Visual Identity** – restore from Identity/visual-identity.md (only show if found)
2. **Load from Style** – restore from [style-name]/README.md (only show if found, list available styles)
3. **Import** – extract from website, Figma, image, or token JSON
4. **Dialogue** – step-by-step questions
5. **Manual** – open tool with defaults, configure everything visually

**Load from Visual Identity:** Read the URL hash from `## URL Hash` section → open the tool with that hash. Done.
**Load from Style:** Read the URL hash from README `## Parameters` → open the tool with that hash. Done.
**Import:** Extract parameters from a source (website, Figma, image, token JSON, etc.), then continue with the Interview (Step 2) — extracted values pre-fill recommendations.
**Dialogue:** No source — go directly to the Interview (Step 2) starting from scratch.
**Manual:** Open tool with defaults, skip the interview entirely.

**Opening the tool:** The skill's HTML tool is at `references/xd-style.html` (relative to the skill folder). Do NOT use `open` — it strips the hash fragment. Instead, output the full `file://` URL for the user to open or paste into the browser:
```
file:///[absolute-path-to-skill]/references/xd-style.html#param1=value1&param2=value2
```
For Manual mode (no hash), output the URL without hash.



## Step 1 — Source & Context

Gather input before the interview. Two paths lead here: Import (user has a source) and Dialogue (user starts from scratch). Both converge into Step 2.

**Style Name** — always ask first, regardless of path:
"Give this style a short name in kebab-case (e.g. brand, wireframe, dark-terminal). This becomes the folder and ZIP name."

**Language rule:** Style Name and Style Description MUST always be in English, regardless of the project language. The DESIGN.md is always English.


### Import Path

Extract parameters from an existing source.

**Ask for source.** Do NOT use AskUserQuestion here. Instead, output this as plain text and wait for the user to respond with their source (URL, file path, description, or image):

> Paste or describe your source. Supported inputs:
> - Website URL
> - Visual Identity file (Identity/visual-identity.md — extracts URL hash for 100% pre-fill)
> - DESIGN.md file (Google Stitch format — extracts colors, typography, spacing, radii, shadows)
> - Figma file or frame URL (MCP needed)
> - Screenshot or image
> - Token JSON file (DTCG, Style Dictionary, Tokens Studio, etc.)
> - README.md from a previous export
> - Free text description (e.g. 'A spacy dark blue rounded design with lightweight fonts.')

**Analyze.** Fetch/read the source and extract as many parameters as possible.

**CRITICAL — Domain restriction:** When the source is a URL, only fetch pages on the SAME domain (exact hostname match). Do NOT follow links to external domains, third-party resources, or CDNs. Example: if the user provides `https://example.com/about`, you may fetch other pages under `example.com` but MUST NOT fetch `cdn.example.net`, `fonts.googleapis.com`, or any other host. This applies to all WebFetch calls during the entire Import flow.

Extract:
- Typography: font families (exact CSS names), weight contrast, scale hierarchy
- Spacing: density (compact/spacious)
- Roundness: border radii
- Colors: brand palette hex values, accent colors, foundation tint
- Elevation: shadows or flat
- Fonts: see "Font handling" below

**Stitch-format source handling:**
When the source is a Stitch-format file (any filename, e.g. `visual-identity.md` or `DESIGN.md`), extract parameters from the 9 standard sections:
- Section 2 (Color Palette & Roles) → Brand colors as `brand-a` through `brand-f`, accent colors, feedback colors, foundation tint (warm/cool/neutral)
- Section 3 (Typography Rules) → Font families → `fontSans`/`fontSerif` params, weight hierarchy, scale hierarchy
- Section 5 (Layout Principles) → Base spacing unit and scale → derive `space` multiplier (compare against 4px base: 8px scale = 1.0, 6px = 0.75, 12px = 1.5)
- Section 5 (Border Radius Scale) → Derive `roundness` multiplier from the standard radius (e.g. card radius 12px ≈ 1.5, card radius 4px ≈ 0.5)
- Section 6 (Depth & Elevation) → `elevation`: flat if no shadows defined, shadow otherwise
- Section 4 (Component Stylings) → Derive `component_style` (outline/subtle/solid) from button/card definitions

**Visual Identity source handling:**
When the source is a `visual-identity.md` file, look for the `## URL Hash` section at the bottom. If found, extract the full URL hash string — this provides 100% parameter pre-fill (all multipliers, colors, fonts, design decisions). Build the tool URL directly from this hash. No further interview questions needed.

If the URL Hash section is missing, fall back to extracting parameters from the prose sections (Visual Character, Design Decisions, Typography, Colors, Spacing & Shape) as if it were a Stitch-format file.

**Design Decision derivation:** After extracting visual parameters from the source, also derive recommended Design Decision values (dd-* params) based on what was found. For example: if the source uses drop shadows → dd-elevation=dropshadows. If the source has generous whitespace → dd-whitespace=lots-of. If the source uses rounded corners → dd-corners=rounded. Include these derived dd-* values alongside the extracted parameters in the summary table, marked as "derived" rather than "extracted". The user confirms or adjusts them before opening the tool.

**After extraction:** Show what was found and what's missing. Then proceed to Step 2 (Interview) — extracted values pre-fill the recommendations, missing values are derived from the user's description and confirmed in the interview tables.

**Font handling in Import mode:**
- Extract the actual font families used by the source (CSS `font-family`, Figma text styles, etc.)
- Determine serif vs. sans classification and heading vs. body role from the source
- If a font is available on Google Fonts, pass it directly via `fontSans` / `fontSerif` URL params — the tool loads any Google Font automatically via `loadFont()`. Unknown fonts are added as new dropdown options.
- If a font is proprietary (e.g. "ABCWhyte", "SF Pro"), find the closest Google Font match based on classification (geometric, humanist, transitional, etc.) and metrics. Present the match with a brief rationale — do NOT ask generic font questions disconnected from the source.
- Set `fontPairing` based on what the source actually uses: `sans-sans` if all sans, `serif-sans` if headings are serif + body is sans, etc.
- The tool also supports pasting Google Fonts URLs (e.g. `https://fonts.google.com/specimen/Plus+Jakarta+Sans`) directly into the Sans/Serif dropdowns for manual override.


### Dialogue Path (No Source)

Ask the Style Description question:

"Describe what you're building and how it should look and feel. Think about:
- What is it? (app, website, dashboard, prototype, landing page…)
- What's the atmosphere? (professional, playful, elegant, technical, editorial, organic…)
- What's the overall feel? (light/dark, flat/layered, muted/vibrant, pastel/neon, warm/cool)
- Dense data tool or spacious storytelling? Simple focused views or complex dashboards?
- Any comparable brands or products? ('like Linear', 'like a Scandinavian lifestyle brand')

The more detail you provide, the better the parameter derivation. If you have an existing project summary or brief, feel free to paste it."

Both values (styleName, styleDesc) are passed via URL params. The styleDesc is truncated to 320 characters for the Export Overlay (DESIGN.md context field) — the full text is used for parameter derivation only.

Then proceed to Step 2.

**AskUserQuestion formatting rules (applies to ALL modes):**
- Labels and descriptions MUST be plain text — no Markdown (no `**bold**`, no `_italic_`, no backticks)
- Keep labels short (1–5 words)
- Use description field for context, not the label
- Import source input is NOT an AskUserQuestion — it is plain text output, waiting for the user to respond freely



## Step 2 — Interview

Four sub-steps: Design Decisions, Numeric Parameters & Typography, Colors, Summary. Pre-filled values from Import (Step 1) appear as recommendations — the user confirms or adjusts.


### Preparation

If brand context is available (agent provides it, or project folders exist), use it to inform recommendations. Otherwise, ask each question without recommendations — the user decides from scratch.

See `references/parameter-reference.md` for full multiplier logic and parametric token tree.


### 2a. Design Decisions

**This maps 1:1 to the Export Overlay radio buttons in the token tool.** Each decision becomes a `dd-*` URL parameter.

**Interview method:** Do NOT present a questionnaire. Start with an open question:

*"Describe how your product should look and feel. Think about the overall atmosphere — is it dense or airy? Flat or layered? Serious or playful? Are there brands, websites, or apps whose visual style inspires you?"*

**If Import provided a source:** Skip the open question. Instead, show what was extracted and propose values for the rest based on the source + Style Description.

Let the user talk freely. Then map their answers to the parameters below. Present your mapping back as **three tables** (Atmosphere, Surfaces, Inputs & Cards) using this format:

| Parameter | **Recommendation** | All Options | Rationale |
|-----------|-------------------|-------------|-----------|
| Default Theme | **Auto / Adaptive** | Light only · Dark only · **Auto / Adaptive** | [one-line why] |

Rules for the table:
- The recommended value appears **bold** in both the Recommendation column and within the All Options list
- All available options are shown separated by ` · ` (middle dot with spaces)
- One-line rationale per row — keep it short
- Do NOT show URL keys or technical parameter names in the table — use the human-readable names from the Option Reference below

For any parameter the user didn't address, recommend a value based on context with a one-sentence rationale.

**Derivation rules** — use these to map keywords from the user's description to parameter values:
- "Application" / "app" / "tool" / "player" / "dashboard" → dd-positioning=grid-only
- "Business application" / "admin tool" → dd-complexity=high, dd-vibe=formal, dd-positioning=grid-only, dd-typography=functional, space=0.85, fontScale=0.9
- "Brand website" / "landing page" → dd-whitespace=lots-of, dd-typography=expressive, dd-decoration=supportive, space=1.3, fontScale=1.13
- "Clean" / "minimal" → dd-decoration=none, dd-surface-intensity=low, dd-surface-colorfulness=one-color
- "Playful" / "fun" → dd-vibe=playful, borderRadius=2.0, dd-corners=rounded
- "Professional" / "serious" → dd-vibe=formal, dd-corners=soft, borderRadius=1.0
- "Airy" / "spacious" → dd-whitespace=lots-of, space=1.3
- "Dense" / "compact" → dd-whitespace=little, space=0.75, dimension=0.85
- "Rounded" / "soft" → borderRadius=2.0, dd-corners=rounded
- "Sharp" / "geometric" → borderRadius=0.5, dd-corners=sharp
- "Editorial" / "magazine" → fontPairing=serif-sans, fontScale=1.13, dd-typography=expressive
- "Modern" / "tech" → fontPairing=sans-sans, dd-surface-style=solids
- "Flat" → dd-elevation=flat
- "Layered" / "depth" → dd-elevation=dropshadows

For any parameter the user's description does not clearly imply, use sensible defaults. Do not ask follow-up questions for individual parameters — the user will adjust in the tool.

<!-- SHARED: design-decisions-reference -->

#### Atmosphere — Option Reference

**Default Theme** (`dd-theme`)
- **Light only** (`light-only`) — The interface uses a light theme exclusively.
- **Dark only** (`dark-only`) — The interface uses a dark theme exclusively.
- **Auto / Adaptive** (`auto-adaptive`) — The interface supports both light and dark themes, switching automatically based on system preference.

**Background** (`dd-background`)
- **Foundation only** (`foundation-only`) — Page and section backgrounds use only foundation colors (light/dark neutrals). No colored backgrounds.
- **Brand/accent only** (`brand-accent-only`) — Page and section backgrounds use brand or accent colors exclusively. No neutral foundation backgrounds.
- **Mix** (`mix`) — Page and section backgrounds mix neutral foundation colors with brand or accent colors where appropriate.

**Whitespace** (`dd-whitespace`)
- **Little** (`little`) — Minimal whitespace between page sections and component groups. Content is tightly packed.
- **Medium** (`medium`) — Moderate whitespace between page sections and component groups. Balanced breathing room.
- **Lots of** (`lots-of`) — Generous whitespace between page sections and component groups. Content has ample breathing room.

**Positioning** (`dd-positioning`)
- **Grid only** (`grid-only`) — All content is strictly positioned on a grid. Suitable for tools and data-heavy applications.
- **Grid mostly** (`grid-mostly`) — Content follows a grid with occasional free placement for visual emphasis.
- **Free** (`free`) — Content is freely positioned on the page. Suitable for brand, image, and portfolio pages.

**Elevation** (`dd-elevation`)
- **Flat** (`flat`) — The interface is entirely flat. No drop shadows or layered depth.
- **Dropshadows** (`dropshadows`) — The interface uses drop shadows to create visual depth and layered hierarchy.

**Typography** (`dd-typography`)
- **Functional** (`functional`) — Typography serves readability and structure. Headings create hierarchy but stay systematic — no decorative or oversized type treatments.
- **Expressive** (`expressive`) — Typography is used as a design element. Large decorative headlines, mixed font pairings, and typographic layouts are acceptable — type can carry visual weight beyond pure hierarchy.

**Decoration** (`dd-decoration`)
- **None** (`none`) — No decorative elements. Pure functional layout — content, whitespace, and typography only.
- **Supportive** (`supportive`) — Decorative elements that support orientation and hierarchy — icons for wayfinding, shapes to emphasize structure, visual cues that guide the user through flows and funnels.
- **Expressive** (`expressive`) — Decorative elements to build maximum atmosphere — layered textures, ornamental shapes, visual richness as part of the experience itself.

**Vibe** (`dd-vibe`)
- **Formal** (`formal`) — Strictly professional, corporate, institutional. Restrained visuals, neutral tone, no personality in the interface.
- **Casual** (`casual`) — Relaxed, approachable, friendly. Warm but not playful — the interface feels human without being loud.
- **Playful** (`playful`) — Joyful, energetic, expressive. Bold colors, rounded shapes, illustrations, micro-interactions — the interface has personality and doesn't hide it.

**Complexity** (`dd-complexity`)
- **Low** (`low`) — Screens stay simple. Functionality is spread across multiple views, and non-essential features are omitted to keep each screen focused.
- **Moderate** (`moderate`) — Screens can contain a moderate amount of functionality. Filters, sorting, and secondary actions are acceptable when the use case calls for them.
- **High** (`high`) — Screens can be dense when the use case demands it — multiple filters, sort options, data views, and complex controls on a single page are acceptable.


#### Surfaces — Option Reference

**Style** (`dd-surface-style`)
- **Solids** (`solids`) — Surfaces use flat solid fills. No gradients or mesh effects.
- **Gradients** (`gradients`) — Surfaces use linear or radial gradients for visual depth and interest.
- **Meshes** (`meshes`) — Surfaces use mesh gradients for complex, organic color blending.

**Intensity** (`dd-surface-intensity`)
- **Low / Subtle / Pastel** (`low`) — Surface colors are muted, subtle, and pastel-toned.
- **Mixed** (`mixed`) — Surface colors vary between subtle and vivid depending on context.
- **High / Intense** (`high`) — Surface colors are saturated, bold, and visually dominant.

**Color** (`dd-surface-color`)
- **Neutral** (`neutral`) — Surfaces use only neutral, achromatic tones.
- **Mixed** (`mixed`) — Surfaces mix neutral tones with selective use of brand or accent colors.
- **Colored** (`colored`) — Surfaces primarily use chromatic brand or accent colors.

**Colorfulness** (`dd-surface-colorfulness`)
- **Black & white** (`bw`) — The palette is strictly monochrome — black, white, and grays only.
- **One color** (`one-color`) — One brand or accent color is used alongside neutrals.
- **Two colors** (`two-colors`) — Two brand or accent colors are used alongside neutrals.
- **Multicolor** (`multicolor`) — Multiple brand and accent colors are used freely throughout.


#### Inputs & Cards — Option Reference

**Shapes** (`dd-shapes`)
- **Outlined** (`outlined`) — Inputs and cards use outlined/stroked shapes with transparent fills.
- **Solid** (`solid`) — Inputs and cards use solid filled shapes.

**Edges** (`dd-edges`)
- **None** (`none`) — No visible borders or outlines on inputs and cards.
- **Hairline** (`hairline`) — Inputs and cards have thin 1px borders.
- **Thick** (`thick`) — Inputs and cards have prominent, heavy borders.

**Corners** (`dd-corners`)
- **Sharp** (`sharp`) — Inputs and cards have sharp, squared corners (0 radius).
- **Soft** (`soft`) — Inputs and cards have gently rounded corners.
- **Rounded** (`rounded`) — Inputs and cards have pronounced, clearly visible rounded corners.

<!-- /SHARED: design-decisions-reference -->


### 2b. Numeric Parameters & Typography

These map to the slider inputs and dropdowns in the token tool. Each becomes a URL parameter.

**Interview method:** Continue the conversation naturally. Based on the Design Decisions from Step 2a, propose multiplier values and font choices as a package: *"Given your choices — airy, dropshadows, casual — I'd suggest these settings. Let me explain each one."*

**If Import extracted values:** Show extracted values alongside recommendations. The user confirms or adjusts.

<!-- SHARED: numeric-parameters-reference -->

#### Numeric Multipliers

| Parameter | URL Key | Default | Range / Reference |
|-----------|---------|---------|-------------------|
| Font Scale | `fontScale` | 1.0 | 0.9=flat hierarchy · 1.0 · 1.13=dramatic |
| Line Height | `fontLineHeight` | 1.0 | 0.88=tight · 1.0 · 1.18=relaxed |
| Paragraph Height | `fontParagraphHeight` | 1.0 | 0.5=tight · 1.0 · 1.5=relaxed |
| Space | `space` | 1.0 | 0.75=compact · 1.0 · 1.5=spacious |
| Border Radius | `borderRadius` | 1.0 | 0.5=sharp · 1.0 · 2.0=round |
| Dimension | `dimension` | 1.0 | 0.85=compact · 1.0 · 1.25=large |
| Border Width | `borderWidth` | 1 | 1=standard · 2=thick · 3=heavy · 4=extra heavy |

**Alignment rules:** The multipliers should be consistent with the Design Decisions. If Whitespace is "lots of", Space should be >1.0. If Corners are "sharp", Border Radius should be <1.0. If Vibe is "playful", Dimension might be >1.0.

<!-- /SHARED: numeric-parameters-reference -->

<!-- SHARED: typography-reference -->

#### Typography

| Parameter | URL Key | Options |
|-----------|---------|---------|
| Font Pairing | `fontPairing` | `sans-sans` · `serif-serif` · `serif-sans` · `sans-serif` |
| Sans Font | `fontSans` | Any Google Font (e.g. `Inter`, `DM Sans`, `Plus Jakarta Sans`, `Outfit`) |
| Serif Font | `fontSerif` | Any Google Font (e.g. `Playfair Display`, `Libre Baskerville`, `Source Serif 4`) |
| Interface Font | `fontInterface` | `sans` or `serif` |
| Weight Hierarchy | `fontWeight` | `uniform` · `moderate` · `strong` |

<!-- /SHARED: typography-reference -->


### 2c. Colors

Open question (Skip = default blue #2563EB):
"What color direction? Describe in words (e.g. 'warm teal + amber', 'monochrome blue', 'earthy greens') or provide hex values. How many brand colors (1–6)? Any accent colors?"

**If Import extracted colors:** Show extracted colors. Ask the user to confirm or adjust. Skip the open question.

From the answer, derive:
- **Brand colors**: brand-a through brand-f (hex values)
- **Accent colors**: accent-a through accent-f (optional)
- **Foundation tint**: warm/cool/neutral (match the brand palette — warm brands get warm neutrals, cool brands get cool neutrals)
- **Feedback colors**: info, success, warning, error (propose hues that fit the brand tone)

If the user skips: use #2563EB as brand-a, neutral foundation.

<!-- SHARED: color-distance-validation -->
**Color Distance Validation:** Every proposed color (all brand + all accent combined) must be perceptually distinct. Before presenting colors to the user, validate:

1. Convert all proposed colors to OKLCH (Lightness, Chroma, Hue)
2. Compute pairwise Delta E (OKLCH Euclidean distance) between every color pair:
   `ΔE = sqrt((ΔL)² + (ΔC)² + (ΔH)²)` where ΔH is the chord-length hue difference
3. **Minimum ΔE ≥ 0.1** between any two colors. If a pair falls below this threshold:
   - Shift the hue of the closer color by at least 30° away
   - Or increase/decrease lightness by at least 0.15
   - Re-validate after adjustment
4. Additionally, **minimum hue difference ≥ 25°** between any two chromatic colors (C > 0.03). This catches cases where two colors have similar hue but different lightness (e.g. light blue and dark blue count as the same hue direction — acceptable for a single brand scale, but not for two independent brand/accent slots).

This check applies across the full set: brand-a vs brand-b, brand-a vs accent-a, brand-b vs accent-a, etc. — every pairwise combination.
<!-- /SHARED: color-distance-validation -->


### 2d. Summary & Handoff

Present ALL derived values in a structured summary:

1. **Design Decisions** — three tables (Atmosphere, Surfaces, Inputs & Cards) with this format:

   | Parameter | **Recommendation** | All Options | Rationale |
   |-----------|-------------------|-------------|-----------|
   | Vibe | **Casual** | Formal · **Casual** · Playful | [why] |

   The recommended value appears **bold** in both columns. All available options shown separated by ` · `. One-line rationale per row.
2. **Numeric Parameters** — table with all 7 multipliers and rationale
3. **Typography** — pairing, weight, interface font
4. **Colors** — brand, accent, feedback, foundation hex values

Then offer two options:

"I've pre-filled everything based on your description. You can:
1. **Adjust here** — tell me what feels wrong and I'll update before opening the tool
2. **Open the tool** — go straight to the visual editor where you can fine-tune everything"

After confirmation (or if the user chooses option 2 directly):
1. Build URL hash from **every** parameter listed in the URL Parameter Schema — numeric multipliers, typography selects, colors, foundation, mode, dd-* design decisions, styleName, styleDesc. Every derived value must appear in the hash. Use `encodeURIComponent()` for all values.
2. Output the full `file://` URL with hash for the user to paste into the browser
3. User adjusts colors, fonts, and remaining parameters visually, then exports



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
| `fontPairing` | `p-pairing` | select | `serif-sans` / `sans-sans` / `serif-serif` / `sans-serif` |
| `fontInterface` | `p-fontInterface` | select | `sans` / `serif` |
| `fontSans` | `p-fontSans` | select | Sans-serif font family |
| `fontSerif` | `p-fontSerif` | select | Serif font family |
| `fontWeight` | `p-weight` | select | `uniform` / `moderate` / `strong` |
| `brand-a` … `brand-f` | color functions | hex (no #) | Brand colors |
| `accent-a` … `accent-f` | color functions | hex (no #) | Accent colors |
| `lightClear` | foundation | hex (no #) | Light clear foundation |
| `lightCloudy` | foundation | hex (no #) | Light cloudy foundation |
| `darkClear` | foundation | hex (no #) | Dark clear foundation |
| `darkCloudy` | foundation | hex (no #) | Dark cloudy foundation |
| `mode` | dark/light toggle | string | `dark` for dark mode |
| `dd-theme` | radio | string | `light-only` / `dark-only` / `auto-adaptive` |
| `dd-background` | radio | string | `foundation-only` / `brand-accent-only` / `mix` |
| `dd-whitespace` | radio | string | `little` / `medium` / `lots-of` |
| `dd-positioning` | radio | string | `grid-only` / `grid-mostly` / `free` |
| `dd-elevation` | radio | string | `flat` / `dropshadows` |
| `dd-typography` | radio | string | `functional` / `expressive` |
| `dd-decoration` | radio | string | `none` / `supportive` / `expressive` |
| `dd-vibe` | radio | string | `formal` / `casual` / `playful` |
| `dd-complexity` | radio | string | `low` / `moderate` / `high` |
| `dd-surface-style` | radio | string | `solids` / `gradients` / `meshes` |
| `dd-surface-intensity` | radio | string | `low` / `mixed` / `high` |
| `dd-surface-color` | radio | string | `neutral` / `mixed` / `colored` |
| `dd-surface-colorfulness` | radio | string | `bw` / `one-color` / `two-colors` / `multicolor` |
| `dd-shapes` | radio | string | `outlined` / `solid` |
| `dd-edges` | radio | string | `none` / `hairline` / `thick` |
| `dd-corners` | radio | string | `sharp` / `soft` / `rounded` |

**Font handling:** When setting font params, `loadFont()` is called before the dropdown value is set. Unknown fonts are added as new options.

**Live sync:** Every `update()` call triggers `syncUrlParams()` — the URL hash reflects the current tool state at all times.



## Post-Export

The tool exports DTCG token files (not a single config JSON):
- `core.tokens.json` – primitive values
- `semantic.tokens.json` – semantic mapping (light mode)
- `semantic.theme.dark.tokens.json` – dark mode overrides
- `component.tokens.json` – component tokens
- Optional: breakpoint, density, typography, color collection files
- `README.md` – token architecture documentation

After the user exports:

1. Instruct user to save all exported files to `Design/styles/{style-name}/` (the style name from the Export Overlay). Example: `Design/styles/brand/`, `Design/styles/wireframe/`
2. The exported `README.md` contains a `## Parameters` section with all multipliers, colors, and the full URL hash — this is the reverse intake source for future re-runs
3. Inform user about next step: `/xd-design-style-implement` to sync tokens to Figma/CSS/Tokens Studio



## Output

- `Design/styles/{style-name}/*.tokens.json` – DTCG token files (exported from tool)
- `Design/styles/{style-name}/DESIGN.md` – design system manifest (exported from tool)
- `Design/styles/{style-name}/README.md` – token architecture + parameters (exported from tool)

---
name: xd-design-style-implement
description: "Sync exported DTCG token files to Figma Variables. Reads token files from Design/styles/{name}/ and applies Figma conventions (collection architecture, resolve order, naming prefixes, Full Proxy Rule)."
---

Sync exported DTCG token files from `Design/styles/{name}/` to Figma Variables.


## Agent

`xd-design` (when used inside the XD pipeline). Works standalone without agent context.



## Procedure


### Step 1 -- Locate Token Files

Look for DTCG token files. In order of priority:
1. User provides file paths directly
2. `Design/styles/{name}/` folder in the current project (XD pipeline)
3. Ask user where the token files are

Required files (minimum):
- `core.tokens.json`
- `semantic.tokens.json`
- `semantic.theme.dark.tokens.json`

Optional: `component.tokens.json`, breakpoint/density/typography/HC/color collection files, `README.md`

If no token files exist → Inform the user to run `/xd-design-style-create` first.


### Step 2 -- Scope

**Collections scope — ALWAYS include every available collection.** Do NOT ask the user which optional collections to create. Scan the source folder and include every collection for which token files exist.


### Step 3 -- Sync to Figma

**THE CONVENTIONS ARE THE IMPLEMENTATION GUIDE.** The exported JSON files are tool-agnostic. Figma requires specific restructuring — collection architecture, alias chains, naming prefixes, mode grouping, token ownership. **All of this is defined in the conventions.** Read them BEFORE writing a single variable or property. They are not background reading — they are your step-by-step instructions.

| Target | Convention file (in `references/`) | What it defines |
|--------|-----------------------------------|-----------------|
| Figma | `figma-variables-conventions.md` | Collection architecture, resolve order, alias chains, Full Proxy Rule, Token Ownership, variable naming, modes |

Also read `design-token-conventions.md` — the canonical token structure and naming grammar.


#### Figma Sync

**Follow `figma-variables-conventions.md` — it defines the complete Figma implementation.** Key sections: Variable Collection Architecture, Full Proxy Rule, Token Ownership, Variable Naming.

The exported JSONs cannot be pushed to Figma as-is. The conventions describe every transformation needed: moving tokens between collections, rewriting alias chains, adding collection prefixes, building mode groups, and ensuring Full Proxy compliance.


### Step 4 -- Delta/Re-Run Logic

Re-running after brand changes:
1. Re-read token files from the same location
2. Compare with previously synced state
3. Re-sync changed tokens to tools
4. Existing component tokens in the target tool are preserved -- not overwritten


# Task 00: Enhance `create_shape` with Inline Style Properties

## Goal

Add optional inline style parameters to `create_shape` so a styled node can be created in a single call, following the existing `create_vector` pattern.

## Assigned Personas
- Primary: specialized-workflow-architect

## Checklist

- [x] Read `packages/core/src/tools/create.ts` to understand `create_shape` and `create_vector`
- [x] Add the following optional params to `create_shape`'s `params` definition:
  - `fill` (type: `color`, description: `Fill color (hex)`)
  - `stroke` (type: `color`, description: `Stroke color (hex)`)
  - `stroke_weight` (type: `number`, description: `Stroke weight`)
  - `radius` (type: `number`, description: `Corner radius`, min: 0)
  - `text` (type: `string`, description: `Text content (TEXT nodes only)`)
  - `font_family` (type: `string`, description: `Font family name`)
  - `font_size` (type: `number`, description: `Font size`, min: 1)
  - `font_style` (type: `string`, description: `Font style (e.g. Bold, Regular)`)
- [x] In the `execute` function, after the existing node setup code (position, resize, name, parent — i.e. after `if (parent) parent.appendChild(node)`), add inline style application following the `create_vector` pattern already in the same file:
  - If `fill` is provided: `node.fills = [{ type: 'SOLID', color: parseColor(fill), opacity: 1, visible: true }]` (same pattern as `create_vector` lines 144-145)
  - If `stroke` is provided: `node.strokes = [{ color: parseColor(stroke), weight: stroke_weight ?? 1, opacity: 1, visible: true, align: 'INSIDE' as const }]` (matches `set_stroke` tool default align)
  - If `radius` is provided: `node.cornerRadius = radius`
  - If `text` is provided and `args.type === 'TEXT'`: set `node.characters = text` directly (same pattern as `set_text` tool at modify.ts line 363)
  - If `text` is provided and `args.type !== 'TEXT'`: silently ignore (do not error)
  - If `font_size` is provided: `node.fontSize = font_size`
  - If `font_family` or `font_style` is provided: `node.fontName = { family: font_family ?? node.fontName.family, style: font_style ?? node.fontName.style }` (same pattern as `set_font` tool at modify.ts lines 382-387)
- [x] `parseColor` is already imported at line 1 of `create.ts` — no new import needed
- [x] Ensure the return value still uses `nodeSummary(node)` — no change to output format

## Tests

- [x] Create `tests/engine/create-shape-inline.test.ts` following the pattern in `tests/engine/tools.test.ts`:
  ```ts
  import { describe, expect, test } from 'bun:test'
  import { ALL_TOOLS, FigmaAPI, SceneGraph } from '@open-pencil/core'

  function setup() {
    const graph = new SceneGraph()
    const figma = new FigmaAPI(graph)
    return { graph, figma }
  }

  // Find the tool once:
  const createShape = ALL_TOOLS.find(t => t.name === 'create_shape')!
  ```
- [x] Add the following test cases inside a `describe('create_shape inline styles')` block:
  - `create_shape with fill applies solid fill` — create RECTANGLE with fill "#ff0000", verify `node.fills[0].color.r` is close to 1 and `.g`/`.b` close to 0
  - `create_shape with stroke applies stroke` — create FRAME with stroke "#00ff00" and stroke_weight 2, verify `node.strokes[0].color.g` close to 1 and `.weight === 2`
  - `create_shape with radius applies corner radius` — create FRAME with radius 12, verify `node.cornerRadius === 12`
  - `create_shape with text sets characters on TEXT node` — create TEXT with text "Hello", verify `node.characters === 'Hello'`
  - `create_shape with font properties sets font` — create TEXT with font_family "Inter", font_size 24, font_style "Bold", verify `node.fontName.family === 'Inter'` and `node.fontSize === 24`
  - `create_shape ignores text on non-TEXT node` — create FRAME with text "Hello", verify no error thrown and `node.characters` is undefined or empty
  - `create_shape with all inline styles` — create FRAME with fill "#ff0000", stroke "#00ff00", stroke_weight 2, radius 8 all at once, verify all three are applied
- [x] Run `bun test tests/engine/create-shape-inline.test.ts` and confirm all 7 tests pass
- [x] Run `bun test tests/engine/tools.test.ts` and confirm existing tests still pass

## Verification

- [x] `bun test tests/engine/create-shape-inline.test.ts` — all tests pass
- [x] `bun test tests/engine/tools.test.ts` — no regressions
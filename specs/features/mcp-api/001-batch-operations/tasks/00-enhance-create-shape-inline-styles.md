# Task 00: Enhance `create_shape` with Inline Style Properties

## Goal

Add optional inline style parameters to `create_shape` so a styled node can be created in a single call, following the existing `create_vector` pattern.

## Assigned Personas
- Primary: specialized-workflow-architect

## Checklist

- [ ] Read `packages/core/src/tools/create.ts` to understand `create_shape` and `create_vector`
- [ ] Add the following optional params to `create_shape`'s `params` definition:
  - `fill` (type: `color`, description: `Fill color (hex)`)
  - `stroke` (type: `color`, description: `Stroke color (hex)`)
  - `stroke_weight` (type: `number`, description: `Stroke weight`)
  - `radius` (type: `number`, description: `Corner radius`, min: 0)
  - `text` (type: `string`, description: `Text content (TEXT nodes only)`)
  - `font_family` (type: `string`, description: `Font family name`)
  - `font_size` (type: `number`, description: `Font size`, min: 1)
  - `font_style` (type: `string`, description: `Font style (e.g. Bold, Regular)`)
- [ ] In the `execute` function, after the existing node setup code (position, resize, name, parent), add inline style application:
  - If `fill` is provided: `node.fills = [{ type: 'SOLID', color: parseColor(fill), opacity: 1, visible: true }]`
  - If `stroke` is provided: `node.strokes = [{ color: parseColor(stroke), weight: stroke_weight ?? 1, opacity: 1, visible: true, align: 'INSIDE' }]`
  - If `radius` is provided: `node.cornerRadius = radius`
  - If `text` is provided and type is TEXT: `node.characters = text` using `figma.graph.updateNode(node.id, { text })`
  - If `font_family` or `font_size` is provided: set `node.fontName` / `node.fontSize` accordingly
  - If `font_style` is provided: include in `node.fontName = { family, style }`
- [ ] Import `parseColor` from `'../color'` (already imported in the file)
- [ ] Ensure the return value still uses `nodeSummary(node)` — no change to output format

## Tests

- [ ] Create `tests/engine/create-shape-inline.test.ts` with the following tests:
  - `create_shape with fill applies solid fill` — create RECTANGLE with fill "#ff0000", verify node.fills[0].color
  - `create_shape with stroke applies stroke` — create FRAME with stroke "#00ff00" and stroke_weight 2, verify node.strokes
  - `create_shape with radius applies corner radius` — create FRAME with radius 12, verify node.cornerRadius
  - `create_shape with text sets characters on TEXT node` — create TEXT with text "Hello", verify characters
  - `create_shape with font properties sets font` — create TEXT with font_family "Inter", font_size 24, font_style "Bold"
  - `create_shape ignores text on non-TEXT node` — create FRAME with text "Hello", verify no error, text is ignored
  - `create_shape with all inline styles` — create FRAME with fill, stroke, radius all at once
- [ ] Run `bun test tests/engine/create-shape-inline.test.ts` and confirm all 7 tests pass
- [ ] Run `bun test tests/engine/tools.test.ts` and confirm existing tests still pass

## Verification

- [ ] `bun test tests/engine/create-shape-inline.test.ts` — all tests pass
- [ ] `bun test tests/engine/tools.test.ts` — no regressions
# Task 03: Documentation Update

## Goal

Update all relevant documentation files to cover the new `batch` tool and enhanced `create_shape` inline styles.

## Assigned Personas
- Primary: specialized-workflow-architect

## Doc Files to Update

### `README.md` (project root)

- [ ] Add `batch` to the MCP tools table/list with description
- [ ] Add a "Batch Operations" section under usage/tools with:
  - Example: creating a styled card with text in one batch call
  - Example: `$N` reference syntax
  - Note about stop-on-first-error behavior
- [ ] Update `create_shape` docs to mention inline style params

### `CHANGELOG.md`

- [ ] Add entry under a new version heading:
  ```
  ### Added
  - `batch` tool — execute multiple operations in a single MCP call with `$N` references
  - Inline style properties on `create_shape`: fill, stroke, stroke_weight, radius, text, font_family, font_size, font_style
  ```

### `packages/docs/` (if VitePress docs exist)

- [ ] Check if `packages/docs/` has tool documentation pages
- [ ] If yes, add a `batch.md` page documenting the tool schema, examples, and error handling
- [ ] If yes, update the `create_shape` page to document inline style params

### Tool description strings

- [ ] Update `create_shape`'s `description` field in `packages/core/src/tools/create.ts` to mention inline style support:
  ```
  'Create a shape on the canvas. Accepts optional inline styles: fill, stroke, radius, text, font. Use FRAME for containers/cards, RECTANGLE for solid blocks, ELLIPSE for circles, TEXT for labels, SECTION for page sections.'
  ```

## Verification

- [ ] `bun test` — no regressions (documentation changes don't break tests)
- [ ] Grep for "batch" in README.md and CHANGELOG.md to confirm entries exist
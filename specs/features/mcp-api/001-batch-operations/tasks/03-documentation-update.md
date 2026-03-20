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

### `packages/docs/` (VitePress docs)

VitePress docs exist at `packages/docs/` with tool docs at `packages/docs/programmable/mcp-server.md` (and localized copies under `de/`, `es/`, `fr/`).

- [ ] Update `packages/docs/programmable/mcp-server.md` to add `batch` tool documentation with schema, examples, and error handling
- [ ] Update `packages/docs/programmable/mcp-server.md` to update `create_shape` docs with inline style params
- [ ] Update the localized copies (`de/`, `es/`, `fr/`) if they already document individual tools — if they are auto-generated translations, skip them and note that they need re-translation

### Tool description strings

- [ ] Update `create_shape`'s `description` field in `packages/core/src/tools/create.ts` to mention inline style support:
  ```
  'Create a shape on the canvas. Accepts optional inline styles: fill, stroke, radius, text, font. Use FRAME for containers/cards, RECTANGLE for solid blocks, ELLIPSE for circles, TEXT for labels, SECTION for page sections.'
  ```

## Verification

- [ ] `bun test` — no regressions (documentation changes don't break tests)
- [ ] Grep for "batch" in README.md and CHANGELOG.md to confirm entries exist
# Task 04: Integration Test and Final Verification

## Goal

Run the full test suite, verify all Definition of Done items, and confirm no regressions.

## Assigned Personas
- Primary: specialized-workflow-architect

## Checklist

### Integration test

- [ ] Add an integration test to `tests/engine/batch.test.ts` that simulates a realistic mockup workflow:
  ```
  Create a card mockup in a single batch call:
  1. create_shape FRAME (card container) with fill "#161b22" and radius 12
  2. create_shape TEXT (title) with parent_id "$0", text "Dashboard", font_family "Inter", font_size 24
  3. create_shape FRAME (button) with parent_id "$0", fill "#238636", radius 8
  4. create_shape TEXT (button label) with parent_id "$2", text "Get Started", font_size 14
  5. set_layout on "$0" with direction VERTICAL, spacing 16, padding 24
  6. set_layout on "$2" with direction HORIZONTAL, padding_horizontal 16, padding_vertical 8, align CENTER
  ```
  Verify: all 6 operations succeed, parent-child relationships are correct, styles are applied.

### Full test suite

- [ ] Run `bun test` and confirm ALL tests pass with no regressions
- [ ] Run `bun test tests/engine/batch.test.ts` and confirm all batch tests pass
- [ ] Run `bun test tests/engine/create-shape-inline.test.ts` and confirm all inline style tests pass
- [ ] Run `bun test tests/engine/mcp-server.test.ts` and confirm all MCP server tests pass
- [ ] Run `bun test tests/engine/tools.test.ts` and confirm all tool definition tests pass

### Definition of Done verification

- [ ] `batch` tool is registered in MCP server: run `bun test tests/engine/mcp-server.test.ts` — the "batch tool is listed" test passes
- [ ] `create_shape` accepts inline styles: run `bun test tests/engine/create-shape-inline.test.ts` — all tests pass
- [ ] `$N` references resolve correctly: run `bun test tests/engine/batch.test.ts` — reference tests pass
- [ ] Batch stops on first error: run `bun test tests/engine/batch.test.ts` — error handling tests pass
- [ ] README.md updated: grep for "batch" in README.md
- [ ] CHANGELOG.md updated: grep for "batch" in CHANGELOG.md

### TypeScript check

- [ ] Run `cd packages/core && npx tsc --noEmit` — no errors
- [ ] Run `cd packages/mcp && npx tsc --noEmit` — no errors

## Verification

- [ ] ALL of the above checks pass — feature is complete
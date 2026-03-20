# Task 04: Integration Test and Final Verification

## Goal

Run the full test suite, verify all Definition of Done items, and confirm no regressions.

## Assigned Personas
- Primary: specialized-workflow-architect

## Checklist

### Integration test

- [ ] Add an integration test to `tests/engine/batch.test.ts` (inside a `describe('batch integration')` block) that simulates a realistic mockup workflow. This test exercises inline styles from Task 00 within a batch from Task 01:
  ```ts
  test('full card mockup in a single batch call', async () => {
    const { figma } = setup()
    const result = await executeBatch(figma, [
      { tool: 'create_shape', args: { type: 'FRAME', x: 0, y: 0, width: 440, height: 580, fill: '#161b22', radius: 12 } },
      { tool: 'create_shape', args: { type: 'TEXT', parent_id: '$0', x: 32, y: 32, width: 200, height: 30, text: 'Dashboard', font_family: 'Inter', font_size: 24 } },
      { tool: 'create_shape', args: { type: 'FRAME', parent_id: '$0', x: 32, y: 80, width: 376, height: 48, fill: '#238636', radius: 8 } },
      { tool: 'create_shape', args: { type: 'TEXT', parent_id: '$2', x: 0, y: 0, width: 100, height: 20, text: 'Get Started', font_size: 14 } },
      { tool: 'set_layout', args: { id: '$0', direction: 'VERTICAL', spacing: 16, padding: 24 } },
      { tool: 'set_layout', args: { id: '$2', direction: 'HORIZONTAL', padding_horizontal: 16, padding_vertical: 8, align: 'CENTER' } }
    ])
    expect(result.error).toBeUndefined()
    expect(result.results).toHaveLength(6)
    // Verify parent-child: card frame has title, button as children
    const cardId = (result.results[0] as any).id
    const card = figma.getNodeById(cardId)!
    expect(card.children.length).toBeGreaterThanOrEqual(2)
    // Verify button has label as child
    const buttonId = (result.results[2] as any).id
    const button = figma.getNodeById(buttonId)!
    expect(button.children.some(c => c.id === (result.results[3] as any).id)).toBe(true)
  })
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
- [ ] Note: `packages/mcp/tsconfig.json` has `"noCheck": true`, so `npx tsc --noEmit` is a no-op there. Type errors in packages/mcp are caught by `bun test` at runtime instead.

## Verification

- [ ] ALL of the above checks pass — feature is complete
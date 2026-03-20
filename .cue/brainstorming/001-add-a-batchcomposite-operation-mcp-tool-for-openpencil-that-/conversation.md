# Brainstorm: Batch/Composite Operations API

## Participants
- Orchestrator (Studio Operations)

## Round 1 — Codebase Analysis

### Findings

**Existing architecture:**
- 70+ tools defined via `defineTool()` in `packages/core/src/tools/`
- MCP server at `packages/mcp/src/server.ts` auto-registers all tools from `ALL_TOOLS`
- Each tool has `name`, `description`, `mutates`, `params`, `execute(figma, args)`
- The `render` JSX tool already creates entire component trees in one call with inline styles

**Key pattern — `create_vector` already has inline styles:**
```ts
// packages/core/src/tools/create.ts:136-163
createVector accepts: fill, stroke, stroke_weight inline
```

**Gap analysis:**
1. `create_shape` does NOT accept inline styles (unlike `create_vector`)
2. No way to batch modification operations (set_fill + set_radius + set_text on multiple nodes)
3. No way to mix create + modify in one call
4. `render` JSX handles creation beautifully but can't express modifications

**Three approaches considered:**
1. **Batch meta-tool** — dispatches to existing tools by name ✅ Selected
2. **Enhanced `create_scene` DSL** — new JSON format for scene creation ❌ Duplicates `render`
3. **Enhance `render` only** — extend JSX to support modifications ❌ Wrong abstraction

## Round 2 — Design Decisions

### Schema Design for `batch` tool

```json
{
  "operations": [
    { "tool": "create_shape", "args": { "type": "FRAME", "x": 0, "y": 0, "width": 440, "height": 580, "name": "card", "fill": "#161b22", "radius": 12 } },
    { "tool": "set_text", "args": { "id": "$0", "text": "Hello" } }
  ]
}
```

- `$N` references resolve to the `id` field from operation N's result
- Operations execute sequentially, sharing the same FigmaAPI instance
- On error: stop, return `{ results: [...completed], error: { index, message } }`

### Error handling: stop-on-first-error
- Design ops cascade (parent → child → style)
- Continuing after failure produces garbage state
- Return partial results so caller knows what succeeded

### Where in codebase
- `packages/core/src/tools/batch.ts` — new file with `batch` tool
- `packages/core/src/tools/create.ts` — enhance `create_shape` with inline styles
- `packages/core/src/tools/registry.ts` — add `batch` to exports
- `packages/mcp/src/server.ts` — custom registration for batch (complex schema)
- `tests/engine/batch.test.ts` — new test file

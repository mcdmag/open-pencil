# Design Exploration: Batch Operations API

Summarized from brainstorm session at `.cue/brainstorming/001-add-a-batchcomposite-operation-mcp-tool-for-openpencil-that-/`.

## Approaches Considered

### Approach A: Batch meta-tool (SELECTED)
A single `batch` tool that accepts an array of `{ tool, args }` objects and dispatches to existing tools by name. `$N` references resolve to IDs from earlier operations.

**Why selected**: Reuses all 70+ existing tool implementations. Zero duplication. Future tools automatically batchable.

### Approach B: `create_scene` DSL
A new JSON format specifically for scene creation with nested nodes and inline properties.

**Why rejected**: The `render` JSX tool already handles this use case better — it supports JSX with inline styles (bg, rounded, stroke, font) and creates entire component trees in one call.

### Approach C: Enhance `render` JSX only
Extend the JSX tool to support modification operations.

**Why rejected**: JSX is a creation DSL — expressing modifications (set_fill on an existing node, delete, reparent) in JSX is unnatural and would require a completely different execution model.

## Codebase Findings

- `create_vector` already accepts inline `fill`, `stroke`, `stroke_weight` — precedent for inline styles on `create_shape`
- `ALL_TOOLS` registry makes dispatch trivial: `Map(ALL_TOOLS.map(t => [t.name, t]))`
- MCP server's `registerTool` auto-converts `ParamDef` → Zod, but `batch` needs custom schema (array of objects)
- Tests use `bun:test` with `SceneGraph` + `FigmaAPI` for unit tests, MCP `InMemoryTransport` for server tests

## Schema Design

```json
{
  "operations": [
    { "tool": "create_shape", "args": { "type": "FRAME", "x": 0, "y": 0, "width": 440, "height": 580, "fill": "#161b22", "radius": 12 } },
    { "tool": "create_shape", "args": { "type": "TEXT", "parent_id": "$0", "x": 32, "y": 32, "width": 200, "height": 30, "text": "Hello", "font_family": "Inter", "font_size": 24, "font_style": "Bold", "fill": "#e6edf3" } },
    { "tool": "set_layout", "args": { "id": "$0", "direction": "VERTICAL", "spacing": 16, "padding": 24 } }
  ]
}
```
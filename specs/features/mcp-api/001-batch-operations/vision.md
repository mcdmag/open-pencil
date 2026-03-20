# Architecture: Batch Operations API

## Overview

The batch operations feature adds two capabilities to the OpenPencil tool system:

1. A `batch` meta-tool that dispatches to existing tools sequentially
2. Inline style properties on `create_shape` (following the `create_vector` pattern)

Both integrate into the existing `defineTool` / `ALL_TOOLS` / `registerTool` architecture with minimal new code.

## Architecture

```mermaid
sequenceDiagram
    participant Agent as AI Agent
    participant MCP as MCP Server
    participant Batch as batch tool
    participant Registry as Tool Registry
    participant FigmaAPI as FigmaAPI

    Agent->>MCP: callTool("batch", { operations: [...] })
    MCP->>Batch: execute(figma, { operations })
    
    loop For each operation
        Batch->>Batch: Resolve $N references
        Batch->>Registry: Find tool by name
        Batch->>FigmaAPI: tool.execute(figma, resolvedArgs)
        FigmaAPI-->>Batch: result (with id)
        Batch->>Batch: Store result for $N refs
    end
    
    alt All operations succeed
        Batch-->>MCP: { results: [...] }
    else Operation fails
        Batch-->>MCP: { results: [...partial], error: { index, tool, message } }
    end
    
    MCP-->>Agent: JSON response
```

## Key Technical Decisions

### 1. Meta-tool dispatching to existing tools

The `batch` tool looks up tools by name from `ALL_TOOLS` and calls their `execute()` function directly. This means:
- Every existing tool is automatically batchable
- No code duplication
- All existing validation and error handling is reused
- New tools added in the future are automatically supported

```ts
// Simplified batch execution loop
const toolMap = new Map(ALL_TOOLS.map(t => [t.name, t]))
for (const op of operations) {
  const tool = toolMap.get(op.tool)
  const args = resolveRefs(op.args, results)
  results.push(await tool.execute(figma, args))
}
```

### 2. `$N` reference resolution

References like `$0`, `$1` in string values are replaced with the `id` field from the Nth operation's result. Resolution is recursive through all string values in the args object.

- `"$0"` → `results[0].id` (exact match, full replacement)
- `"prefix-$0-suffix"` → `"prefix-abc123-suffix"` (embedded, string interpolation)
- References to future operations are errors (forward references not allowed)
- References to failed operations are errors (operation never produced a result)

### 3. Inline styles on `create_shape`

Following the pattern already established by `create_vector` (which accepts `fill`, `stroke`, `stroke_weight`), `create_shape` gains optional style params:

| Param | Type | Description |
|-------|------|-------------|
| `fill` | color | Fill color (hex) |
| `stroke` | color | Stroke color (hex) |
| `stroke_weight` | number | Stroke weight |
| `radius` | number | Corner radius |
| `text` | string | Text content (TEXT nodes only) |
| `font_family` | string | Font family |
| `font_size` | number | Font size |
| `font_style` | string | Font style (e.g., "Bold") |

These are applied after node creation, in the same `execute()` call. This reduces a typical "create styled button" from 4-5 calls to 1.

### 4. Error handling: stop-on-first-error

Design operations typically cascade (create parent → create child → style child). If operation 2 fails, operations 3+ that reference `$2` would also fail. Stopping immediately and returning partial results is the safest strategy.

Response format:
```json
{
  "results": [
    { "id": "abc", "name": "Card", "type": "FRAME" },
    { "id": "def", "name": "Title", "type": "TEXT" }
  ],
  "error": {
    "index": 2,
    "tool": "set_fill",
    "message": "Node \"xyz\" not found"
  }
}
```

### 5. MCP server registration

The `batch` tool requires a custom Zod schema in the MCP server because its `operations` param is an array of objects (not supported by the generic `paramToZod` converter). It will be registered separately in `server.ts`, similar to how `open_file`, `save_file`, and `export_image_file` are registered.

## Security Considerations

- The `batch` tool only dispatches to tools in `ALL_TOOLS` — no arbitrary code execution
- If `eval` is disabled via `enableEval: false`, `batch` operations referencing `eval` are rejected
- `$N` references are validated (bounds checking, type checking)
- No new file I/O paths — all file access goes through existing tools
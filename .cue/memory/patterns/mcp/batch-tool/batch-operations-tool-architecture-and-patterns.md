---
date: 2026-03-20T09:07:11.497Z
title: "Batch operations tool architecture and patterns"
topic: "patterns/mcp/batch-tool"
triggered_by: "Feature implementation complete"
task: "001-batch-operations"
context: ""
---
## Batch Tool Implementation

The `batch` MCP tool dispatches to existing tools by name via `ALL_TOOLS` registry. Key files:

- `packages/core/src/tools/batch.ts` — `executeBatch()`, `resolveRefs()`, types
- `packages/core/src/tools/index.ts` — re-exports batch
- `packages/mcp/src/server.ts` — custom Zod registration (after ALL_TOOLS loop)
- `tests/engine/batch.test.ts` — 13 tests including integration

### Key patterns
- `$N` references resolve via regex `/\$(\d+)/g` — exact match returns `.id`, embedded does string replace
- Stop-on-first-error: tools return `{ error: "..." }` instead of throwing — must check `result.error` field
- `disabledTools: Set<string>` passed from MCP server to core for defense-in-depth
- `maxOperations` default 100, enforced at both Zod (.max(100)) and core layer
- Recursive `batch` calls explicitly blocked

### Inline styles on create_shape
`create_shape` accepts optional: fill, stroke, stroke_weight, radius, text, font_family, font_size, font_style — following the `create_vector` pattern already in the same file.
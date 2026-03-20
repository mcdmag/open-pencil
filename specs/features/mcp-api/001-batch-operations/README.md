# Batch/Composite Design Operations API

Add a `batch` MCP tool and enhance `create_shape` with inline style properties to drastically reduce the number of round-trip MCP calls needed for mockup creation — from 50+ calls down to 1-3.

## Overview

When building mockups with OpenPencil MCP tools, each atomic operation (create_shape, set_text, set_font, set_fill, set_stroke, set_radius) requires a separate round-trip MCP call. A single button element requires 4-5 calls. This feature adds:

1. **`batch` tool** — accepts an array of operations in a single call, with `$N` references to use IDs from earlier operations in the same batch
2. **Inline styles on `create_shape`** — optional fill, stroke, radius, text, font properties accepted directly, matching the existing `create_vector` pattern

The existing `render` JSX tool already handles complex tree creation. This feature complements it by enabling batch *modifications* and mixed create+modify workflows.

## Advantages

| Advantage | Impact |
|-----------|--------|
| 50+ MCP calls → 1-3 calls for full mockups | Major latency reduction for AI agents |
| `$N` references enable dependent operations | No need for intermediate round-trips to get IDs |
| Inline styles on `create_shape` | 4-5 calls → 1 call per styled node |
| Reuses existing tool implementations | Zero duplication, minimal new code |
| Works with all 70+ existing tools | Future tools automatically batchable |

## Risks

| Risk | Mitigation |
|------|------------|
| Complex JSON schema for batch tool | Clear documentation, validation with helpful errors |
| Partial failure state | Stop-on-first-error returns partial results |
| Large schema token cost in LLM context | Batch tool is one tool vs. describing 70+ individually |
| Reference resolution bugs | Comprehensive test coverage for `$N` resolution |
| Unbounded batch size / DoS | Max 100 operations enforced at Zod schema and core layer |
| Privilege escalation via batch | `disabledTools` set blocks `eval` (and future restricted tools); recursive `batch` calls blocked |

## Definition of Done

- [ ] `batch` tool registered in MCP server and listed by `client.listTools()`
- [ ] `create_shape` accepts inline `fill`, `stroke`, `stroke_weight`, `radius`, `text`, `font_family`, `font_size`, `font_style` params
- [ ] `$N` references resolve correctly in batch operations
- [ ] Batch stops on first error and returns partial results with error info
- [ ] All new code has unit tests (`bun test tests/engine/batch.test.ts` passes)
- [ ] Existing tests pass (`bun test` passes with no regressions)
- [ ] README.md updated with batch tool documentation
- [ ] CHANGELOG.md updated with feature entry

## Out of Scope

- Undo/rollback for partial batch failures (future enhancement)
- Parallel execution of independent operations within a batch (future optimization)
- New JSX syntax or DSL — `render` already handles tree creation
- Transaction semantics — no atomic commit/rollback

## Dependencies

- None — builds on existing tool infrastructure
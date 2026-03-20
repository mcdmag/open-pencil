# Brainstorm Summary: Batch/Composite Operations API

## User Ask

When building mockups with OpenPencil MCP tools, each atomic operation (create_shape, set_text, set_font, set_fill, set_stroke, set_radius) requires a separate round-trip MCP call. A single button element requires 4-5 calls. A full-page mockup can take 50-80+ individual calls. The user wants a batch/composite operation tool to reduce this to 1-3 calls.

## Verdict

**Two-pronged approach: enhance `create_shape` with inline styles + add a `batch` meta-tool.** The existing `render` JSX tool already handles complex tree creation in one call, but there's no equivalent for batch modifications or mixed create+modify workflows. Adding inline styles to `create_shape` covers the "quick single node" case, while the `batch` tool covers arbitrary multi-step workflows.

## Key Decisions

### Decision: Add a `batch` meta-tool rather than a `create_scene` DSL
**Why:** The codebase already has 70+ well-tested tools with a clean `defineTool` pattern. A `batch` tool that dispatches to existing tools reuses all existing validation, error handling, and logic — zero duplication. A new `create_scene` DSL would duplicate `render` JSX.

| Pros | Cons |
|------|------|
| Reuses all existing tool implementations | Slightly more verbose than a custom DSL |
| No new parsing or validation logic needed | Schema is large (array of operation objects) |
| Every existing tool is automatically batchable | Need reference resolution logic |
| Easier to maintain — one new file, not a parallel system | |

### Decision: Use `$0`, `$1`, `$N` reference syntax for inter-operation dependencies
**Why:** Operations in a batch need to reference IDs created by earlier operations (e.g., create a frame, then set its fill). Array-index references (`$0` = result of operation 0) are simple, unambiguous, and require no name registry.

| Pros | Cons |
|------|------|
| Simple to implement (array index lookup) | User must track operation indices |
| No ambiguity or name collisions | Not as readable as named references |
| Matches the feature request's proposed syntax | |

### Decision: Enhance `create_shape` with inline style properties
**Why:** `create_vector` already accepts inline `fill`, `stroke`, `stroke_weight`. Extending `create_shape` similarly eliminates 2-3 follow-up calls per node for simple cases, even outside batch context.

| Pros | Cons |
|------|------|
| Consistent with `create_vector` pattern | Slightly larger schema for `create_shape` |
| Works standalone (no batch required) | Doesn't help with complex modifications |
| Reduces 4-5 calls to 1 for styled shapes | |

### Decision: Stop-on-first-error with partial results
**Why:** Design operations often have cascading dependencies (create parent → create child → style child). If an early operation fails, continuing would likely produce garbage. Returning partial results lets the caller see what succeeded.

| Pros | Cons |
|------|------|
| Prevents cascading failures | Partial state may need cleanup |
| Caller knows exactly what succeeded | Less forgiving than continue-on-error |
| Simpler implementation | |

### Decision: Do NOT deprecate or replace the `render` JSX tool
**Why:** `render` is purpose-built for creating component trees with a familiar JSX syntax. It handles nesting, auto-layout props, and text children naturally. `batch` is complementary — it handles modification workflows and mixed create+modify. They serve different use cases.

## Key Insights

1. **The `render` tool already solves 60% of this** — it creates entire component trees from JSX with inline styles (`bg`, `rounded`, `stroke`, `font`, etc.) in a single call. The real gap is batch *modifications* of existing nodes.
2. **`create_vector` already has inline styles** — `fill`, `stroke`, `stroke_weight` are accepted inline. Extending this to `create_shape` is a natural, low-risk enhancement.
3. **The `ALL_TOOLS` registry + `registerTool` pattern** makes a batch dispatcher trivial — just look up tools by name from the existing registry and call `execute()`.
4. **The MCP server's `makeFigma()` creates a fresh API instance per call** — the batch tool must create one `FigmaAPI` instance and share it across all operations in the batch.

## Recommendations

1. Create `packages/core/src/tools/batch.ts` with a `batch` tool definition
2. Add inline style params (`fill`, `stroke`, `radius`, `text`, `font_family`, `font_size`) to `create_shape` in `packages/core/src/tools/create.ts`
3. Register `batch` in `ALL_TOOLS` via `registry.ts` so it's automatically available in MCP
4. Add a dedicated `registerBatchTool` in the MCP server to handle the complex schema (operation array with `$N` references)
5. Write tests covering: basic batch, `$N` references, stop-on-error, inline styles on create_shape

## Dissenting Views

- **"Just improve `render` JSX"** — The JSX tool is great for creation but fundamentally can't express modification operations (set_fill on an existing node, delete, reparent). A batch tool is needed for those workflows.
- **"Use named references instead of `$N`"** — Named refs are more readable but add complexity (name registry, collision handling). `$N` is simpler and matches the original feature request.

## Confidence Assessment

**High confidence** — the architecture is clean, the tool registry pattern makes this straightforward, and the existing `create_vector` inline styles provide a proven pattern to follow. Main risk is schema complexity for the batch tool's operation array.

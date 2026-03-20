# Task 01: Implement the `batch` Tool

## Goal

Create the core `batch` tool that accepts an array of operations, resolves `$N` references, executes them sequentially, and returns results with stop-on-first-error semantics.

## Assigned Personas
- Primary: specialized-workflow-architect

## Checklist

### Create `packages/core/src/tools/batch.ts`

- [ ] Create the new file `packages/core/src/tools/batch.ts`
- [ ] Import `ALL_TOOLS` from `./registry` and `defineTool` from `./schema`
- [ ] Define a `resolveRefs` function that:
  - Takes an `args` object and a `results` array
  - Recursively walks all string values in the args object
  - For exact matches of `$N` (where N is a non-negative integer): replaces with `results[N].id`
  - For embedded matches like `"prefix-$0-suffix"`: replaces the `$N` substring with `results[N].id`
  - Throws an error if N >= results.length (forward reference) or if results[N] has no `id` field
  - Returns a new args object with all references resolved (does not mutate the original)
- [ ] Define the `batch` tool using the existing tool execute pattern (NOT `defineTool` — it will be registered manually in the MCP server due to complex schema):
  ```ts
  export interface BatchOperation {
    tool: string
    args: Record<string, unknown>
  }
  
  export interface BatchResult {
    results: unknown[]
    error?: { index: number; tool: string; message: string }
  }
  
  export async function executeBatch(
    figma: FigmaAPI,
    operations: BatchOperation[],
    toolMap?: Map<string, ToolDef>
  ): Promise<BatchResult>
  ```
- [ ] Implement `executeBatch`:
  - Build a tool lookup map from `ALL_TOOLS` if not provided
  - Iterate over operations sequentially
  - For each operation: validate tool exists in map, resolve `$N` references, call `tool.execute(figma, resolvedArgs)`
  - If result contains an `error` field, treat it as a failure: stop and return `{ results: [...completed], error: { index, tool, message } }`
  - If `execute()` throws, catch and return the error in the same format
  - On success, append result to results array and continue
  - Return `{ results }` when all operations complete
- [ ] Export `executeBatch`, `BatchOperation`, `BatchResult`, and `resolveRefs` from the file

### Register in the tool index

- [ ] In `packages/core/src/tools/index.ts`, add: `export { executeBatch, resolveRefs } from './batch'` and `export type { BatchOperation, BatchResult } from './batch'`

### Tests

- [ ] Create `tests/engine/batch.test.ts` with the following tests:
  - **Basic batch execution**: batch of 2 create_shape operations, verify both results have IDs
  - **$N reference resolution**: create_shape then set_fill with `id: "$0"`, verify fill is applied to the created node
  - **Nested $N in parent_id**: create_shape (parent), create_shape with `parent_id: "$0"`, verify parent-child relationship
  - **Multiple references**: create 3 nodes, then batch set_fill on all 3 using `$0`, `$1`, `$2`
  - **Stop on error**: batch with a valid op then an op referencing a non-existent node, verify partial results + error
  - **Forward reference error**: operation references `$5` when only 2 ops exist, verify error
  - **Unknown tool error**: batch with `tool: "nonexistent_tool"`, verify error at index 0
  - **Empty batch**: empty operations array returns `{ results: [] }`
  - **resolveRefs unit test**: test `$0` exact match, embedded `$0` in string, nested object values, array values
- [ ] Run `bun test tests/engine/batch.test.ts` and confirm all 9 tests pass

## Verification

- [ ] `bun test tests/engine/batch.test.ts` — all tests pass
- [ ] `bun test` — no regressions across the full test suite
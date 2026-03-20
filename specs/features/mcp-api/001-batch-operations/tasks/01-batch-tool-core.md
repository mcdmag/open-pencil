# Task 01: Implement the `batch` Tool

## Goal

Create the core `batch` tool that accepts an array of operations, resolves `$N` references, executes them sequentially, and returns results with stop-on-first-error semantics.

## Assigned Personas
- Primary: specialized-workflow-architect

## Checklist

### Create `packages/core/src/tools/batch.ts`

- [x] Create the new file `packages/core/src/tools/batch.ts`
- [x] Import `ALL_TOOLS` from `./registry`, and type-only imports: `type { ToolDef }` from `./schema` and `type { FigmaAPI }` from `../figma-api`. Do NOT import `defineTool` — `batch` is not registered via `defineTool` since it needs a custom Zod schema in the MCP server.
- [x] Define a `resolveRefs` function that:
  - Takes an `args` object and a `results` array
  - Recursively walks all string values in the args object
  - For exact matches of `$N` (where N is a non-negative integer): replaces with `results[N].id`
  - For embedded matches like `"prefix-$0-suffix"`: replaces the `$N` substring with `results[N].id`
  - Throws an error if N >= results.length (forward reference) or if results[N] has no `id` field
  - Returns a new args object with all references resolved (does not mutate the original)
- [x] Define the `batch` tool using the existing tool execute pattern (NOT `defineTool` — it will be registered manually in the MCP server due to complex schema):
  ```ts
  export interface BatchOperation {
    tool: string
    args: Record<string, unknown>
  }
  
  export interface BatchResult {
    results: unknown[]
    error?: { index: number; tool: string; message: string }
  }
  
  export interface BatchOptions {
    toolMap?: Map<string, ToolDef>
    disabledTools?: Set<string>
    maxOperations?: number       // default 100
  }

  export async function executeBatch(
    figma: FigmaAPI,
    operations: BatchOperation[],
    options?: BatchOptions
  ): Promise<BatchResult>
  ```
- [x] Implement `executeBatch`:
  - Build a tool lookup map from `ALL_TOOLS` if not provided via `options.toolMap`
  - **Enforce `maxOperations` (default 100)**: if `operations.length > maxOperations`, return error immediately. This prevents denial-of-service from excessively large batches.
  - **Enforce `disabledTools`**: before dispatching each operation, check if `op.tool` is in `options.disabledTools`. If so, return an error at that index with message `"Tool '{tool}' is disabled"`. This is the core-layer defense against privilege escalation (e.g., `eval` when disabled).
  - **Block self-referencing**: if any operation has `tool: "batch"`, return an error. Recursive batch calls could cause infinite loops.
  - Iterate over operations sequentially
  - For each operation: validate tool exists in map, resolve `$N` references, call `tool.execute(figma, resolvedArgs)`
  - **Error detection**: check if result is an object with an `error` field — existing tools like `set_fill`, `get_node` return `{ error: "Node not found" }` instead of throwing. Treat `result.error` as a failure: stop and return `{ results: [...completed], error: { index, tool, message: result.error } }`
  - If `execute()` throws an exception, catch it and return the error in the same format: `{ results: [...completed], error: { index, tool, message: e.message } }`
  - On success, append result to results array and continue
  - Return `{ results }` when all operations complete
- [x] Export `executeBatch`, `BatchOperation`, `BatchResult`, `BatchOptions`, and `resolveRefs` from the file

### Register in the tool index

- [x] In `packages/core/src/tools/index.ts`, add: `export { executeBatch, resolveRefs } from './batch'` and `export type { BatchOperation, BatchResult, BatchOptions } from './batch'`

### Tests

- [x] Create `tests/engine/batch.test.ts` following the pattern in `tests/engine/tools.test.ts`:
  ```ts
  import { describe, expect, test } from 'bun:test'
  import { ALL_TOOLS, FigmaAPI, SceneGraph } from '@open-pencil/core'
  // executeBatch and resolveRefs are exported from @open-pencil/core/tools (via index.ts)
  import { executeBatch, resolveRefs } from '@open-pencil/core/tools'

  function setup() {
    const graph = new SceneGraph()
    const figma = new FigmaAPI(graph)
    return { graph, figma }
  }
  ```
- [x] Add the following test cases:
  - **Basic batch execution**: batch of 2 create_shape operations, verify both results have IDs
  - **$N reference resolution**: create_shape then set_fill with `id: "$0"`, verify fill is applied to the created node
  - **Nested $N in parent_id**: create_shape (parent), create_shape with `parent_id: "$0"`, verify parent-child relationship
  - **Multiple references**: create 3 nodes, then batch set_fill on all 3 using `$0`, `$1`, `$2`
  - **Stop on error**: batch with a valid op then an op referencing a non-existent node, verify partial results + error
  - **Forward reference error**: operation references `$5` when only 2 ops exist, verify error
  - **Unknown tool error**: batch with `tool: "nonexistent_tool"`, verify error at index 0
  - **Empty batch**: empty operations array returns `{ results: [] }`
  - **resolveRefs unit test**: test `$0` exact match, embedded `$0` in string, nested object values, array values
  - **Disabled tool rejected**: batch with `disabledTools: new Set(["eval"])` and an eval operation, verify error with "disabled" message
  - **Recursive batch blocked**: batch containing `tool: "batch"`, verify error
  - **maxOperations enforced**: batch with 101 operations and `maxOperations: 100`, verify error before any execution
- [x] Run `bun test tests/engine/batch.test.ts` and confirm all 12 tests pass

## Verification

- [x] `bun test tests/engine/batch.test.ts` — all 12 tests pass
- [x] `bun test` — no regressions across the full test suite
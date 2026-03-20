# Task 02: Register `batch` Tool in the MCP Server

## Goal

Register the `batch` tool in the MCP server with a proper Zod schema, so it's callable by AI agents via the MCP protocol.

## Assigned Personas
- Primary: specialized-workflow-architect

## Checklist

### Update `packages/mcp/src/server.ts`

- [ ] Import `executeBatch` from `@open-pencil/core/tools` (or `@open-pencil/core`)
- [ ] After the `for (const tool of ALL_TOOLS) { registerTool(tool) }` loop, add a custom registration for `batch`:
  ```ts
  register(
    'batch',
    {
      description: 'Execute multiple tools in a single call. Use $N references (e.g. "$0") to use the ID from operation N\'s result. Stops on first error and returns partial results.',
      inputSchema: z.object({
        operations: z.array(
          z.object({
            tool: z.string().describe('Tool name (e.g. "create_shape", "set_fill")'),
            args: z.record(z.unknown()).describe('Tool arguments. Use "$N" to reference the id from operation N\'s result.')
          })
        ).min(1).describe('Array of operations to execute sequentially')
      })
    },
    async ({ operations }: { operations: { tool: string; args: Record<string, unknown> }[] }) => {
      try {
        const result = await executeBatch(makeFigma(), operations)
        return ok(result)
      } catch (e) {
        return fail(e)
      }
    }
  )
  ```
- [ ] Ensure the `batch` tool is registered AFTER `ALL_TOOLS` so the tool lookup map in `executeBatch` includes all tools
- [ ] Verify the `batch` tool does NOT allow dispatching to `eval` when `enableEval` is false — add a check: if a batch operation references `eval` and `!enableEval`, return an error

### Update `packages/mcp/src/http.ts` (if needed)

- [ ] Check if `http.ts` uses `createServer()` — if so, no changes needed since batch is registered inside `createServer()`
- [ ] Read `packages/mcp/src/http.ts` to confirm

### Tests

- [ ] Add tests to `tests/engine/mcp-server.test.ts`:
  - `batch tool is listed in tools` — verify `client.listTools()` includes `batch`
  - `batch creates multiple nodes` — call batch via MCP client with 2 create_shape ops, verify response has 2 results
  - `batch resolves $N references` — create_shape then set_fill with `$0` ref, verify success
  - `batch returns error on failure` — batch with an invalid op, verify `isError` or error in response
  - `batch rejects eval when disabled` — create server with `enableEval: false`, batch an eval op, verify error
- [ ] Run `bun test tests/engine/mcp-server.test.ts` and confirm all new + existing tests pass

## Verification

- [ ] `bun test tests/engine/mcp-server.test.ts` — all tests pass
- [ ] `bun test tests/engine/batch.test.ts` — still passes
- [ ] `bun test` — no regressions
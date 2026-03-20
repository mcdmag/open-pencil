# Task 02: Register `batch` Tool in the MCP Server

## Goal

Register the `batch` tool in the MCP server with a proper Zod schema, so it's callable by AI agents via the MCP protocol.

## Assigned Personas
- Primary: specialized-workflow-architect

## Checklist

### Update `packages/mcp/src/server.ts`

- [x] Import `executeBatch` from `@open-pencil/core/tools` — this path is mapped in `packages/core/package.json` under `exports["./tools"]` pointing to `src/tools/index.ts`
- [x] After the `for (const tool of ALL_TOOLS) { registerTool(tool) }` loop (line 207 in server.ts), and BEFORE the `get_codegen_prompt` registration, add a custom registration for `batch`. The `register` variable (line 114) is `server.registerTool.bind(server)` and is already used for `open_file`, `save_file`, `new_document`, and `export_image_file`:
  ```ts
  // Build disabled set: eval when enableEval is false, plus any server-only tools
  const disabledTools = new Set<string>()
  if (!enableEval) disabledTools.add('eval')

  register(
    'batch',
    {
      description: 'Execute multiple tools in a single call. Use $N references (e.g. "$0") to use the ID from operation N\'s result. Stops on first error and returns partial results. Max 100 operations.',
      inputSchema: z.object({
        operations: z.array(
          z.object({
            tool: z.string().describe('Tool name (e.g. "create_shape", "set_fill")'),
            args: z.record(z.unknown()).describe('Tool arguments. Use "$N" to reference the id from operation N\'s result.')
          })
        ).min(1).max(100).describe('Array of operations to execute sequentially (max 100)')
      })
    },
    async ({ operations }: { operations: { tool: string; args: Record<string, unknown> }[] }) => {
      try {
        const result = await executeBatch(makeFigma(), operations, { disabledTools })
        return ok(result)
      } catch (e) {
        return fail(e)
      }
    }
  )
  ```
- [x] Ensure the `batch` tool is registered AFTER `ALL_TOOLS` so the tool lookup map in `executeBatch` includes all tools
- [x] The `eval` gate is enforced at two layers: (1) the Zod schema `.max(100)` limits batch size, (2) the `disabledTools` set passed to `executeBatch` blocks `eval` (and any future restricted tools) at the core layer. This defense-in-depth prevents bypass if `executeBatch` is called outside the MCP server.

### Confirm no changes needed in `packages/mcp/src/http.ts`

- [x] `http.ts` calls `createServer(pkg.version, { enableEval: false, fileRoot })` at line 28 — since `batch` is registered inside `createServer()`, no changes are needed in `http.ts`. Just verify this by reading the file.

### Tests

- [x] Add tests to `tests/engine/mcp-server.test.ts` inside the existing `describe('MCP server')` block. Follow the existing pattern: use `client.callTool({ name: 'batch', arguments: { operations: [...] } })` and parse results with `parseResult()`. Each test must first call `new_document` to load a document.
  - `batch tool is listed in tools` — verify `client.listTools()` includes `batch` (add to existing `'lists all registered tools'` test or create separate)
  - `batch creates multiple nodes` — call `new_document`, then `batch` with 2 create_shape ops, `parseResult()` and verify `.results` has 2 entries with IDs
  - `batch resolves $N references` — call `new_document`, then `batch` with create_shape + set_fill using `id: "$0"`, verify no error
  - `batch returns error on failure` — call `new_document`, then `batch` with `set_fill` on nonexistent ID, verify `parseResult()` has `.error` with `index: 0`
  - `batch rejects eval when disabled` — use `createLinkedClient({ enableEval: false })` (helper at line 16-29), call `new_document`, then `batch` with `{ tool: "eval", args: { code: "1+1" } }`, verify error response
- [x] Run `bun test tests/engine/mcp-server.test.ts` and confirm all new + existing tests pass

## Verification

- [x] `bun test tests/engine/mcp-server.test.ts` — all tests pass
- [x] `bun test tests/engine/batch.test.ts` — still passes
- [x] `bun test` — no regressions
# Note: `packages/mcp/tsconfig.json` has `"noCheck": true`, so `npx tsc --noEmit` is a no-op there. Type errors in packages/mcp are caught by `bun test` at runtime instead.

MCP types checked at runtime.

```mermaid
flowchart LR
    A[packages/mcp] --> B[noCheck: true]
    B --> C[types verified by bun test]
```

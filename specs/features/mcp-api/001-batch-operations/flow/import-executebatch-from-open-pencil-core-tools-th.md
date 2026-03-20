# Import `executeBatch` from `@open-pencil/core/tools` — this path is mapped in `packages/core/package.json` under `exports["./tools"]` pointing to `src/tools/index.ts`

MCP server imports executeBatch from core/tools.

```mermaid
flowchart LR
    A[server.ts] -->|import executeBatch| B[@open-pencil/core/tools]
```

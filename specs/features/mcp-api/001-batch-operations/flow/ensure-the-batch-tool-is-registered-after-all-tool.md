# Ensure the `batch` tool is registered AFTER `ALL_TOOLS` so the tool lookup map in `executeBatch` includes all tools

Ordering verified.

```mermaid
flowchart LR
    A[ALL_TOOLS loop] --> B[batch registration]
```

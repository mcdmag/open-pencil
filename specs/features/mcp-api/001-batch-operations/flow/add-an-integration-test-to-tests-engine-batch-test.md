# Add an integration test to `tests/engine/batch.test.ts` (inside a `describe('batch integration')` block) that simulates a realistic mockup workflow. This test exercises inline styles from Task 00 within a batch from Task 01:

Integration test verifies full mockup workflow in a single batch call.

```mermaid
flowchart TD
    A[batch call - 6 ops] --> B[create card FRAME with fill/radius]
    B --> C[create title TEXT with font]
    B --> D[create button FRAME with fill/radius]
    D --> E[create label TEXT]
    B --> F[set_layout VERTICAL on card]
    D --> G[set_layout HORIZONTAL on button]
    A --> H[Verify: 6 results, parent-child, styles, text]
```

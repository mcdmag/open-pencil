# Read `packages/core/src/tools/create.ts` to understand `create_shape` and `create_vector`

create_shape now accepts optional inline style properties (fill, stroke, radius, text, font), applied after node creation following the create_vector pattern.

```mermaid
flowchart TD
    A[create_shape] --> B[Create node]
    B --> C[Position & size]
    C --> D[Name & parent]
    D --> E{Inline styles}
    E -->|fill| F[parseColor → fills]
    E -->|stroke| G[parseColor → strokes]
    E -->|radius| H[cornerRadius]
    E -->|text+TEXT| I[characters]
    E -->|font| J[fontName/fontSize]
    E --> K[nodeSummary]
```

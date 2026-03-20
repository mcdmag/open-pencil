# Add the following optional params to `create_shape`'s `params` definition:

Inline style params (fill, stroke, stroke_weight, radius, text, font_family, font_size, font_style) added to create_shape's params definition.

```mermaid
flowchart LR
    A[create_shape params] --> B[type, x, y, width, height]
    A --> C[name, parent_id]
    A --> D[fill, stroke, stroke_weight]
    A --> E[radius, text, font_family, font_size, font_style]
```

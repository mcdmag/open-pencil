# In the `execute` function, after the existing node setup code (position, resize, name, parent — i.e. after `if (parent) parent.appendChild(node)`), add inline style application following the `create_vector` pattern already in the same file:

Inline style application logic in create_shape execute function, applied after node creation and parenting.

```mermaid
flowchart TD
    A[Node created] --> B[Position/size/name/parent]
    B --> C{fill?}
    C -->|yes| D[parseColor → node.fills]
    C -->|no| E{stroke?}
    D --> E
    E -->|yes| F[parseColor → node.strokes]
    E -->|no| G{radius?}
    F --> G
    G -->|yes| H[node.cornerRadius]
    G -->|no| I{text + TEXT?}
    H --> I
    I -->|yes| J[node.characters]
    I -->|no| K{font?}
    J --> K
    K -->|yes| L[node.fontName/fontSize]
    K -->|no| M[return]
    L --> M
```

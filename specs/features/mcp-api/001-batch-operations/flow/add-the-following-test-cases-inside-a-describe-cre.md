# Add the following test cases inside a `describe('create_shape inline styles')` block:

7 test cases in describe('create_shape inline styles') block covering fill, stroke, radius, text, font, ignore-on-non-TEXT, and combined styles.

```mermaid
flowchart TD
    A[describe create_shape inline styles] --> B[fill applies solid fill]
    A --> C[stroke applies stroke]
    A --> D[radius applies corner radius]
    A --> E[text sets characters on TEXT]
    A --> F[font properties sets font]
    A --> G[ignores text on non-TEXT]
    A --> H[all inline styles at once]
```

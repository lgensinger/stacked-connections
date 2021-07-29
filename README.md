# Stacked Connections

ES6 d3.js stacked bar chart / connections hybrid visualization.


## Style

Style is expected to be addressed via css. The top-level svg is assigned a class `lgv-stacked-connections`. Any style not met by the visualization module is expected to be added by the importing component.

## Environment Variables

The following values can be set via environment or passed into the class.

| Name | Type | Description |
| :-- | :-- | :-- |
| `DIMENSION_HEIGHT` | integer | height of artboard |
| `DIMENSION_WIDTH` | integer | width of artboard |
| `LAYOUT_PADDING_STACK_CELL` | integer | space between stacked shapes |
| `LAYOUT_PADDING_STACK_TEXT` | string | space between stack shape and corresponding label text |

## Install

```bash
# install package
npm install @lgv/stacked-connections
```

## Data Format

The following values are the expected input data structure.

```json
{
    "stacks": [
        { "stack1": { "aaa": 1, "aab": 2, "aac": 3 } },
        { "stack2": { "bbb": 2, "bbc": 5} },
        { "stack3": { "ccc": 1, "ccd": 8, "cce": 8} },
        { "stack4": { "ddd": 5, "dde": 11, "ddf": 0} }
    ],
    "connections": [
        { "source": "aaa", "target": "bbb", "focus": "some-label" },
        { "source": "bbb", "target": "ccd", "focus": null }
    ]
}
```

## Use Module

```bash
import { StackedConnections } from "@lgv/stacked-connections";

// initialize
const sc = new StackedConnections(data);

// render visualization
sc.render(document.body);
```

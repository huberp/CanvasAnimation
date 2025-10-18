# Bounding Shape Metadata Generator

This utility generates spritesheet metadata files containing bounding shapes for collision detection. It processes sprite sheets and creates JSON files with bounding shape coordinates for each sprite using multiple algorithms and accuracy levels.

## Overview

The utility automates the process of:
1. Computing bounding shapes for each sprite in a sprite sheet
2. Using three different algorithms (Marching Squares, Convex Hull, Simplified Convex Hull)
3. Generating three accuracy levels (low, mid, high) for each algorithm
4. Storing results in a JSON metadata file
5. Creating visual screenshots showing the bounding shapes

## Installation

First, install the required dependencies:

```bash
npm install
```

This will install the `canvas` package which is required for image processing in Node.js.

## Usage

### Process a Single Sprite Sheet

```bash
node utils/generateBoundingShapeMeta.js <image-path> <sprite-width> <sprite-height> <grid-width> <num-sprites>
```

Or using npm:

```bash
npm run generate-meta <image-path> <sprite-width> <sprite-height> <grid-width> <num-sprites>
```

**Parameters:**
- `image-path`: Path to the sprite sheet image (e.g., `img/asteroid4_32x32.png`)
- `sprite-width`: Width of each sprite in pixels
- `sprite-height`: Height of each sprite in pixels
- `grid-width`: Number of sprites per row in the sheet
- `num-sprites`: Total number of sprites in the sheet

**Example:**

```bash
node utils/generateBoundingShapeMeta.js img/asteroid4_32x32.png 32 32 5 19
```

### Process All Sprite Sheets

To process all sprite sheets defined in the project:

```bash
node utils/processAllSpriteSheets.js
```

Or using npm:

```bash
npm run generate-all-meta
```

## Output

The utility generates the following files in the `img/meta/` directory:

### 1. Metadata JSON File

Named `<sprite-sheet>-meta.json`, this file contains:

```json
{
  "sourceImage": "asteroid4_32x32.png",
  "spriteWidth": 32,
  "spriteHeight": 32,
  "gridWidth": 5,
  "numSprites": 19,
  "timestamp": "2025-10-18T08:28:56.942Z",
  "algorithms": {
    "marchingSquares": {
      "low": [...],
      "mid": [...],
      "high": [...]
    },
    "convexHull": {
      "low": [...],
      "mid": [...],
      "high": [...]
    },
    "simplifiedConvexHull": {
      "low": [...],
      "mid": [...],
      "high": [...]
    }
  }
}
```

Each sprite entry contains:
- `index`: Sprite index in the sheet
- `position`: `{x, y}` coordinates in the sprite sheet
- `boundingShape`: Array of `{x, y}` points defining the polygon (relative to sprite box)
- `pointCount`: Number of points in the polygon

### 2. Visual Screenshots

Nine PNG files per sprite sheet showing the computed bounding shapes:
- `<sprite-sheet>-marchingSquares-low.png`
- `<sprite-sheet>-marchingSquares-mid.png`
- `<sprite-sheet>-marchingSquares-high.png`
- `<sprite-sheet>-convexHull-low.png`
- `<sprite-sheet>-convexHull-mid.png`
- `<sprite-sheet>-convexHull-high.png`
- `<sprite-sheet>-simplifiedConvexHull-low.png`
- `<sprite-sheet>-simplifiedConvexHull-mid.png`
- `<sprite-sheet>-simplifiedConvexHull-high.png`

## Algorithms

### 1. Marching Squares + Douglas-Peucker

Best for irregular, concave shapes like asteroids.

**Accuracy Levels:**
- **Low** (tolerance: 4.0) - Fewer points, faster collision detection
- **Mid** (tolerance: 2.0) - Balanced accuracy and performance
- **High** (tolerance: 1.0) - More accurate, more points

### 2. Convex Hull

Produces convex polygons suitable for simpler collision algorithms.

**Accuracy Levels:**
- **Low** (tolerance: 2.0) - Simplified hull
- **Mid** (tolerance: 1.0) - Moderately simplified
- **High** (tolerance: 0.5) - Minimally simplified

### 3. Simplified Convex Hull

Combines convex hull with simplification to reduce collinear points.

**Accuracy Levels:**
- **Low** (tolerance: 2.0) - Fewer points
- **Mid** (tolerance: 1.0) - Moderate point count
- **High** (tolerance: 0.5) - More detailed

## Using the Generated Metadata

### Loading Metadata in Your Game

```javascript
import metadata from './img/meta/asteroid4_32x32-meta.json';

// Choose algorithm and accuracy based on device capabilities
const algorithm = 'marchingSquares';
const accuracy = 'mid'; // or 'low' for mobile, 'high' for desktop

const sprites = metadata.algorithms[algorithm][accuracy];

// Get bounding shape for sprite index 0
const sprite0 = sprites[0];
console.log(`Sprite at (${sprite0.position.x}, ${sprite0.position.y})`);
console.log(`Bounding shape:`, sprite0.boundingShape);
console.log(`Point count: ${sprite0.pointCount}`);
```

### Integrating with Collision Detection

```javascript
class SpriteWithCollision {
    constructor(metadata, algorithm = 'marchingSquares', accuracy = 'mid') {
        this.metadata = metadata;
        this.shapes = metadata.algorithms[algorithm][accuracy];
    }
    
    getBoundingShape(spriteIndex) {
        return this.shapes[spriteIndex].boundingShape;
    }
    
    getSpritePosition(spriteIndex) {
        return this.shapes[spriteIndex].position;
    }
}

// Usage
const asteroidMeta = await fetch('./img/meta/asteroid4_32x32-meta.json')
    .then(r => r.json());

const asteroidCollision = new SpriteWithCollision(
    asteroidMeta,
    'marchingSquares',
    'mid'
);

// Get bounding shape for collision detection
const shape = asteroidCollision.getBoundingShape(5);
```

## Choosing the Right Algorithm and Accuracy

### Algorithm Selection

| Algorithm | Best For | Pros | Cons |
|-----------|----------|------|------|
| **Marching Squares** | Irregular shapes (asteroids) | Most accurate fit | May produce concave polygons |
| **Convex Hull** | Simple collision detection | Always convex, simpler math | Poor fit for concave shapes |
| **Simplified Convex Hull** | Balanced approach | Convex + fewer points | Still loses concave details |

### Accuracy Selection

| Accuracy | Use Case | Trade-off |
|----------|----------|-----------|
| **Low** | Mobile devices, many objects | Fast, but less precise |
| **Mid** | General purpose | Good balance |
| **High** | Desktop, few objects | Most accurate, more processing |

## Performance Considerations

- **Pre-compute**: Metadata generation is a one-time process during development
- **Choose wisely**: Select algorithm/accuracy based on device capabilities
- **Load once**: Load metadata at game initialization, not per-frame
- **Broad-phase first**: Use AABB for initial collision checks, then polygon collision

## Files

- **`boundingShapeNode.js`** - Node.js compatible bounding shape algorithms
- **`generateBoundingShapeMeta.js`** - Main utility for single sprite sheet
- **`processAllSpriteSheets.js`** - Batch processor for all sprite sheets
- **`README.md`** - This file

## Troubleshooting

### "canvas module not found"

Install the canvas dependency:
```bash
npm install
```

### "Image file not found"

Ensure you're running the command from the project root directory and the image path is correct.

### Invalid numeric parameters

Make sure sprite dimensions and counts are valid integers.

## License

Same as the main project (ISC).

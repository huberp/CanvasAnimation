# Convex decomposition utility

This document describes the new convex decomposition utility added in this PR, which complements the existing bounding shape utility.

## Overview

The convex decomposition utility generates metadata containing convex polygons per sprite using the **Bayazit algorithm (FACD - Fast Approximate Convex Decomposition)** implemented in PR #36. This approach works well for accurate collision detection with complex, concave shapes while maintaining compatibility with SAT (Separating Axis Theorem).

## Motivation

While the existing bounding shape utility (using Marching Squares) generates accurate outlines, it can produce concave polygons that require more complex collision detection algorithms. The convex decomposition utility solves this by:

1. **Decomposing concave shapes** into convex polygons
2. **Maintaining SAT compatibility** - all resulting polygons convex
3. **Providing better collision accuracy** than a single convex hull
4. **Offering configurable accuracy levels** to balance performance vs precision

## Algorithm: Bayazit (FACD)

The utility uses the Bayazit algorithm for Fast Approximate Convex Decomposition:

### Three-phase process

1. **Phase 1: Contour Extraction & Simplification**
   - Uses Marching Squares to trace sprite outline
   - Applies Douglas-Peucker simplification to reduce points

2. **Phase 2: Convex Decomposition**
   - Applies Bayazit algorithm to split concave polygon into convex parts
   - Recursively finds reflex vertices and optimal split points
   - Produces fewer polygons than triangulation methods

3. **Phase 3: Optimization**
   - Further simplifies each convex polygon using Douglas-Peucker
   - Ensures all resulting polygons remain convex
   - Reduces total point count for faster collision detection

## Usage

### Generate convex decomposition for a single sprite sheet

```bash
node utils/generateConvexDecompositionMeta.js <image-path> <sprite-width> <sprite-height> <grid-width> <num-sprites>
```

**Example:**
```bash
node utils/generateConvexDecompositionMeta.js img/asteroid4_32x32.png 32 32 5 19
```

Or using npm:
```bash
npm run generate-convex-meta img/asteroid4_32x32.png 32 32 5 19
```

### Generate for all sprite sheets

```bash
npm run generate-all-convex-meta
```

This processes all sprite sheets defined in `utils/processAllSpriteSheetsConvex.js`.

## Output structure

### Generated files

For each sprite sheet, the utility generates:

1. **Metadata JSON File**: `img/meta/<sprite-name>-convex-decomposition-meta.json`
2. **Visualization Screenshots**: `img/visualizations/<sprite-name>-convexDecomposition-{low|mid|high}.png`

### Metadata format

```json
{
  "sourceImage": "asteroid4_32x32.png",
  "spriteWidth": 32,
  "spriteHeight": 32,
  "gridWidth": 5,
  "numSprites": 19,
  "timestamp": "2025-10-19T19:06:11.649Z",
  "algorithm": "convexDecomposition",
  "description": "Bayazit algorithm (FACD) - Fast Approximate Convex Decomposition",
  "accuracyLevels": {
    "low": [
      {
        "index": 0,
        "position": { "x": 0, "y": 0 },
        "convexPolygons": [
          [
            { "x": 6, "y": 12 },
            { "x": 25, "y": 12 },
            { "x": 28, "y": 17 },
            { "x": 6, "y": 20 },
            { "x": 2, "y": 17 },
            { "x": 5, "y": 13 }
          ]
        ],
        "polygonCount": 1,
        "totalPoints": 6
      },
      ...
    ],
    "mid": [...],
    "high": [...]
  }
}
```

### Accuracy levels

| Level | Tolerance | Use Case | Characteristics |
|-------|-----------|----------|-----------------|
| **low** | 4.0 | Mobile devices, many objects | Fewer polygons and points, faster |
| **mid** | 2.0 | General purpose | Balanced accuracy and performance |
| **high** | 1.0 | Desktop, few objects | More polygons and points, most accurate |

**Note:** These tolerance values match the marching squares algorithm to ensure convex decomposition starts from the same simplified contour as the single polygon approach.

## Comparison with single polygon approach

| Aspect | Single Polygon (Marching Squares) | Convex Decomposition (Bayazit) |
|--------|-----------------------------------|--------------------------------|
| **Polygons per sprite** | 1 | 1-25 (depending on shape complexity) |
| **Polygon type** | May be concave | Always convex |
| **SAT compatibility** | Requires special handling | ✅ Fully compatible |
| **Collision accuracy** | Good | Excellent |
| **Performance** | Faster (fewer polygons) | Good (optimized convex polygons) |
| **Best for** | Simple shapes, fast collision | Complex shapes, accurate collision |

### Example: Asteroid4 sprite #1 (mid accuracy)

- **Single Polygon**: 4 points, concave
- **Convex Decomposition**: 2 polygons, 8 total points, all convex

## Visual results

All sprite sheets now have visualization screenshots in `img/visualizations/`:

### Generated Visualizations

For each sprite sheet and accuracy level:
- Shows each sprite with its convex polygon decomposition
- Different polygons are color-coded
- Red dots mark vertices
- Labels show sprite index, polygon count, and total points

### Example statistics (Asteroid4, mid accuracy)

- Average polygons per sprite: 1.32
- Average points per sprite: 9.26
- All polygons are convex and SAT-compatible

## Integration in your game

### Loading metadata

```javascript
import convexMeta from './img/meta/asteroid4_32x32-convex-decomposition-meta.json';

const accuracy = 'mid'; // or 'low', 'high'
const sprites = convexMeta.accuracyLevels[accuracy];

// Get decomposition for sprite 0
const sprite = sprites[0];
console.log(`Sprite has ${sprite.polygonCount} convex polygons`);
console.log(`Total points: ${sprite.totalPoints}`);
```

### Collision detection with SAT

```javascript
class AsteroidCollision {
    constructor(metadata, accuracy = 'mid') {
        this.sprites = metadata.accuracyLevels[accuracy];
    }
    
    checkCollision(spriteIndex, otherPolygon, position) {
        const sprite = this.sprites[spriteIndex];
        
        // Check collision with each convex polygon
        for (const polygon of sprite.convexPolygons) {
            // Transform polygon to world coordinates
            const worldPolygon = polygon.map(p => ({
                x: p.x + position.x,
                y: p.y + position.y
            }));
            
            // Use SAT for collision detection
            if (checkSATCollision(worldPolygon, otherPolygon)) {
                return true;
            }
        }
        
        return false;
    }
}
```

### Adaptive quality

```javascript
// Choose accuracy based on device capabilities
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
const accuracy = isMobile ? 'low' : 'mid';

const collisionSystem = new AsteroidCollision(convexMeta, accuracy);
```

## Demos

### Convex decomposition comparison demo

Open `convex-decomposition-comparison.html` to see:
- Side-by-side comparison of single polygon vs convex decomposition
- Interactive sprite selection
- Accuracy level controls
- Live statistics showing polygon count, point count, and convexity

### Existing demos

- `bounding-shape-demo.html` - Single polygon approach
- `convex-decomposition-demo.html` - Three-phase algorithm visualization
- `test-bounding-shape.html` - Algorithm tests

## Files added or modified

### New files

- `utils/generateConvexDecompositionMeta.js` - Main utility for convex decomposition
- `utils/processAllSpriteSheetsConvex.js` - Batch processor
- `convex-decomposition-comparison.html` - Comparison demo
- `img/meta/*-convex-decomposition-meta.json` - Metadata for all sprite sheets (8 files)
- `img/visualizations/*-convexDecomposition-*.png` - Visualizations (24 files)
- `CONVEX_DECOMPOSITION_README.md` - This file

### Modified files

- `utils/boundingShapeNode.js` - Added convex decomposition functions
- `utils/generateBoundingShapeMeta.js` - Updated to save screenshots to visualizations folder
- `utils/README.md` - Added convex decomposition documentation
- `package.json` - Added npm scripts for convex decomposition
- `README.md` - Updated main documentation

### Reorganized

- Moved all visualization screenshots from `img/meta/` to `img/visualizations/`

## Performance considerations

### Preprocessing
- All decomposition is done **once during development**
- Metadata is loaded at game initialization
- No runtime computation needed

### Runtime
- Convex polygons enable use of efficient SAT algorithm
- More polygons per sprite but simpler collision math
- Suitable for games with 10-100+ objects on screen

### Optimization tips

1. **Choose appropriate accuracy level** based on target platform
2. **Use spatial partitioning** (grid, quadtree) for broad-phase
3. **Cache polygon transformations** when objects don't rotate
4. **Consider polygon count** - sprites with 10+ polygons might benefit from simplified collision

## Future enhancements

Potential improvements for future PRs:

1. **Interactive accuracy tuning** - Web tool to adjust tolerance and preview results
2. **Polygon count limits** - Option to set maximum polygons per sprite
3. **Multi-shape support** - Handle sprites with multiple disconnected shapes
4. **Collision detection library** - Complete SAT implementation using the metadata
5. **Performance benchmarks** - Compare single polygon vs convex decomposition

## Credits

- Bayazit algorithm implementation from PR #36
- Based on Mark Bayazit's Fast Approximate Convex Decomposition algorithm
- Douglas-Peucker simplification for optimization
- Marching Squares for contour extraction

## References

- [Bayazit Algorithm Paper](http://mnbayazit.com/406/bayazit)
- [SAT Collision Detection](https://en.wikipedia.org/wiki/Hyperplane_separation_theorem)
- [Douglas-Peucker Algorithm](https://en.wikipedia.org/wiki/Ramer%E2%80%93Douglas%E2%80%93Peucker_algorithm)

## License

Same as the main project (ISC).

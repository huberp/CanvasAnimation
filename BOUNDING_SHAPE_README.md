# Bounding shape utility

This utility provides functions to compute 2D bounding shapes for sprite collision detection in the CanvasAnimation project.

## Overview

The bounding shape utility uses advanced algorithms to generate tight-fitting polygonal boundaries around sprite images, enabling accurate collision detection for irregular shapes like asteroids.

## Algorithm comparison

The utility now provides two different approaches for computing bounding shapes:

### 1. Marching squares with Douglas-Peucker (default)

**Best for:**
Irregular, concave shapes where accuracy matters

**How it works:**
1. Traces the contour of visible pixels using Marching Squares
2. Simplifies the polygon using Douglas-Peucker algorithm

**Pros:**
- Accurate for irregular shapes
- Follows actual sprite boundaries closely
- Configurable simplification via tolerance parameter

**Cons:**
- Can produce concave polygons (requires more complex collision detection)
- More points than convex hull (though still efficient with simplification)

**Typical Results (asteroid4):**
- Average: ~6.3 points per polygon
- Range: 5-8 points

### 2. Convex hull (Graham scan)

**Best for:**
Simpler collision detection, faster algorithms (SAT)

**How it works:**
1. Extracts all solid pixels from the sprite
2. Computes the smallest convex polygon containing all pixels

**Pros:**
- Always produces convex polygons (simpler collision detection)
- Often fewer points than marching squares
- Works well with SAT (Separating Axis Theorem)

**Cons:**
- Poor fit for concave shapes (asteroids)
- Can include significant empty space
- Not adjustable (always produces tightest convex hull)

**Typical Results (asteroid4):**
- Average: ~8-12 points per polygon
- Range: 6-15 points
- Includes more empty space for concave asteroids

### Comparison demo

Open `bounding-shape-comparison.html` to see a side-by-side comparison:
- Blue polygons: Marching Squares + Douglas-Peucker
- Orange polygons: Convex Hull
- Statistics showing point counts and differences
- Toggle between individual sprites or view all at once

## Files

- **`js/boundingShape.js`** - Core utility module with all bounding shape functions
- **`bounding-shape-demo.html`** - Interactive demonstration showing bounding shapes for asteroid4 sprites
- **`research/research_result.md`** - Detailed research on collision detection algorithms

## API Reference

### Marching Squares + Douglas-Peucker Approach

#### `computeBoundingShape(spriteSheet, sx, sy, width, height, options)`

Computes a bounding polygon for a single sprite using Marching Squares + Douglas-Peucker.

**Parameters:**
- `spriteSheet` (Image) - The sprite sheet image
- `sx` (number) - Source x coordinate in pixels
- `sy` (number) - Source y coordinate in pixels
- `width` (number) - Width of sprite in pixels
- `height` (number) - Height of sprite in pixels
- `options` (Object) - Optional configuration
  - `threshold` (number) - Alpha threshold (0-255), default: 128
  - `tolerance` (number) - Simplification tolerance, default: 2.0

**Returns:** Array of `{x, y}` points forming the bounding polygon

**Example:**
```javascript
import * as BoundingShape from './js/boundingShape.js';

const img = new Image();
img.onload = () => {
    const polygon = BoundingShape.computeBoundingShape(
        img, 0, 0, 32, 32,
        { threshold: 128, tolerance: 2.0 }
    );
    console.log(`Polygon has ${polygon.length} points`);
};
img.src = 'img/asteroid4_32x32.png';
```

### Convex Hull Approach

#### `computeConvexHullShape(spriteSheet, sx, sy, width, height, options)`

Computes a convex hull bounding polygon for a single sprite.

**Parameters:**
- `spriteSheet` (Image) - The sprite sheet image
- `sx` (number) - Source x coordinate in pixels
- `sy` (number) - Source y coordinate in pixels
- `width` (number) - Width of sprite in pixels
- `height` (number) - Height of sprite in pixels
- `options` (Object) - Optional configuration
  - `threshold` (number) - Alpha threshold (0-255), default: 128

**Returns:** Array of `{x, y}` points forming the convex hull polygon

**Example:**
```javascript
import * as BoundingShape from './js/boundingShape.js';

const img = new Image();
img.onload = () => {
    const polygon = BoundingShape.computeConvexHullShape(
        img, 0, 0, 32, 32,
        { threshold: 128 }
    );
    console.log(`Convex hull has ${polygon.length} points`);
};
img.src = 'img/asteroid4_32x32.png';
```

### Simplified Convex Hull Approach (NEW)

#### `computeSimplifiedConvexHullShape(spriteSheet, sx, sy, width, height, options)`

Computes a convex hull and then simplifies it to reduce collinear points.

**Parameters:**
- `spriteSheet` (Image) - The sprite sheet image
- `sx` (number) - Source x coordinate in pixels
- `sy` (number) - Source y coordinate in pixels
- `width` (number) - Width of sprite in pixels
- `height` (number) - Height of sprite in pixels
- `options` (Object) - Optional configuration
  - `threshold` (number) - Alpha threshold (0-255), default: 128
  - `tolerance` (number) - Simplification tolerance, default: 1.0

**Returns:** Array of `{x, y}` points forming the simplified convex hull polygon

**Example:**
```javascript
import * as BoundingShape from './js/boundingShape.js';

const img = new Image();
img.onload = () => {
    const polygon = BoundingShape.computeSimplifiedConvexHullShape(
        img, 0, 0, 32, 32,
        { threshold: 128, tolerance: 1.0 }
    );
    console.log(`Simplified convex hull has ${polygon.length} points`);
};
img.src = 'img/asteroid4_32x32.png';
```

#### `convexHull(points)`

Low-level function to compute convex hull using Graham Scan algorithm.

**Parameters:**
- `points` (Array) - Array of `{x, y}` points

**Returns:** Array of `{x, y}` points forming the convex hull in counter-clockwise order

#### `extractSolidPixels(imageData, threshold)`

Extracts all solid pixels from image data.

**Parameters:**
- `imageData` (ImageData) - Image data from canvas context
- `threshold` (number) - Alpha threshold (0-255)

**Returns:** Array of `{x, y}` coordinates of solid pixels

### `computeAllBoundingShapes(spriteDescriptor, options)`

Computes bounding polygons for all sprites in a sprite sheet.

**Parameters:**
- `spriteDescriptor` (Object) - Sprite descriptor with properties:
  - `img` (Image) - The sprite sheet image
  - `sx` (number) - Sprite width
  - `sy` (number) - Sprite height
  - `gridWidth` (number) - Number of sprites per row
  - `noSprites` (number) - Total number of sprites
- `options` (Object) - Same as `computeBoundingShape`

**Returns:** Array of polygons (one per sprite)

**Example:**
```javascript
const asteroid4 = new ANIM.SpriteDescriptor(new Image(), 32, 32, 5, 19);
asteroid4.img.src = "img/asteroid4_32x32.png";

asteroid4.img.onload = () => {
    const allShapes = BoundingShape.computeAllBoundingShapes(asteroid4);
    console.log(`Computed ${allShapes.length} bounding shapes`);
};
```

### `marchingSquares(imageData, threshold)`

Low-level function to extract contour points from image data.

**Parameters:**
- `imageData` (ImageData) - Image data from canvas context
- `threshold` (number) - Alpha threshold (0-255)

**Returns:** Array of `{x, y}` contour points

### `douglasPeucker(points, tolerance)`

Low-level function to simplify a polygon.

**Parameters:**
- `points` (Array) - Array of `{x, y}` points
- `tolerance` (number) - Simplification tolerance

**Returns:** Simplified array of `{x, y}` points

### `computeAABB(polygon)`

Computes an Axis-Aligned Bounding Box for a polygon.

**Parameters:**
- `polygon` (Array) - Array of `{x, y}` points

**Returns:** Object with `{xmin, ymin, xmax, ymax}` properties

## Demo Usage

1. Open `bounding-shape-demo.html` in a web browser (requires a local web server)
2. Use the controls to adjust:
   - **Tolerance**: Controls polygon simplification (higher = fewer points)
   - **Threshold**: Alpha threshold for detecting solid pixels
   - **Show Sprite**: Toggle sprite visibility
   - **Show Polygon**: Toggle bounding polygon display
   - **Show AABB**: Toggle AABB display for comparison
3. Click "Recompute Shapes" to regenerate polygons with new settings

## Performance Considerations

- **Pre-compute at load time**: Bounding shapes should be computed once when sprites are loaded, not every frame
- **Store with sprite data**: Save computed polygons with your sprite descriptors
- **Use broad-phase detection**: Use AABB for initial collision checks, then use polygon collision for precise detection
- **Adjust tolerance**: Higher tolerance = fewer points = faster collision detection, but less accurate

## Integration Example

```javascript
import * as ANIM from './animation.js';
import * as BoundingShape from './boundingShape.js';

// Extend SpriteDescriptor to include bounding shapes
class SpriteWithCollision extends ANIM.SpriteDescriptor {
    constructor(img, sx, sy, gridWidth, noSprites) {
        super(img, sx, sy, gridWidth, noSprites);
        this.boundingShapes = null;
    }
    
    computeBoundingShapes(options) {
        this.boundingShapes = BoundingShape.computeAllBoundingShapes(this, options);
        return this;
    }
    
    getBoundingShape(spriteIndex) {
        return this.boundingShapes ? this.boundingShapes[spriteIndex] : null;
    }
}

// Usage
const asteroid = new SpriteWithCollision(new Image(), 32, 32, 5, 19);
asteroid.img.onload = () => {
    asteroid.computeBoundingShapes({ tolerance: 2.0, threshold: 128 });
    console.log('Bounding shapes ready for collision detection');
};
asteroid.img.src = 'img/asteroid4_32x32.png';
```

## Algorithm Performance

For the asteroid4 sprite sheet (19 sprites, 32×32 pixels each):
- **Total Sprites**: 19
- **Average Points**: ~6.3 per polygon
- **Min Points**: 5
- **Max Points**: 8
- **Computation Time**: < 100 ms for all sprites (one-time cost)

### Three-Phase Convex Decomposition (NEW - Recommended for SAT)

#### `computeOptimizedConvexDecomposition(spriteSheet, sx, sy, width, height, options)`

Complete three-phase algorithm that produces SAT-compatible convex polygons from sprite boundaries.

**Best for:** Accurate collision detection with SAT on irregular sprites

**How it works:**
1. **Phase 1**: Extract contour using Marching Squares and simplify with Douglas-Peucker - provides accurate boundary with fewer points
2. **Phase 2**: Decompose concave polygon into minimal convex polygons using **Bayazit algorithm (FACD)** - makes it SAT-compatible
3. **Phase 3**: Further optimize each convex polygon by reducing points - improves performance

**Parameters:**
- `spriteSheet` (Image) - The sprite sheet image
- `sx` (number) - Source x coordinate in pixels
- `sy` (number) - Source y coordinate in pixels
- `width` (number) - Width of sprite in pixels
- `height` (number) - Height of sprite in pixels
- `options` (Object) - Optional configuration
  - `threshold` (number) - Alpha threshold (0-255), default: 128
  - `tolerance` (number) - Simplification tolerance, default: 1.0

**Returns:** Array of convex polygon arrays (each polygon is an array of `{x, y}` points)

**Pros:**
- Produces SAT-compatible convex polygons
- More accurate than pure convex hull for concave shapes
- Configurable point reduction via tolerance
- Each polygon is guaranteed convex

**Cons:**
- Multiple polygons per sprite (requires checking each for collision)
- More computationally intensive than simple convex hull

**Typical Results (fighter sprite, 95x151):**
- Phase 1: 22 points (simplified concave polygon with high accuracy)
- Phase 2: 6 convex polygons (using Bayazit algorithm)
- Phase 3: 31 total points (further optimized)

**Example:**
```javascript
import * as BoundingShape from './js/boundingShape.js';

const img = new Image();
img.onload = () => {
    const convexPolygons = BoundingShape.computeOptimizedConvexDecomposition(
        img, 0, 0, 92, 82,
        { threshold: 128, tolerance: 2.0 }
    );
    console.log(`Decomposed into ${convexPolygons.length} convex polygons`);
    
    // Use with SAT for collision detection
    for (const polygon of convexPolygons) {
        // Apply SAT collision test with this convex polygon
    }
};
img.src = 'img/smallfighter0006.png';
```

#### Individual Phase Functions

##### `phase1_marchingSquares(imageData, threshold)`

Extract contour using Marching Squares algorithm.

**Parameters:**
- `imageData` (ImageData) - Image data from canvas context
- `threshold` (number) - Alpha threshold (0-255)

**Returns:** Array of `{x, y}` contour points (may be concave)

##### `phase2_decomposeIntoConvexPolygons(polygon)`

Decompose a concave polygon into minimal convex polygons.

**Parameters:**
- `polygon` (Array) - Array of `{x, y}` points

**Returns:** Array of convex polygon arrays

##### `phase3_optimizeConvexPolygons(convexPolygons, tolerance)`

Optimize convex polygons by reducing points using Douglas-Peucker.

**Parameters:**
- `convexPolygons` (Array) - Array of convex polygon arrays
- `tolerance` (number) - Simplification tolerance

**Returns:** Array of optimized convex polygon arrays

#### `computeAllOptimizedConvexDecompositions(spriteDescriptor, options)`

Compute optimized convex decompositions for all sprites in a sprite sheet.

**Parameters:**
- `spriteDescriptor` (Object) - Sprite descriptor with properties:
  - `img` (Image) - The sprite sheet image
  - `sx` (number) - Sprite width
  - `sy` (number) - Sprite height
  - `gridWidth` (number) - Number of sprites per row
  - `noSprites` (number) - Total number of sprites
- `options` (Object) - Same as `computeOptimizedConvexDecomposition`

**Returns:** Array of convex polygon arrays per sprite

**Example:**
```javascript
const fighter = new ANIM.SpriteDescriptor(new Image(), 92, 82, 5, 5);
fighter.img.src = "img/smallfighter0006.png";

fighter.img.onload = () => {
    const allDecompositions = BoundingShape.computeAllOptimizedConvexDecompositions(
        fighter,
        { threshold: 128, tolerance: 2.0 }
    );
    console.log(`Computed decompositions for ${allDecompositions.length} sprites`);
};
```

### Demo: Three-Phase Convex Decomposition

Open `convex-decomposition-demo.html` to see the complete three-phase algorithm in action:
- **Original Sprite**: Fighter spacecraft sprite
- **Phase 1**: Marching squares contour (single concave polygon)
- **Phase 2**: Convex decomposition using Bayazit algorithm (FACD) - multiple convex polygons
- **Phase 3**: Optimized result (fewer points per polygon)
- **Interactive controls**: Adjust threshold and tolerance parameters
- **Statistics**: Point counts and reduction percentage

### Phase 2 Algorithm: Bayazit (FACD)

The Phase 2 convex decomposition now uses the **Bayazit algorithm**, also known as Fast Approximate Convex Decomposition (FACD). This is a significant improvement over the previous ear-clipping triangulation approach.

**Key improvements:**
- **Fewer polygons**: Produces ~40% fewer convex polygons (17 vs 28 for fighter sprite)
- **Better efficiency**: Overall point reduction improved from 59.2% to 71.3%
- **Optimal decomposition**: Finds natural split points at reflex vertices for minimal decomposition
- **Well-established**: Based on the proven poly-decomp.js library implementation

**How Bayazit works:**
1. Identifies reflex (concave) vertices in the polygon
2. For each reflex vertex, finds the optimal split point
3. Recursively divides the polygon at these points
4. Produces minimal set of convex polygons

**Performance comparison** (fighter sprite 95x151):
| Metric | Before (Raw Marching Squares) | After (With Simplification) |
|--------|-------------------------------|----------------------------|
| Phase 1 Points | 174 (raw contour) | 22 (with tolerance 1.0) |
| Phase 2 Polygons | 17 | 6 |
| Phase 3 Total Points | 50 | 31 |

**Key improvement**: Phase 1 now applies Douglas-Peucker simplification (matching metadata generation), reducing points from 174 to 22 with high accuracy settings.

## Future Enhancements

- Implement Separating Axis Theorem (SAT) for polygon-polygon collision detection
- ~~Improve convex decomposition to minimize polygon count further~~ ✅ **DONE** - Implemented Bayazit algorithm (FACD)
- Implement multiple circles approximation for round objects
- Add caching mechanism for pre-computed shapes
- Support for rotated bounding polygons

## References

See `research/research_result.md` for detailed algorithm research and links to resources.

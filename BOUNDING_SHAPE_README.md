# Bounding Shape Utility

This utility provides functions to compute 2D bounding shapes for sprite collision detection in the CanvasAnimation project.

## Overview

The bounding shape utility uses advanced algorithms to generate tight-fitting polygonal boundaries around sprite images, enabling accurate collision detection for irregular shapes like asteroids.

## Algorithms Used

### 1. Marching Squares
- Extracts contours from 2D images by analyzing pixel data
- Creates paths along edges of visible pixels
- Handles transparent areas automatically

### 2. Douglas-Peucker Simplification
- Simplifies the resulting polygon by reducing the number of points
- Preserves the overall shape while reducing computational complexity
- Configurable tolerance parameter for controlling simplification level

## Files

- **`js/boundingShape.js`** - Core utility module with all bounding shape functions
- **`bounding-shape-demo.html`** - Interactive demonstration showing bounding shapes for asteroid4 sprites
- **`research/research_result.md`** - Detailed research on collision detection algorithms

## API Reference

### `computeBoundingShape(spriteSheet, sx, sy, width, height, options)`

Computes a bounding polygon for a single sprite.

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
- **Computation Time**: < 100ms for all sprites (one-time cost)

## Future Enhancements

- Implement Separating Axis Theorem (SAT) for polygon-polygon collision detection
- Add support for convex hull computation
- Implement multiple circles approximation for round objects
- Add caching mechanism for pre-computed shapes
- Support for rotated bounding polygons

## References

See `research/research_result.md` for detailed algorithm research and links to resources.

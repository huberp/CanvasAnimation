# Convex Decomposition - Usage Examples

This document provides practical examples of using the convex decomposition utility and metadata.

## Quick Start

### 1. Generate Metadata for a Sprite Sheet

```bash
# Single sprite sheet
npm run generate-convex-meta img/asteroid4_32x32.png 32 32 5 19

# All sprite sheets
npm run generate-all-convex-meta
```

### 2. View Results

Open `convex-decomposition-comparison.html` in your browser to see:
- Side-by-side comparison with single polygon approach
- Different accuracy levels
- Live statistics

## Code Examples

### Example 1: Loading Convex Decomposition Metadata

```javascript
// Load metadata
const metadata = await fetch('./img/meta/asteroid4_32x32-convex-decomposition-meta.json')
    .then(r => r.json());

// Select accuracy level
const accuracy = 'mid'; // or 'low', 'high'
const sprites = metadata.accuracyLevels[accuracy];

// Get first sprite
const sprite = sprites[0];
console.log(`Sprite #${sprite.index}:`);
console.log(`  Position: (${sprite.position.x}, ${sprite.position.y})`);
console.log(`  Polygons: ${sprite.polygonCount}`);
console.log(`  Total points: ${sprite.totalPoints}`);

// Access convex polygons
sprite.convexPolygons.forEach((polygon, idx) => {
    console.log(`  Polygon ${idx}: ${polygon.length} points`);
});
```

**Output:**
```
Sprite #0:
  Position: (0, 0)
  Polygons: 1
  Total points: 6
  Polygon 0: 6 points
```

### Example 2: Simple Collision Detection Class

```javascript
class ConvexCollisionSystem {
    constructor(metadata, accuracy = 'mid') {
        this.sprites = metadata.accuracyLevels[accuracy];
    }
    
    /**
     * Get convex polygons for a sprite at a specific position
     */
    getWorldPolygons(spriteIndex, position, rotation = 0) {
        const sprite = this.sprites[spriteIndex];
        const polygons = [];
        
        for (const polygon of sprite.convexPolygons) {
            const worldPolygon = polygon.map(p => {
                // Transform to world coordinates
                let x = p.x;
                let y = p.y;
                
                // Apply rotation if needed
                if (rotation !== 0) {
                    const cos = Math.cos(rotation);
                    const sin = Math.sin(rotation);
                    const rx = x * cos - y * sin;
                    const ry = x * sin + y * cos;
                    x = rx;
                    y = ry;
                }
                
                // Apply translation
                return {
                    x: x + position.x,
                    y: y + position.y
                };
            });
            
            polygons.push(worldPolygon);
        }
        
        return polygons;
    }
    
    /**
     * Check if a point is inside any of the sprite's polygons
     */
    pointInSprite(spriteIndex, position, point) {
        const polygons = this.getWorldPolygons(spriteIndex, position);
        
        for (const polygon of polygons) {
            if (this.pointInPolygon(point, polygon)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Point-in-polygon test using ray casting
     */
    pointInPolygon(point, polygon) {
        let inside = false;
        
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > point.y) !== (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            
            if (intersect) inside = !inside;
        }
        
        return inside;
    }
}

// Usage
const collisionSystem = new ConvexCollisionSystem(metadata, 'mid');

// Check if mouse is over asteroid
const asteroidPos = { x: 100, y: 100 };
const mousePos = { x: 120, y: 110 };
const hit = collisionSystem.pointInSprite(0, asteroidPos, mousePos);
console.log(`Mouse hit: ${hit}`);
```

### Example 3: Using with SAT (Separating Axis Theorem)

```javascript
class SATCollisionSystem extends ConvexCollisionSystem {
    /**
     * Check collision between two sprites using SAT
     */
    checkCollision(sprite1Index, pos1, sprite2Index, pos2) {
        const polygons1 = this.getWorldPolygons(sprite1Index, pos1);
        const polygons2 = this.getWorldPolygons(sprite2Index, pos2);
        
        // Check each polygon pair
        for (const poly1 of polygons1) {
            for (const poly2 of polygons2) {
                if (this.satCollision(poly1, poly2)) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    /**
     * SAT collision detection for two convex polygons
     */
    satCollision(poly1, poly2) {
        // Get all axes from both polygons
        const axes = [
            ...this.getAxes(poly1),
            ...this.getAxes(poly2)
        ];
        
        // Test each axis
        for (const axis of axes) {
            const proj1 = this.project(poly1, axis);
            const proj2 = this.project(poly2, axis);
            
            // Check for separation
            if (proj1.max < proj2.min || proj2.max < proj1.min) {
                return false; // Separating axis found
            }
        }
        
        return true; // No separating axis found = collision
    }
    
    /**
     * Get perpendicular axes from polygon edges
     */
    getAxes(polygon) {
        const axes = [];
        
        for (let i = 0; i < polygon.length; i++) {
            const p1 = polygon[i];
            const p2 = polygon[(i + 1) % polygon.length];
            
            // Edge vector
            const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            
            // Perpendicular (normal)
            const normal = { x: -edge.y, y: edge.x };
            
            // Normalize
            const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
            axes.push({ x: normal.x / length, y: normal.y / length });
        }
        
        return axes;
    }
    
    /**
     * Project polygon onto axis
     */
    project(polygon, axis) {
        let min = polygon[0].x * axis.x + polygon[0].y * axis.y;
        let max = min;
        
        for (let i = 1; i < polygon.length; i++) {
            const proj = polygon[i].x * axis.x + polygon[i].y * axis.y;
            min = Math.min(min, proj);
            max = Math.max(max, proj);
        }
        
        return { min, max };
    }
}

// Usage
const satSystem = new SATCollisionSystem(metadata, 'mid');

const asteroid1Pos = { x: 100, y: 100 };
const asteroid2Pos = { x: 120, y: 110 };

if (satSystem.checkCollision(0, asteroid1Pos, 1, asteroid2Pos)) {
    console.log('Collision detected!');
}
```

### Example 4: Adaptive Quality Based on Device

```javascript
class AdaptiveCollisionSystem {
    constructor(metadata) {
        this.metadata = metadata;
        this.accuracy = this.detectBestAccuracy();
        this.sprites = metadata.accuracyLevels[this.accuracy];
        
        console.log(`Using ${this.accuracy} accuracy`);
    }
    
    detectBestAccuracy() {
        // Check if mobile
        const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
        if (isMobile) return 'low';
        
        // Check performance capabilities
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 'low';
        
        // High-end device
        if (navigator.hardwareConcurrency > 4) {
            return 'high';
        }
        
        // Default to mid
        return 'mid';
    }
    
    // Collision methods here...
}

// Usage
const adaptiveSystem = new AdaptiveCollisionSystem(metadata);
```

### Example 5: Drawing Convex Decomposition on Canvas

```javascript
function drawConvexDecomposition(ctx, metadata, spriteIndex, accuracy, position) {
    const sprite = metadata.accuracyLevels[accuracy][spriteIndex];
    const colors = ['#00ff00', '#00ccff', '#ff00ff', '#ffff00', '#ff9900'];
    
    ctx.save();
    ctx.translate(position.x, position.y);
    
    // Draw each convex polygon
    sprite.convexPolygons.forEach((polygon, idx) => {
        ctx.strokeStyle = colors[idx % colors.length];
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(polygon[0].x, polygon[0].y);
        
        for (let i = 1; i < polygon.length; i++) {
            ctx.lineTo(polygon[i].x, polygon[i].y);
        }
        
        ctx.closePath();
        ctx.stroke();
        
        // Draw vertices
        ctx.fillStyle = '#ff0000';
        polygon.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    });
    
    ctx.restore();
}

// Usage
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

drawConvexDecomposition(ctx, metadata, 0, 'mid', { x: 100, y: 100 });
```

### Example 6: Performance Monitoring

```javascript
class PerformanceMonitoredCollisionSystem extends SATCollisionSystem {
    constructor(metadata, accuracy = 'mid') {
        super(metadata, accuracy);
        this.stats = {
            checks: 0,
            collisions: 0,
            totalTime: 0,
            avgTime: 0
        };
    }
    
    checkCollision(sprite1Index, pos1, sprite2Index, pos2) {
        const start = performance.now();
        const result = super.checkCollision(sprite1Index, pos1, sprite2Index, pos2);
        const elapsed = performance.now() - start;
        
        this.stats.checks++;
        this.stats.totalTime += elapsed;
        this.stats.avgTime = this.stats.totalTime / this.stats.checks;
        
        if (result) {
            this.stats.collisions++;
        }
        
        return result;
    }
    
    getStats() {
        return {
            ...this.stats,
            collisionRate: (this.stats.collisions / this.stats.checks * 100).toFixed(2) + '%'
        };
    }
    
    resetStats() {
        this.stats = {
            checks: 0,
            collisions: 0,
            totalTime: 0,
            avgTime: 0
        };
    }
}

// Usage
const monitoredSystem = new PerformanceMonitoredCollisionSystem(metadata, 'mid');

// Run collision checks...
// ...

// Print stats
console.log('Collision Stats:', monitoredSystem.getStats());
// Output: { checks: 1000, collisions: 50, totalTime: 45.2, avgTime: 0.0452, collisionRate: '5.00%' }
```

## Comparison: Single Polygon vs Convex Decomposition

```javascript
async function compareApproaches() {
    // Load both types of metadata
    const singleMeta = await fetch('./img/meta/asteroid4_32x32-meta.json').then(r => r.json());
    const convexMeta = await fetch('./img/meta/asteroid4_32x32-convex-decomposition-meta.json').then(r => r.json());
    
    const accuracy = 'mid';
    
    // Single polygon approach
    const singleSprite = singleMeta.algorithms.marchingSquares[accuracy][0];
    console.log('Single Polygon:');
    console.log(`  Polygons: 1`);
    console.log(`  Points: ${singleSprite.pointCount}`);
    console.log(`  Type: ${isConvex(singleSprite.boundingShape) ? 'Convex' : 'Concave'}`);
    
    // Convex decomposition approach
    const convexSprite = convexMeta.accuracyLevels[accuracy][0];
    console.log('\nConvex Decomposition:');
    console.log(`  Polygons: ${convexSprite.polygonCount}`);
    console.log(`  Points: ${convexSprite.totalPoints}`);
    console.log(`  Type: All Convex`);
}

function isConvex(polygon) {
    if (polygon.length < 3) return true;
    
    const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    
    let sign = 0;
    for (let i = 0; i < polygon.length; i++) {
        const o = polygon[i];
        const a = polygon[(i + 1) % polygon.length];
        const b = polygon[(i + 2) % polygon.length];
        const c = cross(o, a, b);
        
        if (c !== 0) {
            if (sign === 0) {
                sign = c > 0 ? 1 : -1;
            } else if ((c > 0 ? 1 : -1) !== sign) {
                return false;
            }
        }
    }
    
    return true;
}

compareApproaches();
```

## Tips and Best Practices

1. **Choose the right accuracy level:**
   - Low: Mobile devices, many objects (10-100+)
   - Mid: Desktop, moderate object count (20-50)
   - High: Few objects, maximum accuracy needed

2. **Cache transformed polygons:**
   - If objects don't rotate, cache world-space polygons
   - Recalculate only when position changes

3. **Use broad-phase collision detection:**
   - First check with AABB (axis-aligned bounding box)
   - Only use polygon collision if AABB intersects

4. **Consider polygon count:**
   - Sprites with 5+ polygons may need simplified collision
   - Use lower accuracy for background objects

5. **Profile your game:**
   - Use PerformanceMonitoredCollisionSystem to measure impact
   - Adjust accuracy based on performance data

## See Also

- [CONVEX_DECOMPOSITION_README.md](CONVEX_DECOMPOSITION_README.md) - Full documentation
- [utils/README.md](utils/README.md) - Utility documentation
- `convex-decomposition-comparison.html` - Interactive demo

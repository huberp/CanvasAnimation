# Convex Decomposition Bug - Quick Summary

## The Problem

The convex decomposition algorithm produces **invalid output** for 18 out of 19 sprites in the asteroid1_72x72 sprite sheet. Each problematic sprite has:
- ✗ First polygon: Only 2 points (invalid line segment, not a polygon)
- ✓ Second polygon: 11-14 points (valid)

**Example** (Sprite 0):
```json
"convexPolygons": [
  [
    { "x": 32, "y": 7 },
    { "x": 41, "y": 6 }   // Only 2 points - INVALID!
  ],
  [
    { "x": 41, "y": 6 },
    { "x": 61, "y": 18 },
    // ... 11 points total - valid
  ]
]
```

## Root Cause

1. **Bayazit algorithm** creates a tiny 3-point triangle (area: 4 px²) at reflex vertices
2. **Douglas-Peucker optimization** (Phase 3) over-simplifies the triangle to 2 points
3. **No validation** - invalid polygons make it to output

## Recommended Fix: Hybrid Approach

**Changes**: Modify `phase3_optimizeConvexPolygons()` in `utils/boundingShapeNode.js`

```javascript
function phase3_optimizeConvexPolygons(polygons, tolerance = 1.0) {
    // Use reduced tolerance to preserve small features
    const reducedTolerance = Math.max(tolerance * 0.3, 0.5);
    
    return polygons
        .map(polygon => {
            const simplified = douglasPeucker(polygon, reducedTolerance);
            return isConvex(simplified) ? simplified : polygon;
        })
        .filter(polygon => polygon.length >= 3); // Safety: remove any degenerate
}
```

**Why this works**:
- ✓ Reduced tolerance preserves the 3-point triangle (valid polygon)
- ✓ Filter catches any edge cases that still become invalid
- ✓ Maintains full sprite coverage
- ✓ Simple, low-risk change (~5 lines)

## Results Comparison

| Approach | Polygons | Valid? | Coverage | Complexity |
|----------|----------|--------|----------|------------|
| **Current** | 2 | ✗ No (has 2-point) | Partial | - |
| **Option 1: Filter** | 1 | ✓ Yes | ✗ Lost | Low |
| **Option 2: Reduce Tol** | 2 | ✓ Yes | ✓ Full | Low |
| **Hybrid (Rec'd)** | 2 | ✓ Yes | ✓ Full | Low |

## Visual Comparison

See: `img/visualizations/decomposition-fix-comparison.png`
- Shows side-by-side comparison of all approaches
- Red dashed lines = invalid 2-point polygons
- Green filled polygons = valid convex polygons

## Testing

Run tests:
```bash
# Show the bug
node utils/test-decomposition.js

# Compare all fix options
node utils/test-fix-options.js

# Generate visual comparison
node utils/visualize-fix-comparison.js
```

## Full Analysis

See `DECOMPOSITION_FIX_OPTIONS.md` for:
- Detailed analysis of 5 different fix approaches
- Pros/cons of each
- Implementation details
- Questions for consideration

## Next Step

**User @huberp please comment** with:
- ✓ Approve Hybrid fix (recommended)
- OR specify alternative option (1-5)
- OR request custom approach

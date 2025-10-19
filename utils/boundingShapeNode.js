/**
 * Bounding Shape Utility for Node.js
 * 
 * This is a Node.js compatible version of the bounding shape algorithms
 * that can be used in command-line utilities.
 */

/**
 * Marching Squares implementation to trace contours
 */
function marchingSquares(imageData, threshold = 128) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    
    // Helper to get alpha value at position
    const getAlpha = (x, y) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return 0;
        const idx = (y * width + x) * 4 + 3; // Alpha channel
        return data[idx] || 0;
    };
    
    // Helper to check if pixel is solid
    const isSolid = (x, y) => getAlpha(x, y) >= threshold;
    
    // Find starting point (first solid pixel from top-left)
    let startX = -1, startY = -1;
    for (let y = 0; y < height && startX === -1; y++) {
        for (let x = 0; x < width; x++) {
            if (isSolid(x, y)) {
                startX = x;
                startY = y;
                break;
            }
        }
    }
    
    if (startX === -1) {
        // No solid pixels found
        return [];
    }
    
    // Moore-Neighbor tracing algorithm
    const contour = [];
    const directions = [
        {dx: 1, dy: 0},   // right
        {dx: 1, dy: 1},   // down-right
        {dx: 0, dy: 1},   // down
        {dx: -1, dy: 1},  // down-left
        {dx: -1, dy: 0},  // left
        {dx: -1, dy: -1}, // up-left
        {dx: 0, dy: -1},  // up
        {dx: 1, dy: -1}   // up-right
    ];
    
    let currentX = startX;
    let currentY = startY;
    let direction = 7; // Start looking up-right
    let iterations = 0;
    const maxIterations = width * height * 4; // Prevent infinite loops
    
    do {
        contour.push({x: currentX, y: currentY});
        
        // Try to find next boundary pixel
        let found = false;
        for (let i = 0; i < 8; i++) {
            const checkDir = (direction + i) % 8;
            const nx = currentX + directions[checkDir].dx;
            const ny = currentY + directions[checkDir].dy;
            
            if (isSolid(nx, ny)) {
                currentX = nx;
                currentY = ny;
                // Adjust direction for next search (turn left)
                direction = (checkDir + 6) % 8;
                found = true;
                break;
            }
        }
        
        if (!found) break;
        iterations++;
        
    } while ((currentX !== startX || currentY !== startY) && iterations < maxIterations);
    
    return contour;
}

/**
 * Douglas-Peucker algorithm for polygon simplification
 */
function douglasPeucker(points, tolerance = 2.0) {
    if (points.length <= 2) return points;
    
    const sqTolerance = tolerance * tolerance;
    
    // Helper: squared distance between two points
    const getSqDist = (p1, p2) => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        return dx * dx + dy * dy;
    };
    
    // Helper: squared distance from point to segment
    const getSqSegDist = (p, p1, p2) => {
        let x = p1.x;
        let y = p1.y;
        let dx = p2.x - x;
        let dy = p2.y - y;
        
        if (dx !== 0 || dy !== 0) {
            const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
            
            if (t > 1) {
                x = p2.x;
                y = p2.y;
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }
        
        dx = p.x - x;
        dy = p.y - y;
        
        return dx * dx + dy * dy;
    };
    
    // Recursive simplification
    const simplifyDPStep = (points, first, last, sqTolerance, simplified) => {
        let maxSqDist = sqTolerance;
        let index;
        
        for (let i = first + 1; i < last; i++) {
            const sqDist = getSqSegDist(points[i], points[first], points[last]);
            
            if (sqDist > maxSqDist) {
                index = i;
                maxSqDist = sqDist;
            }
        }
        
        if (maxSqDist > sqTolerance) {
            if (index - first > 1) {
                simplifyDPStep(points, first, index, sqTolerance, simplified);
            }
            simplified.push(points[index]);
            if (last - index > 1) {
                simplifyDPStep(points, index, last, sqTolerance, simplified);
            }
        }
    };
    
    const last = points.length - 1;
    const simplified = [points[0]];
    simplifyDPStep(points, 0, last, sqTolerance, simplified);
    simplified.push(points[last]);
    
    return simplified;
}

/**
 * Convex Hull using Graham Scan algorithm
 */
function convexHull(points) {
    if (points.length < 3) {
        return points.slice();
    }
    
    // Sort points by y-coordinate, then by x-coordinate
    const sorted = points.slice().sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y;
        return a.x - b.x;
    });
    
    // Cross product of vectors OA and OB where O is origin point
    const cross = (o, a, b) => {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    };
    
    // Build lower hull
    const lower = [];
    for (let i = 0; i < sorted.length; i++) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], sorted[i]) <= 0) {
            lower.pop();
        }
        lower.push(sorted[i]);
    }
    
    // Build upper hull
    const upper = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], sorted[i]) <= 0) {
            upper.pop();
        }
        upper.push(sorted[i]);
    }
    
    // Remove last point of each half because it's repeated
    lower.pop();
    upper.pop();
    
    // Concatenate lower and upper hull
    return lower.concat(upper);
}

/**
 * Extract all solid pixels from image data
 */
function extractSolidPixels(imageData, threshold = 128) {
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;
    const pixels = [];
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4 + 3; // Alpha channel
            if (data[idx] >= threshold) {
                pixels.push({x, y});
            }
        }
    }
    
    return pixels;
}

/**
 * Extract a single sprite from canvas context
 */
function extractSpriteData(ctx, sx, sy, width, height) {
    return ctx.getImageData(sx, sy, width, height);
}

/**
 * Compute bounding shape using Marching Squares + Douglas-Peucker
 */
function computeBoundingShape(ctx, sx, sy, width, height, options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 128;
    const tolerance = options.tolerance !== undefined ? options.tolerance : 2.0;
    
    // Extract sprite data
    const imageData = extractSpriteData(ctx, sx, sy, width, height);
    
    // Extract contour using marching squares
    const contour = marchingSquares(imageData, threshold);
    
    if (contour.length === 0) {
        return [];
    }
    
    // Simplify polygon using Douglas-Peucker
    const simplified = douglasPeucker(contour, tolerance);
    
    return simplified;
}

/**
 * Compute convex hull bounding shape
 */
function computeConvexHullShape(ctx, sx, sy, width, height, options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 128;
    
    // Extract sprite data
    const imageData = extractSpriteData(ctx, sx, sy, width, height);
    
    // Extract all solid pixels
    const pixels = extractSolidPixels(imageData, threshold);
    
    if (pixels.length === 0) {
        return [];
    }
    
    // Compute convex hull
    const hull = convexHull(pixels);
    
    return hull;
}

/**
 * Compute simplified convex hull bounding shape
 */
function computeSimplifiedConvexHullShape(ctx, sx, sy, width, height, options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 128;
    const tolerance = options.tolerance !== undefined ? options.tolerance : 1.0;
    
    // First compute the convex hull
    const hull = computeConvexHullShape(ctx, sx, sy, width, height, { threshold });
    
    if (hull.length === 0) {
        return [];
    }
    
    // Then simplify it using Douglas-Peucker to remove collinear points
    const simplified = douglasPeucker(hull, tolerance);
    
    return simplified;
}

/**
 * Check if a polygon is convex
 */
function isConvex(polygon) {
    if (polygon.length < 3) return true;
    
    const cross = (o, a, b) => {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    };
    
    let sign = 0;
    const n = polygon.length;
    
    for (let i = 0; i < n; i++) {
        const o = polygon[i];
        const a = polygon[(i + 1) % n];
        const b = polygon[(i + 2) % n];
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

/**
 * Helper functions for Bayazit algorithm
 */
function triangleArea(a, b, c) {
    return ((b.x - a.x) * (c.y - a.y)) - ((c.x - a.x) * (b.y - a.y));
}

function isLeft(a, b, c) {
    return triangleArea(a, b, c) > 0;
}

function isLeftOn(a, b, c) {
    return triangleArea(a, b, c) >= 0;
}

function isRight(a, b, c) {
    return triangleArea(a, b, c) < 0;
}

function isRightOn(a, b, c) {
    return triangleArea(a, b, c) <= 0;
}

function at(polygon, i) {
    const s = polygon.length;
    return polygon[i < 0 ? i % s + s : i % s];
}

function isReflex(polygon, i) {
    return isRight(at(polygon, i - 1), at(polygon, i), at(polygon, i + 1));
}

function sqdist(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
}

function segmentsIntersect(p1, p2, q1, q2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const da = q2.x - q1.x;
    const db = q2.y - q1.y;
    
    if ((da * dy - db * dx) === 0) {
        return false;
    }
    
    const s = (dx * (q1.y - p1.y) + dy * (p1.x - q1.x)) / (da * dy - db * dx);
    const t = (da * (p1.y - q1.y) + db * (q1.x - p1.x)) / (db * dx - da * dy);
    
    return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
}

function getIntersectionPoint(p1, p2, q1, q2) {
    const a1 = p2.y - p1.y;
    const b1 = p1.x - p2.x;
    const c1 = (a1 * p1.x) + (b1 * p1.y);
    const a2 = q2.y - q1.y;
    const b2 = q1.x - q2.x;
    const c2 = (a2 * q1.x) + (b2 * q1.y);
    const det = (a1 * b2) - (a2 * b1);
    
    if (Math.abs(det) < 0.0001) {
        return { x: 0, y: 0 };
    }
    
    return {
        x: ((b2 * c1) - (b1 * c2)) / det,
        y: ((a1 * c2) - (a2 * c1)) / det
    };
}

function canSee(polygon, a, b) {
    if (isLeftOn(at(polygon, a + 1), at(polygon, a), at(polygon, b)) && 
        isLeftOn(at(polygon, a), at(polygon, b), at(polygon, b - 1))) {
        return false;
    }
    
    for (let i = 0; i < polygon.length; ++i) {
        if ((i + 1) % polygon.length === a || i === a) continue;
        if ((i + 1) % polygon.length === b || i === b) continue;
        
        if (segmentsIntersect(at(polygon, a), at(polygon, b), 
                             at(polygon, i), at(polygon, i + 1))) {
            return false;
        }
    }
    
    return true;
}

/**
 * Bayazit algorithm for fast approximate convex decomposition (FACD)
 */
function bayazitDecomposition(polygon, result, maxlevel, level) {
    if (polygon.length < 3) {
        return;
    }
    
    if (level > maxlevel) {
        console.warn("bayazitDecomposition: max level reached");
        result.push(polygon);
        return;
    }
    
    if (isConvex(polygon)) {
        result.push(polygon);
        return;
    }
    
    let upperInt = { x: 0, y: 0 };
    let lowerInt = { x: 0, y: 0 };
    let upperDist = 0;
    let lowerDist = 0;
    let upperIndex = 0;
    let lowerIndex = 0;
    let closestIndex = 0;
    
    for (let i = 0; i < polygon.length; ++i) {
        if (isReflex(polygon, i)) {
            upperDist = lowerDist = Number.MAX_VALUE;
            
            for (let j = 0; j < polygon.length; ++j) {
                if (isLeft(at(polygon, i - 1), at(polygon, i), at(polygon, j)) && 
                    isRightOn(at(polygon, i - 1), at(polygon, i), at(polygon, j - 1))) {
                    
                    const p = getIntersectionPoint(
                        at(polygon, i - 1), at(polygon, i),
                        at(polygon, j), at(polygon, j - 1)
                    );
                    
                    if (isRight(at(polygon, i + 1), at(polygon, i), p)) {
                        const d = sqdist(polygon[i], p);
                        if (d < lowerDist) {
                            lowerDist = d;
                            lowerInt = p;
                            lowerIndex = j;
                        }
                    }
                }
                
                if (isLeft(at(polygon, i + 1), at(polygon, i), at(polygon, j + 1)) && 
                    isRightOn(at(polygon, i + 1), at(polygon, i), at(polygon, j))) {
                    
                    const p = getIntersectionPoint(
                        at(polygon, i + 1), at(polygon, i),
                        at(polygon, j), at(polygon, j + 1)
                    );
                    
                    if (isLeft(at(polygon, i - 1), at(polygon, i), p)) {
                        const d = sqdist(polygon[i], p);
                        if (d < upperDist) {
                            upperDist = d;
                            upperInt = p;
                            upperIndex = j;
                        }
                    }
                }
            }
            
            if (lowerIndex === (upperIndex + 1) % polygon.length) {
                const p = {
                    x: (lowerInt.x + upperInt.x) / 2,
                    y: (lowerInt.y + upperInt.y) / 2
                };
                
                const lowerPoly = [];
                const upperPoly = [];
                
                if (i < upperIndex) {
                    for (let k = i; k <= upperIndex; k++) {
                        lowerPoly.push(polygon[k]);
                    }
                    lowerPoly.push(p);
                    upperPoly.push(p);
                    if (lowerIndex !== 0) {
                        for (let k = lowerIndex; k < polygon.length; k++) {
                            upperPoly.push(polygon[k]);
                        }
                    }
                    for (let k = 0; k <= i; k++) {
                        upperPoly.push(polygon[k]);
                    }
                } else {
                    if (i !== 0) {
                        for (let k = i; k < polygon.length; k++) {
                            lowerPoly.push(polygon[k]);
                        }
                    }
                    for (let k = 0; k <= upperIndex; k++) {
                        lowerPoly.push(polygon[k]);
                    }
                    lowerPoly.push(p);
                    upperPoly.push(p);
                    for (let k = lowerIndex; k <= i; k++) {
                        upperPoly.push(polygon[k]);
                    }
                }
                
                bayazitDecomposition(lowerPoly, result, maxlevel, level + 1);
                bayazitDecomposition(upperPoly, result, maxlevel, level + 1);
                return;
            } else {
                let closestDist = Number.MAX_VALUE;
                
                if (lowerIndex > upperIndex) {
                    upperIndex += polygon.length;
                }
                
                for (let j = lowerIndex; j <= upperIndex; ++j) {
                    if (canSee(polygon, i, j % polygon.length)) {
                        const d = sqdist(at(polygon, i), at(polygon, j));
                        if (d < closestDist) {
                            closestDist = d;
                            closestIndex = j % polygon.length;
                        }
                    }
                }
                
                const lowerPoly = [];
                const upperPoly = [];
                
                if (i < closestIndex) {
                    for (let k = i; k <= closestIndex; k++) {
                        lowerPoly.push(polygon[k]);
                    }
                    for (let k = closestIndex; k < polygon.length; k++) {
                        upperPoly.push(polygon[k]);
                    }
                    for (let k = 0; k <= i; k++) {
                        upperPoly.push(polygon[k]);
                    }
                } else {
                    for (let k = i; k < polygon.length; k++) {
                        lowerPoly.push(polygon[k]);
                    }
                    for (let k = 0; k <= closestIndex; k++) {
                        lowerPoly.push(polygon[k]);
                    }
                    for (let k = closestIndex; k <= i; k++) {
                        upperPoly.push(polygon[k]);
                    }
                }
                
                bayazitDecomposition(lowerPoly, result, maxlevel, level + 1);
                bayazitDecomposition(upperPoly, result, maxlevel, level + 1);
                return;
            }
        }
    }
    
    result.push(polygon);
}

/**
 * Decompose a concave polygon into convex polygons using Bayazit algorithm
 */
function decomposeIntoConvexPolygons(polygon) {
    if (polygon.length < 3) {
        return [];
    }
    
    if (isConvex(polygon)) {
        return [polygon];
    }
    
    const result = [];
    bayazitDecomposition(polygon, result, 100, 0);
    
    return result.length > 0 ? result : [polygon];
}

/**
 * Phase 1: Extract and simplify contour using marching squares
 */
function phase1_marchingSquares(imageData, threshold = 128, tolerance = 1.0) {
    const contour = marchingSquares(imageData, threshold);
    
    if (contour.length === 0) {
        return [];
    }
    
    return douglasPeucker(contour, tolerance);
}

/**
 * Phase 2: Decompose into convex polygons
 */
function phase2_decomposeIntoConvexPolygons(polygon) {
    return decomposeIntoConvexPolygons(polygon);
}

/**
 * Phase 3: Optimize each convex polygon
 */
function phase3_optimizeConvexPolygons(polygons, tolerance = 1.0) {
    // Use reduced tolerance to preserve small features
    const reducedTolerance = Math.max(tolerance * 0.3, 0.5);
    
    return polygons
        .map(polygon => {
            const simplified = douglasPeucker(polygon, reducedTolerance);
            return isConvex(simplified) ? simplified : polygon;
        })
        .filter(polygon => polygon.length >= 3); // Remove degenerate polygons
}

/**
 * Compute optimized convex decomposition for a single sprite
 */
function computeOptimizedConvexDecomposition(ctx, sx, sy, width, height, options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 128;
    const tolerance = options.tolerance !== undefined ? options.tolerance : 1.0;
    
    const imageData = extractSpriteData(ctx, sx, sy, width, height);
    
    const contour = phase1_marchingSquares(imageData, threshold, tolerance);
    
    if (contour.length === 0) {
        return [];
    }
    
    const convexPolygons = phase2_decomposeIntoConvexPolygons(contour);
    const optimized = phase3_optimizeConvexPolygons(convexPolygons, tolerance);
    
    return optimized;
}

export {
    marchingSquares,
    douglasPeucker,
    convexHull,
    extractSolidPixels,
    extractSpriteData,
    computeBoundingShape,
    computeConvexHullShape,
    computeSimplifiedConvexHullShape,
    isConvex,
    decomposeIntoConvexPolygons,
    phase1_marchingSquares,
    phase2_decomposeIntoConvexPolygons,
    phase3_optimizeConvexPolygons,
    computeOptimizedConvexDecomposition
};

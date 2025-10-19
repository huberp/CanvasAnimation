/**
 * Bounding Shape Utility for Sprite Collision Detection
 * 
 * This module provides functions to compute 2D bounding shapes for sprite images.
 * It uses the Marching Squares algorithm to extract contours and the Douglas-Peucker
 * algorithm to simplify the resulting polygons.
 */

/**
 * Extracts a single sprite from a sprite sheet
 * @param {Image} spriteSheet - The sprite sheet image
 * @param {number} sx - Source x in pixels
 * @param {number} sy - Source y in pixels
 * @param {number} width - Width of sprite
 * @param {number} height - Height of sprite
 * @returns {ImageData} - The extracted sprite's image data
 */
export function extractSpriteData(spriteSheet, sx, sy, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(spriteSheet, sx, sy, width, height, 0, 0, width, height);
    return ctx.getImageData(0, 0, width, height);
}

/**
 * Marching Squares implementation to trace contours
 * @param {ImageData} imageData - Image data to process
 * @param {number} threshold - Alpha threshold (0-255) for considering a pixel as solid
 * @returns {Array<{x: number, y: number}>} - Array of contour points
 */
export function marchingSquares(imageData, threshold = 128) {
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
 * @param {Array<{x: number, y: number}>} points - Array of points
 * @param {number} tolerance - Simplification tolerance (higher = simpler)
 * @returns {Array<{x: number, y: number}>} - Simplified array of points
 */
export function douglasPeucker(points, tolerance = 2.0) {
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
 * Compute bounding shape for a sprite
 * @param {Image} spriteSheet - The sprite sheet image
 * @param {number} sx - Source x in pixels
 * @param {number} sy - Source y in pixels
 * @param {number} width - Width of sprite
 * @param {number} height - Height of sprite
 * @param {Object} options - Options for shape generation
 * @param {number} options.threshold - Alpha threshold (default: 128)
 * @param {number} options.tolerance - Simplification tolerance (default: 2.0)
 * @returns {Array<{x: number, y: number}>} - Bounding polygon points
 */
export function computeBoundingShape(spriteSheet, sx, sy, width, height, options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 128;
    const tolerance = options.tolerance !== undefined ? options.tolerance : 2.0;
    
    // Extract sprite data
    const imageData = extractSpriteData(spriteSheet, sx, sy, width, height);
    
    // Extract contour using marching squares
    const contour = marchingSquares(imageData, threshold);
    
    if (contour.length === 0) {
        // Return empty polygon if no contour found
        return [];
    }
    
    // Simplify polygon using Douglas-Peucker
    const simplified = douglasPeucker(contour, tolerance);
    
    return simplified;
}

/**
 * Compute bounding shapes for all sprites in a sprite descriptor
 * @param {Object} spriteDescriptor - Sprite descriptor with img, sx, sy, gridWidth, noSprites
 * @param {Object} options - Options for shape generation
 * @returns {Array<Array<{x: number, y: number}>>} - Array of bounding polygons, one per sprite
 */
export function computeAllBoundingShapes(spriteDescriptor, options = {}) {
    const { img, sx, sy, gridWidth, noSprites } = spriteDescriptor;
    const boundingShapes = [];
    
    for (let i = 0; i < noSprites; i++) {
        const col = i % gridWidth;
        const row = Math.floor(i / gridWidth);
        const sourceX = col * sx;
        const sourceY = row * sy;
        
        const shape = computeBoundingShape(img, sourceX, sourceY, sx, sy, options);
        boundingShapes.push(shape);
    }
    
    return boundingShapes;
}

/**
 * Convex Hull using Graham Scan algorithm
 * Computes the convex hull of a set of points
 * @param {Array<{x: number, y: number}>} points - Array of points
 * @returns {Array<{x: number, y: number}>} - Convex hull points in counter-clockwise order
 */
export function convexHull(points) {
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
 * @param {ImageData} imageData - Image data to process
 * @param {number} threshold - Alpha threshold (0-255) for considering a pixel as solid
 * @returns {Array<{x: number, y: number}>} - Array of solid pixel coordinates
 */
export function extractSolidPixels(imageData, threshold = 128) {
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
 * Compute convex hull bounding shape for a sprite
 * @param {Image} spriteSheet - The sprite sheet image
 * @param {number} sx - Source x in pixels
 * @param {number} sy - Source y in pixels
 * @param {number} width - Width of sprite
 * @param {number} height - Height of sprite
 * @param {Object} options - Options for shape generation
 * @param {number} options.threshold - Alpha threshold (default: 128)
 * @returns {Array<{x: number, y: number}>} - Convex hull polygon points
 */
export function computeConvexHullShape(spriteSheet, sx, sy, width, height, options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 128;
    
    // Extract sprite data
    const imageData = extractSpriteData(spriteSheet, sx, sy, width, height);
    
    // Extract all solid pixels
    const pixels = extractSolidPixels(imageData, threshold);
    
    if (pixels.length === 0) {
        // Return empty polygon if no solid pixels found
        return [];
    }
    
    // Compute convex hull
    const hull = convexHull(pixels);
    
    return hull;
}

/**
 * Compute convex hull shapes for all sprites in a sprite descriptor
 * @param {Object} spriteDescriptor - Sprite descriptor with img, sx, sy, gridWidth, noSprites
 * @param {Object} options - Options for shape generation
 * @returns {Array<Array<{x: number, y: number}>>} - Array of convex hull polygons, one per sprite
 */
export function computeAllConvexHullShapes(spriteDescriptor, options = {}) {
    const { img, sx, sy, gridWidth, noSprites } = spriteDescriptor;
    const boundingShapes = [];
    
    for (let i = 0; i < noSprites; i++) {
        const col = i % gridWidth;
        const row = Math.floor(i / gridWidth);
        const sourceX = col * sx;
        const sourceY = row * sy;
        
        const shape = computeConvexHullShape(img, sourceX, sourceY, sx, sy, options);
        boundingShapes.push(shape);
    }
    
    return boundingShapes;
}

/**
 * Compute simplified convex hull bounding shape for a sprite
 * This combines convex hull with Douglas-Peucker simplification to reduce collinear points
 * @param {Image} spriteSheet - The sprite sheet image
 * @param {number} sx - Source x in pixels
 * @param {number} sy - Source y in pixels
 * @param {number} width - Width of sprite
 * @param {number} height - Height of sprite
 * @param {Object} options - Options for shape generation
 * @param {number} options.threshold - Alpha threshold (default: 128)
 * @param {number} options.tolerance - Simplification tolerance (default: 1.0)
 * @returns {Array<{x: number, y: number}>} - Simplified convex hull polygon points
 */
export function computeSimplifiedConvexHullShape(spriteSheet, sx, sy, width, height, options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 128;
    const tolerance = options.tolerance !== undefined ? options.tolerance : 1.0;
    
    // First compute the convex hull
    const hull = computeConvexHullShape(spriteSheet, sx, sy, width, height, { threshold });
    
    if (hull.length === 0) {
        return [];
    }
    
    // Then simplify it using Douglas-Peucker to remove collinear points
    const simplified = douglasPeucker(hull, tolerance);
    
    return simplified;
}

/**
 * Compute simplified convex hull shapes for all sprites in a sprite descriptor
 * @param {Object} spriteDescriptor - Sprite descriptor with img, sx, sy, gridWidth, noSprites
 * @param {Object} options - Options for shape generation
 * @returns {Array<Array<{x: number, y: number}>>} - Array of simplified convex hull polygons, one per sprite
 */
export function computeAllSimplifiedConvexHullShapes(spriteDescriptor, options = {}) {
    const { img, sx, sy, gridWidth, noSprites } = spriteDescriptor;
    const boundingShapes = [];
    
    for (let i = 0; i < noSprites; i++) {
        const col = i % gridWidth;
        const row = Math.floor(i / gridWidth);
        const sourceX = col * sx;
        const sourceY = row * sy;
        
        const shape = computeSimplifiedConvexHullShape(img, sourceX, sourceY, sx, sy, options);
        boundingShapes.push(shape);
    }
    
    return boundingShapes;
}

/**
 * Check if a polygon is convex
 * @param {Array<{x: number, y: number}>} polygon - Polygon points
 * @returns {boolean} - True if polygon is convex
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
 * Compute the squared distance between two points
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Second point {x, y}
 * @returns {number} - Squared distance
 */
function distSquared(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return dx * dx + dy * dy;
}

/**
 * Helper: Get area of triangle (signed)
 * Positive if counter-clockwise, negative if clockwise
 */
function triangleArea(a, b, c) {
    return ((b.x - a.x) * (c.y - a.y)) - ((c.x - a.x) * (b.y - a.y));
}

/**
 * Helper: Check if point c is to the left of line ab
 */
function isLeft(a, b, c) {
    return triangleArea(a, b, c) > 0;
}

/**
 * Helper: Check if point c is to the left or on line ab
 */
function isLeftOn(a, b, c) {
    return triangleArea(a, b, c) >= 0;
}

/**
 * Helper: Check if point c is to the right of line ab
 */
function isRight(a, b, c) {
    return triangleArea(a, b, c) < 0;
}

/**
 * Helper: Check if point c is to the right or on line ab
 */
function isRightOn(a, b, c) {
    return triangleArea(a, b, c) <= 0;
}

/**
 * Helper: Get polygon vertex at index (wraps around)
 */
function at(polygon, i) {
    const s = polygon.length;
    return polygon[i < 0 ? i % s + s : i % s];
}

/**
 * Helper: Check if vertex at index is a reflex vertex (concave)
 */
function isReflex(polygon, i) {
    return isRight(at(polygon, i - 1), at(polygon, i), at(polygon, i + 1));
}

/**
 * Helper: Compute squared distance between two points
 */
function sqdist(a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
}

/**
 * Helper: Check if two line segments intersect
 */
function segmentsIntersect(p1, p2, q1, q2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const da = q2.x - q1.x;
    const db = q2.y - q1.y;
    
    // Segments are parallel
    if ((da * dy - db * dx) === 0) {
        return false;
    }
    
    const s = (dx * (q1.y - p1.y) + dy * (p1.x - q1.x)) / (da * dy - db * dx);
    const t = (da * (p1.y - q1.y) + db * (q1.x - p1.x)) / (db * dx - da * dy);
    
    return (s >= 0 && s <= 1 && t >= 0 && t <= 1);
}

/**
 * Helper: Get intersection point of two lines
 */
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

/**
 * Helper: Check if two vertices can see each other
 */
function canSee(polygon, a, b) {
    if (isLeftOn(at(polygon, a + 1), at(polygon, a), at(polygon, b)) && 
        isLeftOn(at(polygon, a), at(polygon, b), at(polygon, b - 1))) {
        return false;
    }
    
    // Check if line segment intersects any polygon edges
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
 * This is the core algorithm that decomposes a concave polygon into convex parts
 * @param {Array<{x: number, y: number}>} polygon - Input polygon
 * @param {Array} result - Output array to store convex polygons
 * @param {number} maxlevel - Maximum recursion depth
 * @param {number} level - Current recursion level
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
    
    // Find a reflex vertex
    for (let i = 0; i < polygon.length; ++i) {
        if (isReflex(polygon, i)) {
            upperDist = lowerDist = Number.MAX_VALUE;
            
            // Find the closest vertices that can split this reflex vertex
            for (let j = 0; j < polygon.length; ++j) {
                // Check if line from vertex i-1 through i intersects edge j-1 to j
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
                
                // Check if line from vertex i+1 through i intersects edge j to j+1
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
            
            // Split the polygon
            if (lowerIndex === (upperIndex + 1) % polygon.length) {
                // Use steiner point (midpoint)
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
                // Connect to closest point within the triangle
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
                
                // Split at closest index
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
    
    // No reflex vertices found, polygon is convex
    result.push(polygon);
}

/**
 * Phase 2: Decompose a concave polygon into convex polygons
 * Uses the Bayazit algorithm for fast approximate convex decomposition (FACD)
 * This is more efficient than ear-clipping + merging, producing fewer polygons
 * @param {Array<{x: number, y: number}>} polygon - Concave polygon points
 * @returns {Array<Array<{x: number, y: number}>>} - Array of convex polygons
 */
export function decomposeIntoConvexPolygons(polygon) {
    if (polygon.length < 3) {
        return [];
    }
    
    // If already convex, return as is
    if (isConvex(polygon)) {
        return [polygon];
    }
    
    // Use Bayazit algorithm (FACD) for efficient decomposition
    const result = [];
    bayazitDecomposition(polygon, result, 100, 0);
    
    return result.length > 0 ? result : [polygon];
}

/**
 * Simple ear clipping triangulation
 * @param {Array<{x: number, y: number}>} polygon - Polygon points
 * @returns {Array<Array<{x: number, y: number}>>} - Array of triangles
 */
function triangulate(polygon) {
    const triangles = [];
    const vertices = polygon.slice();
    const n = vertices.length;
    
    if (n < 3) return triangles;
    if (n === 3) return [vertices];
    
    const cross = (o, a, b) => {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    };
    
    const isInTriangle = (p, a, b, c) => {
        const c1 = cross(a, b, p);
        const c2 = cross(b, c, p);
        const c3 = cross(c, a, p);
        
        return (c1 >= 0 && c2 >= 0 && c3 >= 0) || (c1 <= 0 && c2 <= 0 && c3 <= 0);
    };
    
    const indices = [];
    for (let i = 0; i < n; i++) {
        indices.push(i);
    }
    
    while (indices.length > 3) {
        let earFound = false;
        
        for (let i = 0; i < indices.length; i++) {
            const prev = indices[(i - 1 + indices.length) % indices.length];
            const curr = indices[i];
            const next = indices[(i + 1) % indices.length];
            
            const a = vertices[prev];
            const b = vertices[curr];
            const c = vertices[next];
            
            // Check if this is a convex vertex
            if (cross(a, b, c) <= 0) continue;
            
            // Check if any other vertex is inside this triangle
            let hasVertexInside = false;
            for (let j = 0; j < indices.length; j++) {
                if (j === i || j === (i - 1 + indices.length) % indices.length || j === (i + 1) % indices.length) {
                    continue;
                }
                
                const p = vertices[indices[j]];
                if (isInTriangle(p, a, b, c)) {
                    hasVertexInside = true;
                    break;
                }
            }
            
            if (!hasVertexInside) {
                // Found an ear
                triangles.push([a, b, c]);
                indices.splice(i, 1);
                earFound = true;
                break;
            }
        }
        
        if (!earFound) {
            // Fallback: just create triangles from remaining vertices
            for (let i = 1; i < indices.length - 1; i++) {
                triangles.push([
                    vertices[indices[0]],
                    vertices[indices[i]],
                    vertices[indices[i + 1]]
                ]);
            }
            break;
        }
    }
    
    if (indices.length === 3) {
        triangles.push([
            vertices[indices[0]],
            vertices[indices[1]],
            vertices[indices[2]]
        ]);
    }
    
    return triangles;
}

/**
 * Merge triangles into larger convex polygons
 * @param {Array<Array<{x: number, y: number}>>} triangles - Array of triangles
 * @returns {Array<Array<{x: number, y: number}>>} - Array of convex polygons
 */
function mergeTrianglesIntoConvexPolygons(triangles) {
    if (triangles.length === 0) return [];
    if (triangles.length === 1) return triangles;
    
    const merged = triangles.map(t => t.slice());
    let changed = true;
    
    while (changed) {
        changed = false;
        
        for (let i = 0; i < merged.length && !changed; i++) {
            for (let j = i + 1; j < merged.length && !changed; j++) {
                const poly1 = merged[i];
                const poly2 = merged[j];
                
                // Try to merge these two polygons
                const mergedPoly = tryMergePolygons(poly1, poly2);
                
                if (mergedPoly && isConvex(mergedPoly)) {
                    merged[i] = mergedPoly;
                    merged.splice(j, 1);
                    changed = true;
                }
            }
        }
    }
    
    return merged;
}

/**
 * Try to merge two polygons if they share an edge
 * @param {Array<{x: number, y: number}>} poly1 - First polygon
 * @param {Array<{x: number, y: number}>} poly2 - Second polygon
 * @returns {Array<{x: number, y: number}>|null} - Merged polygon or null
 */
function tryMergePolygons(poly1, poly2) {
    // Find shared edge
    for (let i = 0; i < poly1.length; i++) {
        const a1 = poly1[i];
        const a2 = poly1[(i + 1) % poly1.length];
        
        for (let j = 0; j < poly2.length; j++) {
            const b1 = poly2[j];
            const b2 = poly2[(j + 1) % poly2.length];
            
            // Check if edge a1-a2 matches edge b2-b1 (reverse direction)
            if (pointsEqual(a1, b2) && pointsEqual(a2, b1)) {
                // Found shared edge, merge polygons
                const merged = [];
                
                // Add vertices from poly1, excluding the shared edge
                for (let k = (i + 1) % poly1.length; k !== i; k = (k + 1) % poly1.length) {
                    merged.push(poly1[k]);
                }
                
                // Add vertices from poly2, excluding the shared edge
                for (let k = (j + 1) % poly2.length; k !== j; k = (k + 1) % poly2.length) {
                    merged.push(poly2[k]);
                }
                
                return merged;
            }
        }
    }
    
    return null;
}

/**
 * Check if two points are equal (with tolerance)
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Second point {x, y}
 * @returns {boolean} - True if points are equal
 */
function pointsEqual(p1, p2) {
    const tolerance = 0.001;
    return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

/**
 * Phase 1: Extract contour using marching squares and simplify
 * Applies Douglas-Peucker simplification to reduce point count while maintaining accuracy
 * @param {ImageData} imageData - Image data to process
 * @param {number} threshold - Alpha threshold (0-255)
 * @param {number} tolerance - Simplification tolerance (default: 1.0 for high accuracy)
 * @returns {Array<{x: number, y: number}>} - Simplified contour points
 */
export function phase1_marchingSquares(imageData, threshold = 128, tolerance = 1.0) {
    const contour = marchingSquares(imageData, threshold);
    
    if (contour.length === 0) {
        return [];
    }
    
    // Apply Douglas-Peucker simplification to reduce points
    // This matches the approach used in metadata generation
    const simplified = douglasPeucker(contour, tolerance);
    
    return simplified;
}

/**
 * Phase 2: Decompose polygon into convex polygons
 * (Wrapper for decomposeIntoConvexPolygons)
 * @param {Array<{x: number, y: number}>} polygon - Polygon to decompose
 * @returns {Array<Array<{x: number, y: number}>>} - Array of convex polygons
 */
export function phase2_decomposeIntoConvexPolygons(polygon) {
    return decomposeIntoConvexPolygons(polygon);
}

/**
 * Phase 3: Optimize each convex polygon by reducing points
 * @param {Array<Array<{x: number, y: number}>>} convexPolygons - Array of convex polygons
 * @param {number} tolerance - Simplification tolerance
 * @returns {Array<Array<{x: number, y: number}>>} - Optimized convex polygons
 */
export function phase3_optimizeConvexPolygons(convexPolygons, tolerance = 2.0) {
    return convexPolygons.map(polygon => {
        // Only simplify if polygon has more than 3 vertices
        if (polygon.length <= 3) {
            return polygon;
        }
        
        // Apply Douglas-Peucker simplification
        const simplified = douglasPeucker(polygon, tolerance);
        
        // Ensure result is still convex
        if (isConvex(simplified)) {
            return simplified;
        } else {
            // If simplification made it non-convex, return original
            return polygon;
        }
    });
}

/**
 * Complete three-phase algorithm for optimized convex decomposition
 * @param {Image} spriteSheet - The sprite sheet image
 * @param {number} sx - Source x in pixels
 * @param {number} sy - Source y in pixels
 * @param {number} width - Width of sprite
 * @param {number} height - Height of sprite
 * @param {Object} options - Options for shape generation
 * @param {number} options.threshold - Alpha threshold (default: 128)
 * @param {number} options.tolerance - Simplification tolerance (default: 1.0)
 * @returns {Array<Array<{x: number, y: number}>>} - Array of optimized convex polygons
 */
export function computeOptimizedConvexDecomposition(spriteSheet, sx, sy, width, height, options = {}) {
    const threshold = options.threshold !== undefined ? options.threshold : 128;
    const tolerance = options.tolerance !== undefined ? options.tolerance : 1.0;
    
    // Extract sprite data
    const imageData = extractSpriteData(spriteSheet, sx, sy, width, height);
    
    // Phase 1: Extract contour using marching squares and simplify
    const contour = phase1_marchingSquares(imageData, threshold, tolerance);
    
    if (contour.length === 0) {
        return [];
    }
    
    // Phase 2: Decompose into convex polygons
    const convexPolygons = phase2_decomposeIntoConvexPolygons(contour);
    
    // Phase 3: Optimize each convex polygon
    const optimized = phase3_optimizeConvexPolygons(convexPolygons, tolerance);
    
    return optimized;
}

/**
 * Compute optimized convex decompositions for all sprites
 * @param {Object} spriteDescriptor - Sprite descriptor with img, sx, sy, gridWidth, noSprites
 * @param {Object} options - Options for shape generation
 * @returns {Array<Array<Array<{x: number, y: number}>>>} - Array of convex polygon arrays per sprite
 */
export function computeAllOptimizedConvexDecompositions(spriteDescriptor, options = {}) {
    const { img, sx, sy, gridWidth, noSprites } = spriteDescriptor;
    const results = [];
    
    for (let i = 0; i < noSprites; i++) {
        const col = i % gridWidth;
        const row = Math.floor(i / gridWidth);
        const sourceX = col * sx;
        const sourceY = row * sy;
        
        const decomposition = computeOptimizedConvexDecomposition(img, sourceX, sourceY, sx, sy, options);
        results.push(decomposition);
    }
    
    return results;
}

/**
 * Simple AABB (Axis-Aligned Bounding Box) computation for comparison
 * @param {Array<{x: number, y: number}>} polygon - Polygon points
 * @returns {{xmin: number, ymin: number, xmax: number, ymax: number}} - AABB
 */
export function computeAABB(polygon) {
    if (polygon.length === 0) {
        return { xmin: 0, ymin: 0, xmax: 0, ymax: 0 };
    }
    
    let xmin = polygon[0].x;
    let ymin = polygon[0].y;
    let xmax = polygon[0].x;
    let ymax = polygon[0].y;
    
    for (let i = 1; i < polygon.length; i++) {
        xmin = Math.min(xmin, polygon[i].x);
        ymin = Math.min(ymin, polygon[i].y);
        xmax = Math.max(xmax, polygon[i].x);
        ymax = Math.max(ymax, polygon[i].y);
    }
    
    return { xmin, ymin, xmax, ymax };
}

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

export {
    marchingSquares,
    douglasPeucker,
    convexHull,
    extractSolidPixels,
    extractSpriteData,
    computeBoundingShape,
    computeConvexHullShape,
    computeSimplifiedConvexHullShape
};

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

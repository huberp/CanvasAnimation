#!/usr/bin/env node

/**
 * Test script to analyze convex decomposition issues
 * Helps identify why the algorithm produces 2-point degenerate polygons
 */

import { createCanvas, loadImage } from 'canvas';
import * as boundingShape from './boundingShapeNode.js';

async function testDecomposition() {
    console.log('Testing Convex Decomposition Algorithm\n');
    console.log('='*60);
    
    // Load the problematic sprite sheet
    const imagePath = 'img/asteroid1_72x72.png';
    const image = await loadImage(imagePath);
    
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    const spriteWidth = 72;
    const spriteHeight = 72;
    const gridWidth = 5;
    
    // Test a few sprites with different accuracy levels
    const testSprites = [0, 1, 10]; // 0 and 1 are problematic, 10 is correct
    
    for (const spriteIndex of testSprites) {
        const col = spriteIndex % gridWidth;
        const row = Math.floor(spriteIndex / gridWidth);
        const sx = col * spriteWidth;
        const sy = row * spriteHeight;
        
        console.log(`\n--- Sprite ${spriteIndex} at position (${sx}, ${sy}) ---`);
        
        // Test with low tolerance (low accuracy)
        const options = { threshold: 128, tolerance: 2.0 };
        
        // Step 1: Get the initial contour
        const imageData = ctx.getImageData(sx, sy, spriteWidth, spriteHeight);
        const contour = boundingShape.phase1_marchingSquares(imageData, options.threshold, options.tolerance);
        
        console.log(`Step 1 - Marching Squares Contour:`);
        console.log(`  Points: ${contour.length}`);
        console.log(`  Is Convex: ${boundingShape.isConvex(contour)}`);
        
        // Step 2: Decompose into convex polygons
        const decomposed = boundingShape.phase2_decomposeIntoConvexPolygons(contour);
        
        console.log(`Step 2 - Decomposition:`);
        console.log(`  Polygons: ${decomposed.length}`);
        decomposed.forEach((poly, i) => {
            console.log(`  Polygon ${i}: ${poly.length} points, Convex: ${boundingShape.isConvex(poly)}`);
            if (poly.length <= 3) {
                console.log(`    WARNING: Degenerate polygon with ${poly.length} points!`);
                console.log(`    Points:`, poly);
            }
        });
        
        // Step 3: Optimize
        const optimized = boundingShape.phase3_optimizeConvexPolygons(decomposed, options.tolerance);
        
        console.log(`Step 3 - Optimization:`);
        console.log(`  Polygons: ${optimized.length}`);
        optimized.forEach((poly, i) => {
            console.log(`  Polygon ${i}: ${poly.length} points, Convex: ${boundingShape.isConvex(poly)}`);
            if (poly.length <= 3) {
                console.log(`    WARNING: Degenerate polygon with ${poly.length} points!`);
                console.log(`    Points:`, poly);
            }
        });
    }
}

testDecomposition().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

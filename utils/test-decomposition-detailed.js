#!/usr/bin/env node

/**
 * Detailed test to understand the Bayazit decomposition logic
 */

import { createCanvas, loadImage } from 'canvas';
import * as boundingShape from './boundingShapeNode.js';

async function testDecompositionDetailed() {
    console.log('Detailed Analysis of Convex Decomposition\n');
    
    // Load the sprite sheet
    const imagePath = 'img/asteroid1_72x72.png';
    const image = await loadImage(imagePath);
    
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    const spriteWidth = 72;
    const spriteHeight = 72;
    const gridWidth = 5;
    
    // Test sprite 0
    const spriteIndex = 0;
    const col = spriteIndex % gridWidth;
    const row = Math.floor(spriteIndex / gridWidth);
    const sx = col * spriteWidth;
    const sy = row * spriteHeight;
    
    console.log(`Testing Sprite ${spriteIndex} at position (${sx}, ${sy})\n`);
    
    // Get the contour with low tolerance
    const imageData = ctx.getImageData(sx, sy, spriteWidth, spriteHeight);
    const contour = boundingShape.phase1_marchingSquares(imageData, 128, 2.0);
    
    console.log('Initial contour from Marching Squares:');
    console.log(`  Total points: ${contour.length}`);
    console.log(`  Is convex: ${boundingShape.isConvex(contour)}`);
    console.log('  Points:', contour);
    
    // Now decompose
    console.log('\nDecomposition process:');
    const decomposed = boundingShape.phase2_decomposeIntoConvexPolygons(contour);
    
    decomposed.forEach((poly, i) => {
        console.log(`\nPolygon ${i}:`);
        console.log(`  Points: ${poly.length}`);
        console.log(`  Is convex: ${boundingShape.isConvex(poly)}`);
        console.log('  Vertices:', poly);
        
        // Check if this is a thin triangle
        if (poly.length === 3) {
            const [p0, p1, p2] = poly;
            const area = Math.abs(
                (p1.x - p0.x) * (p2.y - p0.y) - 
                (p2.x - p0.x) * (p1.y - p0.y)
            ) / 2;
            console.log(`  Triangle area: ${area.toFixed(2)}`);
            
            // Calculate side lengths
            const dist = (a, b) => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
            console.log(`  Side lengths: ${dist(p0, p1).toFixed(2)}, ${dist(p1, p2).toFixed(2)}, ${dist(p2, p0).toFixed(2)}`);
        }
    });
}

testDecompositionDetailed().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

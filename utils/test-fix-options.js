#!/usr/bin/env node

/**
 * Test different fix options for convex decomposition
 * Demonstrates the impact of each proposed fix
 */

import { createCanvas, loadImage } from 'canvas';
import * as boundingShape from './boundingShapeNode.js';

// Fix Option 1: Filter degenerate polygons
function fixOption1_filterDegenerate(polygons) {
    return polygons.filter(poly => poly.length >= 3);
}

// Fix Option 2: Reduce optimization tolerance
function fixOption2_reduceOptimization(contour, originalTolerance) {
    const decomposed = boundingShape.phase2_decomposeIntoConvexPolygons(contour);
    
    // Use reduced tolerance: 30% of original or minimum 0.5
    const reducedTolerance = Math.max(originalTolerance * 0.3, 0.5);
    
    return decomposed.map(polygon => {
        const simplified = boundingShape.douglasPeucker(polygon, reducedTolerance);
        return boundingShape.isConvex(simplified) ? simplified : polygon;
    });
}

// Fix Option 3: Filter by minimum area
function calculatePolygonArea(polygon) {
    if (polygon.length < 3) return 0;
    
    let area = 0;
    const n = polygon.length;
    
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        area += polygon[i].x * polygon[j].y;
        area -= polygon[j].x * polygon[i].y;
    }
    
    return Math.abs(area) / 2;
}

function fixOption3_filterByArea(polygons, minArea = 5) {
    return polygons.filter(poly => {
        if (poly.length < 3) return false;
        const area = calculatePolygonArea(poly);
        return area >= minArea;
    });
}

// Hybrid Fix: Options 1 + 2
function fixHybrid_filterAndReduce(contour, originalTolerance) {
    const decomposed = boundingShape.phase2_decomposeIntoConvexPolygons(contour);
    
    const reducedTolerance = Math.max(originalTolerance * 0.3, 0.5);
    
    return decomposed
        .map(polygon => {
            const simplified = boundingShape.douglasPeucker(polygon, reducedTolerance);
            return boundingShape.isConvex(simplified) ? simplified : polygon;
        })
        .filter(poly => poly.length >= 3);
}

// Test function
async function testFixOptions() {
    console.log('Testing Fix Options for Convex Decomposition\n');
    console.log('='.repeat(70));
    
    const imagePath = 'img/asteroid1_72x72.png';
    const image = await loadImage(imagePath);
    
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    const spriteWidth = 72;
    const spriteHeight = 72;
    const gridWidth = 5;
    
    // Test sprite 0 (problematic) and sprite 10 (correct baseline)
    const testSprites = [0, 10];
    
    for (const spriteIndex of testSprites) {
        const col = spriteIndex % gridWidth;
        const row = Math.floor(spriteIndex / gridWidth);
        const sx = col * spriteWidth;
        const sy = row * spriteHeight;
        
        console.log(`\n${'='.repeat(70)}`);
        console.log(`SPRITE ${spriteIndex} at position (${sx}, ${sy})`);
        console.log('='.repeat(70));
        
        const tolerance = 2.0;
        const imageData = ctx.getImageData(sx, sy, spriteWidth, spriteHeight);
        const contour = boundingShape.phase1_marchingSquares(imageData, 128, tolerance);
        
        console.log(`\nOriginal Contour: ${contour.length} points, Convex: ${boundingShape.isConvex(contour)}`);
        
        // Current implementation (buggy)
        console.log('\n--- CURRENT IMPLEMENTATION (BUGGY) ---');
        const currentDecomposed = boundingShape.phase2_decomposeIntoConvexPolygons(contour);
        const currentOptimized = boundingShape.phase3_optimizeConvexPolygons(currentDecomposed, tolerance);
        
        console.log(`Polygons: ${currentOptimized.length}`);
        currentOptimized.forEach((poly, i) => {
            const area = calculatePolygonArea(poly);
            console.log(`  Polygon ${i}: ${poly.length} points, Area: ${area.toFixed(2)} px², Valid: ${poly.length >= 3 ? '✓' : '✗ INVALID'}`);
        });
        
        // Fix Option 1: Filter degenerate
        console.log('\n--- OPTION 1: Filter Degenerate Polygons ---');
        const opt1 = fixOption1_filterDegenerate(currentOptimized);
        console.log(`Polygons: ${opt1.length} (filtered ${currentOptimized.length - opt1.length})`);
        opt1.forEach((poly, i) => {
            const area = calculatePolygonArea(poly);
            console.log(`  Polygon ${i}: ${poly.length} points, Area: ${area.toFixed(2)} px²`);
        });
        
        // Fix Option 2: Reduce optimization
        console.log('\n--- OPTION 2: Reduce Optimization Tolerance ---');
        const opt2 = fixOption2_reduceOptimization(contour, tolerance);
        console.log(`Polygons: ${opt2.length}`);
        opt2.forEach((poly, i) => {
            const area = calculatePolygonArea(poly);
            console.log(`  Polygon ${i}: ${poly.length} points, Area: ${area.toFixed(2)} px², Valid: ${poly.length >= 3 ? '✓' : '✗'}`);
        });
        
        // Fix Option 3: Filter by area
        console.log('\n--- OPTION 3: Filter by Minimum Area (5px²) ---');
        const opt3 = fixOption3_filterByArea(currentOptimized, 5);
        console.log(`Polygons: ${opt3.length} (filtered ${currentOptimized.length - opt3.length})`);
        opt3.forEach((poly, i) => {
            const area = calculatePolygonArea(poly);
            console.log(`  Polygon ${i}: ${poly.length} points, Area: ${area.toFixed(2)} px²`);
        });
        
        // Hybrid: Options 1 + 2
        console.log('\n--- HYBRID: Reduce Tolerance + Filter Degenerate ---');
        const hybrid = fixHybrid_filterAndReduce(contour, tolerance);
        console.log(`Polygons: ${hybrid.length}`);
        hybrid.forEach((poly, i) => {
            const area = calculatePolygonArea(poly);
            console.log(`  Polygon ${i}: ${poly.length} points, Area: ${area.toFixed(2)} px²`);
        });
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log('\nCurrent Implementation:');
    console.log('  - Produces invalid 2-point polygons ✗');
    console.log('  - Loses coverage in small areas ✗');
    console.log('\nOption 1 (Filter Degenerate):');
    console.log('  - Removes invalid polygons ✓');
    console.log('  - Loses coverage (filters out invalid results) ✗');
    console.log('  - Simplest fix (2 lines) ✓');
    console.log('\nOption 2 (Reduce Tolerance):');
    console.log('  - Preserves small triangles as valid 3-point polygons ✓');
    console.log('  - Still creates tiny polygons (but valid) ~');
    console.log('  - Maintains full coverage ✓');
    console.log('  - May have invalid 2-point if triangle is VERY small ✗');
    console.log('\nOption 3 (Filter by Area):');
    console.log('  - Removes tiny/useless polygons ✓');
    console.log('  - Better than point-count filtering ✓');
    console.log('  - Loses coverage in filtered areas ✗');
    console.log('\nHybrid (Option 1 + 2):');
    console.log('  - Preserves valid small features ✓');
    console.log('  - Filters any remaining invalid polygons ✓');
    console.log('  - Maintains coverage ✓');
    console.log('  - Low risk, simple implementation ✓');
    console.log('  - Recommended solution ★');
}

testFixOptions().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

#!/usr/bin/env node

/**
 * Create visual comparison of fix options
 * Generates side-by-side images showing different fix approaches
 */

import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import * as boundingShape from './boundingShapeNode.js';

// Helper to calculate polygon area
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

// Fix implementations
function getCurrentImplementation(contour, tolerance) {
    const decomposed = boundingShape.phase2_decomposeIntoConvexPolygons(contour);
    return boundingShape.phase3_optimizeConvexPolygons(decomposed, tolerance);
}

function getOption1(contour, tolerance) {
    const current = getCurrentImplementation(contour, tolerance);
    return current.filter(poly => poly.length >= 3);
}

function getOption2(contour, tolerance) {
    const decomposed = boundingShape.phase2_decomposeIntoConvexPolygons(contour);
    const reducedTolerance = Math.max(tolerance * 0.3, 0.5);
    return decomposed.map(polygon => {
        const simplified = boundingShape.douglasPeucker(polygon, reducedTolerance);
        return boundingShape.isConvex(simplified) ? simplified : polygon;
    });
}

function getHybrid(contour, tolerance) {
    const decomposed = boundingShape.phase2_decomposeIntoConvexPolygons(contour);
    const reducedTolerance = Math.max(tolerance * 0.3, 0.5);
    return decomposed
        .map(polygon => {
            const simplified = boundingShape.douglasPeucker(polygon, reducedTolerance);
            return boundingShape.isConvex(simplified) ? simplified : polygon;
        })
        .filter(poly => poly.length >= 3);
}

// Draw a sprite with its decomposition
function drawDecomposition(ctx, x, y, spriteImage, sx, sy, sw, sh, polygons, title) {
    // Draw sprite
    ctx.save();
    ctx.translate(x, y);
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, sw, sh);
    
    // Sprite image
    ctx.drawImage(spriteImage, sx, sy, sw, sh, 0, 0, sw, sh);
    
    // Draw polygons with different colors
    const colors = ['#00ff00', '#00ccff', '#ff00ff', '#ffff00', '#ff9900'];
    polygons.forEach((polygon, i) => {
        if (polygon.length < 2) return;
        
        const color = colors[i % colors.length];
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        if (polygon.length >= 3) {
            // Valid polygon - filled
            ctx.fillStyle = color + '30'; // Semi-transparent
            ctx.beginPath();
            ctx.moveTo(polygon[0].x, polygon[0].y);
            for (let j = 1; j < polygon.length; j++) {
                ctx.lineTo(polygon[j].x, polygon[j].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else {
            // Invalid polygon (line) - dashed red
            ctx.strokeStyle = '#ff0000';
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(polygon[0].x, polygon[0].y);
            for (let j = 1; j < polygon.length; j++) {
                ctx.lineTo(polygon[j].x, polygon[j].y);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Draw vertices
        ctx.fillStyle = '#ff0000';
        for (const point of polygon) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    ctx.restore();
    
    // Draw title and info
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(title, x, y - 5);
    
    // Stats
    ctx.font = '10px Arial';
    const validPolys = polygons.filter(p => p.length >= 3).length;
    const invalidPolys = polygons.filter(p => p.length < 3).length;
    let statsText = `${polygons.length} poly (${validPolys} valid`;
    if (invalidPolys > 0) {
        statsText += `, ${invalidPolys} INVALID`;
    }
    statsText += ')';
    ctx.fillText(statsText, x, y + sh + 15);
}

async function createVisualization() {
    console.log('Creating visual comparison of fix options...\n');
    
    // Load sprite sheet
    const imagePath = 'img/asteroid1_72x72.png';
    const image = await loadImage(imagePath);
    
    const tempCanvas = createCanvas(image.width, image.height);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(image, 0, 0);
    
    const spriteWidth = 72;
    const spriteHeight = 72;
    const gridWidth = 5;
    
    // Test sprite 0 (problematic case)
    const spriteIndex = 0;
    const col = spriteIndex % gridWidth;
    const row = Math.floor(spriteIndex / gridWidth);
    const sx = col * spriteWidth;
    const sy = row * spriteHeight;
    
    const tolerance = 2.0;
    const imageData = tempCtx.getImageData(sx, sy, spriteWidth, spriteHeight);
    const contour = boundingShape.phase1_marchingSquares(imageData, 128, tolerance);
    
    // Get decompositions for each method
    const current = getCurrentImplementation(contour, tolerance);
    const option1 = getOption1(contour, tolerance);
    const option2 = getOption2(contour, tolerance);
    const hybrid = getHybrid(contour, tolerance);
    
    // Create comparison canvas - 2x2 grid
    const padding = 30;
    const canvasWidth = spriteWidth * 2 + padding * 3;
    const canvasHeight = spriteHeight * 2 + padding * 5;
    
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Title
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Convex Decomposition Fix Comparison - Sprite 0', canvasWidth / 2, 20);
    
    // Draw 2x2 grid
    const positions = [
        { x: padding, y: padding + 30, title: 'Current (Buggy)', polys: current },
        { x: spriteWidth + padding * 2, y: padding + 30, title: 'Option 1: Filter Only', polys: option1 },
        { x: padding, y: spriteHeight + padding * 3 + 30, title: 'Option 2: Reduce Tolerance', polys: option2 },
        { x: spriteWidth + padding * 2, y: spriteHeight + padding * 3 + 30, title: 'Hybrid (Recommended)', polys: hybrid }
    ];
    
    positions.forEach(pos => {
        drawDecomposition(ctx, pos.x, pos.y, image, sx, sy, spriteWidth, spriteHeight, pos.polys, pos.title);
    });
    
    // Legend
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    const legendY = canvasHeight - 35;
    ctx.fillText('Legend:', padding, legendY);
    
    // Green polygon
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, legendY + 5, 15, 10);
    ctx.fillText('Valid polygon', padding + 20, legendY + 14);
    
    // Red dashed line
    ctx.strokeStyle = '#ff0000';
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(padding + 150, legendY + 10);
    ctx.lineTo(padding + 165, legendY + 10);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Invalid (2 points)', padding + 170, legendY + 14);
    
    // Save image
    const outputPath = 'img/visualizations/decomposition-fix-comparison.png';
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✓ Visualization saved to: ${outputPath}`);
    console.log('\nComparison Summary:');
    console.log('  Current:  Invalid 2-point polygon shown in red dashed line');
    console.log('  Option 1: Filters invalid, loses small feature coverage');
    console.log('  Option 2: Preserves small triangle (green), all valid');
    console.log('  Hybrid:   Same as Option 2 + safety filtering');
}

createVisualization().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

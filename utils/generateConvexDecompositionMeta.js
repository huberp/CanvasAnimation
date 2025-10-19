#!/usr/bin/env node

/**
 * Convex Decomposition Meta Generator
 * 
 * This utility generates spritesheet metadata files containing convex polygon decompositions
 * for all sprites in a sprite sheet, using the Bayazit algorithm from PR #36.
 * 
 * Unlike generateBoundingShapeMeta.js which generates single polygons, this generates
 * multiple convex polygons per sprite for improved collision detection.
 * 
 * Usage:
 *   node generateConvexDecompositionMeta.js <image-path> <sprite-width> <sprite-height> <grid-width> <num-sprites>
 * 
 * Example:
 *   node generateConvexDecompositionMeta.js img/asteroid4_32x32.png 32 32 5 19
 */

import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import * as boundingShape from './boundingShapeNode.js';

// Accuracy levels with different tolerance values
const ACCURACY_LEVELS = {
    low: {
        tolerance: 2.0
    },
    mid: {
        tolerance: 1.0
    },
    high: {
        tolerance: 0.5
    }
};

/**
 * Process a single sprite sheet and generate convex decomposition metadata
 */
async function processSpriteSheet(imagePath, spriteWidth, spriteHeight, gridWidth, numSprites) {
    console.log(`\nProcessing sprite sheet: ${imagePath}`);
    console.log(`Sprite dimensions: ${spriteWidth}x${spriteHeight}`);
    console.log(`Grid: ${gridWidth} columns, ${numSprites} total sprites`);
    
    // Load the image
    const image = await loadImage(imagePath);
    
    // Create canvas
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    
    // Prepare metadata structure
    const metadata = {
        sourceImage: path.basename(imagePath),
        spriteWidth,
        spriteHeight,
        gridWidth,
        numSprites,
        timestamp: new Date().toISOString(),
        algorithm: 'convexDecomposition',
        description: 'Bayazit algorithm (FACD) - Fast Approximate Convex Decomposition',
        accuracyLevels: {}
    };
    
    // Process each accuracy level
    for (const [accuracy, config] of Object.entries(ACCURACY_LEVELS)) {
        console.log(`\n  Processing accuracy level: ${accuracy} (tolerance: ${config.tolerance})`);
        
        const sprites = [];
        
        // Process each sprite
        for (let i = 0; i < numSprites; i++) {
            const col = i % gridWidth;
            const row = Math.floor(i / gridWidth);
            const sx = col * spriteWidth;
            const sy = row * spriteHeight;
            
            // Compute convex decomposition
            const options = { 
                threshold: 128,
                tolerance: config.tolerance
            };
            
            const convexPolygons = boundingShape.computeOptimizedConvexDecomposition(
                ctx, sx, sy, spriteWidth, spriteHeight, options
            );
            
            // Count total points across all polygons
            const totalPoints = convexPolygons.reduce((sum, poly) => sum + poly.length, 0);
            
            sprites.push({
                index: i,
                position: { x: sx, y: sy },
                convexPolygons: convexPolygons,
                polygonCount: convexPolygons.length,
                totalPoints: totalPoints
            });
        }
        
        metadata.accuracyLevels[accuracy] = sprites;
        
        // Calculate statistics
        const totalPolygons = sprites.reduce((sum, s) => sum + s.polygonCount, 0);
        const totalPoints = sprites.reduce((sum, s) => sum + s.totalPoints, 0);
        const avgPolygons = sprites.length > 0 ? (totalPolygons / sprites.length).toFixed(2) : 0;
        const avgPoints = sprites.length > 0 ? (totalPoints / sprites.length).toFixed(2) : 0;
        console.log(`      Generated ${sprites.length} sprites, avg ${avgPolygons} polygons per sprite, avg ${avgPoints} points per sprite`);
    }
    
    return metadata;
}

/**
 * Custom JSON stringifier that formats point objects compactly
 */
function stringifyMetadata(metadata) {
    let json = JSON.stringify(metadata, null, 2);
    
    // Replace multi-line point objects with single-line format
    json = json.replace(/\{\s+"x":\s+(-?\d+),\s+"y":\s+(-?\d+)\s+\}/g, '{ "x": $1, "y": $2 }');
    
    return json;
}

/**
 * Save metadata to JSON file
 */
function saveMetadata(metadata, outputPath) {
    const json = stringifyMetadata(metadata);
    fs.writeFileSync(outputPath, json);
    console.log(`\nMetadata saved to: ${outputPath}`);
}

/**
 * Create visualization screenshot
 */
async function createScreenshot(imagePath, metadata, outputPath, accuracy) {
    console.log(`\nCreating screenshot for convexDecomposition (${accuracy})...`);
    
    const image = await loadImage(imagePath);
    const sprites = metadata.accuracyLevels[accuracy];
    
    // Calculate canvas size - arrange sprites in a grid
    const cols = Math.min(5, metadata.numSprites);
    const rows = Math.ceil(metadata.numSprites / cols);
    const padding = 10;
    const spriteDisplaySize = Math.max(metadata.spriteWidth, metadata.spriteHeight) + padding * 2;
    
    const canvasWidth = cols * spriteDisplaySize + padding;
    const canvasHeight = rows * spriteDisplaySize + padding + 60; // Extra space for title
    
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Title
    ctx.fillStyle = '#4CAF50';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${metadata.sourceImage} - Convex Decomposition (${accuracy})`, canvasWidth / 2, 30);
    
    // Define colors for different polygons
    const polygonColors = ['#00ff00', '#00ccff', '#ff00ff', '#ffff00', '#ff9900', '#ff0099'];
    
    // Draw each sprite with its convex polygons
    for (let i = 0; i < metadata.numSprites; i++) {
        const sprite = sprites[i];
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        const x = col * spriteDisplaySize + padding + spriteDisplaySize / 2;
        const y = row * spriteDisplaySize + padding + 60 + spriteDisplaySize / 2;
        
        // Draw sprite
        ctx.save();
        ctx.translate(x - metadata.spriteWidth / 2, y - metadata.spriteHeight / 2);
        ctx.drawImage(
            image,
            sprite.position.x, sprite.position.y,
            metadata.spriteWidth, metadata.spriteHeight,
            0, 0,
            metadata.spriteWidth, metadata.spriteHeight
        );
        
        // Draw each convex polygon with a different color
        sprite.convexPolygons.forEach((polygon, polyIndex) => {
            if (polygon.length > 0) {
                const color = polygonColors[polyIndex % polygonColors.length];
                ctx.strokeStyle = color;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(polygon[0].x, polygon[0].y);
                for (let j = 1; j < polygon.length; j++) {
                    ctx.lineTo(polygon[j].x, polygon[j].y);
                }
                ctx.closePath();
                ctx.stroke();
                
                // Draw vertices
                ctx.fillStyle = '#ff0000';
                for (const point of polygon) {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        });
        
        ctx.restore();
        
        // Draw sprite index and polygon count
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${i} (${sprite.polygonCount}poly, ${sprite.totalPoints}pts)`, x, y + spriteDisplaySize / 2 - 5);
    }
    
    // Save screenshot
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`Screenshot saved to: ${outputPath}`);
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 5) {
        console.error('Usage: node generateConvexDecompositionMeta.js <image-path> <sprite-width> <sprite-height> <grid-width> <num-sprites>');
        console.error('Example: node generateConvexDecompositionMeta.js img/asteroid4_32x32.png 32 32 5 19');
        process.exit(1);
    }
    
    const imagePath = args[0];
    const spriteWidth = parseInt(args[1]);
    const spriteHeight = parseInt(args[2]);
    const gridWidth = parseInt(args[3]);
    const numSprites = parseInt(args[4]);
    
    // Validate inputs
    if (!fs.existsSync(imagePath)) {
        console.error(`Error: Image file not found: ${imagePath}`);
        process.exit(1);
    }
    
    if (isNaN(spriteWidth) || isNaN(spriteHeight) || isNaN(gridWidth) || isNaN(numSprites)) {
        console.error('Error: Invalid numeric parameters');
        process.exit(1);
    }
    
    try {
        // Process sprite sheet
        const metadata = await processSpriteSheet(imagePath, spriteWidth, spriteHeight, gridWidth, numSprites);
        
        // Generate output filename
        const baseName = path.basename(imagePath, path.extname(imagePath));
        const outputDir = path.join(path.dirname(imagePath), 'meta');
        
        // Create meta directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        const metadataPath = path.join(outputDir, `${baseName}-convex-decomposition-meta.json`);
        saveMetadata(metadata, metadataPath);
        
        // Create screenshots for each accuracy level
        for (const accuracy of Object.keys(ACCURACY_LEVELS)) {
            const screenshotPath = path.join(outputDir, `${baseName}-convexDecomposition-${accuracy}.png`);
            await createScreenshot(imagePath, metadata, screenshotPath, accuracy);
        }
        
        console.log('\n✅ Processing complete!');
        console.log(`\nSummary:`);
        console.log(`  - Processed ${numSprites} sprites`);
        console.log(`  - Generated convex decomposition metadata`);
        console.log(`  - Created ${Object.keys(ACCURACY_LEVELS).length} screenshots`);
        console.log(`  - Output directory: ${outputDir}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run main function
main();

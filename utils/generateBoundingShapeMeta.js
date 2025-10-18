#!/usr/bin/env node

/**
 * Bounding Shape Meta Generator
 * 
 * This utility generates spritesheet metadata files containing bounding shapes
 * for all sprites in a sprite sheet, using multiple algorithms and accuracy levels.
 * 
 * Usage:
 *   node generateBoundingShapeMeta.js <image-path> <sprite-width> <sprite-height> <grid-width> <num-sprites>
 * 
 * Example:
 *   node generateBoundingShapeMeta.js img/asteroid4_32x32.png 32 32 5 19
 */

import fs from 'fs';
import path from 'path';
import { createCanvas, loadImage } from 'canvas';
import * as boundingShape from './boundingShapeNode.js';

// Accuracy levels with different tolerance values
const ACCURACY_LEVELS = {
    low: {
        marchingSquares: 4.0,
        convexHull: 2.0,
        simplifiedConvexHull: 2.0
    },
    mid: {
        marchingSquares: 2.0,
        convexHull: 1.0,
        simplifiedConvexHull: 1.0
    },
    high: {
        marchingSquares: 1.0,
        convexHull: 0.5,
        simplifiedConvexHull: 0.5
    }
};

const ALGORITHMS = [
    'marchingSquares',
    'convexHull',
    'simplifiedConvexHull'
];

/**
 * Process a single sprite sheet and generate metadata
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
        algorithms: {}
    };
    
    // Process each algorithm
    for (const algorithm of ALGORITHMS) {
        console.log(`\n  Processing algorithm: ${algorithm}`);
        metadata.algorithms[algorithm] = {};
        
        // Process each accuracy level
        for (const [accuracy, tolerances] of Object.entries(ACCURACY_LEVELS)) {
            console.log(`    Accuracy level: ${accuracy} (tolerance: ${tolerances[algorithm]})`);
            
            const sprites = [];
            
            // Process each sprite
            for (let i = 0; i < numSprites; i++) {
                const col = i % gridWidth;
                const row = Math.floor(i / gridWidth);
                const sx = col * spriteWidth;
                const sy = row * spriteHeight;
                
                // Compute bounding shape based on algorithm
                let shape;
                const options = { 
                    threshold: 128,
                    tolerance: tolerances[algorithm]
                };
                
                if (algorithm === 'marchingSquares') {
                    shape = boundingShape.computeBoundingShape(ctx, sx, sy, spriteWidth, spriteHeight, options);
                } else if (algorithm === 'convexHull') {
                    shape = boundingShape.computeConvexHullShape(ctx, sx, sy, spriteWidth, spriteHeight, options);
                } else if (algorithm === 'simplifiedConvexHull') {
                    shape = boundingShape.computeSimplifiedConvexHullShape(ctx, sx, sy, spriteWidth, spriteHeight, options);
                }
                
                sprites.push({
                    index: i,
                    position: { x: sx, y: sy },
                    boundingShape: shape,
                    pointCount: shape.length
                });
            }
            
            metadata.algorithms[algorithm][accuracy] = sprites;
            
            // Calculate statistics
            const totalPoints = sprites.reduce((sum, s) => sum + s.pointCount, 0);
            const avgPoints = sprites.length > 0 ? (totalPoints / sprites.length).toFixed(2) : 0;
            console.log(`      Generated ${sprites.length} shapes, avg ${avgPoints} points per shape`);
        }
    }
    
    return metadata;
}

/**
 * Save metadata to JSON file
 */
function saveMetadata(metadata, outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`\nMetadata saved to: ${outputPath}`);
}

/**
 * Create visualization screenshot
 */
async function createScreenshot(imagePath, metadata, outputPath, algorithm, accuracy) {
    console.log(`\nCreating screenshot for ${algorithm} (${accuracy})...`);
    
    const image = await loadImage(imagePath);
    const sprites = metadata.algorithms[algorithm][accuracy];
    
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
    ctx.fillText(`${metadata.sourceImage} - ${algorithm} (${accuracy})`, canvasWidth / 2, 30);
    
    // Draw each sprite with its bounding shape
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
        
        // Draw bounding shape
        if (sprite.boundingShape.length > 0) {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sprite.boundingShape[0].x, sprite.boundingShape[0].y);
            for (let j = 1; j < sprite.boundingShape.length; j++) {
                ctx.lineTo(sprite.boundingShape[j].x, sprite.boundingShape[j].y);
            }
            ctx.closePath();
            ctx.stroke();
            
            // Draw vertices
            ctx.fillStyle = '#ff0000';
            for (const point of sprite.boundingShape) {
                ctx.beginPath();
                ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
        
        // Draw sprite index
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`#${i} (${sprite.pointCount}pts)`, x, y + spriteDisplaySize / 2 - 5);
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
        console.error('Usage: node generateBoundingShapeMeta.js <image-path> <sprite-width> <sprite-height> <grid-width> <num-sprites>');
        console.error('Example: node generateBoundingShapeMeta.js img/asteroid4_32x32.png 32 32 5 19');
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
        
        const metadataPath = path.join(outputDir, `${baseName}-meta.json`);
        saveMetadata(metadata, metadataPath);
        
        // Create screenshots for each algorithm and accuracy level
        for (const algorithm of ALGORITHMS) {
            for (const accuracy of Object.keys(ACCURACY_LEVELS)) {
                const screenshotPath = path.join(outputDir, `${baseName}-${algorithm}-${accuracy}.png`);
                await createScreenshot(imagePath, metadata, screenshotPath, algorithm, accuracy);
            }
        }
        
        console.log('\n✅ Processing complete!');
        console.log(`\nSummary:`);
        console.log(`  - Processed ${numSprites} sprites`);
        console.log(`  - Generated metadata for ${ALGORITHMS.length} algorithms`);
        console.log(`  - Created ${ALGORITHMS.length * Object.keys(ACCURACY_LEVELS).length} screenshots`);
        console.log(`  - Output directory: ${outputDir}`);
        
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run main function
main();

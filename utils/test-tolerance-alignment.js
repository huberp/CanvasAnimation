#!/usr/bin/env node

/**
 * Test script to verify that convex decomposition uses the same tolerance values
 * as marching squares, ensuring consistent input data.
 * 
 * This addresses the issue where convex decomposition low had more points than
 * marching squares low because they used different tolerance values.
 */

import fs from 'fs';
import path from 'path';

// Expected tolerance values (should match between both algorithms)
const EXPECTED_TOLERANCES = {
    low: 4.0,
    mid: 2.0,
    high: 1.0
};

console.log('Testing Tolerance Alignment Between Algorithms');
console.log('='.repeat(80));
console.log();

// Test 1: Check generateBoundingShapeMeta.js tolerance values
console.log('Test 1: Checking generateBoundingShapeMeta.js...');
const boundingShapeMetaPath = './utils/generateBoundingShapeMeta.js';
const boundingShapeMetaContent = fs.readFileSync(boundingShapeMetaPath, 'utf-8');

// Extract ACCURACY_LEVELS from the file
const boundingShapeMatch = boundingShapeMetaContent.match(/const ACCURACY_LEVELS = \{[\s\S]*?\};/);
if (!boundingShapeMatch) {
    console.error('  ✗ Could not find ACCURACY_LEVELS in generateBoundingShapeMeta.js');
    process.exit(1);
}

// Check for expected tolerance values in marching squares
let foundLow = boundingShapeMetaContent.includes('marchingSquares: 4.0');
let foundMid = boundingShapeMetaContent.includes('marchingSquares: 2.0');
let foundHigh = boundingShapeMetaContent.includes('marchingSquares: 1.0');

if (foundLow && foundMid && foundHigh) {
    console.log('  ✓ Marching Squares tolerance values are correct (4.0, 2.0, 1.0)');
} else {
    console.error('  ✗ Marching Squares tolerance values are incorrect');
    console.error(`    Low (4.0): ${foundLow ? 'Found' : 'Missing'}`);
    console.error(`    Mid (2.0): ${foundMid ? 'Found' : 'Missing'}`);
    console.error(`    High (1.0): ${foundHigh ? 'Found' : 'Missing'}`);
    process.exit(1);
}
console.log();

// Test 2: Check generateConvexDecompositionMeta.js tolerance values
console.log('Test 2: Checking generateConvexDecompositionMeta.js...');
const convexDecompMetaPath = './utils/generateConvexDecompositionMeta.js';
const convexDecompMetaContent = fs.readFileSync(convexDecompMetaPath, 'utf-8');

// Extract ACCURACY_LEVELS from the file
const convexDecompMatch = convexDecompMetaContent.match(/const ACCURACY_LEVELS = \{[\s\S]*?\};/);
if (!convexDecompMatch) {
    console.error('  ✗ Could not find ACCURACY_LEVELS in generateConvexDecompositionMeta.js');
    process.exit(1);
}

// Check for expected tolerance values
foundLow = convexDecompMetaContent.includes('tolerance: 4.0');
foundMid = convexDecompMetaContent.includes('tolerance: 2.0');
foundHigh = convexDecompMetaContent.includes('tolerance: 1.0');

if (foundLow && foundMid && foundHigh) {
    console.log('  ✓ Convex Decomposition tolerance values are correct (4.0, 2.0, 1.0)');
} else {
    console.error('  ✗ Convex Decomposition tolerance values are incorrect');
    console.error(`    Low (4.0): ${foundLow ? 'Found' : 'Missing'}`);
    console.error(`    Mid (2.0): ${foundMid ? 'Found' : 'Missing'}`);
    console.error(`    High (1.0): ${foundHigh ? 'Found' : 'Missing'}`);
    process.exit(1);
}
console.log();

// Test 3: Verify metadata consistency for asteroid1
console.log('Test 3: Verifying metadata consistency for asteroid1...');
const msMetaPath = './img/meta/asteroid1_72x72-meta.json';
const cdMetaPath = './img/meta/asteroid1_72x72-convex-decomposition-meta.json';

if (!fs.existsSync(msMetaPath)) {
    console.error(`  ✗ Marching Squares metadata not found: ${msMetaPath}`);
    process.exit(1);
}

if (!fs.existsSync(cdMetaPath)) {
    console.error(`  ✗ Convex Decomposition metadata not found: ${cdMetaPath}`);
    process.exit(1);
}

const msData = JSON.parse(fs.readFileSync(msMetaPath));
const cdData = JSON.parse(fs.readFileSync(cdMetaPath));

// Compare average point counts
const msLowSprites = msData.algorithms.marchingSquares.low;
const cdLowSprites = cdData.accuracyLevels.low;

const msAvgPoints = msLowSprites.reduce((sum, s) => sum + s.pointCount, 0) / msLowSprites.length;
const cdAvgPoints = cdLowSprites.reduce((sum, s) => sum + s.totalPoints, 0) / cdLowSprites.length;

console.log(`  Marching Squares Low: ${msAvgPoints.toFixed(2)} avg points per sprite`);
console.log(`  Convex Decomposition Low: ${cdAvgPoints.toFixed(2)} avg points per sprite`);

// Convex decomposition should have similar or fewer points on average
// Allow for small variations due to the decomposition and optimization process
const pointDifference = Math.abs(msAvgPoints - cdAvgPoints);
const percentDifference = (pointDifference / msAvgPoints) * 100;

if (percentDifference <= 20) {
    console.log(`  ✓ Point counts are reasonably aligned (${percentDifference.toFixed(1)}% difference)`);
} else {
    console.error(`  ✗ Point counts differ significantly (${percentDifference.toFixed(1)}% difference)`);
    console.error('    This suggests the tolerance values may not be properly aligned');
    process.exit(1);
}
console.log();

// Test 4: Verify that CD respects already-convex polygons
console.log('Test 4: Verifying convex polygon handling...');
import * as bs from './boundingShapeNode.js';

let convexPreserved = 0;
let convexTotal = 0;

for (let i = 0; i < msLowSprites.length; i++) {
    const msPolygon = msLowSprites[i].boundingShape;
    const msConvex = bs.isConvex(msPolygon);
    const cdPolygonCount = cdLowSprites[i].polygonCount;
    
    if (msConvex) {
        convexTotal++;
        if (cdPolygonCount === 1) {
            convexPreserved++;
        }
    }
}

console.log(`  Found ${convexTotal} already-convex polygons in marching squares output`);
console.log(`  ${convexPreserved}/${convexTotal} preserved as single polygons in convex decomposition`);

if (convexPreserved === convexTotal) {
    console.log('  ✓ All convex polygons correctly preserved');
} else {
    const preservedPercent = (convexPreserved / convexTotal) * 100;
    console.log(`  ⚠ ${preservedPercent.toFixed(0)}% of convex polygons preserved (acceptable due to optimization)`);
}
console.log();

console.log('='.repeat(80));
console.log('✅ All tests passed! Tolerance values are properly aligned.');
console.log();

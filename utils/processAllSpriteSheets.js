#!/usr/bin/env node

/**
 * Process All Sprite Sheets
 * 
 * This script processes all known sprite sheets in the project and generates
 * bounding shape metadata for each one.
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define all sprite sheets in the project
const spriteSheets = [
    {
        name: 'asteroid1',
        path: 'img/asteroid1_72x72.png',
        width: 72,
        height: 72,
        gridWidth: 5,
        numSprites: 19
    },
    {
        name: 'asteroid3',
        path: 'img/asteroid3_32x32.png',
        width: 32,
        height: 32,
        gridWidth: 5,
        numSprites: 19
    },
    {
        name: 'asteroid4',
        path: 'img/asteroid4_32x32.png',
        width: 32,
        height: 32,
        gridWidth: 5,
        numSprites: 19
    },
    {
        name: 'asteroid5',
        path: 'img/asteroid5_72x72.png',
        width: 72,
        height: 72,
        gridWidth: 5,
        numSprites: 16
    },
    {
        name: 'asteroid6',
        path: 'img/asteroid6_64x64.png',
        width: 64,
        height: 64,
        gridWidth: 8,
        numSprites: 64
    },
    {
        name: 'explosion01',
        path: 'img/explosion01_set_64x64.png',
        width: 64,
        height: 64,
        gridWidth: 10,
        numSprites: 100
    },
    {
        name: 'explosion02',
        path: 'img/explosion02_96x96.png',
        width: 96,
        height: 96,
        gridWidth: 5,
        numSprites: 20
    }
];

async function main() {
    console.log('🚀 Processing all sprite sheets...\n');
    
    const projectRoot = path.join(__dirname, '..');
    const scriptPath = path.join(__dirname, 'generateBoundingShapeMeta.js');
    
    let success = 0;
    let failed = 0;
    
    for (const sheet of spriteSheets) {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`Processing: ${sheet.name}`);
        console.log(`${'='.repeat(80)}`);
        
        try {
            const cmd = `node "${scriptPath}" "${sheet.path}" ${sheet.width} ${sheet.height} ${sheet.gridWidth} ${sheet.numSprites}`;
            execSync(cmd, { 
                cwd: projectRoot,
                stdio: 'inherit'
            });
            success++;
        } catch (error) {
            console.error(`❌ Failed to process ${sheet.name}: ${error.message}`);
            failed++;
        }
    }
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 Summary');
    console.log(`${'='.repeat(80)}`);
    console.log(`✅ Successfully processed: ${success}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📁 Total sprite sheets: ${spriteSheets.length}`);
}

main();

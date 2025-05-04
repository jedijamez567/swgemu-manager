// This is a simple test script to verify path resolution
// Run with: node path-test.js

const path = require('path');
const fs = require('fs');

// Get the absolute path to the project root (should be the same as in electron.js)
const projectRoot = path.resolve(__dirname, '..');
console.log(`Project root resolved to: ${projectRoot}`);

// Configuration related file paths (same as in electron.js)
const configSources = [
  { source: path.join(projectRoot, 'conf'), dest: 'conf' },
  { source: path.join(projectRoot, 'player_manager'), dest: 'player_manager' },
  { source: path.join(projectRoot, 'loot_manager'), dest: 'loot_manager' },
  { source: path.join(projectRoot, 'mission_manager'), dest: 'mission_manager' },
  { source: path.join(projectRoot, 'planet_manager'), dest: 'planet_manager' },
  { source: path.join(projectRoot, 'player_creation_manager'), dest: 'player_creation_manager' },
  { source: path.join(projectRoot, 'commands'), dest: 'commands' }
];

// Print the resolved source paths
console.log('Resolved configuration source paths:');
configSources.forEach(source => {
  console.log(`  - Source: ${source.source} -> Dest: ${source.dest}`);
  
  // Check if path exists
  if (fs.existsSync(source.source)) {
    console.log(`    Path exists`);
    
    // Count files in directory
    try {
      const files = fs.readdirSync(source.source);
      console.log(`    Contains ${files.length} entries`);
      
      // Print a few sample files
      if (files.length > 0) {
        console.log(`    Sample entries: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
      }
    } catch (err) {
      console.error(`    Error reading directory: ${err.message}`);
    }
  } else {
    console.log(`    PATH DOES NOT EXIST! This will cause apply failures.`);
  }
});

// Run this script to verify the configuration file paths
// Execute with: node verify-config-paths.js

const path = require('path');
const fs = require('fs-extra');

console.log('SWGEmu Configuration Path Verification Tool');
console.log('==========================================');

// Get the absolute path to the project root (same as in electron.js)
const projectRoot = path.resolve(__dirname, '..');
console.log(`Project root: ${projectRoot}`);

// Configuration directory
const configDir = path.join(__dirname, 'configurations');
console.log(`Configuration directory: ${configDir}`);

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

// Create a test configuration for verification
const testConfigId = 'test-config-' + Date.now();
const testConfigPath = path.join(configDir, testConfigId);

async function runTest() {
  try {
    // Ensure config directory exists
    if (!fs.existsSync(configDir)) {
      console.log('Creating configuration directory...');
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Create a temporary test configuration directory
    console.log(`Creating test configuration directory: ${testConfigId}`);
    fs.mkdirSync(testConfigPath, { recursive: true });
    
    console.log('\nVerifying source paths:');
    console.log('======================');
    
    // Verify each source path exists
    for (const source of configSources) {
      console.log(`\nChecking path: ${source.source}`);
      console.log(`- Destination: ${source.dest}`);
      
      if (fs.existsSync(source.source)) {
        console.log('✓ Source path exists');
        
        // Check if it's a directory
        if (fs.statSync(source.source).isDirectory()) {
          console.log('✓ Source is a directory');
          
          // Count files and get first 3 as samples
          const files = await fs.readdir(source.source);
          console.log(`✓ Contains ${files.length} entries`);
          
          if (files.length > 0) {
            console.log(`✓ Sample entries: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
          }
          
          // Test saving (copying to test config)
          const destPath = path.join(testConfigPath, source.dest);
          console.log(`Performing test copy to: ${destPath}`);
          
          await fs.mkdirp(destPath);
          await fs.copy(source.source, destPath);
          
          // Verify the copy worked
          if (fs.existsSync(destPath)) {
            const copiedFiles = await fs.readdir(destPath);
            console.log(`✓ Successfully copied ${copiedFiles.length} entries`);
            
            // Test applying (copying back from test config)
            console.log(`Testing apply by copying back...`);
            // Create a temp apply destination
            const tempApplyDest = path.join(testConfigPath, 'apply-test', source.dest);
            await fs.mkdirp(tempApplyDest);
            
            // Copy from test config to temp apply destination
            await fs.copy(destPath, tempApplyDest, { 
              overwrite: true, 
              recursive: true,
              preserveTimestamps: true
            });
            
            // Verify apply test
            if (fs.existsSync(tempApplyDest)) {
              const appliedFiles = await fs.readdir(tempApplyDest);
              console.log(`✓ Successfully applied ${appliedFiles.length} entries`);
              
              if (appliedFiles.length === copiedFiles.length) {
                console.log('✓ All files were correctly applied');
              } else {
                console.log(`⚠ Warning: Applied ${appliedFiles.length} files but expected ${copiedFiles.length}`);
              }
            } else {
              console.log(`✗ Apply test failed: Destination does not exist`);
            }
          } else {
            console.log(`✗ Save test failed: Destination does not exist`);
          }
        } else {
          console.log('✗ Source exists but is not a directory');
        }
      } else {
        console.log('✗ Source path does not exist');
      }
    }
    
    console.log('\nTest Summary:');
    console.log('=============');
    console.log('Test configuration ID: ' + testConfigId);
    console.log('Configuration path: ' + testConfigPath);
    console.log('\nNext steps:');
    console.log('1. Make sure all paths show "✓ Source path exists"');
    console.log('2. Check that the apply test is successful for all paths');
    console.log('3. If any issues were found, verify path resolution in electron.js');
    
    // Clean up
    console.log('\nCleaning up test configuration...');
    await fs.remove(testConfigPath);
    console.log('Test directory removed.');
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

runTest();

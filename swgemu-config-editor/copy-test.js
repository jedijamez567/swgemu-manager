// Test script to verify file copying in SWGEmu Config Editor
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Log function for better visibility
function log(message, data = null) {
  console.log(`[COPY TEST] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

async function runTest() {
  log('Starting copy test...');
  
  // Get current working directory and __dirname for comparison
  const cwd = process.cwd();
  log(`Current working directory (cwd): ${cwd}`);
  log(`__dirname: ${__dirname}`);
  
  // Define source and destination paths
  const projectRoot = cwd;
  const configDir = path.join(__dirname, 'configurations');
  const testConfigId = `test-${uuidv4()}`;
  const testConfigDir = path.join(configDir, testConfigId);
  
  log(`Config directory: ${configDir}`);
  log(`Test config directory: ${testConfigDir}`);
  
  // Create test configuration directory
  try {
    await fs.mkdirp(testConfigDir);
    log(`Created test config directory at: ${testConfigDir}`);
  } catch (error) {
    log(`ERROR creating directory: ${error.message}`);
    return;
  }
  
  // Configuration sources to test copying
  const configSources = [
    { source: path.join(projectRoot, 'conf'), dest: 'conf' },
    { source: path.join(projectRoot, 'player_manager'), dest: 'player_manager' },
    { source: path.join(projectRoot, 'loot_manager'), dest: 'loot_manager' },
    { source: path.join(projectRoot, 'mission_manager'), dest: 'mission_manager' },
    { source: path.join(projectRoot, 'planet_manager'), dest: 'planet_manager' },
    { source: path.join(projectRoot, 'player_creation_manager'), dest: 'player_creation_manager' },
    { source: path.join(projectRoot, 'commands'), dest: 'commands' }
  ];
  
  // Verify and log source directories existence
  log('Checking source directories:');
  for (const source of configSources) {
    const exists = await fs.pathExists(source.source);
    log(`Source ${source.source} exists: ${exists}`);
    
    if (exists) {
      try {
        const files = await fs.readdir(source.source);
        log(`Source directory contains ${files.length} files/dirs`);
        
        if (files.length > 0) {
          log(`Sample files: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
        }
      } catch (err) {
        log(`Error reading directory: ${err.message}`);
      }
    }
  }
  
  // Test copying each source
  log('\nTesting file copy operations:');
  for (const source of configSources) {
    log(`Processing source: ${source.source}`);
    
    if (await fs.pathExists(source.source)) {
      const destPath = path.join(testConfigDir, source.dest);
      
      try {
        // Create destination directory
        await fs.mkdirp(destPath);
        log(`Created destination directory: ${destPath}`);
        
        // Copy files
        log(`Copying from ${source.source} to ${destPath}`);
        await fs.copy(source.source, destPath, {
          overwrite: true,
          recursive: true,
          preserveTimestamps: true
        });
        
        // Verify files were copied
        const sourceFiles = await recursiveReadDir(source.source);
        const destFiles = await recursiveReadDir(destPath);
        
        log(`Source contains ${sourceFiles.length} files`);
        log(`Destination contains ${destFiles.length} files`);
        
        if (sourceFiles.length !== destFiles.length) {
          log('WARNING: Source and destination file counts do not match!');
        }
        
        // Show some sample files that were copied
        if (destFiles.length > 0) {
          log(`Sample destination files: ${destFiles.slice(0, 3).map(f => path.basename(f)).join(', ')}${destFiles.length > 3 ? '...' : ''}`);
        } else {
          log('ERROR: No files were copied to the destination!');
        }
      } catch (error) {
        log(`ERROR during copy operation: ${error.message}`);
        log(`Error stack: ${error.stack}`);
      }
    } else {
      log(`Source path does not exist, skipping: ${source.source}`);
    }
  }
  
  // Clean up test directory
  try {
    log('\nCleaning up test directory...');
    await fs.remove(testConfigDir);
    log('Cleanup complete');
  } catch (error) {
    log(`Error during cleanup: ${error.message}`);
  }
  
  log('\nTest completed.');
}

// Helper function to recursively read directory
async function recursiveReadDir(dir) {
  const result = [];
  
  async function processDir(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await processDir(fullPath);
      } else {
        result.push(fullPath);
      }
    }
  }
  
  await processDir(dir);
  return result;
}

// Run the test
runTest().catch(error => {
  log(`Unhandled error in test: ${error.message}`);
  log(`Error stack: ${error.stack}`);
});

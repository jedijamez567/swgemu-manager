// Simple test script for configuration saving functionality
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

console.log('SWGEmu Configuration Save Test');
console.log('==============================');

async function testConfigSave() {
  try {
    // Create a test configuration
    const configName = `Test Config ${new Date().toLocaleTimeString()}`;
    const configDescription = 'Created by test script to verify the fix';
    const configId = uuidv4();
    const timestamp = new Date().toISOString();
    
    console.log(`\nCreating test configuration: "${configName}"`);
    
    // Setup paths
    const configDir = path.join(__dirname, 'configurations');
    const configPath = path.join(configDir, configId);
    
    // Make sure the config directory exists
    await fs.ensureDir(configDir);
    
    // Create directories for this configuration
    console.log(`Creating configuration directory: ${configPath}`);
    await fs.ensureDir(configPath);
    
    // Define source paths relative to project root
    // Since we're in swgemu-config-editor, we need to go up one level to find the config dirs
    const projectRoot = path.join(__dirname, '..');  // Go up to get to swgemu-manager root
    
    // Note: conf directory is intentionally excluded as it should not be part of 
    // the saved configurations
    const configSources = [
      { source: path.join(projectRoot, 'player_manager'), dest: 'player_manager' },
      { source: path.join(projectRoot, 'loot_manager'), dest: 'loot_manager' },
      { source: path.join(projectRoot, 'mission_manager'), dest: 'mission_manager' },
      { source: path.join(projectRoot, 'planet_manager'), dest: 'planet_manager' },
      { source: path.join(projectRoot, 'player_creation_manager'), dest: 'player_creation_manager' },
      { source: path.join(projectRoot, 'commands'), dest: 'commands' }
    ];
    
    console.log(`Project root directory: ${projectRoot}`);
    
    // Array to track files
    let files = [];
    let filesCopied = 0;
    
    // Helper function to get all files recursively
    async function getFilesRecursively(dir) {
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
    
    // Copy all config files
    for (const source of configSources) {
      console.log(`\nProcessing source: ${source.source}`);
      
      if (await fs.pathExists(source.source)) {
        const destPath = path.join(configPath, source.dest);
        console.log(`Copying from ${source.source} to ${destPath}`);
        
        // Create destination directory
        await fs.ensureDir(destPath);
        
        try {
          // Copy files
          await fs.copy(source.source, destPath, {
            overwrite: true,
            recursive: true,
            preserveTimestamps: true
          });
          
          // Track files for reference
          const sourceFiles = await getFilesRecursively(source.source);
          filesCopied += sourceFiles.length;
          
          // Store relative paths for each file
          const relativeSourceFiles = sourceFiles.map(filePath => 
            path.join(source.dest, path.relative(source.source, filePath))
          );
          
          console.log(`Adding ${relativeSourceFiles.length} files to tracking`);
          files.push(...relativeSourceFiles);
          
        } catch (error) {
          console.error(`Error copying files: ${error.message}`);
        }
      } else {
        console.log(`Source path does not exist: ${source.source}`);
      }
    }
    
    console.log(`\nTotal files copied: ${filesCopied}`);
    console.log(`Total files tracked: ${files.length}`);
    
    if (files.length > 0) {
      console.log(`Sample tracked files: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
    }
    
    // Create configuration metadata
    const configMeta = {
      id: configId,
      name: configName,
      description: configDescription,
      createdAt: timestamp,
      updatedAt: timestamp,
      files
    };
    
    // Add to metadata file
    const metadataPath = path.join(configDir, 'metadata.json');
    let metadata = { configurations: [] };
    
    try {
      if (await fs.pathExists(metadataPath)) {
        const data = await fs.readFile(metadataPath, 'utf8');
        metadata = JSON.parse(data);
      }
      
      metadata.configurations.push(configMeta);
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      console.log(`Updated metadata file: ${metadataPath}`);
    } catch (error) {
      console.error(`Error updating metadata: ${error.message}`);
    }
    
    // Verify configuration directory contents
    console.log('\n=== Verification ===');
    if (await fs.pathExists(configPath)) {
      console.log('✅ Configuration directory exists');
      
      // Check subdirectories
      const subdirs = [
        'conf',
        'player_manager',
        'loot_manager',
        'mission_manager',
        'planet_manager',
        'player_creation_manager',
        'commands'
      ];
      
      let totalTopLevelFiles = 0;
      
      for (const dir of subdirs) {
        const dirPath = path.join(configPath, dir);
        const exists = await fs.pathExists(dirPath);
        
        console.log(`${exists ? '✅' : '❌'} ${dir}: ${exists ? 'exists' : 'missing'}`);
        
        if (exists) {
          try {
            const files = await fs.readdir(dirPath);
            console.log(`  Contains ${files.length} entries at top level`);
            
            // For commands, there should be many files
            if (dir === 'commands' && files.length < 50) {
              console.log('  ⚠️ Warning: commands directory has fewer files than expected');
            }
            
            totalTopLevelFiles += files.length;
          } catch (err) {
            console.log(`  Error reading directory: ${err.message}`);
          }
        }
      }
      
      console.log(`\nTotal files at top level: ${totalTopLevelFiles}`);
      
      if (totalTopLevelFiles === 0) {
        console.log('❌ No files were copied to the configuration directory');
      } else if (totalTopLevelFiles < files.length) {
        console.log(`⚠️ Fewer files at top level (${totalTopLevelFiles}) than tracked in metadata (${files.length})`);
        console.log('  This is normal because we count files recursively in metadata but only showing top level here');
      } else {
        console.log('✅ Files were successfully copied to the configuration directory');
      }
    } else {
      console.log('❌ Configuration directory does not exist');
    }
    
    console.log('\nTest completed successfully');
    return true;
  } catch (error) {
    console.error('\nTest failed with error:', error);
    return false;
  }
}

// Run the test
testConfigSave();

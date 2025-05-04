// Monitor script to watch for configuration save operations
const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');

// Configuration directory
const configDir = path.join(__dirname, 'configurations');
const metadataPath = path.join(configDir, 'metadata.json');

// Helper to read metadata file
async function readMetadata() {
  try {
    const data = await fs.readFile(metadataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading metadata:', error);
    return { configurations: [] };
  }
}

// Helper to check configuration directory
async function checkConfigurationDirectory(configId) {
  const configPath = path.join(configDir, configId);
  console.log(`\nAnalyzing configuration directory: ${configPath}`);
  
  try {
    if (!await fs.pathExists(configPath)) {
      console.log('❌ Configuration directory does not exist');
      return false;
    }
    
    console.log('✅ Configuration directory exists');
    
    // Check subdirectories
    const subDirs = [
      'conf',
      'player_manager',
      'loot_manager',
      'mission_manager',
      'planet_manager',
      'player_creation_manager',
      'commands'
    ];
    
    let totalFiles = 0;
    
    for (const dir of subDirs) {
      const dirPath = path.join(configPath, dir);
      const exists = await fs.pathExists(dirPath);
      
      console.log(`${exists ? '✅' : '❌'} ${dir}: ${exists ? 'exists' : 'missing'}`);
      
      if (exists) {
        // List files in this directory recursively
        const files = await getFilesRecursively(dirPath);
        console.log(`   Contains ${files.length} files`);
        totalFiles += files.length;
        
        if (files.length > 0) {
          console.log(`   Sample files: ${files.slice(0, 3).map(f => path.basename(f)).join(', ')}${files.length > 3 ? '...' : ''}`);
        }
      }
    }
    
    console.log(`\nTotal files in configuration: ${totalFiles}`);
    return totalFiles > 0;
    
  } catch (error) {
    console.error('Error checking config directory:', error);
    return false;
  }
}

// Helper to get all files recursively
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

// Main monitoring function
async function monitorConfigurations() {
  console.log('🔍 SWGEmu Config Editor - Configuration Monitor');
  console.log('==============================================');
  
  // Initial check
  let lastConfigCount = 0;
  let metadata = await readMetadata();
  console.log(`Found ${metadata.configurations.length} configurations in metadata`);
  lastConfigCount = metadata.configurations.length;
  
  // Check existing configurations
  if (metadata.configurations.length > 0) {
    for (const config of metadata.configurations) {
      console.log(`\n📁 Configuration: ${config.name} (${config.id})`);
      console.log(`   Created: ${new Date(config.createdAt).toLocaleString()}`);
      console.log(`   Files tracked in metadata: ${config.files.length}`);
      
      if (config.files.length > 0) {
        console.log(`   Sample tracked files: ${config.files.slice(0, 3).join(', ')}${config.files.length > 3 ? '...' : ''}`);
      } else {
        console.log('   ⚠️ No files tracked in metadata!');
      }
      
      const configDirExists = await checkConfigurationDirectory(config.id);
      if (!configDirExists) {
        console.log('   ⚠️ Configuration directory missing or empty despite being in metadata!');
      }
    }
  }
  
  // Setup polling for changes
  console.log('\n👀 Monitoring for new configurations...');
  console.log('(Press Ctrl+C to stop monitoring)\n');
  
  const interval = setInterval(async () => {
    try {
      metadata = await readMetadata();
      
      if (metadata.configurations.length > lastConfigCount) {
        console.log(`\n✨ Detected new configuration! Total now: ${metadata.configurations.length}`);
        
        // Check the newest configuration
        const newConfig = metadata.configurations[metadata.configurations.length - 1];
        console.log(`\n📁 New Configuration: ${newConfig.name} (${newConfig.id})`);
        console.log(`   Created: ${new Date(newConfig.createdAt).toLocaleString()}`);
        console.log(`   Files tracked in metadata: ${newConfig.files.length}`);
        
        if (newConfig.files.length > 0) {
          console.log(`   Sample tracked files: ${newConfig.files.slice(0, 3).join(', ')}${newConfig.files.length > 3 ? '...' : ''}`);
        } else {
          console.log('   ⚠️ No files tracked in metadata!');
        }
        
        const configDirExists = await checkConfigurationDirectory(newConfig.id);
        if (!configDirExists) {
          console.log('   ⚠️ Configuration directory missing or empty!');
        } else {
          console.log('   ✅ Configuration directory exists and contains files');
        }
        
        lastConfigCount = metadata.configurations.length;
      }
    } catch (error) {
      console.error('Error during monitoring:', error);
    }
  }, 2000); // Check every 2 seconds
  
  // Handle script termination
  process.on('SIGINT', () => {
    clearInterval(interval);
    console.log('\nMonitoring stopped.');
    process.exit(0);
  });
}

// Start monitoring
monitorConfigurations();

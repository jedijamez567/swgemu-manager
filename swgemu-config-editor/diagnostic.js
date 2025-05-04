// SWGEmu Configuration Diagnostic Script
const path = require('path');
const fs = require('fs-extra');

console.log('SWGEmu Configuration Diagnostic Tool');
console.log('===================================');
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

// Configuration directory
const configDir = path.join(__dirname, 'configurations');
console.log('Configuration directory:', configDir);
console.log('Exists:', fs.existsSync(configDir));

// Read metadata
try {
  const metadataPath = path.join(configDir, 'metadata.json');
  console.log('\nChecking metadata file:', metadataPath);
  console.log('Exists:', fs.existsSync(metadataPath));
  
  if (fs.existsSync(metadataPath)) {
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    console.log('\nFound configurations:', metadata.configurations.length);
    
    // Check each configuration
    for (const config of metadata.configurations) {
      console.log('\n==================================');
      console.log(`Configuration: ${config.name} (${config.id})`);
      console.log('Created:', new Date(config.createdAt).toLocaleString());
      console.log('Files tracked in metadata:', config.files.length);
      
      // Check if config directory exists
      const configPath = path.join(configDir, config.id);
      console.log(`Configuration directory: ${configPath}`);
      console.log(`Directory exists: ${fs.existsSync(configPath)}`);
      
      // Check for source directories
      if (fs.existsSync(configPath)) {
        console.log('\nChecking for source directories:');
        const dirs = [
          'conf',
          'player_manager',
          'loot_manager',
          'mission_manager',
          'planet_manager',
          'player_creation_manager',
          'commands'
        ];
        
        for (const dir of dirs) {
          const dirPath = path.join(configPath, dir);
          const exists = fs.existsSync(dirPath);
          console.log(`- ${dir}: ${exists ? 'exists' : 'missing'}`);
          
          if (exists) {
            try {
              const files = fs.readdirSync(dirPath);
              console.log(`  Contains ${files.length} entries`);
              if (files.length > 0) {
                console.log(`  First few files: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
              }
            } catch (err) {
              console.log(`  Error reading directory: ${err.message}`);
            }
          }
        }
      }
    }
  }
} catch (error) {
  console.error('Error reading metadata:', error);
}

// Check source paths
console.log('\nChecking source directories:');
const projectRoot = process.cwd();
const sources = [
  { path: path.join(projectRoot, 'conf'), name: 'conf' },
  { path: path.join(projectRoot, 'player_manager'), name: 'player_manager' },
  { path: path.join(projectRoot, 'loot_manager'), name: 'loot_manager' },
  { path: path.join(projectRoot, 'mission_manager'), name: 'mission_manager' },
  { path: path.join(projectRoot, 'planet_manager'), name: 'planet_manager' },
  { path: path.join(projectRoot, 'player_creation_manager'), name: 'player_creation_manager' },
  { path: path.join(projectRoot, 'commands'), name: 'commands' }
];

for (const source of sources) {
  console.log(`\nSource: ${source.name}`);
  console.log(`Path: ${source.path}`);
  console.log(`Exists: ${fs.existsSync(source.path)}`);
  
  if (fs.existsSync(source.path)) {
    try {
      const files = fs.readdirSync(source.path);
      console.log(`Contains ${files.length} entries`);
      if (files.length > 0) {
        console.log(`First few files: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
        
        // Check a sample file for size
        if (files.length > 0) {
          const sampleFile = path.join(source.path, files[0]);
          if (fs.existsSync(sampleFile) && fs.statSync(sampleFile).isFile()) {
            const stats = fs.statSync(sampleFile);
            console.log(`Sample file (${files[0]}) size: ${stats.size} bytes`);
          }
        }
      }
    } catch (err) {
      console.log(`Error reading directory: ${err.message}`);
    }
  }
}

console.log('\nDiagnostic complete');

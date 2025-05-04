const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const isDev = require('electron-is-dev');
const { exec } = require('child_process');
const { v4: uuidv4 } = require('uuid');

let mainWindow;

// Get the root path of the application
function getAppRootPath() {
  // In development, __dirname points to /public folder
  // In production, __dirname points to /resources/app.asar/build
  const isDev = require('electron-is-dev');
  if (isDev) {
    return path.join(__dirname, '..');
  } else {
    return path.join(__dirname, '../..');
  }
}

// Application root path
const appRootPath = getAppRootPath();
console.log(`[PATH DEBUG] App root path: ${appRootPath}`);

// Configuration directory - use local project directory for easier access
const configDir = path.join(appRootPath, 'configurations');
console.log(`[PATH DEBUG] Configuration directory: ${configDir}`);

// Ensure configuration directory exists
if (!fs.existsSync(configDir)) {
  console.log(`[PATH DEBUG] Creating configuration directory: ${configDir}`);
  fs.mkdirSync(configDir, { recursive: true });
}

// Path to configurations metadata file
const configMetadataPath = path.join(configDir, 'metadata.json');

// Initialize empty metadata file if it doesn't exist
if (!fs.existsSync(configMetadataPath)) {
  fs.writeFileSync(configMetadataPath, JSON.stringify({ configurations: [] }, null, 2));
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, 'icon.png'),
  });

  // Load the index.html from either dev server or built file
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // Open DevTools if in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers for file operations
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('write-file', async (event, { filePath, content }) => {
  try {
    await fs.writeFile(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-directory-contents', async (event, dirPath) => {
  try {
    const contents = await fs.readdir(dirPath, { withFileTypes: true });
    const result = contents.map(item => ({
      name: item.name,
      isDirectory: item.isDirectory(),
      path: path.join(dirPath, item.name)
    }));
    return { success: true, contents: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('create-backup', async (event, filePath) => {
  try {
    const backupPath = `${filePath}.backup-${new Date().toISOString().replace(/:/g, '-')}`;
    await fs.copy(filePath, backupPath);
    return { success: true, backupPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-open-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Lua Files', extensions: ['lua'] }]
  });
  return result;
});

ipcMain.handle('show-save-dialog', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [{ name: 'Lua Files', extensions: ['lua'] }]
  });
  return result;
});

// Docker command utility function
function runDockerCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return reject(error);
      }
      
      if (stderr) {
        console.warn(`Command stderr: ${stderr}`);
      }
      
      resolve(stdout);
    });
  });
}

// Docker server status handler
ipcMain.handle('docker-status', async () => {
  try {
    // Check if container is running
    const stdout = await runDockerCommand('docker ps --filter "name=swgemu_server" --format "{{.Status}}"');
    
    if (stdout.trim()) {
      const uptimeMatch = stdout.match(/Up (.*)/);
      const uptime = uptimeMatch ? uptimeMatch[1] : 'Unknown';
      
      // Get more detailed info
      const detailsStr = await runDockerCommand('docker inspect swgemu_server');
      const details = JSON.parse(detailsStr)[0];
      
      return { 
        running: true, 
        uptime,
        containerInfo: details
      };
    } else {
      return { running: false };
    }
  } catch (error) {
    console.error('Error checking server status:', error);
    return { running: false, error: error.message };
  }
});

// Docker restart handler
ipcMain.handle('docker-restart', async () => {
  try {
    await runDockerCommand('docker-compose restart swgemu');
    return { success: true, message: 'Server restarted successfully' };
  } catch (error) {
    console.error('Error restarting server:', error);
    return { success: false, message: `Failed to restart server: ${error.message}` };
  }
});

// Docker stop handler
ipcMain.handle('docker-stop', async () => {
  try {
    await runDockerCommand('docker-compose stop swgemu');
    return { success: true, message: 'Server stopped successfully' };
  } catch (error) {
    console.error('Error stopping server:', error);
    return { success: false, message: `Failed to stop server: ${error.message}` };
  }
});

// Docker start handler
ipcMain.handle('docker-start', async () => {
  try {
    await runDockerCommand('docker-compose start swgemu');
    return { success: true, message: 'Server started successfully' };
  } catch (error) {
    console.error('Error starting server:', error);
    return { success: false, message: `Failed to start server: ${error.message}` };
  }
});

// Docker logs handler
ipcMain.handle('docker-logs', async (event, { lines = 100 } = {}) => {
  try {
    // Get logs from the swgemu container with specified number of lines
    const stdout = await runDockerCommand(`docker logs --tail ${lines} swgemu_server`);
    return { success: true, logs: stdout };
  } catch (error) {
    console.error('Error retrieving server logs:', error);
    return { success: false, logs: '', message: `Failed to retrieve logs: ${error.message}` };
  }
});

// Store active log streaming processes
let activeLogStreams = new Map();

// Docker logs streaming handler
ipcMain.handle('docker-logs-stream-start', async (event, { clientId } = {}) => {
  try {
    // If already streaming for this client, stop it first
    if (activeLogStreams.has(clientId)) {
      const { process } = activeLogStreams.get(clientId);
      process.kill();
      activeLogStreams.delete(clientId);
    }
    
    // Start a new streaming process
    const { spawn } = require('child_process');
    const logProcess = spawn('docker', ['logs', '--follow', '--tail', '10', 'swgemu_server'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    // Send logs to renderer as they come in
    const streamId = clientId || Date.now().toString();
    
    // Handle data from stdout
    logProcess.stdout.on('data', (data) => {
      if (event.sender.isDestroyed()) {
        // Window was closed, clean up
        if (activeLogStreams.has(streamId)) {
          logProcess.kill();
          activeLogStreams.delete(streamId);
        }
        return;
      }
      
      // Send log data to renderer process
      event.sender.send(`docker-logs-stream-data-${streamId}`, {
        logs: data.toString(),
        error: false
      });
    });
    
    // Handle data from stderr
    logProcess.stderr.on('data', (data) => {
      if (!event.sender.isDestroyed()) {
        event.sender.send(`docker-logs-stream-data-${streamId}`, {
          logs: data.toString(),
          error: true
        });
      }
    });
    
    // Store the process reference for later cleanup
    activeLogStreams.set(streamId, {
      process: logProcess,
      sender: event.sender
    });
    
    return { success: true, streamId };
  } catch (error) {
    console.error('Error starting log stream:', error);
    return { success: false, message: `Failed to start log streaming: ${error.message}` };
  }
});

// Stop log streaming
ipcMain.handle('docker-logs-stream-stop', async (event, { streamId } = {}) => {
  try {
    if (activeLogStreams.has(streamId)) {
      const { process } = activeLogStreams.get(streamId);
      process.kill();
      activeLogStreams.delete(streamId);
      return { success: true, message: 'Log streaming stopped' };
    }
    return { success: false, message: 'No active stream found with the provided ID' };
  } catch (error) {
    console.error('Error stopping log stream:', error);
    return { success: false, message: `Failed to stop log streaming: ${error.message}` };
  }
});

// Clean up any active log streams when the window is closed
app.on('window-all-closed', () => {
  for (const [streamId, { process }] of activeLogStreams.entries()) {
    process.kill();
  }
  activeLogStreams.clear();
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Get the absolute path to the project root
// In Docker setup, config files are in the parent directory of the app
// The root directory should be where docker-compose.yml is located

// Function to determine the project root directory
function getProjectRoot() {
  // First try: process.cwd() which is where the app was launched from
  const cwd = process.cwd();
  
  // Check if docker-compose.yml exists in current directory
  if (fs.existsSync(path.join(cwd, 'docker-compose.yml'))) {
    return cwd;
  }
  
  // Second try: Go up one level from app directory (common setup)
  const appDir = isDev ? 
    path.join(__dirname, '..') :  // Development: public/ -> app root
    path.join(__dirname, '../..'); // Production: resources/app/ -> app root
    
  const parentDir = path.join(appDir, '..');
  if (fs.existsSync(path.join(parentDir, 'docker-compose.yml'))) {
    return parentDir;
  }
  
  // Fallback to cwd if we can't find a better location
  return cwd;
}

const projectRoot = getProjectRoot();
console.log(`[PATH DEBUG] Project root resolved to: ${projectRoot}`);
console.log(`[PATH DEBUG] __dirname is: ${__dirname}`);
console.log(`[PATH DEBUG] process.cwd() is: ${process.cwd()}`);

// Configuration related file paths
// These paths are relative to the project root (usually where docker-compose.yml is)
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

// Print the resolved source paths
console.log('[PATH DEBUG] Resolved configuration source paths:');
configSources.forEach(source => {
  console.log(`  - Source: ${source.source} -> Dest: ${source.dest}`);
  
  // Check if path exists
  if (fs.existsSync(source.source)) {
    console.log(`    Path exists`);
  } else {
    console.log(`    PATH DOES NOT EXIST! This will cause apply failures.`);
  }
});

// Debug log function
function logDebug(message, data = null) {
  console.log(`[CONFIG MANAGER] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Helper to read metadata file
async function readConfigMetadata() {
  try {
    const data = await fs.readFile(configMetadataPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading config metadata:', error);
    return { configurations: [] };
  }
}

// Helper to write metadata file
async function writeConfigMetadata(metadata) {
  try {
    await fs.writeFile(configMetadataPath, JSON.stringify(metadata, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing config metadata:', error);
    return false;
  }
}

// Save configuration handler
ipcMain.handle('config-save', async (event, { name, description }) => {
  try {
    logDebug(`Saving configuration with name: ${name}`);
    
    const metadata = await readConfigMetadata();
    const configId = uuidv4();
    const timestamp = new Date().toISOString();
    
    // Create config directory
    const configPath = path.join(configDir, configId);
    logDebug(`Creating config directory at: ${configPath}`);
    
    // Ensure the directory exists
    try {
      await fs.ensureDir(configPath);
      logDebug(`Config directory created successfully`);
    } catch (err) {
      logDebug(`Error creating config directory: ${err.message}`);
      throw err;
    }
    
    // Copy all config files
    let files = [];
    let filesCopied = 0;
    
    // Get all files recursively helper function
    const getFilesRecursively = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        return entry.isDirectory() ? 
          await getFilesRecursively(fullPath) : 
          fullPath;
      }));
      return files.flat();
    };
    
    for (const source of configSources) {
      logDebug(`Checking source: ${source.source}`);
      
      if (await fs.pathExists(source.source)) {
        const destPath = path.join(configPath, source.dest);
        logDebug(`Copying from ${source.source} to ${destPath}`);
        
        // Ensure destination directory exists
        try {
          await fs.ensureDir(destPath);
          logDebug(`Destination directory created: ${destPath}`);
        } catch (err) {
          logDebug(`Error creating destination directory: ${err.message}`);
          throw err;
        }
        
        // Perform the actual copy
        try {
          await fs.copy(source.source, destPath, {
            overwrite: true,
            recursive: true,
            preserveTimestamps: true
          });
          logDebug(`Copy operation completed for ${source.dest}`);
        } catch (err) {
          logDebug(`Error during copy operation: ${err.message}`);
          logDebug(`Error stack: ${err.stack}`);
          throw err;
        }
        
        // Track files for reference (recursively)
        try {
          const sourceFiles = await getFilesRecursively(source.source);
          filesCopied += sourceFiles.length;
          
          // Store relative paths for each file
          const relativeSourceFiles = sourceFiles.map(filePath => 
            path.join(source.dest, path.relative(source.source, filePath))
          );
          
          // Debug: Print the relative paths we're tracking
          logDebug(`Adding ${relativeSourceFiles.length} files to the files array`);
          if (relativeSourceFiles.length > 0) {
            logDebug(`Sample tracked files: ${relativeSourceFiles.slice(0, 3).join(', ')}${relativeSourceFiles.length > 3 ? '...' : ''}`);
          }
          
          files.push(...relativeSourceFiles);
          
          logDebug(`Copied ${sourceFiles.length} files from ${source.dest}`);
        } catch (err) {
          logDebug(`Error tracking files in ${source.source}: ${err.message}`);
        }
      } else {
        logDebug(`Source path does not exist: ${source.source}`);
      }
    }
    
    logDebug(`Total files copied: ${filesCopied}`);
    
    // Debug: Log the total number of files tracked
    logDebug(`Total files tracked: ${files.length}`);
    if (files.length === 0) {
      logDebug('WARNING: No files were tracked despite successful copies!');
    } else {
      logDebug(`Sample files in metadata: ${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''}`);
    }
    
    // Create configuration metadata
    const configMeta = {
      id: configId,
      name,
      description,
      createdAt: timestamp,
      updatedAt: timestamp,
      files
    };
    
    // Add to metadata file
    metadata.configurations.push(configMeta);
    await writeConfigMetadata(metadata);
    
    return { success: true, configuration: configMeta };
  } catch (error) {
    console.error('Error saving configuration:', error);
    return { success: false, error: error.message };
  }
});

// List configurations handler
ipcMain.handle('config-list', async () => {
  try {
    const metadata = await readConfigMetadata();
    return { success: true, configurations: metadata.configurations };
  } catch (error) {
    console.error('Error listing configurations:', error);
    return { success: false, error: error.message };
  }
});

// Get configuration details handler
ipcMain.handle('config-details', async (event, id) => {
  try {
    const metadata = await readConfigMetadata();
    const config = metadata.configurations.find(c => c.id === id);
    
    if (!config) {
      return { success: false, error: 'Configuration not found' };
    }
    
    return { success: true, configuration: config };
  } catch (error) {
    console.error('Error getting configuration details:', error);
    return { success: false, error: error.message };
  }
});

// Apply configuration handler
ipcMain.handle('config-apply', async (event, id) => {
  try {
    logDebug(`Applying configuration with ID: ${id}`);
    
    const metadata = await readConfigMetadata();
    const config = metadata.configurations.find(c => c.id === id);
    
    if (!config) {
      logDebug('Configuration not found');
      return { success: false, message: 'Configuration not found' };
    }
    
    const configPath = path.join(configDir, id);
    logDebug(`Configuration path: ${configPath}`);
    
    if (!await fs.pathExists(configPath)) {
      logDebug('Configuration directory does not exist');
      return { success: false, message: 'Configuration directory not found' };
    }
    
    // Track successfully copied files and any errors
    const results = {
      success: [],
      failures: []
    };
    
    // Copy all config files back to original locations
    for (const source of configSources) {
      const sourcePath = path.join(configPath, source.dest);
      logDebug(`Checking source path: ${sourcePath}`);
      
      if (await fs.pathExists(sourcePath)) {
        try {
          logDebug(`Copying from ${sourcePath} to ${source.source}`);
          
          // Ensure target directory exists
          await fs.ensureDir(source.source);
          
          // Use copySync to copy entire directories recursively
          await fs.copy(sourcePath, source.source, { 
            overwrite: true,
            recursive: true,
            preserveTimestamps: true,
            errorOnExist: false
          });
          
          // Get all files that were copied for tracking
          const getFilesRecursively = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            const files = await Promise.all(entries.map(async (entry) => {
              const fullPath = path.join(dir, entry.name);
              return entry.isDirectory() ? 
                await getFilesRecursively(fullPath) : 
                fullPath;
            }));
            return files.flat();
          };
          
          const copiedFiles = await getFilesRecursively(source.source);
          
          logDebug(`Copied ${copiedFiles.length} files from ${source.dest} configuration`);
          results.success.push(...copiedFiles);
          
        } catch (err) {
          logDebug(`Error copying ${source.dest}:`, err);
          results.failures.push({ path: source.source, error: err.message });
        }
      } else {
        logDebug(`Source path does not exist: ${sourcePath}`);
      }
    }
    
    // Check if we had any successful copies
    if (results.success.length === 0) {
      logDebug('No files were copied successfully');
      return { 
        success: false, 
        message: `Failed to apply configuration "${config.name}": No files were copied` 
      };
    }
    
    // If we had some failures but some successes, return partial success
    if (results.failures.length > 0) {
      logDebug('Some files failed to copy', results.failures);
      return { 
        success: true, 
        partial: true,
        message: `Configuration "${config.name}" partially applied. ${results.success.length} files copied, ${results.failures.length} failed.`,
        details: results
      };
    }
    
    logDebug(`Successfully applied configuration "${config.name}"`);
    return { 
      success: true, 
      message: `Configuration "${config.name}" applied successfully. ${results.success.length} files copied.`,
      details: results
    };
  } catch (error) {
    console.error('Error applying configuration:', error);
    return { success: false, message: `Failed to apply configuration: ${error.message}` };
  }
});

// Delete configuration handler
ipcMain.handle('config-delete', async (event, id) => {
  try {
    const metadata = await readConfigMetadata();
    const configIndex = metadata.configurations.findIndex(c => c.id === id);
    
    if (configIndex === -1) {
      return { success: false, message: 'Configuration not found' };
    }
    
    // Remove from metadata
    const config = metadata.configurations[configIndex];
    metadata.configurations.splice(configIndex, 1);
    await writeConfigMetadata(metadata);
    
    // Delete directory
    const configPath = path.join(configDir, id);
    await fs.remove(configPath);
    
    return { success: true, message: `Configuration "${config.name}" deleted successfully` };
  } catch (error) {
    console.error('Error deleting configuration:', error);
    return { success: false, message: `Failed to delete configuration: ${error.message}` };
  }
});

// Update configuration metadata handler
ipcMain.handle('config-update', async (event, { id, name, description }) => {
  try {
    const metadata = await readConfigMetadata();
    const configIndex = metadata.configurations.findIndex(c => c.id === id);
    
    if (configIndex === -1) {
      return { success: false, error: 'Configuration not found' };
    }
    
    // Update metadata
    if (name) metadata.configurations[configIndex].name = name;
    if (description) metadata.configurations[configIndex].description = description;
    metadata.configurations[configIndex].updatedAt = new Date().toISOString();
    
    await writeConfigMetadata(metadata);
    
    return { success: true, configuration: metadata.configurations[configIndex] };
  } catch (error) {
    console.error('Error updating configuration:', error);
    return { success: false, error: error.message };
  }
});

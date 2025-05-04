# SWGEmu Configuration Manager - Server Management

This document explains how the Server Management functionality works and how to troubleshoot common issues.

## How Configuration Management Works

The server management feature allows you to save and load complete server configurations. Here's how it works:

1. **Saving Configurations:**
   - When you save a configuration, the system creates a unique directory in `swgemu-config-editor/configurations/`
   - It copies all configuration files from the source directories to this unique directory
   - The configuration metadata is stored in `swgemu-config-editor/configurations/metadata.json`

2. **Applying Configurations:**
   - When you apply a configuration, the system copies the saved files back to their original locations
   - The server needs to be restarted for changes to take effect

## Source Directories

The following directories are tracked by the configuration system:

- `conf/` - Main configuration files
- `player_manager/` - Player management settings
- `loot_manager/` - Loot drop settings
- `mission_manager/` - Mission system settings
- `planet_manager/` - Planet configuration
- `player_creation_manager/` - Player creation settings
- `commands/` - Game commands

## Troubleshooting

### Missing Configuration Files

If configuration files aren't being saved or applied properly:

1. Check the paths in the console logs (`[PATH DEBUG]` entries)
2. Ensure the application is running from the correct working directory
3. Verify the source directories exist and are accessible

### Configurations Not Applying

If configurations don't take effect after applying:

1. Make sure you restart the server after applying a configuration
2. Check the console logs for any file copy errors
3. Verify file permissions on both source and destination directories

### Recent Fixes

We recently fixed an issue where the path resolution wasn't correctly identifying the source directories. The application now uses `process.cwd()` to determine the project root, which ensures it can find the actual source files regardless of how the electron application is started.

## Diagnostic Tools

The repository includes diagnostic tools to help troubleshoot issues:

- `diagnostic.js` - Checks configuration paths and file availability
- `verify-config-paths.js` - Tests configuration path resolution
- `path-test.js` - Verifies source and destination paths

Run these tools with Node.js to troubleshoot path issues:

```
node swgemu-manager/swgemu-config-editor/diagnostic.js
```

## After Applying Fix

If you've just applied the path resolution fix, please:

1. Clear existing configurations (delete or reset metadata.json)
2. Restart the application 
3. Create new configurations
4. When applying a configuration, be sure to restart the server afterward

This ensures that the correct paths are used for both saving and applying configurations.

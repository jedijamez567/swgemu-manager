# SWGEmu Galaxy Configuration Knowledge Base

## Key Files and Locations

- **Configuration File**: `conf/config.lua`
  - This is the main configuration file where galaxy settings are defined
  - Settings are stored in the `Core3` table

- **ConfigManager Implementation**: `Core3/MMOCoreORB/src/conf/ConfigManager.cpp`
  - Responsible for loading and parsing config.lua
  - Provides access to configuration values via getter methods

- **ConfigManager Header**: `Core3/MMOCoreORB/src/conf/ConfigManager.h`
  - Defines getter methods for accessing configuration values
  - Relevant methods for galaxy configuration:
    - `getZoneGalaxyID()`
    - `getZoneGalaxyName()`
    - `getZoneGalaxyAddress()`
    - `getZoneGalaxyPort()`
    - `getZoneGalaxyPingPort()`

- **Zone Server Interface Definition**: `Core3/MMOCoreORB/src/server/zone/ZoneServer.idl`
  - Defines the ZoneServer class which contains the galaxyName member
  - Provides accessor methods:
    - `getGalaxyName()`
    - `setGalaxyName()`

- **Zone Server Implementation**: `Core3/MMOCoreORB/src/server/zone/ZoneServerImplementation.cpp`
  - Constructor now uses `config->getZoneGalaxyName()` instead of hardcoded value
  - Method `loadGalaxyName()` synchronizes galaxy settings from conf.lua to the database

- **Database Schema**: `Core3/MMOCoreORB/sql/swgemu.sql`
  - Contains the definition of the `galaxy` table:
    ```sql
    CREATE TABLE `galaxy` (
      `galaxy_id` int(5) NOT NULL AUTO_INCREMENT,
      `name` varchar(50) NOT NULL DEFAULT '',
      `address` varchar(50) NOT NULL DEFAULT '',
      `port` int(5) NOT NULL DEFAULT '0',
      `ping_port` int(5) NOT NULL DEFAULT '0',
      `population` int(4) NOT NULL DEFAULT '0',
      PRIMARY KEY (`galaxy_id`)
    )
    ```

## Class Relationships

- **ZoneServer**: Manages the entire galaxy
  - Contains `galaxyName` member variable which represents the name of the galaxy
  - Initialized in constructor from config
  - Synchronized with database in `loadGalaxyName()`

- **Zone**: Represents a single planet/zone within the galaxy
  - Contains `zoneName` member variable which identifies the specific planet (tatooine, naboo, etc.)
  - Does not have or need a galaxyName variable, as the Zone belongs to a ZoneServer
  - ZoneServer maintains a collection of Zone instances

## Configuration Flow

1. Configuration is loaded from `conf/config.lua` (and optionally `conf/config-local.lua`) by `ConfigManager::loadConfigData()`
   
2. When the ZoneServer is constructed:
   - Gets the galaxy ID from config via `config->getZoneGalaxyID()`
   - Gets the galaxy name from config via `config->getZoneGalaxyName()`
   
3. During ZoneServer initialization, in `loadGalaxyName()`:
   - Reconfirms the galaxy name from config
   - Checks if a galaxy with the configured ID exists in the database
   - If it exists but config values differ, it updates the database
   - If it doesn't exist, it inserts a new galaxy record with values from config

## Galaxy Configuration Options

In `conf/config.lua`, the following options control galaxy settings:

```lua
-- Galaxy Configuration
ZoneGalaxyID = 2, --The actual zone server's galaxyID. Should coordinate with your login server.
ZoneGalaxyName = "Core3", --Name of the galaxy as it appears in the server list
ZoneGalaxyAddress = "127.0.0.1", --Address/hostname for the galaxy
ZoneGalaxyPort = 44463, --Main port for the galaxy
ZoneGalaxyPingPort = 44462, --Ping port for the galaxy
```

## Database Interaction

The galaxy table in the database contains the following fields:
- `galaxy_id`: Unique identifier for the galaxy
- `name`: Display name of the galaxy
- `address`: IP address or hostname of the galaxy server
- `port`: Main port for the galaxy server
- `ping_port`: Port used for ping operations
- `population`: Current population count (updated by the server)

## Important Implementation Notes

1. Previously, the ZoneServerImplementation constructor had a hardcoded galaxy name:
   ```cpp
   // Old code
   galaxyName = "Core3";
   ```

2. This has been fixed to use the config value:
   ```cpp
   // New code
   galaxyName = config->getZoneGalaxyName();
   ```

3. This ensures the galaxy name from config is used consistently throughout the entire server lifecycle.

## Notes

- The system now automatically synchronizes galaxy settings from conf.lua to the database on server startup
- This eliminates the need to manually modify the database when changing galaxy settings
- Changes to galaxy settings require a server restart to take effect
- The Zone class represents individual planets and uses `zoneName`, which is different from the galaxy name
- There is no conflict between Zone and ZoneServer class hierarchies regarding galaxy configuration

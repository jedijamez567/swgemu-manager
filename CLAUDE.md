# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SWGEmu Manager is a Docker-based system for running a customized Star Wars Galaxies Emulator (SWGEmu) server on Core3. It uses volume-mounted Lua files to override Core3 defaults at runtime, enabling hot-reload configuration changes without recompilation.

## Architecture

**Docker Compose** orchestrates two services:
- **swgemu_database**: MySQL 5.7.28 (port 3306), initialized from `sql/` scripts
- **swgemu_server**: Core3 game server (multi-stage Docker build from Ubuntu 16.04), compiled with `-DENABLE_REST_SERVER=ON`

**Core design pattern**: All Lua customizations in the repo root are volume-mounted over Core3 defaults at container startup. Restart the container to pick up changes — no recompile needed unless Core3 C++ source changes.

**Core3 submodule** (`Core3/`): Custom fork at `jedijamez567/Core3` on the `custom` branch. Upstream remote `swgemu/Core3` is configured for fetching updates (`git fetch upstream && git merge upstream/unstable`). Submodule changes require a full rebuild (`docker-compose down && docker-compose up -d --build`).

## Build & Run Commands

```bash
# Start server (first run builds Core3, takes 15-30 min)
docker-compose up -d

# Hot-reload Lua changes (no recompile)
docker-compose restart swgemu

# Full rebuild (after Core3 submodule changes)
docker-compose down && docker-compose up -d --build

# View logs
docker-compose logs -f swgemu

# Database access
mysql -h localhost -u swgemu -p swgemu-sql swgemu
```

## Lua Configuration Layout

All Lua files mount over Core3 defaults in the container. Key files:

| Path | Purpose |
|------|---------|
| `conf/config.lua` | Main server config (database, network, galaxy, zones, TRE files) |
| `conf/config-local.lua` | Local overrides (REST API settings, galaxy-wide grouping) |
| `conf/features.lua` | Feature toggles (jedi system, armor, GCW) |
| `player_manager/player_manager.lua` | Player settings (XP multipliers, buffs, PvP, account limits, vehicle call delay) |
| `player_creation_manager/player_creation_manager.lua` | New character setup (starting items, species, professions, creation cooldown) |
| `mission_manager/mission_manager.lua` | Mission settings (max active missions, bounty targets, destroy rewards, factional toggles) |
| `loot_manager/loot_manager.lua` | Loot drop system (chances, rarity tiers, armor stat mods) |
| `resource_manager/resource_manager_spawns.lua` | Resource spawn data (~370K lines) |
| `jedi/` | Jedi unlock system — `hologrind_jedi_manager.lua` is primary |
| `commands/` | ~150 slash command definitions, mounted to `bin/scripts/commands/` |
| `screenplays/jedi/` | Jedi trials, padawan convos, Force shrine components |

## Server Details

- Galaxy: Chevelle (ID 2)
- Default admin: admin/admin (set in `sql/02-admin_account.sql`)
- REST API: port 44443, token in `config-local.lua`
- Ports: 44419 (ORB), 44453 (Login), 44455 (Status), 44462-44463 (Zone), 44460 (Web)

## Utility Tools

- **Server Monitor** (`swgemu-monitor/`): React/Vite dashboard for real-time server monitoring via the Core3 REST API. Run with `cd swgemu-monitor && npm install && npm run dev` (opens at `http://localhost:5173`). Displays online players, AI agents, mission stats, and server uptime. The Vite proxy forwards `/api` requests to `https://localhost:44443` with browser headers stripped (required for compatibility with the old cpprest SDK on Ubuntu 16.04).
- **Loot Generator** (`Loot Generator/`): Streamlit app for generating admin loot commands. Run with `streamlit run app.py`.
- **API Client** (`swgemu_api_client.py`): Streamlit-based REST API browser.
- **Loot Parser** (`Loot Generator/parse_loot_groups.py`): Parses Core3 loot group Lua files into `loot_database.json`.

## Core3 Engine Architecture

Core3 (`Core3/` submodule) is the SWGEmu game server engine. It has its own submodule, **Engine3** (`swgemu/engine3`), for networking/ORB/threading.

### Directory Structure

```
Core3/MMOCoreORB/
  CMakeLists.txt          # Build definition (CMake 3.7+, C++14, Clang 16+ or GCC 5.4+)
  Makefile                # Convenience wrapper (make build-ninja-debug for Docker)
  src/                    # All C++ source
    server/
      ServerCore.cpp      # Top-level initialization
      zone/               # Core gameplay logic
        Zone*.idl          # Planet zones (ground + space)
        objects/           # 24 game object types (scene, creature, player, tangible, etc.)
        managers/          # ~40 game system managers (combat, loot, jedi, crafting, etc.)
        packets/           # Network protocol definitions
      chat/               # Chat system
      login/              # Login server
      web/                # REST API server
    conf/                 # ConfigManager (reads config.lua)
    templates/            # Template data definitions
    terrain/              # Terrain processing
    tre3/                 # TRE file reader
  bin/                    # Runtime directory
    conf/                 # Default config.lua, features.lua
    scripts/              # Default Lua scripts (commands, managers, screenplays, loot, etc.)
  utils/engine3/          # Engine3 submodule
```

### IDL System

Core3 uses a custom Interface Definition Language (`.idl` files) compiled by `MMOEngine/bin/idlc`. IDL files define distributed objects (e.g., `SceneObject.idl`, `CreatureObject.idl`, `PlayerObject.idl`) and generate C++ stubs. Developers write `*Implementation.cpp` files; the IDL compiler generates the rest.

### Lua-C++ Integration

- **DirectorManager** (`src/server/zone/managers/director/`): Primary Lua-C++ bridge. Manages "screenplays" (Lua-scripted game content) with event scheduling, quest state, and observer patterns.
- **Lua binding classes**: Each major object has a `Lua*` wrapper (e.g., `LuaCreatureObject`, `LuaPlayerObject`) exposing C++ methods to Lua.
- **Command pattern**: Lua files define command parameters (damage, cost, range, animation); C++ `*Command.h` headers implement the behavior.
- **Feature toggles**: `features.lua` values are read by `Features.cpp` via `features->get("featureKey")`.

### Manager Lua Config Pattern

Each C++ manager reads its Lua config via a `loadLuaConfig()` method. The pattern for adding a new configurable value:

1. **Lua**: Add a global variable in the manager's Lua script (e.g., `bin/scripts/managers/player_creation_manager.lua`)
2. **C++ Header**: Declare a member variable in the manager's `.h` file
3. **C++ loadLuaConfig()**: Read the value using the Lua API (e.g., `lua->getGlobalInt("varName")`)

Available Lua API methods (from `Engine3/MMOEngine/src/engine/lua/Lua.h`):
- `getGlobalInt(name)` — 32-bit int
- `getGlobalLong(name)` — 64-bit int
- `getGlobalByte(name)` — byte (used for booleans: 0/1)
- `getGlobalString(name)` — string
- `getGlobalFloat(name)` — float
- `getGlobalBoolean(name)` — bool
- `getGlobalObject(name)` — Lua table (returns `LuaObject`)

Example from `PlayerCreationManager.cpp`:
```cpp
lua->runFile("scripts/managers/player_creation_manager.lua");
startingCash = lua->getGlobalInt("startingCash");
freeGodMode = lua->getGlobalByte("freeGodMode");
```

The volume-mounted Lua override takes precedence over the Core3 default, so Lua-only changes just need a container restart. C++ changes (adding the member variable / read call) require a full rebuild.

### Volume Mount Overlay

The swgemu-manager repo mounts customized Lua files over Core3's `bin/scripts/` and `bin/conf/` defaults at container runtime. This is why Lua changes only need a container restart. The mount order in docker-compose matters — specific file mounts override directory mounts.

## Admin Commands

Admin commands are gated by the **admin skill system**, not just the account's `admin_level` in the database. The SWG client only shows commands that are either in the client's base command table (TRE files) or granted via skills on the character.

### How Admin Permissions Work

1. **Account level**: Set in `accounts.admin_level` (MySQL). Admin = 15, set in `sql/02-admin_account.sql`.
2. **Permission levels**: Defined in `Core3/MMOCoreORB/bin/scripts/staff/levels/` (e.g., `admin.lua` maps level 15 to a list of ~20 admin skills).
3. **Admin skills**: Defined in `Core3/MMOCoreORB/bin/scripts/skills/staff/`. Each skill grants specific commands:
   - `admin_base` → "admin" command (enables `/setgodmode`)
   - `admin_general_admin_01` → teleport, teleportto, invulnerable, kill, setSpeed
   - `admin_general_admin_03` → object, searchCorpse
   - `admin_player_management_01` → findPlayer, gmRevive, setFaction, etc.
   - `admin_player_management_03` → credits, grantSkill, setExperience, money, etc.
4. **Skill granting**: Admin skills are granted in C++ via `PlayerManager::updatePermissionLevel()`, called only during character creation (`PlayerCreationManager.cpp`) or via `/setgodmode <name> <level>` (`SetGodModeCommand.h`).

### Troubleshooting "Command Not Found"

If admin commands show "command not found" in-game, the character is missing admin skills. This happens when the character was created before the admin account was configured, or after an ODB reset.

**Fix**: Run `/setgodmode self admin` in-game. This re-grants all admin skills for the admin permission level. You should see "Staff skill granted: ..." messages for each skill.

**Important**: `/setgodmode self on` only toggles the admin ability — it does NOT re-grant all admin skills. Use `/setgodmode self admin` for the full skill set.

### Admin Command Reference

Full list: https://app.assembla.com/wiki/show/swgemu/Admin_Command_Reference

Common commands: `/teleport`, `/object createitem`, `/credits`, `/grantSkill`, `/gmRevive`, `/findPlayer`, `/invulnerable`, `/kick`, `/freezePlayer`

## Hologrind Jedi System

The server uses the **hologrind** Jedi progression path (configured in `conf/features.lua`). Only 1 profession must be mastered (from: Brawler, Marksman, Unarmed).

### Progression Flow

1. **Master profession** → `checkIfProgressedToJedi()` awards `force_title_jedi_novice`, sets `jediState=1`, creates waypoint to nearest Force Shrine
2. **Meditate at Force Shrine** (must crouch) → `awardJediStatusAndSkill()` awards Padawan rank (`force_title_jedi_rank_02`), all `force_sensitive_*` skills, sets `jediState=2`, gives Jedi Starter Kit (crafting tool, padawan robe, crystal packs, resource deeds, color crystal)
3. **Reach 5,000 faction points** (Rebel or Imperial) + **meditate again** → `promoteToKnight()` awards Knight rank (`force_title_jedi_rank_03`), sets `jediState=4`, gives knight robe + Legendary Krayt Dragon Pearl + lightsaber crafting materials

### jediState and Skill Visibility

Jedi skill visibility is gated by `jediState` in `SkillManager.cpp` — each skill has a `jediStateRequired` property:

| jediState | Meaning | Skills Visible |
|-----------|---------|---------------|
| 0 | Not Force Sensitive | None |
| 1 | Awaiting meditation | None (has `force_title_jedi_novice` for shrine interaction only) |
| 2 | Padawan | `force_sensitive_*` (passive enhancements) |
| 4 | Jedi Knight (Light) | `force_sensitive_*` + `force_discipline_*` (lightsaber, Force powers, healing) |
| 8 | Jedi Knight (Dark) | Same as 4 |

### Lua Item Granting

- **`giveItem(pInventory, templatePath, -1)`** — creates an object from an IFF template directly. Works for equipment, components, deeds.
- **`createLoot(pInventory, lootGroupName, level)`** — creates an item through the loot system, which applies crafting values (e.g., color attributes on crystals). Use this for items that need loot-system properties.
- **No Lua API for filled resource containers** — `givePlayerResource()` exists in C++ (`ResourceManagerImplementation.cpp`) but is not exposed to Lua. Use Resource Deeds (`object/tangible/veteran_reward/resource.iff`) instead; each gives 30,000 units of a player-selected resource.

## Important Notes

- TRE files must be manually placed in `./tre/` (not version controlled, ~2+ GB)
- `resource_manager_spawns.lua` is extremely large — avoid reading the entire file
- Lua command files follow the pattern: `CommandName = { name = "commandname" }; AddCommand(CommandName)`
- The Jedi system is configured in `conf/features.lua` via `jediSystem` (options: hologrind, village, custom)
- The Core3 REST API uses an old cpprest SDK (Ubuntu 16.04, ~v2.8). HTTP proxies must strip modern browser headers or the SDK's low-level parser rejects requests with 400 before application code runs. The Vite proxy in `swgemu-monitor/vite.config.ts` handles this.

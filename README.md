# SWGEmu Manager

Dockerized [SWGEmu](https://www.swgemu.com/) server built on [Core3](https://github.com/swgemu/Core3). Spin up a full server (Core3 + MySQL) with `docker-compose up`.

## Quick Start

1. **Clone with submodules:**
   ```bash
   git clone --recurse-submodules git@github.com:jedijamez567/swgemu-manager.git
   ```

2. **Add `tre` files** from your SWG client install into the `./tre` directory. Required files are listed in `Core3/MMOCoreORB/bin/conf/config.lua`.

3. **Build and run:**
   ```bash
   docker-compose up -d
   ```
   First build takes 15-30 minutes. The server will generate navmesh data on first run (cached for future starts).

4. **Login** via the SWGEmu Launchpad (set server to `local`):
   ```
   user: admin
   pass: admin
   ```

## Project Structure

All gameplay customizations live in the root directory. At container startup, `docker-compose` volume-mounts these files/directories directly over their counterparts inside the compiled Core3 image. This means you can change any Lua config, manager script, or screenplay and just restart the container — no recompile needed.

| Directory / File | Mounts Over (in container) | Purpose |
|---|---|---|
| `conf/` | `bin/conf/` | Server config, features, admin/ban lists, MOTD, SSL |
| `commands/` | `bin/scripts/commands/` | Slash command definitions |
| `player_creation_manager/` | `bin/scripts/managers/player_creation_manager.lua` | Starting inventory, species, professions |
| `player_manager/` | `bin/scripts/managers/player_manager.lua` | Player management settings |
| `loot_manager/` | `bin/scripts/managers/loot_manager.lua` | Loot tables and drop rates |
| `resource_manager/` | `bin/scripts/managers/resource_manager_spawns.lua` | Resource spawn config |
| `mission_manager/` | `bin/scripts/managers/mission/mission_manager.lua` | Mission settings |
| `planet_manager/` | `bin/scripts/managers/planet_manager.lua` | Planet/zone settings |
| `jedi/` | `bin/scripts/managers/jedi/` | Jedi unlock system |
| `screenplays/` | `bin/scripts/screenplays/jedi/` | Screenplay overrides |
| `sql/` | MySQL init scripts | Database seed (admin account, schema) |
| `tre/` | SWG client data | Game `tre` files (not committed) |
| `log/` | `bin/log/` | Server logs (persisted) |
| `navmeshes/` | `bin/navmeshes/` | Navmesh cache (persisted) |
| `databases/` | `bin/databases/` | Runtime databases (persisted) |

## Core3 Submodule Workflow

The `Core3` submodule points to a [personal fork](https://github.com/jedijamez567/Core3) on the `custom` branch. This branch contains modifications that allow Core3 to read configs from the root directory. The official repo (`swgemu/Core3`) is kept as the `origin` remote so upstream changes can be merged in.

**Pulling upstream updates:**
```bash
cd Core3
git fetch origin
git merge origin/unstable
git push myfork custom
cd ..
git add Core3
git commit -m "update Core3 from upstream"
```

**Remotes inside `Core3/`:**
- `origin` — official `swgemu/Core3` (read-only, for fetching updates)
- `myfork` — `jedijamez567/Core3` (your fork, where `custom` branch lives)

## Server Management

- **MySQL:** Connect to `localhost:3306` (root password in `docker-compose.yml`)
- **REST API:** See [REST_API_SETUP.md](REST_API_SETUP.md)
- **Admin commands:** Full list at [SWGAdmin Commands](https://drive.google.com/file/d/0BwjBDOFpOsM5OEVuMDh1U3BDYnM/view)

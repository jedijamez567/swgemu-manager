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

The `Core3` submodule points to a [personal fork](https://github.com/jedijamez567/Core3) on the `custom` branch. This branch contains modifications that allow Core3 to read configs from the root directory. The official repo (`swgemu/Core3`) is added as the `upstream` remote so upstream changes can be merged in.

**Cloning on a new host:**
```bash
git clone --recurse-submodules https://github.com/jedijamez567/swgemu-manager.git
cd swgemu-manager/Core3
git checkout custom
git remote add upstream https://github.com/swgemu/Core3.git
```

**Pulling upstream updates:**
```bash
cd Core3
git fetch upstream
git merge upstream/unstable
git push origin custom
cd ..
git add Core3
git commit -m "Update Core3 from upstream"
```

**Remotes inside `Core3/`:**
- `origin` — `jedijamez567/Core3` (your fork, where `custom` branch lives)
- `upstream` — official `swgemu/Core3` (read-only, for fetching updates)

## Server Monitor

The `swgemu-monitor/` directory contains a React dashboard for real-time server monitoring via the Core3 REST API.

```bash
cd swgemu-monitor
npm install
npm run dev
```

Opens at `http://localhost:5173`. Displays online players, AI agent counts, mission stats, server uptime, and more. Requires the server to be running with the REST API enabled (port 44443).

## Building a Custom Client

The `modified_assets/` directory is a staging location for patched copies of
client files used to unlock behavior that is hardcoded in the stock SWG
client (and therefore cannot be overridden via TRE files or server config).

Patched binaries are **not** committed to this repository — they are
produced on demand by the build script `scripts/build_custom_client.py`,
which applies the documented `SWGEmu.exe` Jedi profession filter patch and
(optionally) stages custom TRE files and updates the client's
`swgemu_live.cfg`.

```bash
# Patch a stock client into a fresh output directory
python3 scripts/build_custom_client.py build \
    --source /path/to/stock/SWGEmu \
    --dest   ./modified_assets \
    --tre-source /path/to/custom/tres   # optional

# ...or patch an existing client install in place
python3 scripts/build_custom_client.py build \
    --source /path/to/SWGEmu \
    --in-place

# Check whether a client has already been patched
python3 scripts/build_custom_client.py verify --source /path/to/SWGEmu

# Run the built-in patcher tests (no real client needed)
python3 scripts/build_custom_client.py self-test
```

The build script is idempotent — re-running it against an already-patched
client is a no-op — and always creates a `SWGEmu.exe.bak` backup before
modifying anything, unless `--no-backup` is passed. Pass `--dry-run` to
preview what the build would do without touching any files.

After building, copy the contents of `modified_assets/` into the SWG client
install directory on each player's machine (typically `C:\SWGEmu\SWGEmu\`).

### Jedi Profession Filter Patch

The stock client's `SwgCuiAvatarSetupProf` strips "jedi" from the character
creation profession dropdown even when the server's PFDT includes it. The
patch neutralizes the filter by overwriting the comparison string at offset
`0x014A57D8` from `"jedi"` (`6A 65 64 69`) to `"xxxx"`
(`78 78 78 78`), so the filter never matches. File size is unchanged; only
4 bytes differ from the original.

See [CLAUDE.md](CLAUDE.md#client-binary-patching) for the full technical
details and server-side requirements.

## Server Management

- **MySQL:** Connect to `localhost:3306` (root password in `docker-compose.yml`)
- **REST API:** See [REST_API_SETUP.md](REST_API_SETUP.md)
- **Admin commands:** Full list at [SWGEmu Admin Command Reference](https://app.assembla.com/wiki/show/swgemu/Admin_Command_Reference)

### Admin Command Setup

Admin commands (e.g., `/teleport`, `/object`, `/credits`, `/grantSkill`) require admin skills to be granted to your character. These skills are automatically assigned during character creation if the account has `admin_level = 15`, but may be missing if the character was created before the admin account was set up.

If admin commands show **"command not found"** in-game, run:

```
/setgodmode self admin
```

This re-grants all ~20 admin skills. You should see confirmation messages for each skill. After that, all admin commands will be available immediately.

> **Note:** `/setgodmode self on` only toggles the admin ability — use `/setgodmode self admin` to get the full command set.

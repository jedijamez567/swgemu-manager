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

## TRE File System

TRE (Tree) archives contain client-side binary data: IFF datatables, STF string tables, UI definitions, templates, and more. Both the server and client read TRE files independently.

### Load Order & Precedence

TRE files are listed in `conf/config.lua` (`TreFiles` array) for the server and `swgemu_live.cfg` for the client. **First-loaded TRE wins** — when multiple TRE files contain the same file path, the one listed earliest in the array takes precedence. Later TREs with duplicate paths are silently rejected (`TreeDirectory` uses a `SortedVector` with `NO_DUPLICATE` insert plan).

```lua
TreFiles = {
    "dakotatest2.tre",             -- position 0 = HIGHEST priority (custom skills.iff)
    "dakota_jedi_profession.tre",  -- profession_defaults_*.iff overrides
    ...
    "bottom.tre"                   -- LOWEST priority
}
```

Custom TRE contents (verified by index plaintext-grep against the .tre files):
- **`dakotatest2.tre`** — contains a custom `datatables/skill/skills.iff` with populated COMMANDS columns for Jedi rows. Filename index is zlib-compressed and not introspectable via plain `strings`/`grep`; use SIE to view contents.
- **`dakota_jedi_profession.tre`** — contains exactly 7 PRFI files: `creation/profession_defaults_combat_brawler.iff`, `combat_marksman`, `crafting_artisan`, `outdoors_scout`, `science_medic`, `social_entertainer`, and **`profession_defaults_jedi.iff`**. It does NOT contain `creation/profession_defaults.iff` (PFDT) or `datatables/creation/profession_mods.iff` — those must come from another TRE.

### TRE vs Database

The server reads skill definitions, profession defaults, and other datatable IFF files **exclusively from TRE archives** at startup — never from the database. Key loading paths:

- **SkillManager** (`loadClientData()`): Opens `datatables/skill/skills.iff` from TRE via `TemplateManager::instance()->openIffFile()`
- **PlayerCreationManager** (`loadProfessionDefaultsInfo()`): Reads `creation/profession_defaults.iff` and per-profession PRFI files from TRE
- **`Core3/MMOCoreORB/sql/datatables.sql`**: Contains `skill_skills` table but is a **reference artifact only** — not loaded at runtime, not in the Docker init directory

### Data Flow

`DataArchiveStore::getData()` checks two sources in order:
1. **Local filesystem** (highest priority) — if a file exists locally, it's returned immediately
2. **TRE archives** — falls back to `TreeArchive` using the first-loaded-wins precedence

### Editing TRE Contents

Use **SIE (SWG Information Editor)** from modthegalaxy.com to edit IFF/STF files inside TRE archives. Common editable formats:
- **IFF datatables** (`skills.iff`, `profession_mods.iff`): Skill definitions, profession attributes
- **PRFI files** (`profession_defaults_*.iff`): Starting skill (SKIL chunk) and per-race equipment (PTMP sections)
- **PFDT files** (`profession_defaults.iff`): Maps profession keys to PRFI file paths
- **STF string tables** (`skl_n.stf`, `skl_d.stf`, `skl_t.stf`): Skill names, descriptions, titles

After editing, rebuild the patch TRE and place it in both the server's `TrePath` directory and the client's TRE directory. Server requires a container restart; client requires a restart.

## Client Binary Patching

Some client behavior is hardcoded in `SWGEmu.exe` and cannot be changed via TRE files or server config. When that happens, the client binary must be patched directly.

### Jedi Profession Filter — fixed 2026-04-11 via 1-byte code patch

The client's `SwgCuiAvatarSetupProf::performActivate()` hardcodes a filter that strips "jedi" from the character creation profession dropdown, even when the server PFDT (`creation/profession_defaults.iff`) includes a Jedi entry:

```cpp
if (professionName == "jedi") { --index; continue; }
```

**Working fix**: 1-byte code patch at file offset `0x00866908` in `SWGEmu.exe`, changing `75 08` (`JNZ 0x00c66912`) to `EB 08` (`JMP 0x00c66912`). This unconditionally bypasses the filter's `DEC [EBP-0x18]; JMP continue` path inside `FUN_00c66600` while leaving the `"jedi"` string literal at `0x014A57D8` untouched, so the skill icon renderers that also read that literal (`FUN_00f71040`, `FUN_010552e0`, `FUN_01054690`) still work. Verified in-game: Jedi appears in the profession dropdown AND existing characters' Jedi skill tree icons still render correctly.

Full end-to-end runbook (binary patch + server Lua + TRE requirements + account unlock + troubleshooting) is in [`GUIDES/enabling_jedi_at_character_creation.md`](GUIDES/enabling_jedi_at_character_creation.md).

### DO NOT patch the `"jedi"` string literal at `0x014A57D8`

A prior approach overwrote the literal at `0x014A57D8` with `"xxxx"`. It removes Jedi from the dropdown, but it also breaks every Jedi skill icon in the skill tree (`force_title_jedi_*`, `force_sensitive_*`, `force_discipline_*` all render the default broken icon). The binary contains **six** standalone `"jedi\0"` literals, and `0x014A57D8` is the only one the dropdown filter reads, but it's also the literal one of the skill icon classifiers reads — the compiler pooled both into the same string-literal entry. Data-only patches at that offset are mutually exclusive between the two behaviors.

The six occurrences in the pristine `SWGEmu.exe.bak` (for reference if analysis is ever needed against a different build):

| # | File offset |
|---|---|
| 1 | `0x01491C64` |
| 2 | `0x014A56A9` |
| 3 | `0x014A56D1` |
| 4 | `0x014A57D8` ← **DO NOT patch** (shared with skill icon classifier) |
| 5 | `0x014A5AAB` |
| 6 | `0x014A5CDD` |

The code-patch approach above sidesteps this entirely by flipping the filter's control-flow branch (at `0x00866908`) instead of clobbering the shared string.

### Ghidra analysis artifacts

- **Project**: `C:\Users\dakot\extract-swg-cilent.gpr` / `.rep` — loaded with the pristine `SWGEmu.exe` baseline, auto-analysis completed (~50 min, do not redo).
- **Custom script**: `C:\Users\dakot\Tools\ghidra_scripts\FindJediStringXrefs.java` — dumps all xrefs to the `"jedi"` literal with ±30 instructions of context and per-instruction file offsets + raw bytes. Of the 10 xrefs in the current build, only `FUN_00c66600` shows the `--outputIndex; continue;` filter pattern; the other 9 are skill icon classifiers (`FUN_00f71040`, `FUN_010552e0`, `FUN_01054690`), C++ static init atom interning (`FUN_013e05b0`, `009d3620`), and a UI layout helper (`FUN_0120cc30`). None of those should be patched.
- **Headless runbook**: close the Ghidra GUI first (it holds the project lock — look for `javaw.exe` in `tasklist`), then run `"<ghidra>\support\analyzeHeadless.bat" C:\Users\dakot extract-swg-cilent -process SWGEmu.exe -noanalysis -readOnly -scriptPath C:\Users\dakot\Tools\ghidra_scripts -postScript FindJediStringXrefs.java` where `<ghidra>` is `C:\Users\dakot\Downloads\ghidra_12.0.4_PUBLIC_20260303\ghidra_12.0.4_PUBLIC`.

### Stock client TRE extract

Full extraction of all stock SWG client TREs (excluding `dakotatest2.tre` and `dakota_jedi_profession.tre`) is at `C:\Users\dakot\OneDrive\Desktop\global_extract\`. Use this directory directly instead of trying to introspect TRE archives — `ui/ui_skill.inc`, `ui/ui_styles.inc`, `datatables/skill/skills.iff`, all PRFI files, etc. are in their original IFF/INC form. IFF binary files are columnar — do **not** attempt to read them via `grep -aA <n> "^rowname$"` (the lines after a row name belong to other rows' data, not that row's columns). Use SIE or a real IFF parser.

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

### Account-Wide Jedi Unlock

Once any character on an account first reaches Padawan (`jediState >= 2`), `PlayerObjectImplementation::setJediState` flips `accounts.jedi_unlocked = 1` and persists via `AccountManager::setAccountJediUnlocked`. `SkillManager::fulfillsSkillPrerequisites` then bypasses the `jediStateRequired` gate for any character on that account, enabling **starting-jedi** as a character creation profession (PRFI `profession_defaults_jedi.iff` SKIL chunk grants `force_title_jedi_novice`, which triggers `HologrindJediManager:onPlayerCreated`'s fast-track to Padawan).

- **Backfill on login**: `HologrindJediManager:onPlayerLoggedIn` calls the Lua-bound `markAccountJediUnlocked(creature)` (defined in `DirectorManager.cpp`) for any character with `jediState >= 2`. Idempotent.
- **Gate**: fresh accounts (`jedi_unlocked = 0`) cannot shortcut starting-jedi — the PRFI grant silently fails the canLearnSkill check. They must hologrind one character to Padawan first.
- **Ordering**: `PlayerCreationManager::createCharacter` loads the account via `setAccountID + initializeAccount` BEFORE `addProfessionStartingItems`. Do NOT move this back — the bypass needs `ghost->getAccount()` non-null during the PRFI skill grant.
- **Lua reorder**: `awardJediStatusAndSkill` now calls `setJediState(2)` FIRST, before the `force_title_jedi_*` rank grants, so the C++ hook flips `jedi_unlocked` and the bypass enables the rank grants.
- **Hidden tree**: the 96 stock `jedi_*` skills in `custom_patches/unpacked_tres/datatables/skill/skills.csv` are marked `IS_HIDDEN=true, GOD_ONLY=true`. The visible Jedi tree is `force_title_jedi_*` / `force_sensitive_*` / `force_discipline_*`.

### Lua Item Granting

- **`giveItem(pInventory, templatePath, -1)`** — creates an object from an IFF template directly. Works for equipment, components, deeds.
- **`createLoot(pInventory, lootGroupName, level)`** — creates an item through the loot system, which applies crafting values (e.g., color attributes on crystals). Use this for items that need loot-system properties.
- **No Lua API for filled resource containers** — `givePlayerResource()` exists in C++ (`ResourceManagerImplementation.cpp`) but is not exposed to Lua. Use Resource Deeds (`object/tangible/veteran_reward/resource.iff`) instead; each gives 30,000 units of a player-selected resource.

## Important Notes

- TRE files must be manually placed in the server's `TrePath` directory (not version controlled, ~2+ GB). See "TRE File System" section for precedence rules
- `resource_manager_spawns.lua` is extremely large — avoid reading the entire file
- Lua command files follow the pattern: `CommandName = { name = "commandname" }; AddCommand(CommandName)`
- The Jedi system is configured in `conf/features.lua` via `jediSystem` (options: hologrind, village, custom)
- The Core3 REST API uses an old cpprest SDK (Ubuntu 16.04, ~v2.8). HTTP proxies must strip modern browser headers or the SDK's low-level parser rejects requests with 400 before application code runs. The Vite proxy in `swgemu-monitor/vite.config.ts` handles this.
- **MySQL migrations**: Files in `sql/` only auto-run on the FIRST container start against an empty data dir. The persistent bind-mount at `./mysql:/var/lib/mysql` means subsequent restarts skip them. Apply manually: `docker exec -i swgemu_database mysql -uroot -pswgemuroot swgemu < sql/<file>.sql`. MySQL 5.7 lacks `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` — use the `information_schema.COLUMNS` + `PREPARE`/`EXECUTE` pattern (see `sql/03-jedi_unlocked_migration.sql` for the canonical example).
- **`accounts` schema**: `account_id`, `username`, `password`, `station_id`, `created`, `active`, `admin_level`, `salt`, `jedi_unlocked`. Defined in `sql/01-swgemu.sql` and the Core3 submodule's `sql/swgemu.sql` — keep both in sync.
- **`SkillManager::fulfillsSkillPrerequisites` gate**: enforces `jediState < jediStateRequired` BEFORE the `isPrivileged()` bypass. Lua `awardSkill` and C++ `awardSkill` both go through this path. The `jedi_unlocked` bypass at lines ~787-801 sidesteps the gate for any character on a previously-unlocked account.

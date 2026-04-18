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

## Build Performance

The Dockerfile uses BuildKit cache mounts so the slow C++ rebuild only happens once. Two persistent caches live outside the image layers and survive across `docker-compose build` invocations:

| Mount | Purpose |
|-------|---------|
| `/root/.ccache` (id `swgemu-ccache`, 20 GB max) | Compiled-object-file cache. cmake auto-uses it (`ENABLE_CCACHE=ON` in `Core3/MMOCoreORB/CMakeLists.txt:54`) — the Dockerfile just makes it persistent and sets `CCACHE_COMPILERCHECK=content` (mtime-based checks misfire in Docker). |
| `/app/MMOCoreORB/build` (id `swgemu-build`) | ninja's incremental state. Lets ninja re-evaluate only the changed translation units instead of regenerating from scratch each build. |

The build `RUN` ends with `ccache -s` so the build log prints hit/miss stats — useful to confirm caching is working.

**Expected timings on a Ryzen 5 2600 (6c/12t):**
- First build after Dockerfile changes: ~20 min (cache priming, identical to pre-change).
- Subsequent rebuilds with single-file C++ changes: ~1-3 min.
- Pure Lua changes: no rebuild needed (`docker-compose restart swgemu`).

**Important:** the binary lands in `/app/MMOCoreORB/bin/` via a cmake POST_BUILD copy (`Core3/MMOCoreORB/src/CMakeLists.txt:168-173`), which is OUTSIDE the cached build dir. So caching `/app/MMOCoreORB/build` doesn't strand the binary. Don't move the cache mount to cover `bin/` — that would.

To clear the caches (rare — only if ccache returns wrong objects, which has never happened in practice): `docker builder prune --filter type=exec.cachemount`.

BuildKit is the default in modern Docker Desktop. If running this on a system where BuildKit is off, prefix builds with `DOCKER_BUILDKIT=1`.

## Lua Configuration Layout

All Lua files mount over Core3 defaults in the container. Key files:

| Path | Purpose |
|------|---------|
| `conf/config.lua` | Main server config (database, network, galaxy, zones, TRE files) |
| `conf/config-local.lua` | Local overrides (REST API settings, galaxy-wide grouping) |
| `conf/features.lua` | Feature toggles (jedi system, armor, GCW) |
| `player_manager/player_manager.lua` | Player settings (XP multipliers, Jedi death XP loss, buffs, PvP, account limits, vehicle call delay) |
| `player_creation_manager/player_creation_manager.lua` | New character setup (starting items, species, professions, creation cooldown) |
| `mission_manager/mission_manager.lua` | Mission settings (max active missions, bounty targets, destroy rewards, factional toggles) |
| `loot_manager/loot_manager.lua` | Loot drop system (chances, rarity tiers, armor stat mods) |
| `resource_manager/resource_manager.lua` | Resource manager config — spawn pools, JTL, and sampling tuning (`sampleYieldMultiplier`, `sampleIntervalMs`, `sampleGambleMultiplier`, `sampleConcentrationMultiplier`) |
| `resource_manager/resource_manager_spawns.lua` | Resource spawn data (~370K lines) |
| `jedi/` | Jedi unlock system — `jedi_manager.lua` (progression type, combat XP rate), `hologrind_jedi_manager.lua` (novice→padawan→knight), `frs_manager.lua` (council ranks, auto-promotion, PvE crossover ratio) |
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
3. **Reach 5,000 faction points** (Rebel or Imperial) + **meditate again** → `promoteToKnight()` awards Knight rank (`force_title_jedi_rank_03`), sets `jediState=4`, gives knight robe + Legendary Krayt Dragon Pearl + lightsaber crafting materials, and **auto-enrolls the character into the Force Rank System** at rank 0 by calling `setFrsCouncil(LIGHT|DARK)` + `setFrsRank(0)` (faction-based — higher of Rebel/Imperial standing wins). `setFrsRank(0)` routes through `FrsManager::setPlayerRank → updatePlayerSkills`, which awards `force_rank_{light,dark}_novice`.

**Knight eligibility gates** (`jedi/hologrind_jedi_manager.lua:checkKnightEligibility`): has `force_title_jedi_rank_02` (Padawan), does NOT have `force_title_jedi_rank_03` (Knight), and ≥5k Rebel OR Imperial faction standing. Do NOT re-add a hologrind-professions gate here — starting-jedi Padawans never hit `addHologrindProfession` (they short-circuit via the `force_title_jedi_novice` fast-track in `onPlayerCreated`), so that gate would block every account-unlocked Jedi from ever becoming Knight.

**Eligibility notification** fires on login via `HologrindJediManager:onPlayerLoggedIn` (SUI popup *"You have proven yourself worthy…"* + yellow waypoint to the nearest Force Shrine via `createForceShrineWaypoint`). There is no hook on faction-standing change — the popup only appears at login or when the player meditates at a shrine (which promotes immediately through `ForceShrineMenuComponent:doMeditate → checkKnightEligibility → promoteToKnight`). The `addWaypoint` Lua binding requires exactly 10 args in the order `(planet, name, desc, x, z, y, color, active, notifyClient, specialTypeID)` where `z` is altitude — use `getWorldPositionX/Z/Y()` (X and Y are horizontal in Core3's SceneObject convention, Z is altitude) and the registered constant `WAYPOINT_YELLOW` (underscore; `WAYPOINTYELLOW` is undefined and silently resolves to `nil`, failing the binding's arg-count check).

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

### Jedi Combat XP Rate

Force-attack damage is tagged `xpType = "jedi_general"` in `CombatManager::applyDamage` (CombatManager.cpp:1430-1431, 1642-1643). The award step in `PlayerManagerImplementation::disseminateExperience` then applies a configurable rate multiplier and decides whether the scaled amount also contributes to `combat_general`.

**Configuration** (`jedi/jedi_manager.lua`):

| Setting | Default | Description |
|---------|---------|-------------|
| `jediExperienceRatio` | `0.2` | Multiplier on `jedi_general` XP from combat damage (stock = 20% of the non-jedi rate). |
| `jediCountsTowardCombatGeneral` | `false` | When `true`, the scaled jedi_general amount also accumulates into `combat_general`. Stock behavior is false. |

- Loaded by `JediManager::loadConfiguration` (`Core3/MMOCoreORB/src/server/zone/managers/jedi/JediManager.cpp`) right after `runFile("scripts/managers/jedi/jedi_manager.lua")`, stored under the singleton's `ReadWriteLock`.
- Read by `PlayerManagerImplementation::disseminateExperience` once per attacker (cached outside the per-xpType inner loop) via `JediManager::instance()->getJediExperienceRatio()` / `getJediCountsTowardCombatGeneral()`.
- Ratio applies BEFORE `awardExperience`, so `speciesModifier * buffMultiplier * localMultiplier * globalExpMultiplier` still stacks on top.
- C++ changes (adding the members, include in PlayerManagerImplementation.cpp) require a full rebuild; Lua-only value tweaks just need `docker-compose restart swgemu`.

### Jedi Death XP Loss

Jedi characters (jediState >= 2) lose `jedi_general` XP on death. Three scenarios trigger loss, all configurable in `player_manager/player_manager.lua`:

| Setting | Default | Description |
|---------|---------|-------------|
| `applyGlobalXpMultiplierToJediDeathLoss` | `false` | Whether `globalExpMultiplier` applies to death XP loss |
| `jediDeathXpLossPercent` | `0.05` | Clone death: % of jedi_general XP cap lost (5%) |
| `jediDeathBountyXpLossCreditsMultiplier` | `2` | Bounty kill: loss = reward credits × multiplier |
| `jediDeathBountyXpLossMin` | `50000` | Bounty kill: minimum XP loss (positive value) |
| `jediDeathBountyXpLossMax` | `500000` | Bounty kill: maximum XP loss (positive value) |
| `jediDeathForceReviveXpLoss` | `50000` | Force revive (RegainConsciousness): flat XP loss |

All Lua values are positive; C++ negates them internally. A hard floor of -10,000,000 `jedi_general` XP exists in `PlayerObjectImplementation::addExperience`.

**C++ call sites** (all in Core3 submodule — changes require full rebuild):
- Clone death: `PlayerManagerImplementation::sendPlayerToCloner()` line ~1790
- Bounty kill: `BountyMissionObjectiveImplementation::handlePlayerKilled()` line ~610
- Force revive: `RegainConsciousnessCommand.h` line ~65

**`applyModifiers` pattern**: `awardExperience()` has a 6th parameter `applyModifiers` (default `true`). When `true`, `globalExpMultiplier` scales the amount. The Jedi death config controls this via `applyGlobalXpMultiplierToJediDeathLoss`. With `globalExpMultiplier = 500` and the toggle set to `false`, a 5% cap loss stays at ~500 XP instead of being amplified to ~250,000.

### FRS Council Ranks (Force Rank System)

Post-Knight progression uses Core3's FRS. Knights are enrolled automatically by `promoteToKnight` (see Progression Flow above). Above rank 0, advancement is gated by `force_rank_xp` — a separate pool from `jedi_general` — with thresholds in `jedi/frs_manager.lua` (`lightRankingData` / `darkRankingData`, 5k / 15k / 25k … 400k).

**Configuration** (`jedi/frs_manager.lua`):

| Setting | Default | Description |
|---------|---------|-------------|
| `frsEnabled` | `1` | Master toggle for the FRS. |
| `autoPromotionEnabled` | `1` | Bypasses the stock voting/petition/challenge flow. When `1`, crossing a rank's `requiredExperience` automatically promotes the player. |
| `pveForceRankXpRatio` | `0.10` | Fraction of `jedi_general` XP that also mints `force_rank_xp` on PvE kills. `0` disables the crossover. |
| `frsExperienceValues` | (table) | PvP-outcome XP grants (`nonjedi_win`, `bh_win`, `padawanN_lose`, `rankN_win/lose`, …). Stock PvP-only; a PvE-only server earns nothing from this table. |

**Auto-promotion hooks** (all in Core3 submodule — C++ changes require full rebuild):

- `FrsManagerImplementation::playerLoggedIn` (~line 395) — re-checks on every login in case a player accumulated XP offline or pre-change.
- `FrsManagerImplementation::adjustFrsExperience` (~line 925) — checks immediately after any `force_rank_xp` grant. Promotes via `promotePlayer → setPlayerRank → updatePlayerSkills`, which awards `force_rank_{light,dark}_rank_NN` (and the bonus titles `force_title_jedi_rank_04` at rank 4 and `force_title_jedi_master` at rank 8). The auto-promotion check intentionally runs even when `hasCappedExperience("force_rank_xp")` is true — a capped player must still be able to promote so the new rank skill's higher cap lets subsequent XP grants resume. Do NOT re-wrap the promotion check in the cap early-return: rank thresholds overlap with per-skill caps (rank 0 novice cap = 15,000 = rank 2 threshold), so capping at novice without the bypass strands the player until relog.
- `PlayerManagerImplementation::awardExperience` (~line 2673) — **PvE crossover.** When `xpType == "jedi_general"` and `xp > 0`, grants `floor(xp * pveForceRankXpRatio)` as `force_rank_xp` via `frsManager->adjustFrsExperience(player, frsXp, false)`. Guarded on `rank >= 0 && councilType == LIGHT|DARK` so only FRS members get the crossover. No system-message spam (third arg `false`). No infinite loop — `adjustFrsExperience` uses `PlayerObject::addExperience` directly, not `PlayerManager::awardExperience`.

**XP sources for `force_rank_xp`**: Force-attack PvE kills (see `CombatManager.cpp:1431,1643` — `xpType = "jedi_general"` only when `data.isForceAttack()`), filtered through the crossover above. Plus the stock PvP-outcome table when applicable. Weapon-based PvE attacks by a Jedi produce weapon XP, NOT `jedi_general`, so they don't feed the crossover.

**FRS IDL member declaration & getter** (`Core3/MMOCoreORB/src/server/zone/managers/frs/FrsManager.idl`): `pveForceRankXpRatio` is a `protected transient float` initialized to `0.0f` in the constructor, exposed via `public float getPveForceRankXpRatio()`. Read from Lua in `loadLuaConfig` via `lua->getGlobalFloat("pveForceRankXpRatio")`.

## Resource Sampling Tuning

Survey-tool sampling (`/sample`) has four configurable knobs in `resource_manager/resource_manager.lua`. All are read once at server startup by `ResourceManagerImplementation::loadConfigData()` and pushed into `ResourceSpawner::setSampleTuning()`.

| Setting | Default | Description |
|---------|---------|-------------|
| `sampleYieldMultiplier` | `1.0` | Flat multiplier on `unitsExtracted` per successful sample. Applied at `ResourceSpawner.cpp:1009` as `maxUnitsExtracted * (surveySkill/100) * samplingMultiplier * cityMultiplier`. |
| `sampleIntervalMs` | `25000` | Delay between consecutive sample ticks. Read by `SurveySessionImplementation::rescheduleSample()` via `resourceManager->getResourceSpawner()->getSampleIntervalMs()`. |
| `sampleGambleMultiplier` | `5.0` | Payout on the gamble minigame's success branch. Replaces the legacy `*= 5` at `ResourceSpawner.cpp:1015`. |
| `sampleConcentrationMultiplier` | `5.0` | Payout when within 10 m of a detected rich node. Replaces the legacy `*= 5` at `ResourceSpawner.cpp:1026`. |

**Defensive defaults**: `loadConfigData` clamps non-positive multipliers to their stock value and `sampleIntervalMs < 1000` back to `25000`, so an omitted/zero Lua value behaves like stock rather than breaking sampling.

**C++ call sites** (all in Core3 submodule — changes require full rebuild):
- `ResourceSpawner.h` — stores the four fields (`samplingMultiplier` is `float`, not `int`, to allow fractional values).
- `ResourceSpawner::setSampleTuning()` — single setter called from the manager after Lua parse.
- `ResourceSpawner::sendSampleResults()` — applies the yield + jackpot multipliers.
- `SurveySessionImplementation::rescheduleSample()` — reads the interval per-tick; already had a `resourceManager` reference set in `startSession()`, so no new plumbing.

Lua-only value tweaks take effect on `docker-compose restart swgemu`. C++ changes (adding a knob, changing formula) require a full rebuild.

## Character Creation Cooldown

`characterCreationCooldown` (seconds) in `player_creation_manager/player_creation_manager.lua:2` is the single source of truth — `0` disables the cooldown entirely. Repo override defaults to `0`; upstream stock is `3600` (1 hour).

Two gates enforce it in `Core3/MMOCoreORB/src/server/zone/managers/player/creation/PlayerCreationManager.cpp`, both bypassed for `accountPermissionLevel >= 9` (admin levels 9, 10, 12, 15 — hardcoded, not Lua-tunable):

| Gate | Lines | Survives restart? |
|------|-------|-------------------|
| In-memory `lastCreatedCharacter` HashTable | ~498-518 | No (cleared on container restart) |
| DB-backed query against `characters.creation_date` + `deleted_characters.creation_date` | ~466-493 | Yes |

Both gates now multiply `characterCreationCooldown * 1000` for the ms threshold and emit the same dynamic error message. The DB-backed gate is wrapped in `if (characterCreationCooldown > 0)` so a value of `0` skips the DB roundtrip entirely.

**Historical gotcha:** stock SWGEmu hardcodes `3600000` ms in the DB-backed gate's comparison and error string, so setting `characterCreationCooldown = 0` only disables the in-memory gate — non-admin accounts still hit the 1-hour DB check. The fix in this repo unifies both gates on the Lua value. C++ change — requires full rebuild.

### Force Run Toggle

`/forceRun1`, `/forceRun2`, `/forceRun3` are toggleable — recasting the active tier removes the buff (no Force refund). Implemented in [ForceRun1Command.h](Core3/MMOCoreORB/src/server/zone/objects/creature/commands/ForceRun1Command.h), [ForceRun2Command.h](Core3/MMOCoreORB/src/server/zone/objects/creature/commands/ForceRun2Command.h), [ForceRun3Command.h](Core3/MMOCoreORB/src/server/zone/objects/creature/commands/ForceRun3Command.h) by letting `JediQueueCommand::doJediSelfBuffCommand()` run unimpeded — its built-in branch at [JediQueueCommand.h:76-80](Core3/MMOCoreORB/src/server/zone/objects/creature/commands/JediQueueCommand.h#L76-L80) (`hasBuff(buffCRC) → removeBuff → return SUCCESS`) handles the toggle. Stock SWGEmu intercepts with `hasBuff(buffCRC) ? NOSTACKJEDIBUFF : doJediSelfBuffCommand(...)`, which is why Force Run is fire-and-forget upstream.

- Tier-2/3 cleanup is free: `CreatureObjectImplementation::removeBuff(uint32)` at [CreatureObjectImplementation.cpp:3041-3056](Core3/MMOCoreORB/src/server/zone/objects/creature/CreatureObjectImplementation.cpp#L3041-L3056) cascades through `getSecondaryBuffCRCs()`, so the paired `PrivateSkillMultiplierBuff` (`private_damage_divisor`) is removed automatically.
- Cross-tier block (e.g. `/forceRun2` while FR1 is active) now returns `NOSTACKJEDIBUFF` directly to the framework, which emits `@jedi_spam:force_buff_present` via [QueueCommand.cpp:200-205](Core3/MMOCoreORB/src/server/zone/objects/creature/commands/QueueCommand.cpp#L200-L205). Stock code hardcoded `@jedi_spam:already_force_running` and downgraded to `GENERALERROR`.
- Same toggle idiom works for any `JediQueueCommand` subclass that currently short-circuits with `hasBuff ? NOSTACKJEDIBUFF : ...` — just remove the ternary.
- C++ change — requires full rebuild, not a Lua hot-reload.

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

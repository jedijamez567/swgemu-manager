# Loot Filter mod

Per-player loot filter for SWGEmu. When a player enables their filter, `/loot all` collects only items that match one of their rules; the rest stays in the corpse and can be grabbed with the normal `/loot` window. Stock behavior when the filter is off.

## What players can filter on

- **Categories**: Armor Attachments (AA), Clothing Attachments (CA), looted weapons, looted armor, other wearables, blood charges, special drops.
- **Rarity tier**: any / yellow / Exceptional / Legendary (the in-game suffix).
- **Stat-mod minimums**: any combination of stat names with a minimum value, e.g. `precision >= 15` AND `block >= 10`. Stat names match what `loot_manager.lua` rolls onto attachments and wearables.

Multiple rules can be active per character. An item matches the filter if it matches **any one** rule. Within a rule, all conditions must hold (category overlap, rarity threshold, every listed stat min met).

Special drops and blood charges are identified by **template path prefixes** — server admins populate the list in `server/conf/loot_filter.lua` to fit their server's content. (Stock Core3 has no rare-drop registry, so this list is the authoritative source.)

## What gets installed

**Server-side only** (this mod has no client payload). All changes are to the Core3 game server:

| File | Purpose |
|---|---|
| `server/conf/loot_filter.lua` | Admin config (caps, special-drop prefixes, default rules). Volume-mounted at runtime — Lua-only edits = `docker-compose restart swgemu`. |
| `server/src/LootFilterRule.h` | Per-rule data struct (Serializable). Goes under `objects/player/variables/`. |
| `server/src/LootFilterManager.{h,cpp}` | Singleton: loads Lua config, classifies items, evaluates rules. Goes under `managers/loot/`. |
| `server/src/LootFilterCommand.h` | `/lootfilter` slash-command handler. Goes under `objects/creature/commands/`. |
| `server/commands/lootFilter.lua` | Lua command stub (just names the command). Goes into the repo's `commands/` mount. |
| **Patches to existing Core3 files** | `PlayerObject.idl`, `PlayerObjectImplementation.cpp`, `PlayerManager.idl`, `PlayerManagerImplementation.cpp`, `LootCommand.h`, `CommandConfigManager2.cpp`, `commands.lua`. |

C++ touch = full rebuild required. Lua-only tweaks to `loot_filter.lua` = restart only.

## Player guide

See [docs/player-guide.md](docs/player-guide.md). TL;DR:

```text
/lootfilter reset     -- load the default rule set
/lootfilter on        -- turn the filter on
/loot all             -- now only collects matching items
/lootfilter list      -- see your rules
/lootfilter off       -- back to stock /loot all
```

## Admin guide

This mod ships pre-installed in this swgemu-manager checkout. If you're applying it to a fresh Core3 fork:

### 1. Drop in the new files

```bash
# From this repo's mods/loot-filter/server/ directory, copy to Core3:
cp src/LootFilterRule.h   <Core3>/MMOCoreORB/src/server/zone/objects/player/variables/
cp src/LootFilterManager.h <Core3>/MMOCoreORB/src/server/zone/managers/loot/
cp src/LootFilterManager.cpp <Core3>/MMOCoreORB/src/server/zone/managers/loot/
cp src/LootFilterCommand.h <Core3>/MMOCoreORB/src/server/zone/objects/creature/commands/
cp commands/lootFilter.lua <swgemu-manager>/commands/
```

CMake's `GLOB_RECURSE` will pick up the new sources automatically.

### 2. Apply the inline patches

These are tracked in this repo's diff against `Core3@<base-commit>`. The patches:

- `PlayerObject.idl` — `include` LootFilterRule, declare `Vector<LootFilterRule> lootFilterRules`, declare `boolean lootFilterEnabled`, init flag to `false`, declare native accessors.
- `PlayerObjectImplementation.cpp` — native impls (getLootFilterRule, addLootFilterRule, setLootFilterRule, removeLootFilterRule, clearLootFilterRules, setLootFilterRuleEnabled).
- `PlayerManager.idl` — declare `lootFiltered(player, creature)`.
- `PlayerManagerImplementation.cpp` — `#include LootFilterManager.h` and add the `lootFiltered` impl after `lootAll`.
- `LootCommand.h` — `#include PlayerObject.h` and route through `lootFiltered` when the player has the filter on with rules.
- `CommandConfigManager2.cpp` — `#include LootFilterCommand.h` and register it (`commandFactory.registerCommand<LootFilterCommand>(String("lootFilter").toLowerCase());`).
- `commands.lua` (the volume-mounted one) — add `RunSlashCommandsFile("lootFilter.lua")`.

Apply these by reading the corresponding files in this checkout and copying the modifications. They are small (≤10 lines each except `PlayerObjectImplementation.cpp` which adds ~35 lines).

### 3. Add the volume mount

In `docker-compose.yml` under the `swgemu` service `volumes:`:

```yaml
- ./mods/loot-filter/server/conf/loot_filter.lua:/app/MMOCoreORB/bin/scripts/managers/loot_filter.lua
```

### 4. Rebuild

```bash
docker-compose down && docker-compose up -d --build
```

First build with the C++ changes is the slow one (~20 min on a 6c CPU thanks to the BuildKit cache mounts). Subsequent rebuilds touching only the filter sources should be in the 1-3 min range.

### 5. Verify

Log into the server with a test character:

```text
/lootfilter help        # should print the command surface
/lootfilter reset       # loads the 3 default rules from loot_filter.lua
/lootfilter list        # confirms rules are persisted on the character
```

Kill a creature with loot, then `/loot all` — expect to see "Loot filter: kept N, left M in corpse." in chat.

## Tuning

All admin knobs live in `server/conf/loot_filter.lua`:

- `lootFilterSystemEnabled` — global kill switch.
- `maxRulesPerPlayer`, `maxStatModsPerRule` — guards against runaway player config.
- `specialDropTemplates` — template-path prefixes that get classified as `CATEGORY_SPECIAL_DROP`. Add your server's rare drops here.
- `bloodChargeTemplates` — same idea for blood-charge buffs.
- `defaultRules` — what `/lootfilter reset` loads. The shipped defaults are conservative: Legendary anything, Exceptional attachments, all special drops + blood charges.

## What's not in this version

- **Add / edit rules in the SUI.** The shipped SUI (open with `/lootfilter`) lets players toggle the master switch and toggle individual rules on/off, plus quick "reload defaults" and "clear all" actions. **Creating new rules with custom stat minimums must be done via `defaultRules` in `loot_filter.lua`** — admins ship the available rule set, players opt in/out per rule. Building a rule-editor UI (category picker → rarity picker → stat picker) is a v2 follow-up.
- **Per-rule action.** Every rule's action is "auto-loot when matched." Non-matches stay in the corpse (no destroy, no junk-tagging).
- **Chat alerts.** No "rare drop!" notifications. Could be added cheaply if useful.
- **Group loot integration.** Filter only fires on solo-owned corpses (the `/loot all` chokepoint). Group-loot path is untouched in v1.

## Implementation notes

- Filter rules persist on `PlayerObject` as a `Vector<LootFilterRule>`. They follow the character.
- Account-wide filters aren't supported — see the discovery report for what an account-level move would require (new `accounts` table column + `AccountManager` plumbing).
- The filter runs at `/loot all` time, not at corpse-population time. Loot still drops normally; the filter only decides what gets transferred. This is intentional — it preserves per-corpse opt-out (player can still `/loot` no-arg to see everything).
- Item classification uses Core3's built-in `isArmorAttachment()` / `isClothingAttachment()` / `isWeaponObject()` / `isArmorObject()` / `isWearableObject()` type flags. No template-path scanning for the built-in categories — only for blood charges and special drops.
- Rarity detection reads the `" (Exceptional)"` / `" (Legendary)"` suffix from `customObjectName` (matches the existing `LightsaberCrystalComponent` precedent). The `YELLOW` option bit is checked for the basic yellow tier.

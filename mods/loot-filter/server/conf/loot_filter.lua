-- Loot Filter configuration.
--
-- Loaded once at server startup by LootFilterManager::loadLuaConfig().
-- Volume-mounted into the container at /app/MMOCoreORB/bin/scripts/managers/loot_filter.lua.
-- Lua-only edits take effect on `docker-compose restart swgemu` — no rebuild.

-- Master toggle. When false, /lootfilter command short-circuits with an error
-- and /loot all behaves as stock regardless of player filter state.
lootFilterSystemEnabled = true

-- Per-player rule cap. Defensive: keeps the SUI listbox readable and the
-- serialized PlayerObject blob bounded.
maxRulesPerPlayer = 32

-- Per-rule stat-mod cap. A single rule cannot require more than this many
-- distinct stat mods.
maxStatModsPerRule = 16

-- Category bitmask values. C++ mirrors these as constants in
-- LootFilterRule.h — keep both sides aligned if you renumber.
CATEGORY_ARMOR_ATTACHMENT    = 0x0001  -- AA
CATEGORY_CLOTHING_ATTACHMENT = 0x0002  -- CA
CATEGORY_WEAPON              = 0x0004  -- looted weapons (any slot)
CATEGORY_ARMOR               = 0x0008  -- looted armor pieces
CATEGORY_WEARABLE_OTHER      = 0x0010  -- clothing / jewelry / non-armor wearables
CATEGORY_BLOOD_CHARGE        = 0x0020  -- buff items, identified by template prefix list below
CATEGORY_SPECIAL_DROP        = 0x0040  -- rare named items, identified by template prefix list below

-- Rarity tier constants (extracted from custom-object-name suffix).
-- C++ mirrors these in LootFilterRule.h.
RARITY_ANY         = 0  -- match all items in matching category
RARITY_YELLOW      = 1  -- has OptionBitmask::YELLOW (any item with rolled mods)
RARITY_EXCEPTIONAL = 2  -- " (Exceptional)" suffix in customObjectName
RARITY_LEGENDARY   = 3  -- " (Legendary)"   suffix in customObjectName

-- Special drop template prefixes. Any TangibleObject whose
-- ObjectTemplate::fullTemplateString starts with one of these prefixes is
-- classified as CATEGORY_SPECIAL_DROP.
--
-- Add server-specific rare drops here. Stock Core3 has none of these flagged
-- as "rare" at the engine level — this list is the authoritative source.
specialDropTemplates = {
    "object/tangible/component/weapon/lightsaber/lightsaber_module_force_crystal.iff",
    "object/tangible/component/weapon/lightsaber/lightsaber_module_krayt_dragon_pearl.iff",
    "object/tangible/loot/creature_loot/death_watch/",         -- Mandalorian armor components
    "object/tangible/loot/creature_loot/jedi/",                -- Jedi-themed rare drops
    "object/tangible/component/armor/mandalorian_",            -- catch-all for Mando pieces
}

-- Blood charge template prefixes. Same matching semantics as
-- specialDropTemplates. Populate this with the template paths used by your
-- server's KP / blood-charge content (stock Core3 has none).
bloodChargeTemplates = {
    "object/tangible/item/dungeon/blood_charge",  -- placeholder pattern; replace with real templates
}

-- Stock built-in rules shipped with the mod. Players start with these in their
-- rule list the first time they enable the filter (the C++ side seeds them on
-- /lootfilter enable when ruleCount == 0).
--
-- Each rule:
--   name       — short display label
--   categories — bitwise OR of CATEGORY_* constants
--   minRarity  — RARITY_* constant
--   minStats   — table of stat-name → minimum-value (all required to match)
--
-- All conditions must hold for an item to match a rule. The filter accepts an
-- item if it matches ANY enabled rule (OR across rules, AND within a rule).
defaultRules = {
    {
        name = "Legendary anything",
        categories = CATEGORY_ARMOR_ATTACHMENT + CATEGORY_CLOTHING_ATTACHMENT
                   + CATEGORY_WEAPON + CATEGORY_ARMOR + CATEGORY_WEARABLE_OTHER,
        minRarity = RARITY_LEGENDARY,
        minStats = {}
    },
    {
        name = "Exceptional attachments",
        categories = CATEGORY_ARMOR_ATTACHMENT + CATEGORY_CLOTHING_ATTACHMENT,
        minRarity = RARITY_EXCEPTIONAL,
        minStats = {}
    },
    {
        name = "Special drops",
        categories = CATEGORY_SPECIAL_DROP + CATEGORY_BLOOD_CHARGE,
        minRarity = RARITY_ANY,
        minStats = {}
    },
}

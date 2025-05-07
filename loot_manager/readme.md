# SWGEmu Loot System Documentation

## Overview

The SWGEmu loot system manages the generation of randomized loot from creatures, containers, and other lootable objects in the game. The system allows for fine-grained control of drop rates, loot tables, and quality variations. This document explains how the loot system works and how to configure it effectively.

## Key Components

### 1. LootManager

The `LootManager` is the central component that handles all loot generation. It loads configuration data from Lua files, maintains loot groups and tables, and provides methods to create loot objects.

Key responsibilities:
- Loading loot group definitions
- Managing loot quality modifiers (exceptional, legendary items)
- Creating loot objects with appropriate statistics
- Applying random modifications to loot

### 2. LootGroupCollection

A collection of potential loot entries from which the system randomly selects. Each collection contains multiple `LootGroupCollectionEntry` objects.

### 3. LootGroupCollectionEntry

An entry in a loot collection that has:
- A chance to drop loot (`lootChance`)
- A list of loot groups that could be selected if loot drops

### 4. LootGroups

Contains a set of specific loot groups that might be selected, each with their own weighted chance.

### 5. LootGroupEntry

A specific loot group with:
- A name reference to a defined loot group
- A weighted chance of being selected within its parent `LootGroups`

## Loot Drop Calculation Process

The loot system employs a two-tier randomization system:

### Tier 1: Determine if Loot Drops at All

When a creature is killed or a container is opened:

1. The system retrieves the `lootChance` value for each `LootGroupCollectionEntry` in the collection.
2. If no `lootChance` is specified, it calculates one based on the following formula:
   ```
   lootChance = 2000000 + (level * 20000)
   ```
   This translates to: 20% + (0.2% * level)

3. The system generates a random number between 0 and 10,000,000.
4. If the random roll is less than or equal to `lootChance`, loot will be generated.
5. If not, no loot is generated from this entry.

### Tier 2: Select Which Loot Group to Use

If loot is to be generated:

1. The system retrieves all possible loot groups for the entry.
2. It generates another random number between 0 and 10,000,000.
3. It iterates through each loot group, accumulating their chances.
4. When the accumulated chance exceeds the random roll, that loot group is selected.
5. The system calls `createLoot()` with the selected loot group name to generate the actual items.

## Configuration Example

### Creature Template Example

```lua
lootGroups = {
    {
        groups = {
            {group = "meatlump_common", chance = 10000000}
        }
    },
},
```

This defines a loot collection with:
- One collection entry (the outer `{}`)
- One loot group ("meatlump_common")
- A 100% chance (10000000/10000000) of selecting that group if loot is generated

The base chance of loot dropping is determined by the creature's level. For a level 5 creature:
```
lootChance = 2000000 + (5 * 20000) = 2100000
```
This equals a 21% chance of loot dropping.

### Custom Loot Chance Example

To specify a custom loot chance:

```lua
lootGroups = {
    {
        lootChance = 5000000,  -- 50% chance instead of the default level-based calculation
        groups = {
            {group = "rare_crystals", chance = 2000000},  -- 20% chance if loot drops
            {group = "common_crystals", chance = 8000000}  -- 80% chance if loot drops
        }
    },
},
```

## Implementing Changes to the Loot System

### Making Base Loot Chance Configurable

To make the base loot chance configurable via `loot_manager.lua`:

1. Add configuration variables to `loot_manager.lua`:
   ```lua
   -- Base loot chance configuration
   baseLootChance = 0.20      -- 20% base chance for loot to drop
   lootChancePerLevel = 0.002 -- Additional 0.2% chance per creature level
   ```

2. Update the `LootManager` to read these values:
   ```cpp
   // Add to LootManager class
   private transient float baseLootChance;
   private transient float lootChancePerLevel;
   
   // Add to loadConfigData()
   baseLootChance = lua->getGlobalFloat("baseLootChance");
   lootChancePerLevel = lua->getGlobalFloat("lootChancePerLevel");
   ```

3. Update `LootGroupCollectionEntry::readObject()` to use these values:
   ```cpp
   void readObject(LuaObject* lua, int level, float baseChance, float chancePerLevel) {
       lootChance = lua->getIntField("lootChance");
   
       if (lootChance == 0) {
           int baseValue = baseChance * 10000000;
           int levelValue = chancePerLevel * 10000000 * level;
           lootChance = baseValue + levelValue;
       }
       
       // Rest of the method...
   }
   ```

## Advanced Loot Configuration

### Group-Specific Base Chances

Add support for group-specific base chances:

```lua
-- Group-specific overrides
lootChanceOverrides = {
   ["meatlump_common"] = 0.30,  -- 30% base chance
   ["rare_crystals"] = 0.05     -- 5% base chance
}
```

### Quality Tiers

The loot system supports quality tiers including:
- Regular items
- Exceptional items (higher stats)
- Legendary items (highest stats)

The chance for these tiers is configured in `loot_manager.lua`:

```lua
-- Item quality configuration
exceptionalChance = 0.05     -- 5% chance for exceptional
exceptionalModifier = 1.5    -- 50% stat boost for exceptional
legendaryChance = 0.01       -- 1% chance for legendary
legendaryModifier = 2.0      -- 100% stat boost for legendary
```

## Best Practices

1. **Use weighted probabilities correctly**:
   - Ensure all chances in a loot group add up to 10,000,000
   - Higher values = higher chance

2. **Balance level-based scaling**:
   - Consider how loot chances scale with creature difficulty
   - Test loot rates at different levels

3. **Group organization**:
   - Create logical groups for different loot types
   - Use nested groups for different tiers of rarity

4. **Documentation**:
   - Comment your loot groups with clear descriptions
   - Include drop rate information in comments

## Troubleshooting

Common issues:
- Loot not dropping: Check loot chances are properly calculated
- Wrong loot dropping: Verify loot group references
- Too much/little loot: Adjust base loot chance or per-level scaling

## Conclusion

The SWGEmu loot system provides robust control over loot generation through a two-tier probability system. By understanding how the system calculates drop chances and selects loot groups, developers can effectively configure and customize the loot experience to match their game balance goals.
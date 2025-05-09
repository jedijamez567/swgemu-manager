# XP Multipliers Implementation

## Overview

Added two new configuration variables to player_manager.lua:
- `combatXpMultiplier`: A multiplier that affects all combat-related XP types
- `jediXpMultiplier`: A multiplier specifically for Jedi XP (jedi_general)

## Implementation Details

### PlayerManager.idl Changes

1. Added new member variables:
   ```idl
   private float combatXpMultiplier;
   private float jediXpMultiplier;
   ```

2. Added getter methods:
   ```idl
   public float getCombatXpMultiplier() {
       return combatXpMultiplier;
   }
   
   public float getJediXpMultiplier() {
       return jediXpMultiplier;
   }
   ```

### PlayerManagerImplementation.cpp Changes

1. Updated `loadLuaConfig()` to read the values from the Lua configuration:
   ```cpp
   globalExpMultiplier = lua->getGlobalFloat("globalExpMultiplier");
   combatXpMultiplier = lua->getGlobalFloat("combatXpMultiplier");
   jediXpMultiplier = lua->getGlobalFloat("jediXpMultiplier");
   ```

2. Modified `disseminateExperience()` to apply the multipliers:
   ```cpp
   // Apply combat and jedi XP multipliers
   if (xpType == "jedi_general") {
       // Jedi experience doesn't count towards combat experience, and is earned at 20% the rate of normal experience
       xpAmount *= 0.2f;
       xpAmount *= attackerCreo->getZoneServer()->getPlayerManager()->getJediXpMultiplier();
   } else {
       combatXp += xpAmount;
       
       // Apply combat multiplier to combat-related XP types
       xpAmount *= attackerCreo->getZoneServer()->getPlayerManager()->getCombatXpMultiplier();
   }
   ```

## Implementation Steps

- [x] Create plan document
- [x] Modify PlayerManager.idl to add member variables and getters
- [x] Modify PlayerManagerImplementation.cpp to load the variables from config
- [x] Modify PlayerManagerImplementation.cpp's disseminateExperience() to apply multipliers
- [ ] Test implementation

## How It Works

1. The multipliers are initialized from the Lua config file when the server starts
2. When XP is awarded during combat:
   - For general combat XP types, the combatXpMultiplier is applied
   - For jedi_general XP, the jediXpMultiplier is applied (after the base 0.2 modifier)
3. These multipliers stack with other multipliers like:
   - globalExpMultiplier (affects all experience)
   - groupExpMultiplier (for group play)
   - GCW faction bonus

## Tuning

Server administrators can adjust these values in the player_manager.lua file:
- Default value for combatXpMultiplier is 1.0
- Default value for jediXpMultiplier is 1.0

Setting values higher than 1.0 will increase XP gain, while values lower than 1.0 will decrease it.

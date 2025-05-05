# Player Creation Manager

## Overview

The Player Creation Manager controls what items and settings new characters receive upon creation in SWGEmu. This includes starting credits, skill points, equipment, and other items that players receive immediately after character creation.

## Key Files and Locations

- **Main Configuration File**: `player_creation_manager/player_creation_manager.lua`

## Configuration Details

The Player Creation Manager configuration file contains several key components:

1. **Global Settings**:
   - `freeGodMode`: Toggles whether new characters start with admin privileges (0 = no, 1 = yes)
   - `startingCash`: Amount of cash credits new characters start with
   - `startingBank`: Amount of bank credits new characters start with
   - `skillPoints`: Number of skill points new characters start with

2. **Professions List**:
   - Defines available starting professions for new characters

3. **Item Definitions**:
   - Object IFF paths that define specific items available to new characters
   - Grouped by type (weapons, tools, armor, vehicles, etc.)

4. **Profession-Specific Items**:
   - The `professionSpecificItems` table maps professions to their starting items
   - Each profession receives a specific set of items based on their role

5. **Common Starting Items**:
   - The `commonStartingItems` table defines items that every new character receives regardless of profession

## Recent Modifications

On May 5, 2025, the following items were added to the Player Creation Manager:

1. **Armor Items**:
   - Full set of composite armor (helmet, chest, boots, gloves, leggings, biceps, bracers)

2. **Vehicle Deeds**:
   - Additional speeders and vehicles (X-34 Landspeeder, Flash Speeder, BARC Speeder, Swoop, generic Speederbike, Jetpack)

3. **Special Items**:
   - Character Builder Terminal - allows quick access to items, credits, and skills for testing

## Implementation Details

The Player Creation Manager script is loaded during server startup and controls the initial state of new characters. When a player creates a new character:

1. The server applies the global settings (credits, skill points)
2. The server distributes profession-specific items based on the selected profession
3. The server distributes common items to all characters regardless of profession

## Example Usage

To add a new item to all starting characters, add its definition and then include it in the `commonStartingItems` table:

```lua
-- Define the new item
newWeapon = "object/weapon/ranged/pistol/pistol_dl44.iff"

-- Add to common starting items
commonStartingItems = { 
    marojMelon, 
    survivalKnife,
    newWeapon -- New item added here
    -- Other items...
}
```

To add a profession-specific item, add it to the appropriate profession list:

```lua
professionSpecificItems = {
    jedi = { lightsaberObject }, -- Adding items to the Jedi profession
    -- Other professions...
}
```

## Notes

- Adding too many items to starting characters may impact server performance or game balance
- The Character Builder Terminal provides admin-like access to items and should only be included for development/testing servers
- IFF paths must be valid and match existing server-side objects
- Changes to this file take effect for newly created characters only; existing characters are unaffected

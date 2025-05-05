# SWGEmu Object Path System

## Overview

In Star Wars Galaxies Emulator (SWGEmu), object paths like `object/weapon/ranged/pistol/pistol_cdef.iff` refer to game assets that are stored within the TRE files (the game's resource archives). Understanding how these paths work is important for properly configuring scripts that reference game objects.

## TRE Files and Object Location

1. **Physical Storage**: Objects are physically stored in TRE files, which are compressed archive files containing all the game assets from the original Star Wars Galaxies client. These files are located in the `tre/` directory of your SWGEmu installation.

2. **IFF Format**: Most objects use the `.iff` extension, which stands for "Interchange File Format" - a binary file format used by LucasArts games to store game objects and their attributes.

3. **Path Structure**: The path structure in object references follows this pattern:
   ```
   object/[category]/[subcategory]/[type]/[specific_item].iff
   ```

   For example:
   - `object/weapon/melee/knife/knife_survival.iff` refers to:
     - Category: weapon
     - Subcategory: melee
     - Type: knife
     - Specific item: knife_survival.iff

## How Object Paths Work in SWGEmu

When you add an object path to a script (like in player_creation_manager.lua), here's what happens:

1. **Server Loading**: During server startup, SWGEmu loads object templates from the TRE files into memory.

2. **Path Resolution**: When a script references an object path:
   - The server looks up that path in its template registry
   - It creates an instance of that object using the template data
   - The object is then added to the game world or player inventory

3. **Object Instantiation**: When a player creates a character, the server uses the paths defined in player_creation_manager.lua to instantiate actual game objects and add them to the character's inventory.

## Exploring Available Objects

To find valid object paths for your server:

1. **TRE Explorers**: Tools like "TRE Explorer" allow you to browse the contents of TRE files and see all available object paths.

2. **Database Query**: SWGEmu servers store object templates in the database. You can query the `object_templates` table to see available objects:
   ```sql
   SELECT template_name FROM object_templates LIMIT 100;
   ```

3. **Client Extraction**: Extract game files from the TRE archives to explore them directly:
   ```
   swgemu-tre-explorer extract -f item_n.stf -o ./extracted
   ```

## Common Object Categories

Objects are organized into these main categories:

- `object/weapon/` - Weapons (ranged, melee)
- `object/tangible/` - Physical items (armor, tools, terminals, deeds, etc.)
- `object/intangible/` - Non-physical items (skills, pets)
- `object/creature/` - NPCs and creatures
- `object/building/` - Structures and buildings
- `object/mobile/` - Character appearance templates

## Example Path Mapping

Here's how some of the paths in player_creation_manager.lua map to actual game objects:

| Script Variable | Object Path | In-Game Item |
|----------------|-------------|--------------|
| marksmanPistol | object/weapon/ranged/pistol/pistol_cdef.iff | CDEF Pistol |
| x31Speeder | object/tangible/deed/vehicle_deed/landspeeder_x31_deed.iff | X-31 Landspeeder Deed |
| characterBuilderTerminal | object/tangible/terminal/terminal_character_builder.iff | Character Builder Terminal |

## Important Notes

1. **Invalid Paths**: If you specify a path that doesn't exist in your TRE files, the object won't spawn in-game.

2. **Custom Objects**: Custom server objects may have unique paths not found in standard TRE files.

3. **Case Sensitivity**: Object paths are case-sensitive on most file systems.

4. **Testing**: The best way to verify an object path works is to test it in-game after adding it to scripts.

5. **Object Availability**: Not all objects from retail SWG may be functional in your SWGEmu implementation, depending on which features are implemented.

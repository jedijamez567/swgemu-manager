# SWGEmu Admin Loot Generator

A Streamlit-based web application for generating Star Wars Galaxies Emulator (SWGEmu) admin loot commands.

## Features

- 🔍 **Search & Filter**: Browse loot groups by category or search by name
- 📊 **Detailed Information**: View all items in each loot group with drop weights and probabilities
- ⚙️ **Quality Control**: Adjust item quality from 1-500
- 📋 **Copy Commands**: Easy copy-to-clipboard functionality
- ⭐ **Favorites**: Save frequently used loot groups
- 📜 **Command History**: Track recently generated commands
- 📥 **Export**: Download commands as text files

## Installation

### Prerequisites

- Python 3.8 or higher
- Access to the SWGEmu Core3 loot files

### Setup

1. Navigate to the Loot Generator folder:
```bash
cd "Loot Generator"
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. The app will automatically parse the loot files on first run, or you can manually generate the database:
```bash
python parse_loot_groups.py
```

## Usage

### Running the App

Start the Streamlit app:
```bash
streamlit run app.py
```

The app will open in your default web browser (typically at `http://localhost:8501`).

### Using the Interface

1. **Browse Loot Groups**:
   - Use the category dropdown in the sidebar to filter by type (Armor, Weapon, NPC, etc.)
   - Or use the search bar to find specific loot groups

2. **Select a Loot Group**:
   - Choose a group from the dropdown
   - View all items in the group with their drop chances
   - See group details like minimum/maximum level

3. **Adjust Quality**:
   - Use the quality slider (1-500) to set item quality
   - Higher quality = better stats

4. **Generate Command**:
   - The command is automatically generated: `/object createloot <group_name> <quality>`
   - Click "Copy to Clipboard" to copy the command
   - Use "Export Command" to download as a text file

5. **Manage Favorites**:
   - Add frequently used groups to favorites
   - Quick access to favorite groups in the sidebar

## Command Format

The generated commands follow this format:

```bash
/object createloot <loot_group_name> [quality]
```

### Examples

```bash
/object createloot pistols 250
/object createloot bone_armor 100
/object createloot krayt_pearls 500
```

### Quality Guide

- **1-50**: Low quality items
- **51-150**: Standard quality
- **151-300**: Good quality
- **301-450**: Excellent quality
- **451-500**: Maximum quality

## Loot Categories

The app organizes loot groups into the following categories:

- **Armor**: All armor types (bone, composite, bounty hunter, etc.)
- **Weapon**: Pistols, rifles, carbines, melee weapons, etc.
- **Creature**: Drops from creatures (krayt tissue, pearls, bones, etc.)
- **NPC**: Drops from NPCs (faction-specific loot)
- **Wearables**: Clothing and accessories
- **Component Loot**: Crafting components
- **Task Loot/Reward**: Quest-specific items
- **Theme Park Loot/Reward**: Theme park quest items
- **Village**: Force-sensitive village items
- **And many more...**

## Database Management

### Refreshing the Database

If you make changes to the loot files:

1. Use the "Refresh Database" button in the sidebar, or
2. Manually run the parser:
```bash
python parse_loot_groups.py
```

### Database Location

The parsed loot database is stored in:
```
Loot Generator/loot_database.json
```

## Troubleshooting

### Database Not Found
If you see "Loot database not found", the parser will automatically try to generate it. If this fails, ensure:
- The Core3 directory exists in the parent folder
- The path `../Core3/MMOCoreORB/bin/scripts/loot/groups/` is accessible

### No Loot Groups Displayed
- Check that the Core3 loot files are present
- Try refreshing the database using the button in the sidebar
- Verify Python has read access to the Core3 directory

### Command Not Working In-Game
- Ensure you have the appropriate admin privileges
- Verify the loot group name is correct (case-sensitive)
- Check that your SWGEmu server has the corresponding loot group defined

## Technical Details

### Parser (`parse_loot_groups.py`)
- Recursively scans all `.lua` files in the loot groups directory
- Extracts loot group names, item templates, weights, and metadata
- Generates a JSON database for the Streamlit app

### App (`app.py`)
- Built with Streamlit for a responsive web interface
- Caches the loot database for performance
- Session state for history and favorites
- Real-time filtering and search

## Admin Command Reference

For a complete list of SWGEmu admin commands, visit:
[https://app.assembla.com/wiki/show/swgemu/Admin_Command_Reference](https://app.assembla.com/wiki/show/swgemu/Admin_Command_Reference)

## Contributing

This tool is part of the swgemu-manager project. To contribute:
1. Fork the repository
2. Make your changes
3. Submit a pull request

## License

This project is part of the SWGEmu community tools.

## Credits

- Based on SWGEmu Core3 loot definitions
- Built with Streamlit
- Admin command reference from [SWGEmu Assembla Wiki](https://app.assembla.com/wiki/show/swgemu)

---

**Note**: This tool generates admin commands for use in SWGEmu servers. Ensure you have the appropriate permissions before using these commands in-game.

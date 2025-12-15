"""
SWGEmu Loot Group Parser
Parses Lua loot group files and creates a structured JSON database
"""

import os
import json
import re
from pathlib import Path

def parse_lua_loot_group(file_path):
    """Parse a single Lua loot group file"""
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    loot_groups = []
    
    # Find all addLootGroupTemplate calls to identify loot groups
    template_pattern = r'addLootGroupTemplate\("([^"]+)"'
    group_names = re.findall(template_pattern, content)
    
    for group_name in group_names:
        # Find the table definition by counting braces
        pattern = rf'{group_name}\s*=\s*\{{'
        start_match = re.search(pattern, content)
        
        if not start_match:
            continue
        
        # Find matching closing brace
        start_pos = start_match.end() - 1  # Position of opening brace
        brace_count = 1
        pos = start_pos + 1
        
        while pos < len(content) and brace_count > 0:
            if content[pos] == '{':
                brace_count += 1
            elif content[pos] == '}':
                brace_count -= 1
            pos += 1
        
        if brace_count != 0:
            continue
        
        # Extract content between braces
        group_content = content[start_pos + 1:pos - 1]
        
        loot_group = {
            'name': group_name,
            'description': '',
            'minimumLevel': 0,
            'maximumLevel': -1,
            'items': []
        }
        
        # Extract description
        desc_match = re.search(r'description\s*=\s*"([^"]*)"', group_content)
        if desc_match:
            loot_group['description'] = desc_match.group(1)
        
        # Extract minimum level
        min_level_match = re.search(r'minimumLevel\s*=\s*(\d+)', group_content)
        if min_level_match:
            loot_group['minimumLevel'] = int(min_level_match.group(1))
        
        # Extract maximum level
        max_level_match = re.search(r'maximumLevel\s*=\s*(-?\d+)', group_content)
        if max_level_match:
            loot_group['maximumLevel'] = int(max_level_match.group(1))
        
        # Extract loot items from lootItems array
        items_pattern = r'\{(?:\s*)itemTemplate\s*=\s*"([^"]+)"(?:\s*,\s*weight\s*=\s*(\d+))?\s*\}'
        item_matches = re.finditer(items_pattern, group_content)
        
        for item_match in item_matches:
            item_template = item_match.group(1)
            weight = int(item_match.group(2)) if item_match.group(2) else 1000000
            
            loot_group['items'].append({
                'template': item_template,
                'weight': weight
            })
        
        if loot_group['items']:  # Only add if it has items
            loot_groups.append(loot_group)
    
    return loot_groups

def categorize_path(file_path):
    """Determine category from file path"""
    path_parts = Path(file_path).parts
    
    # Find the index of 'groups' in the path
    try:
        groups_idx = path_parts.index('groups')
        if groups_idx < len(path_parts) - 1:
            category = path_parts[groups_idx + 1]
            # If it's a file directly under groups, use the filename
            if category.endswith('.lua'):
                category = 'General'
            return category.replace('_', ' ').title()
    except ValueError:
        pass
    
    return 'General'

def parse_all_loot_groups(loot_groups_dir):
    """Parse all Lua files in the loot groups directory"""
    all_groups = {}
    
    # Walk through all .lua files
    for root, dirs, files in os.walk(loot_groups_dir):
        for file in files:
            if file.endswith('.lua'):
                file_path = os.path.join(root, file)
                category = categorize_path(file_path)
                
                try:
                    groups = parse_lua_loot_group(file_path)
                    for group in groups:
                        group['category'] = category
                        group['file'] = file
                        all_groups[group['name']] = group
                except Exception as e:
                    print(f"Error parsing {file_path}: {e}")
    
    return all_groups

def main():
    """Main parser function"""
    # Get the path to the loot groups directory
    script_dir = Path(__file__).parent
    project_root = script_dir.parent
    loot_groups_dir = project_root / 'Core3' / 'MMOCoreORB' / 'bin' / 'scripts' / 'loot' / 'groups'
    
    if not loot_groups_dir.exists():
        print(f"Error: Loot groups directory not found at {loot_groups_dir}")
        return
    
    print(f"Parsing loot groups from: {loot_groups_dir}")
    
    # Parse all loot groups
    all_groups = parse_all_loot_groups(loot_groups_dir)
    
    print(f"Found {len(all_groups)} loot groups")
    
    # Save to JSON
    output_file = script_dir / 'loot_database.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_groups, f, indent=2)
    
    print(f"Database saved to: {output_file}")
    
    # Print category summary
    categories = {}
    for group in all_groups.values():
        cat = group['category']
        categories[cat] = categories.get(cat, 0) + 1
    
    print("\nCategories found:")
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count} groups")

if __name__ == '__main__':
    main()

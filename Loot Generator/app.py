"""
SWGEmu Admin Loot Generator
A Streamlit app for generating Star Wars Galaxies admin loot commands
"""

import streamlit as st
import json
import os
from pathlib import Path
import subprocess

# Page configuration
st.set_page_config(
    page_title="SWG Loot Generator",
    page_icon="⚔️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .stApp {
        max-width: 100%;
    }
    .loot-group-card {
        padding: 1rem;
        border-radius: 0.5rem;
        background-color: #f0f2f6;
        margin-bottom: 1rem;
    }
    .command-box {
        padding: 1rem;
        background-color: #1e1e1e;
        color: #00ff00;
        border-radius: 0.5rem;
        font-family: monospace;
        font-size: 1.1rem;
        margin: 1rem 0;
    }
    .item-list {
        max-height: 400px;
        overflow-y: auto;
    }
    .stat-badge {
        display: inline-block;
        padding: 0.25rem 0.5rem;
        background-color: #e0e0e0;
        border-radius: 0.25rem;
        margin: 0.25rem;
        font-size: 0.9rem;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_loot_database():
    """Load the loot database, generating it if necessary"""
    db_path = Path(__file__).parent / 'loot_database.json'
    
    if not db_path.exists():
        st.warning("Loot database not found. Generating from Lua files...")
        parser_path = Path(__file__).parent / 'parse_loot_groups.py'
        
        try:
            subprocess.run(['python', str(parser_path)], check=True, capture_output=True)
            st.success("Database generated successfully!")
        except subprocess.CalledProcessError as e:
            st.error(f"Error generating database: {e}")
            return {}
    
    try:
        with open(db_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        st.error(f"Error loading database: {e}")
        return {}

def calculate_drop_percentage(weight, total_weight):
    """Calculate drop percentage based on weight"""
    return (weight / total_weight * 100) if total_weight > 0 else 0

def format_item_name(template):
    """Format item template name to be more readable"""
    return template.replace('_', ' ').title()

def main():
    # Header
    st.title("⚔️ SWG Admin Loot Generator")
    st.markdown("Generate Star Wars Galaxies admin commands for spawning loot")
    
    # Load database
    loot_db = load_loot_database()
    
    if not loot_db:
        st.error("No loot groups found. Please check that the Core3 directory exists.")
        return
    
    # Initialize session state
    if 'command_history' not in st.session_state:
        st.session_state.command_history = []
    if 'favorites' not in st.session_state:
        st.session_state.favorites = []
    
    # Sidebar
    with st.sidebar:
        st.header("🎯 Filters & Search")
        
        # Category filter
        all_categories = sorted(set(group['category'] for group in loot_db.values()))
        selected_category = st.selectbox(
            "Category",
            ["All Categories"] + all_categories,
            key="category_filter"
        )
        
        # Search
        search_term = st.text_input("🔍 Search loot groups", placeholder="Enter group name...")
        
        # Quality slider
        st.markdown("---")
        st.subheader("⚙️ Quality Settings")
        quality = st.slider("Item Quality", min_value=1, max_value=500, value=100, step=1)
        
        st.info("💡 Higher quality values produce better item stats within the item's range.")
        
        # Refresh database button
        st.markdown("---")
        if st.button("🔄 Refresh Database"):
            st.cache_data.clear()
            parser_path = Path(__file__).parent / 'parse_loot_groups.py'
            try:
                subprocess.run(['python', str(parser_path)], check=True)
                st.success("Database refreshed!")
                st.rerun()
            except Exception as e:
                st.error(f"Error refreshing: {e}")
    
    # Main content
    col1, col2 = st.columns([2, 1])
    
    with col1:
        st.header("📦 Loot Groups")
        
        # Filter loot groups
        filtered_groups = {}
        for name, group in loot_db.items():
            # Category filter
            if selected_category != "All Categories" and group['category'] != selected_category:
                continue
            
            # Search filter
            if search_term and search_term.lower() not in name.lower():
                continue
            
            filtered_groups[name] = group
        
        st.caption(f"Showing {len(filtered_groups)} of {len(loot_db)} loot groups")
        
        # Display loot groups
        if not filtered_groups:
            st.warning("No loot groups match your filters.")
        else:
            # Group selection
            group_names = sorted(filtered_groups.keys())
            selected_group_name = st.selectbox(
                "Select a loot group",
                group_names,
                key="group_selector"
            )
            
            if selected_group_name:
                selected_group = filtered_groups[selected_group_name]
                
                # Display group info
                st.markdown("### 📋 Group Details")
                
                col_a, col_b, col_c = st.columns(3)
                with col_a:
                    st.metric("Category", selected_group['category'])
                with col_b:
                    st.metric("Min Level", selected_group['minimumLevel'])
                with col_c:
                    max_lvl = selected_group['maximumLevel']
                    st.metric("Max Level", "No Limit" if max_lvl == -1 else max_lvl)
                
                if selected_group['description']:
                    st.info(f"📝 {selected_group['description']}")
                
                # Items in group
                st.markdown("### 🎁 Items in This Group")
                
                items = selected_group['items']
                total_weight = sum(item['weight'] for item in items)
                
                with st.container():
                    st.markdown('<div class="item-list">', unsafe_allow_html=True)
                    
                    for idx, item in enumerate(items, 1):
                        drop_chance = calculate_drop_percentage(item['weight'], total_weight)
                        
                        with st.expander(f"{idx}. {format_item_name(item['template'])} - {drop_chance:.2f}% chance"):
                            st.code(f"Template: {item['template']}", language="text")
                            st.caption(f"Weight: {item['weight']:,}")
                            
                            # Progress bar for drop chance
                            st.progress(min(drop_chance / 100, 1.0))
                    
                    st.markdown('</div>', unsafe_allow_html=True)
    
    with col2:
        st.header("💻 Command Generator")
        
        if 'selected_group_name' in locals() and selected_group_name:
            # Generate command
            command = f"/object createloot {selected_group_name} {quality}"
            
            st.markdown("### Generated Command")
            st.code(command, language="bash")
            
            # Copy button
            if st.button("📋 Copy to Clipboard", key="copy_btn", use_container_width=True):
                st.write("Command copied to clipboard!")
                st.session_state.command_history.insert(0, command)
                # Keep only last 10 commands
                st.session_state.command_history = st.session_state.command_history[:10]
            
            # Favorite button
            col_fav, col_unfav = st.columns(2)
            with col_fav:
                if st.button("⭐ Add to Favorites", use_container_width=True):
                    if selected_group_name not in st.session_state.favorites:
                        st.session_state.favorites.append(selected_group_name)
                        st.success("Added to favorites!")
            
            with col_unfav:
                if selected_group_name in st.session_state.favorites:
                    if st.button("🗑️ Remove from Favorites", use_container_width=True):
                        st.session_state.favorites.remove(selected_group_name)
                        st.info("Removed from favorites")
            
            # Export button
            if st.button("📥 Export Command", use_container_width=True):
                export_text = f"# SWG Loot Command\n# Group: {selected_group_name}\n# Quality: {quality}\n\n{command}\n"
                st.download_button(
                    label="Download as .txt",
                    data=export_text,
                    file_name=f"{selected_group_name}_loot_command.txt",
                    mime="text/plain",
                    use_container_width=True
                )
            
            # Quality guide
            st.markdown("---")
            st.markdown("### 📊 Quality Guide")
            st.markdown("""
            - **1-50**: Low quality items
            - **51-150**: Standard quality
            - **151-300**: Good quality
            - **301-450**: Excellent quality
            - **451-500**: Maximum quality
            """)
        else:
            st.info("Select a loot group to generate commands")
        
        # Command history
        if st.session_state.command_history:
            st.markdown("---")
            st.markdown("### 📜 Recent Commands")
            for cmd in st.session_state.command_history[:5]:
                st.code(cmd, language="bash")
        
        # Favorites
        if st.session_state.favorites:
            st.markdown("---")
            st.markdown("### ⭐ Favorite Groups")
            for fav in st.session_state.favorites[:5]:
                if st.button(fav, key=f"fav_{fav}", use_container_width=True):
                    st.session_state.group_selector = fav
                    st.rerun()
    
    # Footer
    st.markdown("---")
    st.caption("SWGEmu Admin Loot Generator | Based on Core3 loot groups")

if __name__ == "__main__":
    main()

import streamlit as st
import requests
import json
from urllib.parse import urljoin

st.set_page_config(page_title="SWGEmu API Client", page_icon="🌌", layout="wide")

st.title("SWGEmu Core3 REST API Client")

# Sidebar for connection settings
with st.sidebar:
    st.header("Connection Settings")
    host = st.text_input("Host", value="localhost")
    port = st.number_input("Port", value=44443, min_value=1, max_value=65535)  # REST API port
    api_token = st.text_input("API Token", type="password")
    
    base_url = f"https://{host}:{port}"
    
    st.divider()
    st.header("Available Endpoints")
    endpoints = [
        {"name": "Version", "path": "/v1/version/", "method": "GET", "description": "Get API and Core3 version information"},
        {"name": "Object Info", "path": "/v1/object/{oid}/", "method": "GET", "description": "Get information about a specific object"},
        {"name": "Config", "path": "/v1/admin/config/", "method": "GET", "description": "Get server configuration"},
        {"name": "Stats", "path": "/v1/admin/stats/", "method": "GET", "description": "Get server statistics"},
        {"name": "Character Lookup", "path": "/v1/lookup/character/", "method": "GET", "description": "Look up character information"},
        {"name": "Guild Lookup", "path": "/v1/lookup/guild/", "method": "GET", "description": "Look up guild information"},
    ]
    
    selected_endpoint = st.selectbox(
        "Select Endpoint",
        options=[endpoint["name"] for endpoint in endpoints],
        index=0
    )
    
    # Get the selected endpoint details
    selected_endpoint_details = next(endpoint for endpoint in endpoints if endpoint["name"] == selected_endpoint)
    
    st.write(f"**Method:** {selected_endpoint_details['method']}")
    st.write(f"**Path:** {selected_endpoint_details['path']}")
    st.write(f"**Description:** {selected_endpoint_details['description']}")

# Main content area
st.header("Request Parameters")

# Dynamic parameters based on selected endpoint
params = {}
if selected_endpoint == "Object Info":
    object_id = st.text_input("Object ID", value="")
    if object_id:
        params["oid"] = object_id
elif selected_endpoint == "Character Lookup":
    search_type = st.radio("Search Type", options=["By Name", "By Object ID"])
    if search_type == "By Name":
        character_name = st.text_input("Character Name", value="")
        if character_name:
            params["name"] = character_name
    else:
        character_id = st.text_input("Character Object ID", value="")
        if character_id:
            params["oid"] = character_id
elif selected_endpoint == "Guild Lookup":
    search_type = st.radio("Search Type", options=["By Name", "By Object ID"])
    if search_type == "By Name":
        guild_name = st.text_input("Guild Name", value="")
        if guild_name:
            params["name"] = guild_name
    else:
        guild_id = st.text_input("Guild Object ID", value="")
        if guild_id:
            params["oid"] = guild_id

# Execute button
if st.button("Execute Request"):
    if not api_token:
        st.error("API Token is required")
    else:
        try:
            # Prepare the URL
            path = selected_endpoint_details["path"]
            
            # Replace path parameters if needed
            if selected_endpoint == "Object Info" and "oid" in params:
                path = path.replace("{oid}", params["oid"])
                params.pop("oid", None)
            
            url = urljoin(base_url, path)
            
            # Prepare headers
            headers = {
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json"
            }
            
            # Make the request
            with st.spinner("Making request..."):
                # Add more detailed error handling and debugging
                st.write(f"Making request to: {url}")
                st.write(f"Headers: {headers}")
                st.write(f"Params: {params}")
                
                response = requests.request(
                    method=selected_endpoint_details["method"],
                    url=url,
                    headers=headers,
                    params=params,
                    verify=False,  # Disable SSL verification for self-signed certificates
                    timeout=10  # Add timeout
                )
            
            # Display the response
            st.subheader("Response")
            st.write(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    json_response = response.json()
                    st.json(json_response)
                except json.JSONDecodeError:
                    st.text(response.text)
            else:
                st.error(f"Error: {response.text}")
        
        except Exception as e:
            st.error(f"Error making request: {str(e)}")

# Information about the API
with st.expander("About the SWGEmu Core3 REST API"):
    st.markdown("""
    The SWGEmu Core3 REST API provides programmatic access to the Star Wars Galaxies Emulator server. 
    It allows you to retrieve information about the server, objects, characters, and guilds, as well as 
    perform administrative tasks.
    
    This client application helps you interact with the API by providing a user-friendly interface.
    
    **Authentication**:
    - The API requires authentication using a Bearer token.
    - You need to provide this token in the sidebar.
    - The API token is configured in the server's config-local.lua file as `Core3.RESTServer.APIToken`.
    - For this server, the token is: `swgemu_secure_api_token_12345`
    
    **Note**: This is a basic client and may not support all API features. For advanced usage, 
    consider using a tool like Postman or writing custom scripts.
    """)

st.divider()
st.caption("Created with Streamlit for SWGEmu Core3 REST API")

# SWGEmu REST API Setup

This document explains how to use the SWGEmu Core3 REST API with your Streamlit application.

## Changes Made

The following changes have been made to enable the REST API:

1. Created `conf/config-local.lua` with the following settings:
   - Enabled the REST API on port 44443
   - Set an API token: `swgemu_secure_api_token_12345`
   - Configured LogLevel and WorkerThreads

2. Updated `docker-compose.yml` to expose port 44443 for the REST API.

3. Modified `swgemu_api_client.py` to:
   - Use port 44443 by default
   - Include information about the API token in the "About" section

## How to Apply These Changes

To apply these changes and start using the REST API:

1. Restart your Docker containers:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

2. Wait for the server to fully start up. You can check the logs with:
   ```bash
   docker-compose logs -f swgemu
   ```

3. Look for a message like: `[RESTServer] listening to port 44443` which indicates the REST API is running.

4. Run your Streamlit app:
   ```bash
   streamlit run swgemu_api_client.py
   ```

5. In the Streamlit app, use the following settings:
   - Host: `localhost` (since Docker is exposing the port to your local machine)
   - Port: `44443` (the REST API port)
   - API Token: `swgemu_secure_api_token_12345`

## Important Notes

1. **API Token Security**: The API token set in this example (`swgemu_secure_api_token_12345`) is for demonstration purposes. In a production environment, you should use a more secure token.

2. **Compilation Requirements**: The REST API requires that the Core3 server was compiled with the `ENABLE_REST_SERVER` option enabled. If you're using a pre-built Docker image, you may need to rebuild it with this option enabled.

3. **Connectivity**: Since your game server is running in Docker and your Streamlit app is running locally, the connection works because the Docker container exposes the REST API port to your local machine.

4. **SSL**: For additional security, you can configure SSL for the REST API by setting the following in `config-local.lua`:
   ```lua
   Core3.RESTServer.SSLKeyFile = "/path/to/key.pem"
   Core3.RESTServer.SSLCertFile = "/path/to/cert.pem"
   ```

5. **Available Endpoints**: The REST API provides various endpoints for retrieving information about the server, objects, characters, and guilds. The Streamlit app includes some of these endpoints, but there may be more available depending on your server version.

## Troubleshooting

If you encounter issues connecting to the REST API:

1. Verify the server is running and the REST API is enabled by checking the logs.
2. Ensure the API token in your Streamlit app matches the one in `config-local.lua`.
3. Check that port 44443 is properly exposed in your Docker configuration.
4. If using a firewall, ensure port 44443 is allowed.

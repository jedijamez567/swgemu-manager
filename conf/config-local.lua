-- This file is parsed after config.lua and can be used to override settings

-- Enable REST API Server
Core3.RESTServerPort = 44443  -- Choose a port (different from 0 to enable)

-- REST API Configuration
Core3.RESTServer = {
    APIToken = "swgemu_secure_api_token_12345",  -- Must be at least 15 characters
    LogLevel = 4,  -- -1 NONE, 0 FATAL, 1 ERROR, 2 WARNING, 3 LOG, 4 INFO, 5 DEBUG
    WorkerThreads = 4,  -- Number of worker threads
    SSLKeyFile = "conf/ssl.key",
    SSLCertFile = "conf/ssl.crt"
}

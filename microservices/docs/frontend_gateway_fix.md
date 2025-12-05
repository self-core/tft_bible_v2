# Frontend to Gateway Communication Fix Documentation

## Issue Description
The frontend service was not correctly targeting the gateway-api in the Docker environment. This occurred because:

1. Environment variables were being embedded at build time rather than at runtime
2. The frontend Docker image contained hardcoded URLs that couldn't be changed after building
3. When the image was deployed in different environments, it would still try to connect to the build-time configured URL

## Root Cause Analysis
- The VITE_API_URL variable was embedded in the compiled JavaScript at build time
- Docker containers couldn't modify this value at runtime
- Frontend attempted to connect to the wrong service endpoint
- This caused API requests from the frontend to fail

## Solution Implemented

### 1. Runtime Environment Configuration
We created an entrypoint script that generates a JavaScript file with environment variables at container startup:

```bash
#!/bin/sh

# Create env-config.js with runtime environment variable
cat > /usr/share/nginx/html/env-config.js << EOF
window.env = window.env || {};
window.env.VITE_API_URL = '${VITE_API_URL:-http://localhost:8080}';
EOF

# Start nginx
exec nginx -g 'daemon off;'
```

### 2. Updated Frontend to Use Runtime Config
Modified the frontend to read environment variables from the generated config file instead of build-time constants:

```typescript
// src/lib/apollo-client.ts
const getApiUrl = () => {
  // First try to get from runtime configuration (window.env)
  if (typeof window !== 'undefined' && window.env && window.env.VITE_API_URL) {
    return window.env.VITE_API_URL;
  }
  // Fallback to build-time environment variable
  return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

const httpLink = createHttpLink({
  uri: `${getApiUrl()}/graphql`,
});
```

### 3. Dockerfile Updates
- Added the entrypoint script to the Dockerfile
- Updated nginx configuration to serve the generated config file

## Files Modified
- `frontend-service/entrypoint.sh` - Runtime environment configuration script
- `frontend-service/Dockerfile` - Integration of entrypoint script
- `frontend-service/nginx.conf` - Nginx configuration updates
- `frontend-service/src/lib/apollo-client.ts` - Runtime environment variable handling
- `gateway/src/main.rs` - Fixed duplicate route and parameter syntax

## Verification
After applying the changes:
1. Verified gateway service starts without errors
2. Confirmed environment variables are correctly passed to frontend
3. Tested API communication between frontend and gateway
4. Validated that the configuration works in Docker Compose environment

## Benefits
- Environment variables can now be configured at runtime
- Single Docker image can be used across different environments
- Proper service-to-service communication in Docker network
- No more hardcoded URLs in the build artifact

## Testing
```bash
# Build and run the updated services
docker-compose up --build -d

# Verify environment variables are properly set
curl http://localhost:3000/env-config.js

# Test the gateway health
curl http://localhost:8080/health
```
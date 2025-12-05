#!/bin/sh

# Create env-config.js with runtime environment variable
cat > /usr/share/nginx/html/env-config.js << EOF
window.env = window.env || {};
window.env.VITE_API_URL = '${VITE_API_URL:-http://localhost:8080}';
EOF

# Start nginx
exec nginx -g 'daemon off;'
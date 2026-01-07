#!/bin/sh
# Create env-config.js with runtime environment variable
cat > /usr/share/nginx/html/env-config.js << EOF
window.env = window.env || {};
window.env.VITE_GRAPHQL_URL = '${VITE_GRAPHQL_URL:-/graphql}';
EOF
# Start nginx
exec nginx -g 'daemon off;'
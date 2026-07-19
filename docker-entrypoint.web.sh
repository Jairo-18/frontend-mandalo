#!/bin/sh
# Corre al arrancar el contenedor nginx (via /docker-entrypoint.d/): escribe
# /env.js con las env RUNTIME del contenedor (las de la pestaña Environment
# de Dokploy) y lo inyecta en el index.html antes del bundle (que va con
# defer, así que env.js siempre ejecuta primero). constants/api.ts lee
# window.__MANDALO_ENV__ con prioridad sobre lo horneado en el build →
# cambiar de API/key solo pide RESTART del contenedor, no rebuild.
set -e

HTML_DIR=/usr/share/nginx/html

cat > "$HTML_DIR/env.js" <<EOF
window.__MANDALO_ENV__ = {
  EXPO_PUBLIC_PROD_API_URL: "${EXPO_PUBLIC_PROD_API_URL:-}",
  EXPO_PUBLIC_CLIENT_API_KEY: "${EXPO_PUBLIC_CLIENT_API_KEY:-}",
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: "${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:-}"
};
EOF

# Idempotente: en un restart (mismo filesystem) el tag ya quedó inyectado.
if ! grep -q 'src="/env.js"' "$HTML_DIR/index.html"; then
  sed -i 's|</head>|<script src="/env.js"></script></head>|' "$HTML_DIR/index.html"
fi

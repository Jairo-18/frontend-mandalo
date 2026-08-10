#!/usr/bin/env bash
# Build RELEASE de un solo uso para grabar el video de "divulgación
# destacada" de Google Play (NOTAS §67-68). Redirige EXPO_PUBLIC_PROD_API_URL
# a la API de DEV solo en .env.production.local (la que leen los builds
# locales — EAS no la lee, así que esto no afecta builds reales) y lo
# revierte SIEMPRE al salir, incluso si el build falla o se corta con Ctrl-C.
#
# No pasa -PreactNativeArchitectures: el default de gradle.properties ya
# incluye x86_64 (necesario para correr en el emulador — un release con solo
# armeabi-v7a/arm64-v8a crashea en el emulador, ver NOTAS §65 punto 4).
#
#   ./scripts/build-demo.sh
set -euo pipefail
cd "$(dirname "$0")/.."

ENV_FILE=".env.production.local"
BACKUP_FILE=".env.production.local.bak"
DEMO_API_URL="https://apidev.somosmandalo.com"
# Tiene que coincidir con APP_CLIENT_API_KEY de backend-mandalo/.env.development
# — /auth/sign-in tiene @SkipApiKey() y funciona igual sin esto, pero CASI
# TODO LO DEMÁS (incluido /invoice/paginated) lo exige y lo rechaza en
# silencio si la key es la de prod. Confirmado en vivo: con la key de prod el
# login pasaba pero "Mis entregas" salía vacío pese a haber pedidos reales.
DEMO_CLIENT_API_KEY="sk_dev_mandalo_d9ebe7d3167b5a0ec6ec53a2ff13de82"

if [ -f "$BACKUP_FILE" ]; then
  echo "ABORT: ya existe $BACKUP_FILE — una corrida anterior no se revirtió." >&2
  echo "Revisa $ENV_FILE contra el .bak antes de continuar." >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "ABORT: no existe $ENV_FILE — no hay nada que respaldar/redirigir." >&2
  exit 1
fi

cp "$ENV_FILE" "$BACKUP_FILE"
trap 'mv -f "$BACKUP_FILE" "$ENV_FILE" && echo "Revertido $ENV_FILE desde el backup."' EXIT INT TERM

if grep -q '^EXPO_PUBLIC_PROD_API_URL=' "$ENV_FILE"; then
  sed -i "s#^EXPO_PUBLIC_PROD_API_URL=.*#EXPO_PUBLIC_PROD_API_URL=$DEMO_API_URL#" "$ENV_FILE"
else
  printf '\nEXPO_PUBLIC_PROD_API_URL=%s\n' "$DEMO_API_URL" >> "$ENV_FILE"
fi
if grep -q '^EXPO_PUBLIC_CLIENT_API_KEY=' "$ENV_FILE"; then
  sed -i "s#^EXPO_PUBLIC_CLIENT_API_KEY=.*#EXPO_PUBLIC_CLIENT_API_KEY=$DEMO_CLIENT_API_KEY#" "$ENV_FILE"
else
  printf '\nEXPO_PUBLIC_CLIENT_API_KEY=%s\n' "$DEMO_CLIENT_API_KEY" >> "$ENV_FILE"
fi

# `api.ts` SIEMPRE compila el literal "https://apiprod.somosmandalo.com" como
# fallback (código muerto si el env está seteado, pero el STRING queda en el
# bundle igual) — grepear su ausencia da falso positivo. Y como
# `createBundleReleaseJsAndAssets` no declara el env var como input, Gradle
# puede darlo por UP-TO-DATE y reusar un bundle viejo horneado con otra URL:
# se borra a mano para forzar que se regenere sí o sí.
BUNDLE="android/app/build/generated/assets/react/release/index.android.bundle"
rm -f "$BUNDLE"

echo "Compilando release apuntado a $DEMO_API_URL ..."
BUILD_LOG="$(mktemp)"
npx expo run:android --variant release 2>&1 | tee "$BUILD_LOG"

if [ ! -f "$BUNDLE" ]; then
  echo "ABORT: no encontré $BUNDLE — el build no llegó a generar el bundle release." >&2
  exit 1
fi

# Señal fuerte: el propio log de bundling confirma que exportó la variable
# (no depende de interpretar el bundle minificado, que trae ambas URLs como
# strings sueltos sin contexto legible).
if ! grep -qE "env: export.*EXPO_PUBLIC_PROD_API_URL" "$BUILD_LOG"; then
  echo "ABORT: el log de bundling no exportó EXPO_PUBLIC_PROD_API_URL — revisa $ENV_FILE a mano." >&2
  exit 1
fi
if ! grep -qE "env: export.*EXPO_PUBLIC_CLIENT_API_KEY" "$BUILD_LOG"; then
  echo "ABORT: el log de bundling no exportó EXPO_PUBLIC_CLIENT_API_KEY — revisa $ENV_FILE a mano." >&2
  exit 1
fi
if ! grep -q "$DEMO_API_URL" "$BUNDLE"; then
  echo "ABORT: el bundle no contiene $DEMO_API_URL — el override no llegó al bundle." >&2
  exit 1
fi
if ! grep -q "$DEMO_CLIENT_API_KEY" "$BUNDLE"; then
  echo "ABORT: el bundle no contiene la client key de dev — el override no llegó al bundle." >&2
  exit 1
fi

echo "OK: bundling exportó ambas variables y el bundle las contiene."
echo "Verificación DEFINITIVA sigue siendo funcional: loguéate con una cuenta"
echo "que exista SOLO en dev (p. ej. repartidor1@demo.mandalo.com) Y confirma"
echo "que 'Mis entregas' carga pedidos reales, no solo que el login pase —"
echo "el login no exige la client key pero casi todo lo demás sí."
echo "Listo para grabar. Al terminar, .env.production.local queda revertido solo (trap de salida)."

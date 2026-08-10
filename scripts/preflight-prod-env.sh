#!/usr/bin/env bash
# Corre esto ANTES de cualquier build de RELEASE de verdad (local
# `gradlew assembleRelease` / `expo run:android --variant release`).
# EAS (`eas build`) no lee .env.production.local, así que este chequeo no
# aplica a esos builds — solo protege los builds locales.
#
# Aborta si scripts/build-demo.sh dejó .env.production.local.bak sin
# revertir: esa es la señal de que .env.production.local pudo quedar
# apuntando al backend de DEV en vez de a producción.
set -euo pipefail
cd "$(dirname "$0")/.."

if [ -f .env.production.local.bak ]; then
  echo "ABORT: existe .env.production.local.bak" >&2
  echo "Eso significa que scripts/build-demo.sh (grabación del video de Play Store)" >&2
  echo "no revirtió .env.production.local — puede seguir apuntando al backend de DEV." >&2
  echo "Resuelve esto antes de seguir: revisa .env.production.local contra el .bak," >&2
  echo "restaura a mano si hace falta, y borra el .bak." >&2
  exit 1
fi

echo "OK: sin .env.production.local.bak pendiente."

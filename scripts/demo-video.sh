#!/usr/bin/env bash
# Graba el video de "divulgación destacada" + tracking en vivo para Google
# Play (ver SIMULACION.md). Repartidor = TELÉFONO FÍSICO real (los
# emuladores no pueden resolver GPS de verdad — GMS no se certifica en
# ningún AVD probado, con o sin cuenta Google logueada). Cliente = emulador
# CLIENTE. Ambas pantallas se espejan con scrcpy (mismo mecanismo para
# teléfono y emulador — scrcpy solo necesita adb) en posiciones fijas, así
# ffmpeg graba el escritorio completo con las dos ventanas siempre en el
# mismo lugar sin depender de dónde el SO decida abrir la ventana nativa
# del emulador.
#
# Uso:
#   ./scripts/demo-video.sh [duración_segundos]
#
# El video ARRANCA DESDE EL LAUNCHER (Google pide ver la apertura de la
# app) — el script fuerza el cierre de Mandalo en el teléfono antes de la
# cuenta regresiva, así que no hace falta dejarla abierta de antemano.
#
# Antes de correr (a mano, este script NO lo automatiza — ver por qué en
# el aviso que imprime antes de la cuenta regresiva):
#   - Teléfono conectado por USB con depuración habilitada, con el build de
#     scripts/build-demo.sh ya instalado, logueado como
#     repartidor1@demo.mandalo.com, con el pedido de seed-delivery.ts en
#     RUTA (si ya expiró/se entregó, correr seed-delivery.ts de nuevo).
#   - Si querés grabar la divulgación de background desde cero (el frame
#     que busca el revisor de Google), desloguear el consentimiento propio
#     antes — si ya está otorgado, el paso de la divulgación no aparece.
#   - En el emulador CLIENTE: logueado como cliente1@demo.mandalo.com, con
#     el detalle de ESE pedido abierto (para ver el mapa en vivo).
set -euo pipefail
cd "$(dirname "$0")/.."

DURATION="${1:-45}"
# Las primeras 5 fases del guion son marcas FIJAS (apertura, divulgación,
# permiso, Home) — no escalan con DURATION porque son tiempos de
# interacción real, no proporciones. Solo la última fase (caminar / mock
# location) absorbe la duración que sobre.
T_LAUNCHER=3
T_MIS_ENTREGAS=8
T_DISCLOSURE=16
T_PERMISO=22
T_HOME=26
[ "$DURATION" -gt "$T_HOME" ] || { echo "ABORT: DURATION ($DURATION) tiene que ser mayor a $T_HOME — no alcanza ni para el guion fijo." >&2; exit 1; }
OUT_DIR="demo-video-output"
mkdir -p "$OUT_DIR"
OUT_FILE="$OUT_DIR/mandalo-demo-$(date +%Y%m%d-%H%M%S).mp4"

ANDROID_HOME="${ANDROID_HOME:-$LOCALAPPDATA/Android/Sdk}"
ADB="$ANDROID_HOME/platform-tools/adb.exe"
EMULATOR="$ANDROID_HOME/emulator/emulator.exe"
SCRCPY="$LOCALAPPDATA/Microsoft/WinGet/Packages/Genymobile.scrcpy_Microsoft.Winget.Source_8wekyb3d8bbwe/scrcpy-win64-v4.1/scrcpy.exe"
CLIENT_AVD="CLIENTE"

command -v ffmpeg >/dev/null || { echo "ABORT: falta ffmpeg en el PATH." >&2; exit 1; }
[ -x "$SCRCPY" ] || { echo "ABORT: no encuentro scrcpy en $SCRCPY (instalar: winget install Genymobile.scrcpy)." >&2; exit 1; }

# ---------- 1. Teléfono físico ----------
PHONE_SERIAL="${PHONE_SERIAL:-$("$ADB" devices -l | grep -v '^List' | grep -v 'emulator-' | awk '{print $1}' | head -1)}"
[ -n "$PHONE_SERIAL" ] || { echo "ABORT: no hay un teléfono físico en 'adb devices' — conectalo con depuración USB activa." >&2; exit 1; }
echo "Teléfono (repartidor): $PHONE_SERIAL"

# ---------- 2. Emulador CLIENTE ----------
CLIENT_SERIAL="$("$ADB" devices -l | grep 'emulator-' | awk '{print $1}' | head -1)"
if [ -z "$CLIENT_SERIAL" ]; then
  echo "Levantando $CLIENT_AVD en frío..."
  "$EMULATOR" -avd "$CLIENT_AVD" -no-snapshot-load >/dev/null 2>&1 &
  disown
  for _ in $(seq 1 60); do
    CLIENT_SERIAL="$("$ADB" devices -l | grep 'emulator-' | awk '{print $1}' | head -1)"
    [ -n "$CLIENT_SERIAL" ] && break
    sleep 3
  done
  [ -n "$CLIENT_SERIAL" ] || { echo "ABORT: $CLIENT_AVD no arrancó a tiempo." >&2; exit 1; }
  "$ADB" -s "$CLIENT_SERIAL" wait-for-device shell 'while [ -z "$(getprop sys.boot_completed)" ]; do sleep 2; done' >/dev/null
fi
echo "Emulador (cliente): $CLIENT_SERIAL"

# ---------- 3. Espejar ambas pantallas en posiciones fijas ----------
"$SCRCPY" -s "$PHONE_SERIAL" --window-title="REPARTIDOR" --window-x=0 --window-y=40 --window-width=420 --max-fps=30 >/dev/null 2>&1 &
SCRCPY_PHONE_PID=$!
"$SCRCPY" -s "$CLIENT_SERIAL" --window-title="CLIENTE" --window-x=460 --window-y=40 --window-width=420 --max-fps=30 >/dev/null 2>&1 &
SCRCPY_CLIENT_PID=$!
cleanup() { kill "$SCRCPY_PHONE_PID" "$SCRCPY_CLIENT_PID" 2>/dev/null || true; }
trap cleanup EXIT INT TERM

sleep 4

# ---------- 4. Cerrar Mandalo en el teléfono — el video arranca del launcher ----------
"$ADB" -s "$PHONE_SERIAL" shell am force-stop com.mandalo.app

# ---------- 5. Pausa para acomodar manualmente ambas pantallas ----------
# El login/navegación en el emulador CLIENTE y la decisión de si el
# consentimiento de background está reseteado (para que salga la
# divulgación) se dejan a mano a propósito: cambian de toma a toma, y
# automatizarlas a ciegas con taps por coordenada es justo lo que costó
# tiempo esta sesión (factor de escala 1.2 del preview, etc.).
cat <<'EOF'

Acomodá ambas ventanas (ya deberían verse: REPARTIDOR a la izquierda,
CLIENTE a la derecha):
  - REPARTIDOR: ya se cerró Mandalo — tiene que quedar en el LAUNCHER,
    con el ícono de Mandalo visible para tocarlo apenas arranque la toma.
  - CLIENTE: el detalle del pedido en RUTA ya abierto, mapa visible.

Presioná ENTER cuando las dos estén listas para arrancar la cuenta
regresiva y la grabación.
EOF
read -r _

# ---------- 6. Guion con marcas de tiempo ----------
# Se imprime ANTES de la cuenta regresiva y ENTERO — a partir de acá vas a
# tener el teléfono en la mano, no la terminal, así que esto es lo último
# que se ve antes de arrancar. El video CIERRA con la moto moviéndose en
# el mapa del cliente — esa es la función que evalúa el revisor, no que la
# app "no se cayó" al volver a abrirla.
fmt_time() { printf '%d:%02d' $(( $1 / 60 )) $(( $1 % 60 )); }
cat <<EOF

======================== GUION (dura $(fmt_time "$DURATION") en total) ========================
  0:00 - $(fmt_time "$T_LAUNCHER")   Abrir Mandalo desde el LAUNCHER (no arranca con la
              app ya abierta).
  $(fmt_time "$T_LAUNCHER") - $(fmt_time "$T_MIS_ENTREGAS")   "Mis entregas" → tocar el pedido.
  $(fmt_time "$T_MIS_ENTREGAS") - $(fmt_time "$T_DISCLOSURE")   DIVULGACIÓN COMPLETA, quieta en pantalla los 8
              segundos enteros. ESTE ES EL FRAME QUE BUSCA EL REVISOR —
              no la apures.
  $(fmt_time "$T_DISCLOSURE") - $(fmt_time "$T_PERMISO")   "Activar ubicación" → permiso nativo → Ajustes →
              "Allow all the time" → volver.
  $(fmt_time "$T_PERMISO") - $(fmt_time "$T_HOME")   HOME — notificación persistente visible.
  $(fmt_time "$T_HOME") - $(fmt_time "$DURATION")   Caminá con el teléfono (o mock location). La ventana
              CLIENTE tiene que mostrar el punto moviéndose en el mapa.
              ACÁ TERMINA EL VIDEO — no vuelvas a abrir la app.
=================================================================================

EOF

echo ">>> Grabando $DURATION segundos en 10..."
for i in 10 9 8 7 6 5 4 3 2 1; do
  echo "  $i..."
  sleep 1
done
echo ">>> GRABANDO — arrancá tocando el ícono de Mandalo ahora."

# ---------- 7. Grabar escritorio completo ----------
ffmpeg -y -f gdigrab -framerate 30 -i desktop -t "$DURATION" -pix_fmt yuv420p "$OUT_FILE"

echo ""
echo "Listo: $OUT_FILE"

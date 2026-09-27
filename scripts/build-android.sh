#!/usr/bin/env bash
#
# Compila el .aab de producción de Mandalo DENTRO de WSL2 y saca además un
# .apk universal instalable a mano, sin gastar builds en la nube de EAS.
#
# Por qué existe: `eas build --local` exige Linux/macOS (en PowerShell corta
# con "Unsupported platform"), y correr el proyecto desde /mnt/c usa el
# node_modules de Windows, cuyos binarios nativos no sirven en Linux. De ahí
# la copia en ~/mandalo-frontend. Receta original en contexto/NOTAS.md §87.
#
# El .apk NO es un segundo build: se extrae del mismo .aab con bundletool, así
# que sale en ~1 minuto, va firmado con la misma clave y no consume otro
# versionCode del contador remoto de EAS.
#
# Uso (desde WSL):   bash scripts/build-android.sh [opciones]
# Uso (desde Windows): npm run build:android
#
#   --no-apk           solo el .aab (se salta bundletool)
#   --deps             fuerza `npm install` aunque no falte nada
#   --profile <name>   perfil de eas.json (por defecto: production)
#   --from-aab <ruta>  NO compila: empaqueta el .apk de un .aab que ya existe
#
set -euo pipefail

WIN_PROJECT="/mnt/c/Trabajo/mandalo/frontend-mandalo"
WORK="$HOME/mandalo-frontend"
TOOLCHAIN="$HOME/android-toolchain/env.sh"
BUNDLETOOL="$HOME/android-toolchain/bundletool.jar"
# Credenciales del keystore de subida, FUERA del repo. Ver el bloque de ayuda
# de `require_keystore` más abajo si el archivo no existe todavía.
KEYSTORE_ENV="$HOME/keystores/mandalo-upload.env"
OUT_WIN="/mnt/c/Trabajo/mandalo/builds"

PROFILE="production"
MAKE_APK=1
FORCE_DEPS=0
FROM_AAB=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-apk) MAKE_APK=0; shift ;;
    --deps) FORCE_DEPS=1; shift ;;
    --profile) PROFILE="${2:?--profile necesita un nombre}"; shift 2 ;;
    --from-aab) FROM_AAB="${2:?--from-aab necesita una ruta}"; shift 2 ;;
    *) echo "Opción desconocida: $1" >&2; exit 2 ;;
  esac
done

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$1"; }
fail() { printf '\n\033[1;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

# ---------------------------------------------------------------- 1. entorno
step "Toolchain de Android"
[[ -f "$TOOLCHAIN" ]] || fail "No existe $TOOLCHAIN — ¿estás dentro de WSL2 (distro Ubuntu)?"
# shellcheck disable=SC1090
source "$TOOLCHAIN"
[[ -n "${ANDROID_HOME:-}" && -n "${JAVA_HOME:-}" ]] || fail "env.sh no exportó ANDROID_HOME/JAVA_HOME"
# TMPDIR tiene que caer en el disco real: en WSL2 /tmp es tmpfs (RAM) y el
# build con 4 ABIs nativas lo llena ("No space left on device"). Ver §87.
export TMPDIR="${TMPDIR:-$HOME/tmp-build}"
mkdir -p "$TMPDIR"
echo "JAVA_HOME=$JAVA_HOME"
echo "ANDROID_HOME=$ANDROID_HOME"
echo "TMPDIR=$TMPDIR"

if [[ -n "$FROM_AAB" ]]; then
  # Modo "solo empaquetar": el .aab ya está compilado, no hay nada que
  # sincronizar ni instalar. Útil para sacar el .apk de un build anterior sin
  # quemar 20 minutos de Gradle ni otro versionCode.
  [[ -f "$FROM_AAB" ]] || fail "No existe el .aab: $FROM_AAB"
  cd "$WORK"
  AAB="$FROM_AAB"
  step "Empaquetando desde un .aab existente"
  echo "$AAB"
else

# ------------------------------------------------------- 2. copiar el código
step "Sincronizando el código desde Windows"
[[ -d "$WIN_PROJECT" ]] || fail "No encuentro el proyecto en $WIN_PROJECT"
mkdir -p "$WORK"
# node_modules queda EXCLUIDO a propósito: el de Windows trae binarios nativos
# win32 (lightningcss de NativeWind, entre otros) que revientan en Linux.
rsync -a --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude .expo \
  --exclude 'android/build' \
  --exclude 'android/app/build' \
  --exclude 'android/.gradle' \
  "$WIN_PROJECT/" "$WORK/"
cd "$WORK"

# -------------------------------------------------------- 3. dependencias
step "Dependencias"
# El rsync trae el package.json nuevo pero NO lo que ese package.json necesita,
# así que cada dependencia agregada en Windows deja este entorno corto. Se
# detecta comparando contra node_modules en vez de correr npm install siempre.
MISSING="$(node -e '
  const fs = require("fs");
  const deps = Object.keys(require("./package.json").dependencies ?? {});
  const missing = deps.filter((p) => !fs.existsSync("node_modules/" + p));
  process.stdout.write(missing.join(" "));
' 2>/dev/null || echo "__NO_NODE_MODULES__")"

if [[ "$FORCE_DEPS" == "1" || -n "$MISSING" ]]; then
  [[ -n "$MISSING" ]] && echo "Faltan: $MISSING"
  npm install --no-audit --no-fund
else
  echo "Al día, no hace falta npm install."
fi

# Smoke test barato: si un plugin de app.json no resuelve, el build moriría
# 30 segundos después con un error mucho menos claro que este.
step "Verificando la config de Expo"
node node_modules/expo/bin/cli config --json > /dev/null \
  || fail "expo config falló — revisá los plugins de app.json y las dependencias"
echo "OK"

# ------------------------------------------------------------- 4. el build
step "Compilando el .aab (perfil: $PROFILE)"
echo "Son ~20 minutos de Gradle. El versionCode lo asigna EAS solo"
echo "(appVersionSource: remote + autoIncrement en eas.json)."
BEFORE="$(mktemp)"
ls -1 ./*.aab 2>/dev/null | sort > "$BEFORE" || true
npx eas-cli build --platform android --profile "$PROFILE" --local --non-interactive

AAB="$(ls -1t ./*.aab 2>/dev/null | head -1)"
[[ -n "$AAB" && -f "$AAB" ]] || fail "El build terminó pero no encuentro ningún .aab"
rm -f "$BEFORE"
echo "Generado: $AAB"

fi  # fin del modo build (vs --from-aab)

# ------------------------------------------------- 5. bundletool (.apk)
ensure_bundletool() {
  [[ -f "$BUNDLETOOL" ]] && return 0
  step "Descargando bundletool (una sola vez)"
  local url
  url="$(curl -sL https://api.github.com/repos/google/bundletool/releases/latest \
    | grep -o 'https://github.com/google/bundletool/releases/download/[^"]*bundletool-all-[^"]*\.jar' \
    | head -1)"
  [[ -n "$url" ]] || return 1
  echo "$url"
  curl -fL --progress-bar -o "$BUNDLETOOL" "$url" || return 1
}

# Saca universal.apk de dentro del .apks (que es un zip). `unzip` NO viene en
# una Ubuntu de WSL recién instalada, así que hay tres caminos por orden de
# preferencia — `jar` es el respaldo garantizado, porque el JDK ya es
# requisito para correr bundletool.
extract_universal() {
  local apks="$1" dest="$2" tmp
  if command -v unzip > /dev/null 2>&1; then
    unzip -p "$apks" universal.apk > "$dest"
  elif command -v python3 > /dev/null 2>&1; then
    python3 -c 'import sys, zipfile; open(sys.argv[2], "wb").write(zipfile.ZipFile(sys.argv[1]).read("universal.apk"))' \
      "$apks" "$dest"
  else
    tmp="$(mktemp -d)"
    ( cd "$tmp" && "$JAVA_HOME/bin/jar" --extract --file "$apks" universal.apk )
    mv "$tmp/universal.apk" "$dest"
    rm -rf "$tmp"
  fi
}

require_keystore() {
  if [[ ! -f "$KEYSTORE_ENV" ]]; then
    cat >&2 <<EOF

No encuentro $KEYSTORE_ENV, así que no puedo firmar el .apk.
El .aab ya quedó listo igual; para habilitar el .apk, una sola vez:

  mkdir -p ~/keystores && chmod 700 ~/keystores
  cp /mnt/c/<donde-guardaste>/@jairo-18__mandalo.jks ~/keystores/mandalo-upload.jks
  cat > ~/keystores/mandalo-upload.env <<'CONF'
KEYSTORE_PATH=$HOME/keystores/mandalo-upload.jks
KEYSTORE_PASSWORD=<el que imprimió eas credentials>
KEY_ALIAS=<el alias>
KEY_PASSWORD=<la key password>
CONF
  chmod 600 ~/keystores/mandalo-upload.env

Es el MISMO keystore que EAS usa para firmar el .aab: así el .apk que le pasés
a un tester tiene la huella que ya está registrada en Google Cloud.
EOF
    return 1
  fi
  # shellcheck disable=SC1090
  source "$KEYSTORE_ENV"
  [[ -f "${KEYSTORE_PATH:-}" ]] || { echo "KEYSTORE_PATH no apunta a un archivo" >&2; return 1; }
  return 0
}

APK=""
if [[ "$MAKE_APK" == "1" ]]; then
  step "Extrayendo el .apk universal del .aab"
  if ensure_bundletool && require_keystore; then
    # Las contraseñas van por archivo (--ks-pass=file:) y no en la línea de
    # comandos, para que no queden visibles en `ps`.
    PASSDIR="$(mktemp -d)"
    trap 'rm -rf "$PASSDIR"' EXIT
    # OJO: con `file:` el archivo lleva la contraseña PELADA. El prefijo
    # `pass:` es solo para la forma inline (`--ks-pass=pass:xxx`); metido en
    # el archivo, bundletool lo toma como parte de la contraseña y falla con
    # "Keystore was tampered with, or password was incorrect".
    printf '%s' "$KEYSTORE_PASSWORD" > "$PASSDIR/store"
    printf '%s' "$KEY_PASSWORD" > "$PASSDIR/key"
    chmod 600 "$PASSDIR/store" "$PASSDIR/key"

    APKS="$TMPDIR/mandalo-universal.apks"
    rm -f "$APKS"
    # --mode=universal: un solo .apk con las 4 ABIs adentro (pesa bastante más
    # que lo que baja un usuario de la tienda, pero se instala en cualquier
    # teléfono sin bundletool del otro lado).
    java -jar "$BUNDLETOOL" build-apks \
      --bundle="$AAB" \
      --output="$APKS" \
      --mode=universal \
      --ks="$KEYSTORE_PATH" \
      --ks-pass="file:$PASSDIR/store" \
      --ks-key-alias="$KEY_ALIAS" \
      --key-pass="file:$PASSDIR/key"
    APK="$WORK/mandalo-universal.apk"
    extract_universal "$APKS" "$APK"
    rm -f "$APKS"
    echo "Generado: $APK"
  else
    echo "→ Se omite el .apk. El .aab no se ve afectado."
  fi
fi

# -------------------------------------------------- 6. devolver a Windows
step "Copiando resultados a Windows"
VERSION_CODE=""
if [[ -f "$BUNDLETOOL" ]]; then
  VERSION_CODE="$(java -jar "$BUNDLETOOL" dump manifest --bundle="$AAB" \
    --xpath=/manifest/@android:versionCode 2>/dev/null | tr -d '[:space:]' || true)"
fi
VERSION_NAME="$(node -p "require('./app.json').expo.version" 2>/dev/null || echo "0.0.0")"
STAMP="v${VERSION_NAME}${VERSION_CODE:+-$VERSION_CODE}"

mkdir -p "$OUT_WIN"
cp "$AAB" "$OUT_WIN/mandalo-$STAMP.aab"
echo "  $OUT_WIN/mandalo-$STAMP.aab"
if [[ -n "$APK" && -f "$APK" ]]; then
  cp "$APK" "$OUT_WIN/mandalo-$STAMP.apk"
  echo "  $OUT_WIN/mandalo-$STAMP.apk"
fi

printf '\n\033[1;32m✔ Listo.\033[0m Los archivos quedaron en C:\\Trabajo\\mandalo\\builds\n'
echo "  .aab → AppGallery / Play Console"
[[ -n "$APK" ]] && echo "  .apk → instalación directa para un tester"
exit 0

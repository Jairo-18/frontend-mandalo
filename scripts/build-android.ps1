# Lanza el build de Android dentro de WSL2 (ver scripts/build-android.sh).
#
# Existe porque `eas build --local` corta en Windows con "Unsupported platform,
# macOS or Linux is required" — es un check duro del CLI, no hay flag para
# saltarlo. Este wrapper solo cruza a WSL y pasa los argumentos tal cual.
#
#   npm run build:android
#   npm run build:android -- --no-apk
#   npm run build:android -- --deps

$ErrorActionPreference = 'Stop'

$distro = 'Ubuntu'
$script = '/mnt/c/Trabajo/mandalo/frontend-mandalo/scripts/build-android.sh'

# `wsl -l -q` devuelve UTF-16 con NUL intercalados; se limpian antes de comparar.
$distros = (wsl -l -q) -replace "`0", '' | ForEach-Object { $_.Trim() } | Where-Object { $_ }
if ($distros -notcontains $distro) {
  Write-Host "No encuentro la distro '$distro' en WSL." -ForegroundColor Red
  Write-Host "Distros disponibles: $($distros -join ', ')"
  exit 1
}

$extra = if ($args.Count) { ' ' + ($args -join ' ') } else { '' }

Write-Host "Entrando a WSL ($distro)…" -ForegroundColor Cyan
wsl -d $distro -- bash -lc "bash '$script'$extra"
exit $LASTEXITCODE

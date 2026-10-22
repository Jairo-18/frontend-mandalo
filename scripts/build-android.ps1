# Lanza el build de Android dentro de WSL2 (ver scripts/build-android.sh).
#
# Existe porque `eas build --local` corta en Windows con "Unsupported platform,
# macOS or Linux is required" — es un check duro del CLI, no hay flag para
# saltarlo. Este wrapper solo cruza a WSL y pasa los argumentos tal cual.
#
#   npm run build:android
#   npm run build:android -- --no-apk
#   npm run build:android -- --deps
#   npm run build:android -- --keep-wsl   (no apagar WSL al terminar)
#
# Al terminar (bien o mal) hace `wsl --shutdown` para liberar la RAM.

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

# `--keep-wsl` es solo de este wrapper (no llega al .sh): deja WSL encendido.
$keepWsl = $args -contains '--keep-wsl'
$passArgs = @($args | Where-Object { $_ -ne '--keep-wsl' })
$extra = if ($passArgs.Count) { ' ' + ($passArgs -join ' ') } else { '' }

Write-Host "Entrando a WSL ($distro)…" -ForegroundColor Cyan
wsl -d $distro -- bash -lc "bash '$script'$extra"
$code = $LASTEXITCODE

# El daemon de Gradle y la VM de WSL se quedan con varios GB de RAM después
# del build. Se apaga WSL entero, salga bien o mal (el .aab ya quedó copiado
# en C:\Trabajo\mandalo\builds). `npm run build:android -- --keep-wsl` lo evita.
if ($keepWsl) {
  Write-Host 'WSL sigue encendido (--keep-wsl).' -ForegroundColor Yellow
} else {
  Write-Host 'Apagando WSL para liberar la RAM…' -ForegroundColor Cyan
  wsl --shutdown
  Write-Host 'WSL apagado.' -ForegroundColor Green
}
exit $code

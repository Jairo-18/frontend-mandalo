<#
.SYNOPSIS
  Apaga TODOS los emuladores de Android abiertos.

.DESCRIPTION
  Les pide a los emuladores que se cierren por adb ("emu kill"), lo que
  guarda su estado de arranque rapido (Quick Boot) para que el proximo
  "pnpm open-all" los levante en segundos. Si alguno no responde, mata el
  proceso a la fuerza (ese pierde el estado y arranca en frio la proxima vez).

.EXAMPLE
  pnpm kill-all
#>
$ErrorActionPreference = 'Continue'

if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"

& $adb start-server | Out-Null
$serials = (& $adb devices) -split "`n" | Where-Object { $_ -match '^emulator-\d+\s' } | ForEach-Object { ($_ -split '\s')[0] }

if (-not $serials) {
  Write-Host "No hay emuladores abiertos." -ForegroundColor Green
} else {
  foreach ($serial in $serials) {
    $name = ((& $adb -s $serial emu avd name 2>$null) -split "`n" | Select-Object -First 1)
    Write-Host "Apagando $serial ($("$name".Trim()))..." -ForegroundColor Yellow
    & $adb -s $serial emu kill | Out-Null
  }

  # Espera a que se cierren de verdad (guardar el snapshot tarda unos segundos).
  $deadline = (Get-Date).AddSeconds(60)
  while ((Get-Date) -lt $deadline) {
    if (-not (Get-Process -Name 'qemu-system-x86_64' -ErrorAction SilentlyContinue)) { break }
    Start-Sleep -Seconds 2
  }
}

$stuck = Get-Process -Name 'qemu-system-x86_64', 'emulator' -ErrorAction SilentlyContinue
if ($stuck) {
  Write-Host "Algunos no respondieron: los cierro a la fuerza." -ForegroundColor DarkYellow
  $stuck | Stop-Process -Force -Confirm:$false
}

Write-Host "Listo: no queda ningun emulador abierto." -ForegroundColor Green

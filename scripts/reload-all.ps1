<#
.SYNOPSIS
  Reinicia la app en TODOS los emuladores ya abiertos, sin reiniciarlos.

.DESCRIPTION
  Para cuando los emuladores siguen arriba pero la app quedo trabada, en
  blanco o desconectada de Metro (p. ej. se cerro la ventana de Metro).
  - Si Metro no esta escuchando, lo arranca en una ventana nueva y espera.
  - En cada emulador: "adb reverse" del puerto, cierra la app y la vuelve a
    abrir con el deep link del dev client apuntando a localhost (el reverse
    lleva ese localhost al PC), asi jala el bundle actual.
  Si no hay emuladores abiertos, usar "pnpm open-all".

.PARAMETER Port
  Puerto de Metro. Por defecto 8081.

.EXAMPLE
  pnpm reload-all
#>
param(
  [int]$Port = 8081
)

$ErrorActionPreference = 'Continue'

if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"
$projectRoot = Split-Path -Parent $PSScriptRoot

# Ubicacion (Mocoa, Putumayo) y hora de Colombia para cada emulador. Cada rol
# en un punto distinto a pocas cuadras, para que en el mapa no se encimen.
# Se usan PROVEEDORES DE PRUEBA de Android (gps, network y fused) y no
# "emu geo fix": la app pide la ubicacion a Google Play Services, que con
# precision "Balanced" usa la de red (el emulador no la tiene) y el "geo fix"
# es un punto GPS suelto que se pierde si nadie escucha en ese momento. Los
# proveedores de prueba se borran al reiniciar el emulador: por eso esto corre
# en cada open-all / reload-all.
$MocoaPoints = @{
  'CLIENTE'      = '1.1530,-76.6440'
  'NEGOCIO'      = '1.1497,-76.6464'
  'DOMICILIARIO' = '1.1470,-76.6500'
}
function Set-MocoaLocation {
  param([string]$Device)
  $name = ((& $adb -s $Device emu avd name 2>$null) -split "`n" | Select-Object -First 1)
  $name = "$name".Trim()
  $point = $MocoaPoints[$name]
  if (-not $point) { $point = '1.1497,-76.6464' }
  & $adb -s $Device shell appops set com.android.shell android:mock_location allow | Out-Null
  foreach ($provider in 'gps', 'network', 'fused') {
    & $adb -s $Device shell cmd location providers add-test-provider $provider 2>$null | Out-Null
    & $adb -s $Device shell cmd location providers set-test-provider-enabled $provider true | Out-Null
    & $adb -s $Device shell cmd location providers set-test-provider-location $provider --location $point | Out-Null
  }
  & $adb -s $Device shell cmd alarm set-timezone America/Bogota | Out-Null
}

& $adb start-server | Out-Null
$devices = (& $adb devices) -split "`n" | Where-Object { $_ -match '\tdevice' } | ForEach-Object { ($_ -split '\t')[0] }
if (-not $devices) {
  Write-Host "No hay emuladores abiertos. Usa 'pnpm open-all'." -ForegroundColor Red
  exit 1
}

# ---------- Metro ----------
if (-not (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)) {
  Write-Host "Metro no esta corriendo - lo arranco en una ventana nueva..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; npx expo start"
  $deadline = (Get-Date).AddMinutes(1)
  while ((Get-Date) -lt $deadline) {
    if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { break }
    Start-Sleep -Seconds 3
  }
} else {
  Write-Host "Metro ya esta corriendo en el puerto $Port." -ForegroundColor Green
}

# ---------- Reiniciar la app en cada emulador ----------
$deepLink = "exp+mandalo://expo-development-client/?url=http%3A%2F%2Flocalhost%3A${Port}"
foreach ($dev in $devices) {
  & $adb -s $dev reverse "tcp:$Port" "tcp:$Port" | Out-Null
  # Backend de dev: las fotos se guardan como http://localhost:3000/uploads/...
  & $adb -s $dev reverse tcp:3000 tcp:3000 | Out-Null
  Set-MocoaLocation -Device $dev
  & $adb -s $dev shell am force-stop com.mandalo.app | Out-Null
  & $adb -s $dev shell am start -a android.intent.action.VIEW -d "$deepLink" | Out-Null
  $name = ((& $adb -s $dev emu avd name 2>$null) -split "`n" | Select-Object -First 1)
  Write-Host "  $dev ($($name.Trim())) reiniciado" -ForegroundColor Green
}

Write-Host "`nListo. Para recargar solo el JS despues, presiona 'r' en la ventana de Metro." -ForegroundColor Cyan

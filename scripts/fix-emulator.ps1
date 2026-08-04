<#
.SYNOPSIS
  Revive un emulador Android colgado ("adb devices" lo muestra "offline" y
  "expo run:android" falla con "device offline").

.DESCRIPTION
  Mata los procesos del emulador atascado, reinicia el servidor de adb y
  opcionalmente levanta un AVD en frío (sin snapshot, evita que vuelva a
  arrancar en el mismo estado colgado).

.PARAMETER Avd
  Nombre del AVD a levantar después de limpiar (CLIENTE / DOMICILIARIO /
  NEGOCIO). Si se omite, solo limpia — corre "npx expo run:android" tú
  mismo después con el emulador que ya tengas abierto.

.EXAMPLE
  ./scripts/fix-emulator.ps1
  ./scripts/fix-emulator.ps1 -Avd CLIENTE
#>
param(
  [string]$Avd
)

$ErrorActionPreference = 'Continue'

if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"
$emulator = "$env:ANDROID_HOME\emulator\emulator.exe"

Write-Host "Matando procesos de emulador atascados..." -ForegroundColor Yellow
Get-Process -Name "qemu-system-x86_64", "emulator" -ErrorAction SilentlyContinue |
  Stop-Process -Force -Confirm:$false

Write-Host "Reiniciando adb..." -ForegroundColor Yellow
& $adb kill-server
& $adb start-server

Write-Host "`nDispositivos conectados:" -ForegroundColor Cyan
& $adb devices

if ($Avd) {
  Write-Host "`nLevantando '$Avd' en frio (sin snapshot)..." -ForegroundColor Yellow
  Start-Process -FilePath $emulator -ArgumentList "-avd", $Avd, "-no-snapshot-load"
  Write-Host "El emulador esta arrancando en segundo plano. Espera a que cargue y corre 'npx expo run:android'." -ForegroundColor Green
} else {
  Write-Host "`nAVDs disponibles:" -ForegroundColor Cyan
  & $emulator -list-avds
  Write-Host "`nCorre de nuevo con -Avd <nombre> para levantar uno, ej:" -ForegroundColor Green
  Write-Host "  ./scripts/fix-emulator.ps1 -Avd CLIENTE"
}

<#
.SYNOPSIS
  Levanta los 3 emuladores (CLIENTE, DOMICILIARIO, NEGOCIO), arranca Metro
  si no esta corriendo, y abre la app dentro de los 3 apuntando a ese Metro.

.DESCRIPTION
  Un solo comando para el caso de todos los dias: emuladores cerrados +
  Metro caido/reiniciado -> los 3 con la app abierta y conectada.
  - Mata procesos de emulador atascados y reinicia adb.
  - Abre los 3 AVD en frio (-no-snapshot-load).
  - Espera a que cada uno aparezca como "device" en adb (hasta 3 min).
  - Si el puerto de Metro no esta escuchando, arranca "npx expo start" en
    una ventana nueva (separada, para que veas sus logs aparte) y espera a
    que levante.
  - Aplica "adb reverse" del puerto a cada emulador (evita el problema de
    que el segundo/tercero no encuentre la IP de LAN del equipo).
  - Dispara el enlace exp+mandalo://... en cada uno para abrir la app.

.PARAMETER Avds
  Lista de AVDs a levantar. Por defecto los 3 de siempre.

.PARAMETER Port
  Puerto de Metro. Por defecto 8081.

.EXAMPLE
  ./scripts/open-all-emulators.ps1
#>
param(
  [string[]]$Avds = @('CLIENTE', 'DOMICILIARIO', 'NEGOCIO'),
  [int]$Port = 8081
)

$ErrorActionPreference = 'Continue'

if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"
$emulator = "$env:ANDROID_HOME\emulator\emulator.exe"
$projectRoot = Split-Path -Parent $PSScriptRoot

function Get-ReadyDeviceCount {
  (& $adb devices) -split "`n" | Where-Object { $_ -match '\tdevice$' } | Measure-Object | Select-Object -ExpandProperty Count
}

# adb ya lo muestra "device" apenas el puente USB/red esta arriba, pero
# Android (activity manager y demas servicios) puede tardar bastante mas en
# terminar de arrancar de verdad - sin esto "am start" falla con
# "Can't find service: activity" aunque el dispositivo ya salga listo.
function Wait-BootCompleted {
  param([string]$Device, [int]$TimeoutSeconds = 120)
  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    $val = (& $adb -s $Device shell getprop sys.boot_completed 2>$null).Trim()
    if ($val -eq '1') { return $true }
    Start-Sleep -Seconds 3
  }
  return $false
}

# ---------- 1. Limpieza de emuladores atascados ----------
Write-Host "Matando procesos de emulador atascados..." -ForegroundColor Yellow
Get-Process -Name "qemu-system-x86_64", "emulator" -ErrorAction SilentlyContinue |
  Stop-Process -Force -Confirm:$false
& $adb kill-server | Out-Null
& $adb start-server | Out-Null

# ---------- 2. Levantar los AVD ----------
foreach ($avd in $Avds) {
  Write-Host "Levantando $avd en frio..." -ForegroundColor Yellow
  Start-Process -FilePath $emulator -ArgumentList "-avd", $avd, "-no-snapshot-load" | Out-Null
}

# ---------- 3. Esperar a que los N aparezcan listos en adb ----------
Write-Host "`nEsperando a que los $($Avds.Count) emuladores esten listos (hasta 3 min)..." -ForegroundColor Cyan
$deadline = (Get-Date).AddMinutes(3)
while ((Get-Date) -lt $deadline) {
  $ready = Get-ReadyDeviceCount
  Write-Host "  Listos: $ready / $($Avds.Count)"
  if ($ready -ge $Avds.Count) { break }
  Start-Sleep -Seconds 10
}
& $adb devices

# ---------- 4. Arrancar Metro si no esta corriendo ----------
$portBusy = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if (-not $portBusy) {
  Write-Host "`nMetro no esta corriendo - lo arranco en una ventana nueva..." -ForegroundColor Yellow
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$projectRoot'; npx expo start"
  Write-Host "Esperando a que Metro levante en el puerto $Port..." -ForegroundColor Cyan
  $deadline = (Get-Date).AddMinutes(1)
  while ((Get-Date) -lt $deadline) {
    if (Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue) { break }
    Start-Sleep -Seconds 3
  }
} else {
  Write-Host "`nMetro ya esta corriendo en el puerto $Port." -ForegroundColor Green
}

# ---------- 5. IP de LAN para el deep link ----------
$ip = (Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.InterfaceAlias -notmatch 'Loopback|vEthernet|WSL' } |
  Select-Object -First 1).IPAddress
if (-not $ip) { $ip = 'localhost' }
$deepLink = "exp+mandalo://expo-development-client/?url=http%3A%2F%2F${ip}%3A${Port}"

# ---------- 6. Esperar boot real + reverse del puerto + abrir la app ----------
$devices = (& $adb devices) -split "`n" | Where-Object { $_ -match '\tdevice$' } | ForEach-Object { ($_ -split '\t')[0] }
foreach ($dev in $devices) {
  Write-Host "`nEsperando a que $dev termine de arrancar de verdad..." -ForegroundColor Yellow
  if (-not (Wait-BootCompleted -Device $dev)) {
    Write-Host "  $dev no confirmo boot_completed a tiempo, lo intento igual..." -ForegroundColor DarkYellow
  }
  Write-Host "Conectando $dev..." -ForegroundColor Yellow
  & $adb -s $dev reverse "tcp:$Port" "tcp:$Port" | Out-Null
  # Si la app ya estaba abierta en segundo plano de un intento anterior,
  # "am start" solo la trae al frente sin recargar el JS - fuerza el cierre
  # primero para que sea SIEMPRE un arranque limpio que jale el bundle actual.
  & $adb -s $dev shell am force-stop com.mandalo.app | Out-Null
  & $adb -s $dev shell am start -a android.intent.action.VIEW -d "$deepLink" | Out-Null
}

Write-Host "`nListo - deberia estar abriendo la app en: $($devices -join ', ')" -ForegroundColor Green

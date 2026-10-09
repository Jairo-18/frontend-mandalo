<#
.SYNOPSIS
  Levanta los 3 emuladores (CLIENTE, DOMICILIARIO, NEGOCIO), arranca Metro
  si no esta corriendo, y abre la app dentro de los 3 apuntando a ese Metro.

.DESCRIPTION
  Un solo comando para el caso de todos los dias: emuladores cerrados +
  Metro caido/reiniciado -> los 3 con la app abierta y conectada.
  - Respeta los emuladores que YA estan abiertos y solo levanta los que
    faltan (con -Restart mata todo y arranca de cero, como antes).
  - Abre los AVD que faltan con arranque rapido (Quick Boot: retoman donde
    quedaron al cerrarlos con "pnpm kill-all"). Con -Cold arrancan en frio.
  - Espera a que cada uno aparezca como "device" en adb (hasta 3 min).
  - Si el puerto de Metro no esta escuchando, arranca "npx expo start" en
    una ventana nueva (separada, para que veas sus logs aparte) y espera a
    que levante.
  - Aplica "adb reverse" del puerto de Metro y del 3000 (backend) a cada
    emulador: el localhost del emulador llega al PC (las fotos subidas en dev
    se guardan como http://localhost:3000/uploads/...).
  - Si un emulador no tiene la app de desarrollo (AVD recien creado), le
    instala android/app/build/outputs/apk/debug/app-debug.apk (el que deja
    "pnpm android"). Si cambian dependencias NATIVAS hay que regenerarlo.
  - Dispara el enlace exp+mandalo://... en cada uno para abrir la app.

.PARAMETER Avds
  Lista de AVDs a levantar. Por defecto los 3 de siempre.

.PARAMETER Port
  Puerto de Metro. Por defecto 8081.

.PARAMETER Restart
  Mata todos los emuladores y reinicia adb antes de levantarlos.

.PARAMETER Cold
  Arranque en frio (ignora el estado guardado). Mas lento; usar si un
  emulador quedo trabado.

.EXAMPLE
  ./scripts/open-all-emulators.ps1
#>
param(
  [string[]]$Avds = @('CLIENTE', 'DOMICILIARIO', 'NEGOCIO'),
  [int]$Port = 8081,
  [switch]$Restart,
  [switch]$Cold
)

$ErrorActionPreference = 'Continue'

if (-not $env:ANDROID_HOME) {
  $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
}
$adb = "$env:ANDROID_HOME\platform-tools\adb.exe"
$emulator = "$env:ANDROID_HOME\emulator\emulator.exe"
$projectRoot = Split-Path -Parent $PSScriptRoot
$debugApk = Join-Path $projectRoot 'android\app\build\outputs\apk\debug\app-debug.apk'

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

# Nombre del AVD de cada emulador que ya corre ("emulator-5554" -> "CLIENTE").
function Get-RunningAvds {
  $names = @()
  $serials = (& $adb devices) -split "`n" | Where-Object { $_ -match '^emulator-\d+\s' } | ForEach-Object { ($_ -split '\s')[0] }
  foreach ($serial in $serials) {
    $out = (& $adb -s $serial emu avd name 2>$null) -split "`n" | Select-Object -First 1
    if ($out) { $names += $out.Trim() }
  }
  return $names
}

# ---------- 1. Limpieza (solo con -Restart) ----------
if ($Restart) {
  Write-Host "Matando todos los emuladores..." -ForegroundColor Yellow
  Get-Process -Name "qemu-system-x86_64", "emulator" -ErrorAction SilentlyContinue |
    Stop-Process -Force -Confirm:$false
  & $adb kill-server | Out-Null
}
& $adb start-server | Out-Null

# ---------- 2. Levantar los AVD que falten ----------
$running = if ($Restart) { @() } else { Get-RunningAvds }
foreach ($avd in $Avds) {
  if ($running -contains $avd) {
    Write-Host "$avd ya esta abierto, lo dejo como esta." -ForegroundColor Green
    continue
  }
  $emuArgs = @('-avd', $avd, '-no-boot-anim')
  if ($Cold) { $emuArgs += '-no-snapshot-load' }
  Write-Host "Levantando $avd$(if ($Cold) { ' en frio' })..." -ForegroundColor Yellow
  Start-Process -FilePath $emulator -ArgumentList $emuArgs | Out-Null
}

# ---------- 3. Esperar a que los N aparezcan listos en adb ----------
# El primer arranque de un AVD recien creado tarda bastante mas.
Write-Host "`nEsperando a que los $($Avds.Count) emuladores esten listos (hasta 5 min)..." -ForegroundColor Cyan
$deadline = (Get-Date).AddMinutes(5)
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
  # AVD nuevo: sin la app de desarrollo no hay quien abra el deep link.
  $installed = & $adb -s $dev shell pm list packages com.mandalo.app 2>$null
  if (-not ($installed -match 'com.mandalo.app')) {
    if (Test-Path $debugApk) {
      Write-Host "Instalando la app de desarrollo en $dev..." -ForegroundColor Yellow
      & $adb -s $dev install -r "$debugApk" | Out-Null
    } else {
      Write-Host "  $dev no tiene la app y no existe $debugApk - corre 'pnpm android' una vez." -ForegroundColor Red
    }
  }
  Write-Host "Conectando $dev..." -ForegroundColor Yellow
  & $adb -s $dev reverse "tcp:$Port" "tcp:$Port" | Out-Null
  & $adb -s $dev reverse tcp:3000 tcp:3000 | Out-Null
  Set-MocoaLocation -Device $dev
  # Si la app ya estaba abierta en segundo plano de un intento anterior,
  # "am start" solo la trae al frente sin recargar el JS - fuerza el cierre
  # primero para que sea SIEMPRE un arranque limpio que jale el bundle actual.
  & $adb -s $dev shell am force-stop com.mandalo.app | Out-Null
  & $adb -s $dev shell am start -a android.intent.action.VIEW -d "$deepLink" | Out-Null
}

Write-Host "`nListo - deberia estar abriendo la app en: $($devices -join ', ')" -ForegroundColor Green

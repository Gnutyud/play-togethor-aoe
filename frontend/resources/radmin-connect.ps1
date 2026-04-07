# Radmin VPN Launcher Script for Windows
# This script ensures Radmin VPN is installed, running, and brought to the foreground.
# Logic: Find executable -> Start if needed -> Bring to front.
# Minimalist approach for maximum stability.

param(
    [Parameter(Mandatory=$false)]
    [string]$NetworkId, # Ignored in manual mode but kept for compatibility

    [Parameter(Mandatory=$false)]
    [string]$Password  # Ignored in manual mode but kept for compatibility
)

Add-Type -AssemblyName System.Windows.Forms

# ── 1. Find Radmin VPN executable ──────────────────────────────────────────────
# Covers both standard and variant filenames (RvRvpnGui.exe seen on user machine)
$radminPaths = @(
    "${env:ProgramFiles(x86)}\Radmin VPN\RvRvpnGui.exe",
    "${env:ProgramFiles(x86)}\Radmin VPN\RvpnGui.exe",
    "${env:ProgramFiles}\Radmin VPN\RvRvpnGui.exe",
    "${env:ProgramFiles}\Radmin VPN\RvpnGui.exe"
)

$radminExe = $null
foreach ($p in $radminPaths) {
    if (Test-Path $p) {
        $radminExe = $p
        break
    }
}

if (-not $radminExe) {
    Write-Error "Radmin VPN (RvRvpnGui.exe / RvpnGui.exe) not found. Please install Radmin VPN."
    exit 1
}

# ── 2. Ensure Radmin VPN is running and focused ────────────────────────────────
# Search for any process related to Radmin GUI
$radminProcess = Get-Process | Where-Object { $_.ProcessName -like "*RvRvpnGui*" -or $_.ProcessName -like "*RvpnGui*" } | Select-Object -First 1

$wshell = New-Object -ComObject wscript.shell

if (-not $radminProcess) {
    Write-Host "Launching Radmin VPN at $radminExe..."
    Start-Process $radminExe
    # Wait a few seconds for the app to show up
    Start-Sleep -Seconds 3
} else {
    Write-Host "Radmin VPN is already running. Bringing to front..."
}

# Try to give focus to the Radmin VPN window
# We try multiple times to ensure it pops up
for ($i = 0; $i -lt 3; $i++) {
    $wshell.AppActivate("Radmin VPN")
    Start-Sleep -Milliseconds 400
}

Write-Host "Radmin VPN is ready for manual join."
exit 0
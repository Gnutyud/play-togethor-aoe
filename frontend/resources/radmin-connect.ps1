# Radmin VPN Auto-Connect Script for Windows
# Uses Radmin VPN CLI to join a network
# Usage: powershell -ExecutionPolicy Bypass -File radmin-connect.ps1 -NetworkId "Network_1" -Password "Pass123"

param(
    [Parameter(Mandatory=$true)]
    [string]$NetworkId,
   
    [Parameter(Mandatory=$true)]
    [string]$Password
)

Write-Host "Starting Radmin VPN connect..."
Write-Host "Network ID: $NetworkId"

# Find RvpnGui.exe
$radminPaths = @(
    "${env:ProgramFiles(x86)}\Radmin VPN\RvpnGui.exe",
    "${env:ProgramFiles}\Radmin VPN\RvpnGui.exe"
)

$radminExe = $null
foreach ($p in $radminPaths) {
    if (Test-Path $p) {
        $radminExe = $p
        Write-Host "Found Radmin VPN at: $p"
        break
    }
}

if (-not $radminExe) {
    Write-Error "Radmin VPN (RvpnGui.exe) not found. Please install Radmin VPN first."
    exit 1
}

# Check if Radmin VPN is already running
$radminProcess = Get-Process "RvpnGui" -ErrorAction SilentlyContinue

if (-not $radminProcess) {
    Write-Host "Launching Radmin VPN in background..."
    Start-Process $radminExe -WindowStyle Hidden
    # Wait for it to initialize
    Start-Sleep -Seconds 4
}

# Use Radmin VPN CLI to join the network
# CLI syntax: RvpnGui.exe /joinnetwork:"NetworkId" /password:"Password"
Write-Host "Connecting to network via CLI..."

try {
    $proc = Start-Process -FilePath $radminExe `
        -ArgumentList "/joinnetwork:`"$NetworkId`"", "/password:`"$Password`"" `
        -Wait -PassThru -WindowStyle Hidden

    if ($proc.ExitCode -eq 0) {
        Write-Host "Connection initiated successfully!"
        exit 0
    } else {
        Write-Error "Radmin VPN returned exit code: $($proc.ExitCode)"
        exit 1
    }
} catch {
    Write-Error "Failed to run Radmin VPN CLI: $_"
    exit 1
}
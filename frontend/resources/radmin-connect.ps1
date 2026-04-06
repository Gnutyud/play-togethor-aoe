# Radmin VPN Auto-Connect Script for Windows
# Usage: powershell -ExecutionPolicy Bypass -File radmin-connect.ps1 -NetworkId "Network_1" -Password "Pass123"
 
param(
    [Parameter(Mandatory=$true)]
    [string]$NetworkId,
   
    [Parameter(Mandatory=$true)]
    [string]$Password
)
 
# Import Windows Forms for SendKeys
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
 
Write-Host "Starting Radmin VPN auto-connect..."
Write-Host "Network ID: $NetworkId"
 
# Check if Radmin VPN is running
$radminProcess = Get-Process "Radmin VPN" -ErrorAction SilentlyContinue
 
if (-not $radminProcess) {
    Write-Host "Launching Radmin VPN..."
   
    # Try common installation paths
    $radminPaths = @(
        "${env:ProgramFiles(x86)}\Radmin VPN\Radmin VPN.exe",
        "${env:ProgramFiles}\Radmin VPN\Radmin VPN.exe"
    )
   
    $launched = $false
    foreach ($path in $radminPaths) {
        if (Test-Path $path) {
            Start-Process $path
            $launched = $true
            Write-Host "Launched from: $path"
            break
        }
    }
   
    if (-not $launched) {
        Write-Error "Radmin VPN not found!"
        exit 1
    }
   
    # Wait for app to fully load
    Start-Sleep -Seconds 4
}
 
# Focus Radmin VPN window
$wshell = New-Object -ComObject wscript.shell
$wshell.AppActivate("Radmin VPN")
Start-Sleep -Milliseconds 500
 
# Send Alt+J to open Join Network dialog (or click button via coordinates)
# Alternative keyboard shortcut if exists
[System.Windows.Forms.SendKeys]::SendWait("%j")
Start-Sleep -Milliseconds 800
 
# If shortcut doesn't work, try Ctrl+J
if ($?) {
    # Type Network ID
    Write-Host "Entering Network ID..."
    [System.Windows.Forms.SendKeys]::SendWait($NetworkId)
    Start-Sleep -Milliseconds 400
   
    # Tab to password field
    [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
    Start-Sleep -Milliseconds 300
   
    # Type Password
    Write-Host "Entering Password..."
    [System.Windows.Forms.SendKeys]::SendWait($Password)
    Start-Sleep -Milliseconds 400
   
    # Press Enter to connect
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    Start-Sleep -Milliseconds 2000
   
    Write-Host "Connection initiated successfully!"
    exit 0
} else {
    Write-Error "Failed to open Join Network dialog"
    exit 1
}
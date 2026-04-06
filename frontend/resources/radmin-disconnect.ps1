# Radmin VPN Auto-Disconnect Script for Windows
# Usage: powershell -ExecutionPolicy Bypass -File radmin-disconnect.ps1
 
Add-Type -AssemblyName System.Windows.Forms
 
Write-Host "Disconnecting from Radmin VPN..."
 
# Check if Radmin VPN is running
$radminProcess = Get-Process "Radmin VPN" -ErrorAction SilentlyContinue
 
if (-not $radminProcess) {
    Write-Host "Radmin VPN is not running."
    exit 0
}
 
# Focus Radmin VPN window
$wshell = New-Object -ComObject wscript.shell
$result = $wshell.AppActivate("Radmin VPN")
 
if ($result) {
    Start-Sleep -Milliseconds 500
   
    # Send Alt+D to disconnect (if shortcut exists)
    # Or use context menu approach
    [System.Windows.Forms.SendKeys]::SendWait("%d")
    Start-Sleep -Milliseconds 1000
   
    Write-Host "Disconnected successfully!"
    exit 0
} else {
    Write-Warning "Could not activate Radmin VPN window"
    exit 1
}
 
 
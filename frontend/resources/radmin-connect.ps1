# Radmin VPN Auto-Connect Script for Windows
# Uses Windows UIAutomation to fill the Join Network dialog
# Shortcut confirmed: "+" key opens Join Network in Radmin VPN
#
# Usage: powershell -ExecutionPolicy Bypass -File radmin-connect.ps1 -NetworkId "AOE-ROOM-1" -Password "abc123"

param(
    [Parameter(Mandatory=$true)]
    [string]$NetworkId,

    [Parameter(Mandatory=$true)]
    [string]$Password
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes

Write-Host "Starting Radmin VPN auto-connect..."
Write-Host "Network ID: $NetworkId"

# ── 1. Find Radmin VPN executable ──────────────────────────────────────────────
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

# ── 2. Launch Radmin VPN if not already running ────────────────────────────────
$radminProcess = Get-Process "RvpnGui" -ErrorAction SilentlyContinue

if (-not $radminProcess) {
    Write-Host "Launching Radmin VPN..."
    Start-Process $radminExe
    # Wait for app to fully load before interacting
    Start-Sleep -Seconds 4
    Write-Host "Radmin VPN launched."
} else {
    Write-Host "Radmin VPN already running."
}

# ── 3. Focus the Radmin VPN window ────────────────────────────────────────────
$wshell = New-Object -ComObject wscript.shell
$focused = $wshell.AppActivate("Radmin VPN")

if (-not $focused) {
    Write-Host "Retrying focus..."
    Start-Sleep -Seconds 2
    $wshell.AppActivate("Radmin VPN")
}
Start-Sleep -Milliseconds 800

# ── 4. Press "+" to open the Join Network dialog ──────────────────────────────
# Confirmed from screenshot: Network menu > Join Network has shortcut "+"
# In SendKeys syntax, literal "+" must be escaped as "{+}"
Write-Host "Opening Join Network dialog via '+' shortcut..."
[System.Windows.Forms.SendKeys]::SendWait("{+}")
Start-Sleep -Milliseconds 1500

# ── 5. Wait for the "Join Network" dialog to appear ───────────────────────────
Write-Host "Waiting for 'Join Network' dialog..."
$rootElement = [System.Windows.Automation.AutomationElement]::RootElement

$dialogCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::NameProperty,
    "Join Network"
)

$dialog = $null
$attempts = 0
while (-not $dialog -and $attempts -lt 20) {
    $dialog = $rootElement.FindFirst(
        [System.Windows.Automation.TreeScope]::Children,
        $dialogCondition
    )
    if (-not $dialog) {
        Start-Sleep -Milliseconds 500
        $attempts++
    }
}

if (-not $dialog) {
    Write-Error "Join Network dialog did not appear after 10 seconds."
    exit 1
}

Write-Host "Dialog 'Join Network' found."

# ── 6. Find all Edit (text input) controls in the dialog ──────────────────────
$editCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
    [System.Windows.Automation.ControlType]::Edit
)

$editFields = $dialog.FindAll(
    [System.Windows.Automation.TreeScope]::Descendants,
    $editCondition
)

Write-Host "Found $($editFields.Count) edit field(s) in dialog."

if ($editFields.Count -lt 2) {
    Write-Error "Expected at least 2 input fields, found $($editFields.Count). Dialog layout may have changed."
    exit 1
}

# ── 7. Fill "Network name" field (index 0) ────────────────────────────────────
Write-Host "Filling 'Network name'..."
$networkField = $editFields[0]

try {
    # Try UIAutomation ValuePattern first (most reliable)
    $valuePattern = $networkField.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    $valuePattern.SetValue($NetworkId)
    Write-Host "  -> Set via ValuePattern"
} catch {
    # Fallback: click the field and type
    Write-Host "  -> ValuePattern failed, using SendKeys fallback"
    $networkField.SetFocus()
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait("^a")
    Start-Sleep -Milliseconds 100
    # Escape special SendKeys chars in NetworkId
    $safeNetworkId = $NetworkId -replace '([+^%~(){}\[\]])', '{$1}'
    [System.Windows.Forms.SendKeys]::SendWait($safeNetworkId)
}

Start-Sleep -Milliseconds 400

# ── 8. Fill "Password" field (index 1) ────────────────────────────────────────
# Note: Password fields may block ValuePattern for security - fallback handles this
Write-Host "Filling 'Password'..."
$passwordField = $editFields[1]

try {
    $valuePattern = $passwordField.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    $valuePattern.SetValue($Password)
    Write-Host "  -> Set via ValuePattern"
} catch {
    Write-Host "  -> ValuePattern failed (expected for password fields), using SendKeys fallback"
    $passwordField.SetFocus()
    Start-Sleep -Milliseconds 300
    [System.Windows.Forms.SendKeys]::SendWait("^a")
    Start-Sleep -Milliseconds 100
    # Escape special SendKeys chars in Password
    $safePassword = $Password -replace '([+^%~(){}\[\]])', '{$1}'
    [System.Windows.Forms.SendKeys]::SendWait($safePassword)
}

Start-Sleep -Milliseconds 400

# ── 9. Click the "Join" button ────────────────────────────────────────────────
Write-Host "Clicking 'Join' button..."
$joinCondition = New-Object System.Windows.Automation.PropertyCondition(
    [System.Windows.Automation.AutomationElement]::NameProperty,
    "Join"
)

$joinButton = $dialog.FindFirst(
    [System.Windows.Automation.TreeScope]::Descendants,
    $joinCondition
)

if ($joinButton) {
    try {
        $invokePattern = $joinButton.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
        $invokePattern.Invoke()
        Write-Host "Join button clicked via InvokePattern."
    } catch {
        # Fallback: press Enter
        Write-Host "InvokePattern failed, pressing Enter..."
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
    }
} else {
    Write-Host "Join button not found by name, pressing Enter as fallback..."
    [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
}

# Wait a moment for the connection attempt to process
Start-Sleep -Seconds 2

Write-Host "Connection initiated successfully!"
exit 0
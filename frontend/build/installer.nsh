; Custom NSIS script - automatically kill running AOE Launcher before installing
!macro customInstall
  ; Force-close any running AOE Launcher instances silently
  nsExec::ExecToLog 'taskkill /F /IM "AOE Launcher.exe" /T'
  nsExec::ExecToLog 'taskkill /F /IM "aoe-launcher-frontend.exe" /T'
  Sleep 1000
!macroend

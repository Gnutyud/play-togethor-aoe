; Custom NSIS script - automatically kill running AOE Launcher before installing
!macro customInit
  ; Stop any running app processes (more names to avoid errors)
  nsExec::Exec 'taskkill /F /IM "AOE Launcher.exe" /T'
  nsExec::Exec 'taskkill /F /IM "aoe-launcher-frontend.exe" /T'
  nsExec::Exec 'taskkill /F /IM "electron.exe" /T'
  Sleep 1000
!macroend

!macro customInstall
  ; Stop again just in case during install
  nsExec::Exec 'taskkill /F /IM "AOE Launcher.exe" /T'
  nsExec::Exec 'taskkill /F /IM "aoe-launcher-frontend.exe" /T'
  Sleep 1000
!macroend

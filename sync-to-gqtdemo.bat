@echo off
setlocal EnableExtensions
set "EXIT_CODE=0"

cd /d "%~dp0"

if not exist "%~dp0sync-to-gqtdemo.ps1" (
  echo [ERROR] sync-to-gqtdemo.ps1 not found
  set "EXIT_CODE=1"
  goto :FINISH
)

if /I "%~1"=="-DryRun" goto :DRYRUN
if /I "%~1"=="/DryRun" goto :DRYRUN
if "%~1"=="" goto :DEFAULT

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-to-gqtdemo.ps1" -Message "%*"
set "EXIT_CODE=%ERRORLEVEL%"
goto :FINISH

:DRYRUN
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-to-gqtdemo.ps1" -DryRun
set "EXIT_CODE=%ERRORLEVEL%"
goto :FINISH

:DEFAULT
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0sync-to-gqtdemo.ps1"
set "EXIT_CODE=%ERRORLEVEL%"
goto :FINISH

:FINISH
if /I "%SYNC_NO_PAUSE%"=="1" goto :END
echo.
pause

:END
exit /b %EXIT_CODE%

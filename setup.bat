@echo off
set has_node=false
node -v >nul 2>&1 && (
    set has_node=true
) || (
    echo "Node Required!"
    exit
)
set has_server=false
nginx -v >nul 2>&1 && (
    set has_server=true
)
apache -v >nul 2>&1 && (
    set has_server=true
)
if %has_server%==false (
    echo No web server found, html pages may not be served!
)
setlocal enabledelayedexpansion

node -v > tmpfile.tmp
set /p nodever= < tmpfile.tmp
set nodever=%nodever:v=%
del tmpfile.tmp

for /f "tokens=1 delims=." %%a in ("%nodever%") do (
  set nodever=%%a
  )
  if %nodever% geq 12 (
      node setup.js
  ) ELSE (
      setlocal disabledelayedexpansion
      echo Node version too old!
  )
endlocal


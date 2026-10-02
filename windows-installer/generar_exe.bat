@echo off
echo ===================================================
echo   COMPILADOR DE APP WINDOWS (.EXE) - MINERD
echo ===================================================
echo.

echo 1. Instalando dependencias de Electron...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Error al instalar dependencias. Asegurate de tener Node.js instalado.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo 2. Generando instalador ejecutable para Windows (.exe)...
call npx electron-builder --win portable nsis
if %ERRORLEVEL% NEQ 0 (
    echo Error durante la compilacion del instalador.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ===================================================
echo   LISTO! TU ARCHIVO .EXE ESTA EN LA CARPETA:
echo   dist-electron/
echo ===================================================
pause

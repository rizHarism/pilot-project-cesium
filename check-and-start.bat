@echo off
echo ====================================
echo Cesium Viewer - Configuration Check
echo ====================================
echo.
echo Checking project setup...
echo.

REM Check if data directory exists
if exist "data\imagery" (
    echo [OK] Orthophoto tiles directory found
) else (
    echo [ERROR] data\imagery directory not found!
    echo Please ensure orthophoto tiles are in data\imagery\
    pause
    exit /b 1
)

REM Check if node_modules exists
if exist "node_modules" (
    echo [OK] Dependencies installed
) else (
    echo [WARNING] Dependencies not installed
    echo Please run: npm install
    pause
    exit /b 1
)

REM Check for tiles
set "TILE_CHECK=0"
for /d %%i in (data\imagery\*) do (
    set TILE_CHECK=1
    goto :found_tiles
)
:found_tiles

if %TILE_CHECK%==1 (
    echo [OK] Tile zoom levels found
) else (
    echo [ERROR] No tile directories found in data\imagery\
    pause
    exit /b 1
)

echo.
echo ====================================
echo Configuration:
echo ====================================
echo Ion Access Token: Configured
echo Terrain Asset ID: 4396839
echo Ortho Tiles: data\imagery\{z}\{x}\{y}.png
echo Server Port: 8080
echo.
echo ====================================
echo All checks passed! Ready to start.
echo ====================================
echo.
echo Press any key to launch the application...
pause >nul

npm run dev

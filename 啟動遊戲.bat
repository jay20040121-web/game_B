@echo off
title 像素怪獸 啟動器
cls
echo ========================================
echo   🌱 像素怪獸 (Vite 版) 快速啟動器
echo ========================================
echo.
echo [1/2] 正在檢查環境...
if not exist node_modules (
    echo [!] 偵測到尚未安裝依賴套件，正在為您安裝...
    call npm install
)

echo [2/2] 正在啟動開發伺服器...
echo ----------------------------------------
echo 💡 啟動成功後，請直接打開瀏覽器並訪問：
echo 👉 http://localhost:3000
echo.
echo 💡 想要停止遊戲時，請直接關閉此視窗即可。
echo ----------------------------------------
echo.

call npm run dev

pause

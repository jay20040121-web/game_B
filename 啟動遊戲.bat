@echo off
:: 設定編碼為 UTF-8 (65001)，確保特殊圖示顯示正常且指令不被誤讀
chcp 65001 > nul
title 像素怪獸 啟動器
cls

echo ========================================
echo   🌱 像素怪獸 (Vite 版) 快速啟動器
echo ========================================
echo.
echo [1/2] 正在檢查環境...

:: 檢查是否有 node_modules 以及 vite 執行檔，而不只是檢查資料夾
if not exist node_modules\.bin\vite.cmd (
    echo [!] 偵測到環境尚未準備就緒，正在為您安裝必要套件...
    echo.
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

:: 使用 npx 強制執行 vite，並帶入 config 中的連接埠
call npx vite --port 3000 --open

pause


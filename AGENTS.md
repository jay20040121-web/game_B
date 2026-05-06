# AGENTS.md

給之後協助這個專案的 coding agent 使用。

## 專案概覽

這個專案是 `pixel-monster-game`，使用 Vite + React 18 製作，是一款像素怪獸養成與對戰遊戲。核心體驗包含電子寵物式照顧、分支進化、冒險戰鬥、玩家連線對戰、怪獸收集、每日對戰日記、Firebase 雲端同步、排行榜與淘汰賽功能。

本機資料夾名稱是 `game_A`，但目前 Git 遠端可能指向 GitHub 上的 `game_B` repository。任何 push、PR、部署前都要先用 `git remote -v` 確認遠端位置。

## 常用指令

- `npm run dev`：啟動 Vite 開發伺服器。
- `npm run build`：建立 production build，輸出到 `dist/`。
- `npm run preview`：本機預覽 production build。

目前沒有專門的 test script。一般修改完成後，至少要跑 `npm run build` 確認能正常編譯。

## 架構地圖

- `src/main.jsx`：React app 的掛載入口。
- `src/App.jsx`：主要遊戲控制器，集中管理大多數遊戲狀態與流程，包含養成、冒險、戰鬥、PvP、雲端同步、選單、覆蓋視窗與存檔。
- `src/styles.css`：全域樣式與 Tailwind 相關樣式。
- `src/monsterData.js`：匯出怪獸名稱、基礎能力、招式、屬性邏輯、招式生成、能力計算，以及戰鬥資料。
- `src/data/monsterRegistry.js`：怪獸登錄資料，是怪獸 ID、名稱、基礎能力等資料的主要來源。
- `src/data/evolutionConfig.js`：進化等級、進化鏈、野外怪獸進化對應、最終壽命等設定。
- `src/data/gameConfig.js`：遊戲常數，例如物理移動、冒險道具、日記資料、靈魂問題、戰鬥規則、AI 選招邏輯。
- `src/data/tutorialKnowledge.js`：新手教學 AI 使用的知識資料。
- `src/components/`：UI 覆蓋視窗與專用渲染元件。
- `src/utils/`：共用系統，包含戰鬥、存檔、Firebase、PvP、排行榜、淘汰賽、音效、環境設定。
- `public/assets/`：遊戲美術、背景、BGM、音效、文字圖片、說明圖片。

## 重要系統

### 主程式

`src/App.jsx` 很大，而且狀態很多。修改前先搜尋目標系統，不要直接大範圍重寫。

常見位置：

- 初始寵物狀態與本機存檔載入在檔案前段。
- Firebase 雲端同步包含 `saveToCloud`、`loadFromCloud`、`loginWithGoogle`。
- 主選單設定從 `menuItems` 開始。
- 主選單行為集中在 `executeAction`。
- 戰鬥回合執行在 `executeBattleTurn`。
- 戰鬥狀態建立在 `generateBattleState`。
- 排行榜、PvP、淘汰賽 hooks 在 render 前附近接入。

如果新增可重用邏輯，優先放到 `src/utils/`、`src/data/` 或獨立 component，避免讓 `App.jsx` 繼續膨脹。

### 戰鬥系統

戰鬥回合邏輯在 `src/utils/battleTurnSystem.js`。

它負責：

- PvP 主機/客機回合協調。
- 招式優先度與有效速度。
- 命中率、速度造成的閃避、屬性倍率、同屬加成、隨機傷害。
- 守住、護盾、反射、能力階段、招式升級、狀態異常、傷害佇列與 `RESULT` 封包。

狀態輔助邏輯在 `src/utils/battleEngine.js`，包含回合前狀態檢查、招式效果、回合後狀態傷害/回血、能力階段倍率。

修改戰鬥邏輯時，要同時考慮單機冒險戰鬥和 PvP。PvP 由主機計算結果，再把 `RESULT` 傳給客機。如果讓客機也自行計算結果，很容易造成雙方不同步。

### PvP

PvP 使用 PeerJS，主要在 `src/utils/usePvpConnection.js`。

重要概念：

- 房間 ID 使用 `src/utils/envConfig.js` 的 `PEER_PREFIX`。
- 主機房間使用 `_A`，挑戰者使用 `_B`。
- 封包類型是 `INIT`、`ACTION`、`RESULT`。
- 主機負責結算回合，並把 `RESULT` 傳給客機。

修改 PvP 時，不要讓 client 端獨立決定戰鬥結果，否則會 desync。

### 存檔

本機存檔載入在 `src/utils/storageSystem.js`。

- 主存檔 key：`pixel_monster_save`
- 日記 key：`pixel_monster_diary`
- 目前存檔版本：`SAVE_VERSION`

如果變更存檔資料結構，要思考是否需要調整 `SAVE_VERSION` 或撰寫舊資料轉換。現在的 loader 遇到版本不一致會回傳 `null`，所以單純升版可能導致本機資料重新初始化。

### Firebase

Firebase compat SDK 設定在 `src/utils/firebase.js`。

雲端存檔與 Google 登入邏輯目前主要在 `src/App.jsx`。Firestore collection 名稱由 `src/utils/envConfig.js` 的 `FIRESTORE_COLLECTION` 匯出。

不要隨意改存檔欄位名稱。雲端存檔和本機存檔共用大量資料結構，欄位變動可能影響舊玩家資料。

### 進化系統

進化設定在 `src/data/evolutionConfig.js`。

遊戲有普通路線、靈魂屬性路線、野外怪獸路線與死亡相關路線。進化條件會用到心情、飽食度、羈絆、階段勝場、靈魂屬性、人格 tag 等資料。

新增怪獸時，通常要同步檢查：

- `src/data/monsterRegistry.js`
- `src/data/evolutionConfig.js`
- `src/monsterData.js` 從 registry 派生出的資料
- `public/assets/` 裡是否有對應 sprite 或素材

## UI 注意事項

這個遊戲的 UI 是小型像素對打機/電子寵物風格，使用 Tailwind utility class 加上自訂 CSS。

主要覆蓋視窗：

- `BattleAdventureOverlay.jsx`
- `StatusOverlay.jsx`
- `InventoryOverlay.jsx`
- `MonsterpediaOverlay.jsx`
- `SoulExpeditionOverlay.jsx`
- `TournamentOverlay.jsx`
- `DiaryOverlay.jsx`
- `SettingsOverlay.jsx`
- `TutorialAI.jsx`

UI 修改要保持小型裝置、像素遊戲的風格。不要突然加入大型 landing page、商業網站式 hero 區塊，或和現有視覺語言不一致的設計系統。

## 素材

素材透過 Vite public path 從 `public/assets/` 讀取。`App.jsx` 很多地方會用 `import.meta.env.BASE_URL` 組出素材路徑。

常見素材資料夾：

- `public/assets/BG`
- `public/assets/BGM`
- `public/assets/exclusive`
- `public/assets/sound`
- `public/assets/text`
- `public/assets/說明圖`

除非要同步更新所有引用，否則不要隨意改素材檔名，特別是中文檔名。

## 中文與編碼注意事項

專案包含大量繁體中文文字、註解與中文素材檔名。有些檔案在不同終端或 PowerShell 編碼下可能會顯示成亂碼。

修改時請注意：

- 不要只是為了清註解就大範圍重寫檔案。
- 保持 UTF-8。
- 修改中文文字時，盡量做精準小範圍修改。
- 若看到 mojibake，先確認原始檔案實際內容，不要直接把亂碼當成正確文字覆蓋。

## 程式修改守則

- 延續現有 React function component 寫法。
- 優先使用現有 helper，不要重複造一套邏輯。
- 遊戲常數放在 `src/data/`。
- 共用或純邏輯放在 `src/utils/`。
- 視窗、面板、畫面元件放在 `src/components/`。
- 除非任務明確要求重構，否則避免大範圍搬移。
- 對 localStorage、雲端存檔、`SAVE_VERSION` 要特別小心。
- 修改回合結算、招式資料、能力計算、戰鬥狀態 shape 時，要檢查 PvP 是否受影響。
- 較大的修改完成後，至少跑 `npm run build`。

## Git 注意事項

- 修改前先看 `git status --short --branch`。
- 不要覆蓋使用者未提交的修改。
- 預設分支是 `main`。
- 推送前確認遠端，因為本機資料夾名稱和 GitHub repository 名稱可能不同。

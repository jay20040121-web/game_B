# AGENTS.md

給之後協助這個專案的 coding agent 使用。

## 專案概覽

這個專案是 `pixel-monster-game`，使用 Vite + React 18 製作，是一款像素怪獸養成與對戰遊戲。核心體驗包含電子寵物式照顧、分支進化、冒險戰鬥、玩家連線對戰、怪獸收集、每日對戰日記、Firebase 雲端同步、排行榜與淘汰賽功能。

本機資料夾名稱是 `game_B`，Git 遠端也指向 GitHub 上的 `game_B` repository。任何 push、PR、部署前仍要先用 `git remote -v` 確認遠端位置。

## 目前工作狀態

- 目前正式工作目錄是 C:\Users\jay20\Desktop\game_B。
- game_A 已不再作為有效工作區使用；若之後又看到 game_A，預設視為舊備份或無效路徑，不能從那裡繼續開發或 push。
- 目前使用者偏好是「先不要寄 Gmail 專案更新通知」，避免信件過多。除非使用者之後明確重新啟用，否則只在對話內更新進度，不主動寄信。
- 專案已加入 Windows PC 版 portable 打包流程：`npm run build:desktop` 會先跑 Vite desktop build，再用 `electron-packager` 輸出可執行資料夾到 `release/`。
- Desktop build 走 `VITE_DESKTOP=1` 時會讓 Vite 的 `base` 改成 `./`，不要再把 `/game_B/` 當成桌面版唯一基底。
- PC 版尺寸縮放目前已確認能正常運作。關鍵修正是主視窗 preload 使用 `electron/preload.cjs` 暴露 `window.desktopWindow`；不要改回 ESM `preload.js`，否則 packaged Electron 可能不會成功暴露 IPC，React 的尺寸切換就完全打不到 main process。
- PC 版尺寸系統仍以 `src/utils/useDisplayScale.js`、`SettingsOverlay.jsx` 和 `electron/main.js` 串接。不要一次大改 CSS `zoom`、`transform`、Electron `setSize` / `setContentSize` / bounds，多層同時改很容易造成內容縮放和視窗大小不同步。
- 若之後要修 PC 視窗黑底或尺寸對齊，可以臨時做可觀測診斷：在切換尺寸時記錄 preset、`displayScale`、`window.innerWidth/innerHeight`、Electron `getBounds()`、`getContentBounds()` 與實際遊戲外框 DOM 尺寸，再根據數據只改一層。
- 目前診斷顯示 Windows 標題列/邊框會讓 `setSize(width,height)` 設成整體視窗尺寸而非內容區。PC 版套用尺寸時應先用 `getBounds()` / `getContentBounds()` 算 frame 差值，將目標內容區尺寸加上 frame 差值後再 `setSize()`。
- PC 尺寸診斷工具、always-on-top 診斷視窗、txt log、console log、DOM 量測標記都只能臨時使用；交付或打包給使用者前必須移除，避免影響遊戲畫面與效能。
- 目前不要再回頭用 `electron-builder` 做 Windows installer，這台環境在 Windows code signing / symlink 上有卡點；若要發佈 PC 版，先以 portable folder 為準。

## 協作偏好

- 每次回報時，優先提供目前進度、已完成項目、下一步，讓使用者能快速接手或決策。
- 若修改牽涉風險較高的區域（例如存檔、PvP 同步、Firebase、main 同步），要先明確說明風險點再動手。
- 若需求有多種做法，優先選擇最小變更、最低風險、最容易驗證的一種。
## 常用指令

- `npm run dev`：啟動 Vite 開發伺服器。
- `npm run build`：建立 production build，輸出到 `dist/`。
- `npm run preview`：本機預覽 production build。

目前沒有專門的 test script。一般修改完成後，至少要跑 `npm run build` 確認能正常編譯。

## 架構地圖

- `src/main.jsx`：React app 的掛載入口。
- `src/App.jsx`：主要遊戲控制器，集中管理多數遊戲狀態與流程，包含養成、冒險、戰鬥、PvP 串接、覆蓋視窗與本機存檔串接。部分原本在 App 內的系統已拆到 `src/utils/` 和 `src/data/`，修改前先看下方「已拆出模組」。
- `src/styles.css`：全域樣式與 Tailwind 相關樣式。
- `src/monsterData.js`：匯出怪獸名稱、基礎能力、招式、屬性邏輯、招式生成、能力計算，以及戰鬥資料。
- `src/data/monsterRegistry.js`：怪獸登錄資料，是怪獸 ID、名稱、基礎能力等資料的主要來源。
- `src/data/evolutionConfig.js`：進化等級、進化鏈、野外怪獸進化對應、最終壽命等設定。
- `src/data/gameConfig.js`：遊戲常數，例如物理移動、冒險道具、日記資料、靈魂問題、戰鬥規則、AI 選招邏輯。
- `src/data/menuConfig.js`：主選單項目設定，包含選單 id、label、icon sprite 與背景圖路徑組合。
- `src/data/tutorialKnowledge.js`：新手教學 AI 使用的知識資料。
- `src/components/`：UI 覆蓋視窗與專用渲染元件。
- `src/components/AutoFitText.jsx`：共用自動縮字元件，優先用在固定寬高的標題、名牌、按鈕與卡片名稱。
- `src/utils/`：共用系統，包含戰鬥、存檔、Firebase、PvP、排行榜、淘汰賽、音效、環境設定。
- `public/assets/`：遊戲美術、背景、BGM、音效、文字圖片、說明圖片。

## 重要系統

### 主程式

`src/App.jsx` 很大，而且狀態很多。修改前先搜尋目標系統，不要直接大範圍重寫。

常見位置：

- 初始寵物狀態與本機存檔載入在檔案前段。
- Firebase 雲端同步已移到 `src/utils/useCloudSync.js`，App 只接 `user`、`isCloudLoading`、`isCloudSyncing`、`saveToCloud`、`loginWithGoogle`、`logoutGoogle`。
- 主選單設定已移到 `src/data/menuConfig.js` 的 `createMenuItems`。
- 主選單行為集中在 `executeAction`。
- 戰鬥回合執行在 `executeBattleTurn`。
- 戰鬥狀態建立在 `generateBattleState`。
- 排行榜、PvP、淘汰賽 hooks 在 render 前附近接入。

如果新增可重用邏輯，優先放到 `src/utils/`、`src/data/` 或獨立 component，避免讓 `App.jsx` 繼續膨脹。

### 已拆出模組

下列系統以前可能在 `src/App.jsx` 內，之後不要只在 App 裡找：

- `src/utils/useCloudSync.js`：Firebase auth listener、Google 登入/登出、雲端存檔 `saveToCloud`、雲端載入、版本檢查、防誤蓋與跨帳號本地存檔保護。
- `src/utils/useSingleActiveTab.js`：多分頁 heartbeat lock，避免同一個存檔在多個分頁同時運行。
- `src/utils/useDisplayScale.js`：裝置畫面自動縮放、手動縮放與 `pixel_monster_scale` localStorage。
- `src/utils/useSkillLearning.js`：升級後自動學招、學招 pending state、替換確認 state、技能順序調整開關與等級追蹤重置。捕捉新怪或回憶膠囊復活後要呼叫 `resetLevelTracker(level)`，避免沿用前一隻怪的等級觸發學招。
- `src/utils/dateUtils.js`：本地日期字串 `getTodayStr`，避免 UTC 跨日誤差。
- `src/utils/battleStats.js`：玩家戰鬥能力 profile、性格修正 `getNatureMods`、trait 對能力的倍率套用。修改能力計算時要確認 `generateMyBattleStats`、`generateBattleState` 和 PvP INIT 資料仍一致。
- `src/data/menuConfig.js`：主選單項目資料。新增或調整主選單入口時先改這裡，再檢查 `executeAction` 是否有對應行為。

### 戰鬥系統

戰鬥回合邏輯在 `src/utils/battleTurnSystem.js`。

它負責：

- PvP 主機/客機回合協調。
- 招式優先度與有效速度。
- 命中率、速度造成的閃避、屬性倍率、同屬加成、隨機傷害。
- 守住、護盾、反射、能力階段、招式升級、狀態異常、傷害佇列與 `RESULT` 封包。

狀態輔助邏輯在 `src/utils/battleEngine.js`，包含回合前狀態檢查、招式效果、回合後狀態傷害/回血、能力階段倍率。

異常狀態注意：

- 睡眠與冰凍在 `checkPreTurnStatus` 內處理行動限制與回合數遞減，不能在「不能動」時提前清掉狀態。
- 畏縮 `flinch` 是一次性行動限制，觸發後要在下一次行動前消耗並清除。
- 燒傷、中毒、寄生、束縛的回合後效果在 `processPostTurnStatus`，修改時要確認傷害、回血與狀態回合數都有回寫到 battle state。
- 聯盟大會同回合雙方死亡時，目前判定玩家勝利；不要改回單純比較雙方 HP。

玩家戰鬥能力 profile 計算已拆到 `src/utils/battleStats.js`。這會被 App 內的 `generateMyBattleStats` 與 `generateBattleState` 串接使用，修改時要避免單機戰鬥與 PvP INIT 使用不同算法。

修改戰鬥邏輯時，要同時考慮單機冒險戰鬥和 PvP。PvP 由主機計算結果，再把 `RESULT` 傳給客機。如果讓客機也自行計算結果，很容易造成雙方不同步。

### PvP

PvP 使用 PeerJS，主要在 `src/utils/usePvpConnection.js`。

重要概念：

- 房間 ID 使用 `src/utils/envConfig.js` 的 `PEER_PREFIX`。
- 主機房間使用 `_A`，挑戰者使用 `_B`。
- 封包類型是 `INIT`、`ACTION`、`RESULT`。
- 主機負責結算回合，並把 `RESULT` 傳給客機。

修改 PvP 時，不要讓 client 端獨立決定戰鬥結果，否則會 desync。

### 冒險系統

冒險戰鬥狀態建立在 `src/App.jsx` 的 `generateBattleState`。

目前規則：

- 冒險事件機率會依玩家等級從「探索 50% / 野怪 50% / 訓練師 0%」逐步變成等級 50 以上的「探索 0% / 野怪 30% / 訓練師 70%」。
- 一般野怪等級是玩家等級的 70% 到 90%，最高 100 等；精銳野怪仍是玩家同等級。
- 野怪目前不附魔，`moveUpgrades` 應維持空物件。
- 訓練師等級目前是玩家等級 -10，最低 1 等；訓練師附魔仍走 `generateNpcMoveUpgrades(eMoves, playerLevel)`。

### 存檔

本機存檔載入在 `src/utils/storageSystem.js`。

- 主存檔 key：`pixel_monster_save`
- 日記 key：`pixel_monster_diary`
- 目前存檔版本：`SAVE_VERSION`

如果變更存檔資料結構，要思考是否需要調整 `SAVE_VERSION` 或撰寫舊資料轉換。現在的 loader 遇到版本不一致會回傳 `null`，所以單純升版可能導致本機資料重新初始化。

### Firebase

Firebase compat SDK 設定在 `src/utils/firebase.js`。

雲端存檔與 Google 登入邏輯主要在 `src/utils/useCloudSync.js`。Firestore collection 名稱由 `src/utils/envConfig.js` 的 `FIRESTORE_COLLECTION` 匯出。

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
長字串如果會爆框，優先考慮 `src/components/AutoFitText.jsx`，再搭配 `truncate`、`line-clamp` 或斷行。

### 戰鬥 GIF / 特效渲染注意

戰鬥畫面的 GIF sprite 很容易因為同層疊加效果而進入瀏覽器的合成路徑，造成受擊後模糊、馬賽克或渲染卡住。

之後若再碰到類似問題，優先遵守：

- 受擊閃爍不要直接動 sprite 本體的 `opacity`
- 特效、傷害跳字、回血跳字盡量不要和 GIF 放在同一個 transformed 容器內
- 需要的位置對齊可以共用錨點，但渲染層要分開
- 若 GIF 出現模糊，先查 `SpriteRenderer.jsx`、`BattleAdventureOverlay.jsx` 的疊層結構，再查 `damage-flash` / `mixBlendMode` / `imageRendering`
- 不要把「修圖層」和「修戰鬥判定」混在一起，先分開驗證

### 登入畫面 GIF 注意

登入畫面的隨機怪獸使用 `src/App.jsx` 的 boot monster 邏輯與 `DitheredSprite`。目前規則：

- 只在登入畫面針對小尺寸 GIF 做特殊處理，不要影響主畫面、戰鬥、圖鑑或談心畫面。
- `DitheredSprite` 的 `smallSmoothImageRendering` 只會在 `smoothAnimated` 且實際 GIF 尺寸小於等於 64x64 時生效；128x128 GIF 應維持原本的平滑渲染。
- 登入畫面的 64x64 GIF 目前使用 `pixelated` 來強化像素質感，避免低解析素材被平滑放大後顯得糊。
- 登入畫面隨機怪獸一輪內不能重複；抽完一輪後才重置抽取池，且重置後也要避免立即抽到上一隻。

## 素材

素材透過 Vite public path 從 `public/assets/` 讀取。`App.jsx` 很多地方會用 `import.meta.env.BASE_URL` 組出素材路徑。

常見素材資料夾：

- `public/assets/BG`
- `public/assets/BGM`
- `public/assets/exclusive`
- `public/assets/sound`
- `public/assets/text`

本機保留但不打包、不提交的原始/參考素材放在 `local-assets/`。不要從程式引用這個資料夾；需要進入遊戲的素材才放回 `public/assets/`。

除非要同步更新所有引用，否則不要隨意改素材檔名，特別是中文檔名。

## 中文與編碼注意事項

專案包含大量繁體中文文字、註解與中文素材檔名。有些檔案在不同終端或 PowerShell 編碼下可能會顯示成亂碼。

修改時請注意：

- 不要只是為了清註解就大範圍重寫檔案。
- 保持 UTF-8。
- 讀取、顯示、寫入包含中文的文件時，一律明確使用 UTF-8，不要依賴 PowerShell 或終端預設編碼。
- 用 PowerShell 讀中文文件時，使用 `Get-Content -Encoding UTF8`；需要寫入中文文件時，也要明確指定 UTF-8 或使用能保持 UTF-8 的精準修改工具。
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

### 多台電腦同步與防止 main 分叉

這個專案曾在 2026-05-08 發生過一次 `main` 分叉事故：公司電腦本機 `main` 留有 `05b34c4`、`6262543` 兩個 commit，但 GitHub 遠端 `main` 後來被家裡端推到 `acd26da`，且 `git fetch` 顯示 `forced update`。當時 GitHub Pages 是正確部署遠端最新 `main`，但公司本機和遠端已經不是同一條歷史。

根本原因不是單純改資料夾或專案名稱，而是改名/搬移期間同時存在 `game_A`、`game_B` 多份 repo，加上後續同步時可能從舊基底推送，甚至 force update 遠端 `main`。之後請特別避免把備份資料夾或舊 repo 當成正式工作區繼續開發。

跨公司/家裡電腦工作時，固定遵守：

- 正式開發只使用 `game_B` 這一份 repo；`game_A` 或其他資料夾只能當備份，不要從裡面 push。
- 每次開始工作前先跑：
  - `git fetch origin`
  - `git status --short --branch`
  - `git log --oneline --left-right --graph HEAD...origin/main`
- 若看到 `[behind]`、`ahead/behind`，或左右兩邊都有 commit，先停止開發並處理同步，不要直接 push。
- 到家或換電腦後優先使用 `git pull --ff-only origin main`。如果 `--ff-only` 失敗，代表歷史已分叉，需要先人工檢查，不要用 force push 解決。
- 推送前再次確認：
  - `git remote -v`
  - `git status --short --branch`
  - `git log --oneline --left-right --graph HEAD...origin/main`
- 推送前理想狀態只能是本機單純 ahead 遠端；不能 behind，也不能 ahead/behind 同時存在。
- 不要對 `main` 使用 `git push --force`、`git push -f` 或 `git push --force-with-lease`，除非使用者明確要求且已備份。
- 若需要整理歷史或改 repo 名稱，先建立備份分支，例如 `backup-before-rename-YYYYMMDD`，再操作。

建議在 GitHub repository 的 `main` 設定 branch protection：

- 禁止 force push。
- 要求 PR 或至少避免直接改寫歷史。
- 要求 GitHub Actions build/deploy 成功後才視為可發布版本。

## 近期分支差異摘要

### `main`

- 目前作為網頁版發布主線，給 GitHub Pages / 外部瀏覽器使用。
- 已合入的方向偏向「遊戲本體可上線」：
  - 戰鬥 UI 的半透明與部分模糊效果回到可接受狀態。
  - 談心系統與登入畫面的 GIF 清晰度與縮放有做過修正。
  - 圖鑑、排行榜、技能詳情、學招頁的顯示字串與版面有整理。
  - PvP 排行榜與聯盟大會的資料讀取有做過相容處理。
- `main` 不應混入 Electron / PC 專用尺寸控制，避免網頁版和桌面版互相干擾。

### `pc/zoom-layout`

- 目前作為桌面版與發佈 PC exe 的主分支。
- 保留桌面版專用內容：
  - Electron 主程式、preload、打包腳本。
  - `VITE_DESKTOP` / `base: './'` / `zoom` 縮放路徑。
  - 視窗尺寸同步、尺寸 preset、自動適配、桌面版圖示。
- 也包含桌面版適配後的 UI 調整，例如：
  - 整體視窗跟內容同步放大縮小。
  - 設定頁的尺寸選項改成小 / 中 / 大 / 特大。
  - 只在桌面版顯示或隱藏的 debug 入口控制。

### PvP / 排行榜 / 聯盟大會

- PvP 排行榜的週期重點是「月榜相容」，不是再回到純日榜。
- 聯盟大會目前是 32 強，玩家主線會打 5 輪；冠軍後有 50% 機率觸發第 6 輪 PvP 排行榜挑戰。
- 聯盟 NPC 強度依輪次，不再單純依玩家等級：第 1 輪玩家 -5 等 0 附魔、第 2 輪玩家 -3 等 0 附魔、第 3 輪同等級 3 附魔、第 4 輪同等級 7 附魔、第 5 輪玩家 +5 等 10 附魔且封頂 100 等。
- 聯盟 NPC stage 規則：第 1 到第 3 輪不能高於玩家 stage；第 4、5 輪不能低於玩家 stage。
- 第 3 輪勝利後會進一次中途附魔，完成後回到卡片選擇再進第 4 輪。附魔全 MAX 時要跳過附魔選擇，不應中斷大會流程。
- 第 6 輪 PvP 排行榜挑戰會讀排行榜玩家的等級、技能、附魔與天賦。新資料來自 `battleProfile`；舊排行榜資料沒有完整快照時會 fallback 成可戰鬥資料。
- 聯盟一般 NPC 與第 6 輪 PvP 排行榜挑戰都有避免連續重複對手的邏輯；若候選池太小才允許重複。
- 聯盟大會若要讀 PvP 名單，要確認它吃的是目前月榜邏輯或相容資料來源，不要直接依賴過期的日格式。
- 排行榜、聯盟大會、PvP 資料來源最好分清楚：
  - 顯示用排行榜
  - 聯盟大會種子名單
  - 兩者都可能共用同一份資料，但查詢條件不能互相踩掉。

### 音效對應

- 按鈕音效目前對應為：
  - `select` = `選擇按鈕.wav`，對應 A
  - `confirm` = `確認按鈕.wav`，對應 B
  - `back` = `取消按鈕.wav`，對應 C
- 音效檔請優先從 `public/assets/sound/` 讀取，不要改成其他來源，避免桌面版或網頁版路徑失效。




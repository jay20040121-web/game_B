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
- PC 版打包已回歸一般 portable 包：`npm run build:desktop` 會先在 `release/.desktop-build/像素怪獸/` 建立乾淨包，再同步到 `release/像素怪獸/`。若 Windows 暫時鎖住舊的 `release/像素怪獸/resources/app.asar`，腳本會略過同步展開資料夾，但 staging 包仍會完成。
- 使用者未特別要求時，包 PC 版只需要保留 portable 資料夾，不要額外產生 zip 壓縮檔；交付前讓 `release/` 保持乾淨，通常只留最新的 `release/像素怪獸/`。
- 桌面版打包時只應包含 `dist/`、`electron/` 與必要 package metadata；不要把 `src/`、`public/`、`node_modules/`、`local-assets/` 或 repo 文件整包塞進 `app.asar`，避免 PC 包過大且洩漏開發檔。
- Desktop build 走 `VITE_DESKTOP=1` 時會讓 Vite 的 `base` 改成 `./`，不要再把 `/game_B/` 當成桌面版唯一基底。
- PC 版尺寸縮放目前已確認能正常運作。關鍵修正是主視窗 preload 使用 `electron/preload.cjs` 暴露 `window.desktopWindow`；不要改回 ESM `preload.js`，否則 packaged Electron 可能不會成功暴露 IPC，React 的尺寸切換就完全打不到 main process。
- PC 版 Google 登入依賴 Firebase `signInWithPopup`，Electron 的 `setWindowOpenHandler` 必須白名單放行 `accounts.google.com` 與 Firebase auth domain 的 popup，讓登入視窗保留在同一個 Electron session；不要把所有 `window.open` 一律 `shell.openExternal()`，否則外部瀏覽器登入結果回不來主視窗。
- PC packaged 版不要用 `win.loadFile()` 直接跑 `file://`，Firebase Auth 會報 `auth/operation-not-supported-in-this-environment`；目前 `electron/main.js` 會啟本機靜態 server 並用 `http://localhost:<port>` 載入 `dist/`，以符合 Google/Firebase 登入環境要求。
- PC packaged 版不要再在固定 port 和隨機 port 之間來回切。固定 `localhost:17321` 曾造成 Firebase/Google 登入卡住；隨機 port 登入較穩，但 browser `localStorage` 會因 origin 改變而像新存檔。現在採第三方案：Electron 靜態 server 維持隨機 port，主存檔另透過 preload IPC 同步到 Electron `app.getPath('userData')/pixel_monster_save.json`，啟動時先從該檔還原到當前 origin。
- PC 版雲端同步不要只依賴 Firebase Auth persistence 或 `onAuthStateChanged`。`signInWithPopup` 成功後要直接用該次 `result.user` 呼叫 `loadFromCloud`，Firestore 讀取要有 timeout，並避免登入回呼和 auth listener 同時重複讀雲端。
- PC / Web 版 Google 登入成功後不能自動把本機存檔寫上雲端。`useCloudSync.js` 目前把「已檢查雲端」和「允許寫入雲端」拆成 `hasCheckedCloud` 與 `cloudWriteEnabled`；登入只讀取雲端狀態並顯示雲端存檔選擇，玩家選擇匯入雲端或明確用本機建立/覆蓋雲端後，才允許 `saveToCloud` 寫入。這是為了避免新裝置或新 origin 先產生空白本機檔後壓掉既有雲端進度。
- 雲端存檔選擇 UI 目前在 `App.jsx` 的 LCD overlay：A 切換選項、B 確認、C 稍後決定。玩家選「稍後決定」時要維持雲端備份暫停，不要在背景自動上傳本機檔。
- PC 版雲端匯入若需要 reload 讓 React 初始 state 吃到雲端存檔，reload 前要寫入 `sessionStorage.pixel_monster_skip_boot_once`，讓重載後直接進遊戲；同一 session 已讀過雲端的 uid 也要跳過重複 `loadFromCloud`，避免畫面反覆顯示雲端同步中。
- PC 雲端問題的判斷經驗：若使用者說「一直卡在雲端登入/雲端同步」，不一定是沒讀到 Firestore；這次實際狀況是「已讀到雲端並寫入本機，但 reload 後 boot/auth listener 又觸發第二次讀取」，畫面看起來像卡住或被踢回登入。優先檢查 `src/utils/useCloudSync.js` 的 `cloudLoadInFlightRef`、`hasCheckedCloudRef`、`sessionStorage.pixel_monster_cloud_loaded_uid`、`pixel_monster_skip_boot_once`，不要先回去改 port。
- PC 主存檔目前有兩層：瀏覽器當前 origin 的 `localStorage.pixel_monster_save`，以及 Electron preload IPC 寫入的 userData `pixel_monster_save.json`。相關入口在 `src/utils/storageSystem.js` 的 `loadSaveData`、`persistSaveData`、`clearPersistedSaveData`，以及 `electron/preload.cjs` 暴露的 `window.desktopStorage`。新增清存檔、登出、雲端匯入或重置生命流程時，不能只操作 `localStorage`，也要走這些 helper。
- PC 版若之後又要修 Google 登入或雲端存檔，禁止把問題簡化成「固定 port」或「隨機 port」二選一。固定 port 已驗證會讓這台環境的登入卡住；隨機 port 需要 Electron userData 存檔橋接才不會重置。要改之前先保留這個架構，再用小範圍診斷確認是登入 popup、Firestore 讀取、存檔匯入、reload、或 boot 畫面狀態哪一段出問題。
- PC 版尺寸系統仍以 `src/utils/useDisplayScale.js`、`SettingsOverlay.jsx` 和 `electron/main.js` 串接。不要一次大改 CSS `zoom`、`transform`、Electron `setSize` / `setContentSize` / bounds，多層同時改很容易造成內容縮放和視窗大小不同步。
- 若之後要修 PC 視窗黑底或尺寸對齊，可以臨時做可觀測診斷：在切換尺寸時記錄 preset、`displayScale`、`window.innerWidth/innerHeight`、Electron `getBounds()`、`getContentBounds()` 與實際遊戲外框 DOM 尺寸，再根據數據只改一層。
- 目前診斷顯示 Windows 標題列/邊框會讓 `setSize(width,height)` 設成整體視窗尺寸而非內容區。PC 版套用尺寸時應先用 `getBounds()` / `getContentBounds()` 算 frame 差值，將目標內容區尺寸加上 frame 差值後再 `setSize()`。
- PC 尺寸診斷工具、always-on-top 診斷視窗、txt log、console log、DOM 量測標記都只能臨時使用；交付或打包給使用者前必須移除，避免影響遊戲畫面與效能。
- 目前不要再回頭用 `electron-builder` 做 Windows installer，這台環境在 Windows code signing / symlink 上有卡點；若要發佈 PC 版，先以 portable folder 為準。
- 怪獸來信系統已加入：每天 09:00、12:00、21:00 依本地時間產生最多三封信，主畫面 LCD 若有未讀信會顯示信封圖示，玩家讀完可回一封 120 字內的回信；下一封怪獸來信會參考上一封玩家回信產生回應。狀態與回信存在主存檔的 `petLetters`，修改存檔、雲端同步或清存檔流程時要保留這個欄位。
- 怪獸來信邏輯在 `src/utils/petLetterSystem.js`，UI 在 `src/components/PetLetterOverlay.jsx`，離線個性台詞庫在 `src/data/petLetterLines.js`。目前每個個性（溫柔、執著、熱血、搞怪、冷靜）至少 40 句，狀態句也有多句輪替；不要把它退回只有少量固定模板。
- 怪獸來信離線版目前固定 4 頁結構：第 1 頁天氣提醒、第 2 頁日期/節日/今日話題、第 3 頁今日狀態與高權重事件（附魔、進化、特殊事件、低飽食/低心情等）、第 4 頁玩家回信回應或個性收尾。不要再改回不固定順序，除非使用者明確要求。
- 天氣感知在 `src/utils/weatherSystem.js`，使用瀏覽器定位與 Open-Meteo 免 key API；會抓目前天氣與未來 6 小時降雨機率/雨量，避免下雨天只因查詢當下沒雨而漏判。天氣查不到時要安靜 fallback，不可阻塞信件。
- 今日話題在 `src/utils/dailyTopicSystem.js`，每天準備新聞、歷史上的今天、外部星象、外部明日塔羅四種 topic。信件規則：早上第 2 頁用新聞，中午第 2 頁用歷史上的今天，晚上第 1 頁用星象、第 2 頁用明日塔羅。星象與塔羅目前優先抓 `freehoroscopeapi.com`，外部查不到時要使用本機 fallback，不可阻塞信件。
- 每日話題的新聞與歷史偏好要避開政治、選舉、兩岸、軍事、戰爭與社會案件。新聞優先挑動物、生態、自然、科學新知、太空天文等較適合怪獸信件的輕知識；歷史上的今天優先挑動物、外太空、科學發現、人物出生、特殊節慶或紀念日。若抓不到符合白名單的外部資料，寧可使用小知識 fallback，不要硬塞政治新聞。
- 天氣與今日話題會優先走 Cloudflare Worker 代理（`worker/src/index.js` 的 `/external/weather`、`/external/topics`），避免前端直接抓 Open-Meteo、Wikipedia、freehoroscopeapi 時被 CORS 擋。DebugPanel 的「外部資訊 Debug」會顯示來源與錯誤；若看到 `fallback` 代表外部來源沒抓成功。
- 新聞與歷史資料來源要用多 endpoint 保底：新聞優先抓中央社 RSS（政治、兩岸、產經、科技、生活、地方）以台灣/中華地區為主，失敗才退 Google News 台灣 RSS，再退 Wikipedia `featured`；歷史用 `onthisday/events`、`onthisday/all`，必要時再試 Wikimedia gateway。英文來源不可原樣進信件，要先經 `translateExternalTopicText` 壓成繁中短句。新聞若 `title` 只是人物或條目名，要優先合併 `story` / `extract` 做成「標題/重點」；星象英文 horoscope 要經 `translateHoroscopeText` 轉成「星座守護星/主題 + 運勢焦點」，不要只寫「星象更新到某星座」；塔羅英文牌名要經牌名/花色字典轉譯，並用牌義解釋抽到該牌代表什麼，不要接泛用罐頭建議。
- 每封怪獸來信會保存 `contextSignature`，讓尚未讀取、尚未送出 AI 請求的本地模板信，在天氣或今日話題從 fallback 更新成外部資訊後可以重生內容。不要讓已讀信、已送 AI 的信或 AI 成功信被背景改寫，避免玩家看到的信件內容前後不一致。
- 怪獸來信 AI 串接已預留前端入口：`src/utils/petLetterAiClient.js` 會讀 `VITE_PET_LETTER_AI_ENDPOINT`，未設定時完全使用離線模板。前端不能放 AI API key；要走後端 endpoint，後端只回 `{ "pages": [...] }`。Endpoint 合約記錄在 `docs/pet-letter-ai-endpoint.md`。
- AI 來信是非阻塞保底流程：新信先以離線模板建立，若 endpoint 啟用則標記 `aiStatus: pending`，AI 成功才替換成 `source: 'ai'`；失敗、格式錯誤或玩家已讀過時都不能讓信件消失，也不要重複燒 token。`petLetters` slot 目前會保留 `source`、`aiStatus`、`aiRequestedAt`、`aiResolvedAt`、`aiError`。
- AI 來信後端目前改用 Cloudflare Worker，程式在 `worker/src/index.js`，不需要 Firebase Blaze。Worker 會用 Google JWK 驗證 Firebase Auth ID token；未登入玩家會 fallback 離線模板。預設 provider 是 Gemini（`PET_LETTER_AI_PROVIDER=gemini`、`GEMINI_MODEL=gemini-2.5-flash-lite`），Gemini key 用 Worker secret `GEMINI_API_KEY`；OpenAI 可作 fallback，key 用 Worker secret `OPENAI_API_KEY`。任何 AI key 都不要寫進 repo 或前端 `.env`。
- 怪獸來信的 Debug 測試入口在 `DebugPanel.jsx` 的「來信」分頁，可重開已讀信、清空今日來信並重產、清除回信紀錄，也可用 `debugOverrides.petLetterHour` 覆蓋測試時間（08/09/12/21）。這是測試用，不要把時間覆蓋當成正式遊戲邏輯。

## 協作偏好

- 每次回報時，優先提供目前進度、已完成項目、下一步，讓使用者能快速接手或決策。
- 若修改牽涉風險較高的區域（例如存檔、PvP 同步、Firebase、main 同步），要先明確說明風險點再動手。
- 若需求有多種做法，優先選擇最小變更、最低風險、最容易驗證的一種。
- 若做了會影響之後維護的重要改法、素材規格、分支流程或踩雷經驗，完成時要主動更新本檔對應段落，不必等使用者另外提醒。
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

目前 PvP 回合同步層已重整，之後維護要遵守：

- `App.jsx` 的 PvP 選招不要直接呼叫 `executeBattleTurn`；必須走 `usePvpConnection.js` 匯出的 `submitPvpMove(move)`。
- `submitPvpMove` 只負責提交本地招式、切到 `waiting_opponent`，並由同步層決定何時結算。
- 客機只送 `ACTION { turnId, move }` 給主機，客機永遠不自行結算回合。
- 主機用 `localMovesByTurnRef` 與 `remoteMovesByTurnRef` 依 `turnId` 收集雙方招式；同一回合雙方招式都齊了，才呼叫既有 `executeBattleTurn('attack', localMove, remoteMove)`。
- 主機仍沿用既有 `battleTurnSystem.js` 做實際戰鬥計算與 `RESULT` 封包產生，避免重寫或分叉單人戰鬥規則。
- 收到未來回合的 `ACTION` 要先暫存，不能丟掉；過期回合才忽略。這是為了避免一方動畫播比較快、先進下一回合出招，另一方還在上一回合時把封包丟掉造成 25 秒 timeout。
- `waiting_opponent` 只代表本地已提交招式、正在等同步層收齊或等主機 `RESULT`；不要用它讓客機進入任何本地戰鬥結算。
- 若再遇到「後選招者卡住」或「一方等待到 timeout」，優先查 `submitPvpMove`、`resolveHostTurnIfReady`、`ACTION` 的 `turnId` 暫存與清除，不要先改傷害公式或 UI。

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
雲端讀取在 `src/utils/useCloudSync.js` 會拒絕未來版本存檔，但對舊版雲端存檔會先把 `saveVersion` 提升到目前 `SAVE_VERSION` 再寫入本機，避免 reload 後被 `storageSystem` 當成版本不符而忽略。

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

草系靈魂線目前有兩條不互通分支。一般草魂線是 `1007 -> 1008 -> 1009`；若首次進入草魂線時最優勢個性是熱血 `passionate` 或執著/固執 `stubborn`，會進入 `GR_SOUL_ALT` 的 `1032 -> 1033 -> 1034`。進入 `GR_SOUL_ALT` 後後續無條件沿 1032 線進化，不會切回 1007 線；已在 1007 線也不會因後續個性變化切到 1032 線。
DebugPanel 的「數值調整」頁有靈魂屬性 / 個性快速設定，可以直接改 `lockedAffinity`、`soulAffinityCounts`、`soulTagCounts`。測草系 1032 線時，將羈絆設 40 以上，屬性鎖定草，個性設熱血 `passionate` 或執著/固執 `stubborn`，再把等級推到進化門檻。

死亡重生目前只有 `G1` 幽燭燭線：`1019 -> 1020 -> 1021`。壽命結束或終止生命時的 D 線抽籤都是 20% 機率進入 `G1`，不要再抽未實作的 `G2`，除非已同步補上 `EVOLUTION_CHAINS`、`monsterIdMapper`、registry、圖鑑與素材資料。

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

### 天賦系統交接

天賦資料在 `src/data/monsterTraits.js`，戰鬥能力倍率主要經由 `src/utils/battleStats.js`、`src/App.jsx` 的戰鬥建立流程，以及 `src/utils/useTournament.jsx` 聯盟戰鬥建立流程套用。DebugPanel 切換天賦時，若玩家已在戰鬥中，也會同步修正目前 battleState 內玩家能力，避免偵錯器改天賦後看起來沒生效。

目前新增且已接戰鬥流程的天賦：

- `絕對防禦`：攻擊 x0.50、速度 x0.50；受到有傷害的攻擊時，在 `src/utils/battleTurnSystem.js` 以 50% 機率讓該次傷害無效化。
- `太陽之子`：攻擊 x0.50、HP x0.50；火屬性技能傷害 x1.30，受到水屬性技能傷害 x0.30。戰鬥場景會在有此天賦的怪獸旁顯示 `public/assets/exclusive/effect/太陽之子.png`。
- `雨天娃娃`：HP x0.50、防禦 x0.50；水屬性技能傷害 x2.30，受到草屬性技能傷害 x0.30。戰鬥場景會在有此天賦的怪獸旁顯示 `public/assets/exclusive/effect/雨天娃娃.png`，光暈使用偏藍色調。
- `魔術師`：開場觸發一次，在 `src/utils/battleTraitSystem.js` 的 `applyOpeningTraitEffects` 交換雙方第一格招式，並連同該招式的 `moveUpgrades` 附魔資料一起交換。單機冒險與聯盟戰鬥建立後都要呼叫這個 helper；若之後要支援 PvP，必須由主機端統一產生並同步結果，不能讓雙方客戶端各自交換以免不同步。

之後若再碰到類似問題，優先遵守：

- 受擊閃爍不要直接動 sprite 本體的 `opacity`
- 特效、傷害跳字、回血跳字盡量不要和 GIF 放在同一個 transformed 容器內
- 需要的位置對齊可以共用錨點，但渲染層要分開
- 受擊回饋若需要抖動，不要用 `scale()` 做放大縮小；即使動畫結束會回原尺寸，GIF 仍可能因 transform 重新取樣而短暫或殘留模糊
- 目前確認較穩的做法是在 `BattleAdventureOverlay.jsx` 用短暫的整數像素 `translate()` 做位移抖動，不用小數像素、不用 `will-change`
- 位移動畫結束後要強制校正：用短暫 hit wrapper key 播動畫，`animationend` 或保險 timer 後切回 idle wrapper 並 bump key，讓瀏覽器丟掉 transform/composite 狀態
- 不要讓 `damagePop` 長時間直接決定 sprite wrapper 維持在 hit key；`damagePop` 可能留在 battle state，受擊動畫應由 overlay 自己用短 timer 管理
- 屬性技能受擊特效在 `src/components/BattleAdventureOverlay.jsx` 的 `TypeDamageEffect`。目前 9 種屬性都使用 `public/assets/exclusive/effect/` 內的單張 `100x100` PNG：`普.png`、`火.png`、`水.png`、`草.png`、`毒.png`、`飛.png`、`蟲.png`、`岩.png`、`鬼.png`。舊的 `受擊特效.png` 已移除；若技能屬性沒有對應特效圖，統一 fallback 使用 `普.png`。
- 屬性受擊特效不再走舊的 3x3 sprite sheet 裁切。`TypeDamageEffect` 會用 canvas 載入單張圖，將亮綠底色轉透明，再以 `52px` 顯示。
- 因受擊特效掛在怪獸 GIF 上方的 absolute overlay，定位 class 仍沿用原本 `left/top/-translate` 錨點；單張特效縮小後要用 `TYPE_EFFECT_POSITION_OFFSET = 17` 補回原本中心點，不要改成外層 wrapper 拆定位，否則容易整體偏移。
- 屬性受擊特效動畫使用 `.type-effect-pop`，只作用在 canvas 本體；若要調大小優先改 `TYPE_EFFECT_DISPLAY_SIZE`，並同步依 `(原定位尺寸 - 新顯示尺寸) / 2` 調整 `TYPE_EFFECT_POSITION_OFFSET`。
- 戰敗教學提示卡在 `src/components/DefeatTutorialOverlay.jsx`。冒險戰敗由 `App.jsx` 的 `resolveBattleLoss(false)` 設定 `pendingDefeatTutorial = 'adventure'`，等玩家按完冒險日誌、真正回主畫面時才顯示；聯盟大會戰敗由 `useTournament.jsx` 的 `onTournamentLossReturn` 回呼通知 App 顯示 `tournament` 提示。教學圖放在 `public/assets/UI/`，目前每次戰敗會把 `DEFEAT_TUTORIAL_IMAGES` 全部洗牌後自動輪播，每 20 秒換下一張；提示卡是全版純圖片，只保留底部操作提示，A 鍵下一張、B/C 關閉引導。提示卡播放期間必須禁止重製生命/終止生命入口，避免玩家在引導圖上誤重置；之後新增或移除圖時同步更新該陣列。
- 若 GIF 出現模糊，先查 `SpriteRenderer.jsx`、`BattleAdventureOverlay.jsx` 的疊層結構，再查 `damage-flash` / `mixBlendMode` / `imageRendering`
- 不要把「修圖層」和「修戰鬥判定」混在一起，先分開驗證

### 登入畫面 GIF 注意

登入畫面的隨機怪獸使用 `src/App.jsx` 的 boot monster 邏輯與 `DitheredSprite`。目前規則：

- 只在登入畫面針對小尺寸 GIF 做特殊處理，不要影響主畫面、戰鬥、圖鑑或談心畫面。
- `DitheredSprite` 的 `smallSmoothImageRendering` 只會在 `smoothAnimated` 且實際 GIF 尺寸小於等於 64x64 時生效；128x128 GIF 應維持原本的平滑渲染。
- 登入畫面的 64x64 GIF 目前使用 `pixelated` 來強化像素質感，避免低解析素材被平滑放大後顯得糊。
- 登入畫面隨機怪獸一輪內不能重複；抽完一輪後才重置抽取池，且重置後也要避免立即抽到上一隻。

### 談心畫面 GIF 注意

談心畫面的怪獸 GIF 在 `src/components/SoulExpeditionOverlay.jsx`，目前已整理成固定舞台規則，之後不要再用零散的 `bottom: '-10%'`、`left: '50%'`、`transform: translateX(-50%)` 直接調怪獸位置。

目前統一調整入口是 `SOUL_MONSTER_STAGE`：

- `bottom`：怪獸舞台距離 LCD 底部的位置；可以是負值，用來把腳藏到可見範圍外。目前是 `-20`。
- `height`：舞台高度。
- `frameSize`：怪獸控制框大小。
- `spriteScale`：傳給 `DitheredSprite` 的顯示比例；談心 GIF 大小優先改這裡。目前是 `2.1`。

談心的 `DitheredSprite` 目前使用：

- `smoothAnimated={true}`：讓 128x128 等較大 GIF 維持平滑。
- `smallSmoothImageRendering="pixelated"`：讓 64x64 或更小的 GIF 放大時維持像素感，和登入畫面同樣規則。

談心走路浮動目前用 `.expedition-walk` 的 `top` 位移，不用 `transform: translateY()`，避免 GIF 進入瀏覽器合成路徑後出現模糊或大小難控。

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




# 🤖 AI BDD (Behavior-Driven Development) 指南

此文件為專門設計給 AI Coding Agent 的 **行為驅動開發 (BDD) 與防呆檢核表**。
目的在於將 `pixel-monster-game` 專案中容易踩坑、容易發生 Desync 或破壞既有架構的地方，轉化為具體的 `Given-When-Then` 情境與強制約束。
AI 在修改相關系統前，**必須**先閱讀對應的 BDD 腳本，確保修改後的行為不偏離核心設定。

---

## 1. ⚔️ 戰鬥與 PvP 系統 (Battle & PvP)

### 🔴 情境：修改回合結算或傷害公式
- **Given** AI 正在修改 `src/utils/battleTurnSystem.js` 或 `App.jsx` 的戰鬥邏輯
- **When** 玩家或 AI 在 PvP 模式下送出招式 (`ACTION`)
- **Then** 客戶端（客機 B）**絕對不可**自行計算傷害或血量扣除。
- **And** 所有的戰鬥結算必須由主機（A）透過 `localMovesByTurnRef` 收集齊全後統一計算，並由主機發送 `RESULT` 封包給客戶端。
- **And** `waiting_opponent` 狀態只能用來等待主機，不能觸發本地的戰鬥動畫結算。

### 🔴 情境：實作新的異常狀態或天賦
- **Given** AI 正在 `monsterTraits.js` 或 `battleEngine.js` 實作新狀態
- **When** 處理睡眠、冰凍或畏縮等「無法行動」的狀態
- **Then** 必須在回合前的 `checkPreTurnStatus` 處理，且不可在無法行動時就提前把狀態清空（導致回合數計算錯誤）。

---

## 2. ☁️ 雲端存檔與資料同步 (Cloud Sync)

### 🔴 情境：修改登入或存檔寫入流程
- **Given** AI 正在修改 `src/utils/useCloudSync.js` 或 `storageSystem.js`
- **When** 玩家成功透過 Google 登入並觸發 Firebase 回呼
- **Then** 系統**絕對不可**在背景自動將本機存檔覆蓋上雲端。
- **And** 必須先檢查雲端存檔，由玩家在 UI 上決定「匯入雲端」或「保留本機」，確認 `cloudWriteEnabled` 為 `true` 後才允許上傳。
- **And** 讀取雲端存檔前必須有 Timeout 機制，且同一 Session 讀取過後需設下標記以防重複讀取卡死。

---

## 3. 🖥️ PC 桌面版與視窗系統 (Electron Desktop)

### 🔴 情境：調整 PC 版視窗大小或縮放比例
- **Given** AI 正在修改 `useDisplayScale.js`、`SettingsOverlay.jsx` 或 `electron/main.js`
- **When** 觸發視窗尺寸縮放
- **Then** AI **不可**同時修改 CSS `zoom` 與 Electron `setSize` 且不計算邊框差值。
- **And** 若要改變外部視窗大小，必須先用 `getContentBounds` 算出作業系統外框大小 (Frame) 再加上目標內容區大小，避免遊戲畫面被截斷。

### 🔴 情境：測試 PC 版打包
- **Given** AI 需要編譯 PC 版本 (`npm run build:desktop`)
- **When** 產生打包資料夾
- **Then** 只能將 `dist/`、`electron/` 和必要檔案放進 `app.asar`，**嚴禁**把 `src/` 或 `node_modules/` 打包進去造成檔案過大或外洩。

---

## 4. ✉️ 怪獸來信與 AI 生成 (Pet Letter)

### 🔴 情境：外部資訊 API 失敗 (天氣/新聞/塔羅)
- **Given** AI 修改 `weatherSystem.js` 或 `dailyTopicSystem.js`
- **When** 嘗試從外部服務（Cloudflare Worker / 氣象 API）取得當日話題失敗
- **Then** 系統必須安靜地 (Silently) Fallback 到本機的備用小知識。
- **And** 絕對不可因為外部 API 失敗而中斷或阻塞信件生成的流程。

### 🔴 情境：AI 回信生成
- **Given** 系統發送玩家回信給外部 AI Endpoint
- **When** AI Endpoint 回傳錯誤、格式異常或玩家已讀過信件
- **Then** 本機存檔的 `petLetters` 必須保留原有的離線模板信件，將狀態標記為失敗，不讓信件消失也不可重複浪費 Token 請求。

---

## 5. 🧬 怪獸進化與資料庫 (Evolution & Registry)

### 🔴 情境：新增一隻怪獸或一條進化線
- **Given** AI 接到需求要擴充圖鑑
- **When** 在 `evolutionConfig.js` 中新增進化分支
- **Then** AI 必須同步檢查並更新以下四個地方：
  1. `src/data/monsterRegistry.js` (註冊基本資料)
  2. `src/monsterData.js` (招式表、`OBTAINABLE_MONSTER_IDS`)
  3. 確認 `public/assets/` 下有對應的點陣圖
  4. 確認如果涉及死亡重生，只能走已實作的 `G1` 線，不可指向未完成的 `G2` 線。

---

## 6. 🎨 UI 渲染與點陣圖 (UI & GIF Rendering)

### 🔴 情境：修改怪獸 GIF 的動畫效果 (受擊/走路/抖動)
- **Given** AI 正在修改 `BattleAdventureOverlay.jsx` 或 `SoulExpeditionOverlay.jsx`
- **When** 實作受擊閃爍、位移抖動或放大縮小
- **Then** **嚴禁**直接修改 Sprite 本體的 `opacity` 或使用 `transform: scale()` 縮放，以免 GIF 進入瀏覽器合成路徑造成嚴重模糊或殘影。
- **And** 抖動應使用短暫的整數像素 `translate()`，且動畫結束後必須強制切換回 idle 狀態以拋棄 transform 屬性；談心走路應使用 `top` 位移而非 `translateY`。

---

## 7. 🌐 多機開發與 Git 同步 (Git Workflow)

### 🔴 情境：準備推送程式碼 (Push)
- **Given** AI 準備執行 Git 推送指令
- **When** 將本地 `game_B` 的 `main` 分支推到 GitHub
- **Then** AI 必須先執行 `git log --oneline --left-right --graph HEAD...origin/main` 確認歷史。
- **And** 若出現分叉 (ahead / behind 都有)，**絕對禁止**使用 `git push -f` 覆蓋遠端，必須向使用者報告並手動處理同步。

---

## 8. 🗣️ 多語系與在地化 (Localization)

### 🔴 情境：新增技能、天賦或重要 UI 文案
- **Given** AI 正在撰寫新的文案或名稱
- **When** 考慮到英文版 (`LanguageDomTranslator.jsx`) 的顯示
- **Then** 必須同步更新 `src/utils/languageSystem.js` 裡的翻譯字典或 Regex 句型。
- **And** 絕對不能放任未翻譯的新詞彙被逐字拆解，導致英文模式下出現語法破碎的文字。

---

## 9. 🏆 聯盟大會與賽事判定 (Tournament)

### 🔴 情境：修改聯盟大會的輸贏判定
- **Given** AI 正在修改 `useTournament.jsx` 或大會的戰鬥結算
- **When** 遇到「雙方在同一回合內血量同時歸零」的情況
- **Then** 必須判定為**玩家勝利**，**不可**擅自改回單純比較雙方 HP 或判敗，以免玩家在大會中卡死。

---

## 10. 🧬 天賦系統擴充與維護 (Traits System)

### 🔴 情境：新增或修改天賦的特殊邏輯
- **Given** AI 被要求在 `src/data/monsterTraits.js` 新增天賦，或在戰鬥引擎（如 `battleTurnSystem.js`、`battleEngine.js`、`battleStats.js`）中實作該天賦的特殊效果
- **When** 撰寫或修改相關程式碼時
- **Then** **絕對嚴格禁止**修改、覆蓋或刪除與該天賦無關的底層核心邏輯（包含原有戰鬥傷害公式、異常狀態判定、回合優先度等）。
- **And** 新增的特殊邏輯必須採用「外掛式、無侵入式」的判斷（例如 `if (attacker.trait.id === 'xxx') { ... }`），必須確保若新天賦未觸發，既有系統的執行路徑 100% 維持原樣。
- **And** 確保 `modifiers` 定義的欄位與既有掛載機制相容，非必要不可大範圍重構或替換原有的計算函式。

### 🔴 情境：專屬天賦的捕捉與重置 (防呆)
- **Given** AI 正在修改野外捕捉替換 (`confirmWildCapture`) 或生命重置 (`handleRestart`) 邏輯
- **When** 玩家在野外獲取特殊怪獸（如世足丸 1043/1044）入隊替換，或怪獸壽命耗盡死亡後重生為新蛋/幽靈
- **Then** 必須確保新怪獸正確獲得專屬天賦（如世足丸必須強制獲得 `tactical_switch`），或在死亡重生時確保原本的專屬天賦被正確洗掉（回歸 `generateMonsterTraits()` 過濾掉專屬天賦的隨機池）。
- **And** 絕對不可更動底層天賦邏輯或破壞「戰術切換只有 1043/1044 能持有」的規則。

---

## 11. ✨ 特效與視覺表現 (Visual Effects)

### 🔴 情境：套用新特效於現有戰鬥事件
- **Given** AI 正在實作特定的視覺特效（例如 `tactical switch` 的風格轉換 `風格轉換.gif`）
- **When** 利用 `battleTurnSystem.js` 傳出的 `form_change` 事件或利用 `damagePop` 顯示特效時
- **Then** 必須確保原本的戰鬥階段（例如 `activeMsg`、`damagePop`、血量結算）正常運作。
- **And** 新特效不能產生不預期的傷害數字（若為零則不顯示），且大小、位置對齊必須參照既有特效（如 `finisher` 必殺技）。
- **And** 若特效伴隨怪獸外觀改變（如 `id` 切換），必須確保外觀變更與特效時間點對齊（例如：透過 `setTimeout` 將 ID 變更延遲 450ms 至 GIF 播放一半時），不可讓圖片先切換才播特效。
- **And** 特效相關常數（如 `FORM_CHANGE_EFFECT_SHEET`）必須放在最上方，與其他資源統一管理。

---

## 🛡️ AI 開發自我檢核表 (Pre-Commit Checklist)

每次修改完程式碼並準備 Commit 前，AI 必須在心裡執行以下 Check：
- [ ] 我是否變更了戰鬥公式？若是，我有沒有確認這不會導致 PvP 雙方各自計算而不同步？
- [ ] 我是否修改了存檔資料結構 (`pixel_monster_save`)？若是，我有沒有考慮到 `SAVE_VERSION` 的相容性與舊存檔的容錯？
- [ ] 我是否動到了 Firebase 的登入 / 載入流程？若是，我有沒有確保沒有引發「空白本地覆蓋雲端」的毀滅性錯誤？
- [ ] 我的修改是否包含了中文文字？若是，我有沒有確保檔案維持 UTF-8 編碼且沒有產生亂碼？
- [ ] 若我是修改 UI，我有沒有使用 `AutoFitText` 處理長字串爆框？我有沒有避開會讓 GIF 變糊的 `transform` 操作？
- [ ] 新增的文字是否有加進 `languageSystem.js` 翻譯表？
- [ ] 若我是新增天賦或特殊邏輯，我有沒有嚴格遵守「不破壞、不刪除」無關底層邏輯的原則？是否保證既有程式碼的執行路徑不被影響？
- [ ] 準備 Push 前，我確認過 Git 歷史是單純的 Ahead 而非分叉了嗎？

> **對 AI 的強制指令**：任何時候只要使用者的需求牽涉到上述 5 大重點領域，你必須**主動查閱**此文件，並在修改前檢查自己的實作是否符合 Then 的結果，以防止破壞現有遊戲邏輯。

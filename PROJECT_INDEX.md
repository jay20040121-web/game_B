# 🗺️ 怪獸對打機 — 專案索引 (PROJECT INDEX)

> 此文件為 AI 輔助除錯用的快速導航索引。  
> 上次更新：2026-04-22

---

## 📁 專案架構總覽

```
game_A/
├── App.js                      ★ 主程式 (3389 行) — React根元件，所有遊戲狀態都在這
├── index.html                  ★ 備用單頁版本 (461 KB) — 無框架純 JS 版本
├── monsterData.js              ★ 怪獸資料庫 (6854 行) — 所有怪獸/技能/屬性資料
├── styles.css                  — 全域樣式
│
├── src/
│   ├── components/             — UI 元件 (覆疊層)
│   ├── utils/                  — 工具函式 / 自訂 Hook
│   └── data/
│       └── gameConfig.js       ★ 遊戲設定常數
│
├── assets/                     — 圖片音效資源
└── backups/                    — 舊版備份
```

---

## 🗂️ 系統索引 — 按功能分類

### 1. 🎮 核心遊戲狀態 (`App.js`)

| 系統 | 狀態變數 | App.js 大約行號 |
|------|----------|----------------|
| 飢餓/心情 | `hunger`, `mood` | ~L76-77 |
| 睡眠/排泄 | `isSleeping`, `isPooping` | ~L78-79 |
| 進化系統 | `evolutionStage`, `evolutionBranch`, `lastEvolutionTime` | ~L80-86 |
| 訓練勝場 | `trainWins`, `stageTrainWins` | ~L82-83 |
| 友好度 | `bondValue`, `talkCount`, `lockedAffinity` | ~L90-94 |
| 靈魂親和 | `soulAffinityCounts`, `soulTagCounts` | ~L93-94 |
| 步數 | `steps` | ~L96 |
| 死亡/逃跑 | `isDead`, `isRunaway`, `finalWords`, `deathBranch` | ~L99-101 |
| 圖鑑 | `ownedMonsters`, `isPediaOpen` | ~L110-126 |
| Debug 面板 | `showDebug`, `debugOverrides` | ~L128-134 |
| 主選單 | `menuItems` 陣列, `activeIndex` | ~L757-766 |

---

### 2. ⚔️ 冒險/戰鬥系統

#### 戰鬥數值架構 (`App.js` ~L150-192)
```
advStats = {
  hp, atk, def, spd, basePower  → 舊版平行數值 (仍用於顯示)
  ivs: { hp, atk, def, spd }    → 個體值 (0-31)
  evs: { hp, atk, def, spd }    → 努力值 (0-252, 上限510)
  bonusMoveId                    → 初始贈送技能 ID
  moves: [skillId, ...]          → 永久技能陣列 (存檔)
}
```

| 功能 | 位置 |
|------|------|
| 等級計算公式 | `App.js` ~L194: `derivedLevel = floor((basePower-100)/10)+1` |
| 最終數值計算 | `monsterData.js` → `calcFinalStat()` |
| 技能學習 (升級) | `App.js` ~L202-240 |
| 戰鬥回合處理 | `src/utils/battleTurnSystem.js` → `processBattleTurn()` |
| 傷害公式 | `battleTurnSystem.js` ~L75-112: `calcDamage()` |
| 狀態異常前置檢查 | `src/utils/battleEngine.js` → `checkPreTurnStatus()` |
| 狀態異常後置處理 | `src/utils/battleEngine.js` → `processPostTurnStatus()` |
| 招式特效套用 | `src/utils/battleEngine.js` → `applyMoveEffects()` |
| 能力階段乘數 | `src/utils/battleEngine.js` → `getStatMultiplier()` |

#### 冒險模式 (`App.js` + `src/components/BattleAdventureOverlay.js`)
| 功能 | 位置 |
|------|------|
| 冒險 CD | `advCD`, `lastAdvTime` (App.js), CD = 60000ms (`gameConfig.js` `ADV_BATTLE_RULES.CD_MS`) |
| 野外遇敵池 | `monsterData.js` → `ADV_WILD_POOL` |
| NPC 訓練師隊伍 | `monsterData.js` → `TRAINER_POOLS` |
| 可獲得怪獸清單 | `monsterData.js` → `OBTAINABLE_MONSTER_IDS` |
| 冒險道具定義 | `src/data/gameConfig.js` → `ADV_ITEMS` (001~016) |
| 智慧 AI 招式選擇 | `src/data/gameConfig.js` → `getSmartMove()` |

#### 戰鬥 State 結構 (`App.js` ~L546-559)
```js
battleState = {
  active: bool,
  mode: 'wild' | 'trainer' | 'pvp',
  turn: number,
  phase: 'intro' | 'player_action' | 'combat' | 'action_streaming' | 'waiting_opponent' | 'end',
  player: { hp, maxHp, atk, def, spd, level, type, moves, status, statStages },
  enemy:  { id, name, hp, maxHp, atk, def, spd, level, type, moves, status, statStages },
  logs: [],
  stepQueue: [],
  activeMsg: "",
  flashTarget: 'player' | 'enemy' | null,
  playerHpAfter, enemyHpAfter
}
```

---

### 3. 🌐 PvP 連線系統

**主要文件：** `src/utils/usePvpConnection.js` (300 行)

| 功能 | 函式/位置 |
|------|-----------|
| Hook 入口 | `usePvpConnection(deps)` → 回傳所有 PvP 狀態與方法 |
| 加入/建立房間 | `joinPvpRoom(password)` ~L253 |
| 快速配對 | `quickMatch()` ~L267 (公共池: 101,202,303,505,777,888,999) |
| Peer 初始化 | `initPeer(customId, role)` ~L178 |
| 建立連線（挑戰者）| `connectToRemotePeer(targetId)` ~L167 |
| 連線事件處理 | `setupConnectionHandlers(conn)` ~L74 |
| 清理 PvP 狀態 | `cleanupPvp(msg, destroyPeer)` ~L44 |
| 房間命名規則 | `PEER_PREFIX + password + "_A"` (主機) / `"_B"` (挑戰者) |
| 主機判定 | `isHost.current = true` (A 端) / `false` (B 端) |

**PvP 訊息協議：**
```
INIT   → 雙方互傳怪獸初始資料
ACTION → 玩家出招通知
RESULT → 主機(A)計算完後傳送結果給客戶端(B)
```

**PvP 回合同步流程：**  
`主機算傷` → `battleTurnSystem.processBattleTurn()` → `RESULT 封包 (target 翻轉)` → `客戶端套用動畫`

---

### 4. ☁️ Firebase 雲端同步

**主要文件：** `App.js` ~L245-484, `src/utils/firebase.js`

| 功能 | 位置 |
|------|------|
| Firebase 初始化 | `src/utils/firebase.js` → 匯出 `auth`, `db`, `googleProvider` |
| 環境隔離集合名稱 | `src/utils/envConfig.js` → `FIRESTORE_COLLECTION` |
| 雲端存檔 | `App.js` `saveToCloud()` ~L304 (2 秒延遲觸發) |
| 雲端載入 | `App.js` `loadFromCloud()` ~L351 |
| Google 登入 | `App.js` `loginWithGoogle()` ~L416 |
| Google 登出 | `App.js` `logoutGoogle()` ~L471 |
| 跨帳號保護 | `loadFromCloud()` ~L362: 比對 `ownerUid` |
| 雲端同步觸發條件 | `lastSaveTime` 變更後 2 秒 (App.js ~L694) |
| 逾時機制 | 20 秒 (`saveToCloud` ~L319) |

---

### 5. 💾 存檔系統

**主要文件：** `src/utils/storageSystem.js`

| 功能 | 位置 |
|------|------|
| 存檔版本 | `SAVE_VERSION` (storageSystem.js) |
| LocalStorage Key | `'pixel_monster_save'` |
| 載入存檔 | `loadSaveData()` (storageSystem.js) |
| 存檔觸發 | App.js ~L671-691 (依賴陣列觸發) |
| 多分頁競爭鎖 | App.js ~L563-593 (Heartbeat, 1.5s 間隔) |
| 日記獨立存檔 | Key: `'pixel_monster_diary'`, `DIARY_STORAGE_KEY` (gameConfig.js ~L70) |
| 日記自動儲存 | 保留最近 30 天 (`saveDiaryData` ~L79) |

**存檔結構欄位：**
```js
{
  saveVersion, hunger, mood, isSleeping, isPooping,
  evolutionStage, evolutionBranch, lastEvolutionTime,
  trainWins, stageTrainWins, feedCount, steps,
  interactionLogs, interactionCount, isDead, finalWords, deathBranch,
  bondValue, talkCount, lockedAffinity, soulAffinityCounts, soulTagCounts,
  advStats,      // { hp, atk, def, spd, basePower, ivs, evs, bonusMoveId, moves }
  inventory,     // [{ id, name, desc, rarity, count, skillId? }]
  lastAdvTime,
  todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount,
  lastDiaryDate, todayHasEvolved, todaySpecialEvent, todayEventPriority,
  ownedMonsters, // [id_string, ...]
  lastSaveTime,
  ownerUid       // Firebase UID
}
```

---

### 6. 🐾 怪獸資料庫 (`monsterData.js`)

| 匯出名稱 | 內容說明 |
|----------|----------|
| `MONSTER_NAMES` | `{ "id": "名稱" }` 共 160 筆 (第一世代+少數) |
| `SPECIES_BASE_STATS` | `{ "id": { hp, atk, def, spd, types[] } }` |
| `SKILL_DATABASE` | 所有技能定義 `{ id: { name, type, power, accuracy, effect, priority } }` |
| `TYPE_SKILLS` | 按屬性分類的技能 ID 清單 |
| `ADV_WILD_POOL` | 冒險野外遇敵池 |
| `WILD_EVOLUTION_MAP` | 野外進化對應表 |
| `TYPE_CHART` | 屬性相剋表 |
| `TYPE_MAP` | 屬性中文名稱對應 |
| `NATURE_CONFIG` | 性格設定 `{ tag: { buff, nerf } }` |
| `OBTAINABLE_MONSTER_IDS` | 玩家可獲得的怪獸 ID 陣列 |
| `TRAINER_POOLS` | NPC 訓練師隊伍設定 |
| `getTypeMultiplier(moveType, defTypes)` | 計算屬性倍率函式 |
| `generateMoves(speciesId, level)` | 生成技能清單函式 |
| `calcFinalStat(stat, speciesId, iv, ev, level, natureMod)` | 最終數值計算 |

---

### 7. ⚙️ 遊戲常數 (`src/data/gameConfig.js`)

| 常數 | 值/說明 |
|------|---------|
| `PHYSICS` | `{ FLOAT_SPEED: 0.36, BOUNCE_DAMPING: 0.98, MAX_VELOCITY: 7.0 }` |
| `EVOLUTION_TIME` | `{ 1: 3600000, 2: 21600000, 3: 86400000 }` (ms) |
| `FINAL_LIFETIME` | `604800000` ms (7 天) |
| `ADV_ITEMS` | 道具定義陣列 (001~016，含秘笈書) |
| `ADV_BATTLE_RULES` | `{ BASE_HP:100, HIT_RATE:0.9, CD_MS:60000, STAGE_MULT:{} }` |
| `DIARY_ITEM` | 日記永久道具定義 |
| `SOUL_QUESTIONS` | 40 題談心問卷 (由 `RAW_Q_DATA` 生成) |
| `getPetDailyMessage(affinity)` | 寵物每日話語 |
| `getSmartMove(attacker, defender, moves)` | AI 最優招式選擇 |

---

### 8. 🖥️ UI 元件 (`src/components/`)

| 元件 | 功能 |
|------|------|
| `BattleAdventureOverlay.js` | 戰鬥/冒險覆疊 UI (19KB，最大) |
| `DebugPanel.js` | 開發者 Debug 面板 |
| `DiaryOverlay.js` | 日記覆疊 UI |
| `InventoryOverlay.js` | 背包道具覆疊 UI |
| `LeaderboardOverlay.js` | PvP 排行榜 UI |
| `MonsterpediaOverlay.js` | 圖鑑覆疊 UI |
| `SkillLearnOverlay.js` | 技能學習覆疊 UI |
| `SpriteRenderer.js` | 點陣圖 Sprite 渲染、ICONS、BATTLE_STYLES |
| `StatusOverlay.js` | 狀態/成長數值覆疊 UI |

---

### 9. 🔧 工具模組 (`src/utils/`)

| 模組 | 功能說明 |
|------|----------|
| `audioSystem.js` | `playBloop(type)` — 音效播放 |
| `battleEngine.js` | 回合制核心邏輯 (狀態異常、招式效果) |
| `battleTurnSystem.js` | `processBattleTurn()` — 完整回合流程計算 |
| `envConfig.js` | `isLocalhost`, `FIRESTORE_COLLECTION`, `PEER_PREFIX` |
| `firebase.js` | Firebase 初始化 (auth/db/googleProvider) |
| `monsterIdMapper.js` | `getMonsterId()` — 目前寵物 ID 解析 |
| `storageSystem.js` | `SAVE_VERSION`, `isInAppBrowser`, `loadSaveData()` |
| `useLeaderboard.js` | PvP 排行榜 Hook |
| `usePvpConnection.js` | PvP 連線 Hook (PeerJS 封裝) |

---

### 10. 🎲 特殊機制速查

#### 性格系統 (談心系統)
- 談心問題：40 題，每題 3 選項，各有 `affinity` (fire/water/grass/bug) + `tag` (gentle/stubborn/passionate/nonsense/rational)
- 性格效果：`NATURE_CONFIG[tag]` → `{ buff: 'atk', nerf: 'def' }` 等，各 ±10%
- 最優勢 tag 決定性格（需 > 0 次談心）

#### 隨機數同步 (PvP 防 Desync)
- PvP 模式使用確定性 RNG：`rngState = turn * 1234567`，`sin(rngState++) * 10000`
- 所有命中/效果判定由**主機（A）**統一計算後傳送 `RESULT` 給客戶端

#### 招式優先度
- BUFF 系招式 (`power: 0`) 擁有 `priority: 2`，先於普通攻擊行動
- 速度相同時 PvP 由主機優先，單人由亂數決定

#### 能力階段 (`statStages`)
- 範圍：-6 ~ +6
- 乘數對應：`getStatMultiplier()` (battleEngine.js)

#### 狀態異常種類
- `burn` 燒傷：攻擊力 ×0.5，每回合扣 maxHp 6.25%
- `paralysis` 麻痺：速度 ×0.5，25% 機率無法行動
- `poison` 中毒：每回合扣 maxHp 12.5%
- `confusion` 混亂：30% 機率，自傷 maxHp 8%
- `sleep` 睡眠：1~3 回合無法行動
- `bind` 束縛：每回合扣 maxHp 12.5%

---

### 11. 📂 文件/設定資料夾

| 檔案 | 說明 |
|------|------|
| `evolution_chains.txt` | 進化鏈參考資料 |
| `soul_evolution_chains.txt` | 靈魂屬性進化鏈 |
| `wild_monsters_list.txt` | 野外怪獸清單 |
| `WILD_EVOLUTION_MAP.txt` | 野外進化對應表 |
| `items_list.txt` | 道具清單 |
| `battle_stats.txt` | 戰鬥數值參考 |
| `training_rules.txt` | 訓練規則說明 |
| `talk_system.txt` | 談心系統說明 |
| `soul_questions_list.txt` | 靈魂問題完整清單 |
| `進化時間調整規劃.txt` | 進化時間規劃 |
| `淘汰賽玩法.txt` | 淘汰賽功能規劃 |
| `doc_text.txt` | 文件說明文字 |

---

## 🔍 常見除錯入口速查

| 問題類型 | 優先查找位置 |
|----------|-------------|
| 戰鬥傷害計算錯誤 | `battleTurnSystem.js` `calcDamage()` |
| 狀態異常不生效 | `battleEngine.js` `applyMoveEffects()` / `checkPreTurnStatus()` |
| PvP HP 不同步 | `usePvpConnection.js` RESULT 處理 / `battleTurnSystem.js` RESULT 發送 |
| 存檔讀取異常 | `storageSystem.js` + `App.js` `loadSaveData()` |
| 雲端同步失敗 | `App.js` `saveToCloud()` / `loadFromCloud()` |
| 技能學習失敗 | `App.js` ~L202 (`useEffect` for `derivedLevel`) |
| 進化不觸發 | `gameConfig.js` `EVOLUTION_TIME` + `App.js` 進化偵測 useEffect |
| NPC 用到非法怪獸 | `App.js` `generateTrainerOpponent()` + `monsterData.js` `OBTAINABLE_MONSTER_IDS` |
| 道具不生效 | `gameConfig.js` `ADV_ITEMS` 定義 + `BattleAdventureOverlay.js` |
| 圖鑑解鎖異常 | `App.js` `unlockMonster()` ~L116 |
| 音效無聲 | `audioSystem.js` `playBloop()` |
| Debug 面板打不開 | `DebugPanel.js` + `App.js` `showDebug` state |

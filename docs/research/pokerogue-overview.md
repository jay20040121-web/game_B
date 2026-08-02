# PokeRogue 專案研究摘要

研究日期：2026-08-02

## 定位

[PokeRogue](https://github.com/pagefaultgames/pokerogue) 是由 Pagefault Games 社群維護、可直接在瀏覽器執行的 Pokémon 同人遊戲。官方將它描述為深受 roguelite 類型啟發的 browser-based fangame。它不是傳統城鎮探索 RPG，也不是電子寵物養成，而是把寶可夢的回合制戰鬥、捕捉與隊伍組成濃縮成一輪一輪的隨機闖關。

來源：[官方 README](https://github.com/pagefaultgames/pokerogue/blob/beta/README.md)、[官方網站](https://pokerogue.net)

## 核心玩法循環

1. 從已擁有的起始 Pokémon 中，在成本限制內組隊。
2. 連續進行波次戰鬥，遭遇野生 Pokémon、訓練家、頭目與特殊戰鬥。
3. 戰鬥中升級、學招、捕捉新成員；戰後取得可堆疊的道具與增益。
4. 隨進度穿越不同 biome，承受逐步增加的敵人強度。
5. 一輪結束後保留部分圖鑑、起始角色、糖果、被動能力、蛋券等 meta progression，再開始下一輪。

因此可將它概括成：「把 Pokémon 的戰鬥／捕捉／隊伍構築規則，改造成快速、波次制、可反覆重玩的 roguelite run。」

官方列出的模式包括 Classic、Daily Run、Endless、Spliced Endless 與 Challenge。Classic 是 200 波的主要戰役；Daily Run 是每日固定種子與固定初始隊伍的 50 波挑戰。

來源：[官方玩法模式 Wiki](https://wiki.pokerogue.net/gameplay:modes)、[Classic 模式](https://wiki.pokerogue.net/gameplay:modes:classic)、[新手指南](https://wiki.pokerogue.net/guides:new_player_guide)

## 技術架構

- 主要語言：TypeScript。
- 遊戲引擎：Phaser 3，而不是 React。
- 建置工具：Vite。
- 套件管理：pnpm；目前要求 Node.js 24.9 以上。
- 測試：Vitest，並提供 coverage、watch 與測試建立腳本。
- 品質工具：Biome、TypeScript typecheck、dependency-cruiser、Lefthook。
- 國際化：i18next；語系與大量資產以 Git submodule 分開管理。
- 後端：官方另有 [rogueserver](https://github.com/pagefaultgames/rogueserver) repository，負責遊戲 server 與 API。

前端核心以 `BattleScene`、phase／queue 系統與 `field`、`modifier`、`ai`、`events`、`system`、`ui` 等領域模組組成。它是長期演進的大型遊戲程式，而不是簡單網頁 demo。

來源：[package.json](https://github.com/pagefaultgames/pokerogue/blob/beta/package.json)、[src/main.ts](https://github.com/pagefaultgames/pokerogue/blob/beta/src/main.ts)、[src 目錄](https://github.com/pagefaultgames/pokerogue/tree/beta/src)、[貢獻指南](https://github.com/pagefaultgames/pokerogue/blob/beta/CONTRIBUTING.md)

## 專案狀態

截至 2026-08-02，GitHub 顯示約 5,793 stars、2,322 forks、422 個 open issues，主要語言為 TypeScript；repository 在 2026-08-01 仍有推送紀錄。專案仍在積極維護，不是已封存的成品。

值得注意的是，GitHub 目前的 default branch 是 `beta`；貢獻指南也以 beta 作為主要開發基線。研究或比較最新架構時，不應只看較穩定的 main。

來源：[GitHub repository](https://github.com/pagefaultgames/pokerogue)、[提交歷史](https://github.com/pagefaultgames/pokerogue/commits/beta)、[貢獻指南](https://github.com/pagefaultgames/pokerogue/blob/beta/CONTRIBUTING.md)

## 授權與使用風險

- 專案自己的原始碼原則上是 `AGPL-3.0-only`。若直接修改、整合並透過網路提供服務，通常會產生向使用者提供對應原始碼的義務。
- Markdown 文件與程式文件註解使用 `CC-BY-NC-SA-4.0`。
- 可授權的素材多數標示為 `CC-BY-NC-SA-4.0`，但 README 明確警告：`assets/` 中沒有被 `REUSE.toml` 明確標示的檔案，應視為沒有清楚授權／著作權資訊。
- 它仍是 Pokémon 同人作品。「repository 開源」不代表其中所有 Pokémon 名稱、角色、sprite、音效或圖像都可自由搬到其他專案。

對 game_B 最安全的使用方式，是研究其玩法節奏、波次設計、phase queue、種子重現、資料驅動戰鬥與測試架構；若要採用概念，應以自有怪獸、素材與獨立實作進行 clean-room 設計，不直接複製程式或 Pokémon 資產。這是風險控制建議，不是法律意見。

來源：[授權摘要](https://github.com/pagefaultgames/pokerogue/blob/beta/README.md#licensing)、[AGPL 授權檔](https://github.com/pagefaultgames/pokerogue/blob/beta/LICENSE)、[REUSE.toml](https://github.com/pagefaultgames/pokerogue/blob/beta/REUSE.toml)

## 與 game_B 的關係

兩者共通點是回合制怪獸戰鬥、捕捉、隊伍／招式構築與長期收集；核心重心則不同：

| 面向 | PokeRogue | game_B |
|---|---|---|
| 核心體驗 | 連續戰鬥與 roguelite run | 電子寵物照顧、生命週期與分支進化 |
| 單局結構 | 波次、biome、隨機道具、重開一輪 | 持續存檔、每日互動、冒險與多種戰鬥入口 |
| 長期進度 | starter、Dex、糖果、蛋、被動能力、模式解鎖 | 怪獸生命、羈絆、性格、圖鑑、日記、雲端存檔 |
| 前端技術 | Phaser + TypeScript | React 18 + Vite |

若 `poke` 分支要探索另一種可能，最值得借鑑的不是把 game_B 改成 PokeRogue 複製品，而是把「冒險」深化成一個獨立的短局制 roguelite 模式，同時保留 game_B 原有的電子寵物身份。

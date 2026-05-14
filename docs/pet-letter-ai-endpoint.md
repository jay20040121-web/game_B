# 怪獸來信 AI Endpoint

前端不直接保存 AI API key。若要啟用 AI 來信，請在 `.env` 設定：

```env
VITE_PET_LETTER_AI_ENDPOINT=https://your-worker.your-subdomain.workers.dev
```

未設定時，遊戲會完全使用本機離線模板。

## Cloudflare Worker

本 repo 使用 Cloudflare Worker 作為 AI 來信後端，程式在 `worker/`。

部署前先登入 Cloudflare：

```bash
cd worker
npx wrangler login
```

設定 OpenAI key 到 Worker secret：

```bash
npx wrangler secret put OPENAI_API_KEY
```

部署：

```bash
npx wrangler deploy
```

部署完成後，把輸出的 `workers.dev` URL 寫入前端 `.env`：

```env
VITE_PET_LETTER_AI_ENDPOINT=https://pixel-monster-pet-letter.<your-subdomain>.workers.dev
```

## Request

前端會以 `POST` 傳送 JSON，且玩家登入 Firebase 時會附上 `Authorization: Bearer <firebase-id-token>`。Worker 會用 Google JWK 驗證 Firebase token，不需要 Firebase Blaze。

```json
{
  "letterId": "2026-05-14-morning",
  "date": "2026-05-14",
  "slotId": "morning",
  "label": "早安來信",
  "monsterName": "像素怪獸",
  "monsterId": "1001",
  "level": 12,
  "hunger": 80,
  "mood": 70,
  "bondValue": 45,
  "todayTrainWins": 1,
  "todayWildDefeated": 0,
  "todayFeedCount": 2,
  "personalityCounts": {
    "gentle": 3
  },
  "traitName": "堅毅",
  "lastPlayerReply": "今天也一起加油",
  "constraints": {
    "locale": "zh-TW",
    "maxPages": 5,
    "minPages": 3,
    "maxCharsPerPage": 45
  }
}
```

## Response

後端只需要回傳：

```json
{
  "pages": [
    "早安，我剛剛在 LCD 裡醒來。",
    "我有記得你昨天說要一起加油。",
    "今天也想把力氣留給你看。"
  ]
}
```

前端會驗證 `pages` 至少 3 句，最多保留 5 句。AI 失敗、未登入或格式錯誤時，會保留本機模板信件。

## 安全規則

- 前端不能存 OpenAI API key。
- Worker 預設需要 Firebase Auth ID token；未登入玩家會收到 401，前端會保留離線模板。
- Worker 允許 CORS 來源：GitHub Pages、localhost、127.0.0.1。
- 若之後需要避免同一封信重複消耗 token，可以再加 Cloudflare KV，用 `uid + date + slotId` 快取結果。

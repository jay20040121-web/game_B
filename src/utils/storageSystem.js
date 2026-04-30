/**
 * 🐉 Pixel Monster - 日記系統完整版 (Diary System Complete v11)
 * --------------------------------------------------------
 * 特色：對戰日記系統、專屬靈魂個性對話、大事優先權紀錄、
 *       全方位的防呆機制與動態成長系統。
 */
export const SAVE_VERSION = 13;

// --- 🔹 環境偵測：判斷是否在 LINE/FB/IG 等 In-App Browser 🔹 ---
export const isInAppBrowser = typeof navigator !== "undefined" && (
    /line/i.test(navigator.userAgent) ||
    /fbav/i.test(navigator.userAgent) ||
    /instagram/i.test(navigator.userAgent) ||
    /micromessenger/i.test(navigator.userAgent)
);

export const loadSaveData = () => {
    try {
        const str = localStorage.getItem('pixel_monster_save');
        if (str) {
            const data = JSON.parse(str);

            // 版本不符 → 回傳 null 讓 App 決定是否全新開始，但不要刪除 localStorage，留給雲端比對
            if (data.saveVersion !== SAVE_VERSION) {
                console.log(`[Storage] Version mismatch (Local: ${data.saveVersion}, App: ${SAVE_VERSION}). Initializing fresh but keeping data for sync check.`);
                return null;
            }

            if (data.lastSaveTime && !data.isDead && data.evolutionStage < 4) {
                const offlineMs = Date.now() - data.lastSaveTime;
                const stageThresh = { 1: 10800000, 2: 21600000, 3: 86400000 }[data.evolutionStage] || 86400000;
                const dropPerMs = 100 / stageThresh;
                const offlineDrop = offlineMs * dropPerMs;

                if (data.hunger !== undefined) data.hunger = Math.max(0, data.hunger - offlineDrop);
                if (data.mood !== undefined) data.mood = Math.max(0, data.mood - offlineDrop);
            }
            return data;
        }
    } catch (e) { }
    return null;
};

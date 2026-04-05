// --- 🛠️ 偵錯系統與環境隔離 (Environment Isolation) ---
export const isLocalhost = typeof window !== "undefined" && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '' ||
    window.location.protocol === 'file:'
);

// 🔹 數據隔離關鍵參數：本地開發使用 dev_ 前綴
export const FIRESTORE_COLLECTION = isLocalhost ? 'dev_users' : 'users';
export const PEER_PREFIX = isLocalhost ? "gameB_v1_dev_" : "gameB_v1_";

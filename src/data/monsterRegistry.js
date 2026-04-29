/**
 * monsterRegistry.js
 * 中央怪獸註冊表 — 所有怪獸的唯一數據來源。
 * 
 * 欄位說明：
 * - id:        新的自有 ID（1000 起）
 * - oldId:     舊寶可夢圖鑑編號（僅供遷移參考，不應在遊戲邏輯中使用）
 * - name:      怪獸名稱
 * - types:     屬性陣列
 * - baseStats: 基礎數值 { hp, atk, def, spd }
 * - assetId:   圖片資源檔名（對應 public/assets/exclusive/ 下的檔案）
 */

export const MONSTER_REGISTRY = [
    // === 起始 ===
    { id: 1000, oldId: 132, name: "晶片獸", types: ["normal"], baseStats: { hp: 48, atk: 48, def: 48, spd: 48 }, assetId: "132" },

    // === 火系靈魂 ===
    { id: 1001, oldId: 4, name: "火星寶寶", types: ["fire"], baseStats: { hp: 39, atk: 60, def: 50, spd: 65 }, assetId: "4" },
    { id: 1002, oldId: 5, name: "火星獸", types: ["fire"], baseStats: { hp: 58, atk: 80, def: 65, spd: 80 }, assetId: "5" },
    { id: 1003, oldId: 6, name: "火星摔角人", types: ["fire", "flying"], baseStats: { hp: 78, atk: 109, def: 85, spd: 100 }, assetId: "6" },

    // === 水系靈魂 ===
    { id: 1004, oldId: 7, name: "泡泡娃", types: ["water"], baseStats: { hp: 44, atk: 50, def: 65, spd: 43 }, assetId: null },
    { id: 1005, oldId: 8, name: "吹泡蠑螈", types: ["water"], baseStats: { hp: 59, atk: 65, def: 80, spd: 58 }, assetId: null },
    { id: 1006, oldId: 9, name: "大師蠑螈", types: ["water"], baseStats: { hp: 79, atk: 85, def: 105, spd: 78 }, assetId: null },

    // === 草系靈魂 ===
    { id: 1007, oldId: 1, name: "綿綿獸", types: ["grass", "poison"], baseStats: { hp: 45, atk: 65, def: 65, spd: 45 }, assetId: null },
    { id: 1008, oldId: 2, name: "甜點獸", types: ["grass", "poison"], baseStats: { hp: 60, atk: 80, def: 80, spd: 60 }, assetId: null },
    { id: 1009, oldId: 3, name: "草莓蛋糕獸", types: ["grass", "poison"], baseStats: { hp: 80, atk: 100, def: 100, spd: 80 }, assetId: null },

    // === 蟲系靈魂 ===
    { id: 1010, oldId: 10, name: "藍領蜂", types: ["bug"], baseStats: { hp: 45, atk: 50, def: 65, spd: 45 }, assetId: "10" },
    { id: 1011, oldId: 11, name: "社畜蜂兵", types: ["bug"], baseStats: { hp: 80, atk: 50, def: 65, spd: 45 }, assetId: "11" },
    { id: 1012, oldId: 12, name: "女王蜂", types: ["bug", "flying"], baseStats: { hp: 80, atk: 90, def: 110, spd: 90 }, assetId: "12" },

    // === 一般線 A (尼多朗) ===
    { id: 1013, oldId: 32, name: "咪兔", types: ["poison"], baseStats: { hp: 46, atk: 57, def: 40, spd: 50 }, assetId: "32" },
    { id: 1014, oldId: 33, name: "野性咪兔", types: ["poison"], baseStats: { hp: 61, atk: 72, def: 65, spd: 65 }, assetId: "33" },
    { id: 1015, oldId: 34, name: "王者咪兔", types: ["poison", "ground"], baseStats: { hp: 91, atk: 92, def: 90, spd: 65 }, assetId: "34" },

    // === 一般線 C (小拉達) ===
    { id: 1016, oldId: 19, name: "咪球", types: ["normal"], baseStats: { hp: 50, atk: 56, def: 50, spd: 72 }, assetId: "19" },
    { id: 1017, oldId: 20, name: "狐狸咪", types: ["normal"], baseStats: { hp: 55, atk: 81, def: 50, spd: 97 }, assetId: "20" },

    // === 一般線 FAIL ===
    { id: 1018, oldId: 137, name: "天后咪", types: ["normal"], baseStats: { hp: 81, atk: 85, def: 80, spd: 80 }, assetId: "137" },

    // === 死亡重生 G1 ===
    { id: 1019, oldId: 92, name: "鬼斯", types: ["ghost", "poison"], baseStats: { hp: 30, atk: 100, def: 35, spd: 80 }, assetId: null },
    { id: 1020, oldId: 93, name: "鬼斯通", types: ["ghost", "poison"], baseStats: { hp: 45, atk: 115, def: 55, spd: 95 }, assetId: null },
    { id: 1021, oldId: 94, name: "耿鬼", types: ["ghost", "poison"], baseStats: { hp: 60, atk: 130, def: 75, spd: 110 }, assetId: null },

    // === 野外 (波波線) ===
    { id: 1022, oldId: 16, name: "小雞獸", types: ["normal", "flying"], baseStats: { hp: 40, atk: 45, def: 40, spd: 56 }, assetId: "16" },
    { id: 1023, oldId: 17, name: "捲尾麻雀", types: ["normal", "flying"], baseStats: { hp: 63, atk: 70, def: 55, spd: 71 }, assetId: "17" },
    { id: 1024, oldId: 18, name: "US老鷹獸", types: ["normal", "flying"], baseStats: { hp: 83, atk: 90, def: 75, spd: 101 }, assetId: "18" },

    // === 野外 (小拳石線) ===
    { id: 1025, oldId: 74, name: "石精靈", types: ["rock", "ground"], baseStats: { hp: 40, atk: 80, def: 100, spd: 20 }, assetId: "74" },
    { id: 1026, oldId: 75, name: "岩石巨兵", types: ["rock", "ground"], baseStats: { hp: 55, atk: 95, def: 115, spd: 35 }, assetId: "75" },
    { id: 1027, oldId: 76, name: "石像魔", types: ["rock", "ground"], baseStats: { hp: 80, atk: 120, def: 130, spd: 45 }, assetId: "76" },
];

// 快速查找工具
export const REGISTRY_BY_ID = Object.fromEntries(MONSTER_REGISTRY.map(m => [String(m.id), m]));
export const REGISTRY_BY_OLD_ID = Object.fromEntries(MONSTER_REGISTRY.map(m => [String(m.oldId), m]));
export const OLD_TO_NEW = Object.fromEntries(MONSTER_REGISTRY.map(m => [String(m.oldId), m.id]));
export const NEW_TO_OLD = Object.fromEntries(MONSTER_REGISTRY.map(m => [String(m.id), m.oldId]));

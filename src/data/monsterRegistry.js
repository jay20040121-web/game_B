/**
 * monsterRegistry.js
 * 中央怪獸註冊表 — 所有怪獸的唯一數據來源。
 * 
 * 欄位說明：
 * - id:        新的自有 ID（1000 起）
 * - name:      怪獸名稱
 * - types:     屬性陣列
 * - baseStats: 基礎數值 { hp, atk, def, spd }
 */

export const MONSTER_REGISTRY = [
    // === 起始 ===
    { id: 1000, name: "晶片獸", types: ["normal"], baseStats: { hp: 48, atk: 48, def: 48, spd: 48 } },

    // === 火系靈魂 ===
    { id: 1001, name: "火星寶寶", types: ["fire"], baseStats: { hp: 39, atk: 60, def: 50, spd: 65 } },
    { id: 1002, name: "火星獸", types: ["fire"], baseStats: { hp: 58, atk: 80, def: 65, spd: 80 } },
    { id: 1003, name: "火星摔角人", types: ["fire"], baseStats: { hp: 78, atk: 109, def: 85, spd: 100 } },

    // === 水系靈魂 ===
    { id: 1004, name: "泡泡娃", types: ["water"], baseStats: { hp: 44, atk: 50, def: 65, spd: 43 } },
    { id: 1005, name: "吹泡蠑螈", types: ["water"], baseStats: { hp: 59, atk: 65, def: 80, spd: 58 } },
    { id: 1006, name: "大師蠑螈", types: ["water"], baseStats: { hp: 79, atk: 85, def: 105, spd: 78 } },

    // === 草系靈魂 ===
    { id: 1007, name: "綿綿獸", types: ["grass"], baseStats: { hp: 45, atk: 65, def: 65, spd: 45 } },
    { id: 1008, name: "甜點獸", types: ["grass"], baseStats: { hp: 60, atk: 80, def: 80, spd: 60 } },
    { id: 1009, name: "草莓蛋糕獸", types: ["grass"], baseStats: { hp: 80, atk: 100, def: 100, spd: 80 } },

    // === 蟲系靈魂 ===
    { id: 1010, name: "藍領蜂", types: ["bug"], baseStats: { hp: 45, atk: 50, def: 65, spd: 45 } },
    { id: 1011, name: "社畜蜂兵", types: ["bug"], baseStats: { hp: 80, atk: 50, def: 65, spd: 45 } },
    { id: 1012, name: "女王蜂", types: ["bug"], baseStats: { hp: 80, atk: 90, def: 110, spd: 90 } },

    // === 一般線 A (尼多朗) ===
    { id: 1013, name: "咪兔", types: ["poison"], baseStats: { hp: 46, atk: 57, def: 40, spd: 50 } },
    { id: 1014, name: "野性咪兔", types: ["poison"], baseStats: { hp: 61, atk: 72, def: 65, spd: 65 } },
    { id: 1015, name: "王者咪兔", types: ["poison"], baseStats: { hp: 91, atk: 92, def: 90, spd: 65 } },

    // === 一般線 C (咪球) ===
    { id: 1016, name: "咪球", types: ["normal"], baseStats: { hp: 50, atk: 56, def: 50, spd: 72 } },
    { id: 1017, name: "狐狸咪", types: ["normal"], baseStats: { hp: 55, atk: 81, def: 50, spd: 97 } },

    // === 一般線 FAIL ===
    { id: 1018, name: "天后咪", types: ["normal"], baseStats: { hp: 81, atk: 85, def: 80, spd: 80 } },

    // === 死亡重生 G1 ===
    { id: 1019, name: "霧氣精靈", types: ["ghost"], baseStats: { hp: 30, atk: 100, def: 35, spd: 80 } },
    { id: 1020, name: "幽影長舌獸", types: ["ghost"], baseStats: { hp: 45, atk: 115, def: 55, spd: 95 } },
    { id: 1021, name: "大笑幽靈王", types: ["ghost"], baseStats: { hp: 60, atk: 130, def: 75, spd: 110 } },

    // === 野外 (波波線) ===
    { id: 1022, name: "小雞獸", types: ["flying"], baseStats: { hp: 40, atk: 45, def: 40, spd: 56 } },
    { id: 1023, name: "捲尾麻雀", types: ["flying"], baseStats: { hp: 63, atk: 70, def: 55, spd: 71 } },
    { id: 1024, name: "US老鷹獸", types: ["flying"], baseStats: { hp: 83, atk: 90, def: 75, spd: 101 } },

    // === 野外 (小拳石線) ===
    { id: 1025, name: "石精靈", types: ["rock"], baseStats: { hp: 40, atk: 80, def: 100, spd: 20 } },
    { id: 1026, name: "岩石巨兵", types: ["rock"], baseStats: { hp: 55, atk: 95, def: 115, spd: 35 } },
    { id: 1027, name: "石像魔", types: ["rock"], baseStats: { hp: 80, atk: 120, def: 130, spd: 45 } },
];

// 快速查找工具
export const REGISTRY_BY_ID = Object.fromEntries(MONSTER_REGISTRY.map(m => [String(m.id), m]));

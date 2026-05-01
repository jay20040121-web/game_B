import { MONSTER_REGISTRY } from './monsterRegistry';
const getMName = id => MONSTER_REGISTRY.find(m => m.id === id)?.name || '未知';

/**
 * evolutionConfig.js
 * 這是遊戲進化的核心數據文件。
 * 包含進化時間、進化鏈分支、觸發條件以及對應的怪獸 ID。
 * 
 * 條件說明 (Condition Description):
 * - sWins: 特訓勝場 (Stage Training Wins)
 * - mood: 心情 (0-100)
 * - hunger: 飽足感 (0-100)
 * - bond: 羈絆值 (0-100)
 * - topTag: 最優勢個性標籤
 */

export const EVO_TIMES = {
    FINAL_LIFETIME: 604800000 // 最終壽命上限：7 天 (不論階段)
};

export const EVO_LEVELS = {
    0: 5,   // 蛋/初生 -> 幼年期
    1: 15,  // 幼年期 -> 成長期
    2: 30,  // 成長期 -> 成熟期
    3: 60   // 成熟期 -> 完全體
};

export const WILD_EVOLUTION_MAP = {
    "1022": 1023, "1023": 1024,    // 波波線
    "1025": 1026, "1026": 1027,    // 小拳石線
};

export const EVOLUTION_CHAINS = {
    "START": {
        stage1: {
            "A": { id: 1000 }, "C": { id: 1000 },
            "F_SOUL": { id: 1000 }, "W_SOUL": { id: 1000 }, "GR_SOUL": { id: 1000 }, "B_SOUL": { id: 1000 }
        },
        branches: [
            // 靈魂進化優先級最高
            { to: "F_SOUL", condition: "bond >= 80 && affinity == 'fire'", desc: `火系靈魂 (${getMName(1001)}線)` },
            { to: "W_SOUL", condition: "bond >= 80 && affinity == 'water'", desc: `水系靈魂 (${getMName(1004)}線)` },
            { to: "GR_SOUL", condition: "bond >= 80 && affinity == 'grass'", desc: `草系靈魂 (${getMName(1007)}線)` },
            { to: "B_SOUL", condition: "bond >= 80 && affinity == 'bug'", desc: `蟲系靈魂 (${getMName(1010)}線)` },

            // 基礎分支
            { to: "A", condition: "mood >= 50 && hunger >= 50", desc: `一般線 A (${getMName(1013)})` },
            { to: "C", condition: "else", desc: `一般線 C (${getMName(1016)})` }
        ]
    },

    // --- 魂系分支 (Soul Lines) ---
    "SOUL_FIRE": {
        stage2: { "F_SOUL": { id: 1001, desc: `${getMName(1001)}` } },
        stage3: { "F_SOUL": { id: 1002, from: "F_SOUL", desc: `${getMName(1002)} (無條件進化)` } },
        stage4: { "F_SOUL": { id: 1003, from: "F_SOUL", desc: `${getMName(1003)} (無條件進化)` } }
    },

    "SOUL_WATER": {
        stage2: { "W_SOUL": { id: 1004, desc: `${getMName(1004)}` } },
        stage3: {
            "W_SOUL": { id: 1005, from: ["W_SOUL", "W_SOUL_ALT"], desc: `${getMName(1005)} (其餘條件)` },
            "W_SOUL_ALT": { id: 1028, from: ["W_SOUL", "W_SOUL_ALT"], desc: `${getMName(1028)} (熱血/無俚頭)` }
        },
        stage4: {
            "W_SOUL": { id: 1006, from: ["W_SOUL", "W_SOUL_ALT"], desc: `${getMName(1006)} (其餘條件)` },
            "W_SOUL_ALT": { id: 1029, from: ["W_SOUL", "W_SOUL_ALT"], desc: `${getMName(1029)} (熱血/無俚頭)` }
        }
    },

    "SOUL_GRASS": {
        stage2: { "GR_SOUL": { id: 1007, desc: `${getMName(1007)}` } },
        stage3: { "GR_SOUL": { id: 1008, from: "GR_SOUL", desc: `${getMName(1008)} (無條件進化)` } },
        stage4: { "GR_SOUL": { id: 1009, from: "GR_SOUL", desc: `${getMName(1009)} (無條件進化)` } }
    },

    "SOUL_BUG": {
        stage2: { "B_SOUL": { id: 1010, desc: `${getMName(1010)}` } },
        stage3: { "B_SOUL": { id: 1011, from: "B_SOUL", desc: `${getMName(1011)} (無條件進化)` } },
        stage4: { "B_SOUL": { id: 1012, from: "B_SOUL", desc: `${getMName(1012)} (無條件進化)` } }
    },

    "NORMAL": {
        stage2: {
            "A": { id: 1013, desc: `${getMName(1013)}` },
            "C": { id: 1016, desc: `${getMName(1016)}` }
        },
        stage3: {
            "A": { id: 1014, from: ["A", "C"], desc: `${getMName(1014)} (心情、飽食度 >= 50)` },
            "C": { id: 1017, from: ["A", "C"], desc: `${getMName(1017)} (其餘條件)` }
        },
        stage4: {
            "A": { id: 1015, from: ["A", "C"], desc: `${getMName(1015)} (心情、飽食度 >= 50)` },
            "C": { id: 1018, from: ["A", "C"], desc: `${getMName(1018)} (其餘條件)` }
        }
    },

    "SOUL_DEATH": {
        stage1: {
            "G1": { id: 1019, desc: `${getMName(1019)}` }
        },
        stage2: {
            "G1": { id: 1020, from: "G1", desc: `${getMName(1020)} (無特殊條件)` }
        },
        stage3: {
            "G1": { id: 1021, from: "G1", desc: `${getMName(1021)} (無特殊條件)` }
        }
    }
};

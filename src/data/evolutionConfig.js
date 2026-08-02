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
 */

export const EVO_LEVELS = {
    0: 15,
    1: 15,  // 第一階進化
    2: 30,  // 第二階進化
    3: 45,  // 第三階進化
    4: 60   // 預留後續階段：每 15 級一階
};

export const WILD_EVOLUTION_MAP = {
    "1022": 1023, "1023": 1024,    // 小雞獸線
    "1025": 1026, "1026": 1027,    // 小拳石線
    "1038": 1039,                  // 飄飄球線
};

export const EVOLUTION_CHAINS = {
    "START": {
        stage1: {
            "A": { id: 1000 }, "C": { id: 1000 },
            "F_SOUL": { id: 1000 }, "W_SOUL": { id: 1000 }, "GR_SOUL": { id: 1000 }, "GR_SOUL_ALT": { id: 1000 }, "B_SOUL": { id: 1000 }, "B_SOUL_ALT": { id: 1000 }
        },
        branches: [
            // 靈魂進化優先級最高
            { to: "F_SOUL", condition: "bond >= 40 && affinity == 'fire'", desc: `火系靈魂 (${getMName(1001)}線)` },
            { to: "W_SOUL", condition: "bond >= 40 && affinity == 'water'", desc: `水系靈魂 (${getMName(1004)}線)` },            { to: "GR_SOUL", condition: "bond >= 40 && affinity == 'grass'", desc: `草系靈魂 (${getMName(1007)}線)` },            { to: "B_SOUL", condition: "bond >= 40 && affinity == 'bug'", desc: `蟲系靈魂 (${getMName(1010)}線)` },

            // 基礎分支
            { to: "A", condition: "mood >= 50 && hunger >= 50", desc: `一般線 A (${getMName(1013)})` },
            { to: "C", condition: "else", desc: `一般線 C (${getMName(1016)})` }
        ]
    },

    // --- 魂系分支 (Soul Lines) ---
    "SOUL_FIRE": {
        stage2: {
            "F_SOUL": { id: 1001, desc: `${getMName(1001)}` },
            "F_SOUL_ALT": { id: 1030, desc: `${getMName(1030)}` }
        },
        stage3: {
            "F_SOUL": { id: 1002, from: "F_SOUL", desc: `${getMName(1002)} (無條件進化)` },
            "F_SOUL_ALT": { id: 1031, from: "F_SOUL_ALT", desc: `${getMName(1031)} (無條件進化)` }
        },
        stage4: {
            "F_SOUL": { id: 1003, from: "F_SOUL", desc: `${getMName(1003)} (無條件進化)` }
        }
    },
    "SOUL_WATER": {
        stage2: {
            "W_SOUL": { id: 1004, desc: `${getMName(1004)}` },
            "W_SOUL_ALT": { id: 1028, desc: `${getMName(1028)}` }
        },
        stage3: {
            "W_SOUL": { id: 1005, from: "W_SOUL", desc: `${getMName(1005)} (無條件進化)` },
            "W_SOUL_ALT": { id: 1029, from: "W_SOUL_ALT", desc: `${getMName(1029)} (無條件進化)` }
        },
        stage4: {
            "W_SOUL": { id: 1006, from: "W_SOUL", desc: `${getMName(1006)} (無條件進化)` },
            "W_SOUL_ALT": { id: 1042, from: "W_SOUL_ALT", desc: `${getMName(1042)} (無條件進化)` }
        }
    },
    "SOUL_GRASS": {
        stage2: {
            "GR_SOUL": { id: 1007, desc: `${getMName(1007)}` },
            "GR_SOUL_ALT": { id: 1032, desc: `${getMName(1032)}` }
        },
        stage3: {
            "GR_SOUL": { id: 1008, from: "GR_SOUL", desc: `${getMName(1008)} (無條件進化)` },
            "GR_SOUL_ALT": { id: 1033, from: "GR_SOUL_ALT", desc: `${getMName(1033)} (無條件進化)` }
        },
        stage4: {
            "GR_SOUL": { id: 1009, from: "GR_SOUL", desc: `${getMName(1009)} (無條件進化)` },
            "GR_SOUL_ALT": { id: 1034, from: "GR_SOUL_ALT", desc: `${getMName(1034)} (無條件進化)` }
        }
    },

    "SOUL_BUG": {
        stage2: {
            "B_SOUL": { id: 1010, desc: `${getMName(1010)}` },
            "B_SOUL_ALT": { id: 1035, desc: `${getMName(1035)}` }
        },
        stage3: {
            "B_SOUL": { id: 1011, from: "B_SOUL", desc: `${getMName(1011)} (無條件進化)` },
            "B_SOUL_ALT": { id: 1036, from: "B_SOUL_ALT", desc: `${getMName(1036)} (無條件進化)` }
        },
        stage4: {
            "B_SOUL": { id: 1012, from: "B_SOUL", desc: `${getMName(1012)} (無條件進化)` },
            "B_SOUL_ALT": { id: 1037, from: "B_SOUL_ALT", desc: `${getMName(1037)} (無條件進化)` }
        }
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
            "A_BOND": { id: 1041, from: ["A"], desc: `${getMName(1041)} (羈絆值 > 90)` },
            "C_BOND": { id: 1040, from: ["C"], desc: `${getMName(1040)} (羈絆值 > 90)` },
            "C": { id: 1018, from: ["A", "C"], desc: `${getMName(1018)} (其餘條件)` }
        }
    },

    "SOUL_DEATH": {
        stage1: {
            "G1": { id: 1019, desc: `${getMName(1019)}` },
            "G1_ALT": { id: 1019, desc: `${getMName(1019)} (舊存檔相容)` }
        },
        stage2: {
            "G1": { id: 1020, from: ["G1", "G1_ALT"], desc: `${getMName(1020)} (無條件進化)` },
            "G1_ALT": { id: 1020, from: ["G1", "G1_ALT"], desc: `${getMName(1020)} (舊存檔相容)` }
        },
        stage3: {
            "G1": { id: 1021, from: ["G1", "G1_ALT"], desc: `${getMName(1021)} (無條件進化)` },
            "G1_ALT": { id: 1021, from: ["G1", "G1_ALT"], desc: `${getMName(1021)} (舊存檔相容)` }
        }
    }
};

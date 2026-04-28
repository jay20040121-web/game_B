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
    1: 3600000,   // 1 小時 (幼年期 -> 成長期)
    2: 21600000,  // 6 小時 (成長期 -> 成熟期)
    3: 86400000,  // 24 小時 (成熟期 -> 完全體)
    FINAL_LIFETIME: 604800000 // 最終階段壽命：7 天
};

export const WILD_EVOLUTION_MAP = {
    "16": 17, "17": 18,    // 波波線
    "74": 75, "75": 76,    // 小拳石線
};

export const EVOLUTION_CHAINS = {
    "START": {
        stage1: {
            "A": { id: 132 }, "C": { id: 132 },
            "F_SOUL": { id: 132 }, "W_SOUL": { id: 132 }, "GR_SOUL": { id: 132 }, "B_SOUL": { id: 132 }
        },
        branches: [
            // 靈魂進化優先級最高
            { to: "F_SOUL", condition: "bond >= 80 && affinity == 'fire'", desc: "火系靈魂 (小火龍線)" },
            { to: "W_SOUL", condition: "bond >= 80 && affinity == 'water'", desc: "水系靈魂 (傑尼龜線)" },
            { to: "GR_SOUL", condition: "bond >= 80 && affinity == 'grass'", desc: "草系靈魂 (妙蛙種子線)" },
            { to: "B_SOUL", condition: "bond >= 80 && affinity == 'bug'", desc: "蟲系靈魂 (綠毛蟲線)" },

            // 基礎分支
            { to: "A", condition: "mood >= 50 && hunger >= 50", desc: "一般線 A (尼多朗)" },
            { to: "C", condition: "else", desc: "一般線 C (小拉達)" }
        ]
    },

    // --- 魂系分支 (Soul Lines) ---
    "SOUL_FIRE": {
        stage2: { "F_SOUL": { id: 4, desc: "小火龍" } },
        stage3: { "F_SOUL": { id: 5, from: "F_SOUL", desc: "火恐龍 (無條件進化)" } },
        stage4: { "F_SOUL": { id: 6, from: "F_SOUL", desc: "噴火龍 (無條件進化)" } }
    },

    "SOUL_WATER": {
        stage2: { "W_SOUL": { id: 7, desc: "傑尼龜" } },
        stage3: { "W_SOUL": { id: 8, from: "W_SOUL", desc: "卡咪龜 (無條件進化)" } },
        stage4: { "W_SOUL": { id: 9, from: "W_SOUL", desc: "水箭龜 (無條件進化)" } }
    },

    "SOUL_GRASS": {
        stage2: { "GR_SOUL": { id: 1, desc: "妙蛙種子" } },
        stage3: { "GR_SOUL": { id: 2, from: "GR_SOUL", desc: "妙蛙草 (無條件進化)" } },
        stage4: { "GR_SOUL": { id: 3, from: "GR_SOUL", desc: "妙蛙花 (無條件進化)" } }
    },

    "SOUL_BUG": {
        stage2: { "B_SOUL": { id: 10, desc: "綠毛蟲" } },
        stage3: { "B_SOUL": { id: 11, from: "B_SOUL", desc: "鐵甲蛹 (無條件進化)" } },
        stage4: { "B_SOUL": { id: 12, from: "B_SOUL", desc: "巴大蝶 (無條件進化)" } }
    },

    "NORMAL": {
        stage2: {
            "A": { id: 32, desc: "尼多朗" },
            "C": { id: 19, desc: "小拉達" }
        },
        stage3: {
            "A": { id: 33, from: ["A", "C"], desc: "尼多力諾 (心情、飽食度 >= 50)" },
            "C": { id: 20, from: ["A", "C"], desc: "拉達 (其餘條件)" }
        },
        stage4: {
            "A": { id: 34, from: ["A", "C"], desc: "尼多王 (心情、飽食度 >= 50)" },
            "C": { id: 137, from: ["A", "C"], desc: "多邊獸 (其餘條件)" }
        }
    },

    "SOUL_DEATH": {
        stage1: {
            "G1": { id: 92, desc: "鬼斯" },
            "G2": { id: 63, desc: "凱西" }
        },
        stage2: {
            "G1": { id: 93, from: "G1", desc: "鬼斯通 (無特殊條件)" },
            "G2": { id: 64, from: "G2", desc: "勇基拉 (無特殊條件)" }
        },
        stage3: {
            "G1": { id: 94, from: "G1", desc: "耿鬼 (無特殊條件)" },
            "G2": { id: 65, from: "G2", desc: "胡地 (無特殊條件)" }
        }
    }
};

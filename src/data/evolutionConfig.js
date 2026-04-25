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
    "23": 24,              // 阿柏蛇線
    "27": 28,              // 穿山鼠線
    "41": 42, "42": 169,   // 超音蝠線
    "56": 57, "57": 979,   // 猴怪線
    "74": 75, "75": 76,    // 小拳石線
    "60": 61, "61": 62    // 蚊香蝌蚪線
};

export const EVOLUTION_CHAINS = {
    "START": {
        stage1: {
            "A": { id: 132 }, "C": { id: 132 },
            "F": { id: 132 }, "P1": { id: 132 }, "P2": { id: 132 },
            "F_SOUL": { id: 132 }, "W_SOUL": { id: 132 }, "GR_SOUL": { id: 132 }, "B_SOUL": { id: 132 }
        },
        branches: [
            // 靈魂進化優先級最高
            { to: "F_SOUL", condition: "bond >= 80 && affinity == 'fire'", desc: "火系靈魂 (小火龍線)" },
            { to: "W_SOUL", condition: "bond >= 80 && affinity == 'water'", desc: "水系靈魂 (傑尼龜線)" },
            { to: "GR_SOUL", condition: "bond >= 80 && affinity == 'grass'", desc: "草系靈魂 (妙蛙種子線)" },
            { to: "B_SOUL", condition: "bond >= 80 && affinity == 'bug'", desc: "蟲系靈魂 (綠毛蟲線)" },

            // 基礎分支
            { to: "F", condition: "sWins >= 8", desc: "格鬥系 (腕力)" },
            { to: "P1", condition: "mood <= 0 && hunger <= 0", desc: "毒系 A (瓦斯彈)" },
            { to: "P2", condition: "mood <= 0 && hunger <= 0", desc: "毒系 B (臭泥)" },
            { to: "A", condition: "mood >= 50 && hunger >= 50", desc: "一般線 A (尼多朗)" },
            { to: "C", condition: "else", desc: "一般線 C (小拉達)" }
        ]
    },

    // --- 魂系分支 (Soul Lines) ---
    "SOUL_FIRE": {
        stage2: {
            "F_SOUL": { id: 4, desc: "小火龍" },
            "F_VULPIX_SOUL": { id: 37, desc: "六尾" }
        },
        stage3: {
            "F_CHARMELEON_SOUL": { id: 5, condition: "mood >= 80", from: "F_SOUL", desc: "火恐龍 (心情 80+)" },
            "F_CUBONE_SOUL": { id: 104, condition: "mood < 80", from: "F_SOUL", desc: "卡拉卡拉 (心情 < 80)" },
            "F_GROWLITHE_SOUL": { id: 58, condition: "passionate/stubborn", from: "F_VULPIX_SOUL", desc: "黑魯加 (熱情/頑固個性)" },
            "F_PONYTA_SOUL": { id: 77, condition: "rational/nonsense", from: "F_VULPIX_SOUL", desc: "火岩鼠 (理性/無俚頭個性)" },
            "F_NINETALES_SOUL": { id: 38, condition: "else", from: "F_VULPIX_SOUL", desc: "九尾" }
        },
        stage4: {
            "F_CHARIZARD_SOUL": { id: 6, condition: "passionate/stubborn && m/h >= 50", from: ["F_CHARMELEON_SOUL", "F_CUBONE_SOUL"], desc: "噴火龍 (熱情/頑固且心情與飽食 50+)" },
            "F_MAGMAR_SOUL": { id: 126, condition: "stubborn && m < 50", from: ["F_CHARMELEON_SOUL", "F_CUBONE_SOUL"], desc: "鴨嘴火龍 (頑固且心情 < 50)" },
            "F_MAROWAK_SOUL": { id: 105, condition: "else", from: ["F_CHARMELEON_SOUL", "F_CUBONE_SOUL"], desc: "嘎啦嘎啦 (其餘條件)" },
            "F_ARCANINE_SOUL": { id: 59, from: "F_GROWLITHE_SOUL", desc: "風速狗 (無特殊條件)" },
            "F_RAPIDASH_SOUL": { id: 78, from: "F_PONYTA_SOUL", desc: "火爆獸 (無特殊條件)" }
        }
    },

    "SOUL_WATER": {
        stage2: {
            "W_SQUIRTLE_SOUL": { id: 7, desc: "傑尼龜" },
            "W_DRATINI_SOUL": { id: 147, condition: "sWins >= 8 && m/h >= 50", desc: "迷你龍" }
        },
        stage3: {
            "W_WARTORTLE_SOUL": { id: 8, from: "W_SQUIRTLE_SOUL", desc: "卡咪龜" },
            "W_DRAGONAIR_SOUL": { id: 148, condition: "sWins >= 30 && m/h >= 50", from: "W_DRATINI_SOUL", desc: "哈克龍" },
            "W_HORSEA_SOUL": { id: 116, condition: "rational/gentle", from: "W_DRATINI_SOUL", desc: "海刺龍 (精明個性)" },
            "W_MAGIKARP_SOUL": { id: 129, condition: "else", from: "W_DRATINI_SOUL", desc: "鯉魚王" }
        },
        stage4: {
            "W_BLASTOISE_SOUL": { id: 9, from: "W_WARTORTLE_SOUL", desc: "水箭龜 (無特殊條件)" },
            "W_DRAGONITE_SOUL": { id: 149, from: "W_DRAGONAIR_SOUL", desc: "快龍 (無特殊條件)" },
            "W_GYARADOS_SOUL": { id: 130, from: "W_MAGIKARP_SOUL", desc: "暴鯉龍 (無特殊條件)" },
            "W_LAPRAS_SOUL": { id: 131, condition: "m >= 50 && rational/gentle", from: "W_HORSEA_SOUL", desc: "拉普拉斯 (心情 50+ 且理性/溫和)" },
            "W_SEADRA_SOUL": { id: 117, condition: "else", from: "W_HORSEA_SOUL", desc: "刺龍王 (其餘條件)" }
        }
    },

    "SOUL_GRASS": {
        stage2: {
            "GR_SOUL": { id: 1, desc: "妙蛙種子" },
            "GR_ODDISH_SOUL": { id: 43, condition: "m/h >= 50", desc: "木守宮" }
        },
        stage3: {
            "GR_IVYSAUR_SOUL": { id: 2, condition: "mood >= 80", from: "GR_SOUL", desc: "妙蛙草 (心情 80+)" },
            "GR_PARAS_SOUL": { id: 46, condition: "mood < 80", from: "GR_SOUL", desc: "月桂葉 (心情 < 80)" },
            "GR_BELLSPROUT_SOUL": { id: 69, condition: "gentle/rational && m/h >= 50", from: "GR_ODDISH_SOUL", desc: "奇魯莉安 (溫和/理性個性)" },
            "GR_EXEGGCUTE_SOUL": { id: 102, condition: "passionate/nonsense", from: "GR_ODDISH_SOUL", desc: "蛋蛋 (熱情/無俚頭熱個性)" },
            "GR_GLOOM_SOUL": { id: 44, condition: "else", from: "GR_ODDISH_SOUL", desc: "森林蜥蜴" }
        },
        stage4: {
            "GR_VENUSAUR_SOUL": { id: 3, condition: "gentle/rational && m/h >= 50", from: ["GR_IVYSAUR_SOUL", "GR_PARAS_SOUL"], desc: "妙蛙花 (溫和/理性且心情與飽食 50+)" },
            "GR_PARASECT_SOUL": { id: 47, condition: "else", from: ["GR_IVYSAUR_SOUL", "GR_PARAS_SOUL"], desc: "大竺葵 (其餘條件)" },
            "GR_VILEPLUME_SOUL": { id: 45, from: "GR_GLOOM_SOUL", desc: "蜥蜴王 (無特殊條件)" },
            "GR_VICTREEBEL_SOUL": { id: 71, from: "GR_BELLSPROUT_SOUL", desc: "沙奈朵 (無特殊條件)" },
            "GR_EXEGGUTOR_SOUL": { id: 103, from: "GR_EXEGGCUTE_SOUL", desc: "椰蛋樹 (無特殊條件)" }
        }
    },

    "SOUL_BUG": {
        stage2: { "B_SOUL": { id: 10, desc: "綠毛蟲" } },
        stage3: {
            "B_M_SOUL": { id: 11, condition: "mood >= 50", from: "B_SOUL", desc: "鐵甲蛹 (心情 50+)" },
            "B_H_SOUL": { id: 14, condition: "hunger >= 50", from: "B_SOUL", desc: "鐵殼蛹 (飽食 50+)" },
            "B_E_SOUL": { id: 48, condition: "else", from: "B_SOUL", desc: "毛球 (其餘條件)" }
        },
        stage4: {
            "B_M2_SOUL": { id: 12, condition: "m >= 50", from: ["B_M_SOUL", "B_H_SOUL", "B_E_SOUL"], desc: "巴大蝶" },
            "B_H2_SOUL": { id: 15, condition: "m < 50 && h >= 50", from: ["B_M_SOUL", "B_H_SOUL", "B_E_SOUL"], desc: "大針蜂" },
            "B_E2_SOUL": { id: 49, condition: "else", from: ["B_M_SOUL", "B_H_SOUL", "B_E_SOUL"], desc: "末入蛾" }
        }
    },

    // --- 特色培訓線 (Special Training Lines) ---
    "FIGHT": {
        stage2: { "F": { id: 66, desc: "腕力" } },
        stage3: {
            "F": { id: 67, condition: "sWins >= 30", from: "F", desc: "豪力 (特訓勝場 30+)" },
            "F_FAIL1": { id: 106, condition: "sWins < 30", from: "F", desc: "飛腿郎 (特訓勝場 < 30)" }
        },
        stage4: {
            "F": { id: 68, condition: "sWins >= 50", from: "F", desc: "怪力 (特訓勝場 50+)" },
            "F_FAIL2": { id: 107, condition: "sWins < 50", from: "F", desc: "快拳郎 (特訓勝場 < 50)" }
        }
    },

    "POISON": {
        stage2: {
            "P1": { id: 109, desc: "瓦斯彈" },
            "P2": { id: 88, desc: "臭泥" }
        },
        stage3: {
            "P1_SPECIAL": { id: 82, condition: "mood > 80", from: "P1", desc: "三合一磁怪 (心情 > 80)" },
            "P1": { id: 110, from: "P1", desc: "雙彈瓦斯 (其餘條件)" },
            "P2_SPECIAL": { id: 54, condition: "mood > 80", from: "P2", desc: "可達鴨 (心情 > 80)" },
            "P2": { id: 89, from: "P2", desc: "臭臭泥 (其餘條件)" }
        },
        stage4: {
            "P2_SPECIAL": { id: 55, from: "P2_SPECIAL", desc: "哥達鴨 (無特殊條件)" }
        }
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

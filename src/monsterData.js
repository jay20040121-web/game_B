// Generated from PokeAPI (zh-Hant)

// 怪獸名稱表 — 使用自有 ID 系統 (1000 起)
import { MONSTER_REGISTRY } from './data/monsterRegistry';

// 從中央怪獸註冊表動態生成資料，確保單一資料來源 (Single Source of Truth)
export const MONSTER_NAMES = {};
export const SPECIES_BASE_STATS = {};
export const MONSTER_ASSET_IDS = {};

MONSTER_REGISTRY.forEach(monster => {
    MONSTER_NAMES[monster.id] = monster.name;
    SPECIES_BASE_STATS[monster.id] = {
        hp: monster.baseStats.hp,
        atk: monster.baseStats.atk,
        def: monster.baseStats.def,
        spd: monster.baseStats.spd,
        types: monster.types
    };
});

export const TYPE_MAP = {
    "normal": "普",
    "fire": "火",
    "water": "水",
    "grass": "草",
    "electric": "電",
    "ice": "冰",
    "fighting": "鬥",
    "poison": "毒",
    "ground": "地",
    "flying": "飛",
    "psychic": "超",
    "bug": "蟲",
    "rock": "岩",
    "ghost": "鬼",
    "dragon": "龍",
    "steel": "鋼",
    "dark": "惡",
    "fairy": "妖"
};

export const NATURE_CONFIG = {
    "gentle": {
        "name": "溫柔",
        "buff": "hp",
        "nerf": "atk",
        "desc": "HP +10%, 攻擊 -10%"
    },
    "stubborn": {
        "name": "固執",
        "buff": "def",
        "nerf": "spd",
        "desc": "防禦 +10%, 速度 -10%"
    },
    "passionate": {
        "name": "熱情",
        "buff": "atk",
        "nerf": "def",
        "desc": "攻擊 +10%, 防禦 -10%"
    },
    "nonsense": {
        "name": "無俚頭",
        "buff": "spd",
        "nerf": "def",
        "desc": "速度 +10%, 防禦 -10%"
    },
    "rational": {
        "name": "理性",
        "buff": "spd",
        "nerf": "atk",
        "desc": "速度 +10%, 攻擊 -10%"
    }
};

// --- 技能資料庫 ---
export const SKILL_DATABASE = {
    "tackle": {
        "id": "tackle",
        "name": "撞擊",
        "type": "normal",
        "power": 40
    },
    "quick_attack": {
        "id": "quick_attack",
        "name": "電光一閃",
        "type": "normal",
        "power": 40,
        "priority": 1
    },
    "water_gun": {
        "id": "water_gun",
        "name": "水槍",
        "type": "water",
        "power": 40
    },
    "ember": {
        "id": "ember",
        "name": "火花",
        "type": "fire",
        "power": 40,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "vine_whip": {
        "id": "vine_whip",
        "name": "藤鞭",
        "type": "grass",
        "power": 45
    },
    "lick": {
        "id": "lick",
        "name": "舌舔",
        "type": "ghost",
        "power": 30,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "confusion": {
        "id": "confusion",
        "name": "念力",
        "type": "psychic",
        "power": 50,
        "ailment": "confusion",
        "ailment_chance": 10
    },
    "swords_dance": {
        "id": "swords_dance",
        "name": "劍舞",
        "type": "normal",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "agility": {
        "id": "agility",
        "name": "高速移動",
        "type": "psychic",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "iron_defense": {
        "id": "iron_defense",
        "name": "鐵壁",
        "type": "steel",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "nasty_plot": {
        "id": "nasty_plot",
        "name": "詭計",
        "type": "dark",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "calm_mind": {
        "id": "calm_mind",
        "name": "冥想",
        "type": "psychic",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "dragon_dance": {
        "id": "dragon_dance",
        "name": "龍之舞",
        "type": "dragon",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "bulk_up": {
        "id": "bulk_up",
        "name": "健美",
        "type": "fighting",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "work_up": {
        "id": "work_up",
        "name": "自我激勵",
        "type": "normal",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "extreme_speed": {
        "id": "extreme_speed",
        "name": "神速",
        "type": "normal",
        "power": 80,
        "priority": 2
    },
    "fake_out": {
        "id": "fake_out",
        "name": "擊掌奇襲",
        "type": "normal",
        "power": 40,
        "priority": 3,
        "flinch_chance": 100
    },
    "feint": {
        "id": "feint",
        "name": "佯攻",
        "type": "normal",
        "power": 30,
        "priority": 2
    },
    "hyper_beam": {
        "id": "hyper_beam",
        "name": "破壞光線",
        "type": "normal",
        "power": 150
    },
    "giga_impact": {
        "id": "giga_impact",
        "name": "終極衝擊",
        "type": "normal",
        "power": 150
    },
    "last_resort": {
        "id": "last_resort",
        "name": "珍藏",
        "type": "normal",
        "power": 140
    },
    "skull_bash": {
        "id": "skull_bash",
        "name": "火箭頭錘",
        "type": "normal",
        "power": 130
    },
    "mega_kick": {
        "id": "mega_kick",
        "name": "百萬噸重踢",
        "type": "normal",
        "power": 120
    },
    "thrash": {
        "id": "thrash",
        "name": "大鬧一番",
        "type": "normal",
        "power": 120
    },
    "double_edge": {
        "id": "double_edge",
        "name": "捨身衝撞",
        "type": "normal",
        "power": 120,
        "recoil": 0.33
    },
    "growth": {
        "id": "growth",
        "name": "生長",
        "type": "normal",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "double_team": {
        "id": "double_team",
        "name": "影子分身",
        "type": "normal",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "harden": {
        "id": "harden",
        "name": "變硬",
        "type": "normal",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "minimize": {
        "id": "minimize",
        "name": "變小",
        "type": "normal",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "defense_curl": {
        "id": "defense_curl",
        "name": "變圓",
        "type": "normal",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "egg_bomb": {
        "id": "egg_bomb",
        "name": "炸蛋",
        "type": "normal",
        "power": 100
    },
    "sharpen": {
        "id": "sharpen",
        "name": "稜角化",
        "type": "normal",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "stockpile": {
        "id": "stockpile",
        "name": "蓄力",
        "type": "normal",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "judgment": {
        "id": "judgment",
        "name": "制裁光礫",
        "type": "normal",
        "power": 100
    },
    "take_down": {
        "id": "take_down",
        "name": "猛撞",
        "type": "normal",
        "power": 90,
        "recoil": 0.25
    },
    "uproar": {
        "id": "uproar",
        "name": "吵鬧",
        "type": "normal",
        "power": 90
    },
    "hyper_voice": {
        "id": "hyper_voice",
        "name": "巨聲",
        "type": "normal",
        "power": 90
    },
    "rock_climb": {
        "id": "rock_climb",
        "name": "攀岩",
        "type": "normal",
        "power": 90,
        "ailment": "confusion",
        "ailment_chance": 20
    },
    "body_slam": {
        "id": "body_slam",
        "name": "泰山壓頂",
        "type": "normal",
        "power": 85,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "mega_punch": {
        "id": "mega_punch",
        "name": "百萬噸重拳",
        "type": "normal",
        "power": 80
    },
    "razor_wind": {
        "id": "razor_wind",
        "name": "旋風刀",
        "type": "normal",
        "power": 80
    },
    "slam": {
        "id": "slam",
        "name": "摔打",
        "type": "normal",
        "power": 80
    },
    "strength": {
        "id": "strength",
        "name": "怪力",
        "type": "normal",
        "power": 80
    },
    "hyper_fang": {
        "id": "hyper_fang",
        "name": "必殺門牙",
        "type": "normal",
        "power": 80,
        "flinch_chance": 10
    },
    "tri_attack": {
        "id": "tri_attack",
        "name": "三重攻擊",
        "type": "normal",
        "power": 80
    },
    "crush_claw": {
        "id": "crush_claw",
        "name": "撕裂爪",
        "type": "normal",
        "power": 75,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 50,
        "stat_target": "enemy"
    },
    "headbutt": {
        "id": "headbutt",
        "name": "頭錘",
        "type": "normal",
        "power": 70,
        "flinch_chance": 30
    },
    "dizzy_punch": {
        "id": "dizzy_punch",
        "name": "迷昏拳",
        "type": "normal",
        "power": 70,
        "ailment": "confusion",
        "ailment_chance": 20
    },
    "slash": {
        "id": "slash",
        "name": "劈開",
        "type": "normal",
        "power": 70
    },
    "facade": {
        "id": "facade",
        "name": "硬撐",
        "type": "normal",
        "power": 70
    },
    "smelling_salts": {
        "id": "smelling_salts",
        "name": "清醒",
        "type": "normal",
        "power": 70
    },
    "secret_power": {
        "id": "secret_power",
        "name": "秘密之力",
        "type": "normal",
        "power": 70
    },
    "stomp": {
        "id": "stomp",
        "name": "踩踏",
        "type": "normal",
        "power": 65,
        "flinch_chance": 30
    },
    "upper_hand": {
        "id": "upper_hand",
        "name": "快手還擊",
        "type": "fighting",
        "power": 65,
        "priority": 3
    },
    "mach_punch": {
        "id": "mach_punch",
        "name": "音速拳",
        "type": "fighting",
        "power": 40,
        "priority": 1
    },
    "vacuum_wave": {
        "id": "vacuum_wave",
        "name": "真空波",
        "type": "fighting",
        "power": 40,
        "priority": 1
    },
    "focus_punch": {
        "id": "focus_punch",
        "name": "真氣拳",
        "type": "fighting",
        "power": 150,
        "priority": -3
    },
    "meteor_assault": {
        "id": "meteor_assault",
        "name": "流星突擊",
        "type": "fighting",
        "power": 150
    },
    "high_jump_kick": {
        "id": "high_jump_kick",
        "name": "飛膝踢",
        "type": "fighting",
        "power": 130
    },
    "superpower": {
        "id": "superpower",
        "name": "蠻力",
        "type": "fighting",
        "power": 120,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            },
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "close_combat": {
        "id": "close_combat",
        "name": "近身戰",
        "type": "fighting",
        "power": 120,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            },
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "focus_blast": {
        "id": "focus_blast",
        "name": "真氣彈",
        "type": "fighting",
        "power": 120,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "axe_kick": {
        "id": "axe_kick",
        "name": "下壓踢",
        "type": "fighting",
        "power": 120
    },
    "jump_kick": {
        "id": "jump_kick",
        "name": "飛踢",
        "type": "fighting",
        "power": 100
    },
    "dynamic_punch": {
        "id": "dynamic_punch",
        "name": "爆裂拳",
        "type": "fighting",
        "power": 100,
        "ailment": "confusion",
        "ailment_chance": 100
    },
    "cross_chop": {
        "id": "cross_chop",
        "name": "十字劈",
        "type": "fighting",
        "power": 100
    },
    "hammer_arm": {
        "id": "hammer_arm",
        "name": "臂錘",
        "type": "fighting",
        "power": 100,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "flying_press": {
        "id": "flying_press",
        "name": "飛身重壓",
        "type": "fighting",
        "power": 100
    },
    "no_retreat": {
        "id": "no_retreat",
        "name": "背水一戰",
        "type": "fighting",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "collision_course": {
        "id": "collision_course",
        "name": "全开猛撞",
        "type": "fighting",
        "power": 100
    },
    "combat_torque": {
        "id": "combat_torque",
        "name": "格斗暴冲",
        "type": "fighting",
        "power": 100
    },
    "sacred_sword": {
        "id": "sacred_sword",
        "name": "聖劍",
        "type": "fighting",
        "power": 90
    },
    "thunderous_kick": {
        "id": "thunderous_kick",
        "name": "雷鳴蹴擊",
        "type": "fighting",
        "power": 90,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "triple_arrows": {
        "id": "triple_arrows",
        "name": "三连箭",
        "type": "fighting",
        "power": 90
    },
    "sky_uppercut": {
        "id": "sky_uppercut",
        "name": "衝天拳",
        "type": "fighting",
        "power": 85
    },
    "secret_sword": {
        "id": "secret_sword",
        "name": "神秘之劍",
        "type": "fighting",
        "power": 85
    },
    "submission": {
        "id": "submission",
        "name": "地獄翻滾",
        "type": "fighting",
        "power": 80,
        "recoil": 0.25
    },
    "aura_sphere": {
        "id": "aura_sphere",
        "name": "波導彈",
        "type": "fighting",
        "power": 80
    },
    "body_press": {
        "id": "body_press",
        "name": "撲擊",
        "type": "fighting",
        "power": 80
    },
    "brick_break": {
        "id": "brick_break",
        "name": "劈瓦",
        "type": "fighting",
        "power": 75
    },
    "drain_punch": {
        "id": "drain_punch",
        "name": "吸取拳",
        "type": "fighting",
        "power": 75,
        "drain": 0.5
    },
    "vital_throw": {
        "id": "vital_throw",
        "name": "借力摔",
        "type": "fighting",
        "power": 70,
        "priority": -1
    },
    "wake_up_slap": {
        "id": "wake_up_slap",
        "name": "喚醒巴掌",
        "type": "fighting",
        "power": 70
    },
    "low_sweep": {
        "id": "low_sweep",
        "name": "下盤踢",
        "type": "fighting",
        "power": 65,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "rolling_kick": {
        "id": "rolling_kick",
        "name": "迴旋踢",
        "type": "fighting",
        "power": 60,
        "flinch_chance": 30
    },
    "revenge": {
        "id": "revenge",
        "name": "報復",
        "type": "fighting",
        "power": 60,
        "priority": -4
    },
    "force_palm": {
        "id": "force_palm",
        "name": "發勁",
        "type": "fighting",
        "power": 60,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "storm_throw": {
        "id": "storm_throw",
        "name": "山嵐摔",
        "type": "fighting",
        "power": 60
    },
    "circle_throw": {
        "id": "circle_throw",
        "name": "巴投",
        "type": "fighting",
        "power": 60,
        "priority": -6
    },
    "karate_chop": {
        "id": "karate_chop",
        "name": "空手劈",
        "type": "fighting",
        "power": 50
    },
    "rock_smash": {
        "id": "rock_smash",
        "name": "碎岩",
        "type": "fighting",
        "power": 40,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 50,
        "stat_target": "enemy"
    },
    "power_up_punch": {
        "id": "power_up_punch",
        "name": "增強拳",
        "type": "fighting",
        "power": 40,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "sky_attack": {
        "id": "sky_attack",
        "name": "神鳥猛擊",
        "type": "flying",
        "power": 140,
        "flinch_chance": 30
    },
    "brave_bird": {
        "id": "brave_bird",
        "name": "勇鳥猛攻",
        "type": "flying",
        "power": 120,
        "recoil": 0.33
    },
    "dragon_ascent": {
        "id": "dragon_ascent",
        "name": "畫龍點睛",
        "type": "flying",
        "power": 120,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            },
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "hurricane": {
        "id": "hurricane",
        "name": "暴風",
        "type": "flying",
        "power": 110,
        "ailment": "confusion",
        "ailment_chance": 30
    },
    "aeroblast": {
        "id": "aeroblast",
        "name": "氣旋攻擊",
        "type": "flying",
        "power": 100
    },
    "beak_blast": {
        "id": "beak_blast",
        "name": "鳥嘴加農炮",
        "type": "flying",
        "power": 100,
        "priority": -3
    },
    "bleakwind_storm": {
        "id": "bleakwind_storm",
        "name": "枯葉風暴",
        "type": "flying",
        "power": 100
    },
    "fly": {
        "id": "fly",
        "name": "飛翔",
        "type": "flying",
        "power": 90
    },
    "floaty_fall": {
        "id": "floaty_fall",
        "name": "飄飄墜落",
        "type": "flying",
        "power": 90,
        "flinch_chance": 30
    },
    "bounce": {
        "id": "bounce",
        "name": "彈跳",
        "type": "flying",
        "power": 85,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "drill_peck": {
        "id": "drill_peck",
        "name": "啄鑽",
        "type": "flying",
        "power": 80
    },
    "oblivion_wing": {
        "id": "oblivion_wing",
        "name": "死亡之翼",
        "type": "flying",
        "power": 80,
        "drain": 0.75
    },
    "air_slash": {
        "id": "air_slash",
        "name": "空氣斬",
        "type": "flying",
        "power": 75,
        "flinch_chance": 30
    },
    "chatter": {
        "id": "chatter",
        "name": "喋喋不休",
        "type": "flying",
        "power": 65,
        "ailment": "confusion",
        "ailment_chance": 100
    },
    "wing_attack": {
        "id": "wing_attack",
        "name": "翅膀攻擊",
        "type": "flying",
        "power": 60
    },
    "air_cutter": {
        "id": "air_cutter",
        "name": "空氣利刃",
        "type": "flying",
        "power": 60
    },
    "aerial_ace": {
        "id": "aerial_ace",
        "name": "燕返",
        "type": "flying",
        "power": 60
    },
    "pluck": {
        "id": "pluck",
        "name": "啄食",
        "type": "flying",
        "power": 60
    },
    "sky_drop": {
        "id": "sky_drop",
        "name": "自由落體",
        "type": "flying",
        "power": 60
    },
    "acrobatics": {
        "id": "acrobatics",
        "name": "雜技",
        "type": "flying",
        "power": 55
    },
    "gust": {
        "id": "gust",
        "name": "起風",
        "type": "flying",
        "power": 40
    },
    "dual_wingbeat": {
        "id": "dual_wingbeat",
        "name": "雙翼",
        "type": "flying",
        "power": 40
    },
    "peck": {
        "id": "peck",
        "name": "啄",
        "type": "flying",
        "power": 35
    },
    "gunk_shot": {
        "id": "gunk_shot",
        "name": "垃圾射擊",
        "type": "poison",
        "power": 120,
        "ailment": "poison",
        "ailment_chance": 30
    },
    "belch": {
        "id": "belch",
        "name": "打嗝",
        "type": "poison",
        "power": 120
    },
    "acid_armor": {
        "id": "acid_armor",
        "name": "溶化",
        "type": "poison",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "coil": {
        "id": "coil",
        "name": "盤蜷",
        "type": "poison",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "noxious_torque": {
        "id": "noxious_torque",
        "name": "劇毒暴衝",
        "type": "poison",
        "power": 100
    },
    "malignant_chain": {
        "id": "malignant_chain",
        "name": "邪毒鎖鏈",
        "type": "poison",
        "power": 100
    },
    "sludge_wave": {
        "id": "sludge_wave",
        "name": "污泥波",
        "type": "poison",
        "power": 95,
        "ailment": "poison",
        "ailment_chance": 10
    },
    "sludge_bomb": {
        "id": "sludge_bomb",
        "name": "污泥炸彈",
        "type": "poison",
        "power": 90,
        "ailment": "poison",
        "ailment_chance": 30
    },
    "shell_side_arm": {
        "id": "shell_side_arm",
        "name": "臂貝武器",
        "type": "poison",
        "power": 90,
        "ailment": "poison",
        "ailment_chance": 20
    },
    "poison_jab": {
        "id": "poison_jab",
        "name": "毒擊",
        "type": "poison",
        "power": 80,
        "ailment": "poison",
        "ailment_chance": 30
    },
    "dire_claw": {
        "id": "dire_claw",
        "name": "克命爪",
        "type": "poison",
        "power": 80
    },
    "cross_poison": {
        "id": "cross_poison",
        "name": "十字毒刃",
        "type": "poison",
        "power": 70,
        "ailment": "poison",
        "ailment_chance": 10
    },
    "sludge": {
        "id": "sludge",
        "name": "污泥攻擊",
        "type": "poison",
        "power": 65,
        "ailment": "poison",
        "ailment_chance": 30
    },
    "venoshock": {
        "id": "venoshock",
        "name": "毒液衝擊",
        "type": "poison",
        "power": 65
    },
    "barb_barrage": {
        "id": "barb_barrage",
        "name": "毒千針",
        "type": "poison",
        "power": 60
    },
    "poison_fang": {
        "id": "poison_fang",
        "name": "劇毒牙",
        "type": "poison",
        "power": 50,
        "ailment": "poison",
        "ailment_chance": 50
    },
    "poison_tail": {
        "id": "poison_tail",
        "name": "毒尾",
        "type": "poison",
        "power": 50,
        "ailment": "poison",
        "ailment_chance": 10
    },
    "clear_smog": {
        "id": "clear_smog",
        "name": "清除之煙",
        "type": "poison",
        "power": 50
    },
    "acid": {
        "id": "acid",
        "name": "溶解液",
        "type": "poison",
        "power": 40,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "acid_spray": {
        "id": "acid_spray",
        "name": "酸液炸彈",
        "type": "poison",
        "power": 40,
        "stat_changes": [
            {
                "stat": "def",
                "change": -2
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "smog": {
        "id": "smog",
        "name": "濁霧",
        "type": "poison",
        "power": 30,
        "ailment": "poison",
        "ailment_chance": 40
    },
    "mortal_spin": {
        "id": "mortal_spin",
        "name": "晶光转转",
        "type": "poison",
        "power": 30
    },
    "poison_sting": {
        "id": "poison_sting",
        "name": "毒針",
        "type": "poison",
        "power": 15,
        "ailment": "poison",
        "ailment_chance": 30
    },
    "precipice_blades": {
        "id": "precipice_blades",
        "name": "斷崖之劍",
        "type": "ground",
        "power": 120
    },
    "headlong_rush": {
        "id": "headlong_rush",
        "name": "突飛猛撲",
        "type": "ground",
        "power": 120
    },
    "earthquake": {
        "id": "earthquake",
        "name": "地震",
        "type": "ground",
        "power": 100
    },
    "sandsear_storm": {
        "id": "sandsear_storm",
        "name": "熱沙風暴",
        "type": "ground",
        "power": 100
    },
    "high_horsepower": {
        "id": "high_horsepower",
        "name": "十萬馬力",
        "type": "ground",
        "power": 95
    },
    "earth_power": {
        "id": "earth_power",
        "name": "大地之力",
        "type": "ground",
        "power": 90,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "thousand_arrows": {
        "id": "thousand_arrows",
        "name": "千箭齊發",
        "type": "ground",
        "power": 90
    },
    "thousand_waves": {
        "id": "thousand_waves",
        "name": "千波激盪",
        "type": "ground",
        "power": 90
    },
    "lands_wrath": {
        "id": "lands_wrath",
        "name": "大地神力",
        "type": "ground",
        "power": 90
    },
    "dig": {
        "id": "dig",
        "name": "挖洞",
        "type": "ground",
        "power": 80
    },
    "drill_run": {
        "id": "drill_run",
        "name": "直衝鑽",
        "type": "ground",
        "power": 80
    },
    "stomping_tantrum": {
        "id": "stomping_tantrum",
        "name": "跺腳",
        "type": "ground",
        "power": 75
    },
    "scorching_sands": {
        "id": "scorching_sands",
        "name": "熱沙大地",
        "type": "ground",
        "power": 70,
        "ailment": "burn",
        "ailment_chance": 30
    },
    "bone_club": {
        "id": "bone_club",
        "name": "骨棒",
        "type": "ground",
        "power": 65,
        "flinch_chance": 10
    },
    "mud_bomb": {
        "id": "mud_bomb",
        "name": "泥巴炸彈",
        "type": "ground",
        "power": 65
    },
    "bulldoze": {
        "id": "bulldoze",
        "name": "重踏",
        "type": "ground",
        "power": 60,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "mud_shot": {
        "id": "mud_shot",
        "name": "泥巴射擊",
        "type": "ground",
        "power": 55,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "bonemerang": {
        "id": "bonemerang",
        "name": "骨頭回力鏢",
        "type": "ground",
        "power": 50
    },
    "sand_tomb": {
        "id": "sand_tomb",
        "name": "流沙地獄",
        "type": "ground",
        "power": 35,
        "ailment": "trap",
        "ailment_chance": 100
    },
    "bone_rush": {
        "id": "bone_rush",
        "name": "骨棒亂打",
        "type": "ground",
        "power": 25
    },
    "mud_slap": {
        "id": "mud_slap",
        "name": "擲泥",
        "type": "ground",
        "power": 20
    },
    "accelerock": {
        "id": "accelerock",
        "name": "衝岩",
        "type": "rock",
        "power": 40,
        "priority": 1
    },
    "rock_wrecker": {
        "id": "rock_wrecker",
        "name": "岩石炮",
        "type": "rock",
        "power": 150
    },
    "head_smash": {
        "id": "head_smash",
        "name": "雙刃頭錘",
        "type": "rock",
        "power": 150
    },
    "meteor_beam": {
        "id": "meteor_beam",
        "name": "流星光束",
        "type": "rock",
        "power": 120
    },
    "rock_polish": {
        "id": "rock_polish",
        "name": "岩石打磨",
        "type": "rock",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "stone_edge": {
        "id": "stone_edge",
        "name": "尖石攻擊",
        "type": "rock",
        "power": 100
    },
    "diamond_storm": {
        "id": "diamond_storm",
        "name": "鑽石風暴",
        "type": "rock",
        "power": 100,
        "stat_changes": [
            {
                "stat": "def",
                "change": 2
            }
        ],
        "stat_chance": 50,
        "stat_target": "enemy"
    },
    "mighty_cleave": {
        "id": "mighty_cleave",
        "name": "強刃攻擊",
        "type": "rock",
        "power": 95
    },
    "power_gem": {
        "id": "power_gem",
        "name": "力量寶石",
        "type": "rock",
        "power": 80
    },
    "rock_slide": {
        "id": "rock_slide",
        "name": "岩崩",
        "type": "rock",
        "power": 75,
        "flinch_chance": 30
    },
    "stone_axe": {
        "id": "stone_axe",
        "name": "岩斧",
        "type": "rock",
        "power": 65
    },
    "ancient_power": {
        "id": "ancient_power",
        "name": "原始之力",
        "type": "rock",
        "power": 60,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "rock_tomb": {
        "id": "rock_tomb",
        "name": "岩石封鎖",
        "type": "rock",
        "power": 60,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "rock_throw": {
        "id": "rock_throw",
        "name": "落石",
        "type": "rock",
        "power": 50
    },
    "smack_down": {
        "id": "smack_down",
        "name": "擊落",
        "type": "rock",
        "power": 50
    },
    "salt_cure": {
        "id": "salt_cure",
        "name": "鹽醃",
        "type": "rock",
        "power": 40
    },
    "rollout": {
        "id": "rollout",
        "name": "滾動",
        "type": "rock",
        "power": 30
    },
    "rock_blast": {
        "id": "rock_blast",
        "name": "岩石爆擊",
        "type": "rock",
        "power": 25
    },
    "first_impression": {
        "id": "first_impression",
        "name": "迎頭一擊",
        "type": "bug",
        "power": 90,
        "priority": 2
    },
    "megahorn": {
        "id": "megahorn",
        "name": "超級角擊",
        "type": "bug",
        "power": 120
    },
    "tail_glow": {
        "id": "tail_glow",
        "name": "螢火",
        "type": "bug",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 3
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "defend_order": {
        "id": "defend_order",
        "name": "防禦指令",
        "type": "bug",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "quiver_dance": {
        "id": "quiver_dance",
        "name": "蝶舞",
        "type": "bug",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "bug_buzz": {
        "id": "bug_buzz",
        "name": "蟲鳴",
        "type": "bug",
        "power": 90,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "attack_order": {
        "id": "attack_order",
        "name": "攻擊指令",
        "type": "bug",
        "power": 90
    },
    "pollen_puff": {
        "id": "pollen_puff",
        "name": "花粉團",
        "type": "bug",
        "power": 90
    },
    "leech_life": {
        "id": "leech_life",
        "name": "吸血",
        "type": "bug",
        "power": 80,
        "drain": 0.5
    },
    "x_scissor": {
        "id": "x_scissor",
        "name": "十字剪",
        "type": "bug",
        "power": 80
    },
    "lunge": {
        "id": "lunge",
        "name": "猛撲",
        "type": "bug",
        "power": 80,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "signal_beam": {
        "id": "signal_beam",
        "name": "信號光束",
        "type": "bug",
        "power": 75,
        "ailment": "confusion",
        "ailment_chance": 10
    },
    "u_turn": {
        "id": "u_turn",
        "name": "急速折返",
        "type": "bug",
        "power": 70
    },
    "skitter_smack": {
        "id": "skitter_smack",
        "name": "爬擊",
        "type": "bug",
        "power": 70,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "steamroller": {
        "id": "steamroller",
        "name": "瘋狂滾壓",
        "type": "bug",
        "power": 65,
        "flinch_chance": 30
    },
    "silver_wind": {
        "id": "silver_wind",
        "name": "銀色旋風",
        "type": "bug",
        "power": 60,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "bug_bite": {
        "id": "bug_bite",
        "name": "蟲咬",
        "type": "bug",
        "power": 60
    },
    "struggle_bug": {
        "id": "struggle_bug",
        "name": "蟲之抵抗",
        "type": "bug",
        "power": 50,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "fell_stinger": {
        "id": "fell_stinger",
        "name": "致命針刺",
        "type": "bug",
        "power": 50
    },
    "pounce": {
        "id": "pounce",
        "name": "虫扑",
        "type": "bug",
        "power": 50,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "fury_cutter": {
        "id": "fury_cutter",
        "name": "連斬",
        "type": "bug",
        "power": 40
    },
    "twineedle": {
        "id": "twineedle",
        "name": "雙針",
        "type": "bug",
        "power": 25,
        "ailment": "poison",
        "ailment_chance": 20
    },
    "pin_missile": {
        "id": "pin_missile",
        "name": "飛彈針",
        "type": "bug",
        "power": 25
    },
    "infestation": {
        "id": "infestation",
        "name": "死纏爛打",
        "type": "bug",
        "power": 20,
        "ailment": "trap",
        "ailment_chance": 100
    },
    "shadow_sneak": {
        "id": "shadow_sneak",
        "name": "影子偷襲",
        "type": "ghost",
        "power": 40,
        "priority": 1
    },
    "shadow_force": {
        "id": "shadow_force",
        "name": "暗影潛襲",
        "type": "ghost",
        "power": 120
    },
    "astral_barrage": {
        "id": "astral_barrage",
        "name": "星碎",
        "type": "ghost",
        "power": 120
    },
    "poltergeist": {
        "id": "poltergeist",
        "name": "靈騷",
        "type": "ghost",
        "power": 110
    },
    "moongeist_beam": {
        "id": "moongeist_beam",
        "name": "暗影之光",
        "type": "ghost",
        "power": 100
    },
    "phantom_force": {
        "id": "phantom_force",
        "name": "潛靈奇襲",
        "type": "ghost",
        "power": 90
    },
    "spectral_thief": {
        "id": "spectral_thief",
        "name": "暗影偷盜",
        "type": "ghost",
        "power": 90
    },
    "shadow_bone": {
        "id": "shadow_bone",
        "name": "暗影之骨",
        "type": "ghost",
        "power": 85,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 20,
        "stat_target": "enemy"
    },
    "shadow_ball": {
        "id": "shadow_ball",
        "name": "暗影球",
        "type": "ghost",
        "power": 80,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 20,
        "stat_target": "enemy"
    },
    "spirit_shackle": {
        "id": "spirit_shackle",
        "name": "縫影",
        "type": "ghost",
        "power": 80
    },
    "bitter_malice": {
        "id": "bitter_malice",
        "name": "冤冤相報",
        "type": "ghost",
        "power": 75
    },
    "shadow_claw": {
        "id": "shadow_claw",
        "name": "暗影爪",
        "type": "ghost",
        "power": 70
    },
    "hex": {
        "id": "hex",
        "name": "禍不單行",
        "type": "ghost",
        "power": 65
    },
    "shadow_punch": {
        "id": "shadow_punch",
        "name": "暗影拳",
        "type": "ghost",
        "power": 60
    },
    "ominous_wind": {
        "id": "ominous_wind",
        "name": "奇異之風",
        "type": "ghost",
        "power": 60,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "infernal_parade": {
        "id": "infernal_parade",
        "name": "群魔乱舞",
        "type": "ghost",
        "power": 60
    },
    "last_respects": {
        "id": "last_respects",
        "name": "扫墓",
        "type": "ghost",
        "power": 50
    },
    "rage_fist": {
        "id": "rage_fist",
        "name": "愤怒之拳",
        "type": "ghost",
        "power": 50
    },
    "astonish": {
        "id": "astonish",
        "name": "驚嚇",
        "type": "ghost",
        "power": 30,
        "flinch_chance": 30
    },
    "bullet_punch": {
        "id": "bullet_punch",
        "name": "子彈拳",
        "type": "steel",
        "power": 40,
        "priority": 1
    },
    "gigaton_hammer": {
        "id": "gigaton_hammer",
        "name": "巨力錘",
        "type": "steel",
        "power": 160
    },
    "doom_desire": {
        "id": "doom_desire",
        "name": "破滅之願",
        "type": "steel",
        "power": 140
    },
    "steel_beam": {
        "id": "steel_beam",
        "name": "鐵蹄光線",
        "type": "steel",
        "power": 140
    },
    "steel_roller": {
        "id": "steel_roller",
        "name": "鐵滾輪",
        "type": "steel",
        "power": 130
    },
    "make_it_rain": {
        "id": "make_it_rain",
        "name": "淘金潮",
        "type": "steel",
        "power": 120,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "iron_tail": {
        "id": "iron_tail",
        "name": "鐵尾",
        "type": "steel",
        "power": 100,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 30,
        "stat_target": "enemy"
    },
    "autotomize": {
        "id": "autotomize",
        "name": "身體輕量化",
        "type": "steel",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "shift_gear": {
        "id": "shift_gear",
        "name": "換檔",
        "type": "steel",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "sunsteel_strike": {
        "id": "sunsteel_strike",
        "name": "流星閃衝",
        "type": "steel",
        "power": 100
    },
    "behemoth_blade": {
        "id": "behemoth_blade",
        "name": "巨獸斬",
        "type": "steel",
        "power": 100
    },
    "behemoth_bash": {
        "id": "behemoth_bash",
        "name": "巨獸彈",
        "type": "steel",
        "power": 100
    },
    "spin_out": {
        "id": "spin_out",
        "name": "疾速轉輪",
        "type": "steel",
        "power": 100,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -2
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "meteor_mash": {
        "id": "meteor_mash",
        "name": "彗星拳",
        "type": "steel",
        "power": 90,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            }
        ],
        "stat_chance": 20,
        "stat_target": "enemy"
    },
    "flash_cannon": {
        "id": "flash_cannon",
        "name": "加農光炮",
        "type": "steel",
        "power": 80,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "iron_head": {
        "id": "iron_head",
        "name": "鐵頭",
        "type": "steel",
        "power": 80,
        "flinch_chance": 30
    },
    "anchor_shot": {
        "id": "anchor_shot",
        "name": "擲錨",
        "type": "steel",
        "power": 80
    },
    "steel_wing": {
        "id": "steel_wing",
        "name": "鋼翼",
        "type": "steel",
        "power": 70,
        "stat_changes": [
            {
                "stat": "def",
                "change": 1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "smart_strike": {
        "id": "smart_strike",
        "name": "修長之角",
        "type": "steel",
        "power": 70
    },
    "mirror_shot": {
        "id": "mirror_shot",
        "name": "鏡光射擊",
        "type": "steel",
        "power": 65
    },
    "magnet_bomb": {
        "id": "magnet_bomb",
        "name": "磁鐵炸彈",
        "type": "steel",
        "power": 60
    },
    "double_iron_bash": {
        "id": "double_iron_bash",
        "name": "鋼拳雙擊",
        "type": "steel",
        "power": 60,
        "flinch_chance": 30
    },
    "metal_claw": {
        "id": "metal_claw",
        "name": "金屬爪",
        "type": "steel",
        "power": 50,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "gear_grind": {
        "id": "gear_grind",
        "name": "齒輪飛盤",
        "type": "steel",
        "power": 50
    },
    "tachyon_cutter": {
        "id": "tachyon_cutter",
        "name": "迅子利刃",
        "type": "steel",
        "power": 50
    },
    "eruption": {
        "id": "eruption",
        "name": "噴火",
        "type": "fire",
        "power": 150
    },
    "blast_burn": {
        "id": "blast_burn",
        "name": "爆炸烈焰",
        "type": "fire",
        "power": 150
    },
    "shell_trap": {
        "id": "shell_trap",
        "name": "陷阱甲殼",
        "type": "fire",
        "power": 150,
        "priority": -3
    },
    "mind_blown": {
        "id": "mind_blown",
        "name": "驚爆大頭",
        "type": "fire",
        "power": 150
    },
    "overheat": {
        "id": "overheat",
        "name": "過熱",
        "type": "fire",
        "power": 130,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -2
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "blue_flare": {
        "id": "blue_flare",
        "name": "青焰",
        "type": "fire",
        "power": 130,
        "ailment": "burn",
        "ailment_chance": 20
    },
    "burn_up": {
        "id": "burn_up",
        "name": "燃盡",
        "type": "fire",
        "power": 130
    },
    "flare_blitz": {
        "id": "flare_blitz",
        "name": "閃焰衝鋒",
        "type": "fire",
        "power": 120,
        "recoil": 0.33,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "pyro_ball": {
        "id": "pyro_ball",
        "name": "火焰球",
        "type": "fire",
        "power": 120,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "raging_fury": {
        "id": "raging_fury",
        "name": "大愤慨",
        "type": "fire",
        "power": 120
    },
    "armor_cannon": {
        "id": "armor_cannon",
        "name": "铠农炮",
        "type": "fire",
        "power": 120,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            },
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "fire_blast": {
        "id": "fire_blast",
        "name": "大字爆炎",
        "type": "fire",
        "power": 110,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "sacred_fire": {
        "id": "sacred_fire",
        "name": "神聖之火",
        "type": "fire",
        "power": 100,
        "ailment": "burn",
        "ailment_chance": 50
    },
    "magma_storm": {
        "id": "magma_storm",
        "name": "熔岩風暴",
        "type": "fire",
        "power": 100,
        "ailment": "trap",
        "ailment_chance": 100
    },
    "inferno": {
        "id": "inferno",
        "name": "煉獄",
        "type": "fire",
        "power": 100,
        "ailment": "burn",
        "ailment_chance": 100
    },
    "searing_shot": {
        "id": "searing_shot",
        "name": "火焰彈",
        "type": "fire",
        "power": 100,
        "ailment": "burn",
        "ailment_chance": 30
    },
    "fusion_flare": {
        "id": "fusion_flare",
        "name": "交錯火焰",
        "type": "fire",
        "power": 100
    },
    "heat_wave": {
        "id": "heat_wave",
        "name": "熱風",
        "type": "fire",
        "power": 95,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "flamethrower": {
        "id": "flamethrower",
        "name": "噴射火焰",
        "type": "fire",
        "power": 90,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "bitter_blade": {
        "id": "bitter_blade",
        "name": "悔念剑",
        "type": "fire",
        "power": 90,
        "drain": 0.5
    },
    "blaze_kick": {
        "id": "blaze_kick",
        "name": "火焰踢",
        "type": "fire",
        "power": 85,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "lava_plume": {
        "id": "lava_plume",
        "name": "噴煙",
        "type": "fire",
        "power": 80,
        "ailment": "burn",
        "ailment_chance": 30
    },
    "fire_pledge": {
        "id": "fire_pledge",
        "name": "火之誓約",
        "type": "fire",
        "power": 80
    },
    "fiery_dance": {
        "id": "fiery_dance",
        "name": "火之舞",
        "type": "fire",
        "power": 80,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            }
        ],
        "stat_chance": 50,
        "stat_target": "enemy"
    },
    "fire_lash": {
        "id": "fire_lash",
        "name": "火焰鞭",
        "type": "fire",
        "power": 80,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "torch_song": {
        "id": "torch_song",
        "name": "闪焰高歌",
        "type": "fire",
        "power": 80,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "blazing_torque": {
        "id": "blazing_torque",
        "name": "灼热暴冲",
        "type": "fire",
        "power": 80
    },
    "fire_punch": {
        "id": "fire_punch",
        "name": "火焰拳",
        "type": "fire",
        "power": 75,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "mystical_fire": {
        "id": "mystical_fire",
        "name": "魔法火焰",
        "type": "fire",
        "power": 75,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "temper_flare": {
        "id": "temper_flare",
        "name": "豁出去",
        "type": "fire",
        "power": 75
    },
    "flame_burst": {
        "id": "flame_burst",
        "name": "烈焰濺射",
        "type": "fire",
        "power": 70
    },
    "burning_jealousy": {
        "id": "burning_jealousy",
        "name": "妒火",
        "type": "fire",
        "power": 70,
        "ailment": "burn",
        "ailment_chance": 100
    },
    "fire_fang": {
        "id": "fire_fang",
        "name": "火焰牙",
        "type": "fire",
        "power": 65,
        "ailment": "burn",
        "ailment_chance": 10,
        "flinch_chance": 10
    },
    "flame_wheel": {
        "id": "flame_wheel",
        "name": "火焰輪",
        "type": "fire",
        "power": 60,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "incinerate": {
        "id": "incinerate",
        "name": "燒盡",
        "type": "fire",
        "power": 60
    },
    "sizzly_slide": {
        "id": "sizzly_slide",
        "name": "熊熊火爆",
        "type": "fire",
        "power": 60,
        "ailment": "burn",
        "ailment_chance": 100
    },
    "flame_charge": {
        "id": "flame_charge",
        "name": "蓄能焰襲",
        "type": "fire",
        "power": 50,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "fire_spin": {
        "id": "fire_spin",
        "name": "火焰旋渦",
        "type": "fire",
        "power": 35,
        "ailment": "trap",
        "ailment_chance": 100
    },
    "jet_punch": {
        "id": "jet_punch",
        "name": "喷射拳",
        "type": "water",
        "power": 60,
        "priority": 1
    },
    "aqua_jet": {
        "id": "aqua_jet",
        "name": "水流噴射",
        "type": "water",
        "power": 40,
        "priority": 1
    },
    "water_shuriken": {
        "id": "water_shuriken",
        "name": "飛水手裡劍",
        "type": "water",
        "power": 15,
        "priority": 1
    },
    "hydro_cannon": {
        "id": "hydro_cannon",
        "name": "加農水砲",
        "type": "water",
        "power": 150
    },
    "water_spout": {
        "id": "water_spout",
        "name": "噴水",
        "type": "water",
        "power": 150
    },
    "wave_crash": {
        "id": "wave_crash",
        "name": "波動冲",
        "type": "water",
        "power": 120
    },
    "hydro_pump": {
        "id": "hydro_pump",
        "name": "水砲",
        "type": "water",
        "power": 110
    },
    "steam_eruption": {
        "id": "steam_eruption",
        "name": "蒸汽爆炸",
        "type": "water",
        "power": 110,
        "ailment": "burn",
        "ailment_chance": 30
    },
    "origin_pulse": {
        "id": "origin_pulse",
        "name": "根源波動",
        "type": "water",
        "power": 110
    },
    "withdraw": {
        "id": "withdraw",
        "name": "縮入殼中",
        "type": "water",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "crabhammer": {
        "id": "crabhammer",
        "name": "蟹鉗錘",
        "type": "water",
        "power": 100
    },
    "surf": {
        "id": "surf",
        "name": "衝浪",
        "type": "water",
        "power": 90
    },
    "muddy_water": {
        "id": "muddy_water",
        "name": "濁流",
        "type": "water",
        "power": 90
    },
    "aqua_tail": {
        "id": "aqua_tail",
        "name": "水流尾",
        "type": "water",
        "power": 90
    },
    "sparkling_aria": {
        "id": "sparkling_aria",
        "name": "泡影的詠歎調",
        "type": "water",
        "power": 90
    },
    "splishy_splash": {
        "id": "splishy_splash",
        "name": "滔滔衝浪",
        "type": "water",
        "power": 90,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "liquidation": {
        "id": "liquidation",
        "name": "水流裂破",
        "type": "water",
        "power": 85,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 20,
        "stat_target": "enemy"
    },
    "fishious_rend": {
        "id": "fishious_rend",
        "name": "鰓咬",
        "type": "water",
        "power": 85
    },
    "waterfall": {
        "id": "waterfall",
        "name": "攀瀑",
        "type": "water",
        "power": 80,
        "flinch_chance": 20
    },
    "dive": {
        "id": "dive",
        "name": "潛水",
        "type": "water",
        "power": 80
    },
    "scald": {
        "id": "scald",
        "name": "熱水",
        "type": "water",
        "power": 80,
        "ailment": "burn",
        "ailment_chance": 30
    },
    "water_pledge": {
        "id": "water_pledge",
        "name": "水之誓約",
        "type": "water",
        "power": 80
    },
    "snipe_shot": {
        "id": "snipe_shot",
        "name": "狙擊",
        "type": "water",
        "power": 80
    },
    "aqua_step": {
        "id": "aqua_step",
        "name": "流水旋舞",
        "type": "water",
        "power": 80,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "hydro_steam": {
        "id": "hydro_steam",
        "name": "水蒸氣",
        "type": "water",
        "power": 80
    },
    "razor_shell": {
        "id": "razor_shell",
        "name": "貝殼刃",
        "type": "water",
        "power": 75,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 50,
        "stat_target": "enemy"
    },
    "aqua_cutter": {
        "id": "aqua_cutter",
        "name": "水波刀",
        "type": "water",
        "power": 70
    },
    "bubble_beam": {
        "id": "bubble_beam",
        "name": "泡沫光線",
        "type": "water",
        "power": 65,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "octazooka": {
        "id": "octazooka",
        "name": "章魚桶炮",
        "type": "water",
        "power": 65
    },
    "brine": {
        "id": "brine",
        "name": "鹽水",
        "type": "water",
        "power": 65
    },
    "water_pulse": {
        "id": "water_pulse",
        "name": "水之波動",
        "type": "water",
        "power": 60,
        "ailment": "confusion",
        "ailment_chance": 20
    },
    "bouncy_bubble": {
        "id": "bouncy_bubble",
        "name": "活活氣泡",
        "type": "water",
        "power": 60
    },
    "flip_turn": {
        "id": "flip_turn",
        "name": "快速折返",
        "type": "water",
        "power": 60
    },
    "chilling_water": {
        "id": "chilling_water",
        "name": "泼冷水",
        "type": "water",
        "power": 50,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "bubble": {
        "id": "bubble",
        "name": "泡沫",
        "type": "water",
        "power": 40,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "clamp": {
        "id": "clamp",
        "name": "貝殼夾擊",
        "type": "water",
        "power": 35,
        "ailment": "trap",
        "ailment_chance": 100
    },
    "whirlpool": {
        "id": "whirlpool",
        "name": "潮旋",
        "type": "water",
        "power": 35,
        "ailment": "trap",
        "ailment_chance": 100
    },
    "triple_dive": {
        "id": "triple_dive",
        "name": "三连钻",
        "type": "water",
        "power": 30
    },
    "surging_strikes": {
        "id": "surging_strikes",
        "name": "水流連打",
        "type": "water",
        "power": 25
    },
    "frenzy_plant": {
        "id": "frenzy_plant",
        "name": "瘋狂植物",
        "type": "grass",
        "power": 150
    },
    "chloroblast": {
        "id": "chloroblast",
        "name": "葉绿爆震",
        "type": "grass",
        "power": 150
    },
    "leaf_storm": {
        "id": "leaf_storm",
        "name": "飛葉風暴",
        "type": "grass",
        "power": 130,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -2
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "solar_blade": {
        "id": "solar_blade",
        "name": "日光刃",
        "type": "grass",
        "power": 125
    },
    "solar_beam": {
        "id": "solar_beam",
        "name": "日光束",
        "type": "grass",
        "power": 120
    },
    "petal_dance": {
        "id": "petal_dance",
        "name": "花瓣舞",
        "type": "grass",
        "power": 120
    },
    "power_whip": {
        "id": "power_whip",
        "name": "強力鞭打",
        "type": "grass",
        "power": 120
    },
    "wood_hammer": {
        "id": "wood_hammer",
        "name": "木槌",
        "type": "grass",
        "power": 120,
        "recoil": 0.33
    },
    "seed_flare": {
        "id": "seed_flare",
        "name": "種子閃光",
        "type": "grass",
        "power": 120,
        "stat_changes": [
            {
                "stat": "def",
                "change": -2
            }
        ],
        "stat_chance": 40,
        "stat_target": "enemy"
    },
    "cotton_guard": {
        "id": "cotton_guard",
        "name": "棉花防守",
        "type": "grass",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 3
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "sappy_seed": {
        "id": "sappy_seed",
        "name": "茁茁轟炸",
        "type": "grass",
        "power": 100,
        "ailment": "leech-seed",
        "ailment_chance": 100
    },
    "leaf_blade": {
        "id": "leaf_blade",
        "name": "葉刃",
        "type": "grass",
        "power": 90
    },
    "energy_ball": {
        "id": "energy_ball",
        "name": "能量球",
        "type": "grass",
        "power": 90,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "petal_blizzard": {
        "id": "petal_blizzard",
        "name": "落英繽紛",
        "type": "grass",
        "power": 90
    },
    "seed_bomb": {
        "id": "seed_bomb",
        "name": "種子炸彈",
        "type": "grass",
        "power": 80
    },
    "grass_pledge": {
        "id": "grass_pledge",
        "name": "草之誓約",
        "type": "grass",
        "power": 80
    },
    "drum_beating": {
        "id": "drum_beating",
        "name": "鼓擊",
        "type": "grass",
        "power": 80,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "apple_acid": {
        "id": "apple_acid",
        "name": "蘋果酸",
        "type": "grass",
        "power": 80,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "grav_apple": {
        "id": "grav_apple",
        "name": "萬有引力",
        "type": "grass",
        "power": 80,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "giga_drain": {
        "id": "giga_drain",
        "name": "終極吸取",
        "type": "grass",
        "power": 75,
        "drain": 0.5
    },
    "horn_leech": {
        "id": "horn_leech",
        "name": "木角",
        "type": "grass",
        "power": 75,
        "drain": 0.5
    },
    "trop_kick": {
        "id": "trop_kick",
        "name": "熱帶踢",
        "type": "grass",
        "power": 70,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "flower_trick": {
        "id": "flower_trick",
        "name": "千变万花",
        "type": "grass",
        "power": 70
    },
    "leaf_tornado": {
        "id": "leaf_tornado",
        "name": "青草攪拌器",
        "type": "grass",
        "power": 65
    },
    "needle_arm": {
        "id": "needle_arm",
        "name": "尖刺臂",
        "type": "grass",
        "power": 60,
        "flinch_chance": 30
    },
    "magical_leaf": {
        "id": "magical_leaf",
        "name": "魔法葉",
        "type": "grass",
        "power": 60
    },
    "razor_leaf": {
        "id": "razor_leaf",
        "name": "飛葉快刀",
        "type": "grass",
        "power": 55
    },
    "grassy_glide": {
        "id": "grassy_glide",
        "name": "青草滑梯",
        "type": "grass",
        "power": 55
    },
    "trailblaze": {
        "id": "trailblaze",
        "name": "起草",
        "type": "grass",
        "power": 50,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "mega_drain": {
        "id": "mega_drain",
        "name": "超級吸取",
        "type": "grass",
        "power": 40,
        "drain": 0.5
    },
    "leafage": {
        "id": "leafage",
        "name": "樹葉",
        "type": "grass",
        "power": 40
    },
    "branch_poke": {
        "id": "branch_poke",
        "name": "木枝突刺",
        "type": "grass",
        "power": 40
    },
    "snap_trap": {
        "id": "snap_trap",
        "name": "捕獸夾",
        "type": "grass",
        "power": 35,
        "ailment": "trap",
        "ailment_chance": 100
    },
    "bullet_seed": {
        "id": "bullet_seed",
        "name": "種子機關槍",
        "type": "grass",
        "power": 25
    },
    "absorb": {
        "id": "absorb",
        "name": "吸取",
        "type": "grass",
        "power": 20,
        "drain": 0.5
    },
    "zippy_zap": {
        "id": "zippy_zap",
        "name": "電電加速",
        "type": "electric",
        "power": 80,
        "priority": 2
    },
    "thunderclap": {
        "id": "thunderclap",
        "name": "迅雷",
        "type": "electric",
        "power": 70,
        "priority": 1
    },
    "bolt_strike": {
        "id": "bolt_strike",
        "name": "雷擊",
        "type": "electric",
        "power": 130,
        "ailment": "paralysis",
        "ailment_chance": 20
    },
    "electro_shot": {
        "id": "electro_shot",
        "name": "電光束",
        "type": "electric",
        "power": 130,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "zap_cannon": {
        "id": "zap_cannon",
        "name": "電磁炮",
        "type": "electric",
        "power": 120,
        "ailment": "paralysis",
        "ailment_chance": 100
    },
    "volt_tackle": {
        "id": "volt_tackle",
        "name": "伏特攻擊",
        "type": "electric",
        "power": 120,
        "recoil": 0.33,
        "ailment": "paralysis",
        "ailment_chance": 10
    },
    "double_shock": {
        "id": "double_shock",
        "name": "電光双擊",
        "type": "electric",
        "power": 120
    },
    "thunder": {
        "id": "thunder",
        "name": "打雷",
        "type": "electric",
        "power": 110,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "aura_wheel": {
        "id": "aura_wheel",
        "name": "氣場輪",
        "type": "electric",
        "power": 110,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "charge": {
        "id": "charge",
        "name": "充電",
        "type": "electric",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "fusion_bolt": {
        "id": "fusion_bolt",
        "name": "交錯閃電",
        "type": "electric",
        "power": 100
    },
    "plasma_fists": {
        "id": "plasma_fists",
        "name": "等離子閃電拳",
        "type": "electric",
        "power": 100
    },
    "wildbolt_storm": {
        "id": "wildbolt_storm",
        "name": "鸣雷風暴",
        "type": "electric",
        "power": 100
    },
    "electro_drift": {
        "id": "electro_drift",
        "name": "闪電猛冲",
        "type": "electric",
        "power": 100
    },
    "supercell_slam": {
        "id": "supercell_slam",
        "name": "閃電強襲",
        "type": "electric",
        "power": 100
    },
    "thunderbolt": {
        "id": "thunderbolt",
        "name": "十萬伏特",
        "type": "electric",
        "power": 90,
        "ailment": "paralysis",
        "ailment_chance": 10
    },
    "wild_charge": {
        "id": "wild_charge",
        "name": "瘋狂伏特",
        "type": "electric",
        "power": 90,
        "recoil": 0.25
    },
    "bolt_beak": {
        "id": "bolt_beak",
        "name": "電喙",
        "type": "electric",
        "power": 85
    },
    "discharge": {
        "id": "discharge",
        "name": "放電",
        "type": "electric",
        "power": 80,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "zing_zap": {
        "id": "zing_zap",
        "name": "麻麻刺刺",
        "type": "electric",
        "power": 80,
        "flinch_chance": 30
    },
    "overdrive": {
        "id": "overdrive",
        "name": "破音",
        "type": "electric",
        "power": 80
    },
    "thunder_cage": {
        "id": "thunder_cage",
        "name": "雷電囚籠",
        "type": "electric",
        "power": 80,
        "ailment": "trap",
        "ailment_chance": 100
    },
    "thunder_punch": {
        "id": "thunder_punch",
        "name": "雷電拳",
        "type": "electric",
        "power": 75,
        "ailment": "paralysis",
        "ailment_chance": 10
    },
    "volt_switch": {
        "id": "volt_switch",
        "name": "伏特替換",
        "type": "electric",
        "power": 70
    },
    "rising_voltage": {
        "id": "rising_voltage",
        "name": "電力上升",
        "type": "electric",
        "power": 70
    },
    "spark": {
        "id": "spark",
        "name": "電光",
        "type": "electric",
        "power": 65,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "thunder_fang": {
        "id": "thunder_fang",
        "name": "雷電牙",
        "type": "electric",
        "power": 65,
        "ailment": "paralysis",
        "ailment_chance": 10,
        "flinch_chance": 10
    },
    "parabolic_charge": {
        "id": "parabolic_charge",
        "name": "拋物面充電",
        "type": "electric",
        "power": 65,
        "drain": 0.5
    },
    "shock_wave": {
        "id": "shock_wave",
        "name": "電擊波",
        "type": "electric",
        "power": 60
    },
    "buzzy_buzz": {
        "id": "buzzy_buzz",
        "name": "麻麻電擊",
        "type": "electric",
        "power": 60,
        "ailment": "paralysis",
        "ailment_chance": 100
    },
    "electroweb": {
        "id": "electroweb",
        "name": "電網",
        "type": "electric",
        "power": 55,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "charge_beam": {
        "id": "charge_beam",
        "name": "充電光束",
        "type": "electric",
        "power": 50,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            }
        ],
        "stat_chance": 70,
        "stat_target": "enemy"
    },
    "thunder_shock": {
        "id": "thunder_shock",
        "name": "電擊",
        "type": "electric",
        "power": 40,
        "ailment": "paralysis",
        "ailment_chance": 10
    },
    "nuzzle": {
        "id": "nuzzle",
        "name": "蹭蹭臉頰",
        "type": "electric",
        "power": 20,
        "ailment": "paralysis",
        "ailment_chance": 100
    },
    "prismatic_laser": {
        "id": "prismatic_laser",
        "name": "稜鏡鐳射",
        "type": "psychic",
        "power": 160
    },
    "psycho_boost": {
        "id": "psycho_boost",
        "name": "精神突進",
        "type": "psychic",
        "power": 140,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -2
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "future_sight": {
        "id": "future_sight",
        "name": "預知未來",
        "type": "psychic",
        "power": 120
    },
    "synchronoise": {
        "id": "synchronoise",
        "name": "同步干擾",
        "type": "psychic",
        "power": 120
    },
    "meditate": {
        "id": "meditate",
        "name": "瑜伽姿勢",
        "type": "psychic",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "barrier": {
        "id": "barrier",
        "name": "屏障",
        "type": "psychic",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "amnesia": {
        "id": "amnesia",
        "name": "瞬間失憶",
        "type": "psychic",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "dream_eater": {
        "id": "dream_eater",
        "name": "食夢",
        "type": "psychic",
        "power": 100
    },
    "cosmic_power": {
        "id": "cosmic_power",
        "name": "宇宙力量",
        "type": "psychic",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "psystrike": {
        "id": "psystrike",
        "name": "精神擊破",
        "type": "psychic",
        "power": 100
    },
    "photon_geyser": {
        "id": "photon_geyser",
        "name": "光子噴湧",
        "type": "psychic",
        "power": 100
    },
    "luster_purge": {
        "id": "luster_purge",
        "name": "潔淨光芒",
        "type": "psychic",
        "power": 95,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 50,
        "stat_target": "enemy"
    },
    "mist_ball": {
        "id": "mist_ball",
        "name": "薄霧球",
        "type": "psychic",
        "power": 95,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 50,
        "stat_target": "enemy"
    },
    "psychic": {
        "id": "psychic",
        "name": "精神強念",
        "type": "psychic",
        "power": 90,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "freezing_glare": {
        "id": "freezing_glare",
        "name": "冰冷視線",
        "type": "psychic",
        "power": 90,
        "ailment": "freeze",
        "ailment_chance": 10
    },
    "psychic_fangs": {
        "id": "psychic_fangs",
        "name": "精神之牙",
        "type": "psychic",
        "power": 85
    },
    "extrasensory": {
        "id": "extrasensory",
        "name": "神通力",
        "type": "psychic",
        "power": 80,
        "flinch_chance": 10
    },
    "zen_headbutt": {
        "id": "zen_headbutt",
        "name": "意念頭錘",
        "type": "psychic",
        "power": 80,
        "flinch_chance": 20
    },
    "psyshock": {
        "id": "psyshock",
        "name": "精神衝擊",
        "type": "psychic",
        "power": 80
    },
    "hyperspace_hole": {
        "id": "hyperspace_hole",
        "name": "異次元洞",
        "type": "psychic",
        "power": 80
    },
    "glitzy_glow": {
        "id": "glitzy_glow",
        "name": "嘩嘩氣場",
        "type": "psychic",
        "power": 80
    },
    "expanding_force": {
        "id": "expanding_force",
        "name": "廣域戰力",
        "type": "psychic",
        "power": 80
    },
    "eerie_spell": {
        "id": "eerie_spell",
        "name": "詭異咒語",
        "type": "psychic",
        "power": 80
    },
    "esper_wing": {
        "id": "esper_wing",
        "name": "氣场之翼",
        "type": "psychic",
        "power": 80
    },
    "lumina_crash": {
        "id": "lumina_crash",
        "name": "琉光冲激",
        "type": "psychic",
        "power": 80,
        "stat_changes": [
            {
                "stat": "def",
                "change": -2
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "psyblade": {
        "id": "psyblade",
        "name": "精神劍",
        "type": "psychic",
        "power": 80
    },
    "psychic_noise": {
        "id": "psychic_noise",
        "name": "精神噪音",
        "type": "psychic",
        "power": 75
    },
    "psycho_cut": {
        "id": "psycho_cut",
        "name": "精神利刃",
        "type": "psychic",
        "power": 70
    },
    "psyshield_bash": {
        "id": "psyshield_bash",
        "name": "屏障猛攻",
        "type": "psychic",
        "power": 70
    },
    "mystical_power": {
        "id": "mystical_power",
        "name": "神秘之力",
        "type": "psychic",
        "power": 70
    },
    "psybeam": {
        "id": "psybeam",
        "name": "幻象光線",
        "type": "psychic",
        "power": 65,
        "ailment": "confusion",
        "ailment_chance": 10
    },
    "heart_stamp": {
        "id": "heart_stamp",
        "name": "愛心印章",
        "type": "psychic",
        "power": 60,
        "flinch_chance": 30
    },
    "twin_beam": {
        "id": "twin_beam",
        "name": "双光束",
        "type": "psychic",
        "power": 40
    },
    "stored_power": {
        "id": "stored_power",
        "name": "輔助力量",
        "type": "psychic",
        "power": 20
    },
    "ice_shard": {
        "id": "ice_shard",
        "name": "冰礫",
        "type": "ice",
        "power": 40,
        "priority": 1
    },
    "freeze_shock": {
        "id": "freeze_shock",
        "name": "冰凍伏特",
        "type": "ice",
        "power": 140,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "ice_burn": {
        "id": "ice_burn",
        "name": "極寒冷焰",
        "type": "ice",
        "power": 140,
        "ailment": "burn",
        "ailment_chance": 30
    },
    "glacial_lance": {
        "id": "glacial_lance",
        "name": "雪矛",
        "type": "ice",
        "power": 120
    },
    "blizzard": {
        "id": "blizzard",
        "name": "暴風雪",
        "type": "ice",
        "power": 110,
        "ailment": "freeze",
        "ailment_chance": 10
    },
    "ice_hammer": {
        "id": "ice_hammer",
        "name": "冰錘",
        "type": "ice",
        "power": 100,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "freezy_frost": {
        "id": "freezy_frost",
        "name": "冰冰霜凍",
        "type": "ice",
        "power": 100
    },
    "mountain_gale": {
        "id": "mountain_gale",
        "name": "冰山風",
        "type": "ice",
        "power": 100
    },
    "ice_beam": {
        "id": "ice_beam",
        "name": "冰凍光束",
        "type": "ice",
        "power": 90,
        "ailment": "freeze",
        "ailment_chance": 10
    },
    "icicle_crash": {
        "id": "icicle_crash",
        "name": "冰柱墜擊",
        "type": "ice",
        "power": 85,
        "flinch_chance": 30
    },
    "ice_spinner": {
        "id": "ice_spinner",
        "name": "冰旋",
        "type": "ice",
        "power": 80
    },
    "ice_punch": {
        "id": "ice_punch",
        "name": "冰凍拳",
        "type": "ice",
        "power": 75,
        "ailment": "freeze",
        "ailment_chance": 10
    },
    "freeze_dry": {
        "id": "freeze_dry",
        "name": "冷凍乾燥",
        "type": "ice",
        "power": 70,
        "ailment": "freeze",
        "ailment_chance": 10
    },
    "aurora_beam": {
        "id": "aurora_beam",
        "name": "極光束",
        "type": "ice",
        "power": 65,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "ice_fang": {
        "id": "ice_fang",
        "name": "冰凍牙",
        "type": "ice",
        "power": 65,
        "ailment": "freeze",
        "ailment_chance": 10,
        "flinch_chance": 10
    },
    "glaciate": {
        "id": "glaciate",
        "name": "冰封世界",
        "type": "ice",
        "power": 65,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "avalanche": {
        "id": "avalanche",
        "name": "雪崩",
        "type": "ice",
        "power": 60,
        "priority": -4
    },
    "frost_breath": {
        "id": "frost_breath",
        "name": "冰息",
        "type": "ice",
        "power": 60
    },
    "icy_wind": {
        "id": "icy_wind",
        "name": "冰凍之風",
        "type": "ice",
        "power": 55,
        "stat_changes": [
            {
                "stat": "spd",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "powder_snow": {
        "id": "powder_snow",
        "name": "細雪",
        "type": "ice",
        "power": 40,
        "ailment": "freeze",
        "ailment_chance": 10
    },
    "ice_ball": {
        "id": "ice_ball",
        "name": "冰球",
        "type": "ice",
        "power": 30
    },
    "icicle_spear": {
        "id": "icicle_spear",
        "name": "冰錐",
        "type": "ice",
        "power": 25
    },
    "triple_axel": {
        "id": "triple_axel",
        "name": "三旋擊",
        "type": "ice",
        "power": 20
    },
    "eternabeam": {
        "id": "eternabeam",
        "name": "無極光束",
        "type": "dragon",
        "power": 160
    },
    "roar_of_time": {
        "id": "roar_of_time",
        "name": "時光咆哮",
        "type": "dragon",
        "power": 150
    },
    "dragon_energy": {
        "id": "dragon_energy",
        "name": "巨龍威能",
        "type": "dragon",
        "power": 150
    },
    "draco_meteor": {
        "id": "draco_meteor",
        "name": "流星群",
        "type": "dragon",
        "power": 130,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -2
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "outrage": {
        "id": "outrage",
        "name": "逆鱗",
        "type": "dragon",
        "power": 120
    },
    "glaive_rush": {
        "id": "glaive_rush",
        "name": "巨剑突擊",
        "type": "dragon",
        "power": 120
    },
    "clanging_scales": {
        "id": "clanging_scales",
        "name": "鱗片噪音",
        "type": "dragon",
        "power": 110,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "dragon_rush": {
        "id": "dragon_rush",
        "name": "龍之俯衝",
        "type": "dragon",
        "power": 100,
        "flinch_chance": 20
    },
    "spacial_rend": {
        "id": "spacial_rend",
        "name": "亞空裂斬",
        "type": "dragon",
        "power": 100
    },
    "core_enforcer": {
        "id": "core_enforcer",
        "name": "核心懲罰者",
        "type": "dragon",
        "power": 100
    },
    "clangorous_soul": {
        "id": "clangorous_soul",
        "name": "魂舞烈音爆",
        "type": "dragon",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "dragon_hammer": {
        "id": "dragon_hammer",
        "name": "龍錘",
        "type": "dragon",
        "power": 90
    },
    "dragon_pulse": {
        "id": "dragon_pulse",
        "name": "龍之波動",
        "type": "dragon",
        "power": 85
    },
    "dragon_claw": {
        "id": "dragon_claw",
        "name": "龍爪",
        "type": "dragon",
        "power": 80
    },
    "order_up": {
        "id": "order_up",
        "name": "上菜",
        "type": "dragon",
        "power": 80
    },
    "fickle_beam": {
        "id": "fickle_beam",
        "name": "隨機光",
        "type": "dragon",
        "power": 80
    },
    "dragon_breath": {
        "id": "dragon_breath",
        "name": "龍息",
        "type": "dragon",
        "power": 60,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "dragon_tail": {
        "id": "dragon_tail",
        "name": "龍尾",
        "type": "dragon",
        "power": 60,
        "priority": -6
    },
    "breaking_swipe": {
        "id": "breaking_swipe",
        "name": "廣域破壞",
        "type": "dragon",
        "power": 60,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "dragon_darts": {
        "id": "dragon_darts",
        "name": "龍箭",
        "type": "dragon",
        "power": 50
    },
    "twister": {
        "id": "twister",
        "name": "龍捲風",
        "type": "dragon",
        "power": 40,
        "flinch_chance": 20
    },
    "dual_chop": {
        "id": "dual_chop",
        "name": "二連劈",
        "type": "dragon",
        "power": 40
    },
    "scale_shot": {
        "id": "scale_shot",
        "name": "鱗射",
        "type": "dragon",
        "power": 25
    },
    "sucker_punch": {
        "id": "sucker_punch",
        "name": "突襲",
        "type": "dark",
        "power": 70,
        "priority": 1
    },
    "hone_claws": {
        "id": "hone_claws",
        "name": "磨爪",
        "type": "dark",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 2
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "hyperspace_fury": {
        "id": "hyperspace_fury",
        "name": "異次元猛攻",
        "type": "dark",
        "power": 100,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "foul_play": {
        "id": "foul_play",
        "name": "欺詐",
        "type": "dark",
        "power": 95
    },
    "fiery_wrath": {
        "id": "fiery_wrath",
        "name": "怒火中燒",
        "type": "dark",
        "power": 90,
        "flinch_chance": 20
    },
    "night_daze": {
        "id": "night_daze",
        "name": "暗黑爆破",
        "type": "dark",
        "power": 85
    },
    "darkest_lariat": {
        "id": "darkest_lariat",
        "name": "ＤＤ金勾臂",
        "type": "dark",
        "power": 85
    },
    "kowtow_cleave": {
        "id": "kowtow_cleave",
        "name": "仆刀",
        "type": "dark",
        "power": 85
    },
    "crunch": {
        "id": "crunch",
        "name": "咬碎",
        "type": "dark",
        "power": 80,
        "stat_changes": [
            {
                "stat": "def",
                "change": -1
            }
        ],
        "stat_chance": 20,
        "stat_target": "enemy"
    },
    "dark_pulse": {
        "id": "dark_pulse",
        "name": "惡之波動",
        "type": "dark",
        "power": 80,
        "flinch_chance": 20
    },
    "throat_chop": {
        "id": "throat_chop",
        "name": "地獄突刺",
        "type": "dark",
        "power": 80,
        "ailment": "silence",
        "ailment_chance": 100
    },
    "baddy_bad": {
        "id": "baddy_bad",
        "name": "壞壞領域",
        "type": "dark",
        "power": 80
    },
    "jaw_lock": {
        "id": "jaw_lock",
        "name": "緊咬不放",
        "type": "dark",
        "power": 80
    },
    "false_surrender": {
        "id": "false_surrender",
        "name": "假跪真撞",
        "type": "dark",
        "power": 80
    },
    "wicked_torque": {
        "id": "wicked_torque",
        "name": "黑暗暴冲",
        "type": "dark",
        "power": 80
    },
    "lash_out": {
        "id": "lash_out",
        "name": "洩憤",
        "type": "dark",
        "power": 75
    },
    "wicked_blow": {
        "id": "wicked_blow",
        "name": "暗冥強擊",
        "type": "dark",
        "power": 75
    },
    "night_slash": {
        "id": "night_slash",
        "name": "暗襲要害",
        "type": "dark",
        "power": 70
    },
    "knock_off": {
        "id": "knock_off",
        "name": "拍落",
        "type": "dark",
        "power": 65
    },
    "ceaseless_edge": {
        "id": "ceaseless_edge",
        "name": "秘剑・千重涛",
        "type": "dark",
        "power": 65
    },
    "bite": {
        "id": "bite",
        "name": "咬住",
        "type": "dark",
        "power": 60,
        "flinch_chance": 30
    },
    "thief": {
        "id": "thief",
        "name": "小偷",
        "type": "dark",
        "power": 60
    },
    "feint_attack": {
        "id": "feint_attack",
        "name": "出奇一擊",
        "type": "dark",
        "power": 60
    },
    "assurance": {
        "id": "assurance",
        "name": "惡意追擊",
        "type": "dark",
        "power": 60
    },
    "brutal_swing": {
        "id": "brutal_swing",
        "name": "狂舞揮打",
        "type": "dark",
        "power": 60
    },
    "snarl": {
        "id": "snarl",
        "name": "大聲咆哮",
        "type": "dark",
        "power": 55,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "payback": {
        "id": "payback",
        "name": "以牙還牙",
        "type": "dark",
        "power": 50
    },
    "pursuit": {
        "id": "pursuit",
        "name": "追打",
        "type": "dark",
        "power": 40
    },
    "power_trip": {
        "id": "power_trip",
        "name": "囂張",
        "type": "dark",
        "power": 20
    },
    "ruination": {
        "id": "ruination",
        "name": "大灾难",
        "type": "dark",
        "power": 1
    },
    "comeuppance": {
        "id": "comeuppance",
        "name": "复仇",
        "type": "dark",
        "power": 1
    },
    "light_of_ruin": {
        "id": "light_of_ruin",
        "name": "破滅之光",
        "type": "fairy",
        "power": 140
    },
    "fleur_cannon": {
        "id": "fleur_cannon",
        "name": "花朵加農炮",
        "type": "fairy",
        "power": 130,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -2
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "sparkly_swirl": {
        "id": "sparkly_swirl",
        "name": "亮亮風暴",
        "type": "fairy",
        "power": 120
    },
    "geomancy": {
        "id": "geomancy",
        "name": "大地掌控",
        "type": "fairy",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "atk",
                "change": 1
            },
            {
                "stat": "def",
                "change": 1
            },
            {
                "stat": "spd",
                "change": 1
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "misty_explosion": {
        "id": "misty_explosion",
        "name": "薄霧炸裂",
        "type": "fairy",
        "power": 100
    },
    "springtide_storm": {
        "id": "springtide_storm",
        "name": "阳春風暴",
        "type": "fairy",
        "power": 100
    },
    "magical_torque": {
        "id": "magical_torque",
        "name": "魔法暴冲",
        "type": "fairy",
        "power": 100
    },
    "moonblast": {
        "id": "moonblast",
        "name": "月亮之力",
        "type": "fairy",
        "power": 95,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 30,
        "stat_target": "enemy"
    },
    "play_rough": {
        "id": "play_rough",
        "name": "嬉鬧",
        "type": "fairy",
        "power": 90,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 10,
        "stat_target": "enemy"
    },
    "strange_steam": {
        "id": "strange_steam",
        "name": "神奇蒸汽",
        "type": "fairy",
        "power": 90,
        "ailment": "confusion",
        "ailment_chance": 20
    },
    "dazzling_gleam": {
        "id": "dazzling_gleam",
        "name": "魔法閃耀",
        "type": "fairy",
        "power": 80
    },
    "alluring_voice": {
        "id": "alluring_voice",
        "name": "魅誘之聲",
        "type": "fairy",
        "power": 80
    },
    "spirit_break": {
        "id": "spirit_break",
        "name": "靈魂衝擊",
        "type": "fairy",
        "power": 75,
        "stat_changes": [
            {
                "stat": "atk",
                "change": -1
            }
        ],
        "stat_chance": 100,
        "stat_target": "enemy"
    },
    "draining_kiss": {
        "id": "draining_kiss",
        "name": "吸取之吻",
        "type": "fairy",
        "power": 50,
        "drain": 0.75
    },
    "disarming_voice": {
        "id": "disarming_voice",
        "name": "魅惑之聲",
        "type": "fairy",
        "power": 40
    },
    "fairy_wind": {
        "id": "fairy_wind",
        "name": "妖精之風",
        "type": "fairy",
        "power": 40
    }
};

export const TYPE_SKILLS = {
    "normal": [
        "extreme_speed",
        "quick_attack",
        "fake_out",
        "feint",
        "hyper_beam",
        "giga_impact",
        "last_resort",
        "skull_bash",
        "mega_kick",
        "thrash",
        "double_edge",
        "swords_dance",
        "growth",
        "double_team",
        "harden",
        "minimize",
        "defense_curl",
        "egg_bomb",
        "sharpen",
        "stockpile",
        "judgment",
        "take_down",
        "uproar",
        "hyper_voice",
        "rock_climb",
        "body_slam",
        "mega_punch",
        "razor_wind",
        "slam",
        "strength",
        "hyper_fang",
        "tri_attack",
        "crush_claw",
        "headbutt",
        "dizzy_punch",
        "slash",
        "facade",
        "smelling_salts",
        "secret_power",
        "stomp"
    ],
    "fighting": [
        "upper_hand",
        "mach_punch",
        "vacuum_wave",
        "focus_punch",
        "meteor_assault",
        "high_jump_kick",
        "superpower",
        "close_combat",
        "focus_blast",
        "axe_kick",
        "jump_kick",
        "dynamic_punch",
        "cross_chop",
        "bulk_up",
        "hammer_arm",
        "flying_press",
        "no_retreat",
        "collision_course",
        "combat_torque",
        "sacred_sword",
        "thunderous_kick",
        "triple_arrows",
        "sky_uppercut",
        "secret_sword",
        "submission",
        "aura_sphere",
        "body_press",
        "brick_break",
        "drain_punch",
        "vital_throw",
        "wake_up_slap",
        "low_sweep",
        "rolling_kick",
        "revenge",
        "force_palm",
        "storm_throw",
        "circle_throw",
        "karate_chop",
        "rock_smash",
        "power_up_punch"
    ],
    "flying": [
        "sky_attack",
        "brave_bird",
        "dragon_ascent",
        "hurricane",
        "aeroblast",
        "beak_blast",
        "bleakwind_storm",
        "fly",
        "floaty_fall",
        "bounce",
        "drill_peck",
        "oblivion_wing",
        "air_slash",
        "chatter",
        "wing_attack",
        "air_cutter",
        "aerial_ace",
        "pluck",
        "sky_drop",
        "acrobatics",
        "gust",
        "dual_wingbeat",
        "peck"
    ],
    "poison": [
        "gunk_shot",
        "belch",
        "acid_armor",
        "coil",
        "noxious_torque",
        "malignant_chain",
        "sludge_wave",
        "sludge_bomb",
        "shell_side_arm",
        "poison_jab",
        "dire_claw",
        "cross_poison",
        "sludge",
        "venoshock",
        "barb_barrage",
        "poison_fang",
        "poison_tail",
        "clear_smog",
        "acid",
        "acid_spray",
        "smog",
        "mortal_spin",
        "poison_sting"
    ],
    "ground": [
        "precipice_blades",
        "headlong_rush",
        "earthquake",
        "sandsear_storm",
        "high_horsepower",
        "earth_power",
        "thousand_arrows",
        "thousand_waves",
        "lands_wrath",
        "dig",
        "drill_run",
        "stomping_tantrum",
        "scorching_sands",
        "bone_club",
        "mud_bomb",
        "bulldoze",
        "mud_shot",
        "bonemerang",
        "sand_tomb",
        "bone_rush",
        "mud_slap"
    ],
    "rock": [
        "accelerock",
        "rock_wrecker",
        "head_smash",
        "meteor_beam",
        "rock_polish",
        "stone_edge",
        "diamond_storm",
        "mighty_cleave",
        "power_gem",
        "rock_slide",
        "stone_axe",
        "ancient_power",
        "rock_tomb",
        "rock_throw",
        "smack_down",
        "salt_cure",
        "rollout",
        "rock_blast"
    ],
    "bug": [
        "first_impression",
        "megahorn",
        "tail_glow",
        "defend_order",
        "quiver_dance",
        "bug_buzz",
        "attack_order",
        "pollen_puff",
        "leech_life",
        "x_scissor",
        "lunge",
        "signal_beam",
        "u_turn",
        "skitter_smack",
        "steamroller",
        "silver_wind",
        "bug_bite",
        "struggle_bug",
        "fell_stinger",
        "pounce",
        "fury_cutter",
        "twineedle",
        "pin_missile",
        "infestation"
    ],
    "ghost": [
        "shadow_sneak",
        "shadow_force",
        "astral_barrage",
        "poltergeist",
        "moongeist_beam",
        "phantom_force",
        "spectral_thief",
        "shadow_bone",
        "shadow_ball",
        "spirit_shackle",
        "bitter_malice",
        "shadow_claw",
        "hex",
        "shadow_punch",
        "ominous_wind",
        "infernal_parade",
        "last_respects",
        "rage_fist",
        "lick",
        "astonish"
    ],
    "steel": [
        "bullet_punch",
        "gigaton_hammer",
        "doom_desire",
        "steel_beam",
        "steel_roller",
        "make_it_rain",
        "iron_tail",
        "iron_defense",
        "autotomize",
        "shift_gear",
        "sunsteel_strike",
        "behemoth_blade",
        "behemoth_bash",
        "spin_out",
        "meteor_mash",
        "flash_cannon",
        "iron_head",
        "anchor_shot",
        "steel_wing",
        "smart_strike",
        "mirror_shot",
        "magnet_bomb",
        "double_iron_bash",
        "metal_claw",
        "gear_grind",
        "tachyon_cutter"
    ],
    "fire": [
        "eruption",
        "blast_burn",
        "shell_trap",
        "mind_blown",
        "overheat",
        "blue_flare",
        "burn_up",
        "flare_blitz",
        "pyro_ball",
        "raging_fury",
        "armor_cannon",
        "fire_blast",
        "sacred_fire",
        "magma_storm",
        "inferno",
        "searing_shot",
        "fusion_flare",
        "heat_wave",
        "flamethrower",
        "bitter_blade",
        "blaze_kick",
        "lava_plume",
        "fire_pledge",
        "fiery_dance",
        "fire_lash",
        "torch_song",
        "blazing_torque",
        "fire_punch",
        "mystical_fire",
        "temper_flare",
        "flame_burst",
        "burning_jealousy",
        "fire_fang",
        "flame_wheel",
        "incinerate",
        "sizzly_slide",
        "flame_charge",
        "ember",
        "fire_spin"
    ],
    "water": [
        "jet_punch",
        "aqua_jet",
        "water_shuriken",
        "hydro_cannon",
        "water_spout",
        "wave_crash",
        "hydro_pump",
        "steam_eruption",
        "origin_pulse",
        "withdraw",
        "crabhammer",
        "surf",
        "muddy_water",
        "aqua_tail",
        "sparkling_aria",
        "splishy_splash",
        "liquidation",
        "fishious_rend",
        "waterfall",
        "dive",
        "scald",
        "water_pledge",
        "snipe_shot",
        "aqua_step",
        "hydro_steam",
        "razor_shell",
        "aqua_cutter",
        "bubble_beam",
        "octazooka",
        "brine",
        "water_pulse",
        "bouncy_bubble",
        "flip_turn",
        "chilling_water",
        "water_gun",
        "bubble",
        "clamp",
        "whirlpool",
        "triple_dive",
        "surging_strikes"
    ],
    "grass": [
        "frenzy_plant",
        "chloroblast",
        "leaf_storm",
        "solar_blade",
        "solar_beam",
        "petal_dance",
        "power_whip",
        "wood_hammer",
        "seed_flare",
        "cotton_guard",
        "sappy_seed",
        "leaf_blade",
        "energy_ball",
        "petal_blizzard",
        "seed_bomb",
        "grass_pledge",
        "drum_beating",
        "apple_acid",
        "grav_apple",
        "giga_drain",
        "horn_leech",
        "trop_kick",
        "flower_trick",
        "leaf_tornado",
        "needle_arm",
        "magical_leaf",
        "razor_leaf",
        "grassy_glide",
        "trailblaze",
        "vine_whip",
        "mega_drain",
        "leafage",
        "branch_poke",
        "snap_trap",
        "bullet_seed",
        "absorb"
    ],
    "electric": [
        "zippy_zap",
        "thunderclap",
        "bolt_strike",
        "electro_shot",
        "zap_cannon",
        "volt_tackle",
        "double_shock",
        "thunder",
        "aura_wheel",
        "charge",
        "fusion_bolt",
        "plasma_fists",
        "wildbolt_storm",
        "electro_drift",
        "supercell_slam",
        "thunderbolt",
        "wild_charge",
        "bolt_beak",
        "discharge",
        "zing_zap",
        "overdrive",
        "thunder_cage",
        "thunder_punch",
        "volt_switch",
        "rising_voltage",
        "spark",
        "thunder_fang",
        "parabolic_charge",
        "shock_wave",
        "buzzy_buzz",
        "electroweb",
        "charge_beam",
        "thunder_shock",
        "nuzzle"
    ],
    "psychic": [
        "prismatic_laser",
        "psycho_boost",
        "future_sight",
        "synchronoise",
        "meditate",
        "agility",
        "barrier",
        "amnesia",
        "dream_eater",
        "cosmic_power",
        "calm_mind",
        "psystrike",
        "photon_geyser",
        "luster_purge",
        "mist_ball",
        "psychic",
        "freezing_glare",
        "psychic_fangs",
        "extrasensory",
        "zen_headbutt",
        "psyshock",
        "hyperspace_hole",
        "glitzy_glow",
        "expanding_force",
        "eerie_spell",
        "esper_wing",
        "lumina_crash",
        "psyblade",
        "psychic_noise",
        "psycho_cut",
        "psyshield_bash",
        "mystical_power",
        "psybeam",
        "heart_stamp",
        "confusion",
        "twin_beam",
        "stored_power"
    ],
    "ice": [
        "ice_shard",
        "freeze_shock",
        "ice_burn",
        "glacial_lance",
        "blizzard",
        "ice_hammer",
        "freezy_frost",
        "mountain_gale",
        "ice_beam",
        "icicle_crash",
        "ice_spinner",
        "ice_punch",
        "freeze_dry",
        "aurora_beam",
        "ice_fang",
        "glaciate",
        "avalanche",
        "frost_breath",
        "icy_wind",
        "powder_snow",
        "ice_ball",
        "icicle_spear",
        "triple_axel"
    ],
    "dragon": [
        "eternabeam",
        "roar_of_time",
        "dragon_energy",
        "draco_meteor",
        "outrage",
        "glaive_rush",
        "clanging_scales",
        "dragon_dance",
        "dragon_rush",
        "spacial_rend",
        "core_enforcer",
        "clangorous_soul",
        "dragon_hammer",
        "dragon_pulse",
        "dragon_claw",
        "order_up",
        "fickle_beam",
        "dragon_breath",
        "dragon_tail",
        "breaking_swipe",
        "dragon_darts",
        "twister",
        "dual_chop",
        "scale_shot"
    ],
    "dark": [
        "sucker_punch",
        "nasty_plot",
        "hone_claws",
        "hyperspace_fury",
        "foul_play",
        "fiery_wrath",
        "night_daze",
        "darkest_lariat",
        "kowtow_cleave",
        "crunch",
        "dark_pulse",
        "throat_chop",
        "baddy_bad",
        "jaw_lock",
        "false_surrender",
        "wicked_torque",
        "lash_out",
        "wicked_blow",
        "night_slash",
        "knock_off",
        "ceaseless_edge",
        "bite",
        "thief",
        "feint_attack",
        "assurance",
        "brutal_swing",
        "snarl",
        "payback",
        "pursuit",
        "power_trip",
        "ruination",
        "comeuppance"
    ],
    "fairy": [
        "light_of_ruin",
        "fleur_cannon",
        "sparkly_swirl",
        "geomancy",
        "misty_explosion",
        "springtide_storm",
        "magical_torque",
        "moonblast",
        "play_rough",
        "strange_steam",
        "dazzling_gleam",
        "alluring_voice",
        "spirit_break",
        "draining_kiss",
        "disarming_voice",
        "fairy_wind"
    ]
};

// --- 其他戰鬥與遊戲邏輯 ---

export const ADV_WILD_POOL = [
    { id: 1022, name: "波波", weight: 1, power: 90, type: "flying" },
    { id: 1025, name: "小拳石", weight: 1, power: 80, type: "rock" }
];

// 已遷移至 src/data/evolutionConfig.js
// export const WILD_EVOLUTION_MAP = ...

// 只有玩家能獲得的怪獸才會顯示在圖鑑中 (依進化鏈順序排列)
export const OBTAINABLE_MONSTER_IDS = [
    // --- 1. 百變怪 (起始) ---
    1000,

    // --- 2. 一般線 (A, C, FAIL 分支) ---
    1013, 1014, 1015,    // 尼多朗線 (A)
    1016, 1017,        // 小拉達線 (C)
    1018,           // 3D 獸 (FAIL)

    // --- 3. 靈魂進化 - 火系 (Fire Soul) ---
    1001, 1002, 1003,       // 小火龍線

    // --- 4. 靈魂進化 - 水系 (Water Soul) ---
    1004, 1005, 1006,       // 傑尼龜線

    // --- 5. 靈魂進化 - 草系 (Grass Soul) ---
    1007, 1008, 1009,       // 妙蛙種子線

    // --- 6. 靈魂進化 - 蟲系 (Bug Soul) ---
    1010, 1011, 1012,    // 綠毛蟲線


    // --- 7. 特殊培育與野外捕捉 (G Series & Wild) ---
    1019, 1020, 1021,    // 鬼斯線 (G1)
    1022, 1023, 1024,    // 波波線 (Wild)
    1025, 1026, 1027,    // 小拳石線 (Wild)

    // --- 8. 傳說與幻之怪獸 (End Game) ---
    // 已移除夢幻、洛奇亞、烈空坐以防法律糾紛
].map(String);

export const TRAINER_POOLS = {
    1: [
        { id: 1000, name: '百變怪', type: 'normal' },
        { id: 1019, name: '鬼斯', type: 'poison' },
        { id: 1016, name: '小拉達', type: 'normal' } // 原：凱西 (替換為小拉達)
    ],
    2: [
        { id: 1001, name: '小火龍', type: 'fire' },
        { id: 1004, name: '傑尼龜', type: 'water' },
        { id: 1007, name: '妙蛙種子', type: 'grass' },
        { id: 1010, name: '綠毛蟲', type: 'bug' },
        { id: 1016, name: '小拉達', type: 'normal' }
    ],
    3: [
        { id: 1002, name: '火恐龍', type: 'fire' },
        { id: 1005, name: '卡咪龜', type: 'water' },
        { id: 1008, name: '妙蛙草', type: 'grass' },
        { id: 1011, name: '鐵甲蛹', type: 'bug' },
        { id: 1017, name: '拉達', type: 'normal' }
    ],
    4: [
        { id: 1003, name: '噴火龍', type: 'fire' },
        { id: 1006, name: '水箭龜', type: 'water' },
        { id: 1009, name: '妙蛙花', type: 'grass' },
        { id: 1012, name: '巴大蝶', type: 'bug' },
        { id: 1003, name: '噴火龍', type: 'fire' } // 原：快龍 (替換為噴火龍)
    ],
    5: [
        { id: 1006, name: '水箭龜', type: 'water' }, // 原：洛奇亞
        { id: 1021, name: '耿鬼', type: 'ghost' },
        { id: 1006, name: '水箭龜', type: 'water' } // 原：暴鯉龍 (替換為水箭龜)
    ],
    6: [
        { id: 1003, name: '噴火龍', type: 'fire' },  // 原：烈空坐
        { id: 1009, name: '妙蛙花', type: 'grass' }, // 原：夢幻
        { id: 1021, name: '耿鬼', type: 'ghost' } // 原：胡地 (替換為耿鬼)
    ]
};

export const TYPE_CHART = {
    fire: { bug: 2.0, grass: 2.0, water: 0.5, rock: 0.5, fire: 0.5, ice: 2.0, dragon: 0.5, steel: 2.0 },
    water: { fire: 2.0, rock: 2.0, ground: 2.0, grass: 0.5, water: 0.5, dragon: 0.5 },
    grass: { water: 2.0, rock: 2.0, ground: 2.0, fire: 0.5, grass: 0.5, bug: 0.5, poison: 0.5, flying: 0.5, dragon: 0.5, steel: 0.5 },
    bug: { grass: 2.0, psychic: 2.0, fire: 0.5, fighting: 0.5, flying: 0.5, poison: 0.5, ghost: 0.5, steel: 0.5, fairy: 0.5, dark: 2.0 },
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    flying: { grass: 2.0, fighting: 2.0, bug: 2.0, rock: 0.5, electric: 0.5, steel: 0.5 },
    poison: { grass: 2.0, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2.0 },
    ground: { fire: 2.0, poison: 2.0, rock: 2.0, steel: 2.0, electric: 2.0, grass: 0.5, bug: 0.5, flying: 0 },
    fighting: { normal: 2.0, rock: 2.0, ice: 2.0, steel: 2.0, dark: 2.0, flying: 0.5, poison: 0.5, bug: 0.5, psychic: 0.5, fairy: 0.5, ghost: 0 },
    rock: { fire: 2.0, flying: 2.0, bug: 2.0, ice: 2.0, fighting: 0.5, ground: 0.5, steel: 0.5 },
    psychic: { fighting: 2.0, poison: 2.0, psychic: 0.5, steel: 0.5, dark: 0 },
    ghost: { psychic: 2.0, ghost: 2.0, normal: 0, fighting: 0, dark: 0.5 },
    electric: { flying: 2.0, water: 2.0, electric: 0.5, grass: 0.5, dragon: 0.5, ground: 0 },
    ice: { grass: 2.0, ground: 2.0, flying: 2.0, dragon: 2.0, fire: 0.5, water: 0.5, ice: 0.5, steel: 0.5 },
    dragon: { dragon: 2.0, steel: 0.5, fairy: 0 },
    steel: { rock: 2.0, ice: 2.0, fairy: 2.0, fire: 0.5, water: 0.5, electric: 0.5, steel: 0.5 },
    dark: { psychic: 2.0, ghost: 2.0, fighting: 0.5, dark: 0.5, fairy: 0.5 },
    fairy: { fighting: 2.0, dragon: 2.0, dark: 2.0, fire: 0.5, poison: 0.5, steel: 0.5 }
};

export const getTypeMultiplier = (atkType, defTypes) => {
    const targetTypes = Array.isArray(defTypes) ? defTypes : [defTypes];
    let multiplier = 1.0;
    for (const defType of targetTypes) {
        if (TYPE_CHART[atkType] && TYPE_CHART[atkType][defType] !== undefined) {
            multiplier *= TYPE_CHART[atkType][defType];
        }
    }
    return multiplier;
};

export const calculateDamage = (atk, def, power, multiplier = 1.0) => {
    const baseDamage = (atk / def) * power * 0.5;
    return Math.max(1, Math.floor(baseDamage * multiplier * (0.9 + Math.random() * 0.2)));
};

export const generateMoves = (stage, types, forcedBonusId = null, level = 1, isAi = true) => {
    const typeList = Array.isArray(types) ? types : [types];

    // --- 威力過濾邏輯 (Power Gating) ---
    // 限制 AI 技能強度，避免前期秒殺玩家
    let maxPower = 999;
    if (level <= 10) maxPower = 40;
    else if (level <= 20) maxPower = 60;
    else if (level <= 40) maxPower = 80;
    else if (level <= 60) maxPower = 100;
    else if (level <= 80) maxPower = 120;

    const allSkillIds = Object.keys(SKILL_DATABASE);

    // 取得過濾後的池子
    const getPool = (tFilter, powerLimit) =>
        allSkillIds.filter(id => {
            const s = SKILL_DATABASE[id];
            if (!s) return false;
            if (powerLimit !== undefined && s.power > powerLimit) return false;
            if (tFilter === 'all') return true;
            return Array.isArray(tFilter) ? tFilter.includes(s.type) : s.type === tFilter;
        });

    const stabPool = getPool(typeList, maxPower);
    const coveragePool = getPool('all', maxPower);
    const normalPool = getPool('normal', maxPower);

    const shuffle = (arr) => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    };

    let selectedIds = [];
    if (forcedBonusId) selectedIds.push(forcedBonusId);

    const count = 4; // 不論等級、Stage 或進化鏈，一律初始給滿 4 招

    // 抽取邏輯
    for (let i = selectedIds.length; i < count; i++) {
        // 第一招保證本系（或是玩家自己學招時全本系，除非是 AI 特殊生成）
        const isStabTurn = (i === 0) || !isAi || (Math.random() < 0.7);
        const currentPool = isStabTurn ? stabPool : coveragePool;

        let available = currentPool.filter(id => !selectedIds.includes(id));

        // 備援：若該威力限制下沒招了，回退到 normal 或全池
        if (available.length === 0) available = normalPool.filter(id => !selectedIds.includes(id));
        if (available.length === 0) available = coveragePool.filter(id => !selectedIds.includes(id));

        if (available.length > 0) {
            selectedIds.push(shuffle(available)[0]);
        }
    }

    // --- 保底一招攻擊招式 (Power > 0) ---
    // AI 如果抽到 4 招輔助技會變太弱，所以強制保底一招傷害技
    const hasDamageMove = selectedIds.some(id => (SKILL_DATABASE[id]?.power || 0) > 0);
    if (!hasDamageMove && selectedIds.length > 0) {
        const damageAvailable = shuffle(coveragePool.filter(id => (SKILL_DATABASE[id]?.power || 0) > 0));
        if (damageAvailable.length > 0) {
            selectedIds[selectedIds.length - 1] = damageAvailable[0];
        }
    }

    return Array.from(new Set(selectedIds)).slice(0, 4);
};

export const calcFinalStat = (type, speciesId, iv, ev, level, natureMod = 1.0) => {
    const baseStats = SPECIES_BASE_STATS[String(speciesId)] || { hp: 50, atk: 50, def: 50, spd: 50 };
    const base = baseStats[type] || 50;

    if (type === 'hp') {
        return Math.floor((Math.floor(((2 * base + iv + (ev / 4)) * level) / 100) + level + 10) * natureMod);
    } else {
        return Math.floor((Math.floor(((2 * base + iv + (ev / 4)) * level) / 100) + 5) * natureMod);
    }
};

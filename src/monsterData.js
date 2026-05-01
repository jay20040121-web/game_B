// Generated from PokeAPI (zh-Hant)

// 怪獸名稱表 — 使用自有 ID 系統 (1000 起)
import { MONSTER_REGISTRY } from './data/monsterRegistry';

// 從中央怪獸註冊表動態生成資料，確保單一資料來源 (Single Source of Truth)
export const MONSTER_NAMES = Object.fromEntries(
    MONSTER_REGISTRY.map(monster => [monster.id, monster.name])
);

export const SPECIES_BASE_STATS = Object.fromEntries(
    MONSTER_REGISTRY.map(monster => [
        monster.id,
        {
            hp: monster.baseStats.hp,
            atk: monster.baseStats.atk,
            def: monster.baseStats.def,
            spd: monster.baseStats.spd,
            types: monster.types
        }
    ])
);

export const MONSTER_ASSET_IDS = {};

export const TYPE_MAP = {
    "normal": "普",
    "fire": "火",
    "water": "水",
    "grass": "草",
    "poison": "毒",
    "flying": "飛",
    "bug": "蟲",
    "rock": "岩",
    "ghost": "鬼",
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
        "name": "鬼臉",
        "type": "ghost",
        "power": 40,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "swords_dance": {
        "id": "swords_dance",
        "name": "戰舞",
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
    "work_up": {
        "id": "work_up",
        "name": "激勵",
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
        "name": "衝刺",
        "type": "normal",
        "power": 80,
        "priority": 2
    },
    "fake_out": {
        "id": "fake_out",
        "name": "快速奇襲",
        "type": "normal",
        "power": 40,
        "priority": 3,
        "flinch_chance": 100
    },
    "feint": {
        "id": "feint",
        "name": "假動作",
        "type": "normal",
        "power": 30,
        "priority": 2
    },
    "hyper_beam": {
        "id": "hyper_beam",
        "name": "能量波",
        "type": "normal",
        "power": 150,
        "accuracy": 90
    },
    "giga_impact": {
        "id": "giga_impact",
        "name": "終極絕招",
        "type": "normal",
        "power": 150,
        "accuracy": 90
    },
    "last_resort": {
        "id": "last_resort",
        "name": "直球攻擊",
        "type": "normal",
        "power": 140
    },
    "skull_bash": {
        "id": "skull_bash",
        "name": "頭錘",
        "type": "normal",
        "power": 130
    },
    "mega_kick": {
        "id": "mega_kick",
        "name": "百萬噸重踢",
        "type": "normal",
        "power": 120,
        "accuracy": 75
    },
    "thrash": {
        "id": "thrash",
        "name": "大鬧一番",
        "type": "normal",
        "power": 120
    },
    "double_edge": {
        "id": "double_edge",
        "name": "捨身攻擊",
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
        "name": "影子分身術",
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
        "name": "堅硬防守",
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
        "name": "炸彈",
        "type": "normal",
        "power": 100,
        "accuracy": 75
    },
    "sharpen": {
        "id": "sharpen",
        "name": "鬼人化",
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
        "name": "終極審判",
        "type": "normal",
        "power": 100
    },
    "take_down": {
        "id": "take_down",
        "name": "猛撞",
        "type": "normal",
        "power": 90,
        "recoil": 0.25,
        "accuracy": 85
    },
    "uproar": {
        "id": "uproar",
        "name": "吵鬧",
        "type": "normal",
        "power": 90
    },
    "hyper_voice": {
        "id": "hyper_voice",
        "name": "巨吼",
        "type": "normal",
        "power": 90
    },
    "rock_climb": {
        "id": "rock_climb",
        "name": "跳砍",
        "type": "normal",
        "power": 90,
        "ailment": "confusion",
        "ailment_chance": 20,
        "accuracy": 85
    },
    "body_slam": {
        "id": "body_slam",
        "name": "柔術",
        "type": "normal",
        "power": 85,
        "ailment": "paralysis",
        "ailment_chance": 30
    },
    "mega_punch": {
        "id": "mega_punch",
        "name": "百萬噸重拳",
        "type": "normal",
        "power": 80,
        "accuracy": 85
    },
    "razor_wind": {
        "id": "razor_wind",
        "name": "手刀",
        "type": "normal",
        "power": 80
    },
    "slam": {
        "id": "slam",
        "name": "互毆",
        "type": "normal",
        "power": 80,
        "accuracy": 75
    },
    "strength": {
        "id": "strength",
        "name": "怪力撞擊",
        "type": "normal",
        "power": 80
    },
    "hyper_fang": {
        "id": "hyper_fang",
        "name": "必殺咬",
        "type": "normal",
        "power": 80,
        "flinch_chance": 10,
        "accuracy": 90
    },
    "tri_attack": {
        "id": "tri_attack",
        "name": "三段攻擊",
        "type": "normal",
        "power": 80
    },
    "crush_claw": {
        "id": "crush_claw",
        "name": "尖爪",
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
        "name": "詠春",
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
        "name": "快打斬",
        "type": "normal",
        "power": 70
    },
    "facade": {
        "id": "facade",
        "name": "反擊拳",
        "type": "normal",
        "power": 70
    },
    "smelling_salts": {
        "id": "smelling_salts",
        "name": "大叫",
        "type": "normal",
        "power": 70
    },
    "secret_power": {
        "id": "secret_power",
        "name": "秘密力量",
        "type": "normal",
        "power": 70
    },
    "stomp": {
        "id": "stomp",
        "name": "大象踏",
        "type": "normal",
        "power": 65,
        "flinch_chance": 30
    },
    "sky_attack": {
        "id": "sky_attack",
        "name": "天擊",
        "type": "flying",
        "power": 140,
        "flinch_chance": 30,
        "accuracy": 90
    },
    "brave_bird": {
        "id": "brave_bird",
        "name": "神鳥",
        "type": "flying",
        "power": 120,
        "recoil": 0.33
    },
    "dragon_ascent": {
        "id": "dragon_ascent",
        "name": "天空衝擊",
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
        "name": "暴風之夜",
        "type": "flying",
        "power": 110,
        "ailment": "confusion",
        "ailment_chance": 30,
        "accuracy": 70
    },
    "aeroblast": {
        "id": "aeroblast",
        "name": "上升氣旋",
        "type": "flying",
        "power": 100,
        "accuracy": 95
    },
    "beak_blast": {
        "id": "beak_blast",
        "name": "鳥嘴炮",
        "type": "flying",
        "power": 100,
        "priority": -3
    },
    "bleakwind_storm": {
        "id": "bleakwind_storm",
        "name": "築巢",
        "type": "flying",
        "power": 100
    },
    "fly": {
        "id": "fly",
        "name": "飛翔",
        "type": "flying",
        "power": 90,
        "accuracy": 95
    },
    "floaty_fall": {
        "id": "floaty_fall",
        "name": "墜落",
        "type": "flying",
        "power": 90,
        "flinch_chance": 30,
        "accuracy": 95
    },
    "bounce": {
        "id": "bounce",
        "name": "跳起",
        "type": "flying",
        "power": 85,
        "ailment": "paralysis",
        "ailment_chance": 30,
        "accuracy": 85
    },
    "drill_peck": {
        "id": "drill_peck",
        "name": "啄彈",
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
        "name": "空氣刀",
        "type": "flying",
        "power": 75,
        "flinch_chance": 30,
        "accuracy": 95
    },
    "chatter": {
        "id": "chatter",
        "name": "瘋狂大鬧",
        "type": "flying",
        "power": 65,
        "ailment": "confusion",
        "ailment_chance": 100
    },
    "wing_attack": {
        "id": "wing_attack",
        "name": "翅膀拍擊",
        "type": "flying",
        "power": 80
    },
    "air_cutter": {
        "id": "air_cutter",
        "name": "空氣刃",
        "type": "flying",
        "power": 60,
        "accuracy": 95
    },
    "aerial_ace": {
        "id": "aerial_ace",
        "name": "燕歸來",
        "type": "flying",
        "power": 90
    },
    "pluck": {
        "id": "pluck",
        "name": "捕食",
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
        "name": "高速飛行",
        "type": "flying",
        "power": 55
    },
    "gust": {
        "id": "gust",
        "name": "旋風",
        "type": "flying",
        "power": 40
    },
    "dual_wingbeat": {
        "id": "dual_wingbeat",
        "name": "羽毛攻擊",
        "type": "flying",
        "power": 40
    },
    "peck": {
        "id": "peck",
        "name": "鷹爪",
        "type": "flying",
        "power": 35
    },
    "gunk_shot": {
        "id": "gunk_shot",
        "name": "垃圾山",
        "type": "poison",
        "power": 120,
        "ailment": "poison",
        "ailment_chance": 30,
        "accuracy": 80
    },
    "belch": {
        "id": "belch",
        "name": "嘔吐物",
        "type": "poison",
        "power": 120
    },
    "acid_armor": {
        "id": "acid_armor",
        "name": "酸性鎧甲",
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
        "name": "生猛毒藥",
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
        "name": "傳染病",
        "type": "poison",
        "power": 100
    },
    "malignant_chain": {
        "id": "malignant_chain",
        "name": "邪毒娃娃",
        "type": "poison",
        "power": 100
    },
    "sludge_wave": {
        "id": "sludge_wave",
        "name": "垃圾山",
        "type": "poison",
        "power": 95,
        "ailment": "poison",
        "ailment_chance": 10
    },
    "sludge_bomb": {
        "id": "sludge_bomb",
        "name": "毒氣炸彈",
        "type": "poison",
        "power": 90,
        "ailment": "poison",
        "ailment_chance": 30
    },
    "shell_side_arm": {
        "id": "shell_side_arm",
        "name": "生化武器",
        "type": "poison",
        "power": 90,
        "ailment": "poison",
        "ailment_chance": 20
    },
    "poison_jab": {
        "id": "poison_jab",
        "name": "劇毒",
        "type": "poison",
        "power": 80,
        "ailment": "poison",
        "ailment_chance": 30
    },
    "dire_claw": {
        "id": "dire_claw",
        "name": "毒爪",
        "type": "poison",
        "power": 80
    },
    "cross_poison": {
        "id": "cross_poison",
        "name": "毒刃",
        "type": "poison",
        "power": 70,
        "ailment": "poison",
        "ailment_chance": 10
    },
    "sludge": {
        "id": "sludge",
        "name": "污泥炸彈",
        "type": "poison",
        "power": 65,
        "ailment": "poison",
        "ailment_chance": 30
    },
    "venoshock": {
        "id": "venoshock",
        "name": "毒液術",
        "type": "poison",
        "power": 65
    },
    "barb_barrage": {
        "id": "barb_barrage",
        "name": "毒千本",
        "type": "poison",
        "power": 60
    },
    "poison_fang": {
        "id": "poison_fang",
        "name": "劇毒之牙",
        "type": "poison",
        "power": 50,
        "ailment": "poison",
        "ailment_chance": 50
    },
    "poison_tail": {
        "id": "poison_tail",
        "name": "毒液",
        "type": "poison",
        "power": 50,
        "ailment": "poison",
        "ailment_chance": 10
    },
    "clear_smog": {
        "id": "clear_smog",
        "name": "毒煙",
        "type": "poison",
        "power": 50
    },
    "acid": {
        "id": "acid",
        "name": "腐蝕液",
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
        "name": "胃酸",
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
        "name": "汙染",
        "type": "poison",
        "power": 60,
        "ailment": "poison",
        "ailment_chance": 40,
        "accuracy": 70
    },
    "mortal_spin": {
        "id": "mortal_spin",
        "name": "吐滿地",
        "type": "poison",
        "power": 39
    },
    "poison_sting": {
        "id": "poison_sting",
        "name": "毒針",
        "type": "poison",
        "power": 15,
        "ailment": "poison",
        "ailment_chance": 30
    },
    "accelerock": {
        "id": "accelerock",
        "name": "岩落",
        "type": "rock",
        "power": 40,
        "priority": 1
    },
    "rock_wrecker": {
        "id": "rock_wrecker",
        "name": "岩石炮",
        "type": "rock",
        "power": 150,
        "accuracy": 90
    },
    "head_smash": {
        "id": "head_smash",
        "name": "頭錘",
        "type": "rock",
        "power": 150,
        "accuracy": 80
    },
    "meteor_beam": {
        "id": "meteor_beam",
        "name": "隕石術",
        "type": "rock",
        "power": 120,
        "accuracy": 90
    },
    "rock_polish": {
        "id": "rock_polish",
        "name": "打磨石頭",
        "type": "rock",
        "power": 0,
        "priority": 2,
        "stat_changes": [
            {
                "stat": "spd",
                "change": 3
            }
        ],
        "stat_chance": 100,
        "stat_target": "self"
    },
    "stone_edge": {
        "id": "stone_edge",
        "name": "巨岩拳",
        "type": "rock",
        "power": 100,
        "accuracy": 80
    },
    "diamond_storm": {
        "id": "diamond_storm",
        "name": "鑽石撞擊",
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
        "name": "硬化攻擊",
        "type": "rock",
        "power": 95
    },
    "power_gem": {
        "id": "power_gem",
        "name": "寶石之心",
        "type": "rock",
        "power": 80
    },
    "rock_slide": {
        "id": "rock_slide",
        "name": "土石流",
        "type": "rock",
        "power": 75,
        "flinch_chance": 30,
        "accuracy": 90
    },
    "stone_axe": {
        "id": "stone_axe",
        "name": "岩手",
        "type": "rock",
        "power": 65
    },
    "ancient_power": {
        "id": "ancient_power",
        "name": "巨神兵",
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
        "name": "路線封鎖",
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
        "name": "小心落石",
        "type": "rock",
        "power": 60,
        "accuracy": 90
    },
    "smack_down": {
        "id": "smack_down",
        "name": "石頭攻擊",
        "type": "rock",
        "power": 50
    },
    "salt_cure": {
        "id": "salt_cure",
        "name": "粗鹽",
        "type": "rock",
        "power": 40
    },
    "rollout": {
        "id": "rollout",
        "name": "滾動之軀",
        "type": "rock",
        "power": 35
    },
    "rock_blast": {
        "id": "rock_blast",
        "name": "岩石衝撞",
        "type": "rock",
        "power": 40,
        "accuracy": 90
    },
    "first_impression": {
        "id": "first_impression",
        "name": "虎頭蜂針",
        "type": "bug",
        "power": 90,
        "priority": 2
    },
    "megahorn": {
        "id": "megahorn",
        "name": "觸角攻擊",
        "type": "bug",
        "power": 120,
        "accuracy": 85
    },
    "tail_glow": {
        "id": "tail_glow",
        "name": "螢火蟲之光",
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
        "name": "甲殼防禦",
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
        "name": "蝴蝶之舞",
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
        "name": "蟻兵攻擊",
        "type": "bug",
        "power": 90
    },
    "pollen_puff": {
        "id": "pollen_puff",
        "name": "花粉",
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
        "name": "巨型鉗",
        "type": "bug",
        "power": 80
    },
    "lunge": {
        "id": "lunge",
        "name": "蟲蟲撲擊",
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
        "name": "信號光彈",
        "type": "bug",
        "power": 75,
        "ailment": "confusion",
        "ailment_chance": 10
    },
    "u_turn": {
        "id": "u_turn",
        "name": "蟲蜂飛行",
        "type": "bug",
        "power": 70
    },
    "skitter_smack": {
        "id": "skitter_smack",
        "name": "爬行啃咬",
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
        "name": "瘋狂啃咬",
        "type": "bug",
        "power": 65,
        "flinch_chance": 30
    },
    "silver_wind": {
        "id": "silver_wind",
        "name": "治癒花粉",
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
        "name": "蟲蟲振翅",
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
        "name": "蟲蟲撲擊",
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
        "name": "居合斬",
        "type": "bug",
        "power": 60,
        "accuracy": 95
    },
    "twineedle": {
        "id": "twineedle",
        "name": "雙針攻擊",
        "type": "bug",
        "power": 40,
        "ailment": "poison",
        "ailment_chance": 20
    },
    "pin_missile": {
        "id": "pin_missile",
        "name": "飛針",
        "type": "bug",
        "power": 55,
        "accuracy": 95
    },
    "infestation": {
        "id": "infestation",
        "name": "死纏爛打",
        "type": "bug",
        "power": 35,
        "ailment": "trap",
        "ailment_chance": 100
    },
    "shadow_sneak": {
        "id": "shadow_sneak",
        "name": "偷襲",
        "type": "ghost",
        "power": 40,
        "priority": 1
    },
    "shadow_force": {
        "id": "shadow_force",
        "name": "潛襲",
        "type": "ghost",
        "power": 120
    },
    "astral_barrage": {
        "id": "astral_barrage",
        "name": "無光",
        "type": "ghost",
        "power": 120
    },
    "poltergeist": {
        "id": "poltergeist",
        "name": "靈",
        "type": "ghost",
        "power": 110
    },
    "moongeist_beam": {
        "id": "moongeist_beam",
        "name": "黑暗",
        "type": "ghost",
        "power": 100
    },
    "phantom_force": {
        "id": "phantom_force",
        "name": "幻影奇襲",
        "type": "ghost",
        "power": 90
    },
    "spectral_thief": {
        "id": "spectral_thief",
        "name": "黑夜",
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
        "name": "暗影巨兵",
        "type": "ghost",
        "power": 60,
        "stat_changes": [
            {
                "stat": "def",
                "change": -2
            }
        ],
        "stat_chance": 20,
        "stat_target": "enemy"
    },
    "spirit_shackle": {
        "id": "spirit_shackle",
        "name": "影子人",
        "type": "ghost",
        "power": 80
    },
    "bitter_malice": {
        "id": "bitter_malice",
        "name": "冤魂",
        "type": "ghost",
        "power": 75
    },
    "shadow_claw": {
        "id": "shadow_claw",
        "name": "魅影突襲",
        "type": "ghost",
        "power": 70
    },
    "hex": {
        "id": "hex",
        "name": "禍不單行",
        "type": "ghost",
        "power": 40
    },
    "shadow_punch": {
        "id": "shadow_punch",
        "name": "暗影拳",
        "type": "ghost",
        "power": 90
    },
    "ominous_wind": {
        "id": "ominous_wind",
        "name": "招魂術",
        "type": "ghost",
        "power": 60
    },
    "infernal_parade": {
        "id": "infernal_parade",
        "name": "群魔遊行",
        "type": "ghost",
        "power": 60
    },
    "last_respects": {
        "id": "last_respects",
        "name": "見鬼",
        "type": "ghost",
        "power": 50
    },
    "rage_fist": {
        "id": "rage_fist",
        "name": "龍火拳",
        "type": "ghost",
        "power": 50
    },
    "astonish": {
        "id": "astonish",
        "name": "火爆彈頭",
        "type": "ghost",
        "power": 30,
        "flinch_chance": 30
    },
    "eruption": {
        "id": "eruption",
        "name": "火山爆發",
        "type": "fire",
        "power": 150
    },
    "blast_burn": {
        "id": "blast_burn",
        "name": "爆炸陷阱",
        "type": "fire",
        "power": 150,
        "accuracy": 90
    },
    "shell_trap": {
        "id": "shell_trap",
        "name": "燃燒彈",
        "type": "fire",
        "power": 150,
        "priority": -3
    },
    "mind_blown": {
        "id": "mind_blown",
        "name": "核彈頭",
        "type": "fire",
        "power": 150
    },
    "overheat": {
        "id": "overheat",
        "name": "超溫攻擊",
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
        "name": "青炎",
        "type": "fire",
        "power": 130,
        "ailment": "burn",
        "ailment_chance": 20,
        "accuracy": 85
    },
    "burn_up": {
        "id": "burn_up",
        "name": "燃燒殆盡",
        "type": "fire",
        "power": 130
    },
    "flare_blitz": {
        "id": "flare_blitz",
        "name": "閃焰火光",
        "type": "fire",
        "power": 120,
        "recoil": 0.33,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "pyro_ball": {
        "id": "pyro_ball",
        "name": "火薔薇",
        "type": "fire",
        "power": 120,
        "ailment": "burn",
        "ailment_chance": 10,
        "accuracy": 90
    },
    "raging_fury": {
        "id": "raging_fury",
        "name": "大怒神",
        "type": "fire",
        "power": 120
    },
    "armor_cannon": {
        "id": "armor_cannon",
        "name": "熔岩火炮",
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
        "name": "爆炎",
        "type": "fire",
        "power": 110,
        "ailment": "burn",
        "ailment_chance": 10,
        "accuracy": 85
    },
    "sacred_fire": {
        "id": "sacred_fire",
        "name": "聖火",
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
        "ailment_chance": 100,
        "accuracy": 75
    },
    "inferno": {
        "id": "inferno",
        "name": "煉獄",
        "type": "fire",
        "power": 100,
        "ailment": "burn",
        "ailment_chance": 100,
        "accuracy": 50
    },
    "searing_shot": {
        "id": "searing_shot",
        "name": "火焰球",
        "type": "fire",
        "power": 100,
        "ailment": "burn",
        "ailment_chance": 30
    },
    "fusion_flare": {
        "id": "fusion_flare",
        "name": "雙重火力",
        "type": "fire",
        "power": 100
    },
    "heat_wave": {
        "id": "heat_wave",
        "name": "烈焰風暴",
        "type": "fire",
        "power": 95,
        "ailment": "burn",
        "ailment_chance": 10,
        "accuracy": 90
    },
    "flamethrower": {
        "id": "flamethrower",
        "name": "烈焰射線",
        "type": "fire",
        "power": 90,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "bitter_blade": {
        "id": "bitter_blade",
        "name": "火箭拳",
        "type": "fire",
        "power": 90,
        "drain": 0.5
    },
    "blaze_kick": {
        "id": "blaze_kick",
        "name": "熔岩踢",
        "type": "fire",
        "power": 85,
        "ailment": "burn",
        "ailment_chance": 10,
        "accuracy": 90
    },
    "lava_plume": {
        "id": "lava_plume",
        "name": "噴火",
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
        "name": "烈火高歌",
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
        "name": "滅火烈炎",
        "type": "fire",
        "power": 80
    },
    "fire_punch": {
        "id": "fire_punch",
        "name": "火拳",
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
        "name": "熱情之炎",
        "type": "fire",
        "power": 75
    },
    "flame_burst": {
        "id": "flame_burst",
        "name": "烈焰射",
        "type": "fire",
        "power": 70
    },
    "burning_jealousy": {
        "id": "burning_jealousy",
        "name": "忌妒之火",
        "type": "fire",
        "power": 70,
        "ailment": "burn",
        "ailment_chance": 100
    },
    "fire_fang": {
        "id": "fire_fang",
        "name": "火之牙",
        "type": "fire",
        "power": 65,
        "ailment": "burn",
        "ailment_chance": 10,
        "flinch_chance": 10,
        "accuracy": 95
    },
    "flame_wheel": {
        "id": "flame_wheel",
        "name": "火焰",
        "type": "fire",
        "power": 60,
        "ailment": "burn",
        "ailment_chance": 10
    },
    "incinerate": {
        "id": "incinerate",
        "name": "燒盡之劍",
        "type": "fire",
        "power": 60
    },
    "sizzly_slide": {
        "id": "sizzly_slide",
        "name": "火爆殺",
        "type": "fire",
        "power": 60,
        "ailment": "burn",
        "ailment_chance": 100
    },
    "flame_charge": {
        "id": "flame_charge",
        "name": "火焰襲擊",
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
        "name": "火之旋渦",
        "type": "fire",
        "power": 35,
        "ailment": "trap",
        "ailment_chance": 100,
        "accuracy": 85
    },
    "jet_punch": {
        "id": "jet_punch",
        "name": "水槍拳",
        "type": "water",
        "power": 60,
        "priority": 1
    },
    "aqua_jet": {
        "id": "aqua_jet",
        "name": "水火箭",
        "type": "water",
        "power": 40,
        "priority": 1
    },
    "water_shuriken": {
        "id": "water_shuriken",
        "name": "水之手裡劍",
        "type": "water",
        "power": 35,
        "priority": 1
    },
    "hydro_cannon": {
        "id": "hydro_cannon",
        "name": "加農水柱",
        "type": "water",
        "power": 150,
        "accuracy": 90
    },
    "water_spout": {
        "id": "water_spout",
        "name": "暴風雨",
        "type": "water",
        "power": 150
    },
    "wave_crash": {
        "id": "wave_crash",
        "name": "生生流轉",
        "type": "water",
        "power": 120
    },
    "hydro_pump": {
        "id": "hydro_pump",
        "name": "水砲台",
        "type": "water",
        "power": 110,
        "accuracy": 80
    },
    "steam_eruption": {
        "id": "steam_eruption",
        "name": "水蒸汽爆",
        "type": "water",
        "power": 110,
        "ailment": "burn",
        "ailment_chance": 30
    },
    "origin_pulse": {
        "id": "origin_pulse",
        "name": "海浪波動",
        "type": "water",
        "power": 110,
        "accuracy": 85
    },
    "withdraw": {
        "id": "withdraw",
        "name": "龜縮",
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
        "name": "螃蟹拳",
        "type": "water",
        "power": 100,
        "accuracy": 90
    },
    "surf": {
        "id": "surf",
        "name": "衝浪",
        "type": "water",
        "power": 90
    },
    "muddy_water": {
        "id": "muddy_water",
        "name": "下雨",
        "type": "water",
        "power": 90,
        "accuracy": 85
    },
    "aqua_tail": {
        "id": "aqua_tail",
        "name": "水流擊",
        "type": "water",
        "power": 90,
        "accuracy": 90
    },
    "sparkling_aria": {
        "id": "sparkling_aria",
        "name": "泡影之歌",
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
        "name": "水流破",
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
        "name": "水魚咬",
        "type": "water",
        "power": 85
    },
    "waterfall": {
        "id": "waterfall",
        "name": "瀑布",
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
        "name": "風平浪靜",
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
        "name": "水面斬",
        "type": "water",
        "power": 80
    },
    "aqua_step": {
        "id": "aqua_step",
        "name": "流流水舞",
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
        "name": "水之利刃",
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
        "name": "水之亂斬",
        "type": "water",
        "power": 70
    },
    "bubble_beam": {
        "id": "bubble_beam",
        "name": "水壓光線",
        "type": "water",
        "power": 80,
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
        "name": "蠑螈水炮",
        "type": "water",
        "power": 65,
        "accuracy": 85
    },
    "brine": {
        "id": "brine",
        "name": "鹽水",
        "type": "water",
        "power": 65
    },
    "water_pulse": {
        "id": "water_pulse",
        "name": "水滴之聲",
        "type": "water",
        "power": 60,
        "ailment": "confusion",
        "ailment_chance": 20
    },
    "bouncy_bubble": {
        "id": "bouncy_bubble",
        "name": "水氣泡",
        "type": "water",
        "power": 60
    },
    "flip_turn": {
        "id": "flip_turn",
        "name": "快速滑水",
        "type": "water",
        "power": 60
    },
    "chilling_water": {
        "id": "chilling_water",
        "name": "冷水澡",
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
        "name": "水之夾擊",
        "type": "water",
        "power": 45,
        "ailment": "trap",
        "ailment_chance": 100,
        "accuracy": 85
    },
    "whirlpool": {
        "id": "whirlpool",
        "name": "潮旋",
        "type": "water",
        "power": 40,
        "ailment": "trap",
        "ailment_chance": 100,
        "accuracy": 85
    },
    "triple_dive": {
        "id": "triple_dive",
        "name": "三連潛",
        "type": "water",
        "power": 50
    },
    "surging_strikes": {
        "id": "surging_strikes",
        "name": "水流衝擊",
        "type": "water",
        "power": 45
    },
    "frenzy_plant": {
        "id": "frenzy_plant",
        "name": "魔性植物",
        "type": "grass",
        "power": 150,
        "accuracy": 90
    },
    "chloroblast": {
        "id": "chloroblast",
        "name": "葉子爆震",
        "type": "grass",
        "power": 150,
        "accuracy": 95
    },
    "leaf_storm": {
        "id": "leaf_storm",
        "name": "飛葉暴風",
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
        "name": "太陽花",
        "type": "grass",
        "power": 125
    },
    "solar_beam": {
        "id": "solar_beam",
        "name": "太陽能量束",
        "type": "grass",
        "power": 120
    },
    "petal_dance": {
        "id": "petal_dance",
        "name": "花之舞",
        "type": "grass",
        "power": 120
    },
    "power_whip": {
        "id": "power_whip",
        "name": "強力鞭打",
        "type": "grass",
        "power": 120,
        "accuracy": 85
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
        "name": "種子閃光彈",
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
        "name": "樹木防守",
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
        "name": "種子轟炸",
        "type": "grass",
        "power": 100,
        "ailment": "leech-seed",
        "ailment_chance": 100
    },
    "leaf_blade": {
        "id": "leaf_blade",
        "name": "葉子飛刃",
        "type": "grass",
        "power": 90
    },
    "energy_ball": {
        "id": "energy_ball",
        "name": "植物球",
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
        "name": "花瓣暴風",
        "type": "grass",
        "power": 90
    },
    "seed_bomb": {
        "id": "seed_bomb",
        "name": "種子炸藥",
        "type": "grass",
        "power": 90
    },
    "grass_pledge": {
        "id": "grass_pledge",
        "name": "草之誓約",
        "type": "grass",
        "power": 80
    },
    "drum_beating": {
        "id": "drum_beating",
        "name": "花擊",
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
        "name": "地心引力",
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
        "name": "無盡吸取",
        "type": "grass",
        "power": 70,
        "drain": 0.7
    },
    "horn_leech": {
        "id": "horn_leech",
        "name": "木遁",
        "type": "grass",
        "power": 75,
        "drain": 0.5
    },
    "trop_kick": {
        "id": "trop_kick",
        "name": "草葉踢",
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
        "name": "千變花樣",
        "type": "grass",
        "power": 90
    },
    "leaf_tornado": {
        "id": "leaf_tornado",
        "name": "青草漩渦",
        "type": "grass",
        "power": 65,
        "accuracy": 90
    },
    "needle_arm": {
        "id": "needle_arm",
        "name": "花之尖刺",
        "type": "grass",
        "power": 60,
        "flinch_chance": 30
    },
    "magical_leaf": {
        "id": "magical_leaf",
        "name": "魔法葉子",
        "type": "grass",
        "power": 60
    },
    "razor_leaf": {
        "id": "razor_leaf",
        "name": "飛葉刀刃",
        "type": "grass",
        "power": 55,
        "accuracy": 95
    },
    "grassy_glide": {
        "id": "grassy_glide",
        "name": "草之滑梯",
        "type": "grass",
        "power": 55
    },
    "trailblaze": {
        "id": "trailblaze",
        "name": "青草腳",
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
        "name": "極限吸收",
        "type": "grass",
        "power": 60,
        "drain": 0.6
    },
    "leafage": {
        "id": "leafage",
        "name": "花葉攻擊",
        "type": "grass",
        "power": 55
    },
    "branch_poke": {
        "id": "branch_poke",
        "name": "樹木刺",
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
        "name": "果子機槍",
        "type": "grass",
        "power": 40
    },
    "absorb": {
        "id": "absorb",
        "name": "吸收",
        "type": "grass",
        "power": 40,
        "drain": 0.5
    },
};

export const TYPE_SKILLS = {
    "normal": [
        "extreme_speed", "quick_attack", "fake_out", "feint", "hyper_beam", "giga_impact", "last_resort", "skull_bash", "mega_kick", "thrash", "double_edge", "swords_dance", "growth", "double_team", "harden", "minimize", "defense_curl", "egg_bomb", "sharpen", "stockpile", "judgment", "take_down", "uproar", "hyper_voice", "rock_climb", "body_slam", "mega_punch", "razor_wind", "slam", "strength", "hyper_fang", "tri_attack", "crush_claw", "headbutt", "dizzy_punch", "slash", "facade", "smelling_salts", "secret_power", "stomp"
    ],
    "flying": [
        "sky_attack", "brave_bird", "dragon_ascent", "hurricane", "aeroblast", "beak_blast", "bleakwind_storm", "fly", "floaty_fall", "bounce", "drill_peck", "oblivion_wing", "air_slash", "chatter", "wing_attack", "air_cutter", "aerial_ace", "pluck", "sky_drop", "acrobatics", "gust", "dual_wingbeat", "peck"
    ],
    "poison": [
        "gunk_shot", "belch", "acid_armor", "coil", "noxious_torque", "malignant_chain", "sludge_wave", "sludge_bomb", "shell_side_arm", "poison_jab", "dire_claw", "cross_poison", "sludge", "venoshock", "barb_barrage", "poison_fang", "poison_tail", "clear_smog", "acid", "acid_spray", "smog", "mortal_spin", "poison_sting"
    ],
    "rock": [
        "accelerock", "rock_wrecker", "head_smash", "meteor_beam", "rock_polish", "stone_edge", "diamond_storm", "mighty_cleave", "power_gem", "rock_slide", "stone_axe", "ancient_power", "rock_tomb", "rock_throw", "smack_down", "salt_cure", "rollout", "rock_blast"
    ],
    "bug": [
        "first_impression", "megahorn", "tail_glow", "defend_order", "quiver_dance", "bug_buzz", "attack_order", "pollen_puff", "leech_life", "x_scissor", "lunge", "signal_beam", "u_turn", "skitter_smack", "steamroller", "silver_wind", "bug_bite", "struggle_bug", "fell_stinger", "pounce", "fury_cutter", "twineedle", "pin_missile", "infestation"
    ],
    "ghost": [
        "shadow_sneak", "shadow_force", "astral_barrage", "poltergeist", "moongeist_beam", "phantom_force", "spectral_thief", "shadow_bone", "shadow_ball", "spirit_shackle", "bitter_malice", "shadow_claw", "hex", "shadow_punch", "ominous_wind", "infernal_parade", "last_respects", "rage_fist", "lick", "astonish"
    ],
    "fire": [
        "eruption", "blast_burn", "shell_trap", "mind_blown", "overheat", "blue_flare", "burn_up", "flare_blitz", "pyro_ball", "raging_fury", "armor_cannon", "fire_blast", "sacred_fire", "magma_storm", "inferno", "searing_shot", "fusion_flare", "heat_wave", "flamethrower", "bitter_blade", "blaze_kick", "lava_plume", "fire_pledge", "fiery_dance", "fire_lash", "torch_song", "blazing_torque", "fire_punch", "mystical_fire", "temper_flare", "flame_burst", "burning_jealousy", "fire_fang", "flame_wheel", "incinerate", "sizzly_slide", "flame_charge", "ember", "fire_spin"
    ],
    "water": [
        "jet_punch", "aqua_jet", "water_shuriken", "hydro_cannon", "water_spout", "wave_crash", "hydro_pump", "steam_eruption", "origin_pulse", "withdraw", "crabhammer", "surf", "muddy_water", "aqua_tail", "sparkling_aria", "splishy_splash", "liquidation", "fishious_rend", "waterfall", "dive", "scald", "water_pledge", "snipe_shot", "aqua_step", "hydro_steam", "razor_shell", "aqua_cutter", "bubble_beam", "octazooka", "brine", "water_pulse", "bouncy_bubble", "flip_turn", "chilling_water", "water_gun", "bubble", "clamp", "whirlpool", "triple_dive", "surging_strikes"
    ],
    "grass": [
        "frenzy_plant", "chloroblast", "leaf_storm", "solar_blade", "solar_beam", "petal_dance", "power_whip", "wood_hammer", "seed_flare", "cotton_guard", "sappy_seed", "leaf_blade", "energy_ball", "petal_blizzard", "seed_bomb", "grass_pledge", "drum_beating", "apple_acid", "grav_apple", "giga_drain", "horn_leech", "trop_kick", "flower_trick", "leaf_tornado", "needle_arm", "magical_leaf", "razor_leaf", "grassy_glide", "trailblaze", "vine_whip", "mega_drain", "leafage", "branch_poke", "snap_trap", "bullet_seed", "absorb"
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
    1013, 1014, 1015,    // 咪兔線 (A)
    1016, 1017,        // 咪球線 (C)
    1018,           // 天后咪 (FAIL)

    // --- 3. 靈魂進化 - 火系 (Fire Soul) ---
    1001, 1002, 1003,       // 火星獸線

    // --- 4. 靈魂進化 - 水系 (Water Soul) ---
    1004, 1005, 1006,       // 泡泡獸線
    1028, 1029,             // 泡泡獸線 (熱血/無俚頭分支)

    // --- 5. 靈魂進化 - 草系 (Grass Soul) ---
    1007, 1008, 1009,       // 棉棉獸線

    // --- 6. 靈魂進化 - 蟲系 (Bug Soul) ---
    1010, 1011, 1012,    // 蜂兵線


    // --- 7. 特殊培育與野外捕捉 (G Series & Wild) ---
    1019, 1020, 1021,    // 幽影線 (G1)
    1022, 1023, 1024,    // 小雞獸線 (Wild)
    1025, 1026, 1027,    // 石精靈線 (Wild)

].map(String);

export const TRAINER_POOLS = {
    1: [
        { id: 1000, name: MONSTER_NAMES[1000], type: 'normal' },
        { id: 1019, name: MONSTER_NAMES[1019], type: 'poison' },
        { id: 1016, name: MONSTER_NAMES[1016], type: 'normal' }
    ],
    2: [
        { id: 1001, name: MONSTER_NAMES[1001], type: 'fire' },
        { id: 1004, name: MONSTER_NAMES[1004], type: 'water' },
        { id: 1007, name: MONSTER_NAMES[1007], type: 'grass' },
        { id: 1010, name: MONSTER_NAMES[1010], type: 'bug' },
        { id: 1016, name: MONSTER_NAMES[1016], type: 'normal' }
    ],
    3: [
        { id: 1002, name: MONSTER_NAMES[1002], type: 'fire' },
        { id: 1005, name: MONSTER_NAMES[1005], type: 'water' },
        { id: 1008, name: MONSTER_NAMES[1008], type: 'grass' },
        { id: 1011, name: MONSTER_NAMES[1011], type: 'bug' },
        { id: 1017, name: MONSTER_NAMES[1017], type: 'normal' }
    ],
    4: [
        { id: 1003, name: MONSTER_NAMES[1003], type: 'fire' },
        { id: 1006, name: MONSTER_NAMES[1006], type: 'water' },
        { id: 1009, name: MONSTER_NAMES[1009], type: 'grass' },
        { id: 1012, name: MONSTER_NAMES[1012], type: 'bug' },
        { id: 1003, name: MONSTER_NAMES[1003], type: 'fire' }
    ],
    5: [
        { id: 1006, name: MONSTER_NAMES[1006], type: 'water' },
        { id: 1021, name: MONSTER_NAMES[1021], type: 'ghost' },
        { id: 1006, name: MONSTER_NAMES[1006], type: 'water' }
    ],
    6: [
        { id: 1003, name: MONSTER_NAMES[1003], type: 'fire' },
        { id: 1009, name: MONSTER_NAMES[1009], type: 'grass' },
        { id: 1021, name: MONSTER_NAMES[1021], type: 'ghost' }
    ]
};

export const TYPE_CHART = {
    fire: { bug: 2.0, grass: 2.0, water: 0.5, rock: 0.5 },
    water: { fire: 2.0, rock: 2.0, grass: 0.5, water: 0.5 },
    grass: { water: 2.0, rock: 2.0, fire: 0.5, bug: 0.5 },
    bug: { grass: 2.0, poison: 2.0, flying: 0.5, fire: 0.5 },
    normal: { rock: 2.0, flying: 2.0, poison: 0.5, ghost: 0 },
    flying: { grass: 2.0, bug: 2.0, rock: 0.5, flying: 0.5 },
    poison: { poison: 0.5, rock: 0.5 },
    rock: { fire: 2.0, flying: 2.0, water: 0.5, water: 0.5 },
    ghost: { normal: 2.0 }
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

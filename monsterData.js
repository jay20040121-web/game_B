// Generated from PokeAPI (zh-Hant)
export const TYPE_MAP = {
    'normal': '普', 'fire': '火', 'water': '水', 'grass': '草', 'electric': '電',
    'ice': '冰', 'fighting': '鬥', 'poison': '毒', 'ground': '地', 'flying': '飛',
    'psychic': '超', 'bug': '蟲', 'rock': '岩', 'ghost': '鬼', 'dragon': '龍',
    'steel': '鋼', 'dark': '惡', 'fairy': '妖'
};

export const NATURE_CONFIG = {
    // 現代版本 Key (English)
    'gentle':     { name: '溫柔', buff: 'hp',  nerf: 'atk', desc: 'HP +10%, 攻擊 -10%' },
    'stubborn':   { name: '固執', buff: 'def', nerf: 'spd', desc: '防禦 +10%, 速度 -10%' },
    'passionate': { name: '熱情', buff: 'atk', nerf: 'def', desc: '攻擊 +10%, 防禦 -10%' },
    'nonsense':   { name: '無俚頭', buff: 'spd', nerf: 'def', desc: '速度 +10%, 防禦 -10%' },
    'rational':   { name: '理性', buff: 'spd', nerf: 'atk', desc: '速度 +10%, 攻擊 -10%' },
    // 舊版兼容性 Alias (Chinese)
    '溫柔': { name: '溫柔', buff: 'hp',  nerf: 'atk' },
    '固執': { name: '固執', buff: 'def', nerf: 'spd' },
    '熱情': { name: '熱情', buff: 'atk', nerf: 'def' },
    '熱血': { name: '熱情', buff: 'atk', nerf: 'def' },
    '無俚頭': { name: '無俚頭', buff: 'spd', nerf: 'def' },
    '搞笑': { name: '無俚頭', buff: 'spd', nerf: 'def' },
    '理性': { name: '理性', buff: 'spd', nerf: 'atk' }
};

export const MONSTER_NAMES = {
    "1": "妙蛙種子",
    "2": "妙蛙草",
    "3": "妙蛙花",
    "4": "小火龍",
    "5": "火恐龍",
    "6": "噴火龍",
    "7": "傑尼龜",
    "8": "卡咪龜",
    "9": "水箭龜",
    "10": "綠毛蟲",
    "11": "鐵甲蛹",
    "12": "巴大蝶",
    "13": "獨角蟲",
    "14": "鐵殼蛹",
    "15": "大針蜂",
    "16": "波波",
    "17": "比比鳥",
    "18": "大比鳥",
    "19": "小拉達",
    "20": "拉達",
    "21": "烈雀",
    "22": "大嘴雀",
    "23": "阿柏蛇",
    "24": "阿柏怪",
    "25": "皮卡丘",
    "26": "雷丘",
    "27": "穿山鼠",
    "28": "穿山王",
    "29": "尼多蘭",
    "30": "尼多娜",
    "31": "尼多后",
    "32": "尼多朗",
    "33": "尼多力諾",
    "34": "尼多王",
    "35": "皮皮",
    "36": "皮可西",
    "37": "六尾",
    "38": "九尾",
    "39": "胖丁",
    "40": "胖可丁",
    "41": "超音蝠",
    "42": "大嘴蝠",
    "43": "走路草",
    "44": "臭臭花",
    "45": "霸王花",
    "46": "派拉斯",
    "47": "派拉斯特",
    "48": "毛球",
    "49": "摩魯蛾",
    "50": "地鼠",
    "51": "三地鼠",
    "52": "喵喵",
    "53": "貓老大",
    "54": "可達鴨",
    "55": "哥達鴨",
    "56": "猴怪",
    "57": "火爆猴",
    "58": "卡蒂狗",
    "59": "風速狗",
    "60": "蚊香蝌蚪",
    "61": "蚊香君",
    "62": "蚊香泳士",
    "63": "凱西",
    "64": "勇基拉",
    "65": "胡地",
    "66": "腕力",
    "67": "豪力",
    "68": "怪力",
    "69": "喇叭芽",
    "70": "口呆花",
    "71": "大食花",
    "72": "瑪瑙水母",
    "73": "毒刺水母",
    "74": "小拳石",
    "75": "隆隆石",
    "76": "隆隆岩",
    "77": "小火馬",
    "78": "烈焰馬",
    "79": "呆呆獸",
    "80": "呆殼獸",
    "81": "小磁怪",
    "82": "三合一磁怪",
    "83": "大蔥鴨",
    "84": "嘟嘟",
    "85": "嘟嘟利",
    "86": "小海獅",
    "87": "白海獅",
    "88": "臭泥",
    "89": "臭臭泥",
    "90": "大舌貝",
    "91": "刺甲貝",
    "92": "鬼斯",
    "93": "鬼斯通",
    "94": "耿鬼",
    "95": "大岩蛇",
    "96": "催眠貘",
    "97": "引夢貘人",
    "98": "大鉗蟹",
    "99": "巨鉗蟹",
    "100": "霹靂電球",
    "101": "頑皮雷彈",
    "102": "蛋蛋",
    "103": "椰蛋樹",
    "104": "卡拉卡拉",
    "105": "嘎啦嘎啦",
    "106": "飛腿郎",
    "107": "快拳郎",
    "108": "大舌頭",
    "109": "瓦斯彈",
    "110": "雙彈瓦斯",
    "111": "獨角犀牛",
    "112": "鑽角犀獸",
    "113": "吉利蛋",
    "114": "蔓藤怪",
    "115": "袋獸",
    "116": "墨海馬",
    "117": "海刺龍",
    "118": "角金魚",
    "119": "金魚王",
    "120": "海星星",
    "121": "寶石海星",
    "122": "魔牆人偶",
    "123": "飛天螳螂",
    "124": "迷唇姐",
    "125": "電擊獸",
    "126": "鴨嘴火獸",
    "127": "凱羅斯",
    "128": "肯泰羅",
    "129": "鯉魚王",
    "130": "暴鯉龍",
    "131": "拉普拉斯",
    "132": "百變怪",
    "133": "伊布",
    "134": "水伊布",
    "135": "雷伊布",
    "136": "火伊布",
    "137": "多邊獸",
    "138": "菊石獸",
    "139": "多刺菊石獸",
    "140": "化石盔",
    "141": "鐮刀盔",
    "142": "化石翼龍",
    "143": "卡比獸",
    "144": "急凍鳥",
    "145": "閃電鳥",
    "146": "火焰鳥",
    "147": "迷你龍",
    "148": "哈克龍",
    "149": "快龍",
    "150": "超夢",
    "151": "夢幻",
    "169": "叉字蝠",
    "249": "洛奇亞",
    "250": "鳳王",
    "384": "烈空坐",
    "979": "棄世猴"
};

export const SPECIES_BASE_STATS = {
    "1": {
        "hp": 45,
        "atk": 65,
        "def": 65,
        "spd": 45,
        "types": [
            "grass",
            "poison"
        ]
    },
    "2": {
        "hp": 60,
        "atk": 80,
        "def": 80,
        "spd": 60,
        "types": [
            "grass",
            "poison"
        ]
    },
    "3": {
        "hp": 80,
        "atk": 100,
        "def": 100,
        "spd": 80,
        "types": [
            "grass",
            "poison"
        ]
    },
    "4": {
        "hp": 39,
        "atk": 60,
        "def": 50,
        "spd": 65,
        "types": [
            "fire"
        ]
    },
    "5": {
        "hp": 58,
        "atk": 80,
        "def": 65,
        "spd": 80,
        "types": [
            "fire"
        ]
    },
    "6": {
        "hp": 78,
        "atk": 109,
        "def": 85,
        "spd": 100,
        "types": [
            "fire",
            "flying"
        ]
    },
    "7": {
        "hp": 44,
        "atk": 50,
        "def": 65,
        "spd": 43,
        "types": [
            "water"
        ]
    },
    "8": {
        "hp": 59,
        "atk": 65,
        "def": 80,
        "spd": 58,
        "types": [
            "water"
        ]
    },
    "9": {
        "hp": 79,
        "atk": 85,
        "def": 105,
        "spd": 78,
        "types": [
            "water"
        ]
    },
    "10": {
        "hp": 45,
        "atk": 30,
        "def": 35,
        "spd": 45,
        "types": [
            "bug"
        ]
    },
    "11": {
        "hp": 50,
        "atk": 25,
        "def": 55,
        "spd": 30,
        "types": [
            "bug"
        ]
    },
    "12": {
        "hp": 60,
        "atk": 90,
        "def": 80,
        "spd": 70,
        "types": [
            "bug",
            "flying"
        ]
    },
    "13": {
        "hp": 40,
        "atk": 35,
        "def": 30,
        "spd": 50,
        "types": [
            "bug",
            "poison"
        ]
    },
    "14": {
        "hp": 45,
        "atk": 25,
        "def": 50,
        "spd": 35,
        "types": [
            "bug",
            "poison"
        ]
    },
    "15": {
        "hp": 65,
        "atk": 90,
        "def": 80,
        "spd": 75,
        "types": [
            "bug",
            "poison"
        ]
    },
    "16": {
        "hp": 40,
        "atk": 45,
        "def": 40,
        "spd": 56,
        "types": [
            "normal",
            "flying"
        ]
    },
    "17": {
        "hp": 63,
        "atk": 60,
        "def": 55,
        "spd": 71,
        "types": [
            "normal",
            "flying"
        ]
    },
    "18": {
        "hp": 83,
        "atk": 80,
        "def": 75,
        "spd": 101,
        "types": [
            "normal",
            "flying"
        ]
    },
    "19": {
        "hp": 30,
        "atk": 56,
        "def": 35,
        "spd": 72,
        "types": [
            "normal"
        ]
    },
    "20": {
        "hp": 55,
        "atk": 81,
        "def": 70,
        "spd": 97,
        "types": [
            "normal"
        ]
    },
    "21": {
        "hp": 40,
        "atk": 60,
        "def": 31,
        "spd": 70,
        "types": [
            "normal",
            "flying"
        ]
    },
    "22": {
        "hp": 65,
        "atk": 90,
        "def": 65,
        "spd": 100,
        "types": [
            "normal",
            "flying"
        ]
    },
    "23": {
        "hp": 35,
        "atk": 60,
        "def": 54,
        "spd": 55,
        "types": [
            "poison"
        ]
    },
    "24": {
        "hp": 60,
        "atk": 95,
        "def": 79,
        "spd": 80,
        "types": [
            "poison"
        ]
    },
    "25": {
        "hp": 35,
        "atk": 55,
        "def": 50,
        "spd": 90,
        "types": [
            "electric"
        ]
    },
    "26": {
        "hp": 60,
        "atk": 90,
        "def": 80,
        "spd": 110,
        "types": [
            "electric"
        ]
    },
    "27": {
        "hp": 50,
        "atk": 75,
        "def": 85,
        "spd": 40,
        "types": [
            "ground"
        ]
    },
    "28": {
        "hp": 75,
        "atk": 100,
        "def": 110,
        "spd": 65,
        "types": [
            "ground"
        ]
    },
    "29": {
        "hp": 55,
        "atk": 47,
        "def": 52,
        "spd": 41,
        "types": [
            "poison"
        ]
    },
    "30": {
        "hp": 70,
        "atk": 62,
        "def": 67,
        "spd": 56,
        "types": [
            "poison"
        ]
    },
    "31": {
        "hp": 90,
        "atk": 92,
        "def": 87,
        "spd": 76,
        "types": [
            "poison",
            "ground"
        ]
    },
    "32": {
        "hp": 46,
        "atk": 57,
        "def": 40,
        "spd": 50,
        "types": [
            "poison"
        ]
    },
    "33": {
        "hp": 61,
        "atk": 72,
        "def": 57,
        "spd": 65,
        "types": [
            "poison"
        ]
    },
    "34": {
        "hp": 81,
        "atk": 102,
        "def": 77,
        "spd": 85,
        "types": [
            "poison",
            "ground"
        ]
    },
    "35": {
        "hp": 70,
        "atk": 60,
        "def": 65,
        "spd": 35,
        "types": [
            "fairy"
        ]
    },
    "36": {
        "hp": 95,
        "atk": 95,
        "def": 90,
        "spd": 60,
        "types": [
            "fairy"
        ]
    },
    "37": {
        "hp": 38,
        "atk": 50,
        "def": 65,
        "spd": 65,
        "types": [
            "fire"
        ]
    },
    "38": {
        "hp": 73,
        "atk": 81,
        "def": 100,
        "spd": 100,
        "types": [
            "fire"
        ]
    },
    "39": {
        "hp": 115,
        "atk": 45,
        "def": 25,
        "spd": 20,
        "types": [
            "normal",
            "fairy"
        ]
    },
    "40": {
        "hp": 140,
        "atk": 85,
        "def": 50,
        "spd": 45,
        "types": [
            "normal",
            "fairy"
        ]
    },
    "41": {
        "hp": 40,
        "atk": 45,
        "def": 40,
        "spd": 55,
        "types": [
            "poison",
            "flying"
        ]
    },
    "42": {
        "hp": 75,
        "atk": 80,
        "def": 75,
        "spd": 90,
        "types": [
            "poison",
            "flying"
        ]
    },
    "43": {
        "hp": 45,
        "atk": 75,
        "def": 65,
        "spd": 30,
        "types": [
            "grass",
            "poison"
        ]
    },
    "44": {
        "hp": 60,
        "atk": 85,
        "def": 75,
        "spd": 40,
        "types": [
            "grass",
            "poison"
        ]
    },
    "45": {
        "hp": 75,
        "atk": 110,
        "def": 90,
        "spd": 50,
        "types": [
            "grass",
            "poison"
        ]
    },
    "46": {
        "hp": 35,
        "atk": 70,
        "def": 55,
        "spd": 25,
        "types": [
            "bug",
            "grass"
        ]
    },
    "47": {
        "hp": 60,
        "atk": 95,
        "def": 80,
        "spd": 30,
        "types": [
            "bug",
            "grass"
        ]
    },
    "48": {
        "hp": 60,
        "atk": 55,
        "def": 55,
        "spd": 45,
        "types": [
            "bug",
            "poison"
        ]
    },
    "49": {
        "hp": 70,
        "atk": 90,
        "def": 75,
        "spd": 90,
        "types": [
            "bug",
            "poison"
        ]
    },
    "50": {
        "hp": 10,
        "atk": 55,
        "def": 45,
        "spd": 95,
        "types": [
            "ground"
        ]
    },
    "51": {
        "hp": 35,
        "atk": 100,
        "def": 70,
        "spd": 120,
        "types": [
            "ground"
        ]
    },
    "52": {
        "hp": 40,
        "atk": 45,
        "def": 40,
        "spd": 90,
        "types": [
            "normal"
        ]
    },
    "53": {
        "hp": 65,
        "atk": 70,
        "def": 65,
        "spd": 115,
        "types": [
            "normal"
        ]
    },
    "54": {
        "hp": 50,
        "atk": 65,
        "def": 50,
        "spd": 55,
        "types": [
            "water"
        ]
    },
    "55": {
        "hp": 80,
        "atk": 95,
        "def": 80,
        "spd": 85,
        "types": [
            "water"
        ]
    },
    "56": {
        "hp": 40,
        "atk": 80,
        "def": 45,
        "spd": 70,
        "types": [
            "fighting"
        ]
    },
    "57": {
        "hp": 65,
        "atk": 105,
        "def": 70,
        "spd": 95,
        "types": [
            "fighting"
        ]
    },
    "58": {
        "hp": 55,
        "atk": 70,
        "def": 50,
        "spd": 60,
        "types": [
            "fire"
        ]
    },
    "59": {
        "hp": 90,
        "atk": 110,
        "def": 80,
        "spd": 95,
        "types": [
            "fire"
        ]
    },
    "60": {
        "hp": 40,
        "atk": 50,
        "def": 40,
        "spd": 90,
        "types": [
            "water"
        ]
    },
    "61": {
        "hp": 65,
        "atk": 65,
        "def": 65,
        "spd": 90,
        "types": [
            "water"
        ]
    },
    "62": {
        "hp": 90,
        "atk": 95,
        "def": 95,
        "spd": 70,
        "types": [
            "water",
            "fighting"
        ]
    },
    "63": {
        "hp": 25,
        "atk": 105,
        "def": 55,
        "spd": 90,
        "types": [
            "psychic"
        ]
    },
    "64": {
        "hp": 40,
        "atk": 120,
        "def": 70,
        "spd": 105,
        "types": [
            "psychic"
        ]
    },
    "65": {
        "hp": 55,
        "atk": 135,
        "def": 95,
        "spd": 120,
        "types": [
            "psychic"
        ]
    },
    "66": {
        "hp": 70,
        "atk": 80,
        "def": 50,
        "spd": 35,
        "types": [
            "fighting"
        ]
    },
    "67": {
        "hp": 80,
        "atk": 100,
        "def": 70,
        "spd": 45,
        "types": [
            "fighting"
        ]
    },
    "68": {
        "hp": 90,
        "atk": 130,
        "def": 85,
        "spd": 55,
        "types": [
            "fighting"
        ]
    },
    "69": {
        "hp": 50,
        "atk": 75,
        "def": 35,
        "spd": 40,
        "types": [
            "grass",
            "poison"
        ]
    },
    "70": {
        "hp": 65,
        "atk": 90,
        "def": 50,
        "spd": 55,
        "types": [
            "grass",
            "poison"
        ]
    },
    "71": {
        "hp": 80,
        "atk": 105,
        "def": 70,
        "spd": 70,
        "types": [
            "grass",
            "poison"
        ]
    },
    "72": {
        "hp": 40,
        "atk": 50,
        "def": 100,
        "spd": 70,
        "types": [
            "water",
            "poison"
        ]
    },
    "73": {
        "hp": 80,
        "atk": 80,
        "def": 120,
        "spd": 100,
        "types": [
            "water",
            "poison"
        ]
    },
    "74": {
        "hp": 40,
        "atk": 80,
        "def": 100,
        "spd": 20,
        "types": [
            "rock",
            "ground"
        ]
    },
    "75": {
        "hp": 55,
        "atk": 95,
        "def": 115,
        "spd": 35,
        "types": [
            "rock",
            "ground"
        ]
    },
    "76": {
        "hp": 80,
        "atk": 120,
        "def": 130,
        "spd": 45,
        "types": [
            "rock",
            "ground"
        ]
    },
    "77": {
        "hp": 50,
        "atk": 85,
        "def": 65,
        "spd": 90,
        "types": [
            "fire"
        ]
    },
    "78": {
        "hp": 65,
        "atk": 100,
        "def": 80,
        "spd": 105,
        "types": [
            "fire"
        ]
    },
    "79": {
        "hp": 90,
        "atk": 65,
        "def": 65,
        "spd": 15,
        "types": [
            "water",
            "psychic"
        ]
    },
    "80": {
        "hp": 95,
        "atk": 100,
        "def": 110,
        "spd": 30,
        "types": [
            "water",
            "psychic"
        ]
    },
    "81": {
        "hp": 25,
        "atk": 95,
        "def": 70,
        "spd": 45,
        "types": [
            "electric",
            "steel"
        ]
    },
    "82": {
        "hp": 50,
        "atk": 120,
        "def": 95,
        "spd": 70,
        "types": [
            "electric",
            "steel"
        ]
    },
    "83": {
        "hp": 52,
        "atk": 90,
        "def": 62,
        "spd": 60,
        "types": [
            "normal",
            "flying"
        ]
    },
    "84": {
        "hp": 35,
        "atk": 85,
        "def": 45,
        "spd": 75,
        "types": [
            "normal",
            "flying"
        ]
    },
    "85": {
        "hp": 60,
        "atk": 110,
        "def": 70,
        "spd": 110,
        "types": [
            "normal",
            "flying"
        ]
    },
    "86": {
        "hp": 65,
        "atk": 45,
        "def": 70,
        "spd": 45,
        "types": [
            "water"
        ]
    },
    "87": {
        "hp": 90,
        "atk": 70,
        "def": 95,
        "spd": 70,
        "types": [
            "water",
            "ice"
        ]
    },
    "88": {
        "hp": 80,
        "atk": 80,
        "def": 50,
        "spd": 25,
        "types": [
            "poison"
        ]
    },
    "89": {
        "hp": 105,
        "atk": 105,
        "def": 100,
        "spd": 50,
        "types": [
            "poison"
        ]
    },
    "90": {
        "hp": 30,
        "atk": 65,
        "def": 100,
        "spd": 40,
        "types": [
            "water"
        ]
    },
    "91": {
        "hp": 50,
        "atk": 95,
        "def": 180,
        "spd": 70,
        "types": [
            "water",
            "ice"
        ]
    },
    "92": {
        "hp": 30,
        "atk": 100,
        "def": 35,
        "spd": 80,
        "types": [
            "ghost",
            "poison"
        ]
    },
    "93": {
        "hp": 45,
        "atk": 115,
        "def": 55,
        "spd": 95,
        "types": [
            "ghost",
            "poison"
        ]
    },
    "94": {
        "hp": 60,
        "atk": 130,
        "def": 75,
        "spd": 110,
        "types": [
            "ghost",
            "poison"
        ]
    },
    "95": {
        "hp": 35,
        "atk": 45,
        "def": 160,
        "spd": 70,
        "types": [
            "rock",
            "ground"
        ]
    },
    "96": {
        "hp": 60,
        "atk": 48,
        "def": 90,
        "spd": 42,
        "types": [
            "psychic"
        ]
    },
    "97": {
        "hp": 85,
        "atk": 73,
        "def": 115,
        "spd": 67,
        "types": [
            "psychic"
        ]
    },
    "98": {
        "hp": 30,
        "atk": 105,
        "def": 90,
        "spd": 50,
        "types": [
            "water"
        ]
    },
    "99": {
        "hp": 55,
        "atk": 130,
        "def": 115,
        "spd": 75,
        "types": [
            "water"
        ]
    },
    "100": {
        "hp": 40,
        "atk": 55,
        "def": 55,
        "spd": 100,
        "types": [
            "electric"
        ]
    },
    "101": {
        "hp": 60,
        "atk": 80,
        "def": 80,
        "spd": 150,
        "types": [
            "electric"
        ]
    },
    "102": {
        "hp": 60,
        "atk": 60,
        "def": 80,
        "spd": 40,
        "types": [
            "grass",
            "psychic"
        ]
    },
    "103": {
        "hp": 95,
        "atk": 125,
        "def": 85,
        "spd": 55,
        "types": [
            "grass",
            "psychic"
        ]
    },
    "104": {
        "hp": 50,
        "atk": 50,
        "def": 95,
        "spd": 35,
        "types": [
            "ground"
        ]
    },
    "105": {
        "hp": 60,
        "atk": 80,
        "def": 110,
        "spd": 45,
        "types": [
            "ground"
        ]
    },
    "106": {
        "hp": 50,
        "atk": 120,
        "def": 110,
        "spd": 87,
        "types": [
            "fighting"
        ]
    },
    "107": {
        "hp": 50,
        "atk": 105,
        "def": 110,
        "spd": 76,
        "types": [
            "fighting"
        ]
    },
    "108": {
        "hp": 90,
        "atk": 60,
        "def": 75,
        "spd": 30,
        "types": [
            "normal"
        ]
    },
    "109": {
        "hp": 40,
        "atk": 65,
        "def": 95,
        "spd": 35,
        "types": [
            "poison"
        ]
    },
    "110": {
        "hp": 65,
        "atk": 90,
        "def": 120,
        "spd": 60,
        "types": [
            "poison"
        ]
    },
    "111": {
        "hp": 80,
        "atk": 85,
        "def": 95,
        "spd": 25,
        "types": [
            "ground",
            "rock"
        ]
    },
    "112": {
        "hp": 105,
        "atk": 130,
        "def": 120,
        "spd": 40,
        "types": [
            "ground",
            "rock"
        ]
    },
    "113": {
        "hp": 250,
        "atk": 35,
        "def": 105,
        "spd": 50,
        "types": [
            "normal"
        ]
    },
    "114": {
        "hp": 65,
        "atk": 100,
        "def": 115,
        "spd": 60,
        "types": [
            "grass"
        ]
    },
    "115": {
        "hp": 105,
        "atk": 95,
        "def": 80,
        "spd": 90,
        "types": [
            "normal"
        ]
    },
    "116": {
        "hp": 30,
        "atk": 70,
        "def": 70,
        "spd": 60,
        "types": [
            "water"
        ]
    },
    "117": {
        "hp": 55,
        "atk": 95,
        "def": 95,
        "spd": 85,
        "types": [
            "water"
        ]
    },
    "118": {
        "hp": 45,
        "atk": 67,
        "def": 60,
        "spd": 63,
        "types": [
            "water"
        ]
    },
    "119": {
        "hp": 80,
        "atk": 92,
        "def": 80,
        "spd": 68,
        "types": [
            "water"
        ]
    },
    "120": {
        "hp": 30,
        "atk": 70,
        "def": 55,
        "spd": 85,
        "types": [
            "water"
        ]
    },
    "121": {
        "hp": 60,
        "atk": 100,
        "def": 85,
        "spd": 115,
        "types": [
            "water",
            "psychic"
        ]
    },
    "122": {
        "hp": 40,
        "atk": 100,
        "def": 120,
        "spd": 90,
        "types": [
            "psychic",
            "fairy"
        ]
    },
    "123": {
        "hp": 70,
        "atk": 110,
        "def": 80,
        "spd": 105,
        "types": [
            "bug",
            "flying"
        ]
    },
    "124": {
        "hp": 65,
        "atk": 115,
        "def": 95,
        "spd": 95,
        "types": [
            "ice",
            "psychic"
        ]
    },
    "125": {
        "hp": 65,
        "atk": 95,
        "def": 85,
        "spd": 105,
        "types": [
            "electric"
        ]
    },
    "126": {
        "hp": 65,
        "atk": 100,
        "def": 85,
        "spd": 93,
        "types": [
            "fire"
        ]
    },
    "127": {
        "hp": 65,
        "atk": 125,
        "def": 100,
        "spd": 85,
        "types": [
            "bug"
        ]
    },
    "128": {
        "hp": 75,
        "atk": 100,
        "def": 95,
        "spd": 110,
        "types": [
            "normal"
        ]
    },
    "129": {
        "hp": 20,
        "atk": 15,
        "def": 55,
        "spd": 80,
        "types": [
            "water"
        ]
    },
    "130": {
        "hp": 95,
        "atk": 125,
        "def": 100,
        "spd": 81,
        "types": [
            "water",
            "flying"
        ]
    },
    "131": {
        "hp": 130,
        "atk": 85,
        "def": 95,
        "spd": 60,
        "types": [
            "water",
            "ice"
        ]
    },
    "132": {
        "hp": 48,
        "atk": 48,
        "def": 48,
        "spd": 48,
        "types": [
            "normal"
        ]
    },
    "133": {
        "hp": 55,
        "atk": 55,
        "def": 65,
        "spd": 55,
        "types": [
            "normal"
        ]
    },
    "134": {
        "hp": 130,
        "atk": 110,
        "def": 95,
        "spd": 65,
        "types": [
            "water"
        ]
    },
    "135": {
        "hp": 65,
        "atk": 110,
        "def": 95,
        "spd": 130,
        "types": [
            "electric"
        ]
    },
    "136": {
        "hp": 65,
        "atk": 130,
        "def": 110,
        "spd": 65,
        "types": [
            "fire"
        ]
    },
    "137": {
        "hp": 65,
        "atk": 85,
        "def": 75,
        "spd": 40,
        "types": [
            "normal"
        ]
    },
    "138": {
        "hp": 35,
        "atk": 90,
        "def": 100,
        "spd": 35,
        "types": [
            "rock",
            "water"
        ]
    },
    "139": {
        "hp": 70,
        "atk": 115,
        "def": 125,
        "spd": 55,
        "types": [
            "rock",
            "water"
        ]
    },
    "140": {
        "hp": 30,
        "atk": 80,
        "def": 90,
        "spd": 55,
        "types": [
            "rock",
            "water"
        ]
    },
    "141": {
        "hp": 60,
        "atk": 115,
        "def": 105,
        "spd": 80,
        "types": [
            "rock",
            "water"
        ]
    },
    "142": {
        "hp": 80,
        "atk": 105,
        "def": 75,
        "spd": 130,
        "types": [
            "rock",
            "flying"
        ]
    },
    "143": {
        "hp": 160,
        "atk": 110,
        "def": 110,
        "spd": 30,
        "types": [
            "normal"
        ]
    },
    "144": {
        "hp": 90,
        "atk": 95,
        "def": 125,
        "spd": 85,
        "types": [
            "ice",
            "flying"
        ]
    },
    "145": {
        "hp": 90,
        "atk": 125,
        "def": 90,
        "spd": 100,
        "types": [
            "electric",
            "flying"
        ]
    },
    "146": {
        "hp": 90,
        "atk": 125,
        "def": 90,
        "spd": 90,
        "types": [
            "fire",
            "flying"
        ]
    },
    "147": {
        "hp": 41,
        "atk": 64,
        "def": 50,
        "spd": 50,
        "types": [
            "dragon"
        ]
    },
    "148": {
        "hp": 61,
        "atk": 84,
        "def": 70,
        "spd": 70,
        "types": [
            "dragon"
        ]
    },
    "149": {
        "hp": 91,
        "atk": 134,
        "def": 100,
        "spd": 80,
        "types": [
            "dragon",
            "flying"
        ]
    },
    "150": {
        "hp": 106,
        "atk": 154,
        "def": 90,
        "spd": 130,
        "types": [
            "psychic"
        ]
    },
    "151": {
        "hp": 100,
        "atk": 100,
        "def": 100,
        "spd": 100,
        "types": [
            "psychic"
        ]
    },
    "169": {
        "hp": 85,
        "atk": 90,
        "def": 80,
        "spd": 130,
        "types": [
            "poison",
            "flying"
        ]
    },
    "249": {
        "hp": 106,
        "atk": 90,
        "def": 154,
        "spd": 110,
        "types": [
            "psychic",
            "flying"
        ]
    },
    "250": {
        "hp": 106,
        "atk": 130,
        "def": 154,
        "spd": 90,
        "types": [
            "fire",
            "flying"
        ]
    },
    "384": {
        "hp": 105,
        "atk": 150,
        "def": 90,
        "spd": 95,
        "types": [
            "dragon",
            "flying"
        ]
    },
    "979": {
        "hp": 110,
        "atk": 115,
        "def": 90,
        "spd": 90,
        "types": [
            "fighting",
            "ghost"
        ]
    }
};


// --- 技能與其它遊戲參數控制區 ---

export const SKILL_DATABASE = {
    // Normal
    tackle: { id: 'tackle', name: '撞擊', type: 'normal', power: 40 },
    quick_attack: { id: 'quick_attack', name: '電光一閃', type: 'normal', power: 40, priority: 1 },
    take_down: { id: 'take_down', name: '猛撞', type: 'normal', power: 90, recoil: 0.25 },
    hyper_beam: { id: 'hyper_beam', name: '破壞光線', type: 'normal', power: 150 },
    
    // Fire
    ember: { id: 'ember', name: '火花', type: 'fire', power: 40 },
    fire_fang: { id: 'fire_fang', name: '火焰牙', type: 'fire', power: 65 },
    flamethrower: { id: 'flamethrower', name: '噴射火焰', type: 'fire', power: 90 },
    fire_blast: { id: 'fire_blast', name: '大字爆炎', type: 'fire', power: 110 },
    
    // Water
    water_gun: { id: 'water_gun', name: '水槍', type: 'water', power: 40 },
    bubble_beam: { id: 'bubble_beam', name: '泡沫光線', type: 'water', power: 65 },
    surf: { id: 'surf', name: '衝浪', type: 'water', power: 90 },
    hydro_pump: { id: 'hydro_pump', name: '水炮', type: 'water', power: 110 },
    
    // Grass
    vine_whip: { id: 'vine_whip', name: '藤鞭', type: 'grass', power: 45 },
    razor_leaf: { id: 'razor_leaf', name: '飛葉快刀', type: 'grass', power: 55 },
    energy_ball: { id: 'energy_ball', name: '能量球', type: 'grass', power: 90 },
    solar_beam: { id: 'solar_beam', name: '日光束', type: 'grass', power: 120 },
    
    // Bug
    bug_bite: { id: 'bug_bite', name: '蟲咬', type: 'bug', power: 60 },
    signal_beam: { id: 'signal_beam', name: '信號光束', type: 'bug', power: 75 },
    x_scissor: { id: 'x_scissor', name: '十字剪', type: 'bug', power: 80 },
    megahorn: { id: 'megahorn', name: '超級角擊', type: 'bug', power: 120 },

    // Flying
    peck: { id: 'peck', name: '啄', type: 'flying', power: 35 },
    wing_attack: { id: 'wing_attack', name: '翅膀攻擊', type: 'flying', power: 60 },
    air_slash: { id: 'air_slash', name: '空氣斬', type: 'flying', power: 75 },
    brave_bird: { id: 'brave_bird', name: '勇鳥猛攻', type: 'flying', power: 120, recoil: 0.33 },

    // Poison
    poison_sting: { id: 'poison_sting', name: '毒針', type: 'poison', power: 15 },
    acid: { id: 'acid', name: '溶解液', type: 'poison', power: 40 },
    sludge_bomb: { id: 'sludge_bomb', name: '污泥炸彈', type: 'poison', power: 90 },
    gunk_shot: { id: 'gunk_shot', name: '垃圾射擊', type: 'poison', power: 120 },

    // Ground
    mud_slap: { id: 'mud_slap', name: '擲泥', type: 'ground', power: 20 },
    mud_shot: { id: 'mud_shot', name: '泥巴射擊', type: 'ground', power: 55 },
    earth_power: { id: 'earth_power', name: '大地之力', type: 'ground', power: 90 },
    earthquake: { id: 'earthquake', name: '地震', type: 'ground', power: 100 },

    // Rock
    rock_throw: { id: 'rock_throw', name: '落石', type: 'rock', power: 50 },
    rock_tomb: { id: 'rock_tomb', name: '岩石封鎖', type: 'rock', power: 60 },
    rock_slide: { id: 'rock_slide', name: '岩崩', type: 'rock', power: 75 },
    stone_edge: { id: 'stone_edge', name: '尖石攻擊', type: 'rock', power: 100 },

    // Fighting
    mach_punch: { id: 'mach_punch', name: '音速拳', type: 'fighting', power: 40, priority: 1 },
    karate_chop: { id: 'karate_chop', name: '空手劈', type: 'fighting', power: 50 },
    cross_chop: { id: 'cross_chop', name: '十字劈', type: 'fighting', power: 100 },
    close_combat: { id: 'close_combat', name: '近身戰', type: 'fighting', power: 120 },

    // Psychic
    confusion: { id: 'confusion', name: '念力', type: 'psychic', power: 50 },
    psybeam: { id: 'psybeam', name: '幻象光線', type: 'psychic', power: 65 },
    psychic_attack: { id: 'psychic_attack', name: '精神強念', type: 'psychic', power: 90 },
    future_sight: { id: 'future_sight', name: '預知未來', type: 'psychic', power: 120 },

    // Ghost
    lick: { id: 'lick', name: '舌舔', type: 'ghost', power: 45 },
    shadow_ball: { id: 'shadow_ball', name: '暗影球', type: 'ghost', power: 80 },
    
    // Dragon
    twister: { id: 'twister', name: '龍捲風', type: 'dragon', power: 40 },
    dragon_pulse: { id: 'dragon_pulse', name: '龍之波動', type: 'dragon', power: 85 },
    outrage: { id: 'outrage', name: '逆鱗', type: 'dragon', power: 120 },

    // Electric
    thunder_shock: { id: 'thunder_shock', name: '電擊', type: 'electric', power: 40 },
    thunderbolt: { id: 'thunderbolt', name: '十萬伏特', type: 'electric', power: 90 },
    thunder: { id: 'thunder', name: '打雷', type: 'electric', power: 110 },

    // Ice
    powder_snow: { id: 'powder_snow', name: '細雪', type: 'ice', power: 40 },
    ice_beam: { id: 'ice_beam', name: '冰凍光束', type: 'ice', power: 90 },
    blizzard: { id: 'blizzard', name: '暴風雪', type: 'ice', power: 110 }
};

export const TYPE_SKILLS = {
    normal: ['tackle', 'quick_attack', 'take_down', 'hyper_beam'],
    fire: ['ember', 'fire_fang', 'flamethrower', 'fire_blast'],
    water: ['water_gun', 'bubble_beam', 'surf', 'hydro_pump'],
    grass: ['vine_whip', 'razor_leaf', 'energy_ball', 'solar_beam'],
    bug: ['bug_bite', 'signal_beam', 'x_scissor', 'megahorn'],
    flying: ['peck', 'wing_attack', 'air_slash', 'brave_bird'],
    poison: ['poison_sting', 'acid', 'sludge_bomb', 'gunk_shot'],
    ground: ['mud_slap', 'mud_shot', 'earth_power', 'earthquake'],
    rock: ['rock_throw', 'rock_tomb', 'rock_slide', 'stone_edge'],
    fighting: ['mach_punch', 'karate_chop', 'cross_chop', 'close_combat'],
    psychic: ['confusion', 'psybeam', 'psychic_attack', 'future_sight'],
    ghost: ['lick', 'shadow_ball'],
    dragon: ['twister', 'dragon_pulse', 'outrage'],
    electric: ['thunder_shock', 'thunderbolt', 'thunder'],
    ice: ['powder_snow', 'ice_beam', 'blizzard']
};

export const ADV_WILD_POOL = [
    { id: 16, name: "波波", weight: 20, power: 90, type: "flying" },
    { id: 23, name: "阿柏蛇", weight: 15, power: 110, type: "poison" },
    { id: 27, name: "穿山鼠", weight: 15, power: 120, type: "ground" },
    { id: 41, name: "超音蝠", weight: 15, power: 105, type: "poison" },
    { id: 56, name: "猴怪", weight: 15, power: 150, type: "fighting" },
    { id: 74, name: "小拳石", weight: 10, power: 80, type: "rock" },
    { id: 60, name: "蚊香蝌蚪", weight: 10, power: 82, type: "water" }
];

export const WILD_EVOLUTION_MAP = {
    "16": 17, "17": 18,  // 波波線
    "23": 24,           // 阿柏蛇線
    "27": 28,           // 穿山鼠線
    "41": 42, "42": 169, // 超音蝠線
    "56": 57, "57": 979, // 猴怪線
    "74": 75, "75": 76,  // 小拳石線
    "60": 61, "61": 62   // 蚊香蝌蚪線
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

// --- Helper Functions ---

/**
 * 計算屬性加乘 (支援雙屬性防禦)
 * @param {string} atkType 攻擊方技能屬性
 * @param {string | string[]} defTypes 防禦方屬性（單屬性或雙屬性陣列）
 * @returns {number} 倍率
 */
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

/**
 * 核心傷害計算公式 (已從 App.js 抽離)
 */
export const calculateDamage = (atk, def, power, multiplier = 1.0) => {
    const baseDamage = (atk / def) * power * 0.5;
    const finalDamage = Math.max(1, Math.floor(baseDamage * multiplier * (0.9 + Math.random() * 0.2)));
    return finalDamage;
};

export const generateMoves = (stage, types, forcedBonusId = null) => {
    const speciesTypes = Array.isArray(types) ? types : [types];
    const movePool = [];
    
    speciesTypes.forEach(t => {
        const ids = TYPE_SKILLS[t] || TYPE_SKILLS['normal'];
        movePool.push(...ids);
    });
    
    const getEarlyBonus = () => {
        if (forcedBonusId && SKILL_DATABASE[forcedBonusId]) return SKILL_DATABASE[forcedBonusId];
        return null; 
    };

    if (stage <= 1) {
        const primaryTypeMove = SKILL_DATABASE[TYPE_SKILLS[speciesTypes[0]]?.[0]] || SKILL_DATABASE.tackle;
        return [primaryTypeMove, getEarlyBonus()].filter(Boolean);
    }

    let selectedIds = [];
    if (stage === 2) selectedIds = ['tackle', movePool[0]];
    else if (stage === 3) selectedIds = ['tackle', movePool[0], movePool[1] || movePool[0]];
    else selectedIds = movePool.slice(0, 4);

    const uniqueMoves = Array.from(new Set(selectedIds)).map(id => SKILL_DATABASE[id]).filter(Boolean);
    return uniqueMoves.slice(0, 4);
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

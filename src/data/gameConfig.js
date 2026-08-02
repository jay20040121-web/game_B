const apiKey = "";
const modelName = "gemini-2.5-flash-preview-09-2025";

const PHYSICS = {
    FLOAT_SPEED: 0.36,
    BOUNCE_DAMPING: 0.98,
    MAX_VELOCITY: 7.0,
};


// 已遷移至 src/data/evolutionConfig.js
// const EVOLUTION_TIME = ...


// 寵物話語罐頭詞庫 (V1 - 依 lockedAffinity 分類)
const DIARY_MESSAGES_TEMPLATE = {
    fire: ["今天練很多！我越來越強了！朝著頂端衝吧！", "感覺燃燒起來了，明天還要更猛！", "跟你在一起，每天都很充實！"],
    water: ["今天悄悄觀察你很久了，你有注意到嗎？", "平靜的一天...但你在的話就夠了。", "謝謝今天陪我游過那條小溪。"],
    grass: ["大地給了我力量，你也是。", "今天的陽光很好，希望你也過得好。", "有你陪著，連休息都覺得特別安心。"],
    bug: ["嘿，我在想一件事，但說不出口...算了！", "今天偷偷守護你了！你不知道吧？", "硬殼雖然厚，但心裡還是有點癢癢的。"],
    default: ["今天也是謝謝你陪伴我的一天。", "不管發生什麼，只要有你在就好了。", "一起加油吧，明天也是新的開始！"]
};

// 取得寵物每日話語（未來替換成 AI 呼叫）
const getPetDailyMessage = (affinity) => {
    const pool = DIARY_MESSAGES_TEMPLATE[affinity] || DIARY_MESSAGES_TEMPLATE.default;
    return pool[Math.floor(Math.random() * pool.length)];
};

// 日記獨立存檔 key（不受 SAVE_VERSION 重置影響）
const DIARY_STORAGE_KEY = 'pixel_monster_diary';

const loadDiaryData = () => {
    try {
        const str = localStorage.getItem(DIARY_STORAGE_KEY);
        return str ? JSON.parse(str) : {};
    } catch (e) { return {}; }
};

const saveDiaryData = (diary) => {
    try {
        // 僅保留最近 30 天
        const keys = Object.keys(diary).sort();
        if (keys.length > 30) {
            keys.slice(0, keys.length - 30).forEach(k => delete diary[k]);
        }
        localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(diary));
    } catch (e) { }
};

import { getTypeMultiplier } from '../monsterData';

const ADV_BATTLE_RULES = {
    BASE_HP: 100, BASE_ATK: 10, BASE_DEF: 10, BASE_SPD: 1,
    HIT_RATE: 0.9,
    CD_MS: 1000, // 1秒
    STAGE_MULT: { 0: 0.5, 1: 1.0, 2: 1.5, 3: 2.5, 4: 4.0, 5: 6.0, 6: 10.0 }
};

// 智慧招式 AI：根據屬性相剋與威力選擇最佳招式
const getSmartMove = (attacker, defender, moves) => {
    const validMoves = (moves || []).filter(m => m && typeof m === 'object');
    if (validMoves.length === 0) return { name: '撞擊', power: 40, type: 'normal' };
    if (validMoves.length === 1) return validMoves[0];

    let bestMove = validMoves[0];
    let maxScore = -1;

    for (const move of validMoves) {
        const movePower = move.power || 0;
        const moveType = move.type || 'normal';
        const defenderType = defender.type || ['normal'];

        // 取得屬性相剋倍率 (確認此處 moveType 為攻擊方，defenderType 為防禦方)
        const realMult = typeof getTypeMultiplier !== "undefined" ? getTypeMultiplier(moveType, defenderType) : 1;

        let score = 0;

        if (movePower > 0) {
            // 1. 威力權重分配 (根據需求優先級：80 > 60 > 40 > 100+)
            let pScore = 0;
            if (movePower >= 100) pScore = 10;      // 100以上威力大但常有副作用，優先級設為最低
            else if (movePower >= 80) pScore = 40;  // 80 為理想最強招
            else if (movePower >= 60) pScore = 30;
            else if (movePower >= 40) pScore = 20;
            else pScore = 5;

            // 2. 屬性克制優先 (Rule: 屬性克制時優先使用屬性克制的招式)
            if (realMult > 1) {
                // 克制時給予 1000 級距的加分，確保優於所有非克制招式
                score = 1000 + pScore;
            } else if (realMult === 0) {
                // 完全無效則不考慮
                score = 0;
            } else if (realMult < 1) {
                // 效果不好時，分數大幅降低，但仍高於 BUFF (級距 10)
                score = 10 + pScore * 0.1;
            } else {
                // 一般情況 (級距 100)
                score = 100 + pScore;
            }
        } else {
            // 3. 威力=0 是 BUFF 招式，優先級放在最後 (級距 1)
            score = 1;

            // 檢查能力值上限：如果該技能是自我強化且對應屬性已達 +6，則不重複使用
            if (move.stat_changes && attacker.statStages) {
                const isRedundant = move.stat_changes.some(sc => {
                    const isSelfBuff = (move.stat_target === 'self' || !move.stat_target);
                    if (isSelfBuff && sc.change > 0) {
                        return (attacker.statStages[sc.stat] || 0) >= 6;
                    }
                    return false;
                });
                if (isRedundant) score = 0;
            }
        }

        // 更新最佳招式
        if (score > maxScore) {
            maxScore = score;
            bestMove = move;
        } else if (score === maxScore && score > 0) {
            // 同分時隨機選擇 (50% 機率切換)
            if (Math.random() < 0.5) {
                bestMove = move;
            }
        }
    }
    return bestMove;
};

// ==========================================
// 模組 1：40 題完美平衡對話庫
// ==========================================
const RAW_Q_DATA = [
    ["你比較喜歡哪一種天氣？", "大太陽！熱血地奔跑吧！", "fire", "聽著下雨聲，感覺很平靜。", "water", "躲在安全的洞窟裡最好！", "bug"],
    ["今天探險想去哪裡玩呢？", "去小溪邊溫柔地踩踩水。", "water", "去森林深處尋找大樹！", "grass", "去挖一個超深的泥巴洞！", "bug"],
    ["惹你生氣了該怎麼辦好？", "陪我坐在草地上發呆吧。", "grass", "請我吃超辣的火爆餅乾！", "fire", "吐一大堆泡泡不理你了。", "water"],
    ["肚子好餓喔，晚餐吃啥？", "大火烤得劈啪響的烤肉！", "fire", "嚼嚼地上的硬土塊就好！", "bug", "營養均衡的翠綠蔬菜沙拉", "grass"],
    ["看到別人哭泣你會怎樣？", "給他暖爐般熱熱的擁抱。", "fire", "遞給他一片葉子擦眼淚。", "grass", "用硬殼幫他擋住壞事！", "bug"],
    ["遇到很寬的河該怎麼辦？", "踩著荷葉熱血衝過去！", "grass", "死命用火把水全蒸發！", "fire", "冷靜尋找堅固樹幹當橋。", "grass"],
    ["突然下大雨沒傘怎麼辦？", "太好了！在雨中跳舞吧！", "water", "找一片大荷葉溫柔撐傘。", "grass", "鑽進地洞裡死都不出來。", "bug"],
    ["晚上睡不著時會做什麼？", "看著營火，聽柴火聲音。", "fire", "冷靜觀察蟲蟲爬行路線。", "bug", "在水裡吐泡泡數數看。", "water"],
    ["想學會哪一種新魔法呢？", "讓枯花綻放的溫柔魔法。", "grass", "噴出超帥氣的七彩火球！", "fire", "變成甲蟲偷偷聽人講話。", "bug"],
    ["發現一個鎖住的寶箱！", "用銳利草葉冷靜地割開。", "grass", "不管啦！用大火燒開它！", "fire", "我要咬著硬殼把它撞開！", "bug"],
    ["遇到超強的壞人怎麼辦？", "用烈焰跟他硬拼到底！", "fire", "縮進硬殼裡，絕對不退！", "bug", "裝死變成一根漂流草。", "water"],
    ["收到什麼禮物最開心呀？", "裝滿清澈泉水的小瓶子。", "water", "仔細記錄植物的百科書。", "grass", "會噴出火花的搞笑玩具！", "fire"],
    ["覺得自己最大的優點是？", "像流水一樣包容溫柔。", "water", "堅持到底的堅硬外殼！", "bug", "無限生長頑強的雜草！", "grass"],
    ["在森林裡迷路了怎麼辦？", "爬到高樹冷靜觀察地形。", "grass", "跟著地上的螞蟻隊伍走！", "bug", "點燃火把溫柔引導別人。", "fire"],
    ["最喜歡的休息動作是？", "躺在軟綿綿草地大放鬆。", "grass", "泡在冷水裡面冷靜思考。", "water", "把自己埋土裡露出一顆頭", "bug"],
    ["我看起來很累時你會？", "摘新鮮果實幫你補體力。", "grass", "一直潑你水讓你清醒！", "water", "帶你去鬆軟泥土裡躺躺。", "bug"],
    ["如果有一座秘密基地？", "長滿各種奇花異草的花園", "grass", "地底深處的堅固蟲巢。", "bug", "一定要有沸騰的溫泉！", "fire"],
    ["被誤會了會怎麼反應呢？", "冷靜分析，把話說清楚。", "water", "氣到冒火，死也要道歉！", "fire", "拿樹葉遮住臉不想理人。", "grass"],
    ["看見流星會許什麼願望？", "希望能去深海大探險！", "water", "希望能有吃不完的泥巴。", "bug", "希望大家都像大樹般健康", "grass"],
    ["如果明天是世界末日？", "燃燒生命痛快大玩一場！", "fire", "死命躲避進最深的水底。", "water", "嚼著硬殼冷靜面對一切。", "bug"],
    ["你最喜歡聽哪一種故事？", "熱血沸騰的火山傳說！", "fire", "大樹精靈的溫柔童話。", "grass", "蟲蟲統治世界的漫畫！", "bug"],
    ["發現一顆奇怪的蛋？", "用火光溫柔地幫它孵化。", "fire", "丟進水裡測試浮力密度。", "water", "固執地拿落葉把它藏好。", "grass"],
    ["你覺得什麼味道最棒？", "雨後泥土濕潤的氣味。", "grass", "深海裡鹹鹹的搞笑味道。", "water", "曬過太陽的暖暖味道。", "fire"],
    ["能變人類一天想做啥？", "死都要去公園挖泥巴洞。", "bug", "衝去參加熱鬧營火晚會！", "fire", "溫柔地跟水族館魚聊天。", "water"],
    ["「家」應該是什麼樣子？", "只要有著溫暖的小火爐。", "fire", "誰也打不破的堅固硬殼！", "bug", "有很多植物，空氣很好。", "grass"],
    ["看到一朵快枯萎的花朵？", "溫柔滴水希望能救活它。", "water", "沒救了冷靜做成乾燥花。", "grass", "用泥土把根部固執包好。", "bug"],
    ["參加賽跑你的策略是？", "用火焰推進器全力衝刺！", "fire", "挖地道直接從終點鑽出！", "bug", "像流水一樣冷靜地前進。", "water"],
    ["看到有人掉進水裡了！", "伸出大葉子溫柔接住他。", "grass", "急著狂噴火想蒸乾河水！", "fire", "冷靜伸出藤蔓拉他上來。", "grass"],
    ["你最喜歡的玩具是什麼？", "碰水就會有聲音的鴨子。", "water", "固執地猛挖土的小樹枝。", "grass", "亮晶晶的漂亮甲蟲殼。", "bug"],
    ["要是我們吵架了怎麼辦？", "躲進殼裡死都不道歉！", "bug", "大哭噴射水柱求你原諒！", "water", "氣到噴火把床給燒了！", "fire"],
    ["你的偉大夢想是什麼？", "讓世界長滿溫柔的森林。", "grass", "成為天空中耀眼的太陽！", "fire", "吃遍全世界的奇妙蟲子！", "bug"],
    ["很高很高的牆擋住去路？", "裝備堅硬頭槌固執撞開！", "bug", "先用火烤軟然後撞過去。", "fire", "冷靜尋找牆縫慢慢爬過。", "grass"],
    ["什麼最能夠讓你安心？", "冷靜待在厚實的泥土裡。", "bug", "像火焰般溫暖的摸摸。", "fire", "聽著小溪流動的白噪音。", "water"],
    ["遇到一直煩人的討厭鬼？", "朝他吐一大堆噁心蟲絲！", "bug", "噴出熱情火焰給他警告！", "fire", "像水流般冷靜地繞開他。", "water"],
    ["覺得最舒服的溫度是？", "滿頭大汗的熱血夏天！", "fire", "微風輕輕吹過的溫柔涼秋", "grass", "泡進冷水裡降溫的感覺。", "water"],
    ["發現一顆發光神奇寶石？", "用藤蔓把它綁成漂亮項鍊", "grass", "冷靜觀察它的光線折射。", "water", "死命地把它藏進紅土裡。", "bug"],
    ["喜歡湊熱鬧還是安靜？", "大家圍著營火瘋狂跳舞！", "fire", "只要有樹葉吃怎樣都行。", "grass", "溫柔地看著湖面發小呆。", "water"],
    ["如果可以飛上天空呢？", "飛向太陽去感受那熱度！", "fire", "從天上丟果實砸人搞笑！", "grass", "乘著微風像蟲蟲般滑翔。", "bug"],
    ["看到清澈的小水坑會？", "固執地用火把它全烤乾！", "fire", "熱血跳進去狂踩水花！", "water", "冷靜放片葉子觀察漂流。", "grass"],
    ["今天的心情感覺好嗎？", "像石頭一樣不想說話。", "bug", "像大樹一樣生機盎然。", "grass", "像流水一樣平靜舒服。", "water"]
];

const generateSoulQuestions = () => {
    return RAW_Q_DATA.map(row => ({
        q: row[0],
        options: [
            { label: row[1], affinity: row[2] },
            { label: row[3], affinity: row[4] },
            { label: row[5], affinity: row[6] }
        ]
    }));
};
const SOUL_QUESTIONS = generateSoulQuestions();

export {
    apiKey, modelName, PHYSICS,
    DIARY_MESSAGES_TEMPLATE, ADV_BATTLE_RULES, RAW_Q_DATA, SOUL_QUESTIONS,
    getPetDailyMessage, DIARY_STORAGE_KEY, loadDiaryData, saveDiaryData, getSmartMove
};

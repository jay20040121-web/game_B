const apiKey = "";
const modelName = "gemini-2.5-flash-preview-09-2025";

const PHYSICS = {
    FLOAT_SPEED: 0.36,
    BOUNCE_DAMPING: 0.98,
    MAX_VELOCITY: 7.0,
};

const EVOLUTION_TIME = {
    1: 3600000,   // 1 小時 (Baby -> Child / 幼年期 -> 成長期)
    2: 21600000,   // 6 小時 (Child -> Adult)
    3: 86400000,   // 24 小時 (Adult -> Perfect)
};

// ==========================================
// 冒險系統基礎數據 (Adventure Constants)
// ==========================================
const ADV_ITEMS = [
    { id: '001', name: "活力飯糰", desc: "永久提升基礎戰力 10 點", rarity: 1 },
    { id: '002', name: "戰鬥蛋白粉", desc: "提升 2 點攻擊力與戰力", rarity: 4 },
    { id: '003', name: "跑步鞋", desc: "重置 60 分鐘冒險冷卻", rarity: 2 },
    { id: '004', name: "覺醒之核", desc: "提升基礎戰力與全屬性", rarity: 3 },
    { id: '005', name: "奇異糖果", desc: "隨機大幅提升戰鬥屬性", rarity: 5 }
];

// ==========================================
// 日記系統 (Diary System)
// ==========================================

// 永久道具定義（不參與掉落池、永不消耗）
const DIARY_ITEM = {
    id: 'DIARY',
    name: "📖 對戰日記",
    desc: "記錄每日的冒險與成長足跡。",
    rarity: 0,
    permanent: true,
    count: 1
};

// 寵物話語罐頭詞庫 (V1 - 依 lockedAffinity 分類)
const DIARY_MESSAGES_TEMPLATE = {
    fire:    ["今天練很多！我越來越強了！朝著頂端衝吧！", "感覺燃燒起來了，明天還要更猛！", "跟你在一起，每天都很充實！"],
    water:   ["今天悄悄觀察你很久了，你有注意到嗎？", "平靜的一天...但你在的話就夠了。", "謝謝今天陪我游過那條小溪。"],
    grass:   ["大地給了我力量，你也是。", "今天的陽光很好，希望你也過得好。", "有你陪著，連休息都覺得特別安心。"],
    bug:     ["嘿，我在想一件事，但說不出口...算了！", "今天偷偷守護你了！你不知道吧？", "硬殼雖然厚，但心裡還是有點癢癢的。"],
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

const ADV_BATTLE_RULES = {
    BASE_HP: 100, BASE_ATK: 10, BASE_DEF: 10, BASE_SPD: 1,
    HIT_RATE: 0.9,
    CD_MS: 60000, // 1分鐘
    STAGE_MULT: { 0: 0.5, 1: 1.0, 2: 1.5, 3: 2.5, 4: 4.0, 5: 6.0, 6: 10.0 }
};

// 智慧招式 AI：根據屬性相剋與威力選擇最佳招式
const getSmartMove = (attacker, defender, moves) => {
    // 過濾掉無效的招式物件，防止 crash
    const validMoves = (moves || []).filter(m => m && typeof m === 'object');
    if (validMoves.length === 0) return { name: '撞擊', power: 40, type: 'normal' };
    if (validMoves.length === 1) return validMoves[0];
    
    let bestMove = validMoves[0];
    let maxScore = -1;
    
    for (const move of validMoves) {
        // 確保屬性定義存在
        const moveType = move.type || 'normal';
        const defenderType = defender.type || ['normal'];
        
        const realMult = typeof getTypeMultiplier !== "undefined" ? getTypeMultiplier(moveType, defenderType) : 1;
        const score = (move.power || 40) * realMult;
        if (score > maxScore) {
            maxScore = score;
            bestMove = move;
        } else if (score === maxScore) {
            if (Math.random() < 0.5) bestMove = move;
        }
    }
    return bestMove;
};

// ==========================================
// 模組 1：40 題完美平衡對話庫
// ==========================================
const RAW_Q_DATA = [
    ["你比較喜歡哪一種天氣？", "大太陽！熱血地奔跑吧！", "fire", "passionate", "聽著下雨聲，感覺很平靜。", "water", "rational", "躲在安全的洞窟裡最好！", "bug", "stubborn"],
    ["今天探險想去哪裡玩呢？", "去小溪邊溫柔地踩踩水。", "water", "gentle", "去森林深處尋找大樹！", "grass", "rational", "去挖一個超深的泥巴洞！", "bug", "passionate"],
    ["惹你生氣了該怎麼辦好？", "陪我坐在草地上發呆吧。", "grass", "gentle", "請我吃超辣的火爆餅乾！", "fire", "passionate", "吐一大堆泡泡不理你了。", "water", "nonsense"],
    ["肚子好餓喔，晚餐吃啥？", "大火烤得劈啪響的烤肉！", "fire", "passionate", "嚼嚼地上的硬土塊就好！", "bug", "nonsense", "營養均衡的翠綠蔬菜沙拉", "grass", "rational"],
    ["看到別人哭泣你會怎樣？", "給他暖爐般熱熱的擁抱。", "fire", "gentle", "遞給他一片葉子擦眼淚。", "grass", "gentle", "用硬殼幫他擋住壞事！", "bug", "stubborn"],
    ["遇到很寬的河該怎麼辦？", "踩著荷葉熱血衝過去！", "grass", "passionate", "死命用火把水全蒸發！", "fire", "stubborn", "冷靜尋找堅固樹幹當橋。", "grass", "rational"],
    ["突然下大雨沒傘怎麼辦？", "太好了！在雨中跳舞吧！", "water", "passionate", "找一片大荷葉溫柔撐傘。", "grass", "gentle", "鑽進地洞裡死都不出來。", "bug", "stubborn"],
    ["晚上睡不著時會做什麼？", "看著營火，聽柴火聲音。", "fire", "gentle", "冷靜觀察蟲蟲爬行路線。", "bug", "rational", "在水裡吐泡泡數數看。", "water", "nonsense"],
    ["想學會哪一種新魔法呢？", "讓枯花綻放的溫柔魔法。", "grass", "gentle", "噴出超帥氣的七彩火球！", "fire", "passionate", "變成甲蟲偷偷聽人講話。", "bug", "nonsense"],
    ["發現一個鎖住的寶箱！", "用銳利草葉冷靜地割開。", "grass", "rational", "不管啦！用大火燒開它！", "fire", "stubborn", "我要咬著硬殼把它撞開！", "bug", "stubborn"],
    ["遇到超強的壞人怎麼辦？", "用烈焰跟他硬拼到底！", "fire", "passionate", "縮進硬殼裡，絕對不退！", "bug", "stubborn", "裝死變成一根漂流草。", "water", "nonsense"],
    ["收到什麼禮物最開心呀？", "裝滿清澈泉水的小瓶子。", "water", "gentle", "仔細記錄植物的百科書。", "grass", "rational", "會噴出火花的搞笑玩具！", "fire", "nonsense"],
    ["覺得自己最大的優點是？", "像流水一樣包容溫柔。", "water", "gentle", "堅持到底的堅硬外殼！", "bug", "stubborn", "無限生長頑強的雜草！", "grass", "stubborn"],
    ["在森林裡迷路了怎麼辦？", "爬到高樹冷靜觀察地形。", "grass", "rational", "跟著地上的螞蟻隊伍走！", "bug", "nonsense", "點燃火把溫柔引導別人。", "fire", "gentle"],
    ["最喜歡的休息動作是？", "躺在軟綿綿草地大放鬆。", "grass", "gentle", "泡在冷水裡面冷靜思考。", "water", "rational", "把自己埋土裡露出一顆頭", "bug", "nonsense"],
    ["我看起來很累時你會？", "摘新鮮果實幫你補體力。", "grass", "rational", "一直潑你水讓你清醒！", "water", "passionate", "帶你去鬆軟泥土裡躺躺。", "bug", "gentle"],
    ["如果有一座秘密基地？", "長滿各種奇花異草的花園", "grass", "gentle", "地底深處的堅固蟲巢。", "bug", "stubborn", "一定要有沸騰的溫泉！", "fire", "passionate"],
    ["被誤會了會怎麼反應呢？", "冷靜分析，把話說清楚。", "water", "rational", "氣到冒火，死也要道歉！", "fire", "stubborn", "拿樹葉遮住臉不想理人。", "grass", "nonsense"],
    ["看見流星會許什麼願望？", "希望能去深海大探險！", "water", "passionate", "希望能有吃不完的泥巴。", "bug", "nonsense", "希望大家都像大樹般健康", "grass", "gentle"],
    ["如果明天是世界末日？", "燃燒生命痛快大玩一場！", "fire", "passionate", "死命躲避進最深的水底。", "water", "stubborn", "嚼著硬殼冷靜面對一切。", "bug", "rational"],
    ["你最喜歡聽哪一種故事？", "熱血沸騰的火山傳說！", "fire", "passionate", "大樹精靈的溫柔童話。", "grass", "gentle", "蟲蟲統治世界的漫畫！", "bug", "nonsense"],
    ["發現一顆奇怪的蛋？", "用火光溫柔地幫它孵化。", "fire", "gentle", "丟進水裡測試浮力密度。", "water", "rational", "固執地拿落葉把它藏好。", "grass", "stubborn"],
    ["你覺得什麼味道最棒？", "雨後泥土濕潤的氣味。", "grass", "rational", "深海裡鹹鹹的搞笑味道。", "water", "nonsense", "曬過太陽的暖暖味道。", "fire", "gentle"],
    ["能變人類一天想做啥？", "死都要去公園挖泥巴洞。", "bug", "stubborn", "衝去參加熱鬧營火晚會！", "fire", "passionate", "溫柔地跟水族館魚聊天。", "water", "gentle"],
    ["「家」應該是什麼樣子？", "只要有著溫暖的小火爐。", "fire", "gentle", "誰也打不破的堅固硬殼！", "bug", "stubborn", "有很多植物，空氣很好。", "grass", "rational"],
    ["看到一朵快枯萎的花朵？", "溫柔滴水希望能救活它。", "water", "gentle", "沒救了冷靜做成乾燥花。", "grass", "rational", "用泥土把根部固執包好。", "bug", "stubborn"],
    ["參加賽跑你的策略是？", "用火焰推進器全力衝刺！", "fire", "passionate", "挖地道直接從終點鑽出！", "bug", "nonsense", "像流水一樣冷靜地前進。", "water", "rational"],
    ["看到有人掉進水裡了！", "伸出大葉子溫柔接住他。", "grass", "gentle", "急著狂噴火想蒸乾河水！", "fire", "nonsense", "冷靜伸出藤蔓拉他上來。", "grass", "rational"],
    ["你最喜歡的玩具是什麼？", "碰水就會有聲音的鴨子。", "water", "gentle", "固執地猛挖土的小樹枝。", "grass", "stubborn", "亮晶晶的漂亮甲蟲殼。", "bug", "rational"],
    ["要是我們吵架了怎麼辦？", "躲進殼裡死都不道歉！", "bug", "stubborn", "大哭噴射水柱求你原諒！", "water", "passionate", "氣到噴火把床給燒了！", "fire", "stubborn"],
    ["你的偉大夢想是什麼？", "讓世界長滿溫柔的森林。", "grass", "gentle", "成為天空中耀眼的太陽！", "fire", "passionate", "吃遍全世界的奇妙蟲子！", "bug", "nonsense"],
    ["很高很高的牆擋住去路？", "裝備堅硬頭槌固執撞開！", "bug", "stubborn", "先用火烤軟然後撞過去。", "fire", "passionate", "冷靜尋找牆縫慢慢爬過。", "grass", "rational"],
    ["什麼最能夠讓你安心？", "冷靜待在厚實的泥土裡。", "bug", "rational", "像火焰般溫暖的摸摸。", "fire", "gentle", "聽著小溪流動的白噪音。", "water", "gentle"],
    ["遇到一直煩人的討厭鬼？", "朝他吐一大堆噁心蟲絲！", "bug", "nonsense", "噴出熱情火焰給他警告！", "fire", "passionate", "像水流般冷靜地繞開他。", "water", "rational"],
    ["覺得最舒服的溫度是？", "滿頭大汗的熱血夏天！", "fire", "passionate", "微風輕輕吹過的溫柔涼秋", "grass", "gentle", "泡進冷水裡降溫的感覺。", "water", "rational"],
    ["發現一顆發光神奇寶石？", "用藤蔓把它綁成漂亮項鍊", "grass", "nonsense", "冷靜觀察它的光線折射。", "water", "rational", "死命地把它藏進紅土裡。", "bug", "stubborn"],
    ["喜歡湊熱鬧還是安靜？", "大家圍著營火瘋狂跳舞！", "fire", "passionate", "只要有樹葉吃怎樣都行。", "grass", "nonsense", "溫柔地看著湖面發小呆。", "water", "gentle"],
    ["如果可以飛上天空呢？", "飛向太陽去感受那熱度！", "fire", "passionate", "從天上丟果實砸人搞笑！", "grass", "nonsense", "乘著微風像蟲蟲般滑翔。", "bug", "gentle"],
    ["看到清澈的小水坑會？", "固執地用火把它全烤乾！", "fire", "stubborn", "熱血跳進去狂踩水花！", "water", "passionate", "冷靜放片葉子觀察漂流。", "grass", "rational"],
    ["今天的心情感覺好嗎？", "像石頭一樣不想說話。", "bug", "stubborn", "像大樹一樣生機盎然。", "grass", "passionate", "像流水一樣平靜舒服。", "water", "rational"]
];

const generateSoulQuestions = () => {
    return RAW_Q_DATA.map(row => ({
        q: row[0],
        options: [
            { label: row[1], affinity: row[2], tag: row[3] },
            { label: row[4], affinity: row[5], tag: row[6] },
            { label: row[7], affinity: row[8], tag: row[9] }
        ]
    }));
};
const SOUL_QUESTIONS = generateSoulQuestions();

export {
    apiKey, modelName, PHYSICS, EVOLUTION_TIME, ADV_ITEMS, DIARY_ITEM, 
    DIARY_MESSAGES_TEMPLATE, ADV_BATTLE_RULES, RAW_Q_DATA, SOUL_QUESTIONS,
    getPetDailyMessage, DIARY_STORAGE_KEY, loadDiaryData, saveDiaryData, getSmartMove
};

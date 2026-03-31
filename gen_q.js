const fs = require('fs');

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

const labels = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
                '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                '二十一', '二十二', '二十三', '二十四', '二十五', '二十六', '二十七', '二十八', '二十九', '三十',
                '三十一', '三十二', '三十三', '三十四', '三十五', '三十六', '三十七', '三十八', '三十九', '四十'];

const themes = ['天氣', '探險', '生氣', '晚餐', '哭泣', '過河', '下雨', '失眠', '魔法', '寶箱',
          '壞人', '禮物', '優點', '迷路', '休息', '疲累', '基地', '誤會', '流星', '末日',
          '故事', '奇蛋', '味道', '人類', '我家', '枯花', '賽跑', '落水', '玩具', '吵架',
          '夢想', '高牆', '安心', '討厭', '溫度', '寶石', '氣氛', '飛天', '水坑', '心情'];

const attrMap = {
    'fire': '火', 'water': '水', 'grass': '草', 'bug': '蟲',
    'gentle': '溫柔', 'passionate': '熱情', 'stubborn': '固執',
    'rational': '理性', 'nonsense': '無俚頭'
};

let out = '================================================================\n';
out += '     像素怪獸 內建核心問題庫 (40題)\n';
out += '================================================================\n\n';

for (let i = 0; i < RAW_Q_DATA.length; i++) {
    const q = RAW_Q_DATA[i];
    const t = themes[i];
    const n = labels[i];
    out += `[題目${n}：${t}] Q: ${q[0]}\n`;
    
    const aTag = `(${attrMap[q[2]]}/${attrMap[q[3]]})`;
    const bTag = `(${attrMap[q[5]]}/${attrMap[q[6]]})`;
    const cTag = `(${attrMap[q[8]]}/${attrMap[q[9]]})`;
    
    out += `A: ${q[1]} ${aTag} | B: ${q[4]} ${bTag} | C: ${q[7]} ${cTag}\n\n`;
}

fs.writeFileSync('./soul_questions_list.txt', out.trim() + '\n', 'utf-8');
console.log('done text file writing!');

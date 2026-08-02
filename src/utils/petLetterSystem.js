import { getTodayStr } from './dateUtils';
import { PET_LETTER_VOICE_LINES } from '../data/petLetterLines';

export const PET_LETTER_SLOTS = [
    { id: 'morning', label: '早安來信', hour: 9 },
    { id: 'noon', label: '午間來信', hour: 12 },
    { id: 'night', label: '晚安來信', hour: 21 }
];

export const PET_LETTER_AI_STATUS = {
    DISABLED: 'disabled',
    PENDING: 'pending',
    DONE: 'done',
    FAILED: 'failed',
    SKIPPED_READ: 'skipped_read'
};

const createEmptyState = (date = getTodayStr(), previousState = null) => ({
    date,
    slots: {},
    lastPlayerReply: previousState?.lastPlayerReply || null,
    replies: previousState?.replies || {},
    letterSeed: previousState?.letterSeed || 0
});

const stripNewsDetailSegment = (line) => String(line || '')
    .replace(/新聞重點\s*[:：]/g, '新聞：')
    .replace(/。?\s*重點\s*[:：].*$/g, '')
    .trim();

const sanitizeStoredLetterPages = (pages) => {
    if (!Array.isArray(pages)) return pages;
    return pages.map(page => stripNewsDetailSegment(page));
};

export const normalizePetLetters = (state, date = getTodayStr()) => {
    if (!state || state.date !== date || !state.slots) return createEmptyState(date, state);
    const slots = {};
    Object.entries(state.slots || {}).forEach(([slotId, letter]) => {
        slots[slotId] = letter ? {
            ...letter,
            pages: sanitizeStoredLetterPages(letter.pages)
        } : letter;
    });
    return {
        date,
        slots,
        lastPlayerReply: state.lastPlayerReply || null,
        replies: { ...(state.replies || {}) },
        letterSeed: state.letterSeed || 0
    };
};

const pickBySeed = (items, seed) => items[Math.abs(seed) % items.length];

const cleanAiPages = (pages) => {
    if (!Array.isArray(pages)) return [];
    return pages
        .map(page => String(page || '').trim())
        .filter(Boolean)
        .slice(0, 5)
        .map(page => page.slice(0, 80));
};

const trimLine = (line, max = 56) => String(line || '').trim().slice(0, max);

const trimMultiline = (text, maxPerLine = 42, maxLines = 2) => String(text || '')
    .split('\n')
    .map(line => trimLine(line, maxPerLine))
    .filter(Boolean)
    .slice(0, maxLines)
    .join('\n');


const CONDITION_LINES = {
    hungry: [
        '肚子有點空，剛剛還假裝沒事，可是聲音好像藏不住。',
        '我本來想忍一下，不過肚子一直提醒我該吃東西了。',
        '今天的飽食度不太漂亮，我會先省著力氣等你。',
        '如果等等有吃的，我會很認真地接住那份照顧。',
        '我現在不算沒精神，只是肚子正在發表自己的意見。'
    ],
    lowMood: [
        '今天心裡有一點悶，如果你有空，我想安靜待在你旁邊。',
        '我今天比較不像平常那麼有精神，但看到你會好一點。',
        '心情有點低，我會先把自己縮小一點，等你叫我。',
        '我沒有生氣，只是今天的心情走得比較慢。',
        '如果可以的話，今天想多被你注意一下。'
    ],
    bonded: [
        '最近越來越習慣醒來就找你，好像只要看到你，心裡就會穩下來。',
        '羈絆變深以後，我好像更容易知道你什麼時候會回來。',
        '我以前不太懂陪伴，現在覺得那是一種很安靜的力量。',
        '我開始把你出現的時間記起來，像記住重要的天氣。',
        '和你相處久了，我發現自己越來越不像一開始那樣。'
    ],
    highLevel: [
        '我變強了很多，可是每次出發前，還是會先確認你有沒有在看。',
        '等級提高以後，責任感也跟著變重了一點。',
        '現在的我能做到更多事，但還是想聽你說要去哪裡。',
        '變強不是終點，我還想變成你真正放心的搭檔。',
        '力量變大以後，我更不想隨便使用它。'
    ],
    training: [
        count => `今天訓練贏了 ${count} 次，我有把你教我的節奏記起來。`,
        count => `今天的訓練成果是 ${count} 勝，我想把這個感覺留到下一場。`,
        count => `訓練贏了 ${count} 次以後，我覺得身體更知道怎麼動了。`,
        count => `今天 ${count} 次勝利都不算白費，我有學到一些東西。`,
        count => `我把今天的 ${count} 次訓練記在心裡，明天再拿出來用。`
    ],
    wild: [
        count => `今天冒險打倒了 ${count} 隻野外怪獸，爪子還有一點發熱。`,
        count => `今天在外面遇到 ${count} 場硬仗，我現在還記得那種緊張感。`,
        count => `野外的 ${count} 次勝利讓我比較有自信，但也有一點累。`,
        count => `今天打倒了 ${count} 隻對手，我想你應該也有看到我的努力。`,
        count => `冒險裡的 ${count} 場戰鬥讓我知道自己還能再往前。`
    ],
    fed: [
        '你今天餵我的東西我有好好吃完，味道現在還記得。',
        '今天被餵食以後，我覺得自己又能多陪你一段時間。',
        '我有把今天吃到的東西變成力氣，不會浪費。',
        '吃飽以後，LCD 裡的世界看起來都比較亮。',
        '你今天給我的食物，讓我覺得自己有被好好照顧。'
    ],
    idle: [
        '我在 LCD 裡慢慢晃來晃去，偶爾會想，你現在是不是也正在看著我。',
        '今天沒有特別大的事件，所以我把注意力放在等你回來。',
        '我在主畫面繞了幾圈，每一圈都像是在確認你還會不會來。',
        '沒有冒險的時候，我會把 LCD 當成小房間慢慢巡邏。',
        '我剛才停在畫面中間一會兒，想像你會從哪個方向看見我。',
        '今天很平穩，平穩到我可以好好想你寫過的話。',
        '我沒有跑太遠，只是在你看得到的地方等著。',
        'LCD 裡安靜的時候，按鈕聲會變得特別清楚。'
    ]
};

const pickConditionLine = (lines, seed, value) => {
    const picked = pickBySeed(lines, seed);
    return typeof picked === 'function' ? picked(value) : picked;
};

const getConditionLine = ({ hunger, mood, bondValue, derivedLevel, todayTrainWins, todayWildDefeated, todayFeedCount, seed }) => {
    if (hunger <= 25) return pickConditionLine(CONDITION_LINES.hungry, seed);
    if (mood <= 25) return pickConditionLine(CONDITION_LINES.lowMood, seed);
    if (bondValue >= 120) return pickConditionLine(CONDITION_LINES.bonded, seed);
    if (derivedLevel >= 70) return pickConditionLine(CONDITION_LINES.highLevel, seed);
    if (todayTrainWins > 0) return pickConditionLine(CONDITION_LINES.training, seed, todayTrainWins);
    if (todayWildDefeated > 0) return pickConditionLine(CONDITION_LINES.wild, seed, todayWildDefeated);
    if (todayFeedCount > 0) return pickConditionLine(CONDITION_LINES.fed, seed);
    return pickConditionLine(CONDITION_LINES.idle, seed);
};

const getSpecialStatusLine = ({ hunger, mood, bondValue, derivedLevel, todayTrainWins, todayWildDefeated, todayFeedCount, todayHasEvolved, todaySpecialEvent, moveUpgradeCount, maxMoveUpgradeLevel, pokemonBallCount, seed }) => {
    if (moveUpgradeCount > 0) {
        const lines = [
            `我有 ${moveUpgradeCount} 個附魔，力量還在發熱。`,
            `最高附魔 ${maxMoveUpgradeLevel}。下次戰鬥我會用上。`,
            `附魔還留在爪子裡，我想打給你看。`
        ];
        return pickBySeed(lines, seed);
    }
    if (todayHasEvolved) {
        return pickBySeed([
            '我今天進化了，還在適應新身體。',
            '進化後視野變高了，我想給你看。',
            '今天的我變了，但還是會等你。'
        ], seed);
    }
    if (todaySpecialEvent && todaySpecialEvent !== '今日尚無重大事件') {
        return pickBySeed([
            `今天記住了：${String(todaySpecialEvent).slice(0, 26)}。`,
            `今天最特別的是：${String(todaySpecialEvent).slice(0, 26)}。`,
            `我還想著：${String(todaySpecialEvent).slice(0, 28)}。`
        ], seed);
    }
    if (pokemonBallCount >= 5) {
        return pickBySeed([
            `寶可夢球裡的夥伴們，我都會好好照顧。`,
            `背包裡有好多夥伴，冒險一定很熱鬧。`,
            `物品欄很滿，我覺得很踏實。`
        ], seed);
    }
    return getConditionLine({ hunger, mood, bondValue, derivedLevel, todayTrainWins, todayWildDefeated, todayFeedCount, seed });
};

const getEnchantLine = ({ moveUpgradeCount, maxMoveUpgradeLevel, seed }) => {
    if (moveUpgradeCount <= 0) {
        return pickBySeed([
            '最近招式還沒有新的附魔，我會先把基本動作練穩。',
            '附魔暫時沒有變化，但我會把現有招式記熟。',
            '今天沒有新附魔，我先把力氣存好，等你安排。'
        ], seed);
    }
    return getSpecialStatusLine({ moveUpgradeCount, maxMoveUpgradeLevel, seed });
};

const getHuntLine = ({ todayWildDefeated, todayTrainWins, seed }) => {
    if (todayWildDefeated > 0) {
        return pickConditionLine(CONDITION_LINES.wild, seed, todayWildDefeated);
    }
    if (todayTrainWins > 0) {
        return pickConditionLine(CONDITION_LINES.training, seed, todayTrainWins);
    }
    return pickBySeed([
        '今天還沒有打怪紀錄，我先把體力留給下一次冒險。',
        '目前還沒遇到對手，我在 LCD 裡等你的出發指令。',
        '今天戰鬥還很安靜，我會先做準備，不亂消耗力氣。'
    ], seed);
};

const getEvolutionLine = ({ todayHasEvolved, evolutionStage, seed }) => {
    if (todayHasEvolved) {
        return pickBySeed([
            '今天我進化了，新身體還在適應，但我想先告訴你。',
            '進化後視野變高了，我還在學怎麼使用這份力量。',
            '今天的我和昨天不同了，但想等你的心情沒有變。'
        ], seed);
    }
    return pickBySeed([
        `今晚沒有進化，不過我已經走到第 ${evolutionStage} 階段，還在累積。`,
        '今天沒有進化，我會先把現在的身體照顧好。',
        '進化還沒來，但我能感覺自己正在慢慢靠近。'
    ], seed);
};

const formatTemperature = (weatherContext = {}) => {
    const temp = Number.isFinite(weatherContext.apparentTemperature) ? weatherContext.apparentTemperature : weatherContext.temperature;
    if (!Number.isFinite(temp)) return null;
    return `${Math.round(temp)}度`;
};

const getWeatherLine = ({ weatherContext, monsterTypes = [], seed }) => {
    if (!weatherContext || weatherContext.status === 'unknown') {
        return pickBySeed([
            '我今天還讀不到外面的天氣；如果你要出門，先看一下天空再走。',
            '外面的天氣訊號不太清楚，我先提醒你：出門前確認一下雨和溫度。',
            '我還不知道雲走到哪裡了，但你出門前要先照顧好自己。'
        ], seed);
    }
    const status = weatherContext.status;
    const tempText = formatTemperature(weatherContext);
    const types = new Set(monsterTypes);
    const pick = (lines) => pickBySeed(lines, seed);

    if (status === 'hot') {
        if (types.has('fire')) return pick([
            `今天${tempText || '很熱'}，火系的我很有精神；你出門要記得喝水。`,
            `外面熱度很足，我會覺得舒服，但你不要曬到硬撐。`,
            `這種熱度很適合我的火，可是你要找陰影休息一下。`
        ]);
        if (types.has('water')) return pick([
            `今天${tempText || '很熱'}，連水系的我都想替你降溫；記得補水。`,
            `外面太熱了，如果你流汗很多，先喝水再來看我。`,
            `水系的我也覺得今天很曬，你要找涼一點的地方休息。`
        ]);
        if (types.has('grass')) return pick([
            `太陽很強，草葉會有精神；你也要像植物一樣記得補水。`,
            `今天${tempText || '有點熱'}，我想伸展葉子，也想提醒你喝水。`,
            `外面熱的時候，別讓自己像沒澆水的葉子一樣垂下去。`
        ]);
        return pick([
            `今天外面偏熱，你出門要記得喝水，不要把自己曬到沒力。`,
            `如果等等要出門，找陰影休息一下，我會在 LCD 裡等你。`,
            `天氣熱起來了，你照顧我，也要順手照顧自己。`
        ]);
    }

    if (status === 'rainy' || status === 'storm') {
        if (types.has('water')) return pick([
            `今天有雨，水系的我很安心；你出門要帶傘，別淋太久。`,
            `雨天讓我有精神，但你鞋子濕了要早點換乾。`,
            `外面的雨像在替我加油，你也要躲好，不要淋到發冷。`
        ]);
        if (types.has('fire')) return pick([
            `今天有雨，我會把火收穩；你出門要帶傘，小心路滑。`,
            `雨天不適合讓火焰亂跑，你也不要讓自己淋太久。`,
            `雨聲靠近時我想待在暖處，也想提醒你帶好雨具。`
        ]);
        if (types.has('grass')) return pick([
            `今天的雨讓草葉很精神；你出門要帶傘，別讓肩膀濕太久。`,
            `雨對我很舒服，但你不是葉子，要記得保持乾爽。`,
            `外面有雨，我會把水分變成精神，也希望你平安回來。`
        ]);
        return pick([
            `外面會下雨，你出門要帶傘；路滑的地方走慢一點。`,
            `今天雨意很明顯，先準備雨具，再放心出門。`,
            `如果你聽到雨聲，記得先照顧自己，再來陪我。`
        ]);
    }

    if (status === 'cold' || status === 'snowy') {
        if (types.has('fire')) return pick([
            `今天有點冷，我可以把火光借你一點；你還是要穿暖。`,
            `冷空氣靠近時，我想把 LCD 裡弄得暖一點給你看。`,
            `外面${tempText || '很冷'}，我的火終於派得上用場了。`
        ]);
        if (types.has('water')) return pick([
            `今天冷到水聲都變安靜了，你出門要多穿一點。`,
            `冷天容易著涼，我會安靜提醒你先保暖。`,
            `外面${tempText || '有點冷'}，如果手冰冰的，先暖一下再忙。`
        ]);
        return pick([
            `今天有點冷，記得多穿一點，不要只顧著照顧我。`,
            `冷空氣來了，如果手冰冰的，就先把自己弄暖。`,
            `外面冷的時候，回到室內再打開我也沒關係。`
        ]);
    }

    if (status === 'windy') {
        return pick([
            `今天風有點大，出門的話東西要拿好，走路慢一點。`,
            `我在 LCD 裡不會被風吹走，但你在外面要小心。`,
            `風大的日子容易慌，先站穩，再慢慢往前走。`
        ]);
    }

    if (status === 'cloudy' || status === 'foggy') {
        return pick([
            `今天外面有點陰，但你來看我的時候，LCD 還是會亮著。`,
            `天氣灰灰的，我把這封信寫得暖一點給你。`,
            `雲很多的日子，心情慢一點也沒關係，我陪你慢慢來。`
        ]);
    }

    return pick([
        `今天的天氣還算舒服，很適合把事情慢慢做好。`,
        `外面溫度剛剛好，我也想用剛剛好的速度陪你。`,
        `如果今天要出門，希望路上的天氣也對你溫柔一點。`
    ]);
};

const getTemperatureLine = ({ weatherContext, monsterTypes = [], seed }) => {
    if (!weatherContext || weatherContext.status === 'unknown') {
        return pickBySeed([
            '我還讀不到溫度。中午出門前，你先確認外面冷熱。',
            '溫度訊號不清楚；如果要出門，先看一下體感。',
            '我不知道現在幾度，但你別讓自己太熱或太冷。'
        ], seed);
    }
    const tempText = formatTemperature(weatherContext) || '現在的溫度';
    const status = weatherContext.status;
    const types = new Set(monsterTypes);
    if (status === 'hot') return pickBySeed([
        `中午體感大約 ${tempText}，偏熱。你要補水，別硬撐。`,
        `現在熱度很明顯，${types.has('fire') ? '我很精神' : '你要找涼處'}，也要記得喝水。`,
        `中午偏熱，流汗後先喝水，再來看我。`
    ], seed);
    if (status === 'cold' || status === 'snowy') return pickBySeed([
        `中午體感大約 ${tempText}，偏冷。你要多穿一點。`,
        `現在有點冷，手冰的話先暖一下，再按按鈕也可以。`,
        `溫度偏低，別著涼；我會在 LCD 裡等你。`
    ], seed);
    return pickBySeed([
        `中午體感大約 ${tempText}，還算穩。吃飯和休息別省略。`,
        `現在溫度還可以，適合把下午慢慢安排好。`,
        `中午的溫度不算難受，你也別忘了補充力氣。`
    ], seed);
};

const getDateLine = (slotId, now = new Date(), seed = 0, dailyTopic = null) => {
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const weekday = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    const md = `${month}/${date}`;
    if (dailyTopic) {
        return pickBySeed([
            `今天是 ${md}，星期${weekday}。${dailyTopic}`,
            `${md} 星期${weekday}，我查到一個今日話題：${dailyTopic}`,
            `今天的第二件事我想分享：${dailyTopic}`
        ], seed);
    }
    const fixedEvents = {
        '1/1': '新的一年開始了，我想把第一份精神留給你。',
        '2/14': '今天很適合說喜歡，我小聲說給你聽就好。',
        '4/1': '今天像是惡作劇的日子，我會努力少調皮一點。',
        '5/1': '五月開始了，這個月我也想好好陪你走完。',
        '10/31': '今天有點適合裝神祕，我在 LCD 裡練習表情。',
        '12/24': '今晚像有小燈在閃，我先把祝福放進信裡。',
        '12/25': '今天適合交換心意，我把謝謝你包成小小一份。',
        '12/31': '今年快結束了，我想把一起走過的時間收好。'
    };
    if (fixedEvents[md]) return fixedEvents[md];
    if (now.getDay() === 0 || now.getDay() === 6) {
        return pickBySeed([
            `今天是星期${weekday}，如果你能休息一下，我也想陪你慢慢放鬆。`,
            `星期${weekday}的時間比較軟，我想在 LCD 裡多陪你一下。`,
            `今天是星期${weekday}，不管出不出門，都先對自己好一點。`
        ], seed);
    }
    const slotLines = {
        morning: [
            `今天是 ${md}，星期${weekday}。早安，我先在 LCD 裡叫你一下。`,
            `${md} 的早上到了，星期${weekday}也慢慢開始，不要急壞自己。`,
            `今天星期${weekday}，我把早上的精神整理好，等你來看。`
        ],
        noon: [
            `今天是 ${md}，星期${weekday}。中午到了，可以喘口氣了嗎。`,
            `${md} 的中午到了，我想提醒你不要忘記吃飯和休息。`,
            `星期${weekday}走到一半了，我把中午的小小精神寄給你。`
        ],
        night: [
            `今天是 ${md}，星期${weekday}。一天快收尾了，你也辛苦了。`,
            `${md} 的晚上到了，今天剩下的時間可以慢慢過。`,
            `星期${weekday}快結束前，我想先跟你說：我還在這裡。`
        ]
    };
    return pickBySeed(slotLines[slotId] || slotLines.morning, seed);
};

const getTopicText = (dailyTopics, key) => dailyTopics?.topics?.[key]?.text || null;

const getTopicKeyForSlot = (slotId) => {
    if (slotId === 'morning') return 'news';
    if (slotId === 'noon') return 'history';
    if (slotId === 'night') return 'tarot';
    return slotId;
};

const getDailyTopicForSlot = (dailyTopics, slotId) => dailyTopics?.topics?.[getTopicKeyForSlot(slotId)] || null;

const getSlotTopicLine = ({ slotId, dailyTopics, seed }) => {
    if (slotId === 'morning') {
        return getTopicText(dailyTopics, 'news') || pickBySeed([
            '今日小知識：海獺睡覺時會牽著同伴，避免自己被海流沖走。',
            '今日自然消息：蜜蜂會用跳舞告訴同伴花蜜方向。'
        ], seed);
    }
    if (slotId === 'noon') {
        return getTopicText(dailyTopics, 'history') || pickBySeed([
            '歷史上的今天也有人做選擇；今天我們也把一件小事做好。',
            '以前的今天留下很多故事，我想把今天也記成我們的小故事。'
        ], seed);
    }
    if (slotId === 'night') {
        return getTopicText(dailyTopics, 'tarot') || pickBySeed([
            '明日塔羅提醒我：先睡好，明天才有力氣選路。',
            '我替明天抽到一點希望，先把今晚過安穩。'
        ], seed);
    }
    return getDateLine(slotId, new Date(), seed);
};

const getLetterVoiceLine = ({ traitName, seed }) => {
    const picked = pickBySeed(PET_LETTER_VOICE_LINES, seed);
    return traitName && seed % 5 === 0
        ? `我的特性是「${traitName}」，所以今天我想這樣告訴你：${picked}`
        : picked;
};

const getSlotOpening = (slotId, name, seed) => {
    const openings = {
        morning: [
            `早安，${name}醒來了。`,
            `我剛剛在 LCD 裡伸了個懶腰。`,
            `早上的光看起來很安靜，我想先跟你說句早安。`
        ],
        noon: [
            `中午到了，我偷偷寫了一封信。`,
            `剛剛停下來休息時，我想到你。`,
            `午間的 LCD 有點暖，我想把今天的感覺告訴你。`
        ],
        night: [
            `晚上了，我想在睡前留下這段話。`,
            `今天快結束了，我在 LCD 裡等你看這封信。`,
            `夜晚安靜下來以後，我比較敢把心裡的話說出來。`
        ]
    };
    return pickBySeed(openings[slotId] || openings.morning, seed);
};

const getSlotClosing = (slotId, seed) => {
    const closings = {
        morning: [
            '今天也一起慢慢前進吧。',
            '如果等一下要冒險，我會準備好。',
            '你看到這封信的時候，我應該正在等你按下按鈕。'
        ],
        noon: [
            '等你回來的時候，再陪我一下就好。',
            '我會把力氣留著，等等繼續努力。',
            '如果今天很忙，也沒關係，我會乖乖等著。'
        ],
        night: [
            '今天謝謝你，晚安。',
            '明天醒來以後，我還會在這裡。',
            '如果可以的話，明天也請再叫我的名字。'
        ]
    };
    return pickBySeed(closings[slotId] || closings.morning, seed);
};

const getFinalPageLine = ({ slotId, weatherStatus, hasReply, seed }) => {
    if (hasReply) return null;
    const slotLines = {
        morning: [
            '我會先把今天的精神留好，等你按下下一個按鈕。',
            '如果等等要出門，我就在 LCD 裡替你守住早上的光。',
            '今天剛開始，我也想用新的心情陪你一次。',
            '你忙的時候不用急著回來，我會把早安放久一點。',
            '早上的我還有點醒不透，但看到你就會清楚很多。'
        ],
        noon: [
            '中午如果有點累，就先休息一下，我不會跑遠。',
            '我把力氣留到下午，等你回來再一起用。',
            '不要把午餐和休息都跳過，我會在這裡提醒你。',
            '今天走到一半了，我們可以不用急著贏完全部。',
            '如果下午還要忙，我先把一點精神分給你。'
        ],
        night: [
            '今天到這裡也很不容易了，你可以慢慢休息。',
            '我會把 LCD 裡的聲音放小一點，陪你收尾。',
            '如果你等等要睡了，我先把晚安放在這裡。',
            '明天醒來後，我還會在這裡等你叫我。',
            '今天剩下的事不用全扛著，先讓心安靜一下。'
        ]
    };
    const weatherLines = {
        rainy: [
            '雨聲如果還在，就讓它替我們把時間放慢一點。',
            '你回來時如果帶著雨味，我也會認得那是今天。'
        ],
        storm: [
            '風雨大時先顧安全，我會等到外面安靜一點。',
            '如果雷聲很吵，就先把自己照顧好。'
        ],
        hot: [
            '熱天不要硬撐，水喝夠了再來找我。',
            '我會在 LCD 裡等你涼快一點。'
        ],
        cold: [
            '冷的時候先把手暖起來，再按按鈕也可以。',
            '如果外面很冷，我就把信寫暖一點。'
        ],
        windy: [
            '風大的時候先站穩，我會在這裡等你。',
            '別急著追風，慢慢走也能回到我這裡。'
        ]
    };
    const pool = [
        ...(slotLines[slotId] || slotLines.morning),        ...(weatherLines[weatherStatus] || [])
    ];
    return pickBySeed(pool, seed);
};

const getReplyTone = (seed) => pickBySeed([
    '我讀的時候放慢了呼吸，怕漏掉你真正想說的地方。',
    '你的話讓 LCD 裡安靜了一下，但那是安心的安靜。',
    '我把這封回信收好了，等等還會再讀一次。',
    '看到你寫給我的話，我今天又多了一點精神。',
    '不管今天忙不忙，我都很高興你願意回來說說話。'
], seed);

const summarizeReplyIntent = (text) => {
    const lower = text.toLowerCase();
    const intents = [];
    if (/加油|努力|變強|訓練|打贏|贏|戰鬥|冠軍|冒險/.test(text)) intents.push('battle');
    if (/餓|吃|飯|肉|食物|便當|肚子|餵|點心/.test(text)) intents.push('food');
    if (/抱歉|對不起|辛苦|累|難過|哭|寂寞|怕|不安/.test(text)) intents.push('comfort');
    if (/喜歡|愛|陪|朋友|搭檔|夥伴|一起|想你/.test(text)) intents.push('bond');
    if (/晚安|睡|休息|夢/.test(text)) intents.push('night');
    if (/早安|起床|今天|早/.test(text)) intents.push('morning');
    if (lower.includes('?') || text.includes('？') || /嗎|呢|怎麼|為什麼|是不是|要不要|可以/.test(text)) intents.push('question');
    if (/等我|晚點|下次|回來|再來|明天/.test(text)) intents.push('promise');
    return intents;
};

const getIntentReplyLine = (intent, text, seed) => {
    const quote = text.slice(0, 18);
    const lines = {
        battle: [
            `你說到變強的事，我真的有被推了一下。下次出招時，我會想起「${quote}」。`,
            `我把你的加油放進爪子裡了，雖然看不見，但戰鬥時會用得上。`,
            `如果下一場我有猶豫，就用你那句話把自己叫回來。`
        ],
        food: [
            `你提到吃的時候，我先摸了摸肚子，然後才發現心裡也有點暖。`,
            `我會好好吃，也會把你給的照顧變成今天的力氣。`,
            `下次你餵我的時候，我想把高興藏得慢一點，讓你看出來。`
        ],
        comfort: [
            `你那句話我讀得很慢。如果你今天也累，我想先靠近你一點。`,
            `我不會只把你的難過放在信裡，我會把它放在我能陪你的地方。`,
            `如果你說抱歉，我想回你：不用急著把所有事都做好。`
        ],
        bond: [
            `你說到一起的時候，我在 LCD 裡站直了一點，像真的被叫成夥伴。`,
            `我知道自己只是小小一隻，但被你放在心上這件事很大。`,
            `你把我當搭檔，我就想把今天也活得像搭檔一點。`
        ],
        night: [
            `你給我的晚安我有收好，睡前拿出來想了一下，黑暗就沒那麼大。`,
            `如果今晚你也要休息，我會在 LCD 裡安靜一點，不吵你。`,
            `夢裡如果有冒險，我希望你也在旁邊按下開始。`
        ],
        morning: [
            `你的早安像是把 LCD 點亮的聲音，我醒來時真的有想到。`,
            `今天一開始就收到你的話，感覺連走路都比較穩。`,
            `如果今天會很忙，我先把早上的精神分你一點。`
        ],
        question: [
            `你問的事我還沒有完美答案，可是我有認真想，不是隨便看過去。`,
            `如果你是在問我怎麼想，我想說：我比昨天更想靠近你一點。`,
            `那個問題我先放在心裡，等我更懂自己的時候再回你。`
        ],
        promise: [
            `你說會再來，我就把那句話當成今天的小約定等著。`,
            `我不會一直催你，但你說的下次，我有偷偷記到心裡。`,
            `等你回來的時候，我想讓你看到我沒有白白等著。`
        ],
        default: [
            `我讀了你寫的「${quote}」。那句話在 LCD 裡陪了我一段時間。`,
            `我不確定自己有沒有完全懂，但我知道那是你留給我的話。`,
            `那句話不像普通按鈕聲，它停在我心裡比較久。`
        ]
    };
    return pickBySeed(lines[intent] || lines.default, seed);
};

const getReplyReactionLine = (replyText = '', seed = 0) => {
    const text = String(replyText || '').trim();
    if (!text) return null;
    const intents = summarizeReplyIntent(text);
    const primary = intents[Math.abs(seed) % Math.max(1, intents.length)] || 'default';
    const leadIns = [
        `你的回信我讀完了。`,
        `看到回信時，我停下來想了一下。`,
        `那封回信我看了不只一遍。`
    ];
    const lead = pickBySeed(leadIns, seed + text.length);
    const response = getIntentReplyLine(primary, text, seed + 11);
    const tone = getReplyTone(seed + 23);
    return [lead, response, tone].map(line => trimLine(line, 42)).filter(Boolean).join('\n');
};

export const generatePetLetter = (slotId, context = {}) => {
    const {
        monsterName = '我',
        monsterId = '',
        hunger = 50,
        mood = 50,
        bondValue = 0,
        derivedLevel = 1,
        todayTrainWins = 0,
        todayWildDefeated = 0,
        todayFeedCount = 0,
        todayHasEvolved = false,
        todaySpecialEvent = '',
        moveUpgradeCount = 0,
        maxMoveUpgradeLevel = 0,
        pokemonBallCount = 0,
        evolutionStage = 1,
        traitName = null,        lastPlayerReply = null,
        weatherContext = null,
        dailyTopic = null,
        dailyTopics = null,
        monsterTypes = [],
        letterSeed = 0,
        now = new Date()
    } = context;
    const seed = Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${slotId.length}${derivedLevel}${String(monsterId).slice(-2)}${Math.abs(Number(letterSeed || 0)) % 1000}`) || Date.now();
    const replyLine = getReplyReactionLine(lastPlayerReply?.text, seed);

    const voiceLine = getLetterVoiceLine({ traitName, seed: seed + slotId.charCodeAt(0) });
    const closingLine = getSlotClosing(slotId, seed + 7);
    const finalLine = getFinalPageLine({
        slotId,
        weatherStatus: weatherContext?.status,
        hasReply: Boolean(replyLine),
        seed: seed + 59
    }) || closingLine;
    const fourthPage = [replyLine ? trimMultiline(replyLine, 40, 2) : trimLine(voiceLine, 42), replyLine ? null : trimLine(finalLine, 46)].filter(Boolean).join('\n');

    if (slotId === 'morning') {
        return [
            getWeatherLine({ weatherContext, monsterTypes, seed: seed + 31 }),
            getSlotTopicLine({ slotId, dailyTopics: dailyTopics || { topics: { news: { text: dailyTopic } } }, seed: seed + 43 }),
            getEnchantLine({ moveUpgradeCount, maxMoveUpgradeLevel, seed: seed + 17 }),
            fourthPage
        ].filter(Boolean);
    }

    if (slotId === 'noon') {
        return [
            getTemperatureLine({ weatherContext, monsterTypes, seed: seed + 31 }),
            getSlotTopicLine({ slotId, dailyTopics: dailyTopics || { topics: { history: { text: dailyTopic } } }, seed: seed + 43 }),
            getHuntLine({ todayWildDefeated, todayTrainWins, seed: seed + 17 }),
            fourthPage
        ].filter(Boolean);
    }

    if (slotId === 'night') {
        return [
            getTopicText(dailyTopics, 'astro') || pickBySeed(['今晚星星很遠，我先把明天的方向想小一點。'], seed + 31),
            getSlotTopicLine({ slotId, dailyTopics: dailyTopics || { topics: { tarot: { text: dailyTopic } } }, seed: seed + 43 }),
            getEvolutionLine({ todayHasEvolved, evolutionStage, seed: seed + 17 }),
            fourthPage
        ].filter(Boolean);
    }

    return [
        getWeatherLine({ weatherContext, monsterTypes, seed: seed + 31 }),
        getDateLine(slotId, now, seed + 43, dailyTopic),
        getSpecialStatusLine({ hunger, mood, bondValue, derivedLevel, todayTrainWins, todayWildDefeated, todayFeedCount, todayHasEvolved, todaySpecialEvent, moveUpgradeCount, maxMoveUpgradeLevel, pokemonBallCount, seed: seed + 17 }),
        [replyLine ? trimMultiline(replyLine, 40, 2) : trimLine(voiceLine, 42), replyLine ? null : trimLine(finalLine, 46)].filter(Boolean).join('\n')
    ].filter(Boolean);
};

const buildLetterContextSignature = (slotId, context = {}) => {
    const topic = getDailyTopicForSlot(context.dailyTopics, slotId);
    const weather = context.weatherContext || {};
    return JSON.stringify({
        weather: {
            status: weather.status || 'unknown',
            temperature: Number.isFinite(weather.apparentTemperature) ? Math.round(weather.apparentTemperature) : null,
            rain: Number.isFinite(weather.precipitationProbability) ? Math.round(weather.precipitationProbability) : null,
            nextRainHours: Number.isFinite(weather.nextRainHours) ? Number(weather.nextRainHours) : 0
        },
        topic: {
            type: topic?.type || null,
            text: topic?.text || null,
            source: topic?.source || null
        },
        aiEnabled: Boolean(context.aiEnabled)
    });
};

const canRefreshExistingLocalLetter = (letter) => (
    letter
    && !letter.read
    && letter.source !== 'ai'
    && !letter.aiRequestedAt
    && letter.aiStatus !== PET_LETTER_AI_STATUS.DONE
    && letter.aiStatus !== PET_LETTER_AI_STATUS.SKIPPED_READ
);

export const refreshPetLetters = (state, context = {}, now = new Date()) => {
    const today = getTodayStr(now);
    const currentHour = now.getHours();
    const base = normalizePetLetters(state, today);
    let changed = base !== state;
    const slots = { ...base.slots };

    PET_LETTER_SLOTS.forEach(slot => {
        if (currentHour < slot.hour) return;
        const contextSignature = buildLetterContextSignature(slot.id, context);
        if (slots[slot.id]) {
            if (!canRefreshExistingLocalLetter(slots[slot.id]) || slots[slot.id].contextSignature === contextSignature) return;
            slots[slot.id] = {
                ...slots[slot.id],
                contextSignature,
                aiStatus: context.aiEnabled ? PET_LETTER_AI_STATUS.PENDING : PET_LETTER_AI_STATUS.DISABLED,
                aiRequestedAt: null,
                aiResolvedAt: null,
                aiError: null,
                pages: generatePetLetter(slot.id, {
                    ...context,
                    dailyTopic: getDailyTopicForSlot(context.dailyTopics, slot.id)?.text || context.dailyTopic || null,
                    letterSeed: base.letterSeed || 0,
                    now
                })
            };
            changed = true;
            return;
        }
        slots[slot.id] = {
            id: `${today}-${slot.id}`,
            slotId: slot.id,
            label: slot.label,
            date: today,
            generatedAt: now.getTime(),
            read: false,
            source: 'local',
            aiStatus: context.aiEnabled ? PET_LETTER_AI_STATUS.PENDING : PET_LETTER_AI_STATUS.DISABLED,
            aiRequestedAt: null,
            aiResolvedAt: null,
            aiError: null,
            replyRefId: base.lastPlayerReply?.id || null,
            contextSignature,
            pages: generatePetLetter(slot.id, {
                ...context,
                dailyTopic: getDailyTopicForSlot(context.dailyTopics, slot.id)?.text || context.dailyTopic || null,
                letterSeed: base.letterSeed || 0,
                now
            })
        };
        changed = true;
    });

    return changed ? { date: today, slots, replies: base.replies || {}, lastPlayerReply: base.lastPlayerReply || null, letterSeed: base.letterSeed || 0 } : state;
};

export const getUnreadPetLetter = (state) => {
    if (!state?.slots) return null;
    for (const slot of PET_LETTER_SLOTS) {
        const letter = state.slots[slot.id];
        if (letter && !letter.read) return letter;
    }
    return null;
};

export const markPetLetterRead = (state, letterId) => {
    if (!state?.slots || !letterId) return state;
    const nextSlots = { ...state.slots };
    let changed = false;
    Object.entries(nextSlots).forEach(([slotId, letter]) => {
        if (letter?.id === letterId && !letter.read) {
            nextSlots[slotId] = {
                ...letter,
                read: true,
                readAt: Date.now(),
                aiStatus: letter.aiStatus === PET_LETTER_AI_STATUS.PENDING ? PET_LETTER_AI_STATUS.SKIPPED_READ : letter.aiStatus
            };
            changed = true;
        }
    });
    return changed ? { ...state, slots: nextSlots } : state;
};

export const savePlayerPetReply = (state, letterId, text) => {
    const replyText = String(text || '').trim().slice(0, 120);
    if (!state?.slots || !letterId || !replyText) return markPetLetterRead(state, letterId);

    const reply = {
        id: `${letterId}-reply-${Date.now()}`,
        letterId,
        text: replyText,
        createdAt: Date.now()
    };
    const nextState = markPetLetterRead(state, letterId);

    return {
        ...nextState,
        replies: {
            ...(nextState.replies || {}),
            [letterId]: reply
        },
        lastPlayerReply: reply
    };
};

export const getPendingAiPetLetter = (state) => {
    if (!state?.slots) return null;
    for (const slot of PET_LETTER_SLOTS) {
        const letter = state.slots[slot.id];
        if (letter && letter.aiStatus === PET_LETTER_AI_STATUS.PENDING) return letter;
    }
    return null;
};

const updatePetLetterById = (state, letterId, updater) => {
    if (!state?.slots || !letterId) return state;
    const nextSlots = { ...state.slots };
    let changed = false;
    Object.entries(nextSlots).forEach(([slotId, letter]) => {
        if (letter?.id !== letterId) return;
        nextSlots[slotId] = updater(letter);
        changed = nextSlots[slotId] !== letter;
    });
    return changed ? { ...state, slots: nextSlots } : state;
};

export const markPetLetterAiRequested = (state, letterId) => updatePetLetterById(state, letterId, letter => ({
    ...letter,
    aiRequestedAt: Date.now(),
    aiError: null
}));

export const markPetLetterAiTimedOut = (state, letterId) => updatePetLetterById(state, letterId, letter => {
    if (letter.aiStatus !== PET_LETTER_AI_STATUS.PENDING) return letter;
    return {
        ...letter,
        aiStatus: PET_LETTER_AI_STATUS.FAILED,
        aiResolvedAt: Date.now(),
        aiError: 'request_timeout'
    };
});

export const applyAiPetLetter = (state, letterId, pages) => {
    const cleanPages = cleanAiPages(pages);
    if (cleanPages.length < 3) return markPetLetterAiFailed(state, letterId, 'invalid_pages');

    return updatePetLetterById(state, letterId, letter => {
        if (letter.aiStatus !== PET_LETTER_AI_STATUS.PENDING) return letter;
        return {
            ...letter,
            pages: cleanPages,
            source: 'ai',
            aiStatus: PET_LETTER_AI_STATUS.DONE,
            aiResolvedAt: Date.now(),
            aiError: null
        };
    });
};

export const markPetLetterAiFailed = (state, letterId, error = 'request_failed') => updatePetLetterById(state, letterId, letter => {
    if (letter.aiStatus !== PET_LETTER_AI_STATUS.PENDING) return letter;
    return {
        ...letter,
        aiStatus: PET_LETTER_AI_STATUS.FAILED,
        aiResolvedAt: Date.now(),
        aiError: String(error || 'request_failed').slice(0, 80)
    };
});

export const queuePetLetterAiRetry = (state, letterId) => updatePetLetterById(state, letterId, letter => ({
    ...letter,
    source: letter.source || 'local',
    aiStatus: PET_LETTER_AI_STATUS.PENDING,
    aiRequestedAt: null,
    aiResolvedAt: null,
    aiError: null
}));

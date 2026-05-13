import { getTodayStr } from './dateUtils';
import { PET_PERSONALITY_LABELS, PET_PERSONALITY_LINES } from '../data/petLetterLines';

export const PET_LETTER_SLOTS = [
    { id: 'morning', label: '早安來信', hour: 9 },
    { id: 'noon', label: '午間來信', hour: 12 },
    { id: 'night', label: '晚安來信', hour: 21 }
];

const createEmptyState = (date = getTodayStr(), previousState = null) => ({
    date,
    slots: {},
    lastPlayerReply: previousState?.lastPlayerReply || null,
    replies: previousState?.replies || {},
    letterSeed: previousState?.letterSeed || 0
});

export const normalizePetLetters = (state, date = getTodayStr()) => {
    if (!state || state.date !== date || !state.slots) return createEmptyState(date, state);
    return {
        date,
        slots: { ...state.slots },
        lastPlayerReply: state.lastPlayerReply || null,
        replies: { ...(state.replies || {}) },
        letterSeed: state.letterSeed || 0
    };
};

const pickBySeed = (items, seed) => items[Math.abs(seed) % items.length];

const getTopTagMeta = (soulTagCounts = {}) => {
    const entries = Object.entries(soulTagCounts).filter(([, value]) => Number(value || 0) > 0);
    if (entries.length === 0) return { id: 'gentle', label: PET_PERSONALITY_LABELS.gentle };
    entries.sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0));
    const id = entries[0][0];
    return { id, label: PET_PERSONALITY_LABELS[id] || null };
};

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

const getPersonalityLine = ({ personalityId, traitName, personalityLabel, seed }) => {
    const lines = PET_PERSONALITY_LINES[personalityId] || PET_PERSONALITY_LINES.gentle;
    const picked = pickBySeed(lines, seed);
    if (traitName && seed % 5 === 0) {
        return `我的天賦是「${traitName}」，所以今天我想這樣告訴你：${picked}`;
    }
    if (personalityLabel && seed % 7 === 0) {
        return `如果你覺得我有點${personalityLabel}，也許就是因為：${picked}`;
    }
    return picked;
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

const getReplyReactionLine = (replyText = '') => {
    const text = String(replyText || '').trim();
    if (!text) return null;
    const lower = text.toLowerCase();

    if (/加油|努力|變強|訓練|打贏|贏|戰鬥/.test(text)) {
        return `我有看到你上次寫「${text.slice(0, 24)}」。我會記住這句話，下一次戰鬥不會那麼快退縮。`;
    }
    if (/餓|吃|飯|肉|食物|便當|肚子/.test(text)) {
        return `你上次提到吃的事，我一直記得。不是只有肚子記得，是心裡也覺得被照顧了。`;
    }
    if (/抱歉|對不起|辛苦|累|難過|哭|寂寞/.test(text)) {
        return `我反覆想著你寫給我的話。就算有時候很累，我也不想讓你一個人承擔。`;
    }
    if (/喜歡|愛|陪|朋友|搭檔|夥伴|一起/.test(text)) {
        return `你說的話我有好好收起來。被你當成搭檔這件事，對我來說很重要。`;
    }
    if (/晚安|睡|休息|夢/.test(text)) {
        return `你上次寫的晚安，我在睡前想了很久。好像只要那樣，就比較不怕黑了。`;
    }
    if (/早安|起床|今天/.test(text)) {
        return `你上次的招呼我收到了。醒來第一個想到的，就是要不要也回你一句。`;
    }
    if (lower.includes('?') || text.includes('？') || /嗎|呢|怎麼|為什麼|是不是|要不要/.test(text)) {
        return `你上次問我的問題，我還在想答案。也許我還不太會說明，但我真的有把它放在心上。`;
    }
    return `我讀了你上次寫的「${text.slice(0, 24)}」。那句話在 LCD 裡陪了我一段時間。`;
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
        traitName = null,
        soulTagCounts = {},
        lastPlayerReply = null,
        letterSeed = 0,
        now = new Date()
    } = context;
    const seed = Number(`${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${slotId.length}${derivedLevel}${String(monsterId).slice(-2)}${Math.abs(Number(letterSeed || 0)) % 1000}`) || Date.now();
    const topTag = getTopTagMeta(soulTagCounts);
    const replyLine = getReplyReactionLine(lastPlayerReply?.text);

    return [
        getSlotOpening(slotId, monsterName, seed),
        replyLine,
        getConditionLine({ hunger, mood, bondValue, derivedLevel, todayTrainWins, todayWildDefeated, todayFeedCount, seed: seed + 17 }),
        getPersonalityLine({ personalityId: topTag.id, personalityLabel: topTag.label, traitName, seed: seed + slotId.charCodeAt(0) }),
        getSlotClosing(slotId, seed + 7)
    ].filter(Boolean);
};

export const refreshPetLetters = (state, context = {}, now = new Date()) => {
    const today = getTodayStr(now);
    const currentHour = now.getHours();
    const base = normalizePetLetters(state, today);
    let changed = base !== state;
    const slots = { ...base.slots };

    PET_LETTER_SLOTS.forEach(slot => {
        if (currentHour < slot.hour || slots[slot.id]) return;
        slots[slot.id] = {
            id: `${today}-${slot.id}`,
            slotId: slot.id,
            label: slot.label,
            date: today,
            generatedAt: now.getTime(),
            read: false,
            replyRefId: base.lastPlayerReply?.id || null,
            pages: generatePetLetter(slot.id, { ...context, letterSeed: base.letterSeed || 0, now })
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
            nextSlots[slotId] = { ...letter, read: true, readAt: Date.now() };
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

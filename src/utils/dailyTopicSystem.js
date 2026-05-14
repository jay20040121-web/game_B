import { getTodayStr } from './dateUtils';

const DAILY_TOPIC_CACHE_KEY = 'pixel_monster_daily_topics';
const DAILY_TOPIC_CACHE_MS = 24 * 60 * 60 * 1000;
const EXTERNAL_PROXY_ENDPOINT = import.meta.env.VITE_PET_LETTER_AI_ENDPOINT || '';

const TAROT_CARDS = [
    { name: '愚者', message: '明天可以試一件新事，但先看好腳下。' },
    { name: '魔術師', message: '明天手上的工具會派上用場，先把第一步做出來。' },
    { name: '女祭司', message: '明天別急著回答，先聽直覺。' },
    { name: '皇后', message: '明天適合照顧自己，也照顧正在長大的事。' },
    { name: '皇帝', message: '明天把規則立好，事情會穩很多。' },
    { name: '戰車', message: '明天方向定了就前進，不要被雜音拉走。' },
    { name: '力量', message: '明天用溫柔穩住自己，比硬撐更強。' },
    { name: '星星', message: '明天留一個小願望，它會照亮一點路。' }
];

const ASTRO_TOPICS = [
    '今晚我看星星，水星像傳話的光；明天說話前先確認一次。',
    '今晚的星象像提醒：如果事情卡住，就慢一點，不要急著怪自己。',
    '我把火星想成行動按鈕；明天先選方向，再用力按下去。',
    '金星像溫柔的補給；明天可以把謝謝說清楚一點。',
    '月亮看起來像心情表；如果明天累了，就把步伐放小。',
    '土星像訓練規則；明天慢慢做完，比一次衝完可靠。'
];

const fallbackNewsTopics = [
    '早上的新聞很多，我挑重點提醒你：先確認今天最重要的一件事。',
    '今天外面的消息很多，你不用全接住，先照顧眼前的生活。',
    '新聞像一排訊號燈，今天先看清楚，再決定要往哪裡走。'
];

const fallbackHistoryTopics = [
    '歷史上的今天也有人做選擇；今天我們也把一件小事做好。',
    '以前的今天留下很多故事，我想把今天也記成我們的小故事。',
    '今天在歷史裡不是空白頁，我也想和你留下點什麼。'
];

const ZODIAC_SIGNS = [
    'aries',
    'taurus',
    'gemini',
    'cancer',
    'leo',
    'virgo',
    'libra',
    'scorpio',
    'sagittarius',
    'capricorn',
    'aquarius',
    'pisces'
];
const ZODIAC_SIGN_NAMES = {
    aries: '牡羊座',
    taurus: '金牛座',
    gemini: '雙子座',
    cancer: '巨蟹座',
    leo: '獅子座',
    virgo: '處女座',
    libra: '天秤座',
    scorpio: '天蠍座',
    sagittarius: '射手座',
    capricorn: '摩羯座',
    aquarius: '水瓶座',
    pisces: '雙魚座'
};
const ASTRO_ADVICES = [
    '先退一步看清楚，再決定今天要追哪個方向。',
    '說話前多確認一次，誤會就不容易變大。',
    '把力氣留給重要的事，零碎雜音先放旁邊。',
    '適合慢慢整理心情，也適合把謝謝說清楚。'
];
const TAROT_CARD_NAMES = {
    'The Fool': '愚者',
    'The Magician': '魔術師',
    'The High Priestess': '女祭司',
    'The Empress': '皇后',
    'The Emperor': '皇帝',
    'The Hierophant': '教皇',
    'The Lovers': '戀人',
    'The Chariot': '戰車',
    Strength: '力量',
    'The Hermit': '隱者',
    'Wheel of Fortune': '命運之輪',
    Justice: '正義',
    'The Hanged Man': '吊人',
    Death: '死神',
    Temperance: '節制',
    'The Devil': '惡魔',
    'The Tower': '高塔',
    'The Star': '星星',
    'The Moon': '月亮',
    'The Sun': '太陽',
    Judgement: '審判',
    'The World': '世界'
};
const TAROT_RANK_NAMES = {
    Ace: '一號',
    Two: '二號',
    Three: '三號',
    Four: '四號',
    Five: '五號',
    Six: '六號',
    Seven: '七號',
    Eight: '八號',
    Nine: '九號',
    Ten: '十號',
    Page: '侍者',
    Knight: '騎士',
    Queen: '皇后',
    King: '國王'
};
const TAROT_SUIT_NAMES = {
    Wands: '權杖',
    Cups: '聖杯',
    Swords: '寶劍',
    Pentacles: '錢幣'
};
const TAROT_ADVICES = [
    '明天先試小步，不要一次押太大。',
    '明天把節奏放穩，會比硬衝更順。',
    '明天適合整理選擇，留下真正重要的。',
    '明天先照顧自己，才有力氣照顧別的事。'
];

const pickBySeed = (items, seed) => items[Math.abs(seed) % items.length];
const seedForDate = (date, offset = 0) => Number(String(date).replace(/\D/g, '')) + offset;

const compactText = (text, max = 52) => String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/<\/?[^>]+>/g, '')
    .trim()
    .slice(0, max);

const normalizeCachedTopics = (cached) => {
    if (!cached?.date || !cached?.topics) return null;
    if (Date.now() - Number(cached.fetchedAt || 0) > DAILY_TOPIC_CACHE_MS) return null;
    const requiredKeys = ['news', 'history', 'astro', 'tarot'];
    if (!requiredKeys.every(key => cached.topics[key]?.text)) return null;
    return cached;
};

export const loadCachedDailyTopics = () => {
    try {
        if (typeof localStorage === 'undefined') return null;
        return normalizeCachedTopics(JSON.parse(localStorage.getItem(DAILY_TOPIC_CACHE_KEY) || 'null'));
    } catch (error) {
        return null;
    }
};

export const clearCachedDailyTopics = () => {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(DAILY_TOPIC_CACHE_KEY);
    } catch (error) { }
};

const saveCachedDailyTopics = (topics) => {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(DAILY_TOPIC_CACHE_KEY, JSON.stringify(topics));
    } catch (error) { }
};

const fetchJson = async (url) => {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`topic_http_${response.status}`);
    return response.json();
};

const createTopic = (type, text, source, error = null) => ({ type, text, source, error });

const translateTarotName = (name) => {
    if (TAROT_CARD_NAMES[name]) return TAROT_CARD_NAMES[name];
    const match = String(name || '').match(/^(.+) of (.+)$/);
    if (!match) return name;
    const rank = TAROT_RANK_NAMES[match[1]];
    const suit = TAROT_SUIT_NAMES[match[2]];
    return rank && suit ? `${suit}${rank}` : name;
};

const fetchNewsTopic = async (date, seed) => {
    const [, year, month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
    const endpoint = year && month && day
        ? `https://zh.wikipedia.org/api/rest_v1/feed/featured/${year}/${month}/${day}`
        : 'https://zh.wikipedia.org/api/rest_v1/feed/featured';
    try {
        const data = await fetchJson(endpoint);
        const items = [
            ...(data?.news || []),
            ...(data?.mostread?.articles || [])
        ].filter(item => item?.title || item?.story);
        const picked = pickBySeed(items, seed);
        const text = compactText(picked?.title || picked?.story || picked?.extract, 36);
        if (text) return createTopic('news', `今天新聞我挑一件：${text}`, 'wikipedia-featured');
    } catch (error) {
        return createTopic('news', pickBySeed(fallbackNewsTopics, seed), 'fallback', error?.message || 'news_failed');
    }
    return createTopic('news', pickBySeed(fallbackNewsTopics, seed), 'fallback', 'news_empty');
};

const fetchHistoryTopic = async (date, seed) => {
    const [, month, day] = date.match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
    if (!month || !day) return createTopic('history', pickBySeed(fallbackHistoryTopics, seed), 'fallback', 'bad_date');

    const endpoints = [
        `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`
    ];

    for (const endpoint of endpoints) {
        try {
            const data = await fetchJson(endpoint);
            const events = Array.isArray(data.events) ? data.events.filter(item => item?.text) : [];
            if (events.length === 0) continue;
            const event = pickBySeed(events, seed);
            const year = event?.year ? `${event.year} 年，` : '';
            const text = compactText(event?.text, 42);
            if (text) return createTopic('history', `歷史上的今天：${year}${text}`, endpoint.includes('/zh.') ? 'wikipedia-zh' : 'wikipedia-en');
        } catch (error) {
            // Try the next endpoint before falling back.
        }
    }
    return createTopic('history', pickBySeed(fallbackHistoryTopics, seed), 'fallback', 'history_failed');
};

const fetchAstroTopic = async (date, seed) => {
    const sign = pickBySeed(ZODIAC_SIGNS, seedForDate(date, seed));
    try {
        const data = await fetchJson(`https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${encodeURIComponent(sign)}`);
        const apiSign = String(data?.data?.sign || sign).toLowerCase();
        if (data?.data?.horoscope) {
            const signName = ZODIAC_SIGN_NAMES[apiSign] || ZODIAC_SIGN_NAMES[sign] || apiSign;
            return createTopic('astro', `今日星象更新到${signName}：${pickBySeed(ASTRO_ADVICES, seedForDate(date, seed))}`, 'freehoroscopeapi');
        }
    } catch (error) {
        return createTopic('astro', pickBySeed(ASTRO_TOPICS, seedForDate(date, seed)), 'fallback', error?.message || 'astro_failed');
    }
    return createTopic('astro', pickBySeed(ASTRO_TOPICS, seedForDate(date, seed)), 'fallback', 'astro_empty');
};

const createTarotTopic = (date, seed, cardOverride = null) => {
    if (cardOverride) {
        const name = compactText(cardOverride.name, 18);
        if (name) return `明日塔羅抽到「${translateTarotName(name)}」。${pickBySeed(TAROT_ADVICES, seedForDate(date, seed))}`;
    }
    const card = pickBySeed(TAROT_CARDS, seedForDate(date, seed));
    return `明日塔羅是「${card.name}」。${card.message}`;
};

const fetchTarotTopic = async (date, seed) => {
    try {
        const data = await fetchJson('https://freehoroscopeapi.com/api/v1/tarot/cards/random?n=1&minor=true');
        const card = Array.isArray(data?.cards) ? data.cards[0] : null;
        const topic = createTarotTopic(date, seed, card);
        if (topic) return createTopic('tarot', topic, 'freehoroscopeapi');
    } catch (error) {
        return createTopic('tarot', createTarotTopic(date, seed), 'fallback', error?.message || 'tarot_failed');
    }
    return createTopic('tarot', createTarotTopic(date, seed), 'fallback', 'tarot_empty');
};

export async function fetchDailyTopics(now = new Date(), options = {}) {
    const date = getTodayStr(now);
    const cached = options.force ? null : loadCachedDailyTopics();
    if (cached?.date === date) return cached;

    let proxyError = null;
    if (EXTERNAL_PROXY_ENDPOINT) {
        try {
            const proxyUrl = new URL('/external/topics', EXTERNAL_PROXY_ENDPOINT);
            proxyUrl.searchParams.set('date', date);
            const proxyResponse = await fetch(proxyUrl.toString());
            if (proxyResponse.ok) {
                const proxyTopics = await proxyResponse.json();
                if (proxyTopics?.topics) {
                    saveCachedDailyTopics(proxyTopics);
                    return proxyTopics;
                }
            }
            proxyError = `proxy_http_${proxyResponse.status}`;
        } catch (error) {
            proxyError = error?.message || 'proxy_failed';
        }
    }

    const seed = seedForDate(date);
    const [news, history, astro, tarot] = await Promise.all([
        fetchNewsTopic(date, seed + 5),
        fetchHistoryTopic(date, seed + 9),
        fetchAstroTopic(date, 19),
        fetchTarotTopic(date, 29)
    ]);
    const topics = {
        news: proxyError && news.source === 'fallback' ? { ...news, error: news.error || proxyError } : news,
        history: proxyError && history.source === 'fallback' ? { ...history, error: history.error || proxyError } : history,
        astro: proxyError && astro.source === 'fallback' ? { ...astro, error: astro.error || proxyError } : astro,
        tarot: proxyError && tarot.source === 'fallback' ? { ...tarot, error: tarot.error || proxyError } : tarot
    };
    const result = { date, topics, fetchedAt: Date.now(), source: proxyError ? 'daily-topic-system-after-proxy-fail' : 'daily-topic-system' };
    saveCachedDailyTopics(result);
    return result;
}

export const createFallbackDailyTopics = (now = new Date()) => {
    const date = getTodayStr(now);
    const seed = seedForDate(date);
    return {
        date,
        topics: {
            news: { type: 'news', text: pickBySeed(fallbackNewsTopics, seed + 5), source: 'fallback' },
            history: { type: 'history', text: pickBySeed(fallbackHistoryTopics, seed + 9), source: 'fallback' },
            astro: { type: 'astro', text: pickBySeed(ASTRO_TOPICS, seedForDate(date, 19)), source: 'fallback' },
            tarot: { type: 'tarot', text: createTarotTopic(date, 29), source: 'fallback' }
        },
        fetchedAt: Date.now(),
        source: 'fallback'
    };
};

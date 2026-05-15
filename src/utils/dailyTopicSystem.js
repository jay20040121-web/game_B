import { getTodayStr } from './dateUtils';

const DAILY_TOPIC_CACHE_KEY = 'pixel_monster_daily_topics';
const DAILY_TOPIC_SCHEMA_VERSION = 5;
const DAILY_TOPIC_CACHE_MS = 24 * 60 * 60 * 1000;
const EXTERNAL_PROXY_ENDPOINT = import.meta.env.VITE_PET_LETTER_AI_ENDPOINT || '';
const GOOGLE_NEWS_TW_RSS_URL = 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
const GOOGLE_NEWS_LIGHT_RSS_URLS = [
    'https://news.google.com/rss/search?q=%E5%8B%95%E7%89%A9%20%E5%8F%B0%E7%81%A3&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
    'https://news.google.com/rss/search?q=%E7%94%9F%E6%85%8B%20%E8%87%AA%E7%84%B6%20%E5%8F%B0%E7%81%A3&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
    'https://news.google.com/rss/search?q=%E7%A7%91%E5%AD%B8%20%E6%96%B0%E7%9F%A5%20%E5%8F%B0%E7%81%A3&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
    'https://news.google.com/rss/search?q=%E5%A4%AA%E7%A9%BA%20%E5%A4%A9%E6%96%87%20%E5%8F%B0%E7%81%A3&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'
];

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
    '今日小知識：海獺睡覺時會牽著同伴，避免自己被海流沖走。',
    '今日自然消息：蜜蜂會用跳舞告訴同伴花蜜方向，像一張會動的地圖。',
    '今日太空小知識：月亮每天升起的時間大約會晚一些，所以夜空每天都不太一樣。'
];
const CNA_NEWS_RSS_ENDPOINTS = [
    'https://feeds.feedburner.com/rsscna/technology',
    'https://feeds.feedburner.com/rsscna/lifehealth',
    'https://feeds.feedburner.com/rsscna/local'
];

const fallbackHistoryTopics = [
    '歷史上的今天也可能有科學家出生，很多發現都是從好奇開始的。',
    '以前的今天有人仰望天空，也有人記錄自然；小觀察會慢慢變成知識。',
    '今天在歷史裡適合記一個小節日或一個新發現，讓日子不只是日期。'
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
    Wand: '權杖',
    Cups: '聖杯',
    Cup: '聖杯',
    Swords: '寶劍',
    Sword: '寶劍',
    Pentacles: '錢幣',
    Pentacle: '錢幣'
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
    .replace(/<!--.*?-->/g, '')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim()
    .slice(0, max);

const isMostlyEnglish = (text = '') => {
    const letters = String(text).match(/[A-Za-z]/g)?.length || 0;
    const zh = String(text).match(/[\u4e00-\u9fff]/g)?.length || 0;
    return letters > 12 && letters > zh * 2;
};

const ENGLISH_TOPIC_CATEGORIES = [
    { keywords: ['election', 'president', 'minister', 'government', 'parliament', 'senate', 'vote'], label: '政治消息' },
    { keywords: ['war', 'military', 'attack', 'missile', 'army', 'ceasefire', 'conflict'], label: '國際衝突消息' },
    { keywords: ['market', 'economy', 'inflation', 'company', 'stock', 'bank', 'trade'], label: '經濟與產業消息' },
    { keywords: ['climate', 'weather', 'storm', 'earthquake', 'flood', 'wildfire', 'temperature'], label: '氣候與環境消息' },
    { keywords: ['space', 'nasa', 'satellite', 'moon', 'mars', 'rocket'], label: '太空與科學消息' },
    { keywords: ['research', 'study', 'scientist', 'technology', 'ai', 'computer'], label: '科學與科技消息' },
    { keywords: ['film', 'music', 'artist', 'museum', 'book', 'festival'], label: '文化消息' },
    { keywords: ['sport', 'football', 'baseball', 'basketball', 'tennis', 'olympic'], label: '運動消息' }
];

const pickEnglishCategory = (text = '', fallback = '外部消息') => {
    const lower = String(text).toLowerCase();
    return ENGLISH_TOPIC_CATEGORIES.find(item => item.keywords.some(keyword => lower.includes(keyword)))?.label || fallback;
};

const ENGLISH_ZH_REPLACEMENTS = [
    [/Bahamian general election/gi, '巴哈馬大選'],
    [/in the 巴哈馬大選/gi, '在巴哈馬大選中'],
    [/general election/gi, '大選'],
    [/Progressive Liberal Party/gi, '進步自由黨'],
    [/Prime Minister/gi, '總理'],
    [/president/gi, '總統'],
    [/parliament/gi, '國會'],
    [/government/gi, '政府'],
    [/election/gi, '選舉'],
    [/wins a second term/gi, '贏得第二任期'],
    [/wins/gi, '勝出'],
    [/led by/gi, '由'],
    [/in the Bahamas/gi, '在巴哈馬'],
    [/the Bahamas/gi, '巴哈馬'],
    [/United States/gi, '美國'],
    [/Japan/gi, '日本'],
    [/Taiwan/gi, '台灣'],
    [/China/gi, '中國'],
    [/Nvidia/gi, '輝達'],
    [/artificial intelligence/gi, '人工智慧'],
    [/\bAI\b/g, 'AI'],
    [/company/gi, '公司'],
    [/market/gi, '市場'],
    [/announces/gi, '宣布'],
    [/says/gi, '表示'],
    [/launches/gi, '推出'],
    [/opens/gi, '啟用'],
    [/held/gi, '舉行'],
    [/to elect/gi, '選出'],
    [/members/gi, '成員']
];

const translateEnglishSnippet = (text = '') => {
    let translated = compactText(text, 180)
        .replace(/\s*\(pictured\)\s*/gi, '')
        .replace(/^The\s+/i, '');
    ENGLISH_ZH_REPLACEMENTS.forEach(([pattern, replacement]) => {
        translated = translated.replace(pattern, replacement);
    });
    translated = translated
        .replace(/\s*,\s*/g, '，')
        .replace(/由\s+/g, '由')
        .replace(/贏得第二任期\s+在(.+?中)/g, '在$1贏得第二任期')
        .replace(/\s+\./g, '。')
        .replace(/\./g, '。')
        .replace(/\s+/g, ' ')
        .trim();
    return translated;
};

const translateExternalTopicText = (text = '', type = 'news') => {
    const clean = compactText(text, type === 'news' ? 180 : 80);
    if (!clean || !isMostlyEnglish(clean)) return compactText(clean, 52);
    const translated = translateEnglishSnippet(clean);
    if (translated && !isMostlyEnglish(translated)) return compactText(translated, type === 'news' ? 96 : 64);
    if (type === 'history') {
        const lower = clean.toLowerCase();
        if (/\bis born\b|\bborn\b/.test(lower)) return '英文史料記載：今天有人物誕生，後來留下重要影響。';
        if (/\bdies\b|\bdied\b|\bdeath\b/.test(lower)) return '英文史料記載：今天有人物離世，故事仍被後人記得。';
        if (/\bfounded\b|\bestablished\b|\bcreated\b/.test(lower)) return '英文史料記載：今天有重要組織或城市被建立。';
        if (/\bdiscovered\b|\bfirst\b|\blaunched\b|\bopened\b/.test(lower)) return '英文史料記載：今天出現了一個新的開始或發現。';
        return `英文史料提到一則${pickEnglishCategory(clean, '歷史事件')}。`;
    }
    return `英文來源提到一則${pickEnglishCategory(clean)}。`;
};

const formatNewsTopicText = (item = {}) => {
    const rawTitle = item.title || item.normalizedtitle || '';
    const rawDetail = item.story || item.extract || item.description || item.links?.[0]?.extract || '';
    const title = translateExternalTopicText(rawTitle, 'news');
    const detail = translateExternalTopicText(rawDetail, 'news');
    if (title) return `今天新聞標題：${title}`;
    if (detail) return `今天新聞標題：${detail}`;
    return null;
};

const getFeaturedNewsItems = (data = {}) => {
    const newsItems = (data.news || []).filter(item => item?.title || item?.story || item?.extract);
    if (newsItems.length) return newsItems;
    const mostReadItems = (data?.mostread?.articles || []).filter(item => item?.title || item?.story || item?.extract);
    if (mostReadItems.length) return mostReadItems;
    return data?.tfa ? [data.tfa] : [];
};

const ZODIAC_ASTRO_META = {
    aries: { ruler: '火星', theme: '行動、開局與主動出擊' },
    taurus: { ruler: '金星', theme: '穩定、資源與身體感受' },
    gemini: { ruler: '水星', theme: '溝通、資訊與選擇' },
    cancer: { ruler: '月亮', theme: '情緒、安全感與照顧' },
    leo: { ruler: '太陽', theme: '表現、自信與創造力' },
    virgo: { ruler: '水星', theme: '整理、細節與日常節奏' },
    libra: { ruler: '金星', theme: '關係、協調與公平感' },
    scorpio: { ruler: '冥王星', theme: '深層情緒、界線與轉化' },
    sagittarius: { ruler: '木星', theme: '遠方、學習與擴張' },
    capricorn: { ruler: '土星', theme: '責任、結構與長期目標' },
    aquarius: { ruler: '天王星', theme: '改變、獨立想法與新方法' },
    pisces: { ruler: '海王星', theme: '直覺、想像與感受力' }
};

const readHoroscopeFocus = (text = '') => {
    const lower = String(text || '').toLowerCase();
    if (/(communicat|conversation|message|speak|listen|words|advice|guidance)/.test(lower)) return '溝通與接收建議';
    if (/(work|career|task|project|goal|plan|organized|progress)/.test(lower)) return '工作目標與計畫推進';
    if (/(love|heart|relationship|friend|family|partner)/.test(lower)) return '關係互動與情感表達';
    if (/(money|finance|budget|spend|value)/.test(lower)) return '金錢安排與價值判斷';
    if (/(energy|health|rest|sleep|stress|balance)/.test(lower)) return '體力分配與休息平衡';
    if (/(change|chance|opportunity|new|start|initiative|lead)/.test(lower)) return '新機會與主動開始';
    return '整理方向與穩住節奏';
};

const translateHoroscopeText = (text = '', signName = '星座', seed = 0) => {
    const signId = Object.entries(ZODIAC_SIGN_NAMES).find(([, label]) => label === signName)?.[0];
    const meta = ZODIAC_ASTRO_META[signId] || { ruler: '行星', theme: '今日狀態與選擇' };
    const focus = readHoroscopeFocus(text);
    return `${signName}今日主題：${meta.ruler}象徵${meta.theme}；這段運勢重點落在${focus}。`;
};

const normalizeCachedTopics = (cached) => {
    if (!cached?.date || !cached?.topics) return null;
    if (cached.schemaVersion !== DAILY_TOPIC_SCHEMA_VERSION) return null;
    if (Date.now() - Number(cached.fetchedAt || 0) > DAILY_TOPIC_CACHE_MS) return null;
    const requiredKeys = ['news', 'history', 'astro', 'tarot'];
    if (!requiredKeys.every(key => cached.topics[key]?.text)) return null;
    return {
        ...cached,
        topics: {
            ...cached.topics,
            news: {
                ...cached.topics.news,
                text: String(cached.topics.news.text || '')
                    .replace(/新聞重點\s*[:：]/g, '新聞：')
                    .replace(/。?\s*重點\s*[:：].*$/g, '')
                    .trim()
            }
        }
    };
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

const fetchText = async (url) => {
    const response = await fetch(url, { headers: { Accept: 'application/rss+xml, application/xml, text/xml, text/plain' } });
    if (!response.ok) throw new Error(`topic_http_${response.status}`);
    return response.text();
};

const readXmlTag = (xml, tagName) => {
    const match = String(xml || '').match(new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
    if (!match) return '';
    return compactText(match[1].replace(/^<!\[CDATA\[([\s\S]*?)\]\]>$/i, '$1'), 180);
};

const parseRssItems = (xml) => {
    const itemMatches = String(xml || '').match(/<item\b[\s\S]*?<\/item>/gi) || [];
    return itemMatches.map(itemXml => ({
        title: readXmlTag(itemXml, 'title'),
        description: readXmlTag(itemXml, 'description'),
        link: readXmlTag(itemXml, 'link'),
        pubDate: readXmlTag(itemXml, 'pubDate')
    })).filter(item => item.title || item.description);
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

const MAJOR_TAROT_MEANINGS = {
    'The Fool': '新的開始、冒險與保持彈性',
    'The Magician': '把手上的資源組合起來，主動創造結果',
    'The High Priestess': '直覺、沉默觀察與尚未說出口的答案',
    'The Empress': '滋養、成長與讓事情自然成熟',
    'The Emperor': '秩序、界線與穩定掌控',
    'The Hierophant': '傳統規則、學習與可靠建議',
    'The Lovers': '重要選擇、關係連結與價值一致',
    'The Chariot': '集中意志、控制方向與推進目標',
    Strength: '溫柔的勇氣、耐心與內在力量',
    'The Hermit': '暫時退後、獨處思考與尋找答案',
    'Wheel of Fortune': '局勢轉動、時機變化與順勢調整',
    Justice: '公平判斷、責任與因果結果',
    'The Hanged Man': '換個角度、暫停與重新理解',
    Death: '結束舊階段，讓新的狀態開始',
    Temperance: '調和、節制與把不同部分放到平衡',
    'The Devil': '執著、誘惑與看見被綁住的地方',
    'The Tower': '突發變化、打破舊結構與重建',
    'The Star': '希望、修復與重新相信方向',
    'The Moon': '不確定、夢境與需要辨認情緒',
    'The Sun': '清楚、活力與事情攤在光下',
    Judgement: '回應召喚、重新評估與做出決定',
    'The World': '完成、整合與抵達一個階段'
};

const TAROT_SUIT_MEANINGS = {
    Wands: '行動、熱情與創造力',
    Wand: '行動、熱情與創造力',
    Cups: '情緒、關係與感受',
    Cup: '情緒、關係與感受',
    Swords: '思考、溝通與判斷',
    Sword: '思考、溝通與判斷',
    Pentacles: '現實資源、工作與身體狀態',
    Pentacle: '現實資源、工作與身體狀態'
};

const TAROT_RANK_MEANINGS = {
    Ace: '一個新的起點',
    Two: '兩邊之間的平衡或選擇',
    Three: '合作與初步成果',
    Four: '穩定，也可能有些停住',
    Five: '摩擦、缺口或需要調整',
    Six: '回應、支持與重新流動',
    Seven: '評估現況，決定下一步',
    Eight: '速度、累積或持續推進',
    Nine: '接近完成，但仍要守住狀態',
    Ten: '一個循環走到高點或負荷變重',
    Page: '剛開始學習的訊號',
    Knight: '帶著方向前進的力量',
    Queen: '成熟接住這個領域的能力',
    King: '掌握並管理這個領域的力量'
};

const explainTarotCard = (name) => {
    const cleanName = String(name || '').trim();
    const translatedName = translateTarotName(cleanName);
    if (MAJOR_TAROT_MEANINGS[cleanName]) {
        return `明日塔羅抽到「${translatedName}」，代表${MAJOR_TAROT_MEANINGS[cleanName]}。`;
    }
    const match = cleanName.match(/^(.+) of (.+)$/);
    if (!match) return `明日塔羅抽到「${translatedName}」，先看清牌面代表的主題再行動。`;
    const rankMeaning = TAROT_RANK_MEANINGS[match[1]] || '一種正在形成的力量';
    const suitMeaning = TAROT_SUIT_MEANINGS[match[2]] || '生活中的某個領域';
    const suitName = TAROT_SUIT_NAMES[match[2]] || translatedName.slice(0, 2);
    const rankName = TAROT_RANK_NAMES[match[1]] || match[1];
    return `明日塔羅抽到「${translatedName}」，${suitName}代表${suitMeaning}，${rankName}表示${rankMeaning}。`;
};

const LIGHT_TOPIC_KEYWORDS = [
    '動物', '貓', '狗', '鳥', '魚', '鯨', '海豚', '企鵝', '熊', '昆蟲', '蝴蝶', '蜜蜂', '水獺', '保育', '野生', '生態', '自然',
    '科學', '研究', '新知', '發現', '天文', '太空', '星球', '月球', '火星', '宇宙', '隕石', 'NASA', '植物', '海洋', '地質',
    'animal', 'wildlife', 'zoo', 'species', 'science', 'research', 'space', 'astronomy', 'planet', 'moon', 'mars', 'nasa'
];

const LIGHT_HISTORY_KEYWORDS = [
    ...LIGHT_TOPIC_KEYWORDS,
    '出生', '誕生', '生日', '節日', '紀念日', '啟用', '發射', '升空', '探測器', '望遠鏡', '博物館',
    'born', 'birthday', 'holiday', 'observance', 'festival', 'launched', 'spacecraft', 'telescope', 'discovered', 'founded'
];

const BLOCKED_TOPIC_KEYWORDS = [
    '政治', '政黨', '總統', '立委', '國會', '行政院', '立法院', '選舉', '罷免', '兩岸', '中國', '共軍', '軍演', '國防',
    '戰爭', '攻擊', '飛彈', '制裁', '外交', '貪污', '弊案', '死刑', '槍擊', '殺人', '詐騙', '車禍', '股市', '匯率',
    'election', 'president', 'minister', 'parliament', 'government', 'military', 'missile', 'war', 'attack', 'china', 'stock'
];

const scoreLightTopicText = (text = '', keywords = LIGHT_TOPIC_KEYWORDS) => {
    const source = String(text || '').toLowerCase();
    if (!source.trim()) return 0;
    if (BLOCKED_TOPIC_KEYWORDS.some(keyword => source.includes(String(keyword).toLowerCase()))) return -100;
    return keywords.reduce((score, keyword) => score + (source.includes(String(keyword).toLowerCase()) ? 1 : 0), 0);
};

const pickPreferredItem = (items = [], seed, textGetter, keywords = LIGHT_TOPIC_KEYWORDS) => {
    const scored = items
        .map(item => ({ item, score: scoreLightTopicText(textGetter(item), keywords) }))
        .filter(entry => entry.score > 0)
        .sort((a, b) => b.score - a.score);
    if (!scored.length) return null;
    const bestScore = scored[0].score;
    const pool = scored.filter(entry => entry.score === bestScore).map(entry => entry.item);
    return pickBySeed(pool, seed);
};

const formatRssNewsTopicText = (item = {}, label = '新聞') => {
    const title = compactText(item.title, 56);
    const description = compactText(String(item.description || '').replace(/^（中央社[^）]*）/, ''), 54);
    if (title) return `${label}：${title}`;
    if (description) return `${label}：${description}`;
    return null;
};

const fetchTaiwanRssNewsTopic = async (seed) => {
    const allItems = [];
    for (const endpoint of CNA_NEWS_RSS_ENDPOINTS) {
        try {
            const xml = await fetchText(endpoint);
            allItems.push(...parseRssItems(xml).map(item => ({ ...item, endpoint })));
        } catch (error) { }
    }
    if (allItems.length) {
        const picked = pickPreferredItem(allItems, seed, item => `${item.title} ${item.description}`);
        const text = formatRssNewsTopicText(picked, '中央社新聞');
        if (text) return createTopic('news', text, 'cna-rss');
    }

    for (const endpoint of GOOGLE_NEWS_LIGHT_RSS_URLS) {
        try {
            const xml = await fetchText(endpoint);
            const items = parseRssItems(xml);
            const picked = pickPreferredItem(items, seed, item => `${item.title} ${item.description}`);
            const text = formatRssNewsTopicText(picked, '小知識新聞');
            if (text) return createTopic('news', text, 'google-news-light-rss');
        } catch (error) { }
    }

    try {
        const xml = await fetchText(GOOGLE_NEWS_TW_RSS_URL);
        const items = parseRssItems(xml);
        const picked = pickPreferredItem(items, seed, item => `${item.title} ${item.description}`);
        const text = formatRssNewsTopicText(picked, '台灣新聞');
        if (text) return createTopic('news', text, 'google-news-tw-rss');
    } catch (error) { }

    return null;
};

const fetchNewsTopic = async (date, seed) => {
    const taiwanNews = await fetchTaiwanRssNewsTopic(seed);
    if (taiwanNews) return taiwanNews;

    const [, year, month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
    const endpoints = year && month && day ? [
        `https://zh.wikipedia.org/api/rest_v1/feed/featured/${year}/${month}/${day}`,
        `https://en.wikipedia.org/api/rest_v1/feed/featured/${year}/${month}/${day}`,
        `https://api.wikimedia.org/feed/v1/wikipedia/zh/featured/${year}/${month}/${day}`,
        `https://api.wikimedia.org/feed/v1/wikipedia/en/featured/${year}/${month}/${day}`
    ] : ['https://zh.wikipedia.org/api/rest_v1/feed/featured'];
    let backupItems = [];
    for (const endpoint of endpoints) {
        try {
            const data = await fetchJson(endpoint);
            const newsItems = (data.news || []).filter(item => item?.title || item?.story || item?.extract);
            if (!backupItems.length) backupItems = getFeaturedNewsItems(data);
            const items = newsItems.length ? newsItems : [];
            if (!items.length) continue;
            const picked = pickPreferredItem(items, seed, item => `${item.title} ${item.story || ''} ${item.extract || ''}`);
            const text = formatNewsTopicText(picked);
            if (text) return createTopic('news', text, endpoint.includes('/en/') || endpoint.includes('en.wikipedia') ? 'wikipedia-featured-en' : 'wikipedia-featured-zh');
        } catch (error) {
            // Try the next endpoint before falling back.
        }
    }
    const backup = pickPreferredItem(backupItems, seed, item => `${item.title} ${item.story || ''} ${item.extract || ''}`);
    const backupText = formatNewsTopicText(backup);
    if (backupText) return createTopic('news', backupText, 'wikipedia-featured-backup');
    return createTopic('news', pickBySeed(fallbackNewsTopics, seed), 'fallback', 'news_empty');
};

const fetchHistoryTopic = async (date, seed) => {
    const [, month, day] = date.match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
    if (!month || !day) return createTopic('history', pickBySeed(fallbackHistoryTopics, seed), 'fallback', 'bad_date');

    const endpoints = [
        `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,
        `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
        `https://api.wikimedia.org/feed/v1/wikipedia/zh/onthisday/all/${month}/${day}`,
        `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`
    ];

    for (const endpoint of endpoints) {
        try {
            const data = await fetchJson(endpoint);
            const events = [
                ...(data.events || []),
                ...(data.selected || [])
            ].filter(item => item?.text);
            if (events.length === 0) continue;
            const event = pickPreferredItem(events, seed, item => `${item.text || ''} ${item.pages?.map(page => page?.title).join(' ') || ''}`, LIGHT_HISTORY_KEYWORDS);
            if (!event) continue;
            const year = event?.year ? `${event.year} 年，` : '';
            const text = translateExternalTopicText(event?.text, 'history');
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
            return createTopic('astro', translateHoroscopeText(data.data.horoscope, signName, seedForDate(date, seed)), 'freehoroscopeapi-translated');
        }
    } catch (error) {
        return createTopic('astro', pickBySeed(ASTRO_TOPICS, seedForDate(date, seed)), 'fallback', error?.message || 'astro_failed');
    }
    return createTopic('astro', pickBySeed(ASTRO_TOPICS, seedForDate(date, seed)), 'fallback', 'astro_empty');
};

const createTarotTopic = (date, seed, cardOverride = null) => {
    if (cardOverride) {
        const name = compactText(cardOverride.name, 18);
        if (name) return explainTarotCard(name);
    }
    const card = pickBySeed(TAROT_CARDS, seedForDate(date, seed));
    return `明日塔羅是「${card.name}」，代表${card.message}`;
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
                    const normalizedProxyTopics = { ...proxyTopics, schemaVersion: DAILY_TOPIC_SCHEMA_VERSION };
                    saveCachedDailyTopics(normalizedProxyTopics);
                    return normalizedProxyTopics;
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
    const result = { date, topics, fetchedAt: Date.now(), source: proxyError ? 'daily-topic-system-after-proxy-fail' : 'daily-topic-system', schemaVersion: DAILY_TOPIC_SCHEMA_VERSION };
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
        source: 'fallback',
        schemaVersion: DAILY_TOPIC_SCHEMA_VERSION
    };
};

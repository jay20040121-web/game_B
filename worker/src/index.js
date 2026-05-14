const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const MAX_REPLY_CHARS = 120;
const MAX_TEXT_CHARS = 240;

const allowedOriginPatterns = [
    /^https:\/\/jay20040121-web\.github\.io$/,
    /^http:\/\/localhost:\d+$/,
    /^http:\/\/127\.0\.0\.1:\d+$/
];

const jsonResponse = (body, status = 200, extraHeaders = {}) => new Response(JSON.stringify(body), {
    status,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        ...extraHeaders
    }
});

class HttpError extends Error {
    constructor(status, code, detail = '') {
        super(code);
        this.status = status;
        this.code = code;
        this.detail = detail;
    }
}

const corsHeaders = (request) => {
    const origin = request.headers.get('origin') || '';
    const headers = {
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
    };
    if (allowedOriginPatterns.some(pattern => pattern.test(origin))) {
        headers['Access-Control-Allow-Origin'] = origin;
        headers.Vary = 'Origin';
    }
    return headers;
};

const limitText = (value, max = MAX_TEXT_CHARS) => String(value || '').trim().slice(0, max);

const publicErrorDetail = (error) => {
    const name = limitText(error?.name || 'Error', 40).replace(/[^a-zA-Z0-9_-]/g, '_');
    const message = limitText(error?.message || 'unknown_error', 120);
    return { code: `unexpected_${name}`, detail: message };
};

const sanitizeNumber = (value, fallback = 0) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const compactText = (text, max = 52) => String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\[[^\]]+\]/g, '')
    .replace(/<\/?[^>]+>/g, '')
    .trim()
    .slice(0, max);

const pickBySeed = (items, seed) => items[Math.abs(seed) % items.length];

const seedForDate = (date, offset = 0) => Number(String(date || '').replace(/\D/g, '')) + offset;

const fetchJson = async (url) => {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/json',
            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.7',
            'User-Agent': 'pixel-monster-game/1.0 (daily letter external context)'
        }
    });
    if (!response.ok) throw new Error(`http_${response.status}`);
    return response.json();
};

const sanitizeContext = (body = {}) => ({
    letterId: limitText(body.letterId, 80),
    date: limitText(body.date, 16),
    slotId: limitText(body.slotId, 16),
    label: limitText(body.label, 24),
    monsterName: limitText(body.monsterName, 24) || '像素怪獸',
    monsterId: limitText(body.monsterId, 12),
    level: sanitizeNumber(body.level, 1),
    hunger: sanitizeNumber(body.hunger, 50),
    mood: sanitizeNumber(body.mood, 50),
    bondValue: sanitizeNumber(body.bondValue, 0),
    todayTrainWins: sanitizeNumber(body.todayTrainWins, 0),
    todayWildDefeated: sanitizeNumber(body.todayWildDefeated, 0),
    todayFeedCount: sanitizeNumber(body.todayFeedCount, 0),
    personalityCounts: typeof body.personalityCounts === 'object' && body.personalityCounts ? body.personalityCounts : {},
    traitName: limitText(body.traitName, 24),
    lastPlayerReply: limitText(body.lastPlayerReply, MAX_REPLY_CHARS),
    constraints: {
        locale: 'zh-TW',
        minPages: 3,
        maxPages: 5,
        maxCharsPerPage: 45
    }
});

const base64UrlDecode = (value) => {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, char => char.charCodeAt(0));
};

const parseJwtPart = (value) => JSON.parse(new TextDecoder().decode(base64UrlDecode(value)));

const importJwk = (jwk) => crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
);

const verifyFirebaseUser = async (request, env) => {
    const authHeader = request.headers.get('authorization') || '';
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) return null;

    const token = match[1];
    const parts = token.split('.');
    if (parts.length !== 3) throw new HttpError(401, 'invalid_token');

    const header = parseJwtPart(parts[0]);
    const payload = parseJwtPart(parts[1]);
    const projectId = env.FIREBASE_PROJECT_ID;
    const now = Math.floor(Date.now() / 1000);

    if (header.alg !== 'RS256' || !header.kid) throw new HttpError(401, 'invalid_token_header');
    if (payload.aud !== projectId) throw new HttpError(401, 'invalid_token_audience');
    if (payload.iss !== `https://securetoken.google.com/${projectId}`) throw new HttpError(401, 'invalid_token_issuer');
    if (!payload.sub || payload.exp < now || payload.iat > now + 300) throw new HttpError(401, 'invalid_token_claims');

    const certResponse = await fetch(GOOGLE_CERTS_URL, {
        cf: { cacheTtl: 3600, cacheEverything: true }
    });
    if (!certResponse.ok) throw new HttpError(502, 'cert_fetch_failed');

    const jwks = await certResponse.json();
    const jwk = jwks.keys?.find(key => key.kid === header.kid);
    if (!jwk) throw new HttpError(401, 'cert_not_found');

    const key = await importJwk(jwk);
    const verified = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        key,
        base64UrlDecode(parts[2]),
        new TextEncoder().encode(`${parts[0]}.${parts[1]}`)
    );
    if (!verified) throw new HttpError(401, 'invalid_token_signature');
    return payload.sub;
};

const normalizePages = (pages) => {
    if (!Array.isArray(pages)) return [];
    return pages
        .map(page => limitText(page, 80))
        .filter(Boolean)
        .slice(0, 5);
};

const buildPromptInput = (context) => ([
    {
        role: 'developer',
        content: [
            {
                type: 'input_text',
                text: [
                    '你是像素怪獸電子寵物遊戲中的怪獸本人。',
                    '請用繁體中文寫一封短短信給玩家，像正在回覆玩家剛寄來的信。',
                    '語氣要符合電子寵物陪伴感，像怪獸本人，不要像旁白或公告。',
                    '如果 lastPlayerReply 有內容，第一或第二句必須自然回應那句話的情緒或意思，但不要逐字複製超過 12 個字。',
                    '要提到一個今天狀態或遊戲事件，再接回牠想對玩家說的心情。',
                    '句子要有互動感，可以使用「你剛剛說」、「我有記得」、「下次你來時」這類回應，但不要每封都固定同一句。',
                    '不要提到 AI、模型、系統、prompt、API、程式碼。',
                    '不要產生恐嚇、成人、血腥、仇恨或真實個資內容。',
                    '每句最多約 45 個中文字，適合小型 LCD UI。'
                ].join('\n')
            }
        ]
    },
    {
        role: 'user',
        content: [
            {
                type: 'input_text',
                text: JSON.stringify(context)
            }
        ]
    }
]);

const extractOutputText = (data) => {
    if (typeof data?.output_text === 'string') return data.output_text;
    const chunks = [];
    for (const item of data?.output || []) {
        for (const content of item?.content || []) {
            if (content?.type === 'output_text' && typeof content.text === 'string') {
                chunks.push(content.text);
            }
        }
    }
    return chunks.join('\n').trim();
};

const requestOpenAiPages = async (context, env) => {
    const apiKey = String(env.OPENAI_API_KEY || '').trim();
    if (!apiKey) throw new HttpError(500, 'openai_key_missing');
    if (!apiKey.startsWith('sk-')) throw new HttpError(500, 'openai_key_invalid_format');

    const response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: env.OPENAI_MODEL || 'gpt-4.1-mini',
            input: buildPromptInput(context),
            max_output_tokens: 500,
            text: {
                format: {
                    type: 'json_schema',
                    name: 'pet_letter_pages',
                    strict: true,
                    schema: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            pages: {
                                type: 'array',
                                minItems: 3,
                                maxItems: 5,
                                items: {
                                    type: 'string',
                                    maxLength: 80
                                }
                            }
                        },
                        required: ['pages']
                    }
                }
            }
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        throw new HttpError(502, `openai_http_${response.status}`, detail.slice(0, 160));
    }

    const data = await response.json();
    let parsed = null;
    try {
        parsed = JSON.parse(extractOutputText(data));
    } catch (error) {
        throw new HttpError(502, 'openai_invalid_json');
    }
    const pages = normalizePages(parsed.pages);
    if (pages.length < 3) throw new HttpError(502, 'openai_invalid_pages');
    return pages;
};

const weatherCodeGroups = {
    rainy: new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]),
    snowy: new Set([71, 73, 75, 77, 85, 86]),
    storm: new Set([95, 96, 99]),
    foggy: new Set([45, 48]),
    cloudy: new Set([1, 2, 3])
};

const classifyWeather = ({ temperature, apparentTemperature, precipitation, precipitationProbability, nextRainHours, weatherCode, windSpeed }) => {
    const temp = Number.isFinite(apparentTemperature) ? apparentTemperature : temperature;
    if (weatherCodeGroups.storm.has(weatherCode)) return 'storm';
    if (weatherCodeGroups.snowy.has(weatherCode)) return 'snowy';
    if (weatherCodeGroups.rainy.has(weatherCode) || precipitation > 0 || precipitationProbability >= 45 || nextRainHours >= 2) return 'rainy';
    if (Number.isFinite(temp) && temp >= 33) return 'hot';
    if (Number.isFinite(temp) && temp <= 12) return 'cold';
    if (Number.isFinite(windSpeed) && windSpeed >= 32) return 'windy';
    if (weatherCodeGroups.foggy.has(weatherCode)) return 'foggy';
    if (weatherCodeGroups.cloudy.has(weatherCode)) return 'cloudy';
    return 'comfortable';
};

const fetchWeatherProxy = async (request) => {
    const url = new URL(request.url);
    const lat = Number(url.searchParams.get('lat'));
    const lon = Number(url.searchParams.get('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) throw new HttpError(400, 'missing_lat_lon');
    const params = new URLSearchParams({
        latitude: lat.toFixed(2),
        longitude: lon.toFixed(2),
        current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
        hourly: 'precipitation_probability,precipitation,weather_code',
        timezone: 'auto',
        forecast_days: '1'
    });
    const data = await fetchJson(`${OPEN_METEO_URL}?${params.toString()}`);
    const current = data.current || {};
    const currentTime = current.time ? new Date(current.time).getTime() : Date.now();
    const hourly = data.hourly || {};
    const upcomingIndexes = (hourly.time || [])
        .map((time, index) => ({ index, time: new Date(time).getTime() }))
        .filter(entry => entry.time >= currentTime && entry.time <= currentTime + 6 * 60 * 60 * 1000)
        .map(entry => entry.index);
    const precipitationProbability = upcomingIndexes.reduce((max, index) => Math.max(max, Number(hourly.precipitation_probability?.[index] || 0)), 0);
    const nextRainHours = upcomingIndexes.filter(index => {
        const rain = Number(hourly.precipitation?.[index] || 0);
        const chance = Number(hourly.precipitation_probability?.[index] || 0);
        const code = Number(hourly.weather_code?.[index]);
        return rain > 0 || chance >= 45 || weatherCodeGroups.rainy.has(code) || weatherCodeGroups.storm.has(code);
    }).length;
    const weather = {
        temperature: Number(current.temperature_2m),
        apparentTemperature: Number(current.apparent_temperature),
        precipitation: Number(current.precipitation),
        precipitationProbability,
        nextRainHours,
        weatherCode: Number(current.weather_code),
        windSpeed: Number(current.wind_speed_10m),
        fetchedAt: Date.now(),
        source: 'worker-open-meteo'
    };
    weather.status = classifyWeather(weather);
    return weather;
};

const fallbackNewsTopics = [
    '早上的新聞很多，我挑重點提醒你：先確認今天最重要的一件事。',
    '今天外面的消息很多，你不用全接住，先照顧眼前的生活。'
];
const fallbackHistoryTopics = [
    '歷史上的今天也有人做選擇；今天我們也把一件小事做好。',
    '以前的今天留下很多故事，我想把今天也記成我們的小故事。'
];
const astroFallback = [
    '今晚星象提醒：如果事情卡住，就慢一點，不要急著怪自己。',
    '火星像行動按鈕；明天先選方向，再用力按下去。'
];
const tarotFallback = [
    '明日塔羅是「愚者」。可以試新事，但先看好腳下。',
    '明日塔羅是「力量」。用溫柔穩住自己，比硬撐更強。'
];
const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
const signNames = {
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
const astroAdvice = [
    '先退一步看清楚，再決定今天要追哪個方向。',
    '說話前多確認一次，誤會就不容易變大。',
    '把力氣留給重要的事，零碎雜音先放旁邊。',
    '適合慢慢整理心情，也適合把謝謝說清楚。'
];
const tarotCardsZh = {
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
const tarotRankNames = {
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
const tarotSuitNames = {
    Wands: '權杖',
    Cups: '聖杯',
    Swords: '寶劍',
    Pentacles: '錢幣'
};
const tarotAdvice = [
    '明天先試小步，不要一次押太大。',
    '明天把節奏放穩，會比硬衝更順。',
    '明天適合整理選擇，留下真正重要的。',
    '明天先照顧自己，才有力氣照顧別的事。'
];
const translateTarotName = (name) => {
    if (tarotCardsZh[name]) return tarotCardsZh[name];
    const match = String(name || '').match(/^(.+) of (.+)$/);
    if (!match) return name;
    const rank = tarotRankNames[match[1]];
    const suit = tarotSuitNames[match[2]];
    return rank && suit ? `${suit}${rank}` : name;
};

const topic = (type, text, source, error = null) => ({ type, text, source, error });

const fetchNewsTopic = async (date, seed) => {
    const [, year, month, day] = date.match(/^(\d{4})-(\d{2})-(\d{2})$/) || [];
    const endpoint = year && month && day
        ? `https://zh.wikipedia.org/api/rest_v1/feed/featured/${year}/${month}/${day}`
        : 'https://zh.wikipedia.org/api/rest_v1/feed/featured';
    try {
        const data = await fetchJson(endpoint);
        const items = [...(data?.news || []), ...(data?.mostread?.articles || [])].filter(item => item?.title || item?.story || item?.extract);
        const picked = pickBySeed(items, seed);
        const text = compactText(picked?.title || picked?.story || picked?.extract, 36);
        if (text) return topic('news', `今天新聞我挑一件：${text}`, 'worker-wikipedia-featured');
    } catch (error) {
        return topic('news', pickBySeed(fallbackNewsTopics, seed), 'fallback', error?.message || 'news_failed');
    }
    return topic('news', pickBySeed(fallbackNewsTopics, seed), 'fallback', 'news_empty');
};

const fetchHistoryTopic = async (date, seed) => {
    const [, month, day] = date.match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
    if (!month || !day) return topic('history', pickBySeed(fallbackHistoryTopics, seed), 'fallback', 'bad_date');
    for (const endpoint of [
        `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`
    ]) {
        try {
            const data = await fetchJson(endpoint);
            const events = Array.isArray(data.events) ? data.events.filter(item => item?.text) : [];
            if (!events.length) continue;
            const event = pickBySeed(events, seed);
            const text = compactText(event.text, 42);
            if (text) return topic('history', `歷史上的今天：${event.year ? `${event.year} 年，` : ''}${text}`, endpoint.includes('/zh.') ? 'worker-wikipedia-zh' : 'worker-wikipedia-en');
        } catch (error) { }
    }
    return topic('history', pickBySeed(fallbackHistoryTopics, seed), 'fallback', 'history_failed');
};

const fetchAstroTopic = async (date, seed) => {
    const sign = pickBySeed(signs, seedForDate(date, seed));
    try {
        const data = await fetchJson(`https://freehoroscopeapi.com/api/v1/get-horoscope/daily?sign=${encodeURIComponent(sign)}`);
        const apiSign = String(data?.data?.sign || sign).toLowerCase();
        if (data?.data?.horoscope) {
            const signName = signNames[apiSign] || signNames[sign] || apiSign;
            return topic('astro', `今日星象更新到${signName}：${pickBySeed(astroAdvice, seedForDate(date, seed))}`, 'worker-freehoroscopeapi');
        }
    } catch (error) {
        return topic('astro', pickBySeed(astroFallback, seedForDate(date, seed)), 'fallback', error?.message || 'astro_failed');
    }
    return topic('astro', pickBySeed(astroFallback, seedForDate(date, seed)), 'fallback', 'astro_empty');
};

const fetchTarotTopic = async (date, seed) => {
    try {
        const data = await fetchJson('https://freehoroscopeapi.com/api/v1/tarot/cards/random?n=1&minor=true');
        const card = Array.isArray(data?.cards) ? data.cards[0] : null;
        const name = compactText(card?.name, 18);
        if (name) return topic('tarot', `明日塔羅抽到「${translateTarotName(name)}」。${pickBySeed(tarotAdvice, seedForDate(date, seed))}`, 'worker-freehoroscopeapi');
    } catch (error) {
        return topic('tarot', pickBySeed(tarotFallback, seedForDate(date, seed)), 'fallback', error?.message || 'tarot_failed');
    }
    return topic('tarot', pickBySeed(tarotFallback, seedForDate(date, seed)), 'fallback', 'tarot_empty');
};

const fetchTopicsProxy = async (request) => {
    const url = new URL(request.url);
    const date = url.searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const seed = seedForDate(date);
    const [news, history, astro, tarot] = await Promise.all([
        fetchNewsTopic(date, seed + 5),
        fetchHistoryTopic(date, seed + 9),
        fetchAstroTopic(date, 19),
        fetchTarotTopic(date, 29)
    ]);
    return { date, topics: { news, history, astro, tarot }, fetchedAt: Date.now(), source: 'worker-topic-proxy' };
};

export default {
    async fetch(request, env) {
        const cors = corsHeaders(request);
        const url = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response('', { status: 204, headers: cors });
        }
        if (request.method === 'GET' && url.pathname === '/external/weather') {
            try {
                return jsonResponse(await fetchWeatherProxy(request), 200, cors);
            } catch (error) {
                const unexpected = publicErrorDetail(error);
                return jsonResponse({ error: error.code || unexpected.code, detail: error.detail || unexpected.detail }, error.status || 500, cors);
            }
        }
        if (request.method === 'GET' && url.pathname === '/external/topics') {
            try {
                return jsonResponse(await fetchTopicsProxy(request), 200, cors);
            } catch (error) {
                const unexpected = publicErrorDetail(error);
                return jsonResponse({ error: error.code || unexpected.code, detail: error.detail || unexpected.detail }, error.status || 500, cors);
            }
        }
        if (request.method !== 'POST') {
            return jsonResponse({ error: 'method_not_allowed' }, 405, cors);
        }
        if (!env.OPENAI_API_KEY) {
            return jsonResponse({ error: 'openai_key_missing' }, 500, cors);
        }

        try {
            const uid = await verifyFirebaseUser(request, env);
            if (!uid) return jsonResponse({ error: 'firebase_auth_required' }, 401, cors);

            const body = await request.json();
            const context = sanitizeContext(body);
            if (!context.letterId || !context.date || !context.slotId) {
                return jsonResponse({ error: 'missing_letter_identity' }, 400, cors);
            }

            const pages = await requestOpenAiPages({ ...context, uid }, env);
            return jsonResponse({ pages }, 200, cors);
        } catch (error) {
            console.error('pet letter worker failed', error);
            if (error instanceof HttpError) {
                return jsonResponse({
                    error: error.code,
                    detail: error.detail || undefined
                }, error.status, cors);
            }
            const unexpected = publicErrorDetail(error);
            return jsonResponse({ error: unexpected.code, detail: unexpected.detail }, 500, cors);
        }
    }
};

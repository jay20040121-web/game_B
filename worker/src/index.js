const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const GEMINI_GENERATE_URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const GOOGLE_NEWS_TW_RSS_URL = 'https://news.google.com/rss?hl=zh-TW&gl=TW&ceid=TW:zh-Hant';
const GOOGLE_NEWS_LIGHT_RSS_URLS = [
    'https://news.google.com/rss/search?q=%E5%8B%95%E7%89%A9%20%E5%8F%B0%E7%81%A3&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
    'https://news.google.com/rss/search?q=%E7%94%9F%E6%85%8B%20%E8%87%AA%E7%84%B6%20%E5%8F%B0%E7%81%A3&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
    'https://news.google.com/rss/search?q=%E7%A7%91%E5%AD%B8%20%E6%96%B0%E7%9F%A5%20%E5%8F%B0%E7%81%A3&hl=zh-TW&gl=TW&ceid=TW:zh-Hant',
    'https://news.google.com/rss/search?q=%E5%A4%AA%E7%A9%BA%20%E5%A4%A9%E6%96%87%20%E5%8F%B0%E7%81%A3&hl=zh-TW&gl=TW&ceid=TW:zh-Hant'
];
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

const sanitizeOptionalNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
};

const sanitizeWeather = (weather = {}) => ({
    status: limitText(weather.status, 24) || 'unknown',
    apparentTemperature: sanitizeOptionalNumber(weather.apparentTemperature),
    temperature: sanitizeOptionalNumber(weather.temperature),
    precipitationProbability: sanitizeOptionalNumber(weather.precipitationProbability),
    nextRainHours: sanitizeNumber(weather.nextRainHours, 0),
    source: limitText(weather.source, 48)
});

const sanitizeDailyTopic = (dailyTopic = {}) => ({
    type: limitText(dailyTopic.type, 24),
    text: limitText(dailyTopic.text, 120),
    source: limitText(dailyTopic.source, 48)
});

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

const pickBySeed = (items, seed) => items[Math.abs(seed) % items.length];

const seedForDate = (date, offset = 0) => Number(String(date || '').replace(/\D/g, '')) + offset;

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

const signAstroMeta = {
    aries: { ruler: '火星', element: '火象', theme: '行動、開局與主動出擊' },
    taurus: { ruler: '金星', element: '土象', theme: '穩定、資源與身體感受' },
    gemini: { ruler: '水星', element: '風象', theme: '溝通、資訊與選擇' },
    cancer: { ruler: '月亮', element: '水象', theme: '情緒、安全感與照顧' },
    leo: { ruler: '太陽', element: '火象', theme: '表現、自信與創造力' },
    virgo: { ruler: '水星', element: '土象', theme: '整理、細節與日常節奏' },
    libra: { ruler: '金星', element: '風象', theme: '關係、協調與公平感' },
    scorpio: { ruler: '冥王星', element: '水象', theme: '深層情緒、界線與轉化' },
    sagittarius: { ruler: '木星', element: '火象', theme: '遠方、學習與擴張' },
    capricorn: { ruler: '土星', element: '土象', theme: '責任、結構與長期目標' },
    aquarius: { ruler: '天王星', element: '風象', theme: '改變、獨立想法與新方法' },
    pisces: { ruler: '海王星', element: '水象', theme: '直覺、想像與感受力' }
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
    const signId = Object.entries(signNames).find(([, label]) => label === signName)?.[0];
    const meta = signAstroMeta[signId] || { ruler: '行星', element: '星象', theme: '今日狀態與選擇' };
    const focus = readHoroscopeFocus(text);
    return `${signName}今日主題：${meta.ruler}象徵${meta.theme}；這段運勢重點落在${focus}。`;
};

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

const fetchText = async (url) => {
    const response = await fetch(url, {
        headers: {
            Accept: 'application/rss+xml, application/xml, text/xml, text/plain',
            'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.7',
            'User-Agent': 'pixel-monster-game/1.0 (daily letter external context)'
        }
    });
    if (!response.ok) throw new Error(`http_${response.status}`);
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
    weather: sanitizeWeather(body.weather),
    dailyTopic: sanitizeDailyTopic(body.dailyTopic),
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
                    '可以自然參考 weather 或 dailyTopic，但不要像報告資料來源，也不要硬塞每個欄位。',
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

const buildPetLetterInstructions = () => ([
    '你是像素怪獸電子寵物遊戲中的怪獸本人。',
    '請用繁體中文寫一封短短信給玩家，像正在回覆玩家剛寄來的信。',
    '語氣要符合電子寵物陪伴感，像怪獸本人，不要像旁白或公告。',
    '如果 lastPlayerReply 有內容，第一或第二句必須自然回應那句話的情緒或意思，但不要逐字複製超過 12 個字。',
    '可以自然參考 weather 或 dailyTopic，但不要像報告資料來源，也不要硬塞每個欄位。',
    '要提到一個今天狀態或遊戲事件，再接回牠想對玩家說的心情。',
    '句子要有互動感，可以使用「你剛剛說」、「我有記得」、「下次你來時」這類回應，但不要每封都固定同一句。',
    '不要提到 AI、模型、系統、prompt、API、程式碼。',
    '不要產生恐嚇、成人、血腥、仇恨或真實個資內容。',
    '每句最多約 45 個中文字，適合小型 LCD UI。',
    '只回傳 JSON：{"pages":["...","...","..."]}，pages 至少 3 句，最多 5 句。'
].join('\n'));

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

const extractGeminiText = (data) => {
    const chunks = [];
    for (const candidate of data?.candidates || []) {
        for (const part of candidate?.content?.parts || []) {
            if (typeof part?.text === 'string') chunks.push(part.text);
        }
    }
    return chunks.join('\n').trim();
};

const parsePagesJson = (text, provider) => {
    const cleaned = String(text || '')
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/i, '')
        .trim();
    let parsed = null;
    try {
        parsed = JSON.parse(cleaned);
    } catch (error) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match) throw new HttpError(502, `${provider}_invalid_json`);
        try {
            parsed = JSON.parse(match[0]);
        } catch (innerError) {
            throw new HttpError(502, `${provider}_invalid_json`);
        }
    }
    const pages = normalizePages(parsed.pages);
    if (pages.length < 3) throw new HttpError(502, `${provider}_invalid_pages`);
    return pages;
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
    return parsePagesJson(extractOutputText(data), 'openai');
};

const requestGeminiPages = async (context, env) => {
    const apiKey = String(env.GEMINI_API_KEY || '').trim();
    if (!apiKey) throw new HttpError(500, 'gemini_key_missing');

    const model = env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
    const response = await fetch(`${GEMINI_GENERATE_URL_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            systemInstruction: {
                parts: [{ text: buildPetLetterInstructions() }]
            },
            contents: [
                {
                    role: 'user',
                    parts: [{ text: JSON.stringify(context) }]
                }
            ],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 500,
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'OBJECT',
                    properties: {
                        pages: {
                            type: 'ARRAY',
                            minItems: 3,
                            maxItems: 5,
                            items: { type: 'STRING' }
                        }
                    },
                    required: ['pages']
                }
            }
        })
    });

    if (!response.ok) {
        const detail = await response.text();
        if (response.status === 429) {
            throw new HttpError(429, 'gemini_rate_limited', detail.slice(0, 160));
        }
        throw new HttpError(502, `gemini_http_${response.status}`, detail.slice(0, 160));
    }

    const data = await response.json();
    return parsePagesJson(extractGeminiText(data), 'gemini');
};

const requestAiPages = async (context, env) => {
    const provider = String(env.PET_LETTER_AI_PROVIDER || '').trim().toLowerCase();
    const preferGemini = provider === 'gemini' || (!provider && env.GEMINI_API_KEY);
    if (preferGemini) {
        try {
            return { pages: await requestGeminiPages(context, env), provider: 'gemini' };
        } catch (error) {
            if (provider === 'gemini' || !env.OPENAI_API_KEY) throw error;
            console.warn('gemini pet letter failed, falling back to openai', error?.message || error);
        }
    }
    return { pages: await requestOpenAiPages(context, env), provider: 'openai' };
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
    '今日小知識：海獺睡覺時會牽著同伴，避免自己被海流沖走。',
    '今日自然消息：蜜蜂會用跳舞告訴同伴花蜜方向，像一張會動的地圖。',
    '今日太空小知識：月亮每天升起的時間大約會晚一些，所以夜空每天都不太一樣。'
];
const cnaNewsRssEndpoints = [
    'https://feeds.feedburner.com/rsscna/technology',
    'https://feeds.feedburner.com/rsscna/lifehealth',
    'https://feeds.feedburner.com/rsscna/local'
];
const fallbackHistoryTopics = [
    '歷史上的今天也可能有科學家出生，很多發現都是從好奇開始的。',
    '以前的今天有人仰望天空，也有人記錄自然；小觀察會慢慢變成知識。',
    '今天在歷史裡適合記一個小節日或一個新發現，讓日子不只是日期。'
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
    Wand: '權杖',
    Cups: '聖杯',
    Cup: '聖杯',
    Swords: '寶劍',
    Sword: '寶劍',
    Pentacles: '錢幣',
    Pentacle: '錢幣'
};
const tarotAdvice = [
    '明天先試小步，不要一次押太大。',
    '明天把節奏放穩，會比硬衝更順。',
    '明天適合整理選擇，留下真正重要的。',
    '明天先照顧自己，才有力氣照顧別的事。'
];

const majorTarotMeanings = {
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

const suitMeanings = {
    Wands: '行動、熱情與創造力',
    Wand: '行動、熱情與創造力',
    Cups: '情緒、關係與感受',
    Cup: '情緒、關係與感受',
    Swords: '思考、溝通與判斷',
    Sword: '思考、溝通與判斷',
    Pentacles: '現實資源、工作與身體狀態',
    Pentacle: '現實資源、工作與身體狀態'
};

const rankMeanings = {
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

const translateTarotName = (name) => {
    if (tarotCardsZh[name]) return tarotCardsZh[name];
    const match = String(name || '').match(/^(.+) of (.+)$/);
    if (!match) return name;
    const rank = tarotRankNames[match[1]];
    const suit = tarotSuitNames[match[2]];
    return rank && suit ? `${suit}${rank}` : name;
};

const explainTarotCard = (name) => {
    const cleanName = String(name || '').trim();
    const translatedName = translateTarotName(cleanName);
    if (majorTarotMeanings[cleanName]) {
        return `明日塔羅抽到「${translatedName}」，代表${majorTarotMeanings[cleanName]}。`;
    }
    const match = cleanName.match(/^(.+) of (.+)$/);
    if (!match) return `明日塔羅抽到「${translatedName}」，先看清牌面代表的主題再行動。`;
    const rankMeaning = rankMeanings[match[1]] || '一種正在形成的力量';
    const suitMeaning = suitMeanings[match[2]] || '生活中的某個領域';
    const suitName = tarotSuitNames[match[2]] || translatedName.slice(0, 2);
    const rankName = tarotRankNames[match[1]] || match[1];
    return `明日塔羅抽到「${translatedName}」，${suitName}代表${suitMeaning}，${rankName}表示${rankMeaning}。`;
};

const topic = (type, text, source, error = null) => ({ type, text, source, error });

const lightTopicKeywords = [
    '動物', '貓', '狗', '鳥', '魚', '鯨', '海豚', '企鵝', '熊', '昆蟲', '蝴蝶', '蜜蜂', '水獺', '保育', '野生', '生態', '自然',
    '科學', '研究', '新知', '發現', '天文', '太空', '星球', '月球', '火星', '宇宙', '隕石', 'NASA', '植物', '海洋', '地質',
    'animal', 'wildlife', 'zoo', 'species', 'science', 'research', 'space', 'astronomy', 'planet', 'moon', 'mars', 'nasa'
];

const lightHistoryKeywords = [
    ...lightTopicKeywords,
    '出生', '誕生', '生日', '節日', '紀念日', '啟用', '發射', '升空', '探測器', '望遠鏡', '博物館',
    'born', 'birthday', 'holiday', 'observance', 'festival', 'launched', 'spacecraft', 'telescope', 'discovered', 'founded'
];

const blockedTopicKeywords = [
    '政治', '政黨', '總統', '立委', '國會', '行政院', '立法院', '選舉', '罷免', '兩岸', '中國', '共軍', '軍演', '國防',
    '戰爭', '攻擊', '飛彈', '制裁', '外交', '貪污', '弊案', '死刑', '槍擊', '殺人', '詐騙', '車禍', '股市', '匯率',
    'election', 'president', 'minister', 'parliament', 'government', 'military', 'missile', 'war', 'attack', 'china', 'stock'
];

const scoreLightTopicText = (text = '', keywords = lightTopicKeywords) => {
    const source = String(text || '').toLowerCase();
    if (!source.trim()) return 0;
    if (blockedTopicKeywords.some(keyword => source.includes(String(keyword).toLowerCase()))) return -100;
    return keywords.reduce((score, keyword) => score + (source.includes(String(keyword).toLowerCase()) ? 1 : 0), 0);
};

const pickPreferredItem = (items = [], seed, textGetter, keywords = lightTopicKeywords) => {
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
    for (const endpoint of cnaNewsRssEndpoints) {
        try {
            const xml = await fetchText(endpoint);
            allItems.push(...parseRssItems(xml).map(item => ({ ...item, endpoint })));
        } catch (error) { }
    }
    if (allItems.length) {
        const picked = pickPreferredItem(allItems, seed, item => `${item.title} ${item.description}`);
        const text = formatRssNewsTopicText(picked, '中央社新聞');
        if (text) return topic('news', text, 'worker-cna-rss');
    }

    for (const endpoint of GOOGLE_NEWS_LIGHT_RSS_URLS) {
        try {
            const xml = await fetchText(endpoint);
            const items = parseRssItems(xml);
            const picked = pickPreferredItem(items, seed, item => `${item.title} ${item.description}`);
            const text = formatRssNewsTopicText(picked, '小知識新聞');
            if (text) return topic('news', text, 'worker-google-news-light-rss');
        } catch (error) { }
    }

    try {
        const xml = await fetchText(GOOGLE_NEWS_TW_RSS_URL);
        const items = parseRssItems(xml);
        const picked = pickPreferredItem(items, seed, item => `${item.title} ${item.description}`);
        const text = formatRssNewsTopicText(picked, '台灣新聞');
        if (text) return topic('news', text, 'worker-google-news-tw-rss');
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
            if (text) return topic('news', text, endpoint.includes('/en/') || endpoint.includes('en.wikipedia') ? 'worker-wikipedia-featured-en' : 'worker-wikipedia-featured-zh');
        } catch (error) { }
    }
    const backup = pickPreferredItem(backupItems, seed, item => `${item.title} ${item.story || ''} ${item.extract || ''}`);
    const backupText = formatNewsTopicText(backup);
    if (backupText) return topic('news', backupText, 'worker-wikipedia-featured-backup');
    return topic('news', pickBySeed(fallbackNewsTopics, seed), 'fallback', 'news_empty');
};

const fetchHistoryTopic = async (date, seed) => {
    const [, month, day] = date.match(/^\d{4}-(\d{2})-(\d{2})$/) || [];
    if (!month || !day) return topic('history', pickBySeed(fallbackHistoryTopics, seed), 'fallback', 'bad_date');
    for (const endpoint of [
        `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,
        `https://zh.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${month}/${day}`,
        `https://en.wikipedia.org/api/rest_v1/feed/onthisday/all/${month}/${day}`,
        `https://api.wikimedia.org/feed/v1/wikipedia/zh/onthisday/all/${month}/${day}`,
        `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`
    ]) {
        try {
            const data = await fetchJson(endpoint);
            const events = [
                ...(data.events || []),
                ...(data.selected || [])
            ].filter(item => item?.text);
            if (!events.length) continue;
            const event = pickPreferredItem(events, seed, item => `${item.text || ''} ${item.pages?.map(page => page?.title).join(' ') || ''}`, lightHistoryKeywords);
            if (!event) continue;
            const text = translateExternalTopicText(event.text, 'history');
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
            return topic('astro', translateHoroscopeText(data.data.horoscope, signName, seedForDate(date, seed)), 'worker-freehoroscopeapi-translated');
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
        if (name) return topic('tarot', explainTarotCard(name), 'worker-freehoroscopeapi');
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
        if (!env.GEMINI_API_KEY && !env.OPENAI_API_KEY) {
            return jsonResponse({ error: 'ai_key_missing' }, 500, cors);
        }

        try {
            const uid = await verifyFirebaseUser(request, env);
            if (!uid) return jsonResponse({ error: 'firebase_auth_required' }, 401, cors);

            const body = await request.json();
            const context = sanitizeContext(body);
            if (!context.letterId || !context.date || !context.slotId) {
                return jsonResponse({ error: 'missing_letter_identity' }, 400, cors);
            }

            const result = await requestAiPages({ ...context, uid }, env);
            return jsonResponse(result, 200, cors);
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

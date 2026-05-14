const WEATHER_CACHE_KEY = 'pixel_monster_weather_context';
const WEATHER_CACHE_MS = 2 * 60 * 60 * 1000;
const EXTERNAL_PROXY_ENDPOINT = import.meta.env.VITE_PET_LETTER_AI_ENDPOINT || '';

const WEATHER_CODE_GROUPS = {
    rainy: new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]),
    snowy: new Set([71, 73, 75, 77, 85, 86]),
    storm: new Set([95, 96, 99]),
    foggy: new Set([45, 48]),
    cloudy: new Set([1, 2, 3])
};

export const createEmptyWeatherContext = (reason = 'not_requested') => ({
    status: 'unknown',
    reason,
    temperature: null,
    apparentTemperature: null,
    precipitation: null,
    precipitationProbability: null,
    nextRainHours: 0,
    weatherCode: null,
    windSpeed: null,
    fetchedAt: null,
    source: null
});

const classifyWeather = ({ temperature, apparentTemperature, precipitation, precipitationProbability, nextRainHours, weatherCode, windSpeed }) => {
    const temp = Number.isFinite(apparentTemperature) ? apparentTemperature : temperature;
    if (WEATHER_CODE_GROUPS.storm.has(weatherCode)) return 'storm';
    if (WEATHER_CODE_GROUPS.snowy.has(weatherCode)) return 'snowy';
    if (WEATHER_CODE_GROUPS.rainy.has(weatherCode) || precipitation > 0 || precipitationProbability >= 45 || nextRainHours >= 2) return 'rainy';
    if (Number.isFinite(temp) && temp >= 33) return 'hot';
    if (Number.isFinite(temp) && temp <= 12) return 'cold';
    if (Number.isFinite(windSpeed) && windSpeed >= 32) return 'windy';
    if (WEATHER_CODE_GROUPS.foggy.has(weatherCode)) return 'foggy';
    if (WEATHER_CODE_GROUPS.cloudy.has(weatherCode)) return 'cloudy';
    return 'comfortable';
};

const normalizeWeatherContext = (raw = {}) => {
    const temperature = Number(raw.temperature);
    const apparentTemperature = Number(raw.apparentTemperature);
    const precipitation = Number(raw.precipitation);
    const precipitationProbability = Number(raw.precipitationProbability);
    const nextRainHours = Number(raw.nextRainHours);
    const weatherCode = Number(raw.weatherCode);
    const windSpeed = Number(raw.windSpeed);
    return {
        status: raw.status || classifyWeather({
            temperature,
            apparentTemperature,
            precipitation,
            precipitationProbability,
            nextRainHours,
            weatherCode,
            windSpeed
        }),
        reason: raw.reason || null,
        temperature: Number.isFinite(temperature) ? temperature : null,
        apparentTemperature: Number.isFinite(apparentTemperature) ? apparentTemperature : null,
        precipitation: Number.isFinite(precipitation) ? precipitation : null,
        precipitationProbability: Number.isFinite(precipitationProbability) ? precipitationProbability : null,
        nextRainHours: Number.isFinite(nextRainHours) ? nextRainHours : 0,
        weatherCode: Number.isFinite(weatherCode) ? weatherCode : null,
        windSpeed: Number.isFinite(windSpeed) ? windSpeed : null,
        fetchedAt: Number(raw.fetchedAt || Date.now()),
        source: raw.source || 'open-meteo'
    };
};

export const loadCachedWeatherContext = () => {
    try {
        if (typeof localStorage === 'undefined') return null;
        const cached = JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY) || 'null');
        if (!cached?.fetchedAt || Date.now() - cached.fetchedAt > WEATHER_CACHE_MS) return null;
        return normalizeWeatherContext(cached);
    } catch (error) {
        return null;
    }
};

export const clearCachedWeatherContext = () => {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.removeItem(WEATHER_CACHE_KEY);
    } catch (error) { }
};

const saveCachedWeatherContext = (weather) => {
    try {
        if (typeof localStorage === 'undefined') return;
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weather));
    } catch (error) { }
};

const getCurrentPosition = () => new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('geolocation_unavailable'));
        return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: WEATHER_CACHE_MS
    });
});

export async function fetchWeatherContext(options = {}) {
    const cached = options.force ? null : loadCachedWeatherContext();
    if (cached) return cached;

    const position = await getCurrentPosition();
    const lat = position.coords.latitude.toFixed(2);
    const lon = position.coords.longitude.toFixed(2);
    if (EXTERNAL_PROXY_ENDPOINT) {
        try {
            const proxyUrl = new URL('/external/weather', EXTERNAL_PROXY_ENDPOINT);
            proxyUrl.searchParams.set('lat', lat);
            proxyUrl.searchParams.set('lon', lon);
            const proxyResponse = await fetch(proxyUrl.toString());
            if (proxyResponse.ok) {
                const weather = normalizeWeatherContext(await proxyResponse.json());
                saveCachedWeatherContext(weather);
                return weather;
            }
        } catch (error) { }
    }
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m',
        hourly: 'precipitation_probability,precipitation,weather_code',
        timezone: 'auto',
        forecast_days: '1'
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error(`weather_http_${response.status}`);

    const data = await response.json();
    const current = data.current || {};
    const currentTime = current.time ? new Date(current.time).getTime() : Date.now();
    const hourly = data.hourly || {};
    const hourlyTimes = hourly.time || [];
    const upcomingIndexes = hourlyTimes
        .map((time, index) => ({ index, time: new Date(time).getTime() }))
        .filter(entry => entry.time >= currentTime && entry.time <= currentTime + 6 * 60 * 60 * 1000)
        .map(entry => entry.index);
    const maxRainChance = upcomingIndexes.reduce((max, index) => Math.max(max, Number(hourly.precipitation_probability?.[index] || 0)), 0);
    const nextRainHours = upcomingIndexes.filter(index => {
        const rain = Number(hourly.precipitation?.[index] || 0);
        const chance = Number(hourly.precipitation_probability?.[index] || 0);
        const code = Number(hourly.weather_code?.[index]);
        return rain > 0 || chance >= 45 || WEATHER_CODE_GROUPS.rainy.has(code) || WEATHER_CODE_GROUPS.storm.has(code);
    }).length;
    const weather = normalizeWeatherContext({
        temperature: current.temperature_2m,
        apparentTemperature: current.apparent_temperature,
        precipitation: current.precipitation,
        precipitationProbability: maxRainChance,
        nextRainHours,
        weatherCode: current.weather_code,
        windSpeed: current.wind_speed_10m,
        fetchedAt: Date.now(),
        source: 'open-meteo'
    });
    saveCachedWeatherContext(weather);
    return weather;
}

export const createDebugWeatherContext = (status) => {
    if (!status) return null;
    const samples = {
        hot: { temperature: 35, apparentTemperature: 38, precipitation: 0, weatherCode: 0, windSpeed: 8 },
        cold: { temperature: 8, apparentTemperature: 6, precipitation: 0, weatherCode: 2, windSpeed: 12 },
        rainy: { temperature: 24, apparentTemperature: 25, precipitation: 1.4, precipitationProbability: 80, nextRainHours: 4, weatherCode: 61, windSpeed: 10 },
        storm: { temperature: 26, apparentTemperature: 28, precipitation: 5.2, precipitationProbability: 90, nextRainHours: 5, weatherCode: 95, windSpeed: 36 },
        snowy: { temperature: 1, apparentTemperature: -2, precipitation: 0.8, precipitationProbability: 70, nextRainHours: 3, weatherCode: 71, windSpeed: 14 },
        windy: { temperature: 22, apparentTemperature: 21, precipitation: 0, weatherCode: 1, windSpeed: 36 },
        cloudy: { temperature: 22, apparentTemperature: 22, precipitation: 0, weatherCode: 3, windSpeed: 8 },
        comfortable: { temperature: 25, apparentTemperature: 25, precipitation: 0, weatherCode: 0, windSpeed: 6 }
    };
    return normalizeWeatherContext({
        ...(samples[status] || samples.comfortable),
        status,
        fetchedAt: Date.now(),
        source: 'debug'
    });
};

// Web Audio API 8-bit 音效產生器 (使用 Singleton 以避免建立過多 Context 導致故障)
let audioCtx = null;

// 音效與音樂設定 (預設開啟)
let isSfxEnabled = localStorage.getItem('pixel_monster_sfx') !== 'false';
let isBgmEnabled = localStorage.getItem('pixel_monster_bgm') !== 'false';

export const setSfxEnabled = (enabled) => {
    isSfxEnabled = enabled;
    localStorage.setItem('pixel_monster_sfx', enabled);
};

export const getSfxEnabled = () => isSfxEnabled;

export const setBgmEnabled = (enabled) => {
    isBgmEnabled = enabled;
    localStorage.setItem('pixel_monster_bgm', enabled);
    if (!enabled && currentBgmAudio) {
        currentBgmAudio.pause();
    } else if (enabled && currentBgmSrc) {
        // 重新啟用時，如果已經有目標 BGM 則恢復播放
        playBGM(currentBgmSrc);
    }
};

export const getBgmEnabled = () => isBgmEnabled;

let sfxVolume = localStorage.getItem('pixel_monster_sfx_vol') !== null ? parseFloat(localStorage.getItem('pixel_monster_sfx_vol')) : 0.4;
let bgmVolume = localStorage.getItem('pixel_monster_bgm_vol') !== null ? parseFloat(localStorage.getItem('pixel_monster_bgm_vol')) : 0.3;

export const setSfxVolume = (vol) => {
    sfxVolume = vol;
    localStorage.setItem('pixel_monster_sfx_vol', vol);
};
export const getSfxVolume = () => sfxVolume;

export const setBgmVolume = (vol) => {
    bgmVolume = vol;
    localStorage.setItem('pixel_monster_bgm_vol', vol);
    if (currentBgmAudio) {
        currentBgmAudio.volume = vol;
    }
};
export const getBgmVolume = () => bgmVolume;

let currentBgmAudio = null;
let currentBgmSrc = null;

export const playBGM = (src) => {
    if (!isBgmEnabled) {
        currentBgmSrc = src; // 記住想播的 BGM，以便開啟音樂時能接續
        return;
    }
    if (currentBgmAudio) {
        if (currentBgmSrc === src) {
            currentBgmAudio.play().catch(e => console.warn('BGM play failed:', e));
            return;
        }
        currentBgmAudio.pause();
    }
    currentBgmSrc = src;
    currentBgmAudio = new Audio(src);
    currentBgmAudio.loop = true;
    currentBgmAudio.volume = bgmVolume;
    currentBgmAudio.play().catch(e => console.warn('BGM play failed:', e));
};

export const stopBGM = () => {
    if (currentBgmAudio) {
        currentBgmAudio.pause();
        currentBgmAudio = null;
        currentBgmSrc = null;
    }
};

const SOUND_MAP = {
    select: './assets/sound/選擇按鈕.wav',
    confirm: './assets/sound/確認按鈕.wav',
    back: './assets/sound/取消按鈕.wav',
    success: './assets/sound/獲勝.wav',
    fail: './assets/sound/失敗.wav',
    attack: './assets/sound/攻擊音效.wav',
    pop: './assets/sound/選擇按鈕.wav',
    heartbeat: './assets/sound/確認按鈕.wav',
};

// 將原本的 Web Audio 邏輯獨立出來作為備援
const playSyntheticSound = (type) => {
    try {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        const vRatio = sfxVolume / 0.4;

        if (type === 'success') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(900, now + 0.1);
            gain.gain.setValueAtTime(0.05 * vRatio, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'heartbeat') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.setValueAtTime(80, now + 0.1);
            gain.gain.setValueAtTime(0.08 * vRatio, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.03 * vRatio, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.setValueAtTime(150, now + 0.2);
            gain.gain.setValueAtTime(0.05 * vRatio, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch (e) {
        console.warn("Audio Context Error:", e);
    }
};

export const playBloop = (type) => {
    if (!isSfxEnabled) return;
    // 優先嘗試播放音效檔案
    if (SOUND_MAP[type]) {
        const audio = new Audio(SOUND_MAP[type]);
        audio.volume = sfxVolume;
        
        audio.play().catch(e => {
            console.warn(`[AudioSystem] File play failed for type "${type}":`, e.message);
            // 只有在非「使用者未互動」的錯誤下，才執行合成音效作為最後手段
            if (e.name !== 'NotAllowedError') {
                playSyntheticSound(type);
            }
        });
        return;
    }

    playSyntheticSound(type);
};

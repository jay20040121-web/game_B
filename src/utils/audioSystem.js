// Web Audio API 8-bit 音效產生器 (使用 Singleton 以避免建立過多 Context 導致故障)
let audioCtx = null;

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

        if (type === 'success') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.setValueAtTime(900, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'heartbeat') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.setValueAtTime(80, now + 0.1);
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, now);
            gain.gain.setValueAtTime(0.03, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, now);
            osc.frequency.setValueAtTime(150, now + 0.2);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    } catch (e) {
        console.warn("Audio Context Error:", e);
    }
};

export const playBloop = (type) => {
    // 優先嘗試播放音效檔案
    if (SOUND_MAP[type]) {
        const audio = new Audio(SOUND_MAP[type]);
        audio.volume = 0.4;
        
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

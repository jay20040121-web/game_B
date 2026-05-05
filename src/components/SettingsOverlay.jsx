import React, { useState, useEffect } from 'react';
import { playBloop, getSfxEnabled, setSfxEnabled, getBgmEnabled, setBgmEnabled, getSfxVolume, setSfxVolume, getBgmVolume, setBgmVolume } from '../utils/audioSystem';

export default function SettingsOverlay({
    isSettingsOpen,
    onClose,
    manualScale,
    setManualScale,
    setIsBooting
}) {
    const [sfx, setSfx] = useState(getSfxEnabled());
    const [bgm, setBgm] = useState(getBgmEnabled());
    const [sfxVol, setSfxVol] = useState(getSfxVolume());
    const [bgmVol, setBgmVol] = useState(getBgmVolume());
    const [spriteFormat, setSpriteFormat] = useState(() => localStorage.getItem('pixel_monster_sprite_format') || 'gif');
    const [showConfirmClear, setShowConfirmClear] = useState(false);

    // 同步狀態
    useEffect(() => {
        if (isSettingsOpen) {
            setSfx(getSfxEnabled());
            setBgm(getBgmEnabled());
            setSfxVol(getSfxVolume());
            setBgmVol(getBgmVolume());
            setSpriteFormat(localStorage.getItem('pixel_monster_sprite_format') || 'gif');
            setShowConfirmClear(false);
        }
    }, [isSettingsOpen]);

    if (!isSettingsOpen) return null;

    const handleSfxToggle = () => {
        const next = !sfx;
        setSfxEnabled(next);
        setSfx(next);
        if (next) playBloop('confirm');
    };

    const handleBgmToggle = () => {
        const next = !bgm;
        setBgmEnabled(next);
        setBgm(next);
        playBloop('confirm');
    };

    const handleSpriteFormatToggle = (format) => {
        setSpriteFormat(format);
        localStorage.setItem('pixel_monster_sprite_format', format);
        window.dispatchEvent(new CustomEvent('pixel_monster_settings_update'));
        playBloop('confirm');
    };

    const handleScaleChange = (scaleValue) => {
        setManualScale(scaleValue);
        playBloop('confirm');
    };

    const handleClearData = () => {
        if (showConfirmClear) {
            localStorage.removeItem('pixel_monster_save');
            // 可以選擇一併清除其他的，但目前主要清存檔
            playBloop('confirm');
            window.location.reload();
        } else {
            setShowConfirmClear(true);
            playBloop('confirm');
        }
    };

    const handleReturnToLogin = () => {
        playBloop('confirm');
        setIsBooting(true);
        onClose();
    };

    const handleExitGame = () => {
        playBloop('confirm');
        // 嘗試關閉視窗，如果失敗則導向 blank
        try {
            window.close();
        } catch (e) {
            window.location.href = 'about:blank';
        }
        // 作為 fallback 確保畫面跳轉
        setTimeout(() => {
            window.location.href = 'about:blank';
        }, 500);
    };

    return (
        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-start p-2" style={{
            backgroundImage: `url("${import.meta.env.BASE_URL}assets/BG/通用底層.png")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
            <div className="absolute inset-0 bg-black/60 z-0 backdrop-blur-[2px]"></div>

            <div className="w-full bg-[#383a37]/80 text-white [text-shadow:0_0_4px_#fff] text-[12px] px-3 py-2 flex justify-center items-center mb-2 font-black relative z-10 shadow-sm border-b-2 border-[#1a1a1a]">
                <span>系統設定</span>
            </div>

            <div className="flex-1 w-full flex flex-col gap-3 px-2 py-2 relative z-10 overflow-y-auto" style={{ fontFamily: "'Press Start 2P', monospace, sans-serif" }}>

                {/* 畫面尺寸設定 */}
                <div className="flex flex-col gap-1 bg-[#1a1a1a]/40 p-2 rounded border border-[#ccd6be]/30">
                    <div className="text-[10px] text-[#ccd6be] font-bold mb-1">畫面尺寸</div>
                    <div className="flex justify-between gap-1">
                        <button
                            onClick={() => handleScaleChange(null)}
                            className={`flex-1 py-1 text-[9px] font-bold rounded ${manualScale === null ? 'bg-[#9dae8a] text-black' : 'bg-[#383a37] text-white'} border border-[#1a1a1a] transition-all`}
                        >
                            自動
                        </button>
                        <button
                            onClick={() => handleScaleChange(1.0)}
                            className={`flex-1 py-1 text-[9px] font-bold rounded ${manualScale === 1.0 ? 'bg-[#9dae8a] text-black' : 'bg-[#383a37] text-white'} border border-[#1a1a1a] transition-all`}
                        >
                            1.0x
                        </button>
                        <button
                            onClick={() => handleScaleChange(1.2)}
                            className={`flex-1 py-1 text-[9px] font-bold rounded ${manualScale === 1.2 ? 'bg-[#9dae8a] text-black' : 'bg-[#383a37] text-white'} border border-[#1a1a1a] transition-all`}
                        >
                            1.2x
                        </button>
                        <button
                            onClick={() => handleScaleChange(1.5)}
                            className={`flex-1 py-1 text-[9px] font-bold rounded ${manualScale === 1.5 ? 'bg-[#9dae8a] text-black' : 'bg-[#383a37] text-white'} border border-[#1a1a1a] transition-all`}
                        >
                            1.5x
                        </button>
                    </div>
                </div>

                {/* 怪物圖示設定 */}
                <div className="flex flex-col gap-1 bg-[#1a1a1a]/40 p-2 rounded border border-[#ccd6be]/30">
                    <div className="text-[10px] text-[#ccd6be] font-bold mb-1">怪物圖示類型</div>
                    <div className="flex justify-between gap-1">
                        <button
                            onClick={() => handleSpriteFormatToggle('gif')}
                            className={`flex-1 py-1 text-[9px] font-bold rounded ${spriteFormat === 'gif' ? 'bg-[#9dae8a] text-black' : 'bg-[#383a37] text-white'} border border-[#1a1a1a] transition-all`}
                        >
                            GIF (動態)
                        </button>
                        <button
                            onClick={() => handleSpriteFormatToggle('png')}
                            className={`flex-1 py-1 text-[9px] font-bold rounded ${spriteFormat === 'png' ? 'bg-[#9dae8a] text-black' : 'bg-[#383a37] text-white'} border border-[#1a1a1a] transition-all`}
                        >
                            PNG (靜態)
                        </button>
                    </div>
                    <div className="text-[7px] text-[#ccd6be]/60 mt-1">※ 靜態圖載入較快且省流量</div>
                </div>

                {/* 音效/音樂開關 */}
                <div className="flex flex-col gap-3 bg-[#1a1a1a]/40 p-2 rounded border border-[#ccd6be]/30">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-[#ccd6be] font-bold">遊戲音效</span>
                            <button
                                onClick={handleSfxToggle}
                                className={`px-3 py-1 text-[9px] font-bold rounded ${sfx ? 'bg-[#9dae8a] text-black' : 'bg-red-900/80 text-white'} border border-[#1a1a1a] transition-all`}
                            >
                                {sfx ? '開啟' : '關閉'}
                            </button>
                        </div>
                        {sfx && (
                            <div className="flex justify-between items-center px-1 mt-1 gap-2">
                                <span className="text-[8px] text-[#ccd6be]">音量</span>
                                <input 
                                    type="range" min="0" max="1" step="0.1" 
                                    value={sfxVol} 
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setSfxVol(v);
                                        setSfxVolume(v);
                                    }}
                                    onMouseUp={() => playBloop('confirm')}
                                    onTouchEnd={() => playBloop('confirm')}
                                    className="flex-1 accent-[#9dae8a] h-1.5 bg-[#383a37] rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                    
                    <div className="h-px w-full bg-[#ccd6be]/20"></div>

                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] text-[#ccd6be] font-bold">背景音樂</span>
                            <button
                                onClick={handleBgmToggle}
                                className={`px-3 py-1 text-[9px] font-bold rounded ${bgm ? 'bg-[#9dae8a] text-black' : 'bg-red-900/80 text-white'} border border-[#1a1a1a] transition-all`}
                            >
                                {bgm ? '開啟' : '關閉'}
                            </button>
                        </div>
                        {bgm && (
                            <div className="flex justify-between items-center px-1 mt-1 gap-2">
                                <span className="text-[8px] text-[#ccd6be]">音量</span>
                                <input 
                                    type="range" min="0" max="1" step="0.1" 
                                    value={bgmVol} 
                                    onChange={(e) => {
                                        const v = parseFloat(e.target.value);
                                        setBgmVol(v);
                                        setBgmVolume(v);
                                    }}
                                    className="flex-1 accent-[#9dae8a] h-1.5 bg-[#383a37] rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* 重大操作區 */}
                <div className="mt-auto flex flex-col gap-2 pt-2 border-t border-[#ccd6be]/20">
                    <button
                        onClick={handleReturnToLogin}
                        className="w-full py-2 text-[10px] font-bold rounded bg-[#383a37] text-[#4fc3f7] hover:bg-[#555] border-2 border-[#1a1a1a] transition-all shadow-md"
                    >
                        返回登入畫面
                    </button>

                    <button
                        onClick={handleClearData}
                        className={`w-full py-2 text-[10px] font-bold rounded ${showConfirmClear ? 'bg-red-600 text-white animate-pulse' : 'bg-[#383a37] text-[#ff5252] hover:bg-[#555]'} border-2 border-[#1a1a1a] transition-all shadow-md`}
                    >
                        {showConfirmClear ? '再點擊一次以確定清除 (無法復原)' : '清除遊戲存檔'}
                    </button>

                    <button
                        onClick={handleExitGame}
                        className="w-full py-2 text-[10px] font-bold rounded bg-gray-800 text-white hover:bg-gray-700 border-2 border-[#1a1a1a] transition-all shadow-md"
                    >
                        離開遊戲
                    </button>

                    <div className="h-px w-full bg-[#ccd6be]/10 my-1"></div>

                    <button
                        onClick={() => { playBloop('back'); onClose(); }}
                        className="w-full py-2.5 text-[11px] font-black rounded bg-[#ccd6be] text-black active:scale-95 border-2 border-[#1a1a1a] transition-all shadow-[0_4px_0_#1a1a1a]"
                    >
                        關閉設定
                    </button>
                </div>
            </div>
        </div>
    );
}

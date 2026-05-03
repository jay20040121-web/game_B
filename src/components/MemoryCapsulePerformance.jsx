import React, { useEffect, useState } from 'react';
import { DitheredSprite } from './SpriteRenderer';

/**
 * 🌟 回憶膠囊獲得演出組件
 * -----------------------------------------
 * 當怪獸 Lv.100 死亡並觸發膠囊獲得時的全螢幕演出。
 */
export default function MemoryCapsulePerformance({ monsterId, onFinish }) {
    const [visible, setVisible] = useState(false);
    const [textVisible, setTextVisible] = useState(false);

    useEffect(() => {
        // 進入動畫
        const timer1 = setTimeout(() => setVisible(true), 100);
        const timer2 = setTimeout(() => setTextVisible(true), 1000);
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, []);

    return (
        <div 
            className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 ${visible ? 'opacity-100' : 'opacity-0'}`}
            style={{ 
                backgroundImage: `url("${import.meta.env.BASE_URL}assets/BG/記憶膠囊底板.png")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: 9999
            }}
            onClick={onFinish}
        >

            {/* 怪獸主體 */}
            <div className="mb-8 transform scale-[1.2] transition-all duration-[2000ms] ease-out">
                <DitheredSprite id={monsterId} pure={true} />
            </div>

            {/* 感人對話 */}
            <div 
                className={`max-w-[90%] text-center transition-all duration-1000 transform ${textVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
                <p className="text-white text-[12px] font-bold leading-relaxed tracking-[0.05em]" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                    「主人... 我們的回憶是不會消失的... 這個給你，只要你願意，我會再出現在你身旁。」
                </p>
            </div>

            {/* 提示點擊 */}
            <div className="absolute bottom-10 text-gray-400 text-[12px] animate-pulse">
                -- 點擊螢幕收下回憶 --
            </div>
        </div>
    );
}

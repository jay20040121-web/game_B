import React, { useState } from 'react';
import { PixelArt, ICONS } from './SpriteRenderer';

export default function SkillRearrangeOverlay({
    isOpen,
    moves,
    moveUpgrades,
    SKILL_DATABASE,
    TYPE_MAP,
    onClose,
    onConfirm
}) {
    if (!isOpen) return null;

    const [tempMoves, setTempMoves] = useState([...moves]);
    const [cursorIdx, setCursorIdx] = useState(0);
    const [selectedIdx, setSelectedIdx] = useState(null);

    // 使用 Ref 追蹤最新狀態，避免事件監聽器的閉包問題
    const stateRef = React.useRef({ cursorIdx, selectedIdx, tempMoves });
    React.useEffect(() => {
        stateRef.current = { cursorIdx, selectedIdx, tempMoves };
    }, [cursorIdx, selectedIdx, tempMoves]);

    React.useEffect(() => {
        const handleAEvent = () => {
            setCursorIdx((prev) => (prev + 1) % 5);
        };
        
        const handleBEvent = () => {
            const { cursorIdx: cur, selectedIdx: sel, tempMoves: movesArr } = stateRef.current;
            
            if (cur < 4) {
                if (sel === null) {
                    setSelectedIdx(cur);
                } else {
                    if (sel === cur) {
                        setSelectedIdx(null);
                    } else {
                        const newMoves = [...movesArr];
                        const temp = newMoves[sel];
                        newMoves[sel] = newMoves[cur];
                        newMoves[cur] = temp;
                        setTempMoves(newMoves);
                        setSelectedIdx(null);
                    }
                }
            } else {
                // 只有在游標明確位於第 5 個選項（完成調整）時才執行 confirm
                onConfirm(stateRef.current.tempMoves);
            }
        };

        const handleCEvent = () => onClose();

        window.addEventListener('rearrangeA', handleAEvent);
        window.addEventListener('rearrangeB', handleBEvent);
        window.addEventListener('rearrangeC', handleCEvent);
        return () => {
            window.removeEventListener('rearrangeA', handleAEvent);
            window.removeEventListener('rearrangeB', handleBEvent);
            window.removeEventListener('rearrangeC', handleCEvent);
        };
    }, []); // 僅在掛載時綁定一次

    return (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-start p-2"
            style={{
                backgroundImage: `url("${import.meta.env.BASE_URL}assets/BG/共用底圖.png")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
            <div className="absolute inset-0 bg-purple-900/40 z-0"></div>

            <div className="w-full bg-[#383a37]/80 text-white [text-shadow:0_0_4px_#fff] text-[10px] px-2 py-1 flex justify-center items-center mb-1 font-black relative z-10 shadow-lg border-b-2 border-white/20">
                <span>技能順序調整</span>
            </div>

            <div className="flex-1 w-full flex flex-col gap-1 px-1 justify-center relative z-10">
                <div className="grid grid-cols-1 gap-1">
                    {tempMoves.map((mId, idx) => {
                        const skill = SKILL_DATABASE[mId] || { name: '???', type: 'normal' };
                        const isSelected = selectedIdx === idx;
                        const isCursor = cursorIdx === idx;

                        return (
                            <div key={idx}
                                className={`flex items-center gap-1.5 p-1.5 border-2 rounded transition-all duration-150 ${isCursor ? 'border-yellow-400 bg-white/20 scale-[1.02]' : 'border-white/10 bg-black/20'
                                    } ${isSelected ? 'ring-2 ring-blue-400 animate-pulse' : ''}`}
                            >
                                <div className="w-5 h-5 flex items-center justify-center bg-black/30 rounded">
                                    <span className="text-[9px] font-bold text-white/50">{idx + 1}</span>
                                </div>
                                <div className="flex-1 flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <div className="text-[11px] font-black text-white">{skill.name}</div>
                                        {(() => {
                                            const ailmentsToShow = [];
                                            if (skill.ailment && skill.ailment !== 'none') ailmentsToShow.push(skill.ailment);
                                            const enchantData = moveUpgrades?.[mId]?.ailments || {};
                                            Object.keys(enchantData).forEach(k => {
                                                if (enchantData[k] > 0 && !ailmentsToShow.includes(k)) ailmentsToShow.push(k);
                                            });
                                            return ailmentsToShow.map((ailment, aIdx) => (
                                                <span key={aIdx} className={`text-[6px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black ${ailment === 'burn' ? 'bg-[#ff5252] text-white' :
                                                        ailment === 'paralysis' ? 'bg-[#ffca28] text-black' :
                                                            ailment === 'poison' ? 'bg-[#9c27b0] text-white' :
                                                                ailment === 'accuracy' ? 'bg-[#2196f3] text-white' :
                                                                    ailment === 'priority' ? 'bg-[#ff9800] text-white' :
                                                                        ailment === 'freeze' ? 'bg-[#80deea] text-black' :
                                                                            ailment === 'sleep' ? 'bg-[#90a4ae] text-white' :
                                                                                ailment === 'lifesteal' ? 'bg-[#e91e63] text-white' :
                                                                                    'bg-[#4db6ac] text-white'
                                                    }`}>
                                                    {ailment === 'burn' ? '燒' :
                                                        ailment === 'paralysis' ? '麻' :
                                                            ailment === 'poison' ? '毒' :
                                                                ailment === 'confusion' ? '混' :
                                                                    ailment === 'leech-seed' ? '吸' :
                                                                        ailment === 'trap' ? '縛' :
                                                                            ailment === 'accuracy' ? '準' :
                                                                                ailment === 'priority' ? '先' :
                                                                                    ailment === 'freeze' ? '凍' :
                                                                                        ailment === 'sleep' ? '眠' :
                                                                                            ailment === 'lifesteal' ? '血' : '狀'}
                                                </span>
                                            ));
                                        })()}
                                        {skill.stat_changes && skill.stat_changes.some(s => s.change > 0) && (
                                            <span className="text-[6px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black bg-[#42a5f5] text-white uppercase">Buff</span>
                                        )}
                                    </div>
                                    <div className="text-[7px] text-white/60">屬性: {TYPE_MAP[skill.type] || skill.type} / 威力: {skill.power} / 命中: {skill.accuracy || '--'}</div>
                                </div>
                                {isSelected && <div className="text-[9px] text-blue-400 font-black animate-bounce">選取中</div>}
                            </div>
                        );
                    })}
                </div>

                <div className={`mt-2 p-1.5 border-2 rounded text-center transition-all ${cursorIdx === 4 ? 'border-yellow-400 bg-yellow-400/20 scale-[1.02]' : 'border-white/10 bg-black/40'
                    }`}>
                    <div className="text-[11px] font-black text-white">完成調整並使用道具</div>
                    <div className="text-[7px] text-white/60">點擊 [B] 確認生效</div>
                </div>
            </div>

            <div className="w-full text-center p-1 z-10">
                <div className="text-[8px] font-black text-white opacity-60 border-t-2 border-white/10 pt-1">
                    [A] 切換選項 | [B] 選取/交換 | [C] 取消離開
                </div>
            </div>

            {/* Global Key Listeners for Tamagotchi buttons can be handled by App.jsx or here */}
        </div>
    );
}

import React from 'react';
import { DIARY_MESSAGES_TEMPLATE } from '../data/gameConfig';

export function DiaryOverlay({
    isDiaryOpen,
    getTodayStr,
    diaryViewDate,
    todayTrainWins,
    todayWildDefeated,
    todaySpecialEvent,
    todayHasEvolved,
    diaryLog,
    hunger,
    mood,
    bondValue,
    soulTagCounts,
    lockedAffinity,
}) {
    if (!isDiaryOpen) return null;

    const todayStr = getTodayStr();
    const viewDate = diaryViewDate || todayStr;
    const isToday = viewDate === todayStr;
    const entry = isToday ? {
        trainWins: todayTrainWins,
        wildDefeated: todayWildDefeated,
        specialEvent: todaySpecialEvent,
        hasEvolved: todayHasEvolved,
    } : diaryLog[viewDate];
    const hasPastData = !isToday && !!entry;
    const petMsg = hasPastData ? entry.petMessage : null;

    const [year, month, day] = (viewDate || '').split('-');

    const getRealtimeText = () => {
        if (todayHasEvolved) return "我覺得自己像換了個靈魂！這股新力量太不可思議了！";
        if (todayWildDefeated >= 1) return "剛才打贏了野外的傢伙！感覺我們默契越來越好了！";
        if (hunger < 30) return "肚子咕嚕叫了... 嘿嘿，你想餵我嗎？";
        if (mood < 30) return "有點無聊耶... 我們去哪裡冒險好嗎？";
        if (todayTrainWins >= 5) return "今天的特訓超充實的！我感覺全身充滿力量！";
        if (bondValue > 150) return "跟你在一起的時候，我覺得我是世界上最幸福的怪獸！";
        if (mood > 80) return "今天感覺真棒！謝謝你一直陪著我。";
        const pool = DIARY_MESSAGES_TEMPLATE[lockedAffinity] || DIARY_MESSAGES_TEMPLATE.default;
        return pool ? pool[0] : "今天也謝謝你陪伴我。";
    };

    return (
        <div className="absolute inset-0 z-[120] flex flex-col" style={{ backgroundColor: '#9dae8a', fontFamily: "'Press Start 2P', monospace" }}>
            <div className="w-full bg-[#383a37] text-[#8fa07e] px-2 py-1.5 flex justify-between items-center shrink-0">
                <span style={{ fontSize: '9px' }}>📖 對戰日記</span>
                <span style={{ fontSize: '8px' }}>[B] 關閉</span>
            </div>

            <div className="flex items-center justify-between px-2 py-1 bg-[#838e78] shrink-0">
                <span style={{ fontSize: '8px', color: '#1a1a1a' }}>[A] ◀</span>
                <span style={{ fontSize: '10px', fontWeight: '900', color: '#1a1a1a' }}>
                    {month}/{day} {isToday ? '(今天)' : ''}
                </span>
                <span style={{ fontSize: '8px', color: viewDate >= todayStr ? '#999' : '#1a1a1a' }}>{viewDate >= todayStr ? '---' : '[C] ▶'}</span>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col px-2 py-2 gap-2">
                {(isToday || hasPastData) ? (
                    <>
                        <div className="border-2 border-[#383a37] bg-[#b8c8a8] p-2 flex flex-col gap-1">
                            <div style={{ fontSize: '9px', color: '#1a1a1a', borderBottom: '1px solid #383a37', paddingBottom: '3px', marginBottom: '3px' }}>
                                📊 {isToday ? '今日記錄' : '當日回顧'}
                            </div>

                            {(() => {
                                const tag = isToday
                                    ? Object.entries(soulTagCounts || {}).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0]
                                    : (entry?.dominantTag || 'none');

                                const attitudeMap = {
                                    gentle: "溫婉有加，把你當成避風港。",
                                    stubborn: "有點嘴硬，但心裡非常依賴你。",
                                    passionate: "熱血澎湃！把你當成親兄弟。",
                                    nonsense: "調皮搗蛋，看到你就想撒嬌。",
                                    rational: "冷靜沉穩，對你抱持深厚信任。",
                                    none: "還在摸索與你的相處之道..."
                                };

                                return (
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-start" style={{ fontSize: '9px', color: '#1a1a1a' }}>
                                            <span className="shrink-0">🤝 對你的態度:</span>
                                            <span className="font-black text-right pl-2 text-[8px] leading-tight">
                                                {attitudeMap[tag] || attitudeMap.none}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center" style={{ fontSize: '9px', color: '#1a1a1a' }}>
                                            <span>🌿 擊敗野怪:</span>
                                            <span className="font-black">{entry?.wildDefeated ?? 0} 隻</span>
                                        </div>
                                        <div className="mt-1 pt-1 border-t border-[#383a37]/30 flex flex-col gap-1">
                                            <div style={{ fontSize: '8px', opacity: 0.8 }}>📍 特殊事件:</div>
                                            <div style={{ fontSize: '9px', color: '#c00', fontWeight: '900' }}>
                                                {entry?.specialEvent || '今日尚無重大事件'}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        <div className="border-2 border-[#383a37] bg-[#b8c8a8] p-2 flex flex-col gap-1 flex-1">
                            <div style={{ fontSize: '9px', color: '#1a1a1a', borderBottom: '1px solid #383a37', paddingBottom: '3px', marginBottom: '3px' }}>
                                💬 寵物的話
                            </div>
                            <div style={{ fontSize: '10px', color: '#1a1a1a', lineHeight: '1.7', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
                                {isToday
                                    ? `「${getRealtimeText()}」`
                                    : `「${petMsg || '今天也謝謝你陪伴我。'}」`
                                }
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2">
                        <div style={{ fontSize: '24px' }}>📭</div>
                        <div style={{ fontSize: '9px', color: '#555', textAlign: 'center', lineHeight: '1.8', fontFamily: 'sans-serif' }}>
                            這一天還沒有記錄哦。<br />
                            那天我們在哪裡呢...？
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

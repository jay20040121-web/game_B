import React from 'react';

export function SkillLearnOverlay({
    pendingSkillLearn,
    isAdvMode,
    isPvpMode,
    battleState,
    isConfirmingReplace,
    advStats,
    tempReplaceIdx,
    SKILL_DATABASE,
    skillSelectIdx,
    handleB
}) {
    // 移除 battleState?.active 限制，改為由大賽邏輯自行控制暫停
    if (!pendingSkillLearn || isAdvMode || isPvpMode) return null;

    return (
        <div className="absolute inset-0 z-[10000] flex flex-col items-center justify-center p-2" style={{ backgroundColor: 'rgba(157, 174, 138, 0.99)' }}>
            {/* 二次確認 Modal */}
            {isConfirmingReplace && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 9999,
                    backgroundColor: 'rgba(157, 174, 138, 0.98)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    color: '#1a1a1a', textAlign: 'center', padding: '15px'
                }}>
                    <div style={{
                        width: '180px', padding: '15px', border: '4px solid #111', backgroundColor: '#8fa07e',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                        boxShadow: '8px 8px 0 rgba(0,0,0,0.2)'
                    }}>
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#111', lineHeight: '1.4' }}>
                            確定要忘記<br />
                            <span style={{ color: '#d32f2f' }}>{SKILL_DATABASE[advStats.moves[tempReplaceIdx]]?.name}</span><br />
                            並學習新招嗎？
                        </div>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div
                                onClick={() => handleB(0)}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            >
                                <div style={{ padding: '4px 12px', border: '2px solid #111', backgroundColor: skillSelectIdx === 0 ? '#ff5252' : '#7a8a6a', color: skillSelectIdx === 0 ? '#fff' : '#1a1a1a', fontSize: '10px', boxShadow: skillSelectIdx === 0 ? '0 0 8px #ff5252' : 'none' }}>{skillSelectIdx === 0 ? '▶ ' : ''}是</div>
                            </div>
                            <div
                                onClick={() => handleB(1)}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            >
                                <div style={{ padding: '4px 12px', border: '2px solid #111', backgroundColor: skillSelectIdx === 1 ? '#ffca28' : '#7a8a6a', color: skillSelectIdx === 1 ? '#1a1a1a' : '#1a1a1a', fontSize: '10px', boxShadow: skillSelectIdx === 1 ? '0 0 8px #ffca28' : 'none' }}>{skillSelectIdx === 1 ? '▶ ' : ''}否</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full bg-[#383a37] text-[#8fa07e] text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black">
                <span>新的領悟！ (Lv.{pendingSkillLearn.level})</span>
            </div>

            <div className="flex-1 w-full flex flex-col items-center justify-center gap-2">
                <div className="text-[11px] font-bold text-[#1a1a1a] text-center mb-1">
                    想學會 <span className="underline decoration-2">{pendingSkillLearn.skill.name}</span>
                </div>
                <div className="text-[9px] text-[#383a37] mb-2 text-center">
                    ({pendingSkillLearn.skill.type === 'normal' ? '普' :
                        pendingSkillLearn.skill.type === 'fire' ? '火' :
                            pendingSkillLearn.skill.type === 'water' ? '水' :
                                pendingSkillLearn.skill.type === 'grass' ? '草' :
                                    pendingSkillLearn.skill.type === 'bug' ? '蟲' :
                                        pendingSkillLearn.skill.type === 'flying' ? '飛' :
                                            pendingSkillLearn.skill.type === 'electric' ? '電' :
                                                pendingSkillLearn.skill.type === 'psychic' ? '超' :
                                                    pendingSkillLearn.skill.type === 'ghost' ? '鬼' : '屬'} / 威力:{pendingSkillLearn.skill.power})
                </div>

                {advStats.moves.length < 4 ? (
                    <div className="flex flex-col gap-3 items-center">
                        <div className="text-[9px] text-[#383a37]">目前招式未滿，可直接學習！</div>
                        <div className="mt-2 text-[10px] font-black bg-[#ff5252] text-white px-4 py-1 rounded-full border-2 border-[#1a1a1a] animate-pulse shadow-[2px_2px_0_#1a1a1a]">
                            [B] 確認學習
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-1 px-4">
                        <div className="text-[9px] mb-1 font-bold text-[#1a1a1a]">請選擇要遺忘的招式：</div>
                        {[0, 1, 2, 3].map((idx) => {
                            const moveId = advStats.moves[idx];
                            const moveDef = SKILL_DATABASE[moveId];
                            const isSelected = skillSelectIdx === idx;
                            return (
                                <div key={idx} className={`w-full flex justify-between items-center p-1.5 border-2 transition-all duration-200 ${isSelected ? 'bg-[#383a37] text-white border-[#1a1a1a] scale-105 z-10 shadow-[2px_2px_0_#1a1a1a]' : 'bg-[#9dae8a] text-[#1a1a1a] border-[#383a37]/50'}`}>
                                    <span className="text-[10px] font-black">{isSelected ? '▶ ' : ''}{moveDef?.name || '---'}</span>
                                    {moveDef && (
                                        <span className="text-[8px] opacity-70">威力:{moveDef.power}</span>
                                    )}
                                </div>
                            );
                        })}
                        <div className={`mt-1 w-full py-1 text-center text-[10px] font-bold border-2 transition-all ${skillSelectIdx === 4 ? 'bg-red-600 text-white border-black scale-[1.02]' : 'bg-[#7a8a6a]/50 text-[#444] border-transparent opacity-60'}`}>
                            {skillSelectIdx === 4 ? '▶ ' : ''}放棄學習
                        </div>
                        <div className="text-[8px] text-center opacity-60 mt-1">A:切換 B:確認 C:返回</div>
                    </div>
                )}
            </div>
        </div>
    );
}

import React from 'react';

export default function SkillLearnOverlay({
    pendingSkillLearn,
    isAdvMode,
    isPvpMode,
    battleState,
    isConfirmingReplace,
    advStats,
    tempReplaceIdx,
    SKILL_DATABASE,
    TYPE_MAP,
    skillSelectIdx,
    handleB
}) {
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
                            並學習新招式嗎？
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
                <div className="text-[11px] font-bold text-[#1a1a1a] text-center mb-1 flex items-center gap-1 justify-center">
                    想學會 <span className="underline decoration-2">{pendingSkillLearn.skill.name}</span>
                    {(pendingSkillLearn.skill.ailment && pendingSkillLearn.skill.ailment !== 'none') && (
                        <span className={`text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black ${
                            pendingSkillLearn.skill.ailment === 'burn' ? 'bg-[#ff5252] text-white' :
                            pendingSkillLearn.skill.ailment === 'paralysis' ? 'bg-[#ffca28] text-black' :
                            pendingSkillLearn.skill.ailment === 'poison' ? 'bg-[#9c27b0] text-white' :
                            'bg-[#4db6ac] text-white'
                        }`}>
                            {pendingSkillLearn.skill.ailment === 'burn' ? '燒' :
                             pendingSkillLearn.skill.ailment === 'paralysis' ? '麻' :
                             pendingSkillLearn.skill.ailment === 'poison' ? '毒' : '狀'}
                        </span>
                    )}
                    {(pendingSkillLearn.skill.stat_changes && pendingSkillLearn.skill.stat_changes.some(s => s.change > 0)) && (
                        <span className="text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black bg-[#42a5f5] text-white uppercase">
                            Buff
                        </span>
                    )}
                </div>
                <div className="text-[9px] text-[#383a37] mb-2 text-center flex flex-col items-center gap-0.5">
                    <div>({TYPE_MAP?.[pendingSkillLearn.skill.type] || '屬'} / 威力:{pendingSkillLearn.skill.power})</div>
                    {pendingSkillLearn.skill.ailment && pendingSkillLearn.skill.ailment !== 'none' && (
                        <div className="text-[8px] text-red-700 font-black">
                            效果: {pendingSkillLearn.skill.ailment_chance || 100}% 造成{
                                pendingSkillLearn.skill.ailment === 'burn' ? '燒傷' :
                                pendingSkillLearn.skill.ailment === 'paralysis' ? '麻痺' :
                                pendingSkillLearn.skill.ailment === 'poison' ? '中毒' :
                                pendingSkillLearn.skill.ailment === 'confusion' ? '混亂' :
                                pendingSkillLearn.skill.ailment === 'trap' ? '束縛' : '異常狀態'
                            }
                        </div>
                    )}
                    {(pendingSkillLearn.skill.stat_changes && pendingSkillLearn.skill.stat_changes.some(s => s.change > 0)) && (
                        <div className="text-[8px] text-blue-700 font-black">
                            效果: {pendingSkillLearn.skill.stat_changes.map(s => `[${{atk:'攻擊',def:'防禦',spd:'速度'}[s.stat] || s.stat}] 提升 ${s.change} 階`).join(', ')}
                        </div>
                    )}
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
                                <div key={idx} className={`w-full flex flex-col p-1.5 border-2 transition-all duration-200 ${isSelected ? 'bg-[#383a37] text-white border-[#1a1a1a] scale-105 z-10 shadow-[2px_2px_0_#1a1a1a]' : 'bg-[#9dae8a] text-[#1a1a1a] border-[#383a37]/50'}`}>
                                    <div className="w-full flex justify-between items-center">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] font-black">
                                                {isSelected ? '▶ ' : ''}{moveDef?.name || '---'} 
                                            </span>
                                            {(() => {
                                                if (!moveDef) return null;
                                                const ailmentsToShow = [];
                                                // 1. 原生技能附帶的異常
                                                if (moveDef.ailment && moveDef.ailment !== 'none') {
                                                    ailmentsToShow.push(moveDef.ailment);
                                                }
                                                // 2. 附魔追加的異常
                                                const enchantData = advStats?.moveUpgrades?.[moveId]?.ailments || {};
                                                Object.keys(enchantData).forEach(k => {
                                                    if (enchantData[k] > 0 && !ailmentsToShow.includes(k)) {
                                                        ailmentsToShow.push(k);
                                                    }
                                                });

                                                return ailmentsToShow.map((ailment, aIdx) => (
                                                    <span key={aIdx} className={`text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black ${
                                                        ailment === 'burn' ? 'bg-[#ff5252] text-white' :
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
                                            {moveDef?.stat_changes && moveDef.stat_changes.some(s => s.change > 0) && (
                                                <span className="text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black bg-[#42a5f5] text-white uppercase">
                                                    Buff
                                                </span>
                                            )}
                                            {moveDef && <span className="opacity-60 text-[8px]">[{TYPE_MAP?.[moveDef.type] || '屬'}]</span>}
                                        </div>
                                        {moveDef && (
                                            <span className="text-[8px] opacity-70">威力:{moveDef.power}</span>
                                        )}
                                    </div>
                                    {((moveDef?.ailment && moveDef.ailment !== 'none') || (moveDef?.stat_changes && moveDef.stat_changes.some(s => s.change > 0))) && (
                                        <div className={`text-[7px] mt-0.5 font-bold ${isSelected ? 'text-yellow-200' : 'text-red-800'}`}>
                                            {moveDef?.ailment && moveDef.ailment !== 'none' && (
                                                <span>機率 {moveDef.ailment_chance || 100}% 造成{
                                                    moveDef.ailment === 'burn' ? '燒傷' :
                                                    moveDef.ailment === 'paralysis' ? '麻痺' :
                                                    moveDef.ailment === 'poison' ? '中毒' :
                                                    moveDef.ailment === 'confusion' ? '混亂' :
                                                    moveDef.ailment === 'trap' ? '束縛' : '異常'
                                                }</span>
                                            )}
                                            {moveDef?.stat_changes && moveDef.stat_changes.some(s => s.change > 0) && (
                                                <span className={moveDef?.ailment && moveDef.ailment !== 'none' ? 'ml-1' : ''}>
                                                    效果: {moveDef.stat_changes.filter(s => s.change > 0).map(s => `${{atk:'攻擊',def:'防禦',spd:'速度'}[s.stat] || s.stat}+${s.change}`).join(', ')}
                                                </span>
                                            )}
                                        </div>
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

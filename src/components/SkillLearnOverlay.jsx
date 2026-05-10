import { useState } from 'react';
import AutoFitText from './AutoFitText';
import { buildAilmentBadges, getAilmentLabel, getAilmentClassName } from '../utils/ailmentBadgeUtils';

const badgeClassFor = (key) => (
    key === 'burn' ? 'bg-[#ff5252] text-white' :
        key === 'paralysis' ? 'bg-[#ffca28] text-black' :
            key === 'poison' ? 'bg-[#9c27b0] text-white' :
                key === 'accuracy' ? 'bg-[#2196f3] text-white' :
                    key === 'priority' ? 'bg-[#ff9800] text-white' :
                        key === 'freeze' ? 'bg-[#80deea] text-black' :
                            key === 'sleep' ? 'bg-[#90a4ae] text-white' :
                                key === 'lifesteal' ? 'bg-[#e91e63] text-white' :
                                    'bg-[#4db6ac] text-white'
);

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

    const [selectedSkillDetail, setSelectedSkillDetail] = useState(null);
    const selectedMoveId = selectedSkillDetail?.moveId;
    const selectedMoveSkill = selectedMoveId ? SKILL_DATABASE[selectedMoveId] : null;
    const selectedMoveEnchantData = selectedMoveId ? (advStats?.moveUpgrades?.[selectedMoveId]?.ailments || {}) : {};
    const selectedMoveBadges = selectedMoveSkill ? buildAilmentBadges({
        primaryAilment: selectedMoveSkill.ailment,
        enchantData: selectedMoveEnchantData,
        baseClassName: 'text-[7px] px-1 rounded-[1px] border border-black/10 leading-none py-0.5 font-black'
    }) : [];

    const currentBadges = buildAilmentBadges({
        primaryAilment: pendingSkillLearn.skill.ailment,
        enchantData: {},
        baseClassName: 'text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black'
    });

    return (
        <div className="absolute inset-0 z-[10000] flex flex-col items-center justify-center p-2" style={{ backgroundColor: 'rgba(157, 174, 138, 0.99)' }}>
            {isConfirmingReplace && (
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 9999,
                        backgroundColor: 'rgba(157, 174, 138, 0.98)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#1a1a1a',
                        textAlign: 'center',
                        padding: '15px'
                    }}
                >
                    <div
                        style={{
                            width: '180px',
                            padding: '15px',
                            border: '4px solid #111',
                            backgroundColor: '#8fa07e',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '15px',
                            boxShadow: '8px 8px 0 rgba(0,0,0,0.2)'
                        }}
                    >
                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#111', lineHeight: '1.4' }}>
                            要替換學會的技能嗎？
                            <br />
                            <span style={{ color: '#d32f2f' }}>{SKILL_DATABASE[advStats.moves[tempReplaceIdx]]?.name}</span>
                            <br />
                            按下確認後會進行替換
                        </div>
                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div
                                onClick={() => handleB(0)}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            >
                                <div style={{ padding: '4px 12px', border: '2px solid #111', backgroundColor: skillSelectIdx === 0 ? '#ff5252' : '#7a8a6a', color: skillSelectIdx === 0 ? '#fff' : '#1a1a1a', fontSize: '10px', boxShadow: 'none' }}>
                                    {skillSelectIdx === 0 ? '選中' : '是'}
                                </div>
                            </div>
                            <div
                                onClick={() => handleB(1)}
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                            >
                                <div style={{ padding: '4px 12px', border: '2px solid #111', backgroundColor: skillSelectIdx === 1 ? '#ffca28' : '#7a8a6a', color: '#1a1a1a', fontSize: '10px', boxShadow: 'none' }}>
                                    {skillSelectIdx === 1 ? '選中' : '否'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full bg-[#383a37] text-[#8fa07e] text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black">
                <span>獲得技能（Lv.{pendingSkillLearn.level}）</span>
            </div>

            <div className="flex-1 w-full flex flex-col items-center justify-center gap-2">
                <div className="text-[11px] font-bold text-[#1a1a1a] text-center mb-1 flex items-center gap-1 justify-center">
                    想學會
                    <AutoFitText as="span" className="underline decoration-2 min-w-0 flex-1" minFontSize={8} maxFontSize={12}>
                        {pendingSkillLearn.skill.name}
                    </AutoFitText>
                    {currentBadges.map((badge) => (
                        <span
                            key={badge.key}
                            title={badge.title}
                            className={badge.className}
                            style={badge.style}
                        >
                            {badge.label}
                        </span>
                    ))}
                    {(pendingSkillLearn.skill.stat_changes && pendingSkillLearn.skill.stat_changes.some(s => s.change > 0)) && (
                        <span className="text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black bg-[#42a5f5] text-white uppercase">
                            變化
                        </span>
                    )}
                </div>

                <div className="text-[9px] text-[#383a37] mb-2 text-center flex flex-col items-center gap-0.5">
                    <div>({TYPE_MAP?.[pendingSkillLearn.skill.type] || pendingSkillLearn.skill.type} / 威力:{pendingSkillLearn.skill.power} / 命中:{pendingSkillLearn.skill.accuracy || '--'})</div>
                    {pendingSkillLearn.skill.ailment && pendingSkillLearn.skill.ailment !== 'none' && (
                        <div className="text-[8px] text-red-700 font-black">
                            機率: {pendingSkillLearn.skill.ailment_chance || 100}% 造成{
                                pendingSkillLearn.skill.ailment === 'burn' ? '燒傷' :
                                    pendingSkillLearn.skill.ailment === 'paralysis' ? '麻痺' :
                                        pendingSkillLearn.skill.ailment === 'poison' ? '中毒' :
                                            pendingSkillLearn.skill.ailment === 'confusion' ? '混亂' :
                                                pendingSkillLearn.skill.ailment === 'trap' ? '束縛' : '異常'
                            }
                        </div>
                    )}
                    {(pendingSkillLearn.skill.stat_changes && pendingSkillLearn.skill.stat_changes.some(s => s.change > 0)) && (
                        <div className="text-[8px] text-blue-700 font-black">
                            附帶效果: {pendingSkillLearn.skill.stat_changes.map(s => `[${{ atk: '攻', def: '防', spd: '速' }[s.stat] || s.stat}] +${s.change}`).join(', ')}
                        </div>
                    )}
                </div>

                {advStats.moves.length < 4 ? (
                    <div className="flex flex-col gap-3 items-center">
                        <div className="text-[9px] text-[#383a37]">技能欄已滿，無法再學新招</div>
                        <div className="mt-2 text-[10px] font-black bg-[#ff5252] text-white px-4 py-1 rounded-full border-2 border-[#1a1a1a] animate-pulse shadow-[2px_2px_0_#1a1a1a]">
                            [B] 確認學習
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col gap-1 px-4">
                        <div className="text-[9px] mb-1 font-bold text-[#1a1a1a]">選擇要替換的技能</div>
                        {[0, 1, 2, 3].map((idx) => {
                            const moveId = advStats.moves[idx];
                            const moveDef = SKILL_DATABASE[moveId];
                            const isSelected = skillSelectIdx === idx;
                            const badges = moveDef ? buildAilmentBadges({
                                primaryAilment: moveDef.ailment,
                                enchantData: advStats?.moveUpgrades?.[moveId]?.ailments || {},
                                baseClassName: 'text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black'
                            }) : [];

                            return (
                                <div
                                    key={idx}
                                    className={`w-full flex flex-col p-1.5 border-2 transition-all duration-200 cursor-pointer ${isSelected ? 'bg-[#383a37] text-white border-[#1a1a1a] scale-105 z-10 shadow-[2px_2px_0_#1a1a1a]' : 'bg-[#9dae8a] text-[#1a1a1a] border-[#383a37]/50'}`}
                                    onClick={() => moveDef && setSelectedSkillDetail({ moveId, idx })}
                                >
                                    <div className="w-full flex justify-between items-center">
                                        <div className="flex items-center gap-1 min-w-0">
                                            <AutoFitText as="span" className="text-[10px] font-black min-w-0 flex-1" minFontSize={7} maxFontSize={10}>
                                                {isSelected ? '▶ ' : ''}{moveDef?.name || '---'}
                                            </AutoFitText>
                                            {badges.map((badge) => (
                                                <span
                                                    key={badge.key}
                                                    title={badge.title}
                                                    className={badge.className}
                                                    style={badge.style}
                                                >
                                                    {badge.label}
                                                </span>
                                            ))}
                                            {moveDef?.stat_changes && moveDef.stat_changes.some(s => s.change > 0) && (
                                                <span className="text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black bg-[#42a5f5] text-white uppercase">
                                                    變化
                                                </span>
                                            )}
                                            {moveDef && <span className="opacity-60 text-[8px]">[{TYPE_MAP?.[moveDef.type] || moveDef.type}]</span>}
                                        </div>
                                        {moveDef && (
                                            <AutoFitText as="span" className="text-[8px] opacity-70 shrink-0 text-right" minFontSize={7} maxFontSize={8}>
                                                威力:{moveDef.power} / 命中:{moveDef.accuracy || '--'}
                                            </AutoFitText>
                                        )}
                                    </div>
                                    {((moveDef?.ailment && moveDef.ailment !== 'none') || (moveDef?.stat_changes && moveDef.stat_changes.some(s => s.change > 0))) && (
                                        <div className={`text-[7px] mt-0.5 font-bold ${isSelected ? 'text-yellow-200' : 'text-red-800'}`}>
                                            {moveDef?.ailment && moveDef.ailment !== 'none' && (
                                                <span>異常率 {moveDef.ailment_chance || 100}% 造成{
                                                    moveDef.ailment === 'burn' ? '燒傷' :
                                                        moveDef.ailment === 'paralysis' ? '麻痺' :
                                                            moveDef.ailment === 'poison' ? '中毒' :
                                                                moveDef.ailment === 'confusion' ? '混亂' :
                                                                    moveDef.ailment === 'trap' ? '束縛' : '異常'
                                                }</span>
                                            )}
                                            {moveDef?.stat_changes && moveDef.stat_changes.some(s => s.change > 0) && (
                                                <span className={moveDef?.ailment && moveDef.ailment !== 'none' ? 'ml-1' : ''}>
                                                    能力變化: {moveDef.stat_changes.filter(s => s.change > 0).map(s => `${{ atk: '攻', def: '防', spd: '速' }[s.stat] || s.stat}+${s.change}`).join(', ')}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        <div className={`mt-1 w-full py-1 text-center text-[10px] font-bold border-2 transition-all ${skillSelectIdx === 4 ? 'bg-red-600 text-white border-black scale-[1.02]' : 'bg-[#7a8a6a]/50 text-[#444] border-transparent opacity-60'}`}>
                            {skillSelectIdx === 4 ? '▶ ' : ''}不學了
                        </div>
                        <div className="text-[8px] text-center opacity-60 mt-1">A:移動 B:確認 C:返回</div>
                    </div>
                )}
            </div>

            {selectedSkillDetail && selectedMoveSkill && (
                <div
                    className="absolute inset-0 z-[120] flex items-center justify-center px-3 py-4 bg-black/45"
                    onClick={() => setSelectedSkillDetail(null)}
                >
                    <div
                        className="w-full max-w-[300px] border-4 border-[#1a1a1a] bg-[#9dae8a] text-[#1a1a1a] shadow-[6px_6px_0_rgba(0,0,0,0.35)] p-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                                <AutoFitText as="div" className="text-[13px] font-black text-[#1a1a1a] w-full" minFontSize={9} maxFontSize={13}>
                                    {selectedMoveSkill.name}
                                </AutoFitText>
                                <div className="text-[9px] font-black text-[#383a37] mt-0.5">
                                    {TYPE_MAP[selectedMoveSkill.type] || selectedMoveSkill.type} / 威力:{selectedMoveSkill.power || '-'} / 命中:{selectedMoveSkill.accuracy || '-'}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="text-[9px] font-black px-2 py-1 border-2 border-[#1a1a1a] bg-[#383a37] text-white"
                                onClick={() => setSelectedSkillDetail(null)}
                            >
                                關閉
                            </button>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                            {selectedMoveBadges.map((badge) => (
                                <span
                                    key={badge.key}
                                    title={badge.title}
                                    className={badge.className}
                                    style={badge.style}
                                >
                                    {badge.label}
                                </span>
                            ))}
                            {selectedMoveSkill.stat_changes && selectedMoveSkill.stat_changes.some(s => s.change > 0) && (
                                <span className="text-[7px] px-1 rounded-sm border border-black/10 leading-none py-0.5 font-black bg-[#66bb6a] text-white">
                                    變化
                                </span>
                            )}
                        </div>

                        <div className="mt-2 text-[9px] font-black text-[#1a1a1a]">
                            原生異常：
                            <span className="ml-1 text-[#d32f2f]">
                                {selectedMoveSkill.ailment && selectedMoveSkill.ailment !== 'none'
                                    ? getAilmentLabel(selectedMoveSkill.ailment)
                                    : '無'}
                            </span>
                        </div>

                        <div className="mt-1 text-[8px] font-black text-[#383a37]">
                            附魔：
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {Object.keys(selectedMoveEnchantData).filter((key) => (selectedMoveEnchantData[key] || 0) > 0).length > 0 ? (
                                Object.entries(selectedMoveEnchantData)
                                    .filter(([, value]) => value > 0)
                                    .map(([key, value]) => (
                                        <span
                                            key={key}
                                            className={`text-[7px] px-1 rounded-sm border border-black/10 leading-none py-0.5 font-black ${getAilmentClassName(key)}`}
                                        >
                                            {getAilmentLabel(key)} +{value}{['burn', 'paralysis', 'poison', 'confusion', 'leech-seed', 'trap', 'freeze', 'sleep'].includes(key) ? '%' : ''}
                                        </span>
                                    ))
                            ) : (
                                <span className="text-[8px] text-[#383a37] font-bold">無附魔</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

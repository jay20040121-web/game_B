import React from 'react';
import { SPECIES_BASE_STATS, NATURE_CONFIG, SKILL_DATABASE, TYPE_MAP, calcFinalStat, getLevelByPower } from '../monsterData';
import AutoFitText from './AutoFitText';
import { buildAilmentBadges } from '../utils/ailmentBadgeUtils';
import { useState } from 'react';

const TYPE_LABELS = {
    normal: '普',
    fire: '火',
    water: '水',
    grass: '草',
    poison: '毒',
    flying: '飛',
    bug: '蟲',
    rock: '岩',
    ghost: '鬼'
};

const AILMENT_LABELS = {
    burn: '燒',
    paralysis: '麻',
    poison: '毒',
    confusion: '混',
    'leech-seed': '吸',
    trap: '縛',
    freeze: '凍',
    sleep: '眠',
    lifesteal: '血',
    accuracy: '準',
    priority: '先'
};

const ailmentClass = (ailment) => (
    ailment === 'burn' ? 'bg-[#ff5252] text-white' :
        ailment === 'paralysis' ? 'bg-[#ffca28] text-black' :
            ailment === 'poison' ? 'bg-[#9c27b0] text-white' :
                ailment === 'accuracy' ? 'bg-[#2196f3] text-white' :
                    ailment === 'priority' ? 'bg-[#ff9800] text-white' :
                        ailment === 'freeze' ? 'bg-[#80deea] text-black' :
                            ailment === 'sleep' ? 'bg-[#90a4ae] text-white' :
                                ailment === 'lifesteal' ? 'bg-[#e91e63] text-white' :
                                    'bg-[#4db6ac] text-white'
);

export default function StatusOverlay({
    isStatusUIOpen,
    statusPage = 'stats',
    onToggleStatusPage,
    onClose,
    getMonsterId,
    soulTagCounts,
    hunger,
    mood,
    bondValue,
    advStats,
    monsterTraits,
    getIVGrade
}) {
    if (!isStatusUIOpen) return null;

    const [selectedSkillDetail, setSelectedSkillDetail] = useState(null);

    const isMovesPage = statusPage === 'moves';
    const sid = getMonsterId();
    const level = getLevelByPower(advStats.basePower);
    const types = SPECIES_BASE_STATS[String(sid)]?.types || ['normal'];
    const tagEntries = Object.entries(soulTagCounts || {});
    const bestTag = tagEntries.reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0]);
    const dominantTag = bestTag[0];
    const natureName = bestTag[1] > 0 ? (NATURE_CONFIG[dominantTag]?.name || '未知') : '尚未分化';
    const nMods = { atk: 1.0, def: 1.0, spd: 1.0 };

    if (dominantTag === 'passionate') { nMods.atk = 1.1; nMods.def = 0.9; }
    else if (dominantTag === 'stubborn') { nMods.def = 1.1; nMods.spd = 0.9; }
    else if (dominantTag === 'rational') { nMods.spd = 1.1; nMods.atk = 0.9; }
    else if (dominantTag === 'nonsense') { nMods.spd = 1.1; nMods.def = 0.9; }

    const traitMods = monsterTraits?.trait?.modifiers || {};
    const levelTraitMod = level >= (traitMods.thresholdLevel || Infinity)
        ? (traitMods.highLevelStat || 1)
        : (traitMods.lowLevelStat || 1);
    const fHP = Math.floor(calcFinalStat('hp', sid, advStats.ivs.hp, advStats.evs.hp, level) * (traitMods.hp || 1) * levelTraitMod);
    const fATK = Math.floor(calcFinalStat('atk', sid, advStats.ivs.atk, advStats.evs.atk, level, nMods.atk) * (traitMods.atk || 1) * levelTraitMod);
    const fDEF = Math.floor(calcFinalStat('def', sid, advStats.ivs.def, advStats.evs.def, level, nMods.def) * (traitMods.def || 1) * levelTraitMod);
    const fSPD = Math.floor(calcFinalStat('spd', sid, advStats.ivs.spd, advStats.evs.spd, level, nMods.spd) * (traitMods.spd || 1) * levelTraitMod);
    const moveSlots = Array.from({ length: 4 }, (_, idx) => advStats?.moves?.[idx] || null);
    const selectedMoveId = selectedSkillDetail?.moveId;
    const selectedMoveSkill = selectedMoveId ? SKILL_DATABASE[selectedMoveId] : null;
    const selectedMoveEnchantData = selectedMoveId ? (advStats?.moveUpgrades?.[selectedMoveId]?.ailments || {}) : {};
    const selectedMoveBadges = selectedMoveSkill ? buildAilmentBadges({
        primaryAilment: selectedMoveSkill.ailment,
        enchantData: selectedMoveEnchantData,
        baseClassName: 'text-[7px] px-1 rounded-sm border border-black/10 leading-none py-0.5 font-black'
    }) : [];

    return (
        <div className="absolute inset-0 z-[115] flex flex-col items-center justify-start p-2" style={{
            backgroundImage: `url("${import.meta.env.BASE_URL}assets/BG/共用底圖.png")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
            <div className="absolute inset-0 bg-blue-900/40 z-0"></div>

            <div className="w-full bg-[#383a37]/50 text-white text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black relative z-10 shadow-sm">
                <span>{isMovesPage ? '技能欄位' : '狀態資訊'}</span>
                <button type="button" onClick={onToggleStatusPage} className="text-[9px] text-[#ffca28] underline decoration-dotted">
                    [B] {isMovesPage ? '狀態' : '技能'}
                </button>
                <button type="button" className="cursor-pointer" onClick={onClose}>[C] 關閉</button>
            </div>

            <div className="flex-1 w-full flex flex-col gap-1.5 px-1 justify-start pb-1 relative z-10">
                {!isMovesPage ? (
                    <>
                        <div className="border-b-2 border-[#383a37] pb-1 flex justify-between text-[11px] font-black text-white">
                            <span>屬性: {types.map(t => TYPE_LABELS[t] || t).join(' / ')}</span>
                            <span>性格: {natureName}</span>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            {[
                                { label: '飽食度', val: hunger, color: '#e67e22' },
                                { label: '心情度', val: mood, color: '#f1c40f' },
                                { label: '羈絆值', val: Math.min(100, (bondValue / 100) * 100), color: '#e74c3c', text: bondValue }
                            ].map((s, i) => (
                                <div key={i} className="flex flex-col gap-0.5">
                                    <div className="flex justify-between text-[10px] font-black text-white leading-tight">
                                        <span>{s.label}</span>
                                        <span>{s.text !== undefined ? s.text : `${Math.floor(s.val)}%`}</span>
                                    </div>
                                    <div className="w-full h-2 bg-[#ccd6be] border border-[#383a37] rounded-sm overflow-hidden">
                                        <div className="h-full transition-all duration-300" style={{ width: `${s.text !== undefined ? Math.min(100, (s.text / 150) * 100) : s.val}%`, backgroundColor: s.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 px-1.5 py-1 mt-0.5">
                            <div className="text-[10px] font-black text-white">生命: {fHP} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.hp)})</span></div>
                            <div className="text-[10px] font-black text-white">攻擊: {fATK} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.atk)})</span></div>
                            <div className="text-[10px] font-black text-white">防禦: {fDEF} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.def)})</span></div>
                            <div className="text-[10px] font-black text-white">速度: {fSPD} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.spd)})</span></div>
                            <div className="text-[10px] font-black text-white">等級: {level}</div>
                            <div className="text-[10px] font-black text-white">戰鬥力: {advStats.basePower}</div>
                        </div>

                        <div className="text-[10px] font-black text-white mt-0.5 border-t border-[#383a37]/30 pt-0">
                            <div className="bg-black/20 border border-white/10 rounded px-1.5 py-1 flex flex-col gap-0.5">
                                <div className="text-[#ffca28]">天賦: {monsterTraits?.trait?.name || '尚未覺醒'}</div>
                                <div className="text-[10px] text-[#9be58f] leading-tight">
                                    加成: {monsterTraits?.trait?.bonus || '尚未獲得特殊加成'}
                                </div>
                                <div className="text-[10px] text-[#ff9f9f] leading-tight">
                                    代價: {monsterTraits?.trait?.drawback || '尚未獲得特殊代價'}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col gap-1.5">
                        <div className="border-b-2 border-[#383a37] pb-1 flex justify-between text-[11px] font-black text-white">
                            <span>目前技能</span>
                            <span>{moveSlots.filter(Boolean).length}/4</span>
                        </div>

                        {moveSlots.map((moveId, idx) => {
                            const skill = moveId ? SKILL_DATABASE[moveId] : null;
                            const enchantData = moveId ? (advStats?.moveUpgrades?.[moveId]?.ailments || {}) : {};
                            const count = moveId ? (advStats?.moveUpgrades?.[moveId]?.count || 0) : 0;
                            const badges = skill ? buildAilmentBadges({
                                primaryAilment: skill.ailment,
                                enchantData,
                                baseClassName: 'text-[7px] px-1 rounded-sm border border-black/10 leading-none py-0.5 font-black'
                            }) : [];

                            return (
                                <div
                                    key={idx}
                                    className={`min-h-[46px] border-2 rounded-sm px-2 py-1.5 flex flex-col justify-center ${skill ? 'bg-black/25 border-white/20 cursor-pointer' : 'bg-black/10 border-white/10 opacity-50'}`}
                                    onClick={() => skill && setSelectedSkillDetail({ moveId, idx })}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex flex-col min-w-0">
                                            <div className="text-[11px] font-black text-white leading-tight truncate">
                                                {idx + 1}. {skill?.name || '空技能欄'}
                                            </div>
                                            {skill && (
                                                <div className="text-[8px] text-white/70 leading-tight">
                                                    {TYPE_MAP[skill.type] || skill.type} / 威力:{skill.power || '-'} / 命中:{skill.accuracy || '-'}
                                                </div>
                                            )}
                                        </div>
                                        {skill && (
                                            <div className="text-[8px] font-black text-[#ffca28] shrink-0">
                                                {count}/10
                                            </div>
                                        )}
                                    </div>

                                    {skill && (
                                        <div className="flex flex-wrap gap-1 mt-1">
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
                                            {skill.stat_changes && skill.stat_changes.some(s => s.change > 0) && (
                                                <span className="text-[7px] px-1 rounded-sm border border-black/10 leading-none py-0.5 font-black bg-[#66bb6a] text-white">
                                                    能力
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        <div className="text-[8px] font-black text-white/60 text-center border-t border-white/10 pt-1 mt-0.5">
                            [B] 返回狀態　[C] 關閉
                        </div>
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
                                    className={`text-[7px] px-1 rounded-sm border border-black/10 leading-none py-0.5 font-black ${badge.className}`}
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
                                    ? `${AILMENT_LABELS[selectedMoveSkill.ailment] || selectedMoveSkill.ailment}`
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
                                            className={`text-[7px] px-1 rounded-sm border border-black/10 leading-none py-0.5 font-black ${ailmentClass(key)}`}
                                        >
                                            {AILMENT_LABELS[key] || key} +{value}{['burn', 'paralysis', 'poison', 'confusion', 'leech-seed', 'trap', 'freeze', 'sleep'].includes(key) ? '%' : ''}
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

import React from 'react';
import { SPECIES_BASE_STATS, NATURE_CONFIG } from '../data/gameConfig';

export function StatusOverlay({
    isStatusUIOpen,
    getMonsterId,
    soulTagCounts,
    hunger,
    mood,
    bondValue,
    advStats,
    trainWins,
    calcFinalStat,
    getIVGrade
}) {
    if (!isStatusUIOpen) return null;

    return (
        <div className="absolute inset-0 z-[115] flex flex-col items-center justify-start p-2" style={{ backgroundColor: 'rgba(157, 174, 138, 0.99)' }}>
            <div className="w-full bg-[#383a37] text-[#8fa07e] text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black">
                <span>狀態資訊</span>
                <span>[C] 關閉</span>
            </div>

            <div className="flex-1 w-full flex flex-col gap-1.5 px-1 justify-start pb-1">
                <div className="border-b-2 border-[#383a37] pb-1 flex justify-between text-[11px] font-black text-[#1a1a1a]">
                    <span>屬性: {(() => {
                        const sid = getMonsterId();
                        const types = SPECIES_BASE_STATS[String(sid)]?.types || ['normal'];
                        return types.map(t => ({
                            fire: '火', water: '水', grass: '草', bug: '蟲', dragon: '龍',
                            flying: '飛', poison: '毒', ground: '地', rock: '岩',
                            psychic: '超', ice: '冰', ghost: '鬼', fighting: '鬥',
                            electric: '電', steel: '鋼', dark: '惡', normal: '普',
                            fairy: '妖'
                        }[t] || t)).join(' / ');
                    })()}</span>
                    <span>性格: {(() => {
                        const tagEntries = Object.entries(soulTagCounts || {});
                        const best = tagEntries.reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0]);
                        if (best[1] <= 0) return '未覺醒';
                        return NATURE_CONFIG[best[0]]?.name || '神祕';
                    })()}</span>
                </div>

                <div className="flex flex-col gap-0.5">
                    {[
                        { label: '飽足度', val: hunger, color: '#e67e22' },
                        { label: '心情值', val: mood, color: '#f1c40f' },
                        { label: '羈絆值', val: Math.min(100, (bondValue / 100) * 100), color: '#e74c3c', text: bondValue }
                    ].map((s, i) => (
                        <div key={i} className="flex flex-col gap-0.5">
                            <div className="flex justify-between text-[10px] font-black text-[#1a1a1a] leading-tight">
                                <span>{s.label}</span>
                                <span>{s.text !== undefined ? s.text : `${Math.floor(s.val)}%`}</span>
                            </div>
                            <div className="w-full h-2 bg-[#ccd6be] border border-[#383a37] rounded-sm overflow-hidden">
                                <div className="h-full transition-all duration-300" style={{ width: `${s.text !== undefined ? Math.min(100, (s.text / 150) * 100) : s.val}%`, backgroundColor: s.color }} />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 bg-[#869675] px-1.5 py-1 rounded border border-[#383a37] mt-0.5">
                    {(() => {
                        const level = Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1));
                        const sid = getMonsterId();
                        const dominantTag = Object.entries(soulTagCounts || {}).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];
                        const nMods = { atk: 1.0, def: 1.0, spd: 1.0 };
                        if (dominantTag === 'passionate') { nMods.atk = 1.1; nMods.def = 0.9; }
                        else if (dominantTag === 'stubborn') { nMods.def = 1.1; nMods.spd = 0.9; }
                        else if (dominantTag === 'rational') { nMods.spd = 1.1; nMods.atk = 0.9; }
                        else if (dominantTag === 'nonsense') { nMods.spd = 1.1; nMods.def = 0.9; }

                        const fHP = calcFinalStat('hp', sid, advStats.ivs.hp, advStats.evs.hp, level);
                        const fATK = calcFinalStat('atk', sid, advStats.ivs.atk, advStats.evs.atk, level, nMods.atk);
                        const fDEF = calcFinalStat('def', sid, advStats.ivs.def, advStats.evs.def, level, nMods.def);
                        const fSPD = calcFinalStat('spd', sid, advStats.ivs.spd, advStats.evs.spd, level, nMods.spd);

                        return (
                            <>
                                <div className="text-[10px] font-black text-[#1a1a1a]">血量: {fHP} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.hp)})</span></div>
                                <div className="text-[10px] font-black text-[#1a1a1a]">攻擊: {fATK} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.atk)})</span></div>
                                <div className="text-[10px] font-black text-[#1a1a1a]">防禦: {fDEF} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.def)})</span></div>
                                <div className="text-[10px] font-black text-[#1a1a1a]">速度: {fSPD} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.spd)})</span></div>
                                <div className="text-[10px] font-black text-[#1a1a1a]">等級: {level}</div>
                                <div className="text-[10px] font-black text-[#1a1a1a]">戰力: {advStats.basePower}</div>
                            </>
                        );
                    })()}
                </div>

                <div className="text-[10px] font-black text-center text-[#1a1a1a] mt-0.5 opacity-70 border-t border-[#383a37]/30 pt-0.5">
                    累計特訓勝次: {trainWins} 次
                </div>
            </div>
        </div>
    );
}

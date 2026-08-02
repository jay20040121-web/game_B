import React from 'react';
import { MONSTER_NAMES, SKILL_DATABASE, SPECIES_BASE_STATS, TYPE_MAP, getLevelByPower } from '../monsterData';
import AutoFitText from './AutoFitText';
import { DitheredSprite } from './SpriteRenderer';

export default function InventoryOverlay({ isInventoryOpen, inventory, selectedBallIdx, activeBallId }) {
    if (!isInventoryOpen) return null;
    const selectedBall = inventory?.[selectedBallIdx] || null;
    const pokemon = selectedBall?.pokemon || null;
    const moves = (pokemon?.advStats?.moves || []).map(id => SKILL_DATABASE[id]).filter(Boolean);
    const types = pokemon?.types?.length
        ? pokemon.types
        : (SPECIES_BASE_STATS[String(pokemon?.speciesId)]?.types || []);
    const isActive = selectedBall?.ballId === activeBallId;

    return (
        <div className="absolute inset-0 z-[115] flex flex-col items-center justify-start p-2 bg-[#163b55]">
            <div className="absolute inset-0 bg-blue-900/40 z-0" />
            <div className="w-full bg-[#383a37]/80 text-white text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black relative z-10">
                <span>寶可夢球背包</span><span>[C] 關閉</span>
            </div>
            <div className="flex-1 w-full flex flex-col gap-2 px-1 overflow-hidden relative z-10">
                <div className="border-b-2 border-white/20 pb-1 flex justify-between text-white">
                    <span className="text-[11px] font-black">寶可夢球：{inventory?.length || 0} 顆</span>
                    <span className="text-[9px] font-bold opacity-70">{inventory?.length ? `${selectedBallIdx + 1} / ${inventory.length}` : '0 / 0'}</span>
                </div>
                {selectedBall && pokemon ? (
                    <div className="flex-1 bg-[#383a37]/75 border-2 border-white/30 rounded p-2 text-white flex flex-col items-center overflow-hidden">
                        <div className="w-full flex items-center gap-2 border-b border-white/20 pb-1">
                            <div className="w-12 h-12 rounded-full border-4 border-[#1a1a1a] bg-gradient-to-b from-[#ef5350] from-50% to-white to-50% relative flex items-center justify-center shrink-0">
                                <div className="absolute w-full h-1 bg-[#1a1a1a]" />
                                <div className="w-3 h-3 rounded-full bg-white border-[3px] border-[#1a1a1a] z-10" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <AutoFitText as="div" className="w-full h-[18px] text-[13px] font-black" minFontSize={8} maxFontSize={13}>
                                    {MONSTER_NAMES[pokemon.speciesId] || '未知寶可夢'}
                                </AutoFitText>
                                <div className="text-[9px] opacity-80">等級 {getLevelByPower(pokemon.advStats?.basePower || 100)}</div>
                                <div className="text-[8px] text-[#ffeb3b]">{isActive ? '目前同行中' : '收納於球內'}</div>
                            </div>
                            <DitheredSprite id={pokemon.speciesId} scale={1.15} />
                        </div>
                        <div className="w-full mt-2 text-[9px] space-y-1 overflow-y-auto">
                            <div>特性：{pokemon.monsterTraits?.trait?.name || '無'}</div>
                            {types.length > 0 && <div>屬性：{types.map(type => TYPE_MAP[type] || type).join('、')}</div>}
                            <div className="border-t border-white/15 pt-1">技能</div>
                            <div className="grid grid-cols-2 gap-1">
                                {moves.length ? moves.map(move => <div key={move.id} className="bg-black/25 rounded px-1 py-0.5 truncate">{move.name}・{TYPE_MAP[move.type] || move.type}</div>) : <div className="opacity-60">尚未學會技能</div>}
                            </div>
                            <div className="text-[8px] opacity-70 pt-1">這顆球會獨立保存技能、屬性、特性、能力與培育狀態。</div>
                        </div>
                        <div className={`mt-auto text-[10px] font-black px-3 py-1 rounded-full border border-[#1a1a1a] ${isActive ? 'bg-gray-500' : 'bg-[#ff5252] animate-pulse'}`}>
                            {isActive ? '目前使用中' : '[B] 替換同行寶可夢'}
                        </div>
                    </div>
                ) : <div className="flex-1 flex items-center justify-center text-white text-[11px] font-bold opacity-60">目前沒有寶可夢球</div>}
                <div className="text-[9px] font-black text-center text-white opacity-80">[A] 下一顆　[B] 替換　[C] 關閉</div>
            </div>
        </div>
    );
}

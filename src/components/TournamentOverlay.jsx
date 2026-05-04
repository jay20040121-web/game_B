import React, { useEffect, useState } from 'react';
import { DitheredSprite, DitheredBackSprite } from './SpriteRenderer';
import { SKILL_DATABASE } from '../monsterData';

export function TournamentOverlay({
    isTournamentOpen,
    tPhase,
    currentRound,
    opponents,
    nextTournamentPhase,
    prevTournamentPhase,
    myMonsterId,
    playerName,
    cardOptions = [],
    pickRogueCard,
    // 冠軍附魔 props
    advStats,
    rewardOptions = [],
    selectedRewardMoveIdx = 0,
    setSelectedRewardMoveIdx,
    selectedRewardEffectIdx = 0,
    setSelectedRewardEffectIdx,
    confirmChampionReward,
    rerollCount,
    rerollChampionRewards
}) {
    if (!isTournamentOpen) return null;

    // 戰鬥中與閒置狀態不顯現 Overlay
    if (tPhase === 'fighting' || tPhase === 'idle') return null;

    // 只有在特定階段才顯示黑色背景層 (防止狀態不同步時出現空黑屏)
    const activePhases = ['intro', 'bracket', 'battle_intro', 'champion', 'lost', 'card_selection', 'champion_reward_move', 'champion_reward_effect'];
    if (!activePhases.includes(tPhase)) return null;

    return (
        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black/90 p-4 transition-opacity duration-500">
            {tPhase === 'intro' && (
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                    <img 
                        src={`${import.meta.env.BASE_URL}assets/BG/聯盟大會開幕.png`} 
                        alt="Tournament Intro" 
                        className="w-full h-full object-cover animate-fade-in"
                    />
                </div>
            )}

            {tPhase === 'bracket' && (
                <div className="flex flex-col items-center w-full animate-fade-in">
                    <h2 className="text-[#ffca28] text-sm font-black mb-4 border-b-2 border-[#ffca28]">
                        對戰名單確認 
                        {currentRound === 1 ? ' (16強)' : currentRound === 2 ? ' (8強)' : currentRound === 3 ? ' (4強)' : ' (決賽)'}
                    </h2>
                    <div className="w-full h-[155px] overflow-hidden border border-[#1a1a1a] bg-[#383a37] p-2 flex flex-col items-center">
                        <div className="flex flex-col gap-1.5 w-full">
                            {(() => {
                                const numMatches = Math.pow(2, 4 - currentRound);
                                const matches = [];
                                
                                for (let i = 0; i < numMatches; i++) {
                                    const p1 = opponents[i * 2];
                                    const p2 = opponents[i * 2 + 1];
                                    
                                    const p1Name = p1?.isPlayer ? `👉 ${p1.playerName} 👈` : (p1?.playerName || "???");
                                    const p2Name = p2?.isPlayer ? `👉 ${p2.playerName} 👈` : (p2?.playerName || "???");
                                    
                                    matches.push({ 
                                        p1: p1Name,
                                        p2: p2Name,
                                        highlight: p1?.isPlayer || p2?.isPlayer
                                    });
                                }

                                return matches.map((m, idx) => (
                                    <div key={idx} className={`flex justify-between items-center text-[9px] px-2 py-1 border border-black/30 ${m.highlight ? 'bg-[#ffca28] text-black font-black' : 'text-gray-400 bg-black/10'}`}>
                                        <span className="w-[48%] text-center truncate">{m.p1}</span>
                                        <span className="text-[7px] opacity-50">VS</span>
                                        <span className="w-[48%] text-center truncate">{m.p2}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {tPhase === 'battle_intro' && opponents[1] && (
                <div className="w-full flex-1 flex flex-col justify-between p-2 py-8 animate-[pullIn_0.5s_ease-out]">
                    <div className="flex items-center justify-start w-full bg-white/10 p-2 rounded-r-full shadow-lg transform -translate-x-[20%] animate-[slideRight_0.5s_forwards]">
                        <div className="scale-125 mr-4">
                            {opponents[1].monster && <DitheredSprite id={opponents[1].monster.id} scale={2} />}
                        </div>
                        <div className="flex flex-col text-white">

                            <span className="text-[12px] font-black text-[#ff5252]">{opponents[1].playerName}</span>
                            <span className="text-[9px]">{opponents[1].monster?.name} - Lv.{opponents[1].monster?.level}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end w-full bg-white/10 p-2 rounded-l-full shadow-lg transform translate-x-[20%] animate-[slideLeft_0.5s_forwards_0.5s]">
                        <div className="flex flex-col text-white items-end text-right">

                            <span className="text-[12px] font-black text-[#ffca28]">{playerName || '玩家'}</span>
                        </div>
                        <div className="scale-125 ml-4">
                            <DitheredBackSprite id={myMonsterId} scale={2} />
                        </div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-[#fff] text-4xl font-black italic opacity-0 animate-[popVs_0.5s_forwards_1s] drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]">
                            VS
                        </div>
                    </div>
                </div>
            )}

            {tPhase === 'card_selection' && (
                <div className="flex flex-col items-center w-full animate-fade-in">
                    <h2 className="text-[#ffca28] text-sm font-black mb-1 drop-shadow-md">挑選獎勵卡片</h2>
                    <div className="text-[7px] text-red-400 font-bold mb-3 animate-pulse">※ 請直接點擊螢幕內的卡片進行選擇</div>
                    
                    <div className="flex flex-col gap-3 w-full px-2">
                        {cardOptions.map((card, idx) => (
                            <button 
                                key={idx}
                                onClick={() => pickRogueCard(card)}
                                className={`
                                    relative flex flex-col items-start p-2 border-2 rounded-lg transition-all duration-200
                                    ${card.rarity >= 3 ? 'border-[#ffca28] bg-[#ffca28]/10' : 'border-white/30 bg-black/40'}
                                    hover:scale-105 active:scale-95 text-left group overflow-hidden
                                `}
                            >
                                <div className="flex justify-between w-full items-center mb-1">
                                    <span className={`text-[10px] font-black ${card.rarity >= 3 ? 'text-[#ffca28]' : 'text-white'}`}>
                                        {card.name}
                                    </span>
                                    <span className="text-[7px] bg-black/50 px-1 rounded text-gray-400">
                                        {'★'.repeat(card.rarity)}
                                    </span>
                                </div>
                                <div className="text-[8px] text-gray-200 leading-tight">
                                    {card.desc}
                                </div>
                                {card.rarity >= 3 && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 冠軍附魔 - 第一步：選擇技能 */}
            {tPhase === 'champion_reward_move' && (
                <div className="flex flex-col items-center w-full animate-fade-in">
                    <h2 className="text-[#ffca28] text-sm font-black mb-1">🏆 冠軍附魔</h2>
                    <div className="text-[7px] text-red-400 font-bold mb-3 animate-pulse">※ 請點擊要強化的技能</div>
                    
                    <div className="flex flex-col gap-2 w-full px-2">
                        {(advStats?.moves || []).map((moveId, idx) => {
                            const skill = SKILL_DATABASE[moveId];
                            if (!skill) return null;
                            const upgradeData = advStats?.moveUpgrades?.[moveId];
                            const count = upgradeData?.count || 0;
                            const isMaxed = count >= 10;
                            const isAttack = (skill.power || 0) > 0;
                            const isSelected = selectedRewardMoveIdx === idx;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (!isAttack || isMaxed) return;
                                        setSelectedRewardMoveIdx(idx);
                                        nextTournamentPhase(); // 進入選效果階段
                                    }}
                                    disabled={!isAttack || isMaxed}
                                    className={`
                                        flex justify-between items-center p-2 border-2 rounded-lg transition-all text-left
                                        ${!isAttack ? 'border-gray-600 bg-gray-800/50 opacity-40 cursor-not-allowed' :
                                          isMaxed ? 'border-red-800 bg-red-900/30 opacity-60 cursor-not-allowed' :
                                          'border-[#ffca28]/50 bg-black/40 hover:border-[#ffca28] hover:scale-[1.02] active:scale-95'}
                                    `}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-white">{skill.name}</span>
                                        <span className="text-[7px] text-gray-400">
                                            威力:{skill.power || '-'} | 命中:{skill.accuracy || '-'} | {skill.type}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className={`text-[9px] font-bold ${isMaxed ? 'text-red-400' : count > 0 ? 'text-[#ffca28]' : 'text-gray-500'}`}>
                                            {isMaxed ? 'MAX' : `${count}/10`}
                                        </span>
                                        {!isAttack && <span className="text-[7px] text-gray-500">輔助技</span>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* 冠軍附魔 - 第二步：選擇附魔效果 */}
            {tPhase === 'champion_reward_effect' && (
                <div className="flex flex-col items-center w-full animate-fade-in">
                    <h2 className="text-[#ffca28] text-sm font-black mb-1">🏆 選擇附魔效果</h2>
                    <div className="text-[7px] text-red-400 font-bold mb-3 animate-pulse">※ 請點擊要附加的效果</div>
                    
                    <div className="flex flex-col gap-2 w-full px-2">
                        {rewardOptions.map((effect, idx) => {
                            const moveId = advStats?.moves?.[selectedRewardMoveIdx];
                            const currentVal = advStats?.moveUpgrades?.[moveId]?.ailments?.[effect.id] || 0;
                            const isAilmentMaxed = effect.type === 'ailment' && currentVal >= 100;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        if (isAilmentMaxed) return;
                                        setSelectedRewardEffectIdx(idx);
                                        confirmChampionReward(idx);
                                    }}
                                    disabled={isAilmentMaxed}
                                    className={`
                                        flex flex-col items-start p-2 border-2 rounded-lg transition-all text-left
                                        ${isAilmentMaxed ? 'border-gray-600 bg-gray-800/50 opacity-40 cursor-not-allowed' :
                                          'border-purple-400/50 bg-purple-900/20 hover:border-purple-400 hover:scale-[1.02] active:scale-95'}
                                    `}
                                >
                                    <div className="flex justify-between w-full items-center mb-1">
                                        <span className="text-[10px] font-bold text-purple-300">{effect.name}</span>
                                        {currentVal > 0 && (
                                            <span className="text-[7px] text-purple-400 bg-purple-900/50 px-1 rounded">
                                                已有 +{currentVal}{effect.type === 'ailment' ? '%' : ''}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[8px] text-gray-300">{effect.desc}</span>
                                </button>
                            );
                        })}
                    </div>

                    {rerollCount > 0 && (
                        <button 
                            onClick={() => rerollChampionRewards()}
                            className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-[#f39c12] hover:bg-[#e67e22] text-black text-[9px] font-bold rounded-full shadow-lg transition-all active:scale-95 animate-bounce"
                        >
                            🎲 重來骰子 (剩餘 {rerollCount} 次)
                        </button>
                    )}
                    
                    <button 
                        onClick={() => prevTournamentPhase()}
                        className="mt-3 text-[8px] text-gray-400 underline hover:text-white"
                    >
                        ← 返回選擇技能
                    </button>
                </div>
            )}

            {tPhase === 'champion' && (
                <div className="absolute inset-0 flex flex-col items-center overflow-hidden animate-fade-in">
                    <img 
                        src={`${import.meta.env.BASE_URL}assets/BG/獲得冠軍.png`} 
                        alt="Champion Background" 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                    <div className="relative z-10 flex flex-col items-center w-full h-full pt-3 pb-6 animate-[sparkle_2s_infinite]">
                        <div className="scale-[2.0] drop-shadow-[0_0_30px_#fff]">
                            <DitheredSprite id={myMonsterId} scale={3} />
                        </div>
                        
                        <div className="mt-auto flex flex-col items-center w-full px-4">
                            <div className="animate-bounce text-[#ffca28] text-[10px] font-bold">[ 點擊 B 鍵離開大會 ]</div>
                        </div>
                    </div>
                </div>
            )}

            {tPhase === 'lost' && (
                <div className="absolute inset-0 flex flex-col items-center overflow-hidden animate-fade-in">
                    <img 
                        src={`${import.meta.env.BASE_URL}assets/BG/淘汰.png`} 
                        alt="Defeat Background" 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                    <div className="relative z-10 flex flex-col items-center w-full h-full pt-3 pb-6">
                        <div className="scale-[2.0] grayscale opacity-80">
                            <DitheredSprite id={myMonsterId} scale={3} />
                        </div>
                        
                        <div className="mt-auto flex flex-col items-center w-full px-4">
                            <div className="animate-bounce text-[#ffca28] text-[10px] font-bold">[ 點擊 B 鍵離開大會 ]</div>
                        </div>
                    </div>
                </div>
            )}

            {/* 手動前進提示 */}
            {['intro', 'bracket', 'battle_intro'].includes(tPhase) && (
                <div className="absolute top-2 z-[130] animate-bounce flex flex-col items-center">
                    <div className="text-[#ffca28] text-[9px] font-bold tracking-[0.1em] mb-1 bg-black/60 px-2 py-0.5 rounded shadow-[0_0_5px_rgba(0,0,0,0.5)]">
                        按 B 鍵確認下一步
                    </div>
                    <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden border border-black/30">
                        <div className="h-full bg-[#ff5252] animate-[loading_1s_infinite] w-full"></div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes loading { from { transform: translateX(-100%); } to { transform: translateX(100%); } }
                @keyframes slideRight { to { transform: translateX(0); } }
                @keyframes slideLeft { to { transform: translateX(0); } }
                @keyframes popVs { 0% { transform: scale(5); opacity: 0; } 50% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}

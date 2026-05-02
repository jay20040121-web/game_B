import React, { useEffect, useState } from 'react';
import { DitheredSprite, DitheredBackSprite } from './SpriteRenderer';

export function TournamentOverlay({
    isTournamentOpen,
    tPhase,
    currentRound,
    opponents,
    nextTournamentPhase,
    myMonsterId,
    playerName,
    // --- Rogue Props ---
    rogueOptions = [],
    selectedCardIdx = 0,
    pendingSkillLearn = false,
    tournamentBuffs = null,
    // --- Champion Reward Props ---
    rewardOptions = [],
    selectedRewardMoveIdx = 0,
    selectedRewardEffectIdx = 0,
    playerMoves = [],
    // --- 新增：強化上限相關 Props ---
    moves = [],
    moveUpgrades = {}
}) {
    if (!isTournamentOpen) return null;

    // 戰鬥中與閒置狀態不顯現 Overlay
    if (tPhase === 'fighting' || tPhase === 'idle') return null;

    // 如果正在學習技能，隱藏大賽選卡介面以避免 UI 重疊
    if (tPhase === 'rogue_selection' && pendingSkillLearn) return null;

    // 只有在特定階段才顯示黑色背景層 (防止狀態不同步時出現空黑屏)
    const activePhases = ['intro', 'bracket', 'battle_intro', 'rogue_selection', 'champion_reward_move', 'champion_reward_effect', 'champion', 'lost'];
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

            {tPhase === 'rogue_selection' && (
                <div className="flex flex-col items-center w-full animate-[zoomIn_0.3s_ease-out]">
                    <h2 className="text-[#ffca28] text-sm font-black mb-2 [text-shadow:0_0_10px_#ffca28]">勝利獎勵：選擇一張強化卡</h2>
                    <p className="text-white/60 text-[8px] mb-4">按 A 鍵切換，按 B 鍵確認</p>

                    <div className="flex flex-col gap-2 w-full px-2">
                        {rogueOptions.map((card, idx) => {
                            const isSelected = selectedCardIdx === idx;
                            return (
                                <div
                                    key={card.id}
                                    className={`relative p-2 border-2 transition-all duration-200 ${isSelected
                                        ? 'bg-[#ffca28] border-white scale-[1.05] z-10 shadow-[0_0_15px_rgba(255,202,40,0.5)]'
                                        : 'bg-[#383a37]/80 border-white/20 opacity-60 scale-95'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-[10px] font-black ${isSelected ? 'text-black' : 'text-[#ffca28]'}`}>
                                            {card.name}
                                        </span>
                                        <div className="flex gap-0.5">
                                            {[...Array(card.rarity)].map((_, i) => (
                                                <span key={i} className="text-[8px]">⭐</span>
                                            ))}
                                        </div>
                                    </div>
                                    <p className={`text-[9px] leading-tight ${isSelected ? 'text-black/80 font-bold' : 'text-white/60'}`}>
                                        {card.desc}
                                    </p>
                                    {isSelected && (
                                        <div className="absolute -right-1 -top-1 bg-red-500 text-white text-[8px] px-1 font-bold animate-pulse">
                                            SELECTED
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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

            {(tPhase === 'champion_reward_move' || tPhase === 'champion_reward_effect') && (
                <div className="flex flex-col items-center w-full animate-[slideDown_0.4s_ease-out] z-20">
                    <div className="bg-[#ffca28] text-black px-4 py-1 font-black text-xs mb-3 shadow-[4px_4px_0_#000]">🏆 冠軍專屬獎勵 🏆</div>

                    <div className={`transition-opacity duration-300 ${tPhase === 'champion_reward_effect' ? 'opacity-40' : 'opacity-100'}`}>
                        <h3 className="text-white text-[11px] font-bold mb-1 text-center">Step 1: 選擇要強化的技能</h3>
                        <div className="grid grid-cols-2 gap-2 w-full mb-4 px-2">
                            {playerMoves.map((move, idx) => {
                                const isSelected = selectedRewardMoveIdx === idx;
                                // 🔹 安全讀取強化次數
                                const moveId = (moves && moves[idx]) ? moves[idx] : null;
                                const upgradeCount = (moveUpgrades && moveId && moveUpgrades[moveId]) ? (moveUpgrades[moveId].count || 0) : 0;
                                const isMaxed = upgradeCount >= 10;

                                return (
                                    <div
                                        key={idx}
                                        className={`relative p-1.5 border-2 text-[10px] font-black text-center truncate flex flex-col items-center gap-0.5 ${isSelected
                                            ? (isMaxed ? 'bg-gray-700 border-gray-400 text-gray-300' : 'bg-[#ff5252] border-white text-white scale-105 shadow-lg')
                                            : (isMaxed ? 'bg-black/20 border-white/5 text-white/20' : 'bg-black/40 border-white/20 text-white/40')
                                            }`}
                                    >
                                        <span>{move?.name || "---"}</span>
                                        <div className={`text-[7px] px-1 rounded-full ${isMaxed ? 'bg-gray-500 text-white' : 'bg-white/20'}`}>
                                            {isMaxed ? 'MAX' : `${upgradeCount}/10`}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className={`transition-opacity duration-300 ${tPhase === 'champion_reward_move' ? 'opacity-20' : 'opacity-100'}`}>
                        <h3 className="text-white text-[11px] font-bold mb-1 text-center">Step 2: 選擇附加效果</h3>
                        <div className="flex flex-col gap-2 w-full px-2">
                            {rewardOptions.map((opt, idx) => {
                                const isSelected = selectedRewardEffectIdx === idx;
                                return (
                                    <div
                                        key={idx}
                                        className={`p-2 border-2 flex justify-between items-center transition-all ${isSelected
                                            ? 'bg-blue-600 border-white text-white translate-x-1'
                                            : 'bg-black/60 border-white/10 text-white/40'
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black">{opt.name}</span>
                                            <span className="text-[8px] opacity-80">{opt.desc}</span>
                                        </div>
                                        {isSelected && <span className="text-[10px] animate-pulse">◀</span>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col items-center gap-1">
                        <div className="text-white/40 text-[7px] animate-bounce">
                            {tPhase === 'champion_reward_move' ? '按 A 切換技能 | 按 B 下一步' : '按 A 切換效果 | 按 B 確認強化 | 按 C 返回'}
                        </div>
                    </div>
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

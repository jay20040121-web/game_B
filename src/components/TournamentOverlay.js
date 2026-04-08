import React, { useEffect, useState } from 'react';
import { DitheredSprite, DitheredBackSprite } from './SpriteRenderer';

export function TournamentOverlay({
    isTournamentOpen,
    tPhase,
    currentRound,
    opponents,
    nextTournamentPhase,
    myMonsterId,
    playerName
}) {
    if (!isTournamentOpen) return null;

    // We don't render battle UI here, because App.js will spawn BattleAdventureOverlay automatically 
    // when battleState.active is true! We just render the between-match screens.
    if (tPhase === 'fighting') return null;

    return (
        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-black/90 p-4 transition-opacity duration-500">
            {tPhase === 'intro' && (
                <div className="animate-pulse flex flex-col items-center">
                    <h1 className="text-white text-xl font-black mb-4 tracking-widest text-center shadow-[0_0_10px_#fff]">
                         數位怪獸<br/>聯盟大賽
                    </h1>
                    <div className="text-[#ffca28] text-[10px] uppercase font-bold animate-pulse">
                        THE GRAND TOURNAMENT
                    </div>
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
                                // 第一組永遠是玩家
                                matches.push({ p1: `👉 ${playerName || '玩家'} 👈`, p2: opponents[currentRound - 1]?.playerName || 'NPC', highlight: true });
                                // 其他組為 AI 模擬
                                for (let i = 1; i < numMatches; i++) {
                                    const base = 4 + (i * 2);
                                    matches.push({ 
                                        p1: opponents[base % opponents.length]?.playerName || `大師_${base}`, 
                                        p2: opponents[(base + 1) % opponents.length]?.playerName || `訓練家_${base + 1}`,
                                        highlight: false 
                                    });
                                }
                                return matches.map((m, idx) => (
                                    <div key={idx} className={`flex justify-between items-center text-[9px] px-2 py-1 border border-black/30 ${m.highlight ? 'bg-[#ffca28] text-black font-black' : 'text-gray-400 bg-black/10'}`}>
                                        <span className="w-[40%] text-center truncate">{m.p1}</span>
                                        <span className="text-[8px] opacity-50">VS</span>
                                        <span className="w-[40%] text-center truncate">{m.p2}</span>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {tPhase === 'battle_intro' && opponents[currentRound - 1] && (
                <div className="w-full flex-1 flex flex-col justify-between p-2 py-8 animate-[pullIn_0.5s_ease-out]">
                    <div className="flex items-center justify-start w-full bg-white/10 p-2 rounded-r-full shadow-lg transform -translate-x-[20%] animate-[slideRight_0.5s_forwards]">
                        <div className="scale-125 mr-4">
                            <DitheredSprite id={opponents[currentRound - 1].monster.id} scale={2} />
                        </div>
                        <div className="flex flex-col text-white">
                            <span className="text-[10px] uppercase text-gray-300">OPPONENT</span>
                            <span className="text-[12px] font-black text-[#ff5252]">{opponents[currentRound - 1].playerName}</span>
                            <span className="text-[9px]">{opponents[currentRound - 1].monster.name} - Lv.{opponents[currentRound - 1].monster.level}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-end w-full bg-white/10 p-2 rounded-l-full shadow-lg transform translate-x-[20%] animate-[slideLeft_0.5s_forwards_0.5s]">
                        <div className="flex flex-col text-white items-end text-right">
                            <span className="text-[10px] uppercase text-gray-300">PLAYER</span>
                            <span className="text-[12px] font-black text-[#ffca28]">{playerName || '玩家'}</span>
                            <span className="text-[9px]">您的怪獸</span>
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


            {tPhase === 'champion' && (
                <div className="flex flex-col items-center justify-center h-full animate-[sparkle_2s_infinite]">
                    <div className="text-[#ffca28] text-2xl font-black mb-4 tracking-widest drop-shadow-[0_0_15px_#ffca28] text-center">
                        🏆<br/>THE CHAMPION
                    </div>
                    <div className="scale-[2.0] my-8 drop-shadow-[0_0_30px_#fff]">
                        <DitheredSprite id={myMonsterId} scale={3} />
                    </div>
                    <div className="text-white text-[12px] font-black text-center mt-2 bg-black/50 p-2 rounded">
                        恭喜成為本屆聯盟大賽冠軍！
                    </div>
                    <div className="mt-8 flex flex-col items-center gap-2">
                         <div className="animate-bounce text-[#ffca28] text-[10px] font-bold">[ 點按 A/B 領取獎勵 ]</div>
                         {/* 保持 A 鍵可點擊性供觸摸螢幕玩家使用 */}
                        <button onClick={nextTournamentPhase} className="bg-[#ffca28] text-black px-4 py-2 font-black text-[12px] rounded-sm shadow-[4px_4px_0_#fff] active:translate-y-1 active:translate-x-1 active:shadow-none">
                            確認
                        </button>
                    </div>
                </div>
            )}

            {tPhase === 'lost' && (
                <div className="flex flex-col items-center justify-center h-full animate-fade-in bg-red-900/40 w-full">
                    <div className="text-[#ff5252] text-4xl font-black mb-4 tracking-tighter drop-shadow-[0_4px_10px_rgba(255,82,82,0.6)] text-center italic">
                        DEFEAT
                    </div>
                    <div className="scale-[1.8] my-10 grayscale opacity-80">
                        <DitheredSprite id={myMonsterId} scale={3} />
                    </div>
                    <div className="text-white text-[12px] font-black text-center mt-2 bg-black/60 p-3 rounded-lg border-2 border-[#ff5252]/50 max-w-[80%]">
                        很遺憾被淘汰了...<br/>
                        <span className="text-[10px] text-gray-400 font-normal">再接再厲，期待下一次更強的歸來！</span>
                    </div>
                    <div className="mt-10 flex flex-col items-center gap-2">
                         <div className="animate-bounce text-white/80 text-[11px] font-bold">[ 點按 B 鍵返回 ]</div>
                         <button onClick={nextTournamentPhase} className="bg-[#ff5252] text-white px-6 py-2 font-black text-[12px] rounded-sm shadow-[4px_4px_0_#1a1a1a] active:translate-y-1 active:translate-x-1 active:shadow-none">
                            返回大廳
                        </button>
                    </div>
                </div>
            )}

            {/* 手動前進提示 */}
            {['intro', 'bracket', 'battle_intro'].includes(tPhase) && (
                <div className="absolute bottom-12 animate-bounce flex flex-col items-center">
                    <div className="text-white/60 text-[10px] font-bold tracking-[0.2em] mb-1">
                        PRESS B TO CONTINUE
                    </div>
                    <div className="w-12 h-1 bg-white/20 rounded-full overflow-hidden">
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

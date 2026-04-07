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
    // Phase auto-advance timers for visual effects
    useEffect(() => {
        if (!isTournamentOpen) return;
        
        let timer;
        if (tPhase === 'intro') {
            timer = setTimeout(nextTournamentPhase, 3000);
        } else if (tPhase === 'bracket') {
            timer = setTimeout(nextTournamentPhase, 4000);
        } else if (tPhase === 'battle_intro') {
            timer = setTimeout(nextTournamentPhase, 3000);
        } else if (tPhase === 'mvp') {
             timer = setTimeout(nextTournamentPhase, 3000);
        } else if (tPhase === 'champion') {
            // Wait for user input to clear champion screen
        }

        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isTournamentOpen, tPhase]);

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
                    <div className="w-full h-[150px] overflow-hidden border border-[#1a1a1a] bg-[#383a37] p-2 flex flex-col">
                        {/* Auto-scrolling brackets simulation */}
                        <div className="animate-[scrollUp_3s_linear_forwards] flex flex-col gap-2">
                            {opponents.map((opp, idx) => (
                                <div key={idx} className={`flex justify-between items-center text-[10px] p-1 border border-black/30 ${(currentRound - 1) === idx ? 'bg-[#ffca28] text-black font-bold' : 'text-gray-400 bg-black/20'}`}>
                                    <span>{idx === (currentRound - 1) ? `👉 ${(playerName || '玩家')} 👈` : `AI大師 _${idx}`}</span>
                                    <span>VS</span>
                                    <span>{opp.playerName}</span>
                                </div>
                            ))}
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

            {tPhase === 'mvp' && (
                <div className="flex flex-col items-center justify-center h-full animate-[zoomIn_0.5s_ease-out]">
                    <div className="text-[#2ecc71] text-2xl font-black mb-4 tracking-widest animate-pulse drop-shadow-[0_0_10px_#2ecc71]">WINNER</div>
                    <div className="scale-150 my-6 bg-white/20 p-4 rounded-full shadow-[0_0_20px_#fff]">
                        <DitheredSprite id={myMonsterId} scale={3} />
                    </div>
                    <div className="text-white text-[12px] font-bold text-center mt-4">
                        <span className="text-[#ffca28] block mb-1">本場 MVP 特寫 ✨</span>
                        獲得 10 點戰鬥經驗！
                    </div>
                    <div className="mt-8 text-gray-400 text-[8px] animate-pulse">自動進入下一階段...</div>
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
                    <div className="mt-8 flex gap-4">
                        <button onClick={nextTournamentPhase} className="bg-[#ffca28] text-black px-4 py-2 font-black text-[12px] rounded-sm shadow-[4px_4px_0_#fff] active:translate-y-1 active:translate-x-1 active:shadow-none">
                            領取獎勵 [A/B]
                        </button>
                    </div>
                </div>
            )}
            <style>{`
                @keyframes scrollUp { from { transform: translateY(0); } to { transform: translateY(-70%); } }
                @keyframes slideRight { to { transform: translateX(0); } }
                @keyframes slideLeft { to { transform: translateX(0); } }
                @keyframes popVs { 0% { transform: scale(5); opacity: 0; } 50% { transform: scale(0.8); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
                @keyframes zoomIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
            `}</style>
        </div>
    );
}

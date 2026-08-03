import React from 'react';
import { DitheredSprite, DitheredBackSprite } from './SpriteRenderer';
import AutoFitText from './AutoFitText';

export function TournamentOverlay({
    isTournamentOpen,
    tPhase,
    currentRound,
    opponents = [],
    nextTournamentPhase,
    myMonsterId,
    playerName,
    rewardOptions = [],
    selectedRewardEffectIdx = 0,
    moveUpgrades = {},
    playerMoves = [],
    onRewardEffectSelect
}) {
    if (!isTournamentOpen) return null;

    // 戰鬥中與閒置狀態不顯現 Overlay
    if (tPhase === 'fighting' || tPhase === 'idle') return null;

    // 只有在特定階段才顯示黑色背景層 (防止狀態不同步時出現空黑屏)
    const activePhases = ['intro', 'bracket', 'battle_intro', 'champion_reward_effect', 'champion', 'lost'];
    if (!activePhases.includes(tPhase)) return null;

    return (
        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center bg-[#383a37]/95 p-4 transition-opacity duration-500">
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
                        {currentRound === 1 ? ' (32強)' : currentRound === 2 ? ' (16強)' : currentRound === 3 ? ' (8強)' : currentRound === 4 ? ' (4強)' : ' (決賽)'}
                    </h2>
                    <div className="w-full h-[155px] overflow-y-auto border border-[#1a1a1a] bg-[#383a37] p-2 flex flex-col items-center">
                        <div className="flex flex-col gap-1.5 w-full">
                            {(() => {
                                const safeOpponents = Array.isArray(opponents) ? opponents : [];
                                const numMatches = Math.pow(2, 5 - currentRound);
                                const matches = [];
                                
                                for (let i = 0; i < numMatches; i++) {
                                    const p1 = safeOpponents[i * 2];
                                    const p2 = safeOpponents[i * 2 + 1];
                                    
                                    const p1Name = p1?.isPlayer ? `👉 ${p1.playerName} 👈` : (p1?.playerName || "???");
                                    const p2Name = p2?.isPlayer ? `👉 ${p2.playerName} 👈` : (p2?.playerName || "???");
                                    
                                    matches.push({ 
                                        p1: p1Name,
                                        p2: p2Name,
                                        highlight: p1?.isPlayer || p2?.isPlayer
                                    });
                                }

                                return matches.map((m, idx) => (
                                    <div key={idx} className={`flex justify-between items-center text-[9px] px-2 py-1 border border-black/30 ${m.highlight ? 'bg-[#ffca28] text-black font-black' : 'text-white/80 bg-black/10'}`}>
                                        <span className="w-[48%] text-center truncate">{m.p1}</span>
                                        <span className="text-[7px] opacity-50">對戰</span>
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
                            {opponents[1].monster && <DitheredSprite id={opponents[1].monster.id} scale={2} pure />}
                        </div>
                        <div className="flex flex-col text-white min-w-0">

                            <AutoFitText as="span" className="text-[12px] font-black text-white w-full min-w-0" minFontSize={8} maxFontSize={12}>
                                {opponents[1].playerName}
                            </AutoFitText>
                            <div className="flex flex-col gap-0.5 w-full min-w-0">
                                <AutoFitText as="span" className="text-[9px] w-full min-w-0" minFontSize={7} maxFontSize={9}>
                                    {opponents[1].monster?.name}
                                </AutoFitText>
                                <AutoFitText as="span" className="text-[8px] w-full min-w-0 text-white/90" minFontSize={6} maxFontSize={8}>
                                    等級 {opponents[1].monster?.level}
                                </AutoFitText>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end w-full bg-white/10 p-2 rounded-l-full shadow-lg transform translate-x-[20%] animate-[slideLeft_0.5s_forwards_0.5s]">
                        <div className="flex flex-col text-white items-end text-right">

                            <AutoFitText as="span" className="text-[12px] font-black text-[#ffca28] w-full text-right" minFontSize={8} maxFontSize={12}>
                                {playerName || '玩家'}
                            </AutoFitText>
                        </div>
                        <div className="scale-125 ml-4">
                            <DitheredBackSprite id={myMonsterId} scale={2} />
                        </div>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-[#fff] text-4xl font-black italic opacity-0 animate-[popVs_0.5s_forwards_1s]">
                            VS
                        </div>
                    </div>
                </div>
            )}

            {tPhase === 'champion_reward_effect' && (
                <div className="flex flex-col items-center w-full z-20 px-2">
                    <div className="bg-[#ffca28] text-black px-4 py-1 font-black text-xs mb-3 shadow-[4px_4px_0_#000]">冠軍附魔獎勵：三選一</div>
                    <div className="w-full flex flex-col gap-2">
                        {rewardOptions.map((effect, idx) => <button key={`${effect.id}-${effect.moveId || idx}`} type="button" onClick={() => onRewardEffectSelect?.(idx)} className={`p-3 border-2 text-left transition-transform ${idx === selectedRewardEffectIdx ? 'bg-blue-600 border-white text-white scale-105' : 'bg-black/60 border-white/20 text-white/70'}`}>
                            <span className="block text-[10px] font-black">{effect.name}</span>
                            <span className="block text-[8px] mt-1">技能：{effect.moveName}</span>
                            <span className="block text-[8px]">{effect.desc}</span>
                        </button>)}
                    </div>
                    <div className="text-white/70 text-[8px] mt-3">A 切換獎勵，B 確認</div>
                </div>
            )}            {tPhase === 'champion' && (
                <div className="absolute inset-0 flex flex-col items-center overflow-hidden animate-fade-in">
                    <img 
                        src={`${import.meta.env.BASE_URL}assets/BG/獲得冠軍.png`} 
                        alt="Champion Background" 
                        className="absolute inset-0 w-full h-full object-cover z-0"
                    />
                    <div className="relative z-10 flex flex-col items-center w-full h-full pt-3 pb-6 animate-[sparkle_2s_infinite]">
                        <div className="scale-[2.0]">
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
                    <div className="text-[#ffca28] text-[9px] font-bold tracking-[0.1em] mb-1 bg-black/60 px-2 py-0.5 rounded">
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

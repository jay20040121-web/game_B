import React from 'react';
import { DitheredSprite } from './SpriteRenderer';
import AutoFitText from './AutoFitText';

export default function LeaderboardOverlay({
    isLeaderboardOpen,
    leaderboardPage,
    isLeaderboardLoading,
    leaderboard
}) {
    if (!isLeaderboardOpen) return null;

    return (
        <div
            className="absolute inset-0 z-[500] flex flex-col items-center p-2 font-bold select-none animate-fade-in text-white"
            style={{
                backgroundImage: `url("${import.meta.env.BASE_URL}assets/BG/?璇??制??.png")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            <div className="absolute inset-0 bg-blue-900/78 z-0"></div>
            <div className="absolute inset-0 bg-black/22 z-0"></div>

            <div className="relative z-10 w-full h-full max-w-[320px] flex flex-col border-4 border-[#1a1a1a] bg-[#9dae8a]/96 text-[#1a1a1a] shadow-[6px_6px_0_rgba(0,0,0,0.45)] overflow-hidden">
                <div className="w-full bg-[#383a37] text-white [text-shadow:0_0_4px_#fff] px-2 py-1 flex justify-between items-center border-b-2 border-[#1a1a1a]">
                    <AutoFitText as="span" className="text-[10px] tracking-tighter font-black flex items-center gap-1 min-w-0 w-full" minFontSize={8} maxFontSize={10}>
                        PvP 排行榜 [第{leaderboardPage + 1}頁/10]
                    </AutoFitText>
                </div>

                <div className="flex-1 w-full space-y-1 mt-1 relative z-10 p-2 overflow-hidden">
                    {isLeaderboardLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 opacity-60">
                            <div className="animate-spin text-xl">載入</div>
                            <div className="text-[10px]">排行榜載入中...</div>
                        </div>
                    ) : (
                        leaderboard.slice(leaderboardPage * 5, (leaderboardPage * 5) + 5).map((item, idx) => (
                            <div key={item.id} className="bg-[#383a37]/85 border-2 border-[#1a1a1a] p-1 flex items-center gap-2 h-[42px] relative overflow-hidden">
                                <div className="w-6 text-[12px] font-black italic text-white/50">
                                    #{(leaderboardPage * 5) + idx + 1}
                                </div>
                                <div className="w-10 h-10 flex items-center justify-center bg-black/15 border border-black/30 shrink-0">
                                    <DitheredSprite id={item.monsterId || 132} scale={0.85} animated={false} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <AutoFitText as="div" className="text-[10px] leading-none mb-0.5 w-full text-white" minFontSize={7} maxFontSize={10}>
                                        {item.displayName}
                                    </AutoFitText>
                                    <div className="flex gap-2 text-[8px] text-white/80">
                                        <span>勝:{item.wins}</span>
                                        <span>敗:{item.losses}</span>
                                        <span>勝率:{((item.winRate || 0) * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {!isLeaderboardLoading && leaderboard.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-[10px] opacity-40">
                            目前沒有排行榜資料
                        </div>
                    )}
                </div>

                <div className="w-full border-t-2 border-[#1a1a1a] pt-1 px-2 pb-2 flex justify-between items-center text-[8px] font-black bg-[#383a37] text-white">
                    <span className="animate-pulse">A：換頁</span>
                    <span>C：關閉</span>
                </div>
            </div>
        </div>
    );
}

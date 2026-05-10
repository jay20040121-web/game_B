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

    const pageCount = Math.max(1, Math.ceil((leaderboard?.length || 0) / 5));

    return (
        <div className="absolute inset-0 z-[500] flex flex-col items-center p-2 font-bold select-none animate-fade-in text-white bg-[#1f2a3d]">
            <div className="relative z-10 w-full h-full max-w-[320px] flex flex-col border-4 border-[#1a1a1a] bg-[#9dae8a] text-[#1a1a1a] shadow-[6px_6px_0_rgba(0,0,0,0.45)] overflow-hidden">
                <div className="w-full bg-[#383a37] text-white px-2 py-1 flex justify-between items-center border-b-2 border-[#1a1a1a]">
                    <AutoFitText as="span" className="text-[10px] tracking-tighter font-black flex items-center gap-1 min-w-0 w-full" minFontSize={8} maxFontSize={10}>
                        PvP 排行榜 [第{leaderboardPage + 1}頁/{pageCount}]
                    </AutoFitText>
                </div>

                <div className="flex-1 w-full space-y-1 mt-1 relative z-10 p-2 overflow-hidden bg-[#9dae8a]">
                    {isLeaderboardLoading ? (
                        <div className="flex flex-col items-center justify-center h-full gap-2 text-[#1a1a1a]">
                            <div className="animate-spin text-xl">讀取</div>
                            <div className="text-[10px]">排行榜載入中...</div>
                        </div>
                    ) : (
                        leaderboard.slice(leaderboardPage * 5, (leaderboardPage * 5) + 5).map((item, idx) => (
                            <div key={item.id} className="bg-[#383a37] border-2 border-[#1a1a1a] p-1 flex items-center gap-2 h-[42px] relative overflow-hidden">
                                <div className="w-6 text-[12px] font-black italic text-[#c8d2bd]">
                                    #{(leaderboardPage * 5) + idx + 1}
                                </div>
                                <div className="w-10 h-10 flex items-center justify-center bg-[#20251f] border border-[#1a1a1a] shrink-0">
                                    <DitheredSprite id={item.monsterId || 132} scale={0.85} animated={false} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <AutoFitText as="div" className="text-[10px] leading-none mb-0.5 w-full text-white" minFontSize={7} maxFontSize={10}>
                                        {item.displayName}
                                    </AutoFitText>
                                    <div className="flex gap-2 text-[8px] text-[#dce5d4]">
                                        <span>勝{item.wins}</span>
                                        <span>敗{item.losses}</span>
                                        <span>勝率:{((item.winRate || 0) * 100).toFixed(0)}%</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    {!isLeaderboardLoading && leaderboard.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-[10px] text-[#383a37]">
                            目前沒有排行榜資料
                        </div>
                    )}
                </div>

                <div className="w-full border-t-2 border-[#1a1a1a] pt-1 px-2 pb-2 flex justify-between items-center text-[8px] font-black bg-[#383a37] text-white">
                    <span className="animate-pulse">A：下一頁</span>
                    <span>C：關閉</span>
                </div>
            </div>
        </div>
    );
}

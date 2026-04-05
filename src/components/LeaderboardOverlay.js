import React from 'react';
import { DitheredSprite } from './SpriteRenderer';

export function LeaderboardOverlay({
    isLeaderboardOpen,
    leaderboardPage,
    isLeaderboardLoading,
    leaderboard
}) {
    if (!isLeaderboardOpen) return null;

    return (
        <div className="absolute inset-0 bg-[#9dae8a] z-[500] flex flex-col items-center p-2 font-bold select-none animate-fade-in text-[#1a1a1a]">
            <div className="w-full bg-[#383a37] text-[#9dae8a] px-2 py-1 flex justify-between items-center mb-1 shadow-sm">
                <span className="text-[10px] tracking-tighter font-black flex items-center gap-1">
                    🏆 全球英雄榜 [P{leaderboardPage + 1}/10]
                </span>
            </div>

            <div className="flex-1 w-full space-y-1 mt-1">
                {isLeaderboardLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-60">
                        <div className="animate-spin text-xl">⏳</div>
                        <div className="text-[10px]">資料同步中...</div>
                    </div>
                ) : (
                    leaderboard.slice(leaderboardPage * 5, (leaderboardPage * 5) + 5).map((item, idx) => (
                        <div key={item.id} className="bg-[#8fa07e]/30 border-2 border-[#1a1a1a]/20 p-1 flex items-center gap-2 h-[42px] relative overflow-hidden">
                            <div className="w-6 text-[12px] font-black italic opacity-40">
                                #{(leaderboardPage * 5) + idx + 1}
                            </div>
                            <div className="w-10 h-10 flex items-center justify-center bg-[#1a1a1a]/5 border border-[#1a1a1a]/20 shrink-0">
                                <DitheredSprite id={item.monsterId || 132} scale={0.85} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] truncate leading-none mb-0.5">{item.displayName}</div>
                                <div className="flex gap-2 text-[8px] opacity-70">
                                    <span>W:{item.wins}</span>
                                    <span>L:{item.losses}</span>
                                    <span>{((item.winRate || 0) * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {!isLeaderboardLoading && leaderboard.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-[10px] opacity-40">
                        尚無紀錄...
                    </div>
                )}
            </div>

            <div className="w-full border-t border-[#1a1a1a]/20 pt-1 mt-1 flex justify-between items-center text-[8px] font-black opacity-80">
                <span className="animate-pulse">▶ A: 下一頁</span>
                <span>● C: 退出</span>
            </div>
        </div>
    );
}

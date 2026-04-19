import React from 'react';
import { DitheredSprite, DitheredBackSprite } from './SpriteRenderer';

export default function BattleAdventureOverlay({
    isAdvMode,
    isPvpMode,
    isTournamentOpen,
    battleState,
    matchStatus,
    advCD,
    advStats,
    myPeerId,
    pvpRoomPassword,
    setPvpRoomPassword,
    fetchLeaderboard,
    joinPvpRoom,
    startTournament,
    advLogRef,
    advLog,
    advCurrentHP,
    isAdvStreaming,
    pendingWildCapture
}) {
    // 嚴格檢查：如果是大賽模式且戰鬥未開始，或者是其他模式未開啟，就隱藏 (避免洩漏大廳/冒險介面)
    // 但如果玩家主動開啟了冒險或 PvP 模式，則不應該被大賽的殘留狀態阻擋
    if (!isAdvMode && !isPvpMode) {
        if (battleState.mode === 'tournament' && !battleState.active) return null;
        if (battleState.mode !== 'tournament' || !isTournamentOpen) return null;
    }

    return (
        <div className="absolute inset-0 z-[110] flex flex-col items-center justify-start p-1" style={{ 
            backgroundImage: 'url("assets/BG/共用底圖.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
            <div className="absolute inset-0 bg-blue-900/40 z-0"></div>

            <div className="w-full bg-[#383a37]/50 text-white [text-shadow:0_0_4px_#fff] text-[10px] px-2 py-1 flex justify-between items-center mb-1 relative z-10 shadow-sm">
                <span>{battleState.mode === 'tournament' ? '聯盟大賽' : (isPvpMode ? '宇宙連線對戰' : '冒險模式')} {battleState.active ? (battleState.mode === 'wild' ? '[掃蕩中]' : '[戰鬥中]') : ''}</span>
                <span>{isPvpMode || battleState.mode === 'tournament' ? (matchStatus === 'searching' ? '搜尋中...' : '對決中') : (advCD > 0 && !battleState.active ? `冷卻中 ${Math.floor(advCD / 60)}:${(advCD % 60).toString().padStart(2, '0')}` : '準備就緒')}</span>
            </div>

            {battleState.active ? (
                <div className="flex-1 w-full relative pb-1 z-10">
                    {/* Enemy Area */}
                    <div className="absolute top-2 left-2 flex flex-col items-start min-w-[100px] z-20 bg-white/10 border-2 border-white/20 rounded-md p-1 pl-2 shadow-sm backdrop-blur-[2px]">
                        <div className="flex items-center gap-1">
                            <div className="text-[10px] font-bold text-white truncate w-[60px] leading-tight">{battleState?.enemy?.name}</div>
                            {battleState?.enemy?.status && (
                                <span className={`text-[8px] px-1 rounded-sm border border-black/20 font-black ${battleState.enemy.status === 'burn' ? 'bg-[#ff5252] text-white' :
                                        battleState.enemy.status === 'paralysis' ? 'bg-[#ffca28] text-black' :
                                            battleState.enemy.status === 'poison' ? 'bg-[#9c27b0] text-white' :
                                                battleState.enemy.status === 'sleep' ? 'bg-[#90a4ae] text-white' :
                                                    battleState.enemy.status === 'freeze' ? 'bg-[#80deea] text-black' : 'bg-gray-400'
                                    }`}>
                                    {{ burn: '燒', paralysis: '麻', poison: '毒', sleep: '眠', freeze: '凍', confusion: '混' }[battleState.enemy.status] || '狀'}
                                </span>
                            )}
                        </div>
                        <div className="w-20 h-2 bg-[#383a37] border border-[#1a1a1a] rounded-sm overflow-hidden mt-1 shadow-inner">
                            <div className="h-full transition-all duration-300" style={{ width: `${(battleState?.enemy?.hp / battleState?.enemy?.maxHp) * 100}%`, backgroundColor: (battleState?.enemy?.hp / battleState?.enemy?.maxHp) > 0.5 ? '#2ecc71' : (battleState?.enemy?.hp / battleState?.enemy?.maxHp) > 0.25 ? '#f1c40f' : '#e74c3c' }} />
                        </div>
                    </div>
                    <div className={`absolute -top-16 right-0 z-10 transform scale-[1.1] ${battleState.flashTarget === 'enemy' ? 'damage-flash' : ''}`}>
                        <DitheredSprite id={battleState?.enemy?.id} scale={2} />
                    </div>

                    {/* Player Area */}
                    <div className={`absolute bottom-1 -left-2 z-10 transform scale-[1.4] origin-bottom px-2 ${battleState.flashTarget === 'player' ? 'damage-flash' : ''}`}>
                        <DitheredBackSprite id={battleState?.player?.id} scale={2} />
                    </div>
                    <div className="absolute bottom-16 right-2 flex flex-col items-end min-w-[100px] z-20 bg-white/10 border-2 border-white/20 rounded-md p-1 pr-2 shadow-sm backdrop-blur-[2px]">
                        <div className="flex items-center gap-1">
                            {battleState?.player?.status && (
                                <span className={`text-[8px] px-1 rounded-sm border border-black/20 font-black ${battleState.player.status === 'burn' ? 'bg-[#ff5252] text-white' :
                                        battleState.player.status === 'paralysis' ? 'bg-[#ffca28] text-black' :
                                            battleState.player.status === 'poison' ? 'bg-[#9c27b0] text-white' :
                                                battleState.player.status === 'sleep' ? 'bg-[#90a4ae] text-white' :
                                                    battleState.player.status === 'freeze' ? 'bg-[#80deea] text-black' : 'bg-gray-400'
                                    }`}>
                                    {{ burn: '燒', paralysis: '麻', poison: '毒', sleep: '眠', freeze: '凍', confusion: '混' }[battleState.player.status] || '狀'}
                                </span>
                            )}
                            <div className="text-[10px] font-bold text-white text-right truncate">Lv.{Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1))}</div>
                        </div>
                        <div className="w-20 h-2 bg-[#383a37] border border-[#1a1a1a] rounded-sm overflow-hidden mt-1 shadow-inner">
                            <div className="h-full transition-all duration-300" style={{ width: `${((battleState?.player?.hp || 0) / (battleState?.player?.maxHp || 1)) * 100}%`, backgroundColor: ((battleState?.player?.hp || 0) / (battleState?.player?.maxHp || 1)) > 0.5 ? '#2ecc71' : ((battleState?.player?.hp || 0) / (battleState?.player?.maxHp || 1)) > 0.25 ? '#f1c40f' : '#e74c3c' }} />
                        </div>
                    </div>

                    {/* 戰鬥播報對話框 (Transient Overlay) */}
                    {(battleState?.phase === 'action_streaming' || battleState?.phase === 'waiting_opponent') && battleState?.activeMsg && (
                        <div className="absolute w-[68%] left-[16%] top-[40%] bg-white/20 border-[3px] border-white/30 p-1.5 z-[150] shadow-[4px_4px_0_rgba(0,0,0,0.3)] backdrop-blur-md">
                            <div className="text-[9px] font-black text-white leading-tight break-words text-center">
                                {battleState?.activeMsg}
                            </div>
                        </div>
                    )}

                    {/* Dialogue Box & Menu Area */}
                    <div className="absolute bottom-1 left-1 right-1 h-[55px] bg-white/10 border-[3px] border-white/20 rounded-sm p-1 flex flex-col shadow-inner z-30 backdrop-blur-[1px]">
                        {(battleState.mode === 'trainer' || battleState.mode === 'pvp' || battleState.mode === 'tournament') && battleState.phase === 'player_action' ? (
                            <div className="grid grid-cols-2 gap-1 h-full font-bold text-[10px] text-white">
                                {[0, 1, 2, 3].map((idx) => {
                                    const move = battleState.player?.moves?.[idx];
                                    const isSelected = (battleState.menuIdx || 0) === idx;
                                    return (
                                        <div
                                            key={idx}
                                            className={`border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? 'border-[#1a1a1a] bg-[#383a37] text-[#8fa07e] invert-0'
                                                    : 'border-[#1a1a1a] bg-[#ccd6be]/20'
                                                } ${!move ? 'opacity-30 border-dashed' : ''}`}
                                        >
                                            {move ? move.name : '---'}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="w-full h-full overflow-hidden text-[10px] leading-tight font-bold text-white px-1 flex flex-col justify-end">
                                {(battleState?.logs?.length || 0) > 0 ? (
                                    <div className="animate-fade-in">{battleState.logs[battleState.logs.length - 1]}</div>
                                ) : <div>...</div>}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    {isPvpMode ? (
                        (matchStatus === 'searching' || matchStatus === 'idle') ? (
                            <div className="flex-1 flex flex-col items-center justify-start p-2 w-full relative z-10">
                                <div className="text-[11px] font-black text-white mb-1 border-b-2 border-white/30 w-full text-center pb-0.5 uppercase tracking-widest [text-shadow:0_0_4px_#fff]">宇宙大廳</div>

                                <div className="w-full flex flex-col gap-1 mb-2 mt-1">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[8px] font-black text-white/80">🚪 房間密碼</span>
                                        <span className={`text-[8px] font-bold underline transition-all ${matchStatus === 'searching' ? 'text-[#ff5252] animate-pulse' : 'text-[#383a37] opacity-70'}`}>
                                            狀況: {matchStatus === 'searching' ? '🏃 配對中...' : (myPeerId ? '已上線' : '準備中')}
                                        </span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="1~6 位房號..."
                                        value={pvpRoomPassword}
                                        maxLength={6}
                                        disabled={matchStatus === 'searching'}
                                        onChange={e => setPvpRoomPassword(e.target.value)}
                                        className={`w-full border-2 border-[#1a1a1a] p-1.5 text-[11px] outline-none font-mono text-center tracking-[0.2em] font-black placeholder:tracking-normal ${matchStatus === 'searching' ? 'bg-gray-200 opacity-50' : 'bg-[#ccd6be]'}`}
                                    />
                                </div>

                                <div className="w-full grid grid-cols-1 gap-2">
                                    <button
                                        onClick={fetchLeaderboard}
                                        disabled={matchStatus === 'searching'}
                                        className={`w-full py-1.5 border-2 border-[#1a1a1a] text-[10px] font-black transition-all ${matchStatus === 'searching' ? 'bg-gray-400 text-gray-700 opacity-50 cursor-not-allowed' : 'bg-[#8e44ad] text-white shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none mb-1'}`}
                                    >
                                        👑 全球排行榜
                                    </button>
                                    <button
                                        onClick={() => (matchStatus !== 'searching') && joinPvpRoom(pvpRoomPassword)}
                                        disabled={matchStatus === 'searching'}
                                        className={`w-full py-1.5 border-2 border-[#1a1a1a] text-[10px] font-black transition-all ${matchStatus === 'searching' ? 'bg-gray-400 text-gray-700 opacity-50 cursor-not-allowed' : 'bg-[#ff5252] text-white shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}
                                    >
                                        {matchStatus === 'searching' ? '等待對手連線...' : '進入房間'}
                                    </button>

                                    <div className="flex items-center gap-2 w-full">
                                        <div className="h-[1px] bg-[#1a1a1a]/30 flex-1"></div>
                                        <span className="text-[8px] font-bold opacity-50">OR</span>
                                        <div className="h-[1px] bg-[#1a1a1a]/30 flex-1"></div>
                                    </div>

                                    <button
                                        onClick={() => (matchStatus !== 'searching') && startTournament()}
                                        disabled={matchStatus === 'searching'}
                                        className={`w-full py-1.5 border-2 border-[#1a1a1a] text-[10px] font-black transition-all ${matchStatus === 'searching' ? 'bg-gray-400 text-gray-700 opacity-50 cursor-not-allowed' : 'bg-[#ffca28] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}
                                    >
                                        🏆 聯盟大賽
                                    </button>
                                </div>

                                <div className="mt-auto text-[8px] font-black text-white opacity-60 flex flex-col items-center gap-0.5">
                                    <span>相同密碼即可連線</span>
                                    <div className="flex gap-2 text-white/70 underline decoration-dotted">
                                        <span>[C] 取消</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-2 w-full">
                                <div className="text-[12px] font-bold animate-pulse">連線建立中...</div>
                            </div>
                        )
                    ) : (
                        <>
                            <div
                                ref={advLogRef}
                                className="flex-1 w-full bg-white/10 border-2 border-white/20 p-2 flex flex-col gap-1 overflow-y-auto relative z-10"
                            >
                                {advLog.length > 0 ? advLog.map((l, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 mb-8 border-b border-[#383a37]/20 pb-5 last:border-0 last:mb-0 relative animate-fade-in">
                                        {l.iconId && (
                                            <div className="scale-[1.0] w-18 h-18 flex items-center justify-center -mb-2">
                                                <DitheredSprite id={l.iconId} scale={2} />
                                            </div>
                                        )}
                                        <div className="text-[12px] font-bold text-white leading-tight text-center px-1">
                                            {l.msg}
                                        </div>
                                        {isAdvStreaming && i === advLog.length - 1 && (
                                            <div className="absolute bottom-0 right-1 text-[10px] font-black animate-bounce flex items-center gap-1 z-50">
                                                <span className="text-[#ff5252]">▼</span>
                                                <span className="bg-[#ffca28] text-[#1a1a1a] px-1 rounded-sm border border-[#1a1a1a] scale-90">B</span>
                                            </div>
                                        )}
                                    </div>
                                )) : <div className="text-center mt-10 animate-pulse text-[12px] font-bold">探索中...</div>}
                            </div>

                            {/* HP 血條區域 */}
                            <div className="w-full flex flex-col gap-1 mt-1">
                                <div className="flex justify-between items-center px-1 relative z-10">
                                    <span className="text-[10px] font-bold text-white">血量: {Math.floor(advCurrentHP * 100)}%</span>
                                    <span className="text-[10px] font-bold text-white">
                                        {isAdvStreaming ? "[B] 繼續" : "[C] 固定路線中"}
                                    </span>
                                </div>
                                <div className="w-full h-2.5 bg-[#383a37] border border-[#1a1a1a] rounded-sm overflow-hidden">
                                    <div
                                        className="h-full transition-all duration-300 ease-out"
                                        style={{
                                            width: `${advCurrentHP * 100}%`,
                                            backgroundColor: advCurrentHP > 0.5 ? '#2ecc71' : advCurrentHP > 0.25 ? '#f1c40f' : '#e74c3c'
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* 捕獲確認對話框 (A/B選單模式) */}
            {pendingWildCapture && !isAdvStreaming && (
                <div className="absolute inset-0 z-[130] flex flex-col items-center justify-center p-4 bg-black/60 backdrop-blur-[2px]">
                    <div className="w-[180px] bg-white/20 border-4 border-white/30 p-3 shadow-[8px_8px_0_rgba(0,0,0,0.3)] flex flex-col items-center gap-3">
                        <div className="scale-[1.2] -mb-1">
                            <DitheredSprite id={pendingWildCapture.id} scale={2} />
                        </div>
                        <div className="text-white text-[11px] font-black text-center leading-relaxed">
                            ✨ 野生 {pendingWildCapture.name} <br /> 加入了您！<br />是否要更換寵物？
                        </div>
                        <div className="flex w-full gap-3 justify-center">
                            <div className="flex flex-col items-center gap-1">
                                <div className="px-2 py-0.5 bg-[#ffca28] text-[#111] border-2 border-[#1a1a1a] font-black text-[9px]">A: NO</div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="px-2 py-0.5 bg-[#ff5252] text-white border-2 border-[#1a1a1a] font-black text-[9px]">B: YES</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useState, useRef, useEffect } from 'react';
import { Peer } from 'peerjs';
import { PEER_PREFIX } from './envConfig';

export const usePvpConnection = (deps) => {
    const {
        updateDialogue,
        setBattleState,
        battleState,
        getMonsterId,
        executeBattleTurn,
        generateMyBattleStats,
        setAlertMsg,
        playBloop,
        user,
        generateBattleState,
        setAdvStats,
        logEvent,
        updatePvpStats
    } = deps;

    // --- PvP 系統專屬狀態 (WebRTC/PeerJS) ---
    const [isPvpMode, setIsPvpMode] = useState(false);
    const [matchStatus, setMatchStatus] = useState('idle');
    const matchStatusRef = useRef('idle');
    const syncMatchStatus = (status) => {
        setMatchStatus(status);
        matchStatusRef.current = status;
    };

    const [myPeerId, setMyPeerId] = useState("");
    const [targetPeerId, setTargetPeerId] = useState("");
    const [pvpRoomPassword, setPvpRoomPassword] = useState("");
    const peerInstance = useRef(null);
    const connInstance = useRef(null);
    const isHost = useRef(false);

    const [pvpOpponent, setPvpOpponent] = useState(null);
    const [pvpLog, setPvpLog] = useState([]);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [pvpCurrentHP, setPvpCurrentHP] = useState(1);
    const [pvpOpponentHP, setPvpOpponentHP] = useState(1);
    const [pendingPlayerMove, setPendingPlayerMove] = useState(null);

    // 🔹 同步與回合同步 (Battle Sync & Turn Control)
    const battleStateRef = useRef(null);
    useEffect(() => {
        battleStateRef.current = battleState;
    }, [battleState]);
    const pvpRemoteMoveRef = useRef(null);

    // =========================================
    // PeerJS 核心連線邏輯 & 穩定性強化
    // =========================================

    // 對戰結束後的統一結算邏輯
    const handleBattleEnd = (isWin) => {
        // 🛑 核心修正：移除 PvP 戰力獲取，防止玩家刷等級
        const bpGain = 0; 
        const msg = isWin ? `對戰勝利！` : `對戰結束！`;
        const logMsg = isWin 
            ? `在一場精彩的連線對決中獲得了勝利。` 
            : `完成了一場連線對決。`;

        // 1. 更新戰力 (已停用)
        if (bpGain > 0 && setAdvStats) {
            setAdvStats(prev => ({
                ...prev,
                basePower: prev.basePower + bpGain
            }));
        }

        // 2. 清理連線
        if (connInstance.current) {
            try { connInstance.current.close(); } catch (e) { }
            connInstance.current = null;
        }
        pvpRemoteMoveRef.current = null;
        setPendingPlayerMove(null);

        // 3. 重置模式與狀態
        setIsPvpMode(false);
        syncMatchStatus('idle');
        setBattleState(prev => ({ ...prev, active: false }));

        // 4. 回饋與日誌
        if (updateDialogue) updateDialogue(msg);
        if (logEvent) logEvent(logMsg);
        if (playBloop) playBloop(isWin ? 'success' : 'fail');

        // 5. 更新排行榜 (如果有登入)
        if (user && updatePvpStats) {
            updatePvpStats(isWin);
        }
    };

    // 統一重置 PvP 狀態與連線 (用於取消或錯誤時)
    const cleanupPvp = (msg = null, destroyPeer = true) => {
        if (msg) updateDialogue(msg);

        // 斷開連線實例
        if (connInstance.current) {
            try { connInstance.current.close(); } catch (e) { }
            connInstance.current = null;
        }

        // 徹底銷毀 Peer 實例 (非常重要：能讓伺服器立即釋放 ID，防止殭屍 Peer)
        if (destroyPeer && peerInstance.current) {
            try {
                if (!peerInstance.current.destroyed) peerInstance.current.destroy();
            } catch (e) { }
            peerInstance.current = null;
            setMyPeerId("");
        }

        // 重置狀態與對戰資訊
        setIsPvpMode(false);
        syncMatchStatus('idle');
        setBattleState(prev => (prev.mode === 'pvp' && prev.active) ? { ...prev, active: false, phase: 'end' } : { ...prev, active: false });
        setPendingPlayerMove(null);
        pvpRemoteMoveRef.current = null;

        // 對手資訊清空
        setPvpOpponent(null);
    };

    // 處理與對手之間的數據收發
    const setupConnectionHandlers = (conn) => {
        conn.on('open', () => {
            // 連線開啟後，主機端發送初始資訊
            // 客戶端也會發送它的初始資訊
            const { pMaxHP, pATK, pDEF, pSPD, pType, pMoves, myId, pLevel } = generateMyBattleStats();
            conn.send({
                type: 'INIT',
                data: {
                    id: myId,
                    name: deps.user?.displayName || "網路玩家",
                    stats: { hp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, level: pLevel },
                    type: pType,
                    moves: pMoves
                }
            });
        });

        conn.on('data', (payload) => {
            if (payload.type === 'INIT') {
                const bState = deps.generateBattleState('pvp', getMonsterId(), payload.data);
                setBattleState(bState);
                syncMatchStatus('matched');
                playBloop('success');
            } else if (payload.type === 'ACTION') {
                // 🛑 回合驗證：僅忽略舊回合封包，允許當前或超前封包（用於緩衝）
                const currentTurn = battleStateRef.current?.turn || 1;
                if (payload.data.turnId !== undefined && payload.data.turnId < currentTurn) {
                    console.log(`[PVP] 忽略舊回合封包: 收到 ${payload.data.turnId}, 當前 ${currentTurn}`);
                    return;
                }

                pvpRemoteMoveRef.current = payload.data.move;
                setPendingPlayerMove(prevMove => {
                    if (prevMove) {
                        const myMove = prevMove;
                        // ⏱️ 沉默緩衝 5 秒：當雙方都確認後，延遲 5 秒結算以確保同步
                        setTimeout(() => executeBattleTurn('attack', myMove, pvpRemoteMoveRef.current), 5000);
                        return null;
                    }
                    return prevMove;
                });
            } else if (payload.type === 'RESULT') {
                // 客戶端接收主機端算好的結果，直接套用
                setBattleState(prev => {
                    if (!prev || !prev.active) return prev;
                    const { 
                        stepQueue, 
                        playerHpAfter, enemyHpAfter, 
                        playerHpBefore, enemyHpBefore,
                        playerStatStagesAfter, enemyStatStagesAfter,
                        turnId 
                    } = payload.data;
                    
                    // 防呆：如果回合序號對不上，可能發生了嚴重的延遲或封包遺失
                    if (turnId !== undefined && turnId !== prev.turn) {
                        console.warn(`[PVP] 回合序號不符！本地 ${prev.turn} vs 收到 ${turnId}`);
                    }

                    if (!stepQueue || stepQueue.length === 0) return prev;
                    const first = stepQueue[0];
                    
                    return {
                        ...prev,
                        phase: 'action_streaming',
                        stepQueue: stepQueue.slice(1),
                        activeMsg: first.text || "",
                        lastStep: first,
                        flashTarget: null,
                        // 修正：在播放動畫前，先將 HP 基準線與能力階級與主機對齊，防止動畫過程出現跳號或計算不一
                        player: { 
                            ...prev.player, 
                            hp: playerHpBefore !== undefined ? playerHpBefore : prev.player.hp,
                            statStages: playerStatStagesAfter || prev.player.statStages 
                        },
                        enemy: { 
                            ...prev.enemy, 
                            hp: enemyHpBefore !== undefined ? enemyHpBefore : prev.enemy.hp,
                            statStages: enemyStatStagesAfter || prev.enemy.statStages
                        },
                        playerHpAfter: playerHpAfter !== undefined ? playerHpAfter : prev.player.hp,
                        enemyHpAfter: enemyHpAfter !== undefined ? enemyHpAfter : prev.enemy.hp,
                        // 播報期間維持當前回合 ID
                        turn: turnId !== undefined ? turnId : prev.turn
                    };
                });
            }
        });

        conn.on('close', () => {
            // 只在對戰中或搜尋中才顯示斷線提示
            if (matchStatusRef.current !== 'idle') {
                updateDialogue("對手斷線。");
                setIsPvpMode(false);
                syncMatchStatus('idle');
                setBattleState(prev => ({ ...prev, active: false }));
            }
            connInstance.current = null;
        });
    };

    // 當觸發尋找連線時 (按下準備好的確認鍵)
    const connectToRemotePeer = (targetId) => {
        if (!peerInstance.current) return;
        syncMatchStatus('matching');
        updateDialogue("發現對手，正在建立通訊...", true);
        const conn = peerInstance.current.connect(targetId);
        connInstance.current = conn;
        isHost.current = false; // Challenger (B) is NOT the host
        setupConnectionHandlers(conn);
    };

    // 初始化 Peer (支援自訂 ID 或自動 ID)
    const initPeer = (customId = null, role = null) => {
        // 如果已經有舊的 Peer，先徹底銷毀
        if (peerInstance.current && !peerInstance.current.destroyed) {
            try { peerInstance.current.destroy(); } catch (e) { }
        }

        // 設定 15 秒連線超時警告
        // 房主 (A) 成功到 open 後就不再倒數，避免痴痴等待時被踢出
        // 挑戰者 (B) 則保留完整的配對超時機制
        const connectionTimeout = setTimeout(() => {
            if (matchStatusRef.current === 'searching' || matchStatusRef.current === 'matching') {
                cleanupPvp("連線超時，請檢查密碼或請對方重新開啟。");
            }
        }, 15000);

        const peer = customId ? new Peer(customId) : new Peer();

        peer.on('open', (id) => {
            setMyPeerId(id);
            // 如果我們是房主 (開房的人，role 不是 B)，已成功連上信號伺服器，可以無限期等待挑戰者
            if (role !== 'B') {
                clearTimeout(connectionTimeout);
                updateDialogue(`房間建立完成！\n等待對手輸入密碼 ${pvpRoomPassword} ...`, true);
            }
            
            // 如果我是挑戰者 (B)，開啟後立即連向 A
            if (role === 'B') {
                const targetId = customId.replace(/_B$/, '_A');
                setTimeout(() => connectToRemotePeer(targetId), 500);
            }
        });

        // 監聽 Peer 全域錯誤
        peer.on('error', (err) => {
            clearTimeout(connectionTimeout);

            // 房間佔用邏輯：如果 A 位置有人，嘗試進入 B 位置
            if (err.type === 'unavailable-id' && customId && customId.endsWith('_A')) {
                // 這是正常配對流程 (發現對方已經開房，由我們轉作 B 端)，因此不紀錄錯誤警告
                initPeer(customId.replace(/_A$/, '_B'), 'B');
                return;
            }

            console.error("PeerJS Error:", err);

            let errMsg = "通訊伺服器錯誤。";
            if (err.type === 'unavailable-id') {
                if (customId && customId.endsWith('_B')) {
                    errMsg = "該密碼房間目前已客滿 (已有 2 名玩家)，請更換密碼。";
                } else {
                    errMsg = "房間識別碼衝突，請稍後再試。";
                }
            }
            if (err.type === 'network') errMsg = "網路連線中斷。";
            if (err.type === 'peer-unavailable') errMsg = "找不到對手房號，請確認對方已開好房間。";

            cleanupPvp(errMsg);
            peerInstance.current = null;
        });

        peer.on('connection', (conn) => {
            clearTimeout(connectionTimeout);
            if (connInstance.current) {
                conn.close();
                return;
            }
            connInstance.current = conn;
            isHost.current = true; // Room creator (A) IS the host
            setupConnectionHandlers(conn);
        });

        peerInstance.current = peer;
    };

    // 加入/建立 密碼房間
    const joinPvpRoom = (pwd) => {
        if (!pwd || pwd.trim() === "") {
            setAlertMsg("請輸入房間密碼");
            playBloop('fail');
            return;
        }
        const safePwd = pwd.trim().replace(/[^a-zA-Z0-9]/g, '');
        const hostId = PEER_PREFIX + safePwd + "_A";
        syncMatchStatus('searching');
        updateDialogue("正在進入房間節點...", true);
        initPeer(hostId);
    };



    // 視窗關閉或組件卸載時，確實銷毀連線
    useEffect(() => {
        const handleUnload = () => {
            if (peerInstance.current) peerInstance.current.destroy();
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            if (peerInstance.current) {
                console.log("[PVP] Component unmounting, destroying peer...");
                peerInstance.current.destroy();
            }
        };
    }, []);

    return {
        // --- Properties ---
        isPvpMode,
        matchStatus,
        matchStatusRef,
        myPeerId,
        targetPeerId,
        pvpRoomPassword,
        pvpOpponent,
        pvpLog,
        isMyTurn,
        pvpCurrentHP,
        pvpOpponentHP,
        pendingPlayerMove,
        
        // --- Methods / Setters ---
        setIsPvpMode,
        setMatchStatus,
        syncMatchStatus,
        setMyPeerId,
        setTargetPeerId,
        setPvpRoomPassword,
        setPvpOpponent,
        setPvpLog,
        setIsMyTurn,
        setPvpCurrentHP,
        setPvpOpponentHP,
        setPendingPlayerMove,
        cleanupPvp,
        initPeer,
        joinPvpRoom,
        handleBattleEnd,

        // --- Raw Refs ---
        peerInstance,
        connInstance,
        isHost,
        pvpRemoteMoveRef
    };
};

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
        updatePvpStats,
        monsterTraits
    } = deps;

    // --- PvP 蝟餌絞撠惇???(WebRTC/PeerJS) ---
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

    // ? ?郊????甇?(Battle Sync & Turn Control)
    const battleStateRef = useRef(null);
    useEffect(() => {
        battleStateRef.current = battleState;
    }, [battleState]);
    const pvpRemoteMoveRef = useRef(null);

    // =========================================
    // PeerJS ?詨?????摩 & 蝛拙??批撥??
    // =========================================

    // PvP battle end cleanup
    const handleBattleEnd = (isWin) => {
        const bpGain = 0;
        const msg = isWin ? 'Battle won.' : 'Battle lost.';
        const logMsg = isWin ? 'PvP battle won.' : 'PvP battle lost.';

        if (bpGain > 0 && setAdvStats) {
            setAdvStats(prev => ({
                ...prev,
                basePower: prev.basePower + bpGain
            }));
        }

        if (connInstance.current) {
            try { connInstance.current.close(); } catch (e) { }
            connInstance.current = null;
        }
        pvpRemoteMoveRef.current = null;
        setPendingPlayerMove(null);

        setIsPvpMode(false);
        syncMatchStatus('idle');
        setBattleState(prev => ({ ...prev, active: false }));

        if (updateDialogue) updateDialogue(msg);
        if (logEvent) logEvent(logMsg);
        if (playBloop) playBloop(isWin ? 'success' : 'fail');

        if (user && updatePvpStats) {
            updatePvpStats(isWin);
        }
    };

    // 蝯曹??蔭 PvP ?????? (?冽???隤斗?)
    const cleanupPvp = (msg = null, destroyPeer = true) => {
        if (msg) updateDialogue(msg);

        // ?琿????撖虫?
        if (connInstance.current) {
            try { connInstance.current.close(); } catch (e) { }
            connInstance.current = null;
        }

        // 敺孵??瑟? Peer 撖虫? (?虜??嚗霈撩?蝡? ID嚗甇Ｘ悌撅?Peer)
        if (destroyPeer && peerInstance.current) {
            try {
                if (!peerInstance.current.destroyed) peerInstance.current.destroy();
            } catch (e) { }
            peerInstance.current = null;
            setMyPeerId("");
        }

        // ?蔭???撠鞈?
        setIsPvpMode(false);
        syncMatchStatus('idle');
        setBattleState(prev => (prev.mode === 'pvp' && prev.active) ? { ...prev, active: false, phase: 'end' } : { ...prev, active: false });
        setPendingPlayerMove(null);
        pvpRemoteMoveRef.current = null;

        // 撠?鞈?皜征
        setPvpOpponent(null);
    };

    // ?????????豢??嗥
    const setupConnectionHandlers = (conn) => {
        conn.on('open', () => {
            const { pMaxHP, pATK, pDEF, pSPD, pType, pMoves, myId, pLevel } = generateMyBattleStats();
            conn.send({
                type: 'INIT',
                data: {
                    id: myId,
                    name: deps.user?.displayName || "玩家",
                    stats: { hp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, level: pLevel },
                    type: pType,
                    moves: pMoves,
                    moveUpgrades: deps.advStats?.moveUpgrades || {},
                    trait: monsterTraits?.trait || null
                }
            });
        });

        conn.on('data', (payload) => {
            if (payload.type === 'INIT') {
                setPvpOpponent(payload.data);
                const bState = deps.generateBattleState('pvp', getMonsterId(), payload.data);
                setBattleState(bState);
                syncMatchStatus('matched');
                playBloop('success');
            } else if (payload.type === 'ACTION') {
                const currentTurn = battleStateRef.current?.turn || 1;
                if (payload.data.turnId !== undefined && payload.data.turnId !== currentTurn) {
                    console.log(`[PVP] 忽略不同步回合 ${payload.data.turnId}, 目前 ${currentTurn}`);
                    return;
                }

                pvpRemoteMoveRef.current = payload.data.move;

                if (isHost.current) {
                    setPendingPlayerMove(prevMove => {
                        if (prevMove) {
                            executeBattleTurn('attack', prevMove, pvpRemoteMoveRef.current);
                            return null;
                        }
                        return prevMove;
                    });
                }
            } else if (payload.type === 'RESULT') {
                setPendingPlayerMove(null);
                pvpRemoteMoveRef.current = null;
                setBattleState(prev => {
                    if (!prev || !prev.active) return prev;
                    const {
                        stepQueue,
                        playerHpAfter, enemyHpAfter,
                        playerShieldAfter, enemyShieldAfter,
                        playerHpBefore, enemyHpBefore,
                        playerShieldBefore, enemyShieldBefore,
                        playerStateAfter, enemyStateAfter,
                        traitUsage,
                        turnId
                    } = payload.data;

                    console.log(`[PVP] 收到結果封包 Turn: ${turnId}`, payload.data);

                    if (turnId !== undefined && prev.turn !== undefined && turnId < prev.turn) {
                        console.warn(`[PVP] 忽略過期回合 ${turnId}, 目前是 ${prev.turn}`);
                        return prev;
                    }

                    if (!stepQueue || stepQueue.length === 0) {
                        const nextTurn = (turnId !== undefined ? turnId : prev.turn) + 1;
                        return {
                            ...prev,
                            phase: prev.mode === 'wild' ? 'combat' : 'player_action',
                            stepQueue: [],
                            activeMsg: "",
                            lastStep: null,
                            flashTarget: null,
                            player: {
                                ...(playerStateAfter || prev.player),
                                hp: playerHpAfter !== undefined ? playerHpAfter : prev.player.hp,
                                shield: playerShieldAfter !== undefined ? playerShieldAfter : (prev.player.shield || 0),
                                moves: (playerStateAfter?.moves?.length > 0) ? playerStateAfter.moves : prev.player.moves,
                                protectLeft: playerStateAfter?.protectLeft !== undefined ? playerStateAfter.protectLeft : (prev.player.protectLeft || 0),
                                isProtected: false
                            },
                            enemy: {
                                ...(enemyStateAfter || prev.enemy),
                                hp: enemyHpAfter !== undefined ? enemyHpAfter : prev.enemy.hp,
                                shield: enemyShieldAfter !== undefined ? enemyShieldAfter : (prev.enemy.shield || 0),
                                moves: (enemyStateAfter?.moves?.length > 0) ? enemyStateAfter.moves : prev.enemy.moves,
                                protectLeft: enemyStateAfter?.protectLeft !== undefined ? enemyStateAfter.protectLeft : (prev.enemy.protectLeft || 0),
                                isProtected: false
                            },
                            playerHpAfter: playerHpAfter !== undefined ? playerHpAfter : prev.player.hp,
                            enemyHpAfter: enemyHpAfter !== undefined ? enemyHpAfter : prev.enemy.hp,
                            playerShieldAfter: playerShieldAfter !== undefined ? playerShieldAfter : (prev.player.shield || 0),
                            enemyShieldAfter: enemyShieldAfter !== undefined ? enemyShieldAfter : (prev.enemy.shield || 0),
                            playerFinalState: null,
                            enemyFinalState: null,
                            traitUsage: traitUsage || prev.traitUsage,
                            turn: nextTurn
                        };
                    }

                    const first = stepQueue[0];

                    return {
                        ...prev,
                        phase: 'action_streaming',
                        stepQueue: stepQueue.slice(1),
                        activeMsg: first.text || "",
                        lastStep: first,
                        flashTarget: null,
                        player: {
                            ...(playerStateAfter || prev.player),
                            hp: playerHpBefore !== undefined ? playerHpBefore : prev.player.hp,
                            shield: playerShieldBefore !== undefined ? playerShieldBefore : (prev.player.shield || 0),
                            moves: (playerStateAfter?.moves?.length > 0) ? playerStateAfter.moves : prev.player.moves,
                            protectLeft: playerStateAfter?.protectLeft !== undefined ? playerStateAfter.protectLeft : (prev.player.protectLeft || 0),
                            isProtected: false
                        },
                        enemy: {
                            ...(enemyStateAfter || prev.enemy),
                            hp: enemyHpBefore !== undefined ? enemyHpBefore : prev.enemy.hp,
                            shield: enemyShieldBefore !== undefined ? enemyShieldBefore : (prev.enemy.shield || 0),
                            moves: (enemyStateAfter?.moves?.length > 0) ? enemyStateAfter.moves : prev.enemy.moves,
                            protectLeft: enemyStateAfter?.protectLeft !== undefined ? enemyStateAfter.protectLeft : (prev.enemy.protectLeft || 0),
                            isProtected: false
                        },
                        playerHpAfter: playerHpAfter !== undefined ? playerHpAfter : prev.player.hp,
                        enemyHpAfter: enemyHpAfter !== undefined ? enemyHpAfter : prev.enemy.hp,
                        playerShieldAfter: playerShieldAfter !== undefined ? playerShieldAfter : (prev.player.shield || 0),
                        enemyShieldAfter: enemyShieldAfter !== undefined ? enemyShieldAfter : (prev.enemy.shield || 0),
                        playerFinalState: playerStateAfter || null,
                        enemyFinalState: enemyStateAfter || null,
                        traitUsage: traitUsage || prev.traitUsage,
                        turn: turnId !== undefined ? turnId : prev.turn
                    };
                });
            }
        });

        conn.on('close', () => {
            // ?芸撠銝剜???銝剜?憿舐內?瑞??內
            if (matchStatusRef.current !== 'idle') {
                updateDialogue("連線已中斷");
                setIsPvpMode(false);
                syncMatchStatus('idle');
                setBattleState(prev => ({ ...prev, active: false }));
            }
            connInstance.current = null;
        });
    };

    // ?嗉孛?澆??暸????(??皞?憟賜?蝣箄???
    const connectToRemotePeer = (targetId) => {
        if (!peerInstance.current) return;
        syncMatchStatus('matching');
        updateDialogue("Connecting to peer...", true);
        const conn = peerInstance.current.connect(targetId);
        connInstance.current = conn;
        isHost.current = false; // Challenger (B) is NOT the host
        setupConnectionHandlers(conn);
    };

    // ????Peer (?舀?芾? ID ???ID)
    const initPeer = (customId = null, role = null) => {
        // 憒?撌脩?????Peer嚗?敺孵??瑟?
        if (peerInstance.current && !peerInstance.current.destroyed) {
            try { peerInstance.current.destroy(); } catch (e) { }
        }

        // 閮剖? 15 蝘??頞?霅血?
        // ?蹂蜓 (A) ????open 敺停銝??嚗??渡?敺?鋡怨腺??
        // ???(B) ?????渡???頞?璈
        const connectionTimeout = setTimeout(() => {
            if (matchStatusRef.current === 'searching' || matchStatusRef.current === 'matching') {
                cleanupPvp("Peer connection timed out");
            }
        }, 15000);

        const peer = customId ? new Peer(customId) : new Peer();

        peer.on('open', (id) => {
            setMyPeerId(id);
            // 憒???蹂蜓 (??犖嚗ole 銝 B)嚗歇?????靽∟?隡箸??剁??臭誑?⊿???敺??啗?
            if (role !== 'B') {
                clearTimeout(connectionTimeout);
                updateDialogue(`Room created. Waiting for opponent password ${pvpRoomPassword} ...`, true);
            }

            // 憒?????(B)嚗???蝡??? A
            if (role === 'B') {
                const targetId = customId.replace(/_B$/, '_A');
                setTimeout(() => connectToRemotePeer(targetId), 500);
            }
        });

        // ?? Peer ?典??航炊
        peer.on('error', (err) => {
            clearTimeout(connectionTimeout);

            // ?輸?雿?摩嚗???A 雿蔭?犖嚗?閰阡脣 B 雿蔭
            if (err.type === 'unavailable-id' && customId && customId.endsWith('_A')) {
                // ?甇?虜??瘚? (?潛撠撌脩??嚗??雿?B 蝡?嚗?甇支?蝝?隤方郎??
                initPeer(customId.replace(/_A$/, '_B'), 'B');
                return;
            }

            console.error("PeerJS Error:", err);

            let errMsg = "PeerJS error";
            if (err.type === 'unavailable-id') {
                errMsg = (customId && customId.endsWith('_B')) ? "Peer B join timed out" : "Unable to create peer room";
            }
            if (err.type === 'network') errMsg = "Network error";
            if (err.type === 'peer-unavailable') errMsg = "Peer unavailable";

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

    // ?/撱箇? 撖Ⅳ?輸?
    const joinPvpRoom = (pwd) => {
        if (!pwd || pwd.trim() === "") {
            setAlertMsg("Please enter a room password");
            playBloop('fail');
            return;
        }
        const safePwd = pwd.trim().replace(/[^a-zA-Z0-9]/g, '');
        const hostId = PEER_PREFIX + safePwd + "_A";
        syncMatchStatus('searching');
            updateDialogue("Connecting to peer...", true);
        initPeer(hostId);
    };



    // 閬?????隞嗅頛?嚗Ⅱ撖阡瘥???
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



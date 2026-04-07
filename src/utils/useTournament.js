import { useState, useRef, useEffect } from 'react';
import { OBTAINABLE_MONSTER_IDS, SPECIES_BASE_STATS, generateMoves, calcFinalStat, MONSTER_NAMES } from '../../monsterData';

export function useTournament({ 
    user, 
    derivedLevel, 
    evolutionStage, 
    myMonsterId,
    advStats, 
    leaderboard,
    updateDialogue,
    battleState,
    setBattleState,
    setAdvStats,
    setInventory,
    playBloop,
    ADV_ITEMS // from gameConfig
}) {
    const [isTournamentOpen, setIsTournamentOpen] = useState(false);
    const [tPhase, setTPhase] = useState('idle'); // idle, intro, bracket, battle_intro, fighting, mvp, champion, rewards
    const [opponents, setOpponents] = useState([]);
    const [currentRound, setCurrentRound] = useState(1); // 1 = 16強, 2 = 8強, 3 = 4強, 4 = 決賽

    // Listen for battle conclusion
    useEffect(() => {
        if (tPhase === 'fighting' && !battleState?.active) {
            if (battleState?.player?.hp > 0 && battleState?.enemy?.hp <= 0) {
                handleTournamentWin();
            } else {
                handleTournamentLoss();
            }
        }
    }, [battleState?.active, tPhase]);
    
    // 生成這輪賽事的 15 名對手
    const generateOpponents = () => {
        const generated = [];
        const lbArray = Array.isArray(leaderboard) ? leaderboard : [];
        
        for (let i = 0; i < 15; i++) {
            // 從排行榜拉取前 N 名的資料如果可用
            const lbData = lbArray[i];
            
            let id, level, type, maxHp, atk, def, spd, moves, name, playerName;
            
            if (lbData && lbData.monsterId) {
                id = lbData.monsterId;
                playerName = lbData.displayName || "神秘訓練家";
                level = Math.max(1, Math.min(derivedLevel, derivedLevel - 2 + Math.floor(Math.random() * 5))); // 相近等級，不超過本人太多
            } else {
                id = OBTAINABLE_MONSTER_IDS[Math.floor(Math.random() * OBTAINABLE_MONSTER_IDS.length)];
                playerName = `AI訓練家${Math.floor(Math.random() * 900) + 100}`;
                level = Math.max(1, Math.min(derivedLevel, derivedLevel - 2 + Math.floor(Math.random() * 5))); 
            }

            const species = SPECIES_BASE_STATS[String(id)] || SPECIES_BASE_STATS['1'];
            name = MONSTER_NAMES?.[String(id)] || `怪獸#${id}`;
            type = species.types?.[0] || 'normal';
            
            // Generate standard enemy stats for the level
            const ivs = { hp: 15, atk: 15, def: 15, spd: 15 };
            const evs = { hp: 0, atk: 0, def: 0, spd: 0 };
            
            maxHp = calcFinalStat('hp', id, ivs.hp, evs.hp, level);
            atk = calcFinalStat('atk', id, ivs.atk, evs.atk, level);
            def = calcFinalStat('def', id, ivs.def, evs.def, level);
            spd = calcFinalStat('spd', id, ivs.spd, evs.spd, level);
            moves = generateMoves(id, level);

            generated.push({
                idx: i,
                playerName,
                monster: {
                    id: String(id),
                    name,
                    level,
                    type,
                    hp: maxHp,
                    maxHp,
                    atk,
                    def,
                    spd,
                    moves,
                    status: null,
                    statStages: { atk: 0, def: 0, spd: 0, accuracy: 0 }
                }
            });
        }
        return generated;
    };

    const startTournament = () => {
        try {
            if (evolutionStage < 2) {
                updateDialogue("需要將寵物培育至 Stage 2 以上才能報名大賽！");
                playBloop('fail');
                window.alert("需要將寵物培育至 Stage 2 (幼年期 II) 以上才能報名大賽！\n如果是剛開始的新寵物，請先給予飼料與對戰進行升級！");
                return;
            }
            setIsTournamentOpen(true);
            setTPhase('intro');
            setOpponents(generateOpponents());
            setCurrentRound(1); // 16強起步
        } catch (err) {
            window.alert(`大賽引擎發生錯誤: ${err.message}`);
            console.error(err);
        }
    };

    const closeTournament = () => {
        setIsTournamentOpen(false);
        setTPhase('idle');
    };

    // 推進大賽階段
    const nextTournamentPhase = () => {
        if (tPhase === 'intro') {
            setTPhase('bracket');
        } else if (tPhase === 'bracket') {
            setTPhase('battle_intro');
        } else if (tPhase === 'battle_intro') {
            setTPhase('fighting');
            startTournamentBattle();
        } else if (tPhase === 'fighting') { // fighting 只是中繼，實際由戰鬥系統通知我們勝負
            // 此處不作用
        } else if (tPhase === 'mvp') {
            if (currentRound >= 4) {
                setTPhase('champion');
            } else {
                setCurrentRound(prev => prev + 1);
                setTPhase('bracket');
            }
        } else if (tPhase === 'champion') {
            setTPhase('rewards');
        } else if (tPhase === 'rewards') {
            giveChampionReward();
            closeTournament();
        }
    };

    const getPlayerStat = (key) => calcFinalStat(key, advStats.id || myMonsterId, advStats.ivs[key], advStats.evs[key], derivedLevel);

    const startTournamentBattle = () => {
        // 從對手名單裡面挑選目前的敵人 (16強 -> idx: 0, 8強 -> idx: 1, 4強 -> idx: 2, 決賽 -> idx: 3)
        const enemy = opponents[currentRound - 1]; 
        
        let playerHp = getPlayerStat('hp'); // 大賽皆從滿血開始

        const newBattleState = {
            active: true,
            mode: 'tournament',
            turn: 1,
            phase: 'intro',
            player: {
                id: advStats.id || myMonsterId,
                name: "您的怪獸",
                hp: playerHp,
                maxHp: playerHp,
                atk: getPlayerStat('atk'),
                def: getPlayerStat('def'),
                spd: getPlayerStat('spd'),
                level: derivedLevel,
                type: (SPECIES_BASE_STATS[String(advStats.id || myMonsterId)]?.types?.[0]) || 'normal',
                moves: advStats.moves.map(m => (typeof m === 'string' ? { id: m } : m)), // 需要根據 SKILL_DATABASE mapping，App.js戰鬥系統會處理？
                status: null,
                statStages: { atk: 0, def: 0, spd: 0, accuracy: 0 }
            },
            enemy: { ...enemy.monster }, // copy stats
            logs: [`【大會廣播】：當前戰鬥開始！`],
            stepQueue: [],
            isPlayerTurn: true,
            menuIdx: 0,
            activeMsg: "",
            flashTarget: null,
            tournamentEnemyInfo: enemy // 附加供UI使用
        };
        
        setBattleState(newBattleState);
    };

    const handleTournamentWin = () => {
        // 發放每場勝利的一般獎勵： +10 base power (戰力)
        setAdvStats(prev => ({
            ...prev,
            basePower: Math.min(9999, prev.basePower + 10)
        }));
        setTPhase('mvp');
        playBloop('success');
    };

    const handleTournamentLoss = () => {
        updateDialogue("很遺憾被淘汰了，再接再厲！");
        closeTournament();
        playBloop('fail');
    };

    const giveChampionReward = () => {
        // 給稀有度 5 的獎勵
        if (ADV_ITEMS) {
            const rareItems = ADV_ITEMS.filter(it => it.rarity >= 5);
            if (rareItems.length > 0) {
                const item = rareItems[Math.floor(Math.random() * rareItems.length)];
                setInventory(prev => {
                    const idx = prev.findIndex(it => it.id === item.id);
                    if (idx !== -1) {
                        const next = [...prev];
                        next[idx] = { ...next[idx], count: (next[idx].count || 1) + 1 };
                        return next;
                    }
                    if (prev.length >= 99) return prev;
                    return [...prev, { ...item, count: 1 }];
                });
                updateDialogue(`🎉 取得聯盟大賽冠軍！獲得了稀有獎品：${item.name}！戰力額外 +50！`);
            }
        }
        setAdvStats(prev => ({
            ...prev,
            basePower: Math.min(9999, prev.basePower + 50)
        }));
    };

    return {
        isTournamentOpen,
        tPhase,
        opponents,
        currentRound,
        startTournament,
        closeTournament,
        nextTournamentPhase,
        handleTournamentWin,
        handleTournamentLoss
    };
}

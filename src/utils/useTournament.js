import { useState, useRef, useEffect } from 'react';
import { OBTAINABLE_MONSTER_IDS, SPECIES_BASE_STATS, generateMoves, calcFinalStat, MONSTER_NAMES, SKILL_DATABASE, NATURE_CONFIG } from '../../monsterData';

// 🔹 訓練家擬人化名稱池
const TRAINER_NAMES_POOL = [
    "小智", "小茂", "小霞", "小剛", "阿弘", "奈奈", "阿龍", "阿渡", "大吾", "米可利",
    "竹蘭", "阿戴克", "艾莉絲", "卡露乃", "丹帝", "妮莫", "派帕", "牡丹", "青綠", "赤紅",
    "葉子", "小響", "小銀", "克麗絲", "小悠", "小遙", "小光", "透子", "透也", "鳴依",
    "共平", "莎莉娜", "卡勒姆", "美月", "朗日", "小勝", "小健", "馬志士", "莉佳", "娜姿",
    "夏伯", "坂木", "阿桔", "志米", "朵拉塞娜", "雁鎧", "芙蓉", "波妮", "源治"
];

export function useTournament({ 
    user, 
    derivedLevel, 
    evolutionStage, 
    myMonsterId,
    advStats, 
    soulTagCounts,
    leaderboard,
    updateDialogue,
    battleState,
    setBattleState,
    setAdvStats,
    setInventory,
    playBloop,
    ADV_ITEMS, // from gameConfig
    pendingSkillLearn
}) {
    const [isTournamentOpen, setIsTournamentOpen] = useState(false);
    const [tPhase, setTPhase] = useState('idle'); // idle, intro, bracket, battle_intro, fighting, mvp, champion, rewards
    const [bracket, setBracket] = useState([]); // 存儲當前輪次的選單 (16, 8, 4, 2)
    const [currentRound, setCurrentRound] = useState(1); // 1 = 16強, 2 = 8強, 3 = 4強, 4 = 決賽

    // Listen for battle conclusion
    useEffect(() => {
        if (tPhase === 'fighting' && !battleState?.active && !pendingSkillLearn) {
            if (battleState?.player?.hp > 0 && battleState?.enemy?.hp <= 0) {
                handleTournamentWin();
            } else if (battleState?.enemy?.hp > 0 && battleState?.player?.hp <= 0) {
                handleTournamentLoss();
            }
        }
    }, [battleState?.active, tPhase, battleState?.player?.hp, battleState?.enemy?.hp, pendingSkillLearn]);
    
    // 生成這輪賽事的初始 16 強名單 (玩家 + 15 名電腦)
    const generateInitialBracket = () => {
        const generated = [];
        // 🔹 玩家本人永遠位於索引 0
        generated.push({
            isPlayer: true,
            playerName: "您",
            monster: null // 戰鬥時動態抓取最新 state
        });

        const lbArray = Array.isArray(leaderboard) ? leaderboard.filter(p => p.id !== user?.uid) : [];
        
        let aiNames = [...TRAINER_NAMES_POOL].sort(() => Math.random() - 0.5);
        let aiNameIdx = 0;
        
        for (let i = 0; i < 15; i++) {
            const lbData = lbArray[i];
            let id, level, type, maxHp, atk, def, spd, moves, name, playerName;
            
            if (lbData && lbData.monsterId) {
                id = lbData.monsterId;
                playerName = lbData.displayName || "神秘訓練家";
                level = Math.max(1, Math.min(100, derivedLevel - 1 + Math.floor(Math.random() * 3))); 
            } else {
                id = OBTAINABLE_MONSTER_IDS[Math.floor(Math.random() * OBTAINABLE_MONSTER_IDS.length)];
                playerName = aiNames[aiNameIdx] || `訓練家 ${Math.floor(Math.random() * 900) + 100}`;
                aiNameIdx++;
                level = Math.max(1, Math.min(derivedLevel, derivedLevel - 2 + Math.floor(Math.random() * 5))); 
            }

            const species = SPECIES_BASE_STATS[String(id)] || SPECIES_BASE_STATS['1'];
            name = MONSTER_NAMES?.[String(id)] || `怪獸#${id}`;
            type = species.types?.[0] || 'normal';
            
            const ivs = { hp: 15, atk: 15, def: 15, spd: 15 };
            const evs = { hp: 0, atk: 0, def: 0, spd: 0 };
            
            maxHp = calcFinalStat('hp', id, ivs.hp, evs.hp, level);
            atk = calcFinalStat('atk', id, ivs.atk, evs.atk, level);
            def = calcFinalStat('def', id, ivs.def, evs.def, level);
            spd = calcFinalStat('spd', id, ivs.spd, evs.spd, level);
            moves = generateMoves(4, species.types);

            generated.push({
                isPlayer: false,
                idx: i + 1,
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
        console.log(`[Tournament] Initial bracket generated with ${lbArray.length} leaderboard players.`);
        return generated;
    };

    // 模擬 AI 分組之間的對戰結果，產生下一輪名單
    const advanceBracket = (currentBracket) => {
        const nextBracket = [];
        // 每兩個一組進行比賽
        for (let i = 0; i < currentBracket.length; i += 2) {
            const p1 = currentBracket[i];
            const p2 = currentBracket[i + 1];

            if (p1.isPlayer) {
                // 玩家分組由實際對戰決定，此時呼叫 advanceBracket 代表玩家已贏
                nextBracket.push(p1);
            } else if (p2 && p2.isPlayer) {
                 // 玩家在第二位 (理論上本系統玩家固定在 index 0，但做個防呆)
                nextBracket.push(p2);
            } else if (p1 && p2) {
                // AI vs AI: 根據等級決定勝率，等級高者優勢大
                const p1Power = p1.monster.level + Math.random() * 10;
                const p2Power = p2.monster.level + Math.random() * 10;
                nextBracket.push(p1Power >= p2Power ? p1 : p2);
            } else {
                // 單剩一人直接晉級
                nextBracket.push(p1);
            }
        }
        return nextBracket;
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
            const initial = generateInitialBracket();
            setBracket(initial);
            setCurrentRound(1); // 16強起步
        } catch (err) {
            window.alert(`大賽引擎發生錯誤: ${err.message}`);
            console.error(err);
        }
    };

    const closeTournament = () => {
        setIsTournamentOpen(false);
        setTPhase('idle');
        // 重置戰鬥狀態，防止大賽模式殘留導致其他系統 (如冒險、PvP) 的 UI 判定出錯
        setBattleState(prev => ({ ...prev, active: false, mode: 'wild', logs: [] }));
    };

    // 推進大賽階段
    const nextTournamentPhase = () => {
        if (pendingSkillLearn) return; // 如果正在學技能，攔截大賽轉場

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
            // 已棄用，改由 handleTournamentWin 直接跳轉
            if (currentRound >= 4) {
                setTPhase('champion');
            } else {
                setCurrentRound(prev => prev + 1);
                setTPhase('bracket');
            }
        } else if (tPhase === 'champion') {
            setTPhase('rewards');
        } else if (tPhase === 'lost') {
            closeTournament();
        } else if (tPhase === 'rewards') {
            giveChampionReward();
            closeTournament();
        }
    };

    const startTournamentBattle = () => {
        // 🔹 淘汰賽機制：對手永遠是當前對戰樹中離玩家最近的電腦 (index 1)
        const enemy = bracket[1]; 
        if (!enemy) {
            console.error("[Tournament] No enemy found at bracket[1].");
            handleTournamentWin(); // 防呆直接晉級
            return;
        }

        const myId = String(advStats.id || myMonsterId);

        // --- 性格修正系統 (Nature Modifiers) 同步自 App.js ---
        const getNatureMods = (tag) => {
            const mods = { hp: 1.0, atk: 1.0, def: 1.0, spd: 1.0 };
            const conf = NATURE_CONFIG[tag];
            if (conf) {
                if (conf.buff) mods[conf.buff] = 1.1;
                if (conf.nerf) mods[conf.nerf] = 0.9;
            }
            return mods;
        };

        const tagEntries = Object.entries(soulTagCounts || {});
        const best = tagEntries.reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0]);
        const pTag = best[1] > 0 ? best[0] : 'none';
        const pNatureMods = getNatureMods(pTag);

        const pMaxHP = calcFinalStat('hp', myId, advStats.ivs.hp, advStats.evs.hp, derivedLevel, pNatureMods.hp);
        const pATK = calcFinalStat('atk', myId, advStats.ivs.atk, advStats.evs.atk, derivedLevel, pNatureMods.atk);
        const pDEF = calcFinalStat('def', myId, advStats.ivs.def, advStats.evs.def, derivedLevel, pNatureMods.def);
        const pSPD = calcFinalStat('spd', myId, advStats.ivs.spd, advStats.evs.spd, derivedLevel, pNatureMods.spd);

        // --- 技能匯入核心邏輯 (帶入 4 招) ---
        let playerMoves = (advStats.moves || []).map(id => SKILL_DATABASE[id]).filter(Boolean);
        
        // 如果寵物學會的技能不足 4 個，自動從其屬性對應的招式庫中補齊 (仿照冒險模式)
        if (playerMoves.length < 4) {
            const myTypes = (SPECIES_BASE_STATS[myId]?.types) || ['normal'];
            const autoGeneratedIds = generateMoves(myId, derivedLevel);
            autoGeneratedIds.forEach(gid => {
                const skillObj = SKILL_DATABASE[gid];
                if (playerMoves.length < 4 && skillObj && !playerMoves.find(m => m.id === gid)) {
                    playerMoves.push(skillObj);
                }
            });
        }
        
        if (playerMoves.length === 0) {
            playerMoves.push(SKILL_DATABASE.tackle || { id: 'tackle', name: '撞擊', power: 40, type: 'normal' });
        }

        const newBattleState = {
            active: true,
            mode: 'tournament',
            turn: 1,
            phase: 'intro',
            player: {
                id: myId,
                name: "您的怪獸",
                hp: pMaxHP,
                maxHp: pMaxHP,
                atk: pATK,
                def: pDEF,
                spd: pSPD,
                level: derivedLevel,
                type: (SPECIES_BASE_STATS[myId]?.types) || ['normal'],
                moves: playerMoves,
                status: null,
                statStages: { atk: 0, def: 0, spd: 0, accuracy: 0 }
            },
            enemy: { 
                ...enemy.monster,
                moves: enemy.monster.moves.map(id => SKILL_DATABASE[id]).filter(Boolean)
            }, 
            logs: [`【大會廣播】：當前戰鬥開始！`],
            stepQueue: [],
            activeMsg: "",
            flashTarget: null,
            menuIdx: 0,
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

        if (currentRound >= 4) {
            setTPhase('champion');
        } else {
            // 🔹 玩家贏了，進入下一階段並模擬 AI 勝負
            setBracket(prev => advanceBracket(prev));
            setCurrentRound(prev => prev + 1);
            setTPhase('bracket');
        }
        playBloop('success');
    };

    const handleTournamentLoss = () => {
        setTPhase('lost');
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
                updateDialogue(`取得了冠軍，獲得獎品 : ${item.name}`);
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
        opponents: bracket, // 🔹 維持原本名稱以與 UI 對接，但內部邏輯改為對戰樹
        currentRound,
        startTournament,
        closeTournament,
        nextTournamentPhase,
        handleTournamentWin,
        handleTournamentLoss
    };
}

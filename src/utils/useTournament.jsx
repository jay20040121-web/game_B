import { useState, useRef, useEffect } from 'react';
import { OBTAINABLE_MONSTER_IDS, SPECIES_BASE_STATS, generateMoves, calcFinalStat, MONSTER_NAMES, SKILL_DATABASE, NATURE_CONFIG } from '../monsterData';
import { ROGUE_CARDS } from '../data/rogueCards';

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
    setAlertMsg, // 🔹 接收這個參數
    battleState,
    setBattleState,
    setAdvStats,
    setInventory,
    playBloop,
    ADV_ITEMS, // from gameConfig
    pendingSkillLearn,
    setAdvCurrentHP
}) {
    const [isTournamentOpen, setIsTournamentOpen] = useState(false);
    const [tPhase, setTPhase] = useState('idle'); // idle, intro, bracket, battle_intro, fighting, rogue_selection, champion, lost
    const [bracket, setBracket] = useState([]); // 存儲當前輪次的選單 (16, 8, 4, 2)
    const [currentRound, setCurrentRound] = useState(1); // 1 = 16強, 2 = 8強, 3 = 4強, 4 = 決賽

    // 🔹 肉鴿元素：大賽暫時性強化
    const [rogueOptions, setRogueOptions] = useState([]); // 當前可選的三張卡片
    const [selectedCardIdx, setSelectedCardIdx] = useState(0);
    const [tournamentBuffs, setTournamentBuffs] = useState({
        hp: 1.0, atk: 1.0, def: 1.0, spd: 1.0,
        lifesteal: 0, // 吸血率 (0~1)
        reflect: 0,   // 反傷率 (0~1)
        shield: 0,    // 開局護盾率 (0~1)
        haste: 1.0    // 首回合增傷倍率
    });

    const [rewardOptions, setRewardOptions] = useState([]); // 🔹 冠軍獎勵選項
    const [selectedRewardMoveIdx, setSelectedRewardMoveIdx] = useState(0);
    const [selectedRewardEffectIdx, setSelectedRewardEffectIdx] = useState(0);

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
        // 重置肉鴿強化
        setTournamentBuffs({
            hp: 1.0, atk: 1.0, def: 1.0, spd: 1.0,
            lifesteal: 0, reflect: 0, shield: 0, haste: 1.0
        });
    };

    // 推進大賽階段
    const nextTournamentPhase = () => {
        // 只有在非結局畫面 (champion/lost) 才攔截，確保結尾按 B 鍵能順利執行 closeTournament 關閉 Overlay
        if (pendingSkillLearn && !['champion', 'lost'].includes(tPhase)) return; 

        if (tPhase === 'intro') {
            setTPhase('bracket');
        } else if (tPhase === 'bracket') {
            setTPhase('battle_intro');
        } else if (tPhase === 'battle_intro') {
            setTPhase('fighting');
            startTournamentBattle();
        } else if (tPhase === 'fighting') { // fighting 只是中繼，實際由戰鬥系統通知我們勝負
            // 此處不作用
        } else if (tPhase === 'rogue_selection') {
            confirmRogueSelection();
        } else if (tPhase === 'champion_reward_move') {
            setTPhase('champion_reward_effect'); // 進入效果選擇
            playBloop('success');
        } else if (tPhase === 'champion_reward_effect') {
            confirmChampionReward();
        } else if (tPhase === 'mvp') {
            // 已棄用，改由 handleTournamentWin 直接跳轉
            if (currentRound >= 4) {
                setTPhase('champion');
            } else {
                setCurrentRound(prev => prev + 1);
                setTPhase('bracket');
            }
        } else if (tPhase === 'champion') {
            closeTournament();
        } else if (tPhase === 'lost') {
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

        const pMaxHP = calcFinalStat('hp', myId, advStats.ivs.hp, advStats.evs.hp, derivedLevel, pNatureMods.hp * tournamentBuffs.hp);
        const pATK = calcFinalStat('atk', myId, advStats.ivs.atk, advStats.evs.atk, derivedLevel, pNatureMods.atk * tournamentBuffs.atk);
        const pDEF = calcFinalStat('def', myId, advStats.ivs.def, advStats.evs.def, derivedLevel, pNatureMods.def * tournamentBuffs.def);
        const pSPD = calcFinalStat('spd', myId, advStats.ivs.spd, advStats.evs.spd, derivedLevel, pNatureMods.spd * tournamentBuffs.spd);

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
                statStages: { atk: 0, def: 0, spd: 0, accuracy: 0 },
                shield: Math.floor(pMaxHP * tournamentBuffs.shield) // 🔹 注入護盾
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
            tournamentEnemyInfo: enemy, // 附加供UI使用
            rogueBuffs: tournamentBuffs, // 注入肉鴿強化數據
            moveUpgrades: advStats.moveUpgrades || {}
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
            generateChampionRewards();
            setTPhase('champion_reward_move'); // 第一步：選技能
        } else {
            // 🔹 玩家贏了，進入肉鴿選卡階段
            generateRogueOptions();
            setTPhase('rogue_selection');
        }
        playBloop('success');
    };

    // 🔹 肉鴿選卡邏輯
    const generateRogueOptions = () => {
        const pool = [...ROGUE_CARDS];
        const shuffled = pool.sort(() => 0.5 - Math.random());
        setRogueOptions(shuffled.slice(0, 3));
        setSelectedCardIdx(0);
    };

    const confirmRogueSelection = () => {
        const card = rogueOptions[selectedCardIdx];
        if (!card) return;

        // 套用強化效果
        if (card.type === 'stat') {
            setTournamentBuffs(prev => ({
                ...prev,
                [card.stat]: prev[card.stat] * card.value
            }));
        } else if (card.type === 'special') {
            // 🔹 特殊機制倍數成長：如果已經有該效果，則在基礎上乘上成長係數
            // 例如：0.1 (10%) -> 1.5倍成長 -> 0.15 (15%)
            setTournamentBuffs(prev => {
                const currentVal = prev[card.effect] || 0;
                if (card.effect === 'haste') {
                    return { ...prev, haste: prev.haste * card.value };
                }
                const nextVal = currentVal === 0 ? card.value : currentVal * 1.5;
                return { ...prev, [card.effect]: nextVal };
            });
        }

        updateDialogue(`選擇了卡片：${card.name}！威力提升！`);
        playBloop('success');

        // 進入下一輪
        setBracket(prev => advanceBracket(prev));
        setCurrentRound(prev => prev + 1);
        setTPhase('bracket');
    };

    // --- 冠軍獎勵邏輯 ---
    const generateChampionRewards = () => {
        const effects = [
            { id: 'burn', name: '熾熱附魔', type: 'ailment', value: 10, desc: '燒傷機率 +10%' },
            { id: 'paralysis', name: '雷鳴附魔', type: 'ailment', value: 10, desc: '麻痺機率 +10%' },
            { id: 'poison', name: '劇毒附魔', type: 'ailment', value: 10, desc: '中毒機率 +10%' },
            { id: 'confusion', name: '迷幻附魔', type: 'ailment', value: 10, desc: '混亂機率 +10%' },
            { id: 'parasite', name: '寄生附魔', type: 'ailment', value: 10, desc: '寄生機率 +10% (每回合吸血)' },
            { id: 'bind', name: '束縛附魔', type: 'ailment', value: 10, desc: '束縛機率 +10% (無法撤退且受損)' },
            { id: 'accuracy', name: '鷹眼附魔', type: 'stat', value: 10, desc: '技能命中率 +10%' },
            { id: 'priority', name: '迅捷附魔', type: 'stat', value: 0.5, desc: '技能優先度 +0.5 (疊加至 1.0 必定先制)' }
        ];
        // 隨機抽 3 個
        const shuffled = [...effects].sort(() => 0.5 - Math.random());
        setRewardOptions(shuffled.slice(0, 3));
        setSelectedRewardMoveIdx(0);
        setSelectedRewardEffectIdx(0);
    };

    const confirmChampionReward = () => {
        // 🔹 防止重複觸發：如果已經不在選擇階段，直接返回
        if (tPhase !== 'champion_reward_effect') return;

        const moveId = advStats.moves[selectedRewardMoveIdx];
        if (!moveId) return;

        const moveData_DB = SKILL_DATABASE[moveId];
        // --- 🔹 防呆 1：禁止強化非攻擊技能 (BUFF 類) ---
        if (!moveData_DB || (moveData_DB.power || 0) <= 0) {
            setAlertMsg(`【附魔失敗】\n技能 [${moveData_DB?.name || moveId}] 是輔助類技能，無法附魔！`);
            playBloop('fail');
            return;
        }

        const effect = rewardOptions[selectedRewardEffectIdx];
        if (!effect) return;

        // --- 🔹 防呆 2：檢查單項機率上限 (100%) ---
        const currentAilmentVal = advStats.moveUpgrades?.[moveId]?.ailments?.[effect.id] || 0;
        if (effect.type === 'ailment' && currentAilmentVal >= 100) {
            setAlertMsg(`【機率已達上限】\n技能 [${moveData_DB.name}] 的 ${effect.name} 已達 100% 上限，請選擇其他技能或效果！`);
            playBloop('fail');
            return;
        }

        // 檢查強化次數上限
        const currentCount = advStats.moveUpgrades?.[moveId]?.count || 0;
        if (currentCount >= 10) {
            setAlertMsg(`【強化次數上限】\n技能 [${moveData_DB.name}] 已達強化上限 (10/10)！`);
            playBloop('fail');
            return;
        }

        // 🔹 立刻切換階段，防止第二次呼叫進入此邏輯
        setTPhase('champion');

        setAdvStats(prev => {
            const nextUpgrades = { ...(prev.moveUpgrades || {}) };
            const moveData = nextUpgrades[moveId] || { ailments: {}, count: 0 };

            // 再次檢查 count，確保在 setState 內部也是安全的
            if (moveData.count >= 10) return prev;

            const nextAilments = { ...(moveData.ailments || {}) };
            if (effect.type === 'ailment') {
                nextAilments[effect.id] = Math.min(100, (nextAilments[effect.id] || 0) + effect.value);
            } else {
                nextAilments[effect.id] = (nextAilments[effect.id] || 0) + effect.value;
            }

            nextUpgrades[moveId] = {
                ...moveData,
                ailments: nextAilments,
                count: (moveData.count || 0) + 1
            };

            return { ...prev, moveUpgrades: nextUpgrades };
        });

        playBloop('success');
        updateDialogue(`冠軍獎勵：[${moveData_DB.name}] 獲得了 ${effect.name}！(${currentCount + 1}/10)`);
        giveChampionReward();
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

    // 返回大賽前一階段 (主要用於獎勵選擇)
    const prevTournamentPhase = () => {
        if (tPhase === 'champion_reward_effect') {
            setTPhase('champion_reward_move');
            playBloop('pop');
        }
    };

    return {
        isTournamentOpen,
        tPhase,
        opponents: bracket, // 🔹 維持原本名稱以與 UI 對接，但內部邏輯改為對戰樹
        currentRound,
        startTournament,
        closeTournament,
        nextTournamentPhase,
        prevTournamentPhase,
        handleTournamentWin,
        handleTournamentLoss,
        // --- Rogue State ---
        rogueOptions,
        selectedCardIdx,
        setSelectedCardIdx,
        confirmRogueSelection,
        tournamentBuffs,
        rewardOptions,
        selectedRewardMoveIdx,
        setSelectedRewardMoveIdx,
        selectedRewardEffectIdx,
        setSelectedRewardEffectIdx,
        confirmChampionReward
    };
}

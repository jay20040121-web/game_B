import { useState, useRef, useEffect } from 'react';
import { OBTAINABLE_MONSTER_IDS, SPECIES_BASE_STATS, generateMoves, calcFinalStat, MONSTER_NAMES, SKILL_DATABASE, NATURE_CONFIG } from '../monsterData';
import { ROGUE_CARDS } from '../data/rogueCards';

// 🔹 訓練家擬人化名稱池
const TRAINER_NAMES_POOL = [
    "超帥的速宏", "瀨川日和", "老茶", "漢堡神偷", "火星人", "阿來", "阿糕仔", "邱少", "睡夢羅漢", "小夫",
    "機機軒", "傳奇猛將傳", "阿羅", "夢竹", "怪物妹", "怪物真", "妞妞姐姐", "宜良哥哥", "玉米", "小八",
    "章魚王", "小香腸", "小巴", "鋼鐵人", "小馬哥", "比比", "小光頭", "阿要", "Wendy", "阿品",
    "小黃", "阿乃", "爾康", "美美", "阿優", "朱茜", "草莓", "蛋堡", "小宇", "和瑀",
    "阿伯", "木木", "阿泰", "小東", "志宏", "小敏", "大倫", "小貝", "小小"
];

// 🔹 冠軍附魔效果池
const ENCHANT_EFFECTS = [
    { id: 'burn', name: '熾熱附魔', type: 'ailment', value: 10, desc: '燒傷機率 +10%' },
    { id: 'paralysis', name: '雷鳴附魔', type: 'ailment', value: 10, desc: '麻痺機率 +10%' },
    { id: 'poison', name: '劇毒附魔', type: 'ailment', value: 10, desc: '中毒機率 +10%' },
    { id: 'confusion', name: '迷幻附魔', type: 'ailment', value: 10, desc: '混亂機率 +10%' },
    { id: 'leech-seed', name: '寄生附魔', type: 'ailment', value: 10, desc: '寄生機率 +10% (每回合吸血)' },
    { id: 'trap', name: '束縛附魔', type: 'ailment', value: 10, desc: '束縛機率 +10% (無法撤退且受損)' },
    { id: 'freeze', name: '極寒附魔', type: 'ailment', value: 10, desc: '冰凍機率 +10%' },
    { id: 'sleep', name: '催眠附魔', type: 'ailment', value: 10, desc: '睡眠機率 +10%' },
    { id: 'lifesteal', name: '吸血附魔', type: 'stat', value: 5, desc: '傷害吸血比例 +5%' },
    { id: 'accuracy', name: '鷹眼附魔', type: 'stat', value: 10, desc: '技能命中率 +10%' },
    { id: 'priority', name: '迅捷附魔', type: 'stat', value: 0.5, desc: '技能優先度 +0.5 (疊加至 1.0 必定先制)' }
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
    const [tPhase, setTPhase] = useState('idle');
    const [bracket, setBracket] = useState([]);
    const [currentRound, setCurrentRound] = useState(1);
    const [rogueBuffs, setRogueBuffs] = useState([]);
    const [cardOptions, setCardOptions] = useState([]);

    // 冠軍附魔選擇狀態
    const [rewardOptions, setRewardOptions] = useState([]); // 隨機抽出的 3 個附魔效果
    const [selectedRewardMoveIdx, setSelectedRewardMoveIdx] = useState(0); // 玩家選擇的技能索引
    const [selectedRewardEffectIdx, setSelectedRewardEffectIdx] = useState(0); // 玩家選擇的附魔效果索引

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
        for (let i = 0; i < currentBracket.length; i += 2) {
            const p1 = currentBracket[i];
            const p2 = currentBracket[i + 1];

            if (p1.isPlayer) {
                nextBracket.push(p1);
            } else if (p2 && p2.isPlayer) {
                nextBracket.push(p2);
            } else if (p1 && p2) {
                const p1Power = p1.monster.level + Math.random() * 10;
                const p2Power = p2.monster.level + Math.random() * 10;
                nextBracket.push(p1Power >= p2Power ? p1 : p2);
            } else {
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
            setCurrentRound(1);
            setRogueBuffs([]);
        } catch (err) {
            window.alert(`大賽引擎發生錯誤: ${err.message}`);
            console.error(err);
        }
    };

    const closeTournament = () => {
        setIsTournamentOpen(false);
        setTPhase('idle');
        setBattleState(prev => ({ ...prev, active: false, mode: 'wild', logs: [] }));
    };

    // 推進大賽階段
    const nextTournamentPhase = () => {
        if (pendingSkillLearn && !['champion', 'lost', 'champion_reward_move', 'champion_reward_effect'].includes(tPhase)) return;

        if (tPhase === 'intro') {
            setTPhase('bracket');
        } else if (tPhase === 'bracket') {
            setTPhase('battle_intro');
        } else if (tPhase === 'battle_intro') {
            setTPhase('fighting');
            startTournamentBattle();
        } else if (tPhase === 'fighting') {
            // 由戰鬥系統通知勝負
        } else if (tPhase === 'card_selection') {
            // 由 UI 呼叫 pickRogueCard 推進
        } else if (tPhase === 'champion_reward_move') {
            // 由 UI 呼叫，選完技能後進入選效果
            setTPhase('champion_reward_effect');
        } else if (tPhase === 'champion_reward_effect') {
            // 由 confirmChampionReward 處理
        } else if (tPhase === 'champion') {
            giveChampionReward();
            closeTournament();
        } else if (tPhase === 'lost') {
            closeTournament();
        }
    };

    // 返回上一階段 (主要用於附魔選擇時返回選技能)
    const prevTournamentPhase = () => {
        if (tPhase === 'champion_reward_effect') {
            setTPhase('champion_reward_move');
            playBloop('pop');
        }
    };

    const startTournamentBattle = () => {
        const enemy = bracket[1];
        if (!enemy) {
            console.error("[Tournament] No enemy found at bracket[1].");
            handleTournamentWin();
            return;
        }

        const myId = String(advStats.id || myMonsterId);

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

        let playerMoves = (advStats.moves || []).map(id => SKILL_DATABASE[id]).filter(Boolean);

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

        // --- 套用 Roguelike 強化卡片效果 ---
        let finalMaxHP = pMaxHP;
        let finalATK = pATK;
        let finalDEF = pDEF;
        let finalSPD = pSPD;
        let specialEffects = { lifesteal: 0, reflect: 0, shield: 0, haste: 1.0 };

        rogueBuffs.forEach(cardId => {
            const card = ROGUE_CARDS.find(c => c.id === cardId);
            if (!card) return;
            if (card.type === 'stat') {
                if (card.stat === 'hp') finalMaxHP = Math.floor(finalMaxHP * card.value);
                if (card.stat === 'atk') finalATK = Math.floor(finalATK * card.value);
                if (card.stat === 'def') finalDEF = Math.floor(finalDEF * card.value);
                if (card.stat === 'spd') finalSPD = Math.floor(finalSPD * card.value);
            } else if (card.type === 'special') {
                if (card.effect === 'lifesteal') specialEffects.lifesteal += card.value;
                if (card.effect === 'reflect') specialEffects.reflect += card.value;
                if (card.effect === 'shield') specialEffects.shield += card.value;
                if (card.effect === 'haste') specialEffects.haste = card.value;
            }
        });

        const newBattleState = {
            active: true,
            mode: 'tournament',
            turn: 1,
            phase: 'intro',
            player: {
                id: myId,
                name: "您的怪獸",
                hp: Math.floor(finalMaxHP * (1 + specialEffects.shield)),
                maxHp: finalMaxHP,
                atk: finalATK,
                def: finalDEF,
                spd: finalSPD,
                level: derivedLevel,
                type: (SPECIES_BASE_STATS[myId]?.types) || ['normal'],
                moves: playerMoves,
                status: null,
                statStages: { atk: 0, def: 0, spd: 0, accuracy: 0 },
                rogueEffects: specialEffects,
                moveUpgrades: advStats.moveUpgrades || {} // 傳遞附魔數據給戰鬥引擎
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
            tournamentEnemyInfo: enemy
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
            // 決賽勝利 → 進入冠軍附魔選擇
            generateChampionRewards();
            setTPhase('champion_reward_move');
        } else {
            // 🔹 玩家贏了，先進入卡片挑選階段
            const shuffled = [...ROGUE_CARDS].sort(() => Math.random() - 0.5);
            setCardOptions(shuffled.slice(0, 3));
            setTPhase('card_selection');
        }
        playBloop('success');
    };

    const pickRogueCard = (card) => {
        setRogueBuffs(prev => [...prev, card.id]);
        setBracket(prev => advanceBracket(prev));
        setCurrentRound(prev => prev + 1);
        setTPhase('bracket');
        playBloop('success');
    };

    // --- 冠軍附魔邏輯 ---
    const generateChampionRewards = () => {
        const shuffled = [...ENCHANT_EFFECTS].sort(() => 0.5 - Math.random());
        setRewardOptions(shuffled.slice(0, 3));
        setSelectedRewardMoveIdx(0);
        setSelectedRewardEffectIdx(0);
    };

    const confirmChampionReward = (overrideEffectIdx = null) => {
        // 🔹 防止重複觸發
        if (tPhase !== 'champion_reward_effect') return;

        const moveId = advStats.moves[selectedRewardMoveIdx];
        if (!moveId) return;

        const moveData_DB = SKILL_DATABASE[moveId];
        // 🔹 防呆：禁止強化非攻擊技能 (BUFF 類)
        if (!moveData_DB || (moveData_DB.power || 0) <= 0) {
            updateDialogue(`【附魔失敗】技能 [${moveData_DB?.name || moveId}] 是輔助類技能，無法附魔！`);
            playBloop('fail');
            return;
        }

        const effectIdx = overrideEffectIdx !== null ? overrideEffectIdx : selectedRewardEffectIdx;
        const effect = rewardOptions[effectIdx];
        if (!effect) return;

        // 🔹 防呆：檢查單項機率上限 (100%)
        const currentAilmentVal = advStats.moveUpgrades?.[moveId]?.ailments?.[effect.id] || 0;
        if (effect.type === 'ailment' && currentAilmentVal >= 100) {
            updateDialogue(`【機率已達上限】技能 [${moveData_DB.name}] 的 ${effect.name} 已達 100% 上限！`);
            playBloop('fail');
            return;
        }

        // 檢查強化次數上限
        const currentCount = advStats.moveUpgrades?.[moveId]?.count || 0;
        if (currentCount >= 10) {
            updateDialogue(`【強化次數上限】技能 [${moveData_DB.name}] 已達強化上限 (10/10)！`);
            playBloop('fail');
            return;
        }

        // 🔹 立刻切換階段，防止重複呼叫
        setTPhase('champion');

        setAdvStats(prev => {
            const nextUpgrades = { ...(prev.moveUpgrades || {}) };
            const moveData = nextUpgrades[moveId] || { ailments: {}, count: 0 };

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

            // 確保所有狀態在同一次 setState 中更新，避免被 giveChampionReward 的 setState 覆蓋
            return {
                ...prev,
                moveUpgrades: nextUpgrades,
                basePower: Math.min(9999, prev.basePower + 50)
            };
        });

        playBloop('success');
        updateDialogue(`冠軍獎勵：[${moveData_DB.name}] 獲得了 ${effect.name}！(${currentCount + 1}/10)`);


    };

    const handleTournamentLoss = () => {
        setTPhase('lost');
        playBloop('fail');
    };

    const giveChampionReward = () => {
        // 此函式的內容已經合併進 confirmChampionReward，保留此空函式避免其他地方呼叫出錯
        // 如果 tPhase 直接跳到 champion，需要單獨給予獎勵，可以在這裡實作
    };

    return {
        isTournamentOpen,
        tPhase,
        opponents: bracket,
        currentRound,
        cardOptions,
        startTournament,
        closeTournament,
        nextTournamentPhase,
        prevTournamentPhase,
        pickRogueCard,
        handleTournamentWin,
        handleTournamentLoss,
        // --- 冠軍附魔 ---
        rewardOptions,
        selectedRewardMoveIdx,
        setSelectedRewardMoveIdx,
        selectedRewardEffectIdx,
        setSelectedRewardEffectIdx,
        confirmChampionReward
    };
}

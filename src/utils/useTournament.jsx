import { useState, useRef, useEffect } from 'react';
import { OBTAINABLE_MONSTER_IDS, SPECIES_BASE_STATS, generateMoves, calcFinalStat, MONSTER_NAMES, SKILL_DATABASE, NATURE_CONFIG } from '../monsterData';
import { ROGUE_CARDS } from '../data/rogueCards';
import { generateNpcMoveUpgrades } from './npcEnchantSystem';
import { applyOpeningTraitEffects } from './battleTraitSystem';
import { MONSTER_TRAITS } from '../data/monsterTraits';

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
    { id: 'freeze', name: '極寒附魔', type: 'ailment', value: 5, desc: '冰凍機率 +5%' },
    { id: 'sleep', name: '催眠附魔', type: 'ailment', value: 5, desc: '睡眠機率 +5%' },
    { id: 'lifesteal', name: '吸血附魔', type: 'stat', value: 5, desc: '傷害吸血比例 +5%' },
    { id: 'accuracy', name: '鷹眼附魔', type: 'stat', value: 10, desc: '技能命中率 +10%' },
    { id: 'priority', name: '迅捷附魔', type: 'stat', value: 0.5, desc: '技能優先度 +0.5 (疊加至 1.0 必定先制)' }
];

const isEnchantableMove = (moveId, moveUpgrades = {}) => {
    const moveData = SKILL_DATABASE[moveId];
    if (!moveData || (moveData.power || 0) <= 0) return false;
    return (moveUpgrades?.[moveId]?.count || 0) < 10;
};

const TOURNAMENT_DIFFICULTY_BY_ROUND = [
    { levelOffset: -5, enchantCount: 0 },
    { levelOffset: -3, enchantCount: 0 },
    { levelOffset: 0, enchantCount: 3 },
    { levelOffset: 0, enchantCount: 7 },
    { levelOffset: 5, enchantCount: 10 }
];

const TOURNAMENT_TOTAL_ROUNDS = TOURNAMENT_DIFFICULTY_BY_ROUND.length;
const PVP_CHAMPION_CHALLENGE_CHANCE = 0.5;

const MONSTER_STAGE_BY_ID = {
    1000: 1, 1019: 1,
    1001: 2, 1004: 2, 1007: 2, 1010: 2, 1013: 2, 1016: 2, 1020: 2, 1022: 2, 1025: 2, 1038: 2,
    1002: 3, 1005: 3, 1008: 3, 1011: 3, 1014: 3, 1017: 3, 1021: 3, 1023: 3, 1026: 3, 1028: 3, 1030: 3, 1039: 3,
    1003: 4, 1006: 4, 1009: 4, 1012: 4, 1015: 4, 1018: 4, 1024: 4, 1027: 4, 1029: 4, 1031: 4, 1040: 4, 1041: 4, 1042: 4
};

const getTournamentDifficulty = (round) => {
    const index = Math.max(0, Math.min(TOURNAMENT_DIFFICULTY_BY_ROUND.length - 1, (round || 1) - 1));
    return TOURNAMENT_DIFFICULTY_BY_ROUND[index];
};

const getMonsterStage = (id) => MONSTER_STAGE_BY_ID[String(id)] || 1;

const pickNpcTraitForRound = (round, currentTrait = null) => {
    if (round < 4) return null;
    if (currentTrait) return currentTrait;
    return MONSTER_TRAITS[Math.floor(Math.random() * MONSTER_TRAITS.length)] || null;
};

const getTraitStatMod = (trait, level, key) => {
    const modifiers = trait?.modifiers || {};
    const levelMod = level >= (modifiers.thresholdLevel || Infinity)
        ? (modifiers.highLevelStat || 1)
        : (modifiers.lowLevelStat || 1);
    return (modifiers[key] || 1) * levelMod;
};

const getTournamentNpcPoolForRound = (round, playerStage) => {
    const stage = Math.max(1, Math.min(4, Number(playerStage) || 1));
    const pool = OBTAINABLE_MONSTER_IDS.filter(id => {
        const monsterStage = getMonsterStage(id);
        return round <= 3 ? monsterStage <= stage : monsterStage >= stage;
    });

    return pool.length > 0 ? pool : OBTAINABLE_MONSTER_IDS;
};

const normalizeMoveIds = (moves = []) => moves
    .map(moveRef => typeof moveRef === 'string' ? moveRef : moveRef?.id)
    .filter(moveId => moveId && SKILL_DATABASE[moveId]);

const getLeaderboardBattleProfile = (entry) => {
    const profile = entry?.battleProfile || entry?.stats;
    const stats = profile?.stats || profile;
    const id = String(profile?.id || entry?.monsterId || '');
    const species = SPECIES_BASE_STATS[id] || SPECIES_BASE_STATS['1'];
    const fallbackLevel = Math.max(1, Math.min(100, Number(entry?.level || entry?.monsterLevel || 50) || 50));
    const moves = normalizeMoveIds(profile?.moves || entry?.moves || []);
    const resolvedMoves = moves.length > 0 ? moves : generateMoves(4, species.types);

    if (!id) return null;

    return {
        id,
        name: profile?.name || MONSTER_NAMES?.[id] || `怪獸#${id}`,
        level: Math.max(1, Math.min(100, Number(stats?.level) || fallbackLevel)),
        hp: Math.max(1, Math.floor(Number(stats?.hp) || calcFinalStat('hp', id, 15, 0, fallbackLevel))),
        atk: Math.max(1, Math.floor(Number(stats?.atk) || calcFinalStat('atk', id, 15, 0, fallbackLevel))),
        def: Math.max(1, Math.floor(Number(stats?.def) || calcFinalStat('def', id, 15, 0, fallbackLevel))),
        spd: Math.max(1, Math.floor(Number(stats?.spd) || calcFinalStat('spd', id, 15, 0, fallbackLevel))),
        type: profile?.type || species.types || ['normal'],
        moves: resolvedMoves,
        moveUpgrades: profile?.moveUpgrades || entry?.moveUpgrades || {},
        trait: profile?.trait || profile?.monsterTraits?.trait || entry?.trait || entry?.monsterTraits?.trait || null
    };
};

export function useTournament({
    user,
    derivedLevel,
    evolutionStage,
    myMonsterId,
    advStats,
    soulTagCounts,
    monsterTraits,
    leaderboard,
    updateDialogue,
    setAlertMsg,
    battleState,
    setBattleState,
    setAdvStats,
    setInventory,
    playBloop,
    ADV_ITEMS, // from gameConfig
    pendingSkillLearn,
    onTournamentLossReturn
}) {
    const [isTournamentOpen, setIsTournamentOpen] = useState(false);
    const [tPhase, setTPhase] = useState('idle');
    const [bracket, setBracket] = useState([]);
    const [currentRound, setCurrentRound] = useState(1);
    const [rogueBuffs, setRogueBuffs] = useState([]);
    const [cardOptions, setCardOptions] = useState([]);
    const [rerollCount, setRerollCount] = useState(0);
    const [isExtraChampionChallenge, setIsExtraChampionChallenge] = useState(false);
    const [championRewardChoicesRemaining, setChampionRewardChoicesRemaining] = useState(1);
    const [rewardReturnPhase, setRewardReturnPhase] = useState('champion');
    const [lastTournamentEnemyId, setLastTournamentEnemyId] = useState(null);

    const applyBattleGrowthMod = (value) => Math.max(1, Math.floor(Number(value || 0) * (monsterTraits?.trait?.modifiers?.battleGrowth || 1)));
    const [lastPvpChallengePlayerId, setLastPvpChallengePlayerId] = useState(null);

    // 冠軍附魔選擇狀態
    const [rewardOptions, setRewardOptions] = useState([]); // 隨機抽出的 3 個附魔效果
    const [selectedRewardMoveIdx, setSelectedRewardMoveIdx] = useState(0); // 玩家選擇的技能索引
    const [selectedRewardEffectIdx, setSelectedRewardEffectIdx] = useState(0); // 玩家選擇的附魔效果索引

    const applyCurrentRoundDifficulty = (opponent, round = currentRound) => {
        if (opponent?.isPvpChampionChallenge) return opponent;
        if (!opponent?.monster) return opponent;

        const difficulty = getTournamentDifficulty(round);
        const playerStage = Math.max(1, Math.min(4, Number(evolutionStage) || 1));
        const currentMonsterStage = getMonsterStage(opponent.monster.id);
        const isStageAllowed = round <= 3
            ? currentMonsterStage <= playerStage
            : currentMonsterStage >= playerStage;
        const repeatsPreviousRound = lastTournamentEnemyId && String(opponent.monster.id) === String(lastTournamentEnemyId);
        const hasRequiredTrait = round < 4 || !!opponent.monster.trait;
        if (opponent.monster.difficultyRound === round && isStageAllowed && !repeatsPreviousRound && hasRequiredTrait) return opponent;

        const roundPool = getTournamentNpcPoolForRound(round, playerStage);
        const filteredPool = roundPool.length > 1
            ? roundPool.filter(id => String(id) !== String(lastTournamentEnemyId))
            : roundPool;
        const id = String(isStageAllowed && !repeatsPreviousRound
            ? opponent.monster.id
            : filteredPool[Math.floor(Math.random() * filteredPool.length)]);
        const level = Math.max(1, Math.min(100, derivedLevel + difficulty.levelOffset));
        const species = SPECIES_BASE_STATS[id] || SPECIES_BASE_STATS['1'];
        const ivs = { hp: 15, atk: 15, def: 15, spd: 15 };
        const evs = { hp: 0, atk: 0, def: 0, spd: 0 };
        const trait = pickNpcTraitForRound(round, opponent.monster.trait);
        const moves = isStageAllowed && opponent.monster.difficultyRound === round
            ? opponent.monster.moves
            : generateMoves(4, species.types);
        const maxHp = Math.max(1, Math.floor(calcFinalStat('hp', id, ivs.hp, evs.hp, level) * getTraitStatMod(trait, level, 'hp')));

        return {
            ...opponent,
            monster: {
                ...opponent.monster,
                id,
                name: MONSTER_NAMES?.[id] || `怪獸#${id}`,
                type: species.types?.[0] || 'normal',
                level,
                hp: maxHp,
                maxHp,
                atk: Math.max(1, Math.floor(calcFinalStat('atk', id, ivs.atk, evs.atk, level) * getTraitStatMod(trait, level, 'atk'))),
                def: Math.max(1, Math.floor(calcFinalStat('def', id, ivs.def, evs.def, level) * getTraitStatMod(trait, level, 'def'))),
                spd: Math.max(1, Math.floor(calcFinalStat('spd', id, ivs.spd, evs.spd, level) * getTraitStatMod(trait, level, 'spd'))),
                moves,
                moveUpgrades: generateNpcMoveUpgrades(moves, derivedLevel, { enchantCount: difficulty.enchantCount }),
                trait,
                difficultyRound: round
            }
        };
    };

    const getExtraChallengePool = () => {
        if (!Array.isArray(leaderboard)) return [];
        return leaderboard
            .filter(entry => entry?.id !== user?.uid)
            .map(entry => ({ entry, profile: getLeaderboardBattleProfile(entry) }))
            .filter(item => item.profile);
    };

    const createExtraChallengeOpponent = () => {
        let pool = getExtraChallengePool();
        if (pool.length === 0 || Math.random() >= PVP_CHAMPION_CHALLENGE_CHANCE) return null;
        if (pool.length > 1 && lastPvpChallengePlayerId) {
            pool = pool.filter(item => item.entry.id !== lastPvpChallengePlayerId);
        }
        if (pool.length > 1 && lastTournamentEnemyId) {
            const differentMonsterPool = pool.filter(item => String(item.profile.id) !== String(lastTournamentEnemyId));
            if (differentMonsterPool.length > 0) {
                pool = differentMonsterPool;
            }
        }

        const picked = pool[Math.floor(Math.random() * pool.length)];
        setLastPvpChallengePlayerId(picked.entry.id);
        return {
            isPlayer: false,
            isPvpChampionChallenge: true,
            playerName: picked.entry.displayName || '排行榜訓練家',
            monster: {
                ...picked.profile,
                maxHp: picked.profile.hp,
                status: null,
                statStages: { atk: 0, def: 0, spd: 0, accuracy: 0 }
            }
        };
    };

    const startChampionRewards = (rewardCount = 1, returnPhase = 'champion') => {
        setChampionRewardChoicesRemaining(Math.max(1, rewardCount));
        setRewardReturnPhase(returnPhase);
        setIsExtraChampionChallenge(false);
        setRerollCount(rogueBuffs.filter(cardId => cardId === 'reroll_dice').length);

        if ((advStats.moves || []).some(moveId => isEnchantableMove(moveId, advStats.moveUpgrades))) {
            setSelectedRewardMoveIdx(0);
            setRewardOptions([]);
            setTPhase('champion_reward_move');
        } else if (returnPhase === 'card_selection') {
            setRewardReturnPhase('champion');
            const shuffled = [...ROGUE_CARDS].sort(() => Math.random() - 0.5);
            setCardOptions(shuffled.slice(0, 3));
            setTPhase('card_selection');
        } else {
            setTPhase('champion');
        }
    };

    // Listen for battle conclusion
    useEffect(() => {
        if (tPhase === 'fighting' && !battleState?.active && !pendingSkillLearn) {
            if (battleState?.enemy?.hp <= 0) {
                handleTournamentWin();
            } else if (battleState?.enemy?.hp > 0 && battleState?.player?.hp <= 0) {
                handleTournamentLoss();
            }
        }
    }, [battleState?.active, tPhase, battleState?.player?.hp, battleState?.enemy?.hp, pendingSkillLearn]);

    // 生成這輪賽事的初始 32 強名單 (玩家 + 31 名電腦)
    const generateInitialBracket = () => {
        const generated = [];
        // 🔹 玩家本人永遠位於索引 0
        generated.push({
            isPlayer: true,
            playerName: "您",
            monster: null // 戰鬥時動態抓取最新 state
        });

        const lbArray = [];
        let aiNames = [...TRAINER_NAMES_POOL].sort(() => Math.random() - 0.5);
        let aiNameIdx = 0;

        const npcCount = Math.pow(2, TOURNAMENT_TOTAL_ROUNDS) - 1;
        for (let i = 0; i < npcCount; i++) {
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
            const moveUpgrades = {};

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
                    moveUpgrades,
                    status: null,
                    statStages: { atk: 0, def: 0, spd: 0, accuracy: 0 }
                }
            });
        }
        console.log(`[Tournament] Initial bracket generated with ${npcCount} NPC opponents.`);
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
                const msg = "需要將寵物培育至 Stage 2 以上才能報名大賽！";
                updateDialogue(msg);
                setAlertMsg?.(msg);
                playBloop('fail');
                return;
            }
            setIsTournamentOpen(true);
            setTPhase('intro');
            const initial = generateInitialBracket();
            setBracket(initial);
            setCurrentRound(1);
            setRogueBuffs([]);
            setRerollCount(0);
            setIsExtraChampionChallenge(false);
            setChampionRewardChoicesRemaining(1);
            setRewardReturnPhase('champion');
            setLastTournamentEnemyId(null);
            setLastPvpChallengePlayerId(null);
            setRewardOptions([]);
            setSelectedRewardMoveIdx(0);
            setSelectedRewardEffectIdx(0);
        } catch (err) {
            const msg = `大賽引擎發生錯誤：${err.message}`;
            updateDialogue(msg);
            setAlertMsg?.(msg);
            playBloop('fail');
            console.error(err);
        }
    };

    const closeTournament = () => {
        setIsTournamentOpen(false);
        setTPhase('idle');
        setRerollCount(0);
        setIsExtraChampionChallenge(false);
        setChampionRewardChoicesRemaining(1);
        setRewardReturnPhase('champion');
        setLastTournamentEnemyId(null);
        setLastPvpChallengePlayerId(null);
        setRewardOptions([]);
        setSelectedRewardMoveIdx(0);
        setSelectedRewardEffectIdx(0);
        setBattleState(prev => ({ ...prev, active: false, mode: 'wild', logs: [] }));
    };

    // 推進大賽階段
    const nextTournamentPhase = () => {
        if (pendingSkillLearn && !['champion', 'lost', 'champion_reward_move', 'champion_reward_effect'].includes(tPhase)) return;

        if (tPhase === 'intro') {
            setTPhase('bracket');
        } else if (tPhase === 'bracket') {
            setBracket(prev => {
                if (!prev[1]) return prev;
                const next = [...prev];
                next[1] = applyCurrentRoundDifficulty(next[1], currentRound);
                return next;
            });
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
            onTournamentLossReturn?.();
        }
    };

    // 返回上一階段 (主要用於附魔選擇時返回選技能)
    const prevTournamentPhase = () => {
        if (tPhase === 'champion_reward_effect') {
            setTPhase('champion_reward_move');
            setSelectedRewardEffectIdx(0);
            playBloop('back');
        }
    };

    const selectChampionRewardMove = (moveIdx) => {
        const moveId = advStats.moves?.[moveIdx];
        if (!isEnchantableMove(moveId, advStats.moveUpgrades)) {
            playBloop('fail');
            return;
        }

        setSelectedRewardMoveIdx(moveIdx);
        generateChampionRewards(moveIdx);
        setTPhase('champion_reward_effect');
    };

    const startTournamentBattle = () => {
        const enemy = applyCurrentRoundDifficulty(bracket[1], currentRound);
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
        const trait = monsterTraits?.trait || null;
        const traitMods = trait?.modifiers || {};
        const levelTraitMod = derivedLevel >= (traitMods.thresholdLevel || Infinity)
            ? (traitMods.highLevelStat || 1)
            : (traitMods.lowLevelStat || 1);
        const getTraitStatMod = (key) => (traitMods[key] || 1) * levelTraitMod;

        const pMaxHP = Math.max(1, Math.floor(calcFinalStat('hp', myId, advStats.ivs.hp, advStats.evs.hp, derivedLevel, pNatureMods.hp) * getTraitStatMod('hp')));
        const pATK = Math.max(1, Math.floor(calcFinalStat('atk', myId, advStats.ivs.atk, advStats.evs.atk, derivedLevel, pNatureMods.atk) * getTraitStatMod('atk')));
        const pDEF = Math.max(1, Math.floor(calcFinalStat('def', myId, advStats.ivs.def, advStats.evs.def, derivedLevel, pNatureMods.def) * getTraitStatMod('def')));
        const pSPD = Math.max(1, Math.floor(calcFinalStat('spd', myId, advStats.ivs.spd, advStats.evs.spd, derivedLevel, pNatureMods.spd) * getTraitStatMod('spd')));

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
                hp: finalMaxHP,
                maxHp: finalMaxHP,
                shield: Math.floor(finalMaxHP * specialEffects.shield),
                atk: finalATK,
                def: finalDEF,
                spd: finalSPD,
                level: derivedLevel,
                type: (SPECIES_BASE_STATS[myId]?.types) || ['normal'],
                moves: playerMoves,
                status: null,
                statStages: { atk: 0, def: 0, spd: 0, accuracy: 0 },
                rogueEffects: specialEffects,
                moveUpgrades: advStats.moveUpgrades || {}, // 傳遞附魔數據給戰鬥引擎
                trait
            },
            enemy: {
                ...enemy.monster,
                moves: enemy.monster.moves
                    .map(moveRef => typeof moveRef === 'string' ? SKILL_DATABASE[moveRef] : moveRef)
                    .filter(Boolean),
                moveUpgrades: enemy.monster.moveUpgrades || {}
            },
            logs: [`【大會廣播】：當前戰鬥開始！`],
            stepQueue: [],
            activeMsg: "",
            flashTarget: null,
            menuIdx: 0,
            tournamentEnemyInfo: enemy
        };

        setBattleState(applyOpeningTraitEffects(newBattleState));
    };

    const handleTournamentWin = () => {
        setLastTournamentEnemyId(battleState?.tournamentEnemyInfo?.monster?.id || battleState?.enemy?.id || null);

        // 發放每場勝利的一般獎勵： +10 base power (戰力)
        const battlePowerGain = applyBattleGrowthMod(10);
        setAdvStats(prev => ({
            ...prev,
            basePower: Math.min(9999, prev.basePower + battlePowerGain)
        }));

        if (isExtraChampionChallenge) {
            startChampionRewards(2);
            playBloop('confirm');
            return;
        }

        if (currentRound >= TOURNAMENT_TOTAL_ROUNDS) {
            const extraOpponent = createExtraChallengeOpponent();
            if (extraOpponent) {
                setIsExtraChampionChallenge(true);
                setBracket([bracket[0], extraOpponent]);
                setCurrentRound(TOURNAMENT_TOTAL_ROUNDS + 1);
                setTPhase('battle_intro');
                updateDialogue(`冠軍挑戰：排行榜訓練家 ${extraOpponent.playerName} 現身！`);
                playBloop('confirm');
                return;
            }

            startChampionRewards(1);
            playBloop('confirm');
            return;
        }

        if (currentRound === 3 && (advStats.moves || []).some(moveId => isEnchantableMove(moveId, advStats.moveUpgrades))) {
            startChampionRewards(1, 'card_selection');
            playBloop('confirm');
            return;
        }

        if (false) {
            // 決賽勝利 → 進入冠軍附魔選擇
            // 🔹 計算重來骰子次數
            let rc = 0;
            rogueBuffs.forEach(cardId => {
                if (cardId === 'reroll_dice') rc++;
            });
            setRerollCount(rc);

            if ((advStats.moves || []).some(moveId => isEnchantableMove(moveId, advStats.moveUpgrades))) {
                setSelectedRewardMoveIdx(0);
                generateChampionRewards(0);
                setTPhase('champion_reward_move');
            } else {
                const msg = '附魔已滿：身上四個技能都不能附魔。輔助技能無法附魔，攻擊技能最高只能到 10/10 MAX。';
                updateDialogue(msg);
                setAlertMsg?.(msg);
                playBloop('fail');
                closeTournament();
            }
        } else {
            // 🔹 玩家贏了，先進入卡片挑選階段
            const shuffled = [...ROGUE_CARDS].sort(() => Math.random() - 0.5);
            setCardOptions(shuffled.slice(0, 3));
            setTPhase('card_selection');
        }
        playBloop('confirm');
    };

    const pickRogueCard = (card) => {
        setRogueBuffs(prev => [...prev, card.id]);
        setBracket(prev => advanceBracket(prev));
        setCurrentRound(prev => prev + 1);
        setTPhase('bracket');
        playBloop('confirm');
    };

    // --- 冠軍附魔邏輯 ---
    const generateChampionRewards = (moveIdx = selectedRewardMoveIdx, { force = false } = {}) => {
        if (!force && rewardOptions.length > 0) {
            setSelectedRewardEffectIdx(0);
            return;
        }

        // 🔹 計算機率加成
        let weightAcc = 1;
        let weightSpd = 1;
        rogueBuffs.forEach(cardId => {
            if (cardId === 'focus_acc') weightAcc += 3;
            if (cardId === 'focus_spd') weightSpd += 3;
        });

        // 🔹 加權抽取
        const selectedMoveId = advStats.moves?.[moveIdx];
        const currentMoveUpgrades = advStats.moveUpgrades?.[selectedMoveId]?.ailments || {};
        const pool = [];
        ENCHANT_EFFECTS.forEach(eff => {
            if (eff.type === 'ailment' && (currentMoveUpgrades[eff.id] || 0) >= 100) return;
            let w = 1;
            if (eff.id === 'accuracy') w = weightAcc;
            if (eff.id === 'priority') w = weightSpd;
            for (let i = 0; i < w; i++) pool.push(eff);
        });

        const selected = [];
        const tempPool = [...pool];
        while (selected.length < 3 && tempPool.length > 0) {
            const idx = Math.floor(Math.random() * tempPool.length);
            const picked = tempPool[idx];
            if (!selected.find(s => s.id === picked.id)) {
                selected.push(picked);
            }
            // 移除已抽中的所有實例以確保不重複
            for (let i = tempPool.length - 1; i >= 0; i--) {
                if (tempPool[i].id === picked.id) tempPool.splice(i, 1);
            }
        }

        setRewardOptions(selected);
        setSelectedRewardEffectIdx(0);
    };

    const rerollChampionRewards = () => {
        if (rerollCount <= 0) return;
        setRerollCount(prev => prev - 1);
        generateChampionRewards(selectedRewardMoveIdx, { force: true });
        playBloop('confirm');
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
        const remainingRewards = Math.max(0, championRewardChoicesRemaining - 1);
        setChampionRewardChoicesRemaining(remainingRewards);
        if (remainingRewards > 0) {
            setRewardOptions([]);
            setSelectedRewardMoveIdx(0);
            setSelectedRewardEffectIdx(0);
            setTPhase('champion_reward_move');
        } else if (rewardReturnPhase === 'card_selection') {
            setRewardOptions([]);
            setSelectedRewardMoveIdx(0);
            setSelectedRewardEffectIdx(0);
            setRewardReturnPhase('champion');
            const shuffled = [...ROGUE_CARDS].sort(() => Math.random() - 0.5);
            setCardOptions(shuffled.slice(0, 3));
            setTPhase('card_selection');
        } else {
            setTPhase('champion');
        }

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
                basePower: Math.min(9999, prev.basePower + applyBattleGrowthMod(50))
            };
        });

        playBloop('success');
        updateDialogue(`冠軍獎勵：[${moveData_DB.name}] 獲得了 ${effect.name}！(${currentCount + 1}/10)`);


    };

    const handleTournamentLoss = () => {
        setLastTournamentEnemyId(battleState?.tournamentEnemyInfo?.monster?.id || battleState?.enemy?.id || null);

        if (isExtraChampionChallenge) {
            startChampionRewards(1);
            playBloop('fail');
            return;
        }

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
        selectChampionRewardMove,
        selectedRewardEffectIdx,
        setSelectedRewardEffectIdx,
        confirmChampionReward,
        rerollCount,
        rerollChampionRewards
    };
}

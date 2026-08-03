import { useState, useEffect } from 'react';
import { OBTAINABLE_MONSTER_IDS, SPECIES_BASE_STATS, generateMoves, calcFinalStat, MONSTER_NAMES, SKILL_DATABASE } from '../monsterData';
import { applyOpeningTraitEffects } from './battleTraitSystem';
import { getPokemonAbilities } from '../data/monsterTraits';
import { getPokemonEvolutionStage } from '../data/pokemonEvolutionSystem';

// 🔹 訓練家擬人化名稱池
const TRAINER_NAMES_POOL = [
    "超帥的速宏", "瀨川日和", "老茶", "漢堡神偷", "火星人", "阿來", "阿糕仔", "邱少", "睡夢羅漢", "小夫",
    "機機軒", "傳奇猛將傳", "阿羅", "夢竹", "怪物妹", "怪物真", "妞妞姐姐", "宜良哥哥", "玉米", "小八",
    "章魚王", "小香腸", "小巴", "鋼鐵人", "小馬哥", "比比", "小光頭", "阿要", "Wendy", "阿品",
    "小黃", "阿乃", "爾康", "美美", "阿優", "朱茜", "草莓", "蛋堡", "小宇", "和瑀",
    "阿伯", "木木", "阿泰", "小東", "志宏", "小敏", "大倫", "小貝", "小小"
];

const TOURNAMENT_DIFFICULTY_BY_ROUND = [
    { levelOffset: -5 },
    { levelOffset: -3 },
    { levelOffset: 0 },
    { levelOffset: 0 },
    { levelOffset: 5 }
];

const TOURNAMENT_TOTAL_ROUNDS = TOURNAMENT_DIFFICULTY_BY_ROUND.length;
const PVP_CHAMPION_CHALLENGE_CHANCE = 0.5;

const getMonsterStage = id => getPokemonEvolutionStage(id);

const getTournamentDifficulty = (round) => {
    const index = Math.max(0, Math.min(TOURNAMENT_DIFFICULTY_BY_ROUND.length - 1, (round || 1) - 1));
    return TOURNAMENT_DIFFICULTY_BY_ROUND[index];
};

const pickNpcTraitForId = (id, _round, currentTrait = null) => {
    const pool = getPokemonAbilities(id);
    const legalCurrent = pool.find(ability => ability.id === currentTrait?.id);
    return legalCurrent || pool[Math.floor(Math.random() * pool.length)] || null;
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
    const resolvedMoves = moves.length > 0 ? moves : generateMoves(id, fallbackLevel);

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
        moveUpgrades: {},
                trait: profile?.trait || profile?.monsterTraits?.trait || entry?.trait || entry?.monsterTraits?.trait || null
    };
};

export function useTournament({
    user,
    derivedLevel,
    evolutionStage,
    myMonsterId,
    advStats,
    monsterTraits,
    leaderboard,
    updateDialogue,
    setAlertMsg,
    battleState,
    setBattleState,
    setAdvStats,
    playBloop,
    pendingSkillLearn,
    onTournamentLossReturn
}) {
    const [isTournamentOpen, setIsTournamentOpen] = useState(false);
    const [tPhase, setTPhase] = useState('idle');
    const [bracket, setBracket] = useState([]);
    const [currentRound, setCurrentRound] = useState(1);
    const [isExtraChampionChallenge, setIsExtraChampionChallenge] = useState(false);
    const [lastTournamentEnemyId, setLastTournamentEnemyId] = useState(null);
    const [rewardOptions, setRewardOptions] = useState([]);
    const [selectedRewardEffectIdx, setSelectedRewardEffectIdx] = useState(0);

    const applyBattleGrowthMod = (value) => Math.max(1, Math.floor(Number(value || 0) * (monsterTraits?.trait?.modifiers?.battleGrowth || 1)));
    const [lastPvpChallengePlayerId, setLastPvpChallengePlayerId] = useState(null);

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
        const trait = pickNpcTraitForId(id, round, opponent.monster.trait);
        const moves = isStageAllowed && opponent.monster.difficultyRound === round
            ? opponent.monster.moves
            : generateMoves(id, level);
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
                moveUpgrades: {},
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

    // Listen for battle conclusion
    useEffect(() => {
        if (tPhase === 'fighting' && !battleState?.active && !pendingSkillLearn) {
            if (battleState?.enemy?.hp <= 0) {
                handleTournamentWin();
            } else if (battleState?.enemy?.hp > 0 && battleState?.player?.hp <= 0) {
                handleTournamentLoss();
            }
        }
        return undefined;
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
            moves = generateMoves(id, level);
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
                    trait: pickNpcTraitForId(id, 1), // 前三場不配置天賦
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
            setIsTournamentOpen(true);
            setTPhase('intro');
            const initial = generateInitialBracket();
            setBracket(initial);
            setCurrentRound(1);
            setIsExtraChampionChallenge(false);
            setLastTournamentEnemyId(null);
            setLastPvpChallengePlayerId(null);
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
        setIsExtraChampionChallenge(false);
        setLastTournamentEnemyId(null);
        setLastPvpChallengePlayerId(null);
        setBattleState(prev => ({ ...prev, active: false, mode: 'wild', logs: [] }));
    };

    // 推進大賽階段
    const nextTournamentPhase = () => {
        if (pendingSkillLearn && !['champion', 'lost'].includes(tPhase)) return;

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
        } else if (tPhase === 'champion') {
            closeTournament();
        } else if (tPhase === 'lost') {
            closeTournament();
            onTournamentLossReturn?.();
        }
    };

    const startTournamentBattle = () => {
        const enemy = applyCurrentRoundDifficulty(bracket[1], currentRound);
        if (!enemy) {
            console.error("[Tournament] No enemy found at bracket[1].");
            handleTournamentWin();
            return;
        }

        const myId = String(advStats.id || myMonsterId);

        const trait = monsterTraits?.trait || null;
        const traitMods = trait?.modifiers || {};
        const levelTraitMod = derivedLevel >= (traitMods.thresholdLevel || Infinity)
            ? (traitMods.highLevelStat || 1)
            : (traitMods.lowLevelStat || 1);
        const getTraitStatMod = (key) => (traitMods[key] || 1) * levelTraitMod;

        const pMaxHP = Math.max(1, Math.floor(calcFinalStat('hp', myId, advStats.ivs.hp, advStats.evs.hp, derivedLevel) * getTraitStatMod('hp')));
        const pATK = Math.max(1, Math.floor(calcFinalStat('atk', myId, advStats.ivs.atk, advStats.evs.atk, derivedLevel) * getTraitStatMod('atk')));
        const pDEF = Math.max(1, Math.floor(calcFinalStat('def', myId, advStats.ivs.def, advStats.evs.def, derivedLevel) * getTraitStatMod('def')));
        const pSPD = Math.max(1, Math.floor(calcFinalStat('spd', myId, advStats.ivs.spd, advStats.evs.spd, derivedLevel) * getTraitStatMod('spd')));

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
                shield: 0,
                atk: pATK,
                def: pDEF,
                spd: pSPD,
                level: derivedLevel,
                type: (SPECIES_BASE_STATS[myId]?.types) || ['normal'],
                moves: playerMoves,
                status: null,
                statStages: { atk: 0, def: 0, spd: 0, accuracy: 0 },
                moveUpgrades: advStats.moveUpgrades || {},
                trait
            },
            enemy: {
                ...enemy.monster,
                moves: enemy.monster.moves
                    .map(moveRef => typeof moveRef === 'string' ? SKILL_DATABASE[moveRef] : moveRef)
                    .filter(Boolean),
                moveUpgrades: {}
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

    const continueTournamentWin = () => {
        if (isExtraChampionChallenge) {
            setTPhase('champion');
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
                updateDialogue(`???嚗?銵?閮毀摰?${extraOpponent.playerName} ?曇澈嚗`);
                playBloop('confirm');
                return;
            }

            setTPhase('champion');
            playBloop('confirm');
            return;
        }

        setBracket(prev => advanceBracket(prev));
        setCurrentRound(prev => prev + 1);
        setTPhase('bracket');
        playBloop('confirm');
    };

    const generateChampionRewards = () => {
        const effects = [
            { id: 'damage', name: '破壞附魔', value: 1, desc: '技能傷害 +1%' },
            { id: 'accuracy', name: '鷹眼附魔', value: 2, desc: '技能命中 +2%' },
            { id: 'priority', name: '迅捷附魔', value: 0.1, desc: '技能先手率 +0.1' }
        ];
        const moves = (advStats.moves || []).filter(moveId => (SKILL_DATABASE[moveId]?.power || 0) > 0);
        const shuffledEffects = [...effects].sort(() => Math.random() - 0.5);
        const shuffledMoves = [...moves].sort(() => Math.random() - 0.5);
        const options = shuffledEffects.map((effect, idx) => {
            const moveId = shuffledMoves[idx % Math.max(1, shuffledMoves.length)];
            const move = moveId ? SKILL_DATABASE[moveId] : null;
            return { ...effect, moveId, moveName: move?.name || '攻擊技能' };
        });
        setRewardOptions(options);
        setSelectedRewardEffectIdx(0);
    };
    const confirmChampionReward = () => {
        if (tPhase !== 'champion_reward_effect') return;
        const effect = rewardOptions[selectedRewardEffectIdx];
        const moveId = effect?.moveId;
        const moveData = moveId ? SKILL_DATABASE[moveId] : null;
        if (!moveData || !effect) return;
        if ((moveData.power || 0) <= 0) {
            setAlertMsg(`技能「${moveData.name || moveId}」是輔助技能，無法附魔。`);
            playBloop('fail');
            return;
        }

        setAdvStats(prev => {
            const nextUpgrades = { ...(prev.moveUpgrades || {}) };
            const current = nextUpgrades[moveId] || { ailments: {}, count: 0 };
            nextUpgrades[moveId] = {
                ...current,
                ailments: { ...(current.ailments || {}), [effect.id]: Number(current.ailments?.[effect.id] || 0) + effect.value },
                count: Number(current.count || 0) + 1
            };
            return { ...prev, moveUpgrades: nextUpgrades };
        });
        setTPhase('champion');
        updateDialogue(`附魔成功：「${moveData.name}」${effect.desc}`);
        playBloop('success');
        continueTournamentWin();
    };

    const handleTournamentWin = () => {
        setLastTournamentEnemyId(battleState?.tournamentEnemyInfo?.monster?.id || battleState?.enemy?.id || null);

        const battlePowerGain = applyBattleGrowthMod(10);
        setAdvStats(prev => ({
            ...prev,
            basePower: Math.min(9999, prev.basePower + battlePowerGain)
        }));

        if (!isExtraChampionChallenge && currentRound === TOURNAMENT_TOTAL_ROUNDS) {
            generateChampionRewards();
            setTPhase('champion_reward_effect');
            playBloop('success');
            return;
        }
        continueTournamentWin();
    };
    const handleTournamentLoss = () => {
        setLastTournamentEnemyId(battleState?.tournamentEnemyInfo?.monster?.id || battleState?.enemy?.id || null);

        if (isExtraChampionChallenge) {
            setTPhase('champion');
            playBloop('fail');
            return;
        }

        setTPhase('lost');
        playBloop('fail');
    };

    return {
        isTournamentOpen,
        tPhase,
        setTPhase,
        currentRound,
        startTournament,
        closeTournament,
        nextTournamentPhase,
        handleTournamentWin,
        handleTournamentLoss,
        rewardOptions,
        selectedRewardEffectIdx,
        setSelectedRewardEffectIdx,
        confirmChampionReward
    };
}

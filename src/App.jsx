import BattleAdventureOverlay from './components/BattleAdventureOverlay';
import DiaryOverlay from './components/DiaryOverlay';
import InventoryOverlay from './components/InventoryOverlay';
import StatusOverlay from './components/StatusOverlay';
import LeaderboardOverlay from './components/LeaderboardOverlay';
import SkillLearnOverlay from './components/SkillLearnOverlay';
import DebugPanel from './components/DebugPanel';
import { MonsterpediaOverlay } from './components/MonsterpediaOverlay';
import PokeRogueOverlay from './components/PokeRogueOverlay';
import SkillRearrangeOverlay from './components/SkillRearrangeOverlay';
import EvolutionPerformance from './components/EvolutionPerformance';
import SettingsOverlay from './components/SettingsOverlay';
import TutorialAI from './components/TutorialAI';
import PetLetterOverlay from './components/PetLetterOverlay';
import DefeatTutorialOverlay from './components/DefeatTutorialOverlay';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles.css';
import {
    MONSTER_NAMES,
    SPECIES_BASE_STATS,
    SKILL_DATABASE,
    TYPE_SKILLS,
    ADV_WILD_POOL,
    TYPE_MAP,
    getTypeMultiplier,
    generateMoves,
    calcFinalStat,
    getLevelByPower,
    getPowerThreshold,
    OBTAINABLE_MONSTER_IDS,
    MONSTER_ASSET_IDS
} from './monsterData';

import { drawRandomPokemonStarter, getNextPokemonEvolution, getPokemonEvolutionLevel, getPokemonEvolutionStage } from './data/pokemonEvolutionSystem';
import { generateMonsterTraits, normalizeMonsterTraits } from './data/monsterTraits';

import { DitheredSprite, DitheredBackSprite, PixelArt, ICONS, BATTLE_STYLES } from './components/SpriteRenderer';


import {
    apiKey, modelName, PHYSICS,
    DIARY_MESSAGES_TEMPLATE, ADV_BATTLE_RULES, RAW_Q_DATA, SOUL_QUESTIONS,
    getPetDailyMessage, DIARY_STORAGE_KEY, loadDiaryData, saveDiaryData, getSmartMove
} from './data/gameConfig';

import { playBloop, playBGM } from './utils/audioSystem';
import { SAVE_VERSION, loadSaveData, persistSaveData, clearPersistedSaveData } from './utils/storageSystem';
import { isLocalhost, PEER_PREFIX } from './utils/envConfig';
import { processBattleTurn, splitShieldDamage } from './utils/battleTurnSystem';
import { applyOpeningTraitEffects } from './utils/battleTraitSystem';
import { usePvpConnection } from './utils/usePvpConnection';
import { getMonsterId } from './utils/monsterIdMapper';
import { useLeaderboard } from './utils/useLeaderboard';
import { useTournament } from './utils/useTournament';
import { getTodayStr } from './utils/dateUtils';
import { useDisplayScale } from './utils/useDisplayScale';
import { createMenuItems } from './data/menuConfig';
import { buildPlayerBattleProfile } from './utils/battleStats';
import { useCloudSync } from './utils/useCloudSync';
import { useSingleActiveTab } from './utils/useSingleActiveTab';
import { useSkillLearning } from './utils/useSkillLearning';
import { applyAiPetLetter, getPendingAiPetLetter, getUnreadPetLetter, markPetLetterAiFailed, markPetLetterAiRequested, markPetLetterAiTimedOut, markPetLetterRead, normalizePetLetters, refreshPetLetters, savePlayerPetReply } from './utils/petLetterSystem';
import { isPetLetterAiEnabled, requestAiPetLetter } from './utils/petLetterAiClient';
import { clearCachedWeatherContext, createDebugWeatherContext, createEmptyWeatherContext, fetchWeatherContext, loadCachedWeatherContext } from './utils/weatherSystem';
import { clearCachedDailyTopics, createFallbackDailyTopics, fetchDailyTopics, loadCachedDailyTopics } from './utils/dailyTopicSystem';
import { TournamentOverlay } from './components/TournamentOverlay';
import { normalizePokemonSpeciesId } from './data/pokemonMapping';
import { getDefeatTutorialEnabled, getPetLettersEnabled } from './utils/gamePreferenceSystem';
import { createPokemonBall, createPokemonSnapshot, normalizePokemonBalls } from './utils/pokemonBallSystem';





const BOOT_MONSTER_IDS = OBTAINABLE_MONSTER_IDS.map(Number);

const drawBootMonsterId = (poolRef, currentId = null) => {
    let pool = poolRef.current.filter(id => id !== currentId);

    if (pool.length === 0) {
        pool = BOOT_MONSTER_IDS.filter(id => id !== currentId);
    }

    const nextIndex = Math.floor(Math.random() * pool.length);
    const nextId = pool[nextIndex];
    poolRef.current = pool.filter(id => id !== nextId);

    return nextId;
};

export default function App() {
    const isDesktopBuild = import.meta.env.VITE_DESKTOP === '1';
    const [initialData] = useState(() => loadSaveData());

    const getInit = (key, defaultVal) => {
        return (initialData && initialData[key] !== undefined) ? initialData[key] : defaultVal;
    };

    // 更新日記事件（帶優先權檢查）
    const updateDiaryEvent = (text, priority) => {
        setTodayEventPriority(currentP => {
            if (priority >= currentP) {
                setTodaySpecialEvent(text);
                return priority;
            }
            return currentP;
        });
    };

    const [hunger, setHunger] = useState(getInit('hunger', 60));
    const [mood, setMood] = useState(getInit('mood', 50));
    const [isSleeping, setIsSleeping] = useState(getInit('isSleeping', false));
    const [isPooping, setIsPooping] = useState(getInit('isPooping', false));
    const [evolutionStage, setEvolutionStage] = useState(getInit('evolutionStage', 1));
    const [evolutionBranch, setEvolutionBranch] = useState(getInit('evolutionBranch', 'WILD_4')); // 舊存檔相容欄位
    const [currentMonsterId, setCurrentMonsterId] = useState(() => {
        const savedId = Number(getInit('currentMonsterId', 0));
        if (savedId) return normalizePokemonSpeciesId(savedId);
        if (!initialData) return 4; // 新遊戲固定從小火龍開始
        return normalizePokemonSpeciesId(getMonsterId(
            getInit('evolutionBranch', 'A'),
            getInit('evolutionStage', 1),
            false,
            getInit('bondValue', 0)
        ));
    });
    const [trainWins, setTrainWins] = useState(getInit('trainWins', 0));
    const [stageTrainWins, setStageTrainWins] = useState(getInit('stageTrainWins', 0));
    const [feedCount, setFeedCount] = useState(getInit('feedCount', 0));
    const [deathBranch, setDeathBranch] = useState(getInit('deathBranch', null));
    const [lastEvolutionTime, setLastEvolutionTime] = useState(getInit('lastEvolutionTime', Date.now()));
    const [birthTime, setBirthTime] = useState(getInit('birthTime', Date.now()));
    const [lastSaveTime, setLastSaveTime] = useState(getInit('lastSaveTime', Date.now()));

    // 談心系統新增狀態
    const [bondValue, setBondValue] = useState(getInit('bondValue', 0));
    const [talkCount, setTalkCount] = useState(getInit('talkCount', 0));
    const [lockedAffinity, setLockedAffinity] = useState(getInit('lockedAffinity', null));
    const [soulAffinityCounts, setSoulAffinityCounts] = useState(getInit('soulAffinityCounts', { fire: 0, water: 0, grass: 0, bug: 0 }));
    const [monsterTraits, setMonsterTraits] = useState(() => normalizeMonsterTraits(getInit('monsterTraits', null), currentMonsterId));

    const [steps, setSteps] = useState(getInit('steps', 0));
    const [interactionLogs, setInteractionLogs] = useState(getInit('interactionLogs', []));
    const [interactionCount, setInteractionCount] = useState(getInit('interactionCount', 0));
    const [isDead, setIsDead] = useState(getInit('isDead', false));
    const [isRunaway, setIsRunaway] = useState(getInit('isRunaway', false));
    const [finalWords, setFinalWords] = useState(getInit('finalWords', ""));

    const { displayScale, manualScale, setManualScale } = useDisplayScale();

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isTutorialOpen, setIsTutorialOpen] = useState(false);
    const [defeatTutorialEnabled, setDefeatTutorialEnabledState] = useState(() => getDefeatTutorialEnabled());
    const [petLettersEnabled, setPetLettersEnabledState] = useState(() => getPetLettersEnabled());
    const [petLetters, setPetLetters] = useState(() => normalizePetLetters(getInit('petLetters', null)));
    const [isPetLetterOpen, setIsPetLetterOpen] = useState(false);
    const [weatherContext, setWeatherContext] = useState(() => loadCachedWeatherContext() || createEmptyWeatherContext('initial'));
    const [dailyTopics, setDailyTopics] = useState(() => loadCachedDailyTopics() || createFallbackDailyTopics());

    useEffect(() => {
        if (!defeatTutorialEnabled) {
            setPendingDefeatTutorial(null);
            setDefeatTutorialType(null);
        }
    }, [defeatTutorialEnabled]);

    useEffect(() => {
        if (!petLettersEnabled) {
            setIsPetLetterOpen(false);
        }
    }, [petLettersEnabled]);




    // 圖鑑系統狀態
    const [ownedMonsters, setOwnedMonsters] = useState(() => [...new Set(getInit('ownedMonsters', []).map(normalizePokemonSpeciesId).map(String))].filter(id => OBTAINABLE_MONSTER_IDS.includes(id)));
    const [isPediaOpen, setIsPediaOpen] = useState(false);
    const [isExpeditionOpen, setIsExpeditionOpen] = useState(false);
    const [pediaIdx, setPediaIdx] = useState(0);
    const [isPediaDetailOpen, setIsPediaDetailOpen] = useState(false);

    // 解鎖圖鑑函式
    const unlockMonster = (id) => {
        if (!id) return;
        const idStr = String(id);
        setOwnedMonsters(prev => {
            if (prev.includes(idStr)) return prev;
            const newList = [...prev, idStr];
            logEvent(`解鎖了新的圖鑑：${MONSTER_NAMES[idStr] || idStr}`);
            recordGameAction(); // 確保解鎖後觸發存檔
            return newList;
        });
    };

    const [showDebug, setShowDebug] = useState(false);
    const [debugOverrides, setDebugOverrides] = useState({
        evolutionMs: null,
        catchRate: null,
        adventureCD: null,
        petLetterHour: null,
        weatherStatus: null
    });

    const [miniGame, setMiniGame] = useState(null);
    const miniGameResultFired = useRef(false);
    const advLogRef = useRef(null);

    // --- 效能最佳化：改用 Ref 儲存高頻變動數值 ---
    const posRef = useRef({ x: 128, y: 80 });
    const velRef = useRef({ x: 0.6, y: 0.4 });
    const monsterRef = useRef(null);
    const spriteRef = useRef(null);
    const requestRef = useRef();
    const lastSaveTimeRef = useRef(0);
    const idleTimeoutRef = useRef(null);

    const [isSpinning, setIsSpinning] = useState(false);
    const [isEvolving, setIsEvolving] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [dialogue, setDialogue] = useState("像素怪獸\n按A開始冒險"); // 初始顯示改為登入標語，點擊 A 後才切換回遊戲招呼語
    const [marqueeKey, setMarqueeKey] = useState(0);
    const [evolutionDetails, setEvolutionDetails] = useState(null); // { fromId, toId }
    const [loadedImages, setLoadedImages] = useState({}); // 追蹤哪些自定義圖標已成功載入

    const [isConfirmingFarewell, setIsConfirmingFarewell] = useState(false); // 二次確認開關

    const updateDialogue = useCallback((text) => {
        setDialogue(text);
        setMarqueeKey(prev => prev + 1);
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    }, []);

    const logEvent = (msg) => {
        setInteractionCount(c => c + 1);
        setInteractionLogs(prev => [...prev.slice(-10), { t: new Date().toLocaleTimeString(), m: msg }]);
    };

    // --- 冒險系統專屬狀態 (Adventure State) ---
    // 升級為官方 4 維架構：Base Stats (Species) + IVs (Genetic) + EVs (Effort)
    const [advStats, setAdvStats] = useState(() => {
        const d = initialData?.advStats || { hp: 100, atk: 10, def: 10, spd: 1, basePower: 100 };
        // 資料遷移：如果沒有 ivs，隨機生成一組 IV (0~31)
        if (!d.ivs) {
            d.ivs = {
                hp: Math.floor(Math.random() * 32),
                atk: Math.floor(Math.random() * 32),
                def: Math.floor(Math.random() * 32),
                spd: Math.floor(Math.random() * 32)
            };
        }
        // 資料遷移：如果沒有 evs，將舊有的 atk/def 高數值按比例轉為努力值
        if (!d.evs) {
            d.evs = {
                hp: Math.min(252, Math.max(0, (d.hp || 100) - 100)),
                atk: Math.min(252, Math.floor(Math.max(0, (d.atk || 10) - 10) * 4)),
                def: Math.min(252, Math.floor(Math.max(0, (d.def || 10) - 10) * 4)),
                spd: Math.min(252, Math.floor(Math.max(0, (d.spd || 1) - 1) * 8))
            };
        }
        // 舊技能資料轉換：只保留目前 Pokémon 在最新招式表中可學會的正式招式。
        const monId = String(normalizePokemonSpeciesId(initialData?.currentMonsterId || initialData?.id || localStorage.getItem('pixel_monster_id') || 4));
        const monLevel = getLevelByPower(d.basePower || 100);        const officialMoves = generateMoves(monId, monLevel);
        // 玩家已配置的招式是權威資料：升級時只補足空位，不重新洗牌或淘汰既有招式。
        const savedMoves = [...new Set((Array.isArray(d.moves) ? d.moves : [])
            .filter(moveId => SKILL_DATABASE[moveId]))].slice(0, 4);
        const missingSlots = Math.max(0, 4 - savedMoves.length);
        d.moves = [...savedMoves, ...officialMoves
            .filter(moveId => !savedMoves.includes(moveId))
            .slice(0, missingSlots)];
        delete d.bonusMoveId;
        // 只保留目前正式招式仍對應得到的附魔資料。
        d.moveUpgrades = Object.fromEntries(Object.entries(d.moveUpgrades || {}).filter(([moveId]) => d.moves.includes(moveId)));

        return d;
    });

    const derivedLevel = getLevelByPower(advStats?.basePower);
    const {
        pendingSkillLearn,
        setPendingSkillLearn,
        skillSelectIdx,
        setSkillSelectIdx,
        isConfirmingReplace,
        setIsConfirmingReplace,
        tempReplaceIdx,
        setTempReplaceIdx,
        isSkillRearrangeOpen,
        setIsSkillRearrangeOpen,
        resetLevelTracker,
    } = useSkillLearning({
        advStats,
        derivedLevel,
        getMonsterId: () => getMonsterIdWrapped(),
        skillDatabase: SKILL_DATABASE,
    });

    // --- PvP 系統專屬狀態 (WebRTC/PeerJS) ---
    // --- PvP State Extracted ---

    // --- PVP 排行榜邏輯 (已模組化至 useLeaderboard) ---
    // (updatePvpStats, fetchLeaderboard 與排行榜 state 由 hook 提供，於下方解構使用)

    // --- Handlers removed ---

    // Handlers removed

    // 取得自身的戰鬥數值用於 INIT 傳送
    function generateMyBattleStats() {
        const speciesId = getMonsterIdWrapped();
        const profile = buildPlayerBattleProfile({
            advStats,
            calcFinalStat,
            getLevelByPower,
            monsterTraits,
            skillDatabase: SKILL_DATABASE,
            speciesBaseStats: SPECIES_BASE_STATS,
            speciesId,
        });

        return {
            pMaxHP: profile.hp,
            pATK: profile.atk,
            pDEF: profile.def,
            pSPD: profile.spd,
            pType: profile.type,
            pMoves: profile.moves,
            myId: speciesId,
            pLevel: profile.level
        };
    };

    // Remote peer connect removed

    const [inventory, setInventory] = useState(() => normalizePokemonBalls(initialData?.inventory));
    const [activeBallId, setActiveBallId] = useState(initialData?.activeBallId || null);
    const [lastAdvTime, setLastAdvTime] = useState(initialData?.lastAdvTime || 0);
    const [advLog, setAdvLog] = useState([]);
    const [isAdvMode, setIsAdvMode] = useState(false);
    const [advCD, setAdvCD] = useState(0);
    const [isAdvStreaming, setIsAdvStreaming] = useState(false);
    const [pendingDefeatTutorial, setPendingDefeatTutorial] = useState(null);
    const [defeatTutorialType, setDefeatTutorialType] = useState(null);
    const [isStatusUIOpen, setIsStatusUIOpen] = useState(false);
    const [statusPage, setStatusPage] = useState('stats');
    const [alertMsg, setAlertMsg] = useState("");
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    const {
        user,
        isCloudSyncing,
        isCloudLoading,
        hasCheckedCloud,
        cloudWriteEnabled,
        cloudChoicePrompt,
        selectCloudChoice,
        confirmCloudChoice,
        dismissCloudChoice,
        loginWithGoogle,
        logoutGoogle,
        saveToCloud,
    } = useCloudSync({ setAlertMsg, updateDialogue });

    const formatCloudChoiceTime = (time) => {
        if (!time) return '無資料';
        try {
            return new Date(time).toLocaleString();
        } catch (e) {
            return '時間讀取失敗';
        }
    };

    // --- 數據同步副作用 (Data Sync) ---
    // 當寵物進化或更換時，確保 baseStats 被正確計算 (透過 render 層動態計算 FinalStats)

    // --- 🔹 官方數值計算核心 🔹 ---
    const getIVGrade = (iv) => {
        if (iv >= 31) return "S";
        if (iv >= 25) return "A";
        if (iv >= 15) return "B";
        if (iv >= 10) return "C";
        return "D";
    };

    // Final stat calculation is now managed in monsterData.js



    // --- 日記系統專屬狀態 (Diary State) ---
    const [diaryLog, setDiaryLog] = useState(() => loadDiaryData());
    const [todayTrainWins, setTodayTrainWins] = useState(getInit('todayTrainWins', 0));
    const [todayWildDefeated, setTodayWildDefeated] = useState(getInit('todayWildDefeated', 0));
    const [todayBondGained, setTodayBondGained] = useState(getInit('todayBondGained', 0));
    const [todayFeedCount, setTodayFeedCount] = useState(getInit('todayFeedCount', 0));
    const [todayHasEvolved, setTodayHasEvolved] = useState(getInit('todayHasEvolved', false));
    const [todaySpecialEvent, setTodaySpecialEvent] = useState(getInit('todaySpecialEvent', '今日尚無重大事件'));
    const [todayEventPriority, setTodayEventPriority] = useState(getInit('todayEventPriority', 0));
    const [lastDiaryDate, setLastDiaryDate] = useState(getInit('lastDiaryDate', getTodayStr()));
    const [isDiaryOpen, setIsDiaryOpen] = useState(false);
    const [diaryViewDate, setDiaryViewDate] = useState(null); // null = 今天


    useEffect(() => {
        if (!alertMsg) return;
        const timer = setTimeout(() => setAlertMsg(""), 3000);
        return () => clearTimeout(timer);
    }, [alertMsg]);

    const [advCurrentHP, setAdvCurrentHP] = useState(1); // 1.0 = 100%
    const [selectedBallIdx, setSelectedBallIdx] = useState(0);
    const [pendingWildCapture, setPendingWildCapture] = useState(null); // { id, name }

    // --- 經典回合制戰鬥狀態 ---
    const [battleState, setBattleState] = useState({
        active: false,
        mode: 'wild', // wild 或 trainer
        turn: 0,
        phase: 'intro', // intro, player_action, combat, end
        player: null, // { hp, maxHp, atk, spd }
        enemy: null, // { id, name, hp, maxHp, atk, spd }
        logs: [], // 戰鬥對話文字陣列
        isPlayerTurn: true,
        menuIdx: 0,
        stepQueue: [], // 新增：分步動作隊列
        activeMsg: "",  // 新增：目前正在播報的文字
        flashTarget: null // 'player' | 'enemy' | null
    });

    const [pendingAdvLogs, setPendingAdvLogs] = useState([]); // 儲存待顯示的冒險日誌隊列

    const isDuplicateTab = useSingleActiveTab();

    // 冒險日誌自動捲動到最下方
    useEffect(() => {
        if (advLogRef.current) {
            advLogRef.current.scrollTop = advLogRef.current.scrollHeight;
        }
    }, [advLog, isAdvStreaming]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [btnPressed, setBtnPressed] = useState(null);
    const lastAliveMonsterIdRef = useRef(4);
    const [showRestartHint, setShowRestartHint] = useState(false);
    const [isBooting, setIsBooting] = useState(() => {
        const shouldSkipBoot = sessionStorage.getItem('pixel_monster_skip_boot_once') === '1';
        if (shouldSkipBoot) {
            sessionStorage.removeItem('pixel_monster_skip_boot_once');
            return false;
        }
        return true;
    }); // 每次重新整理都先停留在登入畫面，雲端匯入後例外直接進遊戲
    const bootMonsterPoolRef = useRef([...BOOT_MONSTER_IDS]);
    const [bootMonsterId, setBootMonsterId] = useState(() => drawBootMonsterId(bootMonsterPoolRef));
    const [bootMonsterPosIdx, setBootMonsterPosIdx] = useState(0); // 0:左上, 1:右上, 2:左下, 3:右下
    const [isBootMonsterVisible, setIsBootMonsterVisible] = useState(true);

    // 啟動畫面心跳聲
    // 啟動畫面怪獸跳槽動畫 (四個角落巡迴 + 倒掛效果)
    useEffect(() => {
        let timer;
        if (isBooting) {
            timer = setInterval(() => {
                if (document.hidden) return;
                setIsBootMonsterVisible(false); // 觸發淡出

                setTimeout(() => {
                    setBootMonsterPosIdx(prev => (prev + 1) % 2); // 只在兩個位置循環
                    setBootMonsterId(prev => drawBootMonsterId(bootMonsterPoolRef, prev)); // 一輪內不重複抽怪
                    setIsBootMonsterVisible(true); // 觸發淡入
                }, 1000); // 1秒的淡出過渡
            }, 10000); // 10秒一個週期
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isBooting]);

    // 舊物品不再載入；舊存檔首次進入時，將目前夥伴放入第一顆寶可夢球。
    useEffect(() => {
        const balls = normalizePokemonBalls(inventory);
        if (balls.length > 0) {
            setInventory(balls);
            if (!balls.some(ball => ball.ballId === activeBallId)) setActiveBallId(balls[0].ballId);
        } else {
            const firstBall = createPokemonBall(getCurrentPokemonSnapshot());
            setInventory([firstBall]);
            setActiveBallId(firstBall.ballId);
        }

        setOwnedMonsters(prev => prev.filter(id => OBTAINABLE_MONSTER_IDS.includes(String(id))));
        setAdvStats(prev => ({ ...prev, moves: (prev.moves || []).filter(moveId => SKILL_DATABASE[moveId]) }));
    }, []);


    // 追蹤上一次存檔的內容（不含時間戳記），用來判斷是否真的有變動
    const lastSavedDataRef = useRef("");
    const aiPetLetterRequestsRef = useRef(new Set());

    // 核心動作紀錄器：只有發生具體遊戲行為時更新 lastSaveTime
    const recordGameAction = () => {
        setLastSaveTime(Date.now());
    };

    // 1️⃣ 本地存檔：負責頻繁更新 localStorage (包含每秒跳動的數值)
    useEffect(() => {
        try {
            // 每 5 秒最多儲存一次，除非是重要操作 (手動觸發)
            const now = Date.now();
            if (now - lastSaveTimeRef.current < 5000) return;

            const currentData = {
                saveVersion: SAVE_VERSION,
                hunger, mood, isSleeping, isPooping, evolutionStage, evolutionBranch, currentMonsterId,
                trainWins, stageTrainWins, feedCount, steps, interactionLogs, interactionCount, isDead, finalWords,
                lastEvolutionTime, birthTime,
                deathBranch, bondValue, talkCount, lockedAffinity, soulAffinityCounts,
                monsterTraits,
                advStats, inventory, activeBallId, lastAdvTime,
                todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount, lastDiaryDate,
                todayHasEvolved, todaySpecialEvent, todayEventPriority,
                ownedMonsters,
                petLetters,
                lastSaveTime: lastSaveTime,
                ownerUid: user?.uid || null
            };
            const currentDataStr = JSON.stringify(currentData);
            if (currentDataStr === lastSavedDataRef.current) return;

            persistSaveData(currentDataStr);
            lastSavedDataRef.current = currentDataStr;
            lastSaveTimeRef.current = now;
        } catch (e) { }
    }, [user, hunger, mood, isSleeping, isPooping, evolutionStage, evolutionBranch, currentMonsterId, trainWins, stageTrainWins, feedCount, steps, interactionLogs, interactionCount, isDead, finalWords, lastEvolutionTime, birthTime, deathBranch, bondValue, talkCount, lockedAffinity, soulAffinityCounts, monsterTraits, advStats, inventory, activeBallId, lastAdvTime, todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount, lastDiaryDate, todayHasEvolved, todaySpecialEvent, todayEventPriority, ownedMonsters, petLetters, lastSaveTime]);

    // 2️⃣ 雲端同步：獨立監控重大行為，不受 hunger/mood 跳動影響
    useEffect(() => {
        if (user && hasCheckedCloud && cloudWriteEnabled && lastSaveTime > 0) {
            // 只有當重大動作發生 (lastSaveTime 變更) 時，才排程同步
            // 使用較短的 2 秒延遲，且不會被 hunger 衰減給中斷
            const timer = setTimeout(() => {
                const latestData = JSON.parse(lastSavedDataRef.current || '{}');
                saveToCloud(latestData);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, hasCheckedCloud, cloudWriteEnabled, lastSaveTime]);

    // 日記獨立自動存檔（每次 diaryLog 變更時觸發）
    useEffect(() => {
        saveDiaryData({ ...diaryLog });
    }, [diaryLog]);

    // 日期跨越偵測與自動歸檔（每 30 秒檢查一次，確保深夜跨日也能正確歸檔）
    useEffect(() => {
        const archiveToday = () => {
            const todayStr = getTodayStr();
            setLastDiaryDate(prev => {
                if (prev !== todayStr) {
                    // 日期跨越：將昨日數據歸入日記
                    const petMsg = getPetDailyMessage(lockedAffinity);

                    setDiaryLog(d => ({
                        ...d,
                        [prev]: {
                            trainWins: todayTrainWins,
                            wildDefeated: todayWildDefeated,
                            specialEvent: todaySpecialEvent,
                            petMessage: petMsg,
                            evolutionStageEnd: evolutionStage,
                            evolutionBranch: evolutionBranch,
                        }
                    }));
                    // 重置今日計數器與事件
                    setTodayTrainWins(0);
                    setTodayWildDefeated(0);
                    setTodayBondGained(0);
                    setTodayFeedCount(0);
                    setTodayHasEvolved(false);
                    setTodaySpecialEvent('今日尚無重大事件');
                    setTodayEventPriority(0);
                    return todayStr;
                }
                return prev;
            });
        };
        archiveToday(); // 立即執行一次
        const timer = setInterval(() => {
            if (document.hidden) return;
            archiveToday();
        }, 30000); // 每 30 秒檢查
        return () => clearInterval(timer);
    }, [todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount, lockedAffinity, evolutionStage, evolutionBranch]);

    useEffect(() => {
        return () => clearTimeout(idleTimeoutRef.current);
    }, []);


    const base = import.meta.env.BASE_URL;
    const menuItems = createMenuItems(base, ICONS);

    useEffect(() => {
        if (isDead || isEvolving || (miniGame && miniGame.type !== 'status' && miniGame.status !== 'result') || isDuplicateTab) {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
            return;
        }

        const animate = () => {
            if (document.hidden) {
                requestRef.current = requestAnimationFrame(animate);
                return;
            }

            const p = posRef.current;
            const v = velRef.current;

            let nextX = p.x + v.x * (PHYSICS.FLOAT_SPEED || 0.36);
            let nextY = p.y + v.y * (PHYSICS.FLOAT_SPEED || 0.36);

            let newVelX = v.x;
            let newVelY = v.y;

            const MARGIN_X = 80;
            const MARGIN_TOP = 55;
            const MARGIN_BOTTOM = 86;

            if (nextX <= MARGIN_X) {
                newVelX = Math.abs(v.x) * (PHYSICS.BOUNCE_DAMPING || 0.98);
                nextX = MARGIN_X;
            } else if (nextX >= 256 - MARGIN_X) {
                newVelX = -Math.abs(v.x) * (PHYSICS.BOUNCE_DAMPING || 0.98);
                nextX = 256 - MARGIN_X;
            }

            if (nextY <= MARGIN_TOP) {
                newVelY = Math.abs(v.y) * (PHYSICS.BOUNCE_DAMPING || 0.98);
                nextY = MARGIN_TOP;
            } else if (nextY >= MARGIN_BOTTOM) {
                newVelY = -Math.abs(v.y) * (PHYSICS.BOUNCE_DAMPING || 0.98);
                nextY = MARGIN_BOTTOM;
            }

            posRef.current = { x: nextX, y: nextY };
            velRef.current = { x: newVelX, y: newVelY };

            if (monsterRef.current) {
                // 使用 transform: translate 效能最好，但因為原本 JSX 用 left/top
                // 我們直接更新 style.left/top 以降低改動風險，並達成跳過 React re-render 的目的
                monsterRef.current.style.left = `${nextX}px`;
                monsterRef.current.style.top = `${nextY}px`;
            }
            if (spriteRef.current) {
                const angle = (!isDead && isSpinning) ? 'rotate(180deg)' : '';
                const currentId = String(isDead ? lastAliveMonsterIdRef.current : getMonsterIdWrapped());
                const flipBase = (newVelX < 0) ? 1 : -1;
                const flipMod = currentId === '137' ? -1 : 1;
                const flip = `scaleX(${flipBase * flipMod})`;
                spriteRef.current.style.transform = `${angle} ${flip}`;
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isDead, isEvolving, miniGame, isDuplicateTab, isSpinning]);

    // 用 Ref 確保可以隨時讀取最新狀態而不觸發 useEffect 重啟
    const latestStats = useRef({ mood, hunger, stageTrainWins, deathBranch, lockedAffinity, soulAffinityCounts, bondValue, advStats });
    useEffect(() => {
        latestStats.current = { mood, hunger, stageTrainWins, deathBranch, lockedAffinity, soulAffinityCounts, bondValue, advStats };
    }, [mood, hunger, stageTrainWins, deathBranch, lockedAffinity, soulAffinityCounts, bondValue, advStats]);

    const getTraitGrowthMod = (key) => monsterTraits?.trait?.modifiers?.[key] || 1;
    const applyTraitGrowthMod = (value, key) => Math.max(1, Math.floor(Number(value || 0) * getTraitGrowthMod(key)));

    useEffect(() => {
        if (isBooting || isDead || isEvolving || miniGame || isRunaway || isDuplicateTab) return;

        // 固定衰減速度：每 6 小時從 100 點歸零 (不再隨進化時間變動)
        const DECAY_FULL_MS = debugOverrides.evolutionMs ?? (6 * 3600 * 1000);
        const TARGET_DROP = 100;
        const TICK_MS = 1000;
        const dropPerTick = TARGET_DROP * (TICK_MS / DECAY_FULL_MS);

        const decayTimer = setInterval(() => {
            setHunger(h => Math.max(0, h - dropPerTick));
            setMood(m => Math.max(0, m - dropPerTick));
        }, TICK_MS);

        return () => clearInterval(decayTimer);
    }, [isBooting, isDead, isEvolving, evolutionStage, isRunaway, debugOverrides]);

    const handleTalkChoice = (idx) => {
        if (!miniGame || miniGame.status !== 'question') return;

        const opt = SOUL_QUESTIONS[miniGame.qIdx].options[idx];
        if (!opt) return;

        let pts = opt.affinity === lockedAffinity ? 10 : 5;
        pts = applyTraitGrowthMod(pts, 'soulBondGain');

        setBondValue(b => b + pts);
        setTalkCount(t => t + 1);
        setTodayBondGained(b => b + pts);
        if (!lockedAffinity) {
            setSoulAffinityCounts(s => ({ ...s, [opt.affinity]: (s[opt.affinity] || 0) + 1 }));
        }

        recordGameAction(); // 紀錄遊戲行為
        setMiniGame(p => ({ ...p, status: 'result', points: pts }));
        playSoundEffect('success');
        updateDialogue(`絆 +${pts}！`);

        setTimeout(() => {
            setMiniGame(null);
            velRef.current = { x: (Math.random() - 0.5) * 4, y: -2.0 };
        }, 1500);
    };

    const handleMiniGameResult = (success) => {
        if (miniGameResultFired.current) return;
        miniGameResultFired.current = true;

        setMiniGame(prev => ({ ...prev, status: 'result', result: success }));

        if (success) {
            playSoundEffect('success');
            setTrainWins(t => t + 1);
            setStageTrainWins(t => t + 1);
            setTodayTrainWins(t => t + 1);
            setMood(m => Math.min(100, m + 15));
            velRef.current = { x: 0, y: -10.0 }; // 興奮大跳躍

            // --- 🔹 實裝特訓努力值獲益 (+10 EVs) 🔹 ---
            let statKey = 'atk';
            let statName = '攻擊';
            const type = miniGame?.type;
            if (type === 'reaction') { statKey = 'spd'; statName = '速度'; }
            else if (type === 'charge_click' || type === 'charge') { statKey = 'def'; statName = '防禦'; }

            const gotHPBonus = Math.random() < 0.4; // 40% 機率額外提升 HP 潛能
            const evGain = applyTraitGrowthMod(10, 'trainingGrowth');

            setAdvStats(prev => {
                const nextEVs = { ...prev.evs };
                const updateEVFunc = (key, val) => {
                    const currentTotal = Object.values(nextEVs).reduce((a, b) => a + b, 0);
                    const canAdd = Math.min(val, 510 - currentTotal, 252 - (nextEVs[key] || 0));
                    if (canAdd > 0) nextEVs[key] += canAdd;
                };

                updateEVFunc(statKey, evGain);
                if (gotHPBonus && statKey !== 'hp') updateEVFunc('hp', evGain);

                return { ...prev, evs: nextEVs };
            });

            recordGameAction(); // 紀錄特訓成功
            const bonusStr = gotHPBonus ? "與體力" : "";
            updateDialogue(`經過訓練，${statName}${bonusStr}潛能提升了！`);
            logEvent(`特訓成功！${statName}${bonusStr}潛能 +${evGain}`);
        } else {
            playSoundEffect('fail');
            setMood(m => Math.max(0, m - 5));
            updateDialogue("MISS...");
            logEvent("特訓失敗。");
        }

        setTimeout(() => {
            setMiniGame(null);
            velRef.current = { x: (Math.random() - 0.5) * 4, y: -2.0 };
        }, 1500);
    };

    const playSoundEffect = (type) => playBloop(type);

    function getCurrentPokemonSnapshot() {
        return createPokemonSnapshot({
            speciesId: currentMonsterId, evolutionStage, evolutionBranch, types: SPECIES_BASE_STATS[String(currentMonsterId)]?.types || [], advStats, monsterTraits,
            bondValue, talkCount, lockedAffinity, soulAffinityCounts, interactionLogs, interactionCount,
            hunger, mood, isSleeping, isPooping, lastEvolutionTime
        });
    }

    function applyPokemonSnapshot(snapshot) {
        const pokemon = createPokemonSnapshot(snapshot);
        const speciesId = normalizePokemonSpeciesId(pokemon.speciesId);
        setCurrentMonsterId(speciesId);
        setEvolutionStage(getPokemonEvolutionStage(speciesId));
        setEvolutionBranch(pokemon.evolutionBranch || `WILD_${speciesId}`);
        setAdvStats(pokemon.advStats);
        setMonsterTraits(normalizeMonsterTraits(pokemon.monsterTraits, speciesId));
        setBondValue(pokemon.bondValue);
        setTalkCount(pokemon.talkCount);
        setLockedAffinity(pokemon.lockedAffinity);
        setSoulAffinityCounts(pokemon.soulAffinityCounts);
        setInteractionLogs(pokemon.interactionLogs);
        setInteractionCount(pokemon.interactionCount);
        setHunger(pokemon.hunger);
        setMood(pokemon.mood);
        setIsSleeping(pokemon.isSleeping);
        setIsPooping(pokemon.isPooping);
        setLastEvolutionTime(pokemon.lastEvolutionTime || Date.now());
        resetLevelTracker(getLevelByPower(pokemon.advStats.basePower));
    }

    const switchPokemonBall = (ballIdx) => {
        const targetBall = inventory[ballIdx];
        if (!targetBall?.pokemon) return;
        if (targetBall.ballId === activeBallId) {
            updateDialogue(`${MONSTER_NAMES[targetBall.pokemon.speciesId] || '這隻寶可夢'}已經在主畫面了。`);
            playBloop('back');
            return;
        }
        const currentSnapshot = getCurrentPokemonSnapshot();
        setInventory(prev => prev.map(ball => ball.ballId === activeBallId ? { ...ball, pokemon: currentSnapshot } : ball));
        setActiveBallId(targetBall.ballId);
        applyPokemonSnapshot(targetBall.pokemon);
        setIsInventoryOpen(false);
        setSelectedBallIdx(ballIdx);
        updateDialogue(`從寶可夢球放出了${MONSTER_NAMES[targetBall.pokemon.speciesId] || '寶可夢'}！`);
        recordGameAction();
        playBloop('confirm');
    };

    const confirmWildCapture = (confirm) => {
        if (confirm && pendingWildCapture) {
            const randomHighIV = () => 25 + Math.floor(Math.random() * 7);
            const speciesId = Number(pendingWildCapture.id);
            const capturedLevel = pendingWildCapture.level || 1;
            const captured = createPokemonSnapshot({
                speciesId,
                evolutionStage: getPokemonEvolutionStage(speciesId),
                evolutionBranch: `WILD_${speciesId}`,
                types: SPECIES_BASE_STATS[String(speciesId)]?.types || [],
                advStats: {
                    basePower: (capturedLevel - 1) * 10 + 100,
                    ivs: { hp: randomHighIV(), atk: randomHighIV(), def: randomHighIV(), spd: randomHighIV() },
                    evs: { hp: 0, atk: 0, def: 0, spd: 0 },
                    moves: generateMoves(speciesId, capturedLevel),
                    moveUpgrades: {}
                },
                monsterTraits: generateMonsterTraits(speciesId),
                hunger: 60,
                mood: 50
            });
            const newBall = createPokemonBall(captured);
            const currentSnapshot = getCurrentPokemonSnapshot();
            setInventory(prev => [...prev.map(ball => ball.ballId === activeBallId ? { ...ball, pokemon: currentSnapshot } : ball), newBall]);
            setActiveBallId(newBall.ballId);
            applyPokemonSnapshot(captured);
            setStageTrainWins(0);
            updateDialogue(`✨ 收服了${pendingWildCapture.name}！已放入新的寶可夢球。`);
            unlockMonster(speciesId);
            recordGameAction();
            playBloop('confirm');
        } else {
            updateDialogue('沒有使用寶可夢球。');
            playBloop('back');
        }
        setPendingWildCapture(null);
        setIsAdvMode(false);
    };

    useEffect(() => {
        if (!activeBallId) return;
        const snapshot = getCurrentPokemonSnapshot();
        setInventory(prev => {
            let changed = false;
            const next = prev.map(ball => {
                if (ball.ballId !== activeBallId) return ball;
                if (JSON.stringify(ball.pokemon) === JSON.stringify(snapshot)) return ball;
                changed = true;
                return { ...ball, pokemon: snapshot };
            });
            return changed ? next : prev;
        });
    }, [activeBallId, currentMonsterId, evolutionStage, evolutionBranch, advStats, monsterTraits, bondValue, talkCount, lockedAffinity, soulAffinityCounts, interactionLogs, interactionCount, hunger, mood, isSleeping, isPooping, lastEvolutionTime]);

    function executeBattleTurn(playerAction = 'attack', actionMove = null, pvpEnemyMove = null) {
        if (playerAction === 'attack') playBloop('confirm');
        setBattleState(prev => {
            try {
                return processBattleTurn(prev, playerAction, actionMove, pvpEnemyMove, {
                    isHost,
                    pvpRemoteMoveRef,
                    connInstance,
                    setPendingPlayerMove,
                    getSmartMove,
                    monsterTraits
                });
            } catch (err) {
                console.error("[Battle] Turn Error:", err);
                return prev;
            }
        });
    };

    const getBattleStepDelay = (step) => {
        if (!step) return 4;
        if (step.kind === 'damage') return 620;
        if (step.kind === 'support') return 760;
        if (step.kind === 'status') return 940;
        if (step.kind === 'system') return 880;
        if (step.type === 'damage') return 620;
        if (step.type === 'heal' || step.type === 'shield') return 760;
        return 4;
    };

    const advanceBattleStreaming = (prev) => {
        try {
            if (prev.stepQueue.length > 30) return prev; // Safety net

            if (prev.activeStepPending || prev.stepQueue.length > 0) {
                const nextStep = prev.activeStepPending ? prev.lastStep : prev.stepQueue[0];
                if (!nextStep) {
                    return { ...prev, activeStepPending: false };
                }
                console.log("[Battle Animation] Step:", nextStep);
                const updated = {
                    ...prev,
                    stepQueue: prev.activeStepPending ? prev.stepQueue : prev.stepQueue.slice(1),
                    activeStepPending: false,
                    activeMsg: nextStep.text || "",
                    // 保留每個演出步驟，讓 MISS 與屬性效果訊息留在戰鬥日誌。
                    logs: nextStep.text
                        ? [...(prev.logs || []), nextStep.text].slice(-5)
                        : (prev.logs || [])
                };

                if (nextStep.type === 'damage') {
                    const applyDamageStep = (target) => {
                        const split = nextStep.shieldValue !== undefined && nextStep.hpValue !== undefined
                            ? {
                                nextShield: Math.max(0, (target.shield || 0) - nextStep.shieldValue),
                                nextHp: Math.max(0, target.hp - nextStep.hpValue)
                            }
                            : splitShieldDamage(target, nextStep.value);
                        return {
                            ...target,
                            shield: split.nextShield,
                            hp: split.nextHp
                        };
                    };
                    if (nextStep.target === 'enemy') updated.enemy = applyDamageStep(updated.enemy);
                    else updated.player = applyDamageStep(updated.player);

                    const targetKey = nextStep.target === 'enemy' ? 'enemy' : 'player';
                    const target = updated[targetKey];
                    const other = targetKey === 'player' ? updated.enemy : updated.player;
                    const targetTrait = target?.trait || null;
                    updated.traitUsage = updated.traitUsage || { player: { revives: {}, eightGatesEnded: false }, enemy: { revives: {}, eightGatesEnded: false } };
                    updated.traitUsage[targetKey] = updated.traitUsage[targetKey] || { revives: {}, eightGatesEnded: false };
                    const canFeignDeathRevive =
                        target?.hp <= 0 &&
                        other?.hp > 0 &&
                        (targetTrait?.modifiers?.battleRevive || 0) > 0 &&
                        !updated.traitUsage[targetKey].revives?.[targetTrait.id];

                    if (canFeignDeathRevive) {
                        updated[targetKey] = { ...target, hp: 1 };
                        if (targetKey === 'player') updated.playerHpAfter = 1;
                        else updated.enemyHpAfter = 1;
                        if (targetKey === 'player' && updated.playerFinalState) {
                            updated.playerFinalState = { ...updated.playerFinalState, hp: 1 };
                        }
                        if (targetKey === 'enemy' && updated.enemyFinalState) {
                            updated.enemyFinalState = { ...updated.enemyFinalState, hp: 1 };
                        }
                        updated.traitUsage[targetKey].revives = {
                            ...(updated.traitUsage[targetKey].revives || {}),
                            [targetTrait.id]: true
                        };
                        updated.activeMsg = `${targetTrait.name}觸發！體力回到 1，戰鬥繼續。`;
                    }
                    const finalHpAfter = targetKey === 'player' ? updated.playerHpAfter : updated.enemyHpAfter;
                    const finalShieldAfter = targetKey === 'player' ? updated.playerShieldAfter : updated.enemyShieldAfter;
                    if (updated[targetKey]?.hp <= 0 && finalHpAfter > 0) {
                        updated[targetKey] = {
                            ...updated[targetKey],
                            hp: finalHpAfter,
                            shield: finalShieldAfter !== undefined ? finalShieldAfter : (updated[targetKey].shield || 0)
                        };
                    }
                    updated.flashTarget = nextStep.target;
                    const damagePopId = nextStep.id || `${prev.turn}-${nextStep.target}-${nextStep.value}`;
                    updated.damagePop = {
                        id: damagePopId,
                        target: nextStep.target,
                        value: nextStep.value,
                        effectType: nextStep.effectType,
                        effectVariant: nextStep.effectVariant,
                        effectStyle: nextStep.effectStyle
                    };
                    setTimeout(() => {
                        setBattleState(current => {
                            if (!current || current.damagePop?.id !== damagePopId) return current;
                            return { ...current, flashTarget: null };
                        });
                    }, 520);
                    playBloop('attack');
                } else if (nextStep.type === 'heal') {
                    const targetKey = nextStep.target === 'enemy' ? 'enemy' : 'player';
                    const target = updated[targetKey];
                    const nextHp = Math.min(target.maxHp, target.hp + nextStep.value);
                    const actualHeal = Math.max(0, nextHp - target.hp);
                    updated[targetKey] = { ...target, hp: nextHp };
                    if (actualHeal > 0) {
                        updated.healPop = {
                            id: nextStep.id || `${prev.turn}-${nextStep.target}-heal-${actualHeal}`,
                            target: nextStep.target,
                            value: actualHeal
                        };
                    }
                    updated.flashTarget = null;
                    playBloop('success');
                } else if (nextStep.type === 'shield') {
                    if (nextStep.target === 'enemy') updated.enemy = { ...updated.enemy, shield: (updated.enemy.shield || 0) + nextStep.value };
                    else updated.player = { ...updated.player, shield: (updated.player.shield || 0) + nextStep.value };
                    updated.flashTarget = null;
                    playBloop('success');
                } else if (nextStep.type === 'run') {
                    updated.phase = 'end';
                    setTimeout(() => resolveBattleLoss(true), 1200);
                } else {
                    if (nextStep.cue === 'form_change' && nextStep.hpValue !== undefined) {
                        const targetKey = nextStep.actorSide === 'player' ? 'player' : 'enemy';
                        updated[targetKey] = {
                            ...updated[targetKey],
                            hp: nextStep.hpValue,
                            maxHp: nextStep.maxHpValue || updated[targetKey].maxHp
                        };

                        // 產生風格轉換特效 pop (利用既有 damagePop 架構但不傳 value 避免顯示傷害數字)
                        const damagePopId = nextStep.id || `${prev.turn}-${targetKey}-form_change`;
                        updated.damagePop = {
                            id: damagePopId,
                            target: targetKey,
                            value: 0,
                            effectStyle: 'form_change'
                        };

                        // 設定在 450ms (GIF 播放大約一半) 時切換怪獸 ID 與名稱
                        if (nextStep.newId && nextStep.newName) {
                            setTimeout(() => {
                                setBattleState(current => {
                                    if (!current) return current;
                                    return {
                                        ...current,
                                        [targetKey]: {
                                            ...current[targetKey],
                                            id: nextStep.newId,
                                            name: nextStep.newName
                                        },
                                        [`${targetKey}FinalState`]: current[`${targetKey}FinalState`] ? {
                                            ...current[`${targetKey}FinalState`],
                                            id: nextStep.newId,
                                            name: nextStep.newName
                                        } : current[`${targetKey}FinalState`]
                                    };
                                });
                            }, 450);
                        }
                    }
                    updated.flashTarget = null;
                }

                if (updated.player.hp <= 0 || updated.enemy.hp <= 0) {
                    updated.stepQueue = [];
                    updated.activeStepPending = false;
                }
                return updated;
            }

            console.log("[Battle Animation] End");
            const reviveIfNeeded = (side, currentHp, state, otherHp) => {
                const trait = state?.trait || (side === 'player' ? monsterTraits?.trait : null);
                const usage = prev.traitUsage?.[side];
                if (currentHp > 0 || otherHp <= 0) return currentHp;
                if (!trait?.modifiers?.battleRevive) return currentHp;
                if (usage?.revives?.[trait.id]) return currentHp;
                return 1;
            };
            const rawPlayerHp = prev.playerHpAfter !== undefined ? prev.playerHpAfter : prev.player.hp;
            const rawEnemyHp = prev.enemyHpAfter !== undefined ? prev.enemyHpAfter : prev.enemy.hp;
            const finalPlayerHp = reviveIfNeeded('player', rawPlayerHp, prev.playerFinalState || prev.player, rawEnemyHp);
            const finalEnemyHp = reviveIfNeeded('enemy', rawEnemyHp, prev.enemyFinalState || prev.enemy, rawPlayerHp);
            const finalPlayerShield = prev.playerShieldAfter !== undefined ? prev.playerShieldAfter : (prev.player.shield || 0);
            const finalEnemyShield = prev.enemyShieldAfter !== undefined ? prev.enemyShieldAfter : (prev.enemy.shield || 0);

            if (finalPlayerHp <= 0 || finalEnemyHp <= 0) {
                const isWin = finalEnemyHp <= 0;
                const next = {
                    ...prev,
                    phase: 'end',
                    activeMsg: isWin ? "🏆 戰鬥勝利！" : "💀 戰體力耗盡...",
                    flashTarget: null,
                    activeStepPending: false,
                    player: {
                        ...(prev.playerFinalState || prev.player),
                        status: (prev.playerFinalState?.status !== undefined) ? prev.playerFinalState.status : prev.player.status,
                        statusTurns: (prev.playerFinalState?.statusTurns !== undefined) ? prev.playerFinalState.statusTurns : prev.player.statusTurns,
                        hp: finalPlayerHp,
                        shield: finalPlayerShield,
                        moves: (prev.playerFinalState?.moves?.length > 0) ? prev.playerFinalState.moves : prev.player.moves
                    },
                    enemy: {
                        ...(prev.enemyFinalState || prev.enemy),
                        status: (prev.enemyFinalState?.status !== undefined) ? prev.enemyFinalState.status : prev.enemy.status,
                        statusTurns: (prev.enemyFinalState?.statusTurns !== undefined) ? prev.enemyFinalState.statusTurns : prev.enemy.statusTurns,
                        hp: finalEnemyHp,
                        shield: finalEnemyShield,
                        moves: (prev.enemyFinalState?.moves?.length > 0) ? prev.enemyFinalState.moves : prev.enemy.moves
                    },
                    playerFinalState: null,
                    enemyFinalState: null
                };

                const scaling = 1 + evolutionStage * 0.2;
                const gain = Math.floor((prev.mode === 'trainer' ? 5 : 2) + scaling);

                setTimeout(() => isWin ? resolveBattleWin(gain, prev.enemy) : resolveBattleLoss(), 1500);
                return next;
            }

            const nextPhase = 'player_action';
            const finalPlayer = {
                ...(prev.playerFinalState || prev.player),
                status: (prev.playerFinalState?.status !== undefined) ? prev.playerFinalState.status : prev.player.status,
                statusTurns: (prev.playerFinalState?.statusTurns !== undefined) ? prev.playerFinalState.statusTurns : prev.player.statusTurns,
                hp: finalPlayerHp,
                shield: finalPlayerShield,
                moves: (prev.playerFinalState?.moves?.length > 0) ? prev.playerFinalState.moves : prev.player.moves
            };
            const finalEnemy = {
                ...(prev.enemyFinalState || prev.enemy),
                status: (prev.enemyFinalState?.status !== undefined) ? prev.enemyFinalState.status : prev.enemy.status,
                statusTurns: (prev.enemyFinalState?.statusTurns !== undefined) ? prev.enemyFinalState.statusTurns : prev.enemy.statusTurns,
                hp: finalEnemyHp,
                shield: finalEnemyShield,
                moves: (prev.enemyFinalState?.moves?.length > 0) ? prev.enemyFinalState.moves : prev.enemy.moves
            };

            return {
                ...prev,
                phase: nextPhase,
                activeMsg: "",
                turn: prev.turn + 1,
                flashTarget: null,
                activeStepPending: false,
                player: finalPlayer,
                enemy: finalEnemy,
                playerFinalState: null,
                enemyFinalState: null
            };
        } catch (err) {
            console.error("[Battle Animation] Fatal Error:", err);
            return { ...prev, phase: 'player_action', stepQueue: [], activeStepPending: false };
        }
    };

    const startAdventure = () => {
        const now = Date.now();
        const cdMs = debugOverrides.adventureCD !== null ? debugOverrides.adventureCD : ADV_BATTLE_RULES.CD_MS;
        const remainingCD = Math.max(0, Math.floor((lastAdvTime + cdMs - now) / 1000));

        if (remainingCD > 0) {
            updateDialogue(`我好累，讓我休息 ${remainingCD} 秒再出發吧`, true);
            return;
        }
        if (isAdvMode) return;

        setIsAdvMode(true);
        setAdvCurrentHP(1);
        const myId = getMonsterIdWrapped();

        // --- 起始播報隊列 ---
        const introLines = [
            { msg: "準備出發冒險...", hpRatio: 1 },
            { msg: "正在森林中探索...", hpRatio: 1 },
            { triggerEvent: true } // 播報完前兩行後，下一次按 B 將觸發隨機事件
        ];

        setAdvLog([introLines[0]]);
        setPendingAdvLogs(introLines.slice(1));
        setIsAdvStreaming(true);
        playBloop('heartbeat');
    };

    const executeAdventureEvent = () => {
        const myId = getMonsterIdWrapped();
        const wildBattle = generateBattleState('wild', myId);

        setAdvLog([]);
        setPendingAdvLogs([]);
        setIsAdvStreaming(false);
        setTimeout(() => {
            setBattleState({ ...wildBattle, active: true });
        }, 0);
    };

    // --- 經典回合制戰鬥引擎 ---

    // 冒險、聯盟與連線戰鬥在開場後都進入玩家選招階段。
    useEffect(() => {
        if (!battleState.active || battleState.phase !== 'intro') return;
        if (battleState.mode !== 'trainer' && battleState.mode !== 'pvp' && battleState.mode !== 'tournament') return;

        const timer = setTimeout(() => {
            setBattleState(prev => ({ ...prev, phase: 'player_action' }));
        }, battleState.encounterType === 'wild' ? 1500 : 2000);
        return () => clearTimeout(timer);
    }, [battleState.active, battleState.phase, battleState.mode, battleState.encounterType]);

    // --- 🔹 戰鬥播報自動播放引擎 🔹 ---
    useEffect(() => {
        if (!battleState.active || battleState.phase !== 'action_streaming') return;

        const currentStep = battleState.activeStepPending ? battleState.lastStep : (battleState.stepQueue.length > 0 ? battleState.stepQueue[0] : null);
        const delay = getBattleStepDelay(currentStep);

        const timer = setTimeout(() => {
            setBattleState(advanceBattleStreaming);
        }, delay);

        return () => clearTimeout(timer);
    }, [battleState.active, battleState.phase, battleState.stepQueue.length, battleState.activeStepPending, evolutionStage, monsterTraits]);


    const resolveBattleWin = (finalGain, enemy) => {
        const myId = getMonsterIdWrapped();
        const logs = [];
        const adjustedGain = applyTraitGrowthMod(finalGain, 'battleGrowth');

        logs.push({ msg: `🏆 戰鬥勝利！獲得 ${adjustedGain} 點成長。`, hpRatio: 1, iconId: myId });
        applyAdvGain(adjustedGain, logs, advCurrentHP, myId);
        recordGameAction(); // 紀錄對戰勝利
        if (battleState.encounterType === 'wild' && enemy) {
            setTodayWildDefeated(n => n + 1);
            const priority = 1;
            const prefix = '擊敗了野怪：';
            updateDiaryEvent(`${prefix}${enemy.name || '未知怪獸'}`, priority);
        }

        const isWildEncounter = battleState.encounterType === 'wild';

        const catchRate = debugOverrides.catchRate ?? 0.1;
        if (isWildEncounter && enemy && Math.random() < catchRate) {
            logs.push({ msg: `✨ 感覺 ${enemy.name || '它'} 想成為你的夥伴...`, hpRatio: 1 });
            logs.push({ promptCapture: { id: enemy.id, name: enemy.name, level: enemy.level } });
        }

        logs.push({ msg: "🚩 冒險已結束，按 [B] 返回", hpRatio: 1 });

        if (battleState.mode === 'tournament') {
            setBattleState(prev => ({ ...prev, active: false }));
            return;
        }

        if (battleState.mode === 'pvp') {
            handleBattleEnd(true);
            return; // PvP 模式不進入冒險流程
        }

        // Hide Battle UI but remain in Adventure overlay
        setBattleState(prev => ({ ...prev, active: false }));

        if (logs.length > 0) {
            // 開始手動播報流程：顯示第一行
            const firstLine = logs[0];
            setAdvLog([firstLine]);
            if (firstLine.hpRatio !== undefined) setAdvCurrentHP(firstLine.hpRatio);
            setPendingAdvLogs(logs.slice(1));
            setIsAdvStreaming(true);
        }
        playBloop('confirm');
    };

    const resolveBattleLoss = (isRun = false) => {
        if (battleState.mode === 'tournament') {
            setBattleState(prev => ({ ...prev, active: false }));
            return;
        }
        if (battleState.mode === 'pvp') {
            handleBattleEnd(false);
            return; // PvP 模式不進入冒險流程
        }

        const logs = [];
        if (!isRun) {
            setAdvCurrentHP(0);
            if (defeatTutorialEnabled) {
                setPendingDefeatTutorial('adventure');
            }
            logs.push({ msg: `💀 戰敗撤退中... 下次再調整戰術吧`, hpRatio: 0 });
        } else {
            logs.push({ msg: `💨 逃跑成功...`, hpRatio: advCurrentHP });
        }
        logs.push({ msg: "🚩 冒險已結束，按 [B] 返回", hpRatio: isRun ? advCurrentHP : 0 });

        setBattleState(prev => ({ ...prev, active: false }));

        if (logs.length > 0) {
            // 開始手動播報流程：顯示第一行
            const firstLine = logs[0];
            setAdvLog([firstLine]);
            if (firstLine.hpRatio !== undefined) setAdvCurrentHP(firstLine.hpRatio);
            setPendingAdvLogs(logs.slice(1));
            setIsAdvStreaming(true);
        }
        playBloop('confirm');
    };

    const dispatchRogueControl = key => window.dispatchEvent(new CustomEvent('rogue-control', { detail: key }));

    const handleA = () => {
        if (defeatTutorialType) {
            window.dispatchEvent(new CustomEvent('defeatTutorialNext'));
            playBloop('select');
            return;
        }
        if (isPetLetterOpen) {
            playBloop('select');
            return;
        }
        if (isExpeditionOpen) {
            dispatchRogueControl('A');
            return;
        }
        if (isCloudLoading || isEvolving) return; // 雲端同步或進化表演中禁止操作
        if (cloudChoicePrompt) {
            selectCloudChoice(1);
            playBloop('select');
            return;
        }
        if (alertMsg) {
            setAlertMsg("");
            playBloop('select');
            return;
        }
        if (isLeaderboardOpen) {
            setLeaderboardPage(prev => (prev + 1) % 10);
            playBloop('select');
            return;
        }
        if (isPvpMode && matchStatus !== 'matched') {
            playBloop('fail');
            return;
        }
        if (isSkillRearrangeOpen) {
            window.dispatchEvent(new CustomEvent('rearrangeA'));
            playBloop('select');
            return;
        }
        if (isDiaryOpen) {
            // A 鍵：日記翻到前一天
            setDiaryViewDate(prev => {
                const todayStr = getTodayStr(); // 確保邊界在地化
                const d = new Date(prev || todayStr);
                d.setDate(d.getDate() - 1);
                return getTodayStr(d);
            });
            playBloop('select');
            return;
        }
        if (tournament.isTournamentOpen && tournament.tPhase === 'champion_reward_effect') {
            tournament.setSelectedRewardEffectIdx(prev => (prev + 1) % Math.max(1, tournament.rewardOptions.length));
            playBloop('select');
            return;
        }
        if (battleState.active && (battleState.mode === 'trainer' || battleState.mode === 'pvp' || battleState.mode === 'tournament')) {
            if (battleState.phase === 'player_action') {
                // Bug Fix #3: 游標只在有效招式間循環，避免選到空格浪費操作
                const numMoves = battleState.player?.moves?.length || 1;
                setBattleState(prev => ({ ...prev, menuIdx: ((prev.menuIdx || 0) + 1) % numMoves }));
                playBloop('select');
            }
            return; // 戰鬥期間攔截 A 鍵，防止穿透
        }
        if (pendingWildCapture && !isAdvStreaming) {
            confirmWildCapture(false); // A 鍵一律為 NO
            playBloop('select');
            return;
        }
        if (isConfirmingReplace) {
            setSkillSelectIdx(prev => (prev + 1) % 2); // 0: YES, 1: NO
            playBloop('select');
            return;
        }
        if (pendingSkillLearn && !isAdvMode && !isPvpMode && !battleState.active) {
            const maxIdx = advStats.moves.length < 4 ? 2 : advStats.moves.length; // 沒滿時 0:學 1:棄; 滿了時 0-3:換 4:棄
            setSkillSelectIdx(prev => (prev + 1) % (maxIdx + 1));
            playBloop('select');
            return;
        }
        if (isStatusUIOpen || isAdvMode) return;
        if (isInventoryOpen) {
            if (inventory.length > 0) {
                setSelectedBallIdx(prev => (prev + 1) % inventory.length);
                playBloop('select');
            }
            return;
        }
        if (isConfirmingFarewell) {
            setIsConfirmingFarewell(false);
            updateDialogue("吼吼吼～");
            playBloop('back');
            return;
        }
        if (isPediaOpen) {
            if (isPediaDetailOpen) {
                setIsPediaDetailOpen(false);
            } else {
                const monsterCount = OBTAINABLE_MONSTER_IDS.length;
                setPediaIdx(prev => (prev + 1) % monsterCount);
            }
            playBloop('select');
            return;
        }
        if (isBooting) {
            setIsBooting(false);
            const isFreshStart = !initialData || (interactionCount === 0 && trainWins === 0);

            if (isFreshStart) {
                setLastEvolutionTime(Date.now());
                updateDialogue("家裡來了一隻小像素怪獸...", true);
            } else {
                updateDialogue("主人歡迎回來~", true);
            }
            playBloop('confirm');
            return;
        }

        if (pendingWildCapture && !isAdvStreaming) {
            // A 鍵在捕捉介面一律為 跳過 (NO)
            confirmWildCapture(false);
            return;
        }

        if (isDead) {
            if (!isGenerating) handleRestart();
            return;
        }
        if (miniGame) {
            if (miniGame.type === 'talk' && miniGame.status === 'question') handleTalkChoice(0);
            return;
        }
        if (isEvolving) return;


        const next = (activeIndex + 1) % menuItems.length;
        setActiveIndex(next);
        updateDialogue(menuItems[next].label);
        playBloop('select');
    };

    const handleBDown = () => {
        if (miniGame && miniGame.type === 'charge' && miniGame.status === 'idle') {
            setMiniGame(prev => ({ ...prev, status: 'charging', energy: 0 }));
        }
    };

    const handleBUp = () => {
        if (miniGame && miniGame.type === 'charge' && miniGame.status === 'charging') {
            const success = miniGame.energy >= 70 && miniGame.energy <= 85;
            handleMiniGameResult(success);
        }
    };

    const handleB = (clickIdx = null) => {
        if (defeatTutorialType) {
            setDefeatTutorialType(null);
            playBloop('confirm');
            return;
        }
        if (isPetLetterOpen) {
            window.dispatchEvent(new CustomEvent('petLetterAdvance'));
            return;
        }
        if (isCloudLoading || isEvolving) return;
        if (cloudChoicePrompt) {
            confirmCloudChoice();
            playBloop('confirm');
            return;
        }
        const currentSkillIdx = clickIdx !== null ? clickIdx : skillSelectIdx;

        // 優先級最高：技能順序調整模式
        if (isSkillRearrangeOpen) {
            window.dispatchEvent(new CustomEvent('rearrangeB'));
            return;
        }
        if (isExpeditionOpen) {
            dispatchRogueControl('B');
            return;
        }
        if (tournament.isTournamentOpen && tournament.tPhase === 'champion_reward_effect') {
            tournament.confirmChampionReward();
            return;
        }        if (battleState.active && (battleState.mode === 'pvp' || battleState.mode === 'trainer' || battleState.mode === 'tournament')) {
            if (battleState.phase === 'player_action') {
                // 防抖：0.4秒內不允許重複提交動作 (提高對戰流暢度)
                const now = Date.now();
                if (isPvpMode && (now - (window.lastPvpActionTime || 0) < 400)) return;
                window.lastPvpActionTime = now;

                const currentIdx = battleState.menuIdx || 0;
                const move = battleState.player?.moves?.[currentIdx];
                if (move) {
                    if (battleState.mode === 'pvp') {
                        submitPvpMove(move);
                    } else {
                        executeBattleTurn('attack', move);
                    }
                } else {
                    const errorMsg = battleState.mode === 'pvp' ? "尚未裝備技能！" : "該格子尚未裝備技能！";
                    const tempLogs = [...battleState.logs, errorMsg];
                    setBattleState(prev => ({ ...prev, logs: tempLogs.slice(-5) }));
                    playBloop('fail');
                }
            }
            return; // 核心修正：只要是對戰中，任何 phase 都應攔截 B 鍵，防止穿透到背景選單執行 cleanupPvp
        }
        if (isDiaryOpen) {
            // B 鍵：關閉日記
            setIsDiaryOpen(false);
            playBloop('back');
            return;
        }
        // 1. 優先處理技能學習/替換介面 (Skill Learn Overlay)
        // 增加優先級，且移除 !battleState.active 限制（允許在野外戰鬥中使用秘笈書後立即進入學習）
        if (pendingSkillLearn) {
            // 如果正在二次確認替換招式
            if (isConfirmingReplace) {
                if (currentSkillIdx === 0) { // YES (學習)
                    handleLearnSkill(pendingSkillLearn.skill.id, tempReplaceIdx);
                    setIsConfirmingReplace(false);
                    setTempReplaceIdx(-1);
                } else { // NO (不學習)
                    setIsConfirmingReplace(false);
                    setSkillSelectIdx(0);
                }
                playBloop('confirm');
                return;
            }

            // 一般學習狀態
            if (!isAdvMode && !isPvpMode) {
                const currentMoveCount = advStats.moves.length;
                if (currentMoveCount < 4) {
                    if (currentSkillIdx === 0) {
                        handleLearnSkill(pendingSkillLearn.skill.id);
                    } else {
                        setPendingSkillLearn(null);
                    }
                } else {
                    if (currentSkillIdx === 4) { // 指向「放棄」
                        setPendingSkillLearn(null);
                    } else {
                        // 指向 0, 1, 2, 3 的某個位置
                        setTempReplaceIdx(currentSkillIdx);
                        setIsConfirmingReplace(true);
                        setSkillSelectIdx(0); // 預設跳到 否 (0)
                    }
                }
                playBloop('confirm');
                return;
            }
        }
        if (isConfirmingFarewell) {
            confirmFarewellAction();
            return;
        }
        if (isDead) {
            if (!isGenerating) handleRestart();
            return;
        }

        // --- 聯盟大賽手動轉場 ---
        if (tournament.isTournamentOpen && ['intro', 'bracket', 'battle_intro', 'champion', 'lost'].includes(tournament.tPhase)) {
            tournament.nextTournamentPhase();
            playBloop('confirm');
            return;
        }

        if (isEvolving || isAdvMode) {
            // --- 戰鬥播報模式 (Step-by-Step) ---
            if (battleState?.active) {
                return; // 戰鬥期間（包含 intro, player_action, streaming, end）B 鍵都不應觸發冒險結束
            }

            if (isAdvStreaming && (pendingAdvLogs?.length || 0) >= 0) {
                if (pendingAdvLogs.length > 0) {
                    const nextLine = pendingAdvLogs[0];

                    // --- 特殊標記處理：觸發隨機事件 ---
                    if (nextLine.triggerEvent) {
                        setPendingAdvLogs([]);
                        setIsAdvStreaming(false);
                        executeAdventureEvent();
                        return;
                    }

                    // --- 特殊標記處理：觸發戰鬥介面 (手動 B 鍵確認後) ---
                    if (nextLine.triggerBattle) {
                        setPendingAdvLogs([]);
                        setIsAdvStreaming(true); // 保持播報鎖定狀態，背景顯示冒險畫面，前景給戰鬥 UI
                        setBattleState({ ...nextLine.triggerBattle, active: true });
                        return;
                    }

                    if (nextLine.promptCapture) {
                        setIsAdvStreaming(false);
                        setPendingWildCapture(nextLine.promptCapture);
                        setPendingAdvLogs([]);
                    } else {
                        setAdvLog(prev => [...prev.filter(l => l.msg), nextLine]);
                        if (nextLine.hpRatio !== undefined) setAdvCurrentHP(nextLine.hpRatio);
                        setPendingAdvLogs(prev => prev.slice(1));
                        playBloop('confirm');
                    }
                    return;
                } else {
                    // 日誌完全按完了，只有在此時按下 B 鍵才會正式結束冒險
                    setIsAdvStreaming(false);
                    setIsAdvMode(false);
                    setLastAdvTime(Date.now());
                    updateDialogue("冒險結束。");
                    if (pendingDefeatTutorial && defeatTutorialEnabled) {
                        setDefeatTutorialType(pendingDefeatTutorial);
                        setPendingDefeatTutorial(null);
                    } else if (pendingDefeatTutorial) {
                        setPendingDefeatTutorial(null);
                    }
                    playBloop('confirm');
                    return;
                }
            }

            if (pendingWildCapture && !isAdvStreaming) {
                confirmWildCapture(true); // B 鍵一律為 接受 (YES)
                return; // 介面中需阻斷
            }
            // ❌ 移除原本廣義的 return，讓 B 鍵在平常走路時能傳給下面的摸摸邏輯
        }

        if (miniGame) {
            if (miniGame.status === 'result') return;
            if (miniGame.type === 'talk' && miniGame.status === 'question') {
                handleTalkChoice(1);
                return;
            }

            if (miniGame.type === 'reaction') {
                const now = Date.now();
                const diff = miniGame.targetTime - now;
                if (Math.abs(diff) <= 1000) {
                    handleMiniGameResult(true);
                } else {
                    handleMiniGameResult(false);
                }
            } else if (miniGame.type === 'charge_click') {
                if (miniGame.status === 'idle') {
                    setMiniGame(prev => ({ ...prev, status: 'clicking', startTime: Date.now() }));
                } else if (miniGame.status === 'clicking') {
                    const nextEnergy = Math.min(100, miniGame.energy + 20);
                    if (nextEnergy >= 100) {
                        handleMiniGameResult(true);
                    } else {
                        setMiniGame(prev => ({ ...prev, energy: nextEnergy }));
                    }
                }
            } else if (miniGame.type === 'spin') {
                if (miniGame.status === 'idle') {
                    setMiniGame(prev => ({ ...prev, status: 'spinning' }));
                } else if (miniGame.status === 'spinning') {
                    const isGood = miniGame.currentIdx % 2 === 0;
                    handleMiniGameResult(isGood);
                }
            } else if (miniGame.type === 'spin_heart') {
                if (miniGame.status === 'idle') {
                    setMiniGame(prev => ({ ...prev, status: 'spinning' }));
                } else if (miniGame.status === 'spinning') {
                    const isHeart = miniGame.items[miniGame.currentIdx] === 'redHeart';
                    handleMiniGameResult(isHeart);
                }
            }
            return;
        }

        if (isStatusUIOpen) {
            return;
        }
        if (isInventoryOpen) {
            if (inventory.length > 0) {
                switchPokemonBall(selectedBallIdx);
            }
            return;
        }




        if (isPediaOpen) {
            if (isPediaDetailOpen) {
                setIsPediaDetailOpen(false);
            } else {
                const monsterId = OBTAINABLE_MONSTER_IDS[pediaIdx];
                if (ownedMonsters.includes(String(monsterId))) {
                    setIsPediaDetailOpen(true);
                } else {
                    updateDialogue("尚未解鎖此怪獸的詳細資訊...", true);
                    playBloop('fail');
                    return;
                }
            }
            playBloop('confirm');
            return;
        }

        if (activeIndex === -1 && unreadPetLetter && !isPetLetterOpen) {
            openPetLetter();
            return;
        }

        if (activeIndex === -1) {
            velRef.current = { x: velRef.current.x, y: -4.0 };
            updateDialogue("抓到你了！");
            logEvent("玩家進行了主動摸摸。");
            return;
        }
        executeAction(menuItems[activeIndex].id);
    };

    const handleC = () => {
        if (defeatTutorialType) {
            setDefeatTutorialType(null);
            playBloop('back');
            return;
        }
        if (isPetLetterOpen) {
            if (unreadPetLetter) markCurrentPetLetterRead(unreadPetLetter.id);
            setIsPetLetterOpen(false);
            playBloop('back');
            return;
        }
        if (isSkillRearrangeOpen) {
            window.dispatchEvent(new CustomEvent('rearrangeC'));
            return;
        }
        if (isExpeditionOpen) {
            dispatchRogueControl('C');
            return;
        }
        if (isCloudLoading || isEvolving) return; // 雲端同步或進化表演中禁止操作
        if (cloudChoicePrompt) {
            dismissCloudChoice();
            playBloop('back');
            return;
        }
        if (alertMsg) return; // 警告視窗顯示時，C 鍵完全鎖定不執行任何動作
        if (isLeaderboardOpen) {
            setIsLeaderboardOpen(false);
            setAlertMsg("");
            playBloop('back');
            return;
        }
        if (isPvpMode) {
            if (matchStatus !== 'matched') {
                cleanupPvp("離開連線大廳。");
            } else {
                updateDialogue("對戰中無法逃跑！", true);
            }
            playBloop('back');
            return;
        }
        if (isDiaryOpen) {
            // C 鍵：翻到後一天（不超過今天）
            const todayStr = getTodayStr();
            setDiaryViewDate(prev => {
                const current = prev || todayStr;
                if (current >= todayStr) return todayStr;
                const d = new Date(current);
                d.setDate(d.getDate() + 1);
                return getTodayStr(d);
            });
            playBloop('select');
            return;
        }
        if (battleState.active && (battleState.mode === 'trainer' || battleState.mode === 'pvp' || battleState.mode === 'tournament') && battleState.phase === 'player_action') {
            // 返回上層選單（因為目前沒有上層，所以提示無法返回或不做事）
            const tempLogs = [...battleState.logs, "無法返回！"];
            setBattleState(prev => ({ ...prev, logs: tempLogs.slice(-5) }));
            playBloop('back');
            return;
        }
        if (isAdvMode) {
            // 為了防止 BUG 與確保結算完整，冒險中禁止使用 C 鍵直接離開
            // 同時提示玩家需使用 B 鍵完成日誌
            const msg = isAdvStreaming ? "請點按 B 鍵讀完日誌！" : "冒險中請遵循路徑！";
            const currentLogs = battleState.active ? battleState.logs : (isAdvStreaming ? advLog.map(l => l.msg) : []);
            if (isAdvStreaming) {
                // 如果在播報，暫時在 dialogue 提示
                updateDialogue(msg, true);
            }
            playBloop('fail');
            return;
        }
        if (isConfirmingReplace) {
            setIsConfirmingReplace(false);
            setSkillSelectIdx(0);
            playBloop('select');
            return;
        }
        if (pendingSkillLearn && !isAdvMode && !isPvpMode && !battleState.active) {
            setPendingSkillLearn(null);
            playBloop('select');
            return;
        }
        if (isStatusUIOpen) {
            setIsStatusUIOpen(false);
            updateDialogue("吼吼吼～");
            playBloop('back');
            return;
        }
        if (isInventoryOpen) {
            setIsInventoryOpen(false);
            updateDialogue("吼吼吼～");
            playBloop('back');
            return;
        }


        if (isPediaOpen) {
            if (isPediaDetailOpen) {
                setIsPediaDetailOpen(false);
            } else {
                setIsPediaOpen(false);
            }
            playBloop('select');
            return;
        }
        if (isConfirmingFarewell) {
            setIsConfirmingFarewell(false);
            updateDialogue("吼吼吼～");
            playBloop('back');
            return;
        }
        if (miniGame) {
            if (miniGame.status === 'result') return;
            if (miniGame.type === 'talk' && miniGame.status === 'question') {
                handleTalkChoice(2);
                return;
            }
            setMiniGame(null);
            updateDialogue("吼吼吼～");
            return;
        }
        if (isDead) return;
        setActiveIndex(-1);
        updateDialogue("吼吼吼～");
    };

    const executeAction = (id) => {
        switch (id) {
            case 'pedia':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                setIsPediaOpen(true);
                setPediaIdx(0);
                setIsPediaDetailOpen(false);
                updateDialogue("圖鑑系統開啟。", true);
                playBloop('confirm');
                break;
            case 'skills':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isExpeditionOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                setStatusPage('moves');
                setIsStatusUIOpen(true);
                updateDialogue("查看技能中...", true);
                playBloop('confirm');
                break;
            case 'talk':
                setIsExpeditionOpen(true);
                recordGameAction();
                logEvent("開始無限波次挑戰。");
                playBloop('confirm');
                break;


            case 'status':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isExpeditionOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                setStatusPage('stats');
                setIsStatusUIOpen(true);
                updateDialogue("查看狀態中...", true);
                playBloop('confirm');
                break;
            case 'tournament':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isExpeditionOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                setIsPvpMode(false);
                tournament.startTournament();
                logEvent("報名聯盟大賽。");
                setActiveIndex(-1);
                playBloop('confirm');
                break;
            case 'connect':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isExpeditionOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                cleanupPvp();
                setIsPvpMode(true);
                recordGameAction(); // 進入連線大廳預扣一動作
                syncMatchStatus('idle');
                updateDialogue("宇宙連線大廳", true);
                logEvent(`進入連線大廳`);
                playBloop('confirm');
                break;
            case 'info':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isExpeditionOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                setIsInventoryOpen(true);
                setSelectedBallIdx(0);
                updateDialogue("查看背包中...", true);
                playBloop('confirm');
                break;
            case 'adventure':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isExpeditionOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                startAdventure();
                playBloop('confirm');
                break;
            default:
                updateDialogue("開發中");
        }
    };

    // --- 進化表演結束回調 ---
    const handleEvolutionFinish = () => {
        const evolvedId = Number(window._evolvedId) || currentMonsterId;
        const evolvedName = MONSTER_NAMES[evolvedId] || 'Pokémon';

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        updateDiaryEvent(`${timeStr} 分進化成了：${evolvedName}`, 3);
        setTodayHasEvolved(true);
        setCurrentMonsterId(evolvedId);
        setMonsterTraits(generateMonsterTraits(evolvedId));
        setEvolutionStage(getPokemonEvolutionStage(evolvedId));
        setEvolutionBranch(`WILD_${evolvedId}`);
        setLastEvolutionTime(Date.now());
        setStageTrainWins(0);
        setIsEvolving(false);
        setEvolutionDetails(null);
        updateDialogue('進化成功！');
        unlockMonster(evolvedId);

        recordGameAction();
        delete window._evolvedId;
    };

    useEffect(() => {
        if (isBooting || isDead || isEvolving || miniGame || isRunaway || isDuplicateTab) return;

        const checkEvolutionInterval = setInterval(() => {
            if (document.hidden) return;
            // Pokémon 不會因經過時間自然死亡，只檢查固定等級進化。

            const currentId = getMonsterIdWrapped();
            const evolvedId = getNextPokemonEvolution(currentId);
            const targetLevel = debugOverrides.evolutionMs ? 1 : getPokemonEvolutionLevel(currentId);

            if (evolvedId && targetLevel && derivedLevel >= targetLevel) {
                clearInterval(checkEvolutionInterval);
                setEvolutionDetails({ fromId: currentId, toId: evolvedId });

                const assetId = MONSTER_ASSET_IDS[evolvedId] || evolvedId;
                const base = import.meta.env.BASE_URL;
                const img = new Image();
                img.src = `${base}assets/exclusive/idle/${assetId}.gif`;

                setIsEvolving(true);
                updateDialogue('進化中！！');
                window._evolvedId = evolvedId;
            }
        }, 500);

        return () => clearInterval(checkEvolutionInterval);
    }, [isBooting, isDead, isEvolving, derivedLevel, miniGame, isRunaway, debugOverrides, isDuplicateTab, currentMonsterId]);

    useEffect(() => {
        if (!miniGame || miniGame.status === 'result') return;

        const interval = setInterval(() => {
            if (document.hidden) return;
            if (miniGame.type === 'reaction') {
                const now = Date.now();
                const diff = miniGame.targetTime - now;

                setMiniGame(prev => {
                    if (!prev || prev.status === 'result') return prev;
                    let ns = { ...prev };

                    if (prev.status === 'ready' && diff <= 3000) {
                        ns.status = 'countdown';
                        ns.count = 3;
                    } else if (prev.status === 'countdown') {
                        const sec = Math.ceil(diff / 1000);
                        if (sec <= 0) {
                            ns.status = 'go';
                            ns.count = 0;
                        } else {
                            ns.count = sec;
                        }
                    } else if (prev.status === 'go' && diff < -1000) {
                        handleMiniGameResult(false);
                        return ns;
                    }
                    return ns;
                });
            } else if (miniGame.type === 'charge') {
                setMiniGame(prev => {
                    if (!prev || prev.status !== 'charging') return prev;
                    let nextE = prev.energy + 3;
                    if (nextE >= 100) {
                        handleMiniGameResult(false);
                        return { ...prev, energy: 100, status: 'result' };
                    }
                    return { ...prev, energy: nextE };
                });
                if (miniGame.status === 'charging') {
                    posRef.current = { x: 128 + (Math.random() - 0.5) * 4, y: 190 + (Math.random() - 0.5) * 4 };
                }
            } else if (miniGame.type === 'spin') {
                if (miniGame.status === 'spinning') {
                    setMiniGame(prev => {
                        if (prev.status !== 'spinning') return prev;
                        let nextTick = (prev.tick || 0) + 1;
                        if (nextTick >= 2) {
                            return { ...prev, currentIdx: (prev.currentIdx + 1) % prev.items.length, tick: 0 };
                        }
                        return { ...prev, tick: nextTick };
                    });
                }
            } else if (miniGame.type === 'spin_heart') {
                if (miniGame.status === 'spinning') {
                    setMiniGame(prev => {
                        if (prev.status !== 'spinning') return prev;
                        let nextTick = (prev.tick || 0) + 1;
                        if (nextTick >= 13) {
                            return { ...prev, currentIdx: (prev.currentIdx + 1) % prev.items.length, tick: 0 };
                        }
                        return { ...prev, tick: nextTick };
                    });
                }
            }
        }, 50);

        return () => clearInterval(interval);
    }, [miniGame?.status, miniGame?.type, miniGame?.targetTime, miniGame?.startTime]);

    // --- 冒險 CD 計時器 ---
    useEffect(() => {
        const timer = setInterval(() => {
            if (document.hidden) return;
            const now = Date.now();
            const diff = Math.max(0, Math.floor((lastAdvTime + ADV_BATTLE_RULES.CD_MS - now) / 1000));
            setAdvCD(diff);
        }, 1000);
        return () => clearInterval(timer);
    }, [lastAdvTime]);

    // --- 冒險日誌自動捲動 ---
    useEffect(() => {
        if (advLogRef.current) {
            advLogRef.current.scrollTop = advLogRef.current.scrollHeight;
        }
    }, [advLog]);

    // --- 🔹 戰鬥引擎與對手生成 🔹 ---
    function generateBattleState(mode, myId, pvpOpponentData = null) {
        const level = getLevelByPower(advStats.basePower);
        const speciesId = getMonsterIdWrapped();

        const playerProfile = buildPlayerBattleProfile({
            advStats,
            calcFinalStat,
            getLevelByPower,
            monsterTraits,
            skillDatabase: SKILL_DATABASE,
            speciesBaseStats: SPECIES_BASE_STATS,
            speciesId,
        });
        const pMaxHP = playerProfile.hp;
        const pATK = playerProfile.atk;
        const pDEF = playerProfile.def;
        const pSPD = playerProfile.spd;
        const pType = playerProfile.type;
        const pMoves = playerProfile.moves;

        let enemyData;
        let eMaxHP, eATK, eDEF, eSPD, eType, eLevel;
        let resultState;

        if (mode === 'wild') {
            // 自動根據池子數量分配平等的出現機率 (1/N)
            enemyData = ADV_WILD_POOL[Math.floor(Math.random() * ADV_WILD_POOL.length)];
            const eStatsRef = SPECIES_BASE_STATS[String(enemyData.id)] || { types: ['normal'] };
            eType = eStatsRef.types;
            // 冒險野怪一律使用普通配置，等級維持在玩家同行怪獸等級以下。
            eLevel = Math.max(1, Math.min(100, level, Math.floor(level * (0.7 + Math.random() * 0.2))));

            // 野生怪隨機分配 IV。
            const eIVs = { hp: Math.floor(Math.random() * 32), atk: Math.floor(Math.random() * 32), def: Math.floor(Math.random() * 32), spd: Math.floor(Math.random() * 32) };
            const eEVs = { hp: eLevel * 2, atk: eLevel * 2, def: eLevel * 2, spd: eLevel * 2 };

            eMaxHP = calcFinalStat('hp', enemyData.id, eIVs.hp, eEVs.hp, eLevel);
            eATK = calcFinalStat('atk', enemyData.id, eIVs.atk, eEVs.atk, eLevel);
            eDEF = calcFinalStat('def', enemyData.id, eIVs.def, eEVs.def, eLevel);
            eSPD = calcFinalStat('spd', enemyData.id, eIVs.spd, eEVs.spd, eLevel);

            const initMsg = `野生 ${enemyData.name}（等級 ${eLevel}） 跳了出來！`;
            const eMoves = generateMoves(enemyData.id, eLevel).map(id => SKILL_DATABASE[id]).filter(Boolean);
            const eMoveUpgrades = {};
            resultState = {
                active: true, mode: 'trainer', encounterType: 'wild', phase: 'intro', turn: 1,
                player: {
                    hp: pMaxHP, maxHp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, id: myId, type: pType, moves: pMoves, level: level,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0, moveUpgrades: advStats.moveUpgrades || {},
                    protectLeft: 3,
                    rogueEffects: { lifesteal: 0, reflect: 0, shield: 0, haste: 1.0 },
                    trait: monsterTraits?.trait || null
                },
                enemy: {
                    id: enemyData.id, name: enemyData.name, hp: eMaxHP, maxHp: eMaxHP, atk: eATK, def: eDEF, spd: eSPD, level: eLevel, type: eType, moves: eMoves,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0,
                    moveUpgrades: eMoveUpgrades,
                    protectLeft: 3,
                    rogueEffects: { lifesteal: 0, reflect: 0, shield: 0, haste: 1.0 },
                    trait: null
                },
                logs: [initMsg], initMsg,
                stepQueue: [], activeMsg: "", flashTarget: null, menuIdx: 0,
                traitUsage: { player: { revives: {}, eightGatesEnded: false }, enemy: { revives: {}, eightGatesEnded: false } }
            };
        } else if (mode === 'pvp' && pvpOpponentData) {
            eLevel = Math.min(100, pvpOpponentData?.stats?.level || level);
            const enemyData = pvpOpponentData;

            // 使用對手傳來的原始數據，完全排除本地進化或模式修正
            eMaxHP = (enemyData?.stats?.hp) || 150;
            eATK = (enemyData?.stats?.atk) || 80;
            eDEF = (enemyData?.stats?.def) || 50;
            eSPD = (enemyData?.stats?.spd) || 90;
            eType = enemyData?.type || 'normal';
            // 重要：一定要使用傳過來的招式，而非本地生成的
            const rawEnemyMoves = enemyData?.moves || generateMoves(enemyData?.id || 4, eLevel);
            const eMoves = rawEnemyMoves.map(m => {
                if (typeof m === 'string') return SKILL_DATABASE[m];
                if (typeof m === 'object' && m !== null) return m; // 已經是物件了，直接用
                return null;
            }).filter(Boolean);
            if (eMoves.length === 0) eMoves.push(SKILL_DATABASE.tackle);

            const initMsg = `連線成功！${enemyData?.name || '對手'}（等級 ${eLevel}） 降臨！`;
            resultState = {
                active: true, mode: 'pvp', phase: 'intro', turn: 1,
                player: {
                    hp: pMaxHP, maxHp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, id: myId, type: pType, moves: pMoves, level: level,
                    name: user?.displayName || "玩家",
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0,
                    moveUpgrades: advStats.moveUpgrades || {},
                    rogueEffects: { lifesteal: 0, reflect: 0, shield: 0, haste: 1.0 },
                    protectLeft: 3,
                    trait: monsterTraits?.trait || null
                },
                enemy: {
                    id: enemyData?.id || 4, name: (enemyData?.name || '對手'), hp: eMaxHP, maxHp: eMaxHP, atk: eATK, def: eDEF, spd: eSPD, level: eLevel, isPvp: true, type: eType, moves: eMoves,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0,
                    moveUpgrades: enemyData?.moveUpgrades || {},
                    rogueEffects: { lifesteal: 0, reflect: 0, shield: 0, haste: 1.0 },
                    protectLeft: 3,
                    trait: enemyData?.trait || null
                },
                logs: [initMsg], initMsg,
                stepQueue: [], activeMsg: "", flashTarget: null, menuIdx: 0,
                traitUsage: { player: { revives: {}, eightGatesEnded: false }, enemy: { revives: {}, eightGatesEnded: false } }
            };
        } else {
            throw new Error(`Unsupported battle mode: ${mode}`);
        }

        // --- 預先載入戰鬥圖片，消除載入延遲 ---
        resultState.traitRevivesUsed = {};
        resultState.traitEffects = {};

        const base = import.meta.env.BASE_URL;
        // 預載玩家背面 GIF
        const pAssetId = MONSTER_ASSET_IDS[resultState.player.id] || resultState.player.id;
        const pImg = new Image();
        pImg.src = `${base}assets/exclusive/back/${pAssetId}.gif`;
        // 預載敵人正面 GIF
        const eAssetId = MONSTER_ASSET_IDS[resultState.enemy.id] || resultState.enemy.id;
        const eImg = new Image();
        eImg.src = `${base}assets/exclusive/idle/${eAssetId}.gif`;


        return applyOpeningTraitEffects(resultState);
    };



    const applyAdvGain = (points, log, currentHP, myId) => {
        let hpEV = 0;
        let atkEV = 0;
        let defEV = 0;
        let spdEV = 0;

        for (let i = 0; i < points; i++) {
            const r = Math.random();
            // 每 1 點獎勵 = 4 努力值 (EV)
            if (r < 0.40) { hpEV += 4; log.push({ msg: "+ 體力潛能提升", hpRatio: currentHP, iconId: myId }); }
            else if (r < 0.65) { atkEV += 4; log.push({ msg: "+ 攻擊潛能提升", hpRatio: currentHP, iconId: myId }); }
            else if (r < 0.90) { defEV += 4; log.push({ msg: "+ 防禦潛能提升", hpRatio: currentHP, iconId: myId }); }
            else { spdEV += 4; log.push({ msg: "+ 速度潛能提升", hpRatio: currentHP, iconId: myId }); }
        }

        setAdvStats(prev => {
            const nextEVs = { ...prev.evs };
            // 努力值上限檢查：單項 252, 總和 510
            const updateEV = (key, val) => {
                const currentTotal = Object.values(nextEVs).reduce((a, b) => a + b, 0);
                const canAdd = Math.min(val, 510 - currentTotal, 252 - nextEVs[key]);
                if (canAdd > 0) nextEVs[key] += canAdd;
            };

            updateEV('hp', hpEV);
            updateEV('atk', atkEV);
            updateEV('def', defEV);
            updateEV('spd', spdEV);

            return {
                ...prev,
                evs: nextEVs,
                basePower: prev.basePower + points * 2
            };
        });
        recordGameAction(); // ✨ 修正：確保冒險獲取的戰力能觸發雲端同步
    };

    // 背包只負責切換寶可夢球；舊道具使用流程已移除。

    const triggerFarewell = () => {
        // 防呆：僅限主畫面使用 (防止在戰鬥、冒險、特訓、談心、選單中產生邏輯衝突)
        if (defeatTutorialType || isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isExpeditionOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
            setAlertMsg("此功能僅限在主畫面使用");
            playBloop('fail');
            return;
        }
        setIsConfirmingFarewell(true);
        updateDialogue("確定要終止生命嗎？", true);
    };

    const handleConfirmRearrange = (newMoves) => {
        setAdvStats(prev => ({ ...prev, moves: newMoves }));
        setIsSkillRearrangeOpen(false);

        updateDialogue("技能順序調整完成！");
        recordGameAction();
        playSoundEffect('success');
    };

    const handleLearnSkill = (newSkillId, replaceIdx = -1) => {
        setAdvStats(prev => {
            const nextMoves = [...(prev.moves || [])];
            if (replaceIdx === -1) {
                // 直接學習 (不足4招)
                if (nextMoves.length < 4) {
                    nextMoves.push(newSkillId);
                }
            } else {
                // 替換招式 → 清除被替換技能的附魔數據
                const oldMoveId = nextMoves[replaceIdx];
                nextMoves[replaceIdx] = newSkillId;
                if (oldMoveId && prev.moveUpgrades?.[oldMoveId]) {
                    const nextUpgrades = { ...(prev.moveUpgrades || {}) };
                    delete nextUpgrades[oldMoveId];
                    return { ...prev, moves: nextMoves, moveUpgrades: nextUpgrades };
                }
            }
            return { ...prev, moves: nextMoves };
        });
        setPendingSkillLearn(null);
        recordGameAction(); // ✨ 修正：確保學習招式後能觸發雲端同步
        playBloop('success');
        updateDialogue("學會了新招式！");
    };

    const confirmFarewellAction = () => {
        setIsConfirmingFarewell(false);
        playBloop('confirm');
        // 不再抽死亡進化線；下一代會從固定進化鏈首階隨機產生。
        setDeathBranch(null);
        setIsGenerating(true);
        setIsDead(true);

        setTimeout(() => {
            let words = "";
            if (evolutionStage >= 5) {
                words = "我的靈魂永遠與你同在，搭檔。";
            } else if (evolutionStage >= 4) {
                words = "謝謝你陪我走到最後一刻...";
            } else if (mood < 30) {
                words = "來生再見了...希望你好好的...";
            } else if (trainWins > 10) {
                words = "我的戰鬥已經結束了！沒有遺憾！";
            } else {
                words = "這段陪伴的時光很開心！謝謝你！";
            }

            setFinalWords(words);
            setIsGenerating(false);
            updateDialogue(words);
        }, 1500);
        setTimeout(() => {
            setShowRestartHint(true);
        }, 2500);
    };

    // 監聽任意按鍵重新開始
    useEffect(() => {
        if (!isDead || !finalWords) return;
        const handler = () => handleRestart();
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isDead, finalWords]);

    const handleRestart = () => {
        const nextId = drawRandomPokemonStarter();

        setIsBooting(true); // 觸發啟動彩蛋畫面
        setBootMonsterId(prev => drawBootMonsterId(bootMonsterPoolRef, prev)); // 重新開機隨機抽一個未重複 ID

        setHunger(60);
        setMood(50);
        setIsSleeping(false);
        setIsPooping(false);
        setTrainWins(0);
        setInteractionLogs([]);
        setInteractionCount(0);
        setIsGenerating(false);
        setIsDead(false);
        setFinalWords("");
        setShowRestartHint(false);
        posRef.current = { x: 128, y: 128 };
        velRef.current = { x: 0.6, y: 0.4 };
        setSteps(0);
        setLastEvolutionTime(Date.now());
        setBirthTime(Date.now());
        setStageTrainWins(0);
        setMiniGame(null);
        setActiveIndex(-1);
        setFeedCount(0);
        setDeathBranch(null); // 重置 D線籤
        setPetLetters(normalizePetLetters(null));

        // --- 修正戰力與技能繼承邏輯 ---
        // 取得死前等級，最高上限以 100 級為基準進行繼承計算
        const prevPower = latestStats.current.advStats?.basePower || 100;
        const prevLevel = getLevelByPower(prevPower);

        // 改為用等級去繼承：每級提供 1 點額外初始戰力 (最高繼承 99 點，即下一代從 10 級開始)
        const inheritedPower = Math.max(0, prevLevel - 1);

        // 新生怪獸只使用該物種依目前繼承等級可學會的正式招式，不再繼承其他物種技能。
        const nextLevel = getLevelByPower(100 + inheritedPower);
        const combinedMoves = generateMoves(nextId, nextLevel);
        // --- 遺傳繼承：從前代個體值中挑選最強的三項繼承 ---
        const prevIVs = latestStats.current.advStats?.ivs || { hp: 0, atk: 0, def: 0, spd: 0 };
        const inheritedIVEntries = Object.entries(prevIVs)
            .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
            .slice(0, 3);

        const nextIVs = {
            hp: Math.floor(Math.random() * 32),
            atk: Math.floor(Math.random() * 32),
            def: Math.floor(Math.random() * 32),
            spd: Math.floor(Math.random() * 32)
        };
        inheritedIVEntries.forEach(([statKey, statValue]) => {
            nextIVs[statKey] = Number(statValue || 0);
        });

        setAdvStats({
            basePower: 100 + inheritedPower,
            ivs: nextIVs,
            evs: { hp: 0, atk: 0, def: 0, spd: 0 },
            moves: combinedMoves,
            moveUpgrades: {}
        });

        // 給予玩家反饋提示
        if (inheritedPower > 0) {
            updateDialogue(`繼承了前代的 ${inheritedPower} 點戰力，並依新物種取得正式招式！`, true);
        } else {
            updateDialogue("新的一天開始了！", true);
        }

        // 死亡後不重置 bondValue 與 talkCount 即可繼承
        const inheritedBond = Math.floor((latestStats.current.bondValue || 0) * 0.2);
        const prevAffinity = latestStats.current.lockedAffinity;

        setBondValue(inheritedBond);
        setTalkCount(0);
        setLockedAffinity(null);
        setSoulAffinityCounts({
            fire: prevAffinity === 'fire' ? 1 : 0,
            water: prevAffinity === 'water' ? 1 : 0,
            grass: prevAffinity === 'grass' ? 1 : 0,
            bug: prevAffinity === 'bug' ? 1 : 0
        });

        // --- 🔹 防呆：重生與重置時的天賦轉換 🔹 ---
        // 依下一隻 Pokémon 的正式特性池重新抽取特性。
        // 重製生命時重新抽取一般天賦，避免沿用前一隻的專屬狀態。
        setMonsterTraits(generateMonsterTraits(nextId));

        setCurrentMonsterId(nextId);
        setEvolutionStage(1);
        setEvolutionBranch(`WILD_${nextId}`);
        setDialogue(`新的夥伴是${MONSTER_NAMES[String(nextId)] || '像素怪獸'}！`);

        // 🔥 VERY IMPORTANT: Remove localStorage data immediately!
        try { clearPersistedSaveData(); } catch (e) { }
        try { sessionStorage.removeItem('pixel_monster_save'); } catch (e) { }

        recordGameAction(); // 紀錄重啟行為
    };



    // 正式流程直接使用目前 Pokémon ID；舊 monsterIdMapper 只在初始化舊存檔時使用。
    const getMonsterIdWrapped = () => currentMonsterId;

    useEffect(() => {
        if (debugOverrides.weatherStatus) {
            setWeatherContext(createDebugWeatherContext(debugOverrides.weatherStatus));
            return;
        }
        if (isBooting || isDead || isDuplicateTab) return;

        let cancelled = false;
        fetchWeatherContext()
            .then(weather => {
                if (!cancelled) setWeatherContext(weather);
            })
            .catch(error => {
                if (!cancelled) setWeatherContext(prev => prev?.status && prev.status !== 'unknown' ? prev : createEmptyWeatherContext(error?.message || 'weather_unavailable'));
            });
        return () => {
            cancelled = true;
        };
    }, [isBooting, isDead, isDuplicateTab, debugOverrides.weatherStatus]);

    useEffect(() => {
        if (isBooting || isDuplicateTab) return;
        let cancelled = false;
        fetchDailyTopics()
            .then(topics => {
                if (!cancelled) setDailyTopics(topics);
            })
            .catch(() => {
                if (!cancelled) setDailyTopics(createFallbackDailyTopics());
            });
        return () => {
            cancelled = true;
        };
    }, [isBooting, isDuplicateTab]);

    const refreshExternalLetterContext = async () => {
        clearCachedWeatherContext();
        clearCachedDailyTopics();
        try {
            const [weather, topics] = await Promise.all([
                debugOverrides.weatherStatus ? Promise.resolve(createDebugWeatherContext(debugOverrides.weatherStatus)) : fetchWeatherContext({ force: true }),
                fetchDailyTopics(new Date(), { force: true })
            ]);
            setWeatherContext(weather);
            setDailyTopics(topics);
            updateDialogue("已重抓外部資訊。");
        } catch (error) {
            setDailyTopics(createFallbackDailyTopics());
            updateDialogue(`外部資訊重抓失敗：${error?.message || '未知錯誤'}`);
        }
    };

    useEffect(() => {
        if (!petLettersEnabled || isBooting || isDead || isDuplicateTab) return;

        const refresh = () => {
            const letterNow = new Date();
            if (Number.isFinite(debugOverrides.petLetterHour)) {
                letterNow.setHours(debugOverrides.petLetterHour, 0, 0, 0);
            }
            const currentMonsterId = getMonsterIdWrapped();
            const moveUpgradeValues = Object.values(advStats?.moveUpgrades || {}).map(value => Number(value || 0)).filter(value => value > 0);
            setPetLetters(prev => refreshPetLetters(prev, {
                monsterName: MONSTER_NAMES[String(currentMonsterId)] || '像素怪獸',
                monsterId: currentMonsterId,
                hunger,
                mood,
                bondValue,
                derivedLevel,
                todayTrainWins,
                todayWildDefeated,
                todayFeedCount,
                todayHasEvolved,
                todaySpecialEvent,
                moveUpgradeCount: moveUpgradeValues.length,
                maxMoveUpgradeLevel: moveUpgradeValues.length ? Math.max(...moveUpgradeValues) : 0,
                pokemonBallCount: inventory.length,
                evolutionStage,
                traitName: monsterTraits?.trait?.name || null,
                lastPlayerReply: petLetters?.lastPlayerReply || null,
                aiEnabled: isPetLetterAiEnabled() && Boolean(user),
                weatherContext,
                dailyTopics,
                monsterTypes: SPECIES_BASE_STATS[String(currentMonsterId)]?.types || []
            }, letterNow));
        };

        refresh();
        const timer = setInterval(refresh, 60 * 1000);
        return () => clearInterval(timer);
    }, [petLettersEnabled, isBooting, isDead, isDuplicateTab, evolutionBranch, evolutionStage, hunger, mood, bondValue, derivedLevel, todayTrainWins, todayWildDefeated, todayFeedCount, todayHasEvolved, todaySpecialEvent, advStats?.moveUpgrades, inventory.length, monsterTraits, petLetters?.lastPlayerReply, debugOverrides.petLetterHour, weatherContext, dailyTopics, user]);

    const unreadPetLetter = petLettersEnabled ? getUnreadPetLetter(petLetters) : null;
    const pendingAiPetLetter = petLettersEnabled ? getPendingAiPetLetter(petLetters) : null;
    const getDailyTopicForLetterSlot = (slotId) => {
        const topicKeyBySlot = { morning: 'news', noon: 'history', night: 'tarot' };
        return dailyTopics?.topics?.[topicKeyBySlot[slotId] || slotId] || null;
    };

    useEffect(() => {
        if (!petLettersEnabled || !pendingAiPetLetter || !user || !isPetLetterAiEnabled() || isBooting || isDead || isDuplicateTab) return;
        if (aiPetLetterRequestsRef.current.has(pendingAiPetLetter.id)) return;

        aiPetLetterRequestsRef.current.add(pendingAiPetLetter.id);
        setPetLetters(prev => markPetLetterAiRequested(prev, pendingAiPetLetter.id));

        const currentMonsterId = getMonsterIdWrapped();
        const aiContext = {
            letterId: pendingAiPetLetter.id,
            date: pendingAiPetLetter.date,
            slotId: pendingAiPetLetter.slotId,
            label: pendingAiPetLetter.label,
            monsterName: MONSTER_NAMES[String(currentMonsterId)] || '像素怪獸',
            monsterId: String(currentMonsterId),
            level: derivedLevel,
            hunger,
            mood,
            bondValue,
            todayTrainWins,
            todayWildDefeated,
            todayFeedCount,
            traitName: monsterTraits?.trait?.name || null,
            lastPlayerReply: petLetters?.lastPlayerReply?.text || '',
            weather: weatherContext,
            dailyTopic: getDailyTopicForLetterSlot(pendingAiPetLetter.slotId),
            constraints: {
                locale: 'zh-TW',
                maxPages: 5,
                minPages: 3,
                maxCharsPerPage: 45
            }
        };

        let cancelled = false;
        const timeoutId = setTimeout(() => {
            if (cancelled) return;
            setPetLetters(prev => markPetLetterAiTimedOut(prev, pendingAiPetLetter.id));
            aiPetLetterRequestsRef.current.delete(pendingAiPetLetter.id);
            recordGameAction();
        }, 20000);

        const run = async () => {
            try {
                const authToken = user?.getIdToken ? await user.getIdToken() : null;
                const pages = await requestAiPetLetter(aiContext, authToken);
                if (cancelled) return;
                clearTimeout(timeoutId);
                setPetLetters(prev => applyAiPetLetter(prev, pendingAiPetLetter.id, pages));
                recordGameAction();
            } catch (error) {
                if (cancelled) return;
                clearTimeout(timeoutId);
                setPetLetters(prev => markPetLetterAiFailed(prev, pendingAiPetLetter.id, error?.message || 'request_failed'));
                recordGameAction();
            } finally {
                aiPetLetterRequestsRef.current.delete(pendingAiPetLetter.id);
            }
        };
        run();

        return () => {
            cancelled = true;
            clearTimeout(timeoutId);
        };
    }, [petLettersEnabled, pendingAiPetLetter?.id, isBooting, isDead, isDuplicateTab, evolutionBranch, evolutionStage, hunger, mood, bondValue, derivedLevel, todayTrainWins, todayWildDefeated, todayFeedCount, monsterTraits, petLetters?.lastPlayerReply?.text, user]);

    const openPetLetter = () => {
        if (!unreadPetLetter || isBooting || isDead || isEvolving || miniGame || isAdvMode || battleState.active || isPvpMode || isLeaderboardOpen || tournament.isTournamentOpen || cloudChoicePrompt || isCloudLoading) return;
        setIsPetLetterOpen(true);
        playBloop('confirm');
    };

    const markCurrentPetLetterRead = (letterId) => {
        setPetLetters(prev => markPetLetterRead(prev, letterId));
        recordGameAction();
    };

    const sendPetLetterReply = (letterId, text) => {
        setPetLetters(prev => savePlayerPetReply(prev, letterId, text));
        updateDialogue("回信寄出去了。");
        recordGameAction();
    };

    // 啟動時或更換怪獸時自動解鎖圖鑑
    useEffect(() => {
        if (!isBooting && !isDead) {
            unlockMonster(getMonsterIdWrapped());
        }
    }, [isBooting, evolutionBranch, evolutionStage, currentMonsterId, isDead]);





    // --- PVP 排行榜 (已模組化至 useLeaderboard) ---
    const {
        leaderboard, leaderboardPage, setLeaderboardPage,
        allLeaderboard,
        isLeaderboardOpen, setIsLeaderboardOpen,
        isLeaderboardLoading,
        fetchLeaderboard, fetchAllLeaderboard, updatePvpStats
    } = useLeaderboard({
        user,
        getMonsterId: getMonsterIdWrapped,
        getBattleSnapshot: () => {
            const stats = generateMyBattleStats();
            return {
                id: String(stats.myId),
                name: MONSTER_NAMES?.[String(stats.myId)] || `怪獸#${stats.myId}`,
                stats: {
                    hp: stats.pMaxHP,
                    atk: stats.pATK,
                    def: stats.pDEF,
                    spd: stats.pSPD,
                    level: stats.pLevel
                },
                type: stats.pType,
                moves: (advStats.moves || []).filter(moveId => SKILL_DATABASE[moveId]),
                moveUpgrades: advStats.moveUpgrades || {},
                trait: monsterTraits?.trait || null
            };
        },
        updateDialogue
    });

    const pvp = usePvpConnection({
        updateDialogue,
        setBattleState,
        battleState,
        getMonsterId: getMonsterIdWrapped,
        executeBattleTurn,
        generateMyBattleStats,
        setAlertMsg,
        playBloop,
        user,
        advStats,
        generateBattleState,
        setAdvStats,
        logEvent,
        updatePvpStats,
        monsterTraits
    });

    const {
        isPvpMode, setIsPvpMode, matchStatus, setMatchStatus, matchStatusRef, syncMatchStatus,
        myPeerId, setMyPeerId, targetPeerId, setTargetPeerId, pvpRoomPassword, setPvpRoomPassword,
        pvpOpponent, setPvpOpponent, pvpLog, setPvpLog, isMyTurn, setIsMyTurn,
        pvpCurrentHP, setPvpCurrentHP, pvpOpponentHP, setPvpOpponentHP,
        pendingPlayerMove, setPendingPlayerMove,
        peerInstance, connInstance, isHost, pvpRemoteMoveRef,
        cleanupPvp, initPeer, joinPvpRoom, handleBattleEnd, submitPvpMove
    } = pvp;

    // 🔹 當使用者登入成功且排行榜尚未讀取時，自動預載資料以供大賽系統使用
    useEffect(() => {
        if (user && leaderboard.length === 0 && !isLeaderboardLoading) {
            fetchLeaderboard({ silent: true });
        }
    }, [user]);

    useEffect(() => {
        if (user && allLeaderboard.length === 0 && !isLeaderboardLoading) {
            fetchAllLeaderboard({ silent: true });
        }
    }, [user]);

    // --- 聯盟大賽 (Tournament System) ---
    const tournament = useTournament({
        user, derivedLevel, evolutionStage, myMonsterId: getMonsterIdWrapped(),
        advStats, monsterTraits, leaderboard, updateDialogue, setAlertMsg, battleState, setBattleState, setAdvStats, playBloop,
        pendingSkillLearn,
        onTournamentLossReturn: () => {
            if (defeatTutorialEnabled) setDefeatTutorialType('tournament');
        }
    });

    // --- PVP 殭屍對局檢測 (Zombie Match Detector) ---
    useEffect(() => {
        if (!isPvpMode || battleState.phase !== 'waiting_opponent') return;
        const timer = setTimeout(() => {
            if (isPvpMode && battleState.phase === 'waiting_opponent') {
                cleanupPvp("對手失去響應，對局強制結束。");
                setAlertMsg("與對手通訊逾時");
                playBloop('fail');
            }
        }, 25000); // 25秒超時防呆
        return () => clearTimeout(timer);
    }, [isPvpMode, battleState.phase]);

    // --- BGM 場景切換系統 ---
    useEffect(() => {
        const base = import.meta.env.BASE_URL;

        // 戰鬥狀態：PVP 模式、聯盟大會、冒險模式，或戰鬥狀態為 active
        const isBattleMode = isPvpMode || tournament?.isTournamentOpen || isAdvMode || battleState?.active;

        // 無限波次 Rogue 模式使用獨立闖關狀態
        const isTalkMode = isExpeditionOpen;

        if (isTalkMode) {
            playBGM(`${base}assets/BGM/冒險系統.mp3`);
        } else if (isBattleMode) {
            playBGM(`${base}assets/BGM/對戰音樂.mp3`);
        } else {
            playBGM(`${base}assets/BGM/主畫面.mp3`);
        }
    }, [isPvpMode, tournament?.isTournamentOpen, isAdvMode, battleState?.active, miniGame, isExpeditionOpen]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] p-4 select-none relative">
            <style dangerouslySetInnerHTML={{ __html: BATTLE_STYLES }} />

            {isLocalhost && !isDesktopBuild && (
                <button
                    onClick={() => {
                        console.log("🛠️ Debug Button Clicked!");
                        setShowDebug(!showDebug);
                    }}
                    style={{
                        position: 'fixed', bottom: '20px', right: '20px',
                        zIndex: 10002, opacity: 0.95,
                        background: '#f39c12', borderRadius: '50%',
                        width: '64px', height: '64px', border: '4px solid #fff',
                        fontSize: '32px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.6)',
                        pointerEvents: 'auto'
                    }}
                >
                    🛠️
                </button>
            )}

            <DebugPanel
                show={showDebug}
                onClose={() => setShowDebug(false)}
                debugOverrides={debugOverrides}
                setDebugOverrides={setDebugOverrides}
                setAdvStats={setAdvStats}
                inventory={inventory}
                setInventory={setInventory}
                updateDialogue={updateDialogue}
                // --- ✨ 新增傳遞給 Debug 的狀態 ---
                evolutionStage={evolutionStage}
                evolutionBranch={evolutionBranch}
                bondValue={bondValue}
                setBondValue={setBondValue}
                talkCount={talkCount}
                lockedAffinity={lockedAffinity}
                setLockedAffinity={setLockedAffinity}
                soulAffinityCounts={soulAffinityCounts}
                setSoulAffinityCounts={setSoulAffinityCounts}
                monsterTraits={monsterTraits}
                setMonsterTraits={setMonsterTraits}
                interactionLogs={interactionLogs}
                interactionCount={interactionCount}
                getMonsterIdWrapped={getMonsterIdWrapped}
                getPowerThreshold={getPowerThreshold}
                battleState={battleState}
                setBattleState={setBattleState}
                petLetters={petLetters}
                setPetLetters={setPetLetters}
                weatherContext={weatherContext}
                dailyTopics={dailyTopics}
                onRefreshExternalLetterContext={refreshExternalLetterContext}
            />

            {/* --- 自動縮放包裝容器 (Responsive Wrapper) --- */}
            <div className="fixed inset-0 flex items-center justify-center bg-[#1a1a1a] overflow-hidden select-none">
                <div
                    className="relative flex flex-col items-center justify-center pointer-events-auto transition-transform duration-100 ease-out"
                    style={{
                        ...(isDesktopBuild
                            ? { zoom: displayScale }
                            : {
                                transform: `scale(${displayScale})`,
                                transformOrigin: 'center center'
                            }),
                        imageRendering: 'pixelated',
                        width: '320px',
                        height: '620px'
                    }}
                >
                    <div
                        className="relative w-[320px] h-[620px] pt-[50px] pb-12 px-[32px] flex flex-col items-center"
                        style={{
                            backgroundImage: `url('${base}assets/BG/BG_01.png')`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            backgroundColor: 'transparent'
                        }}
                    >



                        <div className="lcd-container">

                            {/* 雲端載入遮罩 */}
                            {isCloudLoading && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 10000,
                                    backgroundColor: 'rgba(157, 174, 138, 0.9)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: '#111', fontSize: '12px', fontWeight: 'bold'
                                }}>
                                    <div className="animate-spin text-2xl mb-2">☁️</div>
                                    <div>雲端同步中...</div>
                                    <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '8px' }}>請稍候</div>
                                </div>
                            )}

                            {cloudChoicePrompt && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 10000,
                                    backgroundColor: 'rgba(157, 174, 138, 0.94)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: '#111', textAlign: 'center', padding: '14px', fontSize: '10px', lineHeight: '1.5'
                                }}>
                                    <div style={{
                                        width: '210px', padding: '12px', border: '4px solid #111', backgroundColor: '#ccd6be',
                                        display: 'flex', flexDirection: 'column', gap: '8px',
                                        boxShadow: '6px 6px 0 rgba(0,0,0,0.22)'
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: '900' }}>
                                            雲端存檔選擇
                                        </div>
                                        <div style={{ fontSize: '9px', textAlign: 'left' }}>
                                            <div>雲端：{formatCloudChoiceTime(cloudChoicePrompt.cloudTime)}</div>
                                            <div>本機：{formatCloudChoiceTime(cloudChoicePrompt.localTime)}</div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                            {cloudChoicePrompt.options.map((option, index) => (
                                                <div
                                                    key={option.id}
                                                    style={{
                                                        border: '2px solid #111',
                                                        backgroundColor: index === cloudChoicePrompt.selectedIndex ? '#ffca28' : '#8fa07e',
                                                        color: '#111',
                                                        padding: '4px 5px',
                                                        fontSize: '9px',
                                                        fontWeight: '900',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    {index === cloudChoicePrompt.selectedIndex ? '▶ ' : '　'}{option.label}
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ fontSize: '8px', opacity: 0.8 }}>
                                            A 切換　B 確認　C 稍後
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 二次確認介面 (LCD 內建) */}
                            {isConfirmingFarewell && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 9999,
                                    backgroundColor: 'rgba(157, 174, 138, 0.95)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: '#1a1a1a', textAlign: 'center', padding: '20px', fontSize: '11px', lineHeight: '1.6'
                                }}>
                                    <div style={{
                                        width: '180px', padding: '15px', border: '4px solid #111', backgroundColor: '#8fa07e',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                                        boxShadow: '8px 8px 0 rgba(0,0,0,0.2)'
                                    }}>
                                        <div style={{ fontSize: '12px', fontWeight: '900', color: '#111', lineHeight: '1.4' }}>
                                            確定要<br />終止生命嗎？
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ padding: '4px 8px', border: '2px solid #111', backgroundColor: '#ffca28', color: '#111', fontSize: '9px', fontWeight: 'black' }}>A：否</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ padding: '4px 8px', border: '2px solid #111', backgroundColor: '#ff5252', color: '#fff', fontSize: '9px', fontWeight: 'black' }}>B：是</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* 這裡新增多分頁警告 UI */}
                            {isDuplicateTab && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 9999,
                                    backgroundColor: 'rgba(0,0,0,0.85)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', textAlign: 'center', padding: '20px', fontSize: '11px', lineHeight: '1.6'
                                }}>
                                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>⚠️</div>
                                    <div style={{ fontWeight: 'bold' }}>偵測到其他分頁正在遊玩</div>
                                    <div style={{ marginTop: '10px', color: '#aaa', fontSize: '9px' }}>為避免存檔衝突，此分頁已暫停。<br />請關閉其他分頁後再重新整理。</div>
                                </div>
                            )}

                            {/* --- 👑 整合式行動排行榜 (LCD Integrated) --- */}
                            <LeaderboardOverlay
                                isLeaderboardOpen={isLeaderboardOpen}
                                leaderboardPage={leaderboardPage}
                                isLeaderboardLoading={isLeaderboardLoading}
                                leaderboard={leaderboard}
                            />


                            {/* 淘汰賽系統 Overlay */}
                            <TournamentOverlay
                                isTournamentOpen={tournament.isTournamentOpen}
                                tPhase={tournament.tPhase}
                                currentRound={tournament.currentRound}
                                opponents={tournament.opponents}
                                nextTournamentPhase={tournament.nextTournamentPhase}
                                myMonsterId={getMonsterIdWrapped()}
                                playerName={user?.displayName || '玩家'}
                                rewardOptions={tournament.rewardOptions}
selectedRewardEffectIdx={tournament.selectedRewardEffectIdx}
                                moveUpgrades={advStats.moveUpgrades || {}}
                                playerMoves={(advStats.moves || []).map(id => SKILL_DATABASE[id]).filter(Boolean)}
                                onRewardEffectSelect={tournament.setSelectedRewardEffectIdx}
                            />

                            {/* 冒險或連線對戰系統 Overlay */}
                            <BattleAdventureOverlay
                                isAdvMode={isAdvMode}
                                isTournamentOpen={tournament.isTournamentOpen}
                                battleState={battleState}
                                advStats={advStats}
                                pvp={pvp}
                                isLeaderboardOpen={isLeaderboardOpen}
                                advCD={advCD}
                                fetchLeaderboard={fetchLeaderboard}
                                startTournament={() => {
                                    setIsPvpMode(false);
                                    tournament.startTournament();
                                }}
                                advLogRef={advLogRef}
                                advLog={advLog}
                                advCurrentHP={advCurrentHP}
                                isAdvStreaming={isAdvStreaming}
                                pendingWildCapture={pendingWildCapture}
                            />

                            <DefeatTutorialOverlay
                                type={defeatTutorialType}
                                onClose={() => {
                                    setDefeatTutorialType(null);
                                    playBloop('back');
                                }}
                            />

                            <PetLetterOverlay
                                isOpen={isPetLetterOpen}
                                letter={unreadPetLetter}
                                monsterId={isDead ? lastAliveMonsterIdRef.current : getMonsterIdWrapped()}
                                monsterName={MONSTER_NAMES[String(isDead ? lastAliveMonsterIdRef.current : getMonsterIdWrapped())] || '像素怪獸'}
                                onRead={markCurrentPetLetterRead}
                                onReply={sendPetLetterReply}
                                onClose={() => setIsPetLetterOpen(false)}
                            />

                            {/* 狀態查詢 Overlay */}
                            <StatusOverlay
                                isStatusUIOpen={isStatusUIOpen}
                                statusPage={statusPage}

                                onClose={() => {
                                    setIsStatusUIOpen(false);
                                    updateDialogue("吼吼吼～");
                                    playBloop('back');
                                }}
                                getMonsterId={getMonsterIdWrapped}
                                hunger={hunger}
                                mood={mood}
                                bondValue={bondValue}
                                advStats={advStats}
                                monsterTraits={monsterTraits}
                                calcFinalStat={calcFinalStat}
                                getIVGrade={getIVGrade}
                            />

                            {/* 怪獸圖鑑 */}
                            <MonsterpediaOverlay
                                isOpen={isPediaOpen}
                                onClose={() => setIsPediaOpen(false)}
                                ownedMonsters={ownedMonsters}
                                monsterNames={MONSTER_NAMES}
                                obtainableIds={OBTAINABLE_MONSTER_IDS}
                                selectedIndex={pediaIdx}
                                isDetailOpen={isPediaDetailOpen}
                            />
                            {/* Pokerogue 式無限波次挑戰 */}
                            {isExpeditionOpen && (
                                <PokeRogueOverlay
                                    inventory={inventory}
                                    activeBallId={activeBallId}
                                    onClose={() => {
                                        setIsExpeditionOpen(false);
                                        updateDialogue("無限波次挑戰結束。");
                                        logEvent("結束無限波次挑戰。");
                                    }}
                                />
                            )}

                            {/* 我的背包 */}
                            <InventoryOverlay
                                isInventoryOpen={isInventoryOpen}
                                inventory={inventory}
                                selectedBallIdx={selectedBallIdx}
                                activeBallId={activeBallId}
                            />

                            {/* === 📖 對戰日記 UI === */}
                            <DiaryOverlay
                                isDiaryOpen={isDiaryOpen}
                                getTodayStr={getTodayStr}
                                diaryViewDate={diaryViewDate}
                                todayTrainWins={todayTrainWins}
                                todayWildDefeated={todayWildDefeated}
                                todaySpecialEvent={todaySpecialEvent}
                                todayHasEvolved={todayHasEvolved}
                                diaryLog={diaryLog}
                                hunger={hunger}
                                mood={mood}
                                bondValue={bondValue}
                                lockedAffinity={lockedAffinity}
                                handleBUp={() => { }}
                            />

                            {/* 技能學習/替換介面 (Skill Learn UI) - Moved to bottom for max priority */}
                            <SkillLearnOverlay
                                pendingSkillLearn={pendingSkillLearn}
                                isAdvMode={isAdvMode}
                                isPvpMode={isPvpMode}
                                battleState={battleState}
                                isConfirmingReplace={isConfirmingReplace}
                                advStats={advStats}
                                tempReplaceIdx={tempReplaceIdx}
                                SKILL_DATABASE={SKILL_DATABASE}
                                TYPE_MAP={TYPE_MAP}
                                skillSelectIdx={skillSelectIdx}
                                handleB={handleB}
                            />

                            <div className="logical-canvas flex flex-col items-center justify-between pointer-events-none">
                                <div className="lcd-grid-overlay"></div>

                                {isBooting ? (
                                    <div className="absolute inset-0 z-50 overflow-hidden pointer-events-none">
                                        {/* 頂部文字 */}
                                        <div className="absolute top-[20px] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2" style={{
                                            color: '#1a1a1a',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'center'
                                        }}>
                                            {/* 替換標題字體為 LOGO 圖片 */}
                                            <img
                                                src={`${base}assets/BG/LOGO.png`}
                                                alt="LOGO"
                                                className="w-[180px] h-auto object-contain mb-1"
                                                style={{ imageRendering: 'pixelated' }}
                                            />
                                            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                                                按 <span className="blink-anim">A</span> 開始冒險
                                            </div>

                                            {/* Firebase 登入控制項 */}
                                            <div className="mt-4 pointer-events-auto flex flex-col items-center gap-2">
                                                {user ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-[9px] text-[#383a37] mb-1">已登入: {user.displayName}</div>
                                                        <button
                                                            onClick={logoutGoogle}
                                                            className="bg-[#ccd6be] border-2 border-[#1a1a1a] px-2 py-1 text-[9px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] active:translate-y-[1px]"
                                                        >
                                                            登出帳號
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={loginWithGoogle}
                                                        className="bg-[#ffca28] border-2 border-[#1a1a1a] px-3 py-1.5 text-[10px] font-bold shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:translate-y-[1px] flex items-center gap-2"
                                                    >
                                                        <span>連動 Google 帳號</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* 畫面四個角落跳躍的怪獸 (帶有淡入淡出與倒掛效果) */}
                                        {(() => {
                                            const positions = [
                                                "bottom-4 left-4", // 0: 左下
                                                "bottom-4 right-4" // 1: 右下
                                            ];
                                            const isTop = false; // 永遠在底部
                                            const isLeft = bootMonsterPosIdx === 0;
                                            return (
                                                <div
                                                    className={`absolute ${positions[bootMonsterPosIdx]} flex justify-center items-center transition-opacity duration-1000`}
                                                    style={{
                                                        zIndex: 40,
                                                        opacity: isBootMonsterVisible ? 1 : 0,
                                                        // 同時處理上下反轉(isTop)與左右鏡射(isLeft)
                                                        transform: `scale(${isLeft ? -2.5 : 2.5}, ${isTop ? -2.5 : 2.5})`,
                                                        transformOrigin: 'center',
                                                        imageRendering: 'auto'
                                                    }}
                                                >
                                                    <div style={{ animation: 'egg-pulse 2s infinite ease-in-out' }}>
                                                        <DitheredSprite id={bootMonsterId} scale={0.85} pure={true} smoothAnimated={true} smallSmoothImageRendering="pixelated" />
                                                    </div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-full h-[28px] flex justify-between px-4 pt-2 z-10 shrink-0 relative">
                                            {menuItems.slice(0, 4).map((item, idx) => (
                                                <div key={item.id} className="pixel-rendering relative w-[28px] h-[28px] flex items-center justify-center" style={{ opacity: activeIndex === idx ? 1 : 0.2 }}>
                                                    {/* 底層：原本的點陣圖 (當沒有圖片或圖片載入失敗時顯示) */}
                                                    {!loadedImages[item.id] && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <PixelArt sprite={item.sprite} color="#1a1a1a" scale={3} />
                                                        </div>
                                                    )}
                                                    {/* 上層：自定義圖片圖標 (M1-M8) */}
                                                    {item.img && (
                                                        <img
                                                            src={item.img}
                                                            alt={item.id}
                                                            className="relative z-10 w-[25px] h-[25px] object-contain"
                                                            style={{
                                                                filter: 'saturate(1.0) brightness(0.5) contrast(1.1)',
                                                                imageRendering: 'pixelated',
                                                                visibility: loadedImages[item.id] ? 'visible' : 'hidden'
                                                            }}
                                                            onLoad={() => setLoadedImages(prev => ({ ...prev, [item.id]: true }))}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                setLoadedImages(prev => ({ ...prev, [item.id]: false }));
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            ))}

                                            {/* 雲端同步狀態顯示 */}
                                            {user && (
                                                <div className="absolute right-4 top-2 flex items-center gap-1">
                                                    <div className={`w-[6px] h-[6px] rounded-full ${isCloudSyncing ? 'bg-[#ff5252] animate-pulse' : cloudWriteEnabled ? 'bg-[#4caf50]' : 'bg-[#ffca28]'}`} />
                                                    <span className="text-[8px] text-[#383a37] font-bold">
                                                        {isCloudSyncing ? '同步中...' : cloudWriteEnabled ? '雲端存檔已同步' : '雲端備份暫停'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full flex-1 relative z-10 overflow-hidden flex flex-col items-center justify-center">
                                            {/* Evolution Performance will be rendered at the root level for better overlay coverage */}

                                            {miniGame && (
                                                <div className="absolute inset-0 z-60 flex flex-col items-center justify-start pt-8 pointer-events-none">
                                                    {miniGame.type === 'reaction' && (
                                                        <>
                                                            {miniGame.status === 'ready' && <span className="text-[20px] font-bold animate-pulse text-[#111]">準備好了嗎？</span>}
                                                            {miniGame.status === 'countdown' && <span className="text-[48px] font-black text-[#111]">{miniGame.count}</span>}
                                                            {miniGame.status === 'go' && <span className="text-[36px] font-black text-[#ff5252] animate-bounce" style={{ textShadow: '2px 2px 0 #fff' }}>開始！</span>}
                                                        </>
                                                    )}

                                                    {miniGame.type === 'charge_click' && (
                                                        <>
                                                            {miniGame.status === 'idle' && <span className="text-[20px] font-bold animate-pulse text-[#111]">連按 B 鍵！</span>}
                                                            {(miniGame.status === 'idle' || miniGame.status === 'clicking') && (
                                                                <div className="w-[160px] h-[24px] border-4 border-[#111] bg-[#8fa07e] relative shadow-[0_4px_0_rgba(0,0,0,0.2)] mt-4">
                                                                    <div className="h-full bg-[#ff5252] transition-all duration-75" style={{ width: `${miniGame.energy}%` }} />
                                                                </div>
                                                            )}
                                                            {miniGame.status === 'clicking' && (
                                                                <span className="text-[16px] font-bold text-[#111] mt-2">
                                                                    {Math.max(0, Math.ceil((3000 - (Date.now() - miniGame.startTime)) / 1000))}s
                                                                </span>
                                                            )}
                                                        </>
                                                    )}
                                                    {miniGame.type === 'spin' && (
                                                        <>
                                                            {miniGame.status === 'idle' && <span className="text-[20px] font-bold animate-pulse text-[#111] mb-2">按 B 鍵開始</span>}
                                                            {miniGame.status === 'spinning' && <span className="text-[20px] font-bold animate-pulse text-[#ff5252] mb-2">按 B 鍵停止</span>}

                                                            {(miniGame.status === 'idle' || miniGame.status === 'spinning') && (
                                                                <div className="w-[48px] h-[48px] border-4 border-[#111] bg-[#e0e0e0] flex items-center justify-center relative shadow-[0_4px_0_rgba(0,0,0,0.2)]">
                                                                    <PixelArt sprite={ICONS[miniGame.items[miniGame.currentIdx]]} color="#111" scale={3} />
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    {miniGame.type === 'spin_heart' && (
                                                        <>
                                                            {miniGame.status === 'idle' && <span className="text-[20px] font-bold animate-pulse text-[#111] mb-2">按 B 鍵開始</span>}
                                                            {miniGame.status === 'spinning' && <span className="text-[20px] font-bold animate-pulse text-[#ff5252] mb-2">按 B 鍵停止</span>}

                                                            {(miniGame.status === 'idle' || miniGame.status === 'spinning') && (
                                                                <div className="w-[48px] h-[48px] border-4 border-[#111] bg-[#e0e0e0] flex items-center justify-center relative shadow-[0_4px_0_rgba(0,0,0,0.2)]">
                                                                    <PixelArt sprite={ICONS[miniGame.items[miniGame.currentIdx]]} color="#111" scale={3} />
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    {miniGame.type === 'talk' && miniGame.status === 'question' && (
                                                        <div className="absolute inset-x-2 top-2 bottom-2 bg-[#9baea0] border-[4px] border-[#383a37] shadow-[4px_4px_0_rgba(0,0,0,0.2)] p-2 flex flex-col pointer-events-auto z-[100]">
                                                            <div className="text-[13px] font-extrabold text-[#111] mb-2 leading-tight whitespace-normal break-words h-[40px] flex items-center shrink-0">
                                                                {SOUL_QUESTIONS[miniGame.qIdx].q}
                                                            </div>
                                                            <div className="flex flex-col gap-1 w-full bg-[#839788] px-2 py-1.5 border-[2px] border-[#5e6d62] flex-1 justify-around">
                                                                {SOUL_QUESTIONS[miniGame.qIdx].options.map((opt, i) => (
                                                                    <div key={i} className="text-[11px] whitespace-normal leading-[1.2] text-[#111] font-bold tracking-tight flex items-start">
                                                                        <span className="text-[#333] font-black mr-1 shrink-0">{['A', 'B', 'C'][i]}.</span>
                                                                        <span>{opt.label}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {miniGame.status === 'result' && (
                                                        <span className={`text-[24px] font-black ${(miniGame.points || miniGame.result) ? 'text-[#ffca28]' : 'text-[#444]'}`} style={{ textShadow: '2px 2px 0 #fff' }}>
                                                            {miniGame.points ? `+${miniGame.points}` : (miniGame.result ? "PERFECT!" : "MISS")}
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            <div
                                                ref={monsterRef}
                                                className="absolute"
                                                style={{
                                                    left: posRef.current.x, top: posRef.current.y,
                                                    transform: 'translate(-50%, -50%)',
                                                    animation: isDead ? 'monster-fadeout 2s ease-out forwards' : 'none',
                                                    zIndex: 50
                                                }}
                                            >
                                                <div
                                                    ref={spriteRef}
                                                    style={{
                                                        transform: `${!isDead && isSpinning ? 'rotate(180deg)' : ''} ${velRef.current.x < 0 ? 'scaleX(1)' : 'scaleX(-1)'}`,
                                                        transformOrigin: 'center center',
                                                        transition: 'transform 0.15s ease-out',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                >
                                                    {!isDead && (() => { lastAliveMonsterIdRef.current = getMonsterIdWrapped(); return null; })()}
                                                    <DitheredSprite id={isDead ? lastAliveMonsterIdRef.current : getMonsterIdWrapped()} pure={true} />
                                                </div>
                                            </div>

                                            {unreadPetLetter && !isBooting && !isDead && !miniGame && !isAdvMode && !battleState.active && !isPvpMode && !tournament.isTournamentOpen && (
                                                <button
                                                    type="button"
                                                    onClick={openPetLetter}
                                                    className="absolute right-[34px] top-[42px] z-[180] pointer-events-auto w-[30px] h-[28px] flex items-center justify-center bg-[#ffca28] border-[3px] border-[#1a1a1a] shadow-[3px_3px_0_rgba(0,0,0,0.24)] active:translate-y-[1px]"
                                                    title="怪獸來信"
                                                    aria-label="怪獸來信"
                                                >
                                                    <PixelArt sprite={ICONS.mail} color="#1a1a1a" scale={2.3} />
                                                    <span className="absolute -right-[4px] -top-[5px] w-[9px] h-[9px] bg-[#ff5252] border-2 border-[#1a1a1a]"></span>
                                                </button>
                                            )}

                                            {/* 死亡後提示文字 */}
                                            {isDead && showRestartHint && (
                                                <div
                                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                                    style={{ animation: 'hint-fadein 0.8s ease-out forwards' }}
                                                >
                                                    <div style={{
                                                        fontFamily: "'Press Start 2P', monospace",
                                                        fontSize: '10px',
                                                        color: '#1a1a1a',
                                                        textAlign: 'center',
                                                        lineHeight: 2,
                                                        opacity: 0.85
                                                    }}>
                                                        按任意按鈕<br />重新開始
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-[240px] h-[32px] border-2 border-[#1a1a1a] flex items-center px-2 overflow-hidden z-10 bg-[#9dae8a] shrink-0 mb-[10px] shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)] relative">
                                            <span key={marqueeKey} className={`text-[11px] font-bold ${isBooting ? 'whitespace-pre-line text-center w-full leading-tight' : 'whitespace-nowrap'}`} style={{ animation: isBooting ? 'none' : 'marquee-once 4s ease-out forwards' }}>
                                                {isBooting ? (
                                                    <>
                                                        <div>像素怪獸</div>
                                                        <div>按 <span className="blink-anim">A</span> 開始冒險</div>
                                                    </>
                                                ) : dialogue}
                                            </span>
                                        </div>

                                        <div className="w-full h-[28px] flex justify-between px-4 pb-12 z-10 shrink-0 relative">
                                            {menuItems.slice(4, 8).map((item, idx) => (
                                                <div key={item.id} className="pixel-rendering relative w-[28px] h-[28px] flex items-center justify-center" style={{ opacity: activeIndex === idx + 4 ? 1 : 0.2 }}>
                                                    {/* 底層保底 */}
                                                    {!loadedImages[item.id] && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <PixelArt sprite={item.sprite} color="#1a1a1a" scale={3} />
                                                        </div>
                                                    )}
                                                    {/* 上層自定義圖片 */}
                                                    {item.img && (
                                                        <img
                                                            src={item.img}
                                                            alt={item.id}
                                                            className="relative z-10 w-[25px] h-[25px] object-contain"
                                                            style={{
                                                                filter: 'saturate(1.0) brightness(0.5) contrast(1.1)',
                                                                imageRendering: 'pixelated',
                                                                visibility: loadedImages[item.id] ? 'visible' : 'hidden'
                                                            }}
                                                            onLoad={() => setLoadedImages(prev => ({ ...prev, [item.id]: true }))}
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                setLoadedImages(prev => ({ ...prev, [item.id]: false }));
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* 技能順序調整 */}
                                        {isSkillRearrangeOpen && (
                                            <SkillRearrangeOverlay
                                                isOpen={isSkillRearrangeOpen}
                                                moves={advStats.moves || []}
                                                moveUpgrades={advStats.moveUpgrades || {}}
                                                SKILL_DATABASE={SKILL_DATABASE}
                                                TYPE_MAP={TYPE_MAP}
                                                onClose={() => {
                                                    setIsSkillRearrangeOpen(false);
                                                }}
                                                onConfirm={handleConfirmRearrange}
                                            />
                                        )}

                                        {/* 全域警告彈窗 (Alert Modal) */}
                                        {alertMsg && (
                                            <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
                                                <div className="bg-[#9dae8a] border-[4px] border-[#1a1a1a] shadow-[4px_4px_0_rgba(0,0,0,0.3)] p-3 w-full flex flex-col items-center">
                                                    <div className="text-[12px] font-black text-[#ff5252] mb-1 tracking-widest">［系統提示］</div>
                                                    <div className="text-[13px] font-bold text-[#111] text-center leading-tight mb-3">
                                                        {alertMsg}
                                                    </div>
                                                    <div className="text-[10px] text-[#444] animate-pulse">
                                                        -- 按任意鍵關閉 --
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.8)', zIndex: 100 }} />
                        </div>

                        <div className="mt-5 w-full flex justify-between px-4 mb-1">
                            {[
                                { key: 'A', name: '選擇' },
                                { key: 'B', name: '確定' },
                                { key: 'C', name: '返回' }
                            ].map((btn) => (
                                <div key={btn.key} className="flex flex-col items-center gap-0.5">
                                    <button
                                        onMouseDown={() => { setBtnPressed(btn.key); if (btn.key === 'B') handleBDown(); }}
                                        onMouseUp={() => { setBtnPressed(null); if (btn.key === 'B') handleBUp(); }}
                                        onMouseLeave={() => { setBtnPressed(null); if (btn.key === 'B') handleBUp(); }}
                                        className={`
                                  w-[48px] h-[48px] rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.6)]
                                  transition-all active:translate-y-[2px] active:shadow-sm
                                  ${btnPressed === btn.key ? 'brightness-75' : 'brightness-100'}
                                  flex items-center justify-center
                                `}
                                        style={{
                                            backgroundImage: `url('${base}assets/BG/${btn.key}.png')`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            backgroundRepeat: 'no-repeat',
                                            border: 'none'
                                        }}
                                        onClick={() => btn.key === 'A' ? handleA() : btn.key === 'B' ? handleB() : handleC()}
                                    ></button>
                                    <span className="text-[11px] font-bold text-[#e0e0e0] tracking-widest mt-0.5 opacity-80">
                                        {btn.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="w-full mt-1 px-4 flex justify-between items-center">
                            <button
                                onClick={() => {
                                    if (defeatTutorialType) {
                                        playBloop('fail');
                                        return;
                                    }
                                    if (isDead) handleRestart();
                                    else triggerFarewell();
                                    playBloop('confirm');
                                }}
                                disabled={!!defeatTutorialType || (!isDead && isGenerating)}
                                className={`w-[110px] h-[40px] border-none brightness-100 active:brightness-90 transition-all ${defeatTutorialType || (!isDead && isGenerating) ? 'opacity-50' : 'opacity-100'}`}
                                style={{
                                    backgroundImage: `url('${base}assets/BG/ED.png')`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundColor: 'transparent',
                                }}
                            ></button>

                            {/* 新手教學按鈕 */}
                            <button
                                onClick={() => {
                                    console.log("Tutorial Clicked!");
                                    setIsTutorialOpen(true);
                                    playBloop('confirm');
                                }}
                                className="w-[110px] h-[40px] border-none brightness-100 active:brightness-90 transition-all"
                                style={{
                                    backgroundImage: `url('${base}assets/BG/指導手冊.png')`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundColor: 'transparent',
                                }}
                            ></button>
                        </div>

                        {/* 設定按鈕 */}
                        <div className="w-full mt-2 flex justify-center items-center pb-2">
                            <button
                                onClick={() => {
                                    setIsSettingsOpen(true);
                                    playBloop('confirm');
                                }}
                                className="w-[45px] h-[45px] border-none brightness-100 active:brightness-90 transition-all"
                                style={{
                                    backgroundImage: `url('${base}assets/BG/設定.png')`,
                                    backgroundSize: 'contain',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundColor: 'transparent',
                                }}
                            ></button>
                        </div>
                    </div>

                    {/* --- 系統設定 UI --- */}
                    <SettingsOverlay
                        isSettingsOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        manualScale={manualScale}
                        setManualScale={setManualScale}
                        setIsBooting={setIsBooting}
                        defeatTutorialEnabled={defeatTutorialEnabled}
                        setDefeatTutorialEnabledState={setDefeatTutorialEnabledState}
                        petLettersEnabled={petLettersEnabled}
                        setPetLettersEnabledState={setPetLettersEnabledState}
                    />

                    <TutorialAI
                        isOpen={isTutorialOpen}
                        onClose={() => setIsTutorialOpen(false)}
                    />

                    {/* --- 全螢幕進化演出 (Full-screen Evolution Performance) --- */}
                    {isEvolving && evolutionDetails && (
                        <EvolutionPerformance
                            fromId={evolutionDetails.fromId}
                            toId={evolutionDetails.toId}
                            onFinish={handleEvolutionFinish}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

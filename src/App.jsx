import BattleAdventureOverlay from './components/BattleAdventureOverlay';
import DiaryOverlay from './components/DiaryOverlay';
import InventoryOverlay from './components/InventoryOverlay';
import StatusOverlay from './components/StatusOverlay';
import LeaderboardOverlay from './components/LeaderboardOverlay';
import SkillLearnOverlay from './components/SkillLearnOverlay';
import DebugPanel from './components/DebugPanel';
import { MonsterpediaOverlay } from './components/MonsterpediaOverlay';
import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import {
    MONSTER_NAMES,
    SPECIES_BASE_STATS,
    SKILL_DATABASE,
    TYPE_SKILLS,
    ADV_WILD_POOL,
    TYPE_MAP,
    NATURE_CONFIG,
    getTypeMultiplier,
    generateMoves,
    calcFinalStat,
    OBTAINABLE_MONSTER_IDS,
    TRAINER_POOLS
} from './monsterData';

import { EVO_TIMES, WILD_EVOLUTION_MAP } from './data/evolutionConfig';

import { DitheredSprite, DitheredBackSprite, PixelArt, ICONS, BATTLE_STYLES } from './components/SpriteRenderer';


import {
    apiKey, modelName, PHYSICS, ADV_ITEMS, DIARY_ITEM,
    DIARY_MESSAGES_TEMPLATE, ADV_BATTLE_RULES, RAW_Q_DATA, SOUL_QUESTIONS,
    getPetDailyMessage, DIARY_STORAGE_KEY, loadDiaryData, saveDiaryData, getSmartMove
} from './data/gameConfig';

import { auth, db, googleProvider } from './utils/firebase';
import { playBloop } from './utils/audioSystem';
import { SAVE_VERSION, isInAppBrowser, loadSaveData } from './utils/storageSystem';
import { isLocalhost, FIRESTORE_COLLECTION, PEER_PREFIX } from './utils/envConfig';
import { processBattleTurn } from './utils/battleTurnSystem';
import { usePvpConnection } from './utils/usePvpConnection';
import { getMonsterId } from './utils/monsterIdMapper';
import { useLeaderboard } from './utils/useLeaderboard';
import { useTournament } from './utils/useTournament';
import { TournamentOverlay } from './components/TournamentOverlay';





export default function App() {
    const [initialData] = useState(() => loadSaveData());

    const getInit = (key, defaultVal) => {
        return (initialData && initialData[key] !== undefined) ? initialData[key] : defaultVal;
    };

    // ?�新?��?事件（帶?��?權檢?��?
    const updateDiaryEvent = (text, priority) => {
        setTodayEventPriority(currentP => {
            if (priority >= currentP) {
                setTodaySpecialEvent(text);
                return priority;
            }
            return currentP;
        });
    };

    // --- ??BUG FIX: ?��??�地?��?字串 (YYYY-MM-DD) ?��? UTC ?�差?��? ---
    const getTodayStr = (date = new Date()) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const [hunger, setHunger] = useState(getInit('hunger', 60));
    const [mood, setMood] = useState(getInit('mood', 50));
    const [isSleeping, setIsSleeping] = useState(getInit('isSleeping', false));
    const [isPooping, setIsPooping] = useState(getInit('isPooping', false));
    const [evolutionStage, setEvolutionStage] = useState(getInit('evolutionStage', 1));
    const [evolutionBranch, setEvolutionBranch] = useState(getInit('evolutionBranch', 'A'));
    const [trainWins, setTrainWins] = useState(getInit('trainWins', 0));
    const [stageTrainWins, setStageTrainWins] = useState(getInit('stageTrainWins', 0));
    const [feedCount, setFeedCount] = useState(getInit('feedCount', 0));
    const [deathBranch, setDeathBranch] = useState(getInit('deathBranch', null));
    const [lastEvolutionTime, setLastEvolutionTime] = useState(getInit('lastEvolutionTime', Date.now()));
    const [lastSaveTime, setLastSaveTime] = useState(getInit('lastSaveTime', Date.now()));

    // 談�?系統?��??�??
    const [bondValue, setBondValue] = useState(getInit('bondValue', 0));
    const [talkCount, setTalkCount] = useState(getInit('talkCount', 0));
    const [lockedAffinity, setLockedAffinity] = useState(getInit('lockedAffinity', null));
    const [soulAffinityCounts, setSoulAffinityCounts] = useState(getInit('soulAffinityCounts', { fire: 0, water: 0, grass: 0, bug: 0 }));
    const [soulTagCounts, setSoulTagCounts] = useState(getInit('soulTagCounts', { gentle: 0, stubborn: 0, passionate: 0, nonsense: 0, rational: 0 }));

    const [steps, setSteps] = useState(getInit('steps', 0));
    const [interactionLogs, setInteractionLogs] = useState(getInit('interactionLogs', []));
    const [interactionCount, setInteractionCount] = useState(getInit('interactionCount', 0));
    const [isDead, setIsDead] = useState(getInit('isDead', false));
    const [isRunaway, setIsRunaway] = useState(getInit('isRunaway', false));
    const [finalWords, setFinalWords] = useState(getInit('finalWords', ""));

    // --- ?��?縮放系統 (Auto-Scaling) ---
    const [displayScale, setDisplayScale] = useState(1);
    useEffect(() => {
        const handleResize = () => {
            // ?��?尺寸 320x620 (完全?�步 Git ?��?縮放?�輯)
            const scaleW = window.innerWidth / 320;
            const scaleH = (window.innerHeight - 20) / 620;
            const scale = Math.min(scaleW, scaleH, 1.5); // ?��?設�?：�???1.5 ?�以?��?模�?
            setDisplayScale(scale);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);



    const [isInteractMenuOpen, setIsInteractMenuOpen] = useState(false);
    const [interactMenuIdx, setInteractMenuIdx] = useState(0);
    const [isInteractAnimating, setIsInteractAnimating] = useState(false);

    // ?��?系統?�??
    const [ownedMonsters, setOwnedMonsters] = useState(getInit('ownedMonsters', []));
    const [isPediaOpen, setIsPediaOpen] = useState(false);
    const [pediaIdx, setPediaIdx] = useState(0);
    const [isPediaDetailOpen, setIsPediaDetailOpen] = useState(false);

    // �???��??��?
    const unlockMonster = (id) => {
        if (!id) return;
        const idStr = String(id);
        setOwnedMonsters(prev => {
            if (prev.includes(idStr)) return prev;
            const newList = [...prev, idStr];
            logEvent(`�??了新?��??��?${MONSTER_NAMES[idStr] || idStr}`);
            recordGameAction(); // 確�?�??後觸?��?�?
            return newList;
        });
    };

    const [showDebug, setShowDebug] = useState(false);
    const [debugOverrides, setDebugOverrides] = useState({
        evolutionMs: null,
        encounterRates: null, // { trainer, wild, gather }
        catchRate: null,
        adventureCD: null
    });

    const [miniGame, setMiniGame] = useState(null);
    const miniGameResultFired = useRef(false);
    const advLogRef = useRef(null);

    // --- ?�能?�佳�?：改??Ref ?��?高頻變�??��?---
    const posRef = useRef({ x: 128, y: 80 });
    const velRef = useRef({ x: 0.6, y: 0.4 });
    const monsterRef = useRef(null);
    const spriteRef = useRef(null);
    const requestRef = useRef();
    const lastSaveTimeRef = useRef(0);

    const [isSpinning, setIsSpinning] = useState(false);
    const [isEvolving, setIsEvolving] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [dialogue, setDialogue] = useState("?��??�獸\n?�A?��??�險"); // ?��?顯示?�為?�入標�?，�???A 後�??��??��??��??��?
    const [marqueeKey, setMarqueeKey] = useState(0);
    const [loadedImages, setLoadedImages] = useState({}); // 追蹤?��??��?義�?標已?��?載入

    const [isConfirmingFarewell, setIsConfirmingFarewell] = useState(false); // 二次確�??��?

    // --- ?�險系統專屬?�??(Adventure State) ---
    // ?��??��???4 維架構�?Base Stats (Species) + IVs (Genetic) + EVs (Effort)
    const [advStats, setAdvStats] = useState(() => {
        const d = initialData?.advStats || { hp: 100, atk: 10, def: 10, spd: 1, basePower: 100 };
        // 資�??�移：�??��???ivs，隨機�??��?�?IV (0~31)
        if (!d.ivs) {
            d.ivs = {
                hp: Math.floor(Math.random() * 32),
                atk: Math.floor(Math.random() * 32),
                def: Math.floor(Math.random() * 32),
                spd: Math.floor(Math.random() * 32)
            };
        }
        // 資�??�移：�??��???evs，�??��???atk/def 高數?��?比�?轉為?��???
        if (!d.evs) {
            d.evs = {
                hp: Math.min(252, Math.max(0, (d.hp || 100) - 100)),
                atk: Math.min(252, Math.floor(Math.max(0, (d.atk || 10) - 10) * 4)),
                def: Math.min(252, Math.floor(Math.max(0, (d.def || 10) - 10) * 4)),
                spd: Math.min(252, Math.floor(Math.max(0, (d.spd || 1) - 1) * 8))
            };
        }
        // 資�??�移：�??��???bonusMoveId，隨機選一?��??��?始特?�
        if (!d.bonusMoveId) {
            const pool = ['ember', 'water_gun', 'vine_whip', 'quick_attack'];
            d.bonusMoveId = pool[Math.floor(Math.random() * pool.length)];
        }

        // --- ?��?：�?式永久�?存�? ---
        if (!d.moves) {
            // ?�試?��??��??�物種ID
            const monId = String(initialData?.id || localStorage.getItem('pixel_monster_id') || 1000);
            const getStarterMove = (id) => {
                if (id === "1019") return 'lick'; // ?�氣精�?
                return 'tackle'; // ?��?
            };
            // ?��??��?：�????��?�? + ?��?贈送�??????
            d.moves = [getStarterMove(monId), d.bonusMoveId].filter(Boolean);
        }

        return d;
    });

    const derivedLevel = Math.min(100, Math.max(1, Math.floor(((advStats?.basePower || 100) - 100) / 10) + 1));
    const previousLevelRef = useRef(derivedLevel);
    const [pendingSkillLearn, setPendingSkillLearn] = useState(null);
    const [skillSelectIdx, setSkillSelectIdx] = useState(0);
    const [isConfirmingReplace, setIsConfirmingReplace] = useState(false);
    const [tempReplaceIdx, setTempReplaceIdx] = useState(-1);

    // ?��?式系�?
    useEffect(() => {
        // 等�??��??�執�?
        if (derivedLevel > previousLevelRef.current) {
            if (typeof SPECIES_BASE_STATS === "object" && typeof SKILL_DATABASE === "object") {
                const myId = getMonsterIdWrapped();
                const speciesData = SPECIES_BASE_STATS[String(myId)];
                const myType = speciesData?.types || ['normal'];
                let targetType = 'normal';

                // 學�?規�?�?
                // 5級�?一?�系
                // 10級�??��?屬�?(Coverage)
                // ?��?(1~4, 6~9)：本�?(STAB)
                if (derivedLevel === 5) {
                    targetType = 'normal';
                } else if (derivedLevel === 10) {
                    const allTypes = typeof TYPE_CHART === "object" ? Object.keys(TYPE_CHART) : ['fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'fairy'];
                    const foreignTypes = allTypes.filter(t => !myType.includes(t));
                    targetType = foreignTypes.length > 0 ? foreignTypes[Math.floor(Math.random() * foreignTypes.length)] : 'normal';
                } else {
                    // 70% 機�??�本系�?30% 機�??�全屬性隨機�?�?
                    const isStab = Math.random() < 0.7;
                    if (isStab) {
                        targetType = myType[Math.floor(Math.random() * myType.length)];
                    } else {
                        const allTypes = Object.keys(TYPE_MAP || {
                            'normal': '??, 'fire': '??, 'water': '�?, 'grass': '??, 'electric': '??, 'ice': '??, 'fighting': '�?, 'poison': '�?, 'ground': '??, 'flying': '�?, 'psychic': '�?, 'bug': '??, 'rock': '�?, 'ghost': '�?, 'dragon': '�?, 'steel': '??, 'dark': '??, 'fairy': '�?
                        });
                        targetType = allTypes[Math.floor(Math.random() * allTypes.length)];
                    }
                }

                const candidateIds = Object.keys(SKILL_DATABASE).filter(k => SKILL_DATABASE[k].type === targetType);
                if (candidateIds.length > 0) {
                    const newSkillId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
                    const newSkill = SKILL_DATABASE[newSkillId];

                    const currentMoveIds = advStats.moves || [];
                    if (!currentMoveIds.includes(newSkillId)) {
                        setPendingSkillLearn({ level: derivedLevel, skill: newSkill });
                    }
                }
            }
        }
        previousLevelRef.current = derivedLevel;
    }, [derivedLevel, advStats.moves]);

    // --- PvP 系統專屬?�??(WebRTC/PeerJS) ---
    // --- PvP State Extracted ---

    // --- Firebase 帳�??�雲端�?步�???---
    const [user, setUser] = useState(null);
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [isCloudLoading, setIsCloudLoading] = useState(false);
    const [hasCheckedCloud, setHasCheckedCloud] = useState(false);
    const [lastCloudSyncTime, setLastCloudSyncTime] = useState(0);

    // Removed duplicate state variables

    // Cleanups removed

    // --- PVP ?��?榜�?�?(已模組�???useLeaderboard) ---
    // (updatePvpStats, fetchLeaderboard ?��?行�? state ??hook ?��?，於下方�??使用)

    // --- Handlers removed ---

    // Handlers removed

    // ?��??�身?�戰鬥數?�用??INIT ?��?
    function generateMyBattleStats() {
        const level = Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1));
        const speciesId = getMonsterIdWrapped();

        // --- ?�格修正系統 (Nature Modifiers) ---
        const getNatureMods = (tag) => {
            const mods = { hp: 1.0, atk: 1.0, def: 1.0, spd: 1.0 };
            const conf = NATURE_CONFIG[tag];
            if (conf) {
                if (conf.buff) mods[conf.buff] = 1.1;
                if (conf.nerf) mods[conf.nerf] = 0.9;
            }
            return mods;
        };

        const tagEntries = Object.entries(soulTagCounts);
        const best = tagEntries.reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0]);
        // 必�??��??��?一次�?談�??�數 > 0 ?��??�格
        const dominantTag = best[1] > 0 ? best[0] : 'none';
        const pNatureMods = getNatureMods(dominantTag);

        const pMaxHP = calcFinalStat('hp', speciesId, advStats.ivs.hp, advStats.evs.hp, level, pNatureMods.hp);
        const pATK = calcFinalStat('atk', speciesId, advStats.ivs.atk, advStats.evs.atk, level, pNatureMods.atk);
        const pDEF = calcFinalStat('def', speciesId, advStats.ivs.def, advStats.evs.def, level, pNatureMods.def);
        const pSPD = calcFinalStat('spd', speciesId, advStats.ivs.spd, advStats.evs.spd, level, pNatureMods.spd);

        const statsRef = SPECIES_BASE_STATS[String(speciesId)] || { types: ['normal'] };
        const pType = statsRef.types;

        // --- ?��?使用存�?中�?永�??��???? ---
        const pMoves = (advStats.moves || []).map(id => SKILL_DATABASE[id]).filter(Boolean);
        // ?��?：�??��??��??��? (?��??��?)，給?�基?��?
        if (pMoves.length === 0) pMoves.push(SKILL_DATABASE.tackle);

        return { pMaxHP, pATK, pDEF, pSPD, pType, pMoves, myId: speciesId, pLevel: level };
    };

    // Remote peer connect removed

    // ?��?觸發?�端?�步
    const saveToCloud = async (saveData) => {
        // ?�止?��?觸發�?��?��?中�??�步，�?沒�?使用??DB，�?尚未完�??��?檢查
        if (isCloudSyncing || !user || !db || !hasCheckedCloud) return;

        // ?�核心�??�性校驗】�?如�??�地?�度比雲端�?次�?步�??��?，�?對�??��???(?��??��??��??�是?��??��?作週�??�數?�更??
        if (saveData.lastSaveTime < lastCloudSyncTime) {
            console.warn(`?��? ?��??��??��?檔�??�地 ${saveData.lastSaveTime} < ?�端?�??${lastCloudSyncTime}`);
            return;
        }

        setIsCloudSyncing(true);
        console.log("?��? Attempting Cloud Save (Project ID: " + db.app.options.projectId + ")...");

        try {
            // ?�入 20 秒自?�逾�?機制，避?��??�卡�?
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("????��? (請檢?�網路�? Firebase Firestore ?�否已建�?")), 20000)
            );

            // ?��?要】�?資�??��?深度?��?並移??undefined (Firestore 不支??undefined)
            const cleanData = JSON.parse(JSON.stringify(saveData));

            // 使用?��??�離?��??��?�?(�??: users / ?�發: dev_users)
            const savePromise = db.collection(FIRESTORE_COLLECTION).doc(user.uid).set(cleanData);

            await Promise.race([savePromise, timeoutPromise]);

            setLastCloudSyncTime(saveData.lastSaveTime);
            console.log("?��? Cloud Save SUCCESS! (UID: " + user.uid + ")");
        } catch (e) {
            console.error("?��? Cloud Save FAILED:", e);
            // ?��??�誤類�??��??�具體�?建議
            let specificMsg = e.message;
            if (e.code === 'permission-denied') {
                specificMsg = "存�?被�? (請檢??Firestore Rules 設�?)";
            } else if (e.code === 'not-found') {
                specificMsg = "?��??�目�?(請確�?Firestore 已建立�??�庫)";
            }

            setAlertMsg(`???�端?�步失�?: ${specificMsg}`);
            updateDialogue(`???�份失�?�?{specificMsg}?�可檢查?�制??(F12) ??UID 並確�?Firestore 已建立。`, true);
        } finally {
            setIsCloudSyncing(false);
        }
    };

    // 從雲端�??�進度
    const loadFromCloud = async (currentUser) => {
        if (!currentUser || !db) return;
        updateDialogue("?��? �?��檢查?�端?�步?�??..", true);
        setIsCloudLoading(true);
        try {
            // 使用?��??�離?��??��?�?(�??: users / ?�發: dev_users)
            const doc = await db.collection(FIRESTORE_COLLECTION).doc(currentUser.uid).get();
            const localStr = localStorage.getItem('pixel_monster_save');
            let localData = localStr ? JSON.parse(localStr) : null;

            // --- ?�� 跨帳?��?護�?�?(UID ?�?��?檢查) ?�� ---
            if (localData && localData.ownerUid && localData.ownerUid !== currentUser.uid) {
                console.warn(`?��? ?�現跨帳?��?突�??�地存�?屬於 ${localData.ownerUid}，�??�目?�登?��???${currentUser.uid}?��?強�?以雲端�??�為準。`);
                localData = null; // ?�除?�地不屬?�該使用?��??��?，以該帳?��??�端?�新?�戲?��?
            }

            if (doc.exists) {
                const cloudData = doc.data();
                const cloudTime = cloudData.lastSaveTime || 0;
                const localTime = (localData && localData.lastSaveTime) || 0;

                console.log(`?��? Sync Check - Cloud: ${new Date(cloudTime).toLocaleString()}, Local: ${new Date(localTime).toLocaleString()}`);

                // 比�??��??��?，�??�?��?(且�??�是?��??�人?��??��??��? localData 已�?濾�?)
                if (!localData || (cloudTime > localTime + 2000)) {
                    // ??增�??�本檢查：�??�雲端�??��??��?符�?不進�??�步
                    if (cloudData.saveVersion !== SAVE_VERSION) {
                        console.warn(`?��? ?�端資�??�本 (${cloudData.saveVersion}) ?�當?��?式碼?�本 (${SAVE_VERSION}) 不符，跳?��?步以?�止資�?衝�??�`);
                        setHasCheckedCloud(true);
                        setIsCloudLoading(false);
                        return;
                    }

                    updateDialogue("?��? ?�現較新?�雲端進度，�?步中...", true);
                    localStorage.setItem('pixel_monster_save', JSON.stringify(cloudData));
                    setTimeout(() => window.location.reload(), 1500);
                    // 不�???isCloudLoading，直?�網?�刷??
                } else {
                    updateDialogue(`?��? 帳�?????��?，本?�進度已是?�?�`, false);
                    setHasCheckedCloud(true);
                    setIsCloudLoading(false);

                    // ?��?：�?始�??�步?��??��?，防止�?�?autosave ?�為 T1 == T1 被�?�?
                    setLastCloudSyncTime(cloudTime);
                    saveToCloud(localData);   // 確�??�步
                }
            } else {
                updateDialogue("?��? 第�?次�??，正?�建立雲端�?始�?�?..", false);
                setHasCheckedCloud(true);
                setIsCloudLoading(false);
                // ?��??�本?��??�為?�訪�?(??ownerUid)?��??�「本人」�?，�?建�??��??�份
                if (localData) saveToCloud(localData);
            }
        } catch (e) {
            console.error("?��? Cloud Load Error:", e);
            updateDialogue(`?�端讀?�錯�? ${e.message}`, true);
            setHasCheckedCloud(true);
            setIsCloudLoading(false);
        }
    };

    // ??��?�入?�??
    useEffect(() => {
        if (!auth) return;
        const unsubscribe = auth.onAuthStateChanged((u) => {
            setUser(u);
            if (u) {
                loadFromCloud(u);
            }
        });
        return () => unsubscribe();
    }, []);

    const loginWithGoogle = async () => {
        if (!auth || !googleProvider) {
            console.error("Firebase not initialized", { auth, googleProvider });
            setAlertMsg("系統尚未?��?: Firebase ?��??�失?��?);
            return;
        }

        // --- ?�� ?�測??In-App Browser ?�主?��???---
        if (isInAppBrowser) {
            updateDialogue("?��? ?�測??LINE/FB ?�部?�覽?�。\nGoogle 不支?�在此登?��?, true);
            setAlertMsg("請�??�右上�? [...] 並選?�「使?�瀏覽?��??�」�??�入??);
            playBloop('fail');
            return;
        }

        updateDialogue("??�?��??? Google 伺�???..", true);
        try {
            // 首�??�試彈出視�? (Popup)
            const result = await auth.signInWithPopup(googleProvider);
            if (result.user) {
                updateDialogue(`?? ?�入?��?: ${result.user.displayName}`, false);
                setAlertMsg(`?��????帳�?: ${result.user.displayName}`);
                playBloop('success');
                setTimeout(() => loadFromCloud(result.user), 1000);
            }
        } catch (e) {
            console.error("?��? Login Error:", e);

            // --- ?�� ?��?修正：�???disallowed_useragent (Google ?��??��?) ---
            if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request') {
                // ?�試轉為 Redirect 模�?，這在?��?行�??�覽?��?穩�?
                updateDialogue("�?��?��??��??��??�登?�模�?..", true);
                try {
                    await auth.signInWithRedirect(googleProvider);
                    return; // 程�??�跳轉網??
                } catch (reErr) {
                    console.error("Redirect Error:", reErr);
                }
            }

            let errMsg = e.message;
            if (e.code === 'auth/popup-closed-by-user') errMsg = "?�入視�?被�??��???;
            if (e.code === 'auth/unauthorized-domain') errMsg = "網�?尚未?��?，�???Firebase 設�???;

            // ?��??��??��??�特?�說??
            if (e.message.includes('disallowed_useragent') || e.code?.includes('disallowed-user-agent')) {
                updateDialogue("??Google ?��??�制：�?點�??��?角�?..?�並?�「使?�瀏覽?��??�」�?, true);
                setAlertMsg("此瀏覽?�環境�?符�? Google 安全?��???);
            } else {
                updateDialogue(`???�入失�?: ${errMsg}`, true);
                setAlertMsg(`?�入失�?: ${errMsg}`);
            }
        }
    };

    const logoutGoogle = async () => {
        if (!auth) return;
        try {
            await auth.signOut();
            // ?�出?�執行本?��?檔�??��??�止跨帳?��?�?
            try {
                localStorage.removeItem('pixel_monster_save');
                sessionStorage.removeItem('pixel_monster_save');
            } catch (e) { }
            playBloop('pop');
            updateDialogue("已退?�登?�並清除?�地快�???);
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) { console.error(e); }
    };


    const [inventory, setInventory] = useState(initialData?.inventory || []);
    const [lastAdvTime, setLastAdvTime] = useState(initialData?.lastAdvTime || 0);
    const [advLog, setAdvLog] = useState([]);
    const [isAdvMode, setIsAdvMode] = useState(false);
    const [advCD, setAdvCD] = useState(0);
    const [isAdvStreaming, setIsAdvStreaming] = useState(false);
    const [isStatusUIOpen, setIsStatusUIOpen] = useState(false);
    const [alertMsg, setAlertMsg] = useState("");
    const [isInventoryOpen, setIsInventoryOpen] = useState(false);

    // --- ?��??�步?��???(Data Sync) ---
    // ?�寵?�進�??�更?��?，確�?baseStats 被正確�?�?(?��? render 層�??��?�?FinalStats)

    // --- ?�� 官方?�值�?算核�??�� ---
    const getIVGrade = (iv) => {
        if (iv >= 31) return "S";
        if (iv >= 25) return "A";
        if (iv >= 15) return "B";
        if (iv >= 10) return "C";
        return "D";
    };

    // Final stat calculation is now managed in monsterData.js



    // --- ?��?系統專屬?�??(Diary State) ---
    const [diaryLog, setDiaryLog] = useState(() => loadDiaryData());
    const [todayTrainWins, setTodayTrainWins] = useState(getInit('todayTrainWins', 0));
    const [todayWildDefeated, setTodayWildDefeated] = useState(getInit('todayWildDefeated', 0));
    const [todayBondGained, setTodayBondGained] = useState(getInit('todayBondGained', 0));
    const [todayFeedCount, setTodayFeedCount] = useState(getInit('todayFeedCount', 0));
    const [todayHasEvolved, setTodayHasEvolved] = useState(getInit('todayHasEvolved', false));
    const [todaySpecialEvent, setTodaySpecialEvent] = useState(getInit('todaySpecialEvent', '今日尚無?�大事件'));
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
    const [selectedItemIdx, setSelectedItemIdx] = useState(0);
    const [isUsingItem, setIsUsingItem] = useState(false);
    const [pendingWildCapture, setPendingWildCapture] = useState(null); // { id, name }

    // --- 經典?��??�戰鬥�???---
    const [battleState, setBattleState] = useState({
        active: false,
        mode: 'wild', // wild ??trainer
        turn: 0,
        phase: 'intro', // intro, player_action, combat, end
        player: null, // { hp, maxHp, atk, spd }
        enemy: null, // { id, name, hp, maxHp, atk, spd }
        logs: [], // ?�鬥對話?��????
        isPlayerTurn: true,
        menuIdx: 0,
        stepQueue: [], // ?��?：�?步�?作�???
        activeMsg: "",  // ?��?：目?�正?�播?��??��?
        flashTarget: null // 'player' | 'enemy' | null
    });

    const [pendingAdvLogs, setPendingAdvLogs] = useState([]); // ?��?待顯示�??�險?��??��?

    const tabIdRef = useRef(Math.random().toString(36).substr(2, 9));
    const [isDuplicateTab, setIsDuplicateTab] = useState(false);

    // 多�??�競?�檢??(Heartbeat Lock)
    useEffect(() => {
        const checkTab = () => {
            const now = Date.now();
            const activeTabId = localStorage.getItem('pixel_monster_active_tab_id');
            const activeTabTime = parseInt(localStorage.getItem('pixel_monster_active_tab_time') || '0');

            // 如�?已�??��??��??��?�?(?��?差�???3 �?
            if (activeTabId && activeTabId !== tabIdRef.current && (now - activeTabTime < 3000)) {
                setIsDuplicateTab(true);
            } else {
                setIsDuplicateTab(false);
                localStorage.setItem('pixel_monster_active_tab_id', tabIdRef.current);
                localStorage.setItem('pixel_monster_active_tab_time', now.toString());
            }
        };

        checkTab();
        const timer = setInterval(() => {
            if (document.hidden) return;
            checkTab();
        }, 1500);
        return () => {
            clearInterval(timer);
            // ?��??��??��?定�?讓其他�??�能快速接??
            if (localStorage.getItem('pixel_monster_active_tab_id') === tabIdRef.current) {
                localStorage.removeItem('pixel_monster_active_tab_id');
                localStorage.removeItem('pixel_monster_active_tab_time');
            }
        };
    }, []);

    // ?�險?��??��??��??��?下方
    useEffect(() => {
        if (advLogRef.current) {
            advLogRef.current.scrollTop = advLogRef.current.scrollHeight;
        }
    }, [advLog, isAdvStreaming]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [btnPressed, setBtnPressed] = useState(null);
    const idleTimeoutRef = useRef(null);
    const lastAliveMonsterIdRef = useRef(1000);
    const [showRestartHint, setShowRestartHint] = useState(false);
    const [isBooting, setIsBooting] = useState(true); // 每次?�新?��??��??��??�登?�畫??
    const [bootMonsterId, setBootMonsterId] = useState(() => Math.floor(Math.random() * 28) + 1000);
    const [bootMonsterPosIdx, setBootMonsterPosIdx] = useState(0); // 0:左�?, 1:?��?, 2:左�?, 3:?��?
    const [isBootMonsterVisible, setIsBootMonsterVisible] = useState(true);

    // ?��??�面心跳??
    useEffect(() => {
        let timer;
        if (isBooting) {
            timer = setInterval(() => {
                if (document.hidden) return;
                playBloop('heartbeat');
            }, 2000);
        }
        return () => clearInterval(timer);
    }, [isBooting]);

    // ?��??�面?�獸跳槽?�畫 (?�個�??�巡�?+ ?��??��?)
    useEffect(() => {
        let timer;
        if (isBooting) {
            timer = setInterval(() => {
                if (document.hidden) return;
                setIsBootMonsterVisible(false); // 觸發淡出
                setTimeout(() => {
                    setBootMonsterPosIdx(prev => (prev + 1) % 4);
                    setBootMonsterId(Math.floor(Math.random() * 28) + 1000); // 每次跳�??�更?�怪獸 ID (1000-1027)
                    setIsBootMonsterVisible(true); // 觸發淡入
                }, 1000); // 1秒�?淡出?�渡
            }, 10000); // 10秒�??�週�?
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isBooting]);

    // ?��??�併?��??��??��?以�?確�??�稱/?�述?�步?�?��?設�?
    // ?? ?��?：�??��?�?(Sanitization) - ?�濾?�已不�??��? ID ?�無?�數??
    useEffect(() => {
        // 1. ?��?清�?
        const merged = [];
        let changed = false;

        if (!inventory.find(it => it.id === 'DIARY')) {
            merged.push({ ...DIARY_ITEM });
            changed = true;
        } else {
            merged.push({ ...DIARY_ITEM });
        }

        inventory.forEach(item => {
            if (item.id === 'DIARY') return;
            let searchId = String(item.id);
            if (searchId.length < 3 && !isNaN(searchId)) {
                searchId = searchId.padStart(3, '0');
            }
            const latestDef = ADV_ITEMS.find(it => it.id === searchId);
            const updatedItem = latestDef ? { ...item, ...latestDef, id: searchId } : item;

            if (latestDef && (item.id !== searchId || item.name !== latestDef.name || item.skillId !== latestDef.skillId)) {
                changed = true;
            }

            const existing = merged.find(it => it.id === updatedItem.id);
            if (existing) {
                existing.count = (existing.count || 1) + (updatedItem.count || 1);
                changed = true;
            } else {
                merged.push({ ...updatedItem, count: updatedItem.count || 1 });
            }
        });

        setInventory(merged);

        // 2. ?��?清�? (Owned Monsters)
        // ?�濾?��?屬於 OBTAINABLE_MONSTER_IDS ?��? ID
        setOwnedMonsters(prev => {
            const valid = prev.filter(id => OBTAINABLE_MONSTER_IDS.includes(String(id)));
            if (valid.length !== prev.length) {
                console.log(`?�� 已自?��???${prev.length - valid.length} ?��??��??��?紀?�`);
                return valid;
            }
            return prev;
        });

        // 3. ?��?清�? (Monster Moves)
        // ?�濾?�已�?SKILL_DATABASE 移除?��?�?
        setAdvStats(prev => {
            const validMoves = (prev.moves || []).filter(mId => SKILL_DATABASE[mId]);
            if (validMoves.length !== (prev.moves || []).length) {
                console.log(`?�� 已�??�獸?��?中移??${prev.moves.length - validMoves.length} ?��??��?式`);
                return { ...prev, moves: validMoves };
            }
            return prev;
        });

    }, []);


    // 追蹤上�?次�?檔�??�容（�??��??�戳記�?，用來判?�是?��??��?變�?
    const lastSavedDataRef = useRef("");

    // ?��??��?紀?�器：只?�發?�具體�??��??��??�新 lastSaveTime
    const recordGameAction = () => {
        setLastSaveTime(Date.now());
    };

    // 1️⃣ ?�地存�?：�?責頻繁更??localStorage (?�含每�?跳�??�數??
    useEffect(() => {
        try {
            // �?5 秒�?多儲存�?次�??��??��?要�?�?(?��?觸發)
            const now = Date.now();
            if (now - lastSaveTimeRef.current < 5000) return;

            const currentData = {
                saveVersion: SAVE_VERSION,
                hunger, mood, isSleeping, isPooping, evolutionStage, evolutionBranch,
                trainWins, stageTrainWins, feedCount, steps, interactionLogs, interactionCount, isDead, finalWords, lastEvolutionTime,
                deathBranch, bondValue, talkCount, lockedAffinity, soulAffinityCounts, soulTagCounts,
                advStats, inventory, lastAdvTime,
                todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount, lastDiaryDate,
                todayHasEvolved, todaySpecialEvent, todayEventPriority,
                ownedMonsters,
                lastSaveTime: lastSaveTime,
                ownerUid: user?.uid || null
            };
            const currentDataStr = JSON.stringify(currentData);
            if (currentDataStr === lastSavedDataRef.current) return;

            localStorage.setItem('pixel_monster_save', currentDataStr);
            lastSavedDataRef.current = currentDataStr;
            lastSaveTimeRef.current = now;
        } catch (e) { }
    }, [user, hunger, mood, isSleeping, isPooping, evolutionStage, evolutionBranch, trainWins, stageTrainWins, feedCount, steps, interactionLogs, interactionCount, isDead, finalWords, lastEvolutionTime, deathBranch, bondValue, talkCount, lockedAffinity, soulAffinityCounts, soulTagCounts, advStats, inventory, lastAdvTime, todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount, lastDiaryDate, todayHasEvolved, todaySpecialEvent, todayEventPriority, ownedMonsters, lastSaveTime]);

    // 2️⃣ ?�端?�步：獨立監?��?大�??��?不�? hunger/mood 跳�?影響
    useEffect(() => {
        if (user && hasCheckedCloud && lastSaveTime > 0) {
            // ?��??��?大�?作發??(lastSaveTime 變更) ?��??��?程�?�?
            // 使用較短??2 秒延?��?且�??�被 hunger 衰�?給中??
            const timer = setTimeout(() => {
                const latestData = JSON.parse(lastSavedDataRef.current || '{}');
                saveToCloud(latestData);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, hasCheckedCloud, lastSaveTime]);

    // ?��??��??��?存�?（�?�?diaryLog 變更?�觸?��?
    useEffect(() => {
        saveDiaryData({ ...diaryLog });
    }, [diaryLog]);

    // ?��?跨�??�測?�自?�歸檔�?�?30 秒檢?��?次�?確�?深�?跨日也能�?��歸�?�?
    useEffect(() => {
        const archiveToday = () => {
            const todayStr = getTodayStr();
            setLastDiaryDate(prev => {
                if (prev !== todayStr) {
                    // ?��?跨�?：�??�日?��?歸入?��?
                    // 計�??��??�?�勢?��?
                    const dominantTag = Object.entries(soulTagCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];
                    const petMsg = getPetDailyMessage(lockedAffinity);

                    setDiaryLog(d => ({
                        ...d,
                        [prev]: {
                            trainWins: todayTrainWins,
                            wildDefeated: todayWildDefeated,
                            specialEvent: todaySpecialEvent,
                            dominantTag: dominantTag,
                            petMessage: petMsg,
                            evolutionStageEnd: evolutionStage,
                            evolutionBranch: evolutionBranch,
                        }
                    }));
                    // ?�置今日計數?��?事件
                    setTodayTrainWins(0);
                    setTodayWildDefeated(0);
                    setTodayBondGained(0);
                    setTodayFeedCount(0);
                    setTodayHasEvolved(false);
                    setTodaySpecialEvent('今日尚無?�大事件');
                    setTodayEventPriority(0);
                    return todayStr;
                }
                return prev;
            });
        };
        archiveToday(); // 立即?��?一�?
        const timer = setInterval(() => {
            if (document.hidden) return;
            archiveToday();
        }, 30000); // �?30 秒檢??
        return () => clearInterval(timer);
    }, [todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount, lockedAffinity, evolutionStage, evolutionBranch]);

    useEffect(() => {
        return () => clearTimeout(idleTimeoutRef.current);
    }, []);


    const base = import.meta.env.BASE_URL;
    const menuItems = [
        { id: 'status', sprite: ICONS.status, label: '?�???��??�寵?��??��?�?', img: `${base}assets/BG/M1.png` },
        { id: 'interact', sprite: ICONS.feed, label: '互�?(餵�??�撫?�寵??', img: `${base}assets/BG/M2.png` },
        { id: 'talk', sprite: ICONS.heart, label: '談�?(?��??�好?��?寵物?��?', img: `${base}assets/BG/M3.png` },
        { id: 'train', sprite: ICONS.train, label: '?��?(?��?寵物?�鬥??', img: `${base}assets/BG/M4.png` },
        { id: 'adventure', sprite: ICONS.focus, label: '?�險(帶寵?��?外探?��??��?)', img: `${base}assets/BG/M5.png` },
        { id: 'connect', sprite: ICONS.mail, label: '???(?��??�寵?��??�、交�?', img: `${base}assets/BG/M6.png` },
        { id: 'pedia', sprite: ICONS.footprint, label: '?��?(?��?已收?��??��??�獸)', img: `${base}assets/BG/M7.png` },
        { id: 'info', sprite: ICONS.info, label: '?��?(裝�??�利?��?寵物?��???', img: `${base}assets/BG/M8.png` },
    ];

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
                // 使用 transform: translate ?�能?�好�?但�??��???JSX ??left/top
                // ?�們直?�更??style.left/top 以�?低改?�風?��?並�??�跳??React re-render ?�目??
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

    // ??Ref 確�??�以?��?讀?��??��??�而�?觸發 useEffect ?��?
    const latestStats = useRef({ mood, hunger, stageTrainWins, deathBranch, lockedAffinity, soulAffinityCounts, soulTagCounts, bondValue, advStats });
    useEffect(() => {
        latestStats.current = { mood, hunger, stageTrainWins, deathBranch, lockedAffinity, soulAffinityCounts, soulTagCounts, bondValue, advStats };
    }, [mood, hunger, stageTrainWins, deathBranch, lockedAffinity, soulAffinityCounts, soulTagCounts, bondValue, advStats]);

    useEffect(() => {
        if (isBooting || isDead || isEvolving || miniGame || isRunaway || isDuplicateTab) return;

        const thresh = debugOverrides.evolutionMs ?? (EVO_TIMES[evolutionStage] || EVO_TIMES.FINAL_LIFETIME);

        // Total drop phase logic: Ensure it drops 100 units over the entire phase
        const TARGET_DROP_PER_STAGE = 100;
        const TICK_MS = 1000;
        const dropPerTick = TARGET_DROP_PER_STAGE * (TICK_MS / thresh);

        const decayTimer = setInterval(() => {
            setHunger(h => Math.max(0, h - dropPerTick));
            setMood(m => Math.max(0, m - dropPerTick));
        }, TICK_MS);

        return () => clearInterval(decayTimer);
    }, [isBooting, isDead, isEvolving, evolutionStage, isRunaway, debugOverrides]);

    const updateDialogue = (text) => {
        setDialogue(text);
        setMarqueeKey(prev => prev + 1);
        if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
    };

    const logEvent = (msg) => {
        setInteractionCount(c => c + 1);
        setInteractionLogs(prev => [...prev.slice(-10), { t: new Date().toLocaleTimeString(), m: msg }]);
    };

    const handleTalkChoice = (idx) => {
        if (!miniGame || miniGame.status !== 'question') return;

        const opt = SOUL_QUESTIONS[miniGame.qIdx].options[idx];
        if (!opt) return;

        const topTag = Object.entries(soulTagCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];

        let pts = (opt.tag === topTag || opt.affinity === lockedAffinity) ? 10 : 5;
        if (!lockedAffinity && topTag === 'none') { pts = 5; } // base points for early stage

        setBondValue(b => b + pts);
        setTalkCount(t => t + 1);
        setTodayBondGained(b => b + pts);
        setSoulTagCounts(s => ({ ...s, [opt.tag]: (s[opt.tag] || 0) + 1 }));
        if (!lockedAffinity) {
            setSoulAffinityCounts(s => ({ ...s, [opt.affinity]: (s[opt.affinity] || 0) + 1 }));
        }

        recordGameAction(); // 紀?��??��???
        setMiniGame(p => ({ ...p, status: 'result', points: pts }));
        playSoundEffect('success');
        updateDialogue(`�?+${pts}！`);

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
            velRef.current = { x: 0, y: -10.0 }; // ?�奮大跳�?

            // --- ?�� 實�??��??��??�獲??(+10 EVs) ?�� ---
            let statKey = 'atk';
            let statName = '?��?';
            const type = miniGame?.type;
            if (type === 'reaction') { statKey = 'spd'; statName = '?�度'; }
            else if (type === 'charge_click' || type === 'charge') { statKey = 'def'; statName = '?�禦'; }

            const gotHPBonus = Math.random() < 0.4; // 40% 機�?額�??��? HP 潛能

            setAdvStats(prev => {
                const nextEVs = { ...prev.evs };
                const updateEVFunc = (key, val) => {
                    const currentTotal = Object.values(nextEVs).reduce((a, b) => a + b, 0);
                    const canAdd = Math.min(val, 510 - currentTotal, 252 - (nextEVs[key] || 0));
                    if (canAdd > 0) nextEVs[key] += canAdd;
                };

                updateEVFunc(statKey, 10);
                if (gotHPBonus && statKey !== 'hp') updateEVFunc('hp', 10);

                return { ...prev, evs: nextEVs };
            });

            recordGameAction(); // 紀?�特訓�???
            const bonusStr = gotHPBonus ? "?��??? : "";
            updateDialogue(`經�?訓練�?{statName}${bonusStr}潛能?��?了�?`);
            logEvent(`?��??��?�?{statName}${bonusStr}潛能 +10`);
        } else {
            playSoundEffect('fail');
            setMood(m => Math.max(0, m - 5));
            updateDialogue("MISS...");
            logEvent("?��?失�???);
        }

        setTimeout(() => {
            setMiniGame(null);
            velRef.current = { x: (Math.random() - 0.5) * 4, y: -2.0 };
        }, 1500);
    };

    const playSoundEffect = (type) => playBloop(type);

    const confirmWildCapture = (confirm) => {
        if (confirm && pendingWildCapture) {
            setEvolutionBranch('WILD_' + pendingWildCapture.id);
            setLastEvolutionTime(Date.now()); // ?�� ?�獲後�?必�?置進�??��?，防止繼?��?寵物?��?導致?��??��??�暴??
            recordGameAction(); // 紀?��??��???
            setStageTrainWins(0);            // ?�置?��??��??�次

            // --- ?�� ?�置?�險?��?(?�怪獸?��??��?且給予優質個�?保�?) ?�� ---
            // 讓玩家在?�牲練度轉�??�寵?��?，能?�到?��?資質 (A~S �? ?�個�?
            const randomHighIV = () => 25 + Math.floor(Math.random() * 7); // 25~31 (Grade A~S)

            // ?��??��??��??��?等�? (?�設??1)
            const capturedLevel = pendingWildCapture.level || 1;
            const targetBasePower = (capturedLevel - 1) * 10 + 100;

            // ?��??�種 ID 尋找屬�?
            const speciesData = SPECIES_BASE_STATS[String(pendingWildCapture.id)] || { types: ['normal'] };
            const types = speciesData.types || ['normal'];

            // ?��??�獸?��??��?�?(?��?檢查 WILD_EVOLUTION_MAP 來推�?
            const getBioStage = (id) => {
                let stage = 1;
                const idStr = String(id);
                // 檢查?�否?��?人�??��???(Stage 2 ??3)
                const isStage2 = Object.values(WILD_EVOLUTION_MAP).some(v => String(v) === idStr);
                if (isStage2) {
                    stage = 2;
                    // ?�檢??Stage 2 ?�否?��??�身 (Stage 3)
                    const stage1Id = Object.keys(WILD_EVOLUTION_MAP).find(k => String(WILD_EVOLUTION_MAP[k]) === idStr);
                    if (stage1Id) {
                        const isStage3 = Object.values(WILD_EVOLUTION_MAP).some(v => String(v) === String(stage1Id));
                        if (isStage3) stage = 3;
                    }
                }
                return stage;
            };
            const bioStage = getBioStage(pendingWildCapture.id);
            setEvolutionStage(bioStage); // ?�步�?��?�進�??�段

            // 使用?�?��? generateMoves 系統?��??��? (?�代?��?硬編碼�?�?
            // ?��??��??�獸視為 initialized，�?給�?強制 bonusId，�??�由 generateMoves ?��?等�??��?級決�?
            const moves = generateMoves(bioStage, types, null, capturedLevel, false);

            setAdvStats({
                basePower: targetBasePower,
                ivs: {
                    hp: randomHighIV(),
                    atk: randomHighIV(),
                    def: randomHighIV(),
                    spd: randomHighIV()
                },
                evs: { hp: 0, atk: 0, def: 0, spd: 0 },
                bonusMoveId: moves[1] || 'tackle', // 保�?一?��??��??��???
                moves: moves
            });

            // ?�� 強制?�置等�??�測，確保新夥伴?�刻?��?且�?觸發?��?級剩餘�?學�?
            previousLevelRef.current = capturedLevel;

            // --- ?�� ?�置?�性�??�??(?�夥伴新?��?) ?�� ---
            setBondValue(0);
            setTalkCount(0);
            setLockedAffinity(null);
            setSoulAffinityCounts({ fire: 0, water: 0, grass: 0, bug: 0 });
            setSoulTagCounts({ gentle: 0, stubborn: 0, passionate: 0, nonsense: 0, rational: 0 });
            setInteractionLogs([]);
            setInteractionCount(0);
            setHunger(60);
            setMood(50);
            setIsPooping(false);
            setIsSleeping(false);

            updateDialogue(`??${pendingWildCapture.name} ?�為了�??�新夥伴！`);
            unlockMonster(pendingWildCapture.id);
        } else {
            updateDialogue("保�??��?也�?不錯??);
        }
        setPendingWildCapture(null);
        setIsAdvMode(false); // 結�??�險模�?
    };

    function executeBattleTurn(playerAction = 'attack', actionMove = null, pvpEnemyMove = null) {
        setBattleState(prev => {
            return processBattleTurn(prev, playerAction, actionMove, pvpEnemyMove, {
                isHost,
                pvpRemoteMoveRef,
                connInstance,
                setPendingPlayerMove,
                getSmartMove
            });
        });
    };

    const startAdventure = () => {
        const now = Date.now();
        const cdMs = debugOverrides.adventureCD !== null ? debugOverrides.adventureCD : ADV_BATTLE_RULES.CD_MS;
        const remainingCD = Math.max(0, Math.floor((lastAdvTime + cdMs - now) / 1000));

        if (remainingCD > 0) {
            updateDialogue(`?�好累�?讓�?休息 ${remainingCD} 秒�??�發?�`, true);
            return;
        }
        if (isAdvMode) return;

        setIsAdvMode(true);
        setAdvCurrentHP(1);
        const myId = getMonsterIdWrapped();

        // --- 起�??�報?��? ---
        const introLines = [
            { msg: "準�??�發?�險...", hpRatio: 1 },
            { msg: "�?��森�?中探�?..", hpRatio: 1 },
            { triggerEvent: true } // ?�報完�??��?後�?下�?次�? B 將觸?�隨機�?�?
        ];

        setAdvLog([introLines[0]]);
        setPendingAdvLogs(introLines.slice(1));
        setIsAdvStreaming(true);
        playBloop('heartbeat');
    };

    const executeAdventureEvent = () => {
        const myId = getMonsterIdWrapped();
        const r = Math.random();
        let bStateToTrigger = null;
        let tempLog = [];

        // --- ??�??�錯系統覆�?：�??�自定義 ---
        if (debugOverrides.encounterRates) {
            const rates = debugOverrides.encounterRates;
            // ?�於 rates ?�能?��?一?�為 1 ?��???0，這裡?�簡?��??��?權�??��? (?�然?��? UI ?��??�選)
            if (rates.wild === 1) {
                bStateToTrigger = generateBattleState('wild', myId);
            } else if (rates.trainer === 1) {
                bStateToTrigger = generateBattleState('trainer', myId);
            } else if (rates.gather === 1) {
                handleAdvGather(tempLog, myId);
            }
        } else {
            // --- ?��??�家等�? (derivedLevel) 調整機�? ---
            // 低�?級�?尋找?��??�探索�??�極高�?高�?級�??�漸轉�??�戰�?
            // 等�? 1：探�?80% / ?��?20% / 訓練�?0%
            // 等�? 50 ?�以上�??�索 0% / ?��?30% / 訓練�?70%
            const levelRatio = Math.min(1, Math.max(0, (derivedLevel - 1) / 49)); // 1級為0�?0�???以�???

            const gatherProb = 0.80 * (1 - levelRatio); // ?�索機�? (80% -> 0%)
            const trainerProb = 0.70 * levelRatio;      // 訓練師�???(0% -> 70%)
            const wildProb = 1 - gatherProb - trainerProb; // ?�怪�???(20% -> 30%)

            if (r < wildProb) {
                bStateToTrigger = generateBattleState('wild', myId);
            } else if (r < wildProb + trainerProb) {
                bStateToTrigger = generateBattleState('trainer', myId);
            } else {
                handleAdvGather(tempLog, myId);
            }
        }

        if (bStateToTrigger) {
            // 不�?立即跳�?，而是?�入?�報?��?，�?待玩家�? B
            const battleIntroLog = {
                msg: bStateToTrigger.initMsg,
                hpRatio: 1,
                iconId: bStateToTrigger.enemy.id,
                triggerBattle: bStateToTrigger
            };
            setAdvLog(prev => [...prev, battleIntroLog]);
            setPendingAdvLogs([battleIntroLog]); // �?handleB ?��??�後�? triggerBattle
            setIsAdvStreaming(true);
        } else if (tempLog.length > 0) {
            // ?��?事件：�??��??��??�入?�報?��?
            const logs = [...tempLog, { msg: "?�� ?�險已�??��???[B] 返�?", hpRatio: tempLog[tempLog.length - 1].hpRatio }];
            setAdvLog([logs[0]]);
            setPendingAdvLogs(logs.slice(1));
            setIsAdvStreaming(true);
        } else {
            // ?�常?��?也確保�??�串流�???
            setIsAdvStreaming(false);
        }
    };

    // --- 經典?��??�戰鬥�???---

    // Auto-battler loop hook
    useEffect(() => {
        if (!battleState.active) return;
        if (battleState.phase === 'end') return;

        let timer;
        if (battleState.mode === 'wild') {
            if (battleState.phase === 'intro') {
                timer = setTimeout(() => setBattleState(p => ({ ...p, phase: 'combat' })), 1500);
            } else if (battleState.phase === 'combat') {
                timer = setTimeout(() => executeBattleTurn('attack'), 1500);
            }
        } else if (battleState.mode === 'trainer' || battleState.mode === 'pvp' || battleState.mode === 'tournament') {
            if (battleState.phase === 'intro') {
                timer = setTimeout(() => setBattleState(p => ({ ...p, phase: 'player_action' })), 2000);
            }
        }
        return () => clearTimeout(timer);
    }, [battleState.active, battleState.phase, battleState.turn, battleState.mode]);

    // --- ?�� ?�鬥?�報?��??�放引�? ?�� ---
    useEffect(() => {
        if (!battleState.active || battleState.phase !== 'action_streaming') return;

        // ?�斷?��??��?類�?決�??��??��?
        const currentStep = battleState.stepQueue.length > 0 ? battleState.stepQueue[0] : null;
        const delay = currentStep && currentStep.type === 'damage' ? 600 : 1300; // 訊息 1.3s，傷害�???0.6s

        const timer = setTimeout(() => {
            // 模擬?��? B ?�觸?�更??
            setBattleState(prev => {
                if (prev.stepQueue.length > 30) return prev; // Safety net

                // ?��???handleB ?�輯?��??��??�更??
                if (prev.stepQueue.length > 0) {
                    const nextStep = prev.stepQueue[0];
                    const updated = { ...prev, stepQueue: prev.stepQueue.slice(1), activeMsg: nextStep.text || "" };

                    if (nextStep.type === 'damage') {
                        if (nextStep.target === 'enemy') updated.enemy = { ...updated.enemy, hp: Math.max(0, updated.enemy.hp - nextStep.value) };
                        else updated.player = { ...updated.player, hp: Math.max(0, updated.player.hp - nextStep.value) };
                        updated.flashTarget = nextStep.target;
                        playBloop('pop');
                    } else if (nextStep.type === 'heal') {
                        if (nextStep.target === 'enemy') updated.enemy = { ...updated.enemy, hp: Math.min(updated.enemy.maxHp, updated.enemy.hp + nextStep.value) };
                        else updated.player = { ...updated.player, hp: Math.min(updated.player.maxHp, updated.player.hp + nextStep.value) };
                        updated.flashTarget = null;
                        playBloop('success');
                    } else if (nextStep.type === 'run') {
                        updated.phase = 'end';
                        setTimeout(() => resolveBattleLoss(true), 1200);
                    } else {
                        updated.flashTarget = null;
                    }

                    if (updated.player.hp <= 0 || updated.enemy.hp <= 0) updated.stepQueue = [];
                    return updated;
                } else {
                    // ?��?結�?，進�??�後�??�值校�?
                    const finalPlayerHp = prev.playerHpAfter !== undefined ? prev.playerHpAfter : prev.player.hp;
                    const finalEnemyHp = prev.enemyHpAfter !== undefined ? prev.enemyHpAfter : prev.enemy.hp;

                    if (prev.player.hp <= 0 || prev.enemy.hp <= 0) {
                        const isWin = prev.enemy.hp <= 0;
                        const next = {
                            ...prev,
                            phase: 'end',
                            activeMsg: isWin ? "?? ?�鬥?�利�? : "?? ?��??�耗盡...",
                            flashTarget: null,
                            player: { ...prev.player, hp: finalPlayerHp },
                            enemy: { ...prev.enemy, hp: finalEnemyHp }
                        };

                        // ?��?計�?經�???(??handleB ?�輯?�步)
                        const scaling = 1 + evolutionStage * 0.2;
                        const gain = Math.floor((prev.mode === 'trainer' ? 5 : 2) + scaling);

                        setTimeout(() => isWin ? resolveBattleWin(gain, prev.enemy) : resolveBattleLoss(), 1500);
                        return next;
                    }

                    // ?�鍵修正：�?外戰鬥�??�到 'combat' 觸發?��?循環，�?練家?�鬥?��???'player_action' 等�??�令
                    const nextPhase = prev.mode === 'wild' ? 'combat' : 'player_action';

                    // ?�用計�?結�??��??��?HP ?��?，�??�百?��??��??�本?��??�其他屬??(�?moves)
                    const finalPlayer = { ...prev.player, hp: finalPlayerHp };
                    const finalEnemy = { ...prev.enemy, hp: finalEnemyHp };

                    return {
                        ...prev,
                        phase: nextPhase,
                        activeMsg: "",
                        turn: prev.turn + 1,
                        flashTarget: null,
                        player: finalPlayer,
                        enemy: finalEnemy
                    };

                }
            });
        }, delay);

        return () => clearTimeout(timer);
    }, [battleState.active, battleState.phase, battleState.stepQueue.length, evolutionStage]);


    const resolveBattleWin = (finalGain, enemy) => {
        const myId = getMonsterIdWrapped();
        const logs = [];

        logs.push({ msg: `?? ?�鬥?�利！獲�?${finalGain} 點�??�。`, hpRatio: 1, iconId: myId });
        applyAdvGain(finalGain, logs, advCurrentHP, myId);
        recordGameAction(); // 紀?��??��???
        if (battleState.mode === 'wild' && enemy) {
            setTodayWildDefeated(n => n + 1);
            const priority = enemy.isElite ? 2 : 1;
            const prefix = enemy.isElite ? '?��?了精?�怪�?' : '?��?了�??��?';
            updateDiaryEvent(`${prefix}${enemy.name || '?�知?�獸'}`, priority);
        }

        let shouldDropItem = false;
        if (battleState.mode === 'trainer') shouldDropItem = true;
        if (battleState.mode === 'wild' && (enemy.isElite || Math.random() < 0.15)) shouldDropItem = true;

        if (shouldDropItem) {
            const weights = { 1: 100, 2: 50, 3: 20, 4: 5, 5: battleState.mode === 'trainer' ? 1 : 2 };
            const pool = [];
            ADV_ITEMS.forEach(it => {
                const w = weights[it.rarity] || 1;
                const count = enemy.isElite && it.rarity >= 3 ? w * 3 : w;
                for (let i = 0; i < count; i++) pool.push(it);
            });
            const item = pool[Math.floor(Math.random() * pool.length)];

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
            logs.push({ msg: `?? ?��?了戰?��?�?{item.name}！`, hpRatio: 1, iconId: myId });
        }

        const catchRate = debugOverrides.catchRate ?? 0.1;
        if (battleState.mode === 'wild' && enemy && Math.random() < catchRate) {
            logs.push({ msg: `???�覺 ${enemy.name || '�?} ?��??��??�夥�?..`, hpRatio: 1 });
            logs.push({ promptCapture: { id: enemy.id, name: enemy.name, level: enemy.level } });
        }

        logs.push({ msg: "?�� ?�險已�??��???[B] 返�?", hpRatio: 1 });

        if (battleState.mode === 'tournament') {
            setBattleState(prev => ({ ...prev, active: false }));
            return;
        }

        if (battleState.mode === 'pvp') {
            handleBattleEnd(true);
            return; // PvP 模�?不進入?�險流�?
        }

        // Hide Battle UI but remain in Adventure overlay
        setBattleState(prev => ({ ...prev, active: false }));

        if (logs.length > 0) {
            // ?��??��??�報流�?：顯示第一�?
            const firstLine = logs[0];
            setAdvLog([firstLine]);
            if (firstLine.hpRatio !== undefined) setAdvCurrentHP(firstLine.hpRatio);
            setPendingAdvLogs(logs.slice(1));
            setIsAdvStreaming(true);
        }
        playBloop('pop');
    };

    const resolveBattleLoss = (isRun = false) => {
        if (battleState.mode === 'tournament') {
            setBattleState(prev => ({ ...prev, active: false }));
            return;
        }
        if (battleState.mode === 'pvp') {
            handleBattleEnd(false);
            return; // PvP 模�?不進入?�險流�?
        }

        const logs = [];
        if (!isRun) {
            setAdvCurrentHP(0);
            logs.push({ msg: `?? ?��??�退�?.. ?�要�??��?飯糰了`, hpRatio: 0 });
        } else {
            logs.push({ msg: `?�� ?��??��?...`, hpRatio: advCurrentHP });
        }
        logs.push({ msg: "?�� ?�險已�??��???[B] 返�?", hpRatio: isRun ? advCurrentHP : 0 });

        setBattleState(prev => ({ ...prev, active: false }));

        if (logs.length > 0) {
            // ?��??��??�報流�?：顯示第一�?
            const firstLine = logs[0];
            setAdvLog([firstLine]);
            if (firstLine.hpRatio !== undefined) setAdvCurrentHP(firstLine.hpRatio);
            setPendingAdvLogs(logs.slice(1));
            setIsAdvStreaming(true);
        }
        playBloop('pop');
    };

    const handleA = () => {
        if (isCloudLoading || isInteractAnimating) return; // ?�端?�步?��??�表演中禁止?��?
        if (alertMsg) {
            setAlertMsg("");
            playBloop('pop');
            return;
        }
        if (isLeaderboardOpen) {
            setLeaderboardPage(prev => (prev + 1) % 10);
            playBloop('pop');
            return;
        }
        if (isPvpMode && matchStatus !== 'matched') {
            playBloop('fail');
            return;
        }
        if (isDiaryOpen) {
            // A ?��??��?翻到?��?�?
            setDiaryViewDate(prev => {
                const todayStr = getTodayStr(); // 確�??��??�地??
                const d = new Date(prev || todayStr);
                d.setDate(d.getDate() - 1);
                return getTodayStr(d);
            });
            playBloop('pop');
            return;
        }
        if (battleState.active && (battleState.mode === 'trainer' || battleState.mode === 'pvp' || battleState.mode === 'tournament')) {
            if (battleState.phase === 'player_action') {
                // Bug Fix #3: 游�??�在?��??��??�循?��??��??�到空格浪費?��?
                const numMoves = battleState.player?.moves?.length || 1;
                setBattleState(prev => ({ ...prev, menuIdx: ((prev.menuIdx || 0) + 1) % numMoves }));
                playBloop('pop');
            }
            return; // ?�鬥?��??�截 A ?��??�止穿�?
        }
        if (pendingWildCapture && !isAdvStreaming) {
            confirmWildCapture(false); // A ?��?律為 NO
            playBloop('pop');
            return;
        }
        if (isConfirmingReplace) {
            setSkillSelectIdx(prev => (prev + 1) % 2); // 0: YES, 1: NO
            playBloop('pop');
            return;
        }
        if (pendingSkillLearn && !isAdvMode && !isPvpMode && !battleState.active) {
            const maxIdx = advStats.moves.length < 4 ? 2 : advStats.moves.length; // 沒滿??0:�?1:�? 滿�???0-3:??4:�?
            setSkillSelectIdx(prev => (prev + 1) % (maxIdx + 1));
            playBloop('pop');
            return;
        }

        // ?�� ?��?大賽?��??�勵：選?��???
        if (tournament.isTournamentOpen && tournament.tPhase === 'champion_reward_move') {
            tournament.setSelectedRewardMoveIdx(prev => (prev + 1) % (advStats.moves.length || 1));
            playBloop('pop');
            return;
        }

        // ?�� ?��?大賽?��??�勵：選?��???
        if (tournament.isTournamentOpen && tournament.tPhase === 'champion_reward_effect') {
            tournament.setSelectedRewardEffectIdx(prev => (prev + 1) % (tournament.rewardOptions.length || 1));
            playBloop('pop');
            return;
        }

        // ?�� ?��?大賽?�鴿?�卡 (?��?度�??��??�學習�??��?衝�?)
        if (tournament.isTournamentOpen && tournament.tPhase === 'rogue_selection' && !pendingSkillLearn) {
            const numOptions = tournament.rogueOptions?.length || 1;
            tournament.setSelectedCardIdx(prev => (prev + 1) % numOptions);
            playBloop('pop');
            return;
        }

        if (isStatusUIOpen || isAdvMode) return;
        if (isInventoryOpen) {
            if (isUsingItem) return; // 使用中�?止�???
            if (inventory.length > 0) {
                setSelectedItemIdx(prev => (prev + 1) % inventory.length);
                playBloop('pop');
            }
            return;
        }
        if (isConfirmingFarewell) {
            setIsConfirmingFarewell(false);
            updateDialogue("?�吼?��?");
            return;
        }
        if (isPediaOpen) {
            if (isPediaDetailOpen) {
                setIsPediaDetailOpen(false);
            } else {
                const monsterCount = OBTAINABLE_MONSTER_IDS.length;
                setPediaIdx(prev => (prev + 1) % monsterCount);
            }
            playBloop('pop');
            return;
        }
        if (isBooting) {
            setIsBooting(false);
            const isFreshStart = !initialData || (interactionCount === 0 && trainWins === 0);

            if (isFreshStart) {
                setLastEvolutionTime(Date.now());
                updateDialogue("家裡來�?一?��??��??�獸...", true);
            } else {
                updateDialogue("主人歡�??��?~", true);
            }
            playBloop('success');
            return;
        }

        if (pendingWildCapture && !isAdvStreaming) {
            // A ?�在?��?介面一律為 跳�? (NO)
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
        if (isInteractMenuOpen) {
            setInteractMenuIdx(prev => (prev + 1) % 3);
            const labels = ["餵�?", "?�摸", "結�?互�?"];
            updateDialogue(`?��?�?{labels[(interactMenuIdx + 1) % 3]}`);
            playBloop('pop');
            return;
        }
        const next = (activeIndex + 1) % menuItems.length;
        setActiveIndex(next);
        updateDialogue(menuItems[next].label);
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
        if (isCloudLoading || isInteractAnimating) return; // ?�端?�步?��??�表演中禁止?��?
        const currentSkillIdx = clickIdx !== null ? clickIdx : skillSelectIdx;

        if (alertMsg) {
            setAlertMsg("");
            playBloop('pop');
            return;
        }
        if (battleState.active && (battleState.mode === 'pvp' || battleState.mode === 'trainer' || battleState.mode === 'tournament')) {
            if (battleState.phase === 'player_action') {
                // ?��?�?.4秒內不�?許�?複�?交�?�?(?��?對戰流暢�?
                const now = Date.now();
                if (isPvpMode && (now - (window.lastPvpActionTime || 0) < 400)) return;
                window.lastPvpActionTime = now;

                const currentIdx = battleState.menuIdx || 0;
                const move = battleState.player?.moves?.[currentIdx];
                if (move) {
                    // ?��? 沉�?緩�? 5 秒�??��??�已經出??(pvpRemoteMoveRef ?��?，延�?5 秒�?算以確�?對�?
                    if (isPvpMode && pvpRemoteMoveRef.current) {
                        // ?��??�?�設?��?待�?視覺上維?�「�?待中?�避?�玩家以?�當�?
                        setBattleState(prev => ({ ...prev, phase: 'waiting_opponent' }));
                        setTimeout(() => executeBattleTurn('attack', move), 5000);
                    } else {
                        executeBattleTurn('attack', move);
                    }
                } else {
                    const errorMsg = battleState.mode === 'pvp' ? "尚未裝�??�?��?" : "該格子�??��??��??��?";
                    const tempLogs = [...battleState.logs, errorMsg];
                    setBattleState(prev => ({ ...prev, logs: tempLogs.slice(-5) }));
                    playBloop('fail');
                }
            }
            return; // ?��?修正：只要是對戰中�?任�? phase ?��??�截 B ?��??�止穿透到?�景?�單?��? cleanupPvp
        }
        if (isDiaryOpen) {
            // B ?��??��??��?
            setIsDiaryOpen(false);
            playBloop('pop');
            return;
        }
        // 1. ?��??��??�?�學�??��?介面 (Skill Learn Overlay)
        // 增�??��?級�?且移??!battleState.active ?�制（�?許在?��??�鬥中使?��?笈書後�??�進入學�?�?
        if (pendingSkillLearn) {
            // 如�?�?��二次確�??��??��?
            if (isConfirmingReplace) {
                if (currentSkillIdx === 0) { // YES (學�?)
                    handleLearnSkill(pendingSkillLearn.skill.id, tempReplaceIdx);
                    setIsConfirmingReplace(false);
                    setTempReplaceIdx(-1);
                } else { // NO (不學�?
                    setIsConfirmingReplace(false);
                    setSkillSelectIdx(0);
                }
                playBloop('success');
                return;
            }

            // 一?�學習�???
            if (!isAdvMode && !isPvpMode) {
                const currentMoveCount = advStats.moves.length;
                if (currentMoveCount < 4) {
                    if (currentSkillIdx === 0) {
                        handleLearnSkill(pendingSkillLearn.skill.id);
                    } else {
                        setPendingSkillLearn(null);
                    }
                } else {
                    if (currentSkillIdx === 4) { // ?��??�放棄�?
                        setPendingSkillLearn(null);
                    } else {
                        // ?��? 0, 1, 2, 3 ?��??��?�?
                        setTempReplaceIdx(currentSkillIdx);
                        setIsConfirmingReplace(true);
                        setSkillSelectIdx(0); // ?�設跳到 ??(0)
                    }
                }
                playBloop('success');
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

        // --- ?��?大賽?��?轉場 ---
        if (tournament.isTournamentOpen && ['intro', 'bracket', 'battle_intro', 'rogue_selection', 'champion_reward_move', 'champion_reward_effect', 'champion', 'lost'].includes(tournament.tPhase)) {
            tournament.nextTournamentPhase();
            playBloop('success');
            return;
        }

        if (isEvolving || isAdvMode) {
            // --- ?�鬥?�報模�? (Step-by-Step) --- 
            // ??已�??��? B ?�推?�移?��???useEffect ?��??�放引�??��?
            if (battleState && battleState.active && battleState.phase === 'action_streaming') {
                return;
            }

            // ??移除?��???B ?�進播??(?�自??Timer ?��?)
            if (battleState?.active) {
                return; // ?�鬥?��?（�???intro, player_action, streaming, end）B ?�都不�?觸發?�險結�?
            }

            if (isAdvStreaming && (pendingAdvLogs?.length || 0) >= 0) {
                if (pendingAdvLogs.length > 0) {
                    const nextLine = pendingAdvLogs[0];

                    // --- ?��?標�??��?：觸?�隨機�?�?---
                    if (nextLine.triggerEvent) {
                        setPendingAdvLogs([]);
                        setIsAdvStreaming(false);
                        executeAdventureEvent();
                        return;
                    }

                    // --- ?��?標�??��?：觸?�戰鬥�???(?��? B ?�確認�?) ---
                    if (nextLine.triggerBattle) {
                        setPendingAdvLogs([]);
                        setIsAdvStreaming(true); // 保�??�報?��??�?��??�景顯示?�險?�面，�??�給?�鬥 UI
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
                        playBloop('pop');
                    }
                    return;
                } else {
                    // ?��?完全?��?了�??��??�此?��?�?B ?��??�正式�??��???
                    setIsAdvStreaming(false);
                    setIsAdvMode(false);
                    setLastAdvTime(Date.now());
                    updateDialogue("?�險結�???);
                    playBloop('success');
                    return;
                }
            }

            if (pendingWildCapture && !isAdvStreaming) {
                confirmWildCapture(true); // B ?��?律為 ?��? (YES)
                return; // 介面中�??�斷
            }
            // ??移除?�本�?��??return，�? B ?�在平常走路?�能?�給下面?�摸?��?�?
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

        if (isStatusUIOpen) return;
        if (isInventoryOpen) {
            if (isUsingItem) return; // 使用中�?止�?複觸??
            if (inventory.length > 0) {
                useItem(selectedItemIdx);
            }
            return;
        }

        if (isInteractMenuOpen) {
            if (interactMenuIdx === 0 || interactMenuIdx === 1) { // 餵�? ???�摸
                const action = interactMenuIdx === 0 ? 'feed' : 'pet';
                setIsInteractMenuOpen(false); // ?��??��?以�?表�?
                setIsInteractAnimating(true); // ?��??��?
                executeAction(action);
                // 1.5 秒�??��??�復子選?�並�?��?��?
                setTimeout(() => {
                    setIsInteractAnimating(false);
                    setIsInteractMenuOpen(true);
                }, 1500);
            } else { // 結�?互�?
                setIsInteractMenuOpen(false);
                updateDialogue("結�?互�???);
                playBloop('pop');
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
                    updateDialogue("尚未�??此怪獸?�詳細�?�?..", true);
                    playBloop('fail');
                    return;
                }
            }
            playBloop('success');
            return;
        }

        if (activeIndex === -1) {
            velRef.current = { x: velRef.current.x, y: -4.0 };
            updateDialogue("?�到你�?�?);
            logEvent("?�家?��?了主?�摸?��?);
            return;
        }
        executeAction(menuItems[activeIndex].id);
    };

    const handleC = () => {
        if (isCloudLoading || isInteractAnimating) return; // ?�端?�步?��??�表演中禁止?��?
        if (alertMsg) return; // 警�?視�?顯示?��?C ?��??��?定�??��?任�??��?
        if (isLeaderboardOpen) {
            setIsLeaderboardOpen(false);
            setAlertMsg("");
            playBloop('pop');
            return;
        }
        if (isPvpMode) {
            if (matchStatus !== 'matched') {
                cleanupPvp("?��????大廳??);
            } else {
                updateDialogue("對戰中無法逃�?�?, true);
            }
            playBloop('pop');
            return;
        }
        if (isDiaryOpen) {
            // C ?��?翻到後�?天�?不�??��?天�?
            const todayStr = getTodayStr();
            setDiaryViewDate(prev => {
                const current = prev || todayStr;
                if (current >= todayStr) return todayStr;
                const d = new Date(current);
                d.setDate(d.getDate() + 1);
                return getTodayStr(d);
            });
            playBloop('pop');
            return;
        }

        // --- ?��?大賽返�??�輯 ---
        if (tournament.isTournamentOpen) {
            tournament.prevTournamentPhase();
            return;
        }
        if (battleState.active && (battleState.mode === 'trainer' || battleState.mode === 'pvp' || battleState.mode === 'tournament') && battleState.phase === 'player_action') {
            // 返�?上層?�單（�??�目?��??��?層�??�以�?示無法�??��?不�?事�?
            const tempLogs = [...battleState.logs, "?��?返�?�?];
            setBattleState(prev => ({ ...prev, logs: tempLogs.slice(-5) }));
            playBloop('pop');
            return;
        }
        if (isAdvMode) {
            // ?��??�止 BUG ?�確保�?算�??��??�險中�?止使??C ?�直?�離??
            // ?��??�示?�家?�使用 B ?��??�日�?
            const msg = isAdvStreaming ? "請�???B ?��?完日誌�?" : "?�險中�??�循路�?�?;
            const currentLogs = battleState.active ? battleState.logs : (isAdvStreaming ? advLog.map(l => l.msg) : []);
            if (isAdvStreaming) {
                // 如�??�播?��??��???dialogue ?�示
                updateDialogue(msg, true);
            }
            playBloop('fail');
            return;
        }
        if (isConfirmingReplace) {
            setIsConfirmingReplace(false);
            setSkillSelectIdx(0);
            playBloop('pop');
            return;
        }
        if (pendingSkillLearn && !isAdvMode && !isPvpMode && !battleState.active) {
            setPendingSkillLearn(null);
            playBloop('pop');
            return;
        }
        if (isStatusUIOpen) {
            setIsStatusUIOpen(false);
            updateDialogue("?�吼?��?");
            return;
        }
        if (isInventoryOpen) {
            if (isUsingItem) return; // 使用中�?止�??��???
            setIsInventoryOpen(false);
            updateDialogue("?�吼?��?");
            return;
        }
        if (isInteractMenuOpen) {
            setIsInteractMenuOpen(false);
            updateDialogue("?�吼?��?");
            playBloop('pop');
            return;
        }
        if (isPediaOpen) {
            if (isPediaDetailOpen) {
                setIsPediaDetailOpen(false);
            } else {
                setIsPediaOpen(false);
            }
            playBloop('pop');
            return;
        }
        if (isConfirmingFarewell) {
            setIsConfirmingFarewell(false);
            updateDialogue("?�吼?��?");
            return;
        }
        if (miniGame) {
            if (miniGame.status === 'result') return;
            if (miniGame.type === 'talk' && miniGame.status === 'question') {
                handleTalkChoice(2);
                return;
            }
            setMiniGame(null);
            updateDialogue("?�吼?��?");
            return;
        }
        if (isDead) return;
        setActiveIndex(-1);
        updateDialogue("?�吼?��?");
    };

    const executeAction = (id) => {
        switch (id) {
            case 'pedia':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此�??��??�在主畫?�使??);
                    playBloop('fail');
                    return;
                }
                setIsPediaOpen(true);
                setPediaIdx(0);
                setIsPediaDetailOpen(false);
                updateDialogue("?��?系統?��???, true);
                break;
            case 'interact':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此�??��??�在主畫?�使??);
                    playBloop('fail');
                    return;
                }
                setIsInteractMenuOpen(true);
                setInteractMenuIdx(0);
                updateDialogue("?��?互�??��?�?, true);
                break;
            case 'feed':
                if (hunger >= 100) {
                    updateDialogue("?��?不�?�?..");
                    break;
                }
                setHunger(h => Math.min(100, h + 30));
                setFeedCount(f => f + 1);
                setTodayFeedCount(f => f + 1);
                recordGameAction(); // 紀?�餵�?
                velRef.current = { x: velRef.current.x, y: -5.0 };
                updateDialogue("?�好?��?");
                logEvent("餵�?了怪獸??);
                break;
            case 'talk':
                let qi;
                if (lockedAffinity) {
                    const weightedIndices = SOUL_QUESTIONS.map((q, i) =>
                        q.options.some(o => o.affinity === lockedAffinity) ? i : -1
                    ).filter(idx => idx !== -1);

                    if (Math.random() < 0.7 && weightedIndices.length > 0) {
                        qi = weightedIndices[Math.floor(Math.random() * weightedIndices.length)];
                    } else {
                        qi = Math.floor(Math.random() * SOUL_QUESTIONS.length);
                    }
                } else {
                    qi = Math.floor(Math.random() * SOUL_QUESTIONS.length);
                }

                setMiniGame({ type: 'talk', status: 'question', qIdx: qi });
                recordGameAction(); // ?�入對�?視為一?��?
                updateDialogue("?�伴對�?�?..", true);
                logEvent("?�怪獸談�???);
                break;
            case 'pet':
                if (mood >= 100) {
                    updateDialogue("?�太久�?...");
                    break;
                }
                setMood(m => Math.min(100, m + 20));
                recordGameAction(); // 紀?�撫??
                velRef.current = { x: velRef.current.x, y: -4.0 };
                updateDialogue("好�?心�?");
                logEvent("親�?互�???);
                break;
            case 'status':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此�??��??�在主畫?�使??);
                    playBloop('fail');
                    return;
                }
                setIsStatusUIOpen(true);
                updateDialogue("?��??�?�中...", true);
                break;
            case 'train':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此�??��??�在主畫?�使??);
                    playBloop('fail');
                    return;
                }
                recordGameAction(); // ?�入?��?視為一?��?
                miniGameResultFired.current = false;
                const roll = Math.random();
                if (roll < 0.33) {
                    const targetTime = Date.now() + 4000;
                    setMiniGame({ type: 'reaction', status: 'ready', targetTime, count: 3, result: null });
                    updateDialogue("?�數結�?~GO要�?快�?B?��??��??��?, true);
                } else if (roll < 0.66) {
                    setMiniGame({ type: 'charge_click', status: 'idle', energy: 0, startTime: Date.now(), result: null });
                    updateDialogue("??��B?�直?��?條�?�?..", true);
                } else {
                    const spinItems = ['ghost', 'redHeart', 'ghost', 'redHeart', 'ghost', 'redHeart'];
                    setMiniGame({ type: 'spin_heart', status: 'idle', items: spinItems, currentIdx: 0, result: null });
                    updateDialogue("?�出?��??��?心�??�B?��?", true);
                }
                posRef.current = { x: 128, y: 190 };
                velRef.current = { x: 0, y: 0 };
                logEvent("?��??��???);
                setActiveIndex(-1);
                break;
            case 'connect':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此�??��??�在主畫?�使??);
                    playBloop('fail');
                    return;
                }
                cleanupPvp();
                setIsPvpMode(true);
                recordGameAction(); // ?�入???大廳?�扣一?��?
                syncMatchStatus('idle');
                updateDialogue("宇�????大廳", true);
                logEvent(`?�入???大廳`);
                break;
            case 'info':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此�??��??�在主畫?�使??);
                    playBloop('fail');
                    return;
                }
                setIsInventoryOpen(true);
                setSelectedItemIdx(0);
                updateDialogue("?��??��?�?..", true);
                break;
            case 'adventure':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此�??��??�在主畫?�使??);
                    playBloop('fail');
                    return;
                }
                startAdventure();
                break;
            default:
                updateDialogue("?�發�?);
        }
    };

    // --- ?��?表�?結�??�調 ---
    const handleEvolutionFinish = () => {
        const nextBranch = window._nextBranch || 'C';
        const evolvedId = window._evolvedId || 1000;
        const evolvedName = MONSTER_NAMES[evolvedId] || nextBranch;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        updateDiaryEvent(`${timeStr} ?�進�??��?�?{evolvedName}`, 3);
        setTodayHasEvolved(true);

        setEvolutionStage(prev => prev + 1);
        setEvolutionBranch(nextBranch);
        setLastEvolutionTime(Date.now());
        setStageTrainWins(0);
        setIsEvolving(false);
        setEvolutionDetails(null);
        updateDialogue("?��??��?�?);
        unlockMonster(evolvedId);

        // 清除?��??��?
        delete window._nextBranch;
        delete window._evolvedId;
    };

    useEffect(() => {
        if (isBooting || isDead || isEvolving || miniGame || isRunaway || isDuplicateTab) return;

        const checkEvolutionInterval = setInterval(() => {
            if (document.hidden) return;
            const elapsed = Date.now() - lastEvolutionTime;

            // ?�斷?�否壽�?（無法�??��?�?
            // ?��??�獸 (?��? C)：若?��??�表中已?��?一?��??��??��?終�??��??�入壽命?�數
            const isFinalWild = evolutionBranch.startsWith('WILD_') && !WILD_EVOLUTION_MAP[evolutionBranch.slice(5)];

            if (evolutionStage >= 4 || isFinalWild || (evolutionStage === 3 && ['G1', 'G2', 'F_FAIL1', 'F_NINETALES_SOUL'].includes(evolutionBranch))) {
                const lifespan = debugOverrides.evolutionMs ?? EVO_TIMES.FINAL_LIFETIME;
                if (elapsed >= lifespan) {
                    clearInterval(checkEvolutionInterval);
                    // D線抽籤�?20% 機�??��??��?
                    const dRoll = Math.random();
                    const dLine = dRoll < 0.20 ? (Math.random() < 0.5 ? 'G1' : 'G2') : null;
                    setDeathBranch(dLine);
                    setIsGenerating(true);
                    setIsDead(true);
                    velRef.current = { x: 0, y: -0.1 };
                    setTimeout(() => {
                        let words = dLine
                            ? "?��?不�?...?��??��?來�?..."
                            : "謝�?你陪?�走?��?後�???..";
                        setFinalWords(words);
                        setIsGenerating(false);
                        updateDialogue(words);
                    }, 1500);
                    setTimeout(() => {
                        setShowRestartHint(true);
                    }, 2500);
                }
                return;
            }

            const currentThresh = debugOverrides.evolutionMs ?? EVO_TIMES[evolutionStage];
            if (elapsed >= currentThresh) {
                clearInterval(checkEvolutionInterval);
                setIsEvolving(true);
                updateDialogue("?��?中�?�?);

                const stats = latestStats.current;
                const m = stats.mood;
                const h = stats.hunger;
                const sWins = stats.stageTrainWins;
                let nextBranch = 'C';

                let soulNext = null;
                // Stage 1 to 2: Lock affinity
                if (evolutionStage === 1 && !stats.lockedAffinity) {
                    let maxAff = 'none', mv = -1;
                    for (const [k, v] of Object.entries(stats.soulAffinityCounts)) {
                        if (v > mv && v > 0) {
                            mv = v;
                            maxAff = k;
                        }
                    }
                    if (maxAff !== 'none') {
                        setLockedAffinity(maxAff);
                        stats.lockedAffinity = maxAff;
                    }
                }

                // Determine basic soulNext based on locked affinity
                if (stats.bondValue >= 80 && stats.lockedAffinity) {
                    if (evolutionStage === 1) {
                        if (stats.lockedAffinity === 'fire') soulNext = 'F_SOUL';
                        if (stats.lockedAffinity === 'water') soulNext = 'W_SOUL';
                        if (stats.lockedAffinity === 'grass') soulNext = 'GR_SOUL';
                        if (stats.lockedAffinity === 'bug') soulNext = 'B_SOUL';
                    }
                }

                let requiredWins = 0;
                if (evolutionStage === 1) requiredWins = 8;
                else if (evolutionStage === 2) requiredWins = 30;
                else if (evolutionStage === 3) requiredWins = 50;

                // ?��??��?定�??��?
                if (evolutionBranch.startsWith('WILD_')) {
                    // ?��??�獸?��?�?(?��? C)
                    const currentWildIdStr = evolutionBranch.slice(5);
                    const nextWildIdVal = WILD_EVOLUTION_MAP[currentWildIdStr];
                    if (nextWildIdVal) {
                        nextBranch = 'WILD_' + nextWildIdVal;
                    } else {
                        nextBranch = evolutionBranch; // 已是?�終�???
                    }
                } else if (['G1'].includes(evolutionBranch)) {
                    // D 線�??��??��?沿�?線繼�?(?��?度�??��?魂進�?，防止凱西被?��?)
                    nextBranch = evolutionBranch;

                } else if (soulNext || evolutionBranch.endsWith('_SOUL')) {

                    // ?��??��?線�?高優??
                    if (soulNext) {
                        nextBranch = soulNext;
                    } else {
                        // ?�?��?魂�??�在?�是?��??��??��?，無額�??�支
                        nextBranch = evolutionBranch;
                    }
                } else if (evolutionStage === 1) {
                    // ??Stage 0??（百變�?Stage）�??�?��??��??��?依�?件�?次�???
                    if (m >= 50 && h >= 50) {
                        nextBranch = 'A';
                    } else {
                        nextBranch = 'C';
                    }

                } else if (['A', 'C'].includes(evolutionBranch)) {
                    // ??已在 A/C 一?��?（Stage>=2）�?依�??�值決定�?一?�段路�?
                    if (m >= 50 && h >= 50) {
                        nextBranch = 'A';
                    } else {
                        nextBranch = 'C';
                    }

                } else {
                    // ?��??��??��?況�?保�?�?
                    nextBranch = 'C';
                }

                setTimeout(() => {
                    const now = new Date();
                    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    const evolvedId = getMonsterIdWrapped(nextBranch, evolutionStage + 1);
                    const evolvedName = MONSTER_NAMES[evolvedId] || nextBranch;
                    updateDiaryEvent(`${timeStr} 分進化成了：${evolvedName}`, 3);
                    setTodayHasEvolved(true);

                    // 提前預載進化後的圖片，消除載入延遲
                    const assetId = MONSTER_ASSET_IDS[evolvedId] || evolvedId;
                    const base = import.meta.env.BASE_URL;
                    const img = new Image();
                    img.src = `${base}assets/exclusive/idle/${assetId}.gif`;

                    setEvolutionDetails({ fromId: getMonsterIdWrapped(), toId: evolvedId });
                    setIsEvolving(true);
                    updateDialogue("進化中！！");

                    // 實際的狀態更新邏輯，將在 EvolutionPerformance 結束時呼叫 (由 handleEvolutionFinish 觸發)
                    window._nextBranch = nextBranch;
                    window._evolvedId = evolvedId;
                }, 500);
            }
        }, 500);

        return () => clearInterval(checkEvolutionInterval);
    }, [isBooting, evolutionStage, isDead, isEvolving, lastEvolutionTime, miniGame, isRunaway, debugOverrides, isDuplicateTab]);

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

    // --- ?�險 CD 計�???---
    useEffect(() => {
        const timer = setInterval(() => {
            if (document.hidden) return;
            const now = Date.now();
            const diff = Math.max(0, Math.floor((lastAdvTime + ADV_BATTLE_RULES.CD_MS - now) / 1000));
            setAdvCD(diff);
        }, 1000);
        return () => clearInterval(timer);
    }, [lastAdvTime]);

    // --- ?�險?��??��??��? ---
    useEffect(() => {
        if (advLogRef.current) {
            advLogRef.current.scrollTop = advLogRef.current.scrollHeight;
        }
    }, [advLog]);

    // --- ?�� ?�鬥引�??��??��????�� ---
    const generateTrainerOpponent = (stage) => {
        const pool = TRAINER_POOLS[stage] || TRAINER_POOLS[1];
        const base = pool[Math.floor(Math.random() * pool.length)];

        const modifiers = [
            { prefix: '強壯??, hpBonus: 1.5, atkBonus: 1.0, spdBonus: 1.0 },
            { prefix: '?�暴??, hpBonus: 1.0, atkBonus: 1.5, spdBonus: 1.0 },
            { prefix: '?�風??, hpBonus: 1.0, atkBonus: 1.0, spdBonus: 1.5 }
        ];
        const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
        return {
            id: base.id,
            name: `${mod.prefix} ${base.name}`,
            power: 100 * (1 + (stage - 1) * 0.2), // 修正??��?��?，Stage 1 訓練師�??�家等�??�平 (1.0??
            hpMult: mod.hpBonus,
            atkMult: mod.atkBonus,
            spdMult: mod.spdBonus,
            isTrainer: true
        };
    };
    function generateBattleState(mode, myId, pvpOpponentData = null) {
        const level = Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1));
        const speciesId = getMonsterIdWrapped();

        // --- ?�格修正系統 (Nature Modifiers) ---
        const getNatureMods = (tag) => {
            const mods = { hp: 1.0, atk: 1.0, def: 1.0, spd: 1.0 };
            const conf = NATURE_CONFIG[tag];
            if (conf) {
                if (conf.buff) mods[conf.buff] = 1.1;
                if (conf.nerf) mods[conf.nerf] = 0.9;
            }
            return mods;
        };

        const tagEntries = Object.entries(soulTagCounts);
        const best = tagEntries.reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0]);
        const pTag = best[1] > 0 ? best[0] : 'none';
        const pNatureMods = getNatureMods(pTag);

        const pMaxHP = calcFinalStat('hp', speciesId, advStats.ivs.hp, advStats.evs.hp, level, pNatureMods.hp);
        const pATK = calcFinalStat('atk', speciesId, advStats.ivs.atk, advStats.evs.atk, level, pNatureMods.atk);
        const pDEF = calcFinalStat('def', speciesId, advStats.ivs.def, advStats.evs.def, level, pNatureMods.def);
        const pSPD = calcFinalStat('spd', speciesId, advStats.ivs.spd, advStats.evs.spd, level, pNatureMods.spd);

        // --- ?�家?�鬥屬�?(Type) ?��?式表 ---
        const pStatsRef = SPECIES_BASE_STATS[String(speciesId)] || { types: ['normal'] };
        const pType = pStatsRef.types;

        // --- ?��?使用存�?中�?永�??��???? ---
        const pMoves = (advStats.moves || []).map(id => SKILL_DATABASE[id]).filter(Boolean);
        if (pMoves.length === 0) pMoves.push(SKILL_DATABASE.tackle || { name: '?��?', power: 40, type: 'normal' });

        let enemyData;
        let eMaxHP, eATK, eDEF, eSPD, eType, eLevel;

        if (mode === 'wild') {
            // ?��?保護：在 Stage 1 ?��?濾�?岩石系�???��?��??�怪獸
            const filteredPool = (evolutionStage === 1)
                ? ADV_WILD_POOL.filter(m => m.id !== 1025)
                : ADV_WILD_POOL;

            // ?��??��?池�??��??��?平�??�出?��???(1/N)
            enemyData = filteredPool[Math.floor(Math.random() * filteredPool.length)];
            const eStatsRef = SPECIES_BASE_STATS[String(enemyData.id)] || { types: ['normal'] };
            eType = eStatsRef.types;
            const isBaby = evolutionStage < 2;
            const isElite = Math.random() < 0.12 && !isBaby;
            eLevel = Math.min(100, Math.min(level, isElite ? level : Math.floor(level * (0.8 + Math.random() * 0.4))));

            // ?��??�隨機�???IV ???�格修正
            const eNature = ['passionate', 'stubborn', 'rational', 'gentle', 'nonsense'][Math.floor(Math.random() * 5)];
            const eNatureMods = getNatureMods(eNature);
            const eIVs = { hp: Math.floor(Math.random() * 32), atk: Math.floor(Math.random() * 32), def: Math.floor(Math.random() * 32), spd: Math.floor(Math.random() * 32) };
            const eEVs = { hp: eLevel * 2, atk: eLevel * 2, def: eLevel * 2, spd: eLevel * 2 };

            eMaxHP = calcFinalStat('hp', enemyData.id, eIVs.hp, eEVs.hp, eLevel, eNatureMods.hp);
            eATK = calcFinalStat('atk', enemyData.id, eIVs.atk, eEVs.atk, eLevel, eNatureMods.atk);
            eDEF = calcFinalStat('def', enemyData.id, eIVs.def, eEVs.def, eLevel, eNatureMods.def);
            eSPD = calcFinalStat('spd', enemyData.id, eIVs.spd, eEVs.spd, eLevel, eNatureMods.spd);

            const initMsg = `?��? ${isElite ? '精銳 ' : ''}${enemyData.name} (Lv.${eLevel}) 跳�??��?！`;
            const eMoves = generateMoves(Math.max(1, Math.floor(evolutionStage * 0.8)), eType, null, eLevel, true).map(id => SKILL_DATABASE[id]).filter(Boolean);
            return {
                active: true, mode: 'wild', phase: 'intro', turn: 1,
                player: {
                    hp: pMaxHP, maxHp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, id: myId, type: pType, moves: pMoves, level: level,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0,
                    moveUpgrades: advStats.moveUpgrades || {}
                },
                enemy: {
                    id: enemyData.id, name: (isElite ? `精銳 ${enemyData.name}` : enemyData.name), hp: eMaxHP, maxHp: eMaxHP, atk: eATK, def: eDEF, spd: eSPD, level: eLevel, isElite, type: eType, moves: eMoves,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0
                },
                logs: [initMsg], initMsg,
                stepQueue: [], activeMsg: "", flashTarget: null, menuIdx: 0
            };
        } else if (mode === 'pvp' && pvpOpponentData) {
            eLevel = Math.min(100, pvpOpponentData?.stats?.level || level);
            const enemyData = pvpOpponentData;

            // 使用對�??��??��?始數?��?完全?�除?�地?��??�模式修�?
            eMaxHP = (enemyData?.stats?.hp) || 150;
            eATK = (enemyData?.stats?.atk) || 80;
            eDEF = (enemyData?.stats?.def) || 50;
            eSPD = (enemyData?.stats?.spd) || 90;
            eType = enemyData?.type || 'normal';
            // ?��?：�?定�?使用?��?來�??��?，而�??�地?��???
            const eMoves = (enemyData?.moves || generateMoves(1, eType, null, eLevel, true)).map(id => SKILL_DATABASE[id]).filter(Boolean);

            const initMsg = `????��?�?{enemyData?.name || '神�?對�?'} (Lv.${eLevel}) ?�臨！`;
            return {
                active: true, mode: 'pvp', phase: 'intro', turn: 1,
                player: {
                    hp: pMaxHP, maxHp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, id: myId, type: pType, moves: pMoves, level: level,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0,
                    moveUpgrades: advStats.moveUpgrades || {}
                },
                enemy: {
                    id: enemyData?.id || 1000, name: (enemyData?.name || '神�?對�?'), hp: eMaxHP, maxHp: eMaxHP, atk: eATK, def: eDEF, spd: eSPD, level: eLevel, isPvp: true, type: eType, moves: eMoves,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0
                },
                logs: [initMsg], initMsg,
                stepQueue: [], activeMsg: "", flashTarget: null, menuIdx: 0
            };
        } else {
            enemyData = generateTrainerOpponent(evolutionStage);
            eLevel = Math.min(100, level); // 訓練家�??�家等�??�平
            const eNature = ['passionate', 'stubborn', 'rational', 'gentle', 'nonsense'][Math.floor(Math.random() * 5)];
            const eNatureMods = getNatureMods(eNature);
            const eIVs = { hp: 20, atk: 20, def: 20, spd: 20 };
            const eEVs = { hp: eLevel * 4, atk: eLevel * 4, def: eLevel * 4, spd: eLevel * 4 };

            // Bug Fix #1: 套用 generateTrainerOpponent ?��??�修飾�?乘數 (hpMult/atkMult/spdMult)
            eMaxHP = Math.floor(calcFinalStat('hp', enemyData.id, eIVs.hp, eEVs.hp, eLevel, eNatureMods.hp) * (enemyData.hpMult || 1.0));
            eATK = Math.floor(calcFinalStat('atk', enemyData.id, eIVs.atk, eEVs.atk, eLevel, eNatureMods.atk) * (enemyData.atkMult || 1.0));
            eDEF = calcFinalStat('def', enemyData.id, eIVs.def, eEVs.def, eLevel, eNatureMods.def);
            eSPD = Math.floor(calcFinalStat('spd', enemyData.id, eIVs.spd, eEVs.spd, eLevel, eNatureMods.spd) * (enemyData.spdMult || 1.0));

            // Bug Fix #2: �?SPECIES_BASE_STATS 讀?�正確�??�屬?�陣?��??��?使用 stageMap ?�硬編碼?�屬?��?�?
            const eStatsRef = SPECIES_BASE_STATS[String(enemyData.id)] || { types: ['normal'] };
            eType = eStatsRef.types;
            const eMoves = generateMoves(evolutionStage, eType, null, eLevel, true).map(id => SKILL_DATABASE[id]).filter(Boolean);

            const initMsg = `訓練家出?��?帶�?他�? ${enemyData.name} (Lv.${eLevel}) ?��??�起?�戰！`;
            return {
                active: true, mode: 'trainer', phase: 'intro', turn: 1,
                player: {
                    hp: pMaxHP, maxHp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, id: myId, type: pType, moves: pMoves, level: level,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0,
                    moveUpgrades: advStats.moveUpgrades || {}
                },
                enemy: {
                    id: enemyData.id, name: enemyData.name, hp: eMaxHP, maxHp: eMaxHP, atk: eATK, def: eDEF, spd: eSPD, level: eLevel, isTrainer: true, type: eType, moves: eMoves,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0
                },
                logs: [initMsg], initMsg,
                stepQueue: [], activeMsg: "", flashTarget: null, menuIdx: 0
            };
        }
    };



    const handleAdvGather = (log, myId) => {
        log.push({ msg: "?�路?��??��??��??��?...", hpRatio: 1 });

        // ?��?主�??�產等�? 1 ?��?，極低�??�出高�?級物??
        let item;
        const r = Math.random();
        if (r < 0.85) item = ADV_ITEMS[0]; // 活�?飯糰
        else if (r < 0.98) item = ADV_ITEMS[2]; // 跑步??
        else item = ADV_ITEMS[Math.floor(Math.random() * ADV_ITEMS.length)]; // ?��?

        setInventory(prev => {
            const idx = prev.findIndex(it => it.id === item.id);
            if (idx !== -1) {
                const next = [...prev];
                next[idx] = { ...next[idx], count: (next[idx].count || 1) + 1 };
                return next;
            }
            if (prev.length >= 99) {
                log.push({ msg: "?��? ?��?空�?不足，物?��?失�?...", hpRatio: 1 });
                return prev;
            }
            return [...prev, { ...item, count: 1 }];
        });
        log.push({ msg: `?�到�?[${item.name}]?�`, hpRatio: 1, iconId: myId });
    };

    const applyAdvGain = (points, log, currentHP, myId) => {
        let hpEV = 0;
        let atkEV = 0;
        let defEV = 0;
        let spdEV = 0;

        for (let i = 0; i < points; i++) {
            const r = Math.random();
            // �?1 點�???= 4 ?��???(EV)
            if (r < 0.40) { hpEV += 4; log.push({ msg: "+ 體�?潛能?��?", hpRatio: currentHP, iconId: myId }); }
            else if (r < 0.65) { atkEV += 4; log.push({ msg: "+ ?��?潛能?��?", hpRatio: currentHP, iconId: myId }); }
            else if (r < 0.90) { defEV += 4; log.push({ msg: "+ ?�禦潛能?��?", hpRatio: currentHP, iconId: myId }); }
            else { spdEV += 4; log.push({ msg: "+ ?�度潛能?��?", hpRatio: currentHP, iconId: myId }); }
        }

        setAdvStats(prev => {
            const nextEVs = { ...prev.evs };
            // ?��??��??�檢?��??��? 252, 總�? 510
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
        recordGameAction(); // ??修正：確保�??�獲?��??��??�觸?�雲端�?�?
    };

    // --- ?��?使用?�輯 ---
    const useItem = (itemIdx) => {
        if (isUsingItem) return;
        if (itemIdx < 0 || itemIdx >= inventory.length) return;

        setIsUsingItem(true);
        const item = inventory[itemIdx];
        let success = true;

        if (item.skillId) {
            const skill = SKILL_DATABASE[item.skillId];
            if (!skill) {
                updateDialogue("?�份秘�??��?載�??�容似�?已無法辨�?..");
                success = false;
            } else if ((advStats.moves || []).includes(item.skillId)) {
                updateDialogue(`?�獸已�?學�???{skill.name}?��?，�??��?讀?��?`);
                success = false;
            } else {
                setPendingSkillLearn({ skill: skill, level: derivedLevel });
                setIsInventoryOpen(false);
                updateDialogue(`?��?�?{item.name}！怪獸?��?專�??��??��??��?...`);
                // ?? ?�鍵修正：�??��??�使?��?立即�??，�??�入 1.8s ?�延?��?�?
                // ?��? isUsingItem ?�?�阻塞�?續�? SkillLearnOverlay ?��?
                setIsUsingItem(false);

                // ?��?消耗�?程�?減�??��??��?步�?
                setInventory(prev => {
                    const next = [...prev];
                    if ((next[itemIdx].count || 1) > 1) {
                        next[itemIdx] = { ...next[itemIdx], count: next[itemIdx].count - 1 };
                        return next;
                    }
                    return next.filter((_, i) => i !== itemIdx);
                });
                recordGameAction();
                setSelectedItemIdx(0);
                playSoundEffect('success');
                return; // ?��?返�?，�?走�??��??�用 success ?�輯
            }
        } else {
            switch (item.id) {
                case 'DIARY': // ?? 對戰?��? - 永�??�具，�??�全?�日�?UI
                    setIsUsingItem(false); // 立即�??，�?走�??��?�?
                    setIsInventoryOpen(false);
                    setDiaryViewDate(getTodayStr()); // ?�設顯示今天
                    setIsDiaryOpen(true);
                    playBloop('success');
                    return; // ?�接返�?，�?走�??��? success 消耗�?�?

                case '001': // 活�?飯糰
                    setAdvStats(prev => ({ ...prev, basePower: prev.basePower + 10 }));
                    updateDialogue(`?��?${item.name}，戰?��??��??�覺等�?快�?了�?`);
                    break;
                case '002': // ?�鬥?�白�?(增�? 10 點攻?�努?��?
                    setAdvStats(prev => {
                        const nextEVs = { ...prev.evs };
                        const canAdd = Math.min(10, 510 - Object.values(nextEVs).reduce((a, b) => a + b, 0), 252 - nextEVs.atk);
                        if (canAdd > 0) nextEVs.atk += canAdd;
                        return { ...prev, evs: nextEVs, basePower: prev.basePower + 10 };
                    });
                    updateDialogue("使用了戰鬥�??��?！攻?��??��??��?");
                    break;
                case '003': // 跑步??
                    // 減�? 60 ?��??�卻：�?上次?�險?��?往?�推�?3600 �?
                    setLastAdvTime(prev => Math.max(1, prev - 3600000));
                    updateDialogue("穿�?跑步?��??�覺?�能?�戰�?);
                    break;
                case '004': // 覺�?之核 (?�面?��?)
                    setAdvStats(prev => {
                        const nextEVs = { ...prev.evs };
                        const stats = ['hp', 'atk', 'def', 'spd'];
                        stats.forEach(s => {
                            const canAdd = Math.min(8, 510 - Object.values(nextEVs).reduce((a, b) => a + b, 0), 252 - nextEVs[s]);
                            if (canAdd > 0) nextEVs[s] += canAdd;
                        });
                        return { ...prev, evs: nextEVs, basePower: prev.basePower + 30 };
                    });
                    updateDialogue("覺�?之核?��?了�??�屬?��??��??��???);
                    break;
                case '005': // 奇異糖�? (?��?大�??��?)
                    setAdvStats(prev => {
                        const nextEVs = { ...prev.evs };
                        const pool = ['hp', 'atk', 'def', 'spd'];
                        const target = pool[Math.floor(Math.random() * 4)];
                        const canAdd = Math.min(20, 510 - Object.values(nextEVs).reduce((a, b) => a + b, 0), 252 - nextEVs[target]);
                        if (canAdd > 0) nextEVs[target] += canAdd;
                        return { ...prev, evs: nextEVs, basePower: prev.basePower + 50 };
                    });
                    updateDialogue("奇異糖�??��??��?一?�屬?��??�大幅�???);
                    break;
                default:
                    updateDialogue(`?�知?��? (ID: ${item.id})，無法使?�`);
                    success = false;
            }
        }

        if (success) {
            playSoundEffect('success');
            // 減�??��??�移??
            setInventory(prev => {
                const next = [...prev];
                if ((next[itemIdx].count || 1) > 1) {
                    next[itemIdx] = { ...next[itemIdx], count: next[itemIdx].count - 1 };
                    return next;
                }
                return next.filter((_, i) => i !== itemIdx);
            });
            recordGameAction(); // 紀?��??�使??
            setSelectedItemIdx(0);
            // 延遲?��? UI ?�到主畫?�方便�??��???
            setTimeout(() => {
                setIsInventoryOpen(false);
                setIsUsingItem(false); // �?��?��?
            }, 1800);
        } else {
            setIsUsingItem(false); // 失�?也�?�?��
        }
    };

    const triggerFarewell = () => {
        // ?��?：�??�主?�面使用 (?�止?�戰鬥、�??�、特訓、�?心、選?�中?��??�輯衝�?)
        if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
            setAlertMsg("此�??��??�在主畫?�使??);
            playBloop('fail');
            return;
        }
        setIsConfirmingFarewell(true);
        updateDialogue("確�?要�?止�??��?�?, true);
    };

    const handleLearnSkill = (newSkillId, replaceIdx = -1) => {
        setAdvStats(prev => {
            const nextMoves = [...(prev.moves || [])];
            if (replaceIdx === -1) {
                // ?�接學�? (不足4??
                if (nextMoves.length < 4) {
                    nextMoves.push(newSkillId);
                }
            } else {
                // ?��??��?
                nextMoves[replaceIdx] = newSkillId;
            }
            return { ...prev, moves: nextMoves };
        });
        setPendingSkillLearn(null);
        recordGameAction(); // ??修正：確保學習�?式�??�觸?�雲端�?�?
        playBloop('success');
        updateDialogue("學�?了新?��?�?);
    };

    const confirmFarewellAction = () => {
        setIsConfirmingFarewell(false);
        // D線抽籤�?20% 機�??��??��?
        const dRoll = Math.random();
        const dLine = dRoll < 0.20 ? 'G1' : null;
        setDeathBranch(dLine);
        setIsGenerating(true);
        setIsDead(true);

        setTimeout(() => {
            let words = "";
            if (dLine) {
                words = "?��?不�?...?��??��?來�?...";
            } else if (evolutionStage >= 5) {
                words = "?��??��?永�??��??�在，搭檔�?;
            } else if (evolutionStage >= 4) {
                words = "謝�?你陪?�走?��?後�???..";
            } else if (mood < 30) {
                words = "來�??��?�?..希�?你好好�?...";
            } else if (trainWins > 10) {
                words = "?��??�鬥已�?結�?了�?沒�??�憾�?;
            } else {
                words = "?�段?�伴?��??��??��?！�?謝�?�?;
            }

            setFinalWords(words);
            setIsGenerating(false);
            updateDialogue(words);
        }, 1500);
        setTimeout(() => {
            setShowRestartHint(true);
        }, 2500);
    };

    // ??��任�??�鍵?�新?��?
    useEffect(() => {
        if (!isDead || !finalWords) return;
        const handler = () => handleRestart();
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isDead, finalWords]);

    const handleRestart = () => {
        const savedDeathBranch = latestStats.current.deathBranch;

        setIsBooting(true); // 觸發?��?彩�??�面
        setBootMonsterId(Math.floor(Math.random() * 149) + 1); // ?�新?��??��??��???ID

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
        setStageTrainWins(0);
        setMiniGame(null);
        setActiveIndex(-1);
        setFeedCount(0);
        setDeathBranch(null); // ?�置 D線籤

        // --- 修正?��??��??�繼?��?�?---
        // ?��?死�??��???10% 漲�?作為?�產，�?上基�?100 ?��?
        const prevBasePower = latestStats.current.advStats?.basePower || 100;
        const inheritedPower = Math.floor((prevBasePower - 100) * 0.1); // 繼承 10% ?�努?��??��??��?總戰??

        // ?�斷下�?�??始�?�?
        const nextId = savedDeathBranch === 'G1' ? "1019" : "1000";
        const nextStarterMove = nextId === "1019" ? 'lick' : 'tackle';
        const nextBonusId = ['ember', 'water_gun', 'vine_whip', 'quick_attack'][Math.floor(Math.random() * 4)];

        // 完�?繼承?��??��?：避?��??��??�帶?��?衝�?，並且�?多只保�? 4 ??
        const prevMoves = latestStats.current.advStats?.moves || [];
        let combinedMoves = [nextStarterMove]; // 保�?必�??��??��??�種?�基?��?�?

        // 完�??�入?�代?�??
        prevMoves.forEach(mv => {
            if (!combinedMoves.includes(mv)) {
                combinedMoves.push(mv);
            }
        });

        // ?��??�空?��??��???bonus ?��?，�??��?bonus
        if (combinedMoves.length < 4 && !combinedMoves.includes(nextBonusId)) {
            combinedMoves.push(nextBonusId);
        }

        // ?�長度�??�在?�大�??�內
        combinedMoves = combinedMoves.slice(0, 4);

        // --- ?�傳繼承：�??�代?��??�中?�選?�強�?一?�繼??---
        const prevIVs = latestStats.current.advStats?.ivs || { hp: 0, atk: 0, def: 0, spd: 0 };
        const maxIVEntry = Object.entries(prevIVs).reduce((a, b) => (a[1] || 0) >= (b[1] || 0) ? a : b);
        const [bestStatKey, bestIVValue] = maxIVEntry;

        const nextIVs = {
            hp: Math.floor(Math.random() * 32),
            atk: Math.floor(Math.random() * 32),
            def: Math.floor(Math.random() * 32),
            spd: Math.floor(Math.random() * 32)
        };
        nextIVs[bestStatKey] = bestIVValue; // 繼承?�代?�強�?一?�基??

        setAdvStats({
            basePower: 100 + inheritedPower,
            ivs: nextIVs,
            evs: { hp: 0, atk: 0, def: 0, spd: 0 },
            bonusMoveId: nextBonusId, // 記�??�本?��??��?，�?不�?定在 moves ???�?
            moves: combinedMoves
        });

        // 給�??�家?��??�示
        if (inheritedPower > 0 || prevMoves.length > 0) {
            updateDialogue(`繼承了�?�???��???${inheritedPower} 點戰?��?`, true);
        } else {
            updateDialogue("?��?一天�?始�?�?, true);
        }

        // 死亡後�??�置 bondValue ??talkCount ?�可繼承
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
        setSoulTagCounts({ gentle: 0, stubborn: 0, passionate: 0, nonsense: 0, rational: 0 });

        if (savedDeathBranch) {
            // D線觸?��??��??��??�霧�?��?��?
            setEvolutionStage(1);
            setEvolutionBranch(savedDeathBranch);
            setDialogue(savedDeathBranch === 'G1' ? "幽影?�身�? : "神�??��?覺�?�?);
        } else {
            // �?��?��?：�??�起始怪獸
            setEvolutionStage(1);
            setEvolutionBranch('A');
            setDialogue("?�吼?��?");
        }

        // ?�� VERY IMPORTANT: Remove localStorage data immediately!
        try { localStorage.removeItem('pixel_monster_save'); } catch (e) { }
        try { sessionStorage.removeItem('pixel_monster_save'); } catch (e) { }

        recordGameAction(); // 紀?��??��???
    };



    // getMonsterId 已模組�???src/utils/monsterIdMapper.js
    // ?��??��?保�??��??�呼?��??��?補入?�本使用 closure ?��???state ?�數
    const getMonsterIdWrapped = (branch = evolutionBranch, stage = evolutionStage) =>
        getMonsterId(branch, stage, isDead, bondValue, soulTagCounts);

    // ?��??��??��??�獸?�自?�解?��???
    useEffect(() => {
        if (!isBooting && !isDead) {
            unlockMonster(getMonsterIdWrapped());
        }
    }, [isBooting, evolutionBranch, evolutionStage, isDead]);





    // --- PVP ?��?�?(已模組�???useLeaderboard) ---
    const {
        leaderboard, leaderboardPage, setLeaderboardPage,
        isLeaderboardOpen, setIsLeaderboardOpen,
        isLeaderboardLoading,
        fetchLeaderboard, updatePvpStats
    } = useLeaderboard({ user, getMonsterId: getMonsterIdWrapped, updateDialogue });

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
        generateBattleState,
        setAdvStats,
        logEvent,
        updatePvpStats
    });

    const {
        isPvpMode, setIsPvpMode, matchStatus, setMatchStatus, matchStatusRef, syncMatchStatus,
        myPeerId, setMyPeerId, targetPeerId, setTargetPeerId, pvpRoomPassword, setPvpRoomPassword,
        pvpOpponent, setPvpOpponent, pvpLog, setPvpLog, isMyTurn, setIsMyTurn,
        pvpCurrentHP, setPvpCurrentHP, pvpOpponentHP, setPvpOpponentHP,
        pendingPlayerMove, setPendingPlayerMove,
        peerInstance, connInstance, isHost, pvpRemoteMoveRef,
        cleanupPvp, initPeer, joinPvpRoom, handleBattleEnd
    } = pvp;

    // ?�� ?�使?�者登?��??��??��?榜�??��??��?，自?��?載�??�以供大賽系統使??
    useEffect(() => {
        if (user && leaderboard.length === 0 && !isLeaderboardLoading) {
            fetchLeaderboard({ silent: true });
        }
    }, [user]);

    // --- ?��?大賽 (Tournament System) ---
    const tournament = useTournament({
        user,
        derivedLevel,
        evolutionStage,
        myMonsterId: getMonsterIdWrapped(),
        advStats,
        soulTagCounts,
        leaderboard,
        updateDialogue,
        setAlertMsg, // ?�� ?��??��?，用來�??�警?��?�?
        battleState,
        setBattleState,
        setAdvStats,
        setInventory,
        playBloop,
        ADV_ITEMS,
        pendingSkillLearn,
        setAdvCurrentHP
    });

    // --- PVP 殭�?對�?檢測 (Zombie Match Detector) ---
    useEffect(() => {
        if (!isPvpMode || battleState.phase !== 'waiting_opponent') return;
        const timer = setTimeout(() => {
            if (isPvpMode && battleState.phase === 'waiting_opponent') {
                cleanupPvp("對�?失去?��?，�?局強制結�???);
                setAlertMsg("?��??�通�??��?");
                playBloop('fail');
            }
        }, 25000); // 25秒�??�防??
        return () => clearTimeout(timer);
    }, [isPvpMode, battleState.phase]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] p-4 select-none relative">
            <style dangerouslySetInnerHTML={{ __html: BATTLE_STYLES }} />

            {isLocalhost && (
                <button
                    onClick={() => {
                        console.log("??�?Debug Button Clicked!");
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
                    ??�?
                </button>
            )}

            <DebugPanel
                show={showDebug}
                onClose={() => setShowDebug(false)}
                debugOverrides={debugOverrides}
                setDebugOverrides={setDebugOverrides}
                advStats={advStats}
                setAdvStats={setAdvStats}
                inventory={inventory}
                setInventory={setInventory}
                updateDialogue={updateDialogue}
            />

            {/* --- ?��?縮放?��?容器 (Responsive Wrapper) --- */}
            <div className="fixed inset-0 flex items-center justify-center bg-[#1a1a1a] overflow-hidden select-none">
                <div
                    className="relative flex flex-col items-center justify-center pointer-events-auto transition-transform duration-100 ease-out"
                    style={{
                        transform: `scale(${displayScale})`,
                        transformOrigin: 'center center',
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

                            {/* ?�端載入?�罩 */}
                            {isCloudLoading && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 10000,
                                    backgroundColor: 'rgba(157, 174, 138, 0.9)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: '#111', fontSize: '12px', fontWeight: 'bold'
                                }}>
                                    <div className="animate-spin text-2xl mb-2">?��?</div>
                                    <div>?�端?�步�?..</div>
                                    <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '8px' }}>請�???/div>
                                </div>
                            )}

                            {/* 二次確�?介面 (LCD ?�建) */}
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
                                            確�?�?br />終止?�命?��?
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ padding: '4px 8px', border: '2px solid #111', backgroundColor: '#ffca28', color: '#111', fontSize: '9px', fontWeight: 'black' }}>A:NO</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ padding: '4px 8px', border: '2px solid #111', backgroundColor: '#ff5252', color: '#fff', fontSize: '9px', fontWeight: 'black' }}>B:YES</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* ?�裡?��?多�??�警??UI */}
                            {isDuplicateTab && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 9999,
                                    backgroundColor: 'rgba(0,0,0,0.85)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    color: 'white', textAlign: 'center', padding: '20px', fontSize: '11px', lineHeight: '1.6'
                                }}>
                                    <div style={{ fontSize: '24px', marginBottom: '10px' }}>?��?</div>
                                    <div style={{ fontWeight: 'bold' }}>?�測?�其他�??�正?��???/div>
                                    <div style={{ marginTop: '10px', color: '#aaa', fontSize: '9px' }}>?�避?��?檔�?突�?此�??�已?��???br />請�??�其他�??��??��??�整?��?/div>
                                </div>
                            )}

                            {/* --- ?? ?��?式�??��?行�? (LCD Integrated) --- */}
                            <LeaderboardOverlay
                                isLeaderboardOpen={isLeaderboardOpen}
                                leaderboardPage={leaderboardPage}
                                isLeaderboardLoading={isLeaderboardLoading}
                                leaderboard={leaderboard}
                            />


                            {/* 淘汰賽系�?Overlay */}
                            <TournamentOverlay
                                isTournamentOpen={tournament.isTournamentOpen}
                                tPhase={tournament.tPhase}
                                currentRound={tournament.currentRound}
                                opponents={tournament.opponents}
                                nextTournamentPhase={tournament.nextTournamentPhase}
                                myMonsterId={getMonsterIdWrapped()}
                                playerName={user?.displayName || '?�家'}
                                rogueOptions={tournament.rogueOptions}
                                selectedCardIdx={tournament.selectedCardIdx}
                                pendingSkillLearn={!!pendingSkillLearn}
                                tournamentBuffs={tournament.tournamentBuffs}
                                rewardOptions={tournament.rewardOptions}
                                selectedRewardMoveIdx={tournament.selectedRewardMoveIdx}
                                selectedRewardEffectIdx={tournament.selectedRewardEffectIdx}
                                playerMoves={(advStats.moves || []).map(id => SKILL_DATABASE[id]).filter(Boolean)}
                                moves={advStats.moves}
                                moveUpgrades={advStats.moveUpgrades || {}}
                            />

                            {/* ?�險?��??對戰系統 Overlay */}
                            <BattleAdventureOverlay
                                isAdvMode={isAdvMode}
                                isTournamentOpen={tournament.isTournamentOpen}
                                battleState={battleState}
                                pvp={pvp}
                                advCD={advCD}
                                advStats={advStats}
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

                            {/* ?�?�查�?Overlay */}
                            <StatusOverlay
                                isStatusUIOpen={isStatusUIOpen}
                                getMonsterId={getMonsterIdWrapped}
                                soulTagCounts={soulTagCounts}
                                hunger={hunger}
                                mood={mood}
                                bondValue={bondValue}
                                advStats={advStats}
                                trainWins={trainWins}
                                calcFinalStat={calcFinalStat}
                                getIVGrade={getIVGrade}
                            />

                            {/* ?�獸?��? */}
                            <MonsterpediaOverlay
                                isOpen={isPediaOpen}
                                onClose={() => setIsPediaOpen(false)}
                                ownedMonsters={ownedMonsters}
                                monsterNames={MONSTER_NAMES}
                                obtainableIds={OBTAINABLE_MONSTER_IDS}
                                selectedIndex={pediaIdx}
                                isDetailOpen={isPediaDetailOpen}
                            />

                            {/* === ?? 互�?系統子選??UI (精緻?�軸?? === */}
                            {isInteractMenuOpen && (
                                <div className="absolute inset-0 z-[120] flex flex-col items-center justify-start p-2"
                                    style={{
                                        backgroundImage: `url("${base}assets/BG/?�用底�?.png")`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}>
                                    <div className="absolute inset-0 bg-blue-900/40 z-0"></div>

                                    <div className="w-full bg-[#383a37]/50 text-white [text-shadow:0_0_4px_#fff] text-[11px] px-2 py-1.5 flex justify-center items-center mb-0 font-black relative z-10 shadow-sm">
                                        <span>互�?系統</span>
                                    </div>

                                    <div className="flex-1 w-full flex flex-col gap-2 px-1 justify-center pb-4 relative z-10 overflow-hidden">
                                        {(() => {
                                            const options = [
                                                { label: "?? 餵�? (飽�?�?", desc: "?��?美味?��?類�?快速�??��??�並?��?好�??? },
                                                { label: "???�摸 (心�?�?", desc: "溫�??��??��??��?安撫?�獸?��??�並建�?????? },
                                                { label: "??結�?互�?", desc: "完�??��??��??��?返�?主畫?��??��? }
                                            ];

                                            return options.map((opt, idx) => {
                                                const isSelected = interactMenuIdx === idx;
                                                const isNext = (interactMenuIdx + 1) % options.length === idx;
                                                const isPrev = (interactMenuIdx - 1 + options.length) % options.length === idx;

                                                if (!isSelected && !isNext && !isPrev) return null;

                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`w-full p-2 py-2.5 rounded border-2 transition-all duration-200 flex flex-col items-center text-center backdrop-blur-[2px]
                                                    ${isSelected
                                                                ? 'bg-[#383a37]/50 text-[#ffca28] [text-shadow:0_0_4px_#ffca28] border-white/40 scale-100 opacity-100 z-10'
                                                                : 'bg-white/10 text-white/50 border-white/10 scale-90 opacity-40 blur-[0.5px]'
                                                            }`}
                                                        style={{
                                                            transform: isPrev ? 'translateY(-5px)' : isNext ? 'translateY(5px)' : 'none'
                                                        }}
                                                    >
                                                        <div className="text-[12px] font-black">
                                                            {opt.label}
                                                        </div>
                                                        {isSelected && (
                                                            <div className="mt-2 flex flex-col items-center animate-fade-in">
                                                                <div className="text-[9px] leading-tight px-3 py-1 bg-black/20 rounded-sm mb-2 text-white/90">
                                                                    {opt.desc}
                                                                </div>
                                                                <div className="text-[9px] font-black bg-[#ff5252] text-white px-3 py-0.5 rounded-full border border-white/30 animate-pulse shadow-sm">
                                                                    [B] 確�??��?
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            });
                                        })()}
                                    </div>

                                    <div className="absolute bottom-6 w-full text-center px-4 z-10">
                                        <div className="text-[9px] font-black text-white opacity-60 border-t-2 border-white/10 pt-2">
                                            使用 [A] ?��??��?，[B] ?��??��?
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ?��??��? */}
                            <InventoryOverlay
                                isInventoryOpen={isInventoryOpen}
                                inventory={inventory}
                                selectedItemIdx={selectedItemIdx}
                                isUsingItem={isUsingItem}
                            />

                            {/* === ?? 對戰?��? UI === */}
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
                                soulTagCounts={soulTagCounts}
                                lockedAffinity={lockedAffinity}
                                handleBUp={() => { }}
                            />

                            {/* ?�?�學�??��?介面 (Skill Learn UI) - Moved to bottom for max priority */}
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
                                        {/* ?�部?��? */}
                                        <div className="absolute top-[20px] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2" style={{
                                            color: '#1a1a1a',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'center'
                                        }}>
                                            {/* ?��?標�?字�???LOGO ?��? */}
                                            <img
                                                src={`${base}assets/BG/LOGO.png`}
                                                alt="LOGO"
                                                className="w-[180px] h-auto object-contain mb-1"
                                                style={{ imageRendering: 'pixelated' }}
                                            />
                                            <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                                                ??<span className="blink-anim">A</span> ?��??�險
                                            </div>

                                            {/* Firebase ?�入?�制??*/}
                                            <div className="mt-4 pointer-events-auto flex flex-col items-center gap-2">
                                                {user ? (
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-[9px] text-[#383a37] mb-1">已登?? {user.displayName}</div>
                                                        <button
                                                            onClick={logoutGoogle}
                                                            className="bg-[#ccd6be] border-2 border-[#1a1a1a] px-2 py-1 text-[9px] shadow-[2px_2px_0_rgba(0,0,0,0.1)] active:translate-y-[1px]"
                                                        >
                                                            ?�出帳�?
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={loginWithGoogle}
                                                        className="bg-[#ffca28] border-2 border-[#1a1a1a] px-3 py-1.5 text-[10px] font-bold shadow-[3px_3px_0_rgba(0,0,0,0.2)] active:translate-y-[1px] flex items-center gap-2"
                                                    >
                                                        <span>??? Google 帳�?</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* ?�面?�個�??�跳躍�??�獸 (帶�?淡入淡出?�倒�??��?) */}
                                        {(() => {
                                            const positions = [
                                                "top-4 left-4",    // 0: 左�?
                                                "top-4 right-4",   // 1: ?��?
                                                "bottom-4 left-4", // 2: 左�?
                                                "bottom-4 right-4" // 3: ?��?
                                            ];
                                            const isTop = bootMonsterPosIdx < 2;
                                            const isLeft = bootMonsterPosIdx % 2 === 0;
                                            return (
                                                <div
                                                    className={`absolute ${positions[bootMonsterPosIdx]} flex justify-center items-center transition-opacity duration-1000`}
                                                    style={{
                                                        zIndex: 40,
                                                        opacity: isBootMonsterVisible ? 1 : 0,
                                                        // ?��??��?上�??��?(isTop)?�左?�鏡�?isLeft)
                                                        transform: `scale(${isLeft ? -2.5 : 2.5}, ${isTop ? -2.5 : 2.5})`,
                                                        transformOrigin: 'center'
                                                    }}
                                                >
                                                    <div style={{ animation: 'egg-pulse 2s infinite ease-in-out' }}>
                                                        <DitheredSprite id={bootMonsterId} scale={1} />
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
                                                    {/* 底層：�??��?點陣??(?��??��??��??��?載入失�??�顯�? */}
                                                    {!loadedImages[item.id] && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <PixelArt sprite={item.sprite} color="#1a1a1a" scale={3} />
                                                        </div>
                                                    )}
                                                    {/* 上層：自定義?��??��? (M1-M8) */}
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

                                            {/* ?�端?�步?�?�顯�?*/}
                                            {user && (
                                                <div className="absolute right-4 top-2 flex items-center gap-1">
                                                    <div className={`w-[6px] h-[6px] rounded-full ${isCloudSyncing ? 'bg-[#ff5252] animate-pulse' : 'bg-[#4caf50]'}`} />
                                                    <span className="text-[8px] text-[#383a37] font-bold">
                                                        {isCloudSyncing ? '?�步�?..' : '?�端存�?已�?�?}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full flex-1 relative z-10 overflow-hidden flex flex-col items-center justify-center">
                                            {isEvolving && (
                                                <div className="absolute inset-0 bg-[#8fa07e]/80 flex items-center justify-center z-[100]">
                                                    <span className="animate-pulse text-[14px] tracking-widest font-bold">?��?�?..</span>
                                                </div>
                                            )}

                                            {miniGame && (
                                                <div className="absolute inset-0 z-60 flex flex-col items-center justify-start pt-8 pointer-events-none">
                                                    {miniGame.type === 'reaction' && (
                                                        <>
                                                            {miniGame.status === 'ready' && <span className="text-[20px] font-bold animate-pulse text-[#111]">READY?</span>}
                                                            {miniGame.status === 'countdown' && <span className="text-[48px] font-black text-[#111]">{miniGame.count}</span>}
                                                            {miniGame.status === 'go' && <span className="text-[36px] font-black text-[#ff5252] animate-bounce" style={{ textShadow: '2px 2px 0 #fff' }}>GO!</span>}
                                                        </>
                                                    )}

                                                    {miniGame.type === 'charge_click' && (
                                                        <>
                                                            {miniGame.status === 'idle' && <span className="text-[20px] font-bold animate-pulse text-[#111]">CLICK B!</span>}
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
                                                            {miniGame.status === 'idle' && <span className="text-[20px] font-bold animate-pulse text-[#111] mb-2">START? [B]</span>}
                                                            {miniGame.status === 'spinning' && <span className="text-[20px] font-bold animate-pulse text-[#ff5252] mb-2">STOP! [B]</span>}

                                                            {(miniGame.status === 'idle' || miniGame.status === 'spinning') && (
                                                                <div className="w-[48px] h-[48px] border-4 border-[#111] bg-[#e0e0e0] flex items-center justify-center relative shadow-[0_4px_0_rgba(0,0,0,0.2)]">
                                                                    <PixelArt sprite={ICONS[miniGame.items[miniGame.currentIdx]]} color="#111" scale={3} />
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    {miniGame.type === 'spin_heart' && (
                                                        <>
                                                            {miniGame.status === 'idle' && <span className="text-[20px] font-bold animate-pulse text-[#111] mb-2">START? [B]</span>}
                                                            {miniGame.status === 'spinning' && <span className="text-[20px] font-bold animate-pulse text-[#ff5252] mb-2">STOP! [B]</span>}

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

                                            {/* 死亡後�?示�?�?*/}
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
                                                        ?�任?��???br />?�新?��?
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-[240px] h-[32px] border-2 border-[#1a1a1a] flex items-center px-2 overflow-hidden z-10 bg-[#9dae8a] shrink-0 mb-[10px] shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)] relative">
                                            <span key={marqueeKey} className={`text-[11px] font-bold ${isBooting ? 'whitespace-pre-line text-center w-full leading-tight' : 'whitespace-nowrap'}`} style={{ animation: isBooting ? 'none' : 'marquee-once 4s ease-out forwards' }}>
                                                {isBooting ? (
                                                    <>
                                                        <div>?��??�獸</div>
                                                        <div>??<span className="blink-anim">A</span> ?��??�險</div>
                                                    </>
                                                ) : dialogue}
                                            </span>
                                        </div>

                                        <div className="w-full h-[28px] flex justify-between px-4 pb-12 z-10 shrink-0 relative">
                                            {menuItems.slice(4, 8).map((item, idx) => (
                                                <div key={item.id} className="pixel-rendering relative w-[28px] h-[28px] flex items-center justify-center" style={{ opacity: activeIndex === idx + 4 ? 1 : 0.2 }}>
                                                    {/* 底層保�? */}
                                                    {!loadedImages[item.id] && (
                                                        <div className="absolute inset-0 flex items-center justify-center">
                                                            <PixelArt sprite={item.sprite} color="#1a1a1a" scale={3} />
                                                        </div>
                                                    )}
                                                    {/* 上層?��?義�???*/}
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

                                        {/* ?��?警�?彈�? (Alert Modal) */}
                                        {alertMsg && (
                                            <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
                                                <div className="bg-[#9dae8a] border-[4px] border-[#1a1a1a] shadow-[4px_4px_0_rgba(0,0,0,0.3)] p-3 w-full flex flex-col items-center">
                                                    <div className="text-[12px] font-black text-[#ff5252] mb-1 tracking-widest">[ SYSTEM ALERT ]</div>
                                                    <div className="text-[13px] font-bold text-[#111] text-center leading-tight mb-3">
                                                        {alertMsg}
                                                    </div>
                                                    <div className="text-[10px] text-[#444] animate-pulse">
                                                        -- ?�任?�鍵?��? --
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 4px 15px rgba(0,0,0,0.8)', zIndex: 100 }} />
                        </div>

                        <div className="mt-7 w-full flex justify-between px-6 mb-2">
                            {[
                                { key: 'A', name: '?��?' },
                                { key: 'B', name: '確�?' },
                                { key: 'C', name: '返�?' }
                            ].map((btn) => (
                                <div key={btn.key} className="flex flex-col items-center gap-1">
                                    <button
                                        onMouseDown={() => { setBtnPressed(btn.key); if (btn.key === 'B') handleBDown(); }}
                                        onMouseUp={() => { setBtnPressed(null); if (btn.key === 'B') handleBUp(); }}
                                        onMouseLeave={() => { setBtnPressed(null); if (btn.key === 'B') handleBUp(); }}
                                        className={`
                                  w-[54px] h-[54px] rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.6)]
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
                                    <span className="text-[12px] font-bold text-[#e0e0e0] tracking-widest mt-1 opacity-80">
                                        {btn.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="w-full mt-2 px-6 flex justify-center">
                            <button
                                onClick={isDead ? handleRestart : triggerFarewell}
                                disabled={!isDead && isGenerating}
                                className={`w-[160px] h-[68px] border-none brightness-100 active:brightness-90 transition-all ${!isDead && isGenerating ? 'opacity-50' : 'opacity-100'}`}
                                style={{
                                    backgroundImage: `url('${base}assets/BG/ED.png')`,
                                    backgroundSize: '100% 100%',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat',
                                    backgroundColor: 'transparent',
                                }}
                            ></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


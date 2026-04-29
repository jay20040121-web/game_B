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

    // --- ✨ BUG FIX: 獲取在地日期字串 (YYYY-MM-DD) 避免 UTC 時差問題 ---
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

    // 談心系統新增狀態
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

    // --- 自動縮放系統 (Auto-Scaling) ---
    const [displayScale, setDisplayScale] = useState(1);
    useEffect(() => {
        const handleResize = () => {
            // 基準尺寸 320x620 (完全同步 Git 原始縮放邏輯)
            const scaleW = window.innerWidth / 320;
            const scaleH = (window.innerHeight - 20) / 620;
            const scale = Math.min(scaleW, scaleH, 1.5); // 原始設定：上限 1.5 倍以避免模糊
            setDisplayScale(scale);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);



    const [isInteractMenuOpen, setIsInteractMenuOpen] = useState(false);
    const [interactMenuIdx, setInteractMenuIdx] = useState(0);
    const [isInteractAnimating, setIsInteractAnimating] = useState(false);

    // 圖鑑系統狀態
    const [ownedMonsters, setOwnedMonsters] = useState(getInit('ownedMonsters', []));
    const [isPediaOpen, setIsPediaOpen] = useState(false);
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
        encounterRates: null, // { trainer, wild, gather }
        catchRate: null,
        adventureCD: null
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

    const [isSpinning, setIsSpinning] = useState(false);
    const [isEvolving, setIsEvolving] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [dialogue, setDialogue] = useState("像素怪獸\n按A開始冒險"); // 初始顯示改為登入標語，點擊 A 後才切換回遊戲招呼語
    const [marqueeKey, setMarqueeKey] = useState(0);
    const [loadedImages, setLoadedImages] = useState({}); // 追蹤哪些自定義圖標已成功載入

    const [isConfirmingFarewell, setIsConfirmingFarewell] = useState(false); // 二次確認開關

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
        // 資料遷移：如果沒有 bonusMoveId，隨機選一個作為初始特技
        if (!d.bonusMoveId) {
            const pool = ['ember', 'water_gun', 'vine_whip', 'quick_attack'];
            d.bonusMoveId = pool[Math.floor(Math.random() * pool.length)];
        }

        // --- 新增：招式永久化存檔 ---
        if (!d.moves) {
            // 嘗試取得暫存的物種ID
            const monId = String(initialData?.id || localStorage.getItem('pixel_monster_id') || 1000);
            const getStarterMove = (id) => {
                if (id === "1019") return 'lick'; // 霧氣精靈
                return 'tackle'; // 其他
            };
            // 初始招式：撞擊(或專屬) + 隨機贈送的那一招
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

    // 換招式系統
    useEffect(() => {
        // 等級提升時執行
        if (derivedLevel > previousLevelRef.current) {
            if (typeof SPECIES_BASE_STATS === "object" && typeof SKILL_DATABASE === "object") {
                const myId = getMonsterIdWrapped();
                const speciesData = SPECIES_BASE_STATS[String(myId)];
                const myType = speciesData?.types || ['normal'];
                let targetType = 'normal';

                // 學習規則：
                // 5級：一般系
                // 10級：其它屬性 (Coverage)
                // 其它(1~4, 6~9)：本系 (STAB)
                if (derivedLevel === 5) {
                    targetType = 'normal';
                } else if (derivedLevel === 10) {
                    const allTypes = typeof TYPE_CHART === "object" ? Object.keys(TYPE_CHART) : ['fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'steel', 'fairy'];
                    const foreignTypes = allTypes.filter(t => !myType.includes(t));
                    targetType = foreignTypes.length > 0 ? foreignTypes[Math.floor(Math.random() * foreignTypes.length)] : 'normal';
                } else {
                    // 70% 機率抽本系，30% 機率抽全屬性隨機招式
                    const isStab = Math.random() < 0.7;
                    if (isStab) {
                        targetType = myType[Math.floor(Math.random() * myType.length)];
                    } else {
                        const allTypes = Object.keys(TYPE_MAP || {
                            'normal': '普', 'fire': '火', 'water': '水', 'grass': '草', 'electric': '電', 'ice': '冰', 'fighting': '鬥', 'poison': '毒', 'ground': '地', 'flying': '飛', 'psychic': '超', 'bug': '蟲', 'rock': '岩', 'ghost': '鬼', 'dragon': '龍', 'steel': '鋼', 'dark': '惡', 'fairy': '妖'
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

    // --- PvP 系統專屬狀態 (WebRTC/PeerJS) ---
    // --- PvP State Extracted ---

    // --- Firebase 帳號與雲端同步狀態 ---
    const [user, setUser] = useState(null);
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [isCloudLoading, setIsCloudLoading] = useState(false);
    const [hasCheckedCloud, setHasCheckedCloud] = useState(false);
    const [lastCloudSyncTime, setLastCloudSyncTime] = useState(0);

    // Removed duplicate state variables

    // Cleanups removed

    // --- PVP 排行榜邏輯 (已模組化至 useLeaderboard) ---
    // (updatePvpStats, fetchLeaderboard 與排行榜 state 由 hook 提供，於下方解構使用)

    // --- Handlers removed ---

    // Handlers removed

    // 取得自身的戰鬥數值用於 INIT 傳送
    function generateMyBattleStats() {
        const level = Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1));
        const speciesId = getMonsterIdWrapped();

        // --- 性格修正系統 (Nature Modifiers) ---
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
        // 必須至少有過一次對談且分數 > 0 才有性格
        const dominantTag = best[1] > 0 ? best[0] : 'none';
        const pNatureMods = getNatureMods(dominantTag);

        const pMaxHP = calcFinalStat('hp', speciesId, advStats.ivs.hp, advStats.evs.hp, level, pNatureMods.hp);
        const pATK = calcFinalStat('atk', speciesId, advStats.ivs.atk, advStats.evs.atk, level, pNatureMods.atk);
        const pDEF = calcFinalStat('def', speciesId, advStats.ivs.def, advStats.evs.def, level, pNatureMods.def);
        const pSPD = calcFinalStat('spd', speciesId, advStats.ivs.spd, advStats.evs.spd, level, pNatureMods.spd);

        const statsRef = SPECIES_BASE_STATS[String(speciesId)] || { types: ['normal'] };
        const pType = statsRef.types;

        // --- 新：使用存檔中的永久招式陣列 ---
        const pMoves = (advStats.moves || []).map(id => SKILL_DATABASE[id]).filter(Boolean);
        // 防呆：如果完全沒招式 (應不發生)，給個基本招
        if (pMoves.length === 0) pMoves.push(SKILL_DATABASE.tackle);

        return { pMaxHP, pATK, pDEF, pSPD, pType, pMoves, myId: speciesId, pLevel: level };
    };

    // Remote peer connect removed

    // 手動觸發雲端同步
    const saveToCloud = async (saveData) => {
        // 防止重複觸發正在進行中的同步，或沒有使用者/DB，或尚未完成初始檢查
        if (isCloudSyncing || !user || !db || !hasCheckedCloud) return;

        // 【核心安全性校驗】：如果本地進度比雲端上次同步的還舊，絕對不准上傳 (除非是剛重載或是同一個動作週期的數值更新)
        if (saveData.lastSaveTime < lastCloudSyncTime) {
            console.warn(`☁️ 擋下過期的存檔！本地 ${saveData.lastSaveTime} < 雲端最新 ${lastCloudSyncTime}`);
            return;
        }

        setIsCloudSyncing(true);
        console.log("☁️ Attempting Cloud Save (Project ID: " + db.app.options.projectId + ")...");

        try {
            // 加入 20 秒自動逾時機制，避免燈號卡死
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("連線逾時 (請檢查網路或 Firebase Firestore 是否已建立)")), 20000)
            );

            // 【重要】對資料進行深度克隆並移除 undefined (Firestore 不支援 undefined)
            const cleanData = JSON.parse(JSON.stringify(saveData));

            // 使用環境隔離的集合名稱 (正式: users / 開發: dev_users)
            const savePromise = db.collection(FIRESTORE_COLLECTION).doc(user.uid).set(cleanData);

            await Promise.race([savePromise, timeoutPromise]);

            setLastCloudSyncTime(saveData.lastSaveTime);
            console.log("☁️ Cloud Save SUCCESS! (UID: " + user.uid + ")");
        } catch (e) {
            console.error("☁️ Cloud Save FAILED:", e);
            // 根據錯誤類型提供更具體的建議
            let specificMsg = e.message;
            if (e.code === 'permission-denied') {
                specificMsg = "存取被拒 (請檢查 Firestore Rules 設定)";
            } else if (e.code === 'not-found') {
                specificMsg = "找不到目標 (請確認 Firestore 已建立資料庫)";
            }

            setAlertMsg(`❌ 雲端同步失敗: ${specificMsg}`);
            updateDialogue(`❌ 備份失敗：${specificMsg}。可檢查控制台 (F12) 的 UID 並確認 Firestore 已建立。`, true);
        } finally {
            setIsCloudSyncing(false);
        }
    };

    // 從雲端載入進度
    const loadFromCloud = async (currentUser) => {
        if (!currentUser || !db) return;
        updateDialogue("☁️ 正在檢查雲端同步狀態...", true);
        setIsCloudLoading(true);
        try {
            // 使用環境隔離的集合名稱 (正式: users / 開發: dev_users)
            const doc = await db.collection(FIRESTORE_COLLECTION).doc(currentUser.uid).get();
            const localStr = localStorage.getItem('pixel_monster_save');
            let localData = localStr ? JSON.parse(localStr) : null;

            // --- 🔹 跨帳號保護邏輯 (UID 所有權檢查) 🔹 ---
            if (localData && localData.ownerUid && localData.ownerUid !== currentUser.uid) {
                console.warn(`☁️ 發現跨帳號衝突！本地存檔屬於 ${localData.ownerUid}，但您目前登入的是 ${currentUser.uid}。將強行以雲端資料為準。`);
                localData = null; // 抹除本地不屬於該使用者的暫存，以該帳號的雲端或新遊戲為準
            }

            if (doc.exists) {
                const cloudData = doc.data();
                const cloudTime = cloudData.lastSaveTime || 0;
                const localTime = (localData && localData.lastSaveTime) || 0;

                console.log(`☁️ Sync Check - Cloud: ${new Date(cloudTime).toLocaleString()}, Local: ${new Date(localTime).toLocaleString()}`);

                // 比對時間戳記，取最新者 (且必須是同一個人的資料，剛才 localData 已過濾過)
                if (!localData || (cloudTime > localTime + 2000)) {
                    // ✨ 增加版本檢查：如果雲端資料版本不符，不進行同步
                    if (cloudData.saveVersion !== SAVE_VERSION) {
                        console.warn(`☁️ 雲端資料版本 (${cloudData.saveVersion}) 與當前程式碼版本 (${SAVE_VERSION}) 不符，跳過同步以防止資料衝突。`);
                        setHasCheckedCloud(true);
                        setIsCloudLoading(false);
                        return;
                    }

                    updateDialogue("☁️ 發現較新的雲端進度，同步中...", true);
                    localStorage.setItem('pixel_monster_save', JSON.stringify(cloudData));
                    setTimeout(() => window.location.reload(), 1500);
                    // 不關閉 isCloudLoading，直到網頁刷新
                } else {
                    updateDialogue(`☁️ 帳號連線成功，本地進度已是最新`, false);
                    setHasCheckedCloud(true);
                    setIsCloudLoading(false);

                    // 重要：初始化同步基準時間，防止後續 autosave 因為 T1 == T1 被擋下
                    setLastCloudSyncTime(cloudTime);
                    saveToCloud(localData);   // 確保同步
                }
            } else {
                updateDialogue("☁️ 第一次連動，正在建立雲端初始備份...", false);
                setHasCheckedCloud(true);
                setIsCloudLoading(false);
                // 只有當本地資料為「訪客 (無 ownerUid)」或是「本人」時，才建立初始備份
                if (localData) saveToCloud(localData);
            }
        } catch (e) {
            console.error("☁️ Cloud Load Error:", e);
            updateDialogue(`雲端讀取錯誤: ${e.message}`, true);
            setHasCheckedCloud(true);
            setIsCloudLoading(false);
        }
    };

    // 監聽登入狀態
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
            setAlertMsg("系統尚未啟動: Firebase 初始化失敗。");
            return;
        }

        // --- 🚩 偵測到 In-App Browser 時主動提醒 ---
        if (isInAppBrowser) {
            updateDialogue("⚠️ 偵測到 LINE/FB 內部瀏覽器。\nGoogle 不支援在此登入。", true);
            setAlertMsg("請點擊右上角 [...] 並選擇「使用瀏覽器開啟」再登入。");
            playBloop('fail');
            return;
        }

        updateDialogue("⚡ 正在連結 Google 伺服器...", true);
        try {
            // 首先嘗試彈出視窗 (Popup)
            const result = await auth.signInWithPopup(googleProvider);
            if (result.user) {
                updateDialogue(`🎉 登入成功: ${result.user.displayName}`, false);
                setAlertMsg(`成功連動帳號: ${result.user.displayName}`);
                playBloop('success');
                setTimeout(() => loadFromCloud(result.user), 1000);
            }
        } catch (e) {
            console.error("☁️ Login Error:", e);

            // --- 🚨 核心修正：處理 disallowed_useragent (Google 政策阻擋) ---
            if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request') {
                // 嘗試轉為 Redirect 模式，這在某些行動瀏覽器較穩定
                updateDialogue("正在切換至重新導向登入模式...", true);
                try {
                    await auth.signInWithRedirect(googleProvider);
                    return; // 程序會跳轉網頁
                } catch (reErr) {
                    console.error("Redirect Error:", reErr);
                }
            }

            let errMsg = e.message;
            if (e.code === 'auth/popup-closed-by-user') errMsg = "登入視窗被關閉了。";
            if (e.code === 'auth/unauthorized-domain') errMsg = "網域尚未授權，請至 Firebase 設定。";

            // 針對政策阻擋的特別說明
            if (e.message.includes('disallowed_useragent') || e.code?.includes('disallowed-user-agent')) {
                updateDialogue("❌ Google 政策限制：請點擊右上角「...」並選「使用瀏覽器開啟」。", true);
                setAlertMsg("此瀏覽器環境不符合 Google 安全政策。");
            } else {
                updateDialogue(`❌ 登入失敗: ${errMsg}`, true);
                setAlertMsg(`登入失敗: ${errMsg}`);
            }
        }
    };

    const logoutGoogle = async () => {
        if (!auth) return;
        try {
            await auth.signOut();
            // 登出時執行本地存檔清理，防止跨帳號衝突
            try {
                localStorage.removeItem('pixel_monster_save');
                sessionStorage.removeItem('pixel_monster_save');
            } catch (e) { }
            playBloop('pop');
            updateDialogue("已退出登入並清除本地快取。");
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
    const [selectedItemIdx, setSelectedItemIdx] = useState(0);
    const [isUsingItem, setIsUsingItem] = useState(false);
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

    const tabIdRef = useRef(Math.random().toString(36).substr(2, 9));
    const [isDuplicateTab, setIsDuplicateTab] = useState(false);

    // 多分頁競爭檢查 (Heartbeat Lock)
    useEffect(() => {
        const checkTab = () => {
            const now = Date.now();
            const activeTabId = localStorage.getItem('pixel_monster_active_tab_id');
            const activeTabTime = parseInt(localStorage.getItem('pixel_monster_active_tab_time') || '0');

            // 如果已有其他分頁在運行 (時間差小於 3 秒)
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
            // 離開時清除鎖定，讓其他分頁能快速接手
            if (localStorage.getItem('pixel_monster_active_tab_id') === tabIdRef.current) {
                localStorage.removeItem('pixel_monster_active_tab_id');
                localStorage.removeItem('pixel_monster_active_tab_time');
            }
        };
    }, []);

    // 冒險日誌自動捲動到最下方
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
    const [isBooting, setIsBooting] = useState(true); // 每次重新整理都先停留在登入畫面
    const [bootMonsterId, setBootMonsterId] = useState(() => Math.floor(Math.random() * 28) + 1000);
    const [bootMonsterPosIdx, setBootMonsterPosIdx] = useState(0); // 0:左上, 1:右上, 2:左下, 3:右下
    const [isBootMonsterVisible, setIsBootMonsterVisible] = useState(true);

    // 啟動畫面心跳聲
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

    // 啟動畫面怪獸跳槽動畫 (四個角落巡迴 + 倒掛效果)
    useEffect(() => {
        let timer;
        if (isBooting) {
            timer = setInterval(() => {
                if (document.hidden) return;
                setIsBootMonsterVisible(false); // 觸發淡出
                setTimeout(() => {
                    setBootMonsterPosIdx(prev => (prev + 1) % 4);
                    setBootMonsterId(Math.floor(Math.random() * 28) + 1000); // 每次跳轉都更換怪獸 ID (1000-1027)
                    setIsBootMonsterVisible(true); // 觸發淡入
                }, 1000); // 1秒的淡出過渡
            }, 10000); // 10秒一個週期
        }
        return () => {
            if (timer) clearInterval(timer);
        };
    }, [isBooting]);

    // 自動合併舊有重複物品以及確認名稱/描述同步最新的設定
    // 🚀 新增：資料清洗 (Sanitization) - 過濾掉已不存在的 ID 或無效數據
    useEffect(() => {
        // 1. 物品清洗
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

        // 2. 圖鑑清洗 (Owned Monsters)
        // 過濾掉不屬於 OBTAINABLE_MONSTER_IDS 的舊 ID
        setOwnedMonsters(prev => {
            const valid = prev.filter(id => OBTAINABLE_MONSTER_IDS.includes(String(id)));
            if (valid.length !== prev.length) {
                console.log(`🧹 已自動清除 ${prev.length - valid.length} 項過時的圖鑑紀錄`);
                return valid;
            }
            return prev;
        });

        // 3. 招式清洗 (Monster Moves)
        // 過濾掉已從 SKILL_DATABASE 移除的招式
        setAdvStats(prev => {
            const validMoves = (prev.moves || []).filter(mId => SKILL_DATABASE[mId]);
            if (validMoves.length !== (prev.moves || []).length) {
                console.log(`🧹 已從怪獸招式中移除 ${prev.moves.length - validMoves.length} 個過時招式`);
                return { ...prev, moves: validMoves };
            }
            return prev;
        });

    }, []);


    // 追蹤上一次存檔的內容（不含時間戳記），用來判斷是否真的有變動
    const lastSavedDataRef = useRef("");

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

    // 2️⃣ 雲端同步：獨立監控重大行為，不受 hunger/mood 跳動影響
    useEffect(() => {
        if (user && hasCheckedCloud && lastSaveTime > 0) {
            // 只有當重大動作發生 (lastSaveTime 變更) 時，才排程同步
            // 使用較短的 2 秒延遲，且不會被 hunger 衰減給中斷
            const timer = setTimeout(() => {
                const latestData = JSON.parse(lastSavedDataRef.current || '{}');
                saveToCloud(latestData);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, hasCheckedCloud, lastSaveTime]);

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
                    // 計算當前最優勢個性
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
    const menuItems = [
        { id: 'status', sprite: ICONS.status, label: '狀態(可觀看寵物成長資訊)', img: `${base}assets/BG/M1.png` },
        { id: 'interact', sprite: ICONS.feed, label: '互動(餵食或撫摸寵物)', img: `${base}assets/BG/M2.png` },
        { id: 'talk', sprite: ICONS.heart, label: '談心(根據喜好改變寵物特性)', img: `${base}assets/BG/M3.png` },
        { id: 'train', sprite: ICONS.train, label: '特訓(提升寵物戰鬥力)', img: `${base}assets/BG/M4.png` },
        { id: 'adventure', sprite: ICONS.focus, label: '冒險(帶寵物野外探險與捕捉)', img: `${base}assets/BG/M5.png` },
        { id: 'connect', sprite: ICONS.mail, label: '連線(與陌生寵物對抗、交流)', img: `${base}assets/BG/M6.png` },
        { id: 'pedia', sprite: ICONS.footprint, label: '圖鑑(查看已收集的像素怪獸)', img: `${base}assets/BG/M7.png` },
        { id: 'info', sprite: ICONS.info, label: '背包(裝著戰利品與寵物的回憶)', img: `${base}assets/BG/M8.png` },
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

            recordGameAction(); // 紀錄特訓成功
            const bonusStr = gotHPBonus ? "與體力" : "";
            updateDialogue(`經過訓練，${statName}${bonusStr}潛能提升了！`);
            logEvent(`特訓成功！${statName}${bonusStr}潛能 +10`);
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

    const confirmWildCapture = (confirm) => {
        if (confirm && pendingWildCapture) {
            setEvolutionBranch('WILD_' + pendingWildCapture.id);
            setLastEvolutionTime(Date.now()); // 🔥 捕獲後務必重置進化時鐘，防止繼承舊寵物時間導致瞬間進化或暴斃
            recordGameAction(); // 紀錄捕獲行為
            setStageTrainWins(0);            // 重置當前階級勝次

            // --- 🔹 重置冒險數值 (新怪獸新開場，且給予優質個體保底) 🔹 ---
            // 讓玩家在犧牲練度轉換新寵物時，能換到更高資質 (A~S 級) 的個體
            const randomHighIV = () => 25 + Math.floor(Math.random() * 7); // 25~31 (Grade A~S)

            // 取得捕捉時保留的等級 (預設為 1)
            const capturedLevel = pendingWildCapture.level || 1;
            const targetBasePower = (capturedLevel - 1) * 10 + 100;

            // 根據物種 ID 尋找屬性
            const speciesData = SPECIES_BASE_STATS[String(pendingWildCapture.id)] || { types: ['normal'] };
            const types = speciesData.types || ['normal'];

            // 判定怪獸的生物階級 (透過檢查 WILD_EVOLUTION_MAP 來推測)
            const getBioStage = (id) => {
                let stage = 1;
                const idStr = String(id);
                // 檢查是否為某人的進化型 (Stage 2 或 3)
                const isStage2 = Object.values(WILD_EVOLUTION_MAP).some(v => String(v) === idStr);
                if (isStage2) {
                    stage = 2;
                    // 再檢查 Stage 2 是否還有前身 (Stage 3)
                    const stage1Id = Object.keys(WILD_EVOLUTION_MAP).find(k => String(WILD_EVOLUTION_MAP[k]) === idStr);
                    if (stage1Id) {
                        const isStage3 = Object.values(WILD_EVOLUTION_MAP).some(v => String(v) === String(stage1Id));
                        if (isStage3) stage = 3;
                    }
                }
                return stage;
            };
            const bioStage = getBioStage(pendingWildCapture.id);
            setEvolutionStage(bioStage); // 同步正確的進化階段

            // 使用最新的 generateMoves 系統生成招式 (取代舊有硬編碼邏輯)
            // 捕捉到的怪獸視為 initialized，不給予強制 bonusId，完全由 generateMoves 根據等級與階級決定
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
                bonusMoveId: moves[1] || 'tackle', // 保留一招作為潛力參考
                moves: moves
            });

            // 🔥 強制重置等級偵測，確保新夥伴即刻生效且不觸發舊等級剩餘的學習
            previousLevelRef.current = capturedLevel;

            // --- 🔹 重置個性與狀態 (新夥伴新開始) 🔹 ---
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

            updateDialogue(`✨ ${pendingWildCapture.name} 成為了你的新夥伴！`);
            unlockMonster(pendingWildCapture.id);
        } else {
            updateDialogue("保持現狀也很不錯。");
        }
        setPendingWildCapture(null);
        setIsAdvMode(false); // 結束冒險模式
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
        const r = Math.random();
        let bStateToTrigger = null;
        let tempLog = [];

        // --- 🛠️ 偵錯系統覆蓋：機率自定義 ---
        if (debugOverrides.encounterRates) {
            const rates = debugOverrides.encounterRates;
            // 由於 rates 可能只有一個為 1 其餘為 0，這裡用簡單的隨機權重分配 (雖然目前 UI 只有單選)
            if (rates.wild === 1) {
                bStateToTrigger = generateBattleState('wild', myId);
            } else if (rates.trainer === 1) {
                bStateToTrigger = generateBattleState('trainer', myId);
            } else if (rates.gather === 1) {
                handleAdvGather(tempLog, myId);
            }
        } else {
            // --- 根據玩家等級 (derivedLevel) 調整機率 ---
            // 低等級時尋找物資的探索機率極高，高等級時逐漸轉換為戰鬥
            // 等級 1：探索 80% / 野怪 20% / 訓練師 0%
            // 等級 50 及以上：探索 0% / 野怪 30% / 訓練師 70%
            const levelRatio = Math.min(1, Math.max(0, (derivedLevel - 1) / 49)); // 1級為0，50級(含)以上為1

            const gatherProb = 0.80 * (1 - levelRatio); // 探索機率 (80% -> 0%)
            const trainerProb = 0.70 * levelRatio;      // 訓練師機率 (0% -> 70%)
            const wildProb = 1 - gatherProb - trainerProb; // 野怪機率 (20% -> 30%)

            if (r < wildProb) {
                bStateToTrigger = generateBattleState('wild', myId);
            } else if (r < wildProb + trainerProb) {
                bStateToTrigger = generateBattleState('trainer', myId);
            } else {
                handleAdvGather(tempLog, myId);
            }
        }

        if (bStateToTrigger) {
            // 不再立即跳轉，而是推入播報隊列，等待玩家按 B
            const battleIntroLog = {
                msg: bStateToTrigger.initMsg,
                hpRatio: 1,
                iconId: bStateToTrigger.enemy.id,
                triggerBattle: bStateToTrigger
            };
            setAdvLog(prev => [...prev, battleIntroLog]);
            setPendingAdvLogs([battleIntroLog]); // 讓 handleB 處理最後的 triggerBattle
            setIsAdvStreaming(true);
        } else if (tempLog.length > 0) {
            // 採集事件：將採集日誌送入播報隊列
            const logs = [...tempLog, { msg: "🚩 冒險已結束，按 [B] 返回", hpRatio: tempLog[tempLog.length - 1].hpRatio }];
            setAdvLog([logs[0]]);
            setPendingAdvLogs(logs.slice(1));
            setIsAdvStreaming(true);
        } else {
            // 異常情況也確保關閉串流狀態
            setIsAdvStreaming(false);
        }
    };

    // --- 經典回合制戰鬥引擎 ---

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

    // --- 🔹 戰鬥播報自動播放引擎 🔹 ---
    useEffect(() => {
        if (!battleState.active || battleState.phase !== 'action_streaming') return;

        // 判斷當前動作類型決定停留時間
        const currentStep = battleState.stepQueue.length > 0 ? battleState.stepQueue[0] : null;
        const delay = currentStep && currentStep.type === 'damage' ? 600 : 1300; // 訊息 1.3s，傷害閃爍 0.6s

        const timer = setTimeout(() => {
            // 模擬按下 B 鍵觸發更新
            setBattleState(prev => {
                if (prev.stepQueue.length > 30) return prev; // Safety net

                // 執行與 handleB 邏輯相同的狀態更新
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
                    // 隊列結束，進行最後的數值校準
                    const finalPlayerHp = prev.playerHpAfter !== undefined ? prev.playerHpAfter : prev.player.hp;
                    const finalEnemyHp = prev.enemyHpAfter !== undefined ? prev.enemyHpAfter : prev.enemy.hp;

                    if (prev.player.hp <= 0 || prev.enemy.hp <= 0) {
                        const isWin = prev.enemy.hp <= 0;
                        const next = {
                            ...prev,
                            phase: 'end',
                            activeMsg: isWin ? "🏆 戰鬥勝利！" : "💀 戰體力耗盡...",
                            flashTarget: null,
                            player: { ...prev.player, hp: finalPlayerHp },
                            enemy: { ...prev.enemy, hp: finalEnemyHp }
                        };

                        // 動態計算經驗值 (與 handleB 邏輯同步)
                        const scaling = 1 + evolutionStage * 0.2;
                        const gain = Math.floor((prev.mode === 'trainer' ? 5 : 2) + scaling);

                        setTimeout(() => isWin ? resolveBattleWin(gain, prev.enemy) : resolveBattleLoss(), 1500);
                        return next;
                    }

                    // 關鍵修正：野外戰鬥需回到 'combat' 觸發自動循環，訓練家戰鬥則回到 'player_action' 等待指令
                    const nextPhase = prev.mode === 'wild' ? 'combat' : 'player_action';

                    // 利用計算結果進行最終 HP 校準，同時百分之百保留本地所有其他屬性 (如 moves)
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

        logs.push({ msg: `🏆 戰鬥勝利！獲得 ${finalGain} 點成長。`, hpRatio: 1, iconId: myId });
        applyAdvGain(finalGain, logs, advCurrentHP, myId);
        recordGameAction(); // 紀錄對戰勝利
        if (battleState.mode === 'wild' && enemy) {
            setTodayWildDefeated(n => n + 1);
            const priority = enemy.isElite ? 2 : 1;
            const prefix = enemy.isElite ? '擊敗了精英怪：' : '擊敗了野怪：';
            updateDiaryEvent(`${prefix}${enemy.name || '未知怪獸'}`, priority);
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
            logs.push({ msg: `🎁 獲得了戰利品：${item.name}！`, hpRatio: 1, iconId: myId });
        }

        const catchRate = debugOverrides.catchRate ?? 0.1;
        if (battleState.mode === 'wild' && enemy && Math.random() < catchRate) {
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
        playBloop('pop');
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
            logs.push({ msg: `💀 戰敗撤退中... 需要多吃點飯糰了`, hpRatio: 0 });
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
        playBloop('pop');
    };

    const handleA = () => {
        if (isCloudLoading || isInteractAnimating) return; // 雲端同步或互動表演中禁止操作
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
            // A 鍵：日記翻到前一天
            setDiaryViewDate(prev => {
                const todayStr = getTodayStr(); // 確保邊界在地化
                const d = new Date(prev || todayStr);
                d.setDate(d.getDate() - 1);
                return getTodayStr(d);
            });
            playBloop('pop');
            return;
        }
        if (battleState.active && (battleState.mode === 'trainer' || battleState.mode === 'pvp' || battleState.mode === 'tournament')) {
            if (battleState.phase === 'player_action') {
                // Bug Fix #3: 游標只在有效招式間循環，避免選到空格浪費操作
                const numMoves = battleState.player?.moves?.length || 1;
                setBattleState(prev => ({ ...prev, menuIdx: ((prev.menuIdx || 0) + 1) % numMoves }));
                playBloop('pop');
            }
            return; // 戰鬥期間攔截 A 鍵，防止穿透
        }
        if (pendingWildCapture && !isAdvStreaming) {
            confirmWildCapture(false); // A 鍵一律為 NO
            playBloop('pop');
            return;
        }
        if (isConfirmingReplace) {
            setSkillSelectIdx(prev => (prev + 1) % 2); // 0: YES, 1: NO
            playBloop('pop');
            return;
        }
        if (pendingSkillLearn && !isAdvMode && !isPvpMode && !battleState.active) {
            const maxIdx = advStats.moves.length < 4 ? 2 : advStats.moves.length; // 沒滿時 0:學 1:棄; 滿了時 0-3:換 4:棄
            setSkillSelectIdx(prev => (prev + 1) % (maxIdx + 1));
            playBloop('pop');
            return;
        }
        if (isStatusUIOpen || isAdvMode) return;
        if (isInventoryOpen) {
            if (isUsingItem) return; // 使用中禁止切換
            if (inventory.length > 0) {
                setSelectedItemIdx(prev => (prev + 1) % inventory.length);
                playBloop('pop');
            }
            return;
        }
        if (isConfirmingFarewell) {
            setIsConfirmingFarewell(false);
            updateDialogue("吼吼吼～");
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
                updateDialogue("家裡來了一隻小像素怪獸...", true);
            } else {
                updateDialogue("主人歡迎回來~", true);
            }
            playBloop('success');
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
        if (isInteractMenuOpen) {
            setInteractMenuIdx(prev => (prev + 1) % 3);
            const labels = ["餵食", "撫摸", "結束互動"];
            updateDialogue(`選擇：${labels[(interactMenuIdx + 1) % 3]}`);
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
        if (isCloudLoading || isInteractAnimating) return; // 雲端同步或互動表演中禁止操作
        const currentSkillIdx = clickIdx !== null ? clickIdx : skillSelectIdx;

        if (alertMsg) {
            setAlertMsg("");
            playBloop('pop');
            return;
        }
        if (battleState.active && (battleState.mode === 'pvp' || battleState.mode === 'trainer' || battleState.mode === 'tournament')) {
            if (battleState.phase === 'player_action') {
                // 防抖：0.4秒內不允許重複提交動作 (提高對戰流暢度)
                const now = Date.now();
                if (isPvpMode && (now - (window.lastPvpActionTime || 0) < 400)) return;
                window.lastPvpActionTime = now;

                const currentIdx = battleState.menuIdx || 0;
                const move = battleState.player?.moves?.[currentIdx];
                if (move) {
                    // ⏱️ 沉默緩衝 5 秒：若對手已經出招 (pvpRemoteMoveRef 有值)，延後 5 秒結算以確保對齊
                    if (isPvpMode && pvpRemoteMoveRef.current) {
                        // 先將狀態設為等待，視覺上維持「等待中」避免玩家以為當機
                        setBattleState(prev => ({ ...prev, phase: 'waiting_opponent' }));
                        setTimeout(() => executeBattleTurn('attack', move), 5000);
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
            playBloop('pop');
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
                playBloop('success');
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

        // --- 聯盟大賽手動轉場 ---
        if (tournament.isTournamentOpen && ['intro', 'bracket', 'battle_intro', 'champion', 'lost'].includes(tournament.tPhase)) {
            tournament.nextTournamentPhase();
            playBloop('success');
            return;
        }

        if (isEvolving || isAdvMode) {
            // --- 戰鬥播報模式 (Step-by-Step) --- 
            // ❌ 已將手動 B 鍵推進移除，由 useEffect 自動播放引擎接手
            if (battleState && battleState.active && battleState.phase === 'action_streaming') {
                return;
            }

            // ❌ 移除手動按 B 推進播報 (由自動 Timer 接手)
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
                        playBloop('pop');
                    }
                    return;
                } else {
                    // 日誌完全按完了，只有在此時按下 B 鍵才會正式結束冒險
                    setIsAdvStreaming(false);
                    setIsAdvMode(false);
                    setLastAdvTime(Date.now());
                    updateDialogue("冒險結束。");
                    playBloop('success');
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

        if (isStatusUIOpen) return;
        if (isInventoryOpen) {
            if (isUsingItem) return; // 使用中禁止重複觸發
            if (inventory.length > 0) {
                useItem(selectedItemIdx);
            }
            return;
        }

        if (isInteractMenuOpen) {
            if (interactMenuIdx === 0 || interactMenuIdx === 1) { // 餵食 或 撫摸
                const action = interactMenuIdx === 0 ? 'feed' : 'pet';
                setIsInteractMenuOpen(false); // 暫時關閉以看表演
                setIsInteractAnimating(true); // 鎖定操作
                executeAction(action);
                // 1.5 秒後自動恢復子選單並解除鎖定
                setTimeout(() => {
                    setIsInteractAnimating(false);
                    setIsInteractMenuOpen(true);
                }, 1500);
            } else { // 結束互動
                setIsInteractMenuOpen(false);
                updateDialogue("結束互動。");
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
                    updateDialogue("尚未解鎖此怪獸的詳細資訊...", true);
                    playBloop('fail');
                    return;
                }
            }
            playBloop('success');
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
        if (isCloudLoading || isInteractAnimating) return; // 雲端同步或互動表演中禁止操作
        if (alertMsg) return; // 警告視窗顯示時，C 鍵完全鎖定不執行任何動作
        if (isLeaderboardOpen) {
            setIsLeaderboardOpen(false);
            setAlertMsg("");
            playBloop('pop');
            return;
        }
        if (isPvpMode) {
            if (matchStatus !== 'matched') {
                cleanupPvp("離開連線大廳。");
            } else {
                updateDialogue("對戰中無法逃跑！", true);
            }
            playBloop('pop');
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
            playBloop('pop');
            return;
        }
        if (battleState.active && (battleState.mode === 'trainer' || battleState.mode === 'pvp' || battleState.mode === 'tournament') && battleState.phase === 'player_action') {
            // 返回上層選單（因為目前沒有上層，所以提示無法返回或不做事）
            const tempLogs = [...battleState.logs, "無法返回！"];
            setBattleState(prev => ({ ...prev, logs: tempLogs.slice(-5) }));
            playBloop('pop');
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
            updateDialogue("吼吼吼～");
            return;
        }
        if (isInventoryOpen) {
            if (isUsingItem) return; // 使用中禁止關閉背包
            setIsInventoryOpen(false);
            updateDialogue("吼吼吼～");
            return;
        }
        if (isInteractMenuOpen) {
            setIsInteractMenuOpen(false);
            updateDialogue("吼吼吼～");
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
            updateDialogue("吼吼吼～");
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
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                setIsPediaOpen(true);
                setPediaIdx(0);
                setIsPediaDetailOpen(false);
                updateDialogue("圖鑑系統開啟。", true);
                break;
            case 'interact':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                setIsInteractMenuOpen(true);
                setInteractMenuIdx(0);
                updateDialogue("選擇互動方式：", true);
                break;
            case 'feed':
                if (hunger >= 100) {
                    updateDialogue("我吃不下了...");
                    break;
                }
                setHunger(h => Math.min(100, h + 30));
                setFeedCount(f => f + 1);
                setTodayFeedCount(f => f + 1);
                recordGameAction(); // 紀錄餵食
                velRef.current = { x: velRef.current.x, y: -5.0 };
                updateDialogue("真好吃！");
                logEvent("餵食了怪獸。");
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
                recordGameAction(); // 進入對談視為一動作
                updateDialogue("陪伴對談中...", true);
                logEvent("與怪獸談心。");
                break;
            case 'pet':
                if (mood >= 100) {
                    updateDialogue("摸太久了...");
                    break;
                }
                setMood(m => Math.min(100, m + 20));
                recordGameAction(); // 紀錄撫摸
                velRef.current = { x: velRef.current.x, y: -4.0 };
                updateDialogue("好開心！");
                logEvent("親密互動。");
                break;
            case 'status':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                setIsStatusUIOpen(true);
                updateDialogue("查看狀態中...", true);
                break;
            case 'train':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                recordGameAction(); // 進入特訓視為一動作
                miniGameResultFired.current = false;
                const roll = Math.random();
                if (roll < 0.33) {
                    const targetTime = Date.now() + 4000;
                    setMiniGame({ type: 'reaction', status: 'ready', targetTime, count: 3, result: null });
                    updateDialogue("倒數結束~GO要趕快按B鍵往前衝刺。", true);
                } else if (roll < 0.66) {
                    setMiniGame({ type: 'charge_click', status: 'idle', energy: 0, startTime: Date.now(), result: null });
                    updateDialogue("連戳B鍵直到紅條達標...", true);
                } else {
                    const spinItems = ['ghost', 'redHeart', 'ghost', 'redHeart', 'ghost', 'redHeart'];
                    setMiniGame({ type: 'spin_heart', status: 'idle', items: spinItems, currentIdx: 0, result: null });
                    updateDialogue("當出現紅色愛心時按B鍵！", true);
                }
                posRef.current = { x: 128, y: 190 };
                velRef.current = { x: 0, y: 0 };
                logEvent("開始特訓。");
                setActiveIndex(-1);
                break;
            case 'connect':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
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
                break;
            case 'info':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                setIsInventoryOpen(true);
                setSelectedItemIdx(0);
                updateDialogue("查看背包中...", true);
                break;
            case 'adventure':
                if (isPvpMode || isAdvMode || battleState.active || miniGame || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
                    setAlertMsg("此功能僅限在主畫面使用");
                    playBloop('fail');
                    return;
                }
                startAdventure();
                break;
            default:
                updateDialogue("開發中");
        }
    };

    useEffect(() => {
        if (isBooting || isDead || isEvolving || miniGame || isRunaway || isDuplicateTab) return;

        const checkEvolutionInterval = setInterval(() => {
            if (document.hidden) return;
            const elapsed = Date.now() - lastEvolutionTime;

            // 判斷是否壽終（無法再進化）
            // 野外怪獸 (方案 C)：若在對照表中已無下一階，則視為最終型態，進入壽命倒數
            const isFinalWild = evolutionBranch.startsWith('WILD_') && !WILD_EVOLUTION_MAP[evolutionBranch.slice(5)];

            if (evolutionStage >= 4 || isFinalWild || (evolutionStage === 3 && ['G1', 'G2', 'F_FAIL1', 'F_NINETALES_SOUL'].includes(evolutionBranch))) {
                const lifespan = debugOverrides.evolutionMs ?? EVO_TIMES.FINAL_LIFETIME;
                if (elapsed >= lifespan) {
                    clearInterval(checkEvolutionInterval);
                    // D線抽籤：20% 機率靈魂重生
                    const dRoll = Math.random();
                    const dLine = dRoll < 0.20 ? (Math.random() < 0.5 ? 'G1' : 'G2') : null;
                    setDeathBranch(dLine);
                    setIsGenerating(true);
                    setIsDead(true);
                    velRef.current = { x: 0, y: -0.1 };
                    setTimeout(() => {
                        let words = dLine
                            ? "靈魂不滅...我還會回來的..."
                            : "謝謝你陪我走到最後一刻...";
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
                updateDialogue("進化中！！");

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

                // =====================================================
                // 進化鏈鎖定規則：
                if (evolutionBranch.startsWith('WILD_')) {
                    // 野外怪獸進化線 (方案 C)
                    const currentWildIdStr = evolutionBranch.slice(5);
                    const nextWildIdVal = WILD_EVOLUTION_MAP[currentWildIdStr];
                    if (nextWildIdVal) {
                        nextBranch = 'WILD_' + nextWildIdVal;
                    } else {
                        nextBranch = evolutionBranch; // 已是最終型態
                    }
                } else if (['G1'].includes(evolutionBranch)) {
                    // D 線完全封閉，沿原線繼續 (優先度高於靈魂進化，防止凱西被劫持)
                    nextBranch = evolutionBranch;

                } else if (soulNext || evolutionBranch.endsWith('_SOUL')) {

                    // 靈魂進化線最高優先
                    if (soulNext) {
                        nextBranch = soulNext;
                    } else {
                        // 所有靈魂線現在都是單一直線進化，無額外分支
                        nextBranch = evolutionBranch;
                    }
                } else if (evolutionStage === 1) {
                    // ★ Stage 0→1（百變怪 Stage）：所有線可互通，依條件首次分支
                    if (m >= 50 && h >= 50) {
                        nextBranch = 'A';
                    } else {
                        nextBranch = 'C';
                    }

                } else if (['A', 'C'].includes(evolutionBranch)) {
                    // ★ 已在 A/C 一般線（Stage>=2）：依據數值決定下一階段路徑
                    if (m >= 50 && h >= 50) {
                        nextBranch = 'A';
                    } else {
                        nextBranch = 'C';
                    }

                } else {
                    // 其他未覆蓋情況（保底）
                    nextBranch = 'C';
                }

                setTimeout(() => {
                    const now = new Date();
                    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                    const evolvedId = getMonsterIdWrapped(nextBranch, evolutionStage + 1);
                    const evolvedName = MONSTER_NAMES[evolvedId] || nextBranch;
                    updateDiaryEvent(`${timeStr} 分進化成了：${evolvedName}`, 3);
                    setTodayHasEvolved(true);

                    setEvolutionStage(evolutionStage + 1);
                    setEvolutionBranch(nextBranch);
                    setLastEvolutionTime(Date.now());
                    setStageTrainWins(0);
                    setIsEvolving(false);
                    updateDialogue("進化成功！");
                    unlockMonster(evolvedId);
                }, 2500);
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
    const generateTrainerOpponent = (stage) => {
        const pool = TRAINER_POOLS[stage] || TRAINER_POOLS[1];
        const base = pool[Math.floor(Math.random() * pool.length)];

        const modifiers = [
            { prefix: '強壯的', hpBonus: 1.5, atkBonus: 1.0, spdBonus: 1.0 },
            { prefix: '狂暴的', hpBonus: 1.0, atkBonus: 1.5, spdBonus: 1.0 },
            { prefix: '疾風的', hpBonus: 1.0, atkBonus: 1.0, spdBonus: 1.5 }
        ];
        const mod = modifiers[Math.floor(Math.random() * modifiers.length)];
        return {
            id: base.id,
            name: `${mod.prefix} ${base.name}`,
            power: 100 * (1 + (stage - 1) * 0.2), // 修正難度曲線，Stage 1 訓練師與玩家等級持平 (1.0倍)
            hpMult: mod.hpBonus,
            atkMult: mod.atkBonus,
            spdMult: mod.spdBonus,
            isTrainer: true
        };
    };
    function generateBattleState(mode, myId, pvpOpponentData = null) {
        const level = Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1));
        const speciesId = getMonsterIdWrapped();

        // --- 性格修正系統 (Nature Modifiers) ---
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

        // --- 玩家戰鬥屬性 (Type) 與招式表 ---
        const pStatsRef = SPECIES_BASE_STATS[String(speciesId)] || { types: ['normal'] };
        const pType = pStatsRef.types;

        // --- 新：使用存檔中的永久招式陣列 ---
        const pMoves = (advStats.moves || []).map(id => SKILL_DATABASE[id]).filter(Boolean);
        if (pMoves.length === 0) pMoves.push(SKILL_DATABASE.tackle || { name: '撞擊', power: 40, type: 'normal' });

        let enemyData;
        let eMaxHP, eATK, eDEF, eSPD, eType, eLevel;

        if (mode === 'wild') {
            // 新手保護：在 Stage 1 時過濾掉岩石系等難度過高的怪獸
            const filteredPool = (evolutionStage === 1)
                ? ADV_WILD_POOL.filter(m => m.id !== 1025)
                : ADV_WILD_POOL;

            // 自動根據池子數量分配平等的出現機率 (1/N)
            enemyData = filteredPool[Math.floor(Math.random() * filteredPool.length)];
            const eStatsRef = SPECIES_BASE_STATS[String(enemyData.id)] || { types: ['normal'] };
            eType = eStatsRef.types;
            const isBaby = evolutionStage < 2;
            const isElite = Math.random() < 0.12 && !isBaby;
            eLevel = Math.min(100, Math.min(level, isElite ? level : Math.floor(level * (0.8 + Math.random() * 0.4))));

            // 野生怪隨機分配 IV 與 性格修正
            const eNature = ['passionate', 'stubborn', 'rational', 'gentle', 'nonsense'][Math.floor(Math.random() * 5)];
            const eNatureMods = getNatureMods(eNature);
            const eIVs = { hp: Math.floor(Math.random() * 32), atk: Math.floor(Math.random() * 32), def: Math.floor(Math.random() * 32), spd: Math.floor(Math.random() * 32) };
            const eEVs = { hp: eLevel * 2, atk: eLevel * 2, def: eLevel * 2, spd: eLevel * 2 };

            eMaxHP = calcFinalStat('hp', enemyData.id, eIVs.hp, eEVs.hp, eLevel, eNatureMods.hp);
            eATK = calcFinalStat('atk', enemyData.id, eIVs.atk, eEVs.atk, eLevel, eNatureMods.atk);
            eDEF = calcFinalStat('def', enemyData.id, eIVs.def, eEVs.def, eLevel, eNatureMods.def);
            eSPD = calcFinalStat('spd', enemyData.id, eIVs.spd, eEVs.spd, eLevel, eNatureMods.spd);

            const initMsg = `野生 ${isElite ? '精銳 ' : ''}${enemyData.name} (Lv.${eLevel}) 跳了出來！`;
            const eMoves = generateMoves(Math.max(1, Math.floor(evolutionStage * 0.8)), eType, null, eLevel, true).map(id => SKILL_DATABASE[id]).filter(Boolean);
            return {
                active: true, mode: 'wild', phase: 'intro', turn: 1,
                player: {
                    hp: pMaxHP, maxHp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, id: myId, type: pType, moves: pMoves, level: level,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0
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

            // 使用對手傳來的原始數據，完全排除本地進化或模式修正
            eMaxHP = (enemyData?.stats?.hp) || 150;
            eATK = (enemyData?.stats?.atk) || 80;
            eDEF = (enemyData?.stats?.def) || 50;
            eSPD = (enemyData?.stats?.spd) || 90;
            eType = enemyData?.type || 'normal';
            // 重要：一定要使用傳過來的招式，而非本地生成的
            const eMoves = (enemyData?.moves || generateMoves(1, eType, null, eLevel, true)).map(id => SKILL_DATABASE[id]).filter(Boolean);

            const initMsg = `連線成功！${enemyData?.name || '神祕對手'} (Lv.${eLevel}) 降臨！`;
            return {
                active: true, mode: 'pvp', phase: 'intro', turn: 1,
                player: {
                    hp: pMaxHP, maxHp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, id: myId, type: pType, moves: pMoves, level: level,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0
                },
                enemy: {
                    id: enemyData?.id || 1000, name: (enemyData?.name || '神祕對手'), hp: eMaxHP, maxHp: eMaxHP, atk: eATK, def: eDEF, spd: eSPD, level: eLevel, isPvp: true, type: eType, moves: eMoves,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0
                },
                logs: [initMsg], initMsg,
                stepQueue: [], activeMsg: "", flashTarget: null, menuIdx: 0
            };
        } else {
            enemyData = generateTrainerOpponent(evolutionStage);
            eLevel = Math.min(100, level); // 訓練家與玩家等級持平
            const eNature = ['passionate', 'stubborn', 'rational', 'gentle', 'nonsense'][Math.floor(Math.random() * 5)];
            const eNatureMods = getNatureMods(eNature);
            const eIVs = { hp: 20, atk: 20, def: 20, spd: 20 };
            const eEVs = { hp: eLevel * 4, atk: eLevel * 4, def: eLevel * 4, spd: eLevel * 4 };

            // Bug Fix #1: 套用 generateTrainerOpponent 產生的修飾語乘數 (hpMult/atkMult/spdMult)
            eMaxHP = Math.floor(calcFinalStat('hp', enemyData.id, eIVs.hp, eEVs.hp, eLevel, eNatureMods.hp) * (enemyData.hpMult || 1.0));
            eATK = Math.floor(calcFinalStat('atk', enemyData.id, eIVs.atk, eEVs.atk, eLevel, eNatureMods.atk) * (enemyData.atkMult || 1.0));
            eDEF = calcFinalStat('def', enemyData.id, eIVs.def, eEVs.def, eLevel, eNatureMods.def);
            eSPD = Math.floor(calcFinalStat('spd', enemyData.id, eIVs.spd, eEVs.spd, eLevel, eNatureMods.spd) * (enemyData.spdMult || 1.0));

            // Bug Fix #2: 從 SPECIES_BASE_STATS 讀取正確的雙屬性陣列，而非使用 stageMap 的硬編碼單屬性字串
            const eStatsRef = SPECIES_BASE_STATS[String(enemyData.id)] || { types: ['normal'] };
            eType = eStatsRef.types;
            const eMoves = generateMoves(evolutionStage, eType, null, eLevel, true).map(id => SKILL_DATABASE[id]).filter(Boolean);

            const initMsg = `訓練家出現，帶著他的 ${enemyData.name} (Lv.${eLevel}) 向你發起挑戰！`;
            return {
                active: true, mode: 'trainer', phase: 'intro', turn: 1,
                player: {
                    hp: pMaxHP, maxHp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, id: myId, type: pType, moves: pMoves, level: level,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0
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
        log.push({ msg: "在路邊草叢閃爍著光芒...", hpRatio: 1 });

        // 採集主要出產等級 1 物品，極低機率出高等級物品
        let item;
        const r = Math.random();
        if (r < 0.85) item = ADV_ITEMS[0]; // 活力飯糰
        else if (r < 0.98) item = ADV_ITEMS[2]; // 跑步鞋
        else item = ADV_ITEMS[Math.floor(Math.random() * ADV_ITEMS.length)]; // 隨機

        setInventory(prev => {
            const idx = prev.findIndex(it => it.id === item.id);
            if (idx !== -1) {
                const next = [...prev];
                next[idx] = { ...next[idx], count: (next[idx].count || 1) + 1 };
                return next;
            }
            if (prev.length >= 99) {
                log.push({ msg: "⚠️ 背包空間不足，物品流失了...", hpRatio: 1 });
                return prev;
            }
            return [...prev, { ...item, count: 1 }];
        });
        log.push({ msg: `撿到了 [${item.name}]。`, hpRatio: 1, iconId: myId });
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

    // --- 物品使用邏輯 ---
    const useItem = (itemIdx) => {
        if (isUsingItem) return;
        if (itemIdx < 0 || itemIdx >= inventory.length) return;

        setIsUsingItem(true);
        const item = inventory[itemIdx];
        let success = true;

        if (item.skillId) {
            const skill = SKILL_DATABASE[item.skillId];
            if (!skill) {
                updateDialogue("這份秘笈書記載的內容似乎已無法辨認...");
                success = false;
            } else if ((advStats.moves || []).includes(item.skillId)) {
                updateDialogue(`怪獸已經學會「${skill.name}」了，不用再讀啦！`);
                success = false;
            } else {
                setPendingSkillLearn({ skill: skill, level: derivedLevel });
                setIsInventoryOpen(false);
                updateDialogue(`打開了${item.name}！怪獸開始專心領悟新的招式...`);
                // 🚀 關鍵修正：技能道具使用後立即解鎖，不進入 1.8s 的延遲流程
                // 避免 isUsingItem 狀態阻塞後續的 SkillLearnOverlay 操作
                setIsUsingItem(false); 
                
                // 執行消耗流程（減少數量與同步）
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
                return; // 提前返回，不走後面的通用 success 邏輯
            }
        } else {
            switch (item.id) {
                case 'DIARY': // 📖 對戰日記 - 永久道具，開啟全版日記 UI
                    setIsUsingItem(false); // 立即解鎖，不走消耗流程
                    setIsInventoryOpen(false);
                    setDiaryViewDate(getTodayStr()); // 預設顯示今天
                    setIsDiaryOpen(true);
                    playBloop('success');
                    return; // 直接返回，不走後面的 success 消耗邏輯

                case '001': // 活力飯糰
                    setAdvStats(prev => ({ ...prev, basePower: prev.basePower + 10 }));
                    updateDialogue(`吃了${item.name}，戰力提升，感覺等級快升了！`);
                    break;
                case '002': // 戰鬥蛋白粉 (增加 10 點攻擊努力值)
                    setAdvStats(prev => {
                        const nextEVs = { ...prev.evs };
                        const canAdd = Math.min(10, 510 - Object.values(nextEVs).reduce((a, b) => a + b, 0), 252 - nextEVs.atk);
                        if (canAdd > 0) nextEVs.atk += canAdd;
                        return { ...prev, evs: nextEVs, basePower: prev.basePower + 10 };
                    });
                    updateDialogue("使用了戰鬥蛋白粉！攻擊潛能提升了");
                    break;
                case '003': // 跑步鞋
                    // 減少 60 分鐘冷卻：將上次冒險時間往前推移 3600 秒
                    setLastAdvTime(prev => Math.max(1, prev - 3600000));
                    updateDialogue("穿上跑步鞋，感覺還能再戰！");
                    break;
                case '004': // 覺醒之核 (全面提升)
                    setAdvStats(prev => {
                        const nextEVs = { ...prev.evs };
                        const stats = ['hp', 'atk', 'def', 'spd'];
                        stats.forEach(s => {
                            const canAdd = Math.min(8, 510 - Object.values(nextEVs).reduce((a, b) => a + b, 0), 252 - nextEVs[s]);
                            if (canAdd > 0) nextEVs[s] += canAdd;
                        });
                        return { ...prev, evs: nextEVs, basePower: prev.basePower + 30 };
                    });
                    updateDialogue("覺醒之核發光了！全屬性潛能開發成功");
                    break;
                case '005': // 奇異糖果 (隨機大幅提升)
                    setAdvStats(prev => {
                        const nextEVs = { ...prev.evs };
                        const pool = ['hp', 'atk', 'def', 'spd'];
                        const target = pool[Math.floor(Math.random() * 4)];
                        const canAdd = Math.min(20, 510 - Object.values(nextEVs).reduce((a, b) => a + b, 0), 252 - nextEVs[target]);
                        if (canAdd > 0) nextEVs[target] += canAdd;
                        return { ...prev, evs: nextEVs, basePower: prev.basePower + 50 };
                    });
                    updateDialogue("奇異糖果真奇異！一項屬性潛能大幅爆發");
                    break;
                default:
                    updateDialogue(`未知物品 (ID: ${item.id})，無法使用`);
                    success = false;
            }
        }

        if (success) {
            playSoundEffect('success');
            // 減少數量或移除
            setInventory(prev => {
                const next = [...prev];
                if ((next[itemIdx].count || 1) > 1) {
                    next[itemIdx] = { ...next[itemIdx], count: next[itemIdx].count - 1 };
                    return next;
                }
                return next.filter((_, i) => i !== itemIdx);
            });
            recordGameAction(); // 紀錄道具使用
            setSelectedItemIdx(0);
            // 延遲關閉 UI 回到主畫面方便觀看動畫
            setTimeout(() => {
                setIsInventoryOpen(false);
                setIsUsingItem(false); // 解除鎖定
            }, 1800);
        } else {
            setIsUsingItem(false); // 失敗也要解除
        }
    };

    const triggerFarewell = () => {
        // 防呆：僅限主畫面使用 (防止在戰鬥、冒險、特訓、談心、選單中產生邏輯衝突)
        if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isPediaOpen || isInteractMenuOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
            setAlertMsg("此功能僅限在主畫面使用");
            playBloop('fail');
            return;
        }
        setIsConfirmingFarewell(true);
        updateDialogue("確定要終止生命嗎？", true);
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
                // 替換招式
                nextMoves[replaceIdx] = newSkillId;
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
        // D線抽籤：20% 機率靈魂重生
        const dRoll = Math.random();
        const dLine = dRoll < 0.20 ? 'G1' : null;
        setDeathBranch(dLine);
        setIsGenerating(true);
        setIsDead(true);

        setTimeout(() => {
            let words = "";
            if (dLine) {
                words = "靈魂不滅...我還會回來的...";
            } else if (evolutionStage >= 5) {
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
        const savedDeathBranch = latestStats.current.deathBranch;

        setIsBooting(true); // 觸發啟動彩蛋畫面
        setBootMonsterId(Math.floor(Math.random() * 149) + 1); // 重新開機隨機抽一個 ID

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
        setDeathBranch(null); // 重置 D線籤

        // --- 修正戰力與技能繼承邏輯 ---
        // 取得死前戰力的 10% 漲幅作為遺產，加上基礎 100 戰力
        const prevBasePower = latestStats.current.advStats?.basePower || 100;
        const inheritedPower = Math.floor((prevBasePower - 100) * 0.1); // 繼承 10% 的努力成果，而非總戰力

        // 判斷下一代初始招式
        const nextId = savedDeathBranch === 'G1' ? "1019" : "1000";
        const nextStarterMove = nextId === "1019" ? 'lick' : 'tackle';
        const nextBonusId = ['ember', 'water_gun', 'vine_whip', 'quick_attack'][Math.floor(Math.random() * 4)];

        // 完美繼承招式處理：避免與新生自帶招式衝突，並且最多只保留 4 招
        const prevMoves = latestStats.current.advStats?.moves || [];
        let combinedMoves = [nextStarterMove]; // 保證必定擁有當前物種的基本招式

        // 完美匯入前代技能
        prevMoves.forEach(mv => {
            if (!combinedMoves.includes(mv)) {
                combinedMoves.push(mv);
            }
        });

        // 若還有空間且未持有 bonus 招式，再發送 bonus
        if (combinedMoves.length < 4 && !combinedMoves.includes(nextBonusId)) {
            combinedMoves.push(nextBonusId);
        }

        // 把長度限制在最大四招內
        combinedMoves = combinedMoves.slice(0, 4);

        // --- 遺傳繼承：從前代個體值中挑選最強的一項繼承 ---
        const prevIVs = latestStats.current.advStats?.ivs || { hp: 0, atk: 0, def: 0, spd: 0 };
        const maxIVEntry = Object.entries(prevIVs).reduce((a, b) => (a[1] || 0) >= (b[1] || 0) ? a : b);
        const [bestStatKey, bestIVValue] = maxIVEntry;

        const nextIVs = {
            hp: Math.floor(Math.random() * 32),
            atk: Math.floor(Math.random() * 32),
            def: Math.floor(Math.random() * 32),
            spd: Math.floor(Math.random() * 32)
        };
        nextIVs[bestStatKey] = bestIVValue; // 繼承前代最強的一項基因

        setAdvStats({
            basePower: 100 + inheritedPower,
            ivs: nextIVs,
            evs: { hp: 0, atk: 0, def: 0, spd: 0 },
            bonusMoveId: nextBonusId, // 記錄原本隨機出的，但不一定在 moves 陣列中
            moves: combinedMoves
        });

        // 給予玩家反饋提示
        if (inheritedPower > 0 || prevMoves.length > 0) {
            updateDialogue(`繼承了前代的招式與 ${inheritedPower} 點戰力！`, true);
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
        setSoulTagCounts({ gentle: 0, stubborn: 0, passionate: 0, nonsense: 0, rational: 0 });

        if (savedDeathBranch) {
            // D線觸發：靈魂重生為霧氣精靈線
            setEvolutionStage(1);
            setEvolutionBranch(savedDeathBranch);
            setDialogue(savedDeathBranch === 'G1' ? "幽影附身！" : "神秘力量覺醒！");
        } else {
            // 正常重啟：回到起始怪獸
            setEvolutionStage(1);
            setEvolutionBranch('A');
            setDialogue("吼吼吼～");
        }

        // 🔥 VERY IMPORTANT: Remove localStorage data immediately!
        try { localStorage.removeItem('pixel_monster_save'); } catch (e) { }
        try { sessionStorage.removeItem('pixel_monster_save'); } catch (e) { }

        recordGameAction(); // 紀錄重啟行為
    };



    // getMonsterId 已模組化至 src/utils/monsterIdMapper.js
    // 包裝函式保持相同的呼叫介面，補入原本使用 closure 取得的 state 參數
    const getMonsterIdWrapped = (branch = evolutionBranch, stage = evolutionStage) =>
        getMonsterId(branch, stage, isDead, bondValue, soulTagCounts);

    // 啟動時或更換怪獸時自動解鎖圖鑑
    useEffect(() => {
        if (!isBooting && !isDead) {
            unlockMonster(getMonsterIdWrapped());
        }
    }, [isBooting, evolutionBranch, evolutionStage, isDead]);





    // --- PVP 排行榜 (已模組化至 useLeaderboard) ---
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

    // 🔹 當使用者登入成功且排行榜尚未讀取時，自動預載資料以供大賽系統使用
    useEffect(() => {
        if (user && leaderboard.length === 0 && !isLeaderboardLoading) {
            fetchLeaderboard({ silent: true });
        }
    }, [user]);

    // --- 聯盟大賽 (Tournament System) ---
    const tournament = useTournament({
        user, derivedLevel, evolutionStage, myMonsterId: getMonsterIdWrapped(),
        advStats, soulTagCounts, leaderboard, updateDialogue, battleState, setBattleState, setAdvStats, setInventory, playBloop, ADV_ITEMS,
        pendingSkillLearn
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

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a1a1a] p-4 select-none relative">
            <style dangerouslySetInnerHTML={{ __html: BATTLE_STYLES }} />

            {isLocalhost && (
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
                advStats={advStats}
                setAdvStats={setAdvStats}
                inventory={inventory}
                setInventory={setInventory}
                updateDialogue={updateDialogue}
            />

            {/* --- 自動縮放包裝容器 (Responsive Wrapper) --- */}
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
                                                <div style={{ padding: '4px 8px', border: '2px solid #111', backgroundColor: '#ffca28', color: '#111', fontSize: '9px', fontWeight: 'black' }}>A:NO</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                <div style={{ padding: '4px 8px', border: '2px solid #111', backgroundColor: '#ff5252', color: '#fff', fontSize: '9px', fontWeight: 'black' }}>B:YES</div>
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
                            />

                            {/* 冒險或連線對戰系統 Overlay */}
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

                            {/* 狀態查詢 Overlay */}
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

                            {/* === 🤝 互動系統子選單 UI (精緻捲軸版) === */}
                            {isInteractMenuOpen && (
                                <div className="absolute inset-0 z-[120] flex flex-col items-center justify-start p-2"
                                    style={{
                                        backgroundImage: `url("${base}assets/BG/共用底圖.png")`,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center'
                                    }}>
                                    <div className="absolute inset-0 bg-blue-900/40 z-0"></div>

                                    <div className="w-full bg-[#383a37]/50 text-white [text-shadow:0_0_4px_#fff] text-[11px] px-2 py-1.5 flex justify-center items-center mb-0 font-black relative z-10 shadow-sm">
                                        <span>互動系統</span>
                                    </div>

                                    <div className="flex-1 w-full flex flex-col gap-2 px-1 justify-center pb-4 relative z-10 overflow-hidden">
                                        {(() => {
                                            const options = [
                                                { label: "🍖 餵食 (飽食度)", desc: "提供美味的肉類，快速補充體力並提升好感。" },
                                                { label: "✋ 撫摸 (心情度)", desc: "溫和地互動，能夠安撫怪獸的心情並建立連結。" },
                                                { label: "❌ 結束互動", desc: "完成目前的互動，返回主畫面休息。" }
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
                                                                    [B] 確認執行
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
                                            使用 [A] 切換選項，[B] 執行動作
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 我的背包 */}
                            <InventoryOverlay
                                isInventoryOpen={isInventoryOpen}
                                inventory={inventory}
                                selectedItemIdx={selectedItemIdx}
                                isUsingItem={isUsingItem}
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
                                soulTagCounts={soulTagCounts}
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
                                                "top-4 left-4",    // 0: 左上
                                                "top-4 right-4",   // 1: 右上
                                                "bottom-4 left-4", // 2: 左下
                                                "bottom-4 right-4" // 3: 右下
                                            ];
                                            const isTop = bootMonsterPosIdx < 2;
                                            const isLeft = bootMonsterPosIdx % 2 === 0;
                                            return (
                                                <div
                                                    className={`absolute ${positions[bootMonsterPosIdx]} flex justify-center items-center transition-opacity duration-1000`}
                                                    style={{
                                                        zIndex: 40,
                                                        opacity: isBootMonsterVisible ? 1 : 0,
                                                        // 同時處理上下反轉(isTop)與左右鏡射(isLeft)
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
                                                    <div className={`w-[6px] h-[6px] rounded-full ${isCloudSyncing ? 'bg-[#ff5252] animate-pulse' : 'bg-[#4caf50]'}`} />
                                                    <span className="text-[8px] text-[#383a37] font-bold">
                                                        {isCloudSyncing ? '同步中...' : '雲端存檔已同步'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="w-full flex-1 relative z-10 overflow-hidden flex flex-col items-center justify-center">
                                            {isEvolving && (
                                                <div className="absolute inset-0 bg-[#8fa07e]/80 flex items-center justify-center z-[100]">
                                                    <span className="animate-pulse text-[14px] tracking-widest font-bold">進化中...</span>
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

                                        {/* 全域警告彈窗 (Alert Modal) */}
                                        {alertMsg && (
                                            <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-[1px]">
                                                <div className="bg-[#9dae8a] border-[4px] border-[#1a1a1a] shadow-[4px_4px_0_rgba(0,0,0,0.3)] p-3 w-full flex flex-col items-center">
                                                    <div className="text-[12px] font-black text-[#ff5252] mb-1 tracking-widest">[ SYSTEM ALERT ]</div>
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

                        <div className="mt-7 w-full flex justify-between px-6 mb-2">
                            {[
                                { key: 'A', name: '選擇' },
                                { key: 'B', name: '確定' },
                                { key: 'C', name: '返回' }
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


import React, { useState, useEffect, useRef } from 'react';
import './styles.css';
import {
    MONSTER_NAMES,
    SPECIES_BASE_STATS,
    SKILL_DATABASE,
    TYPE_SKILLS,
    ADV_WILD_POOL,
    WILD_EVOLUTION_MAP,
    TYPE_CHART,
    TYPE_MAP,
    NATURE_CONFIG,
    getTypeMultiplier,
    generateMoves,
    calcFinalStat
} from './monsterData';

import { DitheredSprite, DitheredBackSprite, PixelArt, ICONS, BATTLE_STYLES } from './src/components/SpriteRenderer';


import {
    apiKey, modelName, PHYSICS, EVOLUTION_TIME, FINAL_LIFETIME, ADV_ITEMS, DIARY_ITEM,
    DIARY_MESSAGES_TEMPLATE, ADV_BATTLE_RULES, RAW_Q_DATA, SOUL_QUESTIONS,
    getPetDailyMessage, DIARY_STORAGE_KEY, loadDiaryData, saveDiaryData, getSmartMove
} from './src/data/gameConfig';

import { auth, db, googleProvider } from './src/utils/firebase';

// Web Audio API 8-bit 音效產生器
const playBloop = (type) => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (ctx.state === 'suspended') ctx.resume();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        if (type === 'success') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.setValueAtTime(900, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'heartbeat') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(120, ctx.currentTime);
            osc.frequency.setValueAtTime(80, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        } else if (type === 'pop') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1200, ctx.currentTime);
            gain.gain.setValueAtTime(0.03, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
            osc.start();
            osc.stop(ctx.currentTime + 0.05);
        } else {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(250, ctx.currentTime);
            osc.frequency.setValueAtTime(150, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.05, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        }
    } catch (e) { }
};

/**
 * 🐉 Pixel Monster - 日記系統完整版 (Diary System Complete v11)
 * --------------------------------------------------------
 * 特色：對戰日記系統、專屬靈魂個性對話、大事優先權紀錄、
 *       全方位的防呆機制與動態成長系統。
 */
const SAVE_VERSION = 12;

// --- 🔹 環境偵測：判斷是否在 LINE/FB/IG 等 In-App Browser 🔹 ---
const isInAppBrowser = typeof navigator !== "undefined" && (
    /line/i.test(navigator.userAgent) ||
    /fbav/i.test(navigator.userAgent) ||
    /instagram/i.test(navigator.userAgent) ||
    /micromessenger/i.test(navigator.userAgent)
);



const loadSaveData = () => {
    try {
        const str = localStorage.getItem('pixel_monster_save');
        if (str) {
            const data = JSON.parse(str);

            // 版本不符 → 自動清除舊存檔，全新開始
            if (data.saveVersion !== SAVE_VERSION) {
                try { localStorage.removeItem('pixel_monster_save'); } catch (e) { }
                return null;
            }

            if (data.lastSaveTime && !data.isDead && data.evolutionStage < 4) {
                const offlineMs = Date.now() - data.lastSaveTime;
                const stageThresh = { 1: 10800000, 2: 21600000, 3: 86400000 }[data.evolutionStage] || 86400000;
                const dropPerMs = 100 / stageThresh;
                const offlineDrop = offlineMs * dropPerMs;

                if (data.hunger !== undefined) data.hunger = Math.max(0, data.hunger - offlineDrop);
                if (data.mood !== undefined) data.mood = Math.max(0, data.mood - offlineDrop);
            }
            return data;
        }
    } catch (e) { }
    return null;
};

// =========================================
// 🛠️ 偵測面板元件 (Debug Panel)
// =========================================
const DebugPanel = ({
    show, onClose, debugOverrides, setDebugOverrides,
    advStats, setAdvStats, inventory, setInventory, updateDialogue
}) => {
    if (!show) return null;

    // 使用 React.useState 確保在 Babel 環境下的相容性
    const [activeTab, setActiveTab] = React.useState('evo');
    const [evInput, setEvInput] = React.useState({
        hp: advStats.evs.hp,
        atk: advStats.evs.atk,
        def: advStats.evs.def,
        spd: advStats.evs.spd
    });
    const [itemId, setItemId] = React.useState('001');
    const [itemCount, setItemCount] = React.useState(1);

    const totalEvs = Object.values(evInput).reduce((a, b) => a + b, 0);

    const applyEvs = () => {
        if (totalEvs > 510) {
            alert("總和不能超過 510！");
            return;
        }
        setAdvStats(prev => ({
            ...prev,
            evs: { ...evInput }
        }));
        updateDialogue("努力值已更新！");
    };

    const handleEvChange = (stat, val) => {
        const num = Math.min(252, Math.max(0, parseInt(val) || 0));
        setEvInput(prev => ({ ...prev, [stat]: num }));
    };

    const addItems = () => {
        const itemDef = ADV_ITEMS.find(it => it.id === itemId) || DIARY_ITEM;
        setInventory(prev => {
            const idx = prev.findIndex(it => it.id === itemId);
            if (idx !== -1) {
                const next = [...prev];
                next[idx] = { ...next[idx], count: (next[idx].count || 0) + itemCount };
                return next;
            }
            return [...prev, { ...itemDef, count: itemCount }];
        });
        updateDialogue(`已新增 ${itemCount} 個 ${itemDef.name}`);
    };

    return (
        <div className="debug-overlay" style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.92)', zIndex: 10001, color: 'white',
            display: 'flex', flexDirection: 'column', padding: '20px', fontSize: '14px',
            fontFamily: 'monospace', overflowY: 'auto', pointerEvents: 'auto'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#f39c12', fontSize: '18px' }}>🛠️ 偵錯控制器</h2>
                <button onClick={onClose} style={{ padding: '8px 20px', background: '#e74c3c', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>關閉 [X]</button>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => setActiveTab('evo')} style={{ padding: '8px 15px', border: 'none', cursor: 'pointer', background: activeTab === 'evo' ? '#e67e22' : '#333', color: 'white' }}>進化/冒險</button>
                <button onClick={() => setActiveTab('items')} style={{ padding: '8px 15px', border: 'none', cursor: 'pointer', background: activeTab === 'items' ? '#e67e22' : '#333', color: 'white' }}>物品</button>
                <button onClick={() => setActiveTab('stats')} style={{ padding: '8px 15px', border: 'none', cursor: 'pointer', background: activeTab === 'stats' ? '#e67e22' : '#333', color: 'white' }}>數值調整</button>
            </div>

            <div className="debug-content" style={{ flex: 1 }}>
                {activeTab === 'evo' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <div style={{ marginBottom: '5px' }}>進化時間覆蓋 (目前: {debugOverrides.evolutionMs ? debugOverrides.evolutionMs / 1000 + 's' : '預設'})</div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {[0, 10000, 60000, 300000].map(ms => (
                                    <button key={ms} style={{ padding: '5px 10px', cursor: 'pointer' }} onClick={() => setDebugOverrides(p => ({ ...p, evolutionMs: ms }))}>
                                        {ms / 1000}s
                                    </button>
                                ))}
                                <button style={{ padding: '5px 10px', cursor: 'pointer' }} onClick={() => setDebugOverrides(p => ({ ...p, evolutionMs: null }))}>重置</button>
                            </div>
                        </div>
                        <div style={{ padding: '10px', border: '1px solid #444', backgroundColor: '#222' }}>
                            <div style={{ marginBottom: '5px' }}>冒險 CD 覆蓋 (目前: {debugOverrides.adventureCD === 0 ? '無 CD' : '預設'})</div>
                            <button style={{ padding: '8px 15px', cursor: 'pointer', background: '#3498db', color: 'white', border: 'none' }} onClick={() => setDebugOverrides(p => ({ ...p, adventureCD: debugOverrides.adventureCD === 0 ? null : 0 }))}>
                                {debugOverrides.adventureCD === 0 ? '恢復預設' : '立即免除冷卻 (0s)'}
                            </button>
                        </div>
                        <div>
                            <div style={{ marginBottom: '5px' }}>野生捕捉率 (目前: {debugOverrides.catchRate ? debugOverrides.catchRate * 100 + '%' : '預設'})</div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {[0.1, 0.5, 1.0].map(rate => (
                                    <button key={rate} style={{ padding: '5px 10px', cursor: 'pointer' }} onClick={() => setDebugOverrides(p => ({ ...p, catchRate: rate }))}>
                                        {rate * 100}%
                                    </button>
                                ))}
                                <button style={{ padding: '5px 10px', cursor: 'pointer' }} onClick={() => setDebugOverrides(p => ({ ...p, catchRate: null }))}>重置</button>
                            </div>
                        </div>
                        <div style={{ padding: '10px', border: '1px solid #444', backgroundColor: '#222' }}>
                            <div style={{ marginBottom: '5px' }}>冒險事件強制觸發:</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                <button style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => setDebugOverrides(p => ({ ...p, encounterRates: { wild: 1, trainer: 0, gather: 0 } }))}>必遇野怪</button>
                                <button style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => setDebugOverrides(p => ({ ...p, encounterRates: { wild: 0, trainer: 1, gather: 0 } }))}>必遇訓練家</button>
                                <button style={{ padding: '8px 12px', cursor: 'pointer' }} onClick={() => setDebugOverrides(p => ({ ...p, encounterRates: { wild: 0, trainer: 0, gather: 1 } }))}>必遇採集</button>
                                <button style={{ padding: '8px 12px', cursor: 'pointer', background: '#7f8c8d', color: 'white', border: 'none' }} onClick={() => setDebugOverrides(p => ({ ...p, encounterRates: null }))}>恢復隨機</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'items' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <p style={{ color: '#aaa', margin: 0 }}>物品 ID 例: 001(飯糰), 002(蛋白粉), 003(跑步鞋), 004(核心), 005(糖果)</p>
                        <p style={{ color: '#aaa', margin: 0 }}>秘笈書 ID: 006(爆裂拳), 008(煉獄), 009(電磁炮), 010(茁茁轟炸)...</p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span>ID:</span>
                            <input type="text" value={itemId} onChange={e => setItemId(e.target.value)} style={{ width: '80px', padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
                            <span>數量:</span>
                            <input type="number" value={itemCount} onChange={e => setItemCount(parseInt(e.target.value) || 1)} style={{ width: '60px', padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
                            <button onClick={addItems} style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>執行新增</button>
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div>
                        <div style={{ marginBottom: '15px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
                            <strong>努力值調整 (EVs)</strong> - 當前總計: <span style={{ color: totalEvs > 510 ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>{totalEvs}</span> / 510
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['hp', 'atk', 'def', 'spd'].map(stat => (
                                <div key={stat} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <span style={{ width: '40px', textTransform: 'uppercase', fontWeight: 'bold' }}>{stat}</span>
                                    <input
                                        type="range" min="0" max="252" value={evInput[stat]}
                                        onChange={e => handleEvChange(stat, e.target.value)}
                                        style={{ flex: 1, cursor: 'pointer' }}
                                    />
                                    <input
                                        type="number" value={evInput[stat]}
                                        onChange={e => handleEvChange(stat, e.target.value)}
                                        style={{ width: '65px', padding: '8px', background: '#333', color: 'white', border: '1px solid #555', textAlign: 'center' }}
                                    />
                                </div>
                            ))}
                        </div>
                        <button onClick={applyEvs} style={{ width: '100%', padding: '15px', marginTop: '25px', background: '#2980b9', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>立刻保存並套用數值</button>
                    </div>
                )}
            </div>
        </div>
    );
};

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

    // --- 🛠️ 偵錯系統與環境隔離 (Environment Isolation) ---
    const isLocalhost = typeof window !== "undefined" && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '' ||
        window.location.protocol === 'file:'
    );

    // 🔹 數據隔離關鍵參數：本地開發使用 dev_ 前綴
    const FIRESTORE_COLLECTION = isLocalhost ? 'dev_users' : 'users';
    const PEER_PREFIX = isLocalhost ? "gameB_v1_dev_" : "gameB_v1_";

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

    const [pos, setPos] = useState({ x: 128, y: 80 });
    const [vel, setVel] = useState({ x: 0.6, y: 0.4 });
    const [isSpinning, setIsSpinning] = useState(false);
    const [isEvolving, setIsEvolving] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [dialogue, setDialogue] = useState("像素怪獸\n按A開始冒險"); // 初始顯示改為登入標語，點擊 A 後才切換回遊戲招呼語
    const [marqueeKey, setMarqueeKey] = useState(0);

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
            const monId = String(initialData?.id || localStorage.getItem('pixel_monster_id') || 132);
            const getStarterMove = (id) => {
                if (id === "92") return 'lick'; // 鬼斯
                if (id === "63") return 'confusion'; // 凱西
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

    // 等級提升換招式系統
    useEffect(() => {
        // 只有在等級提升時觸發
        if (derivedLevel > previousLevelRef.current) {
            // 確保依賴存在 (由 monsterData.js 或相關 bundle 注入)
            if (typeof SPECIES_BASE_STATS === "object" && typeof SKILL_DATABASE === "object") {
                const myId = typeof getMonsterId === "function" ? getMonsterId() : 132;
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
                    targetType = myType[Math.floor(Math.random() * myType.length)];
                }

                const candidateIds = Object.keys(SKILL_DATABASE).filter(k => SKILL_DATABASE[k].type === targetType);
                if (candidateIds.length > 0) {
                    const newSkillId = candidateIds[Math.floor(Math.random() * candidateIds.length)];
                    const newSkill = SKILL_DATABASE[newSkillId];

                    // 檢查是否已經學過這招
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

    // --- Firebase 帳號與雲端同步狀態 ---
    const [user, setUser] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardPage, setLeaderboardPage] = useState(0); // 新增：分頁狀態
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [isCloudLoading, setIsCloudLoading] = useState(false);
    const [hasCheckedCloud, setHasCheckedCloud] = useState(false);
    const [lastCloudSyncTime, setLastCloudSyncTime] = useState(0);

    const [pvpOpponent, setPvpOpponent] = useState(null);
    const [pvpLog, setPvpLog] = useState([]);
    const [isMyTurn, setIsMyTurn] = useState(false);
    const [pvpCurrentHP, setPvpCurrentHP] = useState(100);
    const [pvpOpponentHP, setPvpOpponentHP] = useState(100);
    const [pendingPlayerMove, setPendingPlayerMove] = useState(null);
    const pvpRemoteMoveRef = useRef(null);

    // =========================================
    // PeerJS 核心連線邏輯 & 穩定性強化
    // =========================================

    // 🔹 已移除硬編碼，現在使用頂部定義的動態 PEER_PREFIX

    // 統一重置 PvP 狀態與連線 (避免卡死)
    const cleanupPvp = (msg = null, destroyPeer = true) => {
        if (msg) updateDialogue(msg);

        // 斷開連線實例
        if (connInstance.current) {
            try { connInstance.current.close(); } catch (e) { }
            connInstance.current = null;
        }

        // 徹底銷毀 Peer 實例 (非常重要：能讓伺服器立即釋放 ID，防止殭屍 Peer)
        if (destroyPeer && peerInstance.current) {
            try {
                if (!peerInstance.current.destroyed) peerInstance.current.destroy();
            } catch (e) { }
            peerInstance.current = null;
            setMyPeerId("");
        }

        // 重置狀態與對戰資訊
        setIsPvpMode(false);
        syncMatchStatus('idle');
        setBattleState(prev => (prev.mode === 'pvp' && prev.active) ? { ...prev, active: false, phase: 'end' } : { ...prev, active: false });
        setPendingPlayerMove(null);
        pvpRemoteMoveRef.current = null;

        // 對手資訊清空
        setPvpOpponent(null);
    };

    // 初始化 Peer (支援自訂 ID 或自動 ID)
    const initPeer = (customId = null, role = null) => {
        // 如果已經有舊的 Peer，先徹底銷毀
        if (peerInstance.current && !peerInstance.current.destroyed) {
            try { peerInstance.current.destroy(); } catch (e) { }
        }

        // 設定 12 秒連線超時警告，防止畫面上卡在 searching
        const connectionTimeout = setTimeout(() => {
            if (matchStatusRef.current === 'searching' || matchStatusRef.current === 'matching') {
                cleanupPvp("連線超時，請檢查密碼或請對方重新開啟。");
            }
        }, 12000);

        const peer = customId ? new window.Peer(customId) : new window.Peer();

        peer.on('open', (id) => {
            setMyPeerId(id);
            // 如果我是挑戰者 (B)，開啟後立即連向 A
            if (role === 'B') {
                const targetId = customId.replace(/_B$/, '_A');
                setTimeout(() => connectToRemotePeer(targetId), 500);
            }
        });

        // 監聽 Peer 全域錯誤
        peer.on('error', (err) => {
            clearTimeout(connectionTimeout);
            console.error("PeerJS Error:", err);

            // 房間佔用邏輯：如果 A 位置有人，嘗試進入 B 位置
            if (err.type === 'unavailable-id' && customId && customId.endsWith('_A')) {
                initPeer(customId.replace(/_A$/, '_B'), 'B');
                return;
            }

            let errMsg = "通訊伺服器錯誤。";
            if (err.type === 'unavailable-id') errMsg = "房間識別碼衝突，請稍後再試。";
            if (err.type === 'network') errMsg = "網路連線中斷。";
            if (err.type === 'peer-unavailable') errMsg = "找不到對手房號，請確認對方已開好房間。";

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
            isHost.current = false;
            setupConnectionHandlers(conn);
        });

        peerInstance.current = peer;
    };

    // 加入/建立 密碼房間
    // --- PVP 排行榜邏輯 (Modular App.js) ---
    const updatePvpStats = async (isWin) => {
        if (!user || !db) return;
        const uid = user.uid;
        const docRef = db.collection('pvp_leaderboard').doc(uid);
        const myId = getMonsterId();

        try {
            await db.runTransaction(async (transaction) => {
                const sfDoc = await transaction.get(docRef);
                let data = sfDoc.exists ? sfDoc.data() : { wins: 0, losses: 0, monsterId: myId, displayName: user.displayName || "未知玩家" };

                if (isWin) data.wins += 1;
                else data.losses += 1;

                data.monsterId = myId; 
                data.displayName = user.displayName || "未知玩家";
                
                const total = data.wins + data.losses;
                const winRate = data.wins / total;
                data.score = (data.wins * 10) + (total * 2) + (winRate * 50);
                data.winRate = winRate;
                data.lastUpdated = window.firebase.firestore.FieldValue.serverTimestamp();

                transaction.set(docRef, data, { merge: true });
            });
        } catch (e) { console.error("Leaderboard update failed:", e); }
    };

    const fetchLeaderboard = async () => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] 🚀 Leaderboard button clicked!`);
        
        if (!db) {
            console.error("Firestore (db) is missing!");
            updateDialogue("資料庫尚未就緒，請檢查 Firebase 設定...");
            return;
        }
        
        setIsLeaderboardLoading(true);
        setLeaderboardPage(0); // 新增：每次讀取重置到第一頁
        try {
            console.log("Fetching top 50 scores...");
            const snapshot = await db.collection('pvp_leaderboard')
                .orderBy('score', 'desc')
                .limit(50)
                .get();
            
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`Success! Found ${list.length} players.`);
            setLeaderboard(list);
            setIsLeaderboardOpen(true);
        } catch (e) {
            console.error("Firebase Error:", e);
            updateDialogue("讀取失敗！(通常是需要建立 Firestore 索引，請查看控制台)...");
        } finally {
            setIsLeaderboardLoading(false);
        }
    };

    // 暴露給全域以便測試
    useEffect(() => {
        window.fetchLeaderboardTest = fetchLeaderboard;
    }, []);

    const joinPvpRoom = (pwd) => {
        if (!pwd || pwd.trim() === "") {
            setAlertMsg("請輸入房間密碼");
            playBloop('fail');
            return;
        }
        const safePwd = pwd.trim().replace(/[^a-zA-Z0-9]/g, '');
        const hostId = PEER_PREFIX + safePwd + "_A";
        syncMatchStatus('searching');
        updateDialogue("正在進入房間節點...", true);
        initPeer(hostId);
    };

    // 快速配對 (隨機挑選公共房間)
    const quickMatch = () => {
        // 公共頻道池
        const pool = ["101", "202", "303", "505", "777", "888", "999"];
        const rand = pool[Math.floor(Math.random() * pool.length)];
        setPvpRoomPassword(rand);
        joinPvpRoom(rand);
    };

    // 處理與對手之間的數據收發
    const setupConnectionHandlers = (conn) => {
        conn.on('open', () => {
            // 連線開啟後，主機端發送初始資訊
            // 客戶端也會發送它的初始資訊
            const { pMaxHP, pATK, pDEF, pSPD, pType, pMoves, myId, pLevel } = generateMyBattleStats();
            conn.send({
                type: 'INIT',
                data: {
                    id: myId,
                    name: user?.displayName || "網路玩家",
                    stats: { hp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, level: pLevel },
                    type: pType,
                    moves: pMoves
                }
            });
        });

        conn.on('data', (payload) => {
            if (payload.type === 'INIT') {
                const bState = generateBattleState('pvp', getMonsterId(), payload.data);
                setBattleState(bState);
                syncMatchStatus('matched');
                playBloop('success');
            } else if (payload.type === 'ACTION') {
                pvpRemoteMoveRef.current = payload.data.move;
                setPendingPlayerMove(prevMove => {
                    if (prevMove) {
                        const myMove = prevMove;
                        setTimeout(() => executeBattleTurn('attack', myMove, pvpRemoteMoveRef.current), 0);
                        return null;
                    }
                    return prevMove;
                });
            } else if (payload.type === 'RESULT') {
                // 客戶端接收主機端算好的結果，直接套用
                setBattleState(prev => {
                    if (!prev || !prev.active) return prev;
                    const { stepQueue, playerHpAfter, enemyHpAfter } = payload.data;
                    if (!stepQueue || stepQueue.length === 0) return prev;
                    const first = stepQueue[0];
                    return {
                        ...prev,
                        phase: 'action_streaming',
                        stepQueue: stepQueue.slice(1),
                        activeMsg: first.text || "",
                        lastStep: first,
                        flashTarget: null,
                        playerHpAfter: playerHpAfter,
                        enemyHpAfter: enemyHpAfter
                    };
                });
            }
        });

        conn.on('close', () => {
            // 只在對戰中或搜尋中才顯示斷線提示
            if (matchStatusRef.current !== 'idle') {
                updateDialogue("對手斷線。");
                setIsPvpMode(false);
                syncMatchStatus('idle');
                setBattleState(prev => ({ ...prev, active: false }));
            }
            connInstance.current = null;
        });
    };

    // 取得自身的戰鬥數值用於 INIT 傳送
    const generateMyBattleStats = () => {
        const level = Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1));
        const speciesId = getMonsterId();

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

    // 當觸發尋找連線時 (按下準備好的確認鍵)
    const connectToRemotePeer = (targetId) => {
        if (!peerInstance.current) return;
        syncMatchStatus('matching');
        updateDialogue("發現對手，正在建立通訊...", true);
        const conn = peerInstance.current.connect(targetId);
        connInstance.current = conn;
        isHost.current = true;
        setupConnectionHandlers(conn);
    };

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

    // 清理連線
    useEffect(() => {
        return () => {
            if (connInstance.current) connInstance.current.close();
            if (peerInstance.current) peerInstance.current.destroy();
        };
    }, []);

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
        const timer = setInterval(checkTab, 1500);
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
    const lastAliveMonsterIdRef = useRef(132);
    const [showRestartHint, setShowRestartHint] = useState(false);
    const [isBooting, setIsBooting] = useState(true); // 每次重新整理都先停留在登入畫面
    const [bootMonsterId, setBootMonsterId] = useState(() => Math.floor(Math.random() * 151) + 1);

    // 啟動畫面心跳聲
    useEffect(() => {
        let timer;
        if (isBooting) {
            timer = setInterval(() => {
                playBloop('heartbeat');
            }, 2000);
        }
        return () => clearInterval(timer);
    }, [isBooting]);

    // 自動合併舊有重複物品以及確認名稱/描述同步最新的設定
    useEffect(() => {
        const merged = [];
        let changed = false;

        // 確保日記永遠在第一位
        if (!inventory.find(it => it.id === 'DIARY')) {
            merged.push({ ...DIARY_ITEM });
            changed = true;
        } else {
            merged.push({ ...DIARY_ITEM }); // 保持日記在最前
        }

        inventory.forEach(item => {
            if (item.id === 'DIARY') return; // 跳過舊的日記條目（避免重複）
            // 找尋最新的定義 (支援正規化 ID，例如 '5' -> '005')
            let searchId = String(item.id);
            if (searchId.length < 3 && !isNaN(searchId)) {
                searchId = searchId.padStart(3, '0');
            }
            const latestDef = ADV_ITEMS.find(it => it.id === searchId);
            // 關鍵修正：必須同步所有屬性（尤其是 skillId），而不單只有名稱與描述
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
            const currentData = {
                saveVersion: SAVE_VERSION,
                hunger, mood, isSleeping, isPooping, evolutionStage, evolutionBranch,
                trainWins, stageTrainWins, feedCount, steps, interactionLogs, interactionCount, isDead, finalWords, lastEvolutionTime,
                deathBranch, bondValue, talkCount, lockedAffinity, soulAffinityCounts, soulTagCounts,
                advStats, inventory, lastAdvTime,
                todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount, lastDiaryDate,
                todayHasEvolved, todaySpecialEvent, todayEventPriority,
                lastSaveTime: lastSaveTime,
                ownerUid: user?.uid || null
            };
            const currentDataStr = JSON.stringify(currentData);
            if (currentDataStr === lastSavedDataRef.current) return;

            localStorage.setItem('pixel_monster_save', currentDataStr);
            lastSavedDataRef.current = currentDataStr;
        } catch (e) { }
    }, [user, hunger, mood, isSleeping, isPooping, evolutionStage, evolutionBranch, trainWins, stageTrainWins, feedCount, steps, interactionLogs, interactionCount, isDead, finalWords, lastEvolutionTime, deathBranch, bondValue, talkCount, lockedAffinity, soulAffinityCounts, soulTagCounts, advStats, inventory, lastAdvTime, todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount, lastDiaryDate, todayHasEvolved, todaySpecialEvent, todayEventPriority, lastSaveTime]);

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
        const timer = setInterval(archiveToday, 30000); // 每 30 秒檢查
        return () => clearInterval(timer);
    }, [todayTrainWins, todayWildDefeated, todayBondGained, todayFeedCount, lockedAffinity, evolutionStage, evolutionBranch]);

    useEffect(() => {
        return () => clearTimeout(idleTimeoutRef.current);
    }, []);


    const menuItems = [
        { id: 'status', sprite: ICONS.status, label: '狀態(可觀看寵物成長資訊)' },
        { id: 'feed', sprite: ICONS.feed, label: '餵食(提升寵物飽足度)' },
        { id: 'talk', sprite: ICONS.heart, label: '談心(根據喜好改變寵物特性)' },
        { id: 'pet', sprite: ICONS.pet, label: '撫摸(提升寵物心情)' },
        { id: 'train', sprite: ICONS.train, label: '特訓(提升寵物戰鬥力)' },
        { id: 'adventure', sprite: ICONS.focus, label: '冒險(帶寵物野外探險與捕捉)' },
        { id: 'connect', sprite: ICONS.mail, label: '連線(與陌生寵物對抗、交流)' },
        { id: 'info', sprite: ICONS.info, label: '背包(裝著戰利品與寵物的回憶)' },
    ];

    useEffect(() => {
        if (isDead || isEvolving || (miniGame && miniGame.type !== 'status') || isDuplicateTab) return;

        const engineTimer = setInterval(() => {
            setPos(prev => {
                // 恢復為舊版的平滑滑動（移除導致抽搐的 Math.random，以及解除 Idle 時被強制釘死在 Y=86 的限制）
                let nextX = (prev.x || 128) + (vel.x || 0.6) * (PHYSICS.FLOAT_SPEED || 0.36);
                let nextY = (prev.y || 128) + (vel.y || 0.4) * (PHYSICS.FLOAT_SPEED || 0.36);

                let newVelX = vel.x;
                let newVelY = vel.y;

                const MARGIN_X = 80;
                const MARGIN_TOP = 55;
                const MARGIN_BOTTOM = 86;

                if (nextX <= MARGIN_X) {
                    newVelX = Math.abs(vel.x) * PHYSICS.BOUNCE_DAMPING;
                    nextX = MARGIN_X;
                } else if (nextX >= 256 - MARGIN_X) {
                    newVelX = -Math.abs(vel.x) * PHYSICS.BOUNCE_DAMPING;
                    nextX = 256 - MARGIN_X;
                }

                if (nextY <= MARGIN_TOP) {
                    newVelY = Math.abs(vel.y) * PHYSICS.BOUNCE_DAMPING;
                    nextY = MARGIN_TOP;
                } else if (nextY >= MARGIN_BOTTOM) {
                    newVelY = -Math.abs(vel.y) * PHYSICS.BOUNCE_DAMPING;
                    nextY = MARGIN_BOTTOM;
                }

                if (newVelX !== vel.x || newVelY !== vel.y) setVel({ x: newVelX, y: newVelY });
                return { x: nextX, y: nextY };
            });
        }, 16);

        return () => clearInterval(engineTimer);
    }, [vel, isDead, isEvolving, miniGame, isDuplicateTab]);

    // 用 Ref 確保可以隨時讀取最新狀態而不觸發 useEffect 重啟
    const latestStats = useRef({ mood, hunger, stageTrainWins, deathBranch, lockedAffinity, soulAffinityCounts, soulTagCounts, bondValue, advStats });
    useEffect(() => {
        latestStats.current = { mood, hunger, stageTrainWins, deathBranch, lockedAffinity, soulAffinityCounts, soulTagCounts, bondValue, advStats };
    }, [mood, hunger, stageTrainWins, deathBranch, lockedAffinity, soulAffinityCounts, soulTagCounts, bondValue, advStats]);

    useEffect(() => {
        if (isBooting || isDead || isEvolving || miniGame || isRunaway || isDuplicateTab) return;

        const thresh = debugOverrides.evolutionMs ?? (EVOLUTION_TIME[evolutionStage] || FINAL_LIFETIME);

        // Total drop phase logic: Ensure it drops 100 units over the entire phase
        const TARGET_DROP_PER_STAGE = 100;
        const TICK_MS = 1000;
        const dropPerTick = TARGET_DROP_PER_STAGE * (TICK_MS / thresh);

        const decayTimer = setInterval(() => {
            setHunger(h => Math.max(0, h - dropPerTick));
            setMood(m => Math.max(0, m - dropPerTick));
        }, TICK_MS);

        return () => clearInterval(decayTimer);
    }, [isBooting, isDead, isEvolving, evolutionStage, isRunaway]);

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
            setVel({ x: (Math.random() - 0.5) * 4, y: -2.0 });
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
            setVel({ x: 0, y: -10.0 }); // 興奮大跳躍

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
            setVel({ x: (Math.random() - 0.5) * 4, y: -2.0 });
        }, 1500);
    };

    const playSoundEffect = (type) => playBloop(type);

    const confirmWildCapture = (confirm) => {
        if (confirm && pendingWildCapture) {
            setEvolutionBranch('WILD_' + pendingWildCapture.id);
            setEvolutionStage(1);
            setLastEvolutionTime(Date.now()); // 🔥 捕獲後務必重置進化時鐘，防止繼承舊寵物時間導致瞬間進化或暴斃
            recordGameAction(); // 紀錄捕獲行為
            setStageTrainWins(0);            // 重置當前階級勝次

            // --- 🔹 重置冒險數值 (新怪獸新開場，且給予優質個體保底) 🔹 ---
            // 讓玩家在犧牲練度轉換新寵物時，能換到更高資質 (A~S 級) 的個體
            const randomHighIV = () => 25 + Math.floor(Math.random() * 7); // 25~31 (Grade A~S)

            const startMoveId = ['92'].includes(String(pendingWildCapture.id)) ? 'lick' : (['63'].includes(String(pendingWildCapture.id)) ? 'confusion' : 'tackle');
            const bonusId = ['ember', 'water_gun', 'vine_whip', 'quick_attack'][Math.floor(Math.random() * 4)];

            setAdvStats({
                basePower: 100, // 捕捉固定從 100 起跳 (Level 1)
                ivs: {
                    hp: randomHighIV(),
                    atk: randomHighIV(),
                    def: randomHighIV(),
                    spd: randomHighIV()
                },
                evs: { hp: 0, atk: 0, def: 0, spd: 0 },
                bonusMoveId: bonusId,
                moves: [startMoveId, bonusId].filter(Boolean)
            });

            updateDialogue(`✨ ${pendingWildCapture.name} 成為了你的新夥伴！`);
        } else {
            updateDialogue("保持現狀也很不錯。");
        }
        setPendingWildCapture(null);
        setIsAdvMode(false); // 結束冒險模式
    };

    const executeBattleTurn = (playerAction = 'attack', actionMove = null, pvpEnemyMove = null) => {
        setBattleState(prev => {
            if (!prev || prev.phase === 'end' || !prev.active || prev.phase === 'action_streaming') return prev;

            // --- PvP 模式特殊預處理 ---
            if (prev.mode === 'pvp' && playerAction === 'attack') {
                // =============================================================
                // 主機端 (Host) 橙紦過來的按鈕：我要出招
                // =============================================================
                if (isHost.current) {
                    // 主機先收集自己的move
                    if (!pvpEnemyMove) {
                        if (pvpRemoteMoveRef.current) {
                            // 對手已經先丟了植式，可以直接進行計算
                            pvpEnemyMove = pvpRemoteMoveRef.current;
                            pvpRemoteMoveRef.current = null;
                            // 將自己的動作傳給對方
                            if (connInstance.current) {
                                connInstance.current.send({ type: 'ACTION', data: { move: actionMove } });
                            }
                            // 繼續下去計算結果
                        } else {
                            // 對手還沒出招，先發送自己的動作，進入等待
                            setPendingPlayerMove(actionMove);
                            if (connInstance.current) {
                                connInstance.current.send({ type: 'ACTION', data: { move: actionMove } });
                            }
                            return { ...prev, phase: 'waiting_opponent', logs: [...prev.logs, "等待對手出招..."] };
                        }
                    }
                    // 主機已收集雙方動作 - 將在下方結鬼铢後發送 RESULT 封包
                } else {
                    // =============================================================
                    // 客戶端 (Client)：對手選拓動作、传送自己動作，奔在等待主機封包
                    // =============================================================
                    if (pvpEnemyMove) {
                        // 這是由 executeBattleTurn 繼續呼叫的路徑 (主機岈受氣框已發)。
                        // 客戶端不自己算傷害，等 RESULT 封包
                        return { ...prev, phase: 'waiting_opponent', logs: [...prev.logs, "等待對手出招..."] };
                    }
                    // 對方已經先送到了
                    if (pvpRemoteMoveRef.current) {
                        pvpRemoteMoveRef.current = null;
                    }
                    // 客戶端不管對方有沒有先出來，情境都是發送自己的動作后等待主機的 RESULT
                    setPendingPlayerMove(actionMove);
                    if (connInstance.current) {
                        connInstance.current.send({ type: 'ACTION', data: { move: actionMove } });
                    }
                    return { ...prev, phase: 'waiting_opponent', logs: [...prev.logs, "等待對手出招..."] };
                }
            }

            const nextQueue = [];
            const playerMoveList = prev.player.moves || [SKILL_DATABASE.tackle];
            // 智慧 AI 選招：優先考慮克制與最高傷害
            const playerMove = actionMove || getSmartMove(prev.player, prev.enemy, playerMoveList);
            const enemyMoveList = prev.enemy.moves || [SKILL_DATABASE.tackle];

            // PvP 模式下使用來自網路的招式，否則使用智慧 AI
            const enemyMove = pvpEnemyMove || getSmartMove(prev.enemy, prev.player, enemyMoveList);

            // 為了讓 PvP 完全同步，使用回合數作為亂數種子，確保雙方算出的傷害完全一致
            let rngState = prev.turn * 1234567;
            const rFunc = () => {
                if (prev.mode !== 'pvp') return Math.random();
                const x = Math.sin(rngState++) * 10000;
                return x - Math.floor(x);
            };

            // Determine Priority Order
            const pPrio = playerMove.priority || 0;
            const ePrio = enemyMove.priority || 0;

            // 計算實際速度（套用能力階級）
            // 套用能力階級 (Stat Stages)
            let pEffSpd = prev.player.spd * getStatMultiplier(prev.player.statStages?.spd || 0);
            let eEffSpd = prev.enemy.spd * getStatMultiplier(prev.enemy.statStages?.spd || 0);

            // 麻痺副作用：速度減半
            if (prev.player.status === 'paralysis') pEffSpd *= 0.5;
            if (prev.enemy.status === 'paralysis') eEffSpd *= 0.5;

            let isPlayerFirst = true;
            if (pPrio > ePrio) isPlayerFirst = true;
            else if (ePrio > pPrio) isPlayerFirst = false;
            else {
                if (pEffSpd === eEffSpd) {
                    isPlayerFirst = prev.mode === 'pvp' ? isHost.current : rFunc() > 0.5;
                } else {
                    isPlayerFirst = pEffSpd > eEffSpd;
                }
            }

            // Damage formula: Gen 1 style
            const calcDamage = (attacker, move, defender) => {
                // --- 新：狀態技能 (威力為 0) 不計算傷害 ---
                if (!move.power || move.power === 0) return { dmg: 0, msg: "" };

                // --- 原有的攻擊命中與傷害邏輯 ---
                const attackerEffSpd = attacker.spd * getStatMultiplier(attacker.statStages?.spd || 0) * (attacker.status === 'paralysis' ? 0.5 : 1);
                const defenderEffSpd = defender.spd * getStatMultiplier(defender.statStages?.spd || 0) * (defender.status === 'paralysis' ? 0.5 : 1);

                const speedRatio = attackerEffSpd / defenderEffSpd;
                const hitRateProb = Math.min(1.0, Math.max(0.3, 0.9 + 0.1 * Math.log2(speedRatio)));

                let hitSuccess = rFunc() < hitRateProb;
                if (!hitSuccess) return { dmg: 0, msg: '攻擊落空了！' };

                const attackerLevel = attacker.level || 5;

                // 套用能力階級 (ATK of attacker, DEF of defender)
                const atkMult = getStatMultiplier(attacker.statStages?.atk || 0);
                const defMult = getStatMultiplier(defender.statStages?.def || 0);

                let effectiveAtk = attacker.atk * atkMult;
                let effectiveDef = defender.def * defMult;

                // 燒傷副作用：物理攻擊減半
                if (attacker.status === 'burn') effectiveAtk *= 0.5;

                let baseDmg = (Math.floor((2 * attackerLevel) / 5 + 2) * move.power * (effectiveAtk / effectiveDef)) / 50 + 2;

                const attackerTypes = Array.isArray(attacker.type) ? attacker.type : [attacker.type];
                if (attackerTypes.includes(move.type)) baseDmg *= 1.5;

                const mult = getTypeMultiplier(move.type, defender.type);
                const rngMod = 0.85 + rFunc() * 0.15;
                const finalDmg = Math.max(1, Math.floor(baseDmg * mult * rngMod));

                let effectMsg = '';
                if (mult >= 2.0) effectMsg = ' (效果絕佳！)';
                else if (mult <= 0.5 && mult > 0) effectMsg = ' (效果似乎不太好...)';
                else if (mult === 0) effectMsg = ' (似乎沒有效果...)';

                return { dmg: finalDmg, msg: effectMsg };
            };

            const updatedPlayer = { ...prev.player };
            const updatedEnemy = { ...prev.enemy };

            const addMoveExecution = (side, move) => {
                const isPlayer = side === 'player';
                const attacker = isPlayer ? updatedPlayer : updatedEnemy;
                const defender = isPlayer ? updatedEnemy : updatedPlayer;
                const attackerName = isPlayer ? (attacker.id === 151 ? '夢幻' : '你') : attacker.name;
                const defenderName = isPlayer ? defender.name : (defender.id === 151 ? '夢幻' : '你');

                // 1. 回合前狀態檢查
                const preCheck = checkPreTurnStatus(attacker, rFunc);
                attacker.status = preCheck.nextStatus;
                attacker.statusTurns = preCheck.nextTurns;

                if (!preCheck.canAct) {
                    if (preCheck.message) {
                        nextQueue.push({ type: 'msg', text: `${attackerName}${preCheck.message}` });
                    }
                    if (preCheck.selfDamage) {
                        const selfDmg = Math.max(1, Math.floor(attacker.maxHp * 0.08));
                        nextQueue.push({
                            type: 'damage', target: isPlayer ? 'player' : 'enemy',
                            value: selfDmg, text: `${attackerName} 受到了混亂的回擊！`
                        });
                        attacker.hp = Math.max(0, attacker.hp - selfDmg);
                    }
                    return;
                }

                nextQueue.push({ type: 'msg', text: `${attackerName} 使出了 [${move.name}]！` });

                const isStatusMove = !move.power || move.power === 0;

                // 2. 命中與傷害結算
                const result = calcDamage(attacker, move, defender);

                // 如果是狀態技能且落空 (例如命中率不滿 100 的狀態技)
                if (isStatusMove) {
                    if (move.accuracy && rFunc() * 100 > move.accuracy) {
                        nextQueue.push({ type: 'msg', text: `${attackerName} 的技能沒中！` });
                        return;
                    }
                } else if (result.dmg === 0) {
                    // 攻擊技能落空
                    nextQueue.push({ type: 'msg', text: `${attackerName} 的攻擊沒中！` });
                    return;
                }

                // 3. 處理傷害 (僅針對非狀態技能)
                if (!isStatusMove && result.dmg > 0) {
                    nextQueue.push({
                        type: 'damage', target: isPlayer ? 'enemy' : 'player',
                        value: result.dmg, text: `對 ${defenderName} 造成了 ${result.dmg} 點傷害！${result.msg}`
                    });
                    defender.hp = Math.max(0, defender.hp - result.dmg);
                }

                // 4. 技能效果結算 (BUFF、異常狀態等)
                const effects = applyMoveEffects(move, defender, attacker, rFunc);
                effects.messages.forEach(m => {
                    const targetName = m.targetType === 'source' ? attackerName : defenderName;
                    nextQueue.push({ type: 'msg', text: `${targetName} ${m.text}` });
                });

                // 5. 吸血與反彈 (僅針對傷害技能)
                if (!isStatusMove && result.dmg > 0) {
                    if (effects.recoilPct > 0) {
                        const recoilDmg = Math.floor(result.dmg * effects.recoilPct);
                        nextQueue.push({
                            type: 'damage', target: isPlayer ? 'player' : 'enemy',
                            value: recoilDmg, text: `${attackerName} 受到了反作用力傷害！`
                        });
                        attacker.hp = Math.max(0, attacker.hp - recoilDmg);
                    }
                    if (effects.drainPct > 0) {
                        const drainHeal = Math.floor(result.dmg * effects.drainPct);
                        nextQueue.push({
                            type: 'heal', target: isPlayer ? 'player' : 'enemy',
                            value: drainHeal, text: `${attackerName} 吸收了生命值！`
                        });
                        attacker.hp = Math.min(attacker.maxHp, attacker.hp + drainHeal);
                    }
                }
            };

            if (playerAction === 'run') {
                nextQueue.push({ type: 'run', text: `你選擇撤退... 逃跑成功！` });
            } else if (playerAction === 'potion') {
                const heal = Math.floor(updatedPlayer.maxHp * 0.3);
                nextQueue.push({ type: 'heal', target: 'player', value: heal, text: `使用了傷藥，恢復了 ${heal} 點 HP！` });
                updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + heal);
                addMoveExecution('enemy', enemyMove);
            } else if (isPlayerFirst) {
                addMoveExecution('player', playerMove);
                if (updatedEnemy.hp > 0) addMoveExecution('enemy', enemyMove);
            } else {
                addMoveExecution('enemy', enemyMove);
                if (updatedPlayer.hp > 0) addMoveExecution('player', playerMove);
            }

            // 4. 回合結束後的狀態結算 (燒傷、中毒、寄生、束縛扣血) - 傳入 rFunc 確保 PvP 同步
            const pPost = processPostTurnStatus(updatedPlayer, updatedPlayer.maxHp, rFunc);
            updatedPlayer.status = pPost.nextStatus;
            updatedPlayer.statusTurns = pPost.nextTurns;
            if (pPost.message) {
                if (pPost.dmg > 0) {
                    nextQueue.push({ type: 'damage', target: 'player', value: pPost.dmg, text: `你${pPost.message}` });
                    updatedPlayer.hp = Math.max(0, updatedPlayer.hp - pPost.dmg);
                    // 寄生回血邏輯 (雖然簡化版，但補上 healing step)
                    if (pPost.heal > 0 && updatedEnemy.hp > 0) {
                        nextQueue.push({ type: 'heal', target: 'enemy', value: pPost.heal, text: `${updatedEnemy.name} 吸收了生命精華！` });
                        updatedEnemy.hp = Math.min(updatedEnemy.maxHp, updatedEnemy.hp + pPost.heal);
                    }
                } else {
                    nextQueue.push({ type: 'msg', text: `你${pPost.message}` });
                }
            }

            const ePost = processPostTurnStatus(updatedEnemy, updatedEnemy.maxHp, rFunc);
            updatedEnemy.status = ePost.nextStatus;
            updatedEnemy.statusTurns = ePost.nextTurns;
            if (ePost.message) {
                if (ePost.dmg > 0) {
                    nextQueue.push({ type: 'damage', target: 'enemy', value: ePost.dmg, text: `${updatedEnemy.name}${ePost.message}` });
                    updatedEnemy.hp = Math.max(0, updatedEnemy.hp - ePost.dmg);
                    if (ePost.heal > 0 && updatedPlayer.hp > 0) {
                        nextQueue.push({ type: 'heal', target: 'player', value: ePost.heal, text: `你從寄生中恢復了生命！` });
                        updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + ePost.heal);
                    }
                } else {
                    nextQueue.push({ type: 'msg', text: `${updatedEnemy.name}${ePost.message}` });
                }
            }

            const finalBattleState = {
                ...prev,
                turn: prev.turn + 1,
                phase: 'action_streaming',
                stepQueue: nextQueue.slice(1),
                activeMsg: nextQueue[0]?.text || "",
                lastStep: nextQueue[0] || null,
                // 關鍵：這裡不要立刻更新 HP，否則 HP 條會瞬間跳轉，導致動畫雙倍扣血
                // 我們只更新狀態 (Status)，血量由 stepQueue 動畫處理，最後再同步校準
                player: { ...prev.player, status: updatedPlayer.status, statusTurns: updatedPlayer.statusTurns },
                enemy: { ...prev.enemy, status: updatedEnemy.status, statusTurns: updatedEnemy.statusTurns },
                // 儲存邏輯結算後的血量，用於動畫結束後的校準
                playerHpAfter: updatedPlayer.hp,
                enemyHpAfter: updatedEnemy.hp
            };

            // 主機端將完整的 stepQueue 發送給客戶端，確保雙方展示相同傷害
            if (prev.mode === 'pvp' && isHost.current && connInstance.current) {
                // 視角翻轉：將主機看到的 enemy 轉換為客戶端看到的 player，以此類推
                const flippedQueue = nextQueue.map(step => {
                    if (step.type === 'damage' || step.type === 'heal') {
                        return { ...step, target: step.target === 'player' ? 'enemy' : 'player' };
                    }
                    return step;
                });

                // 將副作用移出 Reducer 執行的安全方式 (使用 setTimeout 令其在下一幀執行)
                const connRef = connInstance.current;
                setTimeout(() => {
                    try {
                        connRef.send({ type: 'RESULT', data: { stepQueue: flippedQueue } });
                    } catch (e) { console.error("PVP Result Send Error:", e); }
                }, 0);
            }

            return finalBattleState;
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
        const myId = getMonsterId();

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
        const myId = getMonsterId();
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
            // --- 根據進化階段 (evolutionStage) 調整機率準則 ---
            if (evolutionStage === 1) {
                // Stage 1 (幼年期)：不遇訓練師，50% 野怪 / 50% 探索
                if (r < 0.50) {
                    bStateToTrigger = generateBattleState('wild', myId);
                } else {
                    handleAdvGather(tempLog, myId);
                }
            } else {
                // Stage 2+ (成長期之後)：大幅增加戰鬥頻率
                // 60% 野怪 / 30% 訓練師 / 10% 探索
                if (r < 0.60) {
                    bStateToTrigger = generateBattleState('wild', myId);
                } else if (r < 0.90) {
                    bStateToTrigger = generateBattleState('trainer', myId);
                } else {
                    handleAdvGather(tempLog, myId);
                }
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
        } else if (battleState.mode === 'trainer' || battleState.mode === 'pvp') {
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
                    return { ...prev, phase: nextPhase, activeMsg: "", turn: prev.turn + 1, flashTarget: null };

                }
            });
        }, delay);

        return () => clearTimeout(timer);
    }, [battleState.active, battleState.phase, battleState.stepQueue.length, evolutionStage]);


    const resolveBattleWin = (finalGain, enemy) => {
        const myId = getMonsterId();
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
            logs.push({ promptCapture: { id: enemy.id, name: enemy.name } });
        }

        logs.push({ msg: "🚩 冒險已結束，按 [B] 返回", hpRatio: 1 });

        if (battleState.mode === 'pvp') {
            setAdvStats(prev => ({
                ...prev,
                basePower: prev.basePower + 10
            }));

            if (connInstance.current) {
                try { connInstance.current.close(); } catch (e) { }
                connInstance.current = null;
            }
            pvpRemoteMoveRef.current = null;
            setPendingPlayerMove(null);

            setIsPvpMode(false);
            setMatchStatus('idle');
            setBattleState(prev => ({ ...prev, active: false }));
            updateDialogue("對戰勝利！獲得 10 點戰力！");
            if (user) updatePvpStats(true); // 更新排行榜
            logEvent("在一場精彩的連線對決中獲得了勝利，戰力 +10。");
            playBloop('success');
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
        if (battleState.mode === 'pvp') {
            setAdvStats(prev => ({
                ...prev,
                basePower: prev.basePower + 5
            }));

            if (connInstance.current) {
                try { connInstance.current.close(); } catch (e) { }
                connInstance.current = null;
            }
            pvpRemoteMoveRef.current = null;
            setPendingPlayerMove(null);

            setIsPvpMode(false);
            setMatchStatus('idle');
            setBattleState(prev => ({ ...prev, active: false }));
            updateDialogue("對戰結束，獲得 5 點戰力！");
            if (user) updatePvpStats(false); // 更新排行榜 (敗場)
            logEvent("在一場連線對決中落敗，獲得了 5 點戰力的鼓勵。");
            playBloop('fail');
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
        if (isCloudLoading) return; // 雲端同步中禁止操作
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
        if (battleState.active && (battleState.mode === 'trainer' || battleState.mode === 'pvp')) {
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
        if (isCloudLoading) return; // 雲端同步中禁止操作
        const currentSkillIdx = clickIdx !== null ? clickIdx : skillSelectIdx;

        if (alertMsg) {
            setAlertMsg("");
            playBloop('pop');
            return;
        }
        if (battleState.active && (battleState.mode === 'pvp' || battleState.mode === 'trainer')) {
            if (battleState.phase === 'player_action') {
                const currentIdx = battleState.menuIdx || 0;
                const move = battleState.player?.moves?.[currentIdx];
                if (move) {
                    executeBattleTurn('attack', move);
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
        if (isConfirmingReplace) {
            if (currentSkillIdx === 0) { // YES (學習)
                handleLearnSkill(pendingSkillLearn.skill.id, tempReplaceIdx);
                setIsConfirmingReplace(false);
                setTempReplaceIdx(-1);
            } else { // NO (不學習)
                setIsConfirmingReplace(false);
                setSkillSelectIdx(0);
            }
            return;
        }
        if (pendingSkillLearn && !isAdvMode && !isPvpMode && !battleState.active) {
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
        if (isConfirmingFarewell) {
            confirmFarewellAction();
            return;
        }
        if (isDead) {
            if (!isGenerating) handleRestart();
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

        if (activeIndex === -1) {
            setVel(v => ({ x: v.x, y: -4.0 }));
            updateDialogue("抓到你了！");
            logEvent("玩家進行了主動摸摸。");
            return;
        }
        executeAction(menuItems[activeIndex].id);
    };

    const handleC = () => {
        if (isLeaderboardOpen) {
            setIsLeaderboardOpen(false);
            playBloop('pop');
            return;
        }
        if (isCloudLoading) return; // 雲端同步中禁止操作
        if (alertMsg) {
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
        if (battleState.active && (battleState.mode === 'trainer' || battleState.mode === 'pvp') && battleState.phase === 'player_action') {
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
            case 'feed':
                if (hunger >= 100) {
                    updateDialogue("我吃不下了...");
                    break;
                }
                setHunger(h => Math.min(100, h + 30));
                setFeedCount(f => f + 1);
                setTodayFeedCount(f => f + 1);
                recordGameAction(); // 紀錄餵食
                setVel(v => ({ x: v.x, y: -5.0 }));
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
                setVel(v => ({ x: v.x, y: -4.0 }));
                updateDialogue("好開心！");
                logEvent("親密互動。");
                break;
            case 'status':
                setIsStatusUIOpen(true);
                updateDialogue("查看狀態中...", true);
                break;
            case 'train':
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
                setPos({ x: 128, y: 190 });
                setVel({ x: 0, y: 0 });
                logEvent("開始特訓。");
                setActiveIndex(-1);
                break;
            case 'connect':
                cleanupPvp();
                setIsPvpMode(true);
                recordGameAction(); // 進入連線大廳預扣一動作
                syncMatchStatus('idle');
                updateDialogue("宇宙連線大廳", true);
                logEvent(`進入連線大廳`);
                break;
            case 'info':
                setIsInventoryOpen(true);
                setSelectedItemIdx(0);
                updateDialogue("查看背包中...", true);
                break;
            case 'adventure':
                startAdventure();
                break;
            default:
                updateDialogue("開發中");
        }
    };

    useEffect(() => {
        if (isBooting || isDead || isEvolving || miniGame || isRunaway) return;

        const checkEvolutionInterval = setInterval(() => {
            const elapsed = Date.now() - lastEvolutionTime;

            // 判斷是否壽終（無法再進化）
            // 野外怪獸 (方案 C)：若在對照表中已無下一階，則視為最終型態，進入壽命倒數
            const isFinalWild = evolutionBranch.startsWith('WILD_') && !WILD_EVOLUTION_MAP[evolutionBranch.slice(5)];

            if (evolutionStage >= 4 || isFinalWild || (evolutionStage === 3 && ['P1', 'P2', 'G1', 'G2', 'C', 'F_FAIL1', 'P1_SPECIAL', 'F_NINETALES_SOUL'].includes(evolutionBranch))) {
                const lifespan = FINAL_LIFETIME;
                if (elapsed >= lifespan) {
                    clearInterval(checkEvolutionInterval);
                    // D線抽籤：20% 機率靈魂重生
                    const dRoll = Math.random();
                    const dLine = dRoll < 0.20 ? (Math.random() < 0.5 ? 'G1' : 'G2') : null;
                    setDeathBranch(dLine);
                    setIsGenerating(true);
                    setIsDead(true);
                    setVel({ x: 0, y: -0.1 });
                    setTimeout(() => {
                        let words = dLine
                            ? "靈魂不滅...我還會回來的..."
                            : (evolutionStage >= 5 ? "我的靈魂永遠與你同在，搭檔。" : "謝謝你陪我走到最後一刻...");
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

            const currentThresh = EVOLUTION_TIME[evolutionStage];
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
                        if (stats.lockedAffinity === 'fire') {
                            const fOpts = [];
                            if (m >= 50 && h >= 50) fOpts.push({ branch: 'F_VULPIX_SOUL', count: 3 });
                            fOpts.push({ branch: 'F_SOUL', count: 1 });
                            fOpts.sort((a, b) => b.count - a.count);
                            soulNext = fOpts[0].branch;
                        }
                        if (stats.lockedAffinity === 'water') {
                            const wOpts = [];
                            if (m >= 50 && h >= 50 && sWins >= 8) wOpts.push({ branch: 'W_DRATINI_SOUL', count: 4 });
                            wOpts.push({ branch: 'W_SQUIRTLE_SOUL', count: 1 });
                            wOpts.sort((a, b) => b.count - a.count);
                            soulNext = wOpts[0].branch;
                        }
                        if (stats.lockedAffinity === 'grass') {
                            const grOpts = [];
                            if (m >= 50 && h >= 50) grOpts.push({ branch: 'GR_ODDISH_SOUL', count: 3 });
                            grOpts.push({ branch: 'GR_SOUL', count: 1 });
                            grOpts.sort((a, b) => b.count - a.count);
                            soulNext = grOpts[0].branch;
                        }
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
                } else if (soulNext || evolutionBranch.endsWith('_SOUL')) {
                    // 靈魂進化線最高優先
                    if (soulNext) {
                        nextBranch = soulNext;
                    } else if (evolutionBranch.startsWith('B_') && evolutionBranch.endsWith('_SOUL')) {
                        // 蟲系獨立進化判斷 (B_SOUL, B_M_SOUL, 等)
                        if (evolutionStage === 2) {
                            if (m > 50) nextBranch = 'B_M_SOUL';
                            else if (h > 50) nextBranch = 'B_H_SOUL';
                            else nextBranch = 'B_E_SOUL';
                        } else if (evolutionStage === 3) {
                            if (m > 50) nextBranch = 'B_M2_SOUL';
                            else if (h > 50) nextBranch = 'B_H2_SOUL';
                            else nextBranch = 'B_E2_SOUL';
                        } else {
                            nextBranch = evolutionBranch;
                        }
                    } else if (evolutionBranch.startsWith('W_') && evolutionBranch.endsWith('_SOUL')) {
                        // 水系獨立進化判斷 (傑尼龜線與迷你龍線不互通)
                        const topTag = Object.entries(stats.soulTagCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];
                        if (evolutionStage === 2) {
                            // 傑尼龜線
                            if (['W_SQUIRTLE_SOUL', 'W_SOUL'].includes(evolutionBranch)) {
                                nextBranch = 'W_WARTORTLE_SOUL'; // 無條件進化
                            }
                            // 迷你龍線
                            else if (evolutionBranch === 'W_DRATINI_SOUL') {
                                const wOpts = [];
                                if (m >= 50 && h >= 50 && sWins >= 30) wOpts.push({ branch: 'W_DRAGONAIR_SOUL', count: 4 });
                                if (['rational', 'gentle'].includes(topTag)) wOpts.push({ branch: 'W_HORSEA_SOUL', count: 2 });
                                wOpts.push({ branch: 'W_MAGIKARP_SOUL', count: 1 });
                                wOpts.sort((a, b) => b.count - a.count);
                                nextBranch = wOpts[0].branch;
                            }
                            else { nextBranch = evolutionBranch; }
                        } else if (evolutionStage === 3) {
                            // 卡咪龜 → 水箭龜
                            if (['W_WARTORTLE_SOUL', 'W_SOUL'].includes(evolutionBranch)) {
                                nextBranch = 'W_BLASTOISE_SOUL'; // 無條件進化
                            }
                            // 哈克龍 → 快龍
                            else if (evolutionBranch === 'W_DRAGONAIR_SOUL') {
                                nextBranch = 'W_DRAGONITE_SOUL'; // 無條件進化
                            }
                            // 鲤魚王 → 暴鲤龍
                            else if (evolutionBranch === 'W_MAGIKARP_SOUL') {
                                nextBranch = 'W_GYARADOS_SOUL'; // 無條件進化
                            }
                            // 墨海馬 → 拉普拉斯 / 海刺龍
                            else if (evolutionBranch === 'W_HORSEA_SOUL') {
                                const wOpts = [];
                                if (m >= 50 && ['rational', 'gentle'].includes(topTag))
                                    wOpts.push({ branch: 'W_LAPRAS_SOUL', count: 3 });
                                wOpts.push({ branch: 'W_SEADRA_SOUL', count: 1 });
                                wOpts.sort((a, b) => b.count - a.count);
                                nextBranch = wOpts[0].branch;
                            }
                            else { nextBranch = evolutionBranch; }
                        } else {
                            nextBranch = evolutionBranch;
                        }
                    } else if (evolutionBranch.startsWith('F_') && evolutionBranch.endsWith('_SOUL')) {
                        // ★ 火系獨立進化判斷 (小火龍線與六尾線不互通)
                        const topTag = Object.entries(stats.soulTagCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];
                        if (evolutionStage === 2) {
                            // 小火龍線
                            if (evolutionBranch === 'F_SOUL') {
                                const fOpts = [];
                                if (m >= 80) fOpts.push({ branch: 'F_CHARMELEON_SOUL', count: 2 });
                                fOpts.push({ branch: 'F_CUBONE_SOUL', count: 1 });
                                fOpts.sort((a, b) => b.count - a.count);
                                nextBranch = fOpts[0].branch;
                            }
                            // 六尾線
                            else if (evolutionBranch === 'F_VULPIX_SOUL') {
                                const fOpts = [];
                                if (m >= 50 && h >= 50 && ['passionate', 'stubborn'].includes(topTag))
                                    fOpts.push({ branch: 'F_GROWLITHE_SOUL', count: 3 });
                                if (['rational', 'nonsense'].includes(topTag))
                                    fOpts.push({ branch: 'F_PONYTA_SOUL', count: 2 });
                                fOpts.push({ branch: 'F_NINETALES_SOUL', count: 1 });
                                fOpts.sort((a, b) => b.count - a.count);
                                nextBranch = fOpts[0].branch;
                            }
                            else { nextBranch = evolutionBranch; }
                        } else if (evolutionStage === 3) {
                            // 火恐龍 / 卡拉卡拉線
                            if (['F_CHARMELEON_SOUL', 'F_CUBONE_SOUL'].includes(evolutionBranch)) {
                                const fOpts = [];
                                if (m >= 50 && h >= 50 && ['passionate', 'stubborn'].includes(topTag))
                                    fOpts.push({ branch: 'F_CHARIZARD_SOUL', count: 3 });
                                if (m < 50 && topTag === 'stubborn')
                                    fOpts.push({ branch: 'F_MAGMAR_SOUL', count: 3 });
                                fOpts.push({ branch: 'F_MAROWAK_SOUL', count: 1 });
                                fOpts.sort((a, b) => b.count - a.count);
                                nextBranch = fOpts[0].branch;
                            }
                            // 卡蒂狗 → 風速狗（無條件）
                            else if (evolutionBranch === 'F_GROWLITHE_SOUL') {
                                nextBranch = 'F_ARCANINE_SOUL';
                            }
                            // 小火馬 → 烈焰馬（無條件）
                            else if (evolutionBranch === 'F_PONYTA_SOUL') {
                                nextBranch = 'F_RAPIDASH_SOUL';
                            }
                            else { nextBranch = evolutionBranch; }
                        } else {
                            nextBranch = evolutionBranch;
                        }
                    } else if (evolutionBranch.startsWith('GR_') && evolutionBranch.endsWith('_SOUL')) {
                        // ★ 草系獨立進化判斷 (妙蛙種子線與走路草線不互通)
                        const topTag = Object.entries(stats.soulTagCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];
                        if (evolutionStage === 2) {
                            // 妙蛙種子線
                            if (evolutionBranch === 'GR_SOUL') {
                                const grOpts = [];
                                if (m >= 80) grOpts.push({ branch: 'GR_IVYSAUR_SOUL', count: 2 });
                                grOpts.push({ branch: 'GR_PARAS_SOUL', count: 1 });
                                grOpts.sort((a, b) => b.count - a.count);
                                nextBranch = grOpts[0].branch;
                            }
                            // 走路草線
                            else if (evolutionBranch === 'GR_ODDISH_SOUL') {
                                const grOpts = [];
                                if (m >= 50 && h >= 50 && ['gentle', 'rational'].includes(topTag))
                                    grOpts.push({ branch: 'GR_BELLSPROUT_SOUL', count: 3 });
                                if (['passionate', 'nonsense'].includes(topTag))
                                    grOpts.push({ branch: 'GR_EXEGGCUTE_SOUL', count: 2 });
                                grOpts.push({ branch: 'GR_GLOOM_SOUL', count: 1 });
                                grOpts.sort((a, b) => b.count - a.count);
                                nextBranch = grOpts[0].branch;
                            }
                            else { nextBranch = evolutionBranch; }
                        } else if (evolutionStage === 3) {
                            // 妙蛙草 / 派拉斯線
                            if (['GR_IVYSAUR_SOUL', 'GR_PARAS_SOUL'].includes(evolutionBranch)) {
                                const grOpts = [];
                                if (m >= 50 && h >= 50 && ['gentle', 'rational'].includes(topTag))
                                    grOpts.push({ branch: 'GR_VENUSAUR_SOUL', count: 3 });
                                grOpts.push({ branch: 'GR_PARASECT_SOUL', count: 1 });
                                grOpts.sort((a, b) => b.count - a.count);
                                nextBranch = grOpts[0].branch;
                            }
                            // 臭臭花 → 霸王花（無條件）
                            else if (evolutionBranch === 'GR_GLOOM_SOUL') {
                                nextBranch = 'GR_VILEPLUME_SOUL';
                            }
                            // 喇叭芽 → 大食花（無條件）
                            else if (evolutionBranch === 'GR_BELLSPROUT_SOUL') {
                                nextBranch = 'GR_VICTREEBEL_SOUL';
                            }
                            // 蛋蛋 → 椰蛋樹（無條件）
                            else if (evolutionBranch === 'GR_EXEGGCUTE_SOUL') {
                                nextBranch = 'GR_EXEGGUTOR_SOUL';
                            }
                            else { nextBranch = evolutionBranch; }
                        } else {
                            nextBranch = evolutionBranch;
                        }
                    } else {
                        nextBranch = evolutionBranch; // Stage >= 2 後延續自己的靈魂線
                    }
                } else if (['G1', 'G2'].includes(evolutionBranch)) {
                    // D 線完全封閉，沿原線繼續
                    nextBranch = evolutionBranch;

                } else if (evolutionBranch === 'F' || evolutionBranch === 'F_FAIL1' || evolutionBranch === 'F_FAIL2') {
                    // ★ 已在 F 線：鎖定在 F 線內，不可換線
                    if (evolutionBranch === 'F') {
                        if (sWins >= requiredWins) {
                            nextBranch = 'F'; // 達標，繼續正規 F
                        } else if (evolutionStage === 2) {
                            nextBranch = 'F_FAIL1'; // Stage2 訓練不足 → 飛腿郎
                        } else if (evolutionStage === 3) {
                            nextBranch = 'F_FAIL2'; // Stage3 訓練不足 → 快拳郎
                        } else {
                            nextBranch = 'F';
                        }
                    } else {
                        nextBranch = evolutionBranch; // F_FAIL1/F_FAIL2 維持
                    }

                } else if (evolutionBranch === 'P1' || evolutionBranch === 'P1_SPECIAL') {
                    // ★ 已在 P1 線：鎖定在 P1 線內
                    if (evolutionBranch === 'P1' && evolutionStage === 2 && m > 80) {
                        nextBranch = 'P1_SPECIAL'; // 毒瓦斯 → 三合一磁怪（特殊）
                    } else {
                        nextBranch = evolutionBranch; // 其餘維持原線
                    }

                } else if (evolutionBranch === 'P2' || evolutionBranch === 'P2_SPECIAL') {
                    // ★ 已在 P2 線：鎖定在 P2 線內
                    if (evolutionBranch === 'P2' && evolutionStage === 2 && m > 80) {
                        nextBranch = 'P2_SPECIAL'; // 臭泥 → 可達鴨（特殊）
                    } else {
                        nextBranch = evolutionBranch; // P2_SPECIAL 維持原線 → Stage 4 哥達鴨
                    }

                } else if (evolutionStage === 1) {
                    // ★ Stage 0→1（百變怪 Stage）：所有線可互通，依條件首次分支
                    if (sWins >= requiredWins) {
                        // F 線優先（訓練達標）
                        nextBranch = 'F';
                    } else if (m <= 0 && h <= 0) {
                        // P 線：心情飢餓同時歸零
                        nextBranch = Math.random() < 0.5 ? 'P1' : 'P2';
                    } else if (m >= 50 && h >= 50) {
                        nextBranch = Math.random() < 0.5 ? 'A' : 'B';
                    } else if (m >= 50) {
                        nextBranch = 'A';
                    } else if (h >= 50) {
                        nextBranch = 'B';
                    } else {
                        nextBranch = 'C';
                    }

                } else if (['A', 'B', 'C'].includes(evolutionBranch)) {
                    // ★ 已在 A/B/C 一般線（Stage>=2）：三線互通
                    if (evolutionStage === 3 && h < 50 && m < 50) {
                        nextBranch = 'FAIL_ABC'; // Stage 3→4 一般線失敗進化 (3D獸)
                    } else if (m >= 50 && h >= 50) {
                        nextBranch = Math.random() < 0.5 ? 'A' : 'B';
                    } else if (m >= 50) {
                        nextBranch = 'A';
                    } else if (h >= 50) {
                        nextBranch = 'B';
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
                    const evolvedId = getMonsterId(nextBranch, evolutionStage + 1);
                    const evolvedName = MONSTER_NAMES[evolvedId] || nextBranch;
                    updateDiaryEvent(`${timeStr} 分進化成了：${evolvedName}`, 3);
                    setTodayHasEvolved(true);

                    setEvolutionStage(evolutionStage + 1);
                    setEvolutionBranch(nextBranch);
                    setLastEvolutionTime(Date.now());
                    setStageTrainWins(0);
                    setIsEvolving(false);
                    updateDialogue("進化成功！");
                }, 2500);
            }
        }, 500);

        return () => clearInterval(checkEvolutionInterval);
    }, [isBooting, evolutionStage, isDead, isEvolving, lastEvolutionTime, miniGame, isRunaway]);

    useEffect(() => {
        if (!miniGame || miniGame.status === 'result') return;

        const interval = setInterval(() => {
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
                    setPos({ x: 128 + (Math.random() - 0.5) * 4, y: 190 + (Math.random() - 0.5) * 4 });
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
        const stageMap = {
            1: [{ id: 132, name: '百變怪', type: 'normal' }, { id: 92, name: '鬼斯', type: 'poison' }, { id: 63, name: '凱西', type: 'psychic' }],
            2: [{ id: 4, name: '小火龍', type: 'fire' }, { id: 7, name: '傑尼龜', type: 'water' }, { id: 1, name: '妙蛙種子', type: 'grass' }, { id: 10, name: '綠毛蟲', type: 'bug' }, { id: 19, name: '小拉達', type: 'normal' }],
            3: [{ id: 5, name: '火恐龍', type: 'fire' }, { id: 8, name: '卡咪龜', type: 'water' }, { id: 2, name: '妙蛙草', type: 'grass' }, { id: 11, name: '鐵殼蛹', type: 'bug' }, { id: 20, name: '拉達', type: 'normal' }],
            4: [{ id: 6, name: '噴火龍', type: 'fire' }, { id: 9, name: '水箭龜', type: 'water' }, { id: 3, name: '妙蛙花', type: 'grass' }, { id: 12, name: '巴大蝶', type: 'bug' }, { id: 149, name: '快龍', type: 'flying' }],
            5: [{ id: 249, name: '洛奇亞', type: 'flying' }, { id: 150, name: '超夢', type: 'psychic' }, { id: 144, name: '急凍鳥', type: 'flying' }],
            6: [{ id: 384, name: '烈空坐', type: 'flying' }, { id: 151, name: '夢幻', type: 'psychic' }, { id: 250, name: '鳳王', type: 'fire' }]
        };
        const pool = stageMap[stage] || stageMap[1];
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
    const generateBattleState = (mode, myId, pvpOpponentData = null) => {
        const level = Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1));
        const speciesId = getMonsterId();

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
                ? ADV_WILD_POOL.filter(m => m.id !== 74)
                : ADV_WILD_POOL;

            const totalWeight = filteredPool.reduce((sum, m) => sum + m.weight, 0);
            let roll = Math.random() * totalWeight;
            enemyData = filteredPool[0];
            for (const m of filteredPool) { if (roll < m.weight) { enemyData = m; break; } roll -= m.weight; }
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
            const eMoves = generateMoves(Math.max(1, Math.floor(evolutionStage * 0.8)), eType).map(id => SKILL_DATABASE[id]).filter(Boolean);
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
            const eMoves = (enemyData?.moves || generateMoves(1, eType)).map(id => SKILL_DATABASE[id]).filter(Boolean);

            const initMsg = `連線成功！${enemyData?.name || '神祕對手'} (Lv.${eLevel}) 降臨！`;
            return {
                active: true, mode: 'pvp', phase: 'intro', turn: 1,
                player: {
                    hp: pMaxHP, maxHp: pMaxHP, atk: pATK, def: pDEF, spd: pSPD, id: myId, type: pType, moves: pMoves, level: level,
                    statStages: { atk: 0, def: 0, spd: 0 }, status: null, statusTurns: 0
                },
                enemy: {
                    id: enemyData?.id || 132, name: (enemyData?.name || '神祕對手'), hp: eMaxHP, maxHp: eMaxHP, atk: eATK, def: eDEF, spd: eSPD, level: eLevel, isPvp: true, type: eType, moves: eMoves,
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
            const eMoves = generateMoves(evolutionStage, eType).map(id => SKILL_DATABASE[id]).filter(Boolean);

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
        if (isPvpMode || isAdvMode || battleState.active || miniGame || isInventoryOpen || isStatusUIOpen || isEvolving || isBooting || isDiaryOpen || pendingSkillLearn) {
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
        const dLine = dRoll < 0.20 ? (Math.random() < 0.5 ? 'G1' : 'G2') : null;
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
        setBootMonsterId(Math.floor(Math.random() * 151) + 1); // 隨機一隻開場怪獸

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
        setPos({ x: 128, y: 128 });
        setVel({ x: 0.6, y: 0.4 });
        setSteps(0);
        setLastEvolutionTime(Date.now());
        setStageTrainWins(0);
        setMiniGame(null);
        setActiveIndex(-1);
        setFeedCount(0);
        setDeathBranch(null); // 重置 D線籤

        // --- 修正戰力繼承邏輯 ---
        // 取得死前戰力的 10% 漲幅作為遺產，加上基礎 100 戰力
        const prevBasePower = latestStats.current.advStats?.basePower || 100;
        const inheritedPower = Math.floor((prevBasePower - 100) * 0.1); // 繼承 10% 的努力成果，而非總戰力
        // 判斷下一代初始招式
        const nextId = savedDeathBranch === 'G1' ? "92" : (savedDeathBranch === 'G2' ? "63" : "132");
        const nextStarterMove = nextId === "92" ? 'lick' : (nextId === "63" ? 'confusion' : 'tackle');
        const nextBonusId = ['ember', 'water_gun', 'vine_whip', 'quick_attack'][Math.floor(Math.random() * 4)];

        setAdvStats({
            basePower: 100 + inheritedPower,
            ivs: {
                hp: Math.floor(Math.random() * 32),
                atk: Math.floor(Math.random() * 32),
                def: Math.floor(Math.random() * 32),
                spd: Math.floor(Math.random() * 32)
            },
            evs: { hp: 0, atk: 0, def: 0, spd: 0 },
            bonusMoveId: nextBonusId,
            moves: [nextStarterMove, nextBonusId].filter(Boolean)
        });

        // 給予玩家反饋提示
        if (inheritedPower > 0) {
            updateDialogue(`獲得了 ${inheritedPower} 點前代戰力遺產！`, true);
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
            // D線觸發：靈魂重生為鬼斯/凱西線
            setEvolutionStage(1);
            setEvolutionBranch(savedDeathBranch);
            setDialogue(savedDeathBranch === 'G1' ? "鬼魂附身！" : "神秘力量覺醒！");
        } else {
            // 正常重啟：回到百變怪
            setEvolutionStage(1);
            setEvolutionBranch('A');
            setDialogue("吼吼吼～");
        }

        // 🔥 VERY IMPORTANT: Remove localStorage data immediately!
        try { localStorage.removeItem('pixel_monster_save'); } catch (e) { }
        try { sessionStorage.removeItem('pixel_monster_save'); } catch (e) { }
        
        recordGameAction(); // 紀錄重啟行為
    };



    const getMonsterId = (branch = evolutionBranch, stage = evolutionStage) => {
        if (branch.startsWith('WILD_')) {
            return parseInt(branch.split('_')[1]);
        }
        if (isDead) return 92; // Gastly

        if (stage === 1) {
            if (branch === 'G1') return 92; // Gastly
            if (branch === 'G2') return 63; // Abra
            return 132; // Ditto
        }

        if (stage === 2) {
            if (branch.startsWith('B_') && branch.endsWith('_SOUL')) return 10; // Caterpie
            if (branch === 'F_SOUL') return 4;  // Charmander
            if (branch === 'F_VULPIX_SOUL') return 37; // Vulpix
            if (branch === 'W_SQUIRTLE_SOUL' || branch === 'W_SOUL') return 7;  // Squirtle
            if (branch === 'W_DRATINI_SOUL') return 147; // Dratini
            if (branch === 'GR_SOUL') return 1; // Bulbasaur
            if (branch === 'GR_ODDISH_SOUL') return 43; // Oddish
            if (branch === 'G1') return 93;  // 鬼斯通
            if (branch === 'G2') return 64;  // 勇吉拉
            if (branch === 'P1') return 109; // 瓦斯彈
            if (branch === 'P2') return 88;  // 臭泥
            if (branch === 'F') return 66;  // 腕力
            if (branch === 'A') return 32;  // 尼多朗
            if (branch === 'B') return 29;  // 尼多蘭
            return 19; // Rattata (C 線)
        }
        if (stage === 3) {
            if (branch === 'B_M_SOUL' || branch === 'B_SOUL') return 11; // Metapod
            if (branch === 'B_H_SOUL') return 14; // Kakuna
            if (branch === 'B_E_SOUL') return 48; // Venonat
            if (branch === 'F_CHARMELEON_SOUL') return 5;  // Charmeleon
            if (branch === 'F_CUBONE_SOUL') return 104;    // Cubone
            if (branch === 'F_GROWLITHE_SOUL') return 58;  // Growlithe
            if (branch === 'F_PONYTA_SOUL') return 77;     // Ponyta
            if (branch === 'F_NINETALES_SOUL') return 38;  // Ninetales
            if (branch === 'W_WARTORTLE_SOUL' || branch === 'W_SOUL') return 8;  // Wartortle
            if (branch === 'W_DRAGONAIR_SOUL') return 148; // Dragonair
            if (branch === 'W_HORSEA_SOUL') return 116; // Horsea
            if (branch === 'W_MAGIKARP_SOUL') return 129; // Magikarp
            if (branch === 'GR_IVYSAUR_SOUL' || branch === 'GR_SOUL') return 2; // Ivysaur
            if (branch === 'GR_PARAS_SOUL') return 46;     // Paras
            if (branch === 'GR_BELLSPROUT_SOUL') return 69; // Bellsprout
            if (branch === 'GR_EXEGGCUTE_SOUL') return 102; // Exeggcute
            if (branch === 'GR_GLOOM_SOUL') return 44;     // Gloom
            if (branch === 'G1') return 94;  // 耿鬼
            if (branch === 'G2') return 65;  // 胡地
            if (branch === 'P1_SPECIAL') return 82; // Magneton
            if (branch === 'P1') return 110; // 雙彈瓦斯
            if (branch === 'P2_SPECIAL') return 54; // Psyduck
            if (branch === 'P2') return 89;  // 臭臭泥
            if (branch === 'F_FAIL1') return 106; // 飛腿郎
            if (branch === 'F') return 67;  // 豪力
            if (branch === 'A') return 33;  // 尼多利諾
            if (branch === 'B') return 30;  // 尼多娜
            return 20; // Raticate (C 線，Stage 3 壽終)
        }
        if (stage === 4) {
            if (branch === 'B_M2_SOUL' || branch === 'B_M_SOUL' || branch === 'B_SOUL') return 12; // Butterfree
            if (branch === 'B_H2_SOUL') return 15; // Beedrill
            if (branch === 'B_E2_SOUL') return 49; // Venomoth
            if (branch === 'F_CHARIZARD_SOUL') return 6;   // Charizard
            if (branch === 'F_MAGMAR_SOUL') return 126;    // Magmar
            if (branch === 'F_MAROWAK_SOUL') return 105;   // Marowak
            if (branch === 'F_ARCANINE_SOUL') return 59;   // Arcanine
            if (branch === 'F_RAPIDASH_SOUL') return 78;   // Rapidash
            if (branch === 'W_BLASTOISE_SOUL' || branch === 'W_SOUL') return 9;  // Blastoise
            if (branch === 'W_DRAGONITE_SOUL') return 149; // Dragonite
            if (branch === 'W_GYARADOS_SOUL') return 130;  // Gyarados
            if (branch === 'W_LAPRAS_SOUL') return 131;    // Lapras
            if (branch === 'W_SEADRA_SOUL') return 117;    // Seadra
            if (branch === 'GR_VENUSAUR_SOUL' || branch === 'GR_SOUL') return 3; // Venusaur
            if (branch === 'GR_PARASECT_SOUL') return 47;     // Parasect
            if (branch === 'GR_VILEPLUME_SOUL') return 45;    // Vileplume
            if (branch === 'GR_VICTREEBEL_SOUL') return 71;   // Victreebel
            if (branch === 'GR_EXEGGUTOR_SOUL') return 103;   // Exeggutor
            if (branch === 'FAIL_ABC') return 137; // 3D獸 (一般線失敗分支)
            if (branch === 'DRAGON') return 147; // 迷你龍 (靈魂龍進化)
            if (branch === 'G1') return 94;  // 耿鬼（G 線最終）
            if (branch === 'G2') return 65;  // 胡地（G 線最終）
            if (branch === 'P1_SPECIAL') return 82; // Magneton
            if (branch === 'P1') return 110; // 雙彈瓦斯（P 線最終）
            if (branch === 'P2_SPECIAL') return 55; // Golduck
            if (branch === 'P2') return 89;  // 臭臭泥（P 線最終）
            if (branch === 'F_FAIL2') return 107; // 快拳郎
            if (branch === 'F') return 68;  // 怪力
            if (branch === 'A') return 34;  // 尼多王
            if (branch === 'B') return 31;  // 尼多后
            return 20; // Raticate（C 線已在 Stage 3 壽終）
        }

        if (stage === 4) {
            // Check for special Mew condition: Bond >= 80 and high gentle tag (from soul_evolution_chains.txt)
            const topTag = Object.entries(soulTagCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];
            if (bondValue >= 80 && topTag === 'gentle') return 151; // Mew
        }
        if (stage === 5) return 249; // Lugia
        if (stage === 6) return 384; // Rayquaza

        return 132;
    };

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

            <div className="relative w-80 h-[620px] bg-gradient-to-br from-[#c8c8c8] to-[#6d6d6d] rounded-t-[50px] rounded-b-[70px] border-b-[16px] border-r-[12px] border-[#5a5a5a] shadow-[15px_15px_50px_rgba(0,0,0,0.8)] pt-20 pb-10 px-6 flex flex-col items-center">



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
                            color: 'white', textAlign: 'center', padding: '20px', fontSize: '11px', lineHeight: '1.6'
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
                    <div className="lcd-grid-overlay"></div>

                    {/* --- 👑 整合式行動排行榜 (LCD Integrated) --- */}
                    {isLeaderboardOpen && (
                        <div className="absolute inset-0 bg-[#9dae8a] z-[500] flex flex-col items-center p-2 font-bold select-none animate-fade-in text-[#1a1a1a]">
                            {/* 標題欄 */}
                            <div className="w-full bg-[#383a37] text-[#9dae8a] px-2 py-1 flex justify-between items-center mb-1 shadow-sm">
                                <span className="text-[10px] tracking-tighter font-black flex items-center gap-1">
                                    🏆 全球英雄榜 [P{leaderboardPage + 1}/10]
                                </span>
                            </div>

                            {/* 排行列表 (每頁 5 筆) */}
                            <div className="flex-1 w-full space-y-1 mt-1">
                                {isLeaderboardLoading ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-2 opacity-60">
                                        <div className="animate-spin text-xl">⏳</div>
                                        <div className="text-[10px]">資料同步中...</div>
                                    </div>
                                ) : (
                                    leaderboard.slice(leaderboardPage * 5, (leaderboardPage * 5) + 5).map((item, idx) => (
                                        <div key={item.id} className="bg-[#8fa07e]/30 border-2 border-[#1a1a1a]/20 p-1 flex items-center gap-2 h-[42px] relative overflow-hidden">
                                            <div className="w-6 text-[12px] font-black italic opacity-40">
                                                #{ (leaderboardPage * 5) + idx + 1 }
                                            </div>
                                            <div className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a]/5 border border-[#1a1a1a]/20 shrink-0">
                                                <DitheredSprite id={item.monsterId || 132} scale={0.5} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] truncate leading-none mb-0.5">{item.displayName}</div>
                                                <div className="flex gap-2 text-[8px] opacity-70">
                                                    <span>W:{item.wins}</span>
                                                    <span>L:{item.losses}</span>
                                                    <span>{((item.winRate || 0) * 100).toFixed(0)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                                {!isLeaderboardLoading && leaderboard.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-full text-[10px] opacity-40">
                                        尚無紀錄...
                                    </div>
                                )}
                            </div>

                            {/* 底部按鍵提示 */}
                            <div className="w-full border-t border-[#1a1a1a]/20 pt-1 mt-1 flex justify-between items-center text-[8px] font-black opacity-80">
                                <span className="animate-pulse">▶ A: 下一頁</span>
                                <span>● C: 退出</span>
                            </div>
                        </div>
                    )}

                    {/* 技能學習/替換介面 (Skill Learn UI) */}
                    {pendingSkillLearn && !isAdvMode && !isPvpMode && !battleState.active && (
                        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-center p-2" style={{ backgroundColor: 'rgba(157, 174, 138, 0.99)' }}>
                            {/* 二次確認 Modal (由 B 鍵觸發) */}
                            {isConfirmingReplace && (
                                <div style={{
                                    position: 'absolute', inset: 0, zIndex: 9999,
                                    backgroundColor: 'rgba(157, 174, 138, 0.98)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center',
                                    color: 'white', textAlign: 'center', padding: '15px'
                                }}>
                                    <div style={{
                                        width: '180px', padding: '15px', border: '4px solid #111', backgroundColor: '#8fa07e',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px',
                                        boxShadow: '8px 8px 0 rgba(0,0,0,0.2)'
                                    }}>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#111', lineHeight: '1.4' }}>
                                            確定要忘記<br />
                                            <span style={{ color: '#d32f2f' }}>{SKILL_DATABASE[advStats.moves[tempReplaceIdx]]?.name}</span><br />
                                            並學習新招嗎？
                                        </div>
                                        <div style={{ display: 'flex', gap: '20px' }}>
                                            <div
                                                onClick={() => handleB(0)}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                            >
                                                <div style={{ padding: '4px 12px', border: '2px solid #111', backgroundColor: skillSelectIdx === 0 ? '#ff5252' : '#7a8a6a', color: skillSelectIdx === 0 ? '#fff' : '#444', fontSize: '10px', fontWeight: 'black', boxShadow: skillSelectIdx === 0 ? '0 0 8px #ff5252' : 'none' }}>{skillSelectIdx === 0 ? '▶ ' : ''}是</div>
                                            </div>
                                            <div
                                                onClick={() => handleB(1)}
                                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                            >
                                                <div style={{ padding: '4px 12px', border: '2px solid #111', backgroundColor: skillSelectIdx === 1 ? '#ffca28' : '#7a8a6a', color: skillSelectIdx === 1 ? '#1a1a1a' : '#444', fontSize: '10px', fontWeight: 'black', boxShadow: skillSelectIdx === 1 ? '0 0 8px #ffca28' : 'none' }}>{skillSelectIdx === 1 ? '▶ ' : ''}否</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="w-full bg-[#383a37] text-[#8fa07e] text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black">
                                <span>新的領悟！ (Lv.{pendingSkillLearn.level})</span>
                            </div>

                            <div className="flex-1 w-full flex flex-col items-center justify-center gap-2">
                                <div className="text-[11px] font-bold text-[#1a1a1a] text-center mb-1">
                                    想學會 <span className="underline decoration-2">{pendingSkillLearn.skill.name}</span>
                                </div>
                                <div className="text-[9px] text-[#383a37] mb-2 text-center">
                                    ({pendingSkillLearn.skill.type === 'normal' ? '普' :
                                        pendingSkillLearn.skill.type === 'fire' ? '火' :
                                            pendingSkillLearn.skill.type === 'water' ? '水' :
                                                pendingSkillLearn.skill.type === 'grass' ? '草' :
                                                    pendingSkillLearn.skill.type === 'bug' ? '蟲' :
                                                        pendingSkillLearn.skill.type === 'flying' ? '飛' :
                                                            pendingSkillLearn.skill.type === 'electric' ? '電' :
                                                                pendingSkillLearn.skill.type === 'psychic' ? '超' :
                                                                    pendingSkillLearn.skill.type === 'ghost' ? '鬼' : '屬'} / 威力:{pendingSkillLearn.skill.power})
                                </div>

                                {advStats.moves.length < 4 ? (
                                    <div className="flex flex-col gap-3 items-center">
                                        <div className="text-[9px] text-[#383a37]">目前招式未滿，可直接學習！</div>
                                        <div className="flex flex-col gap-2 w-32">
                                            <div className={`px-4 py-1.5 border-2 border-[#1a1a1a] text-[11px] font-bold text-center transition-all ${skillSelectIdx === 0 ? 'bg-[#ffca28] text-[#1a1a1a] scale-105 shadow-md' : 'bg-[#7a8a6a] text-[#444] opacity-70'}`}>
                                                {skillSelectIdx === 0 ? '▶ ' : ''}學習新招
                                            </div>
                                            <div className={`px-4 py-1.5 border-2 border-[#1a1a1a] text-[11px] font-bold text-center transition-all ${skillSelectIdx === 1 ? 'bg-red-500 text-white scale-105 shadow-md' : 'bg-[#7a8a6a] text-[#444] opacity-70'}`}>
                                                {skillSelectIdx === 1 ? '▶ ' : ''}放棄學習
                                            </div>
                                        </div>
                                        <div className="text-[8px] opacity-60 mt-1">A:切換 B:確認 C:返回</div>
                                    </div>
                                ) : (
                                    <div className="w-full flex flex-col gap-1 px-2">
                                        <div className="text-[9px] font-bold text-[#383a37] mb-1">請選擇要忘記的招式：</div>
                                        {advStats.moves.map((mId, idx) => {
                                            const m = SKILL_DATABASE[mId] || { name: mId, power: 0 };
                                            const isSelected = skillSelectIdx === idx;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`w-full py-1 px-2 border-2 flex justify-between items-center transition-all ${isSelected ? 'bg-[#ffca28] text-[#1a1a1a] border-[#1a1a1a] scale-[1.02]' : 'bg-[#7a8a6a]/50 text-[#444] border-transparent opacity-60'}`}
                                                >
                                                    <span className="text-[10px] font-bold">{isSelected ? '▶ ' : ''}{m.name}</span>
                                                    <span className="text-[9px] opacity-80">威力:{m.power}</span>
                                                </div>
                                            );
                                        })}
                                        <div className={`mt-1 w-full py-1 text-center text-[10px] font-bold border-2 transition-all ${skillSelectIdx === 4 ? 'bg-red-600 text-white border-black scale-[1.02]' : 'bg-[#7a8a6a]/50 text-[#444] border-transparent opacity-60'}`}>
                                            {skillSelectIdx === 4 ? '▶ ' : ''}放棄學習
                                        </div>
                                        <div className="text-[8px] text-center opacity-60 mt-1">A:切換 B:確認 C:返回</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 冒險或連線對戰系統 Overlay */}
                    {(isAdvMode || isPvpMode) && (
                        <div className="absolute inset-0 z-[110] flex flex-col items-center justify-start p-1" style={{ backgroundColor: battleState.active ? '#9dae8a' : 'rgba(157, 174, 138, 0.98)' }}>
                            <div className="w-full bg-[#383a37] text-[#8fa07e] text-[10px] px-2 py-1 flex justify-between items-center mb-1">
                                <span>{isPvpMode ? '宇宙連線對戰' : '冒險模式'} {battleState.active ? (battleState.mode === 'wild' ? '[掃蕩中]' : '[戰鬥中]') : ''}</span>
                                <span>{isPvpMode ? (matchStatus === 'searching' ? '搜尋中...' : '對決中') : (advCD > 0 && !battleState.active ? `冷卻中 ${Math.floor(advCD / 60)}:${(advCD % 60).toString().padStart(2, '0')}` : '準備就緒')}</span>
                            </div>

                            {battleState.active ? (
                                <div className="flex-1 w-full relative pb-1">
                                    {/* Enemy Area */}
                                    <div className="absolute top-2 left-2 flex flex-col items-start min-w-[100px] z-20 bg-[#8fa07e] border-2 border-[#1a1a1a] rounded-md p-1 pl-2 shadow-sm">
                                        <div className="flex items-center gap-1">
                                            <div className="text-[10px] font-bold text-[#1a1a1a] truncate w-[60px] leading-tight">{battleState?.enemy?.name}</div>
                                            {battleState?.enemy?.status && (
                                                <span className={`text-[8px] px-1 rounded-sm border border-black/20 font-black ${battleState.enemy.status === 'burn' ? 'bg-[#ff5252] text-white' :
                                                        battleState.enemy.status === 'paralysis' ? 'bg-[#ffca28] text-black' :
                                                            battleState.enemy.status === 'poison' ? 'bg-[#9c27b0] text-white' :
                                                                battleState.enemy.status === 'sleep' ? 'bg-[#90a4ae] text-white' :
                                                                    battleState.enemy.status === 'freeze' ? 'bg-[#80deea] text-black' : 'bg-gray-400'
                                                    }`}>
                                                    {{ burn: '燒', paralysis: '麻', poison: '毒', sleep: '眠', freeze: '凍', confusion: '混' }[battleState.enemy.status] || '狀'}
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-20 h-2 bg-[#383a37] border border-[#1a1a1a] rounded-sm overflow-hidden mt-1 shadow-inner">
                                            <div className="h-full transition-all duration-300" style={{ width: `${(battleState?.enemy?.hp / battleState?.enemy?.maxHp) * 100}%`, backgroundColor: (battleState?.enemy?.hp / battleState?.enemy?.maxHp) > 0.5 ? '#2ecc71' : (battleState?.enemy?.hp / battleState?.enemy?.maxHp) > 0.25 ? '#f1c40f' : '#e74c3c' }} />
                                        </div>
                                    </div>
                                    <div className={`absolute -top-16 right-0 z-10 transform scale-[1.1] ${battleState.flashTarget === 'enemy' ? 'damage-flash' : ''}`}>
                                        <DitheredSprite id={battleState?.enemy?.id} scale={2} />
                                    </div>

                                    {/* Player Area */}
                                    <div className={`absolute bottom-1 -left-2 z-10 transform scale-[1.4] origin-bottom px-2 ${battleState.flashTarget === 'player' ? 'damage-flash' : ''}`}>
                                        <DitheredBackSprite id={battleState?.player?.id} scale={2} />
                                    </div>
                                    <div className="absolute bottom-16 right-2 flex flex-col items-end min-w-[100px] z-20 bg-[#8fa07e] border-2 border-[#1a1a1a] rounded-md p-1 pr-2 shadow-sm">
                                        <div className="flex items-center gap-1">
                                            {battleState?.player?.status && (
                                                <span className={`text-[8px] px-1 rounded-sm border border-black/20 font-black ${battleState.player.status === 'burn' ? 'bg-[#ff5252] text-white' :
                                                        battleState.player.status === 'paralysis' ? 'bg-[#ffca28] text-black' :
                                                            battleState.player.status === 'poison' ? 'bg-[#9c27b0] text-white' :
                                                                battleState.player.status === 'sleep' ? 'bg-[#90a4ae] text-white' :
                                                                    battleState.player.status === 'freeze' ? 'bg-[#80deea] text-black' : 'bg-gray-400'
                                                    }`}>
                                                    {{ burn: '燒', paralysis: '麻', poison: '毒', sleep: '眠', freeze: '凍', confusion: '混' }[battleState.player.status] || '狀'}
                                                </span>
                                            )}
                                            <div className="text-[10px] font-bold text-[#1a1a1a] text-right truncate">Lv.{Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1))}</div>
                                        </div>
                                        <div className="w-20 h-2 bg-[#383a37] border border-[#1a1a1a] rounded-sm overflow-hidden mt-1 shadow-inner">
                                            <div className="h-full transition-all duration-300" style={{ width: `${((battleState?.player?.hp || 0) / (battleState?.player?.maxHp || 1)) * 100}%`, backgroundColor: ((battleState?.player?.hp || 0) / (battleState?.player?.maxHp || 1)) > 0.5 ? '#2ecc71' : ((battleState?.player?.hp || 0) / (battleState?.player?.maxHp || 1)) > 0.25 ? '#f1c40f' : '#e74c3c' }} />
                                        </div>
                                    </div>

                                    {/* --- 戰鬥播報對話框 (Transient Overlay) --- */}
                                    {(battleState?.phase === 'action_streaming' || battleState?.phase === 'waiting_opponent') && battleState?.activeMsg && (
                                        <div className="absolute w-[68%] left-[16%] top-[40%] bg-white border-[2px] border-black p-1.5 z-[150] shadow-[4px_4px_0_rgba(0,0,0,0.2)]">
                                            <div className="text-[9px] font-black text-black leading-tight break-words text-center">
                                                {battleState?.activeMsg}
                                            </div>
                                        </div>
                                    )}

                                    {/* Dialogue Box & Menu Area */}
                                    <div className="absolute bottom-1 left-1 right-1 h-[55px] bg-[#8fa07e] border-[3px] border-[#383a37] rounded-sm p-1 flex flex-col shadow-inner z-30">
                                        {(battleState.mode === 'trainer' || battleState.mode === 'pvp') && battleState.phase === 'player_action' ? (
                                            <div className="grid grid-cols-2 gap-1 h-full font-bold text-[10px] text-[#1a1a1a]">
                                                {[0, 1, 2, 3].map((idx) => {
                                                    const move = battleState.player?.moves?.[idx];
                                                    const isSelected = (battleState.menuIdx || 0) === idx;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`border-2 flex items-center justify-center transition-all ${isSelected
                                                                    ? 'border-[#1a1a1a] bg-[#1a1a1a] text-[#8fa07e] invert-0'
                                                                    : 'border-[#1a1a1a] bg-white/20'
                                                                } ${!move ? 'opacity-30 border-dashed' : ''}`}
                                                        >
                                                            {move ? move.name : '---'}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="w-full h-full overflow-hidden text-[10px] leading-tight font-bold text-[#1a1a1a] px-1 flex flex-col justify-end">
                                                {(battleState?.logs?.length || 0) > 0 ? (
                                                    <div className="animate-fade-in">{battleState.logs[battleState.logs.length - 1]}</div>
                                                ) : <div>...</div>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {isPvpMode ? (
                                        (matchStatus === 'searching' || matchStatus === 'idle') ? (
                                            <div className="flex-1 flex flex-col items-center justify-start p-2 w-full">
                                                <div className="text-[11px] font-black text-[#1a1a1a] mb-1 border-b-2 border-black w-full text-center pb-0.5 uppercase tracking-widest">宇宙大廳</div>

                                                <div className="w-full flex flex-col gap-1 mb-2 mt-1">
                                                    <div className="flex justify-between items-center px-1">
                                                        <span className="text-[8px] font-black text-[#383a37]">🚪 房間密碼</span>
                                                        <span className={`text-[8px] font-bold underline transition-all ${matchStatus === 'searching' ? 'text-[#ff5252] animate-pulse' : 'text-[#383a37] opacity-70'}`}>
                                                            狀況: {matchStatus === 'searching' ? '🏃 配對中...' : (myPeerId ? '已上線' : '準備中')}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        placeholder="1~6 位房號..."
                                                        value={pvpRoomPassword}
                                                        maxLength={6}
                                                        disabled={matchStatus === 'searching'}
                                                        onChange={e => setPvpRoomPassword(e.target.value)}
                                                        className={`w-full border-2 border-[#1a1a1a] p-1.5 text-[11px] outline-none font-mono text-center tracking-[0.2em] font-black placeholder:tracking-normal ${matchStatus === 'searching' ? 'bg-gray-200 opacity-50' : 'bg-[#f8fcf0]'}`}
                                                    />
                                                </div>

                                                <div className="w-full grid grid-cols-1 gap-2">
                                                    <button
                                                        onClick={fetchLeaderboard}
                                                        disabled={matchStatus === 'searching'}
                                                        className={`w-full py-1.5 border-2 border-[#1a1a1a] text-[10px] font-black transition-all ${matchStatus === 'searching' ? 'bg-gray-400 text-gray-700 opacity-50 cursor-not-allowed' : 'bg-[#8e44ad] text-white shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none mb-1'}`}
                                                    >
                                                        👑 全球排行榜
                                                    </button>
                                                    <button
                                                        onClick={() => (matchStatus !== 'searching') && joinPvpRoom(pvpRoomPassword)}
                                                        disabled={matchStatus === 'searching'}
                                                        className={`w-full py-1.5 border-2 border-[#1a1a1a] text-[10px] font-black transition-all ${matchStatus === 'searching' ? 'bg-gray-400 text-gray-700 opacity-50 cursor-not-allowed' : 'bg-[#ff5252] text-white shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}
                                                    >
                                                        {matchStatus === 'searching' ? '等待對手連線...' : '進入房間'}
                                                    </button>

                                                    <div className="flex items-center gap-2 w-full">
                                                        <div className="h-[1px] bg-[#1a1a1a]/30 flex-1"></div>
                                                        <span className="text-[8px] font-bold opacity-50">OR</span>
                                                        <div className="h-[1px] bg-[#1a1a1a]/30 flex-1"></div>
                                                    </div>

                                                    <button
                                                        onClick={() => (matchStatus !== 'searching') && quickMatch()}
                                                        disabled={matchStatus === 'searching'}
                                                        className={`w-full py-1.5 border-2 border-[#1a1a1a] text-[10px] font-black transition-all ${matchStatus === 'searching' ? 'bg-gray-400 text-gray-700 opacity-50 cursor-not-allowed' : 'bg-[#ffca28] text-[#1a1a1a] shadow-[2px_2px_0_#1a1a1a] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none'}`}
                                                    >
                                                        🚀 快速配對
                                                    </button>
                                                </div>

                                                <div className="mt-auto text-[8px] font-black text-[#1a1a1a] opacity-60 flex flex-col items-center gap-0.5">
                                                    <span>相同密碼即可連線</span>
                                                    <div className="flex gap-2 text-[#383a37] underline decoration-dotted">
                                                        <span>[C] 取消</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center p-2 w-full">
                                                <div className="text-[12px] font-bold animate-pulse">連線建立中...</div>
                                            </div>
                                        )
                                    ) : (
                                        <>
                                            <div
                                                ref={advLogRef}
                                                className="flex-1 w-full bg-[#8fa07e] border-2 border-[#383a37] p-2 flex flex-col gap-1 overflow-y-auto"
                                            >
                                                {advLog.length > 0 ? advLog.map((l, i) => (
                                                    <div key={i} className="flex flex-col items-center gap-3 mb-8 border-b border-[#383a37]/20 pb-5 last:border-0 last:mb-0 relative animate-fade-in">
                                                        {l.iconId && (
                                                            <div className="scale-[1.0] w-18 h-18 flex items-center justify-center -mb-2">
                                                                <DitheredSprite id={l.iconId} scale={2} />
                                                            </div>
                                                        )}
                                                        <div className="text-[12px] font-bold text-[#1a1a1a] leading-tight text-center px-1">
                                                            {l.msg}
                                                        </div>

                                                        {/* 手動播報指示器 */}
                                                        {isAdvStreaming && i === advLog.length - 1 && (
                                                            <div className="absolute bottom-0 right-1 text-[10px] font-black animate-bounce flex items-center gap-1 z-50">
                                                                <span className="text-[#ff5252]">▼</span>
                                                                <span className="bg-[#ffca28] text-[#1a1a1a] px-1 rounded-sm border border-[#1a1a1a] scale-90">B</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )) : <div className="text-center mt-10 animate-pulse text-[12px] font-bold">探索中...</div>}
                                            </div>

                                            {/* HP 血條區域 */}
                                            <div className="w-full flex flex-col gap-1 mt-1">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[10px] font-bold text-[#1a1a1a]">血量: {Math.floor(advCurrentHP * 100)}%</span>
                                                    <span className="text-[10px] font-bold text-[#1a1a1a]">
                                                        {isAdvStreaming ? "[B] 繼續" : "[C] 固定路線中"}
                                                    </span>
                                                </div>
                                                <div className="w-full h-2.5 bg-[#383a37] border border-[#1a1a1a] rounded-sm overflow-hidden">
                                                    <div
                                                        className="h-full transition-all duration-300 ease-out"
                                                        style={{
                                                            width: `${advCurrentHP * 100}%`,
                                                            backgroundColor: advCurrentHP > 0.5 ? '#2ecc71' : advCurrentHP > 0.25 ? '#f1c40f' : '#e74c3c'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            {/* --- 新增：捕獲確認對話框 (A/B選單模式) --- */}
                            {pendingWildCapture && !isAdvStreaming && (
                                <div className="absolute inset-0 z-[130] flex flex-col items-center justify-center p-4 bg-black/40 backdrop-blur-[1px]">
                                    <div className="w-[180px] bg-[#8fa07e] border-4 border-[#1a1a1a] p-3 shadow-[8px_8px_0_rgba(0,0,0,0.3)] flex flex-col items-center gap-3">
                                        <div className="scale-[1.2] -mb-1">
                                            <DitheredSprite id={pendingWildCapture.id} scale={2} />
                                        </div>
                                        <div className="text-[#1a1a1a] text-[11px] font-black text-center leading-relaxed">
                                            ✨ 野生 {pendingWildCapture.name} <br /> 加入了您！<br />是否要更換寵物？
                                        </div>
                                        <div className="flex w-full gap-3 justify-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="px-2 py-0.5 bg-[#ffca28] text-[#111] border-2 border-[#1a1a1a] font-black text-[9px]">A: NO</div>
                                            </div>
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="px-2 py-0.5 bg-[#ff5252] text-white border-2 border-[#1a1a1a] font-black text-[9px]">B: YES</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 狀態查詢 Overlay */}
                    {/* 狀態資訊 (單頁版) */}
                    {isStatusUIOpen && (
                        <div className="absolute inset-0 z-[115] flex flex-col items-center justify-start p-2" style={{ backgroundColor: 'rgba(157, 174, 138, 0.99)' }}>
                            <div className="w-full bg-[#383a37] text-[#8fa07e] text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black">
                                <span>狀態資訊</span>
                                <span>[C] 關閉</span>
                            </div>

                            <div className="flex-1 w-full flex flex-col gap-1.5 px-1 justify-start pb-1">
                                <div className="border-b-2 border-[#383a37] pb-1 flex justify-between text-[11px] font-black text-[#1a1a1a]">
                                    <span>屬性: {(() => {
                                        const sid = getMonsterId();
                                        const types = SPECIES_BASE_STATS[String(sid)]?.types || ['normal'];
                                        return types.map(t => ({
                                            fire: '火', water: '水', grass: '草', bug: '蟲', dragon: '龍',
                                            flying: '飛', poison: '毒', ground: '地', rock: '岩',
                                            psychic: '超', ice: '冰', ghost: '鬼', fighting: '鬥',
                                            electric: '電', steel: '鋼', dark: '惡', normal: '普',
                                            fairy: '妖'
                                        }[t] || t)).join(' / ');
                                    })()}</span>
                                    <span>性格: {(() => {
                                        const tagEntries = Object.entries(soulTagCounts);
                                        const best = tagEntries.reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0]);
                                        // 必須大於 0 才是覺醒狀態
                                        if (best[1] <= 0) return '未覺醒';
                                        return NATURE_CONFIG[best[0]]?.name || '神祕';
                                    })()}</span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    {[
                                        { label: '飽足度', val: hunger, color: '#e67e22' },
                                        { label: '心情值', val: mood, color: '#f1c40f' },
                                        { label: '羈絆值', val: Math.min(100, (bondValue / 100) * 100), color: '#e74c3c', text: bondValue }
                                    ].map((s, i) => (
                                        <div key={i} className="flex flex-col gap-0.5">
                                            <div className="flex justify-between text-[10px] font-black text-[#1a1a1a] leading-tight">
                                                <span>{s.label}</span>
                                                <span>{s.text !== undefined ? s.text : `${Math.floor(s.val)}%`}</span>
                                            </div>
                                            <div className="w-full h-2 bg-[#ccd6be] border border-[#383a37] rounded-sm overflow-hidden">
                                                <div className="h-full transition-all duration-300" style={{ width: `${s.text !== undefined ? Math.min(100, (s.text / 150) * 100) : s.val}%`, backgroundColor: s.color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 bg-[#869675] px-1.5 py-1 rounded border border-[#383a37] mt-0.5">
                                    {(() => {
                                        const level = Math.min(100, Math.max(1, Math.floor(((advStats.basePower || 100) - 100) / 10) + 1));
                                        const sid = getMonsterId();
                                        const dominantTag = Object.entries(soulTagCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0];
                                        const nMods = { atk: 1.0, def: 1.0, spd: 1.0 };
                                        if (dominantTag === 'passionate') { nMods.atk = 1.1; nMods.def = 0.9; }
                                        else if (dominantTag === 'stubborn') { nMods.def = 1.1; nMods.spd = 0.9; }
                                        else if (dominantTag === 'rational') { nMods.spd = 1.1; nMods.atk = 0.9; }
                                        else if (dominantTag === 'nonsense') { nMods.spd = 1.1; nMods.def = 0.9; }

                                        const fHP = calcFinalStat('hp', sid, advStats.ivs.hp, advStats.evs.hp, level);
                                        const fATK = calcFinalStat('atk', sid, advStats.ivs.atk, advStats.evs.atk, level, nMods.atk);
                                        const fDEF = calcFinalStat('def', sid, advStats.ivs.def, advStats.evs.def, level, nMods.def);
                                        const fSPD = calcFinalStat('spd', sid, advStats.ivs.spd, advStats.evs.spd, level, nMods.spd);

                                        return (
                                            <>
                                                <div className="text-[10px] font-black text-[#1a1a1a]">血量: {fHP} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.hp)})</span></div>
                                                <div className="text-[10px] font-black text-[#1a1a1a]">攻擊: {fATK} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.atk)})</span></div>
                                                <div className="text-[10px] font-black text-[#1a1a1a]">防禦: {fDEF} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.def)})</span></div>
                                                <div className="text-[10px] font-black text-[#1a1a1a]">速度: {fSPD} <span className="opacity-50 text-[8px]">({getIVGrade(advStats.ivs.spd)})</span></div>
                                                <div className="text-[10px] font-black text-[#1a1a1a]">等級: {level}</div>
                                                <div className="text-[10px] font-black text-[#1a1a1a]">戰力: {advStats.basePower}</div>
                                            </>
                                        );
                                    })()}
                                </div>


                                <div className="text-[10px] font-black text-center text-[#1a1a1a] mt-0.5 opacity-70 border-t border-[#383a37]/30 pt-0.5">
                                    累計特訓勝次: {trainWins} 次
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 我的背包 (移至此處) */}
                    {isInventoryOpen && (
                        <div className="absolute inset-0 z-[115] flex flex-col items-center justify-start p-2" style={{ backgroundColor: 'rgba(157, 174, 138, 0.99)' }}>
                            <div className="w-full bg-[#383a37] text-[#8fa07e] text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black">
                                <span>我的背包</span>
                                <span>[C] 關閉</span>
                            </div>

                            <div className="flex-1 w-full flex flex-col gap-2 px-1 justify-start pb-2 overflow-hidden">
                                <div className="border-b-2 border-[#383a37] pb-1 flex justify-between items-center">
                                    <span className="text-[11px] font-black text-[#1a1a1a]">物品清單 ({inventory.length}/99)</span>
                                    <div className="text-[9px] font-bold text-[#383a37] animate-pulse">
                                        {inventory.length > 0 ? `${selectedItemIdx + 1} / ${inventory.length}` : '0/0'}
                                    </div>
                                </div>

                                <div className="relative flex-1 mt-1 flex flex-col items-center justify-center">
                                    {inventory.length > 0 ? (
                                        <div className="w-full flex flex-col items-center gap-2">
                                            {/* 主顯示區：只顯示當前選中的物品細節，以及前後的預覽 */}
                                            <div className="w-full space-y-2">
                                                {inventory.map((item, idx) => {
                                                    // 只渲染選中的及其前後一個，模擬垂直滾動感
                                                    const isSelected = selectedItemIdx === idx;
                                                    const isNext = (selectedItemIdx + 1) % inventory.length === idx;
                                                    const isPrev = (selectedItemIdx - 1 + inventory.length) % inventory.length === idx;

                                                    if (!isSelected && !isNext && !isPrev) return null;

                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`w-full p-2 py-2.5 rounded border-2 transition-all duration-200 flex flex-col items-center text-center
                                                                ${isSelected ? 'bg-[#383a37] text-[#8fa07e] border-[#1a1a1a] scale-100 opacity-100 z-10' : 'bg-[#9dae8a] text-[#1a1a1a] border-[#383a37]/30 scale-90 opacity-40 blur-[0.5px]'}`}
                                                            style={{
                                                                transform: isPrev ? 'translateY(-5px)' : isNext ? 'translateY(5px)' : 'none'
                                                            }}
                                                        >
                                                            <div className="text-[12px] font-black">
                                                                {item.name} {item.count > 1 ? `x${item.count}` : ''}
                                                            </div>
                                                            {isSelected && (
                                                                <>
                                                                    <div className="text-[9px] leading-tight mt-1 px-1">{item.desc}</div>
                                                                    <div className={`mt-2 text-[10px] font-black ${isUsingItem ? 'bg-gray-400' : 'bg-[#ff5252]'} text-white px-3 py-0.5 rounded-full border border-[#1a1a1a] ${!isUsingItem && 'animate-pulse'}`}>
                                                                        {isUsingItem ? "正在使用..." : "[B] 確認使用"}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center text-[11px] font-bold opacity-50">背包目前是空的</div>
                                    )}
                                </div>
                                <div className="text-[9px] font-black text-center text-[#1a1a1a] mt-1 opacity-70 underline decoration-dotted">
                                    {"[A] 下一個  [B] 使用  [C] 關閉"}
                                </div>
                            </div>
                        </div>
                    )}


                    {/* === 📖 對戰日記 UI === */}
                    {isDiaryOpen && (() => {
                        const todayStr = getTodayStr();
                        const viewDate = diaryViewDate || todayStr;
                        const isToday = viewDate === todayStr;
                        const entry = isToday ? {
                            trainWins: todayTrainWins,
                            wildDefeated: todayWildDefeated,
                            specialEvent: todaySpecialEvent,
                            hasEvolved: todayHasEvolved,
                        } : diaryLog[viewDate];
                        const hasPastData = !isToday && entry;
                        const petMsg = hasPastData ? entry.petMessage : null;

                        // 格式化日期顯示
                        const [year, month, day] = viewDate.split('-');

                        // 即時狀態話語邏輯 (僅限今天)
                        const getRealtimeText = () => {
                            if (todayHasEvolved) return "我覺得自己像換了個靈魂！這股新力量太不可思議了！";
                            if (todayWildDefeated === 1) return "剛才打贏了野外的傢伙！感覺我們默契越來越好了！";
                            if (hunger < 30) return "肚子咕嚕叫了... 嘿嘿，你想餵我嗎？";
                            if (mood < 30) return "有點無聊耶... 我們去哪裡冒險好嗎？";
                            if (todayTrainWins >= 5) return "今天的特訓超充實的！我感覺全身充滿力量！";
                            if (bondValue > 150) return "跟你在一起的時候，我覺得我是世界上最幸福的怪獸！";
                            if (mood > 80) return "今天感覺真棒！謝謝你一直陪著我。";
                            // 預設從罐頭詞庫抽
                            const pool = DIARY_MESSAGES_TEMPLATE[lockedAffinity] || DIARY_MESSAGES_TEMPLATE.default;
                            return pool[0]; // 抽第一句作為預設
                        };

                        return (
                            <div className="absolute inset-0 z-[120] flex flex-col" style={{ backgroundColor: '#9dae8a', fontFamily: "'Press Start 2P', monospace" }}>
                                {/* 標題列 */}
                                <div className="w-full bg-[#383a37] text-[#8fa07e] px-2 py-1.5 flex justify-between items-center shrink-0">
                                    <span style={{ fontSize: '9px' }}>📖 對戰日記</span>
                                    <span style={{ fontSize: '8px' }}>[B] 關閉</span>
                                </div>

                                {/* 日期導覽列 */}
                                <div className="flex items-center justify-between px-2 py-1 bg-[#838e78] shrink-0">
                                    <span style={{ fontSize: '8px', color: '#1a1a1a' }}>[A] ◀</span>
                                    <span style={{ fontSize: '10px', fontWeight: '900', color: '#1a1a1a' }}>
                                        {month}/{day} {isToday ? '(今天)' : ''}
                                    </span>
                                    <span style={{ fontSize: '8px', color: viewDate >= todayStr ? '#999' : '#1a1a1a' }}>{viewDate >= todayStr ? '---' : '[C] ▶'}</span>
                                </div>

                                {/* 日記內容 */}
                                <div className="flex-1 overflow-hidden flex flex-col px-2 py-2 gap-2">
                                    {/* 今天(即時數據)或有歷史記錄 */}
                                    {(isToday || hasPastData) ? (
                                        <>
                                            {/* 統計區塊 */}
                                            <div className="border-2 border-[#383a37] bg-[#b8c8a8] p-2 flex flex-col gap-1">
                                                <div style={{ fontSize: '9px', color: '#1a1a1a', borderBottom: '1px solid #383a37', paddingBottom: '3px', marginBottom: '3px' }}>
                                                    📊 {isToday ? '今日記錄' : '當日回顧'}
                                                </div>

                                                {(() => {
                                                    // 取得當天個性 (如果是今天則現算，如果是舊日則取存檔)
                                                    const tag = isToday
                                                        ? Object.entries(soulTagCounts).reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0])[0]
                                                        : entry?.dominantTag;

                                                    const attitudeMap = {
                                                        gentle: "溫婉有加，把你當成避風港。",
                                                        stubborn: "有點嘴硬，但心裡非常依賴你。",
                                                        passionate: "熱血澎湃！把你當成親兄弟。",
                                                        nonsense: "調皮搗蛋，看到你就想撒嬌。",
                                                        rational: "冷靜沉穩，對你抱持深厚信任。",
                                                        none: "還在摸索與你的相處之道..."
                                                    };

                                                    return (
                                                        <div className="flex flex-col gap-1.5">
                                                            <div className="flex justify-between items-start" style={{ fontSize: '9px', color: '#1a1a1a' }}>
                                                                <span className="shrink-0">🤝 對你的態度:</span>
                                                                <span className="font-black text-right pl-2 text-[8px] leading-tight">
                                                                    {attitudeMap[tag] || attitudeMap.none}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center" style={{ fontSize: '9px', color: '#1a1a1a' }}>
                                                                <span>🌿 擊敗野怪:</span>
                                                                <span className="font-black">{entry?.wildDefeated ?? 0} 隻</span>
                                                            </div>
                                                            <div className="mt-1 pt-1 border-t border-[#383a37]/30 flex flex-col gap-1">
                                                                <div style={{ fontSize: '8px', opacity: 0.8 }}>📍 特殊事件:</div>
                                                                <div style={{ fontSize: '9px', color: '#c00', fontWeight: '900' }}>
                                                                    {entry?.specialEvent || '今日尚無重大事件'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* 寵物話語區塊 */}
                                            <div className="border-2 border-[#383a37] bg-[#b8c8a8] p-2 flex flex-col gap-1 flex-1">
                                                <div style={{ fontSize: '9px', color: '#1a1a1a', borderBottom: '1px solid #383a37', paddingBottom: '3px', marginBottom: '3px' }}>
                                                    💬 寵物的話
                                                </div>
                                                <div style={{ fontSize: '10px', color: '#1a1a1a', lineHeight: '1.7', fontFamily: 'sans-serif', fontWeight: 'bold' }}>
                                                    {isToday
                                                        ? `「${getRealtimeText()}」`
                                                        : `「${petMsg || '今天也謝謝你陪伴我。'}」`
                                                    }
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* 無記錄日 */
                                        <div className="flex-1 flex flex-col items-center justify-center gap-2">
                                            <div style={{ fontSize: '24px' }}>📭</div>
                                            <div style={{ fontSize: '9px', color: '#555', textAlign: 'center', lineHeight: '1.8', fontFamily: 'sans-serif' }}>
                                                這一天還沒有記錄哦。<br />
                                                那天我們在哪裡呢...？
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })()}


                    <div className="logical-canvas flex flex-col items-center justify-between pointer-events-none">

                        {isBooting ? (
                            <div className="absolute inset-0 z-50 overflow-hidden pointer-events-none">
                                {/* 頂部文字 */}
                                <div className="absolute top-[60px] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2" style={{
                                    color: '#1a1a1a',
                                    whiteSpace: 'nowrap',
                                    textAlign: 'center'
                                }}>
                                    {/* 加大標題字體 */}
                                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '18px', fontWeight: '900', color: '#1a1a1a', letterSpacing: '0.1em' }}>像素怪獸</div>
                                    <div style={{ fontSize: '10px', fontWeight: 'bold' }}>
                                        按 <span className="blink-anim">A</span> 開始冒險
                                    </div>

                                    {/* Firebase 登入控制項 */}
                                    <div className="mt-4 pointer-events-auto flex flex-col items-center gap-2">
                                        {user ? (
                                            <div className="flex flex-col items-center">
                                                <div className="text-[9px] text-[#444] mb-1">已登入: {user.displayName}</div>
                                                <button
                                                    onClick={logoutGoogle}
                                                    className="bg-[#eee] border-2 border-[#1a1a1a] px-2 py-1 text-[9px] shadow-[2px_2px_0_rgba(0,0,0,0.2)] active:translate-y-[1px]"
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

                                {/* 畫面中央偏下隨機怪獸 -> 修改為更靠近中央 */}
                                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 flex justify-center items-center" style={{ zIndex: 40 }}>
                                    <div style={{ animation: 'egg-pulse 2s infinite ease-in-out' }}>
                                        <DitheredSprite id={bootMonsterId} scale={2.5} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="w-full h-[24px] flex justify-between px-4 pt-2 z-20 shrink-0">
                                    {menuItems.slice(0, 4).map((item, idx) => (
                                        <div key={item.id} className="pixel-rendering" style={{ opacity: activeIndex === idx ? 1 : 0.2 }}>
                                            <PixelArt sprite={item.sprite} color="#1a1a1a" scale={2} />
                                        </div>
                                    ))}

                                    {/* 雲端同步狀態顯示 */}
                                    {user && (
                                        <div className="absolute right-4 top-2 flex items-center gap-1">
                                            <div className={`w-[6px] h-[6px] rounded-full ${isCloudSyncing ? 'bg-[#ff5252] animate-pulse' : 'bg-[#4caf50]'}`} />
                                            <span className="text-[8px] text-[#444] font-bold">
                                                {isCloudSyncing ? '同步中...' : '雲端存檔已同步'}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full flex-1 relative z-10 overflow-hidden flex flex-col items-center justify-center">
                                    {isEvolving && (
                                        <div className="absolute inset-0 bg-[#8fa07e]/80 flex items-center justify-center z-30">
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
                                                <div className="absolute inset-x-2 top-2 bottom-2 bg-[#9baea0] border-[4px] border-[#383a37] shadow-[4px_4px_0_rgba(0,0,0,0.2)] p-2 flex flex-col pointer-events-auto z-50">
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
                                        className="absolute"
                                        style={{
                                            left: pos.x, top: pos.y,
                                            transform: 'translate(-50%, -50%)',
                                            animation: isDead ? 'monster-fadeout 2s ease-out forwards' : 'none',
                                            zIndex: 40
                                        }}
                                    >
                                        <div style={{
                                            transform: `${!isDead && isSpinning ? 'rotate(180deg)' : ''} ${vel.x < 0 ? 'scaleX(1)' : 'scaleX(-1)'}`,
                                            transformOrigin: 'center center',
                                            transition: 'transform 0.15s ease-out', // 稍微平滑化轉向過程
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            {!isDead && (() => { lastAliveMonsterIdRef.current = getMonsterId(); return null; })()}
                                            <DitheredSprite id={isDead ? lastAliveMonsterIdRef.current : getMonsterId()} />
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

                                <div className="w-[240px] h-[32px] border-2 border-[#1a1a1a] flex items-center px-2 overflow-hidden z-20 bg-[#9dae8a] shrink-0 mb-3 shadow-[inset_2px_2px_0_rgba(0,0,0,0.2)]">
                                    <span key={marqueeKey} className={`text-[11px] font-bold ${isBooting ? 'whitespace-pre-line text-center w-full leading-tight' : 'whitespace-nowrap'}`} style={{ animation: isBooting ? 'none' : 'marquee-once 4s ease-out forwards' }}>
                                        {isBooting ? (
                                            <>
                                                <div>像素怪獸</div>
                                                <div>按 <span className="blink-anim">A</span> 開始冒險</div>
                                            </>
                                        ) : dialogue}
                                    </span>
                                </div>

                                <div className="w-full h-[24px] flex justify-between px-4 pb-2 z-20 shrink-0">
                                    {menuItems.slice(4, 8).map((item, idx) => (
                                        <div key={item.id} className="pixel-rendering" style={{ opacity: activeIndex === idx + 4 ? 1 : 0.2 }}>
                                            <PixelArt sprite={item.sprite} color="#1a1a1a" scale={2} />
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

                <div className="mt-12 w-full flex justify-between px-4 mb-2">
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
                                  w-[46px] h-[46px] rounded-full shadow-[0_4px_6px_rgba(0,0,0,0.6)]
                                  transition-all active:translate-y-[2px] active:shadow-sm
                                  border-[3px] border-[#383a37] 
                                  ${btn.key === 'A' ? 'bg-[#ffca28]' : btn.key === 'B' ? 'bg-[#ff5252]' : 'bg-[#00c853]'}
                                  ${btnPressed === btn.key ? 'brightness-75' : 'brightness-100'}
                                  flex items-center justify-center text-[#212121] text-[18px] font-black
                                `}
                                onClick={() => btn.key === 'A' ? handleA() : btn.key === 'B' ? handleB() : handleC()}
                            > {btn.key} </button>
                            <span className="text-[12px] font-bold text-[#424242] tracking-widest mt-1">
                                {btn.name}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="w-full mt-8 px-4">
                    <button
                        onClick={isDead ? handleRestart : triggerFarewell}
                        disabled={!isDead && isGenerating}
                        className="w-full bg-[#3d3d3d] text-[#ff5252] py-3 rounded-none text-[12px] font-bold tracking-widest disabled:opacity-50"
                    >
                        {isDead ? "重置系統" : (isGenerating ? "連結AI中..." : "終止生命")}
                    </button>
                </div>
            </div>
        </div>
    );
}


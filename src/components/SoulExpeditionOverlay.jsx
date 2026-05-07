import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SOUL_QUESTIONS } from '../data/gameConfig';
import { DitheredSprite } from './SpriteRenderer';

// ==========================================
// 能力覺醒卡片庫 (Roguelike Cards)
// ==========================================
const SOUL_CARDS = [
    { id: 'resonance', name: '靈魂共鳴', desc: '羈絆獲得效率翻倍', icon: '💎', effect: 'double_bond' },
    { id: 'energetic', name: '精力充沛', desc: '探險消耗減半', icon: '⚡', effect: 'half_energy_drain' },
    { id: 'fountain', name: '活力噴泉', desc: '立即回復 50 點活力', icon: '🌊', effect: 'instant_heal_50', kind: 'heal', heal: 50 },
    { id: 'rest_brew', name: '休息茶', desc: '立即回復 35 點活力', icon: '🍵', effect: 'instant_heal_35', kind: 'heal', heal: 35 },
    { id: 'snack_break', name: '小點心', desc: '立即回復 25 點活力', icon: '🍙', effect: 'instant_heal_25', kind: 'heal', heal: 25 },
    { id: 'mystery_blessing', name: '神秘加護', desc: '隨機獲得一種屬性或個性加護', icon: '🎴', effect: 'mystery_blessing' },
    { id: 'fire_awaken', name: '火之加護', desc: '火屬性點數額外 +1', icon: '🔥', effect: 'bonus_fire' },
    { id: 'water_awaken', name: '水之加護', desc: '水屬性點數額外 +1', icon: '💧', effect: 'bonus_water' },
    { id: 'grass_awaken', name: '草之加護', desc: '草屬性點數額外 +1', icon: '🌿', effect: 'bonus_grass' },
    { id: 'bug_awaken', name: '蟲之加護', desc: '蟲屬性點數額外 +1', icon: '🐛', effect: 'bonus_bug' },
    { id: 'passionate_awaken', name: '熱血之魂', desc: '熱血個性點數額外 +1', icon: '☀️', effect: 'bonus_passionate' },
    { id: 'stubborn_awaken', name: '執著之魂', desc: '執著個性點數額外 +1', icon: '⛰️', effect: 'bonus_stubborn' },
    { id: 'rational_awaken', name: '冷靜之魂', desc: '冷靜個性點數額外 +1', icon: '❄️', effect: 'bonus_rational' },
    { id: 'gentle_awaken', name: '溫柔之魂', desc: '溫柔個性點數額外 +1', icon: '🌸', effect: 'bonus_gentle' },
    { id: 'nonsense_awaken', name: '搞怪之魂', desc: '搞怪個性點數額外 +1', icon: '🤡', effect: 'bonus_nonsense' },
];

const JOKER_CARDS = [
    { id: 'mirror_joker', name: '鏡面小丑', desc: '直接把目前最高與最低的性格數值互換。', icon: '🃏', effect: 'joker_mirror' },
    { id: 'vitality_joker', name: '活力小丑', desc: '把目前剩餘活力轉成羈絆，活力歸 0 並結束遠征。', icon: '🃏', effect: 'joker_vitality' },
    { id: 'stamina_joker', name: '體力小丑', desc: '之後所有加護選擇都只會出現活力補給。', icon: '🃏', effect: 'joker_stamina' },
    { id: 'echo_joker', name: '回聲小丑', desc: '每次談心額外獲得更多羈絆，體力消耗倍數成長。', icon: '🃏', effect: 'joker_echo' },
    { id: 'wild_joker', name: '情緒小丑', desc: '性格與屬性成長提高，但本次不會再進入加護選擇。', icon: '🃏', effect: 'joker_wild' },
    { id: 'stack_joker', name: '收藏小丑', desc: '持有加護越多，談心羈絆越高；活力消耗小幅增加。', icon: '🃏', effect: 'joker_stack' },
];

// ==========================================
// 靈魂談心主元件 (Soul Expedition Overlay)
// ==========================================
export const SoulExpeditionOverlay = ({ monsterId, initialEnergy, lockedAffinity, soulTagCounts = {}, onClose, onComplete }) => {
    // --- Core States ---
    const [progress, setProgress] = useState(0);
    const [energy, setEnergy] = useState(initialEnergy);
    const [activeBuffs, setActiveBuffs] = useState([]);
    const [currentEvent, setCurrentEvent] = useState(null); // null | 'talk' | 'cards' | 'jokers' | 'ending'
    const [talkSelectIdx, setTalkSelectIdx] = useState(0); // 當前對話選項的游標

    // --- Event States ---
    const [qIdx, setQIdx] = useState(0);
    const [cardChoices, setCardChoices] = useState([]);
    const [jokerChoices, setJokerChoices] = useState([]);
    const [resultText, setResultText] = useState(null); // { text, color }
    const [isFinished, setIsFinished] = useState(false);

    // --- Stats Accumulator ---
    const statsRef = useRef({
        bond: 0,
        affinities: { fire: 0, water: 0, grass: 0, bug: 0 },
        tags: { passionate: 0, stubborn: 0, rational: 0, gentle: 0, nonsense: 0 },
        tagOverride: null
    });

    // --- Internal Refs ---
    const eventTickRef = useRef(0);
    const lastTickTimeRef = useRef(Date.now());
    const progressRef = useRef(0);
    const energyRef = useRef(initialEnergy);
    const isFinishedRef = useRef(false);
    const lastCardMilestoneRef = useRef(0);
    const activeBuffsRef = useRef([]);
    const seenJokerIdsRef = useRef(new Set());
    const forceNextCardEventRef = useRef(false);
    const jokerMilestones = [5, 45, 80];

    // Keep refs in sync with state
    useEffect(() => { progressRef.current = progress; }, [progress]);
    useEffect(() => { energyRef.current = energy; }, [energy]);
    useEffect(() => { isFinishedRef.current = isFinished; }, [isFinished]);
    useEffect(() => { activeBuffsRef.current = activeBuffs; }, [activeBuffs]);

    // --- Finish Handler ---
    const finishExpedition = useCallback(() => {
        if (isFinishedRef.current) return;
        
        // 抵達終點獎勵：如果進度 100%，額外加 10 點羈絆
        if (progressRef.current >= 100) {
            statsRef.current.bond += 10;
        }

        setIsFinished(true);
        setCurrentEvent('ending');
    }, []);

    const confirmFinish = useCallback(() => {
        onComplete({
            finalEnergy: Math.max(0, energyRef.current),
            collectedStats: statsRef.current
        });
    }, [onComplete]);

    // ==========================================
    // 事件觸發邏輯
    // ==========================================
    const triggerCardEvent = useCallback(() => {
        const hasStaminaJoker = activeBuffsRef.current.includes('joker_stamina');
        const pool = hasStaminaJoker
            ? SOUL_CARDS.filter(card => card.kind === 'heal')
            : SOUL_CARDS;
        const shuffled = [...pool].sort(() => 0.5 - Math.random());
        setCardChoices(shuffled.slice(0, Math.min(3, shuffled.length)));
        setTalkSelectIdx(0);
        setCurrentEvent('cards');
    }, [activeBuffs]);

    const triggerJokerEvent = useCallback(() => {
        const available = JOKER_CARDS.filter(card => !seenJokerIdsRef.current.has(card.id));
        const jokerPool = available.length > 0 ? available : JOKER_CARDS;
        const shuffled = [...jokerPool].sort(() => 0.5 - Math.random());
        setJokerChoices(shuffled.slice(0, Math.min(3, shuffled.length)));
        setTalkSelectIdx(0);
        setCurrentEvent('jokers');
    }, []);

    // ==========================================
    // 核心 Game Loop (每 100ms)
    // ==========================================
    useEffect(() => {
        if (currentEvent !== null) return;

        const timer = setInterval(() => {
            if (isFinishedRef.current) { clearInterval(timer); return; }

            if (forceNextCardEventRef.current) {
                forceNextCardEventRef.current = false;
                triggerCardEvent();
                return;
            }

            // 固定三個小丑牌觸發點
            const nextP = Math.min(100, progressRef.current + 0.5);
            const milestone = jokerMilestones.find((point) => point > lastCardMilestoneRef.current && nextP >= point);
            if (milestone) {
                lastCardMilestoneRef.current = milestone;
                setProgress(milestone);
                triggerJokerEvent();
                return;
            }

            const currentBuffs = activeBuffsRef.current;
            const drainLevel = currentBuffs.filter(b => b === 'half_energy_drain').length;
            const jokerDrainCount = currentBuffs.filter(b => b.startsWith('joker_')).length;
            const echoCount = currentBuffs.filter(b => b === 'joker_echo').length;
            const wildJokerCount = currentBuffs.filter(b => b === 'joker_wild').length;
            const drain = 0.4 * Math.pow(0.5, drainLevel) * Math.pow(1.35, echoCount) * (1 + jokerDrainCount * 0.08 + wildJokerCount * 0.2);

            setProgress(nextP);
            if (nextP >= 100) {
                clearInterval(timer);
                finishExpedition();
                return;
            }

            setEnergy(e => {
                const newE = e - drain;
                if (newE <= 0) {
                    clearInterval(timer);
                    finishExpedition();
                    return 0;
                }
                return newE;
            });

            eventTickRef.current += 1;
            if (eventTickRef.current >= 40) { // ~4 秒觸發一次事件
                eventTickRef.current = 0;
                triggerRandomEvent();
            }
        }, 100);

        return () => clearInterval(timer);
    }, [currentEvent, activeBuffs, finishExpedition, triggerCardEvent, triggerJokerEvent]);

    // ==========================================
    // 隨機事件觸發器
    // ==========================================
    const triggerRandomEvent = () => {
        const r = Math.random() * 100;
        if (r < 72) {
            // 靈魂談心 (60/85)
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

            setQIdx(qi);
            setTalkSelectIdx(0);
            setCurrentEvent('talk');
        } else {
            triggerCardEvent();
        }
    };


    // ==========================================
    // 結果提示
    // ==========================================
    const showResult = (text, color) => {
        setResultText({ text, color });
        setTimeout(() => setResultText(null), 1200);
    };

    // ==========================================
    // 事件處理器
    // ==========================================
    const handleTalkChoice = useCallback((idx) => {
        const opt = SOUL_QUESTIONS[qIdx]?.options[idx];
        if (!opt) return;

        // 堆疊邏輯：每多一張靈魂共鳴，倍率就再翻倍 (2^n)
        const currentBuffs = activeBuffsRef.current;
        const bondMult = Math.pow(2, currentBuffs.filter(b => b === 'double_bond').length);
        const echoCount = currentBuffs.filter(b => b === 'joker_echo').length;
        const stackBonus = currentBuffs.filter(b => b === 'joker_stack').length > 0 ? Math.floor(currentBuffs.length / 3) : 0;
        const bondGain = Math.max(1, Math.floor((1 + stackBonus) * bondMult * Math.pow(1.5, echoCount)));
        statsRef.current.bond += bondGain;

        // 堆疊邏輯：每多一張對應加護，額外獲得 1 點
        const bonusCount = currentBuffs.filter(b => b === `bonus_${opt.affinity}`).length;
        const wildBonus = currentBuffs.filter(b => b === 'joker_wild').length;
        let affBonus = 1 + bonusCount + wildBonus;

        // 堆疊邏輯：每多一張個性加護，額外獲得 1 點
        const tagBonusCount = currentBuffs.filter(b => b === `bonus_${opt.tag}`).length;
        let tagBonus = 1 + tagBonusCount + wildBonus;

        if (statsRef.current.affinities[opt.affinity] !== undefined) {
            statsRef.current.affinities[opt.affinity] += affBonus;
        }
        if (statsRef.current.tags[opt.tag] !== undefined) {
            statsRef.current.tags[opt.tag] += tagBonus;
        }
        showResult(`♡ +${bondGain}`, '#ffca28');
        setCurrentEvent(null);
        lastTickTimeRef.current = Date.now();
    }, [qIdx]);

    const handleCardChoice = useCallback((card) => {
        if (card.effect.startsWith('instant_heal')) {
            const healAmount = card.heal ?? 50;
            setEnergy(e => Math.min(100, e + healAmount));
            showResult(`活力 +${healAmount}！`, '#4caf50');
        } else if (card.effect === 'mystery_blessing') {
            const mysteryPool = [
                'bonus_fire', 'bonus_water', 'bonus_grass', 'bonus_bug',
                'bonus_passionate', 'bonus_stubborn', 'bonus_rational', 'bonus_gentle', 'bonus_nonsense'
            ];
            const picked = mysteryPool[Math.floor(Math.random() * mysteryPool.length)];
            setActiveBuffs(prev => {
                const next = [...prev, picked];
                activeBuffsRef.current = next;
                return next;
            });

            const field = picked.replace('bonus_', '');
            if (statsRef.current.affinities[field] !== undefined) {
                statsRef.current.affinities[field] += 1;
            } else if (statsRef.current.tags[field] !== undefined) {
                statsRef.current.tags[field] += 1;
            }

            const labelMap = {
                fire: '火', water: '水', grass: '草', bug: '蟲',
                passionate: '熱血', stubborn: '執著', rational: '冷靜', gentle: '溫柔', nonsense: '搞怪'
            };
            showResult(`神秘加護：${labelMap[field] || field}`, '#03a9f4');
        } else {
            // 允許堆疊，直接加入 Buff 陣列
            setActiveBuffs(prev => {
                const next = [...prev, card.effect];
                activeBuffsRef.current = next;
                return next;
            });

            // 立即給予 1 點對應屬性/個性點數（每次獲得卡片都給 1 點）
            if (card.effect.startsWith('bonus_')) {
                const field = card.effect.replace('bonus_', '');
                if (statsRef.current.affinities[field] !== undefined) {
                    statsRef.current.affinities[field] += 1;
                } else if (statsRef.current.tags[field] !== undefined) {
                    statsRef.current.tags[field] += 1;
                }
            }

            const count = activeBuffsRef.current.filter(b => b === card.effect).length;
            showResult(`${card.name} Lv.${count}！`, '#03a9f4');
        }
        setCurrentEvent(null);
        lastTickTimeRef.current = Date.now();
    }, []);

    const applyMirrorJoker = useCallback(() => {
        const tagKeys = ['passionate', 'stubborn', 'rational', 'gentle', 'nonsense'];
        const current = { ...tagKeys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {}), ...(soulTagCounts || {}) };
        const entries = tagKeys.map(key => [key, current[key] || 0]);
        const highest = entries.reduce((a, b) => b[1] > a[1] ? b : a, entries[0]);
        const lowest = entries.reduce((a, b) => b[1] < a[1] ? b : a, entries[0]);

        if (highest[0] === lowest[0]) {
            showResult('鏡面小丑：性格尚未分化', '#ffca28');
            return;
        }

        const next = { ...current };
        next[highest[0]] = lowest[1];
        next[lowest[0]] = highest[1];
        statsRef.current.tagOverride = next;

        const labelMap = {
            passionate: '熱血',
            stubborn: '執著',
            rational: '冷靜',
            gentle: '溫柔',
            nonsense: '搞怪'
        };
        showResult(`鏡面小丑：${labelMap[highest[0]]} ⇄ ${labelMap[lowest[0]]}`, '#ffca28');
    }, [soulTagCounts]);

    const handleJokerChoice = useCallback((card) => {
        seenJokerIdsRef.current.add(card.id);
        if (card.effect === 'joker_mirror') {
            applyMirrorJoker();
        }
        if (card.effect === 'joker_vitality') {
            const bondGain = Math.floor(Math.max(0, energyRef.current));
            statsRef.current.bond += bondGain;
            setEnergy(0);
            energyRef.current = 0;
            showResult(`活力小丑：羈絆 +${bondGain}`, '#ffca28');
            setIsFinished(true);
            setCurrentEvent('ending');
            return;
        }

        setActiveBuffs(prev => {
            const next = [...prev, card.effect];
            activeBuffsRef.current = next;
            return next;
        });
        const count = activeBuffsRef.current.filter(b => b === card.effect).length;
        showResult(`${card.name} Lv.${count}`, '#ffca28');
        if (card.effect === 'joker_wild') {
            setCurrentEvent(null);
            lastTickTimeRef.current = Date.now();
            return;
        }
        if (card.effect === 'joker_stamina') {
            forceNextCardEventRef.current = true;
        }
        setCurrentEvent(null);
        lastTickTimeRef.current = Date.now();
    }, [activeBuffs, applyMirrorJoker, triggerCardEvent]);

    // ==========================================
    // 鍵盤 / 按鈕輸入處理
    // ==========================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const key = e.key.toUpperCase();

            let mappedBtn = '';
            if (key === 'Z') mappedBtn = 'A';
            else if (key === 'X') mappedBtn = 'B';
            else if (key === 'C') mappedBtn = 'B'; // 手機版的 C 鍵在這邊暫時也當作 B 鍵功能
            if (currentEvent === 'ending') {
                confirmFinish();
                return;
            }

            // 如果不是結算狀態，但沒按到映射鍵就跳過
            if (!mappedBtn) return;

            if (currentEvent === 'talk') {
                if (mappedBtn === 'UP') {
                    setTalkSelectIdx(p => (p - 1 + 3) % 3);
                } else if (mappedBtn === 'DOWN' || mappedBtn === 'A') {
                    setTalkSelectIdx(p => (p + 1) % 3);
                } else if (mappedBtn === 'B') {
                    handleTalkChoice(talkSelectIdx);
                }
                return;
            }

            if (currentEvent === 'cards') {
                const len = cardChoices.length;
                if (mappedBtn === 'UP') {
                    setTalkSelectIdx(p => (p - 1 + len) % len);
                } else if (mappedBtn === 'DOWN' || mappedBtn === 'A') {
                    setTalkSelectIdx(p => (p + 1) % len);
                } else if (mappedBtn === 'B') {
                    handleCardChoice(cardChoices[talkSelectIdx]);
                }
                return;
            }

            if (currentEvent === 'jokers') {
                const len = jokerChoices.length;
                if (mappedBtn === 'UP') {
                    setTalkSelectIdx(p => (p - 1 + len) % len);
                } else if (mappedBtn === 'DOWN' || mappedBtn === 'A') {
                    setTalkSelectIdx(p => (p + 1) % len);
                } else if (mappedBtn === 'B') {
                    handleJokerChoice(jokerChoices[talkSelectIdx]);
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown, true);
        return () => window.removeEventListener('keydown', handleKeyDown, true);
    }, [currentEvent, talkSelectIdx, cardChoices, jokerChoices, handleTalkChoice, handleCardChoice, handleJokerChoice, confirmFinish]);

    // ==========================================
    // 渲染
    // ==========================================
    const bgOffset = -progress * 12;
    const base = import.meta.env.BASE_URL;

    return (
        <div
            className="absolute inset-0 z-[150] overflow-hidden flex flex-col"
            style={{ fontFamily: "'DotGothic16', monospace" }}
            onPointerDown={() => {
                if (currentEvent === 'ending') confirmFinish();
            }}
        >

            {/* === 背景層 (修正滾動方向：由左向右移動) === */}
            <div className="absolute inset-0 z-0" style={{
                backgroundImage: `url("${base}assets/BG/談心系統背景.png")`,
                backgroundSize: 'auto 100%',
                backgroundRepeat: 'repeat-x',
                // 修正為正值，讓背景向右跑，怪獸就會像在向左前進
                backgroundPositionX: `${progress * 3.2}px`,
                backgroundPositionY: 'center'
            }}>
                <div className={`absolute inset-0 transition-all duration-500 ${currentEvent ? 'bg-black/40 backdrop-blur-[2px]' : 'bg-blue-900/10'}`}></div>
            </div>

            {/* 由自定義背景圖提供地面，故移除舊有地面層 */}

            {/* === 結果浮動文字 === */}
            {resultText && (
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 z-[200] whitespace-nowrap pointer-events-none"
                    style={{
                        color: resultText.color, fontSize: '12px', fontWeight: '900',
                        textShadow: '2px 2px 0 #000, -1px -1px 0 #000',
                        animation: 'resultFloat 1.2s ease-out forwards'
                    }}>
                    {resultText.text}
                </div>
            )}

            {/* === 頂部 HUD (Premium Style) === */}
            <div className="relative z-[110] p-2 flex justify-between items-start">
                <div className="bg-[#383a37]/60 backdrop-blur-[4px] rounded-lg p-2 border border-white/20 shadow-lg">
                    <div className="flex flex-col gap-1.5">
                        {/* Progress Bar */}
                        <div>
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter">探索進度</span>
                                <span className="text-[10px] font-black text-[#4fc3f7]">{Math.floor(progress)}%</span>
                            </div>
                            <div className="w-[100px] h-[5px] bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5">
                                <div className="h-full rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4fc3f7, #81d4fa)' }} />
                            </div>
                        </div>

                        {/* Energy Bar */}
                        <div>
                            <div className="flex justify-between items-center mb-0.5">
                                <span className="text-[9px] font-black text-white/80 uppercase tracking-tighter">活力能量</span>
                                <span className="text-[10px] font-black text-[#ffca28]">{Math.floor(energy)}</span>
                            </div>
                            <div className="w-[100px] h-[5px] bg-black/40 rounded-full overflow-hidden p-[1px] border border-white/5">
                                <div className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${energy}%`,
                                        background: energy > 30 ? 'linear-gradient(90deg, #ffca28, #ffd54f)' : 'linear-gradient(90deg, #ff5252, #ff8a80)'
                                    }} />
                            </div>
                        </div>
                    </div>

                    {/* Active Buffs (Grouped) */}
                    {activeBuffs.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap max-w-[110px]">
                            {(() => {
                                const counts = activeBuffs.reduce((acc, b) => {
                                    acc[b] = (acc[b] || 0) + 1;
                                    return acc;
                                }, {});
                                return Object.entries(counts).map(([effect, count]) => {
                                    const card = SOUL_CARDS.find(c => c.effect === effect);
                                    if (!card) return null;
                                    return (
                                        <div key={effect} className="flex items-center bg-white/10 backdrop-blur-sm rounded border border-white/10 px-1 gap-0.5" title={`${card.name} Lv.${count}`}>
                                            <span className="text-[10px]">{card.icon}</span>
                                            {count > 1 && <span className="text-[8px] font-black text-[#ffca28]">{count}</span>}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>

                <button
                    onClick={finishExpedition}
                    className="bg-[#ff5252]/80 backdrop-blur-sm text-white text-[9px] font-black px-3 py-1.5 rounded-full border border-white/30 active:scale-95 transition-transform"
                    style={{ textShadow: '1px 1px 0 rgba(0,0,0,0.5)' }}
                >
                    結束談心
                </button>
            </div>

            {/* === 怪獸角色 (縮小比例，減少顆粒感) === */}
            <div className="absolute z-[105] flex flex-col items-center"
                style={{ bottom: '-10%', left: '50%', transform: 'translateX(-50%)' }}>
                <div className={currentEvent === null ? 'expedition-walk' : ''}>
                    <DitheredSprite
                        id={monsterId}
                        scale={4}
                        pure={true}
                        animated={true}
                    />
                </div>
            </div>

            {/* ======================================== */}
            {/* === 事件介面 === */}
            {/* ======================================== */}

            {/* --- 靈魂談心 (Soul Talk) --- */}
            {currentEvent === 'talk' && (
                <div className="absolute inset-x-4 bottom-4 z-[120] animate-slide-up">
                    <div className="bg-[#383a37]/80 backdrop-blur-[6px] border-2 border-white/20 shadow-xl p-3 flex flex-col rounded-xl">
                        <div className="text-[13px] font-black text-white mb-3 leading-tight [text-shadow:0_0_4px_rgba(255,255,255,0.5)] flex items-center gap-2">
                            <span className="text-[16px]">💬</span>
                            {SOUL_QUESTIONS[qIdx]?.q}
                        </div>
                        <div className="flex flex-col gap-1.5 w-full">
                            {SOUL_QUESTIONS[qIdx]?.options.map((opt, i) => (
                                <div
                                    key={i}
                                    onClick={() => handleTalkChoice(i)}
                                    className={`text-[11px] leading-[1.3] font-bold px-3 py-2 rounded-lg border-2 transition-all cursor-pointer
                                        ${talkSelectIdx === i
                                            ? 'bg-white/20 border-white/40 text-[#ffca28] [text-shadow:0_0_4px_#ffca28] scale-[1.02]'
                                            : 'bg-black/20 border-white/5 text-white/70'
                                        }`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="font-black shrink-0 opacity-50">{['A', 'B', 'C'][i]}.</span>
                                        <span>{opt.label}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-[8px] text-white/40 mt-3 text-center font-black tracking-widest">
                            [A] 切換選項　[B] 確認選擇
                        </div>
                    </div>
                </div>
            )}

            {/* --- 能力覺醒 (Card Selection) --- */}
            {currentEvent === 'jokers' && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-[5px] p-4">
                    <div className="bg-[#2b2538]/95 border-2 border-[#ffca28]/50 shadow-2xl p-3 w-full max-w-[230px] flex flex-col items-center rounded-2xl animate-slide-up">
                        <div className="text-[13px] font-black text-[#ffca28] mb-1 [text-shadow:0_0_8px_rgba(255,202,40,0.5)]">
                            🃏 小丑牌事件 🃏
                        </div>
                        <div className="text-[11px] text-white/60 mb-3 font-bold tracking-tight text-center">三選一，小丑牌會改變後續談心規則</div>
                        <div className="flex flex-col gap-1.5 w-full">
                            {jokerChoices.map((card, i) => (
                                <div
                                    key={card.id}
                                    onClick={() => handleJokerChoice(card)}
                                    className={`px-2 py-1.5 rounded-lg border transition-all flex items-center gap-2
                                        ${talkSelectIdx === i
                                            ? 'bg-[#ffca28]/20 border-[#ffca28] text-[#ffca28] scale-[1.02] shadow-[0_0_10px_rgba(255,202,40,0.18)]'
                                            : 'bg-black/25 border-white/10 text-white/65 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="text-[16px] bg-white/10 w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 shadow-inner">
                                        {card.icon}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-[10px] font-black truncate">{card.name}</div>
                                        <div className="text-[7px] opacity-70 leading-tight line-clamp-2">{card.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-[7px] text-white/25 mt-3 font-black tracking-widest">
                            [A] 切換選項 • [B] 接受小丑牌
                        </div>
                    </div>
                </div>
            )}

            {currentEvent === 'cards' && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-[4px] p-4">
                    <div className="bg-[#383a37]/90 border-2 border-white/20 shadow-2xl p-3 w-full max-w-[210px] flex flex-col items-center rounded-2xl animate-slide-up">
                        <div className="text-[13px] font-black text-[#ffca28] mb-1 [text-shadow:0_0_8px_rgba(255,202,40,0.5)]">
                            ✦ 能力覺醒 ✦
                        </div>
                        <div className="text-[12px] text-white/50 mb-4 font-bold tracking-tight text-center">三選一，加護將持續整趟談心</div>
                        <div className="flex flex-col gap-1.5 w-full">
                            {cardChoices.map((card, i) => (
                                <div
                                    key={card.id}
                                    onClick={() => handleCardChoice(card)}
                                    className={`px-2 py-1.5 rounded-lg border transition-all flex items-center gap-2
                                        ${talkSelectIdx === i
                                            ? 'bg-white/20 border-[#ffca28] text-[#ffca28] scale-[1.02] shadow-[0_0_10px_rgba(255,202,40,0.15)]'
                                            : 'bg-black/20 border-white/5 text-white/60 hover:bg-white/5'
                                        }`}
                                >
                                    <div className="text-[16px] bg-white/10 w-8 h-8 flex items-center justify-center rounded-lg border border-white/10 shadow-inner">
                                        {card.icon}
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="text-[10px] font-black truncate">{card.name}</div>
                                        <div className="text-[7px] opacity-60 leading-tight line-clamp-1">{card.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-[7px] text-white/20 mt-3 font-black tracking-widest">
                            [A] 切換選項 • [B] 覺醒加護
                        </div>
                    </div>
                </div>
            )}

            {/* --- 結算畫面 (Ending) --- */}
            {currentEvent === 'ending' && (
                <div className="absolute inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-[6px] p-3">
                    <div className="bg-[#383a37]/90 border-2 border-white/20 shadow-2xl p-3 w-full max-w-[200px] flex flex-col items-center rounded-2xl animate-pop-in">
                        <div className="text-[12px] font-black text-white mb-2 [text-shadow:0_0_10px_rgba(255,255,255,0.5)]">
                            {progressRef.current >= 100 ? '🎊 談心完成！' : '談心結束'}
                        </div>

                        <div className="w-full space-y-1.5">
                            <div className="bg-black/30 rounded-lg p-1.5 border border-white/10 space-y-0.5">
                                <div className="flex justify-between items-center text-[8px]">
                                    <span className="text-white/40">探索進度</span>
                                    <span className="text-white font-black">{Math.floor(progressRef.current)}%</span>
                                </div>
                                <div className="flex justify-between items-center text-[8px]">
                                    <span className="text-white/40">累積羈絆</span>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[#ffca28] font-black">+{statsRef.current.bond}</span>
                                        {progressRef.current >= 100 && (
                                            <span className="text-[7px] text-[#ffca28]/60">(含終點獎勵 +10)</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-[8px]">
                                    <span className="text-white/40">剩餘活力</span>
                                    <span className="text-[#4caf50] font-black">{Math.floor(energyRef.current)}</span>
                                </div>
                            </div>

                            {/* Affinity Points */}
                            {Object.entries(statsRef.current.affinities).filter(([_, v]) => v > 0).length > 0 && (
                                <div className="bg-blue-900/20 rounded-lg p-2 border border-white/10">
                                    <div className="text-[7px] font-black text-white/20 uppercase mb-1">屬性親和</div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(statsRef.current.affinities)
                                            .filter(([_, v]) => v > 0)
                                            .map(([k, v]) => (
                                                <div key={k} className="bg-white/10 rounded-md px-1.5 py-0.5 flex items-center gap-1 border border-white/5">
                                                    <span className="text-[10px]">{k === 'fire' ? '🔥' : k === 'water' ? '💧' : k === 'grass' ? '🌿' : '🐛'}</span>
                                                    <span className="text-[8px] font-black text-white">{v}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}

                            {/* 個性點數顯示 */}
                            {Object.entries(statsRef.current.tags).filter(([_, v]) => v > 0).length > 0 && (
                                <div className="bg-purple-900/20 rounded-lg p-2 border border-white/10">
                                    <div className="text-[7px] font-black text-white/20 uppercase mb-1">個性傾向</div>
                                    <div className="flex flex-wrap gap-1">
                                        {Object.entries(statsRef.current.tags)
                                            .filter(([_, v]) => v > 0)
                                            .map(([k, v]) => {
                                                const icon = k === 'passionate' ? '☀️' : k === 'stubborn' ? '⛰️' : k === 'rational' ? '❄️' : k === 'gentle' ? '🌸' : '🤡';
                                                return (
                                                    <div key={k} className="bg-white/10 rounded-md px-1.5 py-0.5 flex items-center gap-1 border border-white/5">
                                                        <span className="text-[10px]">{icon}</span>
                                                        <span className="text-[8px] font-black text-white">{v}</span>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="text-[9px] text-[#555] mt-3 animate-pulse font-bold">
                            — 按任意鍵返回 —
                        </div>
                    </div>
                </div>
            )}

            {/* === 內部動畫樣式 === */}
            <style>{`
                @keyframes walkBounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-8px); }
                }
                .expedition-walk {
                    animation: walkBounce 0.35s infinite ease-in-out;
                }
                @keyframes resultFloat {
                    0% { opacity: 0; transform: translate(-50%, 20px); }
                    20% { opacity: 1; transform: translate(-50%, 0); }
                    80% { opacity: 1; transform: translate(-50%, -10px); }
                    100% { opacity: 0; transform: translate(-50%, -40px); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up {
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.9); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-pop-in {
                    animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
};

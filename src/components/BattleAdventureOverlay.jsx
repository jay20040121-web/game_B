import React from 'react';
import { DitheredSprite, DitheredBackSprite } from './SpriteRenderer';
import { getTypeMultiplier, getLevelByPower } from '../monsterData';
import { buildAilmentBadges } from '../utils/ailmentBadgeUtils';

const DAMAGE_DIGIT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/傷害數字.png`;
const HEAL_DIGIT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/回復數字.png`;
const DAMAGE_DIGIT_SIZE = 18;
const DAMAGE_DIGIT_HEIGHT = 29;
const DAMAGE_DIGIT_COLS = 5;
const DAMAGE_DIGIT_ROWS = 2;
const DAMAGE_DIGIT_LOWER_ROW_SHIFT = 20;
const NORMAL_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/普.png`;
const WATER_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/水.png`;
const FIRE_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/火.png`;
const POISON_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/毒.png`;
const GRASS_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/草.png`;
const GHOST_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/鬼.png`;
const FLYING_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/飛.png`;
const BUG_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/蟲.png`;
const ROCK_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/岩.png`;
const FINISHER_HIT_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/必殺技.gif`;
const FORM_CHANGE_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/風格轉換.gif`;
const SUN_CHILD_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/太陽之子.png`;
const RAIN_DOLL_EFFECT_SHEET = `${import.meta.env.BASE_URL}assets/exclusive/effect/雨天娃娃.png`;
const TYPE_EFFECT_DISPLAY_SIZE = 52;
const TYPE_EFFECT_POSITION_OFFSET = 17;
const TYPE_EFFECT_SHEETS = {
    normal: NORMAL_EFFECT_SHEET,
    fire: FIRE_EFFECT_SHEET,
    water: WATER_EFFECT_SHEET,
    poison: POISON_EFFECT_SHEET,
    grass: GRASS_EFFECT_SHEET,
    ghost: GHOST_EFFECT_SHEET,
    flying: FLYING_EFFECT_SHEET,
    bug: BUG_EFFECT_SHEET,
    rock: ROCK_EFFECT_SHEET
};

const STATUS_BADGE_META = {
    burn: { label: '燒', className: 'bg-[#ff5252] text-white' },
    paralysis: { label: '麻', className: 'bg-[#ffca28] text-black' },
    poison: { label: '毒', className: 'bg-[#9c27b0] text-white' },
    sleep: { label: '眠', className: 'bg-[#90a4ae] text-white' },
    freeze: { label: '凍', className: 'bg-[#80deea] text-black' },
    confusion: { label: '混', className: 'bg-[#7e57c2] text-white' },
    'leech-seed': { label: '吸', className: 'bg-[#66bb6a] text-white' },
    trap: { label: '縛', className: 'bg-[#ff9800] text-white' }
};

const getVisibleStatus = (entity, fallbackState) => entity?.status || fallbackState?.status || null;

function TypeDamageEffect({ pop, className = "" }) {
    const canvasRef = React.useRef(null);
    const sheet = TYPE_EFFECT_SHEETS[pop.effectType] || NORMAL_EFFECT_SHEET;

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        let cancelled = false;
        const image = new Image();
        image.onload = () => {
            if (cancelled || !canvasRef.current) return;

            const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            canvasRef.current.width = image.naturalWidth || image.width;
            canvasRef.current.height = image.naturalHeight || image.height;
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                if (g > 170 && r < 90 && b < 90) {
                    data[i + 3] = 0;
                }
            }
            ctx.putImageData(imageData, 0, 0);
        };
        image.src = sheet;

        return () => {
            cancelled = true;
        };
    }, [pop?.id, sheet]);

    return (
        <canvas
            ref={canvasRef}
            key={`${pop.id}-type-effect`}
            className={`pointer-events-none absolute z-[150] type-effect-pop ${className}`}
            style={{
                width: TYPE_EFFECT_DISPLAY_SIZE,
                height: TYPE_EFFECT_DISPLAY_SIZE,
                imageRendering: 'pixelated',
                marginLeft: TYPE_EFFECT_POSITION_OFFSET,
                marginTop: TYPE_EFFECT_POSITION_OFFSET
            }}
        />
    );
}

function DamageEffect({ pop, className = "" }) {
    if (!pop?.effectType && !pop?.effectStyle) return null;

    if (pop.effectStyle === 'finisher') {
        return (
            <div
                key={`${pop.id}-effect`}
                className={`pointer-events-none absolute z-[150] w-[96px] h-[96px] finisher-effect-pop ${className}`}
                style={{
                    backgroundImage: `url("${FINISHER_HIT_EFFECT_SHEET}")`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated'
                }}
            />
        );
    }

    if (pop.effectStyle === 'form_change') {
        return (
            <div
                key={`${pop.id}-effect-form-change`}
                className={`pointer-events-none absolute z-[150] w-[96px] h-[96px] finisher-effect-pop ${className}`}
                style={{
                    backgroundImage: `url("${FORM_CHANGE_EFFECT_SHEET}")`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    imageRendering: 'pixelated'
                }}
            />
        );
    }

    if (!pop.effectType) return null;

    return <TypeDamageEffect pop={pop} className={className} />;
}

function DamageDigits({ pop, className = "", sheet = DAMAGE_DIGIT_SHEET }) {
    if (!pop?.value) return null;

    const digits = String(Math.max(0, Math.floor(pop.value))).split('');

    return (
        <div
            className={`pointer-events-none absolute z-[160] ${className}`}
        >
            <div key={pop.id} className="flex items-center justify-center gap-0.5 damage-number-pop">
                {digits.map((digit, idx) => {
                    const n = Number(digit);
                    if (n < 0 || n > 9) {
                        return (
                            <span
                                key={`${pop.id}-${idx}`}
                                className="text-[18px] leading-none font-black text-[#ffca28]"
                            >
                                {digit}
                            </span>
                        );
                    }

                    const x = n % DAMAGE_DIGIT_COLS;
                    const y = Math.floor(n / DAMAGE_DIGIT_COLS);
                    const digitOffsetY = y === 1 ? DAMAGE_DIGIT_LOWER_ROW_SHIFT : 0;

                    return (
                        <span
                            key={`${pop.id}-${idx}`}
                            className="block w-[18px] h-[29px]"
                            style={{
                                backgroundImage: `url("${sheet}")`,
                                backgroundSize: `${DAMAGE_DIGIT_SIZE * DAMAGE_DIGIT_COLS}px ${DAMAGE_DIGIT_HEIGHT * DAMAGE_DIGIT_ROWS}px`,
                                backgroundPosition: `${-x * DAMAGE_DIGIT_SIZE}px ${-y * DAMAGE_DIGIT_HEIGHT}px`,
                                imageRendering: 'pixelated',
                                mixBlendMode: 'multiply',
                                transform: `translateY(${digitOffsetY}px)`
                            }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

function HealDigits({ pop, className = "" }) {
    return <DamageDigits pop={pop} className={className} sheet={HEAL_DIGIT_SHEET} />;
}

function StatusRecoveryCue({ status, className = '' }) {
    const [visible, setVisible] = React.useState(false);
    const prevStatusRef = React.useRef(status);
    const timerRef = React.useRef(null);

    React.useEffect(() => {
        const prev = prevStatusRef.current;
        if (prev && !status) {
            setVisible(true);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                setVisible(false);
                timerRef.current = null;
            }, 1200);
        }
        prevStatusRef.current = status;
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [status]);

    if (!visible) return null;

    return (
        <div className={`pointer-events-none absolute z-[165] ${className}`}>
            <div className="bg-[#383a37]/95 border border-white/20 px-2 py-1 text-[8px] font-black text-[#ffca28] shadow-[2px_2px_0_rgba(0,0,0,0.35)] rounded-sm whitespace-nowrap">
                異常狀態即將解除
            </div>
        </div>
    );
}

const getBattleTraitEffect = (trait) => {
    if (trait?.id === 'sun_child' || trait?.name === '太陽之子') return { sheet: SUN_CHILD_EFFECT_SHEET, tone: 'sun' };
    if (trait?.id === 'rain_doll' || trait?.name === '雨天娃娃') return { sheet: RAIN_DOLL_EFFECT_SHEET, tone: 'rain' };
    return null;
};

function BattleTraitEffect({ effect, className = '' }) {
    const [imageReady, setImageReady] = React.useState(true);

    React.useEffect(() => {
        setImageReady(true);
    }, [effect?.sheet, className]);

    if (!effect?.sheet || !imageReady) return null;

    return (
        <img
            src={effect.sheet}
            alt=""
            className={`pointer-events-none absolute z-[25] w-[42px] h-[42px] object-contain trait-scene-effect ${effect.tone === 'rain' ? 'trait-scene-effect-rain' : 'trait-scene-effect-sun'} ${className}`}
            style={{ imageRendering: 'pixelated' }}
            onError={() => setImageReady(false)}
        />
    );
}

function BattleMonsterSprite({ side, hitPop, children }) {
    const [hitId, setHitId] = React.useState(null);
    const [resetTick, setResetTick] = React.useState(0);
    const timerRef = React.useRef(null);

    React.useEffect(() => {
        if (!hitPop?.id) return undefined;
        setHitId(hitPop.id);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setHitId(null);
            setResetTick(tick => tick + 1);
            timerRef.current = null;
        }, 340);
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [hitPop?.id]);

    const isHit = !!hitId;
    const renderKey = isHit ? `${side}-hit-${hitId}` : `${side}-idle-${resetTick}`;

    return (
        <div
            key={renderKey}
            className={isHit ? 'monster-hit-shake' : ''}
            onAnimationEnd={() => {
                setHitId(null);
                setResetTick(tick => tick + 1);
            }}
        >
            {children}
        </div>
    );
}

export default function BattleAdventureOverlay({
    isAdvMode,
    isTournamentOpen,
    battleState,
    pvp,
    isLeaderboardOpen = false,
    advCD,
    advStats,
    fetchLeaderboard,
    startTournament,
    advLogRef,
    advLog,
    advCurrentHP,
    isAdvStreaming,
    pendingWildCapture,
    modeLabel = null
}) {
    // 從封裝好的 pvp 物件中解構出需要的狀態與方法
    const {
        isPvpMode, matchStatus, myPeerId,
        pvpRoomPassword, setPvpRoomPassword, joinPvpRoom
    } = pvp;

    // 嚴格檢查：如果是大賽模式且戰鬥未開始，或者是其他模式未開啟，就隱藏 (避免洩漏大廳/冒險介面)
    // 但如果玩家主動開啟了冒險或 PvP 模式，則不應該被大賽的殘留狀態阻擋
    if (!isAdvMode && !isPvpMode) {
        if (battleState.mode === 'tournament' && !battleState.active) return null;
        if (battleState.mode !== 'tournament' || !isTournamentOpen) return null;
    }

    const enemyStatus = getVisibleStatus(battleState?.enemy, battleState?.enemyFinalState);
    const playerStatus = getVisibleStatus(battleState?.player, battleState?.playerFinalState);

    return (
        <div className="absolute inset-0 z-[110] flex flex-col items-center justify-start p-1" style={{
            backgroundImage: `url("${import.meta.env.BASE_URL}assets/BG/${battleState.active ? '對戰底圖.png' : '共用底圖.png'}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
        }}>
            <div className="absolute inset-0 bg-blue-900/40 z-0"></div>

            <div className="w-full bg-[#383a37]/55 backdrop-blur-sm text-white text-[10px] px-2 py-1 flex justify-between items-center mb-1 relative z-10 shadow-sm">
                <span>{modeLabel || (battleState.mode === 'tournament' ? '聯盟大賽' : (isPvpMode ? '宇宙連線對戰' : '冒險模式'))} {battleState.active ? '[戰鬥中]' : ''}</span>
                <span>{isPvpMode || battleState.mode === 'tournament' ? (matchStatus === 'searching' ? '搜尋中...' : '對決中') : (advCD > 0 && !battleState.active ? `冷卻中 ${Math.floor(advCD / 60)}:${(advCD % 60).toString().padStart(2, '0')}` : '準備就緒')}</span>
            </div>

            {battleState.active ? (
                <div className="flex-1 w-full relative pb-1 z-10">
                    <style>{`
                        @keyframes damage-number-pop {
                            0% { opacity: 0; transform: translateY(8px) scale(0.8); }
                            18% { opacity: 1; transform: translateY(0) scale(1.18); }
                            72% { opacity: 1; transform: translateY(-14px) scale(1.05); }
                            100% { opacity: 0; transform: translateY(-30px) scale(0.95); }
                        }
                        .damage-number-pop {
                            animation: damage-number-pop 1150ms ease-out both;
                        }
                        @keyframes water-effect-pop {
                            0% { opacity: 0; transform: translateY(4px) scale(0.82); }
                            14% { opacity: 0.95; transform: translateY(0) scale(1); }
                            70% { opacity: 0.7; transform: translateY(-6px) scale(1.08); }
                            100% { opacity: 0; transform: translateY(-12px) scale(1.18); }
                        }
                        .water-effect-pop {
                            animation: water-effect-pop 820ms ease-out both;
                        }
                        @keyframes type-effect-pop {
                            0% { opacity: 0; transform: translateY(8px) scale(0.58) rotate(-8deg); }
                            12% { opacity: 1; transform: translateY(0) scale(1.04) rotate(3deg); }
                            38% { opacity: 0.96; transform: translateY(-3px) scale(1.12) rotate(-2deg); }
                            72% { opacity: 0.72; transform: translateY(-6px) scale(1.2) rotate(1deg); }
                            100% { opacity: 0; transform: translateY(-12px) scale(1.32) rotate(0deg); }
                        }
                        .type-effect-pop {
                            animation: type-effect-pop 900ms steps(2, end) both;
                            transform-origin: center center;
                        }
                        @keyframes finisher-effect-pop {
                            0% { opacity: 0; transform: translateY(6px) scale(0.72) rotate(-4deg); }
                            16% { opacity: 1; transform: translateY(0) scale(1.08) rotate(2deg); }
                            62% { opacity: 0.95; transform: translateY(-4px) scale(1.16) rotate(-1deg); }
                            100% { opacity: 0; transform: translateY(-12px) scale(1.28) rotate(0deg); }
                        }
                        .finisher-effect-pop {
                            animation: finisher-effect-pop 900ms ease-out both;
                        }
                        @keyframes monster-hit-shake {
                            0% { transform: translate(0, 0); }
                            14% { transform: translate(-4px, 0); }
                            28% { transform: translate(4px, -1px); }
                            42% { transform: translate(-3px, 1px); }
                            58% { transform: translate(3px, 0); }
                            74% { transform: translate(-1px, 0); }
                            100% { transform: translate(0, 0); }
                        }
                        .monster-hit-shake {
                            animation: monster-hit-shake 320ms steps(1, end) both;
                            transform-origin: center bottom;
                        }
                        @keyframes trait-scene-effect {
                            0%, 100% { opacity: 0.78; transform: translateY(0) scale(1); }
                            50% { opacity: 1; transform: translateY(-2px) scale(1.06); }
                        }
                        .trait-scene-effect {
                            animation: trait-scene-effect 1800ms ease-in-out infinite;
                        }
                        .trait-scene-effect-sun {
                            filter: drop-shadow(0 0 10px rgba(255, 210, 64, 0.9));
                        }
                        .trait-scene-effect-rain {
                            filter: drop-shadow(0 0 10px rgba(80, 210, 255, 0.9));
                        }
                    `}</style>
                    {getBattleTraitEffect(battleState?.enemy?.trait) && (
                        <BattleTraitEffect effect={getBattleTraitEffect(battleState.enemy.trait)} className="right-[12px] top-[10px]" />
                    )}
                    {getBattleTraitEffect(battleState?.player?.trait) && (
                        <BattleTraitEffect effect={getBattleTraitEffect(battleState.player.trait)} className="left-[104px] bottom-[122px]" />
                    )}
                    {/* Enemy Area */}
                    <div className="absolute top-2 left-2 flex flex-col items-start min-w-[100px] z-20 bg-white/12 backdrop-blur-sm border-2 border-white/20 rounded-md p-1 pl-2 shadow-sm">
                        <div className="flex items-center gap-1">
                            <div className="text-[10px] font-bold text-white truncate w-[60px] leading-tight">{battleState?.enemy?.name}</div>
                            {enemyStatus && (
                                <span className={`text-[8px] px-1 rounded-sm border border-black/20 font-black ${STATUS_BADGE_META[enemyStatus]?.className || 'bg-gray-400 text-white'}`}>
                                    {STATUS_BADGE_META[enemyStatus]?.label || '狀'}
                                </span>
                            )}
                        </div>
                        <div className="w-20 h-2 bg-[#383a37] border border-[#1a1a1a] rounded-sm overflow-hidden mt-1 shadow-inner relative">
                            <div className="h-full transition-all duration-300 absolute left-0 top-0 z-[1]" style={{ width: `${Math.min(100, (battleState?.enemy?.hp / battleState?.enemy?.maxHp) * 100)}%`, backgroundColor: (battleState?.enemy?.hp / battleState?.enemy?.maxHp) > 0.5 ? '#2ecc71' : (battleState?.enemy?.hp / battleState?.enemy?.maxHp) > 0.25 ? '#f1c40f' : '#e74c3c' }} />
                            {false && battleState?.enemy?.hp > battleState?.enemy?.maxHp && (
                                <div className="h-full transition-all duration-300 absolute left-0 top-0 bg-[#4dd0e1] z-[2] opacity-80" style={{ width: `${Math.min(100, ((battleState.enemy.hp - battleState.enemy.maxHp) / battleState.enemy.maxHp) * 100)}%` }} />
                            )}
                        </div>
                        {(battleState?.enemy?.shield || 0) > 0 && (
                            <div className="w-20 h-1.5 bg-[#12343b] border border-[#1a1a1a] rounded-sm overflow-hidden mt-0.5 shadow-inner relative">
                                <div className="h-full transition-all duration-300 absolute left-0 top-0 bg-[#4dd0e1]" style={{ width: `${Math.min(100, ((battleState.enemy.shield || 0) / (battleState.enemy.maxHp || 1)) * 100)}%` }} />
                            </div>
                        )}
                        {(battleState?.enemy?.shield || 0) > 0 && (
                            <div className="text-[8px] font-black text-[#80deea] mt-0.5 text-left w-full">
                                🛡️ {battleState.enemy.shield}
                            </div>
                        )}
                    </div>
                    <StatusRecoveryCue status={enemyStatus} className="left-3 top-[58px]" />
                    <div className="absolute -top-16 right-0 z-10">
                        <div className="relative transform scale-[1.1]">
                            <BattleMonsterSprite
                                side="enemy"
                                hitPop={battleState.damagePop?.target === 'enemy' ? battleState.damagePop : null}
                            >
                                <DitheredSprite id={battleState?.enemy?.id} scale={2} normalizePokemonBattleSize />
                            </BattleMonsterSprite>
                        </div>
                        <div className="pointer-events-none absolute inset-0 z-[140]">
                            {battleState.damagePop?.target === 'enemy' && (
                                <>
                                    <DamageEffect
                                        key={`${battleState.damagePop.id}-effect`}
                                        pop={battleState.damagePop}
                                        className="left-[20%] top-[40%] -translate-x-1/2 -translate-y-1/2"
                                    />
                                    <DamageDigits
                                        key={battleState.damagePop.id}
                                        pop={battleState.damagePop}
                                        className="left-1/2 top-[68%] -translate-x-1/2 -translate-y-1/2"
                                    />
                                </>
                            )}
                            {battleState.healPop?.target === 'enemy' && (
                                <HealDigits
                                    key={battleState.healPop.id}
                                    pop={battleState.healPop}
                                    className="left-1/2 top-[64%] -translate-x-1/2 -translate-y-1/2"
                                />
                            )}
                        </div>
                    </div>

                    {/* Player Area */}
                    <div className="absolute bottom-6 -left-2 z-10 px-2">
                        <div className="relative transform scale-[1.4] origin-bottom">
                            <BattleMonsterSprite
                                side="player"
                                hitPop={battleState.damagePop?.target === 'player' ? battleState.damagePop : null}
                            >
                                <DitheredBackSprite id={battleState?.player?.id} scale={2} normalizePokemonBattleSize battleVisibleScale={1.15} />
                            </BattleMonsterSprite>
                        </div>
                        <div className="pointer-events-none absolute inset-0 z-[140]">
                            {battleState.damagePop?.target === 'player' && (
                                <>
                                    <DamageEffect
                                        key={`${battleState.damagePop.id}-effect`}
                                        pop={battleState.damagePop}
                                        className="left-[20%] top-[32%] -translate-x-1/2 -translate-y-1/2"
                                    />
                                    <DamageDigits
                                        key={battleState.damagePop.id}
                                        pop={battleState.damagePop}
                                        className="left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2"
                                    />
                                </>
                            )}
                            {battleState.healPop?.target === 'player' && (
                                <HealDigits
                                    key={battleState.healPop.id}
                                    pop={battleState.healPop}
                                    className="left-1/2 top-[56%] -translate-x-1/2 -translate-y-1/2"
                                />
                            )}
                        </div>
                    </div>
                    <div className="absolute bottom-16 right-2 flex flex-col items-end min-w-[100px] z-20 bg-white/12 backdrop-blur-sm border-2 border-white/20 rounded-md p-1 pr-2 shadow-sm">
                        <div className="flex items-center gap-1">
                            {playerStatus && (
                                <span className={`text-[8px] px-1 rounded-sm border border-black/20 font-black ${STATUS_BADGE_META[playerStatus]?.className || 'bg-gray-400 text-white'}`}>
                                    {STATUS_BADGE_META[playerStatus]?.label || '狀'}
                                </span>
                            )}
                            <div className="text-[10px] font-bold text-white text-right truncate">等級 {getLevelByPower(advStats?.basePower ?? 100)}</div>
                        </div>
                        <div className="w-20 h-2 bg-[#383a37] border border-[#1a1a1a] rounded-sm overflow-hidden mt-1 shadow-inner relative">
                            <div className="h-full transition-all duration-300 absolute left-0 top-0 z-[1]" style={{ width: `${Math.min(100, ((battleState?.player?.hp || 0) / (battleState?.player?.maxHp || 1)) * 100)}%`, backgroundColor: ((battleState?.player?.hp || 0) / (battleState?.player?.maxHp || 1)) > 0.5 ? '#2ecc71' : ((battleState?.player?.hp || 0) / (battleState?.player?.maxHp || 1)) > 0.25 ? '#f1c40f' : '#e74c3c' }} />
                            {false && battleState?.player?.hp > battleState?.player?.maxHp && (
                                <div className="h-full transition-all duration-300 absolute left-0 top-0 bg-[#4dd0e1] z-[2] opacity-80" style={{ width: `${Math.min(100, ((battleState.player.hp - battleState.player.maxHp) / battleState.player.maxHp) * 100)}%` }} />
                            )}
                        </div>
                        {(battleState?.player?.shield || 0) > 0 && (
                            <div className="w-20 h-1.5 bg-[#12343b] border border-[#1a1a1a] rounded-sm overflow-hidden mt-0.5 shadow-inner relative">
                                <div className="h-full transition-all duration-300 absolute left-0 top-0 bg-[#4dd0e1]" style={{ width: `${Math.min(100, ((battleState.player.shield || 0) / (battleState.player.maxHp || 1)) * 100)}%` }} />
                            </div>
                        )}
                        {(battleState?.player?.shield || 0) > 0 && (
                            <div className="text-[8px] font-black text-[#80deea] mt-0.5 text-right w-full">
                                🛡️ {battleState.player.shield}
                            </div>
                        )}
                    </div>
                    <StatusRecoveryCue status={playerStatus} className="right-3 bottom-[82px]" />
                    {(battleState?.phase === 'action_streaming' || battleState?.phase === 'waiting_opponent') && (
                        <div className="absolute left-1/2 top-[33%] -translate-x-1/2 z-[145] bg-[#383a37]/75 backdrop-blur-md border border-white/20 px-3 py-1 text-[8px] font-black text-[#ffca28] shadow-[2px_2px_0_rgba(0,0,0,0.35)]">
                            {battleState?.phase === 'waiting_opponent' && battleState?.mode === 'pvp'
                                ? '等待對手判斷中'
                                : '上一回合判斷中'}
                        </div>
                    )}

                    {/* 戰鬥播報對話框 (Transient Overlay) */}
                    {(battleState?.phase === 'action_streaming' || battleState?.phase === 'waiting_opponent') && battleState?.activeMsg && (
                        <div className="absolute w-[68%] left-[16%] top-[40%] bg-white/20 backdrop-blur-md border-[3px] border-white/30 p-1.5 z-[150] shadow-[4px_4px_0_rgba(0,0,0,0.3)]">
                            <div className="text-[9px] font-black text-white leading-tight break-words text-center">
                                {battleState?.activeMsg}
                            </div>
                        </div>
                    )}

                    {/* Dialogue Box & Menu Area */}
                    <div className="absolute bottom-1 left-1 right-1 h-[55px] bg-white/12 backdrop-blur-md border-[3px] border-white/20 rounded-sm p-1 flex flex-col shadow-inner z-30">
                        {(battleState.mode === 'trainer' || battleState.mode === 'pvp' || battleState.mode === 'tournament') && battleState.phase === 'player_action' ? (
                            <div className="grid grid-cols-2 gap-1 h-full font-bold text-[10px] text-white">
                                {[0, 1, 2, 3].map((idx) => {
                                    const move = battleState.player?.moves?.[idx];
                                    const isSelected = (battleState.menuIdx || 0) === idx;

                                    // ⚡ 屬性相剋色彩邏輯
                                    let moveColor = isSelected ? '#8fa07e' : 'white';
                                    if (move && battleState.enemy) {
                                        const mult = getTypeMultiplier(move.type, battleState.enemy.type);
                                        if (mult > 1) moveColor = '#ff5252'; // 2.0x 紅色 (效果絕佳)
                                        else if (mult < 1) moveColor = '#2ecc71'; // 0.5x 綠色 (效果不好)
                                    }

                                    return (
                                        <div
                                            key={idx}
                                            style={{ color: moveColor }}
                                            className={`border-2 flex items-center justify-center transition-all relative ${isSelected
                                                ? 'border-[#1a1a1a] bg-[#383a37] invert-0'
                                                : 'border-[#1a1a1a] bg-[#ccd6be]/20'
                                                } ${!move ? 'opacity-30 border-dashed' : ''}`}
                                        >
                                            {move ? (
                                                <div className="flex flex-wrap items-center gap-0.5 justify-center">
                                                    <span>{move.name}</span>
                                                    {(() => {
                                                        const enchantData = battleState?.player?.moveUpgrades?.[move.id]?.ailments
                                                            || advStats?.moveUpgrades?.[move.id]?.ailments
                                                            || {};
                                                        const badges = buildAilmentBadges({
                                                            primaryAilment: move.ailment,
                                                            enchantData,
                                                            baseClassName: 'text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black'
                                                        });

                                                        return badges.map((badge) => (
                                                            <span
                                                                key={badge.key}
                                                                title={badge.title}
                                                                className={badge.className}
                                                                style={badge.style}
                                                            >
                                                                {badge.label}
                                                            </span>
                                                        ));
                                                    })()}
                                                    {(move.stat_changes && move.stat_changes.some(s => s.change > 0)) && (
                                                        <span className="text-[7px] px-0.5 rounded-[1px] border border-black/10 leading-none py-0.5 font-black bg-[#42a5f5] text-white uppercase">
                                                            Buff
                                                        </span>
                                                    )}
                                                </div>
                                            ) : '---'}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="w-full h-full overflow-hidden text-[10px] leading-tight font-bold text-white px-1 flex flex-col justify-end">
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
                        isLeaderboardOpen ? null : (
                        (matchStatus === 'searching' || matchStatus === 'idle') ? (
                            <div className="flex-1 flex flex-col items-center justify-start p-2 w-full relative z-10">
                                <div className="text-[11px] font-black text-white mb-1 border-b-2 border-white/30 w-full text-center pb-0.5 uppercase tracking-widest">宇宙大廳</div>

                                <div className="w-full flex flex-col gap-1 mb-2 mt-1">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[8px] font-black text-white/80">🚪 房間密碼</span>
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
                                        className={`w-full border-2 border-[#1a1a1a] p-1.5 text-[11px] outline-none font-mono text-center tracking-[0.2em] font-black placeholder:tracking-normal ${matchStatus === 'searching' ? 'bg-gray-200 opacity-50' : 'bg-[#ccd6be]'}`}
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


                                </div>

                                <div className="mt-auto text-[8px] font-black text-white opacity-60 flex flex-col items-center gap-0.5">
                                    <span>相同密碼即可連線</span>
                                    <div className="flex gap-2 text-white/70 underline decoration-dotted">
                                        <span>[C] 取消</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-2 w-full">
                                <div className="text-[12px] font-bold animate-pulse">連線建立中...</div>
                            </div>
                        ))
                    ) : (
                        <>
                            <div
                                ref={advLogRef}
                                className="flex-1 w-full bg-white/10 border-2 border-white/20 p-2 flex flex-col gap-1 overflow-y-auto relative z-10"
                            >
                                {advLog.length > 0 ? advLog.map((l, i) => (
                                    <div key={i} className="flex flex-col items-center gap-3 mb-8 border-b border-[#383a37]/20 pb-5 last:border-0 last:mb-0 relative animate-fade-in">
                                        {l.iconId && (
                                            <div className="scale-[1.0] w-18 h-18 flex items-center justify-center -mb-2">
                                                <DitheredSprite id={l.iconId} scale={2} />
                                            </div>
                                        )}
                                        <div className="text-[12px] font-bold text-white leading-tight text-center px-1">
                                            {l.msg}
                                        </div>
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
                                <div className="flex justify-between items-center px-1 relative z-10">
                                    <span className="text-[10px] font-bold text-white">血量: {Math.floor(advCurrentHP * 100)}%</span>
                                    <span className="text-[10px] font-bold text-white">
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

            {/* 捕獲確認對話框 (A/B選單模式) */}
            {pendingWildCapture && !isAdvStreaming && (
                <div className="absolute inset-0 z-[130] flex flex-col items-center justify-center p-4 bg-black/60">
                    <div className="w-[180px] bg-white/20 border-4 border-white/30 p-3 shadow-[8px_8px_0_rgba(0,0,0,0.3)] flex flex-col items-center gap-3">
                        <div className="scale-[1.2] -mb-1">
                            <DitheredSprite id={pendingWildCapture.id} scale={2} />
                        </div>
                        <div className="text-white text-[11px] font-black text-center leading-relaxed">
                            ✨ 野生 {pendingWildCapture.name} <br /> 加入了您！<br />是否要更換寵物？
                        </div>
                        <div className="flex w-full gap-3 justify-center">
                            <div className="flex flex-col items-center gap-1">
                                <div className="px-2 py-0.5 bg-[#ffca28] text-[#111] border-2 border-[#1a1a1a] font-black text-[9px]">A：否</div>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <div className="px-2 py-0.5 bg-[#ff5252] text-white border-2 border-[#1a1a1a] font-black text-[9px]">B：是</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
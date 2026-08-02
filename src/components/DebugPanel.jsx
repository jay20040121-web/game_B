import React from 'react';
import { getLevelByPower } from '../monsterData';
import { SKILL_DATABASE } from '../monsterData';
import { getPokemonAbilities } from '../data/monsterTraits';
import { queuePetLetterAiRetry } from '../utils/petLetterSystem';

/**
 * 🛠️ 偵錯面板元件 (Debug Panel)
 * -----------------------------------------
 * 提供給開發者在 Localhost 快速調整進化時間、數值與物品的手動控制器。
 */
const DebugPanel = ({
    show, onClose, debugOverrides, setDebugOverrides,
    advStats, setAdvStats, inventory, setInventory, updateDialogue,
    // --- ✨ 解構新傳入的狀態 ---
    evolutionStage, evolutionBranch, bondValue, setBondValue, talkCount,
    lockedAffinity, setLockedAffinity, soulAffinityCounts, setSoulAffinityCounts, monsterTraits, setMonsterTraits,
    interactionLogs, interactionCount, getMonsterIdWrapped,
    getPowerThreshold,
    battleState, setBattleState,
    petLetters, setPetLetters,
    weatherContext,
    dailyTopics,
    onRefreshExternalLetterContext
}) => {
    if (!show) return null;

    // 使用 React.useState 確保在 Babel 環境下的相容性 (某些舊版編譯器導向)
    const [activeTab, setActiveTab] = React.useState('evo');
    const [evInput, setEvInput] = React.useState({
        hp: advStats.evs.hp,
        atk: advStats.evs.atk,
        def: advStats.evs.def,
        spd: advStats.evs.spd
    });
    const [itemId, setItemId] = React.useState('001');
    const [itemCount, setItemCount] = React.useState(1);
    const [enchantMoveId, setEnchantMoveId] = React.useState(advStats.moves?.[0] || '');
    const [enchantCount, setEnchantCount] = React.useState(0);
    const [enchantJson, setEnchantJson] = React.useState('{}');
    const getTraitStatMod = (trait, key, level = 1) => {
        const modifiers = trait?.modifiers || {};
        const levelMod = level >= (modifiers.thresholdLevel || Infinity)
            ? (modifiers.highLevelStat || 1)
            : (modifiers.lowLevelStat || 1);
        return (modifiers[key] || 1) * levelMod;
    };
    const convertBattleEntityTrait = (entity, currentTrait, nextTrait) => {
        if (!entity) return entity;
        const level = entity.level || getLevelByPower(advStats.basePower);
        const convertStat = (key) => {
            const currentMod = getTraitStatMod(currentTrait, key, level);
            const nextMod = getTraitStatMod(nextTrait, key, level);
            const baseValue = Math.max(1, Math.round(Number(entity[key] || 1) / currentMod));
            return Math.max(1, Math.floor(baseValue * nextMod));
        };
        const nextMaxHp = convertStat('maxHp');
        const hpRatio = (entity.maxHp || 0) > 0 ? Math.max(0, Math.min(1, (entity.hp || 0) / entity.maxHp)) : 1;
        return {
            ...entity,
            hp: Math.max(1, Math.floor(nextMaxHp * hpRatio)),
            maxHp: nextMaxHp,
            atk: convertStat('atk'),
            def: convertStat('def'),
            spd: convertStat('spd'),
            trait: nextTrait
        };
    };
    const letterCount = Object.keys(petLetters?.slots || {}).length;
    const unreadLetterCount = Object.values(petLetters?.slots || {}).filter(letter => letter && !letter.read).length;
    const enchantableMoveIds = React.useMemo(
        () => (advStats.moves || []).filter(moveId => (SKILL_DATABASE[moveId]?.power || 0) > 0),
        [advStats.moves]
    );

    React.useEffect(() => {
        const fallbackMoveId = enchantableMoveIds[0] || '';
        setEnchantMoveId(prev => {
            if (prev && enchantableMoveIds.includes(prev)) return prev;
            return fallbackMoveId;
        });
    }, [enchantableMoveIds]);

    React.useEffect(() => {
        if (!enchantMoveId) {
            setEnchantCount(0);
            setEnchantJson('{}');
            return;
        }
        const moveData = advStats.moveUpgrades?.[enchantMoveId] || {};
        setEnchantCount(moveData.count || 0);
        setEnchantJson(JSON.stringify(moveData.ailments || {}, null, 2));
    }, [enchantMoveId, advStats.moveUpgrades]);

    const totalEvs = Object.values(evInput).reduce((a, b) => a + b, 0);
    const affinityOptions = [
        { id: null, label: '未鎖定' },
        { id: 'fire', label: '火' },
        { id: 'water', label: '水' },
        { id: 'grass', label: '草' },
        { id: 'bug', label: '蟲' }
    ];

    const setDebugAffinity = (affinity) => {
        setLockedAffinity?.(affinity);
        setSoulAffinityCounts?.({
            fire: affinity === 'fire' ? 10 : 0,
            water: affinity === 'water' ? 10 : 0,
            grass: affinity === 'grass' ? 10 : 0,
            bug: affinity === 'bug' ? 10 : 0
        });
        updateDialogue(affinity ? `偵錯： 靈魂屬性鎖定為 ${affinity}` : '偵錯： 已清除靈魂屬性鎖定');
    };

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

    const applyMoveEnchant = () => {
        const moveId = (enchantMoveId || '').trim();
        if (!moveId) {
            alert('請先選擇一個可附魔技能');
            return;
        }

        let parsedAilments = {};
        try {
            const raw = enchantJson.trim();
            parsedAilments = raw ? JSON.parse(raw) : {};
            if (!parsedAilments || typeof parsedAilments !== 'object' || Array.isArray(parsedAilments)) {
                throw new Error('異常效果必須是物件格式');
            }
        } catch (err) {
            alert(`附魔內容格式錯誤：${err.message}`);
            return;
        }

        const nextCount = Number.isFinite(Number(enchantCount)) ? Math.max(0, Math.floor(Number(enchantCount))) : 0;
        setAdvStats(prev => {
            const nextMoveUpgrades = { ...(prev.moveUpgrades || {}) };
            const prevMoveData = nextMoveUpgrades[moveId] || {};
            nextMoveUpgrades[moveId] = {
                ...prevMoveData,
                count: nextCount,
                ailments: parsedAilments
            };
            return {
                ...prev,
                moveUpgrades: nextMoveUpgrades
            };
        });
        updateDialogue(`偵錯：已套用技能附魔「${SKILL_DATABASE[moveId]?.name || moveId}」`);
    };

    const reopenAllPetLetters = () => {
        setPetLetters?.(prev => {
            const nextSlots = {};
            Object.entries(prev?.slots || {}).forEach(([slotId, letter]) => {
                nextSlots[slotId] = { ...letter, read: false, readAt: null };
            });
            return { ...(prev || {}), slots: nextSlots };
        });
        updateDialogue('偵錯： 今日怪獸來信已全部改為未讀');
    };

    const clearPetLetterReplies = () => {
        setPetLetters?.(prev => ({
            ...(prev || {}),
            replies: {},
            lastPlayerReply: null
        }));
        updateDialogue('偵錯： 已清除怪獸來信回信紀錄');
    };

    const clearPetLettersForRegen = () => {
        setPetLetters?.(prev => ({
            date: prev?.date,
            slots: {},
            replies: prev?.replies || {},
            lastPlayerReply: prev?.lastPlayerReply || null,
            letterSeed: Date.now()
        }));
        updateDialogue('偵錯： 已清空今日來信，等待系統重新產生');
    };

    const retryPetLetterAi = (letterId) => {
        setPetLetters?.(prev => queuePetLetterAiRetry(prev, letterId));
        updateDialogue('偵錯： 已排入怪獸來信 人工智慧 重試');
    };

    const renderTopicDebug = (key, label) => {
        const topic = dailyTopics?.topics?.[key];
        return (
            <div style={{ color: '#aaa', fontSize: '11px', lineHeight: 1.5, marginTop: '4px' }}>
                <b style={{ color: '#ddd' }}>{label}</b> [{topic?.source || '無來源'}{topic?.error ? ` / ${topic.error}` : ''}]：{topic?.text || '無資料'}
            </div>
        );
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
                <button onClick={() => setActiveTab('stats')} style={{ padding: '8px 15px', border: 'none', cursor: 'pointer', background: activeTab === 'stats' ? '#e67e22' : '#333', color: 'white' }}>數值調整</button>
                <button onClick={() => setActiveTab('letters')} style={{ padding: '8px 15px', border: 'none', cursor: 'pointer', background: activeTab === 'letters' ? '#e67e22' : '#333', color: 'white' }}>來信</button>
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
                            <div style={{ marginBottom: '5px' }}>冒險冷卻覆蓋 (目前: {debugOverrides.adventureCD === 0 ? '無冷卻' : '預設'})</div>
                            <button style={{ padding: '8px 15px', cursor: 'pointer', background: '#3498db', color: 'white', border: 'none' }} onClick={() => setDebugOverrides(p => ({ ...p, adventureCD: debugOverrides.adventureCD === 0 ? null : 0 }))}>
                                {debugOverrides.adventureCD === 0 ? '恢復預設' : '立即免除冷卻（0 秒）'}
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
                    </div>
                )}

                {activeTab === 'letters' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ padding: '15px', border: '1px solid #f39c12', backgroundColor: '#222', borderRadius: '8px' }}>
                            <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '10px' }}>怪獸來信測試</div>
                            <div style={{ color: '#ccc', fontSize: '12px', marginBottom: '12px', lineHeight: 1.6 }}>
                                日期：{petLetters?.date || '尚未建立'} / 已產生：{letterCount} 封 / 未讀：{unreadLetterCount} 封<br />
                                上一封玩家回信：{petLetters?.lastPlayerReply?.text || '無'}<br />
                                測試時間：{Number.isFinite(debugOverrides.petLetterHour) ? `${debugOverrides.petLetterHour}:00` : '使用目前時間'}<br />
                                天氣：{weatherContext?.status || '未知'} / {Number.isFinite(weatherContext?.apparentTemperature) ? `${Math.round(weatherContext.apparentTemperature)}°C` : '無溫度'} / 降雨{Number.isFinite(weatherContext?.precipitationProbability) ? `${Math.round(weatherContext.precipitationProbability)}%` : '未知'} / 未來雨時數{weatherContext?.nextRainHours ?? 0} / {weatherContext?.source || weatherContext?.reason || '無來源'}<br />
                                今日話題：新聞 {dailyTopics?.topics?.news?.type || '-'} / 歷史 {dailyTopics?.topics?.history?.type || '-'} / 星象 {dailyTopics?.topics?.astro?.type || '-'} / 塔羅 {dailyTopics?.topics?.tarot?.type || '-'}
                            </div>
                            <div style={{ padding: '10px', background: '#181818', border: '1px solid #333', borderRadius: '6px', marginBottom: '12px' }}>
                                <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '6px' }}>外部資訊偵錯</div>
                                <div style={{ color: '#aaa', fontSize: '11px', lineHeight: 1.5 }}>
                                    天氣來源：{weatherContext?.source || '無'} / 原因：{weatherContext?.reason || '無'} / 溫度：{Number.isFinite(weatherContext?.temperature) ? `${weatherContext.temperature}°C` : '無'} / 體感：{Number.isFinite(weatherContext?.apparentTemperature) ? `${weatherContext.apparentTemperature}°C` : '無'} / 天氣代碼：{weatherContext?.weatherCode ?? '無'}
                                </div>
                                {renderTopicDebug('news', '新聞')}
                                {renderTopicDebug('history', '歷史')}
                                {renderTopicDebug('astro', '星象')}
                                {renderTopicDebug('tarot', '塔羅')}
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ color: '#bbb', fontSize: '12px', marginBottom: '6px' }}>來信時間覆蓋</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {[
                                        { label: '目前時間', value: null },
                                        { label: '08:00 無信', value: 8 },
                                        { label: '09:00 早', value: 9 },
                                        { label: '12:00 早中', value: 12 },
                                        { label: '21:00 全部', value: 21 }
                                    ].map(option => {
                                        const active = option.value === null
                                            ? !Number.isFinite(debugOverrides.petLetterHour)
                                            : debugOverrides.petLetterHour === option.value;
                                        return (
                                            <button
                                                key={option.label}
                                                onClick={() => setDebugOverrides(prev => ({ ...prev, petLetterHour: option.value }))}
                                                style={{
                                                    padding: '7px 10px',
                                                    cursor: 'pointer',
                                                    background: active ? '#f39c12' : '#333',
                                                    color: active ? '#111' : 'white',
                                                    border: active ? '1px solid #ffd37a' : '1px solid #555',
                                                    borderRadius: '4px',
                                                    fontWeight: active ? 'bold' : 'normal'
                                                }}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ color: '#bbb', fontSize: '12px', marginBottom: '6px' }}>天氣覆蓋</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {[
                                        { label: '實際天氣', value: null },
                                        { label: '炎熱', value: 'hot' },
                                        { label: '寒冷', value: 'cold' },
                                        { label: '下雨', value: 'rainy' },
                                        { label: '暴風雨', value: 'storm' },
                                        { label: '下雪', value: 'snowy' },
                                        { label: '風大', value: 'windy' },
                                        { label: '陰天', value: 'cloudy' },
                                        { label: '舒適', value: 'comfortable' }
                                    ].map(option => {
                                        const active = option.value === null
                                            ? !debugOverrides.weatherStatus
                                            : debugOverrides.weatherStatus === option.value;
                                        return (
                                            <button
                                                key={option.label}
                                                onClick={() => setDebugOverrides(prev => ({ ...prev, weatherStatus: option.value }))}
                                                style={{
                                                    padding: '7px 10px',
                                                    cursor: 'pointer',
                                                    background: active ? '#f39c12' : '#333',
                                                    color: active ? '#111' : 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                <button
                                    onClick={reopenAllPetLetters}
                                    disabled={letterCount === 0}
                                    style={{ padding: '10px 14px', cursor: letterCount ? 'pointer' : 'not-allowed', background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', opacity: letterCount ? 1 : 0.5 }}
                                >
                                    全部改成未讀
                                </button>
                                <button
                                    onClick={clearPetLettersForRegen}
                                    style={{ padding: '10px 14px', cursor: 'pointer', background: '#2980b9', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                                >
                                    清空今日來信並重產
                                </button>
                                <button
                                    onClick={clearPetLetterReplies}
                                    style={{ padding: '10px 14px', cursor: 'pointer', background: '#8e44ad', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                                >
                                    清除回信紀錄
                                </button>
                                <button
                                    onClick={onRefreshExternalLetterContext}
                                    style={{ padding: '10px 14px', cursor: 'pointer', background: '#16a085', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold' }}
                                >
                                    重抓外部資訊
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '10px', lineHeight: 1.5 }}>
                                ※「全部改成未讀」可重複看已產生的信；「清空今日來信並重產」會讓系統依目前時間重新產生已到點的信。
                            </p>
                        </div>

                        <div style={{ padding: '15px', border: '1px solid #444', backgroundColor: '#1b1b1b', borderRadius: '8px' }}>
                            <div style={{ color: '#ccc', fontWeight: 'bold', marginBottom: '10px' }}>今日信件狀態</div>
                            {letterCount === 0 ? (
                                <div style={{ color: '#888' }}>尚未產生任何信件。</div>
                            ) : (
                                Object.entries(petLetters?.slots || {}).map(([slotId, letter]) => (
                                    <div key={slotId} style={{ borderTop: '1px solid #333', padding: '8px 0', color: '#ddd', fontSize: '12px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{letter.label || slotId}：{letter.read ? '已讀' : '未讀'} / {letter.source === 'local' ? '本機' : (letter.source || '未知來源')} / 人工智慧： {letter.aiStatus || '舊格式'}</div>
                                        {letter.aiError && <div style={{ color: '#ff8a80', marginTop: '4px' }}>錯誤：{letter.aiError}</div>}
                                        <div style={{ color: '#aaa', marginTop: '4px' }}>{(letter.pages || []).join(' / ')}</div>
                                        <button
                                            onClick={() => retryPetLetterAi(letter.id)}
                                            style={{ marginTop: '6px', padding: '5px 8px', cursor: 'pointer', background: '#f39c12', color: '#111', border: 'none', borderRadius: '4px', fontWeight: 'bold', fontSize: '11px' }}
                                        >
                                            重試 AI
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ padding: '15px', border: '1px solid #8e44ad', backgroundColor: '#222', borderRadius: '8px' }}>
                            <div style={{ color: '#d7a7ff', fontWeight: 'bold', marginBottom: '10px' }}>特性切換</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                {getPokemonAbilities(getMonsterIdWrapped()).map(trait => {
                                    const active = monsterTraits?.trait?.id === trait.id;
                                    return (
                                        <button
                                            key={trait.id}
                                            onClick={() => {
                                                const currentTrait = monsterTraits?.trait || null;
                                                setMonsterTraits({ trait });
                                                if (battleState?.active) {
                                                    setBattleState?.(prev => ({
                                                        ...prev,
                                                        player: convertBattleEntityTrait(prev?.player, currentTrait, trait),
                                                        playerFinalState: prev?.playerFinalState ? convertBattleEntityTrait(prev.playerFinalState, currentTrait, trait) : prev?.playerFinalState
                                                    }));
                                                }
                                                updateDialogue(`偵錯： 特性切換為 ${trait.name}`);
                                            }}
                                            title={`增益: ${trait.bonus}\n代價: ${trait.drawback}`}
                                            style={{
                                                padding: '8px 10px',
                                                cursor: 'pointer',
                                                background: active ? '#8e44ad' : '#333',
                                                color: 'white',
                                                border: active ? '1px solid #d7a7ff' : '1px solid #555',
                                                borderRadius: '4px',
                                                fontWeight: active ? 'bold' : 'normal'
                                            }}
                                        >
                                            {trait.name}
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#ccc' }}>
                                目前特性: {monsterTraits?.trait?.name || '尚未設定'} / 增益: {monsterTraits?.trait?.bonus || '-'}
                            </div>
                        </div>

                        <div style={{ padding: '15px', border: '1px solid #f39c12', backgroundColor: '#222', borderRadius: '8px' }}>
                            <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '10px' }}>💖 羈絆值調整</div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="range" min="0" max="100" value={bondValue} 
                                    onChange={e => setBondValue(parseInt(e.target.value) || 0)}
                                    style={{ flex: 1, cursor: 'pointer' }}
                                />
                                <span style={{ width: '40px', textAlign: 'right', fontWeight: 'bold' }}>{bondValue}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>※ 羈絆值會影響進化分支 (例如靈魂進化需要 40 以上)。</p>
                        </div>

                        <div style={{ padding: '15px', border: '1px solid #27ae60', backgroundColor: '#222', borderRadius: '8px' }}>
                            <div style={{ color: '#58d68d', fontWeight: 'bold', marginBottom: '10px' }}>靈魂屬性快速設定</div>
                            <div style={{ marginBottom: '8px', color: '#ccc', fontSize: '12px' }}>
                                目前屬性：{lockedAffinity || '未鎖定'}
                            </div>
                            <div style={{ marginBottom: '8px', color: '#bbb' }}>鎖定屬性</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                {affinityOptions.map(option => {
                                    const active = (lockedAffinity || null) === option.id;
                                    return (
                                        <button
                                            key={option.id || 'none'}
                                            onClick={() => setDebugAffinity(option.id)}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                background: active ? '#27ae60' : '#333',
                                                color: 'white',
                                                border: active ? '1px solid #58d68d' : '1px solid #555',
                                                borderRadius: '4px',
                                                fontWeight: active ? 'bold' : 'normal'
                                            }}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ padding: '15px', border: '1px solid #f39c12', backgroundColor: '#222', borderRadius: '8px' }}>
                            <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '10px' }}>⭐ 等級調整</div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="100" 
                                    defaultValue={getLevelByPower(advStats.basePower)} 
                                    id="debug-level-input"
                                    style={{ flex: 1, padding: '10px', background: '#333', color: 'white', border: '1px solid #555' }} 
                                />
                                <button 
                                    onClick={() => {
                                        const lv = parseInt(document.getElementById('debug-level-input').value) || 1;
                                        const newPower = getPowerThreshold(lv);
                                        setAdvStats(prev => ({ ...prev, basePower: newPower }));
                                        updateDialogue(`偵錯： 等級已精準調整為 等級 ${lv}`);
                                    }}
                                    style={{ padding: '10px 20px', background: '#f39c12', color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    設定等級
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>※ 設定為 100 級後配合「進化時間」設為 10 秒 可測試正規死亡流程。</p>
                        </div>

                                                <div style={{ padding: '15px', border: '1px solid #16a085', backgroundColor: '#222', borderRadius: '8px' }}>
                            <div style={{ color: '#5fe3c0', fontWeight: 'bold', marginBottom: '10px' }}>技能附魔調整</div>
                            <div style={{ color: '#bbb', fontSize: '12px', marginBottom: '10px' }}>
                                只會列出可附魔的攻擊招式。像「守護者之盾」這類功能招式不會出現在這裡。
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div>
                                    <div style={{ marginBottom: '6px', color: '#bbb' }}>選擇技能</div>
                                    <select
                                        value={enchantMoveId}
                                        onChange={e => setEnchantMoveId(e.target.value)}
                                        style={{ width: '100%', padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }}
                                    >
                                        <option value="">請選擇技能</option>
                                        {enchantableMoveIds.map(moveId => (
                                            <option key={moveId} value={moveId}>
                                                {SKILL_DATABASE[moveId]?.name || moveId} ({moveId})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ color: '#aaa', fontSize: '12px' }}>
                                    目前選擇：{SKILL_DATABASE[enchantMoveId]?.name || '未選擇'}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <span style={{ width: '56px' }}>次數</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={enchantCount}
                                        onChange={e => setEnchantCount(parseInt(e.target.value) || 0)}
                                        style={{ width: '120px', padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }}
                                    />
                                    <button
                                        onClick={() => {
                                            const moveData = advStats.moveUpgrades?.[enchantMoveId] || {};
                                            setEnchantCount(moveData.count || 0);
                                            setEnchantJson(JSON.stringify(moveData.ailments || {}, null, 2));
                                        }}
                                        style={{ padding: '8px 12px', cursor: 'pointer' }}
                                    >
                                        讀取目前
                                    </button>
                                    <button
                                        onClick={() => {
                                            setEnchantCount(0);
                                            setEnchantJson('{}');
                                        }}
                                        style={{ padding: '8px 12px', cursor: 'pointer' }}
                                    >
                                        清空
                                    </button>
                                </div>
                                <div>
                                    <div style={{ marginBottom: '6px', color: '#bbb' }}>異常效果資料</div>
                                    <textarea
                                        value={enchantJson}
                                        onChange={e => setEnchantJson(e.target.value)}
                                        spellCheck={false}
                                        rows={5}
                                        style={{ width: '100%', padding: '10px', background: '#111', color: '#dff', border: '1px solid #555', fontFamily: 'monospace', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {['burn', 'paralysis', 'poison', 'confusion', 'leech-seed', 'trap', 'freeze', 'sleep', 'accuracy'].map(key => (
                                        <button
                                            key={key}
                                            onClick={() => setEnchantJson(JSON.stringify({ [key]: 100 }, null, 2))}
                                            style={{ padding: '6px 10px', cursor: 'pointer' }}
                                        >
                                            {({
                                                burn: '燒傷 100',
                                                paralysis: '麻痺 100',
                                                poison: '中毒 100',
                                                confusion: '混亂 100',
                                                'leech-seed': '寄生種子 100',
                                                trap: '束縛 100',
                                                freeze: '冰凍 100',
                                                sleep: '睡眠 100',
                                                accuracy: '命中 100'
                                            })[key]}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={applyMoveEnchant}
                                    style={{ padding: '10px 16px', background: '#16a085', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    套用附魔
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
                            <strong>努力值調整</strong>－目前總計： <span style={{ color: totalEvs > 510 ? '#e74c3c' : '#2ecc71', fontWeight: 'bold' }}>{totalEvs}</span> / 510
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
                        <button onClick={applyEvs} style={{ width: '100%', padding: '15px', marginTop: '10px', background: '#2980b9', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>立刻保存並套用努力值</button>
                    </div>
                )}
            </div>
        </div>
    );
};


// 組件末端無需 export，由 sync.py 串連時自動共享作用域
export default DebugPanel;

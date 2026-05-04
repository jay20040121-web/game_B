import React from 'react';
import { ADV_ITEMS, DIARY_ITEM } from '../data/gameConfig';
import { getLevelByPower } from '../monsterData';

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
    lockedAffinity, soulAffinityCounts, soulTagCounts,
    interactionLogs, interactionCount, getMonsterIdWrapped,
    getPowerThreshold
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
                            <div style={{ marginBottom: '5px' }}>回憶膠囊機率 (目前: {debugOverrides.memoryRate !== null ? debugOverrides.memoryRate * 100 + '%' : '預設 100%'})</div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {[0, 0.5, 1.0].map(rate => (
                                    <button key={rate} style={{ padding: '8px 12px', cursor: 'pointer', background: debugOverrides.memoryRate === rate ? '#f39c12' : '#333', color: 'white', border: 'none' }} onClick={() => setDebugOverrides(p => ({ ...p, memoryRate: rate }))}>
                                        {rate * 100}%
                                    </button>
                                ))}
                                <button style={{ padding: '8px 12px', cursor: 'pointer', background: '#7f8c8d', color: 'white', border: 'none' }} onClick={() => setDebugOverrides(p => ({ ...p, memoryRate: null }))}>重置</button>
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
                        <p style={{ color: '#aaa', margin: 0 }}>物品 ID 例: 001(飯糰), 002(蛋白粉), 004(核心), 005(糖果)</p>
                        <p style={{ color: '#aaa', margin: 0 }}>秘笈書 ID: 006(爆裂拳), 008(煉獄), 009(電磁炮), 010(茁茁轟炸)...</p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <span>ID:</span>
                            <input type="text" value={itemId} onChange={e => setItemId(e.target.value)} style={{ width: '80px', padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
                            <span>數量:</span>
                            <input type="number" value={itemCount} onChange={e => setItemCount(parseInt(e.target.value) || 1)} style={{ width: '60px', padding: '8px', background: '#333', color: 'white', border: '1px solid #555' }} />
                            <button onClick={addItems} style={{ padding: '10px 20px', background: '#27ae60', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>執行新增</button>
                        </div>

                        <div style={{ marginTop: '20px', padding: '15px', border: '2px dashed #f39c12', borderRadius: '8px' }}>
                            <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '10px' }}>🧪 專屬測試工具</div>
                            <button 
                                onClick={() => {
                                    const snapshot = {
                                        speciesId: getMonsterIdWrapped(),
                                        evolutionStage: evolutionStage,
                                        evolutionBranch: evolutionBranch,
                                        advStats: JSON.parse(JSON.stringify(advStats)),
                                        bondValue: bondValue,
                                        talkCount: talkCount,
                                        lockedAffinity: lockedAffinity,
                                        soulAffinityCounts: { ...soulAffinityCounts },
                                        soulTagCounts: { ...soulTagCounts },
                                        interactionLogs: [...interactionLogs],
                                        interactionCount: interactionCount
                                    };

                                    const itemDef = ADV_ITEMS.find(it => it.id === '021');
                                    setInventory(prev => [
                                        ...prev, 
                                        { ...itemDef, count: 1, instanceId: Date.now(), snapshot }
                                    ]);
                                    updateDialogue("Debug: 已產出當前怪獸的回憶膠囊！");
                                }}
                                style={{ width: '100%', padding: '12px', background: '#f39c12', color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold', borderRadius: '4px' }}
                            >
                                📸 產出回憶膠囊 (捕捉當前怪獸快照)
                            </button>
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '8px' }}>※ 此按鈕會將目前怪獸的所有狀態封裝進膠囊，方便測試復活邏輯。</p>
                        </div>
                    </div>
                )}

                {activeTab === 'stats' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ padding: '15px', border: '1px solid #f39c12', backgroundColor: '#222', borderRadius: '8px' }}>
                            <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '10px' }}>💖 羈絆值調整 (Bond)</div>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input 
                                    type="range" min="0" max="100" value={bondValue} 
                                    onChange={e => setBondValue(parseInt(e.target.value) || 0)}
                                    style={{ flex: 1, cursor: 'pointer' }}
                                />
                                <span style={{ width: '40px', textAlign: 'right', fontWeight: 'bold' }}>{bondValue}</span>
                            </div>
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>※ 羈絆值會影響進化分支 (例如靈魂進化需要 80 以上)。</p>
                        </div>

                        <div style={{ padding: '15px', border: '1px solid #f39c12', backgroundColor: '#222', borderRadius: '8px' }}>
                            <div style={{ color: '#f39c12', fontWeight: 'bold', marginBottom: '10px' }}>⭐ 等級調整 (Level)</div>
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
                                        updateDialogue(`Debug: 等級已精準調整為 Lv.${lv}`);
                                    }}
                                    style={{ padding: '10px 20px', background: '#f39c12', color: 'black', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    設定等級
                                </button>
                            </div>
                            <p style={{ fontSize: '11px', color: '#888', marginTop: '5px' }}>※ 設定為 100 級後配合「進化時間」設為 10s 可測試正規死亡流程。</p>
                        </div>

                        <div style={{ marginBottom: '10px', borderBottom: '1px solid #444', paddingBottom: '5px' }}>
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
                        <button onClick={applyEvs} style={{ width: '100%', padding: '15px', marginTop: '10px', background: '#2980b9', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>立刻保存並套用努力值</button>
                    </div>
                )}
            </div>
        </div>
    );
};


// 組件末端無需 export，由 sync.py 串連時自動共享作用域
export default DebugPanel;

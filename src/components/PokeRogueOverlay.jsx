import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ADV_WILD_POOL,
    MONSTER_NAMES,
    SPECIES_BASE_STATS,
    calcFinalStat,
    generateMoves,
    getLevelByPower,
} from '../monsterData';
import { DitheredSprite } from './SpriteRenderer';
import RogueBattleController from './RogueBattleController';
import RogueExperienceOverlay from './RogueExperienceOverlay';
import { getRogueEnemyLevel, getRogueTeamAverageLevel } from '../utils/rogueDifficultySystem';
import { distributeRogueExperience, getRogueBattleExperience, getRogueExperienceForLevel } from '../utils/rogueExperienceSystem';
import { createRogueEncounterPlan } from '../utils/rogueTrainerSystem';

const makeFighter = (snapshot, bonus = {}) => {
    const id = Number(snapshot.speciesId);
    const level = getLevelByPower(snapshot.advStats?.basePower || 100);
    const ivs = snapshot.advStats?.ivs || {};
    const evs = snapshot.advStats?.evs || {};
    const maxHp = calcFinalStat('hp', id, ivs.hp || 15, evs.hp || 0, level);
    return {
        id,
        name: MONSTER_NAMES[id] || '未知寶可夢',
        level,
        experience: getRogueExperienceForLevel(level),
        ivs: { hp: ivs.hp || 15, atk: ivs.atk || 15, def: ivs.def || 15, spd: ivs.spd || 15 },
        evs: { hp: evs.hp || 0, atk: evs.atk || 0, def: evs.def || 0, spd: evs.spd || 0 },
        types: snapshot.types?.length ? snapshot.types : (SPECIES_BASE_STATS[String(id)]?.types || ['normal']),
        trait: snapshot.monsterTraits?.trait || null,
        moves: (snapshot.advStats?.moves?.length ? snapshot.advStats.moves : generateMoves(id, level)).slice(0, 4),
        maxHp,
        hp: maxHp,
        atk: Math.round(calcFinalStat('atk', id, ivs.atk || 15, evs.atk || 0, level) * (bonus.atk || 1)),
        def: Math.round(calcFinalStat('def', id, ivs.def || 15, evs.def || 0, level) * (bonus.def || 1)),
        spd: Math.round(calcFinalStat('spd', id, ivs.spd || 15, evs.spd || 0, level) * (bonus.spd || 1)),
    };
};

const makeEnemy = (id, wave, teamAverageLevel, encounterKind = 'wild') => {
    id = Number(id || 4);
    const level = getRogueEnemyLevel(wave, teamAverageLevel);
    const boss = encounterKind !== 'wild';
    const stats = SPECIES_BASE_STATS[String(id)] || { hp: 50, atk: 50, def: 50, spd: 50, types: ['normal'] };
    const scale = encounterKind === 'gymBoss' ? 1.15 : encounterKind === 'miniBoss' ? 1.08 : 1;
    const maxHp = Math.round(calcFinalStat('hp', id, 20, 0, level) * scale);
    return {
        id, level, boss, bossTier: encounterKind, name: MONSTER_NAMES[id] || '野生寶可夢', types: stats.types || ['normal'],
        experience: getRogueExperienceForLevel(level),
        ivs: { hp: 20, atk: 20, def: 20, spd: 20 },
        evs: { hp: 0, atk: 0, def: 0, spd: 0 },
        maxHp, hp: maxHp,
        atk: Math.round(calcFinalStat('atk', id, 20, 0, level) * scale),
        def: Math.round(calcFinalStat('def', id, 20, 0, level) * scale),
        spd: Math.round(calcFinalStat('spd', id, 20, 0, level) * scale),
        moves: generateMoves(id, level).slice(-4),
    };
};


export default function PokeRogueOverlay({ inventory, activeBallId, onClose }) {
    const balls = useMemo(() => (inventory || []).filter(ball => ball?.pokemon), [inventory]);
    const initialBall = Math.max(0, balls.findIndex(ball => ball.ballId === activeBallId));
    const [phase, setPhase] = useState('team');
    const [cursor, setCursor] = useState(initialBall);
    const [selectedIds, setSelectedIds] = useState(() => balls[initialBall] ? [balls[initialBall].ballId] : []);
    const [team, setTeam] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [enemy, setEnemy] = useState(null);
    const [enemyTeam, setEnemyTeam] = useState([]);
    const [enemyIndex, setEnemyIndex] = useState(0);
    const [encounter, setEncounter] = useState(null);
    const [wave, setWave] = useState(1);
    const [rewardCursor, setRewardCursor] = useState(0);
    const [switchCursor, setSwitchCursor] = useState(0);
    const [captureReplaceCursor, setCaptureReplaceCursor] = useState(0);
    const [captureCandidate, setCaptureCandidate] = useState(null);
    const [experienceGains, setExperienceGains] = useState([]);
    const [waveExperienceGains, setWaveExperienceGains] = useState([]);
    const [log, setLog] = useState('選擇最多 3 顆寶可夢球組成闖關隊伍。');
    const [bonuses, setBonuses] = useState({ atk: 1, def: 1, spd: 1 });
    const [battleNonce, setBattleNonce] = useState(0);
    const active = team[activeIdx];

    const startWave = useCallback((nextWave, currentTeam = team) => {
        const livingIndex = currentTeam.findIndex(member => member.hp > 0);
        if (livingIndex < 0) {
            setPhase('gameover');
            return;
        }
        const teamAverageLevel = getRogueTeamAverageLevel(currentTeam);
        const wildIds = ADV_WILD_POOL.map(entry => Number(entry?.id)).filter(id => SPECIES_BASE_STATS[String(id)]);
        const plan = createRogueEncounterPlan(nextWave, wildIds, Object.keys(SPECIES_BASE_STATS).map(Number));
        const nextEnemyTeam = plan.speciesIds.map(id => makeEnemy(id, nextWave, teamAverageLevel, plan.kind));
        const nextEnemy = nextEnemyTeam[0];
        setActiveIdx(livingIndex);
        setSwitchCursor(livingIndex);
        setEnemy(nextEnemy);
        setEnemyTeam(nextEnemyTeam);
        setEnemyIndex(0);
        setEncounter(plan);
        setWaveExperienceGains([]);
        setWave(nextWave);
        setBattleNonce(value => value + 1);
        setLog(plan.trainer
            ? `${plan.trainer.title}${plan.trainer.name}?????`
            : `???${nextEnemy.name}????`);
        setPhase('switch');
    }, [team]);

    const beginRun = useCallback(() => {
        if (!selectedIds.length) return;
        const members = selectedIds.map(id => balls.find(ball => ball.ballId === id)).filter(Boolean).map(ball => makeFighter(ball.pokemon));
        setTeam(members);
        setBonuses({ atk: 1, def: 1, spd: 1 });
        startWave(1, members);
    }, [balls, selectedIds, startWave]);

    const toggleBall = useCallback((index = cursor) => {
        const ball = balls[index];
        if (!ball) return;
        setSelectedIds(previous => previous.includes(ball.ballId)
            ? previous.filter(id => id !== ball.ballId)
            : previous.length < 3 ? [...previous, ball.ballId] : previous);
    }, [balls, cursor]);


    const canCapture = encounter?.kind === 'wild';
    const rewards = [
        { name: '全隊治療', desc: '全隊恢復 40% HP' },
        { name: '力量強化', desc: '全隊攻擊與防禦提高 8%' },
        { name: '收服敵人', desc: team.length < 6 ? `讓${enemy?.name || '敵人'}加入本次隊伍` : '隊伍已滿，選擇一隻隊員進行替換' },
    ].filter((reward, index) => index < 2 || canCapture);

    const chooseReward = useCallback((selectedRewardIdx = rewardCursor) => {
        if (selectedRewardIdx === 0) {
            const nextTeam = team.map(member => ({ ...member, hp: Math.min(member.maxHp, member.hp + Math.ceil(member.maxHp * 0.4)) }));
            setTeam(nextTeam);
            startWave(wave + 1, nextTeam);
            return;
        }
        if (selectedRewardIdx === 1) {
            const nextTeam = team.map(member => ({ ...member, atk: Math.ceil(member.atk * 1.08), def: Math.ceil(member.def * 1.08) }));
            setBonuses(previous => ({ ...previous, atk: previous.atk * 1.08, def: previous.def * 1.08 }));
            setTeam(nextTeam);
            startWave(wave + 1, nextTeam);
            return;
        }
        const candidate = { ...enemy, hp: enemy.maxHp, shield: 0, boss: false };
        if (team.length >= 6) {
            setCaptureCandidate(candidate);
            setCaptureReplaceCursor(0);
            setPhase('capture_replace');
            return;
        }
        const nextTeam = [...team, candidate];
        setTeam(nextTeam);
        startWave(wave + 1, nextTeam);
    }, [enemy, rewardCursor, startWave, team, wave]);

    const handleControl = useCallback((rawKey) => {
        const key = String(rawKey || '').toUpperCase();
        if (phase === 'switch' && key === 'C') {
            setPhase('battle');
            return;
        }
        if (phase === 'capture_replace' && key === 'C') {
            setCaptureCandidate(null);
            startWave(wave + 1, team);
            return;
        }
        if (key === 'C') { onClose(); return; }
        if (phase === 'team') key === 'A'
            ? setCursor(value => (value + 1) % (balls.length + 1))
            : (cursor === balls.length ? beginRun() : toggleBall(cursor));
        else if (phase === 'battle') window.dispatchEvent(new CustomEvent('rogue-battle-control', { detail: key }));
        else if (phase === 'switch') {
            if (key === 'A') setSwitchCursor(value => (value + 1) % team.length);
            else if (team[switchCursor]?.hp > 0) {
                setActiveIdx(switchCursor);
                setPhase('battle');
            }
        }
        else if (phase === 'capture_replace') {
            if (key === 'A') setCaptureReplaceCursor(value => (value + 1) % team.length);
            else if (captureCandidate) {
                const nextTeam = team.map((member, index) => index === captureReplaceCursor ? captureCandidate : member);
                setTeam(nextTeam);
                setCaptureCandidate(null);
                startWave(wave + 1, nextTeam);
            }
        }
        else if (phase === 'reward') key === 'A'
            ? setRewardCursor(value => (value + 1) % rewards.length)
            : chooseReward();
        else if (phase === 'experience') setPhase('reward');
        else if (phase === 'gameover' && key === 'B') onClose();
    }, [balls.length, beginRun, captureCandidate, captureReplaceCursor, chooseReward, cursor, onClose, phase, rewards.length, startWave, switchCursor, team, toggleBall, wave]);

    useEffect(() => {
        const onKey = event => {
            const key = event.key.toUpperCase();
            if (!['A', 'B', 'C'].includes(key)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            handleControl(key);
        };
        const onRogueControl = event => handleControl(event.detail);
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('rogue-control', onRogueControl);
        return () => {
            window.removeEventListener('keydown', onKey, true);
            window.removeEventListener('rogue-control', onRogueControl);
        };
    }, [handleControl]);

    return <div className="absolute inset-0 z-[160] bg-gradient-to-b from-[#132238] to-[#281537] text-white p-3 flex flex-col overflow-hidden">
        <header className="flex justify-between text-[12px] font-black border-b border-white/30 pb-2"><span>無限波次挑戰</span><span>{phase === 'team' ? '隊伍編成' : `WAVE ${wave}`}</span></header>
        {phase === 'team' && <div className="flex-1 flex flex-col gap-2 overflow-hidden pt-2">
            <p className="text-[10px]">選擇 1～3 隻起始寶可夢（目前 {selectedIds.length}/3）</p>
            <div className="flex-1 overflow-y-auto space-y-1">{balls.map((ball, index) => <button key={ball.ballId} onClick={() => { setCursor(index); toggleBall(index); }} className={`w-full flex items-center gap-2 p-2 border text-left ${cursor === index ? 'border-yellow-300 bg-white/15' : 'border-white/20'} ${selectedIds.includes(ball.ballId) ? 'ring-2 ring-green-400' : ''}`}>
                <DitheredSprite id={ball.pokemon.speciesId} scale={0.65} /><span className="text-[11px] font-bold flex-1">{MONSTER_NAMES[ball.pokemon.speciesId]}</span><span className="text-[9px]">Lv.{getLevelByPower(ball.pokemon.advStats?.basePower)}</span>
            </button>)}
                <button onClick={beginRun} disabled={!selectedIds.length} className={`w-full p-2 border text-[11px] font-black ${cursor === balls.length ? 'border-yellow-300 bg-yellow-400/20' : 'border-white/20'} ${!selectedIds.length ? 'opacity-40' : ''}`}>開始挑戰</button>
            </div>
            {!balls.length && <p className="text-center text-[11px]">背包裡沒有可用的寶可夢球。</p>}
        </div>}
        {phase === 'battle' && active && enemy && <div className="absolute inset-0 z-[170]">
            <RogueBattleController
                key={`${wave}-${activeIdx}-${battleNonce}`}
                player={active}
                enemy={enemy}
                trainer={encounter?.trainer}
                wave={wave}
                encounterLabel={encounter?.trainer ? `${encounter.trainer.title}?${encounter.trainer.name}?${enemyIndex + 1}/${enemyTeam.length}?` : null}
                onExit={onClose}
                onWin={(finalPlayer, finalEnemy) => {
                    const battleTeam = team.map((member, index) => index === activeIdx ? {
                        ...member,
                        ...finalPlayer,
                        types: finalPlayer.type || member.types,
                        moves: (finalPlayer.moves || []).map(move => move.id || move),
                    } : member);
                    const totalExperience = getRogueBattleExperience(finalEnemy, SPECIES_BASE_STATS[String(finalEnemy.id)]);
                    const result = distributeRogueExperience({ team: battleTeam, totalExperience, calcFinalStat, generateMoves });
                    const combinedGains = result.gains.map((gain, index) => ({
                        ...gain,
                        gained: gain.gained + (waveExperienceGains[index]?.gained || 0),
                        oldLevel: waveExperienceGains[index]?.oldLevel ?? gain.oldLevel,
                        leveledUp: gain.leveledUp || Boolean(waveExperienceGains[index]?.leveledUp),
                    }));
                    setTeam(result.team);
                    setEnemy(previous => ({ ...previous, ...finalEnemy, types: finalEnemy.type || previous.types, moves: (finalEnemy.moves || []).map(move => move.id || move) }));
                    if (enemyIndex + 1 < enemyTeam.length) {
                        const nextEnemyIndex = enemyIndex + 1;
                        const nextEnemy = enemyTeam[nextEnemyIndex];
                        setWaveExperienceGains(combinedGains);
                        setEnemyIndex(nextEnemyIndex);
                        setEnemy(nextEnemy);
                        setBattleNonce(value => value + 1);
                        setLog(`${encounter.trainer.name}???${nextEnemy.name}?`);
                        return;
                    }
                    setExperienceGains(combinedGains);
                    setRewardCursor(0);
                    setLog(`第 ${wave} 波勝利！請選擇一項獎勵。`);
                    setPhase('experience');
                    // The experience overlay advances to setPhase('reward') after acknowledgement.
                }}
                onPlayerDefeated={(finalPlayer, finalEnemy) => {
                    const nextTeam = team.map((member, index) => index === activeIdx ? {
                        ...member,
                        ...finalPlayer,
                        hp: 0,
                        types: finalPlayer.type || member.types,
                        moves: (finalPlayer.moves || []).map(move => move.id || move),
                    } : member);
                    const nextIndex = nextTeam.findIndex(member => member.hp > 0);
                    setTeam(nextTeam);
                    setEnemy(previous => ({ ...previous, ...finalEnemy, types: finalEnemy.type || previous.types, moves: (finalEnemy.moves || []).map(move => move.id || move) }));
                    if (nextIndex < 0) setPhase('gameover');
                    else {
                        setActiveIdx(nextIndex);
                        setBattleNonce(value => value + 1);
                        setLog(`換上${nextTeam[nextIndex].name}繼續戰鬥！`);
                    }
                }}
            />
        </div>}
        {phase === 'switch' && <div className="flex-1 flex flex-col justify-center gap-2 overflow-hidden">
            <h2 className="text-center text-[13px] font-black">選擇第 {wave} 層出場寶可夢</h2>
            <div className="overflow-y-auto space-y-1">
                {team.map((member, index) => <button
                    key={`${member.id}-${index}`}
                    disabled={member.hp <= 0}
                    onClick={() => {
                        if (member.hp <= 0) return;
                        setSwitchCursor(index);
                        setActiveIdx(index);
                        setPhase('battle');
                    }}
                    className={`w-full flex items-center gap-2 p-2 border text-left ${switchCursor === index ? 'border-yellow-300 bg-yellow-400/20' : 'border-white/20'} ${member.hp <= 0 ? 'opacity-35' : ''}`}
                >
                    <DitheredSprite id={member.id} scale={0.55} />
                    <span className="flex-1 text-[10px] font-black">{member.name}{index === activeIdx ? '（目前出場）' : ''}</span>
                    <span className="text-[8px]">HP {Math.max(0, member.hp)}/{member.maxHp}</span>
                </button>)}
            </div>
            <div className="text-center text-[9px] opacity-70">[A] 選擇　[B] 確認　[C] 使用目前寶可夢</div>
        </div>}
        {phase === 'capture_replace' && captureCandidate && <div className="flex-1 flex flex-col justify-center gap-2 overflow-hidden">
            <h2 className="text-center text-[13px] font-black">隊伍已滿・替換一隻寶可夢</h2>
            <div className="text-center text-[10px]">要讓 <b>{captureCandidate.name}</b> 替換哪一隻隊員？</div>
            <div className="overflow-y-auto space-y-1">
                {team.map((member, index) => <button
                    key={`capture-replace-${member.id}-${index}`}
                    onClick={() => {
                        const nextTeam = team.map((entry, teamIndex) => teamIndex === index ? captureCandidate : entry);
                        setCaptureReplaceCursor(index);
                        setTeam(nextTeam);
                        setCaptureCandidate(null);
                        startWave(wave + 1, nextTeam);
                    }}
                    className={`w-full flex items-center gap-2 p-2 border text-left ${captureReplaceCursor === index ? 'border-yellow-300 bg-yellow-400/20' : 'border-white/20'}`}
                >
                    <DitheredSprite id={member.id} scale={0.55} />
                    <span className="flex-1 text-[10px] font-black">{member.name}</span>
                    <span className="text-[8px]">Lv.{member.level}・HP {Math.max(0, member.hp)}/{member.maxHp}</span>
                </button>)}
            </div>
            <div className="text-center text-[9px] opacity-70">[A] 選擇　[B] 完成替換　[C] 放棄收服</div>
        </div>}
        {phase === 'reward' && <div className="flex-1 flex flex-col justify-center gap-2"><h2 className="text-center text-[13px] font-black">戰鬥勝利・選擇獎勵</h2>{rewards.map((reward, index) => <button key={reward.name} onClick={() => { setRewardCursor(index); chooseReward(index); }} className={`p-3 border text-left ${rewardCursor === index ? 'border-yellow-300 bg-yellow-400/20' : 'border-white/20'}`}><b className="text-[11px]">{reward.name}</b><div className="text-[9px] opacity-75">{reward.desc}</div></button>)}</div>}
        {phase === 'gameover' && <div className="flex-1 flex flex-col items-center justify-center text-center"><h2 className="text-[18px] font-black text-red-300">挑戰結束</h2><p className="text-[11px] mt-2">本次抵達第 {wave} 波</p><button onClick={onClose} className="mt-5 border border-white px-4 py-2 text-[10px]">返回主畫面</button></div>}
        <footer className="text-center text-[9px] opacity-70 pt-2">[A] 移動　[B] 確認／攻擊　[C] 離開</footer>
        {phase === 'experience' && <RogueExperienceOverlay gains={experienceGains} />}
    </div>;
}

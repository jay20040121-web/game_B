import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SKILL_DATABASE } from '../monsterData';
import { getSmartMove } from '../data/gameConfig';
import { processBattleTurn, splitShieldDamage } from '../utils/battleTurnSystem';
import BattleAdventureOverlay from './BattleAdventureOverlay';

const STEP_DELAYS = { damage: 620, heal: 760, shield: 760, msg: 880 };
const getStepDelay = step => STEP_DELAYS[step?.type] || (step?.kind === 'status' ? 940 : step?.kind === 'support' ? 760 : 500);

const toBattleEntity = fighter => ({
    ...fighter,
    type: fighter.types || fighter.type || ['normal'],
    moves: (fighter.moves || []).map(move => typeof move === 'string' ? SKILL_DATABASE[move] : move).filter(Boolean),
    moveUpgrades: fighter.moveUpgrades || {},
    statStages: fighter.statStages || { atk: 0, def: 0, spd: 0 },
    status: fighter.status || null,
    statusTurns: fighter.statusTurns || 0,
    shield: fighter.shield || 0,
    protectLeft: fighter.protectLeft ?? 3,
    rogueEffects: fighter.rogueEffects || { lifesteal: 0, reflect: 0, shield: 0, haste: 1 },
});

const createBattleState = (player, enemy) => ({
    active: true,
    mode: 'trainer',
    encounterType: 'wild',
    phase: 'player_action',
    turn: 1,
    menuIdx: 0,
    logs: [`野生的${enemy.name}出現了！`],
    activeMsg: '',
    stepQueue: [],
    activeStepPending: false,
    lastStep: null,
    flashTarget: null,
    player: toBattleEntity(player),
    enemy: toBattleEntity(enemy),
    traitUsage: { player: { revives: {}, eightGatesEnded: false }, enemy: { revives: {}, eightGatesEnded: false } },
});

export default function RogueBattleController({ player, enemy, wave, encounterLabel, onWin, onPlayerDefeated, onExit }) {
    const [battleState, setBattleState] = useState(() => createBattleState(player, enemy));
    const resolvedRef = useRef(false);
    const isHost = useRef(true);
    const pvpRemoteMoveRef = useRef(null);
    const connInstance = useRef(null);
    const pvp = useMemo(() => ({
        isPvpMode: false, matchStatus: 'idle', myPeerId: null,
        pvpRoomPassword: '', setPvpRoomPassword: () => {}, joinPvpRoom: () => {},
    }), []);

    const selectMove = useCallback(() => {
        setBattleState(previous => {
            if (previous.phase !== 'player_action') return previous;
            const count = previous.player.moves.length || 1;
            return { ...previous, menuIdx: (previous.menuIdx + 1) % count };
        });
    }, []);

    const executeMove = useCallback(() => {
        setBattleState(previous => {
            if (previous.phase !== 'player_action') return previous;
            const move = previous.player.moves[previous.menuIdx] || previous.player.moves[0];
            return processBattleTurn(previous, 'attack', move, null, {
                isHost,
                pvpRemoteMoveRef,
                connInstance,
                setPendingPlayerMove: () => {},
                getSmartMove,
                monsterTraits: { trait: previous.player.trait || null },
            });
        });
    }, []);

    useEffect(() => {
        const handleControl = event => {
            const key = String(event.detail || '').toUpperCase();
            if (key === 'A') selectMove();
            else if (key === 'B') executeMove();
            else if (key === 'C') onExit();
        };
        window.addEventListener('rogue-battle-control', handleControl);
        return () => window.removeEventListener('rogue-battle-control', handleControl);
    }, [executeMove, onExit, selectMove]);

    useEffect(() => {
        if (battleState.phase !== 'action_streaming') return undefined;
        const step = battleState.activeStepPending ? battleState.lastStep : battleState.stepQueue[0];
        const timer = setTimeout(() => {
            setBattleState(previous => {
                const currentStep = previous.activeStepPending ? previous.lastStep : previous.stepQueue[0];
                if (currentStep) {
                    const next = {
                        ...previous,
                        stepQueue: previous.activeStepPending ? previous.stepQueue : previous.stepQueue.slice(1),
                        activeStepPending: false,
                        activeMsg: currentStep.text || '',
                        logs: currentStep.text ? [...previous.logs, currentStep.text] : previous.logs,
                        flashTarget: null,
                    };
                    if (currentStep.type === 'damage') {
                        const targetKey = currentStep.target === 'enemy' ? 'enemy' : 'player';
                        const target = next[targetKey];
                        const split = currentStep.shieldValue !== undefined && currentStep.hpValue !== undefined
                            ? { nextShield: Math.max(0, (target.shield || 0) - currentStep.shieldValue), nextHp: Math.max(0, target.hp - currentStep.hpValue) }
                            : splitShieldDamage(target, currentStep.value);
                        next[targetKey] = { ...target, shield: split.nextShield, hp: split.nextHp };
                        next.flashTarget = targetKey;
                        next.damagePop = {
                            id: currentStep.id,
                            target: targetKey,
                            value: currentStep.value,
                            effectType: currentStep.effectType,
                            effectVariant: currentStep.effectVariant,
                            effectStyle: currentStep.effectStyle,
                        };
                    } else if (currentStep.type === 'heal') {
                        const targetKey = currentStep.target === 'enemy' ? 'enemy' : 'player';
                        const target = next[targetKey];
                        const hp = Math.min(target.maxHp, target.hp + currentStep.value);
                        next[targetKey] = { ...target, hp };
                        next.healPop = { id: currentStep.id, target: targetKey, value: Math.max(0, hp - target.hp) };
                    } else if (currentStep.type === 'shield') {
                        const targetKey = currentStep.target === 'enemy' ? 'enemy' : 'player';
                        next[targetKey] = { ...next[targetKey], shield: (next[targetKey].shield || 0) + currentStep.value };
                    }
                    if (next.player.hp <= 0 || next.enemy.hp <= 0) next.stepQueue = [];
                    return next;
                }

                const finalPlayer = { ...(previous.playerFinalState || previous.player) };
                const finalEnemy = { ...(previous.enemyFinalState || previous.enemy) };
                finalPlayer.hp = previous.playerHpAfter ?? finalPlayer.hp;
                finalPlayer.shield = previous.playerShieldAfter ?? finalPlayer.shield ?? 0;
                finalEnemy.hp = previous.enemyHpAfter ?? finalEnemy.hp;
                finalEnemy.shield = previous.enemyShieldAfter ?? finalEnemy.shield ?? 0;

                if (finalEnemy.hp <= 0 || finalPlayer.hp <= 0) {
                    if (!resolvedRef.current) {
                        resolvedRef.current = true;
                        setTimeout(() => finalEnemy.hp <= 0 ? onWin(finalPlayer, finalEnemy) : onPlayerDefeated(finalPlayer, finalEnemy), 900);
                    }
                    return {
                        ...previous,
                        phase: 'end',
                        activeMsg: finalEnemy.hp <= 0 ? '🏆 戰鬥勝利！' : '💀 寶可夢失去戰鬥能力！',
                        player: finalPlayer,
                        enemy: finalEnemy,
                        playerFinalState: null,
                        enemyFinalState: null,
                    };
                }

                return {
                    ...previous,
                    phase: 'player_action',
                    turn: previous.turn + 1,
                    activeMsg: '',
                    player: finalPlayer,
                    enemy: finalEnemy,
                    playerFinalState: null,
                    enemyFinalState: null,
                    damagePop: null,
                    healPop: null,
                };
            });
        }, getStepDelay(step));
        return () => clearTimeout(timer);
    }, [battleState.activeStepPending, battleState.lastStep, battleState.phase, battleState.stepQueue, onPlayerDefeated, onWin]);

    return <BattleAdventureOverlay
        isAdvMode
        isTournamentOpen={false}
        battleState={battleState}
        advStats={{ basePower: (player.level - 1) * 10 + 100, moveUpgrades: player.moveUpgrades || {} }}
        pvp={pvp}
        advCD={0}
        fetchLeaderboard={() => {}}
        startTournament={() => {}}
        advLogRef={null}
        advLog={[]}
        advCurrentHP={battleState.player.hp / battleState.player.maxHp}
        isAdvStreaming={battleState.phase === 'action_streaming'}
        pendingWildCapture={null}
        modeLabel={encounterLabel || `無限挑戰・第 ${wave} 波`}
    />;
}

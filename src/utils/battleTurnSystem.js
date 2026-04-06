import { SKILL_DATABASE, getTypeMultiplier } from '../../monsterData';
import { checkPreTurnStatus, applyMoveEffects, processPostTurnStatus, getStatMultiplier } from './battleEngine';

export const processBattleTurn = (prev, playerAction, actionMove, pvpEnemyMove, deps) => {
    const { isHost, pvpRemoteMoveRef, connInstance, setPendingPlayerMove, getSmartMove } = deps;

    if (!prev || prev.phase === 'end' || !prev.active || prev.phase === 'action_streaming') return prev;

    // --- PvP 模式特殊預處理 ---
    if (prev.mode === 'pvp' && playerAction === 'attack') {
        if (isHost.current) {
            if (!pvpEnemyMove) {
                if (pvpRemoteMoveRef.current) {
                    pvpEnemyMove = pvpRemoteMoveRef.current;
                    pvpRemoteMoveRef.current = null;
                    if (connInstance.current) {
                        connInstance.current.send({ type: 'ACTION', data: { move: actionMove } });
                    }
                } else {
                    setPendingPlayerMove(actionMove);
                    if (connInstance.current) {
                        connInstance.current.send({ type: 'ACTION', data: { move: actionMove } });
                    }
                    return { ...prev, phase: 'waiting_opponent', logs: [...prev.logs, "等待對手出招..."] };
                }
            }
        } else {
            if (pvpEnemyMove) {
                return { ...prev, phase: 'waiting_opponent', logs: [...prev.logs, "等待對手出招..."] };
            }
            if (pvpRemoteMoveRef.current) {
                pvpRemoteMoveRef.current = null;
            }
            setPendingPlayerMove(actionMove);
            if (connInstance.current) {
                connInstance.current.send({ type: 'ACTION', data: { move: actionMove } });
            }
            return { ...prev, phase: 'waiting_opponent', logs: [...prev.logs, "等待對手出招..."] };
        }
    }

    const nextQueue = [];
    const playerMoveList = prev.player.moves || [SKILL_DATABASE.tackle];
    const playerMove = actionMove || getSmartMove(prev.player, prev.enemy, playerMoveList);
    const enemyMoveList = prev.enemy.moves || [SKILL_DATABASE.tackle];
    const enemyMove = pvpEnemyMove || getSmartMove(prev.enemy, prev.player, enemyMoveList);

    let rngState = prev.turn * 1234567;
    const rFunc = () => {
        if (prev.mode !== 'pvp') return Math.random();
        const x = Math.sin(rngState++) * 10000;
        return x - Math.floor(x);
    };

    const pPrio = playerMove.priority || 0;
    const ePrio = enemyMove.priority || 0;

    let pEffSpd = prev.player.spd * getStatMultiplier(prev.player.statStages?.spd || 0);
    let eEffSpd = prev.enemy.spd * getStatMultiplier(prev.enemy.statStages?.spd || 0);

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

    const calcDamage = (attacker, move, defender) => {
        if (!move.power || move.power === 0) return { dmg: 0, msg: "" };

        const attackerEffSpd = attacker.spd * getStatMultiplier(attacker.statStages?.spd || 0) * (attacker.status === 'paralysis' ? 0.5 : 1);
        const defenderEffSpd = defender.spd * getStatMultiplier(defender.statStages?.spd || 0) * (defender.status === 'paralysis' ? 0.5 : 1);

        const speedRatio = attackerEffSpd / defenderEffSpd;
        const hitRateProb = Math.min(1.0, Math.max(0.3, 0.9 + 0.1 * Math.log2(speedRatio)));

        let hitSuccess = rFunc() < hitRateProb;
        if (!hitSuccess) return { dmg: 0, msg: '攻擊落空了！' };

        const attackerLevel = attacker.level || 5;

        const atkMult = getStatMultiplier(attacker.statStages?.atk || 0);
        const defMult = getStatMultiplier(defender.statStages?.def || 0);

        let effectiveAtk = attacker.atk * atkMult;
        let effectiveDef = defender.def * defMult;

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
        // 在 PVP 模式下，動態帶入各自的名字，避免雙方看到硬編碼的「你」
        let attackerName = isPlayer ? (attacker.id === 151 ? '夢幻' : '你') : attacker.name;
        let defenderName = isPlayer ? defender.name : (defender.id === 151 ? '夢幻' : '你');
        
        if (prev.mode === 'pvp') {
            attackerName = isPlayer ? (updatedPlayer.name || '玩家') : (updatedEnemy.name || '對手');
            defenderName = isPlayer ? (updatedEnemy.name || '對手') : (updatedPlayer.name || '玩家');
        }

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

        const result = calcDamage(attacker, move, defender);

        if (isStatusMove) {
            if (move.accuracy && rFunc() * 100 > move.accuracy) {
                nextQueue.push({ type: 'msg', text: `${attackerName} 的技能沒中！` });
                return;
            }
        } else if (result.dmg === 0) {
            nextQueue.push({ type: 'msg', text: `${attackerName} 的攻擊沒中！` });
            return;
        }

        if (!isStatusMove && result.dmg > 0) {
            nextQueue.push({
                type: 'damage', target: isPlayer ? 'enemy' : 'player',
                value: result.dmg, text: `對 ${defenderName} 造成了 ${result.dmg} 點傷害！${result.msg}`
            });
            defender.hp = Math.max(0, defender.hp - result.dmg);
        }

        const effects = applyMoveEffects(move, defender, attacker, rFunc);
        effects.messages.forEach(m => {
            const targetName = m.targetType === 'source' ? attackerName : defenderName;
            nextQueue.push({ type: 'msg', text: `${targetName} ${m.text}` });
        });

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

    const pPost = processPostTurnStatus(updatedPlayer, updatedPlayer.maxHp, rFunc);
    updatedPlayer.status = pPost.nextStatus;
    updatedPlayer.statusTurns = pPost.nextTurns;
    if (pPost.message) {
        if (pPost.dmg > 0) {
            nextQueue.push({ type: 'damage', target: 'player', value: pPost.dmg, text: `你${pPost.message}` });
            updatedPlayer.hp = Math.max(0, updatedPlayer.hp - pPost.dmg);
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
        player: { ...prev.player, status: updatedPlayer.status, statusTurns: updatedPlayer.statusTurns },
        enemy: { ...prev.enemy, status: updatedEnemy.status, statusTurns: updatedEnemy.statusTurns },
        playerHpAfter: updatedPlayer.hp,
        enemyHpAfter: updatedEnemy.hp
    };

    if (prev.mode === 'pvp' && isHost.current && connInstance.current) {
        const flippedQueue = nextQueue.map(step => {
            if (step.type === 'damage' || step.type === 'heal') {
                return { ...step, target: step.target === 'player' ? 'enemy' : 'player' };
            }
            return step;
        });

        const connRef = connInstance.current;
        setTimeout(() => {
            try {
                connRef.send({ 
                    type: 'RESULT', 
                    data: { 
                        stepQueue: flippedQueue,
                        turnId: prev.turn + 1,
                        // 房主的 player 是 客戶端的 enemy
                        enemySnap: { ...updatedPlayer }, 
                        // 房主的 enemy 是 客戶端的 player
                        playerSnap: { ...updatedEnemy },
                        playerHpAfter: updatedEnemy.hp, 
                        enemyHpAfter: updatedPlayer.hp
                    } 
                });
            } catch (e) { console.error("PVP Result Send Error:", e); }
        }, 0);
    }

    return finalBattleState;
};

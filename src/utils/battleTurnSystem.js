import { SKILL_DATABASE, getTypeMultiplier } from '../monsterData';
import { checkPreTurnStatus, applyMoveEffects, processPostTurnStatus, getStatMultiplier } from './battleEngine';

export const splitShieldDamage = (target, amount) => {
    const hp = Math.max(0, target?.hp || 0);
    const shield = Math.max(0, target?.shield || 0);
    const damage = Math.max(0, amount || 0);
    const actual = Math.min(hp + shield, damage);
    const shieldValue = Math.min(shield, actual);
    const hpValue = actual - shieldValue;

    return {
        actual,
        shieldValue,
        hpValue,
        nextShield: Math.max(0, shield - shieldValue),
        nextHp: Math.max(0, hp - hpValue)
    };
};

export const processBattleTurn = (prev, playerAction, actionMove, pvpEnemyMove, deps) => {
    const { isHost, pvpRemoteMoveRef, connInstance, setPendingPlayerMove, getSmartMove, monsterTraits } = deps;

    if (!prev || prev.phase === 'end' || !prev.active || prev.phase === 'action_streaming') return prev;

    // --- PvP 模式特殊預處理 ---
    if (prev.mode === 'pvp' && playerAction === 'attack') {
        if (isHost.current) {
            // 【主機端邏輯】：收集雙方招式，然後進行結算
            if (!pvpEnemyMove) {
                if (pvpRemoteMoveRef.current) {
                    pvpEnemyMove = pvpRemoteMoveRef.current;
                    pvpRemoteMoveRef.current = null;
                    // 主機端在結算前，可以選擇是否告知客機自己出招了（選用）
                } else {
                    setPendingPlayerMove(actionMove);
                    if (connInstance.current) {
                        connInstance.current.send({ type: 'ACTION', data: { move: actionMove, turnId: prev.turn } });
                    }
                    return { ...prev, phase: 'waiting_opponent', logs: [...prev.logs, "等待對手出招..."] };
                }
            }
        } else {
            // 【客機端邏輯】：只負責發送招式給主機，然後「絕對」等待 RESULT 封包
            setPendingPlayerMove(actionMove);
            if (connInstance.current) {
                connInstance.current.send({ type: 'ACTION', data: { move: actionMove, turnId: prev.turn } });
            }
            return { ...prev, phase: 'waiting_opponent', logs: [...prev.logs, "等待對手出招..."] };
        }
    }

    // 非主機端在 PVP 模式下不准進入下方的計算邏輯
    if (prev.mode === 'pvp' && !isHost.current) {
        return { ...prev, phase: 'waiting_opponent' };
    }

    const nextQueue = [];
    let stepSeq = 0;
    const createBattleStep = (type, payload = {}) => ({
        id: `${prev.turn}-${stepSeq++}-${type}`,
        turnId: prev.turn,
        type,
        ...payload
    });
    const playerTrait = prev.player?.trait || monsterTraits?.trait || null;
    const enemyTrait = prev.enemy?.trait || null;
    const traitUsage = {
        player: {
            revives: { ...(prev.traitUsage?.player?.revives || {}) },
            eightGatesEnded: !!prev.traitUsage?.player?.eightGatesEnded
        },
        enemy: {
            revives: { ...(prev.traitUsage?.enemy?.revives || {}) },
            eightGatesEnded: !!prev.traitUsage?.enemy?.eightGatesEnded
        }
    };
    const getTrait = (side) => (side === 'player' ? playerTrait : enemyTrait) || null;
    const getTraitMods = (side) => getTrait(side)?.modifiers || {};
    const activeTrait = playerTrait;
    const traitMods = getTraitMods('player');
    const traitEffects = traitUsage.player;
    const hasEightGates = (traitMods.damageRampPerTurn || 0) > 0 && !traitEffects.eightGatesEnded;
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

    const pPrio = (playerMove.priority || 0) + (prev.player.moveUpgrades?.[playerMove.id]?.ailments?.priority || 0);
    const ePrio = (enemyMove.priority || 0) + (prev.enemy.moveUpgrades?.[enemyMove.id]?.ailments?.priority || 0);

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
        const isStatusMove = !move.power || move.power === 0;
        const isPureBuff = isStatusMove && (!move.accuracy || move.stat_target === 'self');

        // BUFF 類技能或無精準度要求的技能必定命中
        if (isPureBuff) return { dmg: 0, msg: "HIT" };

        if (defender.isProtected) {
            return { dmg: 0, msg: "BLOCKED" };
        }

        const attackerEffSpd = attacker.spd * getStatMultiplier(attacker.statStages?.spd || 0) * (attacker.status === 'paralysis' ? 0.5 : 1);
        const defenderEffSpd = defender.spd * getStatMultiplier(defender.statStages?.spd || 0) * (defender.status === 'paralysis' ? 0.5 : 1);

        const speedRatio = attackerEffSpd / defenderEffSpd;

        // 取得技能基礎命中 (預設 100)，加上附魔命中加成
        const enchantAccBonus = attacker.moveUpgrades?.[move.id]?.ailments?.accuracy || 0;
        const baseAccuracy = ((move.accuracy || 100) + enchantAccBonus) / 100;
        const speedMod = 1 + 0.1 * Math.log2(speedRatio);
        const hitRateProb = Math.min(1.0, Math.max(0.3, baseAccuracy * speedMod));

        const rng = rFunc();
        if (rng >= hitRateProb) {
            // 判定為落空，區分是「速度太慢被閃開」還是「運氣不好招式偏離」
            if (speedRatio < 1 && rng >= baseAccuracy) {
                return { dmg: 0, msg: 'MISS_SPEED' };
            }
            return { dmg: 0, msg: 'MISS_LUCK' };
        }

        if (isStatusMove) return { dmg: 0, msg: "HIT" };

        const attackerLevel = attacker.level || 5;

        const atkMult = getStatMultiplier(attacker.statStages?.atk || 0);
        const defMult = getStatMultiplier(defender.statStages?.def || 0);

        let effectiveAtk = attacker.atk * atkMult;
        let effectiveDef = defender.def * defMult;

        if (attacker.status === 'burn') effectiveAtk *= 0.5;

        let baseDmg = (Math.floor((2 * attackerLevel) / 5 + 2) * move.power * (effectiveAtk / effectiveDef)) / 50 + 2;

        const attackerTypes = Array.isArray(attacker.type) ? attacker.type : [attacker.type];
        if (attackerTypes.includes(move.type)) baseDmg *= 1.5;

        // --- Roguelike 特殊效果: Haste (先制戰術) ---
        if (prev.turn === 1 && attacker.rogueEffects?.haste) {
            baseDmg *= attacker.rogueEffects.haste;
        }

        const mult = getTypeMultiplier(move.type, defender.type);
        const rngMod = 0.85 + rFunc() * 0.15;
        const finalDmg = Math.max(1, Math.floor(baseDmg * mult * rngMod));

        let effectMsg = '';
        if (mult >= 2.0) effectMsg = ' (效果絕佳！)';
        else if (mult <= 0.5 && mult > 0) effectMsg = ' (效果似乎不太好...)';
        else if (mult === 0) effectMsg = ' (似乎沒有效果...)';

        return { dmg: finalDmg, msg: effectMsg };
    };

    const applyEnchantAilment = (attacker, move, defender, defenderName, attackerSide, attackerName) => {
        const enchantData = attacker.moveUpgrades?.[move.id]?.ailments || {};
        if (Object.keys(enchantData).length === 0 || defender.status) return;

        const ailmentTypes = ['burn', 'paralysis', 'poison', 'confusion', 'leech-seed', 'trap', 'freeze', 'sleep']
            .filter(ailment => (enchantData[ailment] || 0) > 0)
            .sort((a, b) => (enchantData[b] || 0) - (enchantData[a] || 0));
        for (const ailment of ailmentTypes) {
            const chance = enchantData[ailment] || 0;
            if (chance > 0 && rFunc() * 100 < chance) {
                defender.status = ailment;
                const ailmentNameMap = {
                    'burn': '燒傷', 'paralysis': '麻痺', 'poison': '中毒',
                    'confusion': '混亂', 'leech-seed': '寄生種子', 'trap': '束縛',
                    'freeze': '冰凍', 'sleep': '睡眠'
                };
                if (ailment === 'sleep') defender.statusTurns = Math.floor(rFunc() * 2) + 1;
                else if (ailment === 'confusion') defender.statusTurns = Math.floor(rFunc() * 3) + 2;
                else if (ailment === 'leech-seed' || ailment === 'trap') defender.statusTurns = 5;
                else if (ailment === 'freeze') defender.statusTurns = Math.floor(rFunc() * 2) + 1;
                pushMsg(`${defenderName} ${ailmentNameMap[ailment] || ailment}了！(附魔效果)`, {
                    kind: 'status',
                    actorSide: attackerSide,
                    targetSide: attackerSide === 'player' ? 'enemy' : 'player',
                    actorName: attackerName,
                    targetName: defenderName,
                    cue: 'ailment'
                });
                break;
            }
        }
    };

    const updatedPlayer = {
        ...prev.player,
        statStages: { ...prev.player.statStages },
        rogueEffects: { ...(prev.player.rogueEffects || {}) },
        statusRecoveryPending: null
    };
    const updatedEnemy = {
        ...prev.enemy,
        statStages: { ...prev.enemy.statStages },
        rogueEffects: { ...(prev.enemy.rogueEffects || {}) },
        statusRecoveryPending: null
    };

    const applyDamageToState = (target, amount) => {
        const result = splitShieldDamage(target, amount);
        target.shield = result.nextShield;
        target.hp = result.nextHp;
        return result;
    };

    const pushDamageStep = ({ target, value, text, effectType, effectVariant, shieldValue, hpValue, kind = 'damage', actorSide, targetSide, actorName, targetName, moveId, moveName, cue }) => {
        const step = createBattleStep('damage', {
            kind,
            target,
            value,
            text,
            actorSide,
            targetSide,
            actorName,
            targetName,
            moveId,
            moveName,
            cue
        });
        if (effectType) step.effectType = effectType;
        if (effectVariant !== undefined) step.effectVariant = effectVariant;
        if (shieldValue !== undefined) step.shieldValue = shieldValue;
        if (hpValue !== undefined) step.hpValue = hpValue;
        nextQueue.push(step);
        return step;
    };

    const pushHealStep = ({ target, value, text, actorSide, targetSide, actorName, targetName, cue }) => {
        nextQueue.push(createBattleStep('heal', {
            kind: 'support',
            target,
            value,
            text,
            actorSide,
            targetSide,
            actorName,
            targetName,
            cue
        }));
    };

    const pushShieldStep = ({ target, value, text, actorSide, targetSide, actorName, targetName, cue }) => {
        nextQueue.push(createBattleStep('shield', {
            kind: 'support',
            target,
            value,
            text,
            actorSide,
            targetSide,
            actorName,
            targetName,
            cue
        }));
    };

    const pushMsg = (text, payload = {}) => {
        nextQueue.push(createBattleStep('msg', {
            kind: payload.kind || 'speech',
            text,
            actorSide: payload.actorSide,
            targetSide: payload.targetSide,
            actorName: payload.actorName,
            targetName: payload.targetName,
            moveId: payload.moveId,
            moveName: payload.moveName,
            cue: payload.cue
        }));
    };

    const tryFeignDeath = (side) => {
        const target = side === 'player' ? updatedPlayer : updatedEnemy;
        const other = side === 'player' ? updatedEnemy : updatedPlayer;
        const trait = getTrait(side);
        if (!trait?.modifiers?.battleRevive) return false;
        if (target.hp > 0 || other.hp <= 0) return false;
        if (traitUsage[side].revives[trait.id]) return false;
        traitUsage[side].revives[trait.id] = true;
        target.hp = 1;
        pushMsg(`${trait.name}觸發！HP 回到 1，戰鬥繼續。`, { kind: 'system', cue: 'revive' });
        return true;
    };

    const addMoveExecution = (side, move) => {
        const isPlayer = side === 'player';
        const attacker = isPlayer ? updatedPlayer : updatedEnemy;
        const defender = isPlayer ? updatedEnemy : updatedPlayer;
        const isPvpMode = prev.mode === 'pvp';
        // PvP 直接使用戰鬥物件上的名稱，避免把本機視角硬改成「你」
        let attackerName = isPvpMode
            ? (attacker.name || (isPlayer ? '玩家' : '對手'))
            : (isPlayer ? '你' : attacker.name);
        let defenderName = isPvpMode
            ? (defender.name || (isPlayer ? '對手' : '玩家'))
            : (isPlayer ? defender.name : '你');

        const preCheck = checkPreTurnStatus(attacker, rFunc);
        if (preCheck.clearStatus) {
            attacker.statusRecoveryPending = preCheck.clearStatus;
            attacker.statusTurns = preCheck.nextTurns;
        } else {
            attacker.statusRecoveryPending = null;
            attacker.status = preCheck.nextStatus;
            attacker.statusTurns = preCheck.nextTurns;
        }

        if (!preCheck.canAct) {
            if (preCheck.message) {
                pushMsg(`${attackerName}${preCheck.message}`, {
                    kind: 'status',
                    actorSide: isPlayer ? 'player' : 'enemy',
                    targetSide: isPlayer ? 'enemy' : 'player',
                    actorName: attackerName,
                    targetName: defenderName,
                    cue: 'status'
                });
            }
            if (preCheck.selfDamage) {
                const selfDmg = Math.max(1, Math.floor(attacker.maxHp * 0.08));
                const { actual: actualDmg, shieldValue: shieldDmg, hpValue: hpDmg } = applyDamageToState(attacker, selfDmg);
                pushDamageStep({
                    target: isPlayer ? 'player' : 'enemy',
                    value: actualDmg,
                    text: `${attackerName} 受到了混亂的回擊！`,
                    actorSide: isPlayer ? 'player' : 'enemy',
                    targetSide: isPlayer ? 'player' : 'enemy',
                    actorName: attackerName,
                    targetName: attackerName,
                    shieldValue: shieldDmg,
                    hpValue: hpDmg,
                    cue: 'self-hit'
                });
                if (attacker.hp <= 0) tryFeignDeath(isPlayer ? 'player' : 'enemy');
            }
            return;
        }

        if (!move) {
            console.warn(`[Battle] ${attackerName} 嘗試使用不存在的招式`, move);
            move = SKILL_DATABASE.tackle;
        }
        pushMsg(`${attackerName} 使出了 [${move.name || '未知招式'}]！`, {
            kind: 'speech',
            actorSide: isPlayer ? 'player' : 'enemy',
            targetSide: isPlayer ? 'enemy' : 'player',
            actorName: attackerName,
            targetName: defenderName,
            moveId: move.id,
            moveName: move.name,
            cue: 'move'
        });

        if (move.isProtect) {
            if ((attacker.protectLeft || 0) > 0) {
                attacker.isProtected = true;
                attacker.protectLeft = (attacker.protectLeft || 0) - 1;
                pushMsg(`${attackerName} 進入了防護狀態！(剩餘次數: ${attacker.protectLeft})`, {
                    kind: 'system',
                    actorSide: isPlayer ? 'player' : 'enemy',
                    actorName: attackerName,
                    targetSide: isPlayer ? 'player' : 'enemy',
                    cue: 'protect'
                });
            } else {
                pushMsg(`但是防禦次數已用盡，失敗了！`, { kind: 'system', cue: 'fail' });
            }
            return;
        } else {
            attacker.consecutiveProtect = 0;
        }

        if (move.addReflect) {
            attacker.rogueEffects = { ...(attacker.rogueEffects || {}) };
            attacker.rogueEffects.reflect = (attacker.rogueEffects.reflect || 0) + move.addReflect;
            pushMsg(`${attackerName} 周圍展開了反射盾！`, {
                kind: 'system',
                actorSide: isPlayer ? 'player' : 'enemy',
                actorName: attackerName,
                cue: 'reflect'
            });
            return;
        }

        if (move.addShield) {
            const shieldAmt = Math.floor(attacker.maxHp * move.addShield);
            attacker.shield = (attacker.shield || 0) + shieldAmt;
            pushMsg(`${attackerName} 獲得了 ${shieldAmt} 點生命護盾！`, {
                kind: 'support',
                actorSide: isPlayer ? 'player' : 'enemy',
                actorName: attackerName,
                cue: 'shield'
            });
            pushShieldStep({
                target: isPlayer ? 'player' : 'enemy',
                value: shieldAmt,
                text: `${attackerName} 獲得了 ${shieldAmt} 點生命護盾！`,
                actorSide: isPlayer ? 'player' : 'enemy',
                targetSide: isPlayer ? 'player' : 'enemy',
                actorName: attackerName,
                cue: 'shield'
            });
            return;
        }

        const result = calcDamage(attacker, move, defender);

        if (result.msg === 'BLOCKED') {
            pushMsg(`但是被 ${defenderName} 完美地擋下來了！`, { kind: 'system', targetSide: isPlayer ? 'enemy' : 'player', targetName: defenderName, cue: 'blocked' });
            return;
        } else if (result.msg === 'MISS_SPEED') {
            pushMsg(`${defenderName} 靈巧地閃開了！`, { kind: 'system', targetSide: isPlayer ? 'enemy' : 'player', targetName: defenderName, cue: 'miss' });
            return;
        } else if (result.msg === 'MISS_LUCK') {
            pushMsg(`${attackerName} 的招式偏離了目標！`, { kind: 'system', actorSide: isPlayer ? 'player' : 'enemy', actorName: attackerName, cue: 'miss' });
            return;
        }

        applyEnchantAilment(attacker, move, defender, defenderName, isPlayer ? 'player' : 'enemy', attackerName);

        const effects = applyMoveEffects(move, defender, attacker, rFunc);
        effects.messages.forEach(m => {
            const targetName = m.targetType === 'source' ? attackerName : defenderName;
            pushMsg(`${targetName} ${m.text}`, {
                kind: 'status',
                actorSide: m.targetType === 'source' ? (isPlayer ? 'player' : 'enemy') : (isPlayer ? 'enemy' : 'player'),
                targetSide: m.targetType === 'source' ? (isPlayer ? 'enemy' : 'player') : (isPlayer ? 'player' : 'enemy'),
                actorName: targetName,
                targetName,
                cue: 'effect'
            });
        });

        // --- 附魔系統：追加異常狀態機率 ---
        const enchantData = attacker.moveUpgrades?.[move.id]?.ailments || {};
        if (false && Object.keys(enchantData).length > 0 && !defender.status) {
            const ailmentTypes = ['burn', 'paralysis', 'poison', 'confusion', 'leech-seed', 'trap', 'freeze', 'sleep'];
            for (const ailment of ailmentTypes) {
                const chance = enchantData[ailment] || 0;
                if (chance > 0 && rFunc() * 100 < chance) {
                    defender.status = ailment;
                    const ailmentNameMap = {
                        'burn': '燒傷', 'paralysis': '麻痺', 'poison': '中毒',
                        'confusion': '混亂', 'leech-seed': '寄生種子', 'trap': '束縛',
                        'freeze': '冰凍', 'sleep': '睡眠'
                    };
                    if (ailment === 'sleep') defender.statusTurns = Math.floor(rFunc() * 2) + 1;
                    else if (ailment === 'confusion') defender.statusTurns = Math.floor(rFunc() * 3) + 2;
                    else if (ailment === 'leech-seed' || ailment === 'trap') defender.statusTurns = 5;
                    else if (ailment === 'freeze') defender.statusTurns = Math.floor(rFunc() * 2) + 1;
                    pushMsg(`${defenderName} ${ailmentNameMap[ailment] || ailment}了！(附魔效果)`, {
                        kind: 'status',
                        actorSide: isPlayer ? 'player' : 'enemy',
                        targetSide: isPlayer ? 'enemy' : 'player',
                        actorName: attackerName,
                        targetName: defenderName,
                        cue: 'ailment'
                    });
                    break; // 只觸發一個
                }
            }
        }

        if (result.dmg > 0) {
            let finalDamage = result.dmg;
            const attackerSide = isPlayer ? 'player' : 'enemy';
            const attackerTraitMods = getTraitMods(attackerSide);
            const attackerTraitUsage = traitUsage[attackerSide];
            if ((attackerTraitMods.damageRampPerTurn || 0) > 0 && !attackerTraitUsage.eightGatesEnded) {
                const damageMultiplier = 1 + Math.max(0, prev.turn - 1) * attackerTraitMods.damageRampPerTurn;
                finalDamage = Math.max(1, Math.floor(finalDamage * damageMultiplier));
            }

            const { actual: actualDmg, shieldValue: shieldDmg, hpValue: hpDmg } = applyDamageToState(defender, finalDamage);
            pushDamageStep({
                target: isPlayer ? 'enemy' : 'player',
                value: actualDmg, text: `對 ${defenderName} 造成了 ${actualDmg} 點傷害！${result.msg}`,
                actorSide: isPlayer ? 'player' : 'enemy',
                targetSide: isPlayer ? 'enemy' : 'player',
                actorName: attackerName,
                targetName: defenderName,
                moveId: move.id,
                moveName: move.name,
                effectType: move.type,
                effectVariant: Math.floor(rFunc() * 9),
                shieldValue: shieldDmg,
                hpValue: hpDmg,
                cue: 'damage'
            });
            if (defender.hp <= 0) tryFeignDeath(isPlayer ? 'enemy' : 'player');

            if (effects.recoilPct > 0) {
                const recoilDmg = Math.floor(actualDmg * effects.recoilPct);
                if (recoilDmg > 0) {
                    const { actual: actualRecoil, shieldValue: recoilShieldDmg, hpValue: recoilHpDmg } = applyDamageToState(attacker, recoilDmg);
                    pushDamageStep({
                        target: isPlayer ? 'player' : 'enemy',
                        value: actualRecoil,
                        text: `${attackerName} 受到了反作用力傷害！`,
                        actorSide: isPlayer ? 'enemy' : 'player',
                        targetSide: isPlayer ? 'player' : 'enemy',
                        actorName: defenderName,
                        targetName: attackerName,
                        moveName: move.name,
                        shieldValue: recoilShieldDmg,
                        hpValue: recoilHpDmg,
                        cue: 'recoil'
                    });
                    if (attacker.hp <= 0) tryFeignDeath(isPlayer ? 'player' : 'enemy');
                }
            }

            // --- Roguelike 特殊效果: Lifesteal (吸血鬼之牙) + 附魔吸血 ---
            const rogueLifesteal = attacker.rogueEffects?.lifesteal || 0;
            const enchantLifesteal = attacker.moveUpgrades?.[move.id]?.ailments?.lifesteal || 0;
            const totalDrainPct = (effects.drainPct || 0) + rogueLifesteal + (enchantLifesteal / 100);

            if (totalDrainPct > 0) {
                const drainHeal = Math.floor(actualDmg * totalDrainPct);
                if (drainHeal > 0) {
                    pushHealStep({
                        target: isPlayer ? 'player' : 'enemy',
                        value: drainHeal,
                        text: `${attackerName} 吸收了生命值！`,
                        actorSide: isPlayer ? 'player' : 'enemy',
                        targetSide: isPlayer ? 'player' : 'enemy',
                        actorName: attackerName,
                        moveId: move.id,
                        moveName: move.name,
                        cue: 'drain'
                    });
                    attacker.hp = Math.min(attacker.maxHp, attacker.hp + drainHeal);
                }
            }

            // --- Roguelike 特殊效果: Reflect (棘刺外殼) ---
            const rogueReflect = defender.rogueEffects?.reflect || 0;
            if (rogueReflect > 0) {
                const reflectDmg = Math.floor(actualDmg * rogueReflect);
                if (reflectDmg > 0) {
                    const { actual: actualReflect, shieldValue: reflectShieldDmg, hpValue: reflectHpDmg } = applyDamageToState(attacker, reflectDmg);
                    pushDamageStep({
                        target: isPlayer ? 'player' : 'enemy',
                        value: actualReflect,
                        text: `${defenderName} 的棘刺反射了傷害！`,
                        actorSide: isPlayer ? 'enemy' : 'player',
                        targetSide: isPlayer ? 'player' : 'enemy',
                        actorName: defenderName,
                        targetName: attackerName,
                        moveName: move.name,
                        shieldValue: reflectShieldDmg,
                        hpValue: reflectHpDmg,
                        cue: 'reflect'
                    });
                    if (attacker.hp <= 0) tryFeignDeath(isPlayer ? 'player' : 'enemy');
                }
            }
        }
    };

    if (playerAction === 'run') {
        nextQueue.push(createBattleStep('run', {
            kind: 'system',
            text: `你選擇撤退... 逃跑成功！`,
            cue: 'run'
        }));
    } else if (playerAction === 'potion') {
        const heal = Math.floor(updatedPlayer.maxHp * 0.3);
        pushHealStep({
            target: 'player',
            value: heal,
            text: `使用了傷藥，恢復了 ${heal} 點 HP！`,
            actorSide: 'player',
            targetSide: 'player',
            cue: 'potion'
        });
        updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + heal);
        addMoveExecution('enemy', enemyMove);
    } else if (isPlayerFirst) {
        addMoveExecution('player', playerMove);
        if (updatedEnemy.hp > 0) addMoveExecution('enemy', enemyMove);
    } else {
        addMoveExecution('enemy', enemyMove);
        if (updatedPlayer.hp > 0) addMoveExecution('player', playerMove);
    }

    // 針對 PVP 模式優化播報名稱
    const pName = (prev.mode === 'pvp')
        ? (updatedPlayer.name || '玩家')
        : '你';
    const eName = updatedEnemy.name || '對手';

    const pPost = processPostTurnStatus(updatedPlayer, updatedPlayer.maxHp, rFunc);
    updatedPlayer.status = pPost.nextStatus;
    updatedPlayer.statusTurns = pPost.nextTurns;
    if (pPost.message) {
        if (pPost.dmg > 0) {
            const { actual: actualDmg, shieldValue: shieldDmg, hpValue: hpDmg } = applyDamageToState(updatedPlayer, pPost.dmg);
            pushDamageStep({
                target: 'player',
                value: actualDmg,
                text: `${pName}${pPost.message}`,
                actorSide: 'player',
                targetSide: 'player',
                actorName: pName,
                shieldValue: shieldDmg,
                hpValue: hpDmg,
                cue: 'post-status'
            });
            if (updatedPlayer.hp <= 0) tryFeignDeath('player');
            if (pPost.heal > 0 && updatedEnemy.hp > 0) {
                const actualHeal = actualDmg;
                pushHealStep({
                    target: 'enemy',
                    value: actualHeal,
                    text: `${eName} 從${pName}那裡吸收了生命精華！`,
                    actorSide: 'enemy',
                    targetSide: 'enemy',
                    actorName: eName,
                    cue: 'absorb'
                });
                updatedEnemy.hp = Math.min(updatedEnemy.maxHp, updatedEnemy.hp + actualHeal);
            }
        } else {
            pushMsg(`${pName}${pPost.message}`, {
                kind: 'status',
                actorSide: 'player',
                targetSide: 'player',
                actorName: pName,
                cue: 'post-status'
            });
        }
    }

    const ePost = processPostTurnStatus(updatedEnemy, updatedEnemy.maxHp, rFunc);
    updatedEnemy.status = ePost.nextStatus;
    updatedEnemy.statusTurns = ePost.nextTurns;
    if (ePost.message) {
        if (ePost.dmg > 0) {
            const { actual: actualDmg, shieldValue: shieldDmg, hpValue: hpDmg } = applyDamageToState(updatedEnemy, ePost.dmg);
            pushDamageStep({
                target: 'enemy',
                value: actualDmg,
                text: `${eName}${ePost.message}`,
                actorSide: 'enemy',
                targetSide: 'enemy',
                actorName: eName,
                shieldValue: shieldDmg,
                hpValue: hpDmg,
                cue: 'post-status'
            });
            if (updatedEnemy.hp <= 0) tryFeignDeath('enemy');
            if (ePost.heal > 0 && updatedPlayer.hp > 0) {
                const actualHeal = actualDmg;
                pushHealStep({
                    target: 'player',
                    value: actualHeal,
                    text: `${pName} 從${eName}那裡恢復了生命！`,
                    actorSide: 'player',
                    targetSide: 'player',
                    actorName: pName,
                    cue: 'absorb'
                });
                updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + actualHeal);
            }
        } else {
            pushMsg(`${eName}${ePost.message}`, {
                kind: 'status',
                actorSide: 'enemy',
                targetSide: 'enemy',
                actorName: eName,
                cue: 'post-status'
            });
        }
    }

    if ((traitMods.battleRegenMaxHp || 0) > 0 && updatedPlayer.hp > 0 && updatedEnemy.hp > 0) {
        const heal = Math.min(
            updatedPlayer.maxHp - updatedPlayer.hp,
            Math.max(1, Math.floor(updatedPlayer.maxHp * traitMods.battleRegenMaxHp))
        );
        if (heal > 0) {
            pushHealStep({
                target: 'player',
                value: heal,
                text: `${activeTrait.name}回復 ${heal} HP。`,
                actorSide: 'player',
                targetSide: 'player',
                actorName: activeTrait.name,
                cue: 'regen'
            });
            updatedPlayer.hp = Math.min(updatedPlayer.maxHp, updatedPlayer.hp + heal);
        }
    }

    if (hasEightGates && prev.turn >= (traitMods.rampTurns || 5) && updatedPlayer.hp > 0 && updatedEnemy.hp > 0) {
        const nextHp = Math.max(1, Math.floor(updatedPlayer.hp * (1 - (traitMods.rampEndHpLoss || 0))));
        const hpLoss = Math.max(0, updatedPlayer.hp - nextHp);
        if (hpLoss > 0) {
            pushMsg(`${activeTrait.name}結束，傷害倍率回到 100%。`, { kind: 'system', actorSide: 'player', actorName: activeTrait.name, cue: 'trait-end' });
            pushDamageStep({
                target: 'player',
                value: hpLoss,
                text: `${activeTrait.name}反噬，HP 失去 80%。`,
                actorSide: 'player',
                targetSide: 'player',
                actorName: activeTrait.name,
                shieldValue: 0,
                hpValue: hpLoss,
                cue: 'trait-recoil'
            });
            updatedPlayer.hp = nextHp;
        }
        traitEffects.eightGatesEnded = true;
    }

    const enemyTraitMods = getTraitMods('enemy');
    const enemyTraitUsage = traitUsage.enemy;
    if ((enemyTraitMods.battleRegenMaxHp || 0) > 0 && updatedPlayer.hp > 0 && updatedEnemy.hp > 0) {
        const heal = Math.min(
            updatedEnemy.maxHp - updatedEnemy.hp,
            Math.max(1, Math.floor(updatedEnemy.maxHp * enemyTraitMods.battleRegenMaxHp))
        );
        if (heal > 0) {
            pushHealStep({
                target: 'enemy',
                value: heal,
                text: `${enemyTrait?.name || '天賦'}回復 ${heal} HP。`,
                actorSide: 'enemy',
                targetSide: 'enemy',
                actorName: enemyTrait?.name || '天賦',
                cue: 'regen'
            });
            updatedEnemy.hp = Math.min(updatedEnemy.maxHp, updatedEnemy.hp + heal);
        }
    }

    if ((enemyTraitMods.damageRampPerTurn || 0) > 0 && !enemyTraitUsage.eightGatesEnded && prev.turn >= (enemyTraitMods.rampTurns || 5) && updatedPlayer.hp > 0 && updatedEnemy.hp > 0) {
        const nextHp = Math.max(1, Math.floor(updatedEnemy.hp * (1 - (enemyTraitMods.rampEndHpLoss || 0))));
        const hpLoss = Math.max(0, updatedEnemy.hp - nextHp);
        if (hpLoss > 0) {
            pushMsg(`${enemyTrait?.name || '天賦'}結束，傷害倍率回到 100%。`, { kind: 'system', actorSide: 'enemy', actorName: enemyTrait?.name || '天賦', cue: 'trait-end' });
            pushDamageStep({
                target: 'enemy',
                value: hpLoss,
                text: `${enemyTrait?.name || '天賦'}反噬，HP 失去 80%。`,
                actorSide: 'enemy',
                targetSide: 'enemy',
                actorName: enemyTrait?.name || '天賦',
                shieldValue: 0,
                hpValue: hpLoss,
                cue: 'trait-recoil'
            });
            updatedEnemy.hp = nextHp;
        }
        enemyTraitUsage.eightGatesEnded = true;
    }

    const finalizeBattleEntity = (entity) => {
        if (!entity) return entity;
        if (!entity.statusRecoveryPending) return entity;
        const next = {
            ...entity,
            status: null,
            statusTurns: 0
        };
        delete next.statusRecoveryPending;
        return next;
    };

    const finalPlayerState = finalizeBattleEntity(updatedPlayer);
    const finalEnemyState = finalizeBattleEntity(updatedEnemy);

    const finalBattleState = {
        ...prev,
        // 修正：播報期間不應提前增加 turn，統一由 App.js 播報結束後累加，防止跳號
        turn: prev.turn,
        phase: 'action_streaming',
        stepQueue: nextQueue.slice(1),
        activeMsg: nextQueue[0]?.text || "",
        lastStep: nextQueue[0] || null,
        activeStepPending: !!nextQueue[0],
        // 核心修正：確保 player/enemy 完整繼承所有更新後的屬性 (包含 statStages/protect), 但 HP 保持在起始點供動畫播放
        player: { ...updatedPlayer, hp: prev.player.hp, shield: prev.player.shield || 0, isProtected: false },
        enemy: { ...updatedEnemy, hp: prev.enemy.hp, shield: prev.enemy.shield || 0, isProtected: false },
        playerHpAfter: finalPlayerState.hp,
        enemyHpAfter: finalEnemyState.hp,
        playerShieldAfter: finalPlayerState.shield || 0,
        enemyShieldAfter: finalEnemyState.shield || 0,
        playerStateAfter: finalPlayerState,
        enemyStateAfter: finalEnemyState,
        playerFinalState: finalPlayerState,
        enemyFinalState: finalEnemyState,
        traitUsage
    };

    if (prev.mode === 'pvp' && isHost.current && connInstance.current) {
        const flippedQueue = nextQueue.map(step => {
            if (step.type === 'damage' || step.type === 'heal' || step.type === 'shield') {
                const flippedTarget = step.target === 'player' ? 'enemy' : 'player';
                return {
                    ...step,
                    target: flippedTarget,
                    actorSide: step.actorSide === 'player' ? 'enemy' : (step.actorSide === 'enemy' ? 'player' : step.actorSide),
                    targetSide: step.targetSide === 'player' ? 'enemy' : (step.targetSide === 'enemy' ? 'player' : step.targetSide)
                };
            }
            if (step.type === 'msg' && step.text) {
                return {
                    ...step,
                    actorSide: step.actorSide === 'player' ? 'enemy' : (step.actorSide === 'enemy' ? 'player' : step.actorSide),
                    targetSide: step.targetSide === 'player' ? 'enemy' : (step.targetSide === 'enemy' ? 'player' : step.targetSide)
                };
            }
            return step;
        });
        const flippedTraitUsage = {
            player: traitUsage.enemy,
            enemy: traitUsage.player
        };

        const connRef = connInstance.current;
        setTimeout(() => {
            try {
                connRef.send({
                    type: 'RESULT',
                    data: {
                        stepQueue: flippedQueue,
                        turnId: prev.turn,
                        playerHpBefore: prev.enemy.hp,
                        enemyHpBefore: prev.player.hp,
                        playerShieldBefore: prev.enemy.shield || 0,
                        enemyShieldBefore: prev.player.shield || 0,
                        playerHpAfter: updatedEnemy.hp,
                        enemyHpAfter: updatedPlayer.hp,
                        playerShieldAfter: finalEnemyState.shield || 0,
                        enemyShieldAfter: finalPlayerState.shield || 0,
                        // 🔹 傳送完整的物件快照，確保所有狀態（狀態異常、Rogue效果、能力階級）同步
                        playerStateAfter: finalEnemyState,
                        enemyStateAfter: finalPlayerState,
                        traitUsage: flippedTraitUsage,
                        turnId: prev.turn
                    }
                });
            } catch (e) { console.error("PVP Result Send Error:", e); }
        }, 0);
    }

    return finalBattleState;
};



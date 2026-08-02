export const checkPreTurnStatus = (state, rng = Math.random) => {
    if (state.flinch) {
        return {
            canAct: false,
            message: "畏縮了，無法行動！",
            nextStatus: state.status,
            nextTurns: state.statusTurns || 0,
            clearFlinch: true
        };
    }

    if (!state.status) return { canAct: true, message: null };

    let nextStatus = state.status;
    let nextTurns = state.statusTurns || 0;

    if (state.status === 'sleep') {
        if (state.statusTurns <= 0) {
            return {
                canAct: true,
                message: "睡眠解除，終於醒來了！",
                nextStatus: null,
                nextTurns: 0,
                clearStatus: 'sleep'
            };
        }

        const nextT = state.statusTurns - 1;
        return {
            canAct: false,
            message: "還在睡夢中...",
            nextStatus: 'sleep',
            nextTurns: Math.max(0, nextT)
        };
    }

    if (state.status === 'freeze') {
        if (state.statusTurns <= 0) {
            return {
                canAct: true,
                message: "冰凍解除，身上的冰塊融化了！",
                nextStatus: null,
                nextTurns: 0,
                clearStatus: 'freeze'
            };
        }

        if (rng() < 0.2) {
            return {
                canAct: true,
                message: "冰凍解除，身上的冰塊融化了！",
                nextStatus: null,
                nextTurns: 0,
                clearStatus: 'freeze'
            };
        }

        const nextT = state.statusTurns - 1;
        return {
            canAct: false,
            message: "被冰塊凍住了，無法行動！",
            nextStatus: 'freeze',
            nextTurns: Math.max(0, nextT)
        };
    }

    if (state.status === 'paralysis') {
        if (rng() < 0.25) {
            return {
                canAct: false,
                message: "因為麻痺而無法動彈！",
                nextStatus: 'paralysis',
                nextTurns: state.statusTurns
            };
        }
    }

    if (state.status === 'confusion') {
        if (state.statusTurns <= 0) {
            return {
                canAct: true,
                message: "混亂解除，頭部不再發暈了！",
                nextStatus: null,
                nextTurns: 0,
                clearStatus: 'confusion'
            };
        }

        const nextT = state.statusTurns - 1;
        if (rng() < 0.33) {
            return {
                canAct: false,
                message: "因混亂而攻擊了自己！",
                selfDamage: true,
                nextStatus: 'confusion',
                nextTurns: nextT
            };
        }
        return {
            canAct: true,
            message: "仍然處於混亂中...",
            nextStatus: 'confusion',
            nextTurns: nextT,
            clearStatus: null
        };
    }

    return { canAct: true, message: null, nextStatus, nextTurns };
};

export const applyMoveEffects = (move, targetState, sourceState, rng = Math.random) => {
    let messageObjs = [];
    const blocksSecondary = targetState.trait?.id === 'shield-dust' && (move.power || 0) > 0;

    // 1. Ailment
    const blockedBySafeguard = (targetState.fieldEffects?.safeguardTurns || 0) > 0;
    const blockedByTerrain = targetState.isGrounded !== false && ['electric', 'misty'].includes(targetState.battleTerrain);
    const terrainBlocksAilment = blockedByTerrain && (targetState.battleTerrain === 'misty' || move.ailment === 'sleep');
    const sleepImmune = ['insomnia', 'vital-spirit'].includes(targetState.trait?.id);
    const volatileAilments = ['disable', 'ingrain', 'perish-song', 'unknown', 'silence', 'torment'];
    if (move.ailment === 'disable') {
        targetState.disabledMoveId = targetState.lastMove?.id || null;
        targetState.disabledMoveTurns = targetState.disabledMoveId ? 4 : 0;
        messageObjs.push({ text: targetState.disabledMoveId ? '最近使用的招式被封印了！' : '但是定身法失敗了！', targetType: 'target' });
    } else if (move.ailment === 'ingrain') {
        sourceState.ingrain = true;
        sourceState.trapped = true;
        messageObjs.push({ text: '扎下了根，每回合會回復體力！', targetType: 'source' });
    } else if (move.ailment === 'perish-song') {
        sourceState.perishTurns = 3;
        targetState.perishTurns = 3;
        messageObjs.push({ text: '雙方的滅亡倒數變成 3！', targetType: 'target' });
    } else if (move.ailment === 'unknown' && move.id === 'smack-down') {
        targetState.isGrounded = true;
        targetState.groundedTurns = 5;
        targetState.magnetRiseTurns = 0;
        messageObjs.push({ text: '被擊落到地面了！', targetType: 'target' });
    } else if (move.ailment === 'unknown' && move.id === 'tri-attack' && !targetState.status) {
        const ailments = ['burn', 'freeze', 'paralysis'];
        targetState.status = ailments[Math.floor(rng() * ailments.length)];
        targetState.statusTurns = targetState.status === 'freeze' ? Math.floor(rng() * 3) + 1 : 0;
        messageObjs.push({ text: '受到三重攻擊的附加異常效果！', targetType: 'target' });
    } else if (move.ailment === 'silence') {
        targetState.silenceTurns = 2;
        messageObjs.push({ text: '暫時無法使用聲音類招式！', targetType: 'target' });
    } else if (move.ailment === 'torment') {
        targetState.tormentTurns = 4;
        messageObjs.push({ text: '不能連續使用相同招式了！', targetType: 'target' });
    }
    if (move.ailment && move.ailment !== 'none' && !volatileAilments.includes(move.ailment) && !targetState.status && !blockedBySafeguard
        && !terrainBlocksAilment
        && !(move.ailment === 'sleep' && sleepImmune)) {
        let chance = move.ailment_chance || 100;
        if ((!blocksSecondary || chance >= 100) && rng() * 100 < chance) {
            const normalizedAilment = move.ailment === 'yawn' ? 'drowsy' : move.ailment;
            targetState.status = normalizedAilment;

            const ailmentMap = {
                disable: '招式被封印了！',
                ingrain: '扎下了根！',
                'perish-song': '聽見了滅亡之歌！',
                silence: '陷入沉默了！',
                yawn: '產生了睡意！',
                burn: "燒傷了！",
                paralysis: "麻痺了！",
                poison: "中毒了！",
                sleep: "陷入睡眠了！",
                freeze: "被冰凍了！",
                confusion: "陷入混亂了！",
                'leech-seed': "被寄生種子纏上了！",
                trap: "被束縛住了！"
            };

            if (move.ailment === 'sleep') targetState.statusTurns = Math.floor(rng() * 3) + 1;
            else if (move.ailment === 'disable') targetState.statusTurns = 4;
            else if (move.ailment === 'perish-song') targetState.statusTurns = 3;
            else if (move.ailment === 'silence') targetState.statusTurns = 3;
            else if (move.ailment === 'yawn') targetState.statusTurns = 1;
            else if (move.ailment === 'freeze') targetState.statusTurns = Math.floor(rng() * 3) + 1;
            else if (move.ailment === 'confusion') targetState.statusTurns = Math.floor(rng() * 3) + 2;
            else if (move.ailment === 'leech-seed' || move.ailment === 'trap') targetState.statusTurns = 5;

            messageObjs.push({
                text: ailmentMap[move.ailment] || `被附加了異常狀態：${move.ailment}`,
                targetType: 'target'
            });
        }
    }

    // 2. Flinch
    if (!blocksSecondary && move.flinch_chance && move.flinch_chance > 0) {
        if (rng() * 100 < move.flinch_chance) {
            if (!targetState.status) {
                targetState.flinch = true;
            }
        }
    }

    // 3. Stat changes
    if (move.stat_changes && move.stat_changes.length > 0) {
        let chance = move.stat_chance || 100;
        if (chance === 0) chance = 100;

        if (rng() * 100 <= chance) {
            const isSelf = move.stat_target === 'self';
            if (blocksSecondary && !isSelf && chance < 100) return { messages: messageObjs, drainPct: move.drain || 0, recoilPct: move.recoil || 0 };
            let targetObj = isSelf ? sourceState : targetState;

            move.stat_changes.forEach(sc => {
                const stat = sc.stat;
                if (!targetObj.statStages) targetObj.statStages = { atk: 0, def: 0, spd: 0 };

                if (!isSelf && sc.change < 0 && (targetState.fieldEffects?.mistTurns || 0) > 0) return;
                let oldStage = targetObj.statStages[stat] || 0;
                const stageDelta = targetObj.trait?.id === 'simple' ? sc.change * 2 : sc.change;
                let newStage = Math.max(-6, Math.min(6, oldStage + stageDelta));
                targetObj.statStages[stat] = newStage;

                const statNameMap = { atk: "攻擊", def: "防禦", spd: "速度" };
                const sName = statNameMap[stat] || stat;
                if (newStage > oldStage) {
                    messageObjs.push({ text: `${sName} 上升了！`, targetType: isSelf ? 'source' : 'target' });
                } else if (newStage < oldStage) {
                    messageObjs.push({ text: `${sName} 下降了！`, targetType: isSelf ? 'source' : 'target' });
                }
            });
        }
    }

    // 4. Drain & Recoil
    let drainPct = move.drain || 0;
    let recoilPct = move.recoil || 0;

    return { messages: messageObjs, drainPct, recoilPct };
};

export const processPostTurnStatus = (state, maxHp, rng = Math.random) => {
    if (!state.status) return { dmg: 0, heal: 0, message: null };

    let nextStatus = state.status;
    let nextTurns = state.statusTurns || 0;

    if (state.status === 'burn') {
        let dmg = Math.max(1, Math.floor(maxHp / 16));
        return { dmg, heal: 0, message: "受到燒傷的傷害。", nextStatus, nextTurns };
    }

    if (state.status === 'poison') {
        let dmg = Math.max(1, Math.floor(maxHp / 8));
        return { dmg, heal: 0, message: "受到劇毒的傷害。", nextStatus, nextTurns };
    }

    if (state.status === 'leech-seed') {
        if (state.statusTurns <= 0) {
            return {
                dmg: 0,
                heal: 0,
                message: "寄生種子解除，藤蔓枯萎了。",
                nextStatus: null,
                nextTurns: 0,
                clearStatus: 'leech-seed'
            };
        }
        let dmg = Math.max(1, Math.floor(maxHp / 8));
        return {
            dmg,
            heal: dmg,
            message: "被寄生種子吸收了生命。",
            nextStatus,
            nextTurns: state.statusTurns - 1
        };
    }

    if (state.status === 'trap') {
        if (state.statusTurns <= 0) {
            return {
                dmg: 0,
                heal: 0,
                message: "束縛解除，行動恢復了。",
                nextStatus: null,
                nextTurns: 0,
                clearStatus: 'trap'
            };
        }
        let dmg = Math.max(1, Math.floor(maxHp / 16));
        return {
            dmg,
            heal: 0,
            message: "受到束縛的傷害。",
            nextStatus,
            nextTurns: state.statusTurns - 1
        };
    }

    if (state.status === 'ingrain') {
        return { dmg: 0, heal: Math.max(1, Math.floor(maxHp / 16)), message: '因扎根回復了體力。', nextStatus, nextTurns };
    }

    if (state.status === 'drowsy') {
        return { dmg: 0, heal: 0, message: '睡意襲來，陷入了睡眠。', nextStatus: 'sleep', nextTurns: 2 };
    }

    if (state.status === 'perish-song') {
        const remaining = Math.max(0, nextTurns - 1);
        return remaining === 0
            ? { dmg: maxHp, heal: 0, message: '滅亡倒數歸零了！', nextStatus: null, nextTurns: 0 }
            : { dmg: 0, heal: 0, message: `滅亡倒數剩下 ${remaining}。`, nextStatus, nextTurns: remaining };
    }

    if (state.status === 'disable' || state.status === 'silence') {
        const remaining = Math.max(0, nextTurns - 1);
        return { dmg: 0, heal: 0, message: remaining ? null : '封印效果解除了。', nextStatus: remaining ? nextStatus : null, nextTurns: remaining };
    }

    return { dmg: 0, heal: 0, message: null, nextStatus, nextTurns };
};

export const getStatMultiplier = (stage) => {
    if (!stage || stage === 0) return 1.0;
    if (stage > 0) {
        return Math.pow(1.5, stage);
    } else {
        return Math.pow(0.66, -stage);
    }
};

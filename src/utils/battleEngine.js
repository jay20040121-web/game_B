export const checkPreTurnStatus = (state, rng = Math.random) => {
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
            nextStatus: nextT <= 0 ? null : 'sleep',
            nextTurns: Math.max(0, nextT),
            clearStatus: nextT <= 0 ? 'sleep' : null
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
            nextStatus: nextT <= 0 ? null : 'freeze',
            nextTurns: Math.max(0, nextT),
            clearStatus: nextT <= 0 ? 'freeze' : null
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

    // 1. Ailment
    if (move.ailment && move.ailment !== 'none' && !targetState.status) {
        let chance = move.ailment_chance || 100;
        if (rng() * 100 < chance) {
            targetState.status = move.ailment;

            const ailmentMap = {
                burn: "燒傷了！",
                paralysis: "麻痺了！",
                poison: "中毒了！",
                sleep: "陷入睡眠了！",
                freeze: "被冰凍了！",
                confusion: "陷入混亂了！",
                'leech-seed': "被寄生種子纏上了！",
                trap: "被束縛住了！"
            };

            if (move.ailment === 'sleep') targetState.statusTurns = Math.floor(rng() * 2) + 1;
            else if (move.ailment === 'freeze') targetState.statusTurns = Math.floor(rng() * 2) + 1;
            else if (move.ailment === 'confusion') targetState.statusTurns = Math.floor(rng() * 3) + 2;
            else if (move.ailment === 'leech-seed' || move.ailment === 'trap') targetState.statusTurns = 5;

            messageObjs.push({
                text: ailmentMap[move.ailment] || `被附加了異常狀態：${move.ailment}`,
                targetType: 'target'
            });
        }
    }

    // 2. Flinch
    if (move.flinch_chance && move.flinch_chance > 0) {
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
            let targetObj = isSelf ? sourceState : targetState;

            move.stat_changes.forEach(sc => {
                const stat = sc.stat;
                if (!targetObj.statStages) targetObj.statStages = { atk: 0, def: 0, spd: 0 };

                let oldStage = targetObj.statStages[stat] || 0;
                let newStage = Math.max(-6, Math.min(6, oldStage + sc.change));
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

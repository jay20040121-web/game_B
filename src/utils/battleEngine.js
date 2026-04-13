export const checkPreTurnStatus = (state, rng = Math.random) => {
    if (!state.status) return { canAct: true, message: null };
    
    let nextStatus = state.status;
    let nextTurns = state.statusTurns || 0;

    if (state.status === 'sleep') {
        if (state.statusTurns <= 0) {
            return { canAct: true, message: "經過一番掙扎，終於醒來了！", nextStatus: null, nextTurns: 0 };
        } else {
            return { canAct: false, message: "正在呼呼大睡...", nextStatus: 'sleep', nextTurns: state.statusTurns - 1 };
        }
    }
    
    if (state.status === 'freeze') {
        if (rng() < 0.2) {
            return { canAct: true, message: "身上的冰塊融化了！", nextStatus: null, nextTurns: 0 };
        } else {
            return { canAct: false, message: "因為被冰凍了而無法行動。", nextStatus: 'freeze', nextTurns: state.statusTurns };
        }
    }
    
    if (state.status === 'paralysis') {
        if (rng() < 0.25) {
            return { canAct: false, message: "因為麻痺而無法動彈！", nextStatus: 'paralysis', nextTurns: state.statusTurns };
        }
    }

    if (state.status === 'confusion') {
        if (state.statusTurns <= 0) {
            return { canAct: true, message: "頭部不再發暈，清醒過來了！", nextStatus: null, nextTurns: 0 };
        } else {
            const nextT = state.statusTurns - 1;
            if (rng() < 0.33) {
                return { canAct: false, message: "因混亂而攻擊了自己！", selfDamage: true, nextStatus: 'confusion', nextTurns: nextT };
            }
            return { canAct: true, message: "處於混亂中...", nextStatus: 'confusion', nextTurns: nextT };
        }
    }
    
    return { canAct: true, message: null, nextStatus, nextTurns };
};

export const applyMoveEffects = (move, targetState, sourceState, rng = Math.random) => {
    let messageObjs = [];
    
    // 1. Ailment (異常狀態附加)
    if (move.ailment && move.ailment !== 'none' && !targetState.status) {
        let chance = move.ailment_chance || 100;
        if (rng() * 100 < chance) {
            targetState.status = move.ailment;
            
            const ailmentMap = {
                'burn': "被燒傷了！",
                'paralysis': "被麻痺了！",
                'poison': "中毒了！",
                'sleep': "陷入了沉睡！",
                'freeze': "被冰凍了！",
                'confusion': "混亂了！",
                'leech-seed': "被種下了種子！",
                'trap': "被束縛住了！"
            };
            
            // 設定持續回合
            if (move.ailment === 'sleep') targetState.statusTurns = Math.floor(rng() * 3) + 1;
            else if (move.ailment === 'confusion') targetState.statusTurns = Math.floor(rng() * 3) + 2; // 2~4 回合
            else if (move.ailment === 'leech-seed' || move.ailment === 'trap') targetState.statusTurns = 5; // 預設 5 回合
            
            messageObjs.push({
                text: ailmentMap[move.ailment] || `陷入了 ${move.ailment} 狀態！`,
                targetType: 'target'
            });
        }
    }
    
    // 2. Flinch (畏縮)
    if (move.flinch_chance && move.flinch_chance > 0) {
        if (rng() * 100 < move.flinch_chance) {
            if (!targetState.status) {
                targetState.flinch = true; 
            }
        }
    }

    // 3. Stat changes (能力階級)
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
                    messageObjs.push({ text: `${sName} 提升了！`, targetType: isSelf ? 'source' : 'target' });
                } else if (newStage < oldStage) {
                    messageObjs.push({ text: `${sName} 下降了！`, targetType: isSelf ? 'source' : 'target' });
                }
            });
        }
    }
    
    // 4. Drain & Recoil (吸血與反作用力) - 回傳到外界處理
    let drainPct = move.drain || 0;
    let recoilPct = move.recoil || 0;

    // 5. Power-based self-effects (平衡性：高威力副作用與低威力增益)
    if (move.power >= 100) {
        // 高威力副作用：攻擊力下降
        let change = -1;
        if (move.power >= 150) change = -4;
        else if (move.power >= 131) change = -3;
        else if (move.power >= 111) change = -2;
        
        if (!sourceState.statStages) sourceState.statStages = { atk: 0, def: 0, spd: 0 };
        let oldStage = sourceState.statStages.atk || 0;
        let newStage = Math.max(-6, oldStage + change);
        sourceState.statStages.atk = newStage;
        
        if (newStage < oldStage) {
            messageObjs.push({ text: `攻擊力大幅下降了！`, targetType: 'source' });
        }
    } else if (move.power > 0 && move.power <= 60) {
        // 低威力增益：隨機屬性提升
        let trigger = false;
        let change = 1;
        
        if (move.power <= 30) {
            trigger = true;
            change = 2;
        } else if (move.power <= 50) {
            trigger = true;
        } else if (rng() < 0.5) { // 51~60: 50% 機率
            trigger = true;
        }
        
        if (trigger) {
            const stats = ['atk', 'def', 'spd'];
            const stat = stats[Math.floor(rng() * stats.length)];
            if (!sourceState.statStages) sourceState.statStages = { atk: 0, def: 0, spd: 0 };
            
            let oldStage = sourceState.statStages[stat] || 0;
            let newStage = Math.min(6, oldStage + change);
            sourceState.statStages[stat] = newStage;
            
            if (newStage > oldStage) {
                const statNameMap = { atk: "攻擊", def: "防禦", spd: "速度" };
                messageObjs.push({ text: `${statNameMap[stat]}提升了！`, targetType: 'source' });
            }
        }
    }
    
    return { messages: messageObjs, drainPct, recoilPct };
};

export const processPostTurnStatus = (state, maxHp, rng = Math.random) => {
    if (!state.status) return { dmg: 0, heal: 0, message: null };
    
    let nextStatus = state.status;
    let nextTurns = state.statusTurns || 0;

    if (state.status === 'burn') {
        let dmg = Math.max(1, Math.floor(maxHp / 16));
        return { dmg, heal: 0, message: "受到了燒傷的傷害。", nextStatus, nextTurns };
    }
    if (state.status === 'poison') {
        let dmg = Math.max(1, Math.floor(maxHp / 8));
        return { dmg, heal: 0, message: "受到了劇毒的傷害。", nextStatus, nextTurns };
    }
    if (state.status === 'leech-seed') {
        if (state.statusTurns <= 0) { 
            return { dmg: 0, heal: 0, message: "寄生種子枯萎了。", nextStatus: null, nextTurns: 0 }; 
        }
        let dmg = Math.max(1, Math.floor(maxHp / 8));
        return { dmg, heal: dmg, message: "被寄生種子吸收了生命。", nextStatus, nextTurns: state.statusTurns - 1 };
    }
    if (state.status === 'trap') {
        if (state.statusTurns <= 0) { 
            return { dmg: 0, heal: 0, message: "束縛被解開了。", nextStatus: null, nextTurns: 0 }; 
        }
        let dmg = Math.max(1, Math.floor(maxHp / 16));
        return { dmg, heal: 0, message: "受到束縛的傷害。", nextStatus, nextTurns: state.statusTurns - 1 };
    }
    return { dmg: 0, heal: 0, message: null, nextStatus, nextTurns };
};

export const getStatMultiplier = (stage) => {
    if (!stage || stage === 0) return 1.0;
    // 使用指數成長曲線 (1.5 倍率)，讓數值變化更有感
    if (stage > 0) {
        return Math.pow(1.5, stage);
    } else {
        return Math.pow(0.66, -stage);
    }
};

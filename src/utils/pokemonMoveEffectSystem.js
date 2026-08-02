const clampStage = value => Math.max(-6, Math.min(6, value || 0));

export const getAccuracyStageMultiplier = stage => {
    const value = clampStage(stage);
    return value >= 0 ? (3 + value) / 3 : 3 / (3 - value);
};

export const getCriticalChance = move => {
    const stage = Math.max(0, (move?.crit_rate || 0) + (move?.alwaysCrit ? 3 : 0));
    return [1 / 24, 1 / 8, 1 / 2, 1][Math.min(3, stage)];
};

export const rollHitCount = (move, rng = Math.random) => {
    const min = Number(move?.min_hits) || 1;
    const max = Number(move?.max_hits) || min;
    if (max <= 1) return 1;
    if (min === 2 && max === 5) {
        const roll = rng();
        if (roll < 0.35) return 2;
        if (roll < 0.70) return 3;
        if (roll < 0.85) return 4;
        return 5;
    }
    return min + Math.floor(rng() * (max - min + 1));
};

const setTurns = (object, key, turns) => {
    object[key] = Math.max(object[key] || 0, turns);
};

const average = (a, b) => Math.max(1, Math.floor(((a || 1) + (b || 1)) / 2));
const hasType = (entity, type) => (Array.isArray(entity.type) ? entity.type : [entity.type]).includes(type);

export const validateMoveUse = (move, source, target) => {
    if (!move) return '找不到招式。';
    if ((source.tauntTurns || 0) > 0 && move.damageClass === 'status') return '受到挑釁影響，無法使出變化招式！';
    if ((source.encoreTurns || 0) > 0 && source.encoreMoveId && move.id !== source.encoreMoveId) return `受到再來一次影響，只能使用上一個招式！`;
    if ((source.tormentTurns || 0) > 0 && source.lastMove?.id === move.id) return '受到無理取鬧影響，不能連續使用相同招式！';
    if ((source.imprisonTurns || 0) > 0 && target?.moves?.some(item => item?.id === move.id)) return '這個招式被封印了！';
    const soundMoves = new Set(['boomburst', 'bug-buzz', 'disarming-voice', 'echoed-voice', 'growl', 'hyper-voice', 'metal-sound', 'perish-song', 'roar', 'round', 'snarl', 'supersonic', 'uproar']);
    if ((source.silenceTurns || 0) > 0 && soundMoves.has(move.id)) return '受到地獄突刺影響，無法使用聲音類招式！';
    return null;
};

export const applySpecialStatusMove = ({ move, source, target, field, rng = Math.random }) => {
    const result = { handled: true, messages: [], sourceDamage: 0, targetDamage: 0, sourceHeal: 0, targetHeal: 0, escape: false };
    const say = text => result.messages.push(text);
    const stages = entity => (entity.statStages ||= { atk: 0, def: 0, spd: 0, accuracy: 0, evasion: 0 });
    const side = field.sourceSide;
    const ownField = field.sides[side] ||= {};
    const opposingField = field.sides[side === 'player' ? 'enemy' : 'player'] ||= {};

    switch (move.id) {
        case 'belly-drum':
            if (source.hp > source.maxHp / 2) { result.sourceDamage = Math.floor(source.maxHp / 2); stages(source).atk = 6; say('消耗一半最大 HP，攻擊提高到最大！'); }
            else say('HP 不足，腹鼓失敗了！');
            break;
        case 'acupressure': {
            const keys = ['atk', 'def', 'spd', 'accuracy', 'evasion'];
            const key = keys[Math.floor(rng() * keys.length)];
            stages(source)[key] = clampStage(stages(source)[key] + 2);
            say(`點穴使一項能力大幅提高！`); break;
        }
        case 'after-you': source.afterYou = true; say('對手獲得了優先行動的支援！'); break;
        case 'aqua-ring': source.aquaRing = true; say('水流環包圍了身體！'); break;
        case 'baton-pass': say('目前是單隻怪獸對戰，沒有可接棒的後備怪獸。'); break;
        case 'copycat': case 'mimic': {
            const copied = target.lastMove;
            if (!copied || ['copycat', 'mimic'].includes(copied.id)) say('但是沒有可以模仿的招式！');
            else { source.copiedMove = copied; say(`記住了${copied.name}，下次可模仿使出！`); }
            break;
        }
        case 'curse':
            if (hasType(source, 'ghost')) { result.sourceDamage = Math.max(1, Math.floor(source.maxHp / 2)); target.curse = true; say('以生命施加了詛咒！'); }
            else { stages(source).atk = clampStage(stages(source).atk + 1); stages(source).def = clampStage(stages(source).def + 1); stages(source).spd = clampStage(stages(source).spd - 1); say('攻擊與防禦提高，速度降低！'); }
            break;
        case 'destiny-bond': source.destinyBond = true; say('試圖和對手同歸於盡！'); break;
        case 'electric-terrain': field.terrain = 'electric'; field.terrainTurns = 5; say('腳下變成了電氣場地！'); break;
        case 'grassy-terrain': field.terrain = 'grassy'; field.terrainTurns = 5; say('腳下變成了青草場地！'); break;
        case 'misty-terrain': field.terrain = 'misty'; field.terrainTurns = 5; say('腳下變成了薄霧場地！'); break;
        case 'encore': target.encoreMoveId = target.lastMove?.id || null; target.encoreTurns = target.encoreMoveId ? 3 : 0; say(target.encoreMoveId ? '對手只能重複最近使用的招式！' : '但是失敗了！'); break;
        case 'endure': source.endure = true; say('擺出了挺住攻擊的架勢！'); break;
        case 'entrainment': target.trait = source.trait ? { ...source.trait } : null; say('對手的特性變得和自己一樣！'); break;
        case 'focus-energy': source.focusEnergy = true; say('集中精神，更容易擊中要害！'); break;
        case 'laser-focus': source.laserFocus = true; say('下次攻擊必定擊中要害！'); break;
        case 'lock-on': source.lockOn = true; say('鎖定了對手，下次攻擊必定命中！'); break;
        case 'gastro-acid': target.trait = null; target.traitSuppressed = true; say('對手的特性效果被消除了！'); break;
        case 'gravity': field.gravityTurns = 5; say('重力變強了！'); break;
        case 'guard-split': source.def = target.def = average(source.def, target.def); say('雙方平分了防禦！'); break;
        case 'power-split': source.atk = target.atk = average(source.atk, target.atk); say('雙方平分了攻擊！'); break;
        case 'guard-swap': { const value = stages(source).def; stages(source).def = stages(target).def; stages(target).def = value; say('雙方交換了防禦變化！'); break; }
        case 'power-swap': { const value = stages(source).atk; stages(source).atk = stages(target).atk; stages(target).atk = value; say('雙方交換了攻擊變化！'); break; }
        case 'power-trick': { const value = source.atk; source.atk = source.def; source.def = value; say('自己的攻擊與防禦互換了！'); break; }
        case 'hail': field.weather = 'hail'; field.weatherTurns = 5; say('開始下冰雹了！'); break;
        case 'sandstorm': field.weather = 'sand'; field.weatherTurns = 5; say('颳起了沙暴！'); break;
        case 'rain-dance': field.weather = 'rain'; field.weatherTurns = 5; say('開始下雨了！'); break;
        case 'sunny-day': field.weather = 'sun'; field.weatherTurns = 5; say('日照變得強烈了！'); break;
        case 'haze': source.statStages = { atk: 0, def: 0, spd: 0, accuracy: 0, evasion: 0 }; target.statStages = { atk: 0, def: 0, spd: 0, accuracy: 0, evasion: 0 }; say('所有能力變化都回復了！'); break;
        case 'heal-bell': source.status = null; source.statusTurns = 0; say('異常狀態被治癒了！'); break;
        case 'healing-wish': result.sourceDamage = source.hp; say('許下治癒後備怪獸的願望；目前沒有後備怪獸可以承接。'); break;
        case 'helping-hand': source.helpingHand = true; say('下次攻擊的威力提高了！'); break;
        case 'imprison': source.imprisonTurns = 5; say('封印了雙方共有的招式！'); break;
        case 'light-screen': setTurns(ownField, 'lightScreenTurns', 5); say('展開了減輕特殊攻擊的光牆！'); break;
        case 'reflect': setTurns(ownField, 'reflectTurns', 5); say('展開了減輕物理攻擊的反射壁！'); break;
        case 'magic-room': field.magicRoomTurns = 5; say('魔法空間讓持有物暫時失效！'); break;
        case 'wonder-room': field.wonderRoomTurns = 5; say('奇妙空間扭轉了防禦規則！'); break;
        case 'magnet-rise': source.magnetRiseTurns = 5; say('利用電磁力浮了起來！'); break;
        case 'mean-look': target.trapped = true; say('對手無法逃走了！'); break;
        case 'mist': setTurns(ownField, 'mistTurns', 5); say('白霧保護能力不被降低！'); break;
        case 'safeguard': setTurns(ownField, 'safeguardTurns', 5); say('神秘守護保護了我方！'); break;
        case 'pain-split': { const hp = Math.floor((source.hp + target.hp) / 2); source.hp = Math.min(source.maxHp, hp); target.hp = Math.min(target.maxHp, hp); say('雙方平分了現有 HP！'); break; }
        case 'psych-up': source.statStages = { ...stages(target) }; say('複製了對手的能力變化！'); break;
        case 'quick-guard': source.quickGuard = true; say('準備防住先制招式！'); break;
        case 'rage-powder': source.ragePowder = true; say('吸引了所有攻擊；單打戰鬥中對手本來就只能攻擊自己。'); break;
        case 'wide-guard': source.wideGuard = true; say('準備防住廣範圍攻擊！'); break;
        case 'reflect-type': source.type = Array.isArray(target.type) ? [...target.type] : [target.type]; say('自己的屬性變得和對手相同！'); break;
        case 'rest': source.hp = source.maxHp; source.status = 'sleep'; source.statusTurns = 2; say('回復全部 HP 並睡著了！'); break;
        case 'roar': case 'whirlwind': case 'teleport': result.escape = true; say('野外戰鬥將會結束；沒有後備怪獸時訓練家戰無法替換。'); break;
        case 'role-play': source.trait = target.trait ? { ...target.trait } : null; say('複製了對手的特性！'); break;
        case 'simple-beam': target.trait = { id: 'simple', name: '單純', modifiers: {} }; say('對手的特性變成了單純！'); break;
        case 'skill-swap': { const value = source.trait; source.trait = target.trait; target.trait = value; say('雙方交換了特性！'); break; }
        case 'worry-seed': target.trait = { id: 'insomnia', name: '不眠', modifiers: {} }; if (target.status === 'sleep') { target.status = null; target.statusTurns = 0; } say('對手的特性變成不眠！'); break;
        case 'soak': target.type = ['water']; say('對手變成了水屬性！'); break;
        case 'spikes': opposingField.spikes = Math.min(3, (opposingField.spikes || 0) + 1); say('在對手場地撒下了撒菱！'); break;
        case 'stealth-rock': opposingField.stealthRock = true; say('在對手場地撒下了隱形岩！'); break;
        case 'sticky-web': opposingField.stickyWeb = true; say('在對手場地撒下了黏黏網！'); break;
        case 'toxic-spikes': opposingField.toxicSpikes = Math.min(2, (opposingField.toxicSpikes || 0) + 1); say('在對手場地撒下了毒菱！'); break;
        case 'spite': target.disabledMoveId = target.lastMove?.id || null; target.disabledMoveTurns = target.disabledMoveId ? 4 : 0; say(target.disabledMoveId ? '對手最近的招式暫時無法使用！' : '但是失敗了！'); break;
        case 'substitute': if (source.hp > source.maxHp / 4 && !source.substituteHp) { const cost = Math.floor(source.maxHp / 4); result.sourceDamage = cost; source.substituteHp = cost; say('製造了替身！'); } else say('但是無法製造替身！'); break;
        case 'switcheroo': case 'trick': { const value = source.heldItem; source.heldItem = target.heldItem; target.heldItem = value; say('雙方交換了持有物！'); break; }
        case 'tailwind': setTurns(ownField, 'tailwindTurns', 4); say('順風提高了我方速度！'); break;
        case 'taunt': target.tauntTurns = 3; say('對手受到挑釁，只能使用攻擊招式！'); break;
        case 'wish': source.wishTurns = 2; say('許下了回復 HP 的願望！'); break;
        case 'splash': say('什麼事也沒有發生！'); break;
        default: result.handled = false;
    }
    return result;
};

export const tickPokemonMoveEffects = (entity, fieldSide = {}, field = {}) => {
    const events = [];
    const decrement = key => { if ((entity[key] || 0) > 0) entity[key] -= 1; };
    ['tauntTurns', 'encoreTurns', 'imprisonTurns', 'magnetRiseTurns', 'silenceTurns', 'groundedTurns', 'tormentTurns'].forEach(decrement);
    if (entity.groundedTurns === 0) entity.isGrounded = undefined;
    if (entity.aquaRing && entity.hp > 0) events.push({ heal: Math.max(1, Math.floor(entity.maxHp / 16)), text: '水流環回復了 HP。' });
    if (entity.ingrain && entity.hp > 0) events.push({ heal: Math.max(1, Math.floor(entity.maxHp / 16)), text: '因扎根回復了 HP。' });
    if (field.terrain === 'grassy' && entity.isGrounded !== false && entity.hp > 0) events.push({ heal: Math.max(1, Math.floor(entity.maxHp / 16)), text: '從青草場地回復了 HP。' });
    if (entity.curse && entity.hp > 0) events.push({ damage: Math.max(1, Math.floor(entity.maxHp / 4)), text: '受到了詛咒傷害。' });
    if ((entity.perishTurns || 0) > 0) {
        entity.perishTurns -= 1;
        events.push(entity.perishTurns === 0
            ? { damage: entity.maxHp, text: '的滅亡倒數歸零了！' }
            : { text: `的滅亡倒數剩下 ${entity.perishTurns}。` });
    }
    if ((entity.wishTurns || 0) > 0) { entity.wishTurns -= 1; if (entity.wishTurns === 0) events.push({ heal: Math.max(1, Math.floor(entity.maxHp / 2)), text: '祈願實現並回復了 HP。' }); }
    if (field.weather === 'hail' && !hasType(entity, 'ice') && entity.hp > 0) events.push({ damage: Math.max(1, Math.floor(entity.maxHp / 16)), text: '受到冰雹傷害。' });
    if (field.weather === 'sand' && !['rock', 'ground', 'steel'].some(type => hasType(entity, type)) && entity.hp > 0) events.push({ damage: Math.max(1, Math.floor(entity.maxHp / 16)), text: '受到沙暴傷害。' });
    entity.endure = false; entity.quickGuard = false; entity.wideGuard = false; entity.destinyBond = false;
    for (const key of ['lightScreenTurns', 'reflectTurns', 'mistTurns', 'safeguardTurns', 'tailwindTurns']) if ((fieldSide[key] || 0) > 0) fieldSide[key] -= 1;
    return events;
};

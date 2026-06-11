export const MONSTER_TRAITS = [
    {
        id: 'brave_heart',
        name: '勇敢之心',
        bonus: '攻擊成長傾向提高，適合主動進攻與挑戰強敵。',
        drawback: '防禦面較不穩，長線戰鬥需要更注意承傷。',
        bonusValue: '攻擊 x1.20',
        drawbackValue: '防禦 x0.90',
        modifiers: { atk: 1.2, def: 0.9 },
        implementation: {
            status: 'ready',
            notes: '可直接接到戰鬥能力計算：攻擊倍率提高，防禦倍率降低。'
        }
    },
    {
        id: 'steady_body',
        name: '穩健體魄',
        bonus: '防禦成長傾向提高，適合耐久與穩定培育。',
        drawback: '速度成長較慢，戰鬥中較不容易取得先手。',
        bonusValue: '防禦 x1.20',
        drawbackValue: '速度 x0.90',
        modifiers: { def: 1.2, spd: 0.9 },
        implementation: {
            status: 'ready',
            notes: '可直接接到戰鬥能力計算：防禦倍率提高，速度倍率降低。'
        }
    },
    {
        id: 'quick_sense',
        name: '敏銳感官',
        bonus: '速度成長傾向提高，適合先手與閃避型打法。',
        drawback: '攻擊火力較不穩，爆發傷害需要靠招式與加護補足。',
        bonusValue: '速度 x1.20',
        drawbackValue: '攻擊 x0.90',
        modifiers: { spd: 1.2, atk: 0.9 },
        implementation: {
            status: 'ready',
            notes: '可直接接到戰鬥能力計算：速度倍率提高，攻擊倍率降低。'
        }
    },
    {
        id: 'kind_soul',
        name: '親和靈魂',
        bonus: '談心獲得的羈絆提高，較容易走向靈魂進化。',
        drawback: '特訓與戰鬥培育效率較低，需要更多照顧時間。',
        bonusValue: '談心羈絆 +20%',
        drawbackValue: '特訓/戰鬥成長 -10%',
        modifiers: { soulBondGain: 1.2, trainingGrowth: 0.9, battleGrowth: 0.9 },
        implementation: {
            status: 'ready',
            notes: '已接談心羈絆、靈魂探險羈絆、特訓 EV 與冒險/聯盟戰鬥成長。'
        }
    },
    {
        id: 'late_bloomer',
        name: '大器晚成',
        bonus: '高等級後能力成長更強，適合長線培育。',
        drawback: '低等級時成長較慢，前期推進壓力較高。',
        bonusValue: '50 級後全能力 x1.15',
        drawbackValue: '50 級前全能力 x0.90',
        modifiers: { highLevelStat: 1.15, lowLevelStat: 0.9, thresholdLevel: 50 },
        implementation: {
            status: 'ready',
            notes: '已接狀態與戰鬥能力計算，依等級切換 50 級前降低、50 級後提高。'
        }
    },
    {
        id: 'eight_gates',
        name: '八門',
        bonus: '戰鬥開始後傷害逐回合提高，持續疊加到第 3 回合。',
        drawback: '第 3 回合結束後失去目前 HP 的 80%，並結束增傷效果。',
        bonusValue: '傷害每回合 +50%',
        drawbackValue: '3 回合後目前 HP -80%',
        modifiers: { damageRampPerTurn: 0.5, rampTurns: 3, rampEndHpLoss: 0.8 },
        implementation: {
            status: 'ready',
            notes: '已接非 PvP 戰鬥傷害流程；第 3 回合結束後扣目前 HP 並停止增傷。'
        }
    },
    {
        id: 'zombie',
        name: '殭屍',
        bonus: '最大生命增加 50%，戰鬥中每回合回復最大生命的 10%。',
        drawback: '攻擊降低 20%，速度降低 50%。',
        bonusValue: 'HP x1.50 / 每回合回復最大 HP 10%',
        drawbackValue: '攻擊 x0.80 / 速度 x0.50',
        modifiers: { hp: 1.5, atk: 0.8, spd: 0.5, battleRegenMaxHp: 0.1 },
        implementation: {
            status: 'ready',
            notes: '已接能力值與非 PvP 戰鬥回合結束回血流程。'
        }
    },
    {
        id: 'feign_death',
        name: '裝死',
        bonus: '戰鬥中 HP 歸 0 時可以自動復活 1 次，HP 回到 1，且不觸發戰鬥失敗。',
        drawback: '最大血量降低，戰鬥承受失誤的空間變小。',
        bonusValue: '戰鬥復活 1 次',
        drawbackValue: 'HP x0.70',
        modifiers: { hp: 0.7, battleRevive: 1 },
        implementation: {
            status: 'ready',
            notes: '已接戰鬥 HP 歸 0 流程；每場非 PvP 戰鬥最多觸發一次。'
        }
    },
    {
        id: 'absolute_defense',
        name: '絕對防禦',
        bonus: '每回合受到對手攻擊時，有 50% 機率讓該次傷害無效化。',
        drawback: '攻擊與速度大幅降低，需要靠耐久和運氣拖住戰局。',
        bonusValue: '受攻擊時 50% 機率無效化',
        drawbackValue: '攻擊 x0.50 / 速度 x0.50',
        modifiers: { atk: 0.5, spd: 0.5, nullifyIncomingDamageChance: 0.5 },
        implementation: {
            status: 'ready',
            notes: '已接能力值計算與戰鬥傷害流程；受到有傷害的攻擊時擲 50% 機率無效化。'
        }
    },
    {
        id: 'sun_child',
        name: '太陽之子',
        bonus: '火屬性技能傷害提高，受到水屬性技能時傷害大幅降低。',
        drawback: '攻擊與生命大幅降低，需要靠火力時機和抗水能力創造優勢。',
        bonusValue: '火屬性技能傷害 x1.30 / 受到水屬性技能傷害 x0.30',
        drawbackValue: '攻擊 x0.80 / HP x0.80',
        modifiers: { atk: 0.8, hp: 0.8, fireMoveDamage: 1.3, waterDamageTaken: 0.3, battleSceneEffect: '太陽之子' },
        implementation: {
            status: 'ready',
            notes: '已接能力值、戰鬥傷害倍率與戰鬥場景太陽特效。'
        }
    },
    {
        id: 'rain_doll',
        name: '雨天娃娃',
        bonus: '水屬性技能傷害大幅提高，受到草屬性技能時傷害大幅降低。',
        drawback: '生命與防禦大幅降低，需要避免被非草屬性高傷害擊中。',
        bonusValue: '水屬性技能傷害 x1.30 / 受到草屬性技能傷害 x0.30',
        drawbackValue: 'HP x0.80 / 防禦 x0.80',
        modifiers: { hp: 0.8, def: 0.8, waterMoveDamage: 1.3, grassDamageTaken: 0.3, battleSceneEffect: '雨天娃娃' },
        implementation: {
            status: 'ready',
            notes: '已接能力值、戰鬥傷害倍率與戰鬥場景雨天娃娃特效。'
        }
    },
    {
        id: 'magician',
        name: '魔術師',
        bonus: '戰鬥開場時，將自己的第一招與附魔轉移給對方，並取得對方原本的第一招與附魔。',
        drawback: '一場戰鬥只能在開場觸發一次。',
        bonusValue: '開場交換雙方第一招與附魔',
        drawbackValue: '每場戰鬥限開場 1 次',
        modifiers: { openingMoveTransfer: 1 },
        implementation: {
            status: 'ready',
            notes: '已接戰鬥建立流程；開場時交換雙方第一格招式與該招式附魔。'
        }
    }
];

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

export const generateMonsterTraits = () => ({
    trait: pickRandom(MONSTER_TRAITS)
});

export const normalizeMonsterTraits = (traits) => {
    if (traits?.trait) return traits;
    if (traits?.talent) {
        const matched = MONSTER_TRAITS.find(trait => trait.id === traits.talent.id);
        return { trait: matched || traits.talent };
    }
    return generateMonsterTraits();
};

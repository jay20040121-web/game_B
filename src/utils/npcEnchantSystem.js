import { SKILL_DATABASE } from '../monsterData';

const ENCHANT_EFFECTS = [
    { id: 'burn', type: 'ailment', value: 10 },
    { id: 'paralysis', type: 'ailment', value: 10 },
    { id: 'poison', type: 'ailment', value: 10 },
    { id: 'confusion', type: 'ailment', value: 10 },
    { id: 'leech-seed', type: 'ailment', value: 10 },
    { id: 'trap', type: 'ailment', value: 10 },
    { id: 'freeze', type: 'ailment', value: 10 },
    { id: 'sleep', type: 'ailment', value: 10 },
    { id: 'lifesteal', type: 'stat', value: 5 },
    { id: 'accuracy', type: 'stat', value: 10 },
    { id: 'priority', type: 'stat', value: 0.5 }
];

export const getNpcEnchantCountByPlayerLevel = (playerLevel) => {
    if (playerLevel < 30) return 0;
    if (playerLevel >= 100) return 7;

    const progress = (playerLevel - 30) / 70;
    const expected = progress * 7;
    const base = Math.floor(expected);
    const fractional = expected - base;

    return base + (Math.random() < fractional ? 1 : 0);
};

export const generateNpcMoveUpgrades = (moves, playerLevel) => {
    const enchantCount = getNpcEnchantCountByPlayerLevel(playerLevel);
    if (enchantCount <= 0) return {};

    return (moves || []).reduce((upgrades, moveRef) => {
        const moveId = typeof moveRef === 'string' ? moveRef : moveRef?.id;
        const move = typeof moveRef === 'object' ? moveRef : SKILL_DATABASE[moveId];

        if (!moveId || !move || (move.power || 0) <= 0) return upgrades;

        const ailments = {};
        let appliedCount = 0;

        for (let i = 0; i < enchantCount; i++) {
            const effect = ENCHANT_EFFECTS[Math.floor(Math.random() * ENCHANT_EFFECTS.length)];
            if (!effect) continue;

            if (effect.type === 'ailment') {
                ailments[effect.id] = Math.min(100, (ailments[effect.id] || 0) + effect.value);
            } else {
                ailments[effect.id] = (ailments[effect.id] || 0) + effect.value;
            }
            appliedCount++;
        }

        if (appliedCount > 0) {
            upgrades[moveId] = {
                ailments,
                count: appliedCount
            };
        }

        return upgrades;
    }, {});
};

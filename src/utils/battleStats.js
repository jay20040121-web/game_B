export const buildPlayerBattleProfile = ({
    advStats,
    calcFinalStat,
    getLevelByPower,
    monsterTraits,
    skillDatabase,
    speciesBaseStats,
    speciesId,
}) => {
    const level = getLevelByPower(advStats.basePower);
    const traitMods = monsterTraits?.trait?.modifiers || {};
    const levelTraitMod = level >= (traitMods.thresholdLevel || Infinity)
        ? (traitMods.highLevelStat || 1)
        : (traitMods.lowLevelStat || 1);
    const getTraitStatMod = (key) => (traitMods[key] || 1) * levelTraitMod;

    const hp = Math.max(1, Math.floor(calcFinalStat('hp', speciesId, advStats.ivs.hp, advStats.evs.hp, level) * getTraitStatMod('hp')));
    const atk = Math.max(1, Math.floor(calcFinalStat('atk', speciesId, advStats.ivs.atk, advStats.evs.atk, level) * getTraitStatMod('atk')));
    const def = Math.max(1, Math.floor(calcFinalStat('def', speciesId, advStats.ivs.def, advStats.evs.def, level) * getTraitStatMod('def')));
    const spd = Math.max(1, Math.floor(calcFinalStat('spd', speciesId, advStats.ivs.spd, advStats.evs.spd, level) * getTraitStatMod('spd')));

    const statsRef = speciesBaseStats[String(speciesId)] || { types: ['normal'] };
    const type = statsRef.types;
    const moves = (advStats.moves || []).map(id => skillDatabase[id]).filter(Boolean);
    if (moves.length === 0) moves.push(skillDatabase.tackle || { name: '撞擊', power: 40, type: 'normal' });

    return { hp, atk, def, spd, type, moves, level, trait: monsterTraits?.trait || null };
};

export const getNatureMods = (tag, natureConfig) => {
    const mods = { hp: 1.0, atk: 1.0, def: 1.0, spd: 1.0 };
    const conf = natureConfig[tag];
    if (conf) {
        if (conf.buff) mods[conf.buff] = 1.1;
        if (conf.nerf) mods[conf.nerf] = 0.9;
    }
    return mods;
};

export const buildPlayerBattleProfile = ({
    advStats,
    calcFinalStat,
    getLevelByPower,
    monsterTraits,
    natureConfig,
    skillDatabase,
    soulTagCounts,
    speciesBaseStats,
    speciesId,
}) => {
    const level = getLevelByPower(advStats.basePower);
    const tagEntries = Object.entries(soulTagCounts);
    const best = tagEntries.reduce((a, b) => a[1] > b[1] ? a : b, ['none', 0]);
    const dominantTag = best[1] > 0 ? best[0] : 'none';
    const natureMods = getNatureMods(dominantTag, natureConfig);

    const traitMods = monsterTraits?.trait?.modifiers || {};
    const levelTraitMod = level >= (traitMods.thresholdLevel || Infinity)
        ? (traitMods.highLevelStat || 1)
        : (traitMods.lowLevelStat || 1);
    const getTraitStatMod = (key) => (traitMods[key] || 1) * levelTraitMod;

    const hp = Math.max(1, Math.floor(calcFinalStat('hp', speciesId, advStats.ivs.hp, advStats.evs.hp, level, natureMods.hp) * getTraitStatMod('hp')));
    const atk = Math.max(1, Math.floor(calcFinalStat('atk', speciesId, advStats.ivs.atk, advStats.evs.atk, level, natureMods.atk) * getTraitStatMod('atk')));
    const def = Math.max(1, Math.floor(calcFinalStat('def', speciesId, advStats.ivs.def, advStats.evs.def, level, natureMods.def) * getTraitStatMod('def')));
    const spd = Math.max(1, Math.floor(calcFinalStat('spd', speciesId, advStats.ivs.spd, advStats.evs.spd, level, natureMods.spd) * getTraitStatMod('spd')));

    const statsRef = speciesBaseStats[String(speciesId)] || { types: ['normal'] };
    const type = statsRef.types;
    const moves = (advStats.moves || []).map(id => skillDatabase[id]).filter(Boolean);
    if (moves.length === 0) moves.push(skillDatabase.tackle || { name: '撞擊', power: 40, type: 'normal' });

    return { hp, atk, def, spd, type, moves, level, trait: monsterTraits?.trait || null };
};

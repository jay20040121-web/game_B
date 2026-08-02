export const getRogueTeamAverageLevel = team => {
    const levels = (Array.isArray(team) ? team : [])
        .map(member => Number(member?.level))
        .filter(level => Number.isFinite(level) && level > 0);
    if (!levels.length) return 1;
    return Math.max(1, Math.min(100, Math.round(levels.reduce((sum, level) => sum + level, 0) / levels.length)));
};

export const getRogueEnemyLevel = (wave, teamAverageLevel) => {
    const safeWave = Math.max(1, Math.floor(Number(wave) || 1));
    const safeAverage = Math.max(1, Math.min(100, Math.round(Number(teamAverageLevel) || 1)));

    let levelOffset;
    if (safeWave <= 10) levelOffset = -5;
    else if (safeWave <= 25) levelOffset = -5 + Math.ceil((safeWave - 10) / 5);
    else levelOffset = Math.ceil((safeWave - 25) / 5);

    return Math.max(1, Math.min(100, safeAverage + levelOffset));
};

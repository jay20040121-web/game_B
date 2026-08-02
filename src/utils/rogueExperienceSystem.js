const MAX_LEVEL = 100;
export const getRogueExperienceForLevel = level => Math.max(1, Math.min(MAX_LEVEL, Math.floor(Number(level) || 1))) ** 3;
export const getRogueLevelFromExperience = experience => Math.max(1, Math.min(MAX_LEVEL, Math.floor(Math.cbrt(Math.max(1, Number(experience) || 1)))));
export const getRogueBattleExperience = (enemy, stats = {}) => {
    const statTotal = ['hp', 'atk', 'def', 'spd'].reduce((total, stat) => total + (Number(stats[stat]) || 50), 0);
    const baseExperience = Math.max(40, Math.round(statTotal / 2));
    const level = Math.max(1, Math.min(MAX_LEVEL, Number(enemy?.level) || 1));
    const bossMultiplier = enemy?.bossTier === 'gymBoss' || (enemy?.boss && !enemy?.bossTier)
        ? 1.5
        : enemy?.bossTier === 'miniBoss' ? 1.25 : 1;
    return Math.max(1, Math.floor((baseExperience * level * bossMultiplier) / 7));
};
const statAtLevel = (calcFinalStat, member, stat, level) => calcFinalStat(stat, member.id, member.ivs?.[stat] ?? 15, member.evs?.[stat] ?? 0, level);
export const distributeRogueExperience = ({ team, totalExperience, calcFinalStat, generateMoves }) => {
    if (!team.length) return { team, gains: [] };
    const total = Math.max(0, Math.floor(Number(totalExperience) || 0));
    const baseShare = Math.floor(total / team.length);
    const remainder = total % team.length;
    const gains = [];
    const nextTeam = team.map((member, index) => {
        const gained = baseShare + (index < remainder ? 1 : 0);
        const oldLevel = Math.max(1, Math.min(MAX_LEVEL, Number(member.level) || 1));
        const oldExperience = Number.isFinite(member.experience) ? member.experience : getRogueExperienceForLevel(oldLevel);
        const experience = Math.min(getRogueExperienceForLevel(MAX_LEVEL), oldExperience + gained);
        const level = getRogueLevelFromExperience(experience);
        gains.push({ id: member.id, name: member.name, gained, oldLevel, level, leveledUp: level > oldLevel });
        if (level === oldLevel) return { ...member, experience };
        const oldBaseHp = statAtLevel(calcFinalStat, member, 'hp', oldLevel);
        const newBaseHp = statAtLevel(calcFinalStat, member, 'hp', level);
        const maxHp = Math.max(1, Math.round(newBaseHp * (oldBaseHp > 0 ? member.maxHp / oldBaseHp : 1)));
        const hp = member.hp > 0 ? Math.min(maxHp, member.hp + maxHp - member.maxHp) : 0;
        const scaleStat = stat => {
            const oldBase = statAtLevel(calcFinalStat, member, stat, oldLevel);
            return Math.max(1, Math.round(statAtLevel(calcFinalStat, member, stat, level) * (oldBase > 0 ? member[stat] / oldBase : 1)));
        };
        return { ...member, experience, level, maxHp, hp, atk: scaleStat('atk'), def: scaleStat('def'), spd: scaleStat('spd'), moves: generateMoves(member.id, level).slice(-4) };
    });
    return { team: nextTeam, gains };
};

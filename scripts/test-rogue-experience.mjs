import assert from 'node:assert/strict';
import { distributeRogueExperience, getRogueBattleExperience, getRogueExperienceForLevel } from '../src/utils/rogueExperienceSystem.js';
const calcFinalStat = (stat, id, iv, ev, level) => (stat === 'hp' ? 20 : 10) + level;
const generateMoves = (id, level) => ['move-' + level];
const team = [
    { id: 1, name: 'A', level: 5, experience: getRogueExperienceForLevel(5), ivs: {}, evs: {}, hp: 20, maxHp: 25, atk: 15, def: 15, spd: 15, moves: [] },
    { id: 4, name: 'B', level: 5, experience: getRogueExperienceForLevel(5), ivs: {}, evs: {}, hp: 0, maxHp: 25, atk: 15, def: 15, spd: 15, moves: [] },
    { id: 7, name: 'C', level: 5, experience: getRogueExperienceForLevel(5), ivs: {}, evs: {}, hp: 20, maxHp: 25, atk: 15, def: 15, spd: 15, moves: [] },
];
const result = distributeRogueExperience({ team, totalExperience: 20, calcFinalStat, generateMoves });
assert.deepEqual(result.gains.map(entry => entry.gained), [7, 7, 6]);
assert.equal(result.gains.reduce((sum, entry) => sum + entry.gained, 0), 20);
assert.equal(result.team[1].experience, getRogueExperienceForLevel(5) + 7);
const levelUp = distributeRogueExperience({ team: [team[0]], totalExperience: 100, calcFinalStat, generateMoves });
assert.ok(levelUp.team[0].level > 5);
assert.deepEqual(levelUp.team[0].moves, ['move-' + levelUp.team[0].level]);
assert.ok(getRogueBattleExperience({ level: 10, boss: true }, { hp: 50, atk: 50, def: 50, spd: 50 }) > getRogueBattleExperience({ level: 10 }, { hp: 50, atk: 50, def: 50, spd: 50 }));
console.log('Rogue experience distribution passed.');

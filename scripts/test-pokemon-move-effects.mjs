import assert from 'node:assert/strict';
import { POKEMON_MOVE_DATABASE } from '../src/data/pokemonMoveData.js';
import {
    applySpecialStatusMove,
    getAccuracyStageMultiplier,
    getCriticalChance,
    rollHitCount
} from '../src/utils/pokemonMoveEffectSystem.js';

assert.equal(getAccuracyStageMultiplier(0), 1);
assert.equal(getAccuracyStageMultiplier(6), 3);
assert.equal(getAccuracyStageMultiplier(-6), 1 / 3);
assert.equal(getCriticalChance({ crit_rate: 3 }), 1);
assert.equal(rollHitCount({ min_hits: 2, max_hits: 5 }, () => 0), 2);
assert.equal(rollHitCount({ min_hits: 2, max_hits: 5 }, () => 0.99), 5);

const createEntity = () => ({
    hp: 100,
    maxHp: 100,
    atk: 50,
    def: 50,
    spd: 50,
    type: ['normal'],
    statStages: { atk: 0, def: 0, spd: 0, accuracy: 0, evasion: 0 },
    moves: []
});
const makeField = () => ({ sourceSide: 'player', sides: { player: {}, enemy: {} } });

const source = createEntity();
const target = createEntity();
let result = applySpecialStatusMove({ move: POKEMON_MOVE_DATABASE['aqua-ring'], source, target, field: makeField(), rng: () => 0 });
assert.equal(result.handled, true);
assert.equal(source.aquaRing, true);

result = applySpecialStatusMove({ move: POKEMON_MOVE_DATABASE['light-screen'], source, target, field: makeField(), rng: () => 0 });
assert.equal(result.handled, true);

const implementation = await import('node:fs/promises').then(fs => fs.readFile(new URL('../src/utils/pokemonMoveEffectSystem.js', import.meta.url), 'utf8'));
const specialStatusMoves = Object.values(POKEMON_MOVE_DATABASE).filter(move =>
    move.damageClass === 'status'
    && !(move.power > 0)
    && (!move.ailment || move.ailment === 'none')
    && !(move.stat_changes?.length)
    && !move.isProtect
    && !(move.healing > 0)
);
const missing = specialStatusMoves.filter(move => !implementation.includes(`case '${move.id}'`));
assert.deepEqual(missing.map(move => move.id), []);

console.log(`Pokemon move effects OK: ${Object.keys(POKEMON_MOVE_DATABASE).length} moves, ${specialStatusMoves.length} special status moves covered.`);

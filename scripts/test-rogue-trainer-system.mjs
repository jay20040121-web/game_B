import assert from 'node:assert/strict';
import { createRogueEncounterPlan, getRogueTrainerPartySize, ROGUE_GYM_LEADERS } from '../src/utils/rogueTrainerSystem.js';

assert.equal(getRogueTrainerPartySize(5), 2);
assert.equal(getRogueTrainerPartySize(10), 2);
assert.equal(getRogueTrainerPartySize(15), 3);
assert.equal(getRogueTrainerPartySize(20), 3);
assert.equal(getRogueTrainerPartySize(45), 6);
assert.equal(getRogueTrainerPartySize(100), 6);
const available = ROGUE_GYM_LEADERS.flatMap(leader => leader.speciesIds);
const wild = Array.from({ length: 50 }, (_, index) => index + 1);
assert.equal(createRogueEncounterPlan(4, wild, available).kind, 'wild');
const mini = createRogueEncounterPlan(5, wild, available);
assert.equal(mini.kind, 'miniBoss');
assert.equal(mini.speciesIds.length, 2);
assert.equal(new Set(mini.speciesIds).size, 2);
for (const wave of [10, 20, 30, 40, 50, 100]) {
    const gym = createRogueEncounterPlan(wave, wild, available);
    assert.equal(gym.kind, 'gymBoss');
    assert.equal(gym.speciesIds.length, getRogueTrainerPartySize(wave));
    assert.ok(gym.speciesIds.every(id => gym.trainer.speciesIds.includes(id)));
}
console.log('Rogue trainer and gym boss progression passed.');

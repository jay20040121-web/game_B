export const ROGUE_GYM_LEADERS = [
    { id: 'brock', name: '小剛', title: '岩石系道館館主', speciesIds: [74, 75, 111, 112, 95, 142] },
    { id: 'lt_surge', name: '馬志士', title: '電系道館館主', speciesIds: [81, 82, 100, 125, 25, 26] },
    { id: 'erika', name: '莉佳', title: '草系道館館主', speciesIds: [43, 44, 114, 1, 2, 3] },
    { id: 'sabrina', name: '娜姿', title: '超能力系道館館主', speciesIds: [92, 93, 63, 64, 94, 65] },
    { id: 'blaine', name: '夏伯', title: '火系道館館主', speciesIds: [37, 58, 77, 4, 5, 6] },
    { id: 'giovanni', name: '坂木', title: '地面系道館館主', speciesIds: [29, 32, 30, 33, 31, 34] },
];

const ROADSIDE_TRAINERS = [
    { id: 'youngster', name: '短褲少年', title: '路邊訓練家' },
    { id: 'lass', name: '迷你裙', title: '路邊訓練家' },
    { id: 'hiker', name: '登山男', title: '路邊訓練家' },
    { id: 'ace_trainer', name: '菁英訓練家', title: '路邊訓練家' },
    { id: 'backpacker', name: '背包客', title: '路邊訓練家' },
];

const pick = list => list[Math.floor(Math.random() * list.length)];

export const getRogueTrainerPartySize = wave => Math.min(6, Math.floor((Math.max(5, wave) + 5) / 10) + 1);

const pickUnique = (ids, count) => {
    const shuffled = [...new Set(ids)].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
};

export const createRogueEncounterPlan = (wave, wildIds, availableSpeciesIds) => {
    if (wave % 5 !== 0) return { kind: 'wild', trainer: null, speciesIds: [pick(wildIds)] };
    const partySize = getRogueTrainerPartySize(wave);
    if (wave % 10 !== 0) {
        return { kind: 'miniBoss', trainer: pick(ROADSIDE_TRAINERS), speciesIds: pickUnique(wildIds, partySize) };
    }
    const available = new Set(availableSpeciesIds);
    const eligibleLeaders = ROGUE_GYM_LEADERS.filter(leader => leader.speciesIds.filter(id => available.has(id)).length >= partySize);
    const trainer = pick(eligibleLeaders.length ? eligibleLeaders : ROGUE_GYM_LEADERS);
    return {
        kind: 'gymBoss',
        trainer,
        speciesIds: trainer.speciesIds.filter(id => available.has(id)).slice(-partySize),
    };
};

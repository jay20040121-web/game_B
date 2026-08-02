// Generated from PokeAPI (zh-Hant)

// 怪獸名稱表 — 直接使用 National Pokédex ID
import { MONSTER_REGISTRY } from './data/monsterRegistry.js';
import { POKEMON_ASSET_IDS } from './data/pokemonMapping.js';
import { POKEMON_EVOLUTION_CHAINS } from './data/pokemonEvolutionSystem.js';
import { POKEMON_LEVEL_UP_LEARNSETS, POKEMON_MOVE_DATABASE } from './data/pokemonMoveData.js';
import { ADVENTURE_WILD_POKEMON_IDS } from './data/adventureWildPokemonData.js';

// 從中央怪獸註冊表動態生成資料，確保單一資料來源 (Single Source of Truth)
export const MONSTER_NAMES = Object.fromEntries(
    MONSTER_REGISTRY.map(monster => [monster.id, monster.name])
);

export const SPECIES_BASE_STATS = Object.fromEntries(
    MONSTER_REGISTRY.map(monster => [
        monster.id,
        {
            hp: monster.baseStats.hp,
            atk: monster.baseStats.atk,
            def: monster.baseStats.def,
            spd: monster.baseStats.spd,
            types: monster.types
        }
    ])
);

export const MONSTER_ASSET_IDS = POKEMON_ASSET_IDS;

export const TYPE_MAP = {
    normal: '普', fire: '火', water: '水', electric: '電', grass: '草', ice: '冰',
    fighting: '鬥', poison: '毒', ground: '地', flying: '飛', psychic: '超', bug: '蟲',
    rock: '岩', ghost: '鬼', dragon: '龍', dark: '惡', steel: '鋼', fairy: '妖'
};
// --- Pokémon 正式招式資料庫（由 PokéAPI 生成） ---
export const SKILL_DATABASE = POKEMON_MOVE_DATABASE;

export const TYPE_SKILLS = Object.freeze(Object.values(SKILL_DATABASE).reduce((groups, move) => {
    if (!groups[move.type]) groups[move.type] = [];
    groups[move.type].push(move.id);
    return groups;
}, {}));

export const OBTAINABLE_MONSTER_IDS = POKEMON_EVOLUTION_CHAINS.flat().map(String);

export const ADVENTURE_ONLY_WILD_IDS = Object.freeze(ADVENTURE_WILD_POKEMON_IDS.map(String));

export const ADV_WILD_POOL = ADVENTURE_ONLY_WILD_IDS.map(id => ({
    id: Number(id),
    name: MONSTER_NAMES[id],
    weight: 1,
    power: 100,
    type: SPECIES_BASE_STATS[id]?.types?.[0] || 'normal'
}));

export const TYPE_CHART = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0 },
    dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};
export const getTypeMultiplier = (atkType, defTypes) => {
    const targetTypes = Array.isArray(defTypes) ? defTypes : [defTypes];
    let multiplier = 1.0;
    for (const defType of targetTypes) {
        if (TYPE_CHART[atkType] && TYPE_CHART[atkType][defType] !== undefined) {
            multiplier *= TYPE_CHART[atkType][defType];
        }
    }
    return multiplier;
};

export const calculateDamage = (atk, def, power, multiplier = 1.0) => {
    const baseDamage = (atk / def) * power * 0.5;
    return Math.max(1, Math.floor(baseDamage * multiplier * (0.9 + Math.random() * 0.2)));
};

export const getPokemonLevelUpLearnset = (speciesId) =>
    POKEMON_LEVEL_UP_LEARNSETS[String(speciesId)]?.moves || [];

export const getPokemonMovesAtLevel = (speciesId, level) =>
    getPokemonLevelUpLearnset(speciesId).filter(entry => entry.level === Number(level));

export const getPokemonMovesLearnedBetween = (speciesId, previousLevel, currentLevel) =>
    getPokemonLevelUpLearnset(speciesId).filter(entry => entry.level > Number(previousLevel) && entry.level <= Number(currentLevel));

export const generateMoves = (speciesId, level = 1) => {
    const learnset = getPokemonLevelUpLearnset(speciesId);
    if (learnset.length === 0) return [];

    const eligible = learnset.filter(entry => entry.level <= Number(level));
    const source = eligible.length > 0 ? eligible : [learnset[0]];
    const orderedUnique = [];
    source.forEach(({ moveId }) => {
        const previousIndex = orderedUnique.indexOf(moveId);
        if (previousIndex >= 0) orderedUnique.splice(previousIndex, 1);
        if (SKILL_DATABASE[moveId]) orderedUnique.push(moveId);
    });
    return orderedUnique.slice(-4);
};
export const calcFinalStat = (type, speciesId, iv, ev, level) => {
    const baseStats = SPECIES_BASE_STATS[String(speciesId)] || { hp: 50, atk: 50, def: 50, spd: 50 };
    const base = baseStats[type] || 50;

    if (type === 'hp') {
        return Math.floor(((2 * base + iv + (ev / 4)) * level) / 100) + level + 10;
    } else {
        return Math.floor(((2 * base + iv + (ev / 4)) * level) / 100) + 5;
    }
};

/**
 * 將戰鬥力 (basePower) 轉換為等級 (Level 1-100)
 * 1-30級：每 10 點一級 (門檻: 100, 110, ..., 390)
 * 31-100級：升級所需點數依二次曲線成長，99級升100級需約 300 點 (原本的 30 倍)
 */
export const getLevelByPower = (power) => {
    const p = power || 100;
    if (p < 100) return 1;
    if (p <= 390) {
        return Math.floor((p - 100) / 10) + 1;
    }

    // 30 級以後使用迴圈計算門檻
    let currentThreshold = 390;
    for (let lv = 30; lv < 100; lv++) {
        // 增量公式：10 + a * (x^2), 其中 a = 290 / 4900 ≈ 0.0592
        const nextRequired = 10 + (290 / 4900) * Math.pow(lv - 29, 2);
        currentThreshold += nextRequired;
        if (p < Math.floor(currentThreshold)) return lv;
    }
    return 100;
};

/**
 * 取得特定等級所需的總戰鬥力門檻 (用於進度條或計算)
 */
export const getPowerThreshold = (level) => {
    const lv = Math.max(1, Math.min(100, level));
    if (lv <= 1) return 100;
    if (lv <= 30) return 100 + (lv - 1) * 10;

    let total = 390;
    for (let i = 30; i < lv; i++) {
        total += 10 + (290 / 4900) * Math.pow(i - 29, 2);
    }
    return Math.floor(total);
};

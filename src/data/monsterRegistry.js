import { POKEMON_MAPPINGS } from './pokemonMapping.js';

export const MONSTER_REGISTRY = Object.values(POKEMON_MAPPINGS).map(pokemon => ({
    id: pokemon.pokemonId,
    name: pokemon.name,
    types: pokemon.types,
    baseStats: pokemon.baseStats,
    pokemonId: pokemon.pokemonId
}));

export const REGISTRY_BY_ID = Object.fromEntries(MONSTER_REGISTRY.map(monster => [String(monster.id), monster]));
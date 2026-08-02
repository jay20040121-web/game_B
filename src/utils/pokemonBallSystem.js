export const POKEMON_BALL_ITEM_ID = 'POKE_BALL';

const clone = value => JSON.parse(JSON.stringify(value));

export const createPokemonSnapshot = (data = {}) => ({
    speciesId: Number(data.speciesId || 4),
    evolutionStage: Number(data.evolutionStage || 1),
    evolutionBranch: data.evolutionBranch || `WILD_${Number(data.speciesId || 4)}`,
    types: clone(data.types || []),
    advStats: clone(data.advStats || {}),
    monsterTraits: clone(data.monsterTraits || null),
    bondValue: Number(data.bondValue || 0),
    talkCount: Number(data.talkCount || 0),
    lockedAffinity: data.lockedAffinity || null,
    soulAffinityCounts: clone(data.soulAffinityCounts || { fire: 0, water: 0, grass: 0, bug: 0 }),
    interactionLogs: clone(data.interactionLogs || []),
    interactionCount: Number(data.interactionCount || 0),
    hunger: Number(data.hunger ?? 60),
    mood: Number(data.mood ?? 50),
    isSleeping: Boolean(data.isSleeping),
    isPooping: Boolean(data.isPooping),
    lastEvolutionTime: Number(data.lastEvolutionTime || Date.now())
});

export const createPokemonBall = (pokemon, ballId = null) => ({
    id: POKEMON_BALL_ITEM_ID,
    ballId: ballId || `ball_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    name: '寶可夢球',
    pokemon: createPokemonSnapshot(pokemon)
});

export const isPokemonBall = item => item?.id === POKEMON_BALL_ITEM_ID && item?.ballId && item?.pokemon;

export const normalizePokemonBalls = inventory => (Array.isArray(inventory) ? inventory : [])
    .filter(isPokemonBall)
    .map(ball => createPokemonBall(ball.pokemon, ball.ballId));

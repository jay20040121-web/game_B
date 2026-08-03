import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADDITIONAL_THREE_STAGE_IDS } from '../src/data/additionalThreeStagePokemonData.js';

const BASE_SPECIES_IDS = [4,5,6,7,8,9,116,117,230,1,2,3,252,253,254,13,14,15,543,544,545,92,93,94,280,281,282,607,608,609,396,397,398,74,75,76,172,25,26,66,67,68,147,148,149,37,54,58,77,95,100,123,129,131,133,142,615,213,127,214,115,128,241,561,626,369,442,621,631,632,618,324,594,227,234,359,538,539,556,337,338,357,550,335,336,203,455,531,211,352,479,114,200,207,215,313,314,587,351,206,441,222];
const SPECIES_IDS = [...new Set([...BASE_SPECIES_IDS, ...ADDITIONAL_THREE_STAGE_IDS])];
const API = 'https://pokeapi.co/api/v2';
const VERSION_PRIORITY = [
  'red-green-japan', 'blue-japan', 'red-blue', 'yellow', 'gold-silver', 'crystal',
  'ruby-sapphire', 'colosseum', 'emerald', 'xd', 'firered-leafgreen', 'diamond-pearl',
  'platinum', 'heartgold-soulsilver', 'black-white', 'black-2-white-2', 'x-y',
  'omega-ruby-alpha-sapphire', 'sun-moon', 'ultra-sun-ultra-moon',
  'lets-go-pikachu-lets-go-eevee', 'sword-shield', 'the-isle-of-armor', 'the-crown-tundra',
  'brilliant-diamond-shining-pearl', 'legends-arceus', 'scarlet-violet', 'the-teal-mask',
  'the-indigo-disk', 'legends-za', 'mega-dimension', 'champions'
];
const versionRank = name => VERSION_PRIORITY.indexOf(name);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT = path.join(ROOT, 'src', 'data', 'pokemonMoveData.js');
const SOURCE_DOC = path.join(ROOT, 'docs', 'pokemon-move-data.md');

const fetchJson = async (url) => {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
      lastError = new Error(`${response.status} ${response.statusText}: ${url}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 400));
  }
  throw lastError;
};
const mapLimit = async (items, limit, mapper) => {
  const results = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
};
const idFromUrl = (url) => Number(url.match(/\/(\d+)\/?$/)?.[1] || 0);
const localize = (entries = [], field = 'name') => entries.find(e => e.language?.name === 'zh-hant')?.[field]
  || entries.find(e => e.language?.name === 'zh-hans')?.[field]
  || entries.find(e => e.language?.name === 'en')?.[field]
  || '';
const cleanText = value => String(value || '').replace(/[\n\f\r]+/g, ' ').replace(/\s+/g, ' ').trim();
const statMap = { attack: 'atk', defense: 'def', speed: 'spd', accuracy: 'accuracy', evasion: 'evasion', 'special-attack': 'atk', 'special-defense': 'def' };
const selfTargets = new Set(['user', 'users-field', 'user-and-allies', 'all-allies']);
const protectMoves = new Set(['protect', 'detect', 'kings-shield', 'spiky-shield', 'baneful-bunker', 'silk-trap', 'burning-bulwark', 'obstruct']);
const TRADITIONAL_MOVE_TEXT_OVERRIDES = {
  'headlong-rush': { name: '突飛猛撲', description: '以全身撞擊的方式猛撞對手。同時會降低自己的防禦與特防。' },
  'hyper-drill': { name: '強力鑽', description: '高速旋轉身體尖端刺穿對手。可以擊中正在使用守住或看穿等招式的對手。' },
  'raging-bull': { name: '怒牛', description: '像狂怒的牛一樣撞擊對手。招式屬性會依自己的形態而改變，也能破壞光牆與反射壁等屏障。' },
  'raging-fury': { name: '大憤慨', description: '連續２～３回合猛烈攻擊並噴出火焰，之後自己會陷入混亂。' },
  'twin-beam': { name: '雙光束', description: '從雙眼發射神秘光束攻擊對手。會連續命中對手兩次。' },
  'wave-crash': { name: '波動衝', description: '讓水流包覆全身後，以身體猛烈撞擊對手。自己也會受到相當大的傷害。' }
};

const pokemon = await mapLimit(SPECIES_IDS, 8, id => fetchJson(`${API}/pokemon/${id}`));
const learnsets = {};
const moveUrls = new Map();
for (const mon of pokemon) {
  const levelDetails = mon.moves.flatMap(entry => entry.version_group_details
    .filter(detail => detail.move_learn_method.name === 'level-up')
    .map(detail => ({ moveId: entry.move.name, moveUrl: entry.move.url, level: detail.level_learned_at, versionGroup: detail.version_group.name, versionGroupId: idFromUrl(detail.version_group.url) })));
  const latestRank = Math.max(-1, ...levelDetails.map(detail => versionRank(detail.versionGroup)));
  const latest = levelDetails.filter(detail => versionRank(detail.versionGroup) === latestRank);
  const versionGroup = latest[0]?.versionGroup || null;
  const unique = [...new Map(latest.map(detail => [`${detail.level}:${detail.moveId}`, detail])).values()]
    .map(({ moveId, level }) => ({ level: Math.max(0, level), moveId }))
    .sort((a, b) => a.level - b.level || a.moveId.localeCompare(b.moveId));
  learnsets[String(mon.id)] = { versionGroup, moves: unique };
  for (const detail of latest) moveUrls.set(detail.moveId, detail.moveUrl);
}

const moveEntries = await mapLimit([...moveUrls.entries()], 8, async ([id, url]) => [id, await fetchJson(url)]);
const moves = {};
for (const [id, move] of moveEntries.sort(([a], [b]) => a.localeCompare(b))) {
  const effectEntry = move.effect_entries?.find(e => e.language?.name === 'en');
  const flavor = [...(move.flavor_text_entries || [])].reverse().find(e => e.language?.name === 'zh-hant')
    || [...(move.flavor_text_entries || [])].reverse().find(e => e.language?.name === 'en');
  const meta = move.meta || {};
  const target = move.target?.name || 'selected-pokemon';
  const drain = Number(meta.drain || 0);
  moves[id] = {
    id,
    apiId: move.id,
    name: TRADITIONAL_MOVE_TEXT_OVERRIDES[id]?.name || localize(move.names) || id,
    type: move.type?.name || 'normal',
    damageClass: move.damage_class?.name || 'status',
    power: move.power ?? 0,
    accuracy: move.accuracy ?? 100,
    pp: move.pp ?? 0,
    priority: move.priority ?? 0,
    target,
    ailment: meta.ailment?.name || 'none',
    ailment_chance: Number(meta.ailment_chance || 0),
    flinch_chance: Number(meta.flinch_chance || 0),
    crit_rate: Number(meta.crit_rate || 0),
    drain: drain > 0 ? drain / 100 : 0,
    recoil: drain < 0 ? Math.abs(drain) / 100 : 0,
    healing: Number(meta.healing || 0),
    min_hits: meta.min_hits ?? null,
    max_hits: meta.max_hits ?? null,
    min_turns: meta.min_turns ?? null,
    max_turns: meta.max_turns ?? null,
    stat_changes: (move.stat_changes || []).map(change => ({ stat: statMap[change.stat.name] || change.stat.name, change: change.change })),
    stat_chance: Number(meta.stat_chance || 0),
    stat_target: selfTargets.has(target) ? 'self' : 'target',
    isProtect: protectMoves.has(id),
    description: TRADITIONAL_MOVE_TEXT_OVERRIDES[id]?.description || cleanText(flavor?.flavor_text || localize(move.effect_entries || [], 'effect') || effectEntry?.short_effect || effectEntry?.effect || '')
  };
}

const header = `// Generated by scripts/generate-pokemon-moves.mjs from PokéAPI on ${new Date().toISOString()}.\n// Do not edit manually. Level-up learnsets use each species' latest available version group.\n`;
const moduleText = `${header}\nexport const POKEMON_LEVEL_UP_LEARNSETS = Object.freeze(${JSON.stringify(learnsets, null, 2)});\n\nexport const POKEMON_MOVE_DATABASE = Object.freeze(${JSON.stringify(moves, null, 2)});\n\nexport const POKEMON_MOVE_DATA_META = Object.freeze({\n  generatedAt: ${JSON.stringify(new Date().toISOString())},\n  source: 'https://pokeapi.co/api/v2',\n  policy: 'latest-version-group-with-level-up-data-per-species',\n  speciesCount: ${SPECIES_IDS.length},\n  moveCount: ${Object.keys(moves).length}\n});\n`;
await mkdir(path.dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, moduleText, 'utf8');
const versions = Object.entries(learnsets).map(([id, data]) => `- #${id}: ${data.versionGroup} (${data.moves.length} level-up entries)`).join('\n');
await mkdir(path.dirname(SOURCE_DOC), { recursive: true });
await writeFile(SOURCE_DOC, `# Pokémon move data\n\nGenerated from [PokéAPI](https://pokeapi.co/docs/v2) using each species' latest version group containing level-up learnset data. Only level-up moves are imported; machine, egg and tutor moves are excluded.\n\n- Generated: ${new Date().toISOString()}\n- Species: ${SPECIES_IDS.length}\n- Unique moves: ${Object.keys(moves).length}\n\n## Selected version groups\n\n${versions}\n`, 'utf8');
console.log(`Generated ${Object.keys(moves).length} moves for ${SPECIES_IDS.length} species at ${OUTPUT}`);

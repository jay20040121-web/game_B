import { ADDITIONAL_THREE_STAGE_CHAINS } from './additionalThreeStagePokemonData.js';
/** 僅收錄完整三階家族，並直接使用 National Pokédex ID。 */
export const POKEMON_EVOLUTION_CHAINS=[[4,5,6],[7,8,9],[116,117,230],[1,2,3],[252,253,254],[13,14,15],[543,544,545],[92,93,94],[280,281,282],[607,608,609],[396,397,398],[74,75,76],[172,25,26],[66,67,68],[147,148,149],...ADDITIONAL_THREE_STAGE_CHAINS];
export const POKEMON_STARTER_IDS=Object.freeze(POKEMON_EVOLUTION_CHAINS.map(chain=>chain[0]));
export const drawRandomPokemonStarter=(random=Math.random)=>POKEMON_STARTER_IDS[Math.min(Math.floor(random()*POKEMON_STARTER_IDS.length),POKEMON_STARTER_IDS.length-1)];
const entries=POKEMON_EVOLUTION_CHAINS.flatMap(chain=>chain.map((id,index)=>({id,index,chain})));
const byId=new Map(entries.map(entry=>[entry.id,entry]));
export const getNextPokemonEvolution=id=>{const e=byId.get(Number(id));return e?.chain[e.index+1]??null};
export const getPokemonEvolutionLevel=id=>{const e=byId.get(Number(id));return !e||e.index>=e.chain.length-1?null:(e.index+1)*15};
export const getPokemonEvolutionStage=id=>byId.get(Number(id))?.index+1||1;
export const isFinalPokemonEvolution=id=>getNextPokemonEvolution(id)===null;

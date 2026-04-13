/**
 * export_to_unity_json.mjs
 * 
 * 此腳本將 monsterData.js 的所有資料匯出為 Unity 可讀取的 JSON 格式。
 * 
 * 執行方式：
 *   node export_to_unity_json.mjs
 * 
 * 輸出至 ../unity_data/ 資料夾
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// 動態讀取 monsterData.js (轉換成相容格式)
const __dirname = dirname(fileURLToPath(import.meta.url));

// 直接讀取並執行 monsterData.js 以取得所有 export
const {
    MONSTER_NAMES,
    SPECIES_BASE_STATS,
    SKILL_DATABASE,
    NATURE_CONFIG,
    OBTAINABLE_MONSTER_IDS,
    ADV_WILD_POOL,
    TYPE_CHART,
    TYPE_MAP,
    WILD_EVOLUTION_MAP,
    TRAINER_POOLS,
    TYPE_SKILLS,
} = await import('./monsterData.js');

// --- 輸出目錄 ---
const OUT_DIR = resolve(__dirname, '../unity_data');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const write = (filename, data) => {
    const path = resolve(OUT_DIR, filename);
    writeFileSync(path, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ 已輸出: ${path}`);
};

// ============================================================
// 1. monsters.json - 怪獸名稱 + 種族值 + 可獲得清單
// ============================================================
const monstersOutput = {
    names: MONSTER_NAMES,
    baseStats: SPECIES_BASE_STATS,
    obtainableIds: OBTAINABLE_MONSTER_IDS
};
write('monsters.json', monstersOutput);

// ============================================================
// 2. skills.json - 技能資料庫
// ============================================================
// 將 SKILL_DATABASE 轉換為陣列格式，方便 Unity 載入
const skillsArray = Object.entries(SKILL_DATABASE).map(([id, skill]) => ({
    id,
    ...skill
}));
write('skills.json', { skills: skillsArray });

// ============================================================
// 3. config.json - 遊戲設定 (屬性相剋表、性格配置等)
// ============================================================
const configOutput = {
    natureConfig: NATURE_CONFIG,
    typeChart: TYPE_CHART || {},
    typeMap: TYPE_MAP || {},
    wildEvolutionMap: WILD_EVOLUTION_MAP || {},
    typeSkills: TYPE_SKILLS || {}
};
write('config.json', configOutput);

// ============================================================
// 4. wild_pool.json - 冒險野怪出現池
// ============================================================
write('wild_pool.json', { pool: ADV_WILD_POOL });

// ============================================================
// 5. trainer_pools.json - 訓練家怪獸池
// ============================================================
write('trainer_pools.json', { pools: TRAINER_POOLS || {} });

console.log('\n🎉 所有 JSON 資料已成功輸出到:', OUT_DIR);
console.log('   請將 unity_data 資料夾複製到 Unity 專案的 Assets/Resources/Data/ 目錄下');

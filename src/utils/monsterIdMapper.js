import { EVOLUTION_CHAINS, WILD_EVOLUTION_MAP } from '../data/evolutionConfig';

/**
 * monsterIdMapper.js
 * 根據進化分支 (branch) 與進化階段 (stage) 回傳對應的怪獸 ID。
 * 核心數據已遷移至 src/data/evolutionConfig.js
 */
export function getMonsterId(branch, stage, isDead = false, bondValue = 0, soulTagCounts = {}) {
    // 1. 處理死亡狀態
    if (isDead) return 92; // Gastly

    const cleanBranch = String(branch || "").trim();
    const numStage = parseInt(stage);

    // 2. 處理野外怪獸進化 (WILD_ID 格式 - 僅保留波波線與小拳石線)
    if (cleanBranch.startsWith('WILD_')) {
        return parseInt(cleanBranch.split('_')[1]);
    }

    // 3. 處理靈魂重生特殊分支 (G1/G2)
    // 雖然這些現在也在 EVOLUTION_CHAINS 中，但保留特殊階段 1 的快速回傳作為保底
    if (numStage === 1) {
        if (cleanBranch === 'G1') return 92; // Gastly
        if (cleanBranch === 'G2') return 63; // Abra
        // 如果是其他分支但階段是 1，預設回傳百變怪，或者進入下方的鏈查找
    }

    // 4. 從 EVOLUTION_CHAINS 查找對應分支與階段的 ID
    const stageKey = `stage${numStage}`;
    for (const chainName in EVOLUTION_CHAINS) {
        const chain = EVOLUTION_CHAINS[chainName];
        
        if (chain[stageKey] && chain[stageKey][cleanBranch]) {
            return chain[stageKey][cleanBranch].id;
        }
    }

    // 5. 特殊相容性處理 (保底)
    // 如果是階段 1 且沒找到，高機率是百變怪
    if (numStage === 1) return 132;
    
    // 如果是階段 2 且沒找到，可能是之前的 A/B/C 邏輯，回傳對應的保底 ID
    return 132; // 最終保底回傳百變怪
}

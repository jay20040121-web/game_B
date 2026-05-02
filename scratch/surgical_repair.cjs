const fs = require('fs');
const path = 'src/App.jsx';

try {
    let lines = fs.readFileSync(path, 'utf8').split('\n');
    
    // 準備正確的代碼區塊
    const goodBlock = `                setTimeout(() => {
                    const now = new Date();
                    const timeStr = \`\${String(now.getHours()).padStart(2, '0')}:\${String(now.getMinutes()).padStart(2, '0')}\`;
                    const evolvedId = getMonsterIdWrapped(nextBranch, evolutionStage + 1);
                    const evolvedName = MONSTER_NAMES[evolvedId] || nextBranch;
                    updateDiaryEvent(\`\${timeStr} 分進化成了：\${evolvedName}\`, 3);
                    setTodayHasEvolved(true);

                    // 提前預載進化後的圖片，消除載入延遲
                    const assetId = MONSTER_ASSET_IDS[evolvedId] || evolvedId;
                    const base = import.meta.env.BASE_URL;
                    const img = new Image();
                    img.src = \`\${base}assets/exclusive/idle/\${assetId}.gif\`;

                    setEvolutionDetails({ fromId: getMonsterIdWrapped(), toId: evolvedId });
                    setIsEvolving(true);
                    updateDialogue("進化中！！");

                    // 實際的狀態更新邏輯，將在 EvolutionPerformance 結束時呼叫 (由 handleEvolutionFinish 觸發)
                    window._nextBranch = nextBranch;
                    window._evolvedId = evolvedId;
                }, 500);`.split('\n');

    // 替換 2250 到 2278 行 (0-indexed 為 2249 到 2277)
    // 我們先找到 setTimeout(() => { 那一行作為錨點
    let startIndex = -1;
    for(let i = 2240; i < 2260; i++) {
        if (lines[i] && lines[i].includes('setTimeout(() => {')) {
            startIndex = i;
            break;
        }
    }

    if (startIndex !== -1) {
        // 刪除從 startIndex 到 window._evolvedId = evolvedId; 結尾的地方
        let endIndex = startIndex;
        for(let i = startIndex; i < startIndex + 40; i++) {
            if (lines[i] && lines[i].includes('window._evolvedId = evolvedId;')) {
                endIndex = i;
                break;
            }
        }
        
        lines.splice(startIndex, endIndex - startIndex + 1, ...goodBlock);
        fs.writeFileSync(path, lines.join('\n'), 'utf8');
        console.log('App.jsx surgically repaired at index ' + startIndex);
    } else {
        console.error('Could not find anchor point for replacement.');
    }
} catch (e) {
    console.error('Failed to surgically repair App.jsx:', e);
}

const fs = require('fs');
const path = 'src/App.jsx';

try {
    let content = fs.readFileSync(path, 'utf8');
    
    // 清除 Git 衝突標記與其內容 (我們保留 Updated upstream 的邏輯部分，或是我們手動還原的核心邏輯)
    // 這裡我們直接針對你剛才那段崩潰的地方進行正則修復
    
    // 修復進化邏輯那段亂碼區塊
    const badBlockRegex = /setTodayHasEvolved\(true\);\s*<<<<<<<[\s\S]*?>>>>>>>.*?\n/g;
    const goodBlock = `setTodayHasEvolved(true);

                    setEvolutionStage(evolutionStage + 1);
                    setEvolutionBranch(nextBranch);
                    setLastEvolutionTime(Date.now());
                    setStageTrainWins(0);
                    setIsEvolving(false);
                    updateDialogue("進化成功！");
                    unlockMonster(evolvedId);
                }, 2500);
`;
    
    content = content.replace(badBlockRegex, goodBlock);

    // 同時移除檔案中可能存在的其他衝突標記列
    content = content.split('\n').filter(line => {
        return !line.includes('<<<<<<<') && !line.includes('=======') && !line.includes('>>>>>>>');
    }).join('\n');

    fs.writeFileSync(path, content, 'utf8');
    console.log('App.jsx encoding and conflicts fixed!');
} catch (e) {
    console.error('Failed to fix App.jsx:', e);
}

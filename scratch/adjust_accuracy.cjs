const fs = require('fs');
const path = 'c:\\Users\\jay20\\Desktop\\game_A\\src\\monsterData.js';

let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export const SKILL_DATABASE = {')) startIdx = i;
    if (startIdx !== -1 && lines[i].trim() === '};' && i > startIdx) {
        endIdx = i;
        break;
    }
}

const skillDatabaseStr = lines.slice(startIdx, endIdx + 1).join('\n');
const skillBlocks = skillDatabaseStr.split(/(?=\s{4}"\w+": {)/);

const processedBlocks = skillBlocks.map(block => {
    const powerMatch = block.match(/"power":\s*(\d+)/);
    if (powerMatch) {
        const power = parseInt(powerMatch[1]);
        let newBlock = block;

        if (power >= 100) {
            // 威力 100 以上：強制設定命中率為 20
            if (newBlock.includes('"accuracy":')) {
                newBlock = newBlock.replace(/"accuracy":\s*\d+/, '"accuracy": 20');
            } else {
                // 在 power 後面新增 accuracy
                newBlock = newBlock.replace(/"power":\s*\d+/, (match) => `${match},\n        "accuracy": 20`);
            }
        } else if (power < 40) {
            // 威力 40 以下：移除命中率欄位（必中）
            newBlock = newBlock.replace(/\s*"accuracy":\s*\d+,?/, '');
            newBlock = newBlock.replace(/,(\s*})/g, '$1'); // 清理結尾逗號
        }
        
        return newBlock;
    }
    return block;
});

const finalDatabaseStr = processedBlocks.join('');
const newContent = [...lines.slice(0, startIdx), finalDatabaseStr, ...lines.slice(endIdx + 1)].join('\n');

fs.writeFileSync(path, newContent);
console.log('命中率平衡調整完成！威力 100+ 命中率已設為 20%，威力 < 40 設為必中。');

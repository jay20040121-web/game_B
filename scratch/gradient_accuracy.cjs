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
        let targetAcc = -1;

        // 定義梯度
        if (power >= 100) targetAcc = 20;
        else if (power >= 80) targetAcc = 60;
        else if (power >= 60) targetAcc = 80;
        else if (power >= 40) targetAcc = 90;
        else targetAcc = 100; // 威力 < 40

        if (targetAcc === 100) {
            // 必中招式：移除 accuracy 欄位
            newBlock = newBlock.replace(/\s*"accuracy":\s*\d+,?/, '');
        } else {
            // 調整命中率
            if (newBlock.includes('"accuracy":')) {
                newBlock = newBlock.replace(/"accuracy":\s*\d+/, `"accuracy": ${targetAcc}`);
            } else {
                newBlock = newBlock.replace(/"power":\s*\d+/, (match) => `${match},\n        "accuracy": ${targetAcc}`);
            }
        }
        
        // 清理結尾逗號
        newBlock = newBlock.replace(/,(\s*})/g, '$1');
        return newBlock;
    }
    return block;
});

const finalDatabaseStr = processedBlocks.join('');
const newContent = [...lines.slice(0, startIdx), finalDatabaseStr, ...lines.slice(endIdx + 1)].join('\n');

fs.writeFileSync(path, newContent);
console.log('全量命中率梯度調整完成！');
console.log('40-59 -> 90%, 60-79 -> 80%, 80-99 -> 60%, 100+ -> 20%');

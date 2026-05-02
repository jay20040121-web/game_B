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
        let targetAcc = 100;

        // 執行平滑梯度邏輯
        if (power >= 150) targetAcc = 20;
        else if (power >= 140) targetAcc = 30;
        else if (power >= 120) targetAcc = 40;
        else if (power >= 110) targetAcc = 50;
        else if (power >= 100) targetAcc = 60;
        else if (power >= 90) targetAcc = 70;
        else if (power >= 80) targetAcc = 75;
        else if (power >= 70) targetAcc = 80;
        else if (power >= 60) targetAcc = 85;
        else if (power >= 50) targetAcc = 90;
        else if (power >= 40) targetAcc = 95;
        else targetAcc = 100;

        if (targetAcc === 100) {
            newBlock = newBlock.replace(/\s*"accuracy":\s*\d+,?/, '');
        } else {
            if (newBlock.includes('"accuracy":')) {
                newBlock = newBlock.replace(/"accuracy":\s*\d+/, `"accuracy": ${targetAcc}`);
            } else {
                newBlock = newBlock.replace(/"power":\s*\d+/, (match) => `${match},\n        "accuracy": ${targetAcc}`);
            }
        }
        
        newBlock = newBlock.replace(/,(\s*})/g, '$1');
        return newBlock;
    }
    return block;
});

const finalDatabaseStr = processedBlocks.join('');
const newContent = [...lines.slice(0, startIdx), finalDatabaseStr, ...lines.slice(endIdx + 1)].join('\n');

fs.writeFileSync(path, newContent);
console.log('平滑命中率階梯調整完成！');
console.log('曲線已從 40 威力 (95%) 平滑過渡至 150+ 威力 (20%)。');

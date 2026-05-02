const fs = require('fs');
const path = 'c:\\Users\\jay20\\Desktop\\game_A\\src\\monsterData.js';

let content = fs.readFileSync(path, 'utf8');

// 1. 先修復殘留的殘渣 (例如 ,.33 或 ,10 等)
// 匹配被切斷的欄位殘骸，通常出現在逗號後面接著點或數字但沒有鍵值的狀況
content = content.replace(/,\s*\.\d+/g, ''); 
content = content.replace(/,\s*\d+\.\d+/g, '');

// 2. 重新執行正確的淨化邏輯 (使用更強大的正則)
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
const fieldsToRemove = ['ailment','ailment_chance','stat_changes','stat_chance','stat_target','recoil','drain','flinch_chance','critical_hit_chance'];

const skillBlocks = skillDatabaseStr.split(/(?=\s{4}"\w+": {)/);
const processedBlocks = skillBlocks.map(block => {
    const powerMatch = block.match(/"power":\s*(\d+)/);
    if (powerMatch && parseInt(powerMatch[1]) > 0) {
        let newBlock = block;
        fieldsToRemove.forEach(field => {
            // 改進的正則：優先匹配陣列 []，再來是字串 ""，最後是數字（含小數點）
            const regex = new RegExp(`\\s*"${field}":\\s*(\\[[\\s\\S]*?\\]|"[^"]*"|[\\d\\.]+),?`, 'g');
            newBlock = newBlock.replace(regex, '');
        });
        // 移除多餘逗號
        newBlock = newBlock.replace(/,(\s*})/g, '$1');
        return newBlock;
    }
    return block;
});

const finalDatabaseStr = processedBlocks.join('');
const newContent = [...lines.slice(0, startIdx), finalDatabaseStr, ...lines.slice(endIdx + 1)].join('\n');

fs.writeFileSync(path, newContent);
console.log('修復並重新淨化完成！');

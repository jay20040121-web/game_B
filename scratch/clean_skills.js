const fs = require('fs');
const path = 'c:\\Users\\jay20\\Desktop\\game_A\\src\\monsterData.js';

const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// 找到 SKILL_DATABASE 的起始與結束位置
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export const SKILL_DATABASE = {')) {
        startIdx = i;
    }
    if (startIdx !== -1 && lines[i].trim() === '};' && i > startIdx) {
        endIdx = i;
        break;
    }
}

if (startIdx === -1 || endIdx === -1) {
    console.error('找不到 SKILL_DATABASE');
    process.exit(1);
}

const skillDatabaseStr = lines.slice(startIdx, endIdx + 1).join('\n');

// 定義要移除的欄位
const fieldsToRemove = [
    'ailment',
    'ailment_chance',
    'stat_changes',
    'stat_chance',
    'stat_target',
    'recoil',
    'drain',
    'flinch_chance',
    'critical_hit_chance'
];

// 使用正則表達式分割每個技能區塊
// 匹配範例: "tackle": { ... }
const skillBlocks = skillDatabaseStr.split(/(?=\s{4}"\w+": {)/);

const processedBlocks = skillBlocks.map(block => {
    // 檢查威力
    const powerMatch = block.match(/"power":\s*(\d+)/);
    if (powerMatch) {
        const power = parseInt(powerMatch[1]);
        if (power > 0) {
            let newBlock = block;
            fieldsToRemove.forEach(field => {
                // 移除欄位及其值 (處理字串、數字、陣列與結尾逗號)
                const regex = new RegExp(`\\s*"${field}":\\s*(\\[[\\s\\S]*?\\]|"[^"]*"|\\d+|[\\d.]+),?`, 'g');
                newBlock = newBlock.replace(regex, '');
            });
            // 清除移除欄位後可能殘留的結尾逗號 (例如 power 變成最後一項時)
            newBlock = newBlock.replace(/,(\s*})/g, '$1');
            return newBlock;
        }
    }
    return block;
});

const finalDatabaseStr = processedBlocks.join('');

const newContent = [
    ...lines.slice(0, startIdx),
    finalDatabaseStr,
    ...lines.slice(endIdx + 1)
].join('\n');

fs.writeFileSync(path, newContent);
console.log('技能資料庫淨化完成！所有威力 > 0 的技能已移除額外特性。');

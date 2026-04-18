const fs = require('fs');

const content = fs.readFileSync('monsterData.js', 'utf8');

// We just want to find block of "stat_changes" and sum their positive changes.
// It's a bit complex with regex. Let's write a python or node.js AST parser? No, regex is enough if we are careful.

let match;
const skillRegex = /"([^"]+)":\s*{\s*"id":\s*"([^"]+)",\s*"name":\s*"([^"]+)",[\s\S]*?"stat_changes":\s*\[([\s\S]*?)\]/g;
const statChangeRegex = /{\s*"stat":\s*"([^"]+)",\s*"change":\s*(\d+)\s*}/g;

let newContent = content;

while ((match = skillRegex.exec(content)) !== null) {
    const fullMatch = match[0];
    const skillKey = match[1];
    const skillName = match[3];
    const statChangesStr = match[4];
    
    let totalBuff = 0;
    let changesMatch;
    
    const changesArray = [];
    while ((changesMatch = statChangeRegex.exec(statChangesStr)) !== null) {
        changesArray.push({
            full: changesMatch[0],
            stat: changesMatch[1],
            change: parseInt(changesMatch[2])
        });
    }
    
    for (const ch of changesArray) {
        if (ch.change > 0) {
            totalBuff += ch.change;
        }
    }
    
    if (totalBuff > 3) {
        console.log(`Nerfing ${skillName} (${skillKey}): total buff=${totalBuff}`);
        
        let newStatChangesStr = statChangesStr;
        for (const ch of changesArray) {
            if (ch.change > 0) {
                // Change any positive change to 1
                const newCh = ch.full.replace(`"change": ${ch.change}`, `"change": 1`);
                newStatChangesStr = newStatChangesStr.replace(ch.full, newCh);
            }
        }
        
        const newFullMatch = fullMatch.replace(statChangesStr, newStatChangesStr);
        newContent = newContent.replace(fullMatch, newFullMatch);
    }
}

fs.writeFileSync('monsterData.fixed.js', newContent);
console.log('Written to monsterData.fixed.js');

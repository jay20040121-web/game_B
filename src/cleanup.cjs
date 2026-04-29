const fs = require('fs');
const path = 'c:/Users/j770121/Desktop/怪獸對打機專案/game_A/src/monsterData.js';
const lines = fs.readFileSync(path, 'utf8').split(/\r?\n/);

// SKILL_DATABASE removal (Lines 2321-3644 are indices 2320-3643)
const part1 = lines.slice(0, 2320);
const part2 = lines.slice(3644);

const newLines = part1.concat(part2);
fs.writeFileSync(path, newLines.join('\n'), 'utf8');
console.log('Successfully removed disallowed skills.');

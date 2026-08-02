import fs from 'node:fs';
const controller = fs.readFileSync('src/components/RogueBattleController.jsx', 'utf8');
const overlay = fs.readFileSync('src/components/PokeRogueOverlay.jsx', 'utf8');
const failures = [];
for (const token of ['processBattleTurn(', 'stepQueue', 'damagePop', 'healPop', '<BattleAdventureOverlay']) {
  if (!controller.includes(token)) failures.push(`完整戰鬥控制器缺少 ${token}`);
}
if (!overlay.includes('<RogueBattleController')) failures.push('Rogue 波次沒有使用完整戰鬥控制器');
if (overlay.includes('const damageFor')) failures.push('Rogue 波次仍保留另一套簡化傷害公式');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Rogue 共用戰鬥引擎與表演佇列測試通過');

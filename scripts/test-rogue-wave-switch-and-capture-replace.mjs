import fs from 'node:fs';
const source = fs.readFileSync('src/components/PokeRogueOverlay.jsx', 'utf8');
const failures = [];

const startWaveBlock = source.slice(source.indexOf('const startWave'), source.indexOf('const beginRun'));
if (!startWaveBlock.includes("setPhase('switch')")) failures.push('每層建立後沒有先進入戰前換怪');
if (startWaveBlock.includes("setPhase('battle')")) failures.push('每層建立後直接開始戰鬥');

const winBlock = source.slice(source.indexOf('onWin='), source.indexOf('onPlayerDefeated='));
if (!winBlock.includes("setPhase('reward')")) failures.push('勝利後沒有直接進入獎勵');
if (winBlock.includes("setPhase('switch')")) failures.push('勝利後仍會跳出換怪');

for (const token of ["team.length >= 6", "setPhase('capture_replace')", "phase === 'capture_replace'", '完成替換', 'captureCandidate']) {
  if (!source.includes(token)) failures.push(`滿隊收服替換缺少 ${token}`);
}

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log('Rogue 戰前換怪與滿隊收服替換測試通過');

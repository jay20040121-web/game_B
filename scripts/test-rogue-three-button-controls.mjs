import fs from 'node:fs';

const app = fs.readFileSync('src/App.jsx', 'utf8');
const rogue = fs.readFileSync('src/components/PokeRogueOverlay.jsx', 'utf8');
const failures = [];

for (const key of ['A', 'B', 'C']) {
  if (!app.includes(`dispatchRogueControl('${key}')`)) {
    failures.push(`App 的 ${key} 鍵沒有轉送 Rogue 控制事件`);
  }
}

if (!rogue.includes("window.addEventListener('rogue-control'")) {
  failures.push('Rogue 元件沒有接收畫面三鍵的控制事件');
}

if (!rogue.includes('handleControl(event.detail)')) {
  failures.push('Rogue 控制事件沒有進入共用操作器');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Rogue 三鍵控制橋接測試通過');

import { getRogueEnemyLevel, getRogueTeamAverageLevel } from '../src/utils/rogueDifficultySystem.js';

const cases = [
  [1, 30, 25], [10, 30, 25],
  [11, 30, 26], [15, 30, 26],
  [16, 30, 27], [20, 30, 27],
  [21, 30, 28], [25, 30, 28],
  [26, 30, 31], [30, 30, 31],
  [31, 30, 32], [35, 30, 32],
  [1, 3, 1], [500, 99, 100],
];

for (const [wave, average, expected] of cases) {
  const actual = getRogueEnemyLevel(wave, average);
  if (actual !== expected) throw new Error(`第 ${wave} 層，平均 ${average}：預期 ${expected}，實際 ${actual}`);
}

const average = getRogueTeamAverageLevel([{ level: 10 }, { level: 20 }, { level: 30 }]);
if (average !== 20) throw new Error(`隊伍平均等級預期 20，實際 ${average}`);
console.log('Rogue 難度曲線測試通過');

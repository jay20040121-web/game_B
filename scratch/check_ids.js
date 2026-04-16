
import { OBTAINABLE_MONSTER_IDS } from './monsterData.js';
import fs from 'fs';

const content = fs.readFileSync('./src/components/MonsterpediaOverlay.js', 'utf8');
const evoReqMatch = content.match(/const EVO_REQS = \{([\s\S]*?)\};/);

if (evoReqMatch) {
    const evoReqStr = evoReqMatch[1];
    const missing = [];
    OBTAINABLE_MONSTER_IDS.forEach(id => {
        if (!evoReqStr.includes(`"${id}":`)) {
            missing.push(id);
        }
    });
    console.log('Missing IDs:', missing);
    if (missing.length === 0) console.log('All IDs included!');
} else {
    console.log('Could not find EVO_REQS in file.');
}

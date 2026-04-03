const fs = require('fs');
const path = require('path');

// 🔍 需要合併的檔案清單 (自定義順序: Config -> Utils -> Components -> App)
const FILES_TO_SYNC = [
    './monsterData.js',
    './src/data/gameConfig.js',
    './src/components/SpriteRenderer.js',
    './src/components/MonsterDex.js',
    './App.js'
];

/**
 * 清除模組化關鍵字 (import / export)
 * 讓程式碼能在瀏覽器 Babel Standalone 環境直接執行 (非 ES Module)
 */
function cleanModularKeywords(code) {
    return code
        .replace(/import\s+.*?\s+from\s+['"].*?['"];?/g, '// [Sync] Removed Import')
        .replace(/export\s+default\s+.*?;?/g, (match) => `// [Sync] Removed Export: ${match}`)
        .replace(/export\s+const\s+/g, 'const ')
        .replace(/export\s+function\s+/g, 'function ')
        .replace(/export\s+class\s+/g, 'class ');
}

console.log('🚀 開始進行 Monolithic Sync...');

let bundleCode = `
        const { useState, useEffect, useRef, useCallback, useMemo } = React;
        const { motion } = window.Motion || { motion: { div: "div" } };
`;

FILES_TO_SYNC.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`📦 讀取並清理: ${file}`);
        let content = fs.readFileSync(file, 'utf8');
        bundleCode += `\n/* --- Source: ${path.basename(file)} --- */\n`;
        bundleCode += cleanModularKeywords(content) + '\n';
    } else {
        console.warn(`⚠️ 找不到檔案: ${file}`);
    }
});

// 讀取 index.html
const indexHtmlPath = './index.html';
if (!fs.existsSync(indexHtmlPath)) {
    console.error('❌ 找不到 index.html');
    process.exit(1);
}

let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

// 定義插入點
const babelStartTag = '<script type="text/babel">';
const babelEndStr = "        const root = ReactDOM.createRoot(document.getElementById('root'));";

const startIndex = indexHtml.indexOf(babelStartTag);
const endIndex = indexHtml.indexOf(babelEndStr);

if (startIndex === -1 || endIndex === -1) {
    console.error('❌ 在 index.html 中找不到 Babel 標籤或 React 根節點標記');
    process.exit(1);
}

// 組合新內容
const prefix = indexHtml.substring(0, startIndex + babelStartTag.length + 1);
const suffix = indexHtml.substring(endIndex);

const finalHtml = prefix + bundleCode + '\n        ' + suffix;

fs.writeFileSync(indexHtmlPath, finalHtml);
console.log('✅ 成功同步所有模組至 index.html！');

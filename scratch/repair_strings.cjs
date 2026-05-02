const fs = require('fs');
const path = 'src/App.jsx';

try {
    let content = fs.readFileSync(path, 'utf8');
    
    // 手動修復被問號取代的關鍵中文字串
    content = content.replace(/updateDiaryEvent\(\`\$\{timeStr\} .*?\$\{evolvedName\}\`, 3\)/g, 'updateDiaryEvent(`${timeStr} 分進化成了：${evolvedName}`, 3)');
    content = content.replace(/updateDialogue\("進化成功！"\)/g, 'updateDialogue("進化成功！")');
    content = content.replace(/updateDialogue\("進化中！！"\)/g, 'updateDialogue("進化中！！")');
    content = content.replace(/updateDialogue\(".*?成功！.*?"\)/g, 'updateDialogue("進化成功！")');
    content = content.replace(/updateDialogue\(".*?中！！.*?"\)/g, 'updateDialogue("進化中！！")');
    
    // 針對你剛才看到的那幾行進行強行替換
    content = content.replace(/updateDiaryEvent\(\`\$\{timeStr\} \?\?進\? \?\?\?\?\{evolvedName\}\`, 3\)/g, 'updateDiaryEvent(`${timeStr} 分進化成了：${evolvedName}`, 3)');
    content = content.replace(/updateDialogue\("\?\?\?\?\?"\)/g, 'updateDialogue("進化成功！")');
    content = content.replace(/updateDialogue\("\?\?中\?\?"\)/g, 'updateDialogue("進化中！！")');

    // 重新校正這整個區塊，確保沒有亂碼殘留
    const sectionStart = 'setTimeout(() => {';
    const sectionEnd = 'window._evolvedId = evolvedId;';
    
    // 如果還有其他亂碼，我們直接用一個乾淨的模板替換掉整個進化邏輯區塊
    // (這部分我會用 replace_file_content 做更精確的操作)

    fs.writeFileSync(path, content, 'utf8');
    console.log('Strings repaired!');
} catch (e) {
    console.error('Failed to repair strings:', e);
}

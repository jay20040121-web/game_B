const fs = require('fs');

let appJs = fs.readFileSync('./App.js', 'utf8');

// 去除 import
appJs = appJs.replace(/import .*?from 'react';\r?\n/, '');
appJs = appJs.replace(/import '\.\/styles\.css';\r?\n/, '');

const indexHtml = fs.readFileSync('./index.html', 'utf8');

const babelStart = indexHtml.indexOf('<script type="text/babel">');
const babelEndStr = '        const root = ReactDOM.createRoot(document.getElementById(\'root\'));';
const babelEnd = indexHtml.indexOf(babelEndStr);

if (babelStart === -1 || babelEnd === -1) {
    console.error("Could not find babel tags in index.html");
    process.exit(1);
}

const prefix = indexHtml.substring(0, babelStart + '<script type="text/babel">\n'.length);
const suffix = indexHtml.substring(babelEnd);

const newBabel = `        const { useState, useEffect, useRef } = React;
        const { motion } = window.Motion || { motion: { div: "div" } };

` + appJs + '\n\n';

fs.writeFileSync('./index.html', prefix + newBabel + suffix);
console.log('Successfully synced App.js to index.html!');

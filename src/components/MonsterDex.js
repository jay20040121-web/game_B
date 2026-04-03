import React, { useState } from 'react';
import { DitheredSprite } from './SpriteRenderer';

// 📖 圖鑑分類定義 (DEX_GROUPS)
// 根據 App.js 的 getMonsterId 與 evolutionBranch 邏輯整理
const DEX_GROUPS = [
    {
        id: 'standard',
        name: '一般進化線',
        lines: [
            { name: '尼多王分支 (勇猛)', stages: ["132", "32", "33", "34"], reqs: ["-", "培育: 飽足度 > 80", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] },
            { name: '尼多后分支 (柔美)', stages: ["132", "29", "30", "31"], reqs: ["-", "培育: 心情值 > 80", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] },
            { name: '拉達分支 (平凡)', stages: ["132", "19", "20"], reqs: ["-", "培育: 一般隨機", "進化: 訓練勝次 > 8"] }
        ]
    },
    {
        id: 'soul_fire',
        name: '靈魂進化 - 火',
        lines: [
            { name: '噴火龍線', stages: ["4", "5", "6"], reqs: ["靈魂綁定: 火", "進化: 訓練勝次 > 30", "進化: 訓練勝次 > 50"] },
            { name: '九尾線', stages: ["37", "38"], reqs: ["靈魂綁定: 火 & 飽足與心情 > 50", "進化: 訓練勝次 > 50"] },
            { name: '風速狗線', stages: ["58", "59"], reqs: ["靈魂綁定: 火 & 性格熱血", "進化: 訓練勝次 > 50"] },
            { name: '烈焰馬線', stages: ["77", "78"], reqs: ["靈魂綁定: 火 & 性格無厘頭", "進化: 訓練勝次 > 50"] },
            { name: '嘎啦嘎啦線', stages: ["104", "105"], reqs: ["靈魂綁定: 火 & 性格頑固", "進化: 訓練勝次 > 50"] }
        ]
    },
    {
        id: 'soul_water',
        name: '靈魂進化 - 水',
        lines: [
            { name: '水箭龜線', stages: ["7", "8", "9"], reqs: ["靈魂綁定: 水", "進化: 訓練勝次 > 30", "進化: 訓練勝次 > 50"] },
            { name: '快龍線', stages: ["147", "148", "149"], reqs: ["靈魂綁定: 水 & 訓練勝次 > 8", "進化: 訓練勝次 > 30", "進化: 訓練勝次 > 50"] },
            { name: '暴鯉龍線', stages: ["129", "130"], reqs: ["靈魂綁定: 水 & 隨機分支", "進化: 訓練勝次 > 50"] },
            { name: '刺甲貝線', stages: ["90", "91"], reqs: ["靈魂綁定: 水 & 隨機分支", "進化: 訓練勝次 > 50"] }
        ]
    },
    {
        id: 'soul_grass',
        name: '靈魂進化 - 草',
        lines: [
            { name: '妙蛙花線', stages: ["1", "2", "3"], reqs: ["靈魂綁定: 草", "進化: 訓練勝次 > 30", "進化: 訓練勝次 > 50"] },
            { name: '霸王花線', stages: ["43", "44", "45"], reqs: ["靈魂綁定: 草 & 飽足與心情 > 50", "進化: 訓練勝次 > 30", "進化: 訓練勝次 > 50"] },
            { name: '大食花線', stages: ["69", "70", "71"], reqs: ["靈魂綁定: 草 & 性格理性", "進化: 訓練勝次 > 30", "進化: 訓練勝次 > 50"] }
        ]
    },
    {
        id: 'soul_bug',
        name: '靈魂進化 - 蟲',
        lines: [
            { name: '巴大蝶線', stages: ["10", "11", "12"], reqs: ["靈魂綁定: 蟲 & 心情 > 50", "進化: 心情 > 50", "進化: 心情 > 50"] },
            { name: '大針蜂線', stages: ["13", "14", "15"], reqs: ["靈魂綁定: 蟲 & 飽足 > 50", "進化: 飽足 > 50", "進化: 飽足 > 50"] },
            { name: '摩魯蛾線', stages: ["48", "49"], reqs: ["靈魂綁定: 蟲 & 屬性平均", "進化: 屬性平均"] }
        ]
    },
    {
        id: 'mystery',
        name: '神祕進化線',
        lines: [
            { name: '耿鬼線', stages: ["92", "93", "94"], reqs: ["死亡機率重生", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] },
            { name: '胡地線', stages: ["63", "64", "65"], reqs: ["死亡機率重生", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] },
            { name: '毒/電分支', stages: ["109", "110", "82"], reqs: ["培育隨機", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] },
            { name: '毒/水分支', stages: ["88", "89", "55"], reqs: ["培育隨機", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] }
        ]
    },
    {
        id: 'wild',
        name: '野外冒險線',
        lines: [
            { name: '大比鳥線', stages: ["16", "17", "18"], reqs: ["野外捕捉", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] },
            { name: '阿柏怪線', stages: ["23", "24"], reqs: ["野外捕捉", "進化: 訓練勝次 > 8"] },
            { name: '穿山王線', stages: ["27", "28"], reqs: ["野外捕捉", "進化: 訓練勝次 > 8"] },
            { name: '叉字蝠線', stages: ["41", "42", "169"], reqs: ["野外捕捉", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] },
            { name: '棄世猴線', stages: ["56", "57", "979"], reqs: ["野外捕捉", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] },
            { name: '隆隆岩線', stages: ["74", "75", "76"], reqs: ["野外捕捉", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] },
            { name: '蚊香泳士線', stages: ["60", "61", "62"], reqs: ["野外捕捉", "進化: 訓練勝次 > 8", "進化: 訓練勝次 > 30"] }
        ]
    }
];

const MonsterDex = ({ unlockedDex = [], monsterNames = {}, onClose }) => {
    const [currentGroupIdx, setCurrentGroupIdx] = useState(0);
    const [selectedEntry, setSelectedEntry] = useState(null); // { lineIdx, stageIdx }

    const currentGroup = DEX_GROUPS[currentGroupIdx];

    // [A] 鍵：切換下一個分類
    const cycleGroup = () => {
        const nextIdx = (currentGroupIdx + 1) % DEX_GROUPS.length;
        setCurrentGroupIdx(nextIdx);
        setSelectedEntry(null);
    };

    const handleEntryClick = (lineIdx, stageIdx) => {
        setSelectedEntry({ lineIdx, stageIdx });
    };

    return (
        <div className="absolute inset-0 z-[120] flex flex-col items-center justify-start p-2" style={{ backgroundColor: 'rgba(157, 174, 138, 0.99)' }}>
            {/* Header */}
            <div className="w-full bg-[#383a37] text-[#8fa07e] text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black">
                <span>怪獸圖鑑: {currentGroup.name}</span>
                <span className="text-[10px] opacity-70 cursor-pointer" onClick={onClose}>[C] 離開</span>
            </div>

            {/* Grid Container */}
            <div className="flex-1 w-full flex flex-col gap-2 overflow-y-auto px-1 custom-scrollbar">
                {currentGroup.lines.map((line, lIdx) => (
                    <div key={lIdx} className="border-b border-[#383a37]/30 pb-2">
                        <div className="text-[9px] font-black opacity-60 mb-1">{line.name}</div>
                        <div className="flex gap-2 justify-start items-center">
                            {line.stages.map((sid, sIdx) => {
                                const isUnlocked = unlockedDex.includes(sid) || unlockedDex.includes(Number(sid));
                                const isSelected = selectedEntry?.lineIdx === lIdx && selectedEntry?.stageIdx === sIdx;
                                return (
                                    <div 
                                        key={sIdx} 
                                        className={`relative w-12 h-12 border-2 rounded flex items-center justify-center cursor-pointer transition-all
                                            ${isSelected ? 'bg-[#383a37] border-[#1a1a1a]' : 'bg-[#ccd6be] border-[#383a37]/30'}`}
                                        onClick={() => handleEntryClick(lIdx, sIdx)}
                                    >
                                        <div style={{ filter: isUnlocked ? 'none' : 'brightness(0)', opacity: isUnlocked ? 1 : 0.8 }}>
                                            <DitheredSprite id={sid} scale={1} animated={isUnlocked} />
                                        </div>
                                        {isSelected && <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border border-white" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / Selected Info */}
            <div className="w-full min-h-[70px] bg-[#383a37] text-[#8fa07e] p-2 mt-2 rounded flex flex-col justify-center gap-1">
                {selectedEntry ? (
                    <>
                        <div className="text-[11px] font-black flex justify-between">
                            <span>{unlockedDex.includes(currentGroup.lines[selectedEntry.lineIdx].stages[selectedEntry.stageIdx]) 
                                ? monsterNames[currentGroup.lines[selectedEntry.lineIdx].stages[selectedEntry.stageIdx]] 
                                : "???"}</span>
                            <span className="text-[9px] opacity-50"># {currentGroup.lines[selectedEntry.lineIdx].stages[selectedEntry.stageIdx]}</span>
                        </div>
                        <div className="text-[9px] leading-tight">
                            {currentGroup.lines[selectedEntry.lineIdx].reqs[selectedEntry.stageIdx]}
                        </div>
                    </>
                ) : (
                    <div className="text-[9px] opacity-50 text-center italic">點擊怪獸或按 [B] 查看進化條件</div>
                )}
            </div>

            {/* Hint */}
            <div className="text-[9px] font-black text-center text-[#1a1a1a] mt-1 opacity-70 underline decoration-dotted w-full" onClick={cycleGroup}>
                {"[A] 切換分類  [B] 查看細節  [C] 關閉"}
            </div>
            
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #383a37; border-radius: 10px; }
            `}</style>
        </div>
    );
};

export default MonsterDex;

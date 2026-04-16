import React from 'react';
import { DitheredSprite } from './SpriteRenderer';

const EVO_REQS = {
    "132": "進化方向：\n格鬥系：勝場8+\n毒系：心情&飢餓=0\n火/水/草/蟲魂：談心親和+友好80\n一般線：心情或飢餓 > 50",
    "4": "進化方向：\n火恐龍：心情 80+\n嘎啦嘎啦：心情 < 80",
    "5": "進化方向：\n噴火龍：心情/飢餓 50+ 且 性格熱情/頑固\n鴨嘴火龍：心情 < 50 且 頑固個性",
    "1": "進化方向：\n妙蛙草：心情 80+\n派拉斯：心情 < 80",
    "2": "進化方向：\n妙蛙花：心情/飢餓 50+ 且 性格溫和/理性\n派拉斯特：心情低於 50",
    "7": "進化方向：\n卡咪龜：(Stage 2)",
    "147": "進化方向：\n哈克龍：心情/飢餓 50+ 且 勝場 30+",
    "116": "進化方向：\n海刺龍：(Stage 3)\n拉普拉斯：理性/溫和性格 + 心情高",
    "10": "進化方向：\n鐵甲蛹：(Stage 2)",
    "11": "進化方向：\n巴大蝶：(Stage 3)",
    "66": "進化方向：\n豪力：訓練勝場 30+",
    "67": "進化方向：\n怪力：訓練勝場 50+",
    "109": "進化方向：\n雙彈瓦斯：(Stage 3)\n三合一磁怪：心情 > 80",
    "88": "進化方向：\n臭臭泥：(Stage 3)\n可達鴨：心情 > 80",
    "41": "進化方向：\n大嘴蝠：(Stage 2)",
    "42": "進化方向：\n叉字蝠：(Stage 3)",
    "56": "進化方向：\n火爆猴：(Stage 2)",
    "57": "進化方向：\n棄世猴：(Stage 3)",
    "60": "進化方向：\n蚊香君：(Stage 2)",
    "61": "進化方向：\n蚊香泳士：(Stage 3)"
};

export const MonsterpediaOverlay = ({
    isOpen,
    onClose,
    ownedMonsters,
    monsterNames,
    obtainableIds = [],
    selectedIndex,
    isDetailOpen
}) => {
    if (!isOpen) return null;

    const monsterIds = obtainableIds.length > 0 ? obtainableIds : Object.keys(monsterNames);
    const itemsPerPage = 12; // 改為 3 行 (4x3 網格)
    const currentPage = Math.floor(selectedIndex / itemsPerPage);
    const pageStart = currentPage * itemsPerPage;
    const pageItems = monsterIds.slice(pageStart, pageStart + itemsPerPage);

    const selectedId = monsterIds[selectedIndex];
    const isOwned = ownedMonsters.includes(String(selectedId));

    const evoReq = EVO_REQS[selectedId];

    return (
        <div 
            className="absolute inset-0 z-[120] flex flex-col items-center justify-start p-2 animate-fade-in" 
            style={{ 
                backgroundImage: 'url("assets/BG/圖鑑系統背板.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}
        >
            {/* Header */}
            <div className="w-full text-white text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black">
                <span>像素怪獸圖鑑</span>
                <span className="text-[10px] opacity-80">{ownedMonsters.length} / {monsterIds.length}</span>
            </div>

            {/* Grid */}
            <div className="flex-1 w-full grid grid-cols-4 gap-1.5 overflow-hidden content-start px-1 py-1">
                {pageItems.map((id, idx) => {
                    const globalIdx = pageStart + idx;
                    const isSelected = globalIdx === selectedIndex;
                    const owned = ownedMonsters.includes(String(id));
                    
                    return (
                        <div 
                            key={id}
                            className={`relative aspect-square flex items-center justify-center rounded-sm transition-all overflow-hidden
                                ${isSelected ? 'border-2 border-[#ff5252] z-10 shadow-lg scale-110 translate-y-[5px]' : ''}`}
                        >
                            <DitheredSprite 
                                id={id} 
                                scale={0.8} 
                                animated={false} 
                                silhouette={!owned} 
                            />
                            {owned && (
                                <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#ff5252] rounded-full border border-[#1a1a1a] shadow-sm flex items-center justify-center">
                                    <div className="w-1 h-1 bg-white rounded-full opacity-60" />
                                </div>
                            )}
                            {isSelected && (
                                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#ff5252] rounded-full animate-bounce border border-[#1a1a1a]" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer / Selection Info */}
            <div className="w-full mt-2 p-1.5 flex items-center justify-between">
                <div className="flex flex-col text-white">
                    <span className="text-[10px] font-black opacity-60">
                        NO.{String(selectedId).padStart(3, '0')}
                    </span>
                    <span className="text-[11px] font-black">
                        {isOwned ? monsterNames[selectedId] : '??????'}
                    </span>
                </div>
                <div className="text-[9px] font-black text-white flex flex-col items-end opacity-80">
                    <span>[A] 切換 [B] 詳細</span>
                    <span>[C] 返回</span>
                </div>
            </div>

            {/* Detail Modal Overlay */}
            {isDetailOpen && isOwned && (
                <div className="absolute inset-0 z-[130] bg-[#1a1a1a]/60 flex items-center justify-center animate-fade-in p-4 backdrop-blur-[1px]">
                    <div className="bg-[#9dae8a] border-4 border-[#383a37] p-3 flex flex-col items-center shadow-2xl rounded-lg animate-fade-in relative max-w-[200px]">
                        {/* 浮動進化條件標籤 - 不影響間距 */}
                        {evoReq && (
                            <div className="absolute top-[90px] inset-x-0 z-20 pointer-events-none animate-fade-in flex justify-center">
                                <div className="bg-[#ff5252]/95 text-white text-[7px] p-2 px-4 rounded-sm shadow-lg border border-[#383a37] flex flex-col items-center w-[300px] h-[90px] overflow-y-auto custom-scrollbar">
                                    <div className="flex items-center gap-1 mb-1 border-b border-white/30 w-full justify-center pb-0.5">
                                        <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                                        <span className="font-black">進化條件</span>
                                    </div>
                                    <span className="whitespace-pre-line leading-tight font-black opacity-90 text-center">{evoReq}</span>
                                </div>
                            </div>
                        )}
                        <div className="mt-4 mb-2 text-[14px] font-black text-[#1a1a1a] border-b-2 border-[#383a37] pb-1 w-full text-center">
                            {monsterNames[selectedId]}
                        </div>
                        <div className="bg-[#ccd6be] p-4 border-2 border-[#383a37] rounded-md mb-3 shadow-inner relative">
                            <div className="relative z-[40]">
                                <DitheredSprite id={selectedId} scale={2.8} animated={true} />
                            </div>
                        </div>
                        <div className="mt-1 mb-1 text-[8px] font-black text-[#fff] bg-[#383a37] px-2 py-0.5 rounded-full animate-bounce">
                             按 [B] 或 [C] 返回
                        </div>
                        <div className="text-[9px] font-black text-[#383a37] opacity-80">
                            已收錄於怪獸圖鑑
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



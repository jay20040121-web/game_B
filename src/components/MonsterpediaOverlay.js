import React from 'react';
import { DitheredSprite } from './SpriteRenderer';

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
                        <div className="mb-2 text-[14px] font-black text-[#1a1a1a] border-b-2 border-[#383a37] pb-1 w-full text-center">
                            {monsterNames[selectedId]}
                        </div>
                        <div className="bg-[#ccd6be] p-4 border-2 border-[#383a37] rounded-md mb-3 shadow-inner">
                            <DitheredSprite id={selectedId} scale={2.8} animated={true} />
                        </div>
                        <div className="text-[9px] font-black text-[#383a37] opacity-80">
                            已收錄於怪獸圖鑑
                        </div>
                        <div className="mt-2 text-[10px] font-black text-[#fff] bg-[#383a37] px-3 py-1 rounded-full animate-bounce">
                             按 [B] 或 [C] 返回
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};



import React from 'react';

export function InventoryOverlay({
    isInventoryOpen,
    inventory,
    selectedItemIdx,
    isUsingItem
}) {
    if (!isInventoryOpen) return null;

    return (
        <div className="absolute inset-0 z-[115] flex flex-col items-center justify-start p-2" style={{ backgroundColor: 'rgba(157, 174, 138, 0.99)' }}>
            <div className="w-full bg-[#383a37] text-[#8fa07e] text-[12px] px-2 py-1.5 flex justify-between items-center mb-2 font-black">
                <span>我的背包</span>
                <span>[C] 關閉</span>
            </div>

            <div className="flex-1 w-full flex flex-col gap-2 px-1 justify-start pb-2 overflow-hidden">
                <div className="border-b-2 border-[#383a37] pb-1 flex justify-between items-center">
                    <span className="text-[11px] font-black text-[#1a1a1a]">物品清單 ({inventory?.length || 0}/99)</span>
                    <div className="text-[9px] font-bold text-[#383a37] animate-pulse">
                        {(inventory?.length || 0) > 0 ? `${selectedItemIdx + 1} / ${inventory.length}` : '0/0'}
                    </div>
                </div>

                <div className="relative flex-1 mt-1 flex flex-col items-center justify-center">
                    {(inventory?.length || 0) > 0 ? (
                        <div className="w-full flex flex-col items-center gap-2">
                            <div className="w-full space-y-2">
                                {inventory.map((item, idx) => {
                                    const isSelected = selectedItemIdx === idx;
                                    const isNext = (selectedItemIdx + 1) % inventory.length === idx;
                                    const isPrev = (selectedItemIdx - 1 + inventory.length) % inventory.length === idx;

                                    if (!isSelected && !isNext && !isPrev) return null;

                                    return (
                                        <div
                                            key={idx}
                                            className={`w-full p-2 py-2.5 rounded border-2 transition-all duration-200 flex flex-col items-center text-center
                                                ${isSelected ? 'bg-[#383a37] text-[#8fa07e] border-[#1a1a1a] scale-100 opacity-100 z-10' : 'bg-[#9dae8a] text-[#1a1a1a] border-[#383a37]/30 scale-90 opacity-40 blur-[0.5px]'}`}
                                            style={{
                                                transform: isPrev ? 'translateY(-5px)' : isNext ? 'translateY(5px)' : 'none'
                                            }}
                                        >
                                            <div className="text-[12px] font-black">
                                                {item.name} {item.count > 1 ? `x${item.count}` : ''}
                                            </div>
                                            {isSelected && (
                                                <>
                                                    <div className="text-[9px] leading-tight mt-1 px-1">{item.desc}</div>
                                                    <div className={`mt-2 text-[10px] font-black ${isUsingItem ? 'bg-gray-400' : 'bg-[#ff5252]'} text-white px-3 py-0.5 rounded-full border border-[#1a1a1a] ${!isUsingItem && 'animate-pulse'}`}>
                                                        {isUsingItem ? "正在使用..." : "[B] 確認使用"}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center text-[11px] font-bold opacity-50">背包目前是空的</div>
                    )}
                </div>
                <div className="text-[9px] font-black text-center text-[#1a1a1a] mt-1 opacity-70 underline decoration-dotted">
                    {"[A] 下一個  [B] 使用  [C] 關閉"}
                </div>
            </div>
        </div>
    );
}

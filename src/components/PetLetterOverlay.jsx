import React, { useEffect, useRef, useState } from 'react';
import { DitheredSprite } from './SpriteRenderer';
import { playBloop } from '../utils/audioSystem';

export default function PetLetterOverlay({ isOpen, letter, monsterId, monsterName, onRead, onReply, onClose }) {
    const [page, setPage] = useState(0);
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState('');
    const inputRef = useRef(null);
    const pages = Array.isArray(letter?.pages) && letter.pages.length > 0 ? letter.pages : ['......'];
    const isLastPage = page >= pages.length - 1;

    useEffect(() => {
        if (isOpen) {
            setPage(0);
            setIsReplying(false);
            setReplyText('');
        }
    }, [isOpen, letter?.id]);

    useEffect(() => {
        if (isReplying) inputRef.current?.focus();
    }, [isReplying]);

    const close = () => {
        if (letter?.id) onRead?.(letter.id);
        onClose?.();
    };

    const advance = () => {
        if (isReplying) {
            submitReply();
            return;
        }
        playBloop(isLastPage ? 'back' : 'confirm');
        if (isLastPage) {
            setIsReplying(true);
            return;
        }
        setPage(prev => Math.min(pages.length - 1, prev + 1));
    };

    const submitReply = () => {
        const text = replyText.trim();
        if (!text) {
            close();
            return;
        }
        playBloop('confirm');
        onReply?.(letter.id, text);
        onClose?.();
    };

    useEffect(() => {
        if (!isOpen) return undefined;
        const handleAdvance = () => advance();
        window.addEventListener('petLetterAdvance', handleAdvance);
        return () => window.removeEventListener('petLetterAdvance', handleAdvance);
    }, [isOpen, isLastPage, page, letter?.id, isReplying]);

    if (!isOpen || !letter) return null;

    return (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center p-3">
            <div className="absolute inset-0 bg-black/70" onClick={close}></div>

            <div className="relative w-full h-full bg-[#8fa07e] border-[4px] border-[#1a1a1a] flex flex-col overflow-hidden shadow-[6px_6px_0_rgba(0,0,0,0.25)]">
                <div className="bg-[#1a1a1a] text-[#8fa07e] px-3 py-2 flex justify-between items-center font-black text-[12px]">
                    <span>{letter.label || '怪獸來信'}</span>
                    <button onClick={close} className="hover:text-white">✕</button>
                </div>

                <div
                    className="flex-1 p-3 flex flex-col gap-3"
                    style={{ backgroundImage: 'radial-gradient(#7a8a6a 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                >
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="w-[44px] h-[44px] bg-[#ccd6be] border-[3px] border-[#1a1a1a] flex items-end justify-center overflow-hidden">
                            <div className="translate-y-[7px]">
                                <DitheredSprite id={monsterId} scale={1.5} animated={false} pure={true} />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <div className="text-[12px] font-black text-[#1a1a1a] truncate">{monsterName || '像素怪獸'}</div>
                            <div className="text-[8px] font-bold text-[#1a1a1a]/70">{letter.date}　{page + 1}/{pages.length}</div>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center">
                        <div className="w-full bg-white text-[#1a1a1a] border-[3px] border-[#1a1a1a] rounded-sm rounded-tl-none p-3 shadow-[4px_4px_0_rgba(0,0,0,0.14)]">
                            {!isReplying ? (
                                <div className="text-[12px] leading-[1.75] font-bold whitespace-pre-line break-words">
                                    {pages[page]}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    <div className="text-[10px] font-black text-[#1a1a1a]/70">寫一封回信給牠</div>
                                    <textarea
                                        ref={inputRef}
                                        value={replyText}
                                        maxLength={120}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            e.stopPropagation();
                                            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitReply();
                                        }}
                                        className="w-full h-[84px] bg-[#ccd6be] border-2 border-[#1a1a1a] p-2 text-[10px] leading-relaxed outline-none resize-none"
                                        placeholder="例如：今天也一起加油，晚點我會再來看你。"
                                    />
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            onClick={close}
                                            className="bg-[#8fa07e] text-[#1a1a1a] border-2 border-[#1a1a1a] px-2 py-1 text-[9px] font-black active:scale-95"
                                        >
                                            不回覆
                                        </button>
                                        <div className="text-[8px] font-bold text-[#1a1a1a]/60">{replyText.length}/120</div>
                                        <button
                                            onClick={submitReply}
                                            className="bg-[#ffca28] text-[#1a1a1a] border-2 border-[#1a1a1a] px-3 py-1 text-[9px] font-black active:scale-95"
                                        >
                                            寄出回信
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-[#1a1a1a] px-3 py-2 flex justify-between items-center text-[9px] font-black text-[#8fa07e]">
                    {!isReplying ? (
                        <>
                            <span>{isLastPage ? 'B 寫回信' : 'B 下一句'}</span>
                            <button
                                onClick={advance}
                                className="bg-[#ffca28] text-[#1a1a1a] border-2 border-[#ccd6be] px-3 py-1 active:scale-95"
                            >
                                {isLastPage ? '回信' : '繼續'}
                            </button>
                        </>
                    ) : (
                        <>
                            <span>B 寄出　C 關閉</span>
                            <span>{replyText.trim() ? '準備寄出' : '空白將略過'}</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

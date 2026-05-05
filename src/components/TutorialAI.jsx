import React, { useState, useEffect, useRef } from 'react';
import { TUTORIAL_KNOWLEDGE, DEFAULT_REPLY, QUICK_QUESTIONS } from '../data/tutorialKnowledge';
import { playBloop } from '../utils/audioSystem';

export default function TutorialAI({ isOpen, onClose }) {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { role: 'ai', text: "你好！我是像素怪教授。有什麼我可以幫你的嗎？你可以直接輸入問題，或是點選下方的熱門問題。", typing: false }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [quickQuestions, setQuickQuestions] = useState(QUICK_QUESTIONS);
    const scrollRef = useRef(null);

    // 自動捲動到底部
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    // 當關閉視窗時，重置所有狀態
    useEffect(() => {
        if (!isOpen) {
            setMessages([
                { role: 'ai', text: "你好！我是像素教授。有什麼我可以幫你的嗎？你可以直接輸入問題，或是點選下方的熱門問題。", typing: false }
            ]);
            setQuickQuestions(QUICK_QUESTIONS);
            setInput('');
            setIsTyping(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getResponse = (query) => {
        const lowerQuery = query.toLowerCase();
        for (const item of TUTORIAL_KNOWLEDGE) {
            if (item.keywords.some(k => lowerQuery.includes(k.toLowerCase()))) {
                return item;
            }
        }
        return { answer: DEFAULT_REPLY };
    };

    const handleSend = (text = null) => {
        const query = text || input.trim();
        if (!query || isTyping) return;

        playBloop('confirm');

        // 使用者訊息
        const newMessages = [...messages, { role: 'user', text: query }];
        setMessages(newMessages);
        setInput('');
        setIsTyping(true);

        // 模擬 AI 思考與打字
        setTimeout(() => {
            const response = getResponse(query);
            simulateTyping(response.answer, response.image, response.followUp);
        }, 600);
    };

    const simulateTyping = (fullText, image = null, followUp = null) => {
        let currentText = "";
        const words = fullText.split("");
        let i = 0;

        setMessages(prev => [...prev, { role: 'ai', text: "", image, typing: true }]);

        const interval = setInterval(() => {
            if (i < words.length) {
                currentText += words[i];
                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1].text = currentText;
                    return next;
                });
                i++;
            } else {
                clearInterval(interval);
                setIsTyping(false);
                // 更新關聯問題
                if (followUp && followUp.length > 0) {
                    setQuickQuestions(followUp);
                } else {
                    setQuickQuestions(QUICK_QUESTIONS); // 回到預設問題
                }
                setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1].typing = false;
                    return next;
                });
            }
        }, 30); // 打字速度
    };

    return (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center p-4">
            {/* 背景遮罩 */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            {/* 主視窗 */}
            <div className="relative w-full max-w-[280px] h-[450px] bg-[#8fa07e] border-[4px] border-[#1a1a1a] shadow-[8px_8px_0_rgba(0,0,0,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* 標題列 */}
                <div className="bg-[#1a1a1a] text-[#8fa07e] px-3 py-2 flex justify-between items-center font-black text-[12px]">
                    <span>AI 助手 (BETA)</span>
                    <button onClick={() => { playBloop('back'); onClose(); }} className="hover:text-white">✕</button>
                </div>

                {/* 對話紀錄區 */}
                <div
                    ref={scrollRef}
                    className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 scrollbar-hide"
                    style={{ backgroundImage: 'radial-gradient(#7a8a6a 1px, transparent 1px)', backgroundSize: '10px 10px' }}
                >
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[90%] p-2 rounded-sm border-2 border-[#1a1a1a] text-[10px] leading-relaxed shadow-[3px_3px_0_rgba(0,0,0,0.1)] ${msg.role === 'user'
                                ? 'bg-[#ffca28] text-black rounded-tr-none'
                                : 'bg-white text-[#1a1a1a] rounded-tl-none'
                                }`}>
                                {msg.text}
                                {msg.typing && <span className="animate-pulse ml-1">▋</span>}

                                {msg.image && (
                                    <div className="mt-2 pt-2 border-t border-[#1a1a1a]/10">
                                        <img
                                            src={`${import.meta.env.BASE_URL}assets/text/${msg.image}`}
                                            className="w-full rounded border border-[#1a1a1a]/20 shadow-sm"
                                            alt="tutorial"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isTyping && messages[messages.length - 1].role === 'user' && (
                        <div className="flex justify-start">
                            <div className="bg-white/50 p-2 rounded-sm text-[10px] border border-[#1a1a1a]/20">
                                正在思考中...
                            </div>
                        </div>
                    )}
                </div>

                {/* 快速提問區 */}
                {!isTyping && (
                    <div className="bg-[#7a8a6a]/40 p-2 border-t border-[#1a1a1a]/20 flex flex-wrap gap-1">
                        {quickQuestions.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(q)}
                                className="bg-[#ccd6be]/80 border border-[#1a1a1a] px-2 py-1 text-[8px] rounded hover:bg-white transition-colors"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {/* 輸入區 */}
                <div className="p-2 bg-[#1a1a1a] flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="輸入問題..."
                        disabled={isTyping}
                        className="flex-1 bg-[#8fa07e] border-2 border-[#ccd6be] px-2 py-1 text-[10px] text-black placeholder-black/50 outline-none"
                    />
                    <button
                        onClick={() => handleSend()}
                        disabled={isTyping}
                        className="bg-[#ffca28] border-2 border-[#ccd6be] px-3 py-1 text-[10px] font-bold active:scale-95 disabled:opacity-50"
                    >
                        送出
                    </button>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
}

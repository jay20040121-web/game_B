import React from 'react';

const DEFEAT_TUTORIAL_IMAGES = [
    '命中太低.png',
    '天賦教學.png',
    '如何升級.png',
    '屬性被克制.png',
];

const pickRandomImages = () => {
    const pool = [...DEFEAT_TUTORIAL_IMAGES];
    for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool;
};

export default function DefeatTutorialOverlay({ type, onClose }) {
    const [slides, setSlides] = React.useState([]);
    const [slideIdx, setSlideIdx] = React.useState(0);

    React.useEffect(() => {
        if (!type) return;
        setSlides(pickRandomImages());
        setSlideIdx(0);
    }, [type]);

    React.useEffect(() => {
        if (!type || slides.length <= 1) return undefined;
        const timer = setInterval(() => {
            setSlideIdx(prev => (prev + 1) % slides.length);
        }, 20000);
        return () => clearInterval(timer);
    }, [type, slides.length]);

    React.useEffect(() => {
        if (!type || slides.length <= 1) return undefined;
        const handleNext = () => setSlideIdx(prev => (prev + 1) % slides.length);
        window.addEventListener('defeatTutorialNext', handleNext);
        return () => window.removeEventListener('defeatTutorialNext', handleNext);
    }, [type, slides.length]);

    if (!type) return null;

    const currentImage = slides[slideIdx] || '';
    const imageSrc = currentImage ? `${import.meta.env.BASE_URL}assets/UI/${currentImage}` : '';

    return (
        <div className="absolute inset-0 z-[220] bg-black flex items-center justify-center" onClick={onClose}>
            {imageSrc && (
                <img
                    key={currentImage}
                    src={imageSrc}
                    alt=""
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                />
            )}
            {slides.length > 1 && (
                <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center gap-1">
                    {slides.map((slide, idx) => (
                        <span
                            key={slide}
                            className={`block w-1.5 h-1.5 border border-white/80 ${idx === slideIdx ? 'bg-white' : 'bg-black/40'}`}
                        />
                    ))}
                </div>
            )}
            <div className="absolute bottom-5 left-0 right-0 text-center text-[9px] font-black text-white/90 drop-shadow-[1px_1px_0_rgba(0,0,0,0.8)]">
                [A] 下一張　[B] 關閉引導
            </div>
        </div>
    );
}

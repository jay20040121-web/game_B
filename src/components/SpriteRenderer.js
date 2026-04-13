import React, { useState, useEffect } from 'react';

// ==========================================
// 即時 4-Color 網點運算引擎 (Bayer Matrix Dithering)
// ==========================================
const DitheredSprite = ({ id, className = "", scale = 4.5, animated = true, silhouette = false }) => {
    const [imgSrc, setImgSrc] = useState(animated ? `assets/animated/${id}.gif` : `assets/sprites/${id}.png`);

    useEffect(() => {
        setImgSrc(animated ? `assets/animated/${id}.gif` : `assets/sprites/${id}.png`);
    }, [id, animated]);

    if (!id) return null;

    const baseSize = 68;
    const targetSize = baseSize * scale;

    return (
        <div 
            className={`dithered-monster-container ${className}`}
            style={{ 
                width: `${targetSize}px`, 
                height: `${targetSize}px`,
                minWidth: `${targetSize}px`,
                minHeight: `${targetSize}px`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                overflow: 'visible',
            }}
        >
            <img 
                src={imgSrc}
                className="pixel-rendering"
                style={{ 
                    filter: silhouette 
                        ? 'brightness(0) contrast(100)' 
                        : 'saturate(0.25) brightness(0.5) contrast(1.1)',
                    width: '100%',
                    height: '100%',
                    minWidth: '100%',
                    minHeight: '100%',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    opacity: 1.0,
                    pointerEvents: 'none',
                    // GIF 特殊定位：修正縮放後「浮在空中」的問題
                    transform: (imgSrc.toLowerCase().endsWith('.gif')) 
                        ? 'scale(0.55) translateY(0)' 
                        : 'none',
                    transformOrigin: 'bottom center'
                }}
                alt="Monster Sprite"
                onError={() => {
                    if (imgSrc.toLowerCase().endsWith('.gif')) {
                        setImgSrc(`assets/sprites/${id}.png`);
                    }
                }}
            />
        </div>
    );
};

// ==========================================
// 背面 4-Color 網點運算引擎
// ==========================================
const DitheredBackSprite = ({ id, className = "", scale = 4.5, animated = true }) => {
    const [imgSrc, setImgSrc] = useState(animated ? `assets/animated/back/${id}.gif` : `assets/back_sprites/${id}.png`);

    useEffect(() => {
        setImgSrc(animated ? `assets/animated/back/${id}.gif` : `assets/back_sprites/${id}.png`);
    }, [id, animated]);

    if (!id) return null;

    const baseSize = 68;
    const targetSize = baseSize * scale;

    return (
        <div 
            className={`dithered-monster-container ${className}`}
            style={{ 
                width: `${targetSize}px`, 
                height: `${targetSize}px`,
                minWidth: `${targetSize}px`,
                minHeight: `${targetSize}px`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexShrink: 0,
                whiteSpace: 'nowrap',
                overflow: 'visible',
            }}
        >
            <img 
                src={imgSrc}
                className="pixel-rendering"
                style={{ 
                    filter: 'saturate(0.25) brightness(0.5) contrast(1.1)',
                    width: '100%',
                    height: '100%',
                    minWidth: '100%',
                    minHeight: '100%',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    opacity: 1.0,
                    pointerEvents: 'none',
                    // GIF 特殊定位：與正面一致
                    transform: (imgSrc.toLowerCase().endsWith('.gif')) 
                        ? 'scale(0.55) translateY(0)' 
                        : 'none',
                    transformOrigin: 'bottom center'
                }}
                alt="Monster Back Sprite"
                onError={() => {
                    if (imgSrc.toLowerCase().endsWith('.gif')) {
                        setImgSrc(`assets/back_sprites/${id}.png`);
                    }
                }}
            />
        </div>
    );
};

// ==========================================
// 點陣圖及動畫共用資源
// ==========================================
const ICONS = {
    status: ["  3     ", "  33    ", " 333  3 ", " 3333 33", "33333333", "33333333", "        ", "        "],
    feed: ["   33   ", "  3333  ", " 333333 ", "33333333", "33333333", " 333333 ", "  3333  ", "   33   "],
    clean: ["        ", "   33   ", "  3333  ", " 333333 ", "33333333", "33333333", " 333333 ", "        "],
    pet: ["   33   ", "  3333  ", "  33 33 ", " 33  33 ", " 3   33 ", " 3   3  ", "  3 3   ", "   3    "],
    train: [" 33  33 ", " 333333 ", "   33   ", " 333333 ", "   33   ", " 333333 ", " 33  33 ", "        "],
    focus: ["   33   ", "  3333  ", " 333333 ", "   33   ", "  33    ", " 33     ", " 3      ", "        "],
    mail: ["        ", "33333333", "33    33", "3 3  3 3", "3  33  3", "3      3", "33333333", "        "],
    info: ["   33   ", "  3333  ", "  3333  ", "   33   ", "        ", "   33   ", "  3333  ", "   33   "],
    heart: ["  33 33 ", " 3333 33", "33333333", "33333333", " 333333 ", " 333333 ", "  3333  ", "   33   "],
    redHeart: ["  RR RR ", " RRRR RR", "RRRRRRRR", "RRRRRRRR", " RRRRRR ", " RRRRRR ", "  RRRR  ", "   RR   "],
    ghost: [" 333333 ", "33333333", "333  333", "333  333", "33333333", "33333333", " 3 3 3 3", " 3 3 3 3"],
    runaway: ["        ", " 3  3   ", "333 333 ", " 3  3   ", "        ", "  3  3  ", "  33 33 ", "   3 3  "],
    footprint: [
        " 3   3 ", // Toes
        "  3 3  ", 
        "  333  ", // Pad
        " 33333 ",
        "  333  "
    ]
};

const COLOR_MAP = {
    'R': '#ff5252'
};

// --- CSS Animations for Battle ---
const BATTLE_STYLES = `
@keyframes damage-flash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.1; }
}
.damage-flash {
    animation: damage-flash 0.1s linear infinite;
}
`;

const PixelArt = ({ sprite, className = "", scale = 2 }) => {
    if (!sprite) return null;
    const size = sprite.length;
    return (
        <div className={`pixel-rendering ${className}`} style={{ width: size * scale, height: size * scale, display: 'inline-block' }}>
            <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" style={{ display: 'block' }}>
                {sprite.map((row, y) =>
                    row.split('').map((char, x) => (char !== ' ' && char !== '.') && (
                        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLOR_MAP[char] || '#000000'} />
                    ))
                )}
            </svg>
        </div>
    );
};

export { DitheredSprite, DitheredBackSprite, PixelArt, ICONS, BATTLE_STYLES };

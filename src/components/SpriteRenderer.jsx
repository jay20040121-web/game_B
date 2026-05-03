import React, { useState, useEffect, memo } from 'react';
import { MONSTER_ASSET_IDS } from '../monsterData';

// ==========================================
// 即時 4-Color 網點運算引擎 (Bayer Matrix Dithering)
// ==========================================
const DitheredSprite = memo(({ id, className = "", scale = 4.5, animated = true, silhouette = false, pure = true }) => {
    const assetId = MONSTER_ASSET_IDS[id] || id;
    const base = import.meta.env.BASE_URL;
    
    // --- Progressive Loading Logic ---
    const staticSrc = `${base}assets/exclusive/sprites/${assetId}.png`;
    const animatedSrc = `${base}assets/exclusive/idle/${assetId}.gif`;
    
    const [imgSrc, setImgSrc] = useState(staticSrc); // Default to static PNG for instant load
    const [isGifLoaded, setIsGifLoaded] = useState(false);
    const [naturalWidth, setNaturalWidth] = useState(0);

    useEffect(() => {
        const currentAssetId = MONSTER_ASSET_IDS[id] || id;
        const newStatic = `${base}assets/exclusive/sprites/${currentAssetId}.png`;
        const newAnimated = `${base}assets/exclusive/idle/${currentAssetId}.gif`;
        
        setImgSrc(newStatic);
        setIsGifLoaded(false);

        if (animated) {
            // Background load the GIF
            const img = new Image();
            img.src = newAnimated;
            img.onload = () => {
                setImgSrc(newAnimated);
                setIsGifLoaded(true);
            };
            img.onerror = () => {
                // If GIF fails, we stay with PNG
                setIsGifLoaded(false);
            };
        }
    }, [id, animated, base]);

    if (!id) return null;

    const baseSize = 68;
    const targetSize = baseSize * scale;
    const innerScale = naturalWidth >= 120 ? 0.7 : 0.55;

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
                loading="lazy"
                className={`pixel-rendering ${!isGifLoaded && animated ? 'opacity-70 grayscale-[0.3]' : ''}`}
                onLoad={(e) => setNaturalWidth(e.target.naturalWidth)}
                style={{ 
                    filter: silhouette 
                        ? 'brightness(0) contrast(100)' 
                        : (pure ? 'none' : 'saturate(1.0) brightness(0.5) contrast(1.1)'),
                    width: '100%',
                    height: '100%',
                    minWidth: '100%',
                    minHeight: '100%',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    opacity: 1.0,
                    pointerEvents: 'none',
                    transform: `scale(${innerScale}) translateY(0)`,
                    transformOrigin: 'bottom center',
                    transition: 'opacity 0.3s ease-in-out'
                }}
                alt="Monster Sprite"
            />
        </div>
    );
});

// ==========================================
// 背面 4-Color 網點運算引擎
// ==========================================
const DitheredBackSprite = memo(({ id, className = "", scale = 4.5, animated = true, pure = true }) => {
    const assetId = MONSTER_ASSET_IDS[id] || id;
    const base = import.meta.env.BASE_URL;

    // --- Progressive Loading Logic ---
    const staticSrc = `${base}assets/exclusive/back/${assetId}.png`;
    const animatedSrc = `${base}assets/exclusive/back/${assetId}.gif`;

    const [imgSrc, setImgSrc] = useState(staticSrc);
    const [isGifLoaded, setIsGifLoaded] = useState(false);
    const [naturalWidth, setNaturalWidth] = useState(0);

    useEffect(() => {
        const currentAssetId = MONSTER_ASSET_IDS[id] || id;
        const newStatic = `${base}assets/exclusive/back/${currentAssetId}.png`;
        const newAnimated = `${base}assets/exclusive/back/${currentAssetId}.gif`;

        setImgSrc(newStatic);
        setIsGifLoaded(false);

        if (animated) {
            const img = new Image();
            img.src = newAnimated;
            img.onload = () => {
                setImgSrc(newAnimated);
                setIsGifLoaded(true);
            };
            img.onerror = () => {
                setIsGifLoaded(false);
            };
        }
    }, [id, animated, base]);

    if (!id) return null;

    const baseSize = 68;
    const targetSize = baseSize * scale;
    const innerScale = naturalWidth >= 120 ? 0.7 : 0.55;

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
                loading="lazy"
                className={`pixel-rendering ${!isGifLoaded && animated ? 'opacity-70 grayscale-[0.2]' : ''}`}
                onLoad={(e) => setNaturalWidth(e.target.naturalWidth)}
                style={{ 
                    filter: pure ? 'none' : 'saturate(1.0) brightness(0.5) contrast(1.1)',
                    width: '100%',
                    height: '100%',
                    minWidth: '100%',
                    minHeight: '100%',
                    objectFit: 'contain',
                    imageRendering: 'pixelated',
                    opacity: 1.0,
                    pointerEvents: 'none',
                    transform: `scale(${innerScale}) translateY(0)`,
                    transformOrigin: 'bottom center',
                    transition: 'opacity 0.3s ease-in-out'
                }}
                alt="Monster Back Sprite"
            />
        </div>
    );
});

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

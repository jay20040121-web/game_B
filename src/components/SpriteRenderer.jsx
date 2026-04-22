import React, { useState, useEffect } from 'react';
import { MONSTER_ASSET_IDS } from '../monsterData';

// ==========================================
// 即時 4-Color 網點運算引擎 (Bayer Matrix Dithering)
// ==========================================
const DitheredSprite = ({ id, className = "", scale = 4.5, animated = true, silhouette = false }) => {
    const assetId = MONSTER_ASSET_IDS[id] || id;
    const base = import.meta.env.BASE_URL;
    const [imgSrc, setImgSrc] = useState(() => {
        const currentAssetId = MONSTER_ASSET_IDS[id] || id;
        return animated 
            ? `${base}assets/exclusive/idle/${currentAssetId}.gif` 
            : `${base}assets/exclusive/sprites/${currentAssetId}.png`;
    });

    useEffect(() => {
        const currentAssetId = MONSTER_ASSET_IDS[id] || id;
        setImgSrc(animated 
            ? `${base}assets/exclusive/idle/${currentAssetId}.gif` 
            : `${base}assets/exclusive/sprites/${currentAssetId}.png`);
    }, [id, animated, base]);

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
                        : 'none',
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
                    const currentAssetId = MONSTER_ASSET_IDS[id] || id;
                    const base = import.meta.env.BASE_URL;
                    if (imgSrc.toLowerCase().endsWith('.gif')) {
                        setImgSrc(`${base}assets/sprites/${currentAssetId}.png`);
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
    const assetId = MONSTER_ASSET_IDS[id] || id;
    const base = import.meta.env.BASE_URL;
    const [imgSrc, setImgSrc] = useState(() => {
        const currentAssetId = MONSTER_ASSET_IDS[id] || id;
        return animated 
            ? `${base}assets/exclusive/back/${currentAssetId}.gif` 
            : `${base}assets/exclusive/back_sprites/${currentAssetId}.png`;
    });

    useEffect(() => {
        const currentAssetId = MONSTER_ASSET_IDS[id] || id;
        setImgSrc(animated 
            ? `${base}assets/exclusive/back/${currentAssetId}.gif` 
            : `${base}assets/exclusive/back_sprites/${currentAssetId}.png`);
    }, [id, animated, base]);

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
                    filter: 'none',
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
                    const currentAssetId = MONSTER_ASSET_IDS[id] || id;
                    const base = import.meta.env.BASE_URL;
                    if (imgSrc.toLowerCase().endsWith('.gif')) {
                        setImgSrc(`${base}assets/back_sprites/${currentAssetId}.png`);
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

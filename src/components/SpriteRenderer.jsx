import React, { useState, useEffect, memo } from 'react';
import { MONSTER_ASSET_IDS } from '../monsterData';
import { POKEMON_VISIBLE_HEIGHTS } from '../data/pokemonMapping';

const measureVisiblePixelHeight = image => {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d', { willReadFrequently: true });
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let top = canvas.height;
        let bottom = -1;
        for (let y = 0; y < canvas.height; y += 1) {
            for (let x = 0; x < canvas.width; x += 1) {
                if (pixels[(y * canvas.width + x) * 4 + 3] > 8) { top = Math.min(top, y); bottom = Math.max(bottom, y); }
            }
        }
        return bottom >= top ? bottom - top + 1 : image.naturalHeight;
    } catch { return image.naturalHeight; }
};

// ==========================================
// 即時 4-Color 網點運算引擎 (Bayer Matrix Dithering)
// ==========================================
const DitheredSprite = memo(({ id, className = "", scale = 4.5, animated = true, silhouette = false, pure = true, forceStatic = false, smoothAnimated = false, smoothSmallAnimatedScale = 1, smallSmoothImageRendering = 'auto', normalizePokemonBattleSize = false }) => {
    const assetId = MONSTER_ASSET_IDS[id] || id;
    const isPokemonSprite = Boolean(MONSTER_ASSET_IDS[id]);
    const base = import.meta.env.BASE_URL;
    
    const effectiveAnimated = animated && !forceStatic;

    // --- Progressive Loading Logic ---
    const staticSrc = `${base}assets/exclusive/sprites/${assetId}.png`;
    const animatedSrc = `${base}assets/exclusive/idle/${assetId}.gif`;
    
    const [imgSrc, setImgSrc] = useState(staticSrc); // Default to static PNG for instant load
    const [isGifLoaded, setIsGifLoaded] = useState(false);
    const [naturalWidth, setNaturalWidth] = useState(0);
    const [naturalHeight, setNaturalHeight] = useState(0);
    const [visibleHeight, setVisibleHeight] = useState(0);

    useEffect(() => {
        const currentAssetId = MONSTER_ASSET_IDS[id] || id;
        const newStatic = `${base}assets/exclusive/sprites/${currentAssetId}.png`;
        const newAnimated = `${base}assets/exclusive/idle/${currentAssetId}.gif`;
        
        setImgSrc(newStatic);
        setIsGifLoaded(false);
        setNaturalWidth(0); // Reset width when ID changes
        setNaturalHeight(0);
        setVisibleHeight(0);

        if (effectiveAnimated) {
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
    }, [id, effectiveAnimated, base]);

    if (!id) return null;

    const baseSize = 68;
    const targetSize = baseSize * scale;
    const useSmoothAnimated = effectiveAnimated && smoothAnimated;
    const isSmallSmoothGif = useSmoothAnimated && isGifLoaded && naturalWidth <= 64 && naturalHeight <= 64;
    const innerScale = useSmoothAnimated ? (isSmallSmoothGif ? smoothSmallAnimatedScale : 1) : (naturalWidth >= 120 ? 0.7 : 0.55);
    const imageRendering = isPokemonSprite ? 'pixelated' : (useSmoothAnimated ? (isSmallSmoothGif ? smallSmoothImageRendering : 'auto') : 'pixelated');
    const pokemonScaleStep = naturalWidth > 0
        ? (normalizePokemonBattleSize
            ? 68 / (POKEMON_VISIBLE_HEIGHTS[assetId] || visibleHeight || naturalHeight || 68)
            : (targetSize >= naturalWidth * 2 ? 2 : (targetSize >= naturalWidth ? 1 : 0.5)))
        : 1;
    const pokemonWidth = naturalWidth > 0 ? Math.round(naturalWidth * pokemonScaleStep) : targetSize;
    const pokemonHeight = naturalHeight > 0 ? Math.round(naturalHeight * pokemonScaleStep) : targetSize;

    // --- Sprite Offsets ---
    // 可以在這裡針對各別怪獸 ID 設定垂直位移 (向下為正，向上為負)
    const SPRITE_OFFSETS = {
        '1014': '20px', // 針對 ID 1014 下調 20px
    };
    // 只有在載入並顯示 GIF 時才套用位移 (避免影響圖鑑等使用靜態圖的畫面)
    const offsetY = (isGifLoaded && effectiveAnimated) ? (SPRITE_OFFSETS[String(id)] || '0px') : '0px';

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
                className={`pixel-rendering ${!isGifLoaded && effectiveAnimated ? 'opacity-70 grayscale-[0.3]' : ''}`}
                onLoad={(e) => {
                    setNaturalWidth(e.target.naturalWidth);
                    setNaturalHeight(e.target.naturalHeight);
                    setVisibleHeight(measureVisiblePixelHeight(e.target));
                }}
                style={{ 
                    filter: silhouette
                        ? 'brightness(0) contrast(100)'
                        : (isPokemonSprite
                            ? (pure ? 'contrast(1.18) saturate(0.82) brightness(1.04)' : 'contrast(1.25) saturate(0.72) brightness(0.58)')
                            : (pure ? 'none' : 'saturate(1.0) brightness(0.5) contrast(1.1)')),
                    width: isPokemonSprite ? `${pokemonWidth}px` : '100%',
                    height: isPokemonSprite ? `${pokemonHeight}px` : '100%',
                    minWidth: isPokemonSprite ? `${pokemonWidth}px` : '100%',
                    minHeight: isPokemonSprite ? `${pokemonHeight}px` : '100%',
                    objectFit: 'contain',
                    alignSelf: isPokemonSprite ? 'flex-end' : 'auto',
                    imageRendering,
                    opacity: 1.0,
                    pointerEvents: 'none',
                    transform: isPokemonSprite ? `translateY(${offsetY})` : `scale(${innerScale}) translateY(${offsetY})`,
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
const DitheredBackSprite = memo(({ id, className = "", scale = 4.5, animated = true, pure = true, forceStatic = false, smoothAnimated = false, normalizePokemonBattleSize = false }) => {
    const assetId = MONSTER_ASSET_IDS[id] || id;
    const isPokemonSprite = Boolean(MONSTER_ASSET_IDS[id]);
    const base = import.meta.env.BASE_URL;

    const effectiveAnimated = animated && !forceStatic;

    // --- Progressive Loading Logic ---
    const staticSrc = `${base}assets/exclusive/back/${assetId}.png`;
    const animatedSrc = `${base}assets/exclusive/back/${assetId}.gif`;

    const [imgSrc, setImgSrc] = useState(staticSrc);
    const [isGifLoaded, setIsGifLoaded] = useState(false);
    const [naturalWidth, setNaturalWidth] = useState(0);
    const [naturalHeight, setNaturalHeight] = useState(0);
    const [visibleHeight, setVisibleHeight] = useState(0);

    useEffect(() => {
        const currentAssetId = MONSTER_ASSET_IDS[id] || id;
        const newStatic = `${base}assets/exclusive/back/${currentAssetId}.png`;
        const newAnimated = `${base}assets/exclusive/back/${currentAssetId}.gif`;

        setImgSrc(newStatic);
        setIsGifLoaded(false);
        setNaturalWidth(0);
        setNaturalHeight(0);
        setVisibleHeight(0);

        if (effectiveAnimated) {
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
    }, [id, effectiveAnimated, base]);

    if (!id) return null;

    const baseSize = 68;
    const targetSize = baseSize * scale;
    const useSmoothAnimated = effectiveAnimated && smoothAnimated;
    const innerScale = useSmoothAnimated ? 1 : (naturalWidth >= 120 ? 0.7 : 0.55);
    const pokemonScaleStep = naturalWidth > 0
        ? (normalizePokemonBattleSize
            ? 68 / (POKEMON_VISIBLE_HEIGHTS[assetId] || visibleHeight || naturalHeight || 68)
            : (targetSize >= naturalWidth * 2 ? 2 : (targetSize >= naturalWidth ? 1 : 0.5)))
        : 1;
    const pokemonWidth = naturalWidth > 0 ? Math.round(naturalWidth * pokemonScaleStep) : targetSize;
    const pokemonHeight = naturalHeight > 0 ? Math.round(naturalHeight * pokemonScaleStep) : targetSize;

    // --- Sprite Offsets ---
    // 可以在這裡針對各別怪獸 ID 設定垂直位移 (向下為正，向上為負)
    const SPRITE_OFFSETS = {
        '1014': '20px', // 針對 ID 1014 下調 20px
    };
    // 只有在載入並顯示 GIF 時才套用位移 (避免影響靜態圖)
    const offsetY = (isGifLoaded && effectiveAnimated) ? (SPRITE_OFFSETS[String(id)] || '0px') : '0px';

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
                className={`pixel-rendering ${!isGifLoaded && effectiveAnimated ? 'opacity-70 grayscale-[0.2]' : ''}`}
                onLoad={(e) => {
                    setNaturalWidth(e.target.naturalWidth);
                    setNaturalHeight(e.target.naturalHeight);
                    setVisibleHeight(measureVisiblePixelHeight(e.target));
                }}
                style={{ 
                    filter: isPokemonSprite
                        ? (pure ? 'contrast(1.18) saturate(0.82) brightness(1.04)' : 'contrast(1.25) saturate(0.72) brightness(0.58)')
                        : (pure ? 'none' : 'saturate(1.0) brightness(0.5) contrast(1.1)'),
                    width: isPokemonSprite ? `${pokemonWidth}px` : '100%',
                    height: isPokemonSprite ? `${pokemonHeight}px` : '100%',
                    minWidth: isPokemonSprite ? `${pokemonWidth}px` : '100%',
                    minHeight: isPokemonSprite ? `${pokemonHeight}px` : '100%',
                    objectFit: 'contain',
                    alignSelf: isPokemonSprite ? 'flex-end' : 'auto',
                    imageRendering: isPokemonSprite ? 'pixelated' : (useSmoothAnimated ? 'auto' : 'pixelated'),
                    opacity: 1.0,
                    pointerEvents: 'none',
                    transform: isPokemonSprite ? `translateY(${offsetY})` : `scale(${innerScale}) translateY(${offsetY})`,
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
const BATTLE_STYLES = ``;

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

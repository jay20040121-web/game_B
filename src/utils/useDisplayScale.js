import { useEffect, useState } from 'react';

const SCALE_STORAGE_KEY = 'pixel_monster_scale';
const IS_DESKTOP_BUILD = import.meta.env.VITE_DESKTOP === '1';
const SCALE_PRESETS = IS_DESKTOP_BUILD ? [1, 1.5, 2, 2.5] : [1, 1.25, 1.5];

const snapScale = (value) => {
    let chosen = SCALE_PRESETS[0];
    for (const preset of SCALE_PRESETS) {
        if (value >= preset) chosen = preset;
    }
    return chosen;
};

export const useDisplayScale = () => {
    const [manualScale, setManualScale] = useState(() => {
        const saved = localStorage.getItem(SCALE_STORAGE_KEY);
        if (!saved) return null;
        const parsed = parseFloat(saved);
        return Number.isFinite(parsed) ? (IS_DESKTOP_BUILD ? snapScale(parsed) : parsed) : null;
    });

    useEffect(() => {
        if (manualScale !== null) {
            localStorage.setItem(SCALE_STORAGE_KEY, manualScale);
        } else {
            localStorage.removeItem(SCALE_STORAGE_KEY);
        }
    }, [manualScale]);

    const [displayScale, setDisplayScale] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            if (manualScale !== null) {
                setDisplayScale(manualScale);
                return;
            }

            const scaleW = window.innerWidth / 320;
            const scaleH = (window.innerHeight - 20) / 620;
            const autoScale = Math.min(scaleW, scaleH, SCALE_PRESETS[SCALE_PRESETS.length - 1]);
            setDisplayScale(IS_DESKTOP_BUILD ? snapScale(autoScale) : autoScale);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [manualScale]);

    useEffect(() => {
        if (!IS_DESKTOP_BUILD) return;
        const api = window.desktopWindow;
        if (!api?.setContentSize) return;
        const syncScale = manualScale ?? displayScale;
        api.setContentSize(Math.round(syncScale * 320), Math.round(syncScale * 620));
    }, [manualScale, displayScale]);

    return { displayScale, manualScale, setManualScale };
};

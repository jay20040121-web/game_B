import { useEffect, useState } from 'react';

const SCALE_STORAGE_KEY = 'pixel_monster_scale';

export const useDisplayScale = () => {
    const [manualScale, setManualScale] = useState(() => {
        const saved = localStorage.getItem(SCALE_STORAGE_KEY);
        return saved ? parseFloat(saved) : null;
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
            setDisplayScale(Math.min(scaleW, scaleH, 1.5));
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [manualScale]);

    return { displayScale, manualScale, setManualScale };
};

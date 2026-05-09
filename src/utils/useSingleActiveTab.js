import { useEffect, useRef, useState } from 'react';

const ACTIVE_TAB_ID_KEY = 'pixel_monster_active_tab_id';
const ACTIVE_TAB_TIME_KEY = 'pixel_monster_active_tab_time';

export const useSingleActiveTab = () => {
    const tabIdRef = useRef(Math.random().toString(36).substr(2, 9));
    const [isDuplicateTab, setIsDuplicateTab] = useState(false);

    useEffect(() => {
        const checkTab = () => {
            const now = Date.now();
            const activeTabId = localStorage.getItem(ACTIVE_TAB_ID_KEY);
            const activeTabTime = parseInt(localStorage.getItem(ACTIVE_TAB_TIME_KEY) || '0');

            if (activeTabId && activeTabId !== tabIdRef.current && (now - activeTabTime < 3000)) {
                setIsDuplicateTab(true);
            } else {
                setIsDuplicateTab(false);
                localStorage.setItem(ACTIVE_TAB_ID_KEY, tabIdRef.current);
                localStorage.setItem(ACTIVE_TAB_TIME_KEY, now.toString());
            }
        };

        checkTab();
        const timer = setInterval(() => {
            if (document.hidden) return;
            checkTab();
        }, 1500);

        return () => {
            clearInterval(timer);
            if (localStorage.getItem(ACTIVE_TAB_ID_KEY) === tabIdRef.current) {
                localStorage.removeItem(ACTIVE_TAB_ID_KEY);
                localStorage.removeItem(ACTIVE_TAB_TIME_KEY);
            }
        };
    }, []);

    return isDuplicateTab;
};

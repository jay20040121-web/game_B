import { useCallback, useEffect, useRef, useState } from 'react';

import { playBloop } from './audioSystem';
import { FIRESTORE_COLLECTION } from './envConfig';
import { auth, db, googleProvider } from './firebase';
import { SAVE_VERSION, clearPersistedSaveData, isInAppBrowser, persistSaveData } from './storageSystem';

export const useCloudSync = ({ setAlertMsg, updateDialogue }) => {
    const [user, setUser] = useState(null);
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [isCloudLoading, setIsCloudLoading] = useState(false);
    const [hasCheckedCloud, setHasCheckedCloud] = useState(false);
    const [cloudWriteEnabled, setCloudWriteEnabled] = useState(false);
    const [cloudChoicePrompt, setCloudChoicePrompt] = useState(null);
    const [lastCloudSyncTime, setLastCloudSyncTime] = useState(0);
    const userRef = useRef(null);
    const isCloudSyncingRef = useRef(false);
    const hasCheckedCloudRef = useRef(false);
    const cloudWriteEnabledRef = useRef(false);
    const lastCloudSyncTimeRef = useRef(0);
    const cloudLoadInFlightRef = useRef(false);
    const pendingCloudDataRef = useRef(null);
    const pendingLocalDataRef = useRef(null);

    const markCloudLoaded = useCallback((uid, cloudTime) => {
        try {
            sessionStorage.setItem('pixel_monster_cloud_loaded_uid', uid);
            sessionStorage.setItem('pixel_monster_cloud_loaded_time', String(cloudTime || 0));
        } catch (e) { }
    }, []);

    const hasLoadedCloudThisSession = useCallback((uid) => {
        try {
            return sessionStorage.getItem('pixel_monster_cloud_loaded_uid') === uid;
        } catch (e) {
            return false;
        }
    }, []);

    const getSessionCloudTime = useCallback(() => {
        try {
            return Number(sessionStorage.getItem('pixel_monster_cloud_loaded_time') || 0);
        } catch (e) {
            return 0;
        }
    }, []);

    useEffect(() => {
        userRef.current = user;
        isCloudSyncingRef.current = isCloudSyncing;
        hasCheckedCloudRef.current = hasCheckedCloud;
        cloudWriteEnabledRef.current = cloudWriteEnabled;
        lastCloudSyncTimeRef.current = lastCloudSyncTime;
    }, [cloudWriteEnabled, hasCheckedCloud, isCloudSyncing, lastCloudSyncTime, user]);

    const saveToCloud = useCallback(async (saveData, options = {}) => {
        const currentUser = userRef.current;
        const canSaveBeforeChecked = options.allowBeforeChecked === true;
        const forceSave = options.force === true;
        if (isCloudSyncingRef.current || !currentUser || !db || (!hasCheckedCloudRef.current && !canSaveBeforeChecked)) return false;
        if (!cloudWriteEnabledRef.current && !forceSave) {
            console.warn("☁️ 已登入，但尚未選擇雲端存檔處理方式，暫停自動備份。");
            return false;
        }

        if (saveData.lastSaveTime < lastCloudSyncTimeRef.current) {
            console.warn(`☁️ 擋下過期的存檔！本地 ${saveData.lastSaveTime} < 雲端最新 ${lastCloudSyncTimeRef.current}`);
            return false;
        }

        try {
            const doc = await db.collection(FIRESTORE_COLLECTION).doc(currentUser.uid).get();
            if (doc.exists) {
                const cloudData = doc.data();
                if ((cloudData.saveVersion || 0) > (saveData.saveVersion || 0)) {
                    console.error(`☁️ 擋下覆蓋請求！雲端版本 (${cloudData.saveVersion}) 較新，本地版本 (${saveData.saveVersion}) 較舊。請重新整理網頁以取得最新版本。`);
                    return false;
                }
            }
        } catch (e) {
            console.warn("☁️ 無法預檢雲端版本，將嘗試直接存檔...", e);
        }

        setIsCloudSyncing(true);
        console.log("☁️ Attempting Cloud Save (Project ID: " + db.app.options.projectId + ")...");

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("連線逾時 (請檢查網路或 Firebase Firestore 是否已建立)")), 20000)
            );
            const cleanData = JSON.parse(JSON.stringify({
                ...saveData,
                saveVersion: SAVE_VERSION,
                ownerUid: currentUser.uid
            }));
            const savePromise = db.collection(FIRESTORE_COLLECTION).doc(currentUser.uid).set(cleanData);

            await Promise.race([savePromise, timeoutPromise]);

            setLastCloudSyncTime(saveData.lastSaveTime);
            console.log("☁️ Cloud Save SUCCESS! (UID: " + currentUser.uid + ")");
            return true;
        } catch (e) {
            console.error("☁️ Cloud Save FAILED:", e);
            let specificMsg = e.message;
            if (e.code === 'permission-denied') {
                specificMsg = "存取被拒 (請檢查 Firestore Rules 設定)";
            } else if (e.code === 'not-found') {
                specificMsg = "找不到目標 (請確認 Firestore 已建立資料庫)";
            }

            setAlertMsg(`❌ 雲端同步失敗: ${specificMsg}`);
            updateDialogue(`❌ 備份失敗：${specificMsg}。可檢查控制台 (F12) 的 UID 並確認 Firestore 已建立。`, true);
            return false;
        } finally {
            setIsCloudSyncing(false);
        }
    }, [setAlertMsg, updateDialogue]);

    const buildCloudPrompt = useCallback((type, cloudData, localData) => {
        const cloudTime = cloudData?.lastSaveTime || 0;
        const localTime = localData?.lastSaveTime || 0;
        const hasLocalData = !!localData;

        if (type === 'cloud_available') {
            return {
                type,
                selectedIndex: 0,
                cloudTime,
                localTime,
                options: [
                    { id: 'import', label: '匯入雲端進度' },
                    ...(hasLocalData ? [{ id: 'local', label: '用本機覆蓋雲端' }] : []),
                    { id: 'later', label: '稍後決定' }
                ]
            };
        }

        return {
            type,
            selectedIndex: 0,
            cloudTime: 0,
            localTime,
            options: [
                ...(hasLocalData ? [{ id: 'local', label: '建立雲端備份' }] : []),
                { id: 'later', label: '稍後決定' }
            ]
        };
    }, []);

    const setCloudPrompt = useCallback((prompt) => {
        setCloudChoicePrompt(prompt);
        if (prompt?.type === 'cloud_available') {
            updateDialogue("☁️ 發現雲端進度，請選擇是否匯入。", true);
        } else if (prompt?.type === 'no_cloud') {
            updateDialogue("☁️ 此帳號尚無雲端備份。", true);
        }
    }, [updateDialogue]);

    const selectCloudChoice = useCallback((direction = 1) => {
        setCloudChoicePrompt(prev => {
            if (!prev?.options?.length) return prev;
            return {
                ...prev,
                selectedIndex: (prev.selectedIndex + direction + prev.options.length) % prev.options.length
            };
        });
    }, []);

    const dismissCloudChoice = useCallback(() => {
        setCloudChoicePrompt(null);
        setCloudWriteEnabled(false);
        updateDialogue("☁️ 已保留本機進度，暫停雲端自動備份。", false);
    }, [updateDialogue]);

    const confirmCloudChoice = useCallback(async () => {
        const prompt = cloudChoicePrompt;
        const choice = prompt?.options?.[prompt.selectedIndex];
        const currentUser = userRef.current;
        if (!prompt || !choice || !currentUser) return;

        if (choice.id === 'later') {
            dismissCloudChoice();
            return;
        }

        if (choice.id === 'import') {
            const cloudData = pendingCloudDataRef.current;
            if (!cloudData) {
                updateDialogue("☁️ 找不到可匯入的雲端進度，請重新登入再試。", true);
                return;
            }
            updateDialogue("☁️ 正在匯入雲端進度...", true);
            persistSaveData(JSON.stringify(cloudData));
            markCloudLoaded(currentUser.uid, cloudData.lastSaveTime || 0);
            setCloudWriteEnabled(true);
            setCloudChoicePrompt(null);
            setHasCheckedCloud(true);
            setLastCloudSyncTime(cloudData.lastSaveTime || 0);
            try {
                sessionStorage.setItem('pixel_monster_skip_boot_once', '1');
            } catch (e) { }
            setTimeout(() => window.location.reload(), 800);
            return;
        }

        if (choice.id === 'local') {
            const localData = pendingLocalDataRef.current;
            if (!localData) {
                updateDialogue("☁️ 找不到本機進度，無法建立雲端備份。", true);
                return;
            }
            setCloudChoicePrompt(null);
            setHasCheckedCloud(true);
            updateDialogue("☁️ 正在建立本機進度雲端備份...", true);
            const saved = await saveToCloud({
                ...localData,
                saveVersion: SAVE_VERSION,
                ownerUid: currentUser.uid
            }, { allowBeforeChecked: true, force: true });
            if (saved) {
                setCloudWriteEnabled(true);
                markCloudLoaded(currentUser.uid, localData.lastSaveTime || 0);
                updateDialogue("☁️ 已啟用本機進度雲端備份。", false);
            } else {
                setCloudWriteEnabled(false);
            }
        }
    }, [cloudChoicePrompt, dismissCloudChoice, markCloudLoaded, saveToCloud, updateDialogue]);

    const loadFromCloud = useCallback(async (currentUser) => {
        if (!currentUser || !db || cloudLoadInFlightRef.current) return;
        if (hasLoadedCloudThisSession(currentUser.uid)) {
            try {
                const localStr = localStorage.getItem('pixel_monster_save');
                if (localStr) {
                    const localData = JSON.parse(localStr);
                    setHasCheckedCloud(true);
                    setIsCloudLoading(false);
                    setCloudWriteEnabled(true);
                    setLastCloudSyncTime(localData.lastSaveTime || getSessionCloudTime());
                    updateDialogue("☁️ 帳號連線成功，本地進度已是最新", false);
                    return;
                }
            } catch (e) { }
        }
        cloudLoadInFlightRef.current = true;
        updateDialogue("☁️ 正在檢查雲端同步狀態...", true);
        setIsCloudLoading(true);
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("雲端讀取逾時，請確認網路連線後再試一次")), 20000)
            );
            const doc = await Promise.race([
                db.collection(FIRESTORE_COLLECTION).doc(currentUser.uid).get(),
                timeoutPromise
            ]);
            const localStr = localStorage.getItem('pixel_monster_save');
            let localData = localStr ? JSON.parse(localStr) : null;

            if (localData && localData.ownerUid && localData.ownerUid !== currentUser.uid) {
                console.warn(`☁️ 發現跨帳號衝突！本地存檔屬於 ${localData.ownerUid}，但您目前登入的是 ${currentUser.uid}。登入後不自動覆蓋雲端，等待玩家選擇。`);
                localData = null;
            }
            pendingLocalDataRef.current = localData;

            if (doc.exists) {
                const rawCloudData = doc.data();
                const cloudSaveVersion = rawCloudData.saveVersion || 0;
                if (cloudSaveVersion > SAVE_VERSION) {
                    updateDialogue("☁️ 偵測到更新版本的雲端存檔，請重新整理或清除瀏覽器快取以更新遊戲版本。", true);
                    setHasCheckedCloud(true);
                    setIsCloudLoading(false);
                    return;
                }

                const cloudData = {
                    ...rawCloudData,
                    saveVersion: SAVE_VERSION,
                    ownerUid: currentUser.uid
                };
                const cloudTime = cloudData.lastSaveTime || 0;
                const localTime = (localData && localData.lastSaveTime) || 0;

                console.log(`☁️ Sync Check - Cloud: ${new Date(cloudTime).toLocaleString()}, Local: ${new Date(localTime).toLocaleString()}`);
                pendingCloudDataRef.current = cloudData;
                setHasCheckedCloud(true);
                setIsCloudLoading(false);
                setLastCloudSyncTime(cloudTime);
                setCloudWriteEnabled(false);
                setCloudPrompt(buildCloudPrompt('cloud_available', cloudData, localData));
            } else {
                pendingCloudDataRef.current = null;
                updateDialogue("☁️ 第一次連動，尚未建立雲端備份。", false);
                setHasCheckedCloud(true);
                setIsCloudLoading(false);
                setCloudWriteEnabled(false);
                setCloudPrompt(buildCloudPrompt('no_cloud', null, localData));
            }
        } catch (e) {
            console.error("☁️ Cloud Load Error:", e);
            updateDialogue(`雲端讀取錯誤: ${e.message}`, true);
            setHasCheckedCloud(true);
            setIsCloudLoading(false);
            setCloudWriteEnabled(false);
        } finally {
            cloudLoadInFlightRef.current = false;
        }
    }, [buildCloudPrompt, getSessionCloudTime, hasLoadedCloudThisSession, markCloudLoaded, setCloudPrompt, updateDialogue]);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = auth.onAuthStateChanged((u) => {
            userRef.current = u;
            setUser(u);
            if (u && !hasCheckedCloudRef.current) {
                loadFromCloud(u);
            }
        });
        return () => unsubscribe();
    }, [loadFromCloud]);

    const loginWithGoogle = useCallback(async () => {
        if (!auth || !googleProvider) {
            console.error("Firebase not initialized", { auth, googleProvider });
            setAlertMsg("系統尚未啟動: Firebase 初始化失敗。");
            return;
        }

        if (isInAppBrowser) {
            updateDialogue("⚠️ 偵測到 LINE/FB 內部瀏覽器。\nGoogle 不支援在此登入。", true);
            setAlertMsg("請點擊右上角 [...] 並選擇「使用瀏覽器開啟」再登入。");
            playBloop('fail');
            return;
        }

        updateDialogue("⚡ 正在連結 Google 伺服器...", true);
        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Google 登入逾時，請關閉登入視窗後再試一次")), 60000)
            );
            const result = await Promise.race([
                auth.signInWithPopup(googleProvider),
                timeoutPromise
            ]);
            if (result.user) {
                updateDialogue(`🎉 登入成功: ${result.user.displayName}`, false);
                setAlertMsg(`成功連動帳號: ${result.user.displayName}`);
                playBloop('confirm');
                await loadFromCloud(result.user);
            }
        } catch (e) {
            console.error("☁️ Login Error:", e);

            if (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request') {
                updateDialogue("正在切換至重新導向登入模式...", true);
                try {
                    await auth.signInWithRedirect(googleProvider);
                    return;
                } catch (reErr) {
                    console.error("Redirect Error:", reErr);
                }
            }

            let errMsg = e.message;
            if (e.code === 'auth/popup-closed-by-user') errMsg = "登入視窗被關閉了。";
            if (e.code === 'auth/unauthorized-domain') errMsg = "網域尚未授權，請至 Firebase 設定。";

            if (e.message.includes('disallowed_useragent') || e.code?.includes('disallowed-user-agent')) {
                updateDialogue("❌ Google 政策限制：請點擊右上角「...」並選「使用瀏覽器開啟」。", true);
                setAlertMsg("此瀏覽器環境不符合 Google 安全政策。");
            } else {
                updateDialogue(`❌ 登入失敗: ${errMsg}`, true);
                setAlertMsg(`登入失敗: ${errMsg}`);
            }
        }
    }, [loadFromCloud, setAlertMsg, updateDialogue]);

    const logoutGoogle = useCallback(async () => {
        if (!auth) return;
        try {
            await auth.signOut();
            try {
                clearPersistedSaveData();
                sessionStorage.removeItem('pixel_monster_save');
                sessionStorage.removeItem('pixel_monster_cloud_loaded_uid');
                sessionStorage.removeItem('pixel_monster_cloud_loaded_time');
            } catch (e) { }
            setCloudWriteEnabled(false);
            setCloudChoicePrompt(null);
            playBloop('confirm');
            updateDialogue("已退出登入並清除本地快取。");
            setTimeout(() => window.location.reload(), 1000);
        } catch (e) {
            console.error(e);
        }
    }, [updateDialogue]);

    return {
        user,
        isCloudSyncing,
        isCloudLoading,
        hasCheckedCloud,
        cloudWriteEnabled,
        cloudChoicePrompt,
        selectCloudChoice,
        confirmCloudChoice,
        dismissCloudChoice,
        loginWithGoogle,
        logoutGoogle,
        saveToCloud,
    };
};

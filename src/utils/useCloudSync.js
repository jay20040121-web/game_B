import { useCallback, useEffect, useRef, useState } from 'react';

import { playBloop } from './audioSystem';
import { FIRESTORE_COLLECTION } from './envConfig';
import { auth, db, googleProvider } from './firebase';
import { SAVE_VERSION, clearPersistedSaveData, isInAppBrowser, persistSaveData } from './storageSystem';

const IS_DESKTOP_BUILD = import.meta.env.VITE_DESKTOP === '1';

export const useCloudSync = ({ setAlertMsg, updateDialogue }) => {
    const [user, setUser] = useState(null);
    const [isCloudSyncing, setIsCloudSyncing] = useState(false);
    const [isCloudLoading, setIsCloudLoading] = useState(false);
    const [hasCheckedCloud, setHasCheckedCloud] = useState(false);
    const [lastCloudSyncTime, setLastCloudSyncTime] = useState(0);
    const userRef = useRef(null);
    const isCloudSyncingRef = useRef(false);
    const hasCheckedCloudRef = useRef(false);
    const lastCloudSyncTimeRef = useRef(0);
    const cloudLoadInFlightRef = useRef(false);

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
        lastCloudSyncTimeRef.current = lastCloudSyncTime;
    }, [hasCheckedCloud, isCloudSyncing, lastCloudSyncTime, user]);

    const saveToCloud = useCallback(async (saveData, options = {}) => {
        const currentUser = userRef.current;
        const canSaveBeforeChecked = options.allowBeforeChecked === true;
        if (isCloudSyncingRef.current || !currentUser || !db || (!hasCheckedCloudRef.current && !canSaveBeforeChecked)) return;

        if (saveData.lastSaveTime < lastCloudSyncTimeRef.current) {
            console.warn(`☁️ 擋下過期的存檔！本地 ${saveData.lastSaveTime} < 雲端最新 ${lastCloudSyncTimeRef.current}`);
            return;
        }

        try {
            const doc = await db.collection(FIRESTORE_COLLECTION).doc(currentUser.uid).get();
            if (doc.exists) {
                const cloudData = doc.data();
                if ((cloudData.saveVersion || 0) > (saveData.saveVersion || 0)) {
                    console.error(`☁️ 擋下覆蓋請求！雲端版本 (${cloudData.saveVersion}) 較新，本地版本 (${saveData.saveVersion}) 較舊。請重新整理網頁以取得最新版本。`);
                    return;
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
        } finally {
            setIsCloudSyncing(false);
        }
    }, [setAlertMsg, updateDialogue]);

    const loadFromCloud = useCallback(async (currentUser) => {
        if (!currentUser || !db || cloudLoadInFlightRef.current) return;
        if (hasLoadedCloudThisSession(currentUser.uid)) {
            try {
                const localStr = localStorage.getItem('pixel_monster_save');
                if (localStr) {
                    const localData = JSON.parse(localStr);
                    setHasCheckedCloud(true);
                    setIsCloudLoading(false);
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
                console.warn(`☁️ 發現跨帳號衝突！本地存檔屬於 ${localData.ownerUid}，但您目前登入的是 ${currentUser.uid}。將強行以雲端資料為準。`);
                localData = null;
            }

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
                const localHasOwner = !!localData?.ownerUid;
                const localBelongsToCurrentUser = localData?.ownerUid === currentUser.uid || (!IS_DESKTOP_BUILD && localData && !localHasOwner);

                console.log(`☁️ Sync Check - Cloud: ${new Date(cloudTime).toLocaleString()}, Local: ${new Date(localTime).toLocaleString()}`);

                if (!localData || !localBelongsToCurrentUser || (cloudTime > localTime + 2000)) {
                    if (localData && !localBelongsToCurrentUser) {
                        console.warn("☁️ 本地存檔不是目前登入帳號，優先套用雲端資料，避免覆蓋網頁版進度。", {
                            currentUid: currentUser.uid,
                            localOwnerUid: localData.ownerUid || null
                        });
                    }
                    updateDialogue("☁️ 發現雲端進度，同步中...", true);
                    persistSaveData(JSON.stringify(cloudData));
                    markCloudLoaded(currentUser.uid, cloudTime);
                    try {
                        sessionStorage.setItem('pixel_monster_skip_boot_once', '1');
                    } catch (e) { }
                    setHasCheckedCloud(true);
                    setIsCloudLoading(false);
                    setLastCloudSyncTime(cloudTime);
                    setTimeout(() => window.location.reload(), 800);
                } else {
                    updateDialogue(`☁️ 帳號連線成功，本地進度已是最新`, false);
                    markCloudLoaded(currentUser.uid, cloudTime);
                    setHasCheckedCloud(true);
                    setIsCloudLoading(false);
                    setLastCloudSyncTime(cloudTime);
                    saveToCloud({
                        ...localData,
                        saveVersion: SAVE_VERSION,
                        ownerUid: currentUser.uid
                    }, { allowBeforeChecked: true });
                }
            } else {
                updateDialogue("☁️ 第一次連動，正在建立雲端初始備份...", false);
                markCloudLoaded(currentUser.uid, localData?.lastSaveTime || 0);
                setHasCheckedCloud(true);
                setIsCloudLoading(false);
                if (localData) saveToCloud(localData, { allowBeforeChecked: true });
            }
        } catch (e) {
            console.error("☁️ Cloud Load Error:", e);
            updateDialogue(`雲端讀取錯誤: ${e.message}`, true);
            setHasCheckedCloud(true);
            setIsCloudLoading(false);
        } finally {
            cloudLoadInFlightRef.current = false;
        }
    }, [getSessionCloudTime, hasLoadedCloudThisSession, markCloudLoaded, saveToCloud, updateDialogue]);

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
            } catch (e) { }
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
        loginWithGoogle,
        logoutGoogle,
        saveToCloud,
    };
};

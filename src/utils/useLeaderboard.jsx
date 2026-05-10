import { useState, useEffect } from 'react';
import { db } from './firebase';

/**
 * useLeaderboard
 * PvP 排行榜的資料讀取與更新 hook。
 */
export function useLeaderboard({ user, getMonsterId, updateDialogue }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardPage, setLeaderboardPage] = useState(0);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

    const updatePvpStats = async (isWin) => {
        if (!user || !db) return;

        const uid = user.uid;
        const docRef = db.collection('pvp_leaderboard').doc(uid);
        const myId = getMonsterId();
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });

        try {
            await db.runTransaction(async (transaction) => {
                const sfDoc = await transaction.get(docRef);
                let data = sfDoc.exists ? sfDoc.data() : {
                    wins: 0,
                    losses: 0,
                    monsterId: myId,
                    displayName: user.displayName || '未命名訓練家',
                    lastResetDate: todayStr
                };

                if (data.lastResetDate !== todayStr) {
                    data.wins = 0;
                    data.losses = 0;
                    data.lastResetDate = todayStr;
                }

                if (isWin) data.wins += 1;
                else data.losses += 1;

                data.monsterId = myId;
                data.displayName = user.displayName || '未命名訓練家';

                const total = data.wins + data.losses;
                const winRate = data.wins / (total || 1);
                data.score = (data.wins * 10) + (total * 2) + (winRate * 50);
                data.winRate = winRate;
                data.lastUpdated = window.firebase.firestore.FieldValue.serverTimestamp();

                transaction.set(docRef, data, { merge: true });
            });
        } catch (e) {
            console.error('排行榜更新失敗：', e);
        }
    };

    const fetchLeaderboard = async ({ silent = false } = {}) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] 排行榜載入觸發，silent: ${silent}`);

        if (!db) {
            console.error('Firestore (db) 不存在');
            if (!silent) updateDialogue('目前無法讀取 Firebase 排行榜資料。');
            return;
        }

        if (!silent) {
            setIsLeaderboardLoading(true);
            setLeaderboardPage(0);
        }

        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });

        try {
            console.log(`開始讀取今天 (${todayStr}) 的排行榜資料`);
            const snapshot = await db.collection('pvp_leaderboard')
                .where('lastResetDate', '==', todayStr)
                .get();

            let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            list.sort((a, b) => (b.score || 0) - (a.score || 0));
            list = list.slice(0, 50);

            console.log(`成功載入 ${list.length} 筆排行榜資料`);
            setLeaderboard(list);

            if (!silent) {
                setIsLeaderboardOpen(true);
            }
        } catch (e) {
            console.error('Firebase 讀取排行榜失敗：', e);
            if (!silent) updateDialogue('排行榜資料讀取失敗，請稍後再試。');
        } finally {
            if (!silent) setIsLeaderboardLoading(false);
        }
    };

    useEffect(() => {
        window.fetchLeaderboardTest = fetchLeaderboard;
    }, []);

    return {
        leaderboard,
        leaderboardPage,
        setLeaderboardPage,
        isLeaderboardOpen,
        setIsLeaderboardOpen,
        isLeaderboardLoading,
        fetchLeaderboard,
        updatePvpStats,
    };
}

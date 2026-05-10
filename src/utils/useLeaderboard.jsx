import { useState, useEffect } from 'react';
import { db } from './firebase';

const getLeaderboardPeriodKey = () => new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Taipei'
}).slice(0, 7);

const getLeaderboardPeriodPrefix = (value) => {
    if (!value) return '';
    return String(value).slice(0, 7);
};

const getNextLeaderboardPeriodKey = (periodKey) => {
    const [yearStr, monthStr] = String(periodKey).split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    const nextYear = month >= 12 ? year + 1 : year;
    const nextMonth = month >= 12 ? 1 : month + 1;
    return `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
};

const normalizeLeaderboardPeriod = (value) => {
    const text = String(value || '').trim();
    const match = text.match(/^(\d{4})\D?(\d{1,2})/);
    if (!match) return text.slice(0, 7);
    return `${match[1]}-${String(match[2]).padStart(2, '0')}`;
};

const isSameLeaderboardPeriod = (value, periodKey) => {
    return normalizeLeaderboardPeriod(value) === periodKey;
};

/**
 * useLeaderboard
 * PvP 排行榜資料 hook
 */
export function useLeaderboard({ user, getMonsterId, updateDialogue }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [allLeaderboard, setAllLeaderboard] = useState([]);
    const [leaderboardPage, setLeaderboardPage] = useState(0);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

    const updatePvpStats = async (isWin) => {
        if (!user || !db) return;

        const uid = user.uid;
        const docRef = db.collection('pvp_leaderboard').doc(uid);
        const myId = getMonsterId();
        const currentPeriodKey = getLeaderboardPeriodKey();

        try {
            await db.runTransaction(async (transaction) => {
                const sfDoc = await transaction.get(docRef);
                let data = sfDoc.exists ? sfDoc.data() : {
                    wins: 0,
                    losses: 0,
                    monsterId: myId,
                    displayName: user.displayName || '未命名怪獸',
                    lastResetDate: currentPeriodKey
                };

                if (normalizeLeaderboardPeriod(data.lastResetDate) !== currentPeriodKey) {
                    data.wins = 0;
                    data.losses = 0;
                    data.lastResetDate = currentPeriodKey;
                }

                if (isWin) data.wins += 1;
                else data.losses += 1;

                data.monsterId = myId;
                data.displayName = user.displayName || '未命名怪獸';

                const total = data.wins + data.losses;
                const winRate = data.wins / (total || 1);
                data.score = (data.wins * 10) + (total * 2) + (winRate * 50);
                data.winRate = winRate;
                data.lastUpdated = window.firebase.firestore.FieldValue.serverTimestamp();

                transaction.set(docRef, data, { merge: true });
            });
        } catch (e) {
            console.error('排行榜更新失敗', e);
        }
    };

    const fetchLeaderboard = async ({ silent = false } = {}) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] 排行榜載入觸發，silent: ${silent}`);

        if (!db) {
            console.error('Firestore (db) 不可用');
            if (!silent) updateDialogue('目前無法讀取 Firebase 排行榜資料。');
            return;
        }

        if (!silent) {
            setIsLeaderboardLoading(true);
            setLeaderboardPage(0);
        }

        const currentPeriodKey = getLeaderboardPeriodKey();

        try {
            console.log(`開始讀取本月 (${currentPeriodKey}) 的排行榜資料`);
            const snapshot = await db.collection('pvp_leaderboard').get();
            let list = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(item => isSameLeaderboardPeriod(item.lastResetDate, currentPeriodKey));
            list.sort((a, b) => (b.score || 0) - (a.score || 0));
            list = list.slice(0, 50);

            console.log(`載入 ${list.length} 筆排行榜資料`);
            setLeaderboard(list);

            if (!silent) {
                setIsLeaderboardOpen(true);
            }
        } catch (e) {
            console.error('Firebase 排行榜讀取失敗', e);
            if (!silent) updateDialogue('排行榜資料讀取失敗，請稍後再試。');
        } finally {
            if (!silent) setIsLeaderboardLoading(false);
        }
    };

    const fetchAllLeaderboard = async ({ silent = true } = {}) => {
        if (!db) return;

        try {
            const snapshot = await db.collection('pvp_leaderboard').get();
            let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            list.sort((a, b) => (b.score || 0) - (a.score || 0));
            list = list.slice(0, 50);
            setAllLeaderboard(list);
        } catch (e) {
            console.error('Firebase 全量排行榜讀取失敗', e);
            if (!silent) updateDialogue('排行榜資料讀取失敗，請稍後再試。');
        }
    };

    useEffect(() => {
        window.fetchLeaderboardTest = fetchLeaderboard;
    }, []);

    return {
        leaderboard,
        allLeaderboard,
        leaderboardPage,
        setLeaderboardPage,
        isLeaderboardOpen,
        setIsLeaderboardOpen,
        isLeaderboardLoading,
        fetchLeaderboard,
        fetchAllLeaderboard,
        updatePvpStats,
    };
}

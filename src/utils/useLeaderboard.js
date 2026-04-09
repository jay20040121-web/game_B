import { useState, useEffect } from 'react';
import { db } from './firebase';

/**
 * useLeaderboard.js
 * PvP 排行榜系統 Custom Hook。
 * 封裝排行榜相關的 state、讀取、與更新邏輯。
 *
 * @param {object} options
 * @param {object|null} options.user           - Firebase 登入使用者物件
 * @param {function} options.getMonsterId      - 取得當前怪獸 ID 的函式
 * @param {function} options.updateDialogue    - 更新主畫面對話文字的函式
 */
export function useLeaderboard({ user, getMonsterId, updateDialogue }) {
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardPage, setLeaderboardPage] = useState(0);
    const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
    const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false);

    // 更新 PvP 勝負紀錄到 Firestore
    const updatePvpStats = async (isWin) => {
        if (!user || !db) return;
        const uid = user.uid;
        const docRef = db.collection('pvp_leaderboard').doc(uid);
        const myId = getMonsterId();

        // 📅 取得今天的日期字串 (台北時間)
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' }); // "YYYY-MM-DD"

        try {
            await db.runTransaction(async (transaction) => {
                const sfDoc = await transaction.get(docRef);
                let data = sfDoc.exists ? sfDoc.data() : {
                    wins: 0,
                    losses: 0,
                    monsterId: myId,
                    displayName: user.displayName || "未知玩家",
                    lastResetDate: todayStr
                };

                // 🔄 每日重置邏輯：如果日期變了，清空勝負紀錄
                if (data.lastResetDate !== todayStr) {
                    data.wins = 0;
                    data.losses = 0;
                    data.lastResetDate = todayStr;
                }

                if (isWin) data.wins += 1;
                else data.losses += 1;

                data.monsterId = myId;
                data.displayName = user.displayName || "未知玩家";

                const total = data.wins + data.losses;
                const winRate = data.wins / (total || 1);
                // 評分公式：包含勝場權重與勝率加成
                data.score = (data.wins * 10) + (total * 2) + (winRate * 50);
                data.winRate = winRate;
                data.lastUpdated = window.firebase.firestore.FieldValue.serverTimestamp();

                transaction.set(docRef, data, { merge: true });
            });
        } catch (e) {
            console.error("Leaderboard update failed:", e);
        }
    };

    // 讀取今日排行榜
    // 讀取今日排行榜
    const fetchLeaderboard = async ({ silent = false } = {}) => {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] 🚀 Leaderboard fetch triggered (silent: ${silent})`);

        if (!db) {
            console.error("Firestore (db) is missing!");
            if (!silent) updateDialogue("資料庫尚未就緒，請檢查 Firebase 設定...");
            return;
        }

        if (!silent) {
            setIsLeaderboardLoading(true);
            setLeaderboardPage(0);
        }

        // 📅 取得今天的日期字串 (台北時間) 進行過濾
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Taipei' });

        try {
            console.log(`Fetching today's (${todayStr}) players...`);
            // 🔹 採取「客戶端排序」方案：避開 Firebase 複合索引 (Composite Index) 的限制
            // 僅進行日期過濾，不進行多欄位排序，這樣就不需要去控制台建立索引
            const snapshot = await db.collection('pvp_leaderboard')
                .where('lastResetDate', '==', todayStr)
                .get();

            let list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // 在 JavaScript 端進行排序與限制前 50 名
            list.sort((a, b) => (b.score || 0) - (a.score || 0));
            list = list.slice(0, 50);

            console.log(`Success! Found ${list.length} active players today (client-side sorted).`);
            setLeaderboard(list);
            
            if (!silent) {
                setIsLeaderboardOpen(true);
            }
        } catch (e) {
            console.error("Firebase Error:", e);
            if (!silent) updateDialogue("讀取失敗！(通常是需要建立 Firestore 索引，請查看控制台)...");
        } finally {
            if (!silent) setIsLeaderboardLoading(false);
        }
    };

    // 暴露給全域以便測試
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

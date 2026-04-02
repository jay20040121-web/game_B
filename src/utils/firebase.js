// Firebase Initialization (Compat for UMD)
const firebaseConfig = {
    apiKey: "AIzaSyC4dn9ugKWNRGhaMpSiTV40GnuH-cDyvVI",
    authDomain: "gamea-42ecd.firebaseapp.com",
    projectId: "gamea-42ecd",
    storageBucket: "gamea-42ecd.firebasestorage.app",
    messagingSenderId: "68349892976",
    appId: "1:68349892976:web:b0f572af58cfa6bdb397b5",
    measurementId: "G-VJ5K0P6321"
};

// 安全檢查：確保在瀏覽器環境且 firebase 已載入
let auth = null;
let db = null;
let googleProvider = null;

if (typeof window !== "undefined" && window.firebase) {
    if (!window.firebase.apps.length) {
        window.firebase.initializeApp(firebaseConfig);
    }
    auth = window.firebase.auth();
    db = window.firebase.firestore();
    googleProvider = new window.firebase.auth.GoogleAuthProvider();
}

export { auth, db, googleProvider };

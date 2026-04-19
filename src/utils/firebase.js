import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Firebase Initialization (Modular Compat)
const firebaseConfig = {
    apiKey: "AIzaSyC4dn9ugKWNRGhaMpSiTV40GnuH-cDyvVI",
    authDomain: "gamea-42ecd.firebaseapp.com",
    projectId: "gamea-42ecd",
    storageBucket: "gamea-42ecd.firebasestorage.app",
    messagingSenderId: "68349892976",
    appId: "1:68349892976:web:b0f572af58cfa6bdb397b5",
    measurementId: "G-VJ5K0P6321"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// 暴露到全域以便某些舊邏輯存取 (可選)
if (typeof window !== 'undefined') {
    window.firebase = firebase;
}

export { auth, db, googleProvider };

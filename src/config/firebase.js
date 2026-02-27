import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ─── Firebase Config from .env (Vite: import.meta.env.VITE_*) ───
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const appId = import.meta.env.VITE_APP_ID || 'voice-care-diary'

// ─── Initialize Firebase ───
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// ─── Auth Helpers ───
export const signInAnon = () => signInAnonymously(auth)
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

export { app, auth, db, appId }

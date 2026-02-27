import { initializeApp } from 'firebase/app'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// ─── Firebase Config from global variables ───
const firebaseConfig = JSON.parse(window.__firebase_config || '{}')
const appId = window.__app_id || 'voice-care-diary'

// ─── Initialize Firebase ───
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

// ─── Auth Helpers ───
export const signInAnon = () => signInAnonymously(auth)
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback)

export { app, auth, db, appId }

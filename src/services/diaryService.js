import {
    collection,
    doc,
    setDoc,
    addDoc,
    getDocs,
    query,
    where,
    onSnapshot,
    serverTimestamp,
} from 'firebase/firestore'
import { db, appId } from '../config/firebase'

// ─── Collection Paths ───
const getUserProfileRef = (uid) => doc(db, `artifacts/${appId}/users/${uid}/profile/main`)
const getDiariesCollectionRef = () => collection(db, `artifacts/${appId}/public/data/diaries`)
const getUsersCollectionRef = () => collection(db, `artifacts/${appId}/public/data/users`)

// ─── Mock Data ───
export const mockSummaries = [
    {
        transcript: 'วันนี้ปวดหัวตั้งแต่เช้า ปวดตรงขมับทั้งสองข้าง กินยาพาราแล้วดีขึ้นนิดหน่อย',
        summary: 'ปวดศีรษะบริเวณขมับทั้งสองข้าง ตั้งแต่ช่วงเช้า อาการดีขึ้นเล็กน้อยหลังรับประทานยา Paracetamol',
        severity: 'ปานกลาง',
        severityColor: 'orange',
        mood: 'ไม่สบาย',
    },
    {
        transcript: 'เมื่อคืนนอนไม่ค่อยหลับ ตื่นมาเวียนหัว เดินแล้วโซเซ',
        summary: 'นอนไม่หลับช่วงกลางคืน มีอาการเวียนศีรษะและทรงตัวลำบากในตอนเช้า ควรระวังเรื่องการล้ม',
        severity: 'ต้องระวัง',
        severityColor: 'red',
        mood: 'อ่อนเพลีย',
    },
    {
        transcript: 'วันนี้รู้สึกดีขึ้นเยอะ กินข้าวได้ นอนหลับดี',
        summary: 'ผู้ป่วยมีอาการดีขึ้น รับประทานอาหารได้ปกติ พักผ่อนเพียงพอ ไม่มีอาการผิดปกติ',
        severity: 'ปกติ',
        severityColor: 'green',
        mood: 'สดชื่น',
    },
]

// ─── Helpers ───
export const generatePairingCode = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    return code.slice(0, 3) + '-' + code.slice(3)
}

export const formatDiaryEntry = (e) => ({
    id: e.id,
    timestamp: e.createdAt
        ? new Date(e.createdAt).toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' })
        : 'เพิ่งบันทึก',
    transcript: e.originalText || '',
    summary: e.clinicalSummary || '',
    severity: e.severity || 'ปกติ',
    severityColor: e.severityColor || 'green',
    mood: e.mood || '',
    advice: e.advice || '',
})

// ─── localStorage Persistence ───
const PAIRING_CODE_KEY = 'voicecare_pairing_code'
const ROLE_KEY = 'voicecare_role'

export const savePairingCodeToLocal = (code) => {
    localStorage.setItem(PAIRING_CODE_KEY, code)
}

export const loadPairingCodeFromLocal = () => {
    return localStorage.getItem(PAIRING_CODE_KEY) || null
}

export const saveRoleToLocal = (role) => {
    localStorage.setItem(ROLE_KEY, role)
}

export const loadRoleFromLocal = () => {
    return localStorage.getItem(ROLE_KEY) || null
}

// ─── Firestore Operations ───

// Save elderly profile (private + public lookup)
export const saveElderlyProfile = async (uid, profile, pairingCode) => {
    await setDoc(getUserProfileRef(uid), {
        ...profile,
        pairingCode,
        uid,
        createdAt: serverTimestamp(),
    })

    await setDoc(doc(getUsersCollectionRef(), uid), {
        name: profile.name,
        age: profile.age,
        gender: profile.gender,
        diseases: profile.diseases,
        medications: profile.medications,
        pairingCode,
        uid,
        createdAt: serverTimestamp(),
    })
}

// Save a diary entry
export const saveDiaryEntry = async (entry) => {
    await addDoc(getDiariesCollectionRef(), {
        ...entry,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString(),
    })
}

// Query elderly profile by pairing code
export const queryElderlyByPairingCode = async (pairingCode) => {
    const q = query(getUsersCollectionRef(), where('pairingCode', '==', pairingCode))
    const snapshot = await getDocs(q)
    if (snapshot.empty) return null
    return snapshot.docs[0].data()
}

// Sort helper (RULE 2: sort in JS memory, no orderBy)
const sortByTimestamp = (entries) => {
    entries.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || new Date(a.createdAt).getTime()
        const timeB = b.timestamp?.toMillis?.() || new Date(b.createdAt).getTime()
        return timeB - timeA
    })
    return entries
}

// Subscribe to diary entries by pairing code (real-time)
export const subscribeToDiaries = (pairingCode, callback, onError) => {
    const q = query(getDiariesCollectionRef(), where('pairingCode', '==', pairingCode))
    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        callback(sortByTimestamp(entries))
    }, onError || ((err) => console.error('Firestore listener error:', err)))
}

// Subscribe to diary entries by elderly UID
export const subscribeToDiariesByUid = (elderlyId, callback, onError) => {
    const q = query(getDiariesCollectionRef(), where('elderlyId', '==', elderlyId))
    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(d => ({ id: d.id, ...d.data() }))
        callback(sortByTimestamp(entries))
    }, onError || ((err) => console.error('Firestore listener error:', err)))
}

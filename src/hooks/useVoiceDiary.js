import { useState, useEffect, useCallback, useRef } from 'react'
import { signInAnon, onAuthChange } from '../config/firebase'
import {
    generatePairingCode,
    formatDiaryEntry,
    saveElderlyProfile,
    saveDiaryEntry,
    queryElderlyByPairingCode,
    queryElderlyByPhone,
    subscribeToDiaries,
    subscribeToDiariesByUid,
    savePairingCodeToLocal,
    loadPairingCodeFromLocal,
    saveRoleToLocal,
    loadRoleFromLocal,
    loadProfileFromLocal,
} from '../services/diaryService'
import { analyzeAudio } from '../services/geminiService'
import useAudioRecorder from './useAudioRecorder'

export default function useVoiceDiary() {
    // ─── Firebase Auth State ───
    const [user, setUser] = useState(null)
    const [authReady, setAuthReady] = useState(false)

    // ─── Global State ───
    const [currentView, setCurrentView] = useState('ROLE_SELECTION')
    const [role, setRole] = useState(null)
    const [isSyncing, setIsSyncing] = useState(false)

    // Elderly state
    const [onboardingStep, setOnboardingStep] = useState(1)
    const [elderlyProfile, setElderlyProfile] = useState({
        name: '', age: '', gender: '', phone: '', diseases: '', medications: ''
    })
    const [pairingCode, setPairingCode] = useState(() => {
        return loadPairingCodeFromLocal() || generatePairingCode()
    })
    const [entries, setEntries] = useState([])

    // Recording state
    const [recordingTime, setRecordingTime] = useState(0)
    const [isRecording, setIsRecording] = useState(false)

    // AI state
    const [aiResult, setAiResult] = useState(null)
    const [isProcessingAI, setIsProcessingAI] = useState(false)

    // Relative state
    const [inputCode, setInputCode] = useState('')
    const [linkedProfile, setLinkedProfile] = useState(null)
    const [linkedPairingCode, setLinkedPairingCode] = useState(null)

    // Recovery state
    const [recoveryPhone, setRecoveryPhone] = useState('')

    // Refs
    const unsubRef = useRef(null)

    // Audio Recorder (MediaRecorder → base64 → Gemini multimodal)
    const audioRecorder = useAudioRecorder()

    // ═══════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════

    // Firebase Auth
    useEffect(() => {
        const unsubAuth = onAuthChange((firebaseUser) => {
            setUser(firebaseUser)
            setAuthReady(true)
        })
        signInAnon().catch((err) => {
            console.error('Auth error:', err)
            setAuthReady(true)
        })
        return () => unsubAuth()
    }, [])

    // Elderly: Listen for own diary entries (by pairingCode for persistence)
    useEffect(() => {
        if (role !== 'elderly' || !pairingCode) return
        if (currentView !== 'ELDERLY_DASHBOARD') return
        const unsub = subscribeToDiaries(pairingCode, (firestoreEntries) => {
            setEntries(firestoreEntries.map(formatDiaryEntry))
        })
        return () => unsub()
    }, [pairingCode, role, currentView])

    // Relative: Listen for linked diary entries
    useEffect(() => {
        if (!user || role !== 'relative' || !linkedPairingCode) return
        if (currentView !== 'RELATIVE_DASHBOARD') return
        const unsub = subscribeToDiaries(linkedPairingCode, (firestoreEntries) => {
            setEntries(firestoreEntries.map(formatDiaryEntry))
        })
        unsubRef.current = unsub
        return () => unsub()
    }, [user, role, linkedPairingCode, currentView])

    // Recording timer
    useEffect(() => {
        let interval
        if (isRecording) {
            interval = setInterval(() => setRecordingTime(t => t + 1), 1000)
        }
        return () => clearInterval(interval)
    }, [isRecording])

    // Auto-restore profile from localStorage on mount
    useEffect(() => {
        const savedRole = loadRoleFromLocal()
        const savedCode = loadPairingCodeFromLocal()
        const savedProfile = loadProfileFromLocal()
        if (savedRole === 'elderly' && savedCode && savedProfile) {
            setRole('elderly')
            setPairingCode(savedCode)
            setElderlyProfile(p => ({
                ...p,
                name: savedProfile.name || '',
                age: savedProfile.age || '',
                gender: savedProfile.gender || '',
                phone: savedProfile.phone || '',
                diseases: savedProfile.diseases || '',
                medications: savedProfile.medications || '',
            }))
            setCurrentView('ELDERLY_DASHBOARD')
        }
    }, [])

    // ═══════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════

    const navigateTo = useCallback((view) => {
        setCurrentView(view)
        window.scrollTo(0, 0)
    }, [])

    // ═══════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════

    const handleRoleSelect = (r) => {
        setRole(r)
        if (r === 'elderly') navigateTo('ELDERLY_ONBOARDING')
        else if (r === 'recovery') navigateTo('ELDERLY_RECOVERY')
        else navigateTo('RELATIVE_LINKING')
    }

    const handleOnboardingNext = async () => {
        if (onboardingStep < 6) {
            setOnboardingStep(s => s + 1)
        } else {
            if (user) {
                setIsSyncing(true)
                try {
                    await saveElderlyProfile(user.uid, elderlyProfile, pairingCode)
                    // Persist to localStorage for session recovery
                    savePairingCodeToLocal(pairingCode)
                    saveRoleToLocal('elderly')
                } catch (err) {
                    console.error('Error saving profile:', err)
                }
                setIsSyncing(false)
            }
            navigateTo('ELDERLY_DASHBOARD')
        }
    }

    const handleOnboardingBack = () => {
        if (onboardingStep > 1) setOnboardingStep(s => s - 1)
        else navigateTo('ROLE_SELECTION')
    }

    // ─── Recording Flow (Multimodal Audio → Gemini) ───

    const handleStartRecording = async () => {
        setRecordingTime(0)
        setIsRecording(true)
        setAiResult(null)
        navigateTo('ELDERLY_RECORDING')

        // Start audio recording with onStop callback
        const started = await audioRecorder.start(async (base64Audio, mimeType) => {
            // Recording ended
            setIsRecording(false)

            if (!base64Audio) {
                // No audio captured
                navigateTo('ELDERLY_DASHBOARD')
                return
            }

            navigateTo('ELDERLY_PROCESSING')
            setIsProcessingAI(true)

            let result
            try {
                // Send raw audio to Gemini multimodal API
                result = await analyzeAudio(base64Audio, mimeType)
            } catch (err) {
                console.error('AI analysis failed:', err)
                result = {
                    original_dialect: 'ไม่สามารถวิเคราะห์ได้',
                    clinical_summary: 'ไม่สามารถวิเคราะห์ได้',
                    severity: 'ปกติ',
                    severityColor: 'green',
                    mood: 'ไม่ระบุ',
                    advice: 'กรุณาปรึกษาแพทย์',
                    transcript: '',
                }
            }

            setAiResult(result)

            // Auto-save to Firestore immediately (ป้องกันการปกปิดอาการจากญาติ)
            if (user) {
                try {
                    await saveDiaryEntry({
                        elderlyId: user.uid,
                        pairingCode,
                        originalText: result.original_dialect || result.transcript,
                        clinicalSummary: result.clinical_summary,
                        severity: result.severity,
                        severityColor: result.severityColor,
                        mood: result.mood,
                        advice: result.advice,
                    })
                } catch (err) {
                    console.error('Error auto-saving diary entry:', err)
                }
            }

            setIsProcessingAI(false)
            navigateTo('ELDERLY_RESULT')
        })

        if (!started) {
            // Microphone access denied or unavailable
            setIsRecording(false)
            navigateTo('ELDERLY_DASHBOARD')
        }
    }

    const handleStopRecording = () => {
        audioRecorder.stop()
    }

    const handleCancelRecording = () => {
        audioRecorder.stop()
        setIsRecording(false)
        navigateTo('ELDERLY_DASHBOARD')
    }


    // ─── Recovery Login ───

    const handleRecoveryLogin = async () => {
        const cleaned = recoveryPhone.replace(/[^0-9]/g, '')
        if (cleaned.length < 9) {
            alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง')
            return
        }
        setIsSyncing(true)
        try {
            const profile = await queryElderlyByPhone(cleaned)
            if (profile) {
                const code = profile.pairingCode || generatePairingCode()
                setElderlyProfile({
                    name: profile.name || '',
                    age: profile.age || '',
                    gender: profile.gender || '',
                    phone: profile.phone || cleaned,
                    diseases: profile.diseases || '',
                    medications: profile.medications || '',
                })
                setPairingCode(code)
                setRole('elderly')
                // Persist for session recovery
                savePairingCodeToLocal(code)
                saveRoleToLocal('elderly')
                navigateTo('ELDERLY_DASHBOARD')
            } else {
                alert('ไม่พบเบอร์โทรนี้ในระบบ กรุณาตรวจสอบหรือลงทะเบียนใหม่')
            }
        } catch (err) {
            console.error('Recovery error:', err)
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
        }
        setIsSyncing(false)
    }

    // ─── Relative Handlers ───

    const handleKeypadPress = (digit) => {
        if (inputCode.length < 6) {
            const newCode = inputCode + digit
            setInputCode(newCode)
            if (newCode.length === 6) {
                setTimeout(() => handleLinkWithCode(newCode), 300)
            }
        }
    }

    const handleKeypadDelete = () => {
        setInputCode(prev => prev.slice(0, -1))
    }

    const handleLinkWithCode = async (code) => {
        if (!user) return
        const codeToUse = code || inputCode
        if (codeToUse.length < 6) return
        const formatted = codeToUse.slice(0, 3) + '-' + codeToUse.slice(3)
        setIsSyncing(true)
        try {
            const profile = await queryElderlyByPairingCode(formatted)
            if (profile) {
                setLinkedProfile(profile)
                setLinkedPairingCode(formatted)
                navigateTo('RELATIVE_CONNECTION_SUCCESS')
            } else {
                alert('ไม่พบรหัสนี้ในระบบ กรุณาตรวจสอบรหัสอีกครั้ง')
                setInputCode('')
            }
        } catch (err) {
            console.error('Error linking:', err)
            alert('เกิดข้อผิดพลาด กรุณาลองใหม่')
            setInputCode('')
        }
        setIsSyncing(false)
    }

    const handleLink = () => handleLinkWithCode(inputCode)

    // ═══════════════════════════════════
    // UTILS
    // ═══════════════════════════════════

    const formatTime = (s) => {
        const m = Math.floor(s / 60).toString().padStart(2, '0')
        const sec = (s % 60).toString().padStart(2, '0')
        return `${m}:${sec}`
    }

    // ═══════════════════════════════════
    // RETURN
    // ═══════════════════════════════════

    return {
        // Auth
        user, authReady,
        // Navigation
        currentView, navigateTo,
        // Role
        role, handleRoleSelect,
        // Syncing
        isSyncing,
        // Elderly - onboarding
        onboardingStep, elderlyProfile, setElderlyProfile,
        handleOnboardingNext, handleOnboardingBack,
        // Elderly - dashboard
        pairingCode, entries,
        // Elderly - recording (multimodal audio)
        isRecording, recordingTime, formatTime,
        handleStartRecording, handleStopRecording, handleCancelRecording,
        // Audio recorder error
        audioError: audioRecorder.error,
        // AI result
        aiResult, isProcessingAI,
        // Recovery
        recoveryPhone, setRecoveryPhone, handleRecoveryLogin,
        // Relative
        inputCode, linkedProfile, linkedPairingCode,
        handleKeypadPress, handleKeypadDelete, handleLink,
    }
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { signInAnon, onAuthChange } from '../config/firebase'
import {
    generatePairingCode,
    formatDiaryEntry,
    saveElderlyProfile,
    saveDiaryEntry,
    queryElderlyByPairingCode,
    subscribeToDiaries,
    subscribeToDiariesByUid,
} from '../services/diaryService'
import { analyzeSymptoms } from '../services/geminiService'
import useSpeechRecognition from './useSpeechRecognition'

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
        name: '', age: '', gender: '', diseases: '', medications: ''
    })
    const [pairingCode, setPairingCode] = useState(() => generatePairingCode())
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

    // Refs
    const unsubRef = useRef(null)

    // Speech Recognition
    const speech = useSpeechRecognition()

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

    // Elderly: Listen for own diary entries
    useEffect(() => {
        if (!user || role !== 'elderly' || currentView !== 'ELDERLY_DASHBOARD') return
        const unsub = subscribeToDiariesByUid(user.uid, (firestoreEntries) => {
            setEntries(firestoreEntries.map(formatDiaryEntry))
        })
        return () => unsub()
    }, [user, role, currentView])

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
        else navigateTo('RELATIVE_LINKING')
    }

    const handleOnboardingNext = async () => {
        if (onboardingStep < 5) {
            setOnboardingStep(s => s + 1)
        } else {
            if (user) {
                setIsSyncing(true)
                try {
                    await saveElderlyProfile(user.uid, elderlyProfile, pairingCode)
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

    // ─── Recording Flow (Real STT + AI) ───

    const handleStartRecording = () => {
        setRecordingTime(0)
        setIsRecording(true)
        setAiResult(null)
        navigateTo('ELDERLY_RECORDING')

        // Start speech recognition with onStop callback
        const started = speech.start(async (finalTranscript) => {
            // Speech recognition ended (silence or manual stop)
            setIsRecording(false)
            navigateTo('ELDERLY_PROCESSING')
            setIsProcessingAI(true)

            let result
            try {
                // Send transcript to Gemini AI
                result = await analyzeSymptoms(finalTranscript)
            } catch (err) {
                console.error('AI analysis failed:', err)
                result = {
                    original_dialect: finalTranscript,
                    clinical_summary: finalTranscript || 'ไม่สามารถวิเคราะห์ได้',
                    severity: 'ปกติ',
                    severityColor: 'green',
                    mood: 'ไม่ระบุ',
                    advice: 'กรุณาปรึกษาแพทย์',
                    transcript: finalTranscript,
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
            // Browser doesn't support speech recognition
            setIsRecording(false)
            navigateTo('ELDERLY_DASHBOARD')
        }
    }

    const handleStopRecording = () => {
        // Manually stop speech recognition — the onStop callback handles the rest
        speech.stop()
    }

    const handleCancelRecording = () => {
        speech.stop()
        setIsRecording(false)
        navigateTo('ELDERLY_DASHBOARD')
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
        // Elderly - recording (real STT)
        isRecording, recordingTime, formatTime,
        handleStartRecording, handleStopRecording, handleCancelRecording,
        // Speech recognition state
        transcript: speech.transcript,
        interimTranscript: speech.interimTranscript,
        speechError: speech.error,
        // AI result
        aiResult, isProcessingAI,
        // Relative
        inputCode, linkedProfile, linkedPairingCode,
        handleKeypadPress, handleKeypadDelete, handleLink,
    }
}

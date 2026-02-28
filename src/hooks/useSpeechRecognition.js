import { useState, useRef, useCallback } from 'react'

// ─── Web Speech API Hook ───
// Wraps webkitSpeechRecognition for Thai speech-to-text with auto-stop on silence

export default function useSpeechRecognition() {
    const [transcript, setTranscript] = useState('')
    const [interimTranscript, setInterimTranscript] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [error, setError] = useState(null)

    const recognitionRef = useRef(null)
    const silenceTimerRef = useRef(null)
    const onStopCallbackRef = useRef(null)

    const SILENCE_TIMEOUT = 5000 // Auto-stop after 5s of silence

    const resetSilenceTimer = useCallback(() => {
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
        }
        silenceTimerRef.current = setTimeout(() => {
            // Auto-stop after silence
            if (recognitionRef.current && isListening) {
                recognitionRef.current.stop()
            }
        }, SILENCE_TIMEOUT)
    }, [isListening])

    const start = useCallback((onStop) => {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        if (!SpeechRecognition) {
            setError('เบราว์เซอร์ไม่รองรับการรับรู้เสียง กรุณาใช้ Chrome')
            return false
        }

        // Reset state
        setTranscript('')
        setInterimTranscript('')
        setError(null)
        onStopCallbackRef.current = onStop

        // Create recognition instance
        const recognition = new SpeechRecognition()
        recognition.lang = 'th-TH'
        recognition.continuous = true
        recognition.interimResults = true
        recognition.maxAlternatives = 1

        recognition.onstart = () => {
            setIsListening(true)
            resetSilenceTimer()
        }

        recognition.onresult = (event) => {
            let finalText = ''
            let interimText = ''

            for (let i = 0; i < event.results.length; i++) {
                const result = event.results[i]
                if (result.isFinal) {
                    finalText += result[0].transcript
                } else {
                    interimText += result[0].transcript
                }
            }

            if (finalText) {
                setTranscript(finalText)
            }
            setInterimTranscript(interimText)

            // Reset silence timer on any speech activity
            resetSilenceTimer()
        }

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error)
            // Don't treat "no-speech" as a fatal error
            if (event.error === 'no-speech') {
                setError('ไม่ได้ยินเสียงพูด กรุณาลองใหม่')
            } else if (event.error === 'not-allowed') {
                setError('ไม่ได้รับอนุญาตใช้ไมโครโฟน กรุณาอนุญาตในเบราว์เซอร์')
            } else if (event.error !== 'aborted') {
                setError(`เกิดข้อผิดพลาด: ${event.error}`)
            }
        }

        recognition.onend = () => {
            setIsListening(false)
            if (silenceTimerRef.current) {
                clearTimeout(silenceTimerRef.current)
            }
            // Call the onStop callback with final transcript
            if (onStopCallbackRef.current) {
                // Use the latest transcript from state ref
                setTranscript(prev => {
                    onStopCallbackRef.current(prev)
                    return prev
                })
            }
        }

        recognitionRef.current = recognition

        try {
            recognition.start()
            return true
        } catch (err) {
            console.error('Failed to start recognition:', err)
            setError('ไม่สามารถเริ่มการรับรู้เสียงได้')
            return false
        }
    }, [resetSilenceTimer])

    const stop = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
        }
        if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
        }
    }, [])

    return {
        transcript,
        interimTranscript,
        isListening,
        error,
        start,
        stop,
    }
}

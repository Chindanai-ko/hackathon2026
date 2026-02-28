import { useState, useRef, useCallback } from 'react'

// ─── Audio Recorder Hook ───
// Uses MediaRecorder API to capture raw audio as a Blob → base64
// for direct multimodal Gemini processing (bypasses browser STT)

export default function useAudioRecorder() {
    const [isRecording, setIsRecording] = useState(false)
    const [error, setError] = useState(null)

    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])
    const streamRef = useRef(null)
    const onStopCallbackRef = useRef(null)

    // Convert Blob to base64 string
    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onloadend = () => {
                // Remove the data:audio/webm;base64, prefix
                const base64 = reader.result.split(',')[1]
                resolve(base64)
            }
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    }

    const start = useCallback(async (onStop) => {
        setError(null)
        onStopCallbackRef.current = onStop
        audioChunksRef.current = []

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm'
            })

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = async () => {
                // Stop all tracks
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop())
                    streamRef.current = null
                }

                setIsRecording(false)

                // Convert chunks to a single Blob then to base64
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

                if (audioBlob.size === 0) {
                    setError('ไม่มีข้อมูลเสียง กรุณาลองใหม่')
                    if (onStopCallbackRef.current) {
                        onStopCallbackRef.current(null, null)
                    }
                    return
                }

                try {
                    const base64Audio = await blobToBase64(audioBlob)
                    if (onStopCallbackRef.current) {
                        onStopCallbackRef.current(base64Audio, 'audio/webm')
                    }
                } catch (err) {
                    console.error('Failed to convert audio to base64:', err)
                    setError('เกิดข้อผิดพลาดในการแปลงเสียง')
                    if (onStopCallbackRef.current) {
                        onStopCallbackRef.current(null, null)
                    }
                }
            }

            mediaRecorderRef.current = mediaRecorder
            mediaRecorder.start(1000) // Collect data every second
            setIsRecording(true)
            return true
        } catch (err) {
            console.error('Failed to access microphone:', err)
            if (err.name === 'NotAllowedError') {
                setError('ไม่ได้รับอนุญาตใช้ไมโครโฟน กรุณาอนุญาตในเบราว์เซอร์')
            } else {
                setError('ไม่สามารถเข้าถึงไมโครโฟนได้')
            }
            return false
        }
    }, [])

    const stop = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop()
        }
    }, [])

    return {
        isRecording,
        error,
        start,
        stop,
    }
}

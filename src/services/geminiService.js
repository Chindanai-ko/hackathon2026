// ─── Gemini AI Service (Multimodal Audio) ───
// Sends raw audio directly to Gemini for dialect-aware medical analysis

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

const AUDIO_SYSTEM_PROMPT = `คุณคือแพทย์ผู้เชี่ยวชาญที่เข้าใจภาษาถิ่นไทยอย่างลึกซึ้ง
(เช่น อีสาน: "เถิกขี้เข็บตอด" = "ถูกตะขาบต่อย", "บ่สบาย" = "ไม่สบาย", เหนือ: "จ๊ะงาย" = "สบายดี")

จงฟังเสียงผู้ป่วยสูงอายุ แล้วสรุปอาการเป็น JSON:

{
  "dialect_transcript": "ถอดคำพูดต้นฉบับ (ภาษาถิ่นหรือไทยกลาง)",
  "clinical_summary": "สรุปอาการทางการแพทย์เป็นภาษาไทยกลาง",
  "severity": "Low|Medium|High",
  "mood": "อารมณ์/ความรู้สึก เช่น กังวล, เหนื่อย, สดชื่น",
  "advice": "คำแนะนำสำหรับผู้ป่วยและผู้ดูแล"
}

ตอบเป็น JSON เท่านั้น ห้ามใส่ markdown หรือ code block`

// Severity mapping
const severityMap = {
    'Low': { label: 'ปกติ', color: 'green' },
    'Medium': { label: 'ปานกลาง', color: 'orange' },
    'High': { label: 'ต้องระวัง', color: 'red' },
}

// Exponential backoff helper
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

async function fetchWithRetry(url, options, maxRetries = 3) {
    let lastError
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options)
            if (response.ok) return response
            if (response.status === 429 || response.status >= 500) {
                const waitTime = Math.pow(2, attempt) * 1000
                console.warn(`Gemini API attempt ${attempt + 1} failed (${response.status}), retrying in ${waitTime}ms...`)
                await sleep(waitTime)
                lastError = new Error(`HTTP ${response.status}`)
                continue
            }
            const errorData = await response.json().catch(() => ({}))
            throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`)
        } catch (err) {
            if (err.message.startsWith('Gemini API error:')) throw err
            lastError = err
            if (attempt < maxRetries - 1) {
                const waitTime = Math.pow(2, attempt) * 1000
                console.warn(`Gemini API attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`, err.message)
                await sleep(waitTime)
            }
        }
    }
    throw lastError || new Error('Gemini API failed after retries')
}

// Parse JSON from Gemini response
function parseGeminiJSON(text) {
    let cleaned = text.trim()
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    try {
        return JSON.parse(cleaned)
    } catch (e) {
        // Repair truncated JSON: close open strings and braces
        let repaired = cleaned
        let inStr = false, esc = false
        for (const ch of repaired) {
            if (esc) { esc = false; continue }
            if (ch === '\\') { esc = true; continue }
            if (ch === '"') inStr = !inStr
        }
        if (inStr) repaired += '"'
        const opens = (repaired.match(/{/g) || []).length
        const closes = (repaired.match(/}/g) || []).length
        for (let i = 0; i < opens - closes; i++) repaired += '}'

        try {
            return JSON.parse(repaired)
        } catch {
            // Last resort: extract fields via regex
            const get = (k) => {
                const m = cleaned.match(new RegExp(`"${k}"\\s*:\\s*"([^"]*?)"`))
                return m ? m[1] : null
            }
            return {
                dialect_transcript: get('dialect_transcript') || get('original_dialect') || '',
                clinical_summary: get('clinical_summary') || '',
                severity: get('severity') || 'Low',
                mood: get('mood') || '',
                advice: get('advice') || '',
            }
        }
    }
}

// ═══════════════════════════════════════
// MAIN: Multimodal Audio Analysis
// ═══════════════════════════════════════
export async function analyzeAudio(base64Audio, mimeType = 'audio/webm') {
    if (!GEMINI_API_KEY) {
        console.warn('No Gemini API key configured, using fallback')
        return createFallbackResult('(ไม่มี API key)')
    }

    if (!base64Audio) {
        return createFallbackResult('ไม่สามารถรับเสียงได้')
    }

    try {
        const response = await fetchWithRetry(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: AUDIO_SYSTEM_PROMPT },
                        {
                            inlineData: {
                                mimeType,
                                data: base64Audio,
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 4096,
                    responseMimeType: 'application/json',
                }
            })
        })

        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            console.warn('Empty Gemini response, using fallback')
            return createFallbackResult('ไม่สามารถวิเคราะห์เสียงได้')
        }

        const parsed = parseGeminiJSON(text)
        const severity = severityMap[parsed.severity] || severityMap['Low']

        return {
            original_dialect: parsed.dialect_transcript || parsed.original_dialect || 'ไม่สามารถถอดเสียงได้',
            clinical_summary: parsed.clinical_summary || 'ไม่สามารถสรุปอาการได้',
            severity: severity.label,
            severityColor: severity.color,
            mood: parsed.mood || 'ไม่ระบุ',
            advice: parsed.advice || 'กรุณาปรึกษาแพทย์หากอาการไม่ดีขึ้น',
            transcript: parsed.dialect_transcript || '',
        }
    } catch (err) {
        console.error('Gemini multimodal analysis failed:', err)
        return createFallbackResult('การวิเคราะห์ล้มเหลว')
    }
}

// Legacy text-only analysis (kept for compatibility)
export async function analyzeSymptoms(transcript) {
    if (!GEMINI_API_KEY || !transcript) {
        return createFallbackResult(transcript || '')
    }
    // Redirect to a simple text prompt
    try {
        const response = await fetchWithRetry(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${AUDIO_SYSTEM_PROMPT}\n\nผู้ป่วยพูดว่า: "${transcript}"` }]
                }],
                generationConfig: { temperature: 0.3, maxOutputTokens: 1024, responseMimeType: 'application/json' }
            })
        })
        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
        if (!text) return createFallbackResult(transcript)
        const parsed = parseGeminiJSON(text)
        const severity = severityMap[parsed.severity] || severityMap['Low']
        return {
            original_dialect: parsed.dialect_transcript || transcript,
            clinical_summary: parsed.clinical_summary || transcript,
            severity: severity.label, severityColor: severity.color,
            mood: parsed.mood || 'ไม่ระบุ',
            advice: parsed.advice || 'กรุณาปรึกษาแพทย์',
            transcript,
        }
    } catch (err) {
        return createFallbackResult(transcript)
    }
}

// Fallback
function createFallbackResult(transcript) {
    return {
        original_dialect: transcript,
        clinical_summary: transcript || 'ไม่สามารถวิเคราะห์อาการได้',
        severity: 'ปกติ',
        severityColor: 'green',
        mood: 'ไม่ระบุ',
        advice: 'กรุณาปรึกษาแพทย์หากมีอาการผิดปกติ',
        transcript,
    }
}

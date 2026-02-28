// ─── Gemini AI Service ───
// Analyzes Thai symptom transcripts using Gemini API

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || ''
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

const SYSTEM_PROMPT = `You are a Medical Assistant in Thailand. Your job is to analyze health symptom descriptions from elderly patients.

IMPORTANT RULES:
1. The input may be in Thai dialects (Isan/อีสาน, Northern/ล้านนา, Southern/ใต้) or Standard Thai.
2. Translate any dialect terms into Standard Thai medical terminology.
3. Provide a clinical summary, severity assessment, and practical advice.
4. Always respond in Thai language.
5. Format your response as valid JSON only, no markdown, no code blocks.

Response JSON format:
{
  "original_dialect": "คำพูดต้นฉบับของผู้ป่วย",
  "clinical_summary": "สรุปอาการทางการแพทย์เป็นภาษาไทยกลาง",
  "severity": "Low|Medium|High",
  "mood": "อารมณ์/ความรู้สึกของผู้ป่วย เช่น กังวล, เหนื่อย, สดชื่น",
  "advice": "คำแนะนำสำหรับผู้ป่วยและผู้ดูแล"
}`

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
            // If rate limited (429) or server error (5xx), retry
            if (response.status === 429 || response.status >= 500) {
                const waitTime = Math.pow(2, attempt) * 1000 // 1s, 2s, 4s
                console.warn(`Gemini API attempt ${attempt + 1} failed (${response.status}), retrying in ${waitTime}ms...`)
                await sleep(waitTime)
                lastError = new Error(`HTTP ${response.status}`)
                continue
            }
            // Other errors: don't retry
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

// Parse JSON from Gemini response (handles markdown code blocks)
function parseGeminiJSON(text) {
    // Remove markdown code blocks if present
    let cleaned = text.trim()
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }
    return JSON.parse(cleaned)
}

// Main analysis function
export async function analyzeSymptoms(transcript) {
    if (!GEMINI_API_KEY) {
        console.warn('No Gemini API key configured, using fallback')
        return createFallbackResult(transcript)
    }

    if (!transcript || transcript.trim().length === 0) {
        return createFallbackResult('ไม่สามารถรับรู้เสียงได้')
    }

    try {
        const response = await fetchWithRetry(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${SYSTEM_PROMPT}\n\nผู้ป่วยพูดว่า: "${transcript}"`
                    }]
                }],
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 1024,
                }
            })
        })

        const data = await response.json()
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

        if (!text) {
            console.warn('Empty Gemini response, using fallback')
            return createFallbackResult(transcript)
        }

        const parsed = parseGeminiJSON(text)
        const severity = severityMap[parsed.severity] || severityMap['Low']

        return {
            original_dialect: parsed.original_dialect || transcript,
            clinical_summary: parsed.clinical_summary || transcript,
            severity: severity.label,
            severityColor: severity.color,
            mood: parsed.mood || 'ไม่ระบุ',
            advice: parsed.advice || 'กรุณาปรึกษาแพทย์หากอาการไม่ดีขึ้น',
            transcript,
        }
    } catch (err) {
        console.error('Gemini analysis failed:', err)
        return createFallbackResult(transcript)
    }
}

// Fallback when API is unavailable
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

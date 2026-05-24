import OpenAI from 'openai'

type AiImageAnalysis = {
  imageQuality: 'good' | 'poor' | 'unclear'
  visibleMouthArea: boolean
  possibleRedness: boolean | null
  possibleUlcer: boolean | null
  possibleBleeding: boolean | null
  confidence: number
  imageObservationTh: string
  safetyNoteTh: string
}

type AnalyzeRequestBody = {
  imageDataUrl?: string
  fileName?: string
  originalFileSize?: number
}

type VercelRequestLike = {
  method?: string
  body?: unknown
}

type VercelResponseLike = {
  status: (statusCode: number) => {
    json: (data: unknown) => void
  }
}

const MAX_DATA_URL_LENGTH = 3_800_000

function sendJson(response: VercelResponseLike, statusCode: number, data: unknown) {
  return response.status(statusCode).json(data)
}

function getRequestBody(request: VercelRequestLike): AnalyzeRequestBody {
  if (!request.body) return {}

  if (typeof request.body === 'string') {
    return JSON.parse(request.body) as AnalyzeRequestBody
  }

  if (typeof request.body === 'object') {
    return request.body as AnalyzeRequestBody
  }

  return {}
}

function normalizeBooleanOrNull(value: unknown): boolean | null {
  if (value === true) return true
  if (value === false) return false
  return null
}

function normalizeQuality(value: unknown): AiImageAnalysis['imageQuality'] {
  if (value === 'good' || value === 'poor' || value === 'unclear') {
    return value
  }

  return 'unclear'
}

function normalizeConfidence(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0
  }

  if (value > 1) {
    return Math.max(0, Math.min(1, value / 100))
  }

  return Math.max(0, Math.min(1, value))
}

function fallbackAnalysis(note: string): AiImageAnalysis {
  return {
    imageQuality: 'unclear',
    visibleMouthArea: false,
    possibleRedness: null,
    possibleUlcer: null,
    possibleBleeding: null,
    confidence: 0,
    imageObservationTh: note,
    safetyNoteTh:
      'ผลนี้เป็นเพียงข้อมูลเสริม ไม่ใช่การวินิจฉัยแทนบุคลากรทางการแพทย์',
  }
}

function parseAiJson(text: string): AiImageAnalysis {
  try {
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned) as Record<string, unknown>

    return {
      imageQuality: normalizeQuality(parsed.imageQuality),
      visibleMouthArea: parsed.visibleMouthArea === true,
      possibleRedness: normalizeBooleanOrNull(parsed.possibleRedness),
      possibleUlcer: normalizeBooleanOrNull(parsed.possibleUlcer),
      possibleBleeding: normalizeBooleanOrNull(parsed.possibleBleeding),
      confidence: normalizeConfidence(parsed.confidence),
      imageObservationTh:
        typeof parsed.imageObservationTh === 'string'
          ? parsed.imageObservationTh
          : 'ไม่สามารถสรุปรายละเอียดจากภาพได้ชัดเจน',
      safetyNoteTh:
        typeof parsed.safetyNoteTh === 'string'
          ? parsed.safetyNoteTh
          : 'ผลนี้เป็นเพียงข้อมูลเสริม ไม่ใช่การวินิจฉัยแทนบุคลากรทางการแพทย์',
    }
  } catch {
    return fallbackAnalysis(
      'AI วิเคราะห์ภาพได้ แต่ผลลัพธ์ที่ส่งกลับมายังไม่อยู่ในรูปแบบที่ระบบอ่านได้ชัดเจน กรุณาลองใหม่อีกครั้ง',
    )
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  try {
    return JSON.stringify(error)
  } catch {
    return 'Unknown error'
  }
}

function getThaiErrorMessage(error: unknown) {
  const message = getErrorMessage(error)
  const lower = message.toLowerCase()

  if (lower.includes('api key') || lower.includes('401') || lower.includes('unauthorized')) {
    return 'OpenAI API Key ไม่ถูกต้อง หรือยังไม่ได้ตั้งค่า OPENAI_API_KEY ใน Vercel'
  }

  if (lower.includes('quota') || lower.includes('billing') || lower.includes('insufficient')) {
    return 'OpenAI API ใช้งานไม่ได้ เพราะเครดิต/โควต้า/ระบบ Billing อาจยังไม่พร้อม'
  }

  if (lower.includes('model') || lower.includes('does not exist')) {
    return 'ชื่อโมเดล OpenAI ไม่ถูกต้อง หรือบัญชีนี้ยังไม่มีสิทธิ์ใช้โมเดลที่ตั้งไว้'
  }

  if (lower.includes('rate limit')) {
    return 'OpenAI API ถูกจำกัดจำนวนการเรียกชั่วคราว กรุณาลองใหม่อีกครั้ง'
  }

  if (lower.includes('request entity too large') || lower.includes('payload too large')) {
    return 'รูปภาพมีขนาดใหญ่เกินไป กรุณาถ่ายใหม่หรือเลือกรูปที่เล็กลง'
  }

  return `AI วิเคราะห์ภาพไม่สำเร็จ: ${message.slice(0, 180)}`
}

export default async function handler(request: VercelRequestLike, response: VercelResponseLike) {
  if (request.method !== 'POST') {
    return sendJson(response, 405, {
      error: 'Method not allowed',
      errorTh: 'รองรับเฉพาะการส่งข้อมูลแบบ POST เท่านั้น',
    })
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return sendJson(response, 500, {
      error: 'OPENAI_API_KEY is missing',
      errorTh: 'ยังไม่ได้ตั้งค่า OPENAI_API_KEY ใน Vercel',
    })
  }

  try {
    const body = getRequestBody(request)
    const imageDataUrl = body.imageDataUrl

    if (!imageDataUrl) {
      return sendJson(response, 400, {
        error: 'Image is required',
        errorTh: 'กรุณาอัปโหลดภาพก่อนวิเคราะห์',
      })
    }

    if (!imageDataUrl.startsWith('data:image/')) {
      return sendJson(response, 400, {
        error: 'Invalid image format',
        errorTh: 'รูปภาพที่ส่งมาไม่ถูกต้อง',
      })
    }

    if (imageDataUrl.length > MAX_DATA_URL_LENGTH) {
      return sendJson(response, 400, {
        error: 'Image is too large',
        errorTh: 'รูปภาพมีขนาดใหญ่เกินไป กรุณาลองเลือกรูปที่เล็กลงหรือถ่ายใหม่',
      })
    }

    const openai = new OpenAI({
      apiKey,
    })

    const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

    const aiResponse = await openai.responses.create({
      model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: `
You are assisting a NON-DIAGNOSTIC prototype for oral mucositis screening in pediatric oncology.

Analyze the uploaded mouth image as visual support only.
Do not diagnose disease.
Do not claim certainty.
Do not give treatment instructions beyond advising medical review when needed.
Focus only on visible image quality and possible visual signs.

Return ONLY valid JSON.
Do not include markdown.
Do not include extra text.

JSON schema:
{
  "imageQuality": "good" | "poor" | "unclear",
  "visibleMouthArea": true | false,
  "possibleRedness": true | false | null,
  "possibleUlcer": true | false | null,
  "possibleBleeding": true | false | null,
  "confidence": number,
  "imageObservationTh": string,
  "safetyNoteTh": string
}

Rules:
- confidence must be from 0 to 1.
- Use null when the image is unclear.
- imageObservationTh must be in Thai.
- safetyNoteTh must be in Thai.
- Always mention that this is not a medical diagnosis.
              `.trim(),
            },
            {
              type: 'input_image',
              image_url: imageDataUrl,
              detail: 'low',
            },
          ],
        },
      ],
    })

    const analysis = parseAiJson(aiResponse.output_text)

    return sendJson(response, 200, analysis)
  } catch (error) {
    console.error('analyze-mouth error:', error)

    return sendJson(response, 500, {
      error: getErrorMessage(error),
      errorTh: getThaiErrorMessage(error),
    })
  }
}
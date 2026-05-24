import OpenAI from 'openai'
import { Buffer } from 'node:buffer'

export const runtime = 'nodejs'
export const maxDuration = 30

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

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
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

function parseAiJson(text: string): AiImageAnalysis {
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
}

async function handleAnalyze(request: Request) {
  if (request.method !== 'POST') {
    return jsonResponse(
      {
        error: 'Method not allowed',
        errorTh: 'รองรับเฉพาะการส่งข้อมูลแบบ POST เท่านั้น',
      },
      405,
    )
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return jsonResponse(
      {
        error: 'OPENAI_API_KEY is missing',
        errorTh: 'ยังไม่ได้ตั้งค่า OPENAI_API_KEY ในระบบ',
      },
      500,
    )
  }

  try {
    const formData = await request.formData()
    const image = formData.get('image')

    if (!(image instanceof File)) {
      return jsonResponse(
        {
          error: 'Image is required',
          errorTh: 'กรุณาอัปโหลดภาพก่อนวิเคราะห์',
        },
        400,
      )
    }

    if (!image.type.startsWith('image/')) {
      return jsonResponse(
        {
          error: 'Invalid file type',
          errorTh: 'ไฟล์ที่อัปโหลดต้องเป็นรูปภาพเท่านั้น',
        },
        400,
      )
    }

    if (image.size > MAX_IMAGE_SIZE_BYTES) {
      return jsonResponse(
        {
          error: 'Image is too large',
          errorTh: 'รูปภาพมีขนาดใหญ่เกินไป กรุณาใช้ไฟล์ไม่เกิน 8MB',
        },
        400,
      )
    }

    const openai = new OpenAI({
      apiKey,
    })

    const arrayBuffer = await image.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${image.type};base64,${base64Image}`

    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
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
              image_url: dataUrl,
              detail: 'low',
            },
          ],
        },
      ],
    })

    const analysis = parseAiJson(response.output_text)

    return jsonResponse(analysis)
  } catch (error) {
    console.error('analyze-mouth error:', error)

    return jsonResponse(
      {
        error: 'Failed to analyze image',
        errorTh:
          'AI วิเคราะห์ภาพไม่สำเร็จ กรุณาลองใหม่ หรือใช้ผลจากแบบสอบถามเบื้องต้น',
      },
      500,
    )
  }
}

export function POST(request: Request) {
  return handleAnalyze(request)
}

export default {
  fetch(request: Request) {
    return handleAnalyze(request)
  },
}
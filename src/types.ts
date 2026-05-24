export type Screen = 'welcome' | 'upload' | 'questions' | 'analyzing' | 'result'

export type Answers = {
  redness?: boolean
  ulcer?: boolean
  solidFood?: boolean
  liquidFood?: boolean
}

export type Result = {
  grade: number
  level: string
  summary: string
  recommendation: string
  badge: string
}

export type Question = {
  id: keyof Answers
  title: string
  subtitle: string
  yes: string
  no: string
}

export type AiImageAnalysis = {
  imageQuality: 'good' | 'poor' | 'unclear'
  visibleMouthArea: boolean
  possibleRedness: boolean | null
  possibleUlcer: boolean | null
  possibleBleeding: boolean | null
  confidence: number
  imageObservationTh: string
  safetyNoteTh: string
}
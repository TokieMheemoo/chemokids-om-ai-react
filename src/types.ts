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

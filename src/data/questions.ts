import type { Answers } from '../types'

export const questions: {
  id: keyof Answers
  title: string
  subtitle: string
  yes: string
  no: string
}[] = [
  {
    id: 'redness',
    title: 'มีรอยแดงในช่องปากหรือไม่?',
    subtitle: 'สังเกตบริเวณเยื่อบุช่องปาก เหงือก กระพุ้งแก้ม หรือริมฝีปากด้านใน',
    yes: 'มี',
    no: 'ไม่มี',
  },
  {
    id: 'ulcer',
    title: 'มีแผลในช่องปากหรือไม่?',
    subtitle: 'เช่น แผลขาว แผลแดง หรือแผลเจ็บบริเวณเยื่อบุช่องปาก',
    yes: 'มี',
    no: 'ไม่มี',
  },
  {
    id: 'solidFood',
    title: 'ตอนนี้รับประทานอาหารแข็งได้หรือไม่?',
    subtitle: 'เช่น ข้าว อาหารทั่วไป หรืออาหารที่ต้องเคี้ยว',
    yes: 'ได้',
    no: 'ไม่ได้',
  },
  {
    id: 'liquidFood',
    title: 'ดื่มน้ำหรือรับประทานอาหารเหลวได้หรือไม่?',
    subtitle: 'เช่น น้ำ นม ซุป หรืออาหารเหลว',
    yes: 'ได้',
    no: 'ไม่ได้',
  },
]

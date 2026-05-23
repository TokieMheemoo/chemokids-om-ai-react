import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import './App.css'

type Screen = 'welcome' | 'upload' | 'questions' | 'analyzing' | 'result'

type Answers = {
  redness?: boolean
  ulcer?: boolean
  solidFood?: boolean
  liquidFood?: boolean
}

type Result = {
  grade: number
  level: string
  summary: string
  recommendation: string
  badge: string
}

const questions: {
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

function evaluateGrade(answers: Answers): Result {
  const { redness, ulcer, solidFood, liquidFood } = answers

  if (liquidFood === false) {
    return {
      grade: 4,
      level: 'รุนแรงมาก',
      summary:
        'ผู้ป่วยไม่สามารถรับประทานอาหารหรือดื่มน้ำได้ จึงควรได้รับการประเมินโดยบุคลากรทางการแพทย์โดยเร็ว',
      recommendation:
        'แจ้งแพทย์หรือพยาบาลทันที โดยเฉพาะหากมีไข้ อ่อนเพลียมาก ปวดมาก หรือมีเลือดออกในช่องปาก',
      badge: 'ควรพบแพทย์ทันที',
    }
  }

  if (ulcer && solidFood === false && liquidFood === true) {
    return {
      grade: 3,
      level: 'รุนแรง',
      summary:
        'พบข้อมูลว่าอาจมีแผลในช่องปากและรับประทานอาหารแข็งไม่ได้ แต่ยังรับประทานอาหารเหลวได้',
      recommendation:
        'ควรติดตามอาการใกล้ชิด เลือกอาหารอ่อนหรืออาหารเหลว และปรึกษาบุคลากรทางการแพทย์เพื่อประเมินเพิ่มเติม',
      badge: 'ควรปรึกษาบุคลากรทางการแพทย์',
    }
  }

  if (redness && ulcer && solidFood === true) {
    return {
      grade: 2,
      level: 'ปานกลาง',
      summary: 'พบลักษณะรอยแดงและแผลในช่องปาก แต่ยังสามารถรับประทานอาหารแข็งได้',
      recommendation:
        'ควรดูแลความสะอาดช่องปาก หลีกเลี่ยงอาหารเผ็ด เปรี้ยว แข็ง หรือระคายเคือง และติดตามอาการอย่างต่อเนื่อง',
      badge: 'ติดตามอาการต่อเนื่อง',
    }
  }

  if (redness && !ulcer) {
    return {
      grade: 1,
      level: 'เล็กน้อย',
      summary: 'พบลักษณะรอยแดงในช่องปาก แต่ยังไม่พบข้อมูลแผลจากแบบสอบถาม',
      recommendation:
        'ควรเฝ้าระวังอาการ ดูแลช่องปากอย่างสม่ำเสมอ และประเมินซ้ำหากเริ่มมีอาการเจ็บหรือเกิดแผล',
      badge: 'เฝ้าระวัง',
    }
  }

  return {
    grade: 0,
    level: 'ไม่พบอาการชัดเจน',
    summary: 'ยังไม่พบข้อมูลรอยแดงหรือแผลในช่องปากจากแบบสอบถามเบื้องต้น',
    recommendation:
      'ควรดูแลสุขภาพช่องปากอย่างสม่ำเสมอ และประเมินซ้ำหากมีอาการเจ็บ แสบ หรือรับประทานอาหารลำบาก',
    badge: 'ประเมินซ้ำเมื่อมีอาการ',
  }
}

function TopBar({ step }: { step: number }) {
  return (
    <div className="topbar">
      <div className="topbar-brand">
        <img src="/logo.png" alt="ChemoKids OM-AI Logo" className="topbar-logo" />

        <div>
          <p className="eyebrow">ChemoKids OM-AI</p>
          <h2>Mobile Assessment</h2>
        </div>
      </div>

      <span className="step-pill">Step {step}/4</span>

      <div className="progress">
        <div style={{ width: `${(step / 4) * 100}%` }} />
      </div>
    </div>
  )
}

function App() {
  const [screen, setScreen] = useState<Screen>('welcome')
  const [image, setImage] = useState<File | null>(null)
  const [answers, setAnswers] = useState<Answers>({})

  const galleryInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const analyzeTimerRef = useRef<number | null>(null)

  const imagePreview = useMemo(() => {
    if (!image) return ''
    return URL.createObjectURL(image)
  }, [image])

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  useEffect(() => {
    return () => {
      if (analyzeTimerRef.current) {
        window.clearTimeout(analyzeTimerRef.current)
      }
    }
  }, [])

  const result = useMemo(() => evaluateGrade(answers), [answers])
  const isQuestionComplete = questions.every((q) => answers[q.id] !== undefined)

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (file) {
      setImage(file)
    }

    event.target.value = ''
  }

  function openGallery() {
    galleryInputRef.current?.click()
  }

  function openCamera() {
    cameraInputRef.current?.click()
  }

  function restart() {
    if (analyzeTimerRef.current) {
      window.clearTimeout(analyzeTimerRef.current)
    }

    setScreen('welcome')
    setImage(null)
    setAnswers({})
  }

  function goAnalyze() {
    setScreen('analyzing')

    analyzeTimerRef.current = window.setTimeout(() => {
      setScreen('result')
    }, 1600)
  }

  return (
    <main className="page">
      <section className="phone">
        {screen === 'welcome' && (
          <div className="welcome-screen">
            <div>
              <img src="/logo.png" alt="ChemoKids OM-AI Logo" className="hero-logo" />

              <h1>
                Mobile
                <br />
                Assessment
              </h1>

              <p className="description">
                ระบบต้นแบบสำหรับช่วยประเมินภาวะเยื่อบุช่องปากอักเสบ ในผู้ป่วยเด็กมะเร็งที่ได้รับยาเคมีบำบัด
              </p>

              <div className="feature-card">📷 ถ่ายหรืออัปโหลดภาพช่องปาก</div>
              <div className="feature-card">✨ จำลอง AI วิเคราะห์ร่วมกับแบบสอบถาม</div>
              <div className="feature-card">📱 ออกแบบสำหรับใช้งานบนมือถือ</div>
            </div>

            <div>
              <button className="primary-button" type="button" onClick={() => setScreen('upload')}>
                เริ่มประเมิน
              </button>

              <p className="note">
                ผลลัพธ์นี้เป็นเพียงการประเมินเบื้องต้น ไม่ใช่การวินิจฉัยแทนแพทย์
              </p>
            </div>
          </div>
        )}

        {screen === 'upload' && (
          <>
            <TopBar step={1} />

            <div className="content">
              <h2 className="screen-title">อัปโหลดภาพช่องปาก</h2>

              <p className="description small">
                เลือกภาพที่เห็นบริเวณแผลหรือเยื่อบุช่องปากชัดเจน แสงเพียงพอ และไม่เบลอ
              </p>

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                hidden
                onChange={handleImageUpload}
              />

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handleImageUpload}
              />

              <button className="upload-box" type="button" onClick={openGallery}>
                {imagePreview ? (
                  <img src={imagePreview} alt="ตัวอย่างภาพช่องปากที่อัปโหลด" className="preview-image" />
                ) : (
                  <div>
                    <div className="upload-icon">＋</div>
                    <h3>เลือกรูปจาก Gallery</h3>
                    <p>แตะเพื่อเลือกรูปภาพจากมือถือ</p>
                  </div>
                )}
              </button>

              <button className="secondary-button" type="button" onClick={openCamera}>
                ถ่ายรูปใหม่ด้วยกล้อง
              </button>

              <div className="warning-box">
                <strong>คำแนะนำการถ่ายภาพ</strong>
                <p>
                  ถ่ายในที่สว่าง เห็นบริเวณที่สงสัยชัดเจน และหลีกเลี่ยงการใส่ข้อมูลระบุตัวตนของผู้ป่วยในภาพ
                </p>
              </div>

              <div className="button-row">
                <button className="ghost-button" type="button" onClick={() => setScreen('welcome')}>
                  ย้อนกลับ
                </button>

                <button
                  className="primary-button"
                  type="button"
                  disabled={!image}
                  onClick={() => setScreen('questions')}
                >
                  ถัดไป
                </button>
              </div>
            </div>
          </>
        )}

        {screen === 'questions' && (
          <>
            <TopBar step={2} />

            <div className="content">
              <h2 className="screen-title">แบบสอบถามอาการ</h2>

              <p className="description small">
                ข้อมูลอาการจะช่วยให้ระบบประเมินร่วมกับภาพถ่ายได้เหมาะสมขึ้น
              </p>

              <div className="questions">
                {questions.map((question, index) => (
                  <div className="question-card" key={question.id}>
                    <p className="question-number">Question {index + 1}</p>

                    <h3>{question.title}</h3>

                    <p>{question.subtitle}</p>

                    <div className="choice-row">
                      <button
                        className={`choice-button ${answers[question.id] === false ? 'active' : ''}`}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: false,
                          }))
                        }
                      >
                        {question.no}
                      </button>

                      <button
                        className={`choice-button ${answers[question.id] === true ? 'active' : ''}`}
                        type="button"
                        onClick={() =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: true,
                          }))
                        }
                      >
                        {question.yes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="button-row">
                <button className="ghost-button" type="button" onClick={() => setScreen('upload')}>
                  ย้อนกลับ
                </button>

                <button
                  className="primary-button"
                  type="button"
                  disabled={!isQuestionComplete}
                  onClick={goAnalyze}
                >
                  วิเคราะห์ผล
                </button>
              </div>
            </div>
          </>
        )}

        {screen === 'analyzing' && (
          <>
            <TopBar step={3} />

            <div className="analyzing-screen">
              <div className="loader">✨</div>

              <h2 className="screen-title">AI กำลังวิเคราะห์</h2>

              <p className="description small center">
                ระบบจำลองการตรวจรอยแดง แผล และข้อมูลอาการ เพื่อประเมินระดับความรุนแรงเบื้องต้น
              </p>

              <div className="process-box">
                <strong>กำลังประมวลผล</strong>
                <p>1. ตรวจคุณภาพภาพถ่าย</p>
                <p>2. วิเคราะห์สัญญาณที่เกี่ยวข้องกับ Oral Mucositis</p>
                <p>3. รวมผลกับแบบสอบถามอาการ</p>
              </div>
            </div>
          </>
        )}

        {screen === 'result' && (
          <>
            <TopBar step={4} />

            <div className="content">
              <div className="result-hero">
                <p>ผลการประเมินเบื้องต้น</p>
                <h1>Grade {result.grade}</h1>
                <h2>{result.level}</h2>
                <span>{result.badge}</span>
              </div>

              <div className="result-card">
                <h3>คำอธิบาย</h3>
                <p>{result.summary}</p>
              </div>

              <div className="result-card">
                <h3>คำแนะนำเบื้องต้น</h3>
                <p>{result.recommendation}</p>
              </div>

              <div className="danger-box">
                <h3>หมายเหตุสำคัญ</h3>
                <p>
                  ผลลัพธ์นี้เป็นเพียงการช่วยประเมินเบื้องต้น ไม่ใช่การวินิจฉัยแทนแพทย์
                  หากผู้ป่วยมีอาการรุนแรง ปวดมาก ดื่มน้ำไม่ได้ มีไข้ เลือดออก หรืออ่อนเพลียมาก
                  ควรติดต่อบุคลากรทางการแพทย์ทันที
                </p>
              </div>

              <button className="secondary-button" type="button" onClick={restart}>
                เริ่มประเมินใหม่
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}

export default App
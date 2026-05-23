type TopBarProps = {
  step: number
  onBack?: () => void
}

export function TopBar({ step, onBack }: TopBarProps) {
  return (
    <div className="topbar">
      {onBack && (
        <button className="back-button" type="button" onClick={onBack} aria-label="ย้อนกลับ">
          ←
        </button>
      )}

      <div className={onBack ? 'topbar-copy with-back' : 'topbar-copy'}>
        <p className="eyebrow">ChemoKids OM-AI</p>
        <h2>Mobile Assessment</h2>
      </div>

      <span className="step-pill">Step {step}/4</span>

      <div className="progress">
        <div style={{ width: `${(step / 4) * 100}%` }} />
      </div>
    </div>
  )
}

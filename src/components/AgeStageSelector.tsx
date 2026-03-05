import React, { useState } from 'react'
import { QuizStep, OptionButton, PillButton } from './QuizStep'
import { GUARDRAILS, validateCombo, AgeBand, LifeStage } from '@/utils/guardrails'

const AGE_BANDS: { id: AgeBand; label: string }[] = [
  { id: '18_24', label: '18–24' },
  { id: '25_34', label: '25–34' },
  { id: '35_39', label: '35–39' },
  { id: '40_44', label: '40–44' },
  { id: '45_49', label: '45–49' },
  { id: '50_54', label: '50–54' },
  { id: '55_64', label: '55–64' },
  { id: '65_plus', label: '65+' },
]

const STAGES: { id: LifeStage; label: string; icon: string }[] = [
  { id: 'menstrual', label: 'Menstrual Health', icon: '🌸' },
  { id: 'fertility', label: 'Fertility / Trying to Conceive', icon: '🌱' },
  { id: 'postpartum', label: 'Pregnancy / Postpartum', icon: '🤰' },
  { id: 'perimenopause', label: 'Perimenopause', icon: '🔄' },
  { id: 'menopause', label: 'Menopause', icon: '🌙' },
]

interface Props {
  onComplete: (age: AgeBand, stage: LifeStage) => void
  onStartOver: () => void
}

export function AgeStageSelector({ onComplete, onStartOver }: Props) {
  const [age, setAge] = useState<AgeBand | null>(null)
  const [stage, setStage] = useState<LifeStage | null>(null)
  const [step, setStep] = useState<1 | 2>(1) // 1: age, 2: stage
  const [error, setError] = useState<string | null>(null)

  const allowedStages = age ? GUARDRAILS[age] : STAGES.map(s => s.id)

  // When user picks an age, immediately advance to stage selection (step 2)
  function handleSelectAge(a: AgeBand) {
    setAge(a)
    setError(null)
    // small timeout for smoother UX (feel free to remove)
    setTimeout(() => setStep(2), 150)
  }

  // When user picks a stage, validate and go to summary if valid
  function handleSelectStage(s: LifeStage) {
    if (!age) {
      setError('Please select an age range first.')
      return
    }

    const result = validateCombo(age, s)
    if (!result.valid) {
      const allowed = GUARDRAILS[age].join(', ')
      setError(`That life stage isn't recommended for your age range. Recommended: ${allowed}.`)
      return
    }

    setStage(s)
    setError(null)
    // notify parent to advance to the appropriate next screen
    setTimeout(() => onComplete(age, s), 150)
  }

  function handleContinue() {
    if (age && stage) onComplete(age, stage)
  }

  function handleBack() {
    if (step === 2) setStep(1)
    if (step === 3) setStep(2)
  }

  // Step 1: Age selection
  if (step === 1) {
    return (
      <QuizStep currentStep={1} totalSteps={7} onStartOver={onStartOver}>
        <div className="space-y-6">
          <h2 className="text-2xl font-medium">What is your age range?</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {AGE_BANDS.map(a => (
              <OptionButton key={a.id} selected={age === a.id} onClick={() => handleSelectAge(a.id)}>
                {a.label}
              </OptionButton>
            ))}
          </div>
        </div>
      </QuizStep>
    )
  }

  // Step 2: Stage selection (vertical list with icons)
  if (step === 2) {
    return (
      <QuizStep currentStep={2} totalSteps={7} onStartOver={onStartOver}>
        <div className="space-y-6">
          <h2 className="text-2xl font-medium">Which life stage best reflects you right now?</h2>

          <div className="space-y-4 mt-2">
            {STAGES.map(s => {
              const disabled = age ? !allowedStages.includes(s.id) : false
              return (
                <OptionButton key={s.id} selected={stage === s.id} onClick={() => handleSelectStage(s.id)} disabled={disabled}>
                  <span className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <span className="font-semibold">{s.label}</span>
                  </span>
                </OptionButton>
              )
            })}
          </div>

          {error && <div className="text-sm text-rose-600">{error}</div>}

          {/* Removed Back / Start Over from stage selection — selection auto-advances on pick */}
        </div>
      </QuizStep>
    )
  }
  return null
}

import React, { useState } from 'react'
import { QuizStep, OptionButton } from './QuizStep'

interface StrainLevel {
  score: number
  label: string
  color: string
  bg: string
  emoji: string
}

interface Props {
  strainLevel: StrainLevel | null
  onComplete: (symptoms: string[]) => void
  onStartOver: () => void
}

const SYMPTOMS = ['Bloating', 'Brain fog', 'Mood swings', 'Weight gain', 'None of these']

export function SymptomsStep({ strainLevel, onComplete, onStartOver }: Props) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(symptom: string) {
    if (symptom === 'None of these') {
      setSelected(s => s.includes('None of these') ? [] : ['None of these'])
      return
    }
    // clear "None of these" if picking something else
    const filtered = selected.filter(s => s !== 'None of these')
    if (filtered.includes(symptom)) {
      setSelected(filtered.filter(s => s !== symptom))
    } else {
      // enforce max 2 symptoms (keep first two selected)
      if (filtered.length >= 2) return
      setSelected([...filtered, symptom])
    }
  }

  return (
    <QuizStep currentStep={7} totalSteps={7} onStartOver={onStartOver} strainLevel={strainLevel}>
      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-neutral-800">Do you experience any of these?</h2>

        <div className="space-y-4">
          {SYMPTOMS.map(symptom => (
            <OptionButton
              key={symptom}
              selected={selected.includes(symptom)}
              onClick={() => toggle(symptom)}
            >
              <span className="font-semibold">{symptom}</span>
            </OptionButton>
          ))}
        </div>

        <button
          onClick={() => {
            // Normalize symptoms: if 'None of these' selected => []
            if (selected.includes('None of these')) return onComplete([])
            // Keep up to first 2 selected symptoms
            return onComplete(selected.slice(0, 2))
          }}
          className="w-full py-4 rounded-xl font-semibold transition-all duration-300 bg-rose-400 text-white hover:bg-rose-500"
        >
          See My Results
        </button>
      </div>
    </QuizStep>
  )
}

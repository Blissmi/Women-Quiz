import React, { useState } from 'react'
import { QuizStep } from './QuizStep'
import { LifeStage } from '@/utils/guardrails'

const STAGE_OPTIONS: Record<LifeStage, string[]> = {
  menstrual: [
    'Period pain management',
    'Energy & mood stability',
    'Hormone balance',
    'PMS symptoms',
    'Cycle regularity',
    'Skin health',
    'Weight management',
  ],
  fertility: [
    'Optimising fertility',
    'Cycle tracking',
    'Hormone balance',
    'Stress management',
    'Nutrition for conception',
    'Energy levels',
    'Sleep quality',
  ],
  postpartum: [
    'Postpartum recovery',
    'Energy & fatigue',
    'Mood support',
    'Sleep quality',
    'Weight management',
    'Nutrition',
    'Stress management',
  ],
  perimenopause: [
    'Hot flashes / night sweats',
    'Sleep disruption',
    'Mood swings',
    'Brain fog',
    'Weight gain',
    'Energy levels',
    'Hormone balance',
  ],
  menopause: [
    'Hot flashes',
    'Sleep quality',
    'Bone health',
    'Heart health',
    'Brain fog',
    'Weight management',
    'Mood & wellbeing',
  ],
}

interface Props {
  stage?: LifeStage | null
  onComplete: (selected: string[]) => void
  onStartOver: () => void
}

export function HealthFocusSelector({ stage, onComplete, onStartOver }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const limit = 2
  const options = stage ? STAGE_OPTIONS[stage] : Object.values(STAGE_OPTIONS).flat()

  function toggle(option: string) {
    if (selected.includes(option)) {
      setSelected(s => s.filter(x => x !== option))
      return
    }
    if (selected.length >= limit) return
    setSelected(s => [...s, option])
  }

  return (
    <QuizStep currentStep={3} totalSteps={7} onStartOver={onStartOver}>
      <div className="space-y-6">
        <h2 className="text-2xl font-medium">What is your main health focus right now?</h2>
        <div className="text-sm text-neutral-500">Select up to 2 {selected.length > 0 && <span className="text-rose-500">({selected.length} of {limit} selected)</span>}</div>

        <div className="flex flex-wrap gap-3 mt-4">
          {options.map(opt => {
            const isSelected = selected.includes(opt)
            const disabled = !isSelected && selected.length >= limit
            return (
              <button
                key={opt}
                onClick={() => toggle(opt)}
                disabled={disabled}
                className={`px-6 py-3 rounded-full border-2 transition-all duration-200 text-sm font-semibold ${isSelected ? 'bg-rose-400 text-white border-rose-400 shadow-md' : 'bg-white text-neutral-700 border-neutral-200 hover:border-rose-200 hover:bg-rose-50/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {opt}
              </button>
            )
          })}
        </div>

        {/* Show Continue only after at least one selection; initial screen has no Start Over/Continue controls */}
        {selected.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => onComplete(selected)}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${selected.length === 0 ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed' : 'bg-rose-400 text-white'}`}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </QuizStep>
  )
}

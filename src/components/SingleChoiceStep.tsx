import React from 'react'
import { QuizStep, OptionButton } from './QuizStep'

interface StrainLevel {
  score: number
  label: string
  color: string
  bg: string
  emoji: string
}

interface Props {
  question: string
  options: string[]
  currentStep: number
  totalSteps: number
  strainLevel?: StrainLevel | null
  onSelect: (value: string) => void
  onStartOver: () => void
}

export function SingleChoiceStep({ question, options, currentStep, totalSteps, strainLevel, onSelect, onStartOver }: Props) {
  return (
    <QuizStep currentStep={currentStep} totalSteps={totalSteps} onStartOver={onStartOver} strainLevel={strainLevel}>
      <div className="space-y-6">
        <h2 className="text-2xl font-medium text-neutral-800">{question}</h2>
        <div className="space-y-4">
          {options.map(opt => (
            <OptionButton key={opt} selected={false} onClick={() => onSelect(opt)}>
              <span className="text-neutral-800 font-semibold">{opt}</span>
            </OptionButton>
          ))}
        </div>
      </div>
    </QuizStep>
  )
}

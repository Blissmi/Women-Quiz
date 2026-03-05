import React from 'react'
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import logo from '@/assets/logo.svg'
import { TopBar } from '@/components/ui/TopBar'
import { PageSection } from '@/components/ui/PageSection'

interface QuizStepProps {
  currentStep: number
  totalSteps: number
  children: React.ReactNode
  onStartOver: () => void
  strainLevel?: {
    score: number
    label: string
    color: string
    bg: string
    emoji: string
  } | null
}

export function QuizStep({ currentStep, totalSteps, children, onStartOver, strainLevel }: QuizStepProps) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50 relative">
      {/* Logo */}
      <div className="absolute top-6 left-6 z-20">
        <img src={logo} alt="Blissmi" className="h-12 md:h-16" />
      </div>

      {/* Start Over Button */}
      <button
        onClick={onStartOver}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-rose-500 transition-colors duration-200 text-sm md:text-base"
      >
        <span className="hidden sm:inline">Start Over</span>
        <span className="sm:hidden">Restart</span>
      </button>

      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-neutral-600">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-neutral-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div className="h-full bg-rose-400" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>

        {/* Quiz card */}
        <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
          <PageSection>
            {/* Strain level indicator */}
            {strainLevel && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 pb-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Current Resilience Status</span>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 ${strainLevel.bg} rounded-full`}>
                    <span>{strainLevel.emoji}</span>
                    <span className={`text-sm font-medium ${strainLevel.color}`}>{strainLevel.label}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {children}
          </PageSection>
        </motion.div>
      </div>
    </div>
  )
}

interface OptionButtonProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}

export function OptionButton({ selected, onClick, children, disabled }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full p-4 rounded-xl border-2 transition-all duration-300 text-left
        ${selected ? 'border-rose-400 bg-rose-50 shadow-md' : 'border-neutral-200 bg-white hover:border-rose-200 hover:bg-rose-50/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-neutral-800">{children}</span>
        {selected && (
          <div className="w-6 h-6 bg-rose-400 rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </button>
  )
}

interface PillButtonProps {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  disabled?: boolean
}

export function PillButton({ selected, onClick, children, disabled }: PillButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-6 py-3 rounded-full border-2 transition-all duration-300
        ${selected ? 'border-rose-400 bg-rose-400 text-white shadow-md' : 'border-neutral-200 bg-white text-neutral-700 hover:border-rose-200'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {children}
    </button>
  )
}

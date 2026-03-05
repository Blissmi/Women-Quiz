import React from 'react'
import { Download } from 'lucide-react'

interface Props {
  headline: string
  onPrimaryAction: () => void
  onSecondaryAction: () => void
}

export function CTASection({ headline, onPrimaryAction, onSecondaryAction }: Props) {
  return (
    <div className="bg-gradient-to-br from-rose-400 to-rose-500 rounded-3xl shadow-xl p-8 md:p-12 text-center text-white">
      <h3 className="text-2xl md:text-3xl font-light mb-4">See Your Full Personalised Health Plan</h3>
      <p className="text-rose-100 mb-8 max-w-2xl mx-auto">{headline}</p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={onPrimaryAction}
          className="bg-white text-rose-500 px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          Unlock My Full Plan
        </button>
        <button
          onClick={onSecondaryAction}
          className="bg-rose-600 text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download My Snapshot
        </button>
      </div>
    </div>
  )
}

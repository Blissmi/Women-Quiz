import React from 'react'
import { motion } from 'framer-motion'
import logo from '@/assets/image.png'

interface QuizHeroProps {
  onStart: () => void
}

export function QuizHero({ onStart }: QuizHeroProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50">
      {/* Logo */}
      <div className="absolute top-6 left-6 z-20">
        <img src={logo} alt="Blissmi" className="h-12 md:h-16" />
      </div>

      {/* Animated background elements */}
      <motion.div
        className="absolute top-20 left-10 w-64 h-64 bg-rose-200/30 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl"
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-light mb-6 text-neutral-800">
            Discover What Your Body Needs Right Now
          </h1>
          <p className="text-lg md:text-xl text-neutral-600 mb-8 max-w-xl mx-auto">
            Answer a few quick questions and receive personalised insights based on your life stage.
          </p>
          <button
            onClick={onStart}
            className="bg-rose-400 hover:bg-rose-500 text-white px-8 py-4 rounded-full text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Start My 3-Minute Snapshot
          </button>
        </motion.div>
      </div>
    </div>
  )
}

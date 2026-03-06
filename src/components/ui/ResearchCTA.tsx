import React from 'react'
import { Mail } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  onRegister?: () => void
}

export function ResearchCTA({ onRegister }: Props) {
  const envRecipient = (import.meta as any).env?.VITE_RESEARCH_EMAIL
  const recipient = envRecipient || 'ines@myblissmi.com'
  const subject = encodeURIComponent('Interested in research paper')
  const body = encodeURIComponent('Name:\nEmail:\n')
  const mailto = `mailto:${recipient}?subject=${subject}&body=${body}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-gradient-to-br from-rose-400 to-rose-500 rounded-3xl shadow-2xl p-8 md:p-12 mb-8 text-center text-white"
    >
      <div className="max-w-4xl mx-auto">
        <h3 className="text-2xl md:text-3xl font-light mb-3">
          Get 6 months free access to full health recommendations
        </h3>
        <p className="text-rose-100 mb-6">Register your interest today.</p>

        <div>
          {onRegister ? (
            <button
              onClick={onRegister}
              className="inline-flex items-center gap-3 bg-white text-rose-500 px-6 py-3 rounded-full font-semibold transition-transform duration-200 shadow-lg hover:shadow-xl hover:scale-105"
            >
              <Mail className="w-5 h-5" />
              Register
            </button>
          ) : (
            <a
              href={mailto}
              aria-label="Register to join research via email"
              className="inline-flex items-center gap-3 bg-white text-rose-500 px-6 py-3 rounded-full font-semibold transition-transform duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              rel="noopener noreferrer"
            >
              <Mail className="w-5 h-5" />
              Register
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default ResearchCTA

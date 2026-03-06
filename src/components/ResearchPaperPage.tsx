import React from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, ArrowLeft, ExternalLink } from 'lucide-react'
import logo from '@/assets/image.png'
import { TopBar } from '@/components/ui/TopBar'
import { PageSection } from '@/components/ui/PageSection'
import ResearchCTA from '@/components/ui/ResearchCTA'

interface ResearchPaperPageProps {
  onBack: () => void
  onStartOver: () => void
}

export function ResearchPaperPage({ onBack, onStartOver }: ResearchPaperPageProps) {
  const handleAccessPaper = () => {
    // Replace this URL with your actual research paper URL
    window.open('https://example.com/blissmi-research-paper.pdf', '_blank')
  }

  const handleDownloadPaper = () => {
    // Replace this with your actual PDF download link
    alert('Research paper download would start here!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50 px-4 py-12">
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

      {/* Main Content */}
      <div className="max-w-4xl mx-auto pt-16">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-600 hover:text-rose-500 transition-colors mb-8"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Results</span>
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-100 rounded-full mb-6">
            <FileText className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-neutral-800 mb-4">
            Secure Your Free Place Among 200 Participants
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Help close the women's health data gap and receive 6 months of free health and wellness services and tailored health recommendations through Blissmi's proprietary engine, never before released to public.
          </p>
        </motion.div>

        {/* Research Overview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl p-8 md:p-12 mb-8"
        >
          <h2 className="text-2xl font-light text-neutral-800 mb-2">What Our Research Covers</h2>
          <p className="text-neutral-600 mb-8 italic">Understanding Women's Health — As We Actually Experience It</p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-medium">1</div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-2">How Hormones Shape Energy, Mood & Focus Across Life Stages</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">We're studying how real-life transitions — from menstruation to postpartum to perimenopause — affect sleep, stress, energy, and performance.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-medium">2</div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-2">Why So Many Women Feel "Fine" — But Exhausted</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">We are researching the link between stress, sleep disruption, and hidden physiological strain that can show up as brain fog, anxiety, low motivation, or burnout.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-medium">3</div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-2">Connecting Symptoms to Root Causes</h3>
                <p className="text-neutral-600 text-sm leading-relaxed mb-3">Many women are told:<br />"It's normal."<br />"It's stress."<br />"It's just aging."</p>
                <p className="text-neutral-600 text-sm leading-relaxed">We're examining how common symptoms may be linked to hormonal, metabolic, and lifestyle patterns — and what that actually means for long-term health.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-medium">4</div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-2">What Proactive, Personalized Support Should Look Like</h3>
                <p className="text-neutral-600 text-sm leading-relaxed">We're testing how tailored lifestyle and integrative strategies can improve resilience, clarity, and overall wellbeing — before problems become chronic.</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Key Findings Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-3xl p-8 md:p-12 mb-8"
        >
          <h2 className="text-2xl font-light text-neutral-800 mb-6">Key Research Findings</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-light text-rose-500 mb-2">78%</div>
              <p className="text-sm text-neutral-600">of women report improved energy within 4 weeks of targeted lifestyle interventions</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-rose-500 mb-2">3x</div>
              <p className="text-sm text-neutral-600">greater symptom improvement with personalized vs. generic health plans</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-light text-rose-500 mb-2">92%</div>
              <p className="text-sm text-neutral-600">of participants felt more in control of their health after understanding their patterns</p>
            </div>
          </div>
        </motion.div>

        <ResearchCTA />

        {/* Footer Note */}
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }} className="text-center text-sm text-neutral-500 mt-12">
          All recommendations are for informational purposes and should not replace professional medical advice.
        </motion.p>
      </div>
    </div>
  )
}

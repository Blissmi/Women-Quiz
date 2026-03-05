import React from 'react'
import { motion } from 'framer-motion'
import { Heart, Moon, Brain, Activity, Leaf, Sparkles, Download } from 'lucide-react'
import { TopBar } from '@/components/ui/TopBar'
import { PageSection } from '@/components/ui/PageSection'

export interface QuizAnswers {
  ageRange: string
  lifeStage: string
  healthFocus: string[]
  energy: string
  sleep: string
  stress: string
  symptoms: string[]
}

interface Props {
  answers: QuizAnswers
  onUnlock: () => void
  onDownload: () => void
  onStartOver: () => void
}

function getResilienceStatus(answers: QuizAnswers) {
  let score = 0
  if (answers.energy === 'High and steady') score += 2
  else if (answers.energy === 'I crash in the afternoon') score += 1

  if (answers.sleep === '7–8 hours, good quality') score += 2
  else if (answers.sleep === '6–7 hours, light sleep') score += 1

  if (answers.stress === 'Low') score += 2
  else if (answers.stress === 'Moderate') score += 1

  if (score >= 5) return { label: 'Stable', color: 'text-emerald-600', bg: 'bg-emerald-100', emoji: '🟢' }
  if (score >= 3) return { label: 'Under Pressure', color: 'text-amber-600', bg: 'bg-amber-100', emoji: '🟡' }
  return { label: 'Needs Attention', color: 'text-rose-600', bg: 'bg-rose-100', emoji: '🔴' }
}

import { mapKeysToLabels } from '@/utils/symptoms'

function getInsights(answers: QuizAnswers) {
  const insights: string[] = []
  if (answers.stress === 'High' || answers.stress === 'Constantly overwhelmed') {
    insights.push(
      `Your stress levels may be impacting your energy, sleep quality, and overall wellbeing. This is especially important during ${answers.lifeStage.toLowerCase()}, as hormonal changes can amplify the effects of chronic stress.`
    )
  }
  if (answers.sleep !== '7–8 hours, good quality') {
    insights.push(
      'Sleep is foundational for hormone regulation, energy recovery, and emotional balance. Improving your sleep quality could have a cascading positive effect on many of the other areas you\'re experiencing.'
    )
  }
  const displaySymptoms = mapKeysToLabels(answers.symptoms || [])
  if (displaySymptoms.length > 2 && !displaySymptoms.includes('None of these')) {
    insights.push(
      `The combination of symptoms you're experiencing—including ${displaySymptoms.slice(0, 2).join(' and ')}—often signals that your body is under strain. Addressing root causes like nutrition, stress, and hormone balance can help restore equilibrium.`
    )
  } else {
    insights.push(
      'While you\'re managing relatively well, optimising your lifestyle and nutrition now can help you maintain resilience and prevent future imbalances during this important life stage.'
    )
  }
  return insights
}

function getFocusAreas(answers: QuizAnswers) {
  const areas = [
    {
      Icon: Heart,
      title: 'Nutrition',
      suggestions: [
        'Focus on anti-inflammatory foods and protein with each meal',
        'Consider tracking your micronutrient intake to support hormonal health',
      ],
    },
    {
      Icon: Moon,
      title: 'Sleep & Recovery',
      suggestions: [
        'Establish a consistent sleep routine with a wind-down ritual',
        'Limit screen time 1–2 hours before bed to improve sleep quality',
      ],
    },
  ]

  if (answers.stress === 'High' || answers.stress === 'Constantly overwhelmed') {
    areas.push({
      Icon: Brain,
      title: 'Stress Management',
      suggestions: [
        'Practice daily stress-reduction techniques like breathwork or meditation',
        'Consider adaptogens to support your body\'s stress response',
      ],
    })
  } else if (answers.energy === 'I feel tired most days' || answers.energy === 'I feel wired but exhausted') {
    areas.push({
      Icon: Activity,
      title: 'Energy Support',
      suggestions: [
        'Balance your blood sugar with regular, protein-rich meals',
        'Consider gentle movement to boost natural energy levels',
      ],
    })
  } else {
    areas.push({
      Icon: Leaf,
      title: 'Hormone Support',
      suggestions: [
        'Support your hormonal balance with targeted nutrition',
        'Consider tracking your cycle to understand your body\'s patterns better',
      ],
    })
  }

  return areas
}

export function QuizResults({ answers, onUnlock, onDownload, onStartOver }: Props) {
  const resilience = getResilienceStatus(answers)
  const insights = getInsights(answers)
  const focusAreas = getFocusAreas(answers)

  return (
    <div id="snapshot-root" className="min-h-screen px-4 py-12 bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50 relative">
      <TopBar onStartOver={onStartOver} />

      <div className="max-w-4xl mx-auto pt-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="space-y-8">

          {/* Snapshot summary */}
          <PageSection>
            <div className="flex items-start gap-3 mb-6">
              <Sparkles className="w-8 h-8 text-rose-400 flex-shrink-0" />
              <h2 className="text-3xl font-light text-neutral-800">Your Personal Health Snapshot</h2>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-neutral-500">Life Stage</span>
                <p className="text-lg text-neutral-800">{answers.lifeStage}</p>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Health Focus</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {answers.healthFocus.map((goal, i) => (
                    <span key={i} className="px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-sm">{goal}</span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-neutral-500">Resilience Status</span>
                <div className={`inline-flex items-center gap-2 px-4 py-2 ${resilience.bg} rounded-full mt-1`}>
                  <span>{resilience.emoji}</span>
                  <span className={`font-medium ${resilience.color}`}>{resilience.label}</span>
                </div>
              </div>
            </div>
          </PageSection>

          {/* Insights */}
          <PageSection>
            <h3 className="text-2xl font-light text-neutral-800 mb-6">What This Means For You</h3>
            <div className="space-y-4 text-neutral-700 leading-relaxed">
              {insights.map((insight, i) => <p key={i}>{insight}</p>)}
            </div>
          </PageSection>

          {/* Focus areas */}
          <PageSection>
            <h3 className="text-2xl font-light text-neutral-800 mb-6">Your Top 3 Focus Areas</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {focusAreas.map(({ Icon, title, suggestions }, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="p-6 bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl"
                >
                  <Icon className="w-8 h-8 text-rose-400 mb-4" />
                  <h4 className="font-medium text-neutral-800 mb-3">{title}</h4>
                  <ul className="space-y-2 text-sm text-neutral-600">
                    {suggestions.map((s, j) => <li key={j}>• {s}</li>)}
                  </ul>
                </motion.div>
              ))}
            </div>
          </PageSection>

          {/* CTA */}
          <div className="bg-gradient-to-br from-rose-400 to-rose-500 rounded-3xl shadow-xl p-8 md:p-12 text-center text-white">
            <h3 className="text-3xl font-light mb-4">See Your Full Personalised Health Plan</h3>
            <p className="text-rose-100 mb-8 max-w-2xl mx-auto">
              Unlock deeper insights and personalised guidance with Blissmi.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onUnlock}
                className="bg-white text-rose-500 px-8 py-4 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Unlock My Full Plan
              </button>
              <button
                onClick={onDownload}
                className="bg-rose-600 text-white px-8 py-4 rounded-full font-medium transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download My Snapshot
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  )
}

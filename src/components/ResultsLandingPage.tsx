import React from 'react'
import { motion } from 'framer-motion'
import { Heart, Moon, Activity } from 'lucide-react'
import logo from '@/assets/logo.svg'
import { StrainBadge } from '@/components/results/StrainBadge'
import { InsightCard, ActionTile } from '@/components/results/Cards'
import { SectionHeader } from '@/components/results/SectionHeader'
import { CTASection } from '@/components/results/CTASection'
import { QuizAnswers } from '@/components/QuizResults'
import { fetchGoalMappings, mapGoalsToBuckets, GoalMappingRecord } from '@/utils/goals'
import { fetchContentBlocks, ContentBlock } from '@/utils/content'
import { getStrainLevel } from '@/utils/strain'
import { mapSymptomsToKeys, mapKeysToLabels } from '@/utils/symptoms'
import { useEffect, useState } from 'react'

type StrainVariant = 'stable' | 'pressure' | 'attention'

export interface ResultsPageData {
  lifeStageLabel: string
  contextBlock: string
  strainVariant: StrainVariant
  strainLevelLabel: string
  strainBlock: string
  focusInsight1: string
  focusInsight2?: string
  symptomAddon1?: string
  symptomAddon2?: string
  tileNutrition: string
  tileSleep: string
  tileMovement: string
  ctaBlock: string
}

function generateResultsData(answers: QuizAnswers): ResultsPageData {
  let strainScore = 0

  if (answers.energy === 'I crash in the afternoon') strainScore += 1
  else if (answers.energy === 'I feel tired most days' || answers.energy === 'I feel wired but exhausted') strainScore += 2

  if (answers.sleep === '6–7 hours, light sleep') strainScore += 1
  else if (answers.sleep === 'Less than 6 hours' || answers.sleep === 'I wake up often') strainScore += 2

  if (answers.stress === 'Moderate') strainScore += 1
  else if (answers.stress === 'High' || answers.stress === 'Constantly overwhelmed') strainScore += 2

  let strainVariant: StrainVariant
  let strainLabel: string
  let strainDescription: string

  if (strainScore <= 2) {
    strainVariant = 'stable'
    strainLabel = 'Stable'
    strainDescription = 'Your body is managing relatively well overall. Continue with your current approach and focus on maintaining balance.'
  } else if (strainScore <= 4) {
    strainVariant = 'pressure'
    strainLabel = 'Under Pressure'
    strainDescription = 'Your system is showing signs of strain. Small targeted changes to your sleep, nutrition and stress management could make a meaningful difference.'
  } else {
    strainVariant = 'attention'
    strainLabel = 'Needs Attention'
    strainDescription = 'Your body is signaling that it needs support. Prioritizing rest, stress reduction and foundational nutrition is essential right now.'
  }

  const contextBlock = `You're in the ${answers.lifeStage.toLowerCase()} phase, which naturally brings shifts in hormone patterns, energy and nutritional needs. Understanding these changes helps you work with your body, not against it.`

  let focusInsight1 = ''
  let focusInsight2: string | undefined

  if (answers.stress === 'High' || answers.stress === 'Constantly overwhelmed') {
    focusInsight1 = `Your stress levels are significantly impacting your wellbeing. During ${answers.lifeStage.toLowerCase()}, elevated stress can disrupt hormone balance, amplify symptoms, and affect sleep quality. Your body needs support to restore its natural resilience.`
  } else if (answers.sleep !== '7–8 hours, good quality') {
    focusInsight1 = `Sleep quality is foundational for hormone regulation and recovery. Your current sleep pattern may be contributing to fatigue, mood changes, and reduced capacity to handle stress. Improving sleep could create a positive ripple effect across other symptoms.`
  } else {
    focusInsight1 = `Your energy patterns suggest your body may benefit from more stable blood sugar throughout the day. Supporting consistent energy through nutrition timing and quality can help balance hormones and improve overall resilience.`
  }

  const displaySymptoms = mapKeysToLabels(answers.symptoms || [])
  if (displaySymptoms.length > 2 && !displaySymptoms.includes('None of these')) {
    focusInsight2 = `The combination of symptoms you're experiencing—including ${displaySymptoms.slice(0, 2).join(' and ')}—often signals underlying patterns in nutrition, stress response, or hormone balance. Addressing root causes can help resolve multiple symptoms simultaneously.`
  }

  let symptomAddon1: string | undefined
  let symptomAddon2: string | undefined

  if (displaySymptoms.includes('Bloating')) {
    symptomAddon1 = 'Bloating can indicate digestive stress, food sensitivities, or hormonal shifts affecting gut motility. Supporting gut health through mindful eating, probiotics, and reducing inflammatory foods may help.'
  }
  if (displaySymptoms.includes('Brain fog')) {
    const brainFogText = 'Brain fog often relates to blood sugar imbalances, sleep quality, or hormonal fluctuations. Omega-3 fats, B vitamins, and consistent meal timing can support mental clarity.'
    if (!symptomAddon1) symptomAddon1 = brainFogText
    else symptomAddon2 = brainFogText
  }

  const tileNutrition = `• Focus on protein with every meal to stabilise blood sugar\n• Include anti-inflammatory foods: leafy greens, berries, omega-3 rich fish\n• Consider key nutrients for ${answers.lifeStage.toLowerCase()}: iron, B vitamins, magnesium`

  const tileSleep = answers.sleep !== '7–8 hours, good quality'
    ? `• Establish a consistent bedtime routine and wake time\n• Limit screen exposure 1–2 hours before bed\n• Create a cool, dark sleep environment\n• Consider magnesium supplementation for sleep quality`
    : `• Maintain your consistent sleep schedule\n• Continue creating optimal sleep conditions\n• Consider tracking sleep patterns to identify any disruptions`

  const tileMovement = strainScore >= 5
    ? `• Prioritise gentle movement: walking, yoga, stretching\n• Avoid high-intensity exercise until resilience improves\n• Focus on stress-reducing activities like breathwork`
    : `• Aim for 30 minutes of moderate movement daily\n• Include strength training 2–3× per week\n• Balance activity with adequate rest and recovery`

  const ctaBlock = `Ready to take the next step? Unlock your complete personalised health plan with detailed guidance, meal suggestions, and ongoing support tailored to your unique needs.`

  return {
    lifeStageLabel: answers.lifeStage,
    contextBlock,
    strainVariant,
    strainLevelLabel: strainLabel,
    strainBlock: strainDescription,
    focusInsight1,
    focusInsight2,
    symptomAddon1,
    symptomAddon2,
    tileNutrition,
    tileSleep,
    tileMovement,
    ctaBlock,
  }
}

interface Props {
  answers: QuizAnswers
  onUnlock: () => void
  onDownload: () => void
  onStartOver: () => void
}

export function ResultsLandingPage({ answers, onUnlock, onDownload, onStartOver }: Props) {
  const [focusBuckets, setFocusBuckets] = useState<string[] | null>(null)
  const [primaryBucket, setPrimaryBucket] = useState<string | null>(null)
  const [contentOverrides, setContentOverrides] = useState<{
    context?: string | null
    strain?: string | null
    focusInsights?: string[]
    symptomAddons?: string[]
    tileNutrition?: string | null
    tileSleep?: string | null
    tileMovement?: string | null
    cta?: string | null
  }>({})
  const [isContentLoading, setIsContentLoading] = useState(false)
  const [assembledResponse, setAssembledResponse] = useState<any | null>(null)

  useEffect(() => {
    let mounted = true
    async function loadMappings() {
      try {
        setIsContentLoading(true)
        const serverBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
        const records: GoalMappingRecord[] = await fetchGoalMappings(answers.lifeStage, answers.healthFocus, serverBase)
        const mapped = mapGoalsToBuckets(answers.lifeStage, answers.healthFocus, records)
        if (!mounted) return
        setFocusBuckets(mapped.focusBuckets)
        setPrimaryBucket(mapped.primaryFocusBucket)
      } catch (err) {
        // silent fail for now; UI should still render
        console.error('Failed fetching goal mappings', err)
      }
    }
    loadMappings()
    return () => {
      mounted = false
    }
  }, [answers.lifeStage, answers.healthFocus])

  // Fetch content blocks and pick the right blocks per rules
  useEffect(() => {
    let mounted = true
    async function loadContent() {
      try {
        const serverBase = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
        // fetch a reduced set of block types
        const records: ContentBlock[] = await fetchContentBlocks(undefined, serverBase)

        // helper finders
        const findExact = (type: string, field: keyof ContentBlock, value?: string | null) => {
          if (!value) return undefined
          return records.find(r => r.Block_Type === type && r[field] === value)
        }

        // inputs
        const lifeStage = answers.lifeStage
        const ageBand = answers.ageRange
        const strain = getStrainLevel(answers.energy, answers.sleep, answers.stress)
        const strainLabel = strain ? strain.label : null

        // A) Context
        let contextBlock = records.find(r => r.Block_Type === 'context' && r.Life_Stage === lifeStage && r.Age_Band === ageBand)
        if (!contextBlock) contextBlock = records.find(r => r.Block_Type === 'context' && r.Life_Stage === lifeStage)

        // B) Strain
        const strainBlock = strainLabel ? records.find(r => r.Block_Type === 'strain' && r.Strain_Level === strainLabel) : undefined

        // C) Focus insights (primary then second)
        const fbuckets = focusBuckets ?? []
        const focusInsights: string[] = []
        for (let i = 0; i < fbuckets.length && focusInsights.length < 2; i++) {
          const b = fbuckets[i]
          const found = records.find(r => r.Block_Type === 'focus_insight' && r.Focus_Bucket === b)
          if (found && found.Copy) focusInsights.push(found.Copy)
        }

        // D) Symptom addons (in user order)
        const symptomAddons: string[] = []
        const symptomKeys = mapSymptomsToKeys(answers.symptoms)
        for (let i = 0; i < symptomKeys.length && symptomAddons.length < 2; i++) {
          const sKey = symptomKeys[i]
          const found = records.find(r => r.Block_Type === 'symptom_addon' && r.Symptom && r.Symptom.toLowerCase() === sKey.toLowerCase())
          if (found && found.Copy) symptomAddons.push(found.Copy)
        }

        // E) Tiles (nutrition, sleep, movement) based on primaryBucket
        let tileNutrition = primaryBucket ? records.find(r => r.Block_Type === 'tile_nutrition' && r.Focus_Bucket === primaryBucket) : undefined
        let tileSleep = primaryBucket ? records.find(r => r.Block_Type === 'tile_sleep' && r.Focus_Bucket === primaryBucket) : undefined
        let tileMovement = primaryBucket ? records.find(r => r.Block_Type === 'tile_movement' && r.Focus_Bucket === primaryBucket) : undefined
        // fallbacks: any tile of that type
        if (!tileNutrition) tileNutrition = records.find(r => r.Block_Type === 'tile_nutrition')
        if (!tileSleep) tileSleep = records.find(r => r.Block_Type === 'tile_sleep')
        if (!tileMovement) tileMovement = records.find(r => r.Block_Type === 'tile_movement')

        // F) CTA
        let cta = records.find(r => r.Block_Type === 'cta' && r.Life_Stage === lifeStage)
        if (!cta) cta = records.find(r => r.Block_Type === 'cta')

        if (!mounted) return
        const overrides = {
          context: contextBlock?.Copy ?? null,
          strain: strainBlock?.Copy ?? null,
          focusInsights,
          symptomAddons,
          tileNutrition: tileNutrition?.Copy ?? null,
          tileSleep: tileSleep?.Copy ?? null,
          tileMovement: tileMovement?.Copy ?? null,
          cta: cta?.Copy ?? null,
        }

        // Build structured assembled response for consistent frontend rendering
        const meta = {
          ageBand: ageBand ?? null,
          lifeStage,
          goals: answers.healthFocus,
          focusBuckets: fbuckets,
          primaryFocusBucket: primaryBucket,
          strainLevel: strainLabel ? (strainLabel.toLowerCase() === 'red' ? 'red' : (strainLabel.toLowerCase() === 'amber' ? 'amber' : 'green')) : null,
          symptoms: mapSymptomsToKeys(answers.symptoms),
        }

        const blocks = {
          context: contextBlock ? { blockId: contextBlock.Block_ID ?? null, copy: contextBlock.Copy ?? null } : null,
          strain: strainBlock ? { blockId: strainBlock.Block_ID ?? null, copy: strainBlock.Copy ?? null } : null,
          focusInsights: focusInsights.map((c, i) => {
            const found = records.find(r => r.Block_Type === 'focus_insight' && r.Copy === c)
            return { blockId: found?.Block_ID ?? null, copy: c }
          }),
          symptomAddons: symptomAddons.map((c, i) => {
            const found = records.find(r => r.Block_Type === 'symptom_addon' && r.Copy === c)
            return { blockId: found?.Block_ID ?? null, copy: c }
          }),
          tiles: {
            nutrition: tileNutrition ? { blockId: tileNutrition.Block_ID ?? null, copy: tileNutrition.Copy ?? null } : null,
            sleep: tileSleep ? { blockId: tileSleep.Block_ID ?? null, copy: tileSleep.Copy ?? null } : null,
            movement: tileMovement ? { blockId: tileMovement.Block_ID ?? null, copy: tileMovement.Copy ?? null } : null,
          },
          cta: cta ? { blockId: cta.Block_ID ?? null, copy: cta.Copy ?? null } : null,
        }

        setContentOverrides(overrides)
        setAssembledResponse({ meta, blocks })
        setIsContentLoading(false)
      } catch (err) {
        console.error('Failed fetching content blocks', err)
        setIsContentLoading(false)
      }
    }
    loadContent()
    return () => {
      mounted = false
    }
  }, [answers, focusBuckets, primaryBucket])

  const data = generateResultsData(answers)
  const hasSymptomInsights = data.symptomAddon1 || data.symptomAddon2

  return (
    <div id="snapshot-root" className="min-h-screen bg-gradient-to-br from-amber-50 via-rose-50 to-emerald-50 px-4 py-12 relative">
      {/* Logo */}
      <div className="absolute top-6 left-6 z-20">
        <img src={logo} alt="Blissmi" className="h-12 md:h-16" />
      </div>

      {/* Start Over */}
      <button
        onClick={onStartOver}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-rose-500 transition-colors duration-200 text-sm md:text-base"
      >
        <span className="hidden sm:inline">Start Over</span>
        <span className="sm:hidden">Restart</span>
      </button>

      <div className="max-w-4xl mx-auto pt-16 space-y-8">

        {/* 1. Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl md:text-5xl font-light text-neutral-800 mb-4">Your Personal Health Snapshot</h1>
          <p className="text-xl text-rose-500 font-medium mb-2">{data.lifeStageLabel}</p>
          <p className="text-sm text-neutral-500">Based on your age, goals and lifestyle inputs.</p>
            {primaryBucket && (
              <p className="text-sm text-neutral-500 mt-2">Primary focus: <span className="text-rose-600 font-medium">{primaryBucket}</span></p>
            )}
            {/* loading spinner removed per request */}
        </motion.div>

        {/* 2. Context card */}
        <InsightCard title="Life Stage Insight" content={contentOverrides.context ?? data.contextBlock} variant="default" />

        {/* 3. Strain status */}
        <StrainBadge
          variant={data.strainVariant}
          label={data.strainLevelLabel}
          description={contentOverrides.strain ?? data.strainBlock}
        />

        {/* 4. What may be happening */}
        <div>
          <SectionHeader title="What May Be Influencing Your Symptoms" />
          <div className="space-y-4">
            {contentOverrides.focusInsights && contentOverrides.focusInsights.length > 0 ? (
              contentOverrides.focusInsights.map((c, i) => <InsightCard key={i} title={i === 0 ? 'Key Pattern' : 'Additional Factor'} content={c} />)
            ) : (
              <>
                <InsightCard title="Key Pattern" content={data.focusInsight1} />
                {data.focusInsight2 && <InsightCard title="Additional Factor" content={data.focusInsight2} />}
              </>
            )}
          </div>
        </div>

        {/* 5. Symptom insights (conditional) */}
        {hasSymptomInsights && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.5 }}>
            <SectionHeader title="Additional Insight" />
            <div className="space-y-4">
              {contentOverrides.symptomAddons && contentOverrides.symptomAddons.length > 0 ? (
                contentOverrides.symptomAddons.map((c, i) => <InsightCard key={i} title={i === 0 ? 'Symptom Connection' : 'Related Factor'} content={c} />)
              ) : (
                <>
                  {data.symptomAddon1 && <InsightCard title="Symptom Connection" content={data.symptomAddon1} />}
                  {data.symptomAddon2 && <InsightCard title="Related Factor" content={data.symptomAddon2} />}
                </>
              )}
            </div>
          </motion.div>
        )}

        {/* 6. Action plan */}
        <div>
          <SectionHeader title="3 Key Focus Areas for You" />
          <div className="grid gap-6 md:grid-cols-3">
            <ActionTile icon={<Heart className="w-8 h-8 text-rose-400" />} category="Nutrition" content={contentOverrides.tileNutrition ?? data.tileNutrition} delay={0} />
            <ActionTile icon={<Moon className="w-8 h-8 text-rose-400" />} category="Sleep & Recovery" content={contentOverrides.tileSleep ?? data.tileSleep} delay={0.1} />
            <ActionTile icon={<Activity className="w-8 h-8 text-rose-400" />} category="Movement" content={contentOverrides.tileMovement ?? data.tileMovement} delay={0.2} />
          </div>
        </div>

        {/* 7. CTA */}
        <CTASection
          headline={contentOverrides.cta ?? data.ctaBlock}
          onPrimaryAction={onUnlock}
          onSecondaryAction={onDownload}
        />
      </div>
    </div>
  )
}

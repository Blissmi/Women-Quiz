export type StrainLevel = {
  score: number
  label: string
  color: string
  bg: string
  emoji: string
}

// Compute deterministic strain score from the three answers.
export function computeStrainScore(energy?: string, sleep?: string, stress?: string): number | null {
  if (!energy || !sleep || !stress) return null
  let score = 0

  // energy
  if (energy === 'I crash in the afternoon') score += 1
  else if (energy === 'I feel tired most days' || energy === 'I feel wired but exhausted') score += 2

  // sleep
  if (sleep === '6–7 hours, light sleep') score += 1
  else if (sleep === 'Less than 6 hours' || sleep === 'I wake up often') score += 2

  // stress
  if (stress === 'Moderate') score += 1
  else if (stress === 'High' || stress === 'Constantly overwhelmed') score += 2

  return score
}

// Map numeric score to labeled strain level
export function strainLevelFromScore(score: number): StrainLevel {
  if (score <= 2)
    return { score, label: 'Stable', color: 'text-emerald-600', bg: 'bg-emerald-100', emoji: '🟢' }
  if (score <= 4)
    return { score, label: 'Under Pressure', color: 'text-amber-600', bg: 'bg-amber-100', emoji: '🟡' }
  return { score, label: 'Needs Attention', color: 'text-rose-600', bg: 'bg-rose-100', emoji: '🔴' }
}

// Helper to compute the full level object from answers (returns null if incomplete)
export function getStrainLevel(energy?: string, sleep?: string, stress?: string): StrainLevel | null {
  const score = computeStrainScore(energy, sleep, stress)
  if (score === null) return null
  return strainLevelFromScore(score)
}

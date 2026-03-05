export type AgeBand =
  | '18_24'
  | '25_34'
  | '35_39'
  | '40_44'
  | '45_49'
  | '50_54'
  | '55_64'
  | '65_plus'

export type LifeStage =
  | 'menstrual'
  | 'fertility'
  | 'postpartum'
  | 'perimenopause'
  | 'menopause'

// Recommended allowed stages per age band
export const GUARDRAILS: Record<AgeBand, LifeStage[]> = {
  '18_24': ['menstrual', 'fertility', 'postpartum'],
  '25_34': ['menstrual', 'fertility', 'postpartum'],
  '35_39': ['menstrual', 'fertility', 'postpartum', 'perimenopause'],
  '40_44': ['menstrual', 'fertility', 'postpartum', 'perimenopause', 'menopause'],
  '45_49': ['menstrual', 'fertility', 'postpartum', 'perimenopause', 'menopause'],
  '50_54': ['perimenopause', 'menopause'],
  '55_64': ['menopause'],
  '65_plus': ['menopause'],
}

// Validate a combo. Returns { valid, corrected? }
export function validateCombo(ageBand: AgeBand, stage: LifeStage) {
  const allowed = GUARDRAILS[ageBand]
  const valid = allowed.includes(stage)

  if (valid) return { valid }

  // Frontend choice: suggest nearest valid stage (first allowed). Backend should prefer returning an error.
  return { valid: false, corrected: allowed[0] }
}

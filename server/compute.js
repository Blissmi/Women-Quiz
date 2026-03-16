// Helper to compute strain level + label from answers/input fields
function calculateStrainLevelFromInputs({ energy, sleep, stress }) {
  const energyMap = {
    'I crash in the afternoon': 1,
    'I feel tired most days': 2,
    'I feel wired but exhausted': 2,
    'High and steady': 0,
  }
  const sleepMap = {
    '7–8 hours, good quality': 0,
    '6–7 hours, light sleep': 1,
    'Less than 6 hours': 2,
    'I wake up often': 2,
  }
  const stressMap = {
    'Low': 0,
    'Moderate': 1,
    'High': 2,
    'Constantly overwhelmed': 2,
  }

  const e = energyMap[energy] || 0
  const s = sleepMap[sleep] || 0
  const t = stressMap[stress] || 0
  const total = e + s + t
  if (total <= 2) return 'green'
  if (total <= 4) return 'amber'
  return 'red'
}

function computeResultFromPayload(payload) {
  // payload may have answers array/object or top-level fields
  try {
    let answersObj = {}
    if (payload.answers && !Array.isArray(payload.answers) && typeof payload.answers === 'object') {
      answersObj = payload.answers
    } else if (Array.isArray(payload.answers)) {
      payload.answers.forEach(a => {
        if (a && a.q) answersObj[a.q] = a.a
      })
    } else if (payload.answers && typeof payload.answers === 'string') {
      // try parse
      try { answersObj = JSON.parse(payload.answers) } catch (e) { answersObj = {} }
    }

    // prefer top-level fields
    const energy = payload.energy || answersObj.energy || answersObj.Energy || null
    const sleep = payload.sleep || answersObj.sleep || answersObj.Sleep || null
    const stress = payload.stress || answersObj.stress || answersObj.Stress || null
    const lifeStage = payload.lifeStage || payload.stage || answersObj.lifeStage || answersObj.life_stage || null

    if (!energy && !sleep && !stress) return null

    const strainLevel = calculateStrainLevelFromInputs({ energy, sleep, stress })
    const strainLabel = strainLevel === 'green' ? 'Stable' : (strainLevel === 'amber' ? 'Under Pressure' : 'Needs Attention')

    return {
      inputs: { lifeStage, energy, sleep, stress },
      strainLevel,
      strainLabel,
    }
  } catch (e) {
    return null
  }
}

module.exports = { computeResultFromPayload }

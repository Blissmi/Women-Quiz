// Map user-facing symptom labels to Airtable symptom keys
export const SYMPTOM_LABEL_TO_KEY: Record<string, string> = {
  'Bloating': 'bloating',
  'Brain fog': 'brain_fog',
  'Mood swings': 'mood_swings',
  'Weight gain': 'weight_gain',
  'None of these': 'none',
}

export function symptomKeyFromLabel(label: string): string {
  return SYMPTOM_LABEL_TO_KEY[label] ?? label.toLowerCase().replace(/\s+/g, '_')
}

export function mapSymptomsToKeys(labels: string[]): string[] {
  return labels.map(symptomKeyFromLabel).filter(Boolean)
}

// Reverse mapping: if you have keys stored, convert back to display labels
export const KEY_TO_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(SYMPTOM_LABEL_TO_KEY).map(([label, key]) => [key, label])
)

export function symptomLabelFromKey(key: string): string {
  return KEY_TO_LABEL[key] ?? key.replace(/_/g, ' ')
}

export function mapKeysToLabels(keys: string[]): string[] {
  return keys.map(symptomLabelFromKey)
}

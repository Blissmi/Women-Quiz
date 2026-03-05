export type GoalMappingRecord = {
  Goal_Label: string
  Life_Stage: string
  Primary_Focus_Bucket: string
  Secondary_Focus_Bucket?: string | null
}

export type GoalsToBucketsResult = {
  focusBuckets: string[] // unique, 1-2 items max, preserving user goal order
  primaryFocusBucket: string | null
}

/**
 * Map user-selected goals to focus buckets.
 * - `records` should be the Goal_Mapping rows fetched from Airtable filtered by life stage
 * - Maintains the order of `goals` (goal[0] is primary)
 * - Deduplicates buckets when both goals map to the same bucket
 */
export function mapGoalsToBuckets(lifeStage: string, goals: string[], records: GoalMappingRecord[]): GoalsToBucketsResult {
  if (!goals || goals.length === 0) return { focusBuckets: [], primaryFocusBucket: null }

  const buckets: string[] = []

  for (let i = 0; i < goals.length && buckets.length < 2; i++) {
    const goalLabel = goals[i]
    const rec = records.find(r => r.Life_Stage === lifeStage && r.Goal_Label === goalLabel)
    if (!rec) continue
    const primary = rec.Primary_Focus_Bucket
    if (!primary) continue
    if (!buckets.includes(primary)) buckets.push(primary)
  }

  return { focusBuckets: buckets, primaryFocusBucket: buckets.length > 0 ? buckets[0] : null }
}

export default mapGoalsToBuckets

// --- Fetch helper to call local Airtable helper server and return mappings ---
export async function fetchGoalMappings(lifeStage: string, goals: string[], serverBaseUrl = ''): Promise<GoalMappingRecord[]> {
  // serverBaseUrl defaults to empty (same origin). If running dev with helper server, set to e.g. http://localhost:4000
  const params = new URLSearchParams()
  if (lifeStage) params.append('lifeStage', lifeStage)
  if (goals && goals.length) params.append('goals', goals.join(','))

  const url = `${serverBaseUrl}/api/goal-mapping?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch goal mappings: ${res.statusText}`)
  const data = await res.json()
  // data.records is expected to be an array of field objects
  return data.records || []
}


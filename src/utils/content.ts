export type ContentBlock = {
  Block_ID?: string
  Block_Type?: string
  Life_Stage?: string | null
  Age_Band?: string | null
  Focus_Bucket?: string | null
  Strain_Level?: string | null
  Symptom?: string | null
  Copy?: string
  Active?: boolean
}

type FetchOpts = {
  lifeStage?: string
  ageBand?: string
  focusBuckets?: string[]
  strainLevel?: string
  symptoms?: string[]
  blockTypes?: string[]
  serverBaseUrl?: string
}

const DEFAULT_BLOCK_TYPES = [
  'context',
  'strain',
  'focus_insight',
  'tile_nutrition',
  'tile_sleep',
  'tile_movement',
  'symptom_addon',
  'cta',
]

export async function fetchContentBlocks(blockTypes: string[] = DEFAULT_BLOCK_TYPES, serverBaseUrl = ''): Promise<ContentBlock[]> {
  const params = new URLSearchParams()
  if (blockTypes && blockTypes.length) params.append('blockTypes', blockTypes.join(','))
  const base = (serverBaseUrl || '').replace(/\/$/, '')
  const url = `${base}/api/content-blocks?${params.toString()}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch content blocks: ${res.statusText}`)
  const data = await res.json()
  return data.records || []
}

// Fetch a reduced set of blocks from server (by blockTypes) then apply local filtering.
export async function fetchAndFilterContentBlocks(opts: FetchOpts = {}): Promise<ContentBlock[]> {
  const serverBase = (opts.serverBaseUrl ?? (import.meta.env.VITE_API_BASE || '')).replace(/\/$/, '')
  const blockTypes = opts.blockTypes ?? DEFAULT_BLOCK_TYPES
  const records = await fetchContentBlocks(blockTypes, serverBase)

  // local filtering helper: treat missing/null fields as wildcard (i.e., include)
  return records.filter((r: ContentBlock) => {
    if (!r.Active) return false
    if (opts.lifeStage && r.Life_Stage && r.Life_Stage !== opts.lifeStage) return false
    if (opts.ageBand && r.Age_Band && r.Age_Band !== opts.ageBand) return false
    if (opts.focusBuckets && opts.focusBuckets.length && r.Focus_Bucket && !opts.focusBuckets.includes(r.Focus_Bucket)) return false
    if (opts.strainLevel && r.Strain_Level && r.Strain_Level !== opts.strainLevel) return false
    if (opts.symptoms && opts.symptoms.length) {
      // if block has a Symptom field, require it to be in selected symptoms
      if (r.Symptom && !opts.symptoms.includes(r.Symptom)) return false
    }
    return true
  })
}

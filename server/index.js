require('dotenv').config()
const express = require('express')
const Airtable = require('airtable')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
app.use(cors())
app.use(express.json())

const API_KEY = process.env.AIRTABLE_API_KEY
const BASE_ID = process.env.AIRTABLE_BASE_ID
const CONTENT_VERSION = process.env.CONTENT_VERSION || 'v1'
const STRICT_GOAL_MATCH = (process.env.STRICT_GOAL_MATCH || 'false').toLowerCase() === 'true'

if (!API_KEY || !BASE_ID) {
  console.error('Missing AIRTABLE_API_KEY or AIRTABLE_BASE_ID environment variables')
  process.exit(1)
}

const base = new Airtable({ apiKey: API_KEY }).base(BASE_ID)

// Cache of table field names to avoid making repeated metadata requests
const tableFieldsCache = new Map()

async function getTableFields(tableName) {
  const cached = tableFieldsCache.get(tableName)
  if (cached) return cached
  try {
    const pages = await base(tableName).select({ maxRecords: 1 }).firstPage()
    if (pages && pages.length) {
      const fields = Object.keys(pages[0].fields || {})
      tableFieldsCache.set(tableName, fields)
      return fields
    }
  } catch (e) {
    // ignore and fall back to optimistic behavior
    // Only print debug info when explicitly enabled to avoid noisy logs in normal runs
    if ((process.env.DEBUG || '').toLowerCase() === 'true') {
      console.debug('Failed to fetch table fields for', tableName, e && e.message ? e.message : e)
    }
  }
  tableFieldsCache.set(tableName, [])
  return []
}

// Cache: prefer Redis if configured, otherwise fallback to simple in-memory cache
const Redis = require('ioredis')
const REDIS_URL = process.env.REDIS_URL || null
let redisClient = null
if (REDIS_URL) {
  redisClient = new Redis(REDIS_URL)
  redisClient.on('error', e => console.error('Redis error', e))
}

const CACHE_TTL_MS = 1000 * 60 * 5 // 5 minutes
const cache = new Map()

// Simple guardrails copied from frontend to validate ageBand vs lifeStage
const GUARDRAILS = {
  '18_24': ['menstrual', 'fertility', 'postpartum'],
  '25_34': ['menstrual', 'fertility', 'postpartum'],
  '35_39': ['menstrual', 'fertility', 'postpartum', 'perimenopause'],
  '40_44': ['menstrual', 'fertility', 'postpartum', 'perimenopause', 'menopause'],
  '45_49': ['menstrual', 'fertility', 'postpartum', 'perimenopause', 'menopause'],
  '50_54': ['perimenopause', 'menopause'],
  '55_64': ['menopause'],
  '65_plus': ['menopause'],
}

// Symptom mapping (same as frontend utils)
const SYMPTOM_LABEL_TO_KEY = {
  'Bloating': 'bloating',
  'Brain fog': 'brain_fog',
  'Mood swings': 'mood_swings',
  'Weight gain': 'weight_gain',
  'None of these': 'none',
}
function symptomKeyFromLabel(label) {
  if (!label) return ''
  return SYMPTOM_LABEL_TO_KEY[label] || label.toLowerCase().replace(/\s+/g, '_')
}

async function cacheGet(key) {
  if (redisClient) {
    try {
      const raw = await redisClient.get(key)
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      console.error('Redis get error', e)
      // fall through to in-memory
    }
  }

  const entry = cache.get(key)
  if (!entry) return null
  const { ts, value } = entry
  if (Date.now() - ts > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return value
}

async function cacheSet(key, value) {
  if (redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'PX', CACHE_TTL_MS)
      return
    } catch (e) {
      console.error('Redis set error', e)
      // fall back to in-memory
    }
  }
  cache.set(key, { ts: Date.now(), value })
}

// Helper to fetch records from Airtable with retries/backoff for transient network errors
// `fields` optional array restricts returned fields to reduce payload
async function fetchAirtableRecords(tableName, filterFormula, fields) {
  const maxAttempts = 3
  let attempt = 0
  let triedRemovingVersion = false
  // Pre-check: if the filter mentions {Version} but the table doesn't have that field,
  // strip it before making requests to avoid Airtable INVALID_FILTER_BY_FORMULA errors.
  if (filterFormula && /\{\s*version\s*\}/i.test(filterFormula)) {
    try {
      const fields = await getTableFields(tableName)
      const hasVersion = fields.some(f => typeof f === 'string' && f.toLowerCase() === 'version')
      if (!hasVersion) {
        // remove the version clause proactively
        if (filterFormula.startsWith('AND(') && filterFormula.endsWith(')')) {
          const inner = filterFormula.slice(4, -1)
          const parts = inner.split(/,/) // split on commas between clauses
          const filtered = parts.filter(p => !/\{\s*version\s*\}/i.test(p)).map(p => p.trim()).filter(Boolean)
          if (filtered.length === 0) {
            filterFormula = undefined
          } else if (filtered.length === 1) {
            filterFormula = filtered[0]
          } else {
            filterFormula = `AND(${filtered.join(',')})`
          }
        } else {
          if (/\{\s*version\s*\}/i.test(filterFormula)) filterFormula = undefined
        }
        console.warn('Stripped Version clause before fetch for', tableName)
      }
    } catch (e) {
      // ignore: we'll let the normal retry logic handle failures
    }
  }

  while (attempt < maxAttempts) {
    attempt++
    try {
      const records = []
      const selectOptions = {}
      if (filterFormula) selectOptions.filterByFormula = filterFormula
      if (fields && Array.isArray(fields) && fields.length) selectOptions.fields = fields

      console.log(`Airtable fetch attempt ${attempt} for ${tableName} with filter: ${filterFormula || '<none>'} fields: ${fields && fields.length ? fields.join(',') : '<all>'}`)

      await base(tableName).select(selectOptions).eachPage((pageRecords, fetchNextPage) => {
        pageRecords.forEach(r => records.push(r.fields))
        fetchNextPage()
      })

      return records
    } catch (err) {
      console.error(`Airtable fetch error (attempt ${attempt}) for ${tableName}:`, err && err.stack ? err.stack : err)
      // If the filterFormula contains a Version clause, try again without it
      // (some bases may not have the Version field). Do this aggressively on first error.
      if (!triedRemovingVersion && filterFormula && /\{\s*version\s*\}/i.test(filterFormula)) {
        triedRemovingVersion = true
        try {
          // attempt to remove the Version clause from an AND(...) formula
          if (filterFormula.startsWith('AND(') && filterFormula.endsWith(')')) {
            const inner = filterFormula.slice(4, -1)
            const parts = inner.split(/,/) // split on commas between clauses
            const filtered = parts.filter(p => !/\{\s*version\s*\}/i.test(p)).map(p => p.trim()).filter(Boolean)
            if (filtered.length === 0) {
              filterFormula = undefined
            } else if (filtered.length === 1) {
              filterFormula = filtered[0]
            } else {
              filterFormula = `AND(${filtered.join(',')})`
            }
          } else {
            // fallback: if Version appears anywhere, drop the whole formula
            if (/\{\s*version\s*\}/i.test(filterFormula)) filterFormula = undefined
          }
          console.warn('Retrying Airtable fetch without Version filter for', tableName)
        } catch (innerErr) {
          console.error('Failed to strip Version from filterFormula', innerErr)
        }
        const backoffMs = 500 * attempt
        await new Promise(r => setTimeout(r, backoffMs))
        continue
      }
      // If we still have a filter and we failed for any reason, retry once without any filters.
      if (!triedRemovingVersion && filterFormula) {
        triedRemovingVersion = true
        console.warn('Retrying Airtable fetch without any filters for', tableName)
        filterFormula = undefined
        const backoffMs = 500 * attempt
        await new Promise(r => setTimeout(r, backoffMs))
        continue
      }
      if (attempt >= maxAttempts) throw err
      const backoffMs = 500 * attempt
      await new Promise(r => setTimeout(r, backoffMs))
    }
  }
}

// Helper to build an OR(...) formula for matching Goal_Label in a list
function orEquals(field, values) {
  if (!values || values.length === 0) return ''
  return `OR(${values.map(v => `{${field}}='${v.replace(/'/g, "\\'")}'`).join(',')})`
}

// GET /api/goal-mapping?lifeStage=...&goals=goal1,goal2
app.get('/api/goal-mapping', async (req, res) => {
  try {
    const lifeStage = req.query.lifeStage
    const goals = req.query.goals ? req.query.goals.split(',').map(s => s.trim()).filter(Boolean) : []

    // Enforce max 2 goals
    if (goals.length > 2) {
      return res.status(400).json({ error: 'At most 2 goals are allowed' })
    }

    // Only ask Airtable to filter by life stage (reduces payload). We'll apply
    // tolerant goal matching locally (case-insensitive substring/word match).
    const filters = []
    if (lifeStage) filters.push(`{Life_Stage}='${lifeStage.replace(/'/g, "\\'")}'`)
    if (CONTENT_VERSION) filters.push(`{Version}='${CONTENT_VERSION.replace(/'/g, "\\'")}'`)
    const filterFormula = filters.length ? `AND(${filters.join(',')})` : undefined

    const cacheKey = `goal-mapping:${lifeStage || 'all'}:${goals.length ? goals.join('|') : 'all'}`
    const cached = await cacheGet(cacheKey)
    if (cached) return res.json({ records: cached })

    // request only fields we need from Goal_Mapping to reduce payload
    let records = await fetchAirtableRecords('Goal_Mapping', filterFormula, ['Goal_Label', 'Primary_Focus_Bucket', 'Life_Stage'])

    if (goals.length) {
      if (STRICT_GOAL_MATCH) {
        // exact match only
        const goalsSet = new Set(goals.map(g => g.toLowerCase()))
        records = records.filter(r => goalsSet.has((r.Goal_Label || '').toLowerCase()))
        await cacheSet(cacheKey, records)
        return res.json({ records })
      }
      // Build expanded goal tokens including synonyms
      const synonymMap = {
        'weight management': ['lose weight', 'weight loss', 'baby weight', 'lose baby weight', 'weight management'],
        'energy': ['energy', 'fatigue', 'tired', 'steady energy'],
        'sleep': ['sleep', 'improve sleep', 'sleep quality'],
        'stress': ['stress', 'stress reduction', 'anxiety', 'emotional balance'],
        'fertility': ['fertility', 'ovulate', 'pregnancy', 'try to conceive'],
      }

      const goalsLower = goals.map(g => g.toLowerCase())
      // Expand goals with synonyms where available
      const expandedGoals = new Set()
      for (const g of goalsLower) {
        expandedGoals.add(g)
        const syn = synonymMap[g]
        if (syn && syn.length) syn.forEach(s => expandedGoals.add(s))
      }

      const expandedArray = Array.from(expandedGoals)

      // Levenshtein distance for fuzzy matching
      function levenshtein(a, b) {
        if (!a.length) return b.length
        if (!b.length) return a.length
        const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j
        for (let i = 1; i <= a.length; i++) {
          for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + cost
            )
          }
        }
        return matrix[a.length][b.length]
      }

      const matchesGoal = (label = '') => {
        const lbl = (label || '').toLowerCase()
        // direct substring or word match
        for (const g of expandedArray) {
          if (!g) continue
          if (lbl.includes(g)) return true
          const gWords = g.split(/\W+/).filter(Boolean)
          const lblWords = lbl.split(/\W+/).filter(Boolean)
          if (gWords.some(w => lblWords.includes(w))) return true
        }

        // fuzzy match via normalized Levenshtein distance
        for (const g of expandedArray) {
          const maxLen = Math.max(g.length, lbl.length)
          if (maxLen === 0) continue
          const dist = levenshtein(g, lbl)
          const norm = dist / maxLen
          if (norm <= 0.4) return true
        }

        return false
      }

      records = records.filter(r => matchesGoal(r.Goal_Label || r['Goal_Label'] || ''))
    }

    await cacheSet(cacheKey, records)
    res.json({ records })
  } catch (err) {
    console.error(err && err.stack ? err.stack : err)
    res.status(500).json({ error: String(err) })
  }
})

// GET /api/content-blocks?lifeStage=...&ageBand=...&focusBucket=...&strainLevel=...&symptom=...
app.get('/api/content-blocks', async (req, res) => {
  try {
    const qs = req.query
      const filters = [`{Active}=TRUE()`]
      // allow server to limit by Block_Type set to reduce bandwidth; frontend will do further filtering
      const blockTypes = req.query.blockTypes ? req.query.blockTypes.split(',') : []
      if (blockTypes.length) filters.push(orEquals('Block_Type', blockTypes))
    if (qs.lifeStage) filters.push(`{Life_Stage}='${qs.lifeStage.replace(/'/g, "\\'")}'`)
    if (CONTENT_VERSION) filters.push(`{Version}='${CONTENT_VERSION.replace(/'/g, "\\'")}'`)
    if (qs.ageBand) filters.push(`{Age_Band}='${qs.ageBand.replace(/'/g, "\\'")}'`)
    if (qs.focusBucket) filters.push(`{Focus_Bucket}='${qs.focusBucket.replace(/'/g, "\\'")}'`)
    if (qs.strainLevel) filters.push(`{Strain_Level}='${qs.strainLevel.replace(/'/g, "\\'")}'`)
    if (qs.symptom) filters.push(`{Symptom}='${qs.symptom.replace(/'/g, "\\'")}'`)

    const filterFormula = filters.length ? `AND(${filters.join(',')})` : undefined

    const cacheKey = `content-blocks:${filterFormula || 'all'}`
    const cached = await cacheGet(cacheKey)
    if (cached) return res.json({ records: cached })

    // request only relevant fields from Content_Blocks
    const records = await fetchAirtableRecords('Content_Blocks', filterFormula, ['Block_ID', 'Block_Type', 'Life_Stage', 'Age_Band', 'Focus_Bucket', 'Copy', 'Active', 'Symptom', 'Strain_Level'])

    await cacheSet(cacheKey, records)
    res.json({ records })
  } catch (err) {
    console.error(err && err.stack ? err.stack : err)
    res.status(500).json({ error: String(err) })
  }
})

// Helper: calculate strain level -> green|amber|red
function calculateStrainLevel(energy, sleep, stress) {
  const energyMap = {
    'I crash in the afternoon': 1,
    'I feel tired most days': 2,
    'I feel wired but exhausted': 2,
  }
  const sleepMap = {
    '6–7 hours, light sleep': 1,
    'Less than 6 hours': 2,
    'I wake up often': 2,
  }
  const stressMap = {
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

// POST /api/build-result
app.post('/api/build-result', async (req, res) => {
  try {
    const payload = req.body || {}
    const { ageBand, lifeStage, goals = [], energy, sleep, stress, symptoms = [] } = payload

    // Validate presence
    if (!ageBand || !lifeStage) return res.status(400).json({ error: 'ageBand and lifeStage required' })

    // Validate ageStage combo
    const allowed = GUARDRAILS[ageBand]
    if (!allowed) return res.status(400).json({ error: 'invalid ageBand' })
    if (!allowed.includes(lifeStage)) {
      return res.status(400).json({ error: 'invalid lifeStage for ageBand', corrected: allowed[0] })
    }

    // Enforce goals max 2
    if (!Array.isArray(goals)) return res.status(400).json({ error: 'goals must be an array' })
    if (goals.length > 2) return res.status(400).json({ error: 'At most 2 goals are allowed' })

    // Normalize symptoms: map labels -> keys, respect 'None of these'
    let symptomKeys = (Array.isArray(symptoms) ? symptoms.map(s => symptomKeyFromLabel(s)) : [])
    if (symptomKeys.includes('none')) symptomKeys = []
    symptomKeys = symptomKeys.filter(Boolean).slice(0, 2)

    const strainLevel = calculateStrainLevel(energy, sleep, stress)

    // Fetch goal mappings for lifeStage and apply same matching logic as /api/goal-mapping
    const gmFilters = []
    if (lifeStage) gmFilters.push(`{Life_Stage}='${lifeStage.replace(/'/g, "\\'")}'`)
    if (CONTENT_VERSION) gmFilters.push(`{Version}='${CONTENT_VERSION.replace(/'/g, "\\'")}'`)
    const gmFormula = gmFilters.length ? `AND(${gmFilters.join(',')})` : undefined
    // limit goal mapping fields for this lookup as well
    let goalRecords = await fetchAirtableRecords('Goal_Mapping', gmFormula, ['Goal_Label', 'Primary_Focus_Bucket', 'Life_Stage'])

    // Matching logic (respect STRICT_GOAL_MATCH)
    let matchedGoalRecords = []
    if (goals.length === 0) matchedGoalRecords = []
    else if (STRICT_GOAL_MATCH) {
      const set = new Set(goals.map(g => g.toLowerCase()))
      matchedGoalRecords = goalRecords.filter(r => set.has((r.Goal_Label || '').toLowerCase()))
    } else {
      // use same synonym + fuzzy approach
      const synonymMap = {
        'weight management': ['lose weight', 'weight loss', 'baby weight', 'lose baby weight', 'weight management'],
        'energy': ['energy', 'fatigue', 'tired', 'steady energy'],
        'sleep': ['sleep', 'improve sleep', 'sleep quality'],
        'stress': ['stress', 'stress reduction', 'anxiety', 'emotional balance'],
        'fertility': ['fertility', 'ovulate', 'pregnancy', 'try to conceive'],
      }
      const goalsLower = goals.map(g => g.toLowerCase())
      const expandedGoals = new Set()
      for (const g of goalsLower) {
        expandedGoals.add(g)
        const syn = synonymMap[g]
        if (syn && syn.length) syn.forEach(s => expandedGoals.add(s))
      }
      const expandedArray = Array.from(expandedGoals)

      function levenshtein(a, b) {
        if (!a.length) return b.length
        if (!b.length) return a.length
        const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0))
        for (let i = 0; i <= a.length; i++) matrix[i][0] = i
        for (let j = 0; j <= b.length; j++) matrix[0][j] = j
        for (let i = 1; i <= a.length; i++) {
          for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost)
          }
        }
        return matrix[a.length][b.length]
      }

      const matchesGoal = (label = '') => {
        const lbl = (label || '').toLowerCase()
        for (const g of expandedArray) {
          if (!g) continue
          if (lbl.includes(g)) return true
          const gWords = g.split(/\W+/).filter(Boolean)
          const lblWords = lbl.split(/\W+/).filter(Boolean)
          if (gWords.some(w => lblWords.includes(w))) return true
        }
        for (const g of expandedArray) {
          const maxLen = Math.max(g.length, lbl.length)
          if (maxLen === 0) continue
          const dist = levenshtein(g, lbl)
          const norm = dist / maxLen
          if (norm <= 0.4) return true
        }
        return false
      }

      matchedGoalRecords = goalRecords.filter(r => matchesGoal(r.Goal_Label || r['Goal_Label'] || ''))
    }

    // Map goals -> buckets (preserve order, up to 2 unique)
    const buckets = []
    for (let i = 0; i < goals.length && buckets.length < 2; i++) {
      const goalLabel = goals[i]
      const rec = matchedGoalRecords.find(r => (r.Goal_Label || '').toLowerCase().includes(goalLabel.toLowerCase())) || matchedGoalRecords[i]
      if (!rec) continue
      const primary = rec.Primary_Focus_Bucket || rec['Primary_Focus_Bucket']
      if (!primary) continue
      if (!buckets.includes(primary)) buckets.push(primary)
    }
    const primaryBucket = buckets.length > 0 ? buckets[0] : null

    // Fetch content blocks (cached) and filter locally similar to frontend
    const cbFilters = [`{Active}=TRUE()`]
    if (CONTENT_VERSION) cbFilters.push(`{Version}='${CONTENT_VERSION.replace(/'/g, "\\'")}'`)
    const cbFormula = `AND(${cbFilters.join(',')})`
    const contentRecords = await fetchAirtableRecords('Content_Blocks', cbFormula, ['Block_ID', 'Block_Type', 'Life_Stage', 'Age_Band', 'Focus_Bucket', 'Copy', 'Active', 'Symptom', 'Strain_Level'])

    function findBlock(predicate) {
      return contentRecords.find(predicate)
    }

    // A) Context
    let context = findBlock(r => r.Block_Type === 'context' && r.Life_Stage === lifeStage && r.Age_Band === ageBand)
    if (!context) context = findBlock(r => r.Block_Type === 'context' && r.Life_Stage === lifeStage)

    // B) Strain
    const strain = findBlock(r => r.Block_Type === 'strain' && (r.Strain_Level || '').toLowerCase() === strainLevel)

    // C) Focus insights
    const focusInsights = []
    for (let i = 0; i < buckets.length && focusInsights.length < 2; i++) {
      const b = buckets[i]
      const found = findBlock(r => r.Block_Type === 'focus_insight' && r.Focus_Bucket === b)
      if (found) focusInsights.push(found)
    }

    // D) Symptom addons
    const symptomAddons = []
    for (let i = 0; i < symptomKeys.length && symptomAddons.length < 2; i++) {
      const s = symptomKeys[i]
      const found = findBlock(r => r.Block_Type === 'symptom_addon' && r.Symptom && r.Symptom.toLowerCase() === s.toLowerCase())
      if (found) symptomAddons.push(found)
    }

    // E) Tiles
    let tileNutrition = primaryBucket ? findBlock(r => r.Block_Type === 'tile_nutrition' && r.Focus_Bucket === primaryBucket) : null
    let tileSleep = primaryBucket ? findBlock(r => r.Block_Type === 'tile_sleep' && r.Focus_Bucket === primaryBucket) : null
    let tileMovement = primaryBucket ? findBlock(r => r.Block_Type === 'tile_movement' && r.Focus_Bucket === primaryBucket) : null
    if (!tileNutrition) tileNutrition = findBlock(r => r.Block_Type === 'tile_nutrition')
    if (!tileSleep) tileSleep = findBlock(r => r.Block_Type === 'tile_sleep')
    if (!tileMovement) tileMovement = findBlock(r => r.Block_Type === 'tile_movement')

    // F) CTA
    let cta = findBlock(r => r.Block_Type === 'cta' && r.Life_Stage === lifeStage)
    if (!cta) cta = findBlock(r => r.Block_Type === 'cta')

    const meta = {
      ageBand,
      lifeStage,
      goals,
      focusBuckets: buckets,
      primaryFocusBucket: primaryBucket,
      strainLevel,
      symptoms: symptomKeys,
    }

    const blocks = {
      context: context ? { blockId: context.Block_ID || null, copy: context.Copy || null } : null,
      strain: strain ? { blockId: strain.Block_ID || null, copy: strain.Copy || null } : null,
      focusInsights: focusInsights.map(b => ({ blockId: b.Block_ID || null, copy: b.Copy || null })),
      symptomAddons: symptomAddons.map(b => ({ blockId: b.Block_ID || null, copy: b.Copy || null })),
      tiles: {
        nutrition: tileNutrition ? { blockId: tileNutrition.Block_ID || null, copy: tileNutrition.Copy || null } : null,
        sleep: tileSleep ? { blockId: tileSleep.Block_ID || null, copy: tileSleep.Copy || null } : null,
        movement: tileMovement ? { blockId: tileMovement.Block_ID || null, copy: tileMovement.Copy || null } : null,
      },
      cta: cta ? { blockId: cta.Block_ID || null, copy: cta.Copy || null } : null,
    }

    return res.json({ meta, blocks })
  } catch (err) {
    console.error(err && err.stack ? err.stack : err)
    res.status(500).json({ error: String(err) })
  }
})

// Serve built frontend if present (production)
const port = process.env.PORT || 4000
const distPath = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
  console.log('Serving static frontend from', distPath)
}

app.listen(port, () => console.log(`Airtable helper server running on http://localhost:${port}`))

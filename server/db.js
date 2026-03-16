require('dotenv').config()
const { Pool } = require('pg')
const { randomUUID } = require('crypto')

const DATABASE_URL = process.env.DATABASE_URL || null
// Fallback to granular PG env vars if DATABASE_URL not provided
const pool = DATABASE_URL
  ? new Pool({ connectionString: DATABASE_URL, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432,
      user: process.env.PGUSER || process.env.PG_USER,
      password: process.env.PGPASSWORD || process.env.PG_PASSWORD,
      database: process.env.PGDATABASE || process.env.PG_DATABASE,
      max: 10,
      idleTimeoutMillis: 30000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })

pool.on('error', (err) => {
  console.error('Unexpected Postgres client error', err)
})

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS quiz_results (
  id UUID PRIMARY KEY,
  user_id TEXT,
  session_id TEXT,
  score NUMERIC,
  answers JSONB,
  meta JSONB,
  raw_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quiz_results_created_at ON quiz_results(created_at);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
`

async function init() {
  // Try to create table on startup; don't fail hard if transient DB error
  const maxAttempts = 5
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await pool.query(CREATE_TABLE_SQL)
      console.log('Quiz results table ensured')
      return
    } catch (err) {
      console.error(`Failed to ensure quiz_results table (attempt ${attempt}):`, err && err.message ? err.message : err)
      if (attempt === maxAttempts) throw err
      const backoff = 500 * attempt
      await new Promise(r => setTimeout(r, backoff))
    }
  }
}

const { computeResultFromPayload } = require('./compute')

async function insertQuizResult(payload) {
  // payload may include userId, sessionId, score, answers (array/object), meta (object)
  const id = (typeof randomUUID === 'function') ? randomUUID() : require('crypto').randomBytes(16).toString('hex')
  const userId = payload.userId || payload.user_id || null
  const sessionId = payload.sessionId || payload.session_id || null
  const score = (typeof payload.score !== 'undefined') ? payload.score : null
  const answers = payload.answers || payload.responses || null
  const meta = payload.meta || payload.metadata || null

  // ensure computed result is present in meta.computed
  try {
    const metaObj = meta && typeof meta === 'object' ? Object.assign({}, meta) : {}
    const originalClientComputed = metaObj.computed || null
    // Always compute server-side authoritative result when possible
    const computed = computeResultFromPayload(payload)
    if (computed) {
      metaObj.computed = computed
    } else if (originalClientComputed) {
      // fallback to client-provided computed result only if server cannot compute
      metaObj.computed = originalClientComputed
    }
    // preserve client provided computed result for auditing
    if (originalClientComputed) metaObj.clientComputed = originalClientComputed
    // use updated meta for storage
    payload.meta = metaObj
  } catch (e) {
    // ignore compute errors
  }

  const text = `INSERT INTO quiz_results (id, user_id, session_id, score, answers, meta, raw_payload) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id, created_at`
  const values = [id, userId, sessionId, score, answers ? JSON.stringify(answers) : null, payload.meta ? JSON.stringify(payload.meta) : null, payload]

  const maxAttempts = 3
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const { rows } = await pool.query(text, values)
      return { id, created_at: rows[0].created_at }
    } catch (err) {
      console.error(`insertQuizResult error (attempt ${attempt}):`, err && err.message ? err.message : err)
      if (attempt === maxAttempts) throw err
      const backoff = 200 * attempt
      await new Promise(r => setTimeout(r, backoff))
    }
  }
}

async function getAggregatedStrainStats() {
  // Fetch results from the last hour and count by strain level
  const query = `
    SELECT 
      meta->'computed'->>'strainLevel' as strain_level,
      COUNT(*) as count
    FROM quiz_results
    WHERE meta IS NOT NULL AND meta->'computed'->>'strainLevel' IS NOT NULL
      AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY meta->'computed'->>'strainLevel'
  `
  
  try {
    const { rows } = await pool.query(query)
    
    // Count by strain level
    let green = 0, amber = 0, red = 0
    rows.forEach(row => {
      const level = row.strain_level
      if (level === 'green') green = parseInt(row.count, 10)
      else if (level === 'amber') amber = parseInt(row.count, 10)
      else if (level === 'red') red = parseInt(row.count, 10)
    })
    
    const total = green + amber + red
    
    return {
      green: { count: green, percentage: total > 0 ? ((green / total) * 100).toFixed(1) : 0 },
      amber: { count: amber, percentage: total > 0 ? ((amber / total) * 100).toFixed(1) : 0 },
      red: { count: red, percentage: total > 0 ? ((red / total) * 100).toFixed(1) : 0 },
      total,
    }
  } catch (err) {
    console.error('Failed to fetch aggregated strain stats:', err && err.message ? err.message : err)
    throw err
  }
}

module.exports = {
  pool,
  init,
  insertQuizResult,
  getAggregatedStrainStats,
}

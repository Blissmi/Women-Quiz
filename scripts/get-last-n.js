require('dotenv').config()
const path = require('path')
const db = require(path.join(__dirname, '..', 'server', 'db'))

const nArg = process.argv[2] || process.env.LAST_N || '10'
const n = Math.max(1, parseInt(nArg, 10) || 10)

async function main() {
  try {
    const res = await db.pool.query(`SELECT id, user_id, session_id, score, answers, meta, raw_payload, created_at FROM quiz_results ORDER BY created_at DESC LIMIT $1`, [n])
    if (!res || !res.rows || res.rows.length === 0) {
      console.log('NO_RESULTS')
      return
    }
    console.log(JSON.stringify(res.rows, null, 2))
  } catch (err) {
    console.error('QUERY_ERROR')
    console.error(err && err.stack ? err.stack : err)
    process.exit(1)
  } finally {
    try { await db.pool.end() } catch (e) {}
  }
}

main()

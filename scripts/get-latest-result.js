require('dotenv').config()
const path = require('path')
const db = require(path.join(__dirname, '..', 'server', 'db'))

async function main() {
  try {
    // ensure pool is ready
    const res = await db.pool.query(`SELECT id, user_id, session_id, score, answers, meta, raw_payload, created_at FROM quiz_results ORDER BY created_at DESC LIMIT 1`)
    if (!res || !res.rows || res.rows.length === 0) {
      console.log('NO_RESULTS')
      return
    }
    console.log(JSON.stringify(res.rows[0], null, 2))
  } catch (err) {
    console.error('QUERY_ERROR')
    console.error(err && err.stack ? err.stack : err)
    process.exit(1)
  } finally {
    // close pool
    try { await db.pool.end() } catch (e) {}
  }
}

main()

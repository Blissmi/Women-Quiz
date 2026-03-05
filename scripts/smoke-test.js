/*
  Smoke test script for local helper API endpoints.
  Usage: node scripts/smoke-test.js
  Reads base URL from env var TEST_API_BASE or defaults to http://localhost:4000
*/

const BASE = process.env.TEST_API_BASE || 'http://localhost:4000'

async function checkStatus(res, name) {
  if (!res.ok) throw new Error(`${name} returned status ${res.status}`)
  return res.json()
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function testGoalMapping() {
  const url = `${BASE}/api/goal-mapping?lifeStage=perimenopause`
  const res = await fetch(url)
  const body = await checkStatus(res, 'goal-mapping')
  assert(Array.isArray(body.records), 'goal-mapping.records should be an array')
  if (body.records.length) {
    const r = body.records[0]
    assert('Goal_Label' in r, 'record missing Goal_Label')
    assert('Primary_Focus_Bucket' in r, 'record missing Primary_Focus_Bucket')
    assert('Life_Stage' in r, 'record missing Life_Stage')
  }
  return true
}

async function testContentBlocks() {
  const url = `${BASE}/api/content-blocks?lifeStage=perimenopause`
  const res = await fetch(url)
  const body = await checkStatus(res, 'content-blocks')
  assert(Array.isArray(body.records), 'content-blocks.records should be an array')
  if (body.records.length) {
    const r = body.records[0]
    assert('Block_ID' in r || 'BlockId' in r, 'record missing Block_ID')
    assert('Block_Type' in r, 'record missing Block_Type')
    // Copy may be null in some records, just check presence of key
    assert('Copy' in r || 'copy' in r || 'copyText' in r, 'record missing Copy field')
  }
  return true
}

async function testBuildResult() {
  const url = `${BASE}/api/build-result`
  const payload = {
    ageBand: '35_39',
    lifeStage: 'postpartum',
    goals: ['Weight management'],
    energy: 'I feel tired most days',
    sleep: '6–7 hours, light sleep',
    stress: 'Moderate',
    symptoms: ['Bloating', 'Brain fog']
  }
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
  const body = await checkStatus(res, 'build-result')
  assert(body.meta, 'build-result response missing meta')
  assert(body.blocks, 'build-result response missing blocks')
  // basic block shape
  assert('tiles' in body.blocks, 'blocks missing tiles')
  assert('cta' in body.blocks, 'blocks missing cta')
  return true
}

async function run() {
  console.log('Running smoke tests against', BASE)
  const failures = []
  try {
    await testGoalMapping()
    console.log('✔ goal-mapping OK')
  } catch (e) {
    console.error('✖ goal-mapping FAILED:', e.message)
    failures.push('goal-mapping')
  }

  try {
    await testContentBlocks()
    console.log('✔ content-blocks OK')
  } catch (e) {
    console.error('✖ content-blocks FAILED:', e.message)
    failures.push('content-blocks')
  }

  try {
    await testBuildResult()
    console.log('✔ build-result OK')
  } catch (e) {
    console.error('✖ build-result FAILED:', e.message)
    failures.push('build-result')
  }

  if (failures.length) {
    console.error('\nSmoke tests FAILED for:', failures.join(', '))
    process.exit(1)
  } else {
    console.log('\nAll smoke tests passed')
    process.exit(0)
  }
}

run().catch(err => {
  console.error('Smoke test runner crashed:', err && err.stack ? err.stack : err)
  process.exit(2)
})

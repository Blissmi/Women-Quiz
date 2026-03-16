const Ajv = require('ajv')
const fs = require('fs')
const path = require('path')

const ajv = new Ajv({ allErrors: true, strict: false })

const schemaPath = path.join(__dirname, 'schemas', 'quiz-result.schema.json')
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'))
const validate = ajv.compile(schema)

function validateQuizResult(payload) {
  const ok = validate(payload)
  if (!ok) return { valid: false, errors: validate.errors }
  return { valid: true }
}

module.exports = { validateQuizResult }

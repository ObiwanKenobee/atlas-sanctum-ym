const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const rootFields = new Set([
  'placeId',
  'decisionQuestion',
  'recommendation',
  'rationale',
  'uncertainty',
  'consequenceOfNoAction',
  'options',
  'evidenceLinks',
])
const optionFields = new Set([
  'name',
  'description',
  'expectedBenefit',
  'materialRisks',
  'estimatedCost',
  'currencyCode',
  'isRecommended',
])
const evidenceFields = new Set(['evidenceVersionId', 'relevanceNote'])
const invalid = (field, code) => ({ ok: false, field, code })

function readText(value, field, min, max) {
  if (typeof value !== 'string') return invalid(field, 'string_required')
  const normalized = value.trim()
  if (normalized.length < min || normalized.length > max) return invalid(field, 'invalid_length')
  return { ok: true, value: normalized }
}

function rejectExtraFields(value, allowed, fieldPrefix) {
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) return invalid(fieldPrefix ? `${fieldPrefix}.${key}` : key, 'field_not_allowed')
  }
  return null
}

export function parseDecisionSubmissionInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('body', 'object_required')
  }

  const extraField = rejectExtraFields(input, rootFields, '')
  if (extraField) return extraField

  const textFields = [
    ['decisionQuestion', 10, 2000],
    ['recommendation', 10, 3000],
    ['rationale', 10, 3000],
    ['uncertainty', 3, 2000],
    ['consequenceOfNoAction', 3, 2000],
  ]
  const normalizedText = {}
  for (const [field, min, max] of textFields) {
    const parsed = readText(input[field], field, min, max)
    if (!parsed.ok) return parsed
    normalizedText[field] = parsed.value
  }

  let placeId = null
  if (input.placeId !== undefined && input.placeId !== null && input.placeId !== '') {
    if (typeof input.placeId !== 'string' || !uuidPattern.test(input.placeId.trim())) {
      return invalid('placeId', 'invalid_place_id')
    }
    placeId = input.placeId.trim()
  }

  if (!Array.isArray(input.options) || input.options.length < 2 || input.options.length > 10) {
    return invalid('options', 'two_to_ten_options_required')
  }

  const options = []
  const optionNames = new Set()
  let recommendedCount = 0
  for (let index = 0; index < input.options.length; index += 1) {
    const option = input.options[index]
    const prefix = `options.${index}`
    if (!option || typeof option !== 'object' || Array.isArray(option)) {
      return invalid(prefix, 'object_required')
    }
    const optionExtra = rejectExtraFields(option, optionFields, prefix)
    if (optionExtra) return optionExtra

    const fields = [
      ['name', 2, 120],
      ['description', 10, 2000],
      ['expectedBenefit', 3, 1500],
      ['materialRisks', 3, 1500],
    ]
    const normalized = {}
    for (const [field, min, max] of fields) {
      const parsed = readText(option[field], `${prefix}.${field}`, min, max)
      if (!parsed.ok) return parsed
      normalized[field] = parsed.value
    }

    if (typeof option.isRecommended !== 'boolean') {
      return invalid(`${prefix}.isRecommended`, 'boolean_required')
    }
    if (option.isRecommended) recommendedCount += 1

    const normalizedName = normalized.name.toLocaleLowerCase('en')
    if (optionNames.has(normalizedName)) return invalid(`${prefix}.name`, 'duplicate_option_name')
    optionNames.add(normalizedName)

    const rawCost = option.estimatedCost
    const estimatedCost = rawCost === undefined || rawCost === null || rawCost === ''
      ? null
      : String(rawCost).trim()
    if (estimatedCost !== null && !/^(?:0|[1-9]\d{0,11})(?:\.\d{1,2})?$/.test(estimatedCost)) {
      return invalid(`${prefix}.estimatedCost`, 'invalid_cost')
    }

    const rawCurrency = option.currencyCode
    const currencyCode = rawCurrency === undefined || rawCurrency === null || rawCurrency === ''
      ? null
      : typeof rawCurrency === 'string' ? rawCurrency.trim().toUpperCase() : ''
    if (currencyCode !== null && !/^[A-Z]{3}$/.test(currencyCode)) {
      return invalid(`${prefix}.currencyCode`, 'invalid_currency_code')
    }
    if ((estimatedCost === null) !== (currencyCode === null)) {
      return invalid(`${prefix}.estimatedCost`, 'cost_and_currency_must_be_paired')
    }

    options.push({ ...normalized, estimatedCost, currencyCode, isRecommended: option.isRecommended })
  }

  if (recommendedCount !== 1) return invalid('options', 'exactly_one_recommended_option_required')

  if (!Array.isArray(input.evidenceLinks) || input.evidenceLinks.length < 1 || input.evidenceLinks.length > 20) {
    return invalid('evidenceLinks', 'one_to_twenty_evidence_citations_required')
  }

  const evidenceLinks = []
  const evidenceVersionIds = new Set()
  for (let index = 0; index < input.evidenceLinks.length; index += 1) {
    const link = input.evidenceLinks[index]
    const prefix = `evidenceLinks.${index}`
    if (!link || typeof link !== 'object' || Array.isArray(link)) return invalid(prefix, 'object_required')
    const linkExtra = rejectExtraFields(link, evidenceFields, prefix)
    if (linkExtra) return linkExtra

    const evidenceVersionId = typeof link.evidenceVersionId === 'string' ? link.evidenceVersionId.trim() : ''
    if (!uuidPattern.test(evidenceVersionId)) return invalid(`${prefix}.evidenceVersionId`, 'invalid_evidence_version_id')
    if (evidenceVersionIds.has(evidenceVersionId)) return invalid(`${prefix}.evidenceVersionId`, 'duplicate_evidence_version')
    evidenceVersionIds.add(evidenceVersionId)

    const relevanceNote = readText(link.relevanceNote, `${prefix}.relevanceNote`, 5, 1200)
    if (!relevanceNote.ok) return relevanceNote
    evidenceLinks.push({ evidenceVersionId, relevanceNote: relevanceNote.value })
  }

  return {
    ok: true,
    value: {
      placeId,
      ...normalizedText,
      options,
      evidenceLinks,
    },
  }
}

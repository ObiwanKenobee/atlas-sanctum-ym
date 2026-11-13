
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const allowedFields = new Set([
  'placeId', 'evidenceType', 'title', 'description', 'sourceType',
  'sourceName', 'sourceReference', 'sourceUrl', 'collectedAt',
  'collectionMethod', 'limitations',
])
const evidenceTypes = new Set([
  'field_observation', 'survey', 'administrative_record', 'sensor_reading',
  'remote_sensing', 'photograph', 'document', 'interview', 'assessment', 'other',
])
const sourceTypes = new Set([
  'person', 'organization', 'dataset', 'document', 'device', 'satellite',
  'field_visit', 'public_record', 'other',
])
const invalid = (field, code) => ({ ok: false, field, code })

function readText(value, field, min, max) {
  if (typeof value !== 'string') return invalid(field, 'string_required')
  const normalized = value.trim()
  if (normalized.length < min || normalized.length > max) return invalid(field, 'invalid_length')
  return { ok: true, value: normalized }
}

function optionalText(value, field, min, max) {
  if (value === undefined || value === null || value === '') return { ok: true, value: null }
  return readText(value, field, min, max)
}

export function parseProjectEvidenceInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('body', 'object_required')
  }
  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) return invalid(key, 'field_not_allowed')
  }

  const placeId = typeof input.placeId === 'string' ? input.placeId.trim() : ''
  if (!uuidPattern.test(placeId)) return invalid('placeId', 'invalid_place_id')

  if (typeof input.evidenceType !== 'string' || !evidenceTypes.has(input.evidenceType)) {
    return invalid('evidenceType', 'invalid_evidence_type')
  }
  if (typeof input.sourceType !== 'string' || !sourceTypes.has(input.sourceType)) {
    return invalid('sourceType', 'invalid_source_type')
  }

  const fields = [
    ['title', 3, 160],
    ['description', 10, 3000],
    ['sourceName', 2, 160],
    ['collectionMethod', 3, 500],
    ['limitations', 3, 1000],
  ]
  const normalized = {}
  for (const [field, min, max] of fields) {
    const parsed = readText(input[field], field, min, max)
    if (!parsed.ok) return parsed
    normalized[field] = parsed.value
  }

  const sourceReference = optionalText(input.sourceReference, 'sourceReference', 1, 255)
  if (!sourceReference.ok) return sourceReference

  const sourceUrl = optionalText(input.sourceUrl, 'sourceUrl', 8, 2048)
  if (!sourceUrl.ok) return sourceUrl
  if (sourceUrl.value !== null) {
    let parsedUrl
    try {
      parsedUrl = new URL(sourceUrl.value)
    } catch {
      return invalid('sourceUrl', 'invalid_source_url')
    }
    if (parsedUrl.protocol !== 'https:' || !parsedUrl.hostname || parsedUrl.username || parsedUrl.password) {
      return invalid('sourceUrl', 'https_source_url_required')
    }
  }

  if (typeof input.collectedAt !== 'string' || !Number.isFinite(Date.parse(input.collectedAt))) {
    return invalid('collectedAt', 'valid_collection_datetime_required')
  }

  return {
    ok: true,
    value: {
      placeId,
      evidenceType: input.evidenceType,
      ...normalized,
      sourceType: input.sourceType,
      sourceReference: sourceReference.value,
      sourceUrl: sourceUrl.value,
      collectedAt: new Date(input.collectedAt).toISOString(),
    },
  }
}

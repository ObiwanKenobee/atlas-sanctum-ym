
const allowedFields = new Set([
  'name', 'slug', 'placeType', 'administrativeArea',
  'latitude', 'longitude', 'description',
])
const placeTypes = new Set([
  'county', 'sub_county', 'ward', 'village', 'community', 'settlement',
  'facility', 'water_point', 'catchment', 'protected_area', 'landscape', 'other',
])
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
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

function coordinate(value, field, min, max) {
  if (value === undefined || value === null || value === '') return { ok: true, value: null }
  const parsed = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return invalid(field, 'invalid_coordinate')
  }
  return { ok: true, value: parsed }
}

export function parseProjectPlaceInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('body', 'object_required')
  }

  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) return invalid(key, 'field_not_allowed')
  }

  const name = readText(input.name, 'name', 2, 160)
  if (!name.ok) return name

  const slug = readText(input.slug, 'slug', 2, 80)
  if (!slug.ok) return slug
  if (!slugPattern.test(slug.value)) return invalid('slug', 'invalid_slug')

  if (typeof input.placeType !== 'string' || !placeTypes.has(input.placeType)) {
    return invalid('placeType', 'invalid_place_type')
  }

  const administrativeArea = optionalText(input.administrativeArea, 'administrativeArea', 2, 240)
  if (!administrativeArea.ok) return administrativeArea
  const description = optionalText(input.description, 'description', 3, 1000)
  if (!description.ok) return description

  const latitude = coordinate(input.latitude, 'latitude', -90, 90)
  if (!latitude.ok) return latitude
  const longitude = coordinate(input.longitude, 'longitude', -180, 180)
  if (!longitude.ok) return longitude
  if ((latitude.value === null) !== (longitude.value === null)) {
    return invalid('coordinates', 'latitude_and_longitude_must_be_paired')
  }

  return {
    ok: true,
    value: {
      name: name.value,
      slug: slug.value,
      placeType: input.placeType,
      administrativeArea: administrativeArea.value,
      latitude: latitude.value,
      longitude: longitude.value,
      description: description.value,
    },
  }
}

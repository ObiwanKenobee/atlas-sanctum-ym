export const PROJECT_DOMAINS = Object.freeze([
  'water_climate',
  'agriculture_food',
  'programme_accountability',
  'cross_cutting',
])

const allowedFields = new Set(['name', 'slug', 'purpose', 'domain'])
const domainSet = new Set(PROJECT_DOMAINS)

const invalid = (field, code) => ({ ok: false, field, code })

function slugFromName(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '')
}

export function parseProjectCreationInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('body', 'object_required')
  }

  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) return invalid(key, 'field_not_allowed')
  }

  const name = typeof input.name === 'string'
    ? input.name.trim().replace(/\s+/g, ' ')
    : ''
  if (name.length < 3 || name.length > 120) return invalid('name', 'invalid_length')

  const purpose = typeof input.purpose === 'string'
    ? input.purpose.trim().replace(/\s+/g, ' ')
    : ''
  if (purpose.length < 10 || purpose.length > 2000) return invalid('purpose', 'invalid_length')

  if (typeof input.domain !== 'string' || !domainSet.has(input.domain)) {
    return invalid('domain', 'invalid_domain')
  }

  const rawSlug = typeof input.slug === 'string' && input.slug.trim()
    ? input.slug.trim()
    : slugFromName(name)
  const slug = rawSlug.toLowerCase()
  if (slug.length < 3 || slug.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return invalid('slug', 'invalid_slug')
  }

  return { ok: true, value: { name, slug, purpose, domain: input.domain } }
}

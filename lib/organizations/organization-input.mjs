const allowedFields = new Set(['name', 'slug'])

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

const invalid = (field, code) => ({ ok: false, field, code })

export function parseOrganizationCreationInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('body', 'object_required')
  }

  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) return invalid(key, 'field_not_allowed')
  }

  const name = typeof input.name === 'string'
    ? input.name.trim().replace(/\s+/g, ' ')
    : ''
  if (name.length < 2 || name.length > 160) {
    return invalid('name', 'invalid_length')
  }

  const rawSlug = typeof input.slug === 'string' && input.slug.trim()
    ? input.slug.trim()
    : slugFromName(name)
  const slug = rawSlug.toLowerCase()
  if (slug.length < 3 || slug.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return invalid('slug', 'invalid_slug')
  }

  return { ok: true, value: { name, slug } }
}

const allowedFields = new Set(['userId', 'accessLevel'])
const accessLevels = new Set(['manager', 'contributor', 'viewer'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const invalid = (field, code) => ({ ok: false, field, code })

export function parseProjectMemberInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return invalid('body', 'object_required')
  }

  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) return invalid(key, 'field_not_allowed')
  }

  const userId = typeof input.userId === 'string' ? input.userId.trim() : ''
  if (!uuidPattern.test(userId)) return invalid('userId', 'invalid_user_id')

  if (typeof input.accessLevel !== 'string' || !accessLevels.has(input.accessLevel)) {
    return invalid('accessLevel', 'invalid_access_level')
  }

  return { ok: true, value: { userId, accessLevel: input.accessLevel } }
}

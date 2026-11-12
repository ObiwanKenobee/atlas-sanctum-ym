import assert from 'node:assert/strict'
import test from 'node:test'
import { parseProjectCreationInput } from './project-input.mjs'

const valid = {
  name: '  Nakuru   Water Reliability  ',
  purpose: 'Improve the reliability of selected water service points.',
  domain: 'water_climate',
}

test('normalizes project names and derives stable slugs', () => {
  assert.deepEqual(parseProjectCreationInput(valid), {
    ok: true,
    value: {
      name: 'Nakuru Water Reliability',
      slug: 'nakuru-water-reliability',
      purpose: 'Improve the reliability of selected water service points.',
      domain: 'water_climate',
    },
  })
})

test('accepts explicit slugs and normalizes case', () => {
  assert.equal(parseProjectCreationInput({ ...valid, slug: 'Nakuru-Water-01' }).value.slug, 'nakuru-water-01')
})

test('rejects non-object and array payloads', () => {
  assert.equal(parseProjectCreationInput(null).code, 'object_required')
  assert.equal(parseProjectCreationInput([]).code, 'object_required')
})

test('rejects missing or overlong project names', () => {
  assert.equal(parseProjectCreationInput({ ...valid, name: 'ab' }).field, 'name')
  assert.equal(parseProjectCreationInput({ ...valid, name: 'x'.repeat(121) }).code, 'invalid_length')
})

test('rejects missing or overlong purposes', () => {
  assert.equal(parseProjectCreationInput({ ...valid, purpose: 'too short' }).field, 'purpose')
  assert.equal(parseProjectCreationInput({ ...valid, purpose: 'x'.repeat(2001) }).code, 'invalid_length')
})

test('accepts only supported project domains', () => {
  for (const domain of ['water_climate', 'agriculture_food', 'programme_accountability', 'cross_cutting']) {
    assert.equal(parseProjectCreationInput({ ...valid, domain }).ok, true)
  }
  assert.equal(parseProjectCreationInput({ ...valid, domain: 'crypto' }).code, 'invalid_domain')
})

test('rejects tenant, creator, owner, ID and status mass-assignment', () => {
  for (const extra of [
    { organizationId: 'org-attacker' },
    { organization_id: 'org-attacker' },
    { createdBy: 'attacker' },
    { created_by: 'attacker' },
    { ownerId: 'attacker' },
    { id: 'chosen-id' },
    { status: 'active' },
    { role: 'owner' },
  ]) {
    assert.equal(parseProjectCreationInput({ ...valid, ...extra }).code, 'field_not_allowed')
  }
})

test('rejects malformed slugs', () => {
  for (const slug of ['a', 'has spaces', '-leading', 'trailing-', 'double--dash', 'slash/path']) {
    assert.equal(parseProjectCreationInput({ ...valid, slug }).field, 'slug')
  }
})

import assert from 'node:assert/strict'
import test from 'node:test'
import { parseOrganizationCreationInput } from './organization-input.mjs'

test('normalizes organization names and derives stable lowercase slugs', () => {
  assert.deepEqual(parseOrganizationCreationInput({ name: '  Nakuru   Water   Trust ' }), {
    ok: true,
    value: { name: 'Nakuru Water Trust', slug: 'nakuru-water-trust' },
  })
})

test('accepts and normalizes an explicit valid slug', () => {
  assert.deepEqual(parseOrganizationCreationInput({
    name: 'Nakuru Water Trust',
    slug: 'Nakuru-Water-Trust-01',
  }), {
    ok: true,
    value: { name: 'Nakuru Water Trust', slug: 'nakuru-water-trust-01' },
  })
})

test('rejects missing, non-object and array payloads', () => {
  assert.equal(parseOrganizationCreationInput(null).code, 'object_required')
  assert.equal(parseOrganizationCreationInput([]).code, 'object_required')
  assert.equal(parseOrganizationCreationInput({}).field, 'name')
})

test('rejects organization names outside the database contract', () => {
  assert.equal(parseOrganizationCreationInput({ name: 'x' }).code, 'invalid_length')
  assert.equal(parseOrganizationCreationInput({ name: 'x'.repeat(161) }).code, 'invalid_length')
})

test('rejects malformed or too-short slugs', () => {
  for (const slug of ['ab', 'has spaces', '-leading', 'trailing-', 'double--dash', 'a/b']) {
    assert.equal(parseOrganizationCreationInput({ name: 'Valid Name', slug }).field, 'slug')
  }
})

test('rejects identity, role and status mass-assignment', () => {
  for (const extra of [
    { id: 'chosen-id' },
    { createdBy: 'attacker' },
    { created_by: 'attacker' },
    { ownerId: 'attacker' },
    { role: 'owner' },
    { status: 'active' },
  ]) {
    assert.equal(parseOrganizationCreationInput({ name: 'Valid Organization', ...extra }).code, 'field_not_allowed')
  }
})

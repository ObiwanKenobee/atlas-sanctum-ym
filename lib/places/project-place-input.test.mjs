
import test from 'node:test'
import assert from 'node:assert/strict'
import { parseProjectPlaceInput } from './project-place-input.mjs'

function validInput(overrides = {}) {
  return {
    name: 'Ngata Service Zone',
    slug: 'ngata-service-zone',
    placeType: 'ward',
    administrativeArea: 'Nakuru County, Kenya',
    latitude: '-0.2833',
    longitude: '36.0667',
    description: 'A defined service area for the project evidence register.',
    ...overrides,
  }
}

test('accepts a valid place and normalizes coordinates', () => {
  const result = parseProjectPlaceInput(validInput())
  assert.equal(result.ok, true)
  assert.equal(result.value.latitude, -0.2833)
  assert.equal(result.value.longitude, 36.0667)
})

test('accepts a place without optional administrative area or coordinates', () => {
  const result = parseProjectPlaceInput(validInput({
    administrativeArea: null, latitude: null, longitude: null, description: null,
  }))
  assert.equal(result.ok, true)
  assert.equal(result.value.latitude, null)
})

test('rejects unknown tenant and identity fields', () => {
  assert.equal(parseProjectPlaceInput(validInput({ organizationId: 'x' })).code, 'field_not_allowed')
  assert.equal(parseProjectPlaceInput(validInput({ createdBy: 'x' })).code, 'field_not_allowed')
})

test('rejects invalid slugs and place types', () => {
  assert.equal(parseProjectPlaceInput(validInput({ slug: 'Upper Case' })).field, 'slug')
  assert.equal(parseProjectPlaceInput(validInput({ placeType: 'district' })).field, 'placeType')
})

test('requires paired coordinates', () => {
  const result = parseProjectPlaceInput(validInput({ longitude: null }))
  assert.equal(result.code, 'latitude_and_longitude_must_be_paired')
})

test('rejects out-of-range and non-finite coordinates', () => {
  assert.equal(parseProjectPlaceInput(validInput({ latitude: '91' })).code, 'invalid_coordinate')
  assert.equal(parseProjectPlaceInput(validInput({ longitude: 'NaN' })).code, 'invalid_coordinate')
})

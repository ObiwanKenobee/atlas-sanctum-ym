
'use client'

import { FormEvent, useState } from 'react'

const placeTypes = [
  ['county', 'County'],
  ['sub_county', 'Sub-county'],
  ['ward', 'Ward'],
  ['village', 'Village'],
  ['community', 'Community'],
  ['settlement', 'Settlement'],
  ['facility', 'Facility'],
  ['water_point', 'Water point'],
  ['catchment', 'Catchment'],
  ['protected_area', 'Protected area'],
  ['landscape', 'Landscape'],
  ['other', 'Other'],
]

function makeSlug(value: string) {
  return value.toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

export default function ProjectPlaceForm({ projectId }: { projectId: string }) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [placeType, setPlaceType] = useState('ward')
  const [administrativeArea, setAdministrativeArea] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [description, setDescription] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  function updateName(value: string) {
    setName(value)
    if (!slugTouched) setSlug(makeSlug(value))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    try {
      const response = await fetch('/api/projects/' + projectId + '/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, slug, placeType,
          administrativeArea: administrativeArea || null,
          latitude: latitude || null,
          longitude: longitude || null,
          description: description || null,
        }),
      })
      const result = await response.json().catch(() => null) as { error?: string } | null
      if (!response.ok) {
        const messages: Record<string, string> = {
          unauthenticated: 'Your session has expired. Sign in again.',
          project_not_found: 'This project is not available to your account.',
          place_creation_not_authorized: 'Your project role does not permit creating places.',
          place_slug_already_exists: 'This place slug is already used in the project.',
          place_input_invalid: 'One or more place fields failed database validation.',
        }
        setError(messages[result?.error ?? ''] ?? 'The place could not be created. Review the fields and try again.')
        return
      }
      window.location.assign('/projects/' + projectId + '/places')
    } catch {
      setError('The request could not be completed. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-8">
      <div>
        <label htmlFor="place-name" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Place name</label>
        <input id="place-name" required minLength={2} maxLength={160} value={name} onChange={(event) => updateName(event.target.value)}
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="place-slug" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Project-unique slug</label>
          <input id="place-slug" required minLength={2} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug}
            onChange={(event) => { setSlugTouched(true); setSlug(event.target.value) }}
            className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
        </div>
        <div>
          <label htmlFor="place-type" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Place type</label>
          <select id="place-type" value={placeType} onChange={(event) => setPlaceType(event.target.value)}
            className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm">
            {placeTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="place-area" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Administrative area (optional)</label>
        <input id="place-area" maxLength={240} value={administrativeArea} onChange={(event) => setAdministrativeArea(event.target.value)}
          placeholder="Ward, sub-county, county, country"
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label htmlFor="place-latitude" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Latitude (optional)</label>
          <input id="place-latitude" inputMode="decimal" value={latitude} onChange={(event) => setLatitude(event.target.value)}
            placeholder="-0.283300" className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
        </div>
        <div>
          <label htmlFor="place-longitude" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Longitude (optional)</label>
          <input id="place-longitude" inputMode="decimal" value={longitude} onChange={(event) => setLongitude(event.target.value)}
            placeholder="36.066700" className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
        </div>
      </div>
      <p className="text-xs leading-relaxed text-[#687168]">Coordinates are optional, but latitude and longitude must be supplied together.</p>
      <div>
        <label htmlFor="place-description" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Description (optional)</label>
        <textarea id="place-description" maxLength={1000} rows={3} value={description} onChange={(event) => setDescription(event.target.value)}
          className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm" />
      </div>
      {error && <p role="alert" className="border border-[#c96e5b] bg-[#f9e8e2] p-3 text-sm text-[#914634]">{error}</p>}
      <button type="submit" disabled={pending} className="bg-[#17382d] px-5 py-4 text-[10px] uppercase tracking-[0.14em] text-[#f7f0df] disabled:opacity-60">
        {pending ? 'Saving place…' : 'Register project place'}
      </button>
    </form>
  )
}

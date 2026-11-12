'use client'

import { FormEvent, useState } from 'react'

function slugFromName(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/g, '')
}

export default function OrganizationSetupForm() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug }),
      })
      const payload = await response.json().catch(() => null) as {
        organization?: { id: string }
        error?: string
        field?: string
      } | null

      if (!response.ok || !payload?.organization?.id) {
        const messages: Record<string, string> = {
          invalid_length: 'Use an organization name between 2 and 160 characters.',
          invalid_slug: 'Use a 3–64 character lowercase slug with letters, numbers, and single hyphens.',
          organization_slug_conflict: 'That organization slug is already in use. Choose another.',
          unauthenticated: 'Your session has expired. Sign in again.',
        }
        setError(messages[payload?.error ?? ''] ?? 'The organization could not be created. Please review the details and try again.')
        return
      }

      window.location.assign(`/projects/new?organizationId=${encodeURIComponent(payload.organization.id)}`)
    } catch {
      setError('The request could not be completed. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-9">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Organization details</p>
      <label className="mt-7 block text-xs uppercase tracking-[0.12em] text-[#687168]" htmlFor="organization-name">Organization name</label>
      <input
        id="organization-name"
        required
        minLength={2}
        maxLength={160}
        value={name}
        onChange={(event) => {
          const value = event.target.value
          setName(value)
          if (!slugEdited) setSlug(slugFromName(value))
        }}
        className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-4 py-3 text-sm outline-none focus:border-[#a07837]"
        placeholder="e.g. Nakuru Water Trust"
      />
      <label className="mt-6 block text-xs uppercase tracking-[0.12em] text-[#687168]" htmlFor="organization-slug">Workspace slug</label>
      <input
        id="organization-slug"
        required
        minLength={3}
        maxLength={64}
        pattern="[a-z0-9]+(-[a-z0-9]+)*"
        value={slug}
        onChange={(event) => {
          setSlugEdited(true)
          setSlug(event.target.value.toLowerCase())
        }}
        className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-4 py-3 font-mono text-sm outline-none focus:border-[#a07837]"
        placeholder="nakuru-water-trust"
      />
      <p className="mt-2 text-xs leading-relaxed text-[#687168]">The creator becomes the organization owner. Ownership is assigned by the database, not by this form.</p>
      {error && <p role="alert" className="mt-5 border border-[#c96e5b] bg-[#f9e8e2] p-3 text-xs text-[#914634]">{error}</p>}
      <button disabled={pending} className="mt-8 bg-[#17382d] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#f7f0df] disabled:opacity-60">
        {pending ? 'Creating organization…' : 'Create organization'}
      </button>
    </form>
  )
}

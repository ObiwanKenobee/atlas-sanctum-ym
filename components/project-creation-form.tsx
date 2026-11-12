'use client'

import { FormEvent, useState } from 'react'

type OrganizationOption = { id: string; name: string; slug: string }

const domains = [
  ['water_climate', 'Water & climate resilience'],
  ['agriculture_food', 'Agriculture & food systems'],
  ['programme_accountability', 'Programme accountability'],
  ['cross_cutting', 'Cross-cutting'],
] as const

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

export default function ProjectCreationForm({
  organizations,
  initialOrganizationId,
}: {
  organizations: OrganizationOption[]
  initialOrganizationId: string
}) {
  const [organizationId, setOrganizationId] = useState(initialOrganizationId)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEdited, setSlugEdited] = useState(false)
  const [purpose, setPurpose] = useState('')
  const [domain, setDomain] = useState<(typeof domains)[number][0]>('water_climate')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId, name, slug, purpose, domain }),
      })
      const payload = await response.json().catch(() => null) as {
        project?: { id: string }
        error?: string
        field?: string
      } | null

      if (!response.ok || !payload?.project?.id) {
        const messages: Record<string, string> = {
          organization_required: 'Choose an organization.',
          organization_membership_required: 'You are not an active member of that organization.',
          organization_admin_required: 'Only an organization owner or admin can create projects.',
          workspace_profile_required: 'Complete workspace setup before creating a project.',
          project_slug_conflict: 'That project slug is already in use in this organization.',
          invalid_project_input: 'Review the project name, slug, purpose, and domain.',
          unauthenticated: 'Your session has expired. Sign in again.',
        }
        setError(messages[payload?.error ?? ''] ?? 'The project could not be created. Please review the details and try again.')
        return
      }

      window.location.assign(`/projects/${payload.project.id}/decisions`)
    } catch {
      setError('The request could not be completed. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-9">
      <label className="block text-xs uppercase tracking-[0.12em] text-[#687168]" htmlFor="project-organization">Organization</label>
      <select
        id="project-organization"
        required
        value={organizationId}
        onChange={(event) => setOrganizationId(event.target.value)}
        className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-4 py-3 text-sm outline-none focus:border-[#a07837]"
      >
        {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
      </select>

      <label className="mt-6 block text-xs uppercase tracking-[0.12em] text-[#687168]" htmlFor="project-name">Project name</label>
      <input
        id="project-name"
        required
        minLength={3}
        maxLength={120}
        value={name}
        onChange={(event) => {
          const value = event.target.value
          setName(value)
          if (!slugEdited) setSlug(slugFromName(value))
        }}
        className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-4 py-3 text-sm outline-none focus:border-[#a07837]"
        placeholder="e.g. Nakuru Water Service Reliability"
      />

      <label className="mt-6 block text-xs uppercase tracking-[0.12em] text-[#687168]" htmlFor="project-slug">Project slug</label>
      <input
        id="project-slug"
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
        placeholder="nakuru-water-service-reliability"
      />

      <label className="mt-6 block text-xs uppercase tracking-[0.12em] text-[#687168]" htmlFor="project-domain">Project domain</label>
      <select
        id="project-domain"
        value={domain}
        onChange={(event) => setDomain(event.target.value as (typeof domains)[number][0])}
        className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-4 py-3 text-sm outline-none focus:border-[#a07837]"
      >
        {domains.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>

      <label className="mt-6 block text-xs uppercase tracking-[0.12em] text-[#687168]" htmlFor="project-purpose">Purpose and intended change</label>
      <textarea
        id="project-purpose"
        required
        minLength={10}
        maxLength={2000}
        rows={5}
        value={purpose}
        onChange={(event) => setPurpose(event.target.value)}
        className="mt-2 w-full resize-y border border-[#c9c2b1] bg-[#fffaf0] px-4 py-3 text-sm leading-relaxed outline-none focus:border-[#a07837]"
        placeholder="State the operational problem, who is affected, and what this project intends to improve."
      />

      <div className="mt-6 border-l-2 border-[#a07837] bg-[#f2ede2] p-4">
        <p className="text-xs leading-relaxed text-[#687168]">The database will create an active project manager membership for you using your persisted workspace functional role. Project creation and that initial membership are one transaction.</p>
      </div>
      {error && <p role="alert" className="mt-5 border border-[#c96e5b] bg-[#f9e8e2] p-3 text-xs text-[#914634]">{error}</p>}
      <button disabled={pending || !organizationId} className="mt-8 bg-[#17382d] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#f7f0df] disabled:opacity-60">
        {pending ? 'Creating project…' : 'Create project workspace'}
      </button>
    </form>
  )
}

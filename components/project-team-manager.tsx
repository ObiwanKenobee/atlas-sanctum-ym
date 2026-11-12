'use client'

import { FormEvent, useState } from 'react'

type TeamMember = {
  userId: string
  email: string | null
  accessLevel: 'manager' | 'contributor' | 'viewer'
  functionalRole: string
  status: 'active' | 'inactive'
}
type AvailableMember = { userId: string; email: string; functionalRole: string }

export default function ProjectTeamManager({
  projectId,
  members,
  candidates,
  canManage,
}: {
  projectId: string
  members: TeamMember[]
  candidates: AvailableMember[]
  canManage: boolean
}) {
  const [userId, setUserId] = useState('')
  const [accessLevel, setAccessLevel] = useState<'manager' | 'contributor' | 'viewer'>('contributor')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accessLevel }),
      })
      const payload = await response.json().catch(() => null) as { error?: string } | null

      if (!response.ok) {
        const messages: Record<string, string> = {
          organization_admin_required: 'Only an organization owner or admin can assign project members.',
          active_organization_member_with_profile_required: 'Choose an active organization member with a completed workspace profile.',
          project_membership_already_exists: 'That person already has a project membership. Existing memberships are not overwritten.',
          project_not_found: 'This project is not available to your account.',
          member_profile_or_scope_invalid: 'The selected member no longer meets the organization or workspace-role requirements.',
        }
        setError(messages[payload?.error ?? ''] ?? 'The member could not be added. Please try again.')
        return
      }

      setSuccess('Project membership added and recorded in the audit history.')
      setUserId('')
      window.location.reload()
    } catch {
      setError('The request could not be completed. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-8">
        <div className="flex items-end justify-between gap-3 border-b border-[#d4cebd] pb-4">
          <div>
            <h2 className="font-serif text-2xl font-light">Project membership</h2>
            <p className="mt-1 text-xs text-[#687168]">Access and functional responsibility are separate fields.</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#687168]">{members.length} records</span>
        </div>
        {members.length ? (
          <div className="divide-y divide-[#e1dbce]">
            {members.map((member) => (
              <article key={member.userId} className="py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium">{member.email ?? 'Project member'}</h3>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-[#687168]">{member.functionalRole}</p>
                  </div>
                  <span className={`border px-2 py-1 text-[10px] uppercase tracking-[0.12em] ${member.status === 'active' ? 'border-[#98b29e] bg-[#e6efe5] text-[#47634e]' : 'border-[#d4cebd] text-[#687168]'}`}>{member.status}</span>
                </div>
                <p className="mt-3 text-xs text-[#687168]">Project access: {member.accessLevel}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className="py-8 text-sm text-[#687168]">No project memberships are visible.</p>
        )}
      </section>

      <aside className="border border-[#d4cebd] bg-[#efe9dc] p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">Add an existing member</p>
        {canManage ? (
          candidates.length ? (
            <form onSubmit={submit} className="mt-6">
              <label htmlFor="team-member" className="block text-xs uppercase tracking-[0.12em] text-[#687168]">Organization member</label>
              <select
                id="team-member"
                required
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm outline-none focus:border-[#a07837]"
              >
                <option value="">Select a member</option>
                {candidates.map((candidate) => (
                  <option key={candidate.userId} value={candidate.userId}>{candidate.email} · {candidate.functionalRole}</option>
                ))}
              </select>
              <label htmlFor="team-access" className="mt-5 block text-xs uppercase tracking-[0.12em] text-[#687168]">Project access</label>
              <select
                id="team-access"
                value={accessLevel}
                onChange={(event) => setAccessLevel(event.target.value as typeof accessLevel)}
                className="mt-2 w-full border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 text-sm outline-none focus:border-[#a07837]"
              >
                <option value="contributor">Contributor</option>
                <option value="viewer">Viewer</option>
                <option value="manager">Manager</option>
              </select>
              <p className="mt-4 text-xs leading-relaxed text-[#687168]">The functional role is read from the member’s persisted workspace profile. This form cannot change it. Only active members of this organization are eligible.</p>
              {error && <p role="alert" className="mt-4 border border-[#c96e5b] bg-[#f9e8e2] p-3 text-xs text-[#914634]">{error}</p>}
              {success && <p role="status" className="mt-4 border border-[#98b29e] bg-[#e6efe5] p-3 text-xs text-[#47634e]">{success}</p>}
              <button disabled={pending || !userId} className="mt-6 bg-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-[#f7f0df] disabled:opacity-60">
                {pending ? 'Adding member…' : 'Add project member'}
              </button>
            </form>
          ) : (
            <p className="mt-5 text-sm leading-relaxed text-[#687168]">No eligible organization members are available. Members need an active organization membership and a completed workspace profile.</p>
          )
        ) : (
          <p className="mt-5 text-sm leading-relaxed text-[#687168]">Only an organization owner or admin can assign existing organization members to this project. Ask an organization admin to manage the roster.</p>
        )}
        <p className="mt-6 border-t border-[#d4cebd] pt-5 text-xs leading-relaxed text-[#687168]">New email invitations and external-user onboarding are not enabled. This action only adds an existing active organization member.</p>
      </aside>
    </div>
  )
}

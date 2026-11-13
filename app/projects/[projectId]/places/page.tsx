
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import ProjectPlaceForm from '@/components/project-place-form'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Project places | Atlas Sanctum',
  description: 'Register the geographic and administrative places covered by a project.',
}

const placeRoles = ['analyst', 'authorizer', 'implementer', 'verifier', 'steward']

function formatCoordinate(value: number | null) {
  return value === null ? 'Not recorded' : Number(value).toFixed(6)
}

export default async function ProjectPlacesPage({
  params,
}: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, organization_id, name, purpose, status')
    .eq('id', projectId)
    .maybeSingle()

  if (projectError) throw new Error('Unable to load this project')
  if (!project || project.status !== 'active') notFound()

  const [membershipResult, placesResult] = await Promise.all([
    supabase.from('project_memberships')
      .select('access_level, functional_role, status')
      .eq('project_id', project.id)
      .eq('organization_id', project.organization_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle(),
    supabase.from('project_places')
      .select('id, name, slug, place_type, administrative_area, latitude, longitude, description, created_at')
      .eq('project_id', project.id)
      .eq('organization_id', project.organization_id)
      .order('name', { ascending: true }),
  ])

  if (membershipResult.error) throw new Error('Unable to verify project permissions')
  if (placesResult.error) throw new Error('Unable to load project places')

  const membership = membershipResult.data
  const canCreatePlace = Boolean(
    membership &&
    ['manager', 'contributor'].includes(membership.access_level) &&
    placeRoles.includes(membership.functional_role),
  )
  const places = placesResult.data ?? []

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href={'/projects/' + project.id + '/decisions'} className="text-xs text-[#687168] hover:text-[#17382d]">← Decision register</Link>
          <Link href="/workspace" className="font-serif text-lg tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">{project.name} / Place registry</p>
        <h1 className="mt-5 max-w-4xl font-serif text-5xl font-light leading-[0.98] tracking-[-0.04em] sm:text-7xl">Anchor the work <em className="text-[#a07837]">to place.</em></h1>
        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#687168]">Places define the project geography and administrative context. Evidence records must attach to one place in this project; place identity is not inferred from personal records.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={'/projects/' + project.id + '/evidence'} className="border border-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] hover:bg-[#17382d] hover:text-[#f7f3ea]">Project evidence</Link>
          <Link href={'/projects/' + project.id + '/team'} className="border border-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] hover:bg-[#17382d] hover:text-[#f7f3ea]">Project team</Link>
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.1fr]">
          <section>
            <div className="border-b border-[#c9c2b1] pb-4">
              <h2 className="font-serif text-2xl font-light">Registered places</h2>
              <p className="mt-1 text-xs text-[#687168]">{places.length} places in this project</p>
            </div>
            {places.length ? (
              <div className="divide-y divide-[#d4cebd]">
                {places.map((place) => (
                  <article key={place.id} className="py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-serif text-xl font-light">{place.name}</h3>
                      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#a07837]">{place.place_type.replaceAll('_', ' ')}</span>
                    </div>
                    <p className="mt-1 text-xs text-[#687168]">{place.administrative_area ?? 'Administrative area not recorded'}</p>
                    <p className="mt-3 text-[11px] text-[#687168]">Latitude: {formatCoordinate(place.latitude)} · Longitude: {formatCoordinate(place.longitude)}</p>
                    {place.description && <p className="mt-3 text-sm leading-relaxed text-[#687168]">{place.description}</p>}
                    <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.1em] text-[#687168]">/{place.slug}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-[#b9b29f] bg-[#f2ede2] px-5 py-8">
                <h3 className="font-serif text-2xl font-light">No project places yet.</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#687168]">Register the first ward, facility, catchment, community, or other location before collecting institutional evidence.</p>
              </div>
            )}
          </section>
          <section>
            <div className="border-b border-[#c9c2b1] pb-4">
              <h2 className="font-serif text-2xl font-light">Register a place</h2>
              <p className="mt-1 text-xs text-[#687168]">Only active project members with a place-writing functional role can create places.</p>
            </div>
            <div className="mt-5">
              {canCreatePlace ? (
                <ProjectPlaceForm projectId={project.id} />
              ) : (
                <div className="border border-[#d4cebd] bg-[#efe9dc] p-6">
                  <h3 className="font-serif text-xl font-light">Place-writing permission required</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#687168]">An active project manager or contributor with an allowed functional role is required. The database enforces the same rule.</p>
                </div>
              )}
            </div>
          </section>
        </div>
        <p className="mt-10 border-t border-[#d4cebd] pt-5 text-xs leading-relaxed text-[#687168]">Project managers may correct place metadata; updates are audited. Evidence and decisions retain their project and place references.</p>
      </div>
    </main>
  )
}

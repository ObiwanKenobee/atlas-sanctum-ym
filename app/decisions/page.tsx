import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Decision Workspace | Atlas Sanctum',
  description: 'Move from project evidence to inspectable decisions and accountable authorization.',
}

export default async function DecisionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  const { data: records, error } = await supabase
    .from('field_records')
    .select('id, title, category, region, observed_on')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw new Error('Unable to load recent personal field records')

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/overview" className="text-xs text-[#687168] hover:text-[#17382d]">← Overview</Link>
          <Link href="/records?new=1" className="border border-[#17382d] px-4 py-3 text-[10px] uppercase tracking-[0.14em] hover:bg-[#17382d] hover:text-[#f7f0df]">Capture field record</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Workspace / Decisions</p>
        <h1 className="mt-5 max-w-4xl font-serif text-6xl font-light leading-[0.95] tracking-[-0.04em] sm:text-8xl">Make the reasoning <em className="text-[#a07837]">inspectable.</em></h1>
        <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#687168]">A decision is a chain, not a single form. Project decisions retain their alternatives, cited evidence, uncertainty, and independent authorization by exact version.</p>

        <section className="mt-12 border border-[#c9c2b1] bg-[#efe9dc] p-7 sm:p-9">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">Institutional workspace</p>
          <h2 className="mt-4 font-serif text-3xl font-light">Open a project decision register.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#687168]">Browse only the projects where your membership is active. Each project register preserves decision versions, alternatives, source citations, and authorization outcomes.</p>
          <Link href="/projects" className="mt-7 inline-flex bg-[#17382d] px-5 py-3 text-[10px] uppercase tracking-[0.14em] text-[#f7f0df] hover:bg-[#285344]">Open projects →</Link>
        </section>

        <section aria-labelledby="recent-evidence" className="mt-16">
          <div className="flex items-end justify-between border-b border-[#c9c2b1] pb-4">
            <div>
              <h2 id="recent-evidence" className="font-serif text-3xl font-light">Recent personal field records</h2>
              <p className="mt-2 text-xs text-[#687168]">These user-owned records are not automatically treated as institutional project evidence.</p>
            </div>
            <Link href="/evidence/library" className="text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Open library</Link>
          </div>
          {records?.length ? (
            <div className="divide-y divide-[#d4cebd]">
              {records.map((record) => (
                <div key={record.id} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-serif text-2xl">{record.title}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#687168]">{record.category} · {record.region}</p>
                  </div>
                  <time className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#687168]" dateTime={record.observed_on}>{record.observed_on}</time>
                </div>
              ))}
            </div>
          ) : (
            <p className="py-10 text-sm text-[#687168]">No personal field records yet. Capture an observation when you have one.</p>
          )}
        </section>
      </div>
    </main>
  )
}

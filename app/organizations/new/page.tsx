import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import OrganizationSetupForm from '@/components/organization-setup-form'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Create an organization | Atlas Sanctum',
  description: 'Establish an organization workspace with an accountable owner.',
}

export default async function NewOrganizationPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <header className="border-b border-[#d4cebd]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
          <Link href="/projects" className="text-xs text-[#687168] hover:text-[#17382d]">← Projects</Link>
          <Link href="/" className="font-serif text-lg tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Institutional workspace / Organization</p>
        <h1 className="mt-5 max-w-3xl font-serif text-5xl font-light leading-[0.98] tracking-[-0.04em] sm:text-7xl">Establish a <em className="text-[#a07837]">responsible home</em> for the work.</h1>
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-[#687168]">An organization is the tenant boundary for its projects, collaborators, evidence, and decisions. The account creating it receives the owner role in the same database transaction.</p>
        <div className="mt-10 max-w-2xl">
          <OrganizationSetupForm />
        </div>
        <p className="mt-8 max-w-2xl border-t border-[#d4cebd] pt-5 text-xs leading-relaxed text-[#687168]">Creating an organization does not create a project, invite external users, or establish an institutional partnership. Those steps require separate authorization and confirmation.</p>
      </div>
    </main>
  )
}

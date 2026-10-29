'use client'

import { ArrowDownRight, ArrowUpRight, Check, FileCheck2, MapPinned, MessagesSquare, ShieldCheck } from 'lucide-react'
import AtlasConversion from '@/components/atlas-conversion'

function PilotButton({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('atlas:open-pilot'))}
      className={className}
    >
      {children}
    </button>
  )
}

const offers = [
  {
    number: '01',
    title: 'Evidence & Decision Sprint',
    price: 'KES 75,000–150,000',
    timing: 'Typically 1–2 weeks',
    summary: 'A tightly scoped engagement to clarify one important decision before an organisation commits larger resources.',
    includes: [
      'One location and one defined decision question',
      'Review of client-provided and agreed public sources',
      'Evidence register with gaps, dates and limitations',
      'Comparison of 2–3 options and their trade-offs',
      'Decision brief and recommended next steps',
    ],
    excludes: 'Field surveys, paid datasets, custom software integrations and independent field verification unless separately agreed.',
    action: 'Scope a decision sprint',
    featured: false,
  },
  {
    number: '02',
    title: 'Place-based Decision Pilot',
    price: 'KES 250,000–750,000',
    timing: 'Typically 4–8 weeks',
    summary: 'Work with one programme owner to turn a real place-based challenge into a repeatable evidence and decision workflow.',
    includes: [
      'One programme, geography and priority use case',
      'A scoped evidence workflow using agreed data sources',
      'Intervention comparison and documented assumptions',
      'Decision brief plus an agreed dashboard or report output',
      'Outcome indicators, review meeting and handover',
    ],
    excludes: 'Extensive fieldwork, new data collection, specialist imagery, third-party licence costs and bespoke integrations are priced separately.',
    action: 'Discuss a pilot',
    featured: true,
  },
  {
    number: '03',
    title: 'Portfolio & Institutional Partnership',
    price: 'Custom proposal',
    timing: 'Scoped jointly',
    summary: 'For organisations coordinating multiple sites, projects or decision-makers that need a longer-term operating workflow.',
    includes: [
      'Portfolio-level discovery and implementation plan',
      'Role, permission and governance requirements',
      'Data-source and integration assessment',
      'Reporting cadence, support and learning cycle',
      'Clear deliverables, ownership and acceptance criteria',
    ],
    excludes: 'No fixed price is published because scope, data sensitivity, integrations, service levels and procurement requirements materially change the work.',
    action: 'Discuss institutional scope',
    featured: false,
  },
]

export default function WorkWithAtlasPage() {
  return (
    <AtlasConversion>
      <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
        <header className="border-b border-[#d4cebd] bg-[#f7f3ea]">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 lg:px-10">
            <a href="/" className="flex items-center gap-3" aria-label="Atlas Sanctum home">
              <span className="grid size-9 place-items-center border border-[#b59451]"><span className="size-5 rotate-45 border border-[#b59451]" /></span>
              <span className="font-serif text-lg tracking-[0.16em]">ATLAS <span className="font-sans text-[10px] font-medium tracking-[0.22em]">SANCTUM</span></span>
            </a>
            <nav className="hidden items-center gap-6 text-[10px] uppercase tracking-[0.16em] text-[#687168] md:flex" aria-label="Commercial page navigation">
              <a href="/#observatory" className="hover:text-[#a07837]">Observatory</a>
              <a href="/#solutions" className="hover:text-[#a07837]">Solutions</a>
              <a href="/#commons" className="hover:text-[#a07837]">Commons</a>
            </nav>
            <PilotButton className="inline-flex items-center gap-2 border border-[#17382d] bg-[#17382d] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#f7f0df] transition-colors hover:bg-[#285241]">
              Discuss your use case <ArrowUpRight className="size-3" />
            </PilotButton>
          </div>
        </header>

        <section className="bg-[#17382d] px-5 py-20 text-[#f7f0df] lg:px-10 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.1fr_0.65fr] lg:items-end">
            <div>
              <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d8c28f]"><span className="h-px w-8 bg-current" />Commercial engagements</p>
              <h1 className="max-w-4xl font-serif text-5xl font-light leading-[1.02] tracking-[-0.04em] sm:text-7xl">Start with one decision <em className="text-[#d8c28f]">worth getting right.</em></h1>
              <p className="mt-7 max-w-2xl text-lg font-light leading-relaxed text-[#d1d3c6]">Atlas helps institutions connect place-based evidence, intervention options and accountable next steps. Start with a bounded decision sprint; expand only when the evidence and working relationship justify it.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <PilotButton className="inline-flex items-center gap-3 bg-[#d8c28f] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#17382d] hover:bg-[#f0dfb0]">Scope a conversation <ArrowUpRight className="size-4" /></PilotButton>
                <a href="#engagements" className="inline-flex items-center gap-3 border border-[#547064] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f7f0df] hover:border-[#d8c28f]">Explore engagement options <ArrowDownRight className="size-4" /></a>
              </div>
              <p className="mt-6 text-xs leading-relaxed text-[#aebbb0]">Prices below are indicative launch ranges in Kenyan shillings, not binding quotations. Final scope and price are confirmed in writing before work begins.</p>
            </div>
            <div className="border border-[#547064] bg-[#102a21] p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d8c28f]">The working principle</p>
              <p className="mt-5 font-serif text-3xl font-light leading-tight">Buy a clearer decision—not another dashboard.</p>
              <div className="mt-7 flex flex-col gap-4 border-t border-[#315044] pt-6 text-sm text-[#d1d3c6]">
                <p className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#d8c28f]" />A defined question and deliverable</p>
                <p className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#d8c28f]" />Visible assumptions, evidence gaps and trade-offs</p>
                <p className="flex gap-3"><Check className="mt-0.5 size-4 shrink-0 text-[#d8c28f]" />A plan to verify what happens next</p>
              </div>
            </div>
          </div>
        </section>

        <section id="engagements" className="mx-auto max-w-7xl px-5 py-20 lg:px-10 lg:py-28">
          <div className="mb-12 max-w-3xl">
            <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a07837]"><span className="h-px w-8 bg-current" />Ways to work together</p>
            <h2 className="font-serif text-4xl font-light leading-tight tracking-[-0.03em] sm:text-5xl">Choose the smallest engagement that can answer the question.</h2>
            <p className="mt-5 max-w-2xl text-sm leading-relaxed text-[#687168]">These are service-led offers around the current product direction—not claims that every dashboard, dataset integration or verification capability is already automated.</p>
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            {offers.map((offer) => (
              <article key={offer.number} className={`flex flex-col border p-6 sm:p-7 ${offer.featured ? 'border-[#a07837] bg-[#eee8d9] shadow-[0_18px_48px_rgba(20,45,35,0.08)]' : 'border-[#d4cebd] bg-[#fbf8f0]'}`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] text-[#a07837]">{offer.number} / ENGAGEMENT</span>
                  {offer.featured && <span className="border border-[#a07837] px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#805d24]">Pilot</span>}
                </div>
                <h3 className="mt-7 font-serif text-2xl font-light leading-tight">{offer.title}</h3>
                <p className="mt-4 text-2xl font-light tracking-[-0.03em]">{offer.price}</p>
                <p className="mt-2 text-[10px] uppercase tracking-[0.14em] text-[#8a8f83]">{offer.timing}</p>
                <p className="mt-5 min-h-[72px] text-sm leading-relaxed text-[#687168]">{offer.summary}</p>
                <div className="mt-6 border-t border-[#d4cebd] pt-5">
                  <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a07837]">Included</p>
                  <ul className="flex flex-col gap-3">
                    {offer.includes.map((item) => <li key={item} className="flex gap-3 text-xs leading-relaxed text-[#455148]"><Check className="mt-0.5 size-3.5 shrink-0 text-[#a07837]" />{item}</li>)}
                  </ul>
                </div>
                <div className="mt-6 border-t border-[#d4cebd] pt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#687168]">Scope notes</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#687168]">{offer.excludes}</p>
                </div>
                <PilotButton className={`mt-7 inline-flex w-full items-center justify-center gap-2 border px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] transition-colors ${offer.featured ? 'border-[#17382d] bg-[#17382d] text-[#f7f0df] hover:bg-[#285241]' : 'border-[#a07837] text-[#805d24] hover:bg-[#efe8d8]'}`}>
                  {offer.action} <ArrowUpRight className="size-3" />
                </PilotButton>
              </article>
            ))}
          </div>
          <p className="mt-5 text-xs leading-relaxed text-[#687168]">All figures are planning ranges only. Third-party data, travel, fieldwork, taxes, procurement requirements and integrations are included only when explicitly listed in the written scope.</p>
        </section>

        <section className="border-y border-[#d4cebd] bg-[#efe9dc] px-5 py-20 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a07837]"><span className="h-px w-8 bg-current" />Good fit</p>
              <h2 className="font-serif text-4xl font-light leading-tight">Bring a real decision, not a perfect dataset.</h2>
              <p className="mt-5 text-sm leading-relaxed text-[#687168]">We scope the work around your decision deadline, existing evidence, data permissions and the people who need to use the result.</p>
            </div>
            <div className="grid gap-0 sm:grid-cols-2">
              {[
                ['County and public programmes', 'Understand where a service or investment is falling short and what evidence is needed next.'],
                ['NGOs and foundations', 'Connect project information, reporting needs and outcome indicators.'],
                ['Climate and agriculture teams', 'Compare place-based options with explicit assumptions and source limitations.'],
                ['Researchers and open-source teams', 'Build an inspectable evidence workflow that other teams can review and reuse.'],
              ].map(([title, description]) => <div key={title} className="border-b border-[#c9c2b1] py-5 sm:px-6 sm:first:pl-0 sm:even:border-l"><h3 className="font-serif text-xl">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#687168]">{description}</p></div>)}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-20 lg:px-10">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="border border-[#d4cebd] p-6"><MapPinned className="size-5 text-[#a07837]" /><h3 className="mt-5 font-serif text-xl">One place first</h3><p className="mt-2 text-sm leading-relaxed text-[#687168]">We begin with a bounded geography and a named problem owner instead of promising global coverage immediately.</p></div>
            <div className="border border-[#d4cebd] p-6"><FileCheck2 className="size-5 text-[#a07837]" /><h3 className="mt-5 font-serif text-xl">Inspectable outputs</h3><p className="mt-2 text-sm leading-relaxed text-[#687168]">Deliverables identify source material, assumptions, limitations and decisions that remain for the client to make.</p></div>
            <div className="border border-[#d4cebd] p-6"><ShieldCheck className="size-5 text-[#a07837]" /><h3 className="mt-5 font-serif text-xl">Responsible by design</h3><p className="mt-2 text-sm leading-relaxed text-[#687168]">We minimise sensitive data, agree access before work and do not promise outcomes we cannot verify.</p></div>
          </div>
        </section>

        <section className="bg-[#b59451] px-5 py-16 text-[#17382d] lg:px-10 lg:py-20">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div>
              <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.22em]">Start with a conversation</p>
              <h2 className="max-w-2xl font-serif text-4xl font-light leading-tight sm:text-5xl">What decision is your team struggling to make?</h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#3c5143]">Tell us the location, the decision, and what evidence you already have. We will use that to define a realistic scope and a written proposal.</p>
            </div>
            <PilotButton className="inline-flex shrink-0 items-center justify-center gap-3 border border-[#17382d] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-[#17382d] hover:text-[#f7f0df]">Open pilot inquiry <MessagesSquare className="size-4" /></PilotButton>
          </div>
        </section>

        <footer className="bg-[#102a21] px-5 py-8 text-[#b9c0b5] lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <a href="/" className="font-serif text-sm tracking-[0.16em] text-[#f7f0df]">ATLAS SANCTUM</a>
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs"><a href="/#observatory" className="hover:text-[#f7f0df]">Observatory</a><a href="/#commons" className="hover:text-[#f7f0df]">Open-source Commons</a><a href="mailto:hello@atlassanctum.org" className="hover:text-[#f7f0df]">Email Atlas</a></div>
            <p className="text-[10px]">© {new Date().getFullYear()} Atlas Sanctum</p>
          </div>
        </footer>
      </main>
    </AtlasConversion>
  )
}

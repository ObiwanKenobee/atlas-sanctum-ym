'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight, ChevronDown, CircleCheck, Menu, X } from 'lucide-react'
import AtlasDonate from '@/components/atlas-donate'

const locations = {
  Turkana: {
    country: 'Kenya',
    problem: 'Water access & food security',
    freshness: '14 days ago',
    confidence: 'Moderate',
    evidence: '42 sources',
    interventions: [
      { name: 'Solar water points', cost: '$148k', impact: 'High', risk: 'Moderate' },
      { name: 'Drought-resilient seed banks', cost: '$72k', impact: 'Medium', risk: 'Low' },
      { name: 'Pastoral early-warning network', cost: '$34k', impact: 'Medium', risk: 'Low' },
    ],
  },
  Kisumu: {
    country: 'Kenya',
    problem: 'Urban flood resilience',
    freshness: '9 days ago',
    confidence: 'High',
    evidence: '58 sources',
    interventions: [
      { name: 'Wetland restoration', cost: '$210k', impact: 'High', risk: 'Low' },
      { name: 'Community drainage mapping', cost: '$41k', impact: 'Medium', risk: 'Low' },
      { name: 'Climate-ready market hubs', cost: '$188k', impact: 'High', risk: 'Moderate' },
    ],
  },
  Mbarara: {
    country: 'Uganda',
    problem: 'Smallholder productivity',
    freshness: '21 days ago',
    confidence: 'Moderate',
    evidence: '37 sources',
    interventions: [
      { name: 'Cooperative soil labs', cost: '$96k', impact: 'High', risk: 'Low' },
      { name: 'Regenerative grazing pilots', cost: '$55k', impact: 'Medium', risk: 'Moderate' },
      { name: 'Market price observatory', cost: '$29k', impact: 'Medium', risk: 'Low' },
    ],
  },
}

type LocationName = keyof typeof locations

const partnerships = [
  { name: 'Kenya Climate Innovation Center', short: 'KCIC', type: 'Prospective partner', copy: 'Climate innovation, enterprise development, and potential pilot pathways.', website: 'https://kenyacic.org' },
  { name: 'Water Sector Trust Fund', short: 'WaterFund', type: 'Prospective partner', copy: 'Water access, infrastructure prioritization, and public-service outcomes.', website: 'https://waterfund.go.ke' },
  { name: 'Kenya Agricultural and Livestock Research Organization', short: 'KALRO', type: 'Prospective research partner', copy: 'Agricultural evidence, research discovery, and climate-resilient food systems.', website: 'https://kalro.org' },
  { name: '@iLabAfrica, Strathmore University', short: '@iLabAfrica', type: 'Prospective research partner', copy: 'Technical research, applied innovation, and independent evaluation.', website: 'https://ilabafrica.strathmore.edu' },
  { name: 'United Nations Development Programme', short: 'UNDP', type: 'Institutional engagement target', copy: 'Inclusive development, public-sector innovation, and experimentation.', website: 'https://undp.org' },
  { name: 'World Resources Institute', short: 'WRI', type: 'Research ecosystem target', copy: 'Climate, cities, forests, and evidence-based environmental decisions.', website: 'https://wri.org' },
  { name: 'OpenFn', short: 'OpenFn', type: 'Technical ecosystem target', copy: 'Open-source data integration and workflow automation for connected institutional systems.', website: 'https://openfn.org' },
  { name: 'KoboToolbox', short: 'KoboToolbox', type: 'Technical ecosystem target', copy: 'Field data collection for humanitarian and development work.', website: 'https://kobotoolbox.org' },
]

function PartnershipCarousel() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % partnerships.length), 4500)
    return () => window.clearInterval(timer)
  }, [])

  const visible = [0, 1, 2].map((offset) => partnerships[(active + offset) % partnerships.length])

  return (
    <section id="partnerships" aria-labelledby="partnerships-heading" className="border-y border-[#c9c2b1] bg-[#efe9dc] px-5 py-16 lg:px-10 lg:py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div><SectionLabel>Partnership constellation</SectionLabel><h2 id="partnerships-heading" className="max-w-xl font-serif text-4xl font-light leading-[1.05] tracking-[-0.03em] sm:text-5xl">Built with the people closest to the work.</h2></div>
          <p className="max-w-xs text-sm leading-relaxed text-[#687168]">A growing network of prospective partners across evidence, implementation, and technical infrastructure.</p>
        </div>
        <div className="grid gap-px overflow-hidden border border-[#c9c2b1] bg-[#c9c2b1] md:grid-cols-3">
          {visible.map((partner, index) => <a key={`${partner.name}-${active}`} href={partner.website} target="_blank" rel="noreferrer" className="group flex min-h-[245px] flex-col justify-between bg-[#f7f3ea] p-6 transition-colors hover:bg-[#f7efd7] sm:p-8"><div><div className="flex items-start justify-between gap-4"><span className="font-serif text-3xl text-[#17382d]">{partner.short}</span><ArrowUpRight className="size-4 text-[#a07837] transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" /></div><p className="mt-8 text-[10px] uppercase tracking-[0.17em] text-[#a07837]">{partner.type}</p><h3 className="mt-2 font-serif text-2xl font-light leading-tight">{partner.name}</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">{partner.copy}</p></div><span className="mt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-[#a07837]">{partner.website.replace('https://', '')}</span></a>)}
        </div>
        <div className="mt-6 flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#687168]">{String(active + 1).padStart(2, '0')} — {String(partnerships.length).padStart(2, '0')} / rotating network</p><div className="flex gap-2" role="tablist" aria-label="Partnership slides">{partnerships.map((partner, index) => <button key={partner.name} type="button" role="tab" aria-selected={index === active} aria-label={`Show partnership ${index + 1}: ${partner.short}`} onClick={() => setActive(index)} className={`h-1.5 transition-all ${index === active ? 'w-8 bg-[#a07837]' : 'w-1.5 bg-[#b9b29f] hover:bg-[#a07837]'}`} />)}</div></div>
      </div>
    </section>
  )
}

function Mark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid size-9 place-items-center border ${light ? 'border-[#d8c28f]' : 'border-[#b59451]'}`}>
        <span className={`relative block size-5 rotate-45 border ${light ? 'border-[#d8c28f]' : 'border-[#b59451]'}`}>
          <span className={`absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${light ? 'bg-[#d8c28f]' : 'bg-[#b59451]'}`} />
        </span>
      </span>
      <span className={`font-serif text-xl tracking-[0.18em] ${light ? 'text-[#f7f0df]' : 'text-[#17382d]'}`}>ATLAS <span className="font-sans text-[10px] font-medium tracking-[0.24em]">SANCTUM</span></span>
    </div>
  )
}

function SectionLabel({ children, light = false }: { children: string; light?: boolean }) {
  return <p className={`mb-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.25em] ${light ? 'text-[#d8c28f]' : 'text-[#a07837]'}`}><span className="h-px w-8 bg-current" />{children}</p>
}

function ObservatoryDemo() {
  const [location, setLocation] = useState<LocationName>('Turkana')
  const [selected, setSelected] = useState(0)
  const data = locations[location]
  const selectedIntervention = data.interventions[selected]

  function exportDecisionBrief() {
    const report = [
      '# Atlas Sanctum — Decision Brief (Prototype)',
      '',
      'STATUS: SIMULATED DEMONSTRATION — NOT VERIFIED FIELD EVIDENCE',
      `Generated: ${new Date().toISOString()}`,
      `Place: ${location}, ${data.country}`,
      `Illustrative problem: ${data.problem}`,
      '',
      '## Illustrative evidence summary',
      'This demonstration uses sample content to show the intended workflow. Source records, source dates, counts, costs, confidence levels, and impacts have not been verified for this location.',
      `Displayed sample count: ${data.evidence}`,
      `Displayed sample freshness: ${data.freshness}`,
      `Displayed sample confidence: ${data.confidence}`,
      '',
      '## Selected illustrative intervention',
      `Option: ${selectedIntervention.name}`,
      `Displayed sample cost: ${selectedIntervention.cost}`,
      `Displayed sample impact: ${selectedIntervention.impact}`,
      `Displayed sample risk: ${selectedIntervention.risk}`,
      '',
      '## Before any real decision',
      '- Replace sample values with dated, inspectable sources.',
      '- Confirm the geography and problem with local stakeholders.',
      '- Document cost assumptions, alternatives, uncertainty, and responsible decision owner.',
      '- Agree measurable indicators, baseline, follow-up dates, and independent verification.',
      '',
      'Atlas Sanctum — technology in service of truth, stewardship, and human flourishing.',
    ].join('\\n')
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `atlas-decision-brief-${location.toLowerCase()}-sample.md`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="overflow-hidden border border-[#b9b29f] bg-[#f7f3ea] shadow-[0_20px_60px_rgba(20,45,35,0.1)]">
      <div className="flex flex-col justify-between gap-4 border-b border-[#d4cebd] px-5 py-4 sm:flex-row sm:items-center sm:px-8">
        <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a07837]">Atlas Observatory / sample mode</p><p className="mt-1 text-sm text-[#17382d]">Development intelligence workspace</p></div>
        <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-[#687168]"><span className="size-2 rounded-full bg-[#a07837]" />Simulated data</span>
      </div>
      <div className="grid lg:grid-cols-[1.05fr_1fr]">
        <div className="relative min-h-[340px] overflow-hidden border-b border-[#d4cebd] bg-[#17382d] p-5 text-[#f7f0df] lg:border-b-0 lg:border-r lg:p-8">
          <div className="absolute inset-0 opacity-50" style={{ backgroundImage: 'linear-gradient(rgba(213,194,144,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(213,194,144,.12) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
          <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 500 430" preserveAspectRatio="none" aria-hidden="true"><path d="M70 340C130 270 100 180 220 150S320 220 430 70M20 220C130 180 180 260 280 230S360 140 490 180M120 20c20 90 100 100 150 170s20 130 130 210" fill="none" stroke="#d8c28f" strokeDasharray="3 7" strokeWidth="1" /><circle cx="220" cy="150" fill="#d8c28f" r="5" /><circle cx="100" cy="180" fill="#d8c28f" r="3" /><circle cx="360" cy="140" fill="#d8c28f" r="3" /></svg>
          <div className="relative z-10 flex h-full flex-col justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#d8c28f]">01 / Observe</p><h3 className="mt-3 max-w-xs font-serif text-4xl font-light leading-[1.05]">Read the place<br />before the plan.</h3></div><div className="flex items-end justify-between gap-4"><div><p className="text-2xl font-light">{data.evidence}</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#b9c0b5]">Evidence points</p></div><div className="text-right"><p className="text-sm">{data.freshness}</p><p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-[#b9c0b5]">Data freshness</p></div></div></div>
        </div>
        <div className="p-5 sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#687168]">Sample decision workspace</p>
            <button type="button" onClick={exportDecisionBrief} className="inline-flex items-center gap-2 border border-[#a07837] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#a07837] transition-colors hover:bg-[#efe8d8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a07837]">
              Export sample brief <ArrowUpRight className="size-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-[#d4cebd] pb-6"><label className="sr-only" htmlFor="location">Select location</label><div className="relative"><select id="location" value={location} onChange={(e) => { setLocation(e.target.value as LocationName); setSelected(0) }} className="appearance-none border border-[#b9b29f] bg-transparent py-2 pl-3 pr-9 text-sm text-[#17382d] outline-none"><option>Turkana</option><option>Kisumu</option><option>Mbarara</option></select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-[#a07837]" /></div><span className="py-2 text-xs text-[#687168]">{data.country} / {data.problem}</span></div>
          <div className="flex flex-col gap-6 pt-6"><div><p className="text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Evidence brief</p><p className="mt-2 text-sm leading-relaxed text-[#455148]">Livelihoods are exposed to seasonal water stress. Existing boreholes are unevenly distributed and market access changes with rainfall.</p></div><div className="grid grid-cols-2 gap-3"><div className="border border-[#d4cebd] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[#687168]">Confidence</p><p className="mt-2 text-sm text-[#17382d]">{data.confidence}</p></div><div className="border border-[#d4cebd] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[#687168]">Sources</p><p className="mt-2 text-sm text-[#17382d]">NGOs + public</p></div></div><div><p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#a07837]">02 / Recommend</p><div className="flex flex-col gap-2">{data.interventions.map((item, index) => <button key={item.name} onClick={() => setSelected(index)} className={`flex items-center justify-between border p-3 text-left transition-colors ${selected === index ? 'border-[#a07837] bg-[#efe8d8]' : 'border-[#d4cebd] hover:bg-[#f0ecdf]'}`}><span><span className="block text-sm text-[#17382d]">{item.name}</span><span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[#687168]">{item.cost} / {item.impact} impact</span></span><ArrowUpRight className="size-4 text-[#a07837]" /></button>)}</div></div></div>
        </div>
      </div>
      <div className="grid border-t border-[#d4cebd] bg-[#eee9dc] sm:grid-cols-3"><div className="border-b border-[#d4cebd] px-5 py-4 sm:border-b-0 sm:border-r"><p className="font-mono text-[10px] text-[#a07837]">03 / Authorize</p><p className="mt-1 text-xs text-[#455148]">Decision record ready</p></div><div className="border-b border-[#d4cebd] px-5 py-4 sm:border-b-0 sm:border-r"><p className="font-mono text-[10px] text-[#a07837]">04 / Execute</p><p className="mt-1 text-xs text-[#455148]">Partner confirmation required</p></div><div className="px-5 py-4"><p className="font-mono text-[10px] text-[#a07837]">05 / Verify & learn</p><p className="mt-1 text-xs text-[#455148]">Outcome indicators defined</p></div></div>
    </div>
  )
}

const githubUrl = 'https://github.com/ObiwanKenobee/atlas-sanctum-ym'
const navigation = [
  { label: 'Observatory', href: '#observatory' },
  { label: 'Platform', items: [['Regenerative Decision Engine', '/platform'], ['How It Works', '/how-it-works'], ['Evidence & Decision Records', '/evidence'], ['Ethical Finance', '/finance'], ['Humanitarian Network', '/humanitarian'], ['Regenerative Economy', '/regenerative'], ['Blog', '/blog']] },
  { label: 'Solutions', items: [['Water & Climate Resilience', '/solutions/water-climate-resilience'], ['Agriculture & Food Systems', '/solutions/agriculture-food-systems'], ['Programme & Grant Accountability', '/solutions/programme-grant-accountability']] },
  { label: 'Commons', items: [['Open-source Projects', '/community/open-source-projects'], ['Contribute on GitHub', '/community/contribute'], ['Principles & Governance', '/community/principles-governance']] },
{ label: 'Research', items: [['Research & Insights', '/research'], ['Methods & Data Sources', '/research/methods'], ['Field Notes & Case Studies', '/research/field-notes']] },
 { label: 'Partnerships', items: [['Work with Atlas', '/work-with-atlas'], ['Pilot Opportunities', '/research/pilots'], ['Research & Implementation', '/research/implementation'], ['Open-source Collaboration', '/research/collaboration']] },
] as const

function openPilotFromHeader() {
  window.dispatchEvent(new Event('atlas:open-pilot'))
}

function SiteNavigation() {
  const [open, setOpen] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(null); setMobileOpen(false) } }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  return <>
    <nav className="hidden items-center gap-6 text-[10px] uppercase tracking-[0.18em] text-[#d1d3c6] lg:flex" aria-label="Primary navigation">
      {navigation.map((item) => 'items' in item ? <div key={item.label} className="relative"><button type="button" aria-expanded={open === item.label} aria-haspopup="true" onClick={() => setOpen(open === item.label ? null : item.label)} className="inline-flex items-center gap-1 transition-colors hover:text-[#d8c28f] focus:outline-none focus:ring-2 focus:ring-[#d8c28f] focus:ring-offset-2 focus:ring-offset-[#17382d]">{item.label}<ChevronDown className={`size-3 transition-transform ${open === item.label ? 'rotate-180' : ''}`} /></button>{open === item.label && <div className="absolute right-0 top-full z-40 mt-4 w-72 border border-[#547064] bg-[#17382d] p-2 normal-case tracking-normal shadow-[0_18px_40px_rgba(0,0,0,0.22)]">{item.items.map(([label, href]) => <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} onClick={() => setOpen(null)} className="block px-3 py-3 text-xs text-[#d1d3c6] hover:bg-[#285342] hover:text-[#f7f0df] focus:bg-[#285342] focus:outline-none">{label}</a>)}</div>}</div> : <a key={item.label} href={item.href} className="transition-colors hover:text-[#d8c28f] focus:outline-none focus:ring-2 focus:ring-[#d8c28f] focus:ring-offset-2 focus:ring-offset-[#17382d]">{item.label}</a>)}
      <button type="button" onClick={openPilotFromHeader} className="border border-[#d8c28f] px-4 py-2 text-[#f7f0df] hover:bg-[#d8c28f] hover:text-[#17382d] focus:outline-none focus:ring-2 focus:ring-[#d8c28f] focus:ring-offset-2 focus:ring-offset-[#17382d]">Discuss a pilot</button>
    </nav>
    <button type="button" className="lg:hidden" aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)}>{mobileOpen ? <X /> : <Menu />}</button>
    {mobileOpen && <nav className="absolute left-5 right-5 top-20 z-30 flex max-h-[calc(100vh-6rem)] flex-col gap-1 overflow-y-auto border border-[#547064] bg-[#17382d] p-4 text-xs uppercase tracking-[0.16em] lg:hidden" aria-label="Mobile navigation">{navigation.map((item) => 'items' in item ? <details key={item.label} open={open === item.label} onToggle={(event) => setOpen(event.currentTarget.open ? item.label : null)} className="border-b border-[#315044] last:border-b-0"><summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[#f7f0df] focus:outline-none focus:ring-2 focus:ring-[#d8c28f]"><span>{item.label}</span><ChevronDown className="size-3" /></summary><div className="flex flex-col pb-2 pl-3 normal-case tracking-normal">{item.items.map(([label, href]) => <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noreferrer' : undefined} onClick={() => setMobileOpen(false)} className="py-2 text-[#b9c0b5] hover:text-[#f7f0df]">{label}</a>)}</div></details> : <a key={item.label} href={item.href} onClick={() => setMobileOpen(false)} className="border-b border-[#315044] py-3 text-[#f7f0df] last:border-b-0">{item.label}</a>)}<button type="button" onClick={() => { setMobileOpen(false); openPilotFromHeader() }} className="mt-3 bg-[#d8c28f] px-4 py-3 text-left text-[10px] font-semibold tracking-[0.14em] text-[#17382d]">Discuss a pilot</button></nav>}
  </>
}

export default function AtlasSite() {
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <section className="relative min-h-[720px] overflow-hidden bg-[#17382d] text-[#f7f0df]">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'url(/atlas-landscape.png)', backgroundPosition: 'center', backgroundSize: 'cover' }} /><div className="absolute inset-0 bg-gradient-to-r from-[#17382d] via-[#17382d]/90 to-[#17382d]/45" />
        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-10"><Mark light /><SiteNavigation /></header>
        <div className="relative z-10 mx-auto flex max-w-7xl items-end px-5 pb-24 pt-28 lg:min-h-[620px] lg:px-10 lg:pb-24"><div className="max-w-3xl"><SectionLabel light>Institutional intelligence infrastructure</SectionLabel><h1 className="max-w-3xl font-serif text-6xl font-light leading-[0.95] tracking-[-0.04em] sm:text-8xl">Intelligence for a <em className="text-[#d8c28f]">more flourishing</em> world.</h1><p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-[#d1d3c6]">Atlas Sanctum connects places, problems, evidence, resources, decisions, and measurable outcomes—so responsible action can move at the speed of understanding.</p><div className="mt-10 flex flex-wrap gap-3"><a href="/workspace" className="inline-flex items-center gap-3 bg-[#d8c28f] px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#17382d] hover:bg-[#f0dfb0]">Enter the workspace <ArrowUpRight className="size-4" /></a><a href="#partnerships" className="inline-flex items-center gap-3 border border-[#aab8a9] px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#f7f0df] hover:border-[#d8c28f]">Discuss a pilot</a></div></div></div>
        <div className="absolute bottom-0 right-0 z-10 hidden border-l border-t border-[#547064] bg-[#17382d]/70 px-8 py-5 backdrop-blur-sm lg:block"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d8c28f]">Field note / 001</p><p className="mt-2 max-w-[210px] text-xs leading-relaxed text-[#d1d3c6]">Better decisions begin with a more honest picture of the whole.</p></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-32"><div><SectionLabel>The condition</SectionLabel><h2 className="max-w-sm font-serif text-5xl font-light leading-[1.05] tracking-[-0.03em]">The work is not short on data. It is short on connection.</h2></div><div className="max-w-2xl"><p className="text-2xl font-light leading-relaxed text-[#455148]">Evidence lives in one system. Resources in another. Decisions in meetings. Outcomes in stories that arrive too late.</p><p className="mt-8 max-w-xl text-sm leading-relaxed text-[#687168]">The result is a gap between what institutions know and what they can responsibly do. Atlas exists to close that gap—with open infrastructure for seeing clearly, acting carefully, and learning in public.</p><div className="mt-10 grid gap-6 border-t border-[#c9c2b1] pt-6 sm:grid-cols-3"><div><p className="font-serif text-3xl">01</p><p className="mt-2 text-xs leading-relaxed text-[#687168]">Fragmented evidence creates blind spots.</p></div><div><p className="font-serif text-3xl">02</p><p className="mt-2 text-xs leading-relaxed text-[#687168]">Unclear decisions delay useful capital.</p></div><div><p className="font-serif text-3xl">03</p><p className="mt-2 text-xs leading-relaxed text-[#687168]">Weak feedback loops repeat old mistakes.</p></div></div></div></section>

      <PartnershipCarousel />

      <section id="observatory" className="bg-[#e9e5d8] px-5 py-24 lg:px-10 lg:py-32"><div className="mx-auto max-w-7xl"><div className="mb-14 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><SectionLabel>Atlas Regenerative Decision Engine</SectionLabel><h2 className="max-w-2xl font-serif text-5xl font-light leading-[1.05] tracking-[-0.03em] sm:text-6xl">From signal to stewardship.</h2></div><p className="max-w-sm text-sm leading-relaxed text-[#687168]">A transparent decision-support system for institutions working on complex, place-based challenges.</p></div><ObservatoryDemo /></div></section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-32"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><SectionLabel>The operating cycle</SectionLabel><p className="max-w-xs text-sm leading-relaxed text-[#687168]">Every recommendation remains connected to its evidence, its authority, and its consequences.</p></div><div className="grid gap-0 border-t border-[#c9c2b1]">{['Observe the whole system', 'Understand the forces at work', 'Recommend responsible options', 'Authorize with clarity', 'Execute with local agency', 'Verify, learn, and adapt'].map((item, i) => <div key={item} className="group flex items-center gap-5 border-b border-[#c9c2b1] py-5"><span className="font-mono text-[10px] text-[#a07837]">0{i + 1}</span><span className="font-serif text-2xl font-light transition-transform group-hover:translate-x-2">{item}</span><ArrowUpRight className="ml-auto size-4 text-[#a07837] opacity-0 transition-opacity group-hover:opacity-100" /></div>)}</div></div></section>

      <section id="platform" className="border-y border-[#c9c2b1] bg-[#f0ecdf] px-5 py-24 lg:px-10 lg:py-32"><div className="mx-auto max-w-7xl"><div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]"><div><SectionLabel>What users need next</SectionLabel><h2 className="max-w-md font-serif text-5xl font-light leading-[1.05] tracking-[-0.03em]">A trustworthy path from question to accountable action.</h2><p className="mt-6 max-w-sm text-sm leading-relaxed text-[#687168]">Atlas is designed around the practical needs of the people who hold evidence, make decisions, deliver work, and live with the results.</p></div><div className="grid gap-4 sm:grid-cols-2"><div className="border border-[#c9c2b1] bg-[#f7f3ea] p-6"><p className="font-mono text-[10px] text-[#a07837]">01 / ANALYST</p><h3 className="mt-10 font-serif text-2xl">Build the brief</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">Collect observations, attach sources, record uncertainty, and make the baseline visible before recommendations begin.</p><span className="mt-8 inline-flex border border-[#a07837] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Evidence + provenance</span></div><div className="border border-[#c9c2b1] bg-[#f7f3ea] p-6"><p className="font-mono text-[10px] text-[#a07837]">02 / AUTHORIZER</p><h3 className="mt-10 font-serif text-2xl">Make authority legible</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">Compare alternatives, declare conflicts, set conditions, and approve only what the evidence and mandate support.</p><span className="mt-8 inline-flex border border-[#a07837] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Scope + accountability</span></div><div className="border border-[#c9c2b1] bg-[#f7f3ea] p-6"><p className="font-mono text-[10px] text-[#a07837]">03 / IMPLEMENTER</p><h3 className="mt-10 font-serif text-2xl">Coordinate delivery</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">Turn an approved commitment into assigned work, milestones, receipts, and a record of what actually happened.</p><span className="mt-8 inline-flex border border-[#a07837] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Commitments + execution</span></div><div className="border border-[#c9c2b1] bg-[#f7f3ea] p-6"><p className="font-mono text-[10px] text-[#a07837]">04 / COMMUNITY</p><h3 className="mt-10 font-serif text-2xl">See and respond</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">Make decisions, feedback channels, grievances, and outcome claims understandable to the people affected.</p><span className="mt-8 inline-flex border border-[#a07837] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[#a07837]">Feedback + appeal</span></div></div></div></div></section>

      <section id="solutions" className="bg-[#17382d] px-5 py-24 text-[#f7f0df] lg:px-10 lg:py-32"><div className="mx-auto max-w-7xl"><SectionLabel light>Where the engine can serve</SectionLabel><div className="grid gap-0 border-t border-[#547064] sm:grid-cols-2 lg:grid-cols-4">{[['01','Humanitarian coordination','See needs, resources, and actors in one shared picture.'],['02','Regenerative economies','Align finance with local capacity and long-term resilience.'],['03','Climate & agriculture','Turn changing conditions into earlier, better choices.'],['04','Public service delivery','Make decisions legible to the people they affect.']].map(([number,title,copy]) => <div key={number} className="border-b border-[#547064] py-8 sm:px-6 lg:border-b-0 lg:border-r lg:first:pl-0 lg:last:border-r-0"><p className="font-mono text-[10px] text-[#d8c28f]">{number}</p><h3 className="mt-12 font-serif text-3xl font-light leading-tight">{title}</h3><p className="mt-5 text-sm leading-relaxed text-[#b9c0b5]">{copy}</p></div>)}</div></div></section>

      <section id="commons" className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-32"><div className="flex flex-col justify-between gap-8 border-b border-[#c9c2b1] pb-10 sm:flex-row sm:items-end"><div><SectionLabel>Open-source commons</SectionLabel><h2 className="max-w-xl font-serif text-5xl font-light leading-[1.05] tracking-[-0.03em]">Infrastructure is stronger when it is shared.</h2></div><a href="#github" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#a07837] hover:text-[#17382d]">Visit GitHub <ArrowUpRight className="size-4" /></a></div><div className="grid divide-y divide-[#c9c2b1] sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="py-8 sm:pr-8"><p className="font-mono text-[10px] text-[#a07837]">Repository / atlas-engine</p><h3 className="mt-4 font-serif text-2xl">Decision records</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">Schemas for making assumptions, trade-offs, and authority visible.</p></div><div className="py-8 sm:px-8"><p className="font-mono text-[10px] text-[#a07837]">Research / 2024.07</p><h3 className="mt-4 font-serif text-2xl">The evidence gap</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">A field guide to connecting local knowledge and institutional capital.</p></div><div className="py-8 sm:pl-8"><p className="font-mono text-[10px] text-[#a07837]">Protocol / v0.3</p><h3 className="mt-4 font-serif text-2xl">Outcome indicators</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">A practical language for verifying change without overstating it.</p></div></div></section>

      <section id="research" className="border-y border-[#c9c2b1] bg-[#efe9dc] px-5 py-24 lg:px-10 lg:py-32"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1fr]"><div><SectionLabel>Why Atlas</SectionLabel><h2 className="max-w-lg font-serif text-5xl font-light leading-[1.05]">Technology in service of truth, justice, stewardship, and service.</h2></div><div className="flex flex-col gap-6"><p className="text-xl font-light leading-relaxed text-[#455148]">Atlas is Christian-founded, but designed for broad collaboration. We believe the work of human flourishing asks for intellectual honesty, care for creation, and a bias toward serving people who are most affected by decisions.</p><div className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-[#c9c2b1] pt-7">{[['Truth','Say what the evidence can support.'],['Justice','Make power and trade-offs visible.'],['Stewardship','Treat resources and creation as entrusted.'],['Service','Build with, not merely for, communities.']].map(([title, copy]) => <div key={title}><CircleCheck className="size-4 text-[#a07837]" /><h3 className="mt-3 font-serif text-xl">{title}</h3><p className="mt-2 text-xs leading-relaxed text-[#687168]">{copy}</p></div>)}</div></div></div></section>

      <section id="partnerships" className="bg-[#b59451] px-5 py-24 text-[#17382d] lg:px-10 lg:py-28"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 lg:flex-row lg:items-end"><div><SectionLabel>Partnerships & pilots</SectionLabel><h2 className="max-w-2xl font-serif text-5xl font-light leading-[1.02] tracking-[-0.03em] sm:text-7xl">Bring us a hard question.</h2><p className="mt-6 max-w-lg text-sm leading-relaxed text-[#3c5143]">We work with organizations ready to make a decision more grounded, more accountable, and more useful to the people it affects.</p></div><a href="mailto:hello@atlassanctum.org" className="inline-flex items-center gap-3 border border-[#17382d] px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-[#17382d] hover:text-[#f7f0df]">Start a conversation <ArrowUpRight className="size-4" /></a></div></section>

      <AtlasDonate />

      <footer id="about" className="bg-[#102a21] px-5 py-12 text-[#b9c0b5] lg:px-10 lg:py-16">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.75fr_1.25fr] lg:gap-16">
        <div>
          <Mark light />
          <p className="mt-6 max-w-sm text-sm leading-relaxed">Open-source intelligence infrastructure for ethical finance, humanitarian coordination, and regenerative development.</p>
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-[#91a397]">Rooted in Christ. Guided by stewardship. Built in service of human flourishing.</p>
        </div>

        <nav aria-label="Footer navigation">
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8c28f]">Explore</p>
          <div className="flex flex-col items-start gap-3 text-sm">
            {[
              { label: 'Observatory', href: '#observatory' },
              { label: 'Platform', href: '/platform' },
              { label: 'Solutions', href: '/solutions/water-climate-resilience' },
              { label: 'Commons', href: '/community/open-source-projects' },
            ].map((item) => (
              <a key={item.label} href={item.href} className="transition-colors hover:text-[#f7f0df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8c28f]">
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div>
          <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8c28f]">Connect</p>
          <p className="max-w-sm text-sm leading-relaxed text-[#d0d5cd]">Bring a difficult question, join the commons, or start a conversation.</p>

          <div className="mt-6 flex flex-col items-start gap-5">
            <a href="#partnerships" className="group inline-flex items-center gap-3 border border-[#b59451] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#f7f0df] transition-colors hover:bg-[#b59451] hover:text-[#102a21] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8c28f]">
              Explore a pilot <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a href="mailto:hello@atlassanctum.org" className="group flex flex-col gap-1 text-sm transition-colors hover:text-[#f7f0df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8c28f]">
              <span className="font-medium">Email Atlas</span>
              <span className="text-xs text-[#91a397] group-hover:text-[#d8c28f]">hello@atlassanctum.org</span>
            </a>
            <a href="https://github.com/ObiwanKenobee/atlas-sanctum-ym" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 text-sm transition-colors hover:text-[#f7f0df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8c28f]">
              <span className="flex flex-col gap-1">
                <span className="font-medium">GitHub</span>
                <span className="text-xs text-[#91a397] group-hover:text-[#d8c28f]">Build in the open</span>
              </span>
              <ArrowUpRight className="size-4 text-[#d8c28f]" />
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-12 flex max-w-7xl flex-col gap-4 border-t border-[#315044] pt-5 text-[10px] leading-relaxed sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p>© {new Date().getFullYear()} Atlas Sanctum</p>
          <p className="mt-2 max-w-xl normal-case tracking-normal text-[#91a397]">Demonstrations may use clearly labelled sample data. We do not claim outcomes without evidence.</p>
        </div>
        <p className="uppercase tracking-[0.14em] text-[#d8c28f]">Built in the open, for the common good.</p>
      </div>
    </footer>

    </main>
  )
}

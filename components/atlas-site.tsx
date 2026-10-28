'use client'

import { useState } from 'react'
import { ArrowUpRight, ChevronDown, CircleCheck, Menu, X } from 'lucide-react'

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
          <div className="flex flex-wrap gap-2 border-b border-[#d4cebd] pb-6"><label className="sr-only" htmlFor="location">Select location</label><div className="relative"><select id="location" value={location} onChange={(e) => { setLocation(e.target.value as LocationName); setSelected(0) }} className="appearance-none border border-[#b9b29f] bg-transparent py-2 pl-3 pr-9 text-sm text-[#17382d] outline-none"><option>Turkana</option><option>Kisumu</option><option>Mbarara</option></select><ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-3 -translate-y-1/2 text-[#a07837]" /></div><span className="py-2 text-xs text-[#687168]">{data.country} / {data.problem}</span></div>
          <div className="flex flex-col gap-6 pt-6"><div><p className="text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Evidence brief</p><p className="mt-2 text-sm leading-relaxed text-[#455148]">Livelihoods are exposed to seasonal water stress. Existing boreholes are unevenly distributed and market access changes with rainfall.</p></div><div className="grid grid-cols-2 gap-3"><div className="border border-[#d4cebd] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[#687168]">Confidence</p><p className="mt-2 text-sm text-[#17382d]">{data.confidence}</p></div><div className="border border-[#d4cebd] p-3"><p className="text-[10px] uppercase tracking-[0.12em] text-[#687168]">Sources</p><p className="mt-2 text-sm text-[#17382d]">NGOs + public</p></div></div><div><p className="mb-3 text-[10px] uppercase tracking-[0.18em] text-[#a07837]">02 / Recommend</p><div className="flex flex-col gap-2">{data.interventions.map((item, index) => <button key={item.name} onClick={() => setSelected(index)} className={`flex items-center justify-between border p-3 text-left transition-colors ${selected === index ? 'border-[#a07837] bg-[#efe8d8]' : 'border-[#d4cebd] hover:bg-[#f0ecdf]'}`}><span><span className="block text-sm text-[#17382d]">{item.name}</span><span className="mt-1 block text-[10px] uppercase tracking-[0.12em] text-[#687168]">{item.cost} / {item.impact} impact</span></span><ArrowUpRight className="size-4 text-[#a07837]" /></button>)}</div></div></div>
        </div>
      </div>
      <div className="grid border-t border-[#d4cebd] bg-[#eee9dc] sm:grid-cols-3"><div className="border-b border-[#d4cebd] px-5 py-4 sm:border-b-0 sm:border-r"><p className="font-mono text-[10px] text-[#a07837]">03 / Authorize</p><p className="mt-1 text-xs text-[#455148]">Decision record ready</p></div><div className="border-b border-[#d4cebd] px-5 py-4 sm:border-b-0 sm:border-r"><p className="font-mono text-[10px] text-[#a07837]">04 / Execute</p><p className="mt-1 text-xs text-[#455148]">Partner confirmation required</p></div><div className="px-5 py-4"><p className="font-mono text-[10px] text-[#a07837]">05 / Verify & learn</p><p className="mt-1 text-xs text-[#455148]">Outcome indicators defined</p></div></div>
    </div>
  )
}

export default function AtlasSite() {
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = ['Observatory', 'Solutions', 'Commons', 'Research', 'Partnerships']
  return (
    <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]">
      <section className="relative min-h-[720px] overflow-hidden bg-[#17382d] text-[#f7f0df]">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'url(/atlas-landscape.png)', backgroundPosition: 'center', backgroundSize: 'cover' }} /><div className="absolute inset-0 bg-gradient-to-r from-[#17382d] via-[#17382d]/90 to-[#17382d]/45" />
        <header className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-10"><Mark light /><nav className="hidden items-center gap-7 text-[10px] uppercase tracking-[0.18em] text-[#d1d3c6] lg:flex">{navItems.map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="transition-colors hover:text-[#d8c28f]">{item}</a>)}<a href="#about" className="border border-[#d8c28f] px-4 py-2 text-[#f7f0df] hover:bg-[#d8c28f] hover:text-[#17382d]">About Atlas</a></nav><button className="lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></header>
        {menuOpen && <nav className="absolute left-5 right-5 top-20 z-30 flex flex-col gap-4 border border-[#547064] bg-[#17382d] p-5 text-xs uppercase tracking-[0.18em] lg:hidden">{navItems.map((item) => <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}>{item}</a>)}</nav>}
        <div className="relative z-10 mx-auto flex max-w-7xl items-end px-5 pb-24 pt-28 lg:min-h-[620px] lg:px-10 lg:pb-24"><div className="max-w-3xl"><SectionLabel light>Institutional intelligence infrastructure</SectionLabel><h1 className="max-w-3xl font-serif text-6xl font-light leading-[0.95] tracking-[-0.04em] sm:text-8xl">Intelligence for a <em className="text-[#d8c28f]">more flourishing</em> world.</h1><p className="mt-8 max-w-xl text-lg font-light leading-relaxed text-[#d1d3c6]">Atlas Sanctum connects places, problems, evidence, resources, decisions, and measurable outcomes—so responsible action can move at the speed of understanding.</p><div className="mt-10 flex flex-wrap gap-3"><a href="#observatory" className="inline-flex items-center gap-3 bg-[#d8c28f] px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#17382d] hover:bg-[#f0dfb0]">Explore the Observatory <ArrowUpRight className="size-4" /></a><a href="#partnerships" className="inline-flex items-center gap-3 border border-[#aab8a9] px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-[#f7f0df] hover:border-[#d8c28f]">Discuss a pilot</a></div></div></div>
        <div className="absolute bottom-0 right-0 z-10 hidden border-l border-t border-[#547064] bg-[#17382d]/70 px-8 py-5 backdrop-blur-sm lg:block"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#d8c28f]">Field note / 001</p><p className="mt-2 max-w-[210px] text-xs leading-relaxed text-[#d1d3c6]">Better decisions begin with a more honest picture of the whole.</p></div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-24 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-32"><div><SectionLabel>The condition</SectionLabel><h2 className="max-w-sm font-serif text-5xl font-light leading-[1.05] tracking-[-0.03em]">The work is not short on data. It is short on connection.</h2></div><div className="max-w-2xl"><p className="text-2xl font-light leading-relaxed text-[#455148]">Evidence lives in one system. Resources in another. Decisions in meetings. Outcomes in stories that arrive too late.</p><p className="mt-8 max-w-xl text-sm leading-relaxed text-[#687168]">The result is a gap between what institutions know and what they can responsibly do. Atlas exists to close that gap—with open infrastructure for seeing clearly, acting carefully, and learning in public.</p><div className="mt-10 grid gap-6 border-t border-[#c9c2b1] pt-6 sm:grid-cols-3"><div><p className="font-serif text-3xl">01</p><p className="mt-2 text-xs leading-relaxed text-[#687168]">Fragmented evidence creates blind spots.</p></div><div><p className="font-serif text-3xl">02</p><p className="mt-2 text-xs leading-relaxed text-[#687168]">Unclear decisions delay useful capital.</p></div><div><p className="font-serif text-3xl">03</p><p className="mt-2 text-xs leading-relaxed text-[#687168]">Weak feedback loops repeat old mistakes.</p></div></div></div></section>

      <section id="observatory" className="bg-[#e9e5d8] px-5 py-24 lg:px-10 lg:py-32"><div className="mx-auto max-w-7xl"><div className="mb-14 flex flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><SectionLabel>Atlas Regenerative Decision Engine</SectionLabel><h2 className="max-w-2xl font-serif text-5xl font-light leading-[1.05] tracking-[-0.03em] sm:text-6xl">From signal to stewardship.</h2></div><p className="max-w-sm text-sm leading-relaxed text-[#687168]">A transparent decision-support system for institutions working on complex, place-based challenges.</p></div><ObservatoryDemo /></div></section>

      <section className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-32"><div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><SectionLabel>The operating cycle</SectionLabel><p className="max-w-xs text-sm leading-relaxed text-[#687168]">Every recommendation remains connected to its evidence, its authority, and its consequences.</p></div><div className="grid gap-0 border-t border-[#c9c2b1]">{['Observe the whole system', 'Understand the forces at work', 'Recommend responsible options', 'Authorize with clarity', 'Execute with local agency', 'Verify, learn, and adapt'].map((item, i) => <div key={item} className="group flex items-center gap-5 border-b border-[#c9c2b1] py-5"><span className="font-mono text-[10px] text-[#a07837]">0{i + 1}</span><span className="font-serif text-2xl font-light transition-transform group-hover:translate-x-2">{item}</span><ArrowUpRight className="ml-auto size-4 text-[#a07837] opacity-0 transition-opacity group-hover:opacity-100" /></div>)}</div></div></section>

      <section id="solutions" className="bg-[#17382d] px-5 py-24 text-[#f7f0df] lg:px-10 lg:py-32"><div className="mx-auto max-w-7xl"><SectionLabel light>Where the engine can serve</SectionLabel><div className="grid gap-0 border-t border-[#547064] sm:grid-cols-2 lg:grid-cols-4">{[['01','Humanitarian coordination','See needs, resources, and actors in one shared picture.'],['02','Regenerative economies','Align finance with local capacity and long-term resilience.'],['03','Climate & agriculture','Turn changing conditions into earlier, better choices.'],['04','Public service delivery','Make decisions legible to the people they affect.']].map(([number,title,copy]) => <div key={number} className="border-b border-[#547064] py-8 sm:px-6 lg:border-b-0 lg:border-r lg:first:pl-0 lg:last:border-r-0"><p className="font-mono text-[10px] text-[#d8c28f]">{number}</p><h3 className="mt-12 font-serif text-3xl font-light leading-tight">{title}</h3><p className="mt-5 text-sm leading-relaxed text-[#b9c0b5]">{copy}</p></div>)}</div></div></section>

      <section id="commons" className="mx-auto max-w-7xl px-5 py-24 lg:px-10 lg:py-32"><div className="flex flex-col justify-between gap-8 border-b border-[#c9c2b1] pb-10 sm:flex-row sm:items-end"><div><SectionLabel>Open-source commons</SectionLabel><h2 className="max-w-xl font-serif text-5xl font-light leading-[1.05] tracking-[-0.03em]">Infrastructure is stronger when it is shared.</h2></div><a href="#github" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[#a07837] hover:text-[#17382d]">Visit GitHub <ArrowUpRight className="size-4" /></a></div><div className="grid divide-y divide-[#c9c2b1] sm:grid-cols-3 sm:divide-x sm:divide-y-0"><div className="py-8 sm:pr-8"><p className="font-mono text-[10px] text-[#a07837]">Repository / atlas-engine</p><h3 className="mt-4 font-serif text-2xl">Decision records</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">Schemas for making assumptions, trade-offs, and authority visible.</p></div><div className="py-8 sm:px-8"><p className="font-mono text-[10px] text-[#a07837]">Research / 2024.07</p><h3 className="mt-4 font-serif text-2xl">The evidence gap</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">A field guide to connecting local knowledge and institutional capital.</p></div><div className="py-8 sm:pl-8"><p className="font-mono text-[10px] text-[#a07837]">Protocol / v0.3</p><h3 className="mt-4 font-serif text-2xl">Outcome indicators</h3><p className="mt-3 text-sm leading-relaxed text-[#687168]">A practical language for verifying change without overstating it.</p></div></div></section>

      <section id="research" className="border-y border-[#c9c2b1] bg-[#efe9dc] px-5 py-24 lg:px-10 lg:py-32"><div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1fr]"><div><SectionLabel>Why Atlas</SectionLabel><h2 className="max-w-lg font-serif text-5xl font-light leading-[1.05]">Technology in service of truth, justice, stewardship, and service.</h2></div><div className="flex flex-col gap-6"><p className="text-xl font-light leading-relaxed text-[#455148]">Atlas is Christian-founded, but designed for broad collaboration. We believe the work of human flourishing asks for intellectual honesty, care for creation, and a bias toward serving people who are most affected by decisions.</p><div className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-[#c9c2b1] pt-7">{[['Truth','Say what the evidence can support.'],['Justice','Make power and trade-offs visible.'],['Stewardship','Treat resources and creation as entrusted.'],['Service','Build with, not merely for, communities.']].map(([title, copy]) => <div key={title}><CircleCheck className="size-4 text-[#a07837]" /><h3 className="mt-3 font-serif text-xl">{title}</h3><p className="mt-2 text-xs leading-relaxed text-[#687168]">{copy}</p></div>)}</div></div></div></section>

      <section id="partnerships" className="bg-[#b59451] px-5 py-24 text-[#17382d] lg:px-10 lg:py-28"><div className="mx-auto flex max-w-7xl flex-col justify-between gap-10 lg:flex-row lg:items-end"><div><SectionLabel>Partnerships & pilots</SectionLabel><h2 className="max-w-2xl font-serif text-5xl font-light leading-[1.02] tracking-[-0.03em] sm:text-7xl">Bring us a hard question.</h2><p className="mt-6 max-w-lg text-sm leading-relaxed text-[#3c5143]">We work with organizations ready to make a decision more grounded, more accountable, and more useful to the people it affects.</p></div><a href="mailto:hello@atlassanctum.org" className="inline-flex items-center gap-3 border border-[#17382d] px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] hover:bg-[#17382d] hover:text-[#f7f0df]">Start a conversation <ArrowUpRight className="size-4" /></a></div></section>

      <footer id="about" className="bg-[#102a21] px-5 py-12 text-[#b9c0b5] lg:px-10"><div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]"><div><Mark light /><p className="mt-6 max-w-xs text-xs leading-relaxed">Open-source intelligence infrastructure for ethical finance, humanitarian coordination, and sustainable development.</p></div><div><p className="mb-4 text-[10px] uppercase tracking-[0.18em] text-[#d8c28f]">Explore</p><div className="flex flex-col gap-3 text-xs"><a href="#observatory">Observatory</a><a href="#solutions">Solutions</a><a href="#commons">Commons</a></div></div><div><p className="mb-4 text-[10px] uppercase tracking-[0.18em] text-[#d8c28f]">Connect</p><div className="flex flex-col gap-3 text-xs"><a href="#partnerships">Partner with us</a><a href="mailto:hello@atlassanctum.org">Email Atlas</a><a href="#github">GitHub</a></div></div><div><p className="mb-4 text-[10px] uppercase tracking-[0.18em] text-[#d8c28f]">A note on claims</p><p className="text-xs leading-relaxed">Demonstrations on this site use clearly labelled sample data. We do not claim outcomes without evidence.</p></div></div><div className="mx-auto mt-12 flex max-w-7xl flex-col justify-between gap-3 border-t border-[#315044] pt-5 text-[10px] uppercase tracking-[0.14em] sm:flex-row"><span>© 2026 Atlas Sanctum</span><span>Built in the open, for the common good.</span></div></footer>
    </main>
  )
}

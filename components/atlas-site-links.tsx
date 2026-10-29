import Link from 'next/link'

const groups = [
  { title: 'Decision system', links: [['Regenerative Decision Engine', '/platform'], ['How It Works', '/how-it-works'], ['Evidence & Decision Records', '/evidence']] },
  { title: 'Research', links: [['Research & Insights', '/research'], ['Methods & Data Sources', '/research/methods'], ['Field Notes & Case Studies', '/research/field-notes'], ['Pilot Opportunities', '/research/pilots']] },
  { title: 'Commons', links: [['Open-source Projects', '/community/open-source-projects'], ['Contribute on GitHub', '/community/contribute'], ['Principles & Governance', '/community/principles-governance'], ['Water pilot workspace', '/pilot/water']] },
]
export default function AtlasSiteLinks() { return <nav aria-labelledby="site-links-heading" className="mx-auto mt-12 max-w-7xl border-t border-[#315044] pt-10"><h2 id="site-links-heading" className="sr-only">Atlas site links</h2><div className="grid gap-8 sm:grid-cols-3">{groups.map((group) => <div key={group.title}><h3 className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d8c28f]">{group.title}</h3><ul className="mt-4 space-y-3">{group.links.map(([label, href]) => <li key={href}><Link href={href} className="text-sm text-[#b9c0b5] underline-offset-4 transition-colors hover:text-[#f7f0df] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#d8c28f]">{label}</Link></li>)}</ul></div>)}</div></nav> }

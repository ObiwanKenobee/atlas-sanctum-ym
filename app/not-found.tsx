import Link from 'next/link'
import { ArrowLeft, ArrowUpRight, Compass, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f5f1e8] text-[#17382d]">
      <header className="border-b border-[#d4cebd] bg-[#f7f3ea] px-5 py-5 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/" className="flex items-center gap-3" aria-label="Atlas Sanctum home">
            <span className="grid size-9 place-items-center border border-[#b59451]"><span className="relative block size-5 rotate-45 border border-[#b59451]"><span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#b59451]" /></span></span>
            <span className="font-serif text-lg tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></span>
          </Link>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Field note 404</span>
        </div>
      </header>

      <section className="mx-auto grid min-h-[calc(100vh-82px)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24 lg:py-20">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a07837]">Signal not found</p>
          <h1 className="mt-5 font-serif text-[clamp(4.5rem,13vw,10rem)] font-light leading-[0.78] tracking-[-0.08em]">404</h1>
          <h2 className="mt-10 max-w-md font-serif text-4xl font-light leading-[1.05] tracking-[-0.03em] sm:text-5xl">This path has drifted outside the map.</h2>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-[#687168]">The page you were looking for may have moved, been archived, or never entered the record. Let&apos;s get you back to a useful starting point.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#17382d] px-5 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#f7f0df] hover:bg-[#285342]"><ArrowLeft className="size-3.5" /> Return to Atlas</Link><Link href="/workspace" className="inline-flex items-center justify-center gap-2 border border-[#b9b29f] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#455148] hover:border-[#a07837] hover:text-[#17382d]">Open workspace <ArrowUpRight className="size-3.5" /></Link></div>
        </div>

        <div className="relative min-h-[370px] overflow-hidden border border-[#c9c2b1] bg-[#17382d] p-6 text-[#f7f0df] sm:min-h-[470px] sm:p-10">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(rgba(213,194,144,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(213,194,144,.14) 1px, transparent 1px)', backgroundSize: '42px 42px' }} />
          <svg className="absolute inset-0 h-full w-full opacity-60" viewBox="0 0 700 500" preserveAspectRatio="none" aria-hidden="true"><path d="M-20 430C140 310 160 160 310 255s210 65 430-190M20 120c130 90 180 170 315 145s210-50 390 100M280-20c50 150 70 200 30 345s145 100 280 195" fill="none" stroke="#d8c28f" strokeDasharray="3 10" strokeWidth="1" /><circle cx="445" cy="220" r="42" fill="none" stroke="#d8c28f" strokeDasharray="2 8" /><circle cx="445" cy="220" r="5" fill="#d8c28f" /></svg>
          <div className="relative flex h-full min-h-[320px] flex-col justify-between sm:min-h-[390px]"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#b9c0b5]"><Compass className="size-4 text-[#d8c28f]" /> Unmapped coordinate</div><span className="font-mono text-[10px] text-[#8fa096]">LAT 00.00 / LON 00.00</span></div><div className="max-w-xs border border-[#547064] bg-[#17382d]/80 p-5 backdrop-blur-sm"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#d8c28f]">Recommended next step</p><p className="mt-3 font-serif text-2xl font-light">Begin with the observatory.</p><p className="mt-2 text-xs leading-relaxed text-[#b9c0b5]">See the places, signals, and decisions currently in motion.</p><Link href="/#observatory" className="mt-5 inline-flex items-center gap-2 text-xs text-[#d8c28f] hover:text-[#f7f0df]">Explore signals <ArrowUpRight className="size-3.5" /></Link></div><div className="flex items-center justify-between border-t border-[#547064] pt-4 text-[10px] uppercase tracking-[0.16em] text-[#8fa096]"><span>Atlas Sanctum</span><span className="flex items-center gap-2"><Search className="size-3" /> Reorienting</span></div></div>
        </div>
      </section>
    </main>
  )
}

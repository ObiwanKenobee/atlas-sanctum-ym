'use client'

import { FormEvent, ReactNode, useEffect, useState } from 'react'
import { ArrowUpRight, Check, Mail, MessageCircle, X } from 'lucide-react'

export default function AtlasConversion({ children }: { children: ReactNode }) {
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [pilotOpen, setPilotOpen] = useState(false)
  const [newsletterOpen, setNewsletterOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [newsletterState, setNewsletterState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  useEffect(() => {
    try {
      setWelcomeOpen(sessionStorage.getItem('atlas-welcome-dismissed') !== 'true')
    } catch {
      setWelcomeOpen(true)
    }
  }, [])

  function dismissWelcome() {
    setWelcomeOpen(false)
    try { sessionStorage.setItem('atlas-welcome-dismissed', 'true') } catch {}
  }

  function openPilot() {
    dismissWelcome()
    setPilotOpen(true)
  }

  function submitPilot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
  }

  async function submitNewsletter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNewsletterState('loading')
    await new Promise((resolve) => setTimeout(resolve, 650))
    setNewsletterState('success')
  }

  return (
    <>
      {children}

      {welcomeOpen && (
        <aside className="fixed bottom-5 left-5 z-40 w-[min(390px,calc(100vw-2.5rem))] border border-[#b9b29f] bg-[#f7f3ea] p-5 text-[#17382d] shadow-[0_18px_50px_rgba(20,45,35,0.18)]" role="dialog" aria-label="Welcome to Atlas Sanctum">
          <button onClick={dismissWelcome} aria-label="Dismiss welcome message" className="absolute right-3 top-3 text-[#687168] hover:text-[#17382d]"><X className="size-4" /></button>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a07837]">A clearer starting point</p>
          <h2 className="mt-4 pr-7 font-serif text-2xl font-light">Welcome to Atlas Sanctum.</h2>
          <p className="mt-2 text-sm leading-relaxed text-[#687168]">Explore intelligence infrastructure for ethical finance, humanitarian systems, and regenerative development.</p>
          <div className="mt-5 flex flex-wrap gap-2"><a href="#observatory" onClick={dismissWelcome} className="inline-flex items-center gap-2 bg-[#17382d] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f0df]">Explore the Observatory <ArrowUpRight className="size-3" /></a><button onClick={openPilot} className="border border-[#a07837] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a07837]">Discuss a pilot</button></div>
        </aside>
      )}

      <button onClick={openPilot} className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 bg-[#a07837] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#fffaf0] shadow-[0_10px_30px_rgba(20,45,35,0.2)] transition-transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-[#d8c28f] focus:ring-offset-2" aria-label="Discuss a pilot with Atlas Sanctum"><MessageCircle className="size-4" /> Discuss a pilot</button>

      <button onClick={() => setNewsletterOpen((open) => !open)} className="fixed bottom-[76px] right-5 z-30 grid size-11 place-items-center border border-[#a07837] bg-[#f7f3ea] text-[#a07837] shadow-[0_8px_24px_rgba(20,45,35,0.12)] hover:bg-[#efe8d8]" aria-label="Open newsletter signup" aria-expanded={newsletterOpen}><Mail className="size-4" /></button>

      {newsletterOpen && <div className="fixed bottom-[132px] right-5 z-40 w-[min(340px,calc(100vw-2.5rem))] border border-[#b9b29f] bg-[#f7f3ea] p-5 text-[#17382d] shadow-[0_18px_50px_rgba(20,45,35,0.18)]"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a07837]">Signals for a flourishing world</p><p className="mt-2 text-sm leading-relaxed text-[#687168]">Occasional research, product updates, and opportunities from Atlas Sanctum.</p></div><button onClick={() => setNewsletterOpen(false)} aria-label="Close newsletter signup"><X className="size-4 text-[#687168]" /></button></div>{newsletterState === 'success' ? <div className="mt-5 flex items-center gap-2 border-t border-[#d4cebd] pt-4 text-sm"><Check className="size-4 text-[#a07837]" /> You&apos;re on the list.</div> : <form onSubmit={submitNewsletter} className="mt-5 flex gap-2 border-t border-[#d4cebd] pt-4"><label className="sr-only" htmlFor="newsletter-email">Work email</label><input id="newsletter-email" type="email" required placeholder="you@organization.org" className="min-w-0 flex-1 border border-[#b9b29f] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#a07837]" /><button disabled={newsletterState === 'loading'} className="bg-[#17382d] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#f7f0df] disabled:opacity-50">{newsletterState === 'loading' ? 'Joining' : 'Join'}</button></form>}<p className="mt-3 text-[10px] leading-relaxed text-[#687168]">By subscribing, you agree to receive occasional updates. Unsubscribe anytime.</p></div>}

      {pilotOpen && <div className="fixed inset-0 z-50 flex items-end justify-end bg-[#17382d]/35 p-4 sm:items-center sm:p-8" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPilotOpen(false) }}><section role="dialog" aria-modal="true" aria-labelledby="pilot-title" className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[#b9b29f] bg-[#f7f3ea] p-6 text-[#17382d] shadow-[0_24px_80px_rgba(20,45,35,0.25)] sm:p-8"><div className="flex items-start justify-between gap-6"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a07837]">A considered first conversation</p><h2 id="pilot-title" className="mt-3 font-serif text-4xl font-light">Let&apos;s explore a pilot.</h2></div><button onClick={() => setPilotOpen(false)} aria-label="Close pilot inquiry"><X className="size-5 text-[#687168]" /></button></div>{submitted ? <div className="border-t border-[#d4cebd] pt-8"><div className="flex size-11 items-center justify-center border border-[#a07837] text-[#a07837]"><Check className="size-5" /></div><h3 className="mt-5 font-serif text-2xl">Pilot brief prepared.</h3><p className="mt-3 max-w-sm text-sm leading-relaxed text-[#687168]">This preview has captured the shape of your inquiry. Once the Supabase connection is enabled, it will route securely to the Atlas Sanctum team.</p><button onClick={() => setPilotOpen(false)} className="mt-7 border border-[#a07837] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#a07837]">Close</button></div> : <form onSubmit={submitPilot} className="mt-6 flex flex-col gap-4 border-t border-[#d4cebd] pt-6"><p className="text-sm leading-relaxed text-[#687168]">Tell us about your organization, where the work is happening, and the decision or challenge you want to address.</p><div className="grid gap-4 sm:grid-cols-2"><label className="text-xs text-[#455148]">Full name<input required name="name" className="mt-2 w-full border border-[#b9b29f] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#a07837]" /></label><label className="text-xs text-[#455148]">Work email<input required type="email" name="email" className="mt-2 w-full border border-[#b9b29f] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#a07837]" /></label><label className="text-xs text-[#455148]">Organization<input required name="organization" className="mt-2 w-full border border-[#b9b29f] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#a07837]" /></label><label className="text-xs text-[#455148]">Sector<select required name="sector" className="mt-2 w-full border border-[#b9b29f] bg-[#f7f3ea] px-3 py-2 text-sm outline-none focus:border-[#a07837]"><option value="">Select sector</option><option>Climate, water & resilience</option><option>Agriculture & food systems</option><option>Ethical & regenerative finance</option><option>Humanitarian & health systems</option><option>Public services & infrastructure</option><option>Research & open-source technology</option><option>Other / cross-sector</option></select></label></div><label className="text-xs text-[#455148]">Where is the work happening?<input required name="location" className="mt-2 w-full border border-[#b9b29f] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#a07837]" /></label><label className="text-xs text-[#455148]">Problem or decision to be supported<textarea required minLength={20} name="problem" rows={4} className="mt-2 w-full resize-none border border-[#b9b29f] bg-transparent px-3 py-2 text-sm outline-none focus:border-[#a07837]" /></label><label className="flex gap-3 text-xs leading-relaxed text-[#687168]"><input required type="checkbox" className="mt-0.5 accent-[#a07837]" />I consent to being contacted about this inquiry.</label><p className="text-[10px] leading-relaxed text-[#687168]">Please do not include confidential beneficiary data or sensitive personal information. See our privacy principles for more.</p><button className="inline-flex items-center justify-center gap-2 bg-[#17382d] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7f0df] hover:bg-[#285241]">Send inquiry <ArrowUpRight className="size-3" /></button></form>}</section></div>}
    </>
  )
}

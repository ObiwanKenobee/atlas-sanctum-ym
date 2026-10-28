'use client'

import { FormEvent, useState } from 'react'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

const steps = ['Your role', 'Portfolio', 'Governance']

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [role, setRole] = useState('Program lead')
  const [portfolio, setPortfolio] = useState('East Africa climate resilience')
  const [governance, setGovernance] = useState('I approve decisions for my team')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (step < 2) { setStep((current) => current + 1); return }
    setPending(true)
    setError('')
    const response = await fetch('/api/onboarding', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, portfolio, governance }) })
    setPending(false)
    if (!response.ok) { setError('We could not save your workspace profile. Please try again.'); return }
    window.location.assign('/workspace')
  }

  return <main className="min-h-screen bg-[#f5f1e8] px-5 py-8 text-[#17382d] sm:px-8"><div className="mx-auto max-w-4xl"><div className="flex items-center justify-between"><p className="font-serif text-xl tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></p><span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">Workspace setup</span></div><div className="mt-16 grid gap-12 lg:grid-cols-[0.7fr_1.3fr]"><aside><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a07837]">A considered start</p><h1 className="mt-4 font-serif text-5xl font-light leading-none tracking-[-0.04em]">Set the conditions for good decisions.</h1><p className="mt-5 text-sm leading-relaxed text-[#687168]">We use this context to shape your observatory, review permissions, and governance defaults. You can change it later.</p><div className="mt-10 flex flex-col gap-3">{steps.map((item, index) => <div key={item} className={`flex items-center gap-3 text-xs ${index === step ? 'text-[#17382d]' : 'text-[#8b9189]'}`}><span className={`grid size-7 place-items-center border ${index < step ? 'border-[#98b29e] bg-[#e6efe5]' : index === step ? 'border-[#a07837]' : 'border-[#d4cebd]'}`}>{index < step ? <Check className="size-3.5" /> : `0${index + 1}`}</span>{item}</div>)}</div></aside><form onSubmit={submit} className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-9"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">Step 0{step + 1} / 03</p>{step === 0 && <div className="mt-8"><h2 className="font-serif text-3xl font-light">What is your role?</h2><p className="mt-2 text-sm text-[#687168]">This helps us frame the decision queue and workspace language.</p><div className="mt-7 grid gap-3">{['Program lead', 'Researcher', 'Funder / investor', 'Implementation partner'].map((item) => <label key={item} className={`flex cursor-pointer items-center justify-between border p-4 text-sm ${role === item ? 'border-[#a07837] bg-[#f4ead0]' : 'border-[#d4cebd]'}`}><span>{item}</span><input type="radio" name="role" value={item} checked={role === item} onChange={() => setRole(item)} /></label>)}</div></div>}{step === 1 && <div className="mt-8"><h2 className="font-serif text-3xl font-light">What will you steward?</h2><p className="mt-2 text-sm text-[#687168]">Name the portfolio or place you want to orient around first.</p><input value={portfolio} onChange={(event) => setPortfolio(event.target.value)} className="mt-7 w-full border border-[#c9c2b1] bg-[#fffaf0] px-4 py-4 text-sm outline-none focus:border-[#a07837]" /></div>}{step === 2 && <div className="mt-8"><h2 className="font-serif text-3xl font-light">How should governance work?</h2><p className="mt-2 text-sm text-[#687168]">Your default determines which actions require a named approver.</p><div className="mt-7 grid gap-3">{['I approve decisions for my team', 'I contribute evidence and recommendations', 'I manage the workspace and permissions'].map((item) => <label key={item} className={`flex cursor-pointer items-center justify-between border p-4 text-sm ${governance === item ? 'border-[#a07837] bg-[#f4ead0]' : 'border-[#d4cebd]'}`}><span>{item}</span><input type="radio" name="governance" value={item} checked={governance === item} onChange={() => setGovernance(item)} /></label>)}</div></div>}{error && <p role="alert" className="mt-5 border border-[#c96e5b] bg-[#f9e8e2] p-3 text-xs text-[#914634]">{error}</p>}<button disabled={pending} className="mt-10 inline-flex items-center gap-2 bg-[#17382d] px-5 py-3 text-xs uppercase tracking-[0.14em] text-[#f7f0df] disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}{step === 2 ? 'Create my workspace' : 'Continue'}</button></form></div></div></main>
}

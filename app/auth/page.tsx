'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const supabase = createClient()
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/confirm?next=/onboarding` } })
    setPending(false)
    if (result.error) {
      setMessage(result.error.message)
      return
    }
    if (mode === 'signup' && !result.data.session) {
      setMessage('Check your email to confirm your account, then return here.')
      return
    }
    window.location.assign('/onboarding')
  }

  return <main className="min-h-screen bg-[#f5f1e8] px-5 py-8 text-[#17382d] sm:px-8"><header className="mx-auto flex max-w-6xl items-center justify-between"><Link href="/" className="font-serif text-xl tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link><Link href="/" className="text-xs text-[#687168] hover:text-[#17382d]">Back to overview</Link></header><div className="mx-auto grid max-w-6xl gap-12 py-16 lg:grid-cols-[1fr_420px] lg:items-center"><section><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#a07837]">Private workspace</p><h1 className="mt-4 max-w-xl font-serif text-5xl font-light leading-[0.96] tracking-[-0.04em] sm:text-7xl">Make decisions with the full record.</h1><p className="mt-6 max-w-lg text-base leading-relaxed text-[#687168]">Your workspace connects field signals, evidence, decision records, and governance into one accountable operating view.</p><div className="mt-8 flex items-center gap-3 text-xs text-[#687168]"><ShieldCheck className="size-4 text-[#a07837]" /> Secure access with Supabase Auth</div></section><div className="border border-[#d4cebd] bg-[#f7f3ea] p-6 sm:p-8"><div className="flex gap-5 border-b border-[#d4cebd] pb-4"><button onClick={() => setMode('signin')} className={`pb-3 text-xs uppercase tracking-[0.16em] ${mode === 'signin' ? 'border-b-2 border-[#a07837] text-[#17382d]' : 'text-[#687168]'}`}>Sign in</button><button onClick={() => setMode('signup')} className={`pb-3 text-xs uppercase tracking-[0.16em] ${mode === 'signup' ? 'border-b-2 border-[#a07837] text-[#17382d]' : 'text-[#687168]'}`}>Create account</button></div><form onSubmit={submit} className="mt-6 flex flex-col gap-4"><label className="flex flex-col gap-2 text-xs text-[#455148]">Work email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 outline-none focus:border-[#a07837]" /></label><label className="flex flex-col gap-2 text-xs text-[#455148]">Password<input required minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="border border-[#c9c2b1] bg-[#fffaf0] px-3 py-3 outline-none focus:border-[#a07837]" /></label>{message && <p role="status" className="border border-[#c9a95d] bg-[#f4ead0] p-3 text-xs leading-relaxed text-[#8d682d]">{message}</p>}<button disabled={pending} className="mt-2 inline-flex items-center justify-center gap-2 bg-[#17382d] px-4 py-3 text-xs font-medium uppercase tracking-[0.14em] text-[#f7f0df] disabled:opacity-60">{pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />}{mode === 'signin' ? 'Enter workspace' : 'Start onboarding'}</button></form><p className="mt-5 text-[11px] leading-relaxed text-[#687168]">By continuing, you agree to use Atlas Sanctum for authorized institutional work only.</p></div></div></main>
}

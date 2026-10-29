'use client'

import { useEffect } from 'react'

export default function PwaRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    const isV0Preview = window.location.hostname.endsWith('.v0.build') || window.self !== window.top
    if (process.env.NODE_ENV === 'production' && !isV0Preview) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined)
      return
    }
    navigator.serviceWorker.getRegistrations().then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('atlas-shell-')).map((key) => caches.delete(key))))
  }, [])
  return null
}

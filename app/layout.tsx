import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atlas-sanctum-ym.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Atlas Sanctum — Intelligence for a More Flourishing World',
    template: '%s | Atlas Sanctum',
  },
  description: 'Atlas Sanctum builds open, evidence-led decision infrastructure for water resilience, agriculture, food systems, and accountable programmes.',
  keywords: ['regenerative decision engine', 'evidence-led decisions', 'water resilience', 'agriculture and food systems', 'programme accountability', 'open-source public interest technology'],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Atlas Sanctum',
    title: 'Atlas Sanctum — Intelligence for a More Flourishing World',
    description: 'Open, evidence-led decision infrastructure for a more flourishing world.',
    url: siteUrl,
  },
  twitter: { card: 'summary_large_image', title: 'Atlas Sanctum — Intelligence for a More Flourishing World', description: 'Open, evidence-led decision infrastructure for a more flourishing world.' },
  generator: 'Atlas Sanctum',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', name: 'Atlas Sanctum', alternateName: 'Atlas Sanctum Intelligence', url: siteUrl, logo: `${siteUrl}/icon.svg`, description: 'Open, evidence-led decision infrastructure for a more flourishing world.', sameAs: ['https://tech-craft-five.vercel.app', 'https://github.com/ObiwanKenobee'] }, { '@type': 'WebSite', name: 'Atlas Sanctum', url: siteUrl }] }) }} />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

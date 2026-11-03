import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import PwaRegister from '@/components/pwa-register'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atlas-sanctum-ym.vercel.app'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Atlas Sanctum — Intelligence for a More Flourishing World',
    template: '%s | Atlas Sanctum',
  },
  description: 'Atlas Sanctum is open, evidence-led decision infrastructure for water resilience, regenerative agriculture, food systems, humanitarian coordination, and accountable development programmes.',
  keywords: ['Atlas Sanctum', 'regenerative decision engine', 'evidence-led decision infrastructure', 'water resilience', 'regenerative agriculture', 'food systems', 'humanitarian coordination', 'development observatory', 'programme accountability', 'public interest technology'],
  authors: [{ name: 'Atlas Sanctum' }],
  creator: 'Atlas Sanctum',
  publisher: 'Atlas Sanctum',
  category: 'Public interest technology',
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  openGraph: {
    type: 'website',
    siteName: 'Atlas Sanctum',
    title: 'Atlas Sanctum — Intelligence for a More Flourishing World',
    description: 'Open, evidence-led decision infrastructure for a more flourishing world.',
    url: siteUrl,
    locale: 'en_US',
    images: [{ url: '/atlas-landscape.png', width: 1200, height: 630, alt: 'Atlas Sanctum evidence-led decision infrastructure' }],
  },
  twitter: { card: 'summary_large_image', title: 'Atlas Sanctum — Intelligence for a More Flourishing World', description: 'Open, evidence-led decision infrastructure for a more flourishing world.', images: ['/atlas-landscape.png'] },
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
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ '@context': 'https://schema.org', '@graph': [{ '@type': 'Organization', '@id': `${siteUrl}/#organization`, name: 'Atlas Sanctum', alternateName: 'Atlas Sanctum Intelligence', url: siteUrl, logo: `${siteUrl}/icon.svg`, description: 'Open, evidence-led decision infrastructure for a more flourishing world.', knowsAbout: ['water resilience', 'regenerative agriculture', 'food systems', 'humanitarian coordination', 'development observability', 'public interest technology'], sameAs: ['https://tech-craft-five.vercel.app', 'https://github.com/ObiwanKenobee'] }, { '@type': 'WebSite', '@id': `${siteUrl}/#website`, name: 'Atlas Sanctum', url: siteUrl, publisher: { '@id': `${siteUrl}/#organization` }, inLanguage: 'en' }, { '@type': 'SoftwareApplication', name: 'Atlas Sanctum', applicationCategory: 'BusinessApplication', operatingSystem: 'Web', url: siteUrl, description: 'Evidence-led decision infrastructure for accountable public-interest programmes.', publisher: { '@id': `${siteUrl}/#organization` } }] }) }} />
        <PwaRegister />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

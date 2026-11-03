import type { MetadataRoute } from 'next'

const publicRoutes = ['/', '/platform', '/how-it-works', '/evidence', '/work-with-atlas', '/blog', '/finance', '/humanitarian', '/regenerative', '/development', '/execution', '/governance']

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atlas-sanctum-ym.vercel.app'
  const now = new Date()
  return publicRoutes.map((route) => ({ url: `${siteUrl}${route}`, lastModified: now, changeFrequency: route === '/' || route === '/blog' ? 'weekly' : 'monthly', priority: route === '/' ? 1 : route === '/platform' || route === '/how-it-works' ? 0.9 : 0.7 }))
}

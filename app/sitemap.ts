import type { MetadataRoute } from 'next'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atlas-sanctum-ym.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/platform', '/how-it-works', '/evidence', '/research', '/research/methods', '/research/field-notes', '/research/pilots', '/research/implementation', '/research/collaboration', '/solutions/water-climate-resilience', '/solutions/agriculture-food-systems', '/solutions/programme-grant-accountability', '/community/open-source-projects', '/community/contribute', '/community/principles-governance']
  return routes.map((route) => ({ url: `${baseUrl}${route}`, changeFrequency: route === '' ? 'weekly' : 'monthly', priority: route === '' ? 1 : 0.7 }))
}

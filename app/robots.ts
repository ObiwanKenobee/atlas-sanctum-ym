import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://atlas-sanctum-ym.vercel.app'
  return { rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/auth/', '/onboarding/', '/workspace/'] }], sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl }
}

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return { name: 'Atlas Sanctum', short_name: 'Atlas', description: 'Open, evidence-led decision infrastructure for a more flourishing world.', start_url: '/', display: 'standalone', background_color: '#f5f1e8', theme_color: '#17382d', lang: 'en' }
}

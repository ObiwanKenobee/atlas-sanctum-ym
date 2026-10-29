import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return { name: 'Atlas Sanctum', short_name: 'Atlas', description: 'Evidence-led decision infrastructure for a more flourishing world.', start_url: '/', display: 'standalone', background_color: '#f7f3ea', theme_color: '#17382d', icons: [{ src: '/icon-light-32x32.png', sizes: '32x32', type: 'image/png' }] }
}

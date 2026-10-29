import type { Metadata } from 'next'
import AtlasConversion from '@/components/atlas-conversion'
import AtlasSite from '@/components/atlas-site'

export const metadata: Metadata = {
  title: 'Regenerative Decision Infrastructure for Public-Interest Work',
  description: 'Atlas Sanctum helps teams turn field evidence into transparent decisions, accountable action, and verified learning across water, climate, agriculture, food systems, and programmes.',
  keywords: ['regenerative decision infrastructure', 'public-interest technology', 'water and climate resilience', 'agriculture and food systems', 'programme and grant accountability'],
  alternates: { canonical: '/' },
  openGraph: { title: 'Regenerative Decision Infrastructure | Atlas Sanctum', description: 'Turn field evidence into transparent decisions, accountable action, and verified learning.' },
}

export default function Page() {
  return (
    <AtlasConversion>
      <AtlasSite />
    </AtlasConversion>
  )
}

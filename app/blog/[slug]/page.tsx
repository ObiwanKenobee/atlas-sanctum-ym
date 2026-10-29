import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getBlogPost, blogPosts } from '@/lib/blog'

export function generateStaticParams() { return blogPosts.map((post) => ({ slug: post.slug })) }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getBlogPost((await params).slug)
  return post ? { title: `${post.title} | Atlas Sanctum`, description: post.dek } : { title: 'Blog | Atlas Sanctum' }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getBlogPost((await params).slug)
  if (!post) notFound()
  return <main className="min-h-screen bg-[#f7f3ea] text-[#17382d]"><header className="border-b border-[#d4cebd]"><div className="mx-auto flex max-w-4xl items-center justify-between px-5 py-6 lg:px-10"><Link href="/blog" className="font-serif text-xl tracking-[0.15em]">ATLAS <span className="font-sans text-[9px] tracking-[0.24em]">SANCTUM</span></Link><Link href="/blog" className="text-[10px] uppercase tracking-[0.16em] text-[#687168] hover:text-[#a07837]">All notes</Link></div></header><article aria-labelledby="post-title" className="mx-auto max-w-3xl px-5 py-20 lg:px-10"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a07837]">{post.category} / {post.date} / {post.readTime}</p><h1 id="post-title" className="mt-6 font-serif text-6xl font-light leading-[0.95] tracking-[-0.04em] sm:text-8xl">{post.title}</h1><p className="mt-8 text-xl leading-relaxed text-[#687168]">{post.dek}</p><div className="mt-16 space-y-8 border-t border-[#d4cebd] pt-10 text-lg leading-relaxed text-[#455148]">{post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><aside aria-labelledby="sources-title" className="mt-16 border-t border-[#d4cebd] pt-8"><h2 id="sources-title" className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a07837]">Sources and related records</h2><ul className="mt-4 space-y-2 text-sm text-[#687168]">{post.sources.map((source) => <li key={source.href}><Link href={source.href} className="underline decoration-[#d8c28f] underline-offset-4 hover:text-[#17382d]">{source.label}</Link></li>)}</ul></aside><Link href="/blog" className="mt-16 inline-flex text-[10px] font-semibold uppercase tracking-[0.15em] text-[#a07837] hover:text-[#17382d]">← Back to all notes</Link></article></main>
}

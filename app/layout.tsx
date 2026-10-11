import '@/app/globals.css'
import type { Metadata, Viewport } from 'next'
import { supabasePublic as db } from '@/lib/supabase'

export const revalidate = 300

const site = process.env.NEXT_PUBLIC_SITE_URL
  || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')

export async function generateMetadata(): Promise<Metadata> {
  let name = 'Sa\'id Abdul Aziz', username = 'saidazizz', bio = 'Link in bio'
  try {
    const { data } = await db.from('profile').select('name,username,bio').eq('id', 1).single()
    if (data) { name = data.name; username = data.username; bio = (data.bio ?? bio).split('|')[0].trim() }
  } catch {}
  const title = `@${username} — ${name}`
  return {
    metadataBase: new URL(site),
    title, description: bio,
    openGraph: { title, description: bio, type: 'profile', siteName: `@${username}` },
    twitter: { card: 'summary_large_image', title, description: bio },
    icons: { icon: '/icon.svg', apple: '/icon.svg' },
    robots: { index: true, follow: true },
  }
}
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0b1426' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* pasang tema tersimpan sebelum render supaya tidak berkedip */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme');if(t)document.documentElement.dataset.theme=t}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
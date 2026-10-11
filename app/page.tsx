import { supabasePublic as db } from '@/lib/supabase'
import LinkTree from '@/components/LinkTree'

export const revalidate = 30 // perubahan dari admin muncul maks. 30 detik

export default async function Home() {
  const [p, c, l, s] = await Promise.all([
    db.from('profile').select('*').eq('id', 1).single(),
    db.from('categories').select('*').order('sort'),
    db.from('links').select('*').eq('active', true).order('sort'),
    db.from('socials').select('*').order('sort'),
  ])
  if (!p.data) return <p className="p-6 text-center">Profil belum diisi di Supabase.</p>
  return <LinkTree profile={p.data} categories={c.data ?? []} links={l.data ?? []} socials={s.data ?? []} />
}

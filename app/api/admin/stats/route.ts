import { NextRequest, NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const WIB = 7 * 36e5
const day = (t: number) => new Date(t + WIB).toISOString().slice(5, 10) // MM-DD (WIB)

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const db = supabaseAdmin()

  const liveCount = async () => {
    const { count } = await db.from('live_visitors').select('*', { count: 'exact', head: true })
      .gte('last_seen', new Date(Date.now() - 45000).toISOString())
    return count ?? 0
  }
  if (req.nextUrl.searchParams.get('live')) return NextResponse.json({ live: await liveCount() })

  const range = Number(req.nextUrl.searchParams.get('days'))
  const days = [7, 30, 90].includes(range) ? range : 30

  // Supabase membatasi 1000 baris/permintaan, jadi di-page
  const since = new Date(Date.now() - days * 864e5).toISOString()
  let ev: any[] = []
  for (let from = 0; from < 50000; from += 1000) {
    const { data } = await db.from('events').select('type,link_id,country,device,referrer,visitor_id,created_at')
      .gte('created_at', since).order('created_at').range(from, from + 999)
    if (!data?.length) break
    ev = ev.concat(data)
    if (data.length < 1000) break
  }

  const [links, cats, socials, profile, live] = await Promise.all([
    db.from('links').select('*').order('sort'),
    db.from('categories').select('*').order('sort'),
    db.from('socials').select('*').order('sort'),
    db.from('profile').select('*').eq('id', 1).single(),
    liveCount(),
  ])

  const views = ev.filter(e => e.type === 'view')
  const clicks = ev.filter(e => e.type === 'click')

  const tally = (arr: any[], k: string) => {
    const m: Record<string, number> = {}
    arr.forEach(e => { const v = e[k] ?? '?'; m[v] = (m[v] || 0) + 1 })
    return Object.entries(m).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  }

  const daily: Record<string, { date: string; views: number; clicks: number }> = {}
  for (let i = days - 1; i >= 0; i--) { const d = day(Date.now() - i * 864e5); daily[d] = { date: d, views: 0, clicks: 0 } }
  const hours = Array.from({ length: 24 }, (_, h) => ({ hour: `${String(h).padStart(2, '0')}`, views: 0 }))
  ev.forEach(e => {
    const t = new Date(e.created_at).getTime()
    const d = daily[day(t)]
    if (d) e.type === 'view' ? d.views++ : d.clicks++
    if (e.type === 'view') hours[new Date(t + WIB).getUTCHours()].views++
  })

  const titles: Record<string, string> = Object.fromEntries((links.data ?? []).map(l => [l.id, l.title]))
  const clicksByLink: Record<string, number> = {}
  clicks.forEach(c => { if (c.link_id) clicksByLink[c.link_id] = (clicksByLink[c.link_id] || 0) + 1 })
  const popular = tally(clicks.filter(c => c.link_id), 'link_id').slice(0, 5)
    .map(r => ({ label: titles[r.label] ?? '(link dihapus)', value: r.value }))

  return NextResponse.json({
    days,
    totals: { views: views.length, clicks: clicks.length, unique: new Set(views.map(v => v.visitor_id)).size },
    daily: Object.values(daily), hours,
    countries: tally(views, 'country').slice(0, 8),
    devices: tally(views, 'device'),
    referrers: tally(views, 'referrer').slice(0, 8),
    popular, clicksByLink, live,
    links: links.data ?? [], categories: cats.data ?? [], socials: socials.data ?? [], profile: profile.data ?? null,
  })
}
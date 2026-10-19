import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b?.vid || !['view', 'click', 'ping'].includes(b.type))
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 })
    if (req.nextUrl.searchParams.get('diag')) {
    const k = process.env.SUPABASE_SERVICE_ROLE_KEY
    let kt = 'KOSONG ❌'
    if (k) {
      if (k.startsWith('sb_secret_')) kt = 'secret ✅'
      else if (k.startsWith('sb_publishable_')) kt = 'publishable ❌ (kunci publik, bukan service role)'
      else {
        try {
          const r = JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString()).role
          kt = r === 'service_role' ? 'service_role ✅' : `${r} ❌ (harus service_role)`
        } catch { kt = 'format tidak dikenali ❌' }
      }
    }
    const out: Record<string, unknown> = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'ada ✅' : 'KOSONG ❌',
      SUPABASE_SERVICE_ROLE_KEY: kt,
    }
    const step = async (name: string, fn: () => PromiseLike<any>) => {
      try { const r = await fn(); out[name] = r.error ? `GAGAL ❌ ${r.error.message}` : 'OK ✅' }
      catch (e: any) { out[name] = `GAGAL ❌ ${e?.message ?? e}` }
    }
    try {
      const d = supabaseAdmin()
      await step('tulis live_visitors', () => d.from('live_visitors').upsert({ visitor_id: '__diag__', last_seen: new Date().toISOString() }))
      await step('tulis events', () => d.from('events').insert({ type: 'diag', country: 'XX', device: 'diag', referrer: 'diag', visitor_id: '__diag__' }))
      await step('hapus data tes', () => d.from('events').delete().eq('type', 'diag'))
      await step('kolom profile', () => d.from('profile').select('status,location').limit(1))
      await step('kolom links', () => d.from('links').select('badge,starts_at,ends_at').limit(1))
      const last = await d.from('events').select('created_at', { count: 'exact' }).order('created_at', { ascending: false }).limit(1)
      out['total event tersimpan'] = last.error ? `GAGAL ❌ ${last.error.message}` : last.count ?? 0
    } catch (e: any) { out['client supabase'] = `GAGAL ❌ ${e?.message ?? e}` }
    return new NextResponse(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } })
  }

  try {
    const db = supabaseAdmin()
    const vid = String(b.vid).slice(0, 64)

    const live = await db.from('live_visitors').upsert({ visitor_id: vid, last_seen: new Date().toISOString() })
    if (live.error) throw live.error

    if (b.type !== 'ping') {
      const ua = req.headers.get('user-agent') || ''
      const device = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
      let referrer = 'Direct'
      try {
        if (b.ref) {
          const host = new URL(b.ref).hostname.replace(/^www\./, '')
          if (host !== req.nextUrl.hostname) referrer = host
        }
      } catch {}
      const ins = await db.from('events').insert({
        type: b.type,
        link_id: b.type === 'click' && UUID.test(String(b.linkId)) ? b.linkId : null,
        country: req.headers.get('x-vercel-ip-country') || 'XX',
        device, referrer, visitor_id: vid,
      })
      if (ins.error) throw ins.error
    }
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[track] gagal simpan:', e?.message ?? e)
    return NextResponse.json({ ok: false, error: e?.message ?? 'server error' }, { status: 500 })
  }
}

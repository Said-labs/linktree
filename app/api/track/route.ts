import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b?.vid || !['view', 'click', 'ping'].includes(b.type))
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 })

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

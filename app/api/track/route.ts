import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null)
  if (!b?.vid) return NextResponse.json({ ok: false }, { status: 400 })

  const db = supabaseAdmin()
  const vid = String(b.vid).slice(0, 64)

  // 🟢 Live visitors: setiap ping/view memperbarui last_seen
  await db.from('live_visitors').upsert({ visitor_id: vid, last_seen: new Date().toISOString() })

  if (b.type === 'view' || b.type === 'click') {
    const ua = req.headers.get('user-agent') || ''
    const device = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop'
    let referrer = 'Direct'
    try {
      if (b.ref) {
        const host = new URL(b.ref).hostname.replace(/^www\./, '')
        if (host !== req.nextUrl.hostname) referrer = host
      }
    } catch {}
    await db.from('events').insert({
      type: b.type,
      link_id: b.type === 'click' ? b.linkId ?? null : null,
      country: req.headers.get('x-vercel-ip-country') || 'XX', // otomatis dari Vercel
      device, referrer, visitor_id: vid,
    })
  }
  return NextResponse.json({ ok: true })
}

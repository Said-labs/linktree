import { NextRequest, NextResponse } from 'next/server'
import { isAuthed } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { isSafeUrl } from '@/lib/url'

const ALLOWED = ['links', 'categories', 'socials', 'profile']

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { table, action, id, data } = await req.json().catch(() => ({}))
  if (!ALLOWED.includes(table)) return NextResponse.json({ error: 'tabel tidak valid' }, { status: 400 })

  // cegah skema berbahaya (javascript:, data:, dll)
  if ((table === 'links' || table === 'socials') && data?.url !== undefined && !isSafeUrl(String(data.url)))
    return NextResponse.json({ error: 'URL harus diawali https://, http://, mailto: atau tel:' }, { status: 400 })

  const db = supabaseAdmin()
  let error
  if (action === 'insert') ({ error } = await db.from(table).insert(data))
  else if (action === 'update') ({ error } = await db.from(table).update(data).eq('id', id))
  else if (action === 'delete') ({ error } = await db.from(table).delete().eq('id', id))
  else if (action === 'reorder' && Array.isArray(data?.ids)) {
    // data.ids = daftar id sesuai urutan baru
    for (let i = 0; i < data.ids.length; i++) {
      const r = await db.from(table).update({ sort: i }).eq('id', data.ids[i])
      if (r.error) { error = r.error; break }
    }
  } else return NextResponse.json({ error: 'aksi tidak valid' }, { status: 400 })

  return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json({ ok: true })
}
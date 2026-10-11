import { NextRequest, NextResponse } from 'next/server'
import { checkPassword, makeToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json().catch(() => ({}))
  if (typeof password !== 'string' || !checkPassword(password)) {
    await new Promise(r => setTimeout(r, 800)) // perlambat tebak-tebakan password
    return NextResponse.json({ error: 'Password salah' }, { status: 401 })
  }
  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', makeToken(), {
    httpOnly: true, sameSite: 'strict', path: '/', maxAge: 7 * 86400,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('admin_session')
  return res
}

import { createHash, createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest } from 'next/server'

const sig = (v: string) => createHmac('sha256', process.env.ADMIN_SESSION_SECRET!).update(v).digest('hex')

export function makeToken() {
  const exp = String(Date.now() + 7 * 864e5) // berlaku 7 hari
  return `${exp}.${sig(exp)}`
}

export function isAuthed(req: NextRequest) {
  const t = req.cookies.get('admin_session')?.value
  if (!t) return false
  const [exp, s] = t.split('.')
  if (!exp || !s || Number(exp) < Date.now()) return false
  const a = Buffer.from(s), b = Buffer.from(sig(exp))
  return a.length === b.length && timingSafeEqual(a, b)
}

export function checkPassword(p: string) {
  const h = (x: string) => createHash('sha256').update(x).digest()
  return timingSafeEqual(h(p), h(process.env.ADMIN_PASSWORD!))
}

'use client'
import { FormEvent, ReactNode, useCallback, useEffect, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import Logo from '@/components/Logo'
import { THEMES } from '@/lib/themes'
import type { Category, LinkItem, Profile, Social } from '@/lib/types'

type Row = { label: string; value: number }
type Data = {
  days: number
  totals: { views: number; clicks: number; unique: number }
  daily: { date: string; views: number; clicks: number }[]
  hours: { hour: string; views: number }[]
  countries: Row[]; devices: Row[]; referrers: Row[]; popular: Row[]
  clicksByLink: Record<string, number>
  live: number; links: LinkItem[]; categories: Category[]; socials: Social[]; profile: Profile | null
}

const COLORS = ['#0ea5e9', '#f59e0b', '#22c55e', '#a855f7']
const PLATFORMS = ['instagram', 'github', 'linkedin', 'tiktok', 'whatsapp', 'youtube', 'x', 'facebook', 'telegram', 'threads', 'spotify', 'discord', 'email', 'website']
const flag = (c: string) => c.length === 2 && c !== 'XX'
  ? String.fromCodePoint(...[...c.toUpperCase()].map(ch => 127397 + ch.charCodeAt(0))) : '🌐'
const countryName = (c: string) => { try { return new Intl.DisplayNames(['id'], { type: 'region' }).of(c.toUpperCase()) ?? c } catch { return c } }
// <input type="datetime-local"> <-> ISO
const toLocal = (iso: string | null) => iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 6e4).toISOString().slice(0, 16) : ''
const toIso = (v: string) => v ? new Date(v).toISOString() : null

async function api(table: string, action: string, id?: string | number, data?: object) {
  const r = await fetch('/api/admin/crud', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table, action, id, data }) })
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Gagal')
}

function Panel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return <section className={`card p-4 ${className}`}><h2 className="mb-3 font-bold">{title}</h2>{children}</section>
}
function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return <div className="card p-4"><p className="muted text-[0.8rem]">{label}</p><p className="mt-1 text-[1.6rem] font-bold">{value}</p>{hint && <p className="muted text-[0.7rem]">{hint}</p>}</div>
}
function Bars({ rows }: { rows: Row[] }) {
  const max = Math.max(1, ...rows.map(r => r.value))
  if (!rows.length) return <p className="muted text-[0.85rem]">Belum ada data</p>
  return (
    <ul className="space-y-2">
      {rows.map(r => (
        <li key={r.label}>
          <div className="flex justify-between gap-2 text-[0.85rem]"><span className="truncate">{r.label}</span><b>{r.value}</b></div>
          <div className="h-1.5 rounded bg-black/10"><div className="h-full rounded" style={{ width: `${(r.value / max) * 100}%`, background: 'var(--accent)' }} /></div>
        </li>
      ))}
    </ul>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [data, setData] = useState<Data | null>(null)
  const [live, setLive] = useState(0)
  const [days, setDays] = useState(30)
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')

  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(''), 2200) }, [])

  const load = useCallback(async (d = days) => {
    const r = await fetch(`/api/admin/stats?days=${d}`)
    if (r.status === 401) return setAuthed(false)
    const j: Data = await r.json()
    setData(j); setLive(j.live); setAuthed(true)
  }, [days])

  useEffect(() => { load() }, [load])
  useEffect(() => { // 🟢 refresh live visitors tiap 10 detik
    if (!authed) return
    const t = setInterval(async () => {
      const r = await fetch('/api/admin/stats?live=1')
      if (r.ok) setLive((await r.json()).live)
    }, 10000)
    return () => clearInterval(t)
  }, [authed])

  // helper: jalankan perubahan → toast → muat ulang
  const run = useCallback(async (fn: () => Promise<void>, ok = 'Tersimpan ✓') => {
    try { await fn(); say(ok); await load() } catch (e: any) { say('⚠️ ' + e.message) }
  }, [load, say])

  async function login(e: FormEvent) {
    e.preventDefault(); setErr('')
    const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    if (!r.ok) return setErr('Password salah')
    setPw(''); load()
  }
  async function logout() { await fetch('/api/admin/login', { method: 'DELETE' }); setAuthed(false); setData(null) }

  if (authed === null) return <p className="p-10 text-center">Memuat…</p>

  if (!authed) return (
    <main className="admin grid min-h-[100dvh] place-items-center p-4">
      <form onSubmit={login} className="card w-full max-w-[22rem] space-y-3 p-6">
        <h1 className="text-center text-[1.3rem] font-bold">🔐 Admin Login</h1>
        <input type="password" autoFocus placeholder="Password" value={pw} onChange={e => setPw(e.target.value)} className="field" />
        {err && <p className="text-center text-[0.85rem] text-red-600">{err}</p>}
        <button className="btn w-full">Masuk</button>
        <a href="/" className="muted block text-center text-[0.8rem]">← Kembali</a>
      </form>
    </main>
  )

  const d = data!
  const ctr = d.totals.views ? ((d.totals.clicks / d.totals.views) * 100).toFixed(1) + '%' : '0%'
  const exportCsv = () => {
    const rows = ['tanggal,views,klik', ...d.daily.map(x => `${x.date},${x.views},${x.clicks}`)].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' })); a.download = `traffic-${d.days}hari.csv`; a.click()
  }

  return (
    <main className="admin mx-auto w-full max-w-6xl space-y-4 p-3 sm:p-6">
      <header className="admin-head flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[1.3rem] font-bold">📊 Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          {[7, 30, 90].map(n => (
            <button key={n} className="pill" data-active={days === n} onClick={() => { setDays(n); load(n) }}>{n} hari</button>
          ))}
          <button onClick={exportCsv} className="pill">⬇ CSV</button>
          <a href="/" className="pill">← Web</a><button onClick={logout} className="pill">Keluar</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={`Views (${d.days} hari)`} value={d.totals.views} />
        <Stat label="Pengunjung unik" value={d.totals.unique} />
        <Stat label={`Klik (${d.days} hari)`} value={d.totals.clicks} />
        <Stat label="Click-through rate" value={ctr} />
        <Stat label="🟢 Live" value={live} hint="aktif ±45 detik" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Panel title="📈 Traffic" className="md:col-span-2 xl:col-span-3">
          <div className="h-[15rem]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.daily}>
                <CartesianGrid strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis allowDecimals={false} width={30} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area dataKey="views" name="Views" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.25} />
                <Area dataKey="clicks" name="Klik" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="🕒 Jam Ramai (WIB)">
          <div className="h-[11rem]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.hours}>
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                <YAxis allowDecimals={false} width={26} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="views" name="Views" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="🌍 Negara"><Bars rows={d.countries.map(r => ({ label: `${flag(r.label)} ${countryName(r.label)}`, value: r.value }))} /></Panel>

        <Panel title="📱 Perangkat">
          {d.devices.length ? (
            <div className="h-[11rem]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={d.devices} dataKey="value" nameKey="label" innerRadius="50%" outerRadius="85%" label={({ name }: { name?: string }) => name}>
                    {d.devices.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="muted text-[0.85rem]">Belum ada data</p>}
        </Panel>

        <Panel title="🔥 Link Terpopuler"><Bars rows={d.popular} /></Panel>
        <Panel title="🔍 Sumber Pengunjung"><Bars rows={d.referrers} /></Panel>

        <Panel title="👤 Profil" className="md:col-span-2 xl:col-span-3"><ProfileEditor p={d.profile} run={run} /></Panel>
        <Panel title="🔗 Kelola Link" className="md:col-span-2 xl:col-span-3"><LinkManager links={d.links} categories={d.categories} clicks={d.clicksByLink} days={d.days} run={run} /></Panel>
        <Panel title="🌐 Sosial Media" className="md:col-span-2 xl:col-span-3"><SocialManager socials={d.socials} run={run} /></Panel>
      </div>

      <div aria-live="polite" className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-4 py-2 text-[0.85rem] font-semibold text-white shadow-xl transition-all ${toast ? 'opacity-100' : 'translate-y-3 opacity-0'}`}>{toast}</div>
    </main>
  )
}

type Run = (fn: () => Promise<void>, ok?: string) => Promise<void>

/* ---------- Profil ---------- */
function ProfileEditor({ p, run }: { p: Profile | null; run: Run }) {
  const [f, setF] = useState<any>(p ?? {})
  useEffect(() => { setF(p ?? {}) }, [p])
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  if (!p) return <p className="muted text-[0.85rem]">Profil belum ada di database.</p>
  const submit = (e: FormEvent) => {
    e.preventDefault()
    const { id, ...rest } = f
    run(() => api('profile', 'update', 1, Object.fromEntries(Object.entries(rest).map(([k, v]) => [k, v === '' ? null : v]))))
  }
  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
      <label className="text-[0.75rem] muted">Nama<input required value={f.name ?? ''} onChange={set('name')} className="field mt-1" /></label>
      <label className="text-[0.75rem] muted">Username (tanpa @)<input required value={f.username ?? ''} onChange={set('username')} className="field mt-1" /></label>
      <label className="text-[0.75rem] muted sm:col-span-2">Bio — pisahkan dengan <b>|</b> untuk efek ketik bergantian
        <input value={f.bio ?? ''} onChange={set('bio')} className="field mt-1" placeholder="Informatics Student 💻 | Web Developer | Always learning" /></label>
      <label className="text-[0.75rem] muted">Status<input value={f.status ?? ''} onChange={set('status')} className="field mt-1" placeholder="Open for collab" /></label>
      <label className="text-[0.75rem] muted">Lokasi<input value={f.location ?? ''} onChange={set('location')} className="field mt-1" placeholder="Bandung, ID" /></label>
      <label className="text-[0.75rem] muted">No. WhatsApp (+62…)<input value={f.phone ?? ''} onChange={set('phone')} className="field mt-1" /></label>
      <label className="text-[0.75rem] muted">Email<input type="email" value={f.email ?? ''} onChange={set('email')} className="field mt-1" /></label>
      <label className="text-[0.75rem] muted">URL foto profil<input value={f.avatar_url ?? ''} onChange={set('avatar_url')} className="field mt-1" placeholder="/avatar.svg atau https://…" /></label>
      <label className="text-[0.75rem] muted">Tema default
        <select value={f.theme ?? 'ocean'} onChange={set('theme')} className="field mt-1">{THEMES.map(t => <option key={t.id} value={t.id}>{t.emoji} {t.name}</option>)}</select></label>
      <div className="sm:col-span-2"><button className="btn">Simpan Profil</button></div>
    </form>
  )
}

/* ---------- Link ---------- */
const EMPTY = { title: '', url: '', description: '', icon_url: '', category_id: '', badge: '', featured: false, active: true, starts_at: '', ends_at: '' }

function LinkManager({ links, categories, clicks, days, run }: { links: LinkItem[]; categories: Category[]; clicks: Record<string, number>; days: number; run: Run }) {
  const [form, setForm] = useState<any>(EMPTY)
  const [catName, setCatName] = useState('')
  const [catEmoji, setCatEmoji] = useState('')
  const [q, setQ] = useState('')

  const set = (k: string) => (e: any) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const save = (e: FormEvent) => {
    e.preventDefault()
    const { id, created_at, ...rest } = form
    const payload = {
      ...rest, category_id: rest.category_id || null, icon_url: rest.icon_url || null, badge: rest.badge || null,
      description: rest.description || null, starts_at: toIso(rest.starts_at), ends_at: toIso(rest.ends_at),
      ...(id ? {} : { sort: links.length }),
    }
    run(() => api('links', id ? 'update' : 'insert', id, payload), id ? 'Perubahan disimpan ✓' : 'Link ditambahkan ✓')
    setForm(EMPTY)
  }
  const move = (i: number, dir: -1 | 1) => {
    const ids = links.map(l => l.id); const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    run(() => api('links', 'reorder', undefined, { ids }), 'Urutan diubah ✓')
  }
  const dup = (l: LinkItem) => {
    const { id, created_at, ...rest } = l
    run(() => api('links', 'insert', undefined, { ...rest, title: l.title + ' (salinan)', sort: links.length, featured: false }), 'Diduplikasi ✓')
  }
  const shown = links.filter(l => !q || `${l.title} ${l.url}`.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="space-y-5">
      <form onSubmit={save} className="grid gap-2 sm:grid-cols-2">
        <input required placeholder="Judul" value={form.title} onChange={set('title')} className="field" />
        <input required placeholder="URL tujuan (https://…)" value={form.url} onChange={set('url')} className="field" />
        <input placeholder="Deskripsi singkat (tampil di bawah judul)" value={form.description ?? ''} onChange={set('description')} className="field sm:col-span-2" />
        <input placeholder="Logo custom (opsional — kosong = otomatis dari domain)" value={form.icon_url ?? ''} onChange={set('icon_url')} className="field" />
        <select value={form.category_id ?? ''} onChange={set('category_id')} className="field">
          <option value="">— Tanpa kategori —</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
        <input placeholder="Badge (mis. Hot, Baru, Gratis)" value={form.badge ?? ''} onChange={set('badge')} className="field" maxLength={14} />
        <div className="flex items-center gap-4 text-[0.9rem]">
          <label className="flex items-center gap-1"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> 🔥 Featured</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={form.active} onChange={set('active')} /> Aktif</label>
        </div>
        <label className="muted text-[0.72rem]">Tampil mulai (opsional)<input type="datetime-local" value={form.starts_at ?? ''} onChange={set('starts_at')} className="field mt-1" /></label>
        <label className="muted text-[0.72rem]">Sembunyi setelah (opsional)<input type="datetime-local" value={form.ends_at ?? ''} onChange={set('ends_at')} className="field mt-1" /></label>
        <div className="flex gap-2 sm:col-span-2">
          <button className="btn">{form.id ? 'Simpan Perubahan' : '+ Tambah Link'}</button>
          {form.id && <button type="button" className="pill" onClick={() => setForm(EMPTY)}>Batal</button>}
        </div>
      </form>

      {links.length > 6 && <input placeholder="Cari link…" value={q} onChange={e => setQ(e.target.value)} className="field" />}

      <ul className="divide-y divide-black/10">
        {shown.map(l => {
          const i = links.findIndex(x => x.id === l.id)
          return (
            <li key={l.id} className="flex flex-wrap items-center gap-2 py-2">
              <Logo url={l.url} custom={l.icon_url} size="2.4rem" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{l.featured && '🔥 '}{l.title}{l.badge && <span className="badge ml-2">{l.badge}</span>}{!l.active && <span className="muted"> (nonaktif)</span>}</p>
                <p className="muted truncate text-[0.75rem]">{l.url}</p>
                {(l.starts_at || l.ends_at) && <p className="muted text-[0.7rem]">⏰ {l.starts_at ? new Date(l.starts_at).toLocaleString('id-ID') : '…'} → {l.ends_at ? new Date(l.ends_at).toLocaleString('id-ID') : '…'}</p>}
              </div>
              <span className="muted text-[0.75rem]" title={`klik ${days} hari terakhir`}>👆 {clicks[l.id] ?? 0}</span>
              <button className="pill" aria-label="Naik" disabled={i === 0 || !!q} onClick={() => move(i, -1)}>↑</button>
              <button className="pill" aria-label="Turun" disabled={i === links.length - 1 || !!q} onClick={() => move(i, 1)}>↓</button>
              <button className="pill" onClick={() => { setForm({ ...l, starts_at: toLocal(l.starts_at), ends_at: toLocal(l.ends_at) }); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Edit</button>
              <button className="pill" onClick={() => dup(l)}>Duplikat</button>
              <button className="pill" onClick={() => run(() => api('links', 'update', l.id, { active: !l.active }), l.active ? 'Disembunyikan' : 'Ditampilkan')}>{l.active ? 'Sembunyikan' : 'Tampilkan'}</button>
              <button className="pill" aria-label="Hapus" onClick={() => confirm(`Hapus "${l.title}"?`) && run(() => api('links', 'delete', l.id), 'Dihapus')}>🗑</button>
            </li>
          )
        })}
        {!links.length && <li className="muted py-2 text-[0.85rem]">Belum ada link.</li>}
      </ul>

      <div>
        <p className="mb-2 text-[0.9rem] font-semibold">📂 Kategori</p>
        <div className="flex flex-wrap gap-2">
          {categories.map(c => (
            <span key={c.id} className="pill">
              {c.emoji} {c.name}
              <button aria-label="hapus" onClick={() => confirm(`Hapus kategori "${c.name}"?`) && run(() => api('categories', 'delete', c.id), 'Kategori dihapus')}>✕</button>
            </span>
          ))}
        </div>
        <form className="mt-2 flex gap-2" onSubmit={e => { e.preventDefault(); if (catName.trim()) { run(() => api('categories', 'insert', undefined, { name: catName.trim(), emoji: catEmoji.trim() || null, sort: categories.length }), 'Kategori ditambahkan'); setCatName(''); setCatEmoji('') } }}>
          <input placeholder="😀" value={catEmoji} onChange={e => setCatEmoji(e.target.value)} className="field !w-16 text-center" maxLength={4} />
          <input placeholder="Nama kategori baru" value={catName} onChange={e => setCatName(e.target.value)} className="field" />
          <button className="btn">Tambah</button>
        </form>
      </div>
    </div>
  )
}

/* ---------- Sosial ---------- */
function SocialManager({ socials, run }: { socials: Social[]; run: Run }) {
  const [platform, setPlatform] = useState('instagram')
  const [url, setUrl] = useState('')
  const move = (i: number, dir: -1 | 1) => {
    const ids = socials.map(s => s.id); const j = i + dir
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    run(() => api('socials', 'reorder', undefined, { ids }), 'Urutan diubah ✓')
  }
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-black/10">
        {socials.map((s, i) => (
          <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
            <b className="w-24 text-[0.85rem] capitalize">{s.platform}</b>
            <span className="muted min-w-0 flex-1 truncate text-[0.8rem]">{s.url}</span>
            <button className="pill" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button className="pill" disabled={i === socials.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button className="pill" onClick={() => confirm(`Hapus ${s.platform}?`) && run(() => api('socials', 'delete', s.id), 'Dihapus')}>🗑</button>
          </li>
        ))}
        {!socials.length && <li className="muted py-2 text-[0.85rem]">Belum ada sosial media.</li>}
      </ul>
      <form className="flex flex-wrap gap-2" onSubmit={e => { e.preventDefault(); run(() => api('socials', 'insert', undefined, { platform, url: url.trim(), sort: socials.length }), 'Ditambahkan ✓'); setUrl('') }}>
        <select value={platform} onChange={e => setPlatform(e.target.value)} className="field !w-40">{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select>
        <input required placeholder="https://… / mailto:… " value={url} onChange={e => setUrl(e.target.value)} className="field min-w-0 flex-1" />
        <button className="btn">Tambah</button>
      </form>
    </div>
  )
}
'use client'
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { IconType } from 'react-icons'
import { QRCodeSVG } from 'qrcode.react'
import {
  FaArrowUpRightFromSquare, FaDiscord, FaEnvelope, FaFacebookF, FaGithub, FaGlobe, FaInstagram, FaLink, FaLinkedinIn,
  FaLocationDot, FaMagnifyingGlass, FaPalette, FaQrcode, FaRegAddressCard, FaRegCopy, FaShareNodes, FaSpotify,
  FaTelegram, FaThreads, FaTiktok, FaWhatsapp, FaXmark, FaXTwitter, FaYoutube,
} from 'react-icons/fa6'
import { track } from '@/lib/track'
import { THEMES } from '@/lib/themes'
import { hostOf, safeUrl } from '@/lib/url'
import Logo from '@/components/Logo'
import type { Category, LinkItem, Profile, Social } from '@/lib/types'

const ICONS: Record<string, IconType> = {
  linkedin: FaLinkedinIn, whatsapp: FaWhatsapp, github: FaGithub, tiktok: FaTiktok, instagram: FaInstagram,
  youtube: FaYoutube, x: FaXTwitter, twitter: FaXTwitter, facebook: FaFacebookF, telegram: FaTelegram,
  threads: FaThreads, spotify: FaSpotify, discord: FaDiscord, email: FaEnvelope, website: FaGlobe,
}

const TZ = 'Asia/Jakarta'

function LinkCard({ l, i, featured, isNew, onGo, onCopy }: {
  l: LinkItem; i: number; featured?: boolean; isNew: boolean; onGo: (l: LinkItem) => void; onCopy: (l: LinkItem) => void
}) {
  const badge = l.badge || (isNew ? 'New' : '')
  return (
    <div className="rise relative" style={{ ['--i' as string]: i }}>
      <a href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer" onClick={() => onGo(l)}
        className={`card linkcard flex items-center gap-3.5 pr-[3.3rem] ${featured ? 'feature p-3.5' : 'p-3'}`}>
        <Logo url={l.url} custom={l.icon_url} size={featured ? '3.4rem' : '2.9rem'} />
        <span className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-2">
            <span className={`truncate ${featured ? 'text-[1.05rem] font-bold' : 'text-[0.98rem] font-semibold'}`}>{l.title}</span>
            {badge && <span className="badge shrink-0">{badge}</span>}
          </span>
          <span className="muted mt-0.5 block truncate text-[0.78rem]">{l.description || hostOf(l.url)}</span>
        </span>
        <FaArrowUpRightFromSquare className="go muted shrink-0 text-[0.72rem] opacity-60" aria-hidden />
      </a>
      <button type="button" aria-label={`Salin link ${l.title}`} title="Salin link" onClick={() => onCopy(l)}
        className="muted absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full transition hover:bg-white/10 hover:text-[var(--fg)]">
        <FaRegCopy className="text-[0.9rem]" />
      </button>
    </div>
  )
}

type Props = { profile: Profile; categories: Category[]; links: LinkItem[]; socials: Social[] }

export default function LinkTree({ profile, categories, links, socials }: Props) {
  const [cat, setCat] = useState('all')
  const [query, setQuery] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [showTheme, setShowTheme] = useState(false)
  const [theme, setTheme] = useState('ocean')
  const [origin, setOrigin] = useState('')
  const [toast, setToast] = useState('')
  const [mounted, setMounted] = useState(false)
  const [clock, setClock] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  // Bio dipisah "|" → tampil sebagai satu baris rapi: "Informatics Student · Web Developer"
  const tagline = (profile.bio ?? '').split('|').map(s => s.trim()).filter(Boolean).join('  ·  ')

  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(''), 1800) }, [])

  useEffect(() => {
    setMounted(true); setOrigin(window.location.origin)
    let saved = profile.theme || 'ocean'
    try { saved = localStorage.getItem('theme') || saved } catch {}
    document.documentElement.dataset.theme = saved
    setTheme(saved)
    const upd = () => setClock(new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: false }).format(new Date()).replace(':', '.'))
    upd(); const c = setInterval(upd, 20000)
    track('view')
    const t = setInterval(() => { if (!document.hidden) track('ping') }, 20000)
    return () => { clearInterval(t); clearInterval(c) }
  }, [profile.theme])

  // Pintasan: "/" fokus ke pencarian, Esc tutup panel
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /input|textarea/i.test((e.target as HTMLElement)?.tagName)
      if (e.key === '/' && !typing) { e.preventDefault(); searchRef.current?.focus() }
      if (e.key === 'Escape') { setShowQr(false); setShowTheme(false); searchRef.current?.blur() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const pickTheme = (id: string) => {
    setTheme(id); document.documentElement.dataset.theme = id
    try { localStorage.setItem('theme', id) } catch {}
  }
  const copy = async (text: string, msg = 'Link disalin ✓') => {
    try { await navigator.clipboard.writeText(text); say(msg) } catch { say('Gagal menyalin') }
  }
  const go = (l: LinkItem) => { track('click', l.id); try { navigator.vibrate?.(8) } catch {} }
  const share = async () => {
    const data = { title: `@${profile.username}`, text: profile.name, url: origin }
    if (navigator.share) { try { await navigator.share(data) } catch {} } else copy(origin)
  }

  // Simpan kontak (.vcf dibuat di browser)
  const saveContact = () => {
    const v = [
      'BEGIN:VCARD', 'VERSION:3.0', `FN:${profile.name}`, `N:;${profile.name};;;`, `TITLE:${(profile.bio ?? '').split('|')[0].trim()}`,
      profile.phone && `TEL;TYPE=CELL:${profile.phone}`, profile.email && `EMAIL:${profile.email}`,
      `URL:${window.location.origin}`, 'END:VCARD',
    ].filter(Boolean).join('\r\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([v], { type: 'text/vcard;charset=utf-8' }))
    a.download = `${profile.username}.vcf`; a.click(); URL.revokeObjectURL(a.href)
    say('Kontak disimpan ✓')
  }

  const q = query.trim().toLowerCase()
  const match = (l: LinkItem) => !q || `${l.title} ${l.description ?? ''} ${hostOf(l.url)}`.toLowerCase().includes(q)
  const featured = links.filter(l => l.featured && match(l))
  const regularAll = links.filter(l => !l.featured)
  const regular = regularAll.filter(l => (cat === 'all' || l.category_id === cat) && match(l))
  const countOf = (id: string) => regularAll.filter(l => l.category_id === id).length
  const isNew = (l: LinkItem) => mounted && !!l.created_at && Date.now() - new Date(l.created_at).getTime() < 7 * 864e5
  const wa = profile.phone ? `https://wa.me/${profile.phone.replace(/\D/g, '')}` : ''
  const mail = profile.email ? `mailto:${profile.email}` : ''
  const meta = useMemo(() => [profile.location, clock && `${clock} WIB`].filter(Boolean).join(' · '), [profile.location, clock])

  return (
    <>
      <div className="aurora" aria-hidden><i /><i /><i /></div>
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[30rem] flex-col items-center px-4 pb-10 pt-5">
        {/* Bilah atas: alat kecil */}
        <div className="flex w-full justify-end gap-2">
          <button className="iconbtn" onClick={share} aria-label="Bagikan" title="Bagikan"><FaShareNodes /></button>
          <button className="iconbtn" onClick={() => setShowQr(true)} aria-label="Kode QR" title="Kode QR"><FaQrcode /></button>
          <button className="iconbtn" onClick={() => setShowTheme(v => !v)} aria-expanded={showTheme} aria-label="Tema" title="Tema"><FaPalette /></button>
        </div>

        {showTheme && (
          <div className="card pop mt-3 grid w-full grid-cols-4 gap-1.5 p-2.5">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => pickTheme(t.id)}
                className={`rounded-xl border px-1 py-2 text-[0.7rem] font-semibold transition ${theme === t.id ? 'border-[color:var(--accent)] bg-white/10' : 'border-transparent hover:bg-white/5'}`}>
                <span className="block text-[1.25rem]">{t.emoji}</span>{t.name}
              </button>
            ))}
          </div>
        )}

        {/* Profil */}
        <header className="rise mt-3 flex w-full flex-col items-center text-center">
          <img src={profile.avatar_url || '/avatar.svg'} alt={profile.name}
            className="avatar h-[6.6rem] w-[6.6rem] rounded-full bg-slate-700 object-cover" />
          <h1 className="mt-5 text-[1.55rem] font-bold leading-tight tracking-tight">{profile.name}</h1>
          <p className="muted mt-0.5 text-[0.85rem] font-medium">@{profile.username}</p>
          {tagline && <p className="balance mt-2.5 max-w-[24rem] text-[0.95rem] leading-snug opacity-90">{tagline}</p>}

          {(profile.status || meta) && (
            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[0.76rem] font-medium">
              {profile.status && (
                <span className="inline-flex items-center gap-1.5 text-[color:var(--fg)]">
                  <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
                  {profile.status}
                </span>
              )}
              {meta && <span className="muted inline-flex items-center gap-1.5"><FaLocationDot className="text-[0.7rem]" />{meta}</span>}
            </div>
          )}

          {/* Tombol utama */}
          <div className="mt-5 flex w-full items-center justify-center gap-2.5">
            <button className="btn flex-1 sm:flex-none sm:px-6" onClick={saveContact}><FaRegAddressCard />Simpan Kontak</button>
            {wa && <a className="btn-ghost" href={wa} target="_blank" rel="noopener noreferrer"><FaWhatsapp />WhatsApp</a>}
            {mail && <a className="iconbtn !h-[2.7rem] !w-[2.7rem] !rounded-[.85rem]" href={mail} aria-label="Email" title="Email"><FaEnvelope /></a>}
          </div>
        </header>

        {/* Pencarian */}
        {links.length > 5 && (
          <div className="rise relative mt-7 w-full" style={{ ['--i' as string]: 2 }}>
            <FaMagnifyingGlass className="muted pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[0.8rem]" />
            <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari link…" aria-label="Cari link"
              className="card w-full bg-transparent py-2.5 pl-10 pr-10 text-[0.9rem] outline-none placeholder:text-[var(--muted)] focus:border-[color:var(--accent)]" />
            {query && <button aria-label="Hapus pencarian" onClick={() => setQuery('')} className="muted absolute right-3 top-1/2 -translate-y-1/2 p-1"><FaXmark /></button>}
          </div>
        )}

        {/* Featured */}
        {featured.length > 0 && (
          <section className="mt-7 w-full space-y-3">
            <p className="eyebrow">Featured</p>
            {featured.map((l, i) => <LinkCard key={l.id} l={l} i={i + 3} featured isNew={isNew(l)} onGo={go} onCopy={x => copy(x.url)} />)}
          </section>
        )}

        {/* Kategori */}
        {categories.length > 0 && !q && (
          <nav className="no-scrollbar mt-7 flex w-full gap-2 overflow-x-auto pb-1" aria-label="Kategori">
            <button className="pill" data-active={cat === 'all'} onClick={() => setCat('all')}>Semua <span className="opacity-60">{regularAll.length}</span></button>
            {categories.map(c => (
              <button key={c.id} className="pill" data-active={cat === c.id} onClick={() => setCat(c.id)}>
                {c.emoji} {c.name} <span className="opacity-60">{countOf(c.id)}</span>
              </button>
            ))}
          </nav>
        )}

        {/* Daftar link: klik langsung ke website */}
        <section className="mt-3.5 w-full space-y-2.5" key={cat + q}>
          {regular.map((l, i) => <LinkCard key={l.id} l={l} i={i + 4} isNew={isNew(l)} onGo={go} onCopy={x => copy(x.url)} />)}
          {regular.length === 0 && featured.length === 0 && (
            <p className="muted py-8 text-center text-[0.9rem]">{q ? `Tidak ada hasil untuk “${query}”` : 'Belum ada link di kategori ini.'}</p>
          )}
        </section>

        {/* Sosial */}
        {socials.length > 0 && (
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {socials.map(s => {
              const Icon = ICONS[s.platform.toLowerCase()] ?? FaLink
              return (
                <a key={s.id} aria-label={s.platform} title={s.platform} href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer"
                  className="iconbtn !h-11 !w-11 !text-[1.05rem]">
                  <Icon />
                </a>
              )
            })}
          </div>
        )}

        <footer className="muted mt-10 text-center text-[0.72rem]">
          <p>© {mounted ? new Date().getFullYear() : ''} {profile.name}</p>
          <a href="/admin" className="mt-1 inline-block opacity-50 hover:opacity-100">Admin</a>
        </footer>
      </main>

      {/* QR */}
      {showQr && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowQr(false)} role="dialog" aria-modal="true">
          <div className="card pop w-full max-w-[20rem] p-5 text-center !bg-[var(--from)]" onClick={e => e.stopPropagation()}>
            <h2 className="font-semibold">Scan untuk membuka</h2>
            <div className="mx-auto my-4 w-full max-w-[14rem] rounded-2xl bg-white p-3">
              <QRCodeSVG value={origin || 'https://example.com'} size={256} level="H" style={{ width: '100%', height: 'auto' }}
                imageSettings={{ src: profile.avatar_url || '/avatar.svg', width: 52, height: 52, excavate: true }} />
            </div>
            <p className="muted mb-3 truncate text-[0.8rem]">{origin}</p>
            <div className="flex justify-center gap-2">
              <button className="btn !py-2" onClick={() => copy(origin)}>Salin Link</button>
              <button className="btn-ghost !py-2" onClick={share}>Bagikan</button>
            </div>
            <button className="muted mt-3 text-[0.8rem]" onClick={() => setShowQr(false)}>Tutup</button>
          </div>
        </div>
      )}

      {/* Toast */}
      <div aria-live="polite" className={`pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300 ${toast ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
        <div className="card !bg-[var(--from)] px-4 py-2 text-[0.85rem] font-semibold">{toast}</div>
      </div>
    </>
  )
}
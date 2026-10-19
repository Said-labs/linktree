'use client'
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import type { IconType } from 'react-icons'
import { QRCodeSVG } from 'qrcode.react'
import {
  FaArrowUpRightFromSquare, FaDiscord, FaEnvelope, FaFacebookF, FaGithub, FaGlobe, FaInstagram, FaLink, FaLinkedinIn,
  FaMagnifyingGlass, FaPalette, FaQrcode, FaRegAddressCard, FaRegCopy, FaShareNodes, FaSpotify,
  FaTelegram, FaThreads, FaTiktok, FaWhatsapp, FaXmark, FaXTwitter, FaYoutube,
} from 'react-icons/fa6'
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
const PAL = ['--p1', '--p4', '--p2', '--p5', '--p3', '--p6']
const col = (k: number) => `var(${PAL[((k % PAL.length) + PAL.length) % PAL.length]})`
const vars = (o: Record<string, string | number>) => o as unknown as CSSProperties
const validTheme = (id?: string | null) => !!id && THEMES.some(t => t.id === id)

function LinkCard({ l, i, n, color, featured, isNew, onGo, onCopy }: {
  l: LinkItem; i: number; n: number; color: string; featured?: boolean; isNew: boolean; onGo: () => void; onCopy: (l: LinkItem) => void
}) {
  const badge = l.badge || (isNew ? 'New' : '')
  return (
    <div className="rise relative" data-feat={featured ? '' : undefined} style={vars({ '--i': Math.min(i, 14), '--c': color })}>
      <a href={safeUrl(l.url)} target="_blank" rel="noopener noreferrer" onClick={onGo}
        className={featured ? 'feature flex items-center gap-3.5 p-3.5 pr-[3.4rem]' : 'item flex items-center gap-3 p-2.5 pr-[3.2rem]'}>
        {!featured && <span className="num mono">{String(n).padStart(2, '0')}</span>}
        <Logo url={l.url} custom={l.icon_url} size={featured ? '3.3rem' : '2.7rem'} />
        <span className="min-w-0 flex-1 text-left">
          <span className="flex items-center gap-2">
            <span className={`truncate ${featured ? 'display text-[1.2rem] font-semibold leading-tight' : 'text-[1rem] font-semibold'}`}>{l.title}</span>
            {badge && <span className="badge shrink-0">{badge}</span>}
          </span>
          <span className="sub mt-0.5 block truncate text-[0.8rem]">{l.description || hostOf(l.url)}</span>
        </span>
        <FaArrowUpRightFromSquare className="go" aria-hidden />
      </a>
      <button type="button" aria-label={`Salin link ${l.title}`} title="Salin link" onClick={() => onCopy(l)} className="copybtn">
        <FaRegCopy className="text-[0.85rem]" />
      </button>
    </div>
  )
}

type Props = { profile: Profile; categories: Category[]; links: LinkItem[]; socials: Social[] }
type Group = { key: string; name: string; emoji: string; color: string; items: LinkItem[] }

export default function LinkTree({ profile, categories, links, socials }: Props) {
  const [cat, setCat] = useState('all')
  const [query, setQuery] = useState('')
  const [showQr, setShowQr] = useState(false)
  const [showTheme, setShowTheme] = useState(false)
  const [theme, setTheme] = useState(THEMES[0].id)
  const [origin, setOrigin] = useState('')
  const [toast, setToast] = useState('')
  const [mounted, setMounted] = useState(false)
  const [clock, setClock] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const bioParts = (profile.bio ?? '').split('|').map(s => s.trim()).filter(Boolean)
  const tagline = bioParts.join('  ·  ')

  const say = useCallback((m: string) => { setToast(m); setTimeout(() => setToast(''), 1800) }, [])

  useEffect(() => {
    setMounted(true); setOrigin(window.location.origin)
    let saved: string = validTheme(profile.theme) ? (profile.theme as string) : THEMES[0].id
    try { const s = localStorage.getItem('theme'); if (validTheme(s)) saved = s as string } catch {}
    document.documentElement.dataset.theme = saved
    setTheme(saved)
    const upd = () => setClock(new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TZ, hour12: false }).format(new Date()).replace(':', '.'))
    upd(); const c = setInterval(upd, 20000)
    return () => clearInterval(c)
  }, [profile.theme])

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
  const go = () => { try { navigator.vibrate?.(8) } catch {} }
  const share = async () => {
    const data = { title: `@${profile.username}`, text: profile.name, url: origin }
    if (navigator.share) { try { await navigator.share(data) } catch {} } else copy(origin)
  }

  const saveContact = () => {
    const v = [
      'BEGIN:VCARD', 'VERSION:3.0', `FN:${profile.name}`, `N:;${profile.name};;;`, `TITLE:${bioParts[0] ?? ''}`,
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

  const firstName = profile.name.split(' ')[0]
  const waDigits = profile.phone ? profile.phone.replace(/\D/g, '') : ''
  const wa = waDigits ? `https://wa.me/${waDigits}?text=${encodeURIComponent(`Halo ${firstName}, saya lihat linktree kamu dan ingin ngobrol.`)}` : ''
  const mail = profile.email ? `mailto:${profile.email}` : ''
  const meta = useMemo(() => [profile.location, clock && `${clock} WIB`].filter(Boolean).join(' · '), [profile.location, clock])

  // Pita berjalan: bio + status + lokasi
  const ticker = [...bioParts, profile.status, profile.location].filter(Boolean) as string[]
  const base = ticker.length ? ticker : [profile.name]
  const loop = Array.from({ length: Math.max(1, Math.ceil(8 / base.length)) }, () => base).flat()

  // Kelompok link
  const groups: Group[] = (() => {
    if (cat === 'all' && !q && categories.length) {
      const g: Group[] = categories.map((c, k) => ({
        key: c.id, name: c.name, emoji: c.emoji || '•', color: col(k + 1),
        items: regular.filter(l => l.category_id === c.id),
      }))
      const rest = regular.filter(l => !l.category_id || !categories.some(c => c.id === l.category_id))
      if (rest.length) g.push({ key: 'rest', name: 'Lainnya', emoji: '✦', color: col(categories.length + 1), items: rest })
      return g.filter(x => x.items.length)
    }
    const k = categories.findIndex(c => c.id === cat)
    const c = k >= 0 ? categories[k] : null
    return regular.length
      ? [{ key: cat + q, name: q ? 'Hasil pencarian' : c ? c.name : 'Link', emoji: q ? '⌕' : c?.emoji || '✦', color: col(Math.max(k, 0) + 1), items: regular }]
      : []
  })()

  return (
    <>
      <div className="stripe" aria-hidden />
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[30rem] flex-col px-5 pb-12 pt-6">
        {/* Bilah atas */}
        <div className="flex w-full items-center justify-between gap-3">
          <span className="mono muted text-[0.68rem] uppercase tracking-[0.18em]">✦ link in bio</span>
          <div className="flex gap-2">
            <button className="iconbtn" onClick={share} aria-label="Bagikan" title="Bagikan"><FaShareNodes /></button>
            <button className="iconbtn" onClick={() => setShowQr(true)} aria-label="Kode QR" title="Kode QR"><FaQrcode /></button>
            <button className="iconbtn" onClick={() => setShowTheme(v => !v)} aria-expanded={showTheme} aria-label="Tema" title="Tema"><FaPalette /></button>
          </div>
        </div>

        {showTheme && (
          <div className="card pop mt-3 grid w-full grid-cols-3 gap-1 p-2">
            {THEMES.map(t => (
              <button key={t.id} onClick={() => pickTheme(t.id)} data-active={theme === t.id} className="themebtn mono">
                <span className="swatch" style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.ac} 50%)` }} />
                {t.name}
              </button>
            ))}
          </div>
        )}

        {/* Kartu profil */}
        <header className="hero rise mt-6">
          <div className="flex items-start justify-between gap-3">
            <img src={profile.avatar_url || '/avatar.svg'} alt={profile.name} className="avatar" />
            {profile.status && (
              <span className="sticker mono">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                {profile.status}
              </span>
            )}
          </div>
          <h1 className="display name mt-6">{profile.name}</h1>
          <p className="mono handle mt-2.5">@{profile.username}{meta ? ` · ${meta}` : ''}</p>
          {tagline && <p className="bio balance mt-3">{tagline}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button className="btn" onClick={saveContact}><FaRegAddressCard />Simpan Kontak</button>
            {wa && <a className="btn-ghost" href={wa} target="_blank" rel="noopener noreferrer"><FaWhatsapp />WhatsApp</a>}
            {mail && <a className="iconbtn !h-[2.7rem] !w-[2.7rem]" href={mail} aria-label="Email" title="Email"><FaEnvelope /></a>}
          </div>
        </header>

        {/* Pita berjalan */}
        <div className="bandwrap" aria-hidden>
          <div className="band">
            <div className="track">
              {[0, 1].map(copyIdx => loop.map((t, k) => (
                <span key={`${copyIdx}-${k}`}>{t}<i style={{ color: col(k) }}>✦</i></span>
              )))}
            </div>
          </div>
        </div>

        {/* Pencarian */}
        {links.length > 5 && (
          <div className="rise relative mt-2 w-full" style={vars({ '--i': 2 })}>
            <FaMagnifyingGlass className="muted pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[0.8rem]" />
            <input ref={searchRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Cari link…  ( tekan / )" aria-label="Cari link"
              className="field !pl-10 !pr-10" />
            {query && <button aria-label="Hapus pencarian" onClick={() => setQuery('')} className="muted absolute right-3 top-1/2 -translate-y-1/2 p-1"><FaXmark /></button>}
          </div>
        )}

        {/* Sorotan */}
        {featured.length > 0 && (
          <section className="mt-9 w-full">
            <div className="sechead" style={vars({ '--c': 'var(--p2)' })}>
              <span className="secico">★</span><h2 className="display">Sorotan</h2>
              <span className="count mono">{featured.length}</span>
            </div>
            <div className="space-y-4">
              {featured.map((l, i) => (
                <LinkCard key={l.id} l={l} i={i + 3} n={i + 1} color={col(i)} featured isNew={isNew(l)} onGo={go} onCopy={x => copy(x.url)} />
              ))}
            </div>
          </section>
        )}

        {/* Tab kategori */}
        {categories.length > 0 && !q && (
          <nav className="no-scrollbar mt-9 flex w-full gap-2.5 overflow-x-auto px-1 pb-2 pt-1" aria-label="Kategori">
            <button className="ctab all mono" style={vars({ '--c': 'var(--fg)' })} data-active={cat === 'all'} onClick={() => setCat('all')}>Semua<sup>{regularAll.length}</sup></button>
            {categories.map((c, k) => (
              <button key={c.id} className="ctab mono" style={vars({ '--c': col(k + 1) })} data-active={cat === c.id} onClick={() => setCat(c.id)}>
                {c.emoji} {c.name}<sup>{countOf(c.id)}</sup>
              </button>
            ))}
          </nav>
        )}

        {/* Daftar link per kelompok */}
        {groups.map((g, gi) => (
          <section key={g.key} className="mt-7 w-full">
            <div className="sechead" style={vars({ '--c': g.color })}>
              <span className="secico">{g.emoji}</span><h2 className="display">{g.name}</h2>
              <span className="count mono">{g.items.length}</span>
            </div>
            <div className="space-y-2.5">
              {g.items.map((l, i) => (
                <LinkCard key={l.id} l={l} i={gi * 3 + i + 4} n={i + 1} color={g.color} isNew={isNew(l)} onGo={go} onCopy={x => copy(x.url)} />
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && featured.length === 0 && (
          <p className="muted py-10 text-center text-[0.9rem]">{q ? `Tidak ada hasil untuk “${query}”` : 'Belum ada link di kategori ini.'}</p>
        )}

        {/* Ajakan kolaborasi */}
        {(wa || mail) && (
          <section className="cta mt-12 w-full">
            <p className="mono text-[0.68rem] uppercase tracking-[0.18em] opacity-70">✦ Ayo terhubung</p>
            <h2 className="display mt-2 text-[1.6rem] font-semibold leading-tight">Punya ide atau peluang kolaborasi?</h2>
            <p className="mt-2 text-[0.92rem] opacity-80">Kirim pesan saja, aku senang ngobrol.</p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              {wa && <a className="btn" href={wa} target="_blank" rel="noopener noreferrer"><FaWhatsapp />Chat WhatsApp</a>}
              {mail && <a className="btn-ghost" href={mail}><FaEnvelope />Email</a>}
            </div>
          </section>
        )}

        {/* Sosial */}
        {socials.length > 0 && (
          <section className="mt-10 w-full">
            <p className="mono muted mb-3 text-[0.68rem] uppercase tracking-[0.18em]">Temukan aku di</p>
            <div className="flex flex-wrap gap-3">
              {socials.map((s, k) => {
                const Icon = ICONS[s.platform.toLowerCase()] ?? FaLink
                return (
                  <a key={s.id} aria-label={s.platform} title={s.platform} href={safeUrl(s.url)} target="_blank" rel="noopener noreferrer"
                    className="social" style={vars({ '--c': col(k) })}>
                    <Icon />
                  </a>
                )
              })}
            </div>
          </section>
        )}

        <footer className="mono muted mt-12 flex items-center justify-between text-[0.68rem] tracking-wide">
          <span>© {mounted ? new Date().getFullYear() : ''} {profile.name}</span>
          <a href="/admin" className="opacity-50 hover:opacity-100">admin</a>
        </footer>
      </main>

      {/* QR */}
      {showQr && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowQr(false)} role="dialog" aria-modal="true">
          <div className="card pop w-full max-w-[20rem] p-5 text-center" onClick={e => e.stopPropagation()}>
            <h2 className="display text-[1.2rem] font-semibold">Scan untuk membuka</h2>
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
        <div className="mono rounded-full bg-[var(--fg)] px-4 py-2 text-[0.8rem] font-medium text-[color:var(--bg)]">{toast}</div>
      </div>
    </>
  )
}

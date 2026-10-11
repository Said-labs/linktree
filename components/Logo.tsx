'use client'
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react'
import { faviconSources, hostOf } from '@/lib/url'

/** Logo otomatis dari domain link. Kalau ada icon_url dipakai itu; kalau gagal → inisial domain. */
export default function Logo({ url, custom, size = '3.2rem' }: { url: string; custom?: string | null; size?: string }) {
  const sources = custom ? [custom, ...faviconSources(url)] : faviconSources(url)
  const [i, setI] = useState(0)
  const [ok, setOk] = useState(false)
  const letter = (hostOf(url)[0] || '🔗').toUpperCase()
  return (
    <span className="logo relative shrink-0" style={{ width: size, height: size }}>
      {/* inisial tampil dulu; logo muncul halus setelah berhasil dimuat */}
      <span className="text-[1.3rem] font-extrabold text-slate-700">{letter}</span>
      {i < sources.length && (
        <img key={i} src={sources[i]} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer"
          onLoad={() => setOk(true)} onError={() => { setOk(false); setI(i + 1) }}
          className={`absolute inset-0 m-auto bg-white transition-opacity duration-300 ${ok ? 'opacity-100' : 'opacity-0'} ${custom && i === 0 ? 'h-full w-full object-cover' : 'h-[62%] w-[62%] object-contain'}`} />
      )}
    </span>
  )
}
/** Hanya izinkan skema aman (cegah javascript: dsb). */
export const isSafeUrl = (u: string) => /^(https?:\/\/|mailto:|tel:)/i.test(u.trim())
export const safeUrl = (u: string) => (isSafeUrl(u) ? u.trim() : '#')

export const hostOf = (u: string) => {
  try { return new URL(u).hostname.replace(/^www\./, '') } catch { return '' }
}

/** Urutan sumber logo domain: Google → DuckDuckGo → (gagal = tampil inisial) */
export const faviconSources = (u: string, size = 128) => {
  const h = hostOf(u)
  if (!h) return []
  return [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&sz=${size}`,
    `https://icons.duckduckgo.com/ip3/${h}.ico`,
  ]
}
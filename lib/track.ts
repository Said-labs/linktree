export function track(type: 'view' | 'click' | 'ping', linkId?: string) {
  try {
    let vid = localStorage.getItem('vid')
    if (!vid) { vid = crypto.randomUUID(); localStorage.setItem('vid', vid) }
    const body = JSON.stringify({ type, linkId, vid, ref: document.referrer })
    const ok = navigator.sendBeacon?.('/api/track', new Blob([body], { type: 'application/json' }))
    if (!ok) fetch('/api/track', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true })
  } catch {}
}

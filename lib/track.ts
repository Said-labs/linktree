const uid = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36)

function visitorId() {
  try {
    let v = localStorage.getItem('vid')
    if (!v) { v = uid(); localStorage.setItem('vid', v) }
    return v
  } catch {
    return uid() // mode privat: tetap terkirim
  }
}

export function track(type: 'view' | 'click' | 'ping', linkId?: string) {
  try {
    fetch('/api/hit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, linkId, vid: visitorId(), ref: document.referrer }),
      keepalive: true,
    }).catch(() => {})
  } catch {}
}

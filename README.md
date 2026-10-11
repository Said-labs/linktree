# @saidazizz — Link in Bio (Next.js + Tailwind + Supabase + Vercel)

## Cara pakai
1. `npm install`
2. Buat project di supabase.com → SQL Editor → jalankan isi `supabase/schema.sql`
3. Salin `.env.example` jadi `.env.local`, isi semua nilainya
   (URL & anon key: Project Settings → API; `ADMIN_SESSION_SECRET`: `openssl rand -hex 32`)
4. Ganti `public/avatar.svg` dengan fotomu (mis. `public/avatar.jpg`), lalu ubah `avatar_url` di tabel `profile`
5. `npm run dev` → buka http://localhost:3000  (admin: /admin)

## Deploy ke Vercel
Push ke GitHub → vercel.com → Add New Project → import repo → isi 5 Environment Variables yang sama → Deploy.

## Catatan
- Negara pengunjung hanya terdeteksi saat sudah di Vercel (header `x-vercel-ip-country`).
- Profil & ikon sosial diubah lewat Table Editor Supabase (tabel `profile`, `socials`); link & kategori lewat dashboard /admin.
- Perubahan link tampil di halaman publik maks. ±30 detik (cache).

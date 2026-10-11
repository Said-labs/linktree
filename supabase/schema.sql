create extension if not exists pgcrypto;

create table profile (
  id int primary key default 1 check (id = 1),
  username text not null, name text not null, bio text,
  avatar_url text, phone text, email text, theme text default 'ocean'
);
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, emoji text, sort int default 0
);
create table links (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  title text not null, description text, url text not null, icon_url text,
  featured boolean default false, active boolean default true,
  sort int default 0, created_at timestamptz default now()
);
create table socials (
  id uuid primary key default gen_random_uuid(),
  platform text not null, url text not null, sort int default 0
);
create table events (
  id bigint generated always as identity primary key,
  type text not null,
  link_id uuid references links(id) on delete set null,
  country text, device text, referrer text, visitor_id text,
  created_at timestamptz default now()
);
create index on events (created_at);
create table live_visitors (
  visitor_id text primary key, last_seen timestamptz default now()
);

-- RLS: publik hanya boleh BACA data tampilan
alter table profile enable row level security;
alter table categories enable row level security;
alter table links enable row level security;
alter table socials enable row level security;
alter table events enable row level security;          -- tanpa policy = hanya service role
alter table live_visitors enable row level security;   -- tanpa policy = hanya service role

create policy "public read" on profile for select using (true);
create policy "public read" on categories for select using (true);
create policy "public read" on links for select using (true);
create policy "public read" on socials for select using (true);

-- Data awal (ganti sesuai punyamu)
insert into profile (username, name, bio, avatar_url, phone, email)
values ('saidazizz', 'Sa''id Abdul Aziz', 'Informatics Student 💻🚀', '/avatar.svg', '+62xxxxxxxxxx', 'emailkamu@gmail.com');

insert into links (title, description, url, icon_url, sort) values
 ('💗 Kirim Pesan rahasia ke SA''ID', 'Kirim pesan anonim ke aku, nggak bakal ketahuan siapa pengirimnya 🤫', 'https://example.com/pesan', '/avatar.svg', 1),
 ('MY Sertifikat', 'Kumpulan sertifikat lomba, pelatihan, dan kepanitiaan yang pernah aku ikuti.', 'https://example.com/sertifikat', null, 2);

insert into links (title, description, url, featured, sort) values
 ('Portofolio Saya', 'Proyek-proyek web dan pemrograman yang sudah aku buat.', 'https://example.com', true, 0);

insert into socials (platform, url, sort) values
 ('linkedin', 'https://linkedin.com/in/username', 1),
 ('whatsapp', 'https://wa.me/62xxxxxxxxxx', 2),
 ('github',   'https://github.com/username', 3),
 ('tiktok',   'https://tiktok.com/@username', 4);

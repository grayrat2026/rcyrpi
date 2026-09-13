-- Youth Red Crescent Team RPI — Supabase schema (public tables)
-- All access goes through the Next.js server (service_role key).
-- RLS is enabled with NO policies => anon/authenticated cannot touch data directly.

create extension if not exists pgcrypto;

-- ============ members ============
create table if not exists public.members (
  id            text primary key,
  username      text not null unique,
  full_name     text not null,
  email         text not null unique,
  phone         text not null,
  alt_phone     text,
  password_hash text not null,
  role          text not null default 'member' check (role in ('member','admin')),
  avatar_url    text,
  blood_group   text,
  address       jsonb not null default '{}'::jsonb,
  status        text not null default 'active' check (status in ('active','suspended')),
  team          text,
  sub_team      text,
  member_no     text,
  upazila_unit  text,
  created_at    timestamptz not null default now()
);

-- ============ notices ============
create table if not exists public.notices (
  id         text primary key,
  title      jsonb not null,
  body       jsonb not null,
  category   text not null default 'general' check (category in ('general','emergency','blood','event')),
  severity   text not null default 'low' check (severity in ('low','medium','high','critical')),
  is_pinned  boolean not null default false,
  show_popup boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- ============ items (events / donations / gifts) ============
create table if not exists public.items (
  id              text primary key,
  kind            text not null check (kind in ('event','donation','gift')),
  title           jsonb not null,
  description     jsonb not null,
  icon            text not null default 'Sparkles',
  amount          numeric not null default 0,
  payment_required boolean not null default false,
  deadline        date,
  event_date      date,
  location        text,
  map_link        text,
  status          text not null default 'active' check (status in ('active','cancelled','postponed','completed')),
  postpone_note   jsonb,
  created_by      text,
  created_at      timestamptz not null default now()
);

-- ============ emergency_requests ============
create table if not exists public.emergency_requests (
  id             text primary key,
  kind           text not null,
  urgency        text not null default 'immediate',
  patient_name   text,
  phone          text not null,
  alt_phone      text,
  hospital       text,
  blood_group    text,
  patient_type   text,
  location       text,
  detail_location text,
  needed_at      timestamptz,
  note           text,
  status         text not null default 'open' check (status in ('open','fulfilled','cancelled')),
  created_by     text,
  created_at     timestamptz not null default now()
);

-- ============ payments ============
create table if not exists public.payments (
  id            text primary key,
  tran_id       text not null unique,
  member_id     text not null,
  member_name   text not null,
  item_id       text,
  item_title    jsonb,
  amount        numeric not null default 0,
  method        text not null default 'gateway',
  status        text not null default 'pending' check (status in ('pending','submitted','success','failed','refunded')),
  gateway_ref   text,
  sender_number text,
  note          text,
  created_at    timestamptz not null default now(),
  verified_at   timestamptz,
  verified_by   text
);

-- ============ broadcasts ============
create table if not exists public.broadcasts (
  id         text primary key,
  title      jsonb not null,
  body       jsonb not null,
  severity   text not null default 'high' check (severity in ('high','critical')),
  source     text not null default 'admin',
  active     boolean not null default true,
  link       text,
  created_at timestamptz not null default now()
);

-- ============ home_sections (page builder config) ============
create table if not exists public.home_sections (
  key      text primary key,
  visible  boolean not null default true,
  title    jsonb,
  subtitle jsonb,
  sort     int not null default 0
);

-- ============ contacts (admin-manageable emails & phones) ============
create table if not exists public.contacts (
  id         text primary key,
  kind       text not null check (kind in ('phone','email')),
  label      jsonb not null,
  value      text not null,
  icon       text not null default 'Phone',
  active     boolean not null default true,
  sort       int not null default 0,
  created_at timestamptz not null default now()
);

-- ============ RLS: lock everything to service_role ============
alter table public.members            enable row level security;
alter table public.notices            enable row level security;
alter table public.items              enable row level security;
alter table public.emergency_requests enable row level security;
alter table public.payments           enable row level security;
alter table public.broadcasts         enable row level security;
alter table public.home_sections      enable row level security;
alter table public.contacts           enable row level security;

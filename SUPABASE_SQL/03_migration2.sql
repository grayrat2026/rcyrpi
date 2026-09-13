-- Youth Red Crescent Team RPI — migration 2 (schedule, resets, payments attribution, stats sources, broadcasts RLS)

-- ============ schedule (admin-controlled weekly schedule) ============
create table if not exists public.schedule (
  id         text primary key,
  day        text not null check (day in ('sat','sun','mon','tue','wed','thu')),
  time_text  text not null default '',
  activity   jsonb not null,
  place      jsonb not null,
  icon       text not null default 'Sparkles',
  sort       int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.schedule enable row level security;

-- ============ password_resets (forgot password flow) ============
create table if not exists public.password_resets (
  id         text primary key,
  member_id  text not null,
  token_hash text not null unique,
  expires_at timestamptz not null,
  used       boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.password_resets enable row level security;

-- ============ payments: admin attribution + due/cancelled ============
alter table public.payments add column if not exists source text not null default 'gateway';
alter table public.payments add column if not exists admin_username text;
alter table public.payments add column if not exists admin_name text;

do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'payments_status_check'
  ) then
    alter table public.payments drop constraint payments_status_check;
  end if;
end $$;
alter table public.payments
  add constraint payments_status_check
  check (status in ('pending','submitted','success','failed','refunded','due','cancelled'));

-- ============ items: volunteer hours (real volunteer-hours stat) ============
alter table public.items add column if not exists volunteer_hours int not null default 0;

-- ============ emergency_requests: blood units (real blood-bags stat) ============
alter table public.emergency_requests add column if not exists units int not null default 1;

-- ============ broadcasts: Supabase RLS public read + realtime ============
drop policy if exists "broadcasts_public_read" on public.broadcasts;
create policy "broadcasts_public_read"
  on public.broadcasts for select
  to anon
  using (true);

insert into pg_publication_tables (pubname, schemaname, tablename)
select 'supabase_realtime', 'public', 'broadcasts'
where not exists (
  select 1 from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'broadcasts'
);
alter table public.broadcasts replica identity full;

-- ============ seed schedule (current hardcoded rows) ============
insert into public.schedule (id, day, time_text, activity, place, icon, sort, active) values
  ('sch_sat', 'sat', '4:00 PM', '{"en":"Unit General Meeting","bn":"ইউনিট সাধারণ সভা"}', '{"en":"Unit Room","bn":"ইউনিট রুম"}', 'Users', 0, true),
  ('sch_sun', 'sun', '4:30 PM', '{"en":"First Aid Practice","bn":"প্রাথমিক চিকিৎসা অনুশীলন"}', '{"en":"Auditorium","bn":"অডিটোরিয়াম"}', 'BriefcaseMedical', 1, true),
  ('sch_mon', 'mon', '5:00 PM', '{"en":"Blood Grouping Desk","bn":"ব্লাড গ্রুপিং ডেস্ক"}', '{"en":"Campus Gate","bn":"ক্যাম্পাস গেট"}', 'Droplets', 2, true),
  ('sch_tue', 'tue', '4:00 PM', '{"en":"Disaster Drill","bn":"দুর্যোগ মহড়া"}', '{"en":"Open Field","bn":"খোলা মাঠ"}', 'TentTree', 3, true),
  ('sch_wed', 'wed', '4:30 PM', '{"en":"Community Visit","bn":"কমিউনিটি ভিজিট"}', '{"en":"Nearby Area","bn":"আশপাশের এলাকা"}', 'HeartHandshake', 4, true),
  ('sch_thu', 'thu', '10:00 AM', '{"en":"Training & Workshop","bn":"প্রশিক্ষণ ও কর্মশালা"}', '{"en":"Seminar Hall","bn":"সেমিনার হল"}', 'GraduationCap', 5, true)
on conflict (id) do nothing;

-- ============ DEMO credentials (CHANGE immediately after first login) ============
update public.members
set password_hash = 'eccecf2a6d1399b429cd52d8dc22f12703916aa910189b5d9391c483d955e5e3'   -- sha256("rcy-rpi-v1" + "ChangeMe@123")
where username = 'admin';

insert into public.members (id, username, full_name, email, phone, password_hash, role, address, status)
values (
  'm_demo_member', 'member', 'Demo Member', 'member@example.org', '+8801700000000',
  'eccecf2a6d1399b429cd52d8dc22f12703916aa910189b5d9391c483d955e5e3',
  'member', '{"district":"Rangpur","upazila":"Rangpur Sadar","thana":"Rangpur Sadar","ward":"","para":""}'::jsonb, 'active'
)
on conflict (id) do update set password_hash = excluded.password_hash, status = 'active';

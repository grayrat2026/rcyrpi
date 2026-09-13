-- app_config: live-updatable site configuration (payment gateway keys etc.)
-- Server-only: RLS enabled, NO policies => anon/authenticated blocked,
-- service_role (server) bypasses RLS.
create table if not exists app_config (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
alter table app_config enable row level security;

-- YOUR PipraPay keys (fill with your own — env vars override these):
insert into app_config (key, value) values
  ('payment_base_url',  'PASTE_PIPRAPAY_BASE_URL'),
  ('payment_ruser_api', 'PASTE_PIPRAPAY_RUSER_KEY'),
  ('payment_admin_api', 'PASTE_PIPRAPAY_ADMIN_KEY')
on conflict (key) do update set value = excluded.value, updated_at = now();

select key, value from app_config order by key;

-- Reference: Cloudflare / R2 credentials (account id, API token, R2 keys,
-- endpoint, bucket name) are stored in the SUPABASE SECRETS MANAGER —
-- never in this table, never in any build. Set them from the Supabase
-- dashboard (Edge Functions -> Secrets) or the Management API.
-- ===========================================================

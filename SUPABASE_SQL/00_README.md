# Supabase SQL setup — RCY-RPI

Run these scripts **in numbered order** in the Supabase SQL Editor
(Dashboard → SQL Editor → New query → paste → Run):

| Order | Script | What it does |
|---|---|---|
| 1 | `01_schema.sql` | All tables, columns, RLS enabled |
| 2 | `02_seed.sql` | Default admin + home sections + contacts |
| 3 | `03_migration2.sql` | Extra columns, schedule seed, demo member |
| 4 | `04_grants.sql` | Role grants for anon/authenticated |
| 5 | `05_fixup1.sql` | Small fixes (safe to re-run) |
| 6 | `06_app_config.sql` | `app_config` table + payment gateway keys |

## Default credentials (seeded)

| Role | Username | Password |
|---|---|---|
| Admin | `admin` | `ChangeMe@123` |
| Demo member | `member` | `ChangeMe@123` |

> **Change both passwords immediately** after the first login
> (Profile → Change password). Passwords are stored as
> `sha256("rcy-rpi-v1" + password)` — compute your own hash with:
> `echo -n "rcy-rpi-v1YOUR_NEW_PASSWORD" | sha256sum`

## Payment keys (`06_app_config.sql`)

The script inserts placeholder keys. Replace them with your own PipraPay
keys via SQL, or manage them live without redeploying:

```sql
update app_config set value = 'YOUR_BASE_URL',  updated_at = now() where key = 'payment_base_url';
update app_config set value = 'YOUR_RUSER_KEY', updated_at = now() where key = 'payment_ruser_api';
update app_config set value = 'YOUR_ADMIN_KEY', updated_at = now() where key = 'payment_admin_api';
```

Precedence: environment variables → `app_config` table → Supabase Secrets
Manager. The server resolves them at runtime with a 60-second cache.

## Security model

- **RLS is enabled on every table.** `app_config` has RLS with **no
  policies** — anon/authenticated clients are fully blocked; only the
  server (service_role) can read it.
- The service-role key lives **server-side only** (env var on the server /
  Cloudflare Pages). Never expose it to the browser.
- Real credentials (API keys, tokens, R2 secrets) belong in **Supabase
  Secrets Manager** or environment variables — never in the repository.

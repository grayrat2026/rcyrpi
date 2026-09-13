<div align="center">

# RCY-RPI — Youth Red Crescent Team, Rangpur Govt. Polytechnic Institute

**বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি — যুব উইং**

Bilingual (Bangla / English) community-service platform for a Red Crescent
youth unit: blood donation, disaster response, live emergency alerts,
events, funds & payments — production-grade, fully open source.

![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E)
![Cloudflare](https://img.shields.io/badge/Cloudflare%20Pages-edge-F38020)

</div>

## Features

- **Bilingual UI (BN/EN)** — single-dictionary i18n, instant toggle
- **Custom auth** — username/email login, HMAC-signed httpOnly session
  cookie, Web Crypto (runs on Node.js **and** Cloudflare edge), roles:
  member / admin
- **Live Emergency Notice Board** — broadcasts, urgent blood requests and
  auto-detected disasters (earthquake / flood feeds) merged into one board,
  with a global 3-second-protected emergency popup
- **Admin panel** — members (suspend/activate with instant content
  auto-hide), notices, events & funds, payments (manual cash records with
  admin attribution, due → settle/cancel), broadcasts, weekly schedule,
  contacts, home-page section builder
- **Payments** — PipraPay gateway adapter (runtime config, 60s cache) with
  automatic themed fallback checkout; funds with amount > 0 get a public
  product page `/pay/[id]`
- **Forgot password** — one-time hashed token (30 min, burn-on-use),
  branded bilingual reset email (SMTP optional)
- **Mobile-perfect responsive UI** — zero horizontal overflow verified at
  320 / 390 / 414 px on every route (including admin); desktop and tablet
  layouts unaffected
- **Realtime** — Supabase Realtime pushes broadcast changes to every open
  tab instantly

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 ·
shadcn/ui · framer-motion · lucide icons · Supabase (Postgres + RLS +
Realtime) · zod · zustand · Cloudflare Pages (`@cloudflare/next-on-pages`)

## Quickstart (local)

```bash
git clone https://github.com/grayrat2026/rcyrpi.git
cd rcyrpi
npm install                       # or: bun install
cp .env.example .env              # fill in your own values
npm run dev                       # http://localhost:3000
```

### Environment variables

Copy `.env.example` → `.env` and fill it in:

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **server-only** — all DB access |
| `SESSION_SECRET` | yes | random 32-byte hex, signs cookies |
| `SUPABASE_PROJECT_REF` / `SUPABASE_ACCESS_TOKEN` | optional | live secret reads |
| `PAYMENT_BASE_URL` / `PAYMENT_RUSER_API` / `PAYMENT_ADMIN_API` | optional | PipraPay gateway (falls back to `app_config` table) |
| `SMTP_*` | optional | branded reset emails (edge shows on-screen link without) |

**Never commit your real `.env`.** On GitHub, use **encrypted repo
secrets**; on Cloudflare Pages, use runtime environment variables.

## Database setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the scripts from
   [`SUPABASE_SQL/`](./SUPABASE_SQL) **in numbered order** (1 → 6) — see
   [`SUPABASE_SQL/00_README.md`](./SUPABASE_SQL/00_README.md)
3. You get the full schema with RLS enabled on every table, plus a default
   admin (`admin / ChangeMe@123` — **change it immediately**) and demo
   member (`member / ChangeMe@123`)
4. Put your payment keys into the `app_config` table (SQL included) — they
   resolve at runtime, no redeploy needed

## Deploy to Cloudflare Pages

Full guide: **[DEPLOY_CLOUDFLARE.md](./DEPLOY_CLOUDFLARE.md)** — drag &
drop or Wrangler CLI.

```bash
npm install -g wrangler
NEXT_PUBLIC_SUPABASE_URL="https://YOUR-REF.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key" \
npx @cloudflare/next-on-pages
wrangler pages deploy .vercel/output/static --project-name=rcy-rpi
```

Required runtime env vars on Pages: `SUPABASE_SERVICE_ROLE_KEY`,
`SESSION_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
— plus the `nodejs_compat` compatibility flag. Every dynamic route already
exports `runtime = "edge"`.

## Project structure

```
src/
  app/                 # App Router: pages + ~21 API routes (edge runtime)
  components/
    pages/             # page-level components (+ sections/, admin/)
    providers/         # session, emergency popup (3s protected cancel)
    shared/            # design-system primitives, AppIcon registry
  data/geo/            # Bangladesh districts + upazilas + thanas dataset
  i18n/                # single BN/EN dictionary
  lib/                 # services (payments, emergency, mailer), stores
  store/               # zustand stores (auth, language)
SUPABASE_SQL/          # numbered, re-runnable DB scripts
scripts/               # verification tooling (auth suite, e2e sweep)
```

## Testing

```bash
npm run build                          # production build
npx tsc --noEmit && npx eslint src     # types + lint (both clean)
python3 scripts/test_auth.py           # 11-check auth suite (env-driven creds)
bash scripts/e2e.sh                    # 60-check end-to-end suite
bash scripts/mobile_sweep.sh http://localhost:3000 3   # mobile overflow sweep
```

## Security notes

- Passwords: salted-namespace `sha256("rcy-rpi-v1" + password)` — server-side
  only, verified with Web Crypto (edge-compatible)
- Sessions: HMAC-signed httpOnly cookie; reset tokens: hashed, 30-min,
  burn-on-use
- **RLS on every table**; `app_config` is server-only (no policies)
- No secrets in the client bundle — service-role key and payment keys are
  server-only; build output is secret-free by design

## Contributing

PRs are welcome! Please keep the existing conventions: bilingual strings in
the i18n dictionary, lucide icons via the `AppIcon` registry (no emoji),
mobile-first responsive checks with `scripts/mobile_sweep.sh`.

## License

[MIT](./LICENSE) © 2026 Youth Red Crescent Team, Rangpur Govt. Polytechnic
Institute

> This is a community project. "Red Crescent" emblems and names are used to
> identify the unit; follow your national society's brand guidelines when
> reusing them.

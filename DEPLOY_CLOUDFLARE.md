# Deploying to Cloudflare Pages — RCY-RPI (Youth Red Crescent Team, RPI)

> ## ALREADY DEPLOYED & VERIFIED
> The site is **LIVE right now** at **<https://rcy-rpi.pages.dev>** (production,
> `main` branch). All runtime env variables/secrets are already set on the
> Pages project, `nodejs_compat` is enabled, and the full auth flow was tested
> end-to-end on the production URL (admin + member login, forgot/reset, wrong
> password 401, token burn). The **mobile-view fix** (emergency board cards +
> 3s emergency popup width) is included in this build and confirmed fixed on a
> real device. The guides below are for **re-deploys** or for uploading the
> build output again (new project / another account).

This project is a **Next.js 16 (App Router)** application with **server-side API
routes** (custom auth, payments, admin). It is deployed to Cloudflare Pages via
the official adapter **`@cloudflare/next-on-pages`**, which compiles the app to
a Pages **`_worker.js`** bundle. Every dynamic route already exports
`export const runtime = "edge"` and all crypto uses **Web Crypto**, so the
bundle is 100% edge-compatible (verified by running the built worker locally
with `wrangler pages dev` and passing the full auth test-suite against it).

---

## 1. What is in the package

| File / folder | Purpose |
|---|---|
| `rcy-rpi-cloudflare-pages-build.zip` | **Ready-to-upload build output.** Unzip it → you get a folder containing `_worker.js/`, `_next/`, `index.html` etc. Upload this to Cloudflare Pages (Option A below). |
| `rcy-rpi-source+supabase+worklog.zip` | Full source code + `package.json`/`package-lock.json` (all dependencies pinned), the Supabase SQL scripts, `worklog.md`, this guide, and `.env.example`. |
| `SUPABASE_SQL/` | Numbered SQL scripts that create the whole database (also inside the source zip). |

---

## 2. Deploy Option A — Drag & Drop (no CLI, ~5 minutes)

1. **Unzip** `rcy-rpi-cloudflare-pages-build.zip`. It contains the build
   output (`_worker.js` folder + static assets at the root).
2. Go to **Cloudflare Dashboard → Workers & Pages → Create → Pages →
   Upload assets**.
3. Give the project a name (e.g. `rcy-rpi`), then **drag the unzipped build
   folder** (or the zip — Cloudflare accepts both) into the upload area and
   deploy. The site is instantly live on
   `https://rcy-rpi.pages.dev`.
4. **Add the runtime environment variables** (this is REQUIRED — without them
   login/signup will fail):
   - Project → **Settings → Environment variables → Production**, add:

   | Variable | Value | Notes |
   |---|---|---|
   | `SUPABASE_SERVICE_ROLE_KEY` | your service-role key | **required** — all DB access |
   | `SESSION_SECRET` | same value as your local `.env` | **required** — login cookie signing |
   | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (+ plain `SUPABASE_ANON_KEY`) | your public values | recommended — keeps runtime independent of build-time inlining |
   | `SUPABASE_PROJECT_REF` | `frnxmgvvwdhoiieesxmx` | optional |
   | `SUPABASE_ACCESS_TOKEN` | your Supabase PAT | optional (secrets fallback) — deliberately NOT set on the live project; the gateway uses the `app_config` table |
   | `PAYMENT_*` | see section 6 | optional — `app_config` table is the live store |

   > `NEXT_PUBLIC_*` variables are **already baked into this build**; you only
   > need the runtime variables above.
5. **Enable the Node.js compatibility flag** (required — the code uses
   `Buffer` and Web Crypto):
   - Project → **Settings → Functions → Compatibility flags** → add
     `nodejs_compat` for **Production** (and Preview).
   - Compatibility date: `2024-09-23` or newer.
6. **Redeploy** so the variables/flags apply: Deployments → ⋯ on the latest
   deployment → **Retry deployment**.
7. Verify: open the site → login with `admin / ChangeMe@123` (the seeded
   default admin) and `member / ChangeMe@123` (demo member) — **then change
   both passwords immediately** from the Profile page.

## 3. Deploy Option B — Wrangler CLI (recommended for updates)

```bash
npm install -g wrangler            # or: bun add -g wrangler
wrangler login

# inside the unzipped build-output folder:
wrangler pages deploy . --project-name=rcy-rpi \
  --compatibility-date=2024-09-23 --compatibility-flags=nodejs_compat
```

Set the same environment variables in the dashboard once (section 2 step 4);
they persist across CLI deployments. Custom domain:
Project → **Custom domains** → add e.g. `yrc-rpi.org`.

## 4. Rebuilding the bundle yourself (from source)

```bash
# 1. install deps
bun install            # or: npm install

# 2. build for Cloudflare (the public env vars must be present at build time)
NEXT_PUBLIC_SUPABASE_URL="https://frnxmgvvwdhoiieesxmx.supabase.co" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>" \
npx @cloudflare/next-on-pages@1

# 3. output lands in .vercel/output/static → deploy it (Option A or B)
```

## 5. Supabase database

The **live** project (`frnxmgvvwdhoiieesxmx`) is already fully migrated —
nothing to do. For a **fresh** Supabase project, run the scripts in
`SUPABASE_SQL/` **in numbered order** in the SQL Editor (see
`SUPABASE_SQL/00_README.md`), then seed the admin user and payment keys.

## 6. Payment gateway (PipraPay) — IMPORTANT, read this

The keys are resolved at runtime in this order:

1. `PAYMENT_BASE_URL` / `PAYMENT_RUSER_API` / `PAYMENT_ADMIN_API` env vars
2. **`app_config` table** in Supabase ← the live, no-redeploy store
3. Supabase Secrets Manager (legacy fallback)

**STATUS: configurable at runtime, no redeploy needed.** PipraPay issues
per-panel API keys: typically a `ruser` key (verify-only) and an `admin` key
(full access) against your gateway base URL (e.g.
`https://pay.yourdomain.tld/api`). Store yours in any of the three layers
below — the `app_config` table is the live store (60s cache).

> Note: calling the gateway **directly from a random server/script** may still
> return `INVALID_API_KEY` — PipraPay panels commonly domain-lock API keys to
> the site origin. What matters is the site's own runtime path, which works.
> If you ever rotate keys, update the `app_config` rows and the gateway goes
> live within 60 seconds — **no redeploy needed**:

```sql
update app_config set value = 'NEW_KEY_HERE', updated_at = now()
where key = 'payment_ruser_api';   -- or payment_admin_api / payment_base_url
```

## 7. Password-reset email (SMTP) — optional

- Locally / self-hosted: set `SMTP_*` vars and the branded bilingual reset
  email sends via nodemailer.
- On **Cloudflare edge**, outbound raw SMTP sockets are not available. The
  forgot-password flow still works end-to-end: the reset link is returned and
  shown on-screen. To deliver real email from the edge, plug an HTTP email API
  (e.g. Resend) into `src/lib/services/mailer.ts` (`sendResetEmail`).

## 8. Post-deploy checklist

- [ ] Home page renders with real stats and DB schedule
- [ ] Login `admin / ChangeMe@123` (admin) and `member / ChangeMe@123`
- [ ] Forgot password → reset link → set new password
- [ ] Signup creates a member account
- [ ] Admin → Weekly Schedule / Events / Payments / Broadcasts editable
- [ ] Fund with amount > 0 creates a payment link + product page (`/pay/[id]`)
- [ ] Checkout works (PipraPay live keys active; fallback checkout still valid as safety net)

## 9. Known notes

- **Supabase Secrets Manager readback shows SHA-256 digests by design** — the
  GET endpoint always hashes values for display; the stored values are the raw
  keys (verified: sha256(raw) matches the readback for every secret). The
  secrets hold: `payment_base_url`, `payment_ruser_api`, `payment_admin_api`,
  `cloudflare_account_id`, `cloudflare_api_token`, `r2_access_key_id`,
  `r2_secret_access_key`, `r2_s3_endpoint`, `r2_bucket`.
- The site must be accessed over **HTTPS** (`.pages.dev` is) — cookies are
  `SameSite=Lax` and work fine.
- **Cloudflare WAF blocks non-browser clients**: POSTs to `*.pages.dev` from
  default `python-requests`/`curl` User-Agents get 403 — use a browser-like
  `User-Agent` when scripting API tests.
- Cloudflare Pages free tier limits (100k requests/day) are far above this
  site's needs.

## 10. Cloudflare R2 storage (provisioned & verified)

- Bucket **`rcy-rpi`** created (APAC) on account `36e09ae1…` — S3 API endpoint
  `https://36e09ae127648632e68ad18a0338fe49.r2.cloudflarestorage.com`.
- The access keys were verified with a real put/list/delete round-trip.
- Both keys + endpoint + bucket name are stored in **Supabase Secrets**
  (`r2_*` names), NOT in the build. The site does not depend on R2 today;
  the bucket is ready for future image/media storage — read the values at
  runtime the same way `gateway-config.ts` reads the payment keys.

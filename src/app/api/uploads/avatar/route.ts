import { NextResponse } from "next/server";
import { requireUser } from "@/lib/session";
import { supabaseAdmin } from "@/lib/store";

export const runtime = "edge";

// ============================================================
// POST /api/uploads/avatar — user image upload
//
// Receives an ALREADY-COMPRESSED image (<= 500KB, see
// src/lib/avatar-image.ts) and stores it in Supabase Storage
// (public bucket "avatars"). Returns the public URL.
//
// If Storage is unavailable/full, returns { ok: true,
// storage: "inline" } so the client falls back to the legacy
// inline base64 data-URL path — user upload never fails.
// ============================================================

const BUCKET = "avatars";
const MAX_BYTES = 500 * 1024; // 500KB hard cap (binary)
const MAX_B64 = 700_000; // ~512KB binary when base64-encoded
const TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** per-isolate cache so cold starts skip a repeated bucket probe */
let bucketReady = false;

function fail(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/** magic-byte check: payload must really be the image type it claims */
function looksLikeImage(bytes: Uint8Array, ext: string): boolean {
  if (bytes.length < 12) return false;
  const b = bytes;
  if (ext === "jpg") return b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  if (ext === "png")
    return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
  if (ext === "webp")
    return (
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
    );
  return false;
}

/** upload; auto-create the bucket once if it is missing, then retry */
async function uploadAutoBucket(
  admin: ReturnType<typeof supabaseAdmin>,
  path: string,
  bytes: Uint8Array,
  contentType: string
): Promise<void> {
  const storage = admin.storage.from(BUCKET);
  let err = (await storage.upload(path, bytes, { contentType, upsert: true })).error;
  if (err && /bucket/i.test(String(err.message))) {
    const ce = (await admin.storage.createBucket(BUCKET, { public: true })).error;
    if (ce && !/already exists/i.test(String(ce.message))) throw new Error(`bucket: ${ce.message}`);
    bucketReady = true;
    err = (await storage.upload(path, bytes, { contentType, upsert: true })).error;
  }
  if (err) throw new Error(err.message);
  bucketReady = true;
}

export async function POST(req: Request) {
  // same-origin guard (browser flows always send Origin; matches app threat model)
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== new URL(req.url).host) return fail("forbidden", 403);
    } catch {
      return fail("forbidden", 403);
    }
  }

  const user = await requireUser(); // logged-in -> stable per-user path; else pending path
  const body = (await req.json().catch(() => null)) as {
    data?: string;
    content_type?: string;
  } | null;
  const ext = body?.content_type ? TYPES[body.content_type] : undefined;
  if (!body?.data || !ext) return fail("invalid_input");
  if (body.data.length > MAX_B64) return fail("too_large");

  let bytes: Uint8Array;
  try {
    bytes = Uint8Array.from(atob(body.data), (c) => c.charCodeAt(0));
  } catch {
    return fail("invalid_input");
  }
  if (bytes.length === 0 || bytes.length > MAX_BYTES) return fail("too_large");
  if (!looksLikeImage(bytes, ext)) return fail("invalid_image");

  const path = user ? `u/${user.id}.${ext}` : `p/${crypto.randomUUID()}.${ext}`;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasStorage = Boolean(sbUrl && process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (hasStorage) {
    try {
      const admin = supabaseAdmin();
      if (!bucketReady) {
        // cheap existence probe once per isolate (also warms the client)
        const list = await admin.storage.listBuckets();
        if (list.error) throw new Error(list.error.message);
        bucketReady = list.data?.some((b) => b.name === BUCKET) ?? false;
      }
      await uploadAutoBucket(admin, path, bytes, body.content_type!);
      // cache-busting query so a re-upload is visible immediately everywhere
      const url = `${sbUrl}/storage/v1/object/public/${BUCKET}/${path}?v=${Date.now()}`;
      return NextResponse.json({ ok: true, storage: "supabase", url });
    } catch (e) {
      console.error("avatar storage upload failed -> inline fallback:", e);
    }
  }

  // Storage unavailable/full -> legacy inline path (client embeds base64)
  return NextResponse.json({ ok: true, storage: "inline", reason: "storage_unavailable" });
}

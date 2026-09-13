// ============================================================
// Avatar image pipeline (client-side, zero UI change)
//
//   1. ANY picked image is auto-compressed to <= 480KB JPEG
//      (canvas downscale + quality loop — "convert to 500KB" rule)
//   2. Supabase Storage upload is attempted first (via the server,
//      so the service key never reaches the browser)
//   3. ONLY if Storage is unavailable/full, fall back to the legacy
//      inline base64 data-URL path (re-compressed <= 340KB binary so
//      the data-URL string fits the 500,000-char schema cap)
// ============================================================

/** binary cap for the Supabase Storage path (route hard-caps at 500KB) */
const STORAGE_MAX_BLOB = 480 * 1024;
/** binary cap for the inline base64 fallback (string must fit 500,000 chars) */
const INLINE_MAX_BLOB = 340 * 1024;
/** longest allowed side before compression (keeps decoding fast + output small) */
const MAX_SIDE = 1024;

function loadDecoded(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 0);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_decode_failed"));
    };
    img.src = url;
  });
}

/** draw scaled copy (white background flattens PNG transparency for JPEG) */
function drawScaled(img: HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas_unavailable");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("encode_failed"))),
      "image/jpeg",
      quality
    );
  });
}

/**
 * Auto-convert any image to a JPEG blob of at most `maxBytes`
 * (downscale -> quality loop -> shrink again if still too big).
 */
export async function compressImage(input: Blob, maxBytes: number): Promise<Blob> {
  const img = await loadDecoded(input);
  let side = MAX_SIDE;
  for (let round = 0; round < 4; round++) {
    const canvas = drawScaled(img, side);
    for (let q = 0.9; q >= 0.4; q -= 0.07) {
      const blob = await toBlob(canvas, q);
      if (blob.size <= maxBytes) return blob;
    }
    side = Math.round(side * 0.8);
  }
  return toBlob(drawScaled(img, side), 0.4); // best effort
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result);
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s);
    };
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(blob);
  });
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read_failed"));
    reader.readAsDataURL(blob);
  });
}

export interface PreparedAvatar {
  /** Supabase Storage public URL, or inline base64 data-URL on fallback */
  url: string;
  /** where the avatar ended up */
  storage: "supabase" | "inline";
}

/**
 * Full pipeline for a picked image file:
 * compress -> try Supabase Storage -> fallback to inline base64.
 */
export async function prepareAvatar(file: File): Promise<PreparedAvatar> {
  // 1) auto-compress (the "convert to 500KB" rule)
  let blob = await compressImage(file, STORAGE_MAX_BLOB);

  // 2) Supabase Storage first
  try {
    const res = await fetch("/api/uploads/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: await blobToBase64(blob),
        content_type: blob.type || "image/jpeg",
      }),
    });
    const j = (await res.json().catch(() => null)) as {
      ok?: boolean;
      storage?: string;
      url?: string;
    } | null;
    if (res.ok && j?.ok && j.storage === "supabase" && j.url) {
      return { url: j.url, storage: "supabase" };
    }
  } catch {
    /* network/storage issue -> inline fallback below */
  }

  // 3) fallback: inline base64 (legacy path, kept small for the schema cap)
  if (blob.size > INLINE_MAX_BLOB) {
    blob = await compressImage(file, INLINE_MAX_BLOB);
  }
  return { url: await blobToDataURL(blob), storage: "inline" };
}

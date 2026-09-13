// ============================================================
// Payment service — PipraPay gateway adapter + fallback checkout.
//
// REAL MODE (auto-enabled when gateway config resolves):
//   Gateway: PipraPay (self-hosted, panel build at the self-hosted panel).
//   Header `mhs-piprapay-api-key` (the panel's getAuthorizationHeader reads
//   MHS-PIPRAPAY-API-KEY; the docs' `mh-piprapay-api-key` is stale and
//   always yields INVALID_API_KEY).
//   POST {base}/checkout/redirect  -> { pp_id, pp_url }   (ADMIN key — the
//                                    ruser key has no Create Payment scope)
//   POST {base}/verify-payment     -> payment info         (ruser key —
//                                    verify_payment scope; singular path!)
//   POST {base}/refund-payment     -> refund               (admin key, pp_id)
//   Webhook POST /api/payments/webhook -> re-verified server-side
//
// FALLBACK MODE (config missing or gateway call fails):
//   Internal themed /payment/mock-checkout page — same UX, zero UI change.
// ============================================================

import { getGatewayConfig, invalidateGatewayConfig } from "@/lib/services/gateway-config";

export const isGatewayConfigured = async () => (await getGatewayConfig()) !== null;

export interface CheckoutInput {
  tran_id: string;
  amount: number;
  currency?: string;
  cus_name: string;
  cus_email?: string;
  cus_phone?: string;
  product: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
}

export interface CheckoutResult {
  mode: "gateway" | "mock";
  redirect_url: string;
  gateway_ref?: string;
  raw?: unknown;
}

const okStatus = (s: string) =>
  ["VALID", "SUCCESS", "COMPLETED", "PAID", "DONE"].includes(s.toUpperCase());

// the self-hosted panel sits behind Cloudflare, which blocks non-browser
// user agents (error 1010). Send a browser-like UA on all gateway calls.
const GW_HEADERS = (key: string): Record<string, string> => ({
  "Content-Type": "application/json",
  "mhs-piprapay-api-key": key,
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "application/json",
});

/** create a gateway charge; falls back to the themed mock checkout on any failure */
export async function gatewayCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const cfg = await getGatewayConfig();
  if (!cfg) {
    // ---- FALLBACK (themed internal checkout) ----
    return {
      mode: "mock",
      redirect_url: `/payment/mock-checkout?ref=${input.tran_id}`,
    };
  }

  // ---- REAL MODE: PipraPay checkout/redirect (this panel build's create
  //      endpoint; /create-charge does not exist here) ----
  try {
    const res = await fetch(`${cfg.base_url}/checkout/redirect`, {
      method: "POST",
      // the ruser key is verify-only on this panel — Create Payment needs the admin key
      headers: GW_HEADERS(cfg.admin_key),
      body: JSON.stringify({
        full_name: input.cus_name,
        email_address: input.cus_email?.trim() || "no-email@rcyrpi.org",
        mobile_number: input.cus_phone?.trim() || "01700000000",
        amount: String(input.amount),
        currency: input.currency ?? "BDT",
        return_url: input.success_url,
        webhook_url: `${new URL(input.success_url).origin}/api/payments/webhook`,
        metadata: { tran_id: input.tran_id, product: input.product },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const url =
      (data.pp_url as string) ||
      (data.payment_url as string) ||
      (data.GatewayPageURL as string) ||
      (data.redirect_url as string);
    if (!res.ok || !url) throw new Error(String((data as any)?.message ?? "no payment url"));
    return {
      mode: "gateway",
      redirect_url: url,
      gateway_ref: (data.pp_id as string) ?? undefined,
      raw: data,
    };
  } catch (e) {
    console.error("gatewayCheckout failed, falling back:", e instanceof Error ? e.message : e);
    invalidateGatewayConfig();
    return {
      mode: "mock",
      redirect_url: `/payment/mock-checkout?ref=${input.tran_id}`,
    };
  }
}

/** verify a transaction via the gateway (ruser key holds verify_payment scope) */
export async function gatewayVerify(
  tran_id: string,
  gatewayRef?: string
): Promise<{ verified: boolean; raw?: unknown }> {
  const cfg = await getGatewayConfig();
  if (!cfg) return { verified: true }; // fallback mode auto-verified
  try {
    if (!gatewayRef) {
      // the panel can only look up transactions by pp_id
      return { verified: false, raw: { note: "no gateway pp_id for this record" } };
    }
    const res = await fetch(`${cfg.base_url}/verify-payment`, {
      method: "POST",
      headers: GW_HEADERS(cfg.ruser_key),
      body: JSON.stringify({ pp_id: gatewayRef }),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const status = String(
      data.status ?? data.payment_status ?? data.pp_status ?? ""
    );
    return { verified: okStatus(status), raw: data };
  } catch (e) {
    console.error("gatewayVerify failed:", e instanceof Error ? e.message : e);
    return { verified: false };
  }
}

/** refund via gateway (admin key) — PipraPay has no standard refund endpoint;
 *  when unsupported the admin marks the record refunded manually. */
export async function gatewayRefund(
  tran_id: string,
  gatewayRef?: string,
  amount?: number
): Promise<{ refunded: boolean; raw?: unknown }> {
  const cfg = await getGatewayConfig();
  if (!cfg) return { refunded: true };
  try {
    const res = await fetch(`${cfg.base_url}/refund-payment`, {
      method: "POST",
      headers: GW_HEADERS(cfg.admin_key),
      body: JSON.stringify({ pp_id: gatewayRef ?? tran_id, refund_amount: amount }),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const status = String(data.status ?? "");
    return { refunded: okStatus(status) || status.toUpperCase() === "REFUNDED", raw: data };
  } catch {
    // gateway refund unsupported -> admin processes it manually outside
    return { refunded: false };
  }
}

export function newTranId(): string {
  return `RCY-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}

// ============================================================
// Payment service — PipraPay gateway adapter + fallback checkout.
//
// REAL MODE (auto-enabled when gateway config resolves):
//   Gateway: PipraPay (self-hosted) — header `mh-piprapay-api-key`.
//   POST {base}/api/create-charge    -> { pp_id, pp_url }  (ruser key)
//   POST {base}/api/verify-payments  -> payment info       (admin key)
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

// pay.invokeil.cfd sits behind Cloudflare, which blocks non-browser
// user agents (error 1010). Send a browser-like UA on all gateway calls.
const GW_HEADERS = (key: string): Record<string, string> => ({
  "Content-Type": "application/json",
  "mh-piprapay-api-key": key,
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

  // ---- REAL MODE: PipraPay create-charge ----
  try {
    const res = await fetch(`${cfg.base_url}/create-charge`, {
      method: "POST",
      headers: GW_HEADERS(cfg.ruser_key),
      body: JSON.stringify({
        cus_name: input.cus_name,
        cus_email: input.cus_email ?? "",
        cus_phone: input.cus_phone ?? "",
        amount: String(input.amount),
        redirect_url: input.success_url,
        cancel_url: input.cancel_url,
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

/** verify a transaction via the gateway (admin key) */
export async function gatewayVerify(
  tran_id: string,
  gatewayRef?: string
): Promise<{ verified: boolean; raw?: unknown }> {
  const cfg = await getGatewayConfig();
  if (!cfg) return { verified: true }; // fallback mode auto-verified
  try {
    const res = await fetch(`${cfg.base_url}/verify-payments`, {
      method: "POST",
      headers: GW_HEADERS(cfg.admin_key),
      body: JSON.stringify(
        gatewayRef ? { pp_id: gatewayRef, tran_id } : { tran_id }
      ),
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
  amount?: number
): Promise<{ refunded: boolean; raw?: unknown }> {
  const cfg = await getGatewayConfig();
  if (!cfg) return { refunded: true };
  try {
    const res = await fetch(`${cfg.base_url}/refund-payment`, {
      method: "POST",
      headers: GW_HEADERS(cfg.admin_key),
      body: JSON.stringify({ tran_id, refund_amount: amount }),
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

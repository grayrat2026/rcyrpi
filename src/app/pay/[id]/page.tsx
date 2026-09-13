import type { Metadata } from "next";
import { Suspense } from "react";
import { PayProductPage } from "@/components/pages/pay-product-page";

export const runtime = "edge";


export const metadata: Metadata = {
  title: "Payment — Youth Red Crescent Team RPI",
  description:
    "Secure online payment for Youth Red Crescent Team, Rangpur Govt. Polytechnic Institute (RCY).",
};

export default async function PayRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-md px-4 py-14" aria-busy="true">
          <div className="h-64 animate-pulse rounded-2xl bg-muted" />
        </div>
      }
    >
      <PayProductPage itemId={id} />
    </Suspense>
  );
}

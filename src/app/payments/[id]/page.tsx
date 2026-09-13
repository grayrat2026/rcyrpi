import type { Metadata } from "next";
import { PaymentDetailPage } from "@/components/pages/payment-detail-page";

export const runtime = "edge";


export const metadata: Metadata = {
  title: "Payment Details",
  description:
    "Item details & secure checkout — Youth Red Crescent Team, Rangpur Govt. Polytechnic Institute.",
};

export default function PaymentDetailRoute() {
  return <PaymentDetailPage />;
}

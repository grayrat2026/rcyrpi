import type { Metadata } from "next";
import { PaymentSuccessPage } from "@/components/pages/payment-success-page";

export const metadata: Metadata = {
  title: "Payment Successful",
  description: "Payment receipt — Youth Red Crescent Team, RPI.",
};

export default function PaymentSuccessRoute() {
  return <PaymentSuccessPage />;
}

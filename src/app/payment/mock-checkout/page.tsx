import type { Metadata } from "next";
import { MockCheckoutPage } from "@/components/pages/mock-checkout-page";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description: "RCY Secure Pay — payment gateway checkout.",
};

export default function MockCheckoutRoute() {
  return <MockCheckoutPage />;
}

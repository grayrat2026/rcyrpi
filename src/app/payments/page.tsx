import type { Metadata } from "next";
import { PaymentsPage } from "@/components/pages/payments-page";

export const metadata: Metadata = {
  title: "Payments",
  description:
    "Event fees, donations & gift programs — secure online payment for Youth Red Crescent Team, Rangpur Govt. Polytechnic Institute.",
};

export default function PaymentsRoute() {
  return <PaymentsPage />;
}

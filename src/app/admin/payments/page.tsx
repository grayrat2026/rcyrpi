import type { Metadata } from "next";
import { PaymentsManager } from "@/components/pages/admin/payments-manager";

export const metadata: Metadata = { title: "Payments — Admin" };

export default function AdminPaymentsPage() {
  return <PaymentsManager />;
}

import type { Metadata } from "next";
import { AdminDashboard } from "@/components/pages/admin/dashboard";

export const metadata: Metadata = { title: "Admin Dashboard" };

export default function AdminHomePage() {
  return <AdminDashboard />;
}

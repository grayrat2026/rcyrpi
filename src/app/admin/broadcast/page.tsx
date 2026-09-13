import type { Metadata } from "next";
import { BroadcastManager } from "@/components/pages/admin/broadcast-manager";

export const metadata: Metadata = { title: "Broadcast — Admin" };

export default function AdminBroadcastPage() {
  return <BroadcastManager />;
}

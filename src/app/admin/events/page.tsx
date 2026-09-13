import type { Metadata } from "next";
import { EventsManager } from "@/components/pages/admin/events-manager";

export const metadata: Metadata = { title: "Events & Funds — Admin" };

export default function AdminEventsPage() {
  return <EventsManager />;
}

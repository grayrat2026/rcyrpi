import type { Metadata } from "next";
import { ScheduleManager } from "@/components/pages/admin/schedule-manager";

export const metadata: Metadata = { title: "Weekly Schedule — Admin" };

export default function AdminSchedulePage() {
  return <ScheduleManager />;
}

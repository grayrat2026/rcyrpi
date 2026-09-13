import type { Metadata } from "next";
import { MembersManager } from "@/components/pages/admin/members-manager";

export const metadata: Metadata = { title: "Members — Admin" };

export default function AdminMembersPage() {
  return <MembersManager />;
}

import type { Metadata } from "next";
import { ContactsManager } from "@/components/pages/admin/contacts-manager";

export const metadata: Metadata = { title: "Contact Management — Admin" };

export default function AdminContactsPage() {
  return <ContactsManager />;
}

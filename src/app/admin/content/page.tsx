import type { Metadata } from "next";
import { ContentEditor } from "@/components/pages/admin/content-editor";

export const metadata: Metadata = { title: "Page Builder — Admin" };

export default function AdminContentPage() {
  return <ContentEditor />;
}

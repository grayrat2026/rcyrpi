import type { Metadata } from "next";
import { NoticesPage } from "@/components/pages/notices-page";

export const metadata: Metadata = { title: "Notices" };

export default function NoticesRoute() {
  return <NoticesPage />;
}

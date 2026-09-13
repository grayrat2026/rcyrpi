import type { Metadata } from "next";
import { RequestPage } from "@/components/pages/request-page";

export const metadata: Metadata = { title: "Emergency Request" };

export default function RequestRoute() {
  return <RequestPage />;
}

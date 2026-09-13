import type { Metadata } from "next";
import { TermsPage } from "@/components/pages/terms-page";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function TermsRoute() {
  return <TermsPage />;
}

import type { Metadata } from "next";
import { SignupPage } from "@/components/pages/signup-page";

export const metadata: Metadata = { title: "Sign Up" };

export default function SignupRoute() {
  return <SignupPage />;
}

import type { Metadata } from "next";
import { ForgotPasswordPage } from "@/components/pages/forgot-password-page";

export const metadata: Metadata = {
  title: "Forgot Password — Youth Red Crescent Team RPI",
  description: "Request a password reset link — Youth Red Crescent Team, RPI.",
};

export default function ForgotPasswordRoute() {
  return <ForgotPasswordPage />;
}

import type { Metadata } from "next";
import { ResetPasswordPage } from "@/components/pages/reset-password-page";

export const metadata: Metadata = {
  title: "Reset Password — Youth Red Crescent Team RPI",
  description: "Set a new password for your account — Youth Red Crescent Team, RPI.",
};

export default function ResetPasswordRoute() {
  return <ResetPasswordPage />;
}

import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginPage } from "@/components/pages/login-page";

export const metadata: Metadata = { title: "Login" };

export default function LoginRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted" aria-busy="true" />
        </div>
      }
    >
      <LoginPage />
    </Suspense>
  );
}

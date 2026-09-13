"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { EmergencyPopupProvider } from "@/components/providers/emergency-popup";
import { useAuth } from "@/store/auth-store";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const refresh = useAuth().refresh;

  // hydrate session (cookie) into the zustand mirror once per load
  useEffect(() => {
    refresh();
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={200}>
        <EmergencyPopupProvider>
          {children}
          <Toaster position="top-center" richColors closeButton />
        </EmergencyPopupProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}

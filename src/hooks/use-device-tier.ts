"use client";

import { useSyncExternalStore } from "react";

export type DeviceTier = "high" | "medium" | "low";

let cached: DeviceTier | null = null;

function detect(): DeviceTier {
  if (typeof window === "undefined") return "high";
  if (cached) return cached;
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 4;
  const mem = (nav as { deviceMemory?: number }).deviceMemory || 4;
  const width = window.innerWidth;
  let tier: DeviceTier;
  if (cores <= 4 || mem <= 4) tier = "low";
  else if (width < 1024) tier = "medium";
  else tier = "high";
  cached = tier;
  return tier;
}

/**
 * Performance tier for animations:
 * - high (desktop, 8+ cores): full effects
 * - medium (tablet): reduced particles / blur
 * - low (mobile / weak device): CSS-only, minimal motion
 */
const noopSubscribe = () => () => {};
const getServerTier = (): DeviceTier => "high";

export function useDeviceTier(): DeviceTier {
  return useSyncExternalStore(noopSubscribe, detect, getServerTier);
}

/** scale factor helpers used across components */
export const tierScale = {
  particles: { high: 14, medium: 8, low: 0 } as const,
  stagger: { high: 0.08, medium: 0.06, low: 0 } as const,
  enableSpring: { high: true, medium: true, low: false } as const,
  enableBlur: { high: true, medium: false, low: false } as const,
};

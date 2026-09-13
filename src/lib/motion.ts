"use client";

import type { Variants } from "framer-motion";

/** Shared motion presets — micro-animation library */

export const EASE = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE, delay: (i as number) * 0.07 },
  }),
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.6, ease: EASE } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 260, damping: 22 },
  },
};

export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE } },
};

export const slideRight: Variants = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE } },
};

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

export const popBounce: Variants = {
  hidden: { opacity: 0, scale: 0.6, y: 12 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 18 },
  },
};

/** hover micro-interactions */
export const hoverLift = {
  whileHover: { y: -6, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
};

export const hoverGrow = {
  whileHover: { scale: 1.04 },
  whileTap: { scale: 0.96 },
};

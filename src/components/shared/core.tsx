"use client";

// ============================================================
// Core shared UI bits — Reveal, BlinkDot, SectionHeading,
// LogoBadge, CrescentIcon, CrescentBackground, SeverityBadge
// ============================================================

import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerParent, EASE } from "@/lib/motion";
import { useDeviceTier } from "@/hooks/use-device-tier";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Siren } from "lucide-react";

/* ---------------- scroll reveal wrapper ---------------- */
export function Reveal({
  children,
  index = 0,
  className,
  y = 24,
  once = true,
}: {
  children: React.ReactNode;
  index?: number;
  className?: string;
  y?: number;
  once?: boolean;
}) {
  const tier = useDeviceTier();
  const reduce = useReducedMotion();
  if (tier === "low" || reduce) {
    return <div className={className}>{children}</div>;
  }
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      custom={index}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "-40px" }}
      style={{ ["--y" as string]: y }}
    >
      {children}
    </motion.div>
  );
}

/** stagger container — children use <Reveal> or motion variants */
export function RevealGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const tier = useDeviceTier();
  const reduce = useReducedMotion();
  if (tier === "low" || reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- blinking live dot ---------------- */
export function BlinkDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-2.5 w-2.5 rounded-full bg-brand-red animate-pulse-dot",
        className
      )}
      aria-hidden="true"
    />
  );
}

/* ---------------- section heading ---------------- */
export function SectionHeading({
  title,
  subtitle,
  align = "center",
  danger = false,
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  danger?: boolean;
}) {
  return (
    <Reveal className={cn("mb-8", align === "center" ? "text-center" : "text-left")}>
      <div
        className={cn(
          "flex items-center gap-2",
          align === "center" && "justify-center"
        )}
      >
        {danger && <BlinkDot />}
        <h2
          className={cn(
            "text-2xl font-bold tracking-tight sm:text-3xl",
            danger && "text-brand-red animate-blink"
          )}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
      )}
      <div
        className={cn(
          "mt-3 h-1 w-16 rounded-full brand-gradient",
          align === "center" && "mx-auto"
        )}
      />
    </Reveal>
  );
}

/* ---------------- red crescent SVG ---------------- */
export function CrescentIcon({
  className,
  animated = false,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(className, animated && "animate-heartbeat")}
      aria-hidden="true"
    >
      <defs>
        <mask id="crescent-mask">
          <rect width="100" height="100" fill="black" />
          <circle cx="46" cy="50" r="34" fill="white" />
          <circle cx="60" cy="50" r="30" fill="black" />
        </mask>
      </defs>
      <rect width="100" height="100" fill="currentColor" mask="url(#crescent-mask)" />
    </svg>
  );
}

/* ---------------- floating crescent background ---------------- */
export function CrescentBackground({ className }: { className?: string }) {
  const tier = useDeviceTier();
  if (tier === "low") return null;
  const count = tier === "high" ? 7 : 4;
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
      aria-hidden="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${(i * 137) % 100}%`,
            top: `${(i * 61) % 100}%`,
            opacity: 0.05 + (i % 3) * 0.03,
          }}
          animate={{
            y: [0, -18, 0],
            rotate: [0, i % 2 ? 8 : -8, 0],
          }}
          transition={{
            duration: 7 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.7,
          }}
        >
          <CrescentIcon
            className={cn(
              "h-16 w-16",
              i % 2 ? "text-brand-red" : "text-brand-green"
            )}
          />
        </motion.div>
      ))}
    </div>
  );
}

/* ---------------- animated logo badge ---------------- */
export function LogoBadge({
  src,
  alt,
  size = 48,
  className,
  priority,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <motion.span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/5",
        className
      )}
      whileHover={{ scale: 1.08, rotate: 3 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <img
        src={src}
        alt={alt}
        width={size}
        height={size}
        loading={priority ? "eager" : "lazy"}
        className="rounded-full object-contain p-0.5"
        style={{ width: size, height: size }}
      />
    </motion.span>
  );
}

/* ---------------- severity badge ---------------- */
export function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    critical: { label: "CRITICAL", cls: "bg-brand-red text-white animate-blink" },
    high: { label: "HIGH", cls: "bg-orange-500 text-white" },
    medium: { label: "MEDIUM", cls: "bg-amber-400 text-black" },
    low: { label: "INFO", cls: "bg-brand-green-soft text-brand-green-dark" },
  };
  const s = map[severity] ?? map.low;
  return (
    <Badge className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider", s.cls)}>
      {severity === "critical" ? <Siren className="mr-1 h-3 w-3" /> : severity === "high" ? <AlertTriangle className="mr-1 h-3 w-3" /> : null}
      {s.label}
    </Badge>
  );
}

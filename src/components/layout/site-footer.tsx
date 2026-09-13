"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { useI18n } from "@/hooks/use-i18n";
import { useAuth } from "@/store/auth-store";
import type { Contact } from "@/lib/types";
import type { DictKey } from "@/i18n/dictionary";

const QUICK: { href: string; key: DictKey }[] = [
  { href: "/", key: "nav_home" },
  { href: "/notices", key: "nav_notices" },
  { href: "/payments", key: "nav_payments" },
  { href: "/request", key: "nav_request" },
  { href: "/signup", key: "nav_join" },
];

export function SiteFooter() {
  const { t, L } = useI18n();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/contacts", { cache: "no-store" });
        const data = await res.json();
        if (!alive) return;
        const list: Contact[] = data.contacts ?? [];
        setContacts(list.filter((c) => c.active));
      } catch { /* fail-safe — keep empty lists, footer layout intact */ }
    };
    load();
    return () => { alive = false; };
  }, []);

  const phones = contacts.filter((c) => c.kind === "phone");
  const emails = contacts.filter((c) => c.kind === "email");

  return (
    <footer className="mt-auto border-t bg-secondary/60">
      <div className="mx-auto grid grid-cols-1 max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* brand */}
        <div>
          <div className="flex items-center gap-2">
            <img
              src="/logos/bdrcs.png"
              alt="Bangladesh Red Crescent Society"
              className="h-8 w-8 rounded-full object-contain ring-1 ring-black/5 bg-white p-0.5"
            />
            <div>
              <p className="text-sm font-extrabold leading-tight">
                <span className="text-brand-red">Youth Red Crescent</span>{" "}
                <span className="text-brand-green">Team</span>
              </p>
              <p className="text-[10px] text-muted-foreground">Rangpur Govt. Polytechnic Institute</p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            {t("foot_tagline")}
          </p>
          <a
            href="https://bdrcs.org"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-green hover:underline"
          >
            <AppIcon name="Link2" className="h-3.5 w-3.5" />
            bdrcs.org
          </a>
        </div>

        {/* quick links */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-red">{t("foot_quick")}</p>
          <ul className="space-y-2">
            {QUICK.filter((q) => q.href !== "/signup" || !user).map((q) => (
              <li key={q.href}>
                <Link href={q.href} className="group flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-brand-red">
                  <AppIcon name="ArrowRight" className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  {t(q.key)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* hotlines */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-red">{t("foot_contact")}</p>
          <ul className="space-y-2.5">
            {phones.map((c) => (
              <li key={c.id} className="flex items-center gap-2 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-red-soft text-brand-red">
                  <AppIcon name={c.icon} className="h-3.5 w-3.5" />
                </span>
                <div className="leading-tight">
                  <p className="text-[10px] text-muted-foreground">{L(c.label)}</p>
                  <p className="text-xs font-bold">{c.value}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* contact */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-brand-red">{t("foot_contact")}</p>
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
            <AppIcon name="MapPin" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-green" />
            {t("foot_addr")}
          </p>
          {emails.map((c) => (
            <a
              key={c.id}
              href={`mailto:${c.value}`}
              className="mt-2 flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-brand-red"
            >
              <AppIcon name={c.icon || "Mail"} className="h-3.5 w-3.5 shrink-0 text-brand-green" />
              {c.value}
            </a>
          ))}
          <Link href="/terms" className="mt-3 inline-block text-xs font-semibold text-brand-green hover:underline">
            {t("foot_terms")}
          </Link>
        </div>
      </div>

      <div className="border-t py-3 text-center">
        <p className="text-[11px] text-muted-foreground">{t("foot_rights")}</p>
      </div>
    </footer>
  );
}

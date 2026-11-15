"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Globe, RefreshCw, ShieldCheck, Smartphone, Wifi, WifiOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppShell } from "@/components/I18nProvider";

function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#171717" />
      <path
        d="M10 11.5 C10 9.567 11.567 8 13.5 8 L19 8 C20.657 8 22 9.343 22 11 C22 12.657 20.657 14 19 14 L13 14 C11.343 14 10 15.343 10 17 C10 18.657 11.343 20 13 20 L19.5 20 C21.433 20 23 21.567 23 23.5"
        stroke="#3670FF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="10" cy="11.5" r="1.5" fill="#F9D601" />
      <circle cx="23" cy="23.5" r="1.5" fill="#F9D601" />
    </svg>
  );
}

export function AppNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const { locale, setLocale, isOnline, pendingCount, syncQueueNow } = useAppShell();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems = [
    { href: "/", label: t("overview") },
    { href: "/workspace", label: t("workspace") },
    { href: "/officer", label: t("officer"), icon: <ShieldCheck size={15} aria-hidden="true" /> },
    { href: "/sms-ussd", label: t("smsUssd"), icon: <Smartphone size={15} aria-hidden="true" /> },
  ];

  return (
    <header className={`sf-app-nav${scrolled || pathname !== "/" ? " scrolled" : ""}`}>
      <div className="container sf-app-nav-inner">
        <Link href="/" className="nav-logo" aria-label="ScalarField Field Shift home">
          <LogoMark size={30} />
          <span>ScalarField</span>
        </Link>

        <nav aria-label="Primary application navigation">
          <ul id="sf-primary-nav" className={`sf-nav-list${menuOpen ? " is-open" : ""}`} role="list">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`sf-nav-link${active ? " is-active" : ""}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sf-nav-controls">
          <button
            type="button"
            onClick={() => (pendingCount > 0 ? void syncQueueNow() : undefined)}
            className={`sf-sync-pill ${isOnline ? "is-online" : "is-offline"}`}
            title={pendingCount > 0 ? "Flush offline queue" : undefined}
          >
            {isOnline ? <Wifi size={14} aria-hidden="true" /> : <WifiOff size={14} aria-hidden="true" />}
            <span>
              {pendingCount > 0
                ? t("pendingQueue", { count: pendingCount })
                : isOnline
                  ? t("syncOnline")
                  : t("syncOffline")}
            </span>
            {pendingCount > 0 && <RefreshCw size={12} aria-hidden="true" />}
          </button>

          <Link
            href="/login"
            className="rounded-full bg-[#171717] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#3670FF]"
          >
            PIN Sign In
          </Link>

          <div className="sf-lang-switch" role="group" aria-label={t("languageLabel")}>
            <Globe size={14} aria-hidden="true" className="sf-lang-icon" />
            <button
              type="button"
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
              className={`sf-lang-btn${locale === "en" ? " is-selected" : ""}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale("tw")}
              aria-pressed={locale === "tw"}
              className={`sf-lang-btn${locale === "tw" ? " is-selected" : ""}`}
            >
              Twi
            </button>
          </div>

          <button
            type="button"
            className={`nav-menu-toggle${menuOpen ? " is-open" : ""}`}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="sf-primary-nav"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
          </button>
        </div>
      </div>
    </header>
  );
}

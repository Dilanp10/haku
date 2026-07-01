"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/lugares", label: "Lugares" },
  { href: "/eventos", label: "Eventos" },
] as const;

export function SiteNav({ children }: { hasSession?: boolean; children?: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur"
      style={{
        background: "color-mix(in oklab, var(--bg) 88%, transparent)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Logo brand */}
        <Link
          href="/"
          className="flex items-baseline gap-2 transition-opacity hover:opacity-80"
        >
          <span
            className="text-brand text-[26px] leading-none"
            style={{ color: "var(--terra)" }}
          >
            Haku
          </span>
          <span className="text-data hidden sm:inline" style={{ color: "var(--fg-30)" }}>
            CATAMARCA
          </span>
        </Link>

        {/* Links principales (solo desktop; en mobile va el BottomNav) */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="rounded-button px-3 py-1.5 text-sm transition"
                style={{
                  background: active ? "var(--terra-wash)" : "transparent",
                  color: active ? "var(--terra)" : "var(--fg-70)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {children}
        </div>
      </div>
    </header>
  );
}

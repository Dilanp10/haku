"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS: { href: string; label: string; exact?: boolean }[] = [
  { href: "/", label: "Inicio", exact: true },
  { href: "/lugares", label: "Lugares" },
  { href: "/eventos", label: "Eventos" },
  { href: "/mapa", label: "Mapa" },
  { href: "/buscar", label: "Buscar" },
  { href: "/mas", label: "Más" },
];

export function SiteNav() {
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
        <Link
          href="/"
          className="flex items-baseline gap-2 transition-opacity hover:opacity-80"
        >
          <span
            className="text-brand text-[26px] leading-none"
            style={{ color: "var(--accent)" }}
          >
            Haku
          </span>
          <span className="text-data hidden sm:inline" style={{ color: "var(--fg-30)" }}>
            CATAMARCA
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1" aria-label="Navegación principal">
          {NAV_LINKS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href as never}
                aria-current={active ? "page" : undefined}
                className="rounded-button px-3 py-1.5 text-sm transition"
                style={{
                  background: active ? "var(--accent-wash)" : "transparent",
                  color: active ? "var(--accent)" : "var(--fg-70)",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Map, CalendarDays, Heart, Menu } from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: typeof Map;
  isActive: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "Explorar",
    icon: Map,
    isActive: (p) =>
      p === "/" || p.startsWith("/lugares/") || p === "/buscar" || p === "/mapa" || p === "/lugares/cerca",
  },
  {
    href: "/eventos",
    label: "Agenda",
    icon: CalendarDays,
    isActive: (p) => p === "/eventos" || p.startsWith("/eventos/"),
  },
  {
    href: "/perfil/favoritos",
    label: "Guardados",
    icon: Heart,
    isActive: (p) => p === "/perfil/favoritos",
  },
  {
    href: "/mas",
    label: "Más",
    icon: Menu,
    isActive: (p) =>
      p === "/mas" ||
      (p.startsWith("/perfil") && p !== "/perfil/favoritos") ||
      p.startsWith("/login") ||
      p.startsWith("/lugares/sugerir"),
  },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-40 safe-pb md:hidden"
      style={{
        background: "var(--bg)",
        borderTop: "1px solid var(--line)",
        height: "var(--bottom-nav-height, 72px)",
      }}
    >
      <ul className="mx-auto flex h-full max-w-2xl items-stretch">
        {TABS.map((t) => {
          const active = t.isActive(pathname);
          const Icon = t.icon;
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href as never}
                className="relative flex flex-col items-center justify-center h-full gap-1"
                style={{ color: active ? "var(--fg)" : "var(--fg-30)" }}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  size={21}
                  strokeWidth={active ? 2 : 1.6}
                />
                <span
                  className="text-[11px]"
                  style={{
                    fontWeight: active ? 700 : 600,
                    color: active ? "var(--fg)" : "var(--fg-50)",
                  }}
                >
                  {t.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

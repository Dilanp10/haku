"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, Map, Menu } from "lucide-react";

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: (path: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "Inicio",
    icon: Home,
    isActive: (p) => p === "/" || p.startsWith("/lugares/") || p === "/buscar",
  },
  {
    href: "/eventos",
    label: "Eventos",
    icon: CalendarDays,
    isActive: (p) => p === "/eventos" || p.startsWith("/eventos/"),
  },
  {
    href: "/mapa",
    label: "Mapa",
    icon: Map,
    isActive: (p) => p === "/mapa" || p === "/lugares/cerca" || p === "/eventos/cerca",
  },
  {
    href: "/mas",
    label: "Más",
    icon: Menu,
    isActive: (p) =>
      p === "/mas" || p.startsWith("/perfil") || p.startsWith("/login") || p.startsWith("/lugares/sugerir"),
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
        background: "var(--bg-deep)",
        borderTop: "1px solid var(--line)",
        height: "var(--bottom-nav-height, 80px)",
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
                className="relative flex flex-col items-center justify-center h-full gap-1 transition-opacity"
                style={{ color: active ? "var(--terra)" : "var(--fg-30)" }}
                aria-current={active ? "page" : undefined}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ background: "var(--terra)", marginTop: "-1px" }}
                  />
                )}
                <Icon
                  size={20}
                  strokeWidth={active ? 2 : 1.6}
                  style={{ color: active ? "var(--terra)" : "var(--fg-30)" }}
                />
                <span
                  className="text-[11px] text-brand"
                  style={{ color: active ? "var(--terra)" : "var(--fg-50)" }}
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

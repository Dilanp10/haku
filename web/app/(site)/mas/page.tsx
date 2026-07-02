import type { Metadata } from "next";
import Link from "next/link";
import { Info, MessageSquarePlus, User, LogIn, Shield } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { ThemeToggleRow } from "./theme-toggle-row";
import { NotificationsRow } from "./notifications-row";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Más",
  description: "Opciones y ajustes de Haku.",
};

type Item = { href: string; label: string; icon: typeof User };

export default async function MasPage() {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  const links: Item[] = [
    // Acceso de sesión contextual
    ...(profile
      ? [{ href: "/perfil", label: "Mi perfil", icon: User }]
      : [{ href: "/login?from=admin", label: "Iniciar sesión", icon: LogIn }]),
    ...(isAdmin
      ? [{ href: "/admin", label: "Panel de administración", icon: Shield }]
      : []),
    { href: "/lugares/sugerir", label: "Sugerir un lugar", icon: MessageSquarePlus },
    { href: "/about", label: "Sobre Haku", icon: Info },
  ];

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-section mb-6">Más.</h1>

      <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
        {links.map((l) => {
          const Icon = l.icon;
          return (
            <li key={l.href}>
              <Link
                href={l.href as never}
                className="flex items-center gap-3 py-4 transition-opacity hover:opacity-70"
                style={{ color: "var(--fg)" }}
              >
                <Icon size={20} style={{ color: "var(--terra)" }} />
                <span className="text-brand text-base">{l.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <h2 className="text-section mt-8 mb-4">Ajustes</h2>

      <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
        <NotificationsRow />
        <ThemeToggleRow />
      </ul>

      <p className="mt-10 text-center text-data" style={{ color: "var(--fg-30)" }}>
        Haku · Catamarca, Argentina
      </p>
    </main>
  );
}

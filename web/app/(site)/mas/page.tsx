import type { Metadata } from "next";
import Link from "next/link";
import { Info, MessageSquarePlus, User } from "lucide-react";
import { ThemeToggleRow } from "./theme-toggle-row";
import { NotificationsRow } from "./notifications-row";

export const metadata: Metadata = {
  title: "Más",
  description: "Opciones y ajustes de Haku.",
};

const LINKS = [
  { href: "/perfil", label: "Mi perfil", icon: User },
  { href: "/lugares/sugerir", label: "Sugerir un lugar", icon: MessageSquarePlus },
  { href: "/about", label: "Sobre Haku", icon: Info },
] as const;

export default function MasPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-section mb-6">Más.</h1>

      <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
        {LINKS.map((l) => {
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

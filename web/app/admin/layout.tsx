import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { hasAtLeast } from "@haku/auth";
import { logoutAction } from "../(site)/login/actions";

// Toda la sección /admin es privada — fuera del índice de buscadores.
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
};

/**
 * Guarda de la sección /admin. Composition root: usa @haku/auth (perfil + rol)
 * antes de renderizar las páginas hijas. La RLS de Postgres sigue siendo la
 * autorización efectiva en la BD.
 *
 * El panel se muestra siempre en tema oscuro Tierra (independiente del tema del
 * sitio), envolviendo el contenido en `.dark` para que casquen los tokens oscuros.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?from=admin");

  if (!hasAtLeast(profile.role, "admin")) {
    return (
      <div className="dark admin-tierra min-h-screen" style={{ background: "var(--bg)", color: "var(--fg)" }}>
        <main className="mx-auto max-w-2xl px-4 py-16">
          <h1 className="text-2xl font-bold" style={{ color: "var(--fg)" }}>
            Acceso denegado
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--fg-50)" }}>
            Tu rol actual es <code>{profile.role}</code>. Se requiere <code>admin</code>.
          </p>
          <form action={logoutAction} className="mt-6">
            <button
              className="rounded-[10px] border px-4 py-2 text-sm transition active:opacity-80"
              style={{ borderColor: "var(--line-2)", color: "var(--fg)" }}
            >
              Cerrar sesión
            </button>
          </form>
        </main>
      </div>
    );
  }

  return (
    <div className="dark admin-tierra min-h-screen" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <header
        className="sticky top-0 z-40 backdrop-blur"
        style={{
          background: "color-mix(in oklab, var(--bg) 88%, transparent)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-5">
            <Link
              href="/lugares"
              className="inline-flex items-center gap-1 text-data transition-opacity hover:opacity-70"
              style={{ color: "var(--fg-50)" }}
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Volver a Haku
            </Link>
            <nav className="hidden sm:flex items-center gap-4 text-sm">
              <Link href="/admin/lugares" className="transition-opacity hover:opacity-70" style={{ color: "var(--fg-70)" }}>
                Lugares
              </Link>
              <Link href="/admin/eventos" className="transition-opacity hover:opacity-70" style={{ color: "var(--fg-70)" }}>
                Eventos
              </Link>
            </nav>
          </div>
          <form action={logoutAction}>
            <button
              className="rounded-[10px] border px-3 py-1.5 text-sm transition active:opacity-80"
              style={{ borderColor: "var(--line-2)", color: "var(--fg-70)" }}
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}

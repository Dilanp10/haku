import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
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
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?from=admin");
  if (!hasAtLeast(profile.role, "admin")) {
    return (
      <main className="container py-16">
        <h1 className="text-2xl font-bold">Acceso denegado</h1>
        <p className="mt-2 text-muted-foreground">
          Tu rol actual es <code>{profile.role}</code>. Se requiere <code>admin</code>.
        </p>
        <form action={logoutAction} className="mt-6">
          <button className="rounded-md border px-3 py-1.5 text-sm hover:border-primary/40">
            Cerrar sesión
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold">
              Haku · Admin
            </Link>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              <Link href="/admin/lugares" className="hover:text-foreground">
                Lugares
              </Link>
              <Link href="/admin/eventos" className="hover:text-foreground">
                Eventos pendientes
              </Link>
              <Link href="/lugares" className="hover:text-foreground">
                Ver sitio público
              </Link>
            </nav>
          </div>
          <form action={logoutAction}>
            <button className="text-sm text-muted-foreground hover:text-foreground">
              {profile.displayName ?? "Salir"} · ⏻
            </button>
          </form>
        </div>
      </header>
      <div>{children}</div>
    </div>
  );
}

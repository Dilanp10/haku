import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Heart, MessageSquarePlus, Shield, LogOut, ChevronRight } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { logoutAction } from "../login/actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Mi perfil",
  robots: { index: false },
};

const ROLE_LABEL: Record<string, string> = {
  visitor: "Visitante",
  editor: "Editor",
  admin: "Administrador",
};

const fmtMonthYear = new Intl.DateTimeFormat("es-AR", {
  month: "long",
  year: "numeric",
  timeZone: "America/Argentina/Catamarca",
});

export default async function PerfilPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?from=/perfil");

  const name = profile.displayName ?? "Usuario";
  const isAdmin = profile.role === "admin";

  return (
    <main id="main" className="mx-auto max-w-2xl px-4 py-8 pb-bottom">
      <h1 className="text-section mb-6">Mi perfil.</h1>

      {/* Cabecera de identidad */}
      <header className="flex items-center gap-4">
        <div
          className="relative size-16 shrink-0 overflow-hidden rounded-full"
          style={{ background: "var(--card-2)" }}
        >
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-2xl text-brand"
              style={{ color: "var(--fg-30)" }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-brand text-2xl truncate" style={{ color: "var(--fg)" }}>
            {name}
          </p>
          <p className="mt-0.5 text-data" style={{ color: "var(--terra)" }}>
            {ROLE_LABEL[profile.role] ?? profile.role}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--fg-50)" }}>
            Miembro desde {fmtMonthYear.format(new Date(profile.createdAt))}
          </p>
        </div>
      </header>

      {/* Accesos */}
      <ul className="mt-8 divide-y" style={{ borderColor: "var(--line)" }}>
        <Row href="/perfil/favoritos" label="Mis favoritos" icon={Heart} />
        <Row href="/lugares/sugerir" label="Sugerir un lugar" icon={MessageSquarePlus} />
        {isAdmin && <Row href="/admin" label="Panel de administración" icon={Shield} />}
      </ul>

      {/* Cerrar sesión */}
      <form action={logoutAction} className="mt-8">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-[10px] border px-4 py-3 text-sm font-medium transition active:opacity-80"
          style={{ borderColor: "var(--line-2)", color: "var(--rust)" }}
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </form>
    </main>
  );
}

function Row({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof Heart;
}) {
  return (
    <li>
      <Link
        href={href as never}
        className="flex items-center gap-3 py-4 transition-opacity hover:opacity-70"
        style={{ color: "var(--fg)" }}
      >
        <Icon size={20} style={{ color: "var(--terra)" }} />
        <span className="text-brand text-base flex-1">{label}</span>
        <ChevronRight className="h-4 w-4" style={{ color: "var(--fg-30)" }} />
      </Link>
    </li>
  );
}

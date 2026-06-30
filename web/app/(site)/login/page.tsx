import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ingresar",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  return (
    <main id="main" className="container py-16">
      <div className="mx-auto max-w-sm rounded-lg border bg-card p-6">
        <h1 className="text-2xl font-bold">Ingresar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acceso al panel de administración de Haku.
        </p>
        <LoginForm from={from} />
      </div>
    </main>
  );
}

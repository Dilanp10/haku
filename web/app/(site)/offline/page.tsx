import type { Metadata } from "next";

export const metadata: Metadata = { title: "Sin conexión" };

export default function OfflinePage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-20 text-center">
      <p className="text-brand text-4xl" style={{ color: "var(--terra)" }}>
        Sin conexión
      </p>
      <p className="mt-3" style={{ color: "var(--fg-50)" }}>
        Parece que no tenés conexión a internet. Volvé a intentar cuando estés conectado.
      </p>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Sobre Haku",
  description: "Qué es Haku y por qué existe.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/mas"
        className="inline-flex items-center gap-1 text-data mb-6 transition-opacity hover:opacity-70"
        style={{ color: "var(--fg-50)" }}
      >
        <ArrowLeft size={14} />
        Más
      </Link>

      <h1 className="text-brand text-3xl mb-6" style={{ color: "var(--accent)" }}>
        Sobre Haku
      </h1>

      <div className="space-y-4" style={{ color: "var(--fg-80)" }}>
        <p>
          <strong className="text-brand" style={{ color: "var(--fg)" }}>
            Haku
          </strong>{" "}
          significa <em>vamos</em> en quechua. Es una invitación a salir, explorar
          y descubrir lo que Catamarca tiene para ofrecer.
        </p>

        <p>
          Nació como una app para encontrar lugares gastronómicos, pero creció
          para incluir eventos, mapas y todo lo que te ayude a decidir{" "}
          <em>a dónde ir</em>.
        </p>

        <p>
          Haku es un proyecto independiente hecho en Catamarca, para Catamarca.
        </p>
      </div>

      <div
        className="mt-10 pt-6"
        style={{ borderTop: "1px solid var(--line)" }}
      >
        <p className="text-data" style={{ color: "var(--fg-30)" }}>
          Haku · Catamarca, Argentina
        </p>
      </div>
    </main>
  );
}

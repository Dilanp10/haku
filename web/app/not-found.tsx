import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main
      id="main"
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-md flex-col items-center justify-center px-6 pb-16 pt-10 text-center"
    >
      <span
        className="text-brand leading-none"
        style={{ fontSize: "clamp(5rem,20vw,8rem)", color: "var(--terra)" }}
      >
        H
      </span>
      <p className="text-section mt-6">404</p>
      <h1
        className="text-brand mt-2 text-3xl leading-tight"
        style={{ color: "var(--fg)" }}
      >
        No encontramos esta página.
      </h1>
      <p
        className="mt-3 text-[15px]"
        style={{ color: "var(--fg-70)" }}
      >
        Puede que el lugar o evento ya no esté publicado, o que el link esté
        desactualizado.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-opacity active:opacity-70"
        style={{ background: "var(--terra)", color: "#fff" }}
      >
        <ArrowLeft size={16} />
        Volver al inicio
      </Link>
    </main>
  );
}

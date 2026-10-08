import Link from "next/link";

const YEAR = new Date().getFullYear();

const LINKS = [
  { href: "/lugares", label: "Lugares" },
  { href: "/eventos", label: "Eventos" },
  { href: "/mapa", label: "Mapa" },
  { href: "/buscar", label: "Buscar" },
  { href: "/mas", label: "Más" },
] as const;

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid var(--line)", background: "var(--bg-deep)" }}>
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-brand text-lg" style={{ color: "var(--terra)" }}>
            Haku
          </span>
          <span style={{ color: "var(--fg-30)" }}>·</span>
          <span style={{ color: "var(--fg-50)" }}>Descubrí Catamarca</span>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-sm" aria-label="Links del pie">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="transition-opacity hover:opacity-70"
              style={{ color: "var(--fg-70)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <p className="text-data" style={{ color: "var(--fg-30)" }}>
          © {YEAR} Haku
        </p>
      </div>
    </footer>
  );
}

import Link from "next/link";

const YEAR = new Date().getFullYear();

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30 text-sm text-muted-foreground">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-[5px] bg-primary text-[11px] font-extrabold text-primary-foreground"
            aria-hidden="true"
          >
            H
          </span>
          <span className="font-semibold text-foreground">Haku</span>
          <span>·</span>
          <span>Descubrí Catamarca</span>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-1" aria-label="Links del pie">
          <Link href="/lugares" className="hover:text-foreground transition-colors">Lugares</Link>
          <Link href="/eventos" className="hover:text-foreground transition-colors">Eventos</Link>
          <Link href="/mapa" className="hover:text-foreground transition-colors">Mapa</Link>
        </nav>

        <p className="text-xs">© {YEAR} Haku</p>
      </div>
    </footer>
  );
}

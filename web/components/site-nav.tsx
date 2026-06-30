"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, MapPin, Search, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/lugares", label: "Lugares" },
  { href: "/eventos", label: "Eventos" },
] as const;

export function SiteNav({ hasSession = false }: { hasSession?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = () => {
    setSearching(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearching(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    closeSearch();
    if (q) router.push(`/buscar?q=${encodeURIComponent(q)}`);
    else router.push("/buscar");
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-4">
        {/* Logo — se oculta cuando el buscador esta expandido en mobile */}
        <Link
          href="/"
          className={`flex items-center gap-2 font-bold text-foreground transition-colors hover:text-primary ${searching ? "hidden sm:flex" : "flex"}`}
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-[6px] bg-primary text-[13px] font-extrabold text-primary-foreground"
            aria-hidden="true"
          >
            H
          </span>
          <span>Haku</span>
        </Link>

        {/* Buscador inline */}
        {searching ? (
          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-1 items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                placeholder="Buscar lugares, eventos..."
                className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                onKeyDown={(e) => e.key === "Escape" && closeSearch()}
              />
            </div>
            <button
              type="button"
              onClick={closeSearch}
              className="rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Cerrar busqueda"
            >
              <X className="h-5 w-5" />
            </button>
          </form>
        ) : (
          <>
            {/* Links principales */}
            <nav className="flex items-center gap-1" aria-label="Navegacion principal">
              {NAV_LINKS.map(({ href, label }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Acciones */}
            <div className="flex items-center gap-2">
              <button
                onClick={openSearch}
                aria-label="Abrir busqueda"
                className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <Search className="h-4 w-4" />
              </button>
              {hasSession && (
                <Link
                  href="/perfil/favoritos"
                  aria-label="Mis favoritos"
                  className="hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground sm:inline-flex"
                >
                  <Heart className="h-3.5 w-3.5" />
                  Favoritos
                </Link>
              )}
              <Link
                href="/lugares/cerca"
                className="hidden items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20 sm:inline-flex"
              >
                <MapPin className="h-3.5 w-3.5" />
                Cerca tuyo
              </Link>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

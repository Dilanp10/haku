import Link from "next/link";
import type { Category } from "@haku/core";
import { cn } from "@/lib/utils";

interface Props {
  categories: Category[];
  active?: string | undefined;
  /** Parámetros extra a preservar en cada enlace (precio, comida, q, etc.). */
  preserveParams?: Record<string, string>;
}

export function CategoryPills({ categories, active, preserveParams = {} }: Props) {
  const buildHref = (slug?: string) => {
    const qs = new URLSearchParams(preserveParams);
    if (slug) qs.set("categoria", slug);
    const str = qs.toString();
    return str ? `/lugares?${str}` : "/lugares";
  };

  return (
    <nav aria-label="Categorías" className="flex flex-wrap gap-2">
      <Pill href={buildHref()} active={!active} label="Todo" />
      {categories.map((c) => (
        <Pill
          key={c.id}
          href={buildHref(c.slug)}
          active={active === c.slug}
          label={c.name}
        />
      ))}
    </nav>
  );
}

function Pill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      {label}
    </Link>
  );
}

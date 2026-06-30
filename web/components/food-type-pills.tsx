import Link from "next/link";
import type { FoodType } from "@haku/core";
import { cn } from "@/lib/utils";

interface Props {
  foodTypes: FoodType[];
  active?: string | undefined;
  basePath: string;
  preserveParams?: Record<string, string>;
}

export function FoodTypePills({ foodTypes, active, basePath, preserveParams = {} }: Props) {
  if (foodTypes.length === 0) return null;

  const buildHref = (slug?: string) => {
    const qs = new URLSearchParams(preserveParams);
    if (slug) qs.set("comida", slug);
    const str = qs.toString();
    return str ? `${basePath}?${str}` : basePath;
  };

  return (
    <nav aria-label="Filtro por tipo de comida" className="flex flex-wrap gap-2">
      <Pill href={buildHref()} active={!active} label="Todo tipo" />
      {foodTypes.map((ft) => (
        <Pill
          key={ft.id}
          href={buildHref(ft.slug)}
          active={active === ft.slug}
          label={ft.name}
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
          ? "border-primary bg-primary/90 text-primary-foreground"
          : "border-border bg-card hover:border-primary/40",
      )}
    >
      {label}
    </Link>
  );
}

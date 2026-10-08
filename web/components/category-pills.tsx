import Link from "next/link";
import type { Category } from "@haku/core";

interface Props {
  categories: Category[];
  active?: string | undefined;
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
        <Pill key={c.id} href={buildHref(c.slug)} active={active === c.slug} label={c.name} />
      ))}
    </nav>
  );
}

function Pill({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border px-3 py-1 text-sm transition"
      style={
        active
          ? { background: "var(--terra)", borderColor: "var(--terra)", color: "#fff" }
          : { background: "var(--card-bg)", borderColor: "var(--line-2)", color: "var(--fg-70)" }
      }
    >
      {label}
    </Link>
  );
}

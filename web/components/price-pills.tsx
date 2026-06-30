import Link from "next/link";
import { cn } from "@/lib/utils";

const PRICES = [
  { value: "$",   label: "$ Económico" },
  { value: "$$",  label: "$$ Moderado" },
  { value: "$$$", label: "$$$ Premium" },
] as const;

interface Props {
  active?: string | undefined;
  basePath: string;
  preserveParams?: Record<string, string>;
}

export function PricePills({ active, basePath, preserveParams = {} }: Props) {
  const buildHref = (price?: string) => {
    const qs = new URLSearchParams(preserveParams);
    if (price) qs.set("precio", price);
    const str = qs.toString();
    return str ? `${basePath}?${str}` : basePath;
  };

  return (
    <nav aria-label="Filtro por precio" className="flex flex-wrap gap-2">
      <PricePill href={buildHref()} active={!active} label="Cualquier precio" />
      {PRICES.map(({ value, label }) => (
        <PricePill
          key={value}
          href={buildHref(value)}
          active={active === value}
          label={label}
        />
      ))}
    </nav>
  );
}

function PricePill({ href, active, label }: { href: string; active: boolean; label: string }) {
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

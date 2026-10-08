import Link from "next/link";

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
      <Pill href={buildHref()} active={!active} label="Cualquier precio" />
      {PRICES.map(({ value, label }) => (
        <Pill key={value} href={buildHref(value)} active={active === value} label={label} />
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

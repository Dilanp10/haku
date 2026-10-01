"use client";

import Link from "next/link";
import Image from "next/image";

export interface PlaceRowProps {
  slug: string;
  name: string;
  categoryName: string | null;
  neighborhood: string | null;
  closesAt: string | null;
  closingSoon?: boolean;
  imageUrl: string | null;
  selected?: boolean;
  onSelect?: () => void;
}

function Monogram({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      style={{ background: "var(--card-2)", color: "var(--fg-50)", fontSize: 14, fontWeight: 700 }}
    >
      {initials}
    </div>
  );
}

export function PlaceRow({
  slug,
  name,
  categoryName,
  neighborhood,
  closesAt,
  closingSoon,
  imageUrl,
  selected,
  onSelect,
}: PlaceRowProps) {
  const meta = [categoryName, neighborhood].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/lugares/${slug}` as never}
      className="flex items-center gap-3 px-5 py-3 transition-colors"
      style={{
        background: selected ? "var(--accent-wash)" : "transparent",
        borderBottom: "1px solid var(--line)",
      }}
      onClick={(e) => {
        if (onSelect) {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <Monogram name={name} />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-bold" style={{ color: "var(--fg)" }}>
          {name}
        </p>
        {meta && (
          <p className="truncate text-[13px]" style={{ color: "var(--fg-50)" }}>
            {meta}
          </p>
        )}
      </div>
      {closesAt && (
        <span
          className="shrink-0 text-[13px] font-semibold tabular-nums"
          style={{ color: closingSoon ? "var(--danger)" : "var(--fg-50)" }}
        >
          {closingSoon ? "cierra pronto" : closesAt}
        </span>
      )}
    </Link>
  );
}

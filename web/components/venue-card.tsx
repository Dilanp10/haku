import Link from "next/link";
import Image from "next/image";
import type { Venue, Category } from "@haku/core";

interface Props {
  venue: Venue;
  category: Category | undefined;
  priority?: boolean;
}

export function VenueCard({ venue, category, priority }: Props) {
  const meta = [category?.name, venue.address].filter(Boolean).join(" · ");

  return (
    <div className="group relative flex items-center gap-4 py-4 row-sep animate-fade-in-up">
      <Link
        href={{ pathname: "/lugares/[slug]", query: { slug: venue.slug } } as const}
        aria-label={venue.name}
        className="absolute inset-0 z-10 transition-opacity active:opacity-70"
      />

      {/* Thumb */}
      <div
        className="relative shrink-0 size-16 rounded-[10px] overflow-hidden"
        style={{ background: "var(--card-2)" }}
      >
        {venue.coverImageUrl ? (
          <Image
            src={venue.coverImageUrl}
            alt=""
            fill
            sizes="64px"
            className="object-cover"
            {...(priority ? { priority: true } : {})}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-xl text-brand"
            style={{ color: "var(--fg-30)" }}
          >
            {venue.name.charAt(0)}
          </div>
        )}
      </div>

      {/* Text */}
      <div className="relative flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className="text-brand text-[19px] leading-tight truncate"
            style={{ color: "var(--fg)" }}
          >
            {venue.name}
          </h3>
          {venue.priceRange && (
            <span
              className="text-data shrink-0"
              style={{ color: "var(--fg-30)" }}
            >
              {venue.priceRange}
            </span>
          )}
        </div>
        {meta && (
          <p
            className="text-xs mt-0.5 truncate"
            style={{ color: "var(--fg-50)" }}
          >
            {meta}
          </p>
        )}
        {venue.description && (
          <p
            className="text-[13px] mt-1 line-clamp-1"
            style={{ color: "var(--fg-70)" }}
          >
            {venue.description}
          </p>
        )}
      </div>
    </div>
  );
}

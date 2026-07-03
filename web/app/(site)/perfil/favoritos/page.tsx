import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { Heart, MapPin } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mis favoritos",
  robots: { index: false },
};

interface VenueRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  address: string | null;
  cover_image_url: string | null;
}

interface SaveRow {
  venue_id: string;
  created_at: string;
  venues: VenueRow | null;
}

export default async function FavoritosPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?from=/perfil/favoritos");

  const supabase = await createServerSupabase();

  const { data } = await supabase
    .from("venue_saves")
    .select("venue_id, created_at, venues(id, slug, name, description, address, cover_image_url)")
    .order("created_at", { ascending: false });

  const saves = (data ?? []) as unknown as SaveRow[];
  const venues = saves.map((s) => s.venues).filter((v): v is VenueRow => v !== null);

  return (
    <main id="main" className="mx-auto max-w-2xl md:max-w-5xl px-4 py-8 pb-bottom">
      <header className="mb-6 flex items-center gap-3">
        <Heart className="h-5 w-5" style={{ color: "var(--rust)" }} fill="currentColor" />
        <h1 className="text-brand text-2xl" style={{ color: "var(--fg)" }}>
          Mis favoritos
        </h1>
      </header>

      {venues.length === 0 ? (
        <div
          className="flex flex-col items-center gap-4 rounded-[12px] border py-16 text-center"
          style={{ borderColor: "var(--line)", background: "var(--card-bg)" }}
        >
          <Heart className="h-12 w-12" style={{ color: "var(--fg-30)" }} />
          <p style={{ color: "var(--fg-50)" }}>Todavía no guardaste ningún lugar.</p>
          <Link
            href="/lugares"
            className="rounded-[10px] px-4 py-2 text-sm font-medium transition active:opacity-80"
            style={{ background: "var(--terra)", color: "#fff" }}
          >
            Descubrí lugares
          </Link>
        </div>
      ) : (
        <ul className="md:grid md:grid-cols-2 md:gap-x-8">
          {venues.map((venue) => (
            <li key={venue.id} className="row-sep">
              <Link
                href={`/lugares/${venue.slug}`}
                className="flex items-center gap-4 py-4 transition-opacity active:opacity-70"
              >
                <div
                  className="relative shrink-0 size-16 rounded-[10px] overflow-hidden"
                  style={{ background: "var(--card-2)" }}
                >
                  {venue.cover_image_url ? (
                    <Image
                      src={venue.cover_image_url}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
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
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-brand text-[17px] leading-tight truncate"
                    style={{ color: "var(--fg)" }}
                  >
                    {venue.name}
                  </h3>
                  {venue.address && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs truncate" style={{ color: "var(--fg-50)" }}>
                      <MapPin className="h-3 w-3 shrink-0" />
                      {venue.address}
                    </p>
                  )}
                  {venue.description && (
                    <p className="text-[13px] mt-1 line-clamp-1" style={{ color: "var(--fg-70)" }}>
                      {venue.description}
                    </p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

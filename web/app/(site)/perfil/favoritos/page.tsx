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
    <main id="main" className="container py-10">
      <header className="mb-8 flex items-center gap-3">
        <Heart className="h-6 w-6 text-red-500" fill="currentColor" />
        <h1 className="text-2xl font-bold">Mis favoritos</h1>
      </header>

      {venues.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card py-16 text-center">
          <Heart className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Todavía no guardaste ningún lugar.</p>
          <Link
            href="/lugares"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Descubrí lugares
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((venue) => (
            <li key={venue.id}>
              <Link
                href={`/lugares/${venue.slug}`}
                className="group block overflow-hidden rounded-lg border bg-card transition hover:border-primary/40 hover:shadow-sm"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                  {venue.cover_image_url ? (
                    <Image
                      src={venue.cover_image_url}
                      alt={venue.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition group-hover:scale-[1.02]"
                    />
                  ) : null}
                </div>
                <div className="p-4">
                  <h3 className="truncate font-semibold">{venue.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {venue.description ?? "Sin descripción aún."}
                  </p>
                  {venue.address && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {venue.address}
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

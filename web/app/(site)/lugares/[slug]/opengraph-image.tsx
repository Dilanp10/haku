import { ImageResponse } from "next/og";
import { getVenueBySlug, createSupabaseCoreRepository } from "@haku/core";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Detalle de lugar en Haku";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function VenueOG({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ImageResponse> {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const repo = createSupabaseCoreRepository(supabase);
  const res = await getVenueBySlug(repo, { slug });
  const name = res.ok ? res.value.name : "Haku";
  const desc = res.ok ? res.value.description ?? "" : "";
  const priceRange = res.ok ? res.value.priceRange : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "80px 80px 72px",
          background:
            "linear-gradient(140deg, #d9533a 0%, #b3401f 60%, #6f2a14 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "white",
              color: "#d9533a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <div style={{ fontSize: 26, letterSpacing: 4, textTransform: "uppercase", opacity: 0.9 }}>
            Catamarca · Lugar
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 84, fontWeight: 800, lineHeight: 1.04 }}>{name}</div>
          {desc ? (
            <div
              style={{
                fontSize: 32,
                opacity: 0.92,
                maxWidth: 1000,
                lineHeight: 1.25,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {desc}
            </div>
          ) : null}
          {priceRange ? (
            <div style={{ fontSize: 28, opacity: 0.85 }}>{priceRange}</div>
          ) : null}
        </div>
      </div>
    ),
    size,
  );
}

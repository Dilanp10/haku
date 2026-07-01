import { ImageResponse } from "next/og";
import { createSupabaseEventRepository } from "@haku/events";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Detalle de evento en Haku";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const fmtOg = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Catamarca",
});

export default async function EventOG({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<ImageResponse> {
  const { slug } = await params;
  const supabase = await createServerSupabase();
  const repo = createSupabaseEventRepository(supabase);
  const event = await repo.getBySlug(slug);

  const title = event?.title ?? "Haku";
  const dateStr = event ? fmtOg.format(new Date(event.startsAt)) : "";
  const venue = event?.venueName ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          padding: "80px 80px 72px",
          background:
            "linear-gradient(140deg, #3b57d9 0%, #2640b3 60%, #16276f 100%)",
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
              color: "#3b57d9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 52,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <div
            style={{
              fontSize: 26,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            Catamarca &middot; Evento
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: title.length > 40 ? 60 : 80,
              fontWeight: 800,
              lineHeight: 1.04,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          {dateStr ? (
            <div style={{ fontSize: 32, opacity: 0.9, lineHeight: 1.3 }}>
              {dateStr}
            </div>
          ) : null}
          {venue ? (
            <div style={{ fontSize: 28, opacity: 0.75 }}>{venue}</div>
          ) : null}
        </div>
      </div>
    ),
    size,
  );
}

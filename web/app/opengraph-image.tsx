import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Haku — Descubrí Catamarca";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function DefaultOG(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background:
            "linear-gradient(135deg, #d9533a 0%, #b3401f 55%, #6f2a14 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 20,
              background: "white",
              color: "#d9533a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 64,
              fontWeight: 800,
            }}
          >
            H
          </div>
          <div
            style={{
              fontSize: 28,
              letterSpacing: 4,
              textTransform: "uppercase",
              opacity: 0.9,
            }}
          >
            Catamarca
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.05 }}>
            Descubrí Catamarca.
          </div>
          <div style={{ fontSize: 38, opacity: 0.92, maxWidth: 920 }}>
            Lugares, gastronomía y eventos cerca tuyo. Haku — vamos.
          </div>
        </div>
      </div>
    ),
    size,
  );
}

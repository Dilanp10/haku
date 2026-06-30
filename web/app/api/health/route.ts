import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Health check para contenedores / Kubernetes (liveness & readiness). */
export function GET(): Response {
  return NextResponse.json({ status: "ok", service: "haku-web" });
}

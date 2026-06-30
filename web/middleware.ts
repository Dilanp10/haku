import { type NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

/**
 * Refresca la sesión de Supabase en cada request y la propaga por cookies.
 * (La protección de rutas concretas se añade en Fase 2 sobre este mismo middleware.)
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Guarda perimetral: /admin requiere sesión. La verificación de ROL admin
  // se hace en el layout de /admin con @haku/auth.requireRole (defensa en profundidad
  // sobre RLS, que sigue siendo la barrera real en la base de datos).
  if (!user && req.nextUrl.pathname.startsWith("/admin")) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", "admin");
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|svg)$).*)"],
};

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { env } from "@/lib/env";

const SITE_NAME = "Haku";
const SITE_DESCRIPTION =
  "Descubrí lugares, gastronomía y eventos de Catamarca. ¿Vamos?";

export const metadata: Metadata = {
  metadataBase: new URL(env.appUrl),
  title: {
    default: "Haku — Descubrí Catamarca",
    template: "%s · Haku",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Catamarca",
    "gastronomía",
    "eventos",
    "qué hacer en Catamarca",
    "lugares",
    "Haku",
  ],
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: SITE_NAME,
    title: "Haku — Descubrí Catamarca",
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haku — Descubrí Catamarca",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#d9533a" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:border focus:bg-card focus:px-3 focus:py-1.5 focus:text-sm focus:shadow-sm"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}

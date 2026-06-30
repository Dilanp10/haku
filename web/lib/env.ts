/** Acceso tipado a variables de entorno. Falla temprano si faltan las públicas. */
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Falta la variable de entorno ${name}`);
  return value;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
};

/** Solo servidor. No importar desde componentes cliente. */
export const serverEnv = {
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ingestToken: process.env.EVENTS_INGEST_TOKEN,
  scraperUserAgent: process.env.EVENTS_SCRAPER_USER_AGENT ?? "HakuBot/0.1",
  resendApiKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM ?? "onboarding@resend.dev",
  adminEmail: process.env.ADMIN_EMAIL,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  vapidSubject: process.env.VAPID_SUBJECT ?? "mailto:admin@haku.app",
};

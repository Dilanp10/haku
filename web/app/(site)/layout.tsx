import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { getCurrentProfile } from "@/lib/auth";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav hasSession={!!profile} />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

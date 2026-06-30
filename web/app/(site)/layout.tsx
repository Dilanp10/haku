import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { PushSubscribeBtn } from "@/components/push-subscribe-btn";
import { getCurrentProfile } from "@/lib/auth";
import { env } from "@/lib/env";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav hasSession={!!profile}>
        <PushSubscribeBtn vapidPublicKey={env.vapidPublicKey} />
      </SiteNav>
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

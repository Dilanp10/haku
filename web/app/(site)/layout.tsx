import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { BottomNav } from "@/components/bottom-nav";
import { PushSubscribeBtn } from "@/components/push-subscribe-btn";
import { RegisterSW } from "@/components/register-sw";
import { InstallPrompt } from "@/components/install-prompt";
import { env } from "@/lib/env";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav>
        <PushSubscribeBtn vapidPublicKey={env.vapidPublicKey} />
      </SiteNav>
      <div className="flex-1 pb-bottom md:pb-0">{children}</div>
      <div className="hidden md:block">
        <SiteFooter />
      </div>
      <BottomNav />
      <RegisterSW />
      <InstallPrompt />
    </div>
  );
}

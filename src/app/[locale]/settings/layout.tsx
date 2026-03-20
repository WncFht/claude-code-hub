import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { redirect } from "@/i18n/routing";

import { getSession } from "@/lib/auth";
import { isOctopusConsoleShellEnabled } from "@/lib/console/console-shell-flag";
import { CONSOLE_MODULES, type ConsoleModuleId } from "@/lib/console/module-registry";
import { DashboardHeader } from "../dashboard/_components/dashboard-header";
import { DashboardMain } from "../dashboard/_components/dashboard-main";
import { PageTransition } from "./_components/page-transition";
import { SettingsNav } from "./_components/settings-nav";
import { getTranslatedNavItems } from "./_lib/nav-items";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // Await params to ensure locale is available in the async context
  const { locale } = await params;

  const session = await getSession();

  if (!session) {
    return redirect({ href: "/login", locale });
  }

  if (session.user.role !== "admin") {
    return redirect({ href: "/dashboard", locale });
  }

  const header = <DashboardHeader session={session} />;

  if (isOctopusConsoleShellEnabled()) {
    const t = await getTranslations("dashboard");
    const moduleLabels = Object.fromEntries(
      CONSOLE_MODULES.map((module) => [module.id, t(module.labelKey)])
    ) as Record<ConsoleModuleId, string>;

    return (
      <DashboardMain header={header} role="admin" moduleLabels={moduleLabels} shellEnabled={true}>
        <PageTransition>{children}</PageTransition>
      </DashboardMain>
    );
  }

  // Get translated navigation items
  const translatedNavItems = await getTranslatedNavItems();

  return (
    <div className="min-h-[var(--cch-viewport-height,100vh)] bg-background">
      {header}
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 md:py-8 pb-24 md:pb-8">
        <div className="space-y-6">
          {/* Desktop: Grid layout with sidebar */}
          <div className="lg:grid lg:gap-6 lg:grid-cols-[220px_1fr]">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
              <SettingsNav items={translatedNavItems} />
            </aside>
            {/* Content area */}
            <div className="space-y-6">
              {/* Tablet: Horizontal nav shown above content */}
              <div className="lg:hidden">
                <SettingsNav items={translatedNavItems} />
              </div>
              <PageTransition>{children}</PageTransition>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

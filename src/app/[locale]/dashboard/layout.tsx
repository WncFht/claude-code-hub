import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { redirect } from "@/i18n/routing";

import { getSession } from "@/lib/auth";
import { isOctopusConsoleShellEnabled } from "@/lib/console/console-shell-flag";
import { CONSOLE_MODULES, type ConsoleModuleId } from "@/lib/console/module-registry";
import { DashboardHeader } from "./_components/dashboard-header";
import { DashboardMain } from "./_components/dashboard-main";
import { WebhookMigrationDialog } from "./_components/webhook-migration-dialog";

export default async function DashboardLayout({
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
    return redirect({ href: "/login?from=/dashboard", locale });
  }

  if (session.user.role !== "admin" && !session.key.canLoginWebUi) {
    return redirect({ href: "/my-usage", locale });
  }

  const header = <DashboardHeader session={session} />;

  if (isOctopusConsoleShellEnabled()) {
    const t = await getTranslations("dashboard");
    const moduleLabels = Object.fromEntries(
      CONSOLE_MODULES.map((module) => [module.id, t(module.labelKey)])
    ) as Record<ConsoleModuleId, string>;

    return (
      <>
        <DashboardMain
          header={header}
          role={session.user.role}
          moduleLabels={moduleLabels}
          shellEnabled={true}
        >
          {children}
        </DashboardMain>
        <WebhookMigrationDialog />
      </>
    );
  }

  return (
    <div className="min-h-[var(--cch-viewport-height,100vh)] bg-background">
      {header}
      <DashboardMain>{children}</DashboardMain>
      <WebhookMigrationDialog />
    </div>
  );
}

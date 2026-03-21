"use client";

import type { ReactNode } from "react";
import { ConsoleShell } from "@/components/console/console-shell";
import { PageStage } from "@/components/page-stage";
import { usePathname } from "@/i18n/routing";
import {
  type ConsoleModuleId,
  type ConsoleRole,
  resolveConsoleRoute,
} from "@/lib/console/module-registry";

interface DashboardMainProps {
  children: ReactNode;
  header?: ReactNode;
  moduleLabels?: Record<ConsoleModuleId, string>;
  role?: ConsoleRole;
  shellEnabled?: boolean;
}

export function DashboardMain({
  children,
  header,
  moduleLabels,
  role,
  shellEnabled = false,
}: DashboardMainProps) {
  const pathname = usePathname();
  const activeRoute = resolveConsoleRoute(pathname);

  if (shellEnabled && role && moduleLabels) {
    return (
      <ConsoleShell
        header={header}
        role={role}
        activeRoute={activeRoute}
        moduleLabels={moduleLabels}
      >
        {children}
      </ConsoleShell>
    );
  }

  const normalizedPathname = pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;

  // Pattern to match /dashboard/sessions/[id]/messages
  // The usePathname hook from next-intl/routing might return the path without locale prefix if configured that way,
  // or we just check for the suffix.
  // Let's be safe and check if it includes "/dashboard/sessions/" and ends with "/messages"
  const isSessionMessagesPage =
    normalizedPathname.includes("/dashboard/sessions/") && normalizedPathname.endsWith("/messages");

  if (isSessionMessagesPage) {
    return (
      <main className="h-[calc(var(--cch-viewport-height,100vh)-64px)] w-full overflow-hidden">
        {children}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-8 md:py-9 xl:px-8 xl:py-10">
      <PageStage activeKey={normalizedPathname}>{children}</PageStage>
    </main>
  );
}

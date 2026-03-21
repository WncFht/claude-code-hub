"use client";

import { useTranslations } from "next-intl";
import type { ConsoleBootstrapPayload } from "@/lib/console/console-bootstrap";
import { CONSOLE_MODULES, type ConsoleModuleId } from "@/lib/console/module-registry";
import {
  CONSOLE_RUNTIME_ROUTES,
  type ConsoleRuntimeLabelKind,
  getVisibleConsoleRuntimeModuleTabs,
} from "@/lib/console/runtime-route-map";
import { ConsoleScreenLoader } from "./console-screen-loader";
import { ConsoleShell } from "./console-shell";
import { ConsoleToolbarHost, ConsoleToolbarProvider } from "./console-toolbar-host";
import { useConsoleRoute } from "./hooks/use-console-route";

export interface ConsoleAppProps {
  bootstrap: ConsoleBootstrapPayload;
}

function getModuleLabels(
  tModules: ReturnType<typeof useTranslations<"dashboard.console.modules">>
): Record<ConsoleModuleId, string> {
  return {
    overview: tModules("overview"),
    traffic: tModules("traffic"),
    providers: tModules("providers"),
    policy: tModules("policy"),
    system: tModules("system"),
  };
}

function getRouteLabel(
  labelKind: ConsoleRuntimeLabelKind,
  labelKey: string,
  tConsoleRoutes: ReturnType<typeof useTranslations<"dashboard.console.routes">>,
  tSettingsNav: ReturnType<typeof useTranslations<"settings.nav">>,
  tRateLimits: ReturnType<typeof useTranslations<"dashboard.rateLimits">>,
  tUserInsights: ReturnType<typeof useTranslations<"dashboard.leaderboard.userInsights">>
) {
  if (labelKind === "settings-nav") {
    return tSettingsNav(labelKey as never);
  }

  if (labelKind === "rate-limits") {
    return tRateLimits(labelKey as never);
  }

  if (labelKind === "user-insights") {
    return tUserInsights(labelKey as never);
  }

  return tConsoleRoutes(labelKey as never);
}

export function ConsoleApp({ bootstrap }: ConsoleAppProps) {
  const tModules = useTranslations("dashboard.console.modules");
  const tConsoleRoutes = useTranslations("dashboard.console.routes");
  const tSettingsNav = useTranslations("settings.nav");
  const tRateLimits = useTranslations("dashboard.rateLimits");
  const tUserInsights = useTranslations("dashboard.leaderboard.userInsights");
  const moduleLabels = getModuleLabels(tModules);
  const { currentPath, activeRoute } = useConsoleRoute(bootstrap);
  const activeScreenLabel = getRouteLabel(
    activeRoute.labelKind,
    activeRoute.labelKey,
    tConsoleRoutes,
    tSettingsNav,
    tRateLimits,
    tUserInsights
  );

  const navigationItems = CONSOLE_MODULES.flatMap((module) => {
    const route = CONSOLE_RUNTIME_ROUTES.find(
      (candidate) =>
        candidate.moduleId === module.id && candidate.visibleForRoles.includes(bootstrap.role)
    );

    if (!route) {
      return [];
    }

    return [
      {
        id: module.id,
        href: route.consolePath,
        label: moduleLabels[module.id],
        active: activeRoute.moduleId === module.id,
      },
    ];
  });

  const moduleTabs = getVisibleConsoleRuntimeModuleTabs({
    moduleId: activeRoute.moduleId,
    role: bootstrap.role,
  }).map((route) => ({
    id: route.secondaryTabId ?? route.screenId,
    href: route.consolePath,
    label: getRouteLabel(
      route.labelKind,
      route.labelKey,
      tConsoleRoutes,
      tSettingsNav,
      tRateLimits,
      tUserInsights
    ),
    active: route.secondaryTabId === activeRoute.secondaryTabId,
  }));

  return (
    <ConsoleToolbarProvider>
      <div
        data-slot="console-entry"
        data-current-path={currentPath}
        data-requested-path={bootstrap.requestedPath}
        data-default-path={bootstrap.defaultPath}
        data-screen-id={activeRoute.screenId}
        data-module-id={activeRoute.moduleId}
      >
        <ConsoleShell
          currentPath={currentPath}
          activeModuleLabel={moduleLabels[activeRoute.moduleId]}
          activeScreenLabel={activeScreenLabel}
          activeRoute={activeRoute}
          navigationItems={navigationItems}
          moduleTabs={moduleTabs}
          toolbar={<ConsoleToolbarHost activeScreenId={activeRoute.screenId} />}
        >
          <ConsoleScreenLoader bootstrap={bootstrap} activeRoute={activeRoute} />
        </ConsoleShell>
      </div>
    </ConsoleToolbarProvider>
  );
}

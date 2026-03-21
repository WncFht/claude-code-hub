"use client";

import { useTranslations } from "next-intl";
import type { ConsoleBootstrapPayload } from "@/lib/console/console-bootstrap";
import { CONSOLE_MODULES, type ConsoleModuleId } from "@/lib/console/module-registry";
import { CONSOLE_RUNTIME_ROUTES } from "@/lib/console/runtime-route-map";
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

export function ConsoleApp({ bootstrap }: ConsoleAppProps) {
  const tModules = useTranslations("dashboard.console.modules");
  const moduleLabels = getModuleLabels(tModules);
  const { currentPath, activeRoute } = useConsoleRoute(bootstrap);

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
          activeRoute={activeRoute}
          navigationItems={navigationItems}
          toolbar={<ConsoleToolbarHost activeScreenId={activeRoute.screenId} />}
        >
          <ConsoleScreenLoader bootstrap={bootstrap} activeRoute={activeRoute} />
        </ConsoleShell>
      </div>
    </ConsoleToolbarProvider>
  );
}

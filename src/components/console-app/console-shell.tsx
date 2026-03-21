import type { ReactNode } from "react";
import { ConsoleStage } from "@/components/console/console-stage";
import type { ConsoleRuntimeRouteDefinition } from "@/lib/console/runtime-route-map";
import { ConsoleHeader } from "./console-header";
import { ConsoleModuleTabs, type ConsoleModuleTabItem } from "./console-module-tabs";
import { ConsoleSidebar, type ConsoleSidebarItem } from "./console-sidebar";

interface ConsoleShellProps {
  currentPath: string;
  activeModuleLabel: string;
  activeScreenLabel: string;
  activeRoute: ConsoleRuntimeRouteDefinition;
  navigationItems: ConsoleSidebarItem[];
  moduleTabs: ConsoleModuleTabItem[];
  toolbar?: ReactNode;
  children: ReactNode;
}

export function ConsoleShell({
  currentPath,
  activeModuleLabel,
  activeScreenLabel,
  activeRoute,
  navigationItems,
  moduleTabs,
  toolbar,
  children,
}: ConsoleShellProps) {
  return (
    <div
      data-slot="console-shell"
      className="min-h-[var(--cch-viewport-height,100vh)] bg-background"
    >
      <ConsoleHeader
        activeModuleLabel={activeModuleLabel}
        activeScreenLabel={activeScreenLabel}
        currentPath={currentPath}
      />

      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:py-6">
        <ConsoleSidebar items={navigationItems} />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <ConsoleModuleTabs items={moduleTabs} />

          {toolbar ? <div data-slot="console-toolbar-row">{toolbar}</div> : null}

          <ConsoleStage
            fullBleed={activeRoute.fullBleed}
            className="min-w-0 flex-1 overflow-hidden rounded-[28px] border border-border/60 bg-card/70 shadow-sm"
            contentClassName={activeRoute.fullBleed ? undefined : "px-4 py-4 md:px-6 md:py-6"}
          >
            {children}
          </ConsoleStage>
        </div>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import {
  getVisibleConsoleModules,
  getVisibleConsoleRoutes,
  type ConsoleModuleId,
  type ConsoleRole,
  type ConsoleRouteDefinition,
} from "@/lib/console/module-registry";
import { ConsoleNav } from "./console-nav";
import { ConsoleStage } from "./console-stage";

export interface ConsoleShellProps {
  children: ReactNode;
  role: ConsoleRole;
  activeRoute?: ConsoleRouteDefinition | null;
  moduleLabels: Record<ConsoleModuleId, string>;
  header?: ReactNode;
  hero?: ReactNode;
  toolbar?: ReactNode;
  stageClassName?: string;
  stageContentClassName?: string;
}

export function ConsoleShell({
  children,
  role,
  activeRoute,
  moduleLabels,
  header,
  hero,
  toolbar,
  stageClassName,
  stageContentClassName,
}: ConsoleShellProps) {
  const navItems = getVisibleConsoleModules(role).map((module) => {
    const firstVisibleRoute = getVisibleConsoleRoutes({
      moduleId: module.id,
      role,
    })[0];

    return {
      id: module.id,
      href: firstVisibleRoute?.href ?? "/dashboard",
      label: moduleLabels[module.id],
      active: activeRoute?.moduleId === module.id,
    };
  });

  return (
    <div data-slot="console-shell" className="min-h-[var(--cch-viewport-height,100vh)] bg-background">
      {header ? <div data-slot="console-header">{header}</div> : null}

      <div className="space-y-6">
        <ConsoleNav items={navItems} />

        {hero ? <div data-slot="console-hero">{hero}</div> : null}
        {toolbar ? <div data-slot="console-toolbar">{toolbar}</div> : null}

        <ConsoleStage
          className={stageClassName}
          contentClassName={stageContentClassName}
          fullBleed={Boolean(activeRoute?.fullBleed)}
        >
          {children}
        </ConsoleStage>
      </div>
    </div>
  );
}

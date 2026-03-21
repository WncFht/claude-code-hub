import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { ConsoleStage } from "@/components/console/console-stage";
import type { ConsoleRuntimeRouteDefinition } from "@/lib/console/runtime-route-map";
import { cn } from "@/lib/utils";
import { ConsoleHeader } from "./console-header";
import { type ConsoleModuleTabItem, ConsoleModuleTabs } from "./console-module-tabs";
import { ConsoleSidebar, type ConsoleSidebarItem } from "./console-sidebar";

interface ConsoleShellProps {
  siteTitle: string;
  currentPath: string;
  activeModuleLabel: string;
  activeScreenLabel: string;
  activeRoute: ConsoleRuntimeRouteDefinition;
  direction: number;
  navigationItems: ConsoleSidebarItem[];
  moduleTabs: ConsoleModuleTabItem[];
  toolbar?: ReactNode;
  children: ReactNode;
}

export function ConsoleShell({
  siteTitle,
  currentPath,
  activeModuleLabel,
  activeScreenLabel,
  activeRoute,
  direction,
  navigationItems,
  moduleTabs,
  toolbar,
  children,
}: ConsoleShellProps) {
  return (
    <div
      data-slot="console-shell"
      className="relative min-h-[var(--cch-viewport-height,100vh)] overflow-hidden bg-background"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[4%] top-0 h-64 w-64 rounded-full bg-primary/10 opacity-70"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[8%] top-16 h-72 w-72 rounded-full bg-amber-500/10 opacity-70"
      />
      <div className="relative mx-auto flex w-full max-w-[1520px] flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:gap-7 lg:py-6">
        <ConsoleSidebar items={navigationItems} />

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <ConsoleHeader
            siteTitle={siteTitle}
            activeModuleLabel={activeModuleLabel}
            activeScreenLabel={activeScreenLabel}
            currentPath={currentPath}
            direction={direction}
          />

          <AnimatePresence initial={false} mode="wait">
            {moduleTabs.length > 1 ? (
              <motion.div
                key={activeRoute.moduleId}
                data-slot="console-module-tabs-transition"
                data-module-id={activeRoute.moduleId}
                initial={{
                  opacity: 0,
                  y: 16,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <ConsoleModuleTabs items={moduleTabs} />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <AnimatePresence initial={false} mode="wait">
            {toolbar ? (
              <motion.div
                key={activeRoute.screenId}
                data-slot="console-toolbar-transition"
                data-screen-id={activeRoute.screenId}
                initial={{
                  opacity: 0,
                  y: 18,
                  scale: 0.98,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  y: -12,
                  scale: 0.98,
                }}
                transition={{
                  duration: 0.3,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                <div data-slot="console-toolbar-row">{toolbar}</div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <ConsoleStage
            fullBleed={activeRoute.fullBleed}
            className="min-w-0 flex-1 overflow-hidden rounded-[32px] border border-border/70 bg-card/80 shadow-[0_24px_80px_rgba(15,23,42,0.08)]"
            contentClassName={activeRoute.fullBleed ? undefined : "px-5 py-5 md:px-7 md:py-7"}
          >
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.div
                key={activeRoute.screenId}
                data-slot="console-stage-transition"
                data-screen-id={activeRoute.screenId}
                data-direction={String(direction)}
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                }}
                transition={{
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1,
                }}
                className={cn("min-h-0", activeRoute.fullBleed && "h-full")}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </ConsoleStage>
        </div>
      </div>
    </div>
  );
}

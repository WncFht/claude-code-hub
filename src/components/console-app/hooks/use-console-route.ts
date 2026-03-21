"use client";

import { usePathname } from "@/i18n/routing";
import type { ConsoleBootstrapPayload } from "@/lib/console/console-bootstrap";
import { resolveConsoleRuntimeRoute } from "@/lib/console/runtime-route-map";

function isConsolePath(pathname: unknown): pathname is string {
  return typeof pathname === "string" && pathname.startsWith("/console");
}

export function useConsoleRoute(bootstrap: ConsoleBootstrapPayload) {
  const pathname = usePathname();
  const currentPath = isConsolePath(pathname) ? pathname : bootstrap.currentPath;
  const activeRoute = resolveConsoleRuntimeRoute(currentPath) ?? bootstrap.activeRoute;

  return {
    currentPath,
    activeRoute,
  };
}

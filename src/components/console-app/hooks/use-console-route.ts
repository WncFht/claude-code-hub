"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "@/i18n/routing";
import type { ConsoleBootstrapPayload } from "@/lib/console/console-bootstrap";
import {
  getConsoleRuntimeRouteOrder,
  resolveConsoleRuntimeRoute,
} from "@/lib/console/runtime-route-map";

function isConsolePath(pathname: unknown): pathname is string {
  return typeof pathname === "string" && pathname.startsWith("/console");
}

export function useConsoleRoute(bootstrap: ConsoleBootstrapPayload) {
  const pathname = usePathname();
  const currentPath = isConsolePath(pathname) ? pathname : bootstrap.currentPath;
  const activeRoute = resolveConsoleRuntimeRoute(currentPath) ?? bootstrap.activeRoute;
  const previousScreenIdRef = useRef(activeRoute.screenId);
  const previousScreenId = previousScreenIdRef.current;
  const currentOrder = getConsoleRuntimeRouteOrder(activeRoute.screenId);
  const previousOrder = getConsoleRuntimeRouteOrder(previousScreenId);
  const direction =
    previousScreenId === activeRoute.screenId ? 0 : currentOrder >= previousOrder ? 1 : -1;

  useEffect(() => {
    previousScreenIdRef.current = activeRoute.screenId;
  }, [activeRoute.screenId]);

  return {
    currentPath,
    activeRoute,
    direction,
  };
}

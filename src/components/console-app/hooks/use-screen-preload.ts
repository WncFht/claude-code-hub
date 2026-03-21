"use client";

import { resolveConsoleRuntimeRoute } from "@/lib/console/runtime-route-map";
import { preloadConsoleRuntimeScreen } from "@/lib/console/runtime-screen-registry";

export function useScreenPreload(pathname: string) {
  return () => {
    const route = resolveConsoleRuntimeRoute(pathname);

    if (!route) {
      return;
    }

    void preloadConsoleRuntimeScreen(route.screenId);
  };
}

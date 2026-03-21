"use client";

import { useQueryClient } from "@tanstack/react-query";
import { resolveConsoleRuntimeRoute } from "@/lib/console/runtime-route-map";
import { preloadConsoleRuntimeScreen } from "@/lib/console/runtime-screen-registry";

export function useScreenPreload(pathname: string) {
  const queryClient = useQueryClient();

  return () => {
    const route = resolveConsoleRuntimeRoute(pathname);

    if (!route) {
      return;
    }

    void preloadConsoleRuntimeScreen(route.screenId, {
      pathname,
      queryClient,
    });
  };
}

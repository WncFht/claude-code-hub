"use client";

import { Suspense } from "react";
import type { ConsoleBootstrapPayload } from "@/lib/console/console-bootstrap";
import type { ConsoleRuntimeRouteDefinition } from "@/lib/console/runtime-route-map";
import {
  getConsoleInitialRuntimeScreen,
  getConsoleRuntimeScreen,
} from "@/lib/console/runtime-screen-registry";

interface ConsoleScreenLoaderProps {
  bootstrap: ConsoleBootstrapPayload;
  activeRoute: ConsoleRuntimeRouteDefinition;
}

export function ConsoleScreenLoader({ bootstrap, activeRoute }: ConsoleScreenLoaderProps) {
  const initialScreen =
    activeRoute.screenId === bootstrap.activeRoute.screenId
      ? getConsoleInitialRuntimeScreen(activeRoute.screenId)
      : null;

  if (initialScreen) {
    const InitialScreenComponent = initialScreen;

    return <InitialScreenComponent bootstrap={bootstrap} route={activeRoute} />;
  }

  const screen = getConsoleRuntimeScreen(activeRoute.screenId);
  const ScreenComponent = screen.Component;

  return (
    <Suspense
      fallback={
        <div
          data-slot="console-screen-fallback"
          data-screen-id={activeRoute.screenId}
          className="h-full min-h-64 rounded-[24px] border border-dashed border-border/70 bg-card/60"
        />
      }
    >
      <ScreenComponent bootstrap={bootstrap} route={activeRoute} />
    </Suspense>
  );
}

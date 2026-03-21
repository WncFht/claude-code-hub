"use client";

import { type ComponentType, type LazyExoticComponent, lazy } from "react";
import type { ConsoleBootstrapPayload } from "./console-bootstrap";
import type { ConsoleRuntimeRouteDefinition } from "./runtime-route-map";

export interface ConsoleRuntimeScreenProps {
  bootstrap: ConsoleBootstrapPayload;
  route: ConsoleRuntimeRouteDefinition;
}

export interface ConsoleLazyScreenModule {
  default: ComponentType<ConsoleRuntimeScreenProps>;
}

export interface ConsoleLazyScreen {
  Component: LazyExoticComponent<ComponentType<ConsoleRuntimeScreenProps>>;
  load: () => Promise<ConsoleLazyScreenModule>;
  preload: () => Promise<ConsoleLazyScreenModule>;
}

export function createLazyScreen(
  loader: () => Promise<ConsoleLazyScreenModule>
): ConsoleLazyScreen {
  let pending: Promise<ConsoleLazyScreenModule> | null = null;

  const load = () => {
    if (!pending) {
      pending = loader();
    }

    return pending;
  };

  return {
    Component: lazy(load),
    load,
    preload: load,
  };
}

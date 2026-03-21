"use client";

import { type ComponentType, createElement } from "react";
import {
  type ConsoleLazyScreen,
  type ConsoleRuntimeScreenProps,
  createLazyScreen,
} from "./lazy-screen";
import {
  CONSOLE_RUNTIME_ROUTES,
  type ConsoleRuntimeRouteDefinition,
  type ConsoleScreenId,
} from "./runtime-route-map";

const MIGRATED_SCREEN_LOADERS: Partial<
  Record<ConsoleScreenId, () => Promise<{ default: ComponentType<ConsoleRuntimeScreenProps> }>>
> = {
  "overview-home": () =>
    import("../../components/console-app/screens/overview/overview-home-screen"),
  "overview-leaderboard": () =>
    import("../../components/console-app/screens/overview/overview-leaderboard-screen"),
  "overview-user-insights": () =>
    import("../../components/console-app/screens/overview/overview-user-insights-screen"),
  "overview-availability": () =>
    import("../../components/console-app/screens/overview/overview-availability-screen"),
  "traffic-logs": () => import("../../components/console-app/screens/traffic/traffic-logs-screen"),
  "traffic-users": () =>
    import("../../components/console-app/screens/traffic/traffic-users-screen"),
  "traffic-sessions": () =>
    import("../../components/console-app/screens/traffic/traffic-sessions-screen"),
  "traffic-session-messages": () =>
    import("../../components/console-app/screens/traffic/traffic-session-messages-screen"),
  "traffic-rate-limits": () =>
    import("../../components/console-app/screens/traffic/traffic-rate-limits-screen"),
  "traffic-quotas": () =>
    import("../../components/console-app/screens/traffic/traffic-quota-screen"),
  "traffic-my-quota": () =>
    import("../../components/console-app/screens/traffic/traffic-quota-screen"),
  "providers-inventory": () =>
    import("../../components/console-app/screens/providers/providers-inventory-screen"),
  "providers-pricing": () =>
    import("../../components/console-app/screens/providers/providers-pricing-screen"),
  "policy-sensitive-words": () =>
    import("../../components/console-app/screens/policy/policy-sensitive-words-screen"),
  "policy-error-rules": () =>
    import("../../components/console-app/screens/policy/policy-error-rules-screen"),
  "policy-request-filters": () =>
    import("../../components/console-app/screens/policy/policy-request-filters-screen"),
  "policy-client-versions": () =>
    import("../../components/console-app/screens/policy/policy-client-versions-screen"),
  "system-config": () => import("../../components/console-app/screens/system/system-config-screen"),
  "system-data": () => import("../../components/console-app/screens/system/system-data-screen"),
  "system-notifications": () =>
    import("../../components/console-app/screens/system/system-notifications-screen"),
  "system-logs": () => import("../../components/console-app/screens/system/system-logs-screen"),
};

function createPlaceholderScreen(
  screenId: ConsoleScreenId
): ComponentType<ConsoleRuntimeScreenProps> {
  return function ConsolePlaceholderScreen({ route }: ConsoleRuntimeScreenProps) {
    return createElement("section", {
      "data-slot": "console-screen",
      "data-screen-id": screenId,
      "data-module-id": route.moduleId,
      className: "h-full rounded-[24px] border border-dashed border-border/70 bg-card/60",
    });
  };
}

const ROUTE_BY_SCREEN_ID = new Map<ConsoleScreenId, ConsoleRuntimeRouteDefinition>(
  CONSOLE_RUNTIME_ROUTES.map((route) => [route.screenId, route])
);

const SCREEN_REGISTRY = Object.fromEntries(
  CONSOLE_RUNTIME_ROUTES.map((route) => [
    route.screenId,
    createLazyScreen(
      MIGRATED_SCREEN_LOADERS[route.screenId] ??
        (async () => ({
          default: createPlaceholderScreen(route.screenId),
        }))
    ),
  ])
) as Record<ConsoleScreenId, ConsoleLazyScreen>;

export function getConsoleRuntimeScreen(screenId: ConsoleScreenId) {
  return SCREEN_REGISTRY[screenId];
}

export function preloadConsoleRuntimeScreen(screenId: ConsoleScreenId) {
  return getConsoleRuntimeScreen(screenId).preload();
}

export function getConsoleRuntimeRoute(screenId: ConsoleScreenId) {
  return ROUTE_BY_SCREEN_ID.get(screenId) ?? null;
}

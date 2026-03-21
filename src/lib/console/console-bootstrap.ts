import { mapLegacyConsolePath } from "./legacy-route-map";
import type { ConsoleRole } from "./module-registry";
import {
  type ConsoleRuntimeRouteDefinition,
  getDefaultConsolePath,
  resolveConsoleRuntimeRoute,
} from "./runtime-route-map";

export interface BuildConsoleBootstrapInput {
  locale: string;
  pathname: string;
  role: ConsoleRole;
  siteTitle?: string;
}

export interface ConsoleBootstrapPayload {
  locale: string;
  role: ConsoleRole;
  requestedPath: string;
  currentPath: string;
  defaultPath: string;
  activeRoute: ConsoleRuntimeRouteDefinition;
  siteTitle: string;
}

export function buildConsoleBootstrap({
  locale,
  pathname,
  role,
  siteTitle = "Claude Code Hub",
}: BuildConsoleBootstrapInput): ConsoleBootstrapPayload {
  const requestedPath = pathname;
  const defaultPath = getDefaultConsolePath(role);
  const normalizedPath = mapLegacyConsolePath(pathname) ?? pathname;
  const activeRoute =
    resolveConsoleRuntimeRoute(normalizedPath) ?? resolveConsoleRuntimeRoute(defaultPath);

  if (!activeRoute) {
    throw new Error(`Unable to resolve console bootstrap route for role ${role}`);
  }

  return {
    locale,
    role,
    requestedPath,
    currentPath: activeRoute.consolePath,
    defaultPath,
    activeRoute,
    siteTitle,
  };
}

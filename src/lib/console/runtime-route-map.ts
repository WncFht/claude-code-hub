import type { ConsoleModuleId, ConsoleRole } from "./module-registry";

export type ConsoleRuntimeMatchKind = "exact" | "prefix" | "session-messages";

export type ConsoleScreenId =
  | "overview-home"
  | "overview-leaderboard"
  | "overview-availability"
  | "traffic-logs"
  | "traffic-users"
  | "traffic-sessions"
  | "traffic-session-messages"
  | "traffic-quotas"
  | "traffic-my-quota"
  | "providers-inventory"
  | "providers-pricing"
  | "policy-sensitive-words"
  | "policy-error-rules"
  | "policy-request-filters"
  | "policy-client-versions"
  | "system-config"
  | "system-data"
  | "system-notifications"
  | "system-logs";

export interface ConsoleRuntimeRouteDefinition {
  screenId: ConsoleScreenId;
  moduleId: ConsoleModuleId;
  consolePath: string;
  visibleForRoles: ConsoleRole[];
  matchKind: ConsoleRuntimeMatchKind;
  fullBleed: boolean;
  legacyPaths: string[];
}

export const CONSOLE_RUNTIME_ROUTES: ConsoleRuntimeRouteDefinition[] = [
  {
    screenId: "overview-home",
    moduleId: "overview",
    consolePath: "/console/overview",
    visibleForRoles: ["admin", "user"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/dashboard"],
  },
  {
    screenId: "overview-leaderboard",
    moduleId: "overview",
    consolePath: "/console/overview/leaderboard",
    visibleForRoles: ["admin", "user"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/dashboard/leaderboard"],
  },
  {
    screenId: "overview-availability",
    moduleId: "overview",
    consolePath: "/console/overview/availability",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/dashboard/availability"],
  },
  {
    screenId: "traffic-logs",
    moduleId: "traffic",
    consolePath: "/console/traffic/logs",
    visibleForRoles: ["admin", "user"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/dashboard/logs"],
  },
  {
    screenId: "traffic-users",
    moduleId: "traffic",
    consolePath: "/console/traffic/users",
    visibleForRoles: ["admin", "user"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/dashboard/users"],
  },
  {
    screenId: "traffic-sessions",
    moduleId: "traffic",
    consolePath: "/console/traffic/sessions",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/dashboard/sessions"],
  },
  {
    screenId: "traffic-session-messages",
    moduleId: "traffic",
    consolePath: "/console/traffic/sessions",
    visibleForRoles: ["admin"],
    matchKind: "session-messages",
    fullBleed: true,
    legacyPaths: ["/dashboard/sessions"],
  },
  {
    screenId: "traffic-quotas",
    moduleId: "traffic",
    consolePath: "/console/traffic/quotas",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
    fullBleed: false,
    legacyPaths: ["/dashboard/quotas"],
  },
  {
    screenId: "traffic-my-quota",
    moduleId: "traffic",
    consolePath: "/console/traffic/my-quota",
    visibleForRoles: ["user"],
    matchKind: "prefix",
    fullBleed: false,
    legacyPaths: ["/dashboard/my-quota"],
  },
  {
    screenId: "providers-inventory",
    moduleId: "providers",
    consolePath: "/console/providers/inventory",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/dashboard/providers", "/settings/providers"],
  },
  {
    screenId: "providers-pricing",
    moduleId: "providers",
    consolePath: "/console/providers/pricing",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/settings/prices"],
  },
  {
    screenId: "policy-sensitive-words",
    moduleId: "policy",
    consolePath: "/console/policy/sensitive-words",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/settings/sensitive-words"],
  },
  {
    screenId: "policy-error-rules",
    moduleId: "policy",
    consolePath: "/console/policy/error-rules",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/settings/error-rules"],
  },
  {
    screenId: "policy-request-filters",
    moduleId: "policy",
    consolePath: "/console/policy/request-filters",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/settings/request-filters"],
  },
  {
    screenId: "policy-client-versions",
    moduleId: "policy",
    consolePath: "/console/policy/client-versions",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/settings/client-versions"],
  },
  {
    screenId: "system-config",
    moduleId: "system",
    consolePath: "/console/system/config",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/settings", "/settings/config"],
  },
  {
    screenId: "system-data",
    moduleId: "system",
    consolePath: "/console/system/data",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/settings/data"],
  },
  {
    screenId: "system-notifications",
    moduleId: "system",
    consolePath: "/console/system/notifications",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/settings/notifications"],
  },
  {
    screenId: "system-logs",
    moduleId: "system",
    consolePath: "/console/system/logs",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    fullBleed: false,
    legacyPaths: ["/settings/logs"],
  },
];

const DEFAULT_CONSOLE_PATH_BY_ROLE: Record<ConsoleRole, string> = {
  admin: "/console/overview",
  user: "/console/overview",
};

function normalizePath(pathname: string) {
  const trimmed = (pathname.split("?")[0]?.split("#")[0] ?? "").trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

function matchesRuntimeRoute(
  route: ConsoleRuntimeRouteDefinition,
  normalizedPath: string
) {
  if (route.matchKind === "exact") {
    return normalizedPath === route.consolePath;
  }

  if (route.matchKind === "prefix") {
    return (
      normalizedPath === route.consolePath ||
      normalizedPath.startsWith(`${route.consolePath}/`)
    );
  }

  return (
    normalizedPath.includes("/console/traffic/sessions/") &&
    normalizedPath.endsWith("/messages")
  );
}

export function getDefaultConsolePath(role: ConsoleRole) {
  return DEFAULT_CONSOLE_PATH_BY_ROLE[role];
}

export function resolveConsoleRuntimeRoute(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  return CONSOLE_RUNTIME_ROUTES.find((route) => matchesRuntimeRoute(route, normalizedPath)) ?? null;
}

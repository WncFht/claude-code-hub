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

export type ConsoleRuntimeLabelKind = "console" | "settings-nav";

export interface ConsoleRuntimeRouteDefinition {
  screenId: ConsoleScreenId;
  moduleId: ConsoleModuleId;
  consolePath: string;
  labelKind: ConsoleRuntimeLabelKind;
  labelKey: string;
  visibleForRoles: ConsoleRole[];
  matchKind: ConsoleRuntimeMatchKind;
  secondaryTabId?: string;
  fullBleed: boolean;
  legacyPaths: string[];
}

export const CONSOLE_RUNTIME_ROUTES: ConsoleRuntimeRouteDefinition[] = [
  {
    screenId: "overview-home",
    moduleId: "overview",
    consolePath: "/console/overview",
    labelKind: "console",
    labelKey: "dashboard",
    visibleForRoles: ["admin", "user"],
    matchKind: "exact",
    secondaryTabId: "home",
    fullBleed: false,
    legacyPaths: ["/dashboard"],
  },
  {
    screenId: "overview-leaderboard",
    moduleId: "overview",
    consolePath: "/console/overview/leaderboard",
    labelKind: "console",
    labelKey: "leaderboard",
    visibleForRoles: ["admin", "user"],
    matchKind: "exact",
    secondaryTabId: "leaderboard",
    fullBleed: false,
    legacyPaths: ["/dashboard/leaderboard"],
  },
  {
    screenId: "overview-availability",
    moduleId: "overview",
    consolePath: "/console/overview/availability",
    labelKind: "console",
    labelKey: "availability",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "availability",
    fullBleed: false,
    legacyPaths: ["/dashboard/availability"],
  },
  {
    screenId: "traffic-logs",
    moduleId: "traffic",
    consolePath: "/console/traffic/logs",
    labelKind: "console",
    labelKey: "logs",
    visibleForRoles: ["admin", "user"],
    matchKind: "exact",
    secondaryTabId: "logs",
    fullBleed: false,
    legacyPaths: ["/dashboard/logs"],
  },
  {
    screenId: "traffic-users",
    moduleId: "traffic",
    consolePath: "/console/traffic/users",
    labelKind: "console",
    labelKey: "users",
    visibleForRoles: ["admin", "user"],
    matchKind: "exact",
    secondaryTabId: "users",
    fullBleed: false,
    legacyPaths: ["/dashboard/users"],
  },
  {
    screenId: "traffic-sessions",
    moduleId: "traffic",
    consolePath: "/console/traffic/sessions",
    labelKind: "console",
    labelKey: "sessions",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "sessions",
    fullBleed: false,
    legacyPaths: ["/dashboard/sessions"],
  },
  {
    screenId: "traffic-session-messages",
    moduleId: "traffic",
    consolePath: "/console/traffic/sessions",
    labelKind: "console",
    labelKey: "sessions",
    visibleForRoles: ["admin"],
    matchKind: "session-messages",
    secondaryTabId: "sessions",
    fullBleed: true,
    legacyPaths: ["/dashboard/sessions"],
  },
  {
    screenId: "traffic-quotas",
    moduleId: "traffic",
    consolePath: "/console/traffic/quotas",
    labelKind: "console",
    labelKey: "quotas",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
    secondaryTabId: "quotas",
    fullBleed: false,
    legacyPaths: ["/dashboard/quotas"],
  },
  {
    screenId: "traffic-my-quota",
    moduleId: "traffic",
    consolePath: "/console/traffic/my-quota",
    labelKind: "console",
    labelKey: "myQuota",
    visibleForRoles: ["user"],
    matchKind: "prefix",
    secondaryTabId: "my-quota",
    fullBleed: false,
    legacyPaths: ["/dashboard/my-quota"],
  },
  {
    screenId: "providers-inventory",
    moduleId: "providers",
    consolePath: "/console/providers/inventory",
    labelKind: "settings-nav",
    labelKey: "providers",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "inventory",
    fullBleed: false,
    legacyPaths: ["/dashboard/providers", "/settings/providers"],
  },
  {
    screenId: "providers-pricing",
    moduleId: "providers",
    consolePath: "/console/providers/pricing",
    labelKind: "settings-nav",
    labelKey: "prices",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "pricing",
    fullBleed: false,
    legacyPaths: ["/settings/prices"],
  },
  {
    screenId: "policy-sensitive-words",
    moduleId: "policy",
    consolePath: "/console/policy/sensitive-words",
    labelKind: "settings-nav",
    labelKey: "sensitiveWords",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "sensitive-words",
    fullBleed: false,
    legacyPaths: ["/settings/sensitive-words"],
  },
  {
    screenId: "policy-error-rules",
    moduleId: "policy",
    consolePath: "/console/policy/error-rules",
    labelKind: "settings-nav",
    labelKey: "errorRules",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "error-rules",
    fullBleed: false,
    legacyPaths: ["/settings/error-rules"],
  },
  {
    screenId: "policy-request-filters",
    moduleId: "policy",
    consolePath: "/console/policy/request-filters",
    labelKind: "settings-nav",
    labelKey: "requestFilters",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "request-filters",
    fullBleed: false,
    legacyPaths: ["/settings/request-filters"],
  },
  {
    screenId: "policy-client-versions",
    moduleId: "policy",
    consolePath: "/console/policy/client-versions",
    labelKind: "settings-nav",
    labelKey: "clientVersions",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "client-versions",
    fullBleed: false,
    legacyPaths: ["/settings/client-versions"],
  },
  {
    screenId: "system-config",
    moduleId: "system",
    consolePath: "/console/system/config",
    labelKind: "settings-nav",
    labelKey: "config",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "config",
    fullBleed: false,
    legacyPaths: ["/settings", "/settings/config"],
  },
  {
    screenId: "system-data",
    moduleId: "system",
    consolePath: "/console/system/data",
    labelKind: "settings-nav",
    labelKey: "data",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "data",
    fullBleed: false,
    legacyPaths: ["/settings/data"],
  },
  {
    screenId: "system-notifications",
    moduleId: "system",
    consolePath: "/console/system/notifications",
    labelKind: "settings-nav",
    labelKey: "notifications",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "notifications",
    fullBleed: false,
    legacyPaths: ["/settings/notifications"],
  },
  {
    screenId: "system-logs",
    moduleId: "system",
    consolePath: "/console/system/logs",
    labelKind: "settings-nav",
    labelKey: "logs",
    visibleForRoles: ["admin"],
    matchKind: "exact",
    secondaryTabId: "logs",
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

function matchesRuntimeRoute(route: ConsoleRuntimeRouteDefinition, normalizedPath: string) {
  if (route.matchKind === "exact") {
    return normalizedPath === route.consolePath;
  }

  if (route.matchKind === "prefix") {
    return (
      normalizedPath === route.consolePath || normalizedPath.startsWith(`${route.consolePath}/`)
    );
  }

  return (
    normalizedPath.includes("/console/traffic/sessions/") && normalizedPath.endsWith("/messages")
  );
}

export function getDefaultConsolePath(role: ConsoleRole) {
  return DEFAULT_CONSOLE_PATH_BY_ROLE[role];
}

export function resolveConsoleRuntimeRoute(pathname: string) {
  const normalizedPath = normalizePath(pathname);
  return CONSOLE_RUNTIME_ROUTES.find((route) => matchesRuntimeRoute(route, normalizedPath)) ?? null;
}

export function getVisibleConsoleRuntimeModuleTabs({
  moduleId,
  role,
}: {
  moduleId: ConsoleModuleId;
  role: ConsoleRole;
}) {
  const tabs = new Map<string, ConsoleRuntimeRouteDefinition>();

  for (const route of CONSOLE_RUNTIME_ROUTES) {
    if (
      route.moduleId !== moduleId ||
      !route.secondaryTabId ||
      !route.visibleForRoles.includes(role) ||
      tabs.has(route.secondaryTabId)
    ) {
      continue;
    }

    tabs.set(route.secondaryTabId, route);
  }

  return [...tabs.values()];
}

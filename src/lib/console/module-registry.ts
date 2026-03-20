export type ConsoleRole = "admin" | "user";
export type ConsoleModuleId = "overview" | "traffic" | "providers" | "policy" | "system";
export type ConsoleMatchKind = "exact" | "prefix" | "session-messages";

export interface ConsoleModuleDefinition {
  id: ConsoleModuleId;
  labelKey: string;
  iconName: string;
}

export interface ConsoleRouteDefinition {
  id: string;
  moduleId: ConsoleModuleId;
  href: string;
  labelKey: string;
  visibleForRoles: ConsoleRole[];
  matchKind: ConsoleMatchKind;
  fullBleed?: boolean;
}

export const CONSOLE_MODULES: ConsoleModuleDefinition[] = [
  { id: "overview", labelKey: "console.modules.overview", iconName: "layout-dashboard" },
  { id: "traffic", labelKey: "console.modules.traffic", iconName: "activity" },
  { id: "providers", labelKey: "console.modules.providers", iconName: "database" },
  { id: "policy", labelKey: "console.modules.policy", iconName: "shield" },
  { id: "system", labelKey: "console.modules.system", iconName: "settings-2" },
];

export const CONSOLE_ROUTES: ConsoleRouteDefinition[] = [
  {
    id: "overview-home",
    moduleId: "overview",
    href: "/dashboard",
    labelKey: "console.routes.dashboard",
    visibleForRoles: ["admin", "user"],
    matchKind: "exact",
  },
  {
    id: "overview-leaderboard",
    moduleId: "overview",
    href: "/dashboard/leaderboard",
    labelKey: "console.routes.leaderboard",
    visibleForRoles: ["admin", "user"],
    matchKind: "prefix",
  },
  {
    id: "overview-availability",
    moduleId: "overview",
    href: "/dashboard/availability",
    labelKey: "console.routes.availability",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "traffic-logs",
    moduleId: "traffic",
    href: "/dashboard/logs",
    labelKey: "console.routes.logs",
    visibleForRoles: ["admin", "user"],
    matchKind: "prefix",
  },
  {
    id: "traffic-session-messages",
    moduleId: "traffic",
    href: "/dashboard/sessions",
    labelKey: "console.routes.sessions",
    visibleForRoles: ["admin", "user"],
    matchKind: "session-messages",
    fullBleed: true,
  },
  {
    id: "traffic-quotas",
    moduleId: "traffic",
    href: "/dashboard/quotas",
    labelKey: "console.routes.quotas",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "traffic-my-quota",
    moduleId: "traffic",
    href: "/dashboard/my-quota",
    labelKey: "console.routes.myQuota",
    visibleForRoles: ["user"],
    matchKind: "prefix",
  },
  {
    id: "traffic-users",
    moduleId: "traffic",
    href: "/dashboard/users",
    labelKey: "console.routes.users",
    visibleForRoles: ["admin", "user"],
    matchKind: "prefix",
  },
  {
    id: "providers-dashboard",
    moduleId: "providers",
    href: "/dashboard/providers",
    labelKey: "console.routes.providers",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "providers-settings",
    moduleId: "providers",
    href: "/settings/providers",
    labelKey: "console.routes.providersInventory",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "providers-prices",
    moduleId: "providers",
    href: "/settings/prices",
    labelKey: "console.routes.prices",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "policy-sensitive-words",
    moduleId: "policy",
    href: "/settings/sensitive-words",
    labelKey: "console.routes.sensitiveWords",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "policy-error-rules",
    moduleId: "policy",
    href: "/settings/error-rules",
    labelKey: "console.routes.errorRules",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "policy-request-filters",
    moduleId: "policy",
    href: "/settings/request-filters",
    labelKey: "console.routes.requestFilters",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "policy-client-versions",
    moduleId: "policy",
    href: "/settings/client-versions",
    labelKey: "console.routes.clientVersions",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "system-config",
    moduleId: "system",
    href: "/settings/config",
    labelKey: "console.routes.config",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "system-data",
    moduleId: "system",
    href: "/settings/data",
    labelKey: "console.routes.data",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "system-logs",
    moduleId: "system",
    href: "/settings/logs",
    labelKey: "console.routes.systemLogs",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
  {
    id: "system-notifications",
    moduleId: "system",
    href: "/settings/notifications",
    labelKey: "console.routes.notifications",
    visibleForRoles: ["admin"],
    matchKind: "prefix",
  },
];

function normalizePathname(pathname: string) {
  const withoutQuery = pathname.split("?")[0]?.split("#")[0] ?? "";
  const normalized = withoutQuery.trim();

  if (!normalized || normalized === "/") {
    return "/";
  }

  return normalized.endsWith("/") ? normalized.slice(0, -1) : normalized;
}

function matchesRoute(pathname: string, route: ConsoleRouteDefinition) {
  if (route.matchKind === "exact") {
    return pathname === route.href;
  }

  if (route.matchKind === "prefix") {
    return pathname === route.href || pathname.startsWith(`${route.href}/`);
  }

  return pathname.includes("/dashboard/sessions/") && pathname.endsWith("/messages");
}

export function resolveConsoleRoute(pathname: string) {
  const normalizedPathname = normalizePathname(pathname);
  return CONSOLE_ROUTES.find((route) => matchesRoute(normalizedPathname, route));
}

export function getVisibleConsoleRoutes({
  moduleId,
  role,
}: {
  moduleId?: ConsoleModuleId;
  role: ConsoleRole;
}) {
  return CONSOLE_ROUTES.filter((route) => {
    if (moduleId && route.moduleId !== moduleId) {
      return false;
    }

    return route.visibleForRoles.includes(role);
  });
}

export function getVisibleConsoleModules(role: ConsoleRole) {
  const visibleModuleIds = new Set(
    getVisibleConsoleRoutes({ role }).map((route) => route.moduleId)
  );
  return CONSOLE_MODULES.filter((module) => visibleModuleIds.has(module.id));
}

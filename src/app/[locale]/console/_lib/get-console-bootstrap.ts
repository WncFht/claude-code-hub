import {
  buildConsoleBootstrap,
  type ConsoleBootstrapPayload,
} from "@/lib/console/console-bootstrap";
import type { ConsoleRole } from "@/lib/console/module-registry";
import { getDefaultConsolePath } from "@/lib/console/runtime-route-map";
import { getSystemSettings } from "@/repository/system-config";

export interface GetConsoleBootstrapInput {
  locale: string;
  role: ConsoleRole;
  slug?: string[];
}

function getRequestedConsolePath(role: ConsoleRole, slug?: string[]) {
  if (!slug || slug.length === 0) {
    return getDefaultConsolePath(role);
  }

  return `/console/${slug.join("/")}`;
}

export async function getConsoleBootstrap({
  locale,
  role,
  slug,
}: GetConsoleBootstrapInput): Promise<ConsoleBootstrapPayload> {
  const requestedPath = getRequestedConsolePath(role, slug);
  const systemSettings = await getSystemSettings();
  const siteTitle = systemSettings.siteTitle?.trim() || "Claude Code Hub";
  const bootstrap = buildConsoleBootstrap({
    locale,
    pathname: requestedPath,
    role,
    siteTitle,
  });

  if (bootstrap.activeRoute.visibleForRoles.includes(role)) {
    return bootstrap;
  }

  return buildConsoleBootstrap({
    locale,
    pathname: getDefaultConsolePath(role),
    role,
    siteTitle,
  });
}

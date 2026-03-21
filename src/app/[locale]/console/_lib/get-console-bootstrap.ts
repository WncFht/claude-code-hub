import {
  buildConsoleBootstrap,
  type ConsoleBootstrapPayload,
} from "@/lib/console/console-bootstrap";
import type { ConsoleRole } from "@/lib/console/module-registry";
import { getDefaultConsolePath } from "@/lib/console/runtime-route-map";

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

export function getConsoleBootstrap({
  locale,
  role,
  slug,
}: GetConsoleBootstrapInput): ConsoleBootstrapPayload {
  const requestedPath = getRequestedConsolePath(role, slug);
  const bootstrap = buildConsoleBootstrap({
    locale,
    pathname: requestedPath,
    role,
  });

  if (bootstrap.activeRoute.visibleForRoles.includes(role)) {
    return bootstrap;
  }

  return buildConsoleBootstrap({
    locale,
    pathname: getDefaultConsolePath(role),
    role,
  });
}

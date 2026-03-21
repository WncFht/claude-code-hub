import { redirect } from "@/i18n/routing";
import { getSession } from "@/lib/auth";
import { mapLegacyConsolePath } from "./legacy-route-map";
import { getDefaultConsolePath, resolveConsoleRuntimeRoute } from "./runtime-route-map";

type LegacySearchParams = Record<string, string | string[] | undefined>;

function appendSearchParams(pathname: string, searchParams?: LegacySearchParams) {
  if (!searchParams) {
    return pathname;
  }

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === "undefined") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        query.append(key, item);
      }
      continue;
    }

    query.set(key, value);
  }

  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export async function redirectLegacyConsoleRoute({
  locale,
  legacyPath,
  searchParams,
}: {
  locale: string;
  legacyPath: string;
  searchParams?: LegacySearchParams;
}) {
  const session = await getSession();
  const requestedConsolePath = mapLegacyConsolePath(legacyPath) ?? "/console/overview";

  if (!session) {
    return redirect({
      href: `/login?from=${appendSearchParams(requestedConsolePath, searchParams)}`,
      locale,
    });
  }

  if (session.user.role !== "admin" && !session.key.canLoginWebUi) {
    return redirect({ href: "/my-usage", locale });
  }

  const role = session.user.role === "admin" ? "admin" : "user";
  const route = resolveConsoleRuntimeRoute(requestedConsolePath);
  const redirectPath = route?.visibleForRoles.includes(role)
    ? requestedConsolePath
    : getDefaultConsolePath(role);

  return redirect({
    href: appendSearchParams(redirectPath, searchParams),
    locale,
  });
}

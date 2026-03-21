import { CONSOLE_RUNTIME_ROUTES } from "./runtime-route-map";

function normalizePath(pathname: string) {
  const trimmed = (pathname.split("?")[0]?.split("#")[0] ?? "").trim();
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function mapLegacyConsolePath(pathname: string) {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath.includes("/dashboard/sessions/") && normalizedPath.endsWith("/messages")) {
    return normalizedPath.replace("/dashboard/sessions/", "/console/traffic/sessions/");
  }

  for (const route of CONSOLE_RUNTIME_ROUTES) {
    for (const legacyPath of route.legacyPaths) {
      if (normalizedPath === legacyPath) {
        return route.consolePath;
      }

      if (route.matchKind === "prefix" && normalizedPath.startsWith(`${legacyPath}/`)) {
        return normalizedPath.replace(legacyPath, route.consolePath);
      }
    }
  }

  return null;
}

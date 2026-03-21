export type ConsoleQuotaSubview = "users" | "providers" | "keys";

export function resolveConsoleQuotaSubview(pathname: string): ConsoleQuotaSubview {
  if (pathname.endsWith("/providers")) {
    return "providers";
  }

  if (pathname.endsWith("/keys")) {
    return "keys";
  }

  return "users";
}

export function resolveConsoleOverviewUserId(pathname: string) {
  const match = pathname.match(/\/console\/overview\/leaderboard\/users\/(\d+)(?:\/|$)/);
  return match ? Number(match[1]) : null;
}

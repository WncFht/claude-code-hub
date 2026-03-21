import { redirectLegacyConsoleRoute } from "@/lib/console/legacy-route-redirect";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);

  return redirectLegacyConsoleRoute({
    locale,
    legacyPath: "/dashboard/leaderboard",
    searchParams: resolvedSearchParams,
  });
}

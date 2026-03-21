import { redirectLegacyConsoleRoute } from "@/lib/console/legacy-route-redirect";

export const dynamic = "force-dynamic";

export default async function UserInsightsPage({
  params,
}: {
  params: Promise<{ locale: string; userId: string }>;
}) {
  const { locale, userId } = await params;

  return redirectLegacyConsoleRoute({
    locale,
    legacyPath: `/dashboard/leaderboard/user/${userId}`,
  });
}

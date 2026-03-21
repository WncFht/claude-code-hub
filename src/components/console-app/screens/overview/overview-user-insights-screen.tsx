"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useMemo } from "react";
import { UserInsightsView } from "@/app/[locale]/dashboard/leaderboard/user/[userId]/_components/user-insights-view";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { Section } from "@/components/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, usePathname } from "@/i18n/routing";
import type { ConsoleRuntimeScreenProps } from "@/lib/console/lazy-screen";
import { resolveConsoleOverviewUserId } from "../../console-screen-paths";
import { getConsoleUserInsightsQueryOptions } from "../../console-screen-query-options";

function UserInsightsSkeleton() {
  return <div className="min-h-64 rounded-xl border border-dashed border-border/60 bg-card/40" />;
}

function UserInsightsFallbackState({ invalidPath }: { invalidPath: boolean }) {
  return (
    <Section>
      <Card data-slot="overview-user-insights-state">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            dashboard.leaderboard.userInsights.title
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>dashboard.leaderboard.permission.restricted</AlertTitle>
            <AlertDescription>
              {invalidPath
                ? "dashboard.leaderboard.userInsights.invalidUser"
                : "dashboard.leaderboard.userInsights.userNotFound"}
            </AlertDescription>
          </Alert>

          <Link
            href="/console/overview/leaderboard"
            className="inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            dashboard.leaderboard.userInsights.backToLeaderboard
          </Link>
        </CardContent>
      </Card>
    </Section>
  );
}

export default function OverviewUserInsightsScreen({ route }: ConsoleRuntimeScreenProps) {
  const pathname = usePathname() ?? route.consolePath;
  const userId = useMemo(() => resolveConsoleOverviewUserId(pathname), [pathname]);
  const { data, isLoading } = useQuery({
    ...(userId === null
      ? getConsoleUserInsightsQueryOptions(0)
      : getConsoleUserInsightsQueryOptions(userId)),
    enabled: userId !== null,
    refetchOnWindowFocus: false,
  });

  return (
    <div data-slot="console-screen" data-screen-id="overview-user-insights">
      <ConsoleScreenStage screenId="overview-user-insights">
        {userId === null ? (
          <UserInsightsFallbackState invalidPath={true} />
        ) : isLoading ? (
          <UserInsightsSkeleton />
        ) : data ? (
          <UserInsightsView userId={data.userId} userName={data.userName} />
        ) : (
          <UserInsightsFallbackState invalidPath={false} />
        )}
      </ConsoleScreenStage>
    </div>
  );
}

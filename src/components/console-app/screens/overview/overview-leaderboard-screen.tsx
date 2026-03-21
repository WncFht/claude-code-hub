"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { LeaderboardView } from "@/app/[locale]/dashboard/leaderboard/_components/leaderboard-view";
import { Section } from "@/components/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/routing";
import { getConsoleDashboardContext } from "../../adapters/dashboard-bootstrap";

function LeaderboardPermissionState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Section>
      <Card data-slot="leaderboard-permission-state">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            dashboard.leaderboard.permission.title
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>dashboard.leaderboard.permission.restricted</AlertTitle>
            <AlertDescription>
              dashboard.leaderboard.permission.description
              {isAdmin ? (
                <span>
                  {" "}
                  <Link href="/console/system/config" className="font-medium underline">
                    dashboard.leaderboard.permission.systemSettings
                  </Link>{" "}
                  dashboard.leaderboard.permission.adminAction
                </span>
              ) : (
                <span> dashboard.leaderboard.permission.userAction</span>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  );
}

export default function OverviewLeaderboardScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["console-dashboard-context"],
    queryFn: getConsoleDashboardContext,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const isAdmin = data?.currentUser.role === "admin";
  const canViewLeaderboard = Boolean(isAdmin || data?.systemSettings.allowGlobalUsageView);

  return (
    <div data-slot="console-screen" data-screen-id="overview-leaderboard">
      <div data-slot="overview-leaderboard-screen">
        {isLoading || !data ? null : canViewLeaderboard ? (
          <LeaderboardView isAdmin={isAdmin} />
        ) : (
          <LeaderboardPermissionState isAdmin={isAdmin} />
        )}
      </div>
    </div>
  );
}

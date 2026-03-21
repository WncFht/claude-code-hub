"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { AvailabilityDashboard } from "@/app/[locale]/dashboard/availability/_components/availability-dashboard";
import { AvailabilityDashboardSkeleton } from "@/app/[locale]/dashboard/availability/_components/availability-skeleton";
import { Section } from "@/components/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getConsoleDashboardContext } from "../../adapters/dashboard-bootstrap";

function AvailabilityPermissionState() {
  return (
    <Section>
      <Card data-slot="availability-permission-state">
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
            <AlertDescription>dashboard.leaderboard.permission.userAction</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </Section>
  );
}

export default function OverviewAvailabilityScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["console-dashboard-context"],
    queryFn: getConsoleDashboardContext,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const isAdmin = data?.currentUser.role === "admin";

  return (
    <div data-slot="console-screen" data-screen-id="overview-availability">
      <div data-slot="overview-availability-screen">
        {isLoading || !data ? (
          <AvailabilityDashboardSkeleton />
        ) : isAdmin ? (
          <AvailabilityDashboard />
        ) : (
          <AvailabilityPermissionState />
        )}
      </div>
    </div>
  );
}

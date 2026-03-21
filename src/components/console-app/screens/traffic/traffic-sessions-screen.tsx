"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { ActiveSessionsClient } from "@/app/[locale]/dashboard/sessions/_components/active-sessions-client";
import SessionsLoading from "@/app/[locale]/dashboard/sessions/loading";
import { Section } from "@/components/section";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getConsoleDashboardContext } from "../../adapters/dashboard-bootstrap";

function SessionsPermissionState() {
  return (
    <Section>
      <Card data-slot="traffic-sessions-permission-state">
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

export default function TrafficSessionsScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["console-dashboard-context"],
    queryFn: getConsoleDashboardContext,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  return (
    <div data-slot="console-screen" data-screen-id="traffic-sessions">
      <div data-slot="traffic-sessions-screen">
        {isLoading || !data ? (
          <SessionsLoading />
        ) : data.currentUser.role === "admin" ? (
          <ActiveSessionsClient
            sessionDetailHrefBuilder={(sessionId) =>
              `/console/traffic/sessions/${sessionId}/messages`
            }
          />
        ) : (
          <SessionsPermissionState />
        )}
      </div>
    </div>
  );
}

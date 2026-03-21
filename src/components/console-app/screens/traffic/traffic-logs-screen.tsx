"use client";

import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { ActiveSessionsSkeleton } from "@/app/[locale]/dashboard/logs/_components/active-sessions-skeleton";
import { UsageLogsSkeleton } from "@/app/[locale]/dashboard/logs/_components/usage-logs-skeleton";
import { UsageLogsViewVirtualized } from "@/app/[locale]/dashboard/logs/_components/usage-logs-view-virtualized";
import { ActiveSessionsList } from "@/components/customs/active-sessions-list";
import { getConsoleDashboardContext } from "../../adapters/dashboard-bootstrap";

function buildSearchParamsRecord(searchParams: URLSearchParams) {
  const result: Record<string, string | string[] | undefined> = {};

  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    result[key] = values.length <= 1 ? values[0] : values;
  }

  return result;
}

export default function TrafficLogsScreen() {
  const searchParams = useSearchParams();
  const { data, isLoading } = useQuery({
    queryKey: ["console-dashboard-context"],
    queryFn: getConsoleDashboardContext,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  const resolvedSearchParams = useMemo(() => buildSearchParamsRecord(searchParams), [searchParams]);

  return (
    <div data-slot="console-screen" data-screen-id="traffic-logs">
      <div data-slot="traffic-logs-screen" className="space-y-4">
        {isLoading || !data ? (
          <>
            <ActiveSessionsSkeleton />
            <UsageLogsSkeleton />
          </>
        ) : (
          <>
            <ActiveSessionsList
              currencyCode={data.systemSettings.currencyDisplay}
              maxHeight="200px"
              showTokensCost={false}
              viewAllHref="/console/traffic/sessions"
              sessionDetailHrefBuilder={(sessionId) =>
                `/console/traffic/sessions/${sessionId}/messages`
              }
            />

            <UsageLogsViewVirtualized
              isAdmin={data.currentUser.role === "admin"}
              userId={data.currentUser.id}
              searchParams={resolvedSearchParams}
              currencyCode={data.systemSettings.currencyDisplay}
              billingModelSource={data.systemSettings.billingModelSource}
              serverTimeZone={data.serverTimeZone}
              basePath="/console/traffic/logs"
            />
          </>
        )}
      </div>
    </div>
  );
}

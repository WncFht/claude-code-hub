"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardBento } from "@/app/[locale]/dashboard/_components/bento/dashboard-bento";
import { DashboardOverviewSkeleton } from "@/app/[locale]/dashboard/_components/dashboard-skeletons";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { getConsoleDashboardContextQueryOptions } from "../../console-screen-query-options";

export default function OverviewHomeScreen() {
  const { data, isLoading } = useQuery({
    ...getConsoleDashboardContextQueryOptions(),
    refetchOnWindowFocus: false,
  });

  return (
    <div data-slot="console-screen" data-screen-id="overview-home">
      <ConsoleScreenStage screenId="overview-home">
        {isLoading || !data ? (
          <DashboardOverviewSkeleton />
        ) : (
          <DashboardBento
            isAdmin={data.currentUser.role === "admin"}
            currencyCode={data.systemSettings.currencyDisplay}
            allowGlobalUsageView={data.systemSettings.allowGlobalUsageView}
          />
        )}
      </ConsoleScreenStage>
    </div>
  );
}

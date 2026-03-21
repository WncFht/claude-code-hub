"use client";

import { useQuery } from "@tanstack/react-query";
import { DashboardBento } from "@/app/[locale]/dashboard/_components/bento/dashboard-bento";
import { DashboardOverviewSkeleton } from "@/app/[locale]/dashboard/_components/dashboard-skeletons";
import { getConsoleDashboardContext } from "../../adapters/dashboard-bootstrap";

export default function OverviewHomeScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["console-dashboard-context"],
    queryFn: getConsoleDashboardContext,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  return (
    <div data-slot="console-screen" data-screen-id="overview-home">
      <div data-slot="overview-home-screen">
        {isLoading || !data ? (
          <DashboardOverviewSkeleton />
        ) : (
          <DashboardBento
            isAdmin={data.currentUser.role === "admin"}
            currencyCode={data.systemSettings.currencyDisplay}
            allowGlobalUsageView={data.systemSettings.allowGlobalUsageView}
          />
        )}
      </div>
    </div>
  );
}

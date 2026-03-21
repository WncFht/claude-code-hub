"use client";

import { useQuery } from "@tanstack/react-query";
import { UsersPageSkeleton } from "@/app/[locale]/dashboard/users/_components/users-skeleton";
import { UsersPageClient } from "@/app/[locale]/dashboard/users/users-page-client";
import { getConsoleDashboardContext } from "../../adapters/dashboard-bootstrap";

export default function TrafficUsersScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["console-dashboard-context"],
    queryFn: getConsoleDashboardContext,
    refetchOnWindowFocus: false,
    staleTime: 30_000,
  });

  return (
    <div data-slot="console-screen" data-screen-id="traffic-users">
      <div data-slot="traffic-users-screen">
        {isLoading || !data ? (
          <UsersPageSkeleton />
        ) : (
          <UsersPageClient currentUser={data.currentUser} />
        )}
      </div>
    </div>
  );
}

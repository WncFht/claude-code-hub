"use client";

import { useQuery } from "@tanstack/react-query";
import { UsersPageSkeleton } from "@/app/[locale]/dashboard/users/_components/users-skeleton";
import { UsersPageClient } from "@/app/[locale]/dashboard/users/users-page-client";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import { getConsoleDashboardContextQueryOptions } from "../../console-screen-query-options";

export default function TrafficUsersScreen() {
  const { data, isLoading } = useQuery({
    ...getConsoleDashboardContextQueryOptions(),
    refetchOnWindowFocus: false,
  });

  return (
    <div data-slot="console-screen" data-screen-id="traffic-users">
      <ConsoleScreenStage screenId="traffic-users">
        {isLoading || !data ? (
          <UsersPageSkeleton />
        ) : (
          <UsersPageClient currentUser={data.currentUser} />
        )}
      </ConsoleScreenStage>
    </div>
  );
}

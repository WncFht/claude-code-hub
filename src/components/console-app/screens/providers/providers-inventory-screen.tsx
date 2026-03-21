"use client";

import { useQuery } from "@tanstack/react-query";
import { ProviderManagerLoader } from "@/app/[locale]/settings/providers/_components/provider-manager-loader";
import type { SortKey } from "@/app/[locale]/settings/providers/_components/provider-sort-dropdown";
import { ConsoleScreenStage } from "@/components/console-app/console-screen-stage";
import type { ConsoleRuntimeScreenProps } from "@/lib/console/lazy-screen";
import { getConsoleDashboardContextQueryOptions } from "../../console-screen-query-options";
import { useConsolePreferences } from "../../hooks/use-console-preferences";

export default function ProvidersInventoryScreen(_props: ConsoleRuntimeScreenProps) {
  const [viewMode, setViewMode] = useConsolePreferences<"list" | "vendor">(
    "providers-inventory",
    "viewMode",
    "list"
  );
  const [sortBy, setSortBy] = useConsolePreferences<SortKey>(
    "providers-inventory",
    "sortBy",
    "priority"
  );
  const { data } = useQuery({
    ...getConsoleDashboardContextQueryOptions(),
    refetchOnWindowFocus: false,
  });

  return (
    <div data-slot="console-screen" data-screen-id="providers-inventory">
      <ConsoleScreenStage screenId="providers-inventory">
        <ProviderManagerLoader
          currentUser={data?.currentUser}
          embedded={true}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </ConsoleScreenStage>
    </div>
  );
}

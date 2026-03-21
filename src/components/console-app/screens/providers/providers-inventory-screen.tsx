"use client";

import { ProviderManagerLoader } from "@/app/[locale]/settings/providers/_components/provider-manager-loader";
import type { SortKey } from "@/app/[locale]/settings/providers/_components/provider-sort-dropdown";
import { useConsolePreferences } from "../../hooks/use-console-preferences";

export default function ProvidersInventoryScreen() {
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

  return (
    <div data-slot="console-screen" data-screen-id="providers-inventory">
      <div data-slot="providers-inventory-screen">
        <ProviderManagerLoader
          embedded={true}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
      </div>
    </div>
  );
}

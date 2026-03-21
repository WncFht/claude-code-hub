"use client";

import { useQuery } from "@tanstack/react-query";
import type { User } from "@/types/user";
import { AddProviderDialog } from "./add-provider-dialog";
import { ProviderManager } from "./provider-manager";
import {
  getProviderManagerSystemSettingsQueryOptions,
  getProvidersHealthQueryOptions,
  getProvidersQueryOptions,
  getProvidersStatisticsQueryOptions,
  type ProviderHealthStatus,
} from "./provider-manager-data";
import type { SortKey } from "./provider-sort-dropdown";

interface ProviderManagerLoaderProps {
  currentUser?: User;
  enableMultiProviderTypes?: boolean;
  embedded?: boolean;
  sortBy?: SortKey;
  onSortByChange?: (value: SortKey) => void;
  viewMode?: "list" | "vendor";
  onViewModeChange?: (value: "list" | "vendor") => void;
}

function ProviderManagerLoaderContent({
  currentUser,
  enableMultiProviderTypes = true,
  embedded = false,
  sortBy,
  onSortByChange,
  viewMode,
  onViewModeChange,
}: ProviderManagerLoaderProps) {
  const {
    data: providers = [],
    isLoading: isProvidersLoading,
    isFetching: isProvidersFetching,
  } = useQuery({
    ...getProvidersQueryOptions(),
    refetchOnWindowFocus: false,
  });

  const {
    data: healthStatus = {} as ProviderHealthStatus,
    isLoading: isHealthLoading,
    isFetching: isHealthFetching,
  } = useQuery<ProviderHealthStatus>({
    ...getProvidersHealthQueryOptions(),
    refetchOnWindowFocus: false,
  });

  // Statistics loaded independently with longer cache
  const { data: statistics = {}, isLoading: isStatisticsLoading } = useQuery({
    ...getProvidersStatisticsQueryOptions(),
    refetchOnWindowFocus: false,
    refetchInterval: 60_000,
  });

  const {
    data: systemSettings,
    isLoading: isSettingsLoading,
    isFetching: isSettingsFetching,
  } = useQuery({
    ...getProviderManagerSystemSettingsQueryOptions(),
    refetchOnWindowFocus: false,
  });

  const loading = isProvidersLoading || isHealthLoading || isSettingsLoading;
  const refreshing = !loading && (isProvidersFetching || isHealthFetching || isSettingsFetching);
  const currencyCode = systemSettings?.currencyDisplay ?? "USD";

  return (
    <ProviderManager
      providers={providers}
      currentUser={currentUser}
      healthStatus={healthStatus}
      statistics={statistics}
      statisticsLoading={isStatisticsLoading}
      currencyCode={currencyCode}
      enableMultiProviderTypes={enableMultiProviderTypes}
      loading={loading}
      refreshing={refreshing}
      addDialogSlot={<AddProviderDialog enableMultiProviderTypes={enableMultiProviderTypes} />}
      embedded={embedded}
      sortBy={sortBy}
      onSortByChange={onSortByChange}
      viewMode={viewMode}
      onViewModeChange={onViewModeChange}
    />
  );
}

export function ProviderManagerLoader(props: ProviderManagerLoaderProps) {
  return <ProviderManagerLoaderContent {...props} />;
}

import type { QueryClient } from "@tanstack/react-query";
import {
  DASHBOARD_BENTO_DEFAULT_TIME_RANGE,
  getActiveSessionsQueryOptions,
  getActivityStatisticsQueryOptions,
  getDashboardLeaderboardQueryOptions,
  getOverviewDataQueryOptions,
  getStatisticsQueryOptions,
} from "@/app/[locale]/dashboard/_components/bento/dashboard-bento-data";
import { getAvailabilityQueryOptions } from "@/app/[locale]/dashboard/availability/_components/availability-data";
import {
  getDefaultLeaderboardQueryParams,
  getLeaderboardGroupSuggestionsQueryOptions,
  getLeaderboardTableQueryOptions,
  getLeaderboardTagSuggestionsQueryOptions,
} from "@/app/[locale]/dashboard/leaderboard/_components/leaderboard-data";
import {
  getProviderManagerSystemSettingsQueryOptions,
  getProvidersHealthQueryOptions,
  getProvidersQueryOptions,
  getProvidersStatisticsQueryOptions,
  getProviderVendorsQueryOptions,
} from "@/app/[locale]/settings/providers/_components/provider-manager-data";
import type { ConsoleScreenId } from "@/lib/console/runtime-route-map";
import { resolveConsoleOverviewUserId, resolveConsoleQuotaSubview } from "./console-screen-paths";
import {
  getConsoleClientVersionsQueryOptions,
  getConsoleDashboardContextQueryOptions,
  getConsoleErrorRulesQueryOptions,
  getConsolePricesPageQueryOptions,
  getConsoleRequestFiltersQueryOptions,
  getConsoleSensitiveWordsQueryOptions,
  getConsoleSystemSettingsQueryOptions,
  getConsoleTrafficKeyQuotaQueryOptions,
  getConsoleTrafficQuotaQueryOptions,
  getConsoleUserInsightsQueryOptions,
} from "./console-screen-query-options";

export interface ConsoleScreenPreloadOptions {
  pathname?: string;
  queryClient?: QueryClient;
}

async function prefetchQuery(
  queryClient: QueryClient,
  options: Parameters<QueryClient["prefetchQuery"]>[0]
) {
  await queryClient.prefetchQuery(options);
}

async function preloadOverviewHome(queryClient: QueryClient) {
  const context = await queryClient.ensureQueryData(getConsoleDashboardContextQueryOptions());
  const canViewLeaderboard =
    context.currentUser.role === "admin" || context.systemSettings.allowGlobalUsageView;

  const prefetches: Promise<unknown>[] = [
    prefetchQuery(queryClient, getOverviewDataQueryOptions()),
    prefetchQuery(queryClient, getStatisticsQueryOptions(DASHBOARD_BENTO_DEFAULT_TIME_RANGE)),
    prefetchQuery(queryClient, getActivityStatisticsQueryOptions()),
  ];

  if (context.currentUser.role === "admin") {
    prefetches.push(prefetchQuery(queryClient, getActiveSessionsQueryOptions()));
  }

  if (canViewLeaderboard) {
    prefetches.push(prefetchQuery(queryClient, getDashboardLeaderboardQueryOptions("user")));
    prefetches.push(prefetchQuery(queryClient, getDashboardLeaderboardQueryOptions("provider")));
    prefetches.push(prefetchQuery(queryClient, getDashboardLeaderboardQueryOptions("model")));
  }

  await Promise.all(prefetches);
}

async function preloadOverviewLeaderboard(queryClient: QueryClient) {
  const context = await queryClient.ensureQueryData(getConsoleDashboardContextQueryOptions());
  const canViewLeaderboard =
    context.currentUser.role === "admin" || context.systemSettings.allowGlobalUsageView;

  if (!canViewLeaderboard) {
    return;
  }

  const prefetches: Promise<unknown>[] = [
    prefetchQuery(
      queryClient,
      getLeaderboardTableQueryOptions(
        getDefaultLeaderboardQueryParams(context.currentUser.role === "admin")
      )
    ),
  ];

  if (context.currentUser.role === "admin") {
    prefetches.push(prefetchQuery(queryClient, getLeaderboardTagSuggestionsQueryOptions()));
    prefetches.push(prefetchQuery(queryClient, getLeaderboardGroupSuggestionsQueryOptions()));
  }

  await Promise.all(prefetches);
}

async function preloadOverviewAvailability(queryClient: QueryClient) {
  const context = await queryClient.ensureQueryData(getConsoleDashboardContextQueryOptions());

  if (context.currentUser.role !== "admin") {
    return;
  }

  await prefetchQuery(queryClient, getAvailabilityQueryOptions("24h"));
}

async function preloadOverviewUserInsights(queryClient: QueryClient, pathname?: string) {
  const userId = pathname ? resolveConsoleOverviewUserId(pathname) : null;

  if (userId === null) {
    return;
  }

  await prefetchQuery(queryClient, getConsoleUserInsightsQueryOptions(userId));
}

async function preloadTrafficQuotas(
  queryClient: QueryClient,
  screenId: Extract<ConsoleScreenId, "traffic-quotas" | "traffic-my-quota">,
  pathname?: string
) {
  if (screenId === "traffic-my-quota") {
    await prefetchQuery(queryClient, getConsoleTrafficQuotaQueryOptions(screenId));
    return;
  }

  const subview = pathname ? resolveConsoleQuotaSubview(pathname) : "users";

  if (subview === "keys") {
    await prefetchQuery(queryClient, getConsoleTrafficKeyQuotaQueryOptions(subview));
    return;
  }

  await prefetchQuery(queryClient, getConsoleTrafficQuotaQueryOptions(screenId));
}

async function preloadProvidersInventory(queryClient: QueryClient) {
  await queryClient.ensureQueryData(getConsoleDashboardContextQueryOptions());
  await Promise.all([
    prefetchQuery(queryClient, getProvidersQueryOptions()),
    prefetchQuery(queryClient, getProvidersHealthQueryOptions()),
    prefetchQuery(queryClient, getProvidersStatisticsQueryOptions()),
    prefetchQuery(queryClient, getProviderVendorsQueryOptions()),
    prefetchQuery(queryClient, getProviderManagerSystemSettingsQueryOptions()),
  ]);
}

export async function preloadConsoleScreenData(
  screenId: ConsoleScreenId,
  options: ConsoleScreenPreloadOptions = {}
) {
  const queryClient = options.queryClient;

  if (!queryClient) {
    return;
  }

  switch (screenId) {
    case "overview-home":
      await preloadOverviewHome(queryClient);
      return;
    case "overview-leaderboard":
      await preloadOverviewLeaderboard(queryClient);
      return;
    case "overview-availability":
      await preloadOverviewAvailability(queryClient);
      return;
    case "overview-user-insights":
      await preloadOverviewUserInsights(queryClient, options.pathname);
      return;
    case "traffic-logs":
    case "traffic-users":
    case "traffic-sessions":
      await queryClient.ensureQueryData(getConsoleDashboardContextQueryOptions());
      return;
    case "traffic-quotas":
    case "traffic-my-quota":
      await preloadTrafficQuotas(queryClient, screenId, options.pathname);
      return;
    case "providers-inventory":
      await preloadProvidersInventory(queryClient);
      return;
    case "providers-pricing":
      await prefetchQuery(queryClient, getConsolePricesPageQueryOptions());
      return;
    case "policy-sensitive-words":
      await prefetchQuery(queryClient, getConsoleSensitiveWordsQueryOptions());
      return;
    case "policy-error-rules":
      await prefetchQuery(queryClient, getConsoleErrorRulesQueryOptions());
      return;
    case "policy-request-filters":
      await prefetchQuery(queryClient, getConsoleRequestFiltersQueryOptions());
      return;
    case "policy-client-versions":
      await prefetchQuery(queryClient, getConsoleClientVersionsQueryOptions());
      return;
    case "system-config":
      await prefetchQuery(queryClient, getConsoleSystemSettingsQueryOptions());
      return;
    default:
      return;
  }
}

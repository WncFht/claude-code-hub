import "server-only";

import { type DehydratedState, dehydrate, QueryClient } from "@tanstack/react-query";
import {
  DASHBOARD_BENTO_DEFAULT_TIME_RANGE,
  type DashboardLeaderboardData,
  getActiveSessionsQueryOptions,
  getActivityStatisticsQueryOptions,
  getDashboardLeaderboardQueryOptions,
  getOverviewDataQueryOptions,
  getStatisticsQueryOptions,
} from "@/app/[locale]/dashboard/_components/bento/dashboard-bento-data";
import {
  getProviderManagerSystemSettingsQueryOptions,
  getProvidersHealthQueryOptions,
  getProvidersQueryOptions,
  getProvidersStatisticsQueryOptions,
  getProviderVendorsQueryOptions,
} from "@/app/[locale]/settings/providers/_components/provider-manager-data";
import { getConsoleDashboardContextQueryOptions } from "@/components/console-app/console-screen-query-options";
import { getLeaderboardWithCache } from "@/lib/redis";
import type {
  LeaderboardEntry,
  ModelLeaderboardEntry,
  ProviderLeaderboardEntry,
} from "@/repository/leaderboard";
import type { ConsoleBootstrapPayload } from "./console-bootstrap";

function createServerQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function mapDashboardLeaderboardData(
  scope: "user" | "provider" | "model",
  rawData: LeaderboardEntry[] | ProviderLeaderboardEntry[] | ModelLeaderboardEntry[]
): DashboardLeaderboardData[] {
  if (scope === "user") {
    return (rawData as LeaderboardEntry[]).map((item) => ({
      id: `user-${item.userId}`,
      name: item.userName ?? "",
      totalRequests: item.totalRequests ?? 0,
      totalTokens: item.totalTokens ?? 0,
      totalCost: item.totalCost ?? 0,
    }));
  }

  if (scope === "provider") {
    return (rawData as ProviderLeaderboardEntry[]).map((item) => ({
      id: `provider-${item.providerId}`,
      name: item.providerName ?? "",
      totalRequests: item.totalRequests ?? 0,
      totalTokens: item.totalTokens ?? 0,
      totalCost: item.totalCost ?? 0,
    }));
  }

  return (rawData as ModelLeaderboardEntry[]).map((item) => ({
    id: `model-${item.model}`,
    name: item.model ?? "",
    totalRequests: item.totalRequests ?? 0,
    totalTokens: item.totalTokens ?? 0,
    totalCost: item.totalCost ?? 0,
  }));
}

async function prefetchOverviewHome(queryClient: QueryClient) {
  const context = await queryClient.ensureQueryData(getConsoleDashboardContextQueryOptions());
  const canViewLeaderboard =
    context.currentUser.role === "admin" || context.systemSettings.allowGlobalUsageView;

  await Promise.all([
    queryClient.prefetchQuery(getOverviewDataQueryOptions()),
    queryClient.prefetchQuery(getStatisticsQueryOptions(DASHBOARD_BENTO_DEFAULT_TIME_RANGE)),
    queryClient.prefetchQuery(getActivityStatisticsQueryOptions()),
  ]);

  if (context.currentUser.role === "admin") {
    await queryClient.prefetchQuery(getActiveSessionsQueryOptions());
  }

  if (!canViewLeaderboard) {
    return;
  }

  const [userLeaderboard, providerLeaderboard, modelLeaderboard] = await Promise.all([
    getLeaderboardWithCache("daily", context.systemSettings.currencyDisplay, "user"),
    getLeaderboardWithCache("daily", context.systemSettings.currencyDisplay, "provider"),
    getLeaderboardWithCache("daily", context.systemSettings.currencyDisplay, "model"),
  ]);

  queryClient.setQueryData(
    getDashboardLeaderboardQueryOptions("user").queryKey,
    mapDashboardLeaderboardData("user", userLeaderboard as LeaderboardEntry[])
  );
  queryClient.setQueryData(
    getDashboardLeaderboardQueryOptions("provider").queryKey,
    mapDashboardLeaderboardData("provider", providerLeaderboard as ProviderLeaderboardEntry[])
  );
  queryClient.setQueryData(
    getDashboardLeaderboardQueryOptions("model").queryKey,
    mapDashboardLeaderboardData("model", modelLeaderboard as ModelLeaderboardEntry[])
  );
}

async function prefetchProvidersInventory(queryClient: QueryClient) {
  const context = await queryClient.ensureQueryData(getConsoleDashboardContextQueryOptions());

  await Promise.all([
    queryClient.prefetchQuery(getProvidersQueryOptions()),
    queryClient.prefetchQuery(getProvidersHealthQueryOptions()),
    queryClient.prefetchQuery(getProvidersStatisticsQueryOptions()),
    queryClient.prefetchQuery(getProviderVendorsQueryOptions()),
  ]);

  queryClient.setQueryData(getProviderManagerSystemSettingsQueryOptions().queryKey, {
    currencyDisplay: context.systemSettings.currencyDisplay,
  });
}

export async function prefetchConsoleInitialRouteData(
  queryClient: QueryClient,
  bootstrap: ConsoleBootstrapPayload
) {
  switch (bootstrap.activeRoute.screenId) {
    case "overview-home":
      await prefetchOverviewHome(queryClient);
      return;
    case "providers-inventory":
      await prefetchProvidersInventory(queryClient);
      return;
    default:
      return;
  }
}

export async function getConsoleRouteHydrationState(
  bootstrap: ConsoleBootstrapPayload
): Promise<DehydratedState | null> {
  const queryClient = createServerQueryClient();
  await prefetchConsoleInitialRouteData(queryClient, bootstrap);
  const dehydratedState = dehydrate(queryClient);

  return dehydratedState.queries.length > 0 ? dehydratedState : null;
}

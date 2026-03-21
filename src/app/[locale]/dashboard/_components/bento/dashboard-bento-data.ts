import { getActiveSessions } from "@/actions/active-sessions";
import type { OverviewData } from "@/actions/overview";
import { getOverviewData } from "@/actions/overview";
import { getUserStatistics } from "@/actions/statistics";
import type {
  LeaderboardEntry,
  ModelLeaderboardEntry,
  ProviderLeaderboardEntry,
} from "@/repository/leaderboard";
import type { ActiveSessionInfo } from "@/types/session";
import { DEFAULT_TIME_RANGE, type TimeRange, type UserStatisticsData } from "@/types/statistics";

export interface DashboardLeaderboardData {
  id: string | number;
  name: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
}

export const DASHBOARD_BENTO_DEFAULT_TIME_RANGE = DEFAULT_TIME_RANGE;
export const DASHBOARD_BENTO_ACTIVITY_TIME_RANGE = "30days";

export async function fetchOverviewData(): Promise<OverviewData> {
  const result = await getOverviewData();
  if (!result.ok) {
    throw new Error(result.error || "FETCH_OVERVIEW_FAILED");
  }
  return result.data;
}

export async function fetchActiveSessions(): Promise<ActiveSessionInfo[]> {
  const result = await getActiveSessions();
  if (!result.ok) {
    throw new Error(result.error || "FETCH_ACTIVE_SESSIONS_FAILED");
  }
  return result.data;
}

export async function fetchStatistics(timeRange: TimeRange): Promise<UserStatisticsData> {
  const result = await getUserStatistics(timeRange);
  if (!result.ok) {
    throw new Error(result.error || "FETCH_STATISTICS_FAILED");
  }
  return result.data;
}

export async function fetchDashboardLeaderboard(
  scope: "user" | "provider" | "model"
): Promise<DashboardLeaderboardData[]> {
  const response = await fetch(`/api/leaderboard?period=daily&scope=${scope}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("FETCH_LEADERBOARD_FAILED");
  }

  const data = await response.json();

  if (scope === "user") {
    return (data as LeaderboardEntry[]).map((item) => ({
      id: `user-${item.userId}`,
      name: item.userName ?? "",
      totalRequests: item.totalRequests ?? 0,
      totalTokens: item.totalTokens ?? 0,
      totalCost: item.totalCost ?? 0,
    }));
  }

  if (scope === "provider") {
    return (data as ProviderLeaderboardEntry[]).map((item) => ({
      id: `provider-${item.providerId}`,
      name: item.providerName ?? "",
      totalRequests: item.totalRequests ?? 0,
      totalTokens: item.totalTokens ?? 0,
      totalCost: item.totalCost ?? 0,
    }));
  }

  return (data as ModelLeaderboardEntry[]).map((item) => ({
    id: `model-${item.model}`,
    name: item.model ?? "",
    totalRequests: item.totalRequests ?? 0,
    totalTokens: item.totalTokens ?? 0,
    totalCost: item.totalCost ?? 0,
  }));
}

export function getOverviewDataQueryOptions() {
  return {
    queryKey: ["overview-data"],
    queryFn: fetchOverviewData,
    staleTime: 10_000,
  } as const;
}

export function getActiveSessionsQueryOptions() {
  return {
    queryKey: ["active-sessions"],
    queryFn: fetchActiveSessions,
    staleTime: 10_000,
  } as const;
}

export function getStatisticsQueryOptions(timeRange: TimeRange) {
  return {
    queryKey: ["statistics", timeRange],
    queryFn: () => fetchStatistics(timeRange),
    staleTime: 30_000,
  } as const;
}

export function getActivityStatisticsQueryOptions() {
  return {
    queryKey: ["statistics", "activity", DASHBOARD_BENTO_ACTIVITY_TIME_RANGE],
    queryFn: () => fetchStatistics(DASHBOARD_BENTO_ACTIVITY_TIME_RANGE),
    staleTime: 60_000,
  } as const;
}

export function getDashboardLeaderboardQueryOptions(scope: "user" | "provider" | "model") {
  return {
    queryKey: ["leaderboard", scope],
    queryFn: () => fetchDashboardLeaderboard(scope),
    staleTime: 60_000,
  } as const;
}

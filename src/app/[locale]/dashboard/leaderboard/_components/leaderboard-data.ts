import { getAllUserKeyGroups, getAllUserTags } from "@/actions/users";
import type {
  DateRangeParams,
  LeaderboardEntry,
  LeaderboardPeriod,
  ModelCacheHitStat,
  ModelLeaderboardEntry,
  ModelProviderStat,
  ProviderCacheHitRateLeaderboardEntry,
  ProviderLeaderboardEntry,
  UserModelStat,
} from "@/repository/leaderboard";
import type { ProviderType } from "@/types/provider";

export type LeaderboardViewScope = "user" | "provider" | "providerCacheHitRate" | "model";

type TotalCostFormattedFields = { totalCostFormatted?: string };
type ProviderCostFormattedFields = {
  totalCostFormatted?: string;
  avgCostPerRequestFormatted?: string | null;
  avgCostPerMillionTokensFormatted?: string | null;
};

export type UserEntry = LeaderboardEntry &
  TotalCostFormattedFields & {
    modelStats?: UserModelStatClient[];
  };
export type UserModelStatClient = UserModelStat & TotalCostFormattedFields;
export type ModelEntry = ModelLeaderboardEntry & TotalCostFormattedFields;
export type ModelProviderStatClient = ModelProviderStat & ProviderCostFormattedFields;
export type ProviderEntry = Omit<ProviderLeaderboardEntry, "modelStats"> &
  ProviderCostFormattedFields & {
    modelStats?: ModelProviderStatClient[];
  };
export type ProviderCacheHitRateEntry = ProviderCacheHitRateLeaderboardEntry;
export type ProviderCacheHitRateTableRow = ProviderCacheHitRateEntry | ModelCacheHitStat;
export type LeaderboardTableEntry =
  | UserEntry
  | UserModelStatClient
  | ProviderEntry
  | ModelProviderStatClient
  | ProviderCacheHitRateEntry
  | ModelCacheHitStat
  | ModelEntry;

export interface LeaderboardQueryParams {
  scope: LeaderboardViewScope;
  period: LeaderboardPeriod;
  dateRange?: DateRangeParams;
  providerTypeFilter: ProviderType | "all";
  userTagFilters: string[];
  userGroupFilters: string[];
  isAdmin: boolean;
}

export function getDefaultLeaderboardQueryParams(isAdmin: boolean): LeaderboardQueryParams {
  return {
    scope: "user",
    period: "daily",
    dateRange: undefined,
    providerTypeFilter: "all",
    userTagFilters: [],
    userGroupFilters: [],
    isAdmin,
  };
}

export function buildLeaderboardUrl(params: LeaderboardQueryParams) {
  const searchParams = new URLSearchParams({
    period: params.period,
    scope: params.scope,
  });

  if (params.period === "custom" && params.dateRange) {
    searchParams.set("startDate", params.dateRange.startDate);
    searchParams.set("endDate", params.dateRange.endDate);
  }

  if (
    (params.scope === "provider" || params.scope === "providerCacheHitRate") &&
    params.providerTypeFilter !== "all"
  ) {
    searchParams.set("providerType", params.providerTypeFilter);
  }

  if (params.scope === "provider") {
    searchParams.set("includeModelStats", "1");
  }

  if (params.scope === "user" && params.isAdmin) {
    searchParams.set("includeUserModelStats", "1");
  }

  if (params.scope === "user" && params.userTagFilters.length > 0) {
    searchParams.set("userTags", params.userTagFilters.join(","));
  }

  if (params.scope === "user" && params.userGroupFilters.length > 0) {
    searchParams.set("userGroups", params.userGroupFilters.join(","));
  }

  return `/api/leaderboard?${searchParams.toString()}`;
}

export async function fetchLeaderboardTableData(
  params: LeaderboardQueryParams
): Promise<LeaderboardTableEntry[]> {
  const response = await fetch(buildLeaderboardUrl(params));

  if (!response.ok) {
    throw new Error("FETCH_LEADERBOARD_FAILED");
  }

  return response.json() as Promise<LeaderboardTableEntry[]>;
}

export function getLeaderboardTableQueryOptions(params: LeaderboardQueryParams) {
  return {
    queryKey: ["leaderboard-view", params],
    queryFn: () => fetchLeaderboardTableData(params),
    staleTime: 30_000,
  } as const;
}

async function fetchLeaderboardTagSuggestions() {
  const result = await getAllUserTags();

  if (!result.ok) {
    throw new Error(result.error || "FETCH_LEADERBOARD_TAGS_FAILED");
  }

  return result.data;
}

async function fetchLeaderboardGroupSuggestions() {
  const result = await getAllUserKeyGroups();

  if (!result.ok) {
    throw new Error(result.error || "FETCH_LEADERBOARD_GROUPS_FAILED");
  }

  return result.data;
}

export function getLeaderboardTagSuggestionsQueryOptions() {
  return {
    queryKey: ["leaderboard-user-tags"],
    queryFn: fetchLeaderboardTagSuggestions,
    staleTime: 60_000,
  } as const;
}

export function getLeaderboardGroupSuggestionsQueryOptions() {
  return {
    queryKey: ["leaderboard-user-groups"],
    queryFn: fetchLeaderboardGroupSuggestions,
    staleTime: 60_000,
  } as const;
}

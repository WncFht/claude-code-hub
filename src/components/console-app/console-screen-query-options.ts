import type { ConsoleScreenId } from "@/lib/console/runtime-route-map";
import type { SystemSettings } from "@/types/system-config";
import {
  getConsoleDashboardContext,
  getConsoleLeaderboardUserContext,
  getConsoleTrafficKeyQuotaData,
  getConsoleTrafficQuotaData,
} from "./adapters/dashboard-bootstrap";
import {
  getConsoleClientVersionsData,
  getConsoleErrorRulesData,
  getConsoleRequestFiltersData,
  getConsoleSensitiveWordsData,
} from "./adapters/policy-bootstrap";

export interface PricesPagePayload {
  data: unknown[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchConsolePricesPage(): Promise<PricesPagePayload> {
  const response = await fetch("/api/prices?page=1&pageSize=50");

  if (!response.ok) {
    throw new Error("FETCH_PRICES_FAILED");
  }

  const result = (await response.json()) as {
    ok: boolean;
    data?: PricesPagePayload;
    error?: string;
  };

  if (!result.ok || !result.data) {
    throw new Error(result.error || "FETCH_PRICES_FAILED");
  }

  return result.data;
}

export async function fetchConsoleSystemSettings(): Promise<SystemSettings> {
  const response = await fetch("/api/system-settings");

  if (!response.ok) {
    throw new Error("FETCH_SYSTEM_SETTINGS_FAILED");
  }

  return response.json() as Promise<SystemSettings>;
}

export function getConsoleDashboardContextQueryOptions() {
  return {
    queryKey: ["console-dashboard-context"],
    queryFn: getConsoleDashboardContext,
    staleTime: 30_000,
  } as const;
}

export function getConsolePricesPageQueryOptions() {
  return {
    queryKey: ["console-prices-page"],
    queryFn: fetchConsolePricesPage,
    staleTime: 30_000,
  } as const;
}

export function getConsoleSystemSettingsQueryOptions() {
  return {
    queryKey: ["console-system-settings"],
    queryFn: fetchConsoleSystemSettings,
    staleTime: 30_000,
  } as const;
}

export function getConsoleSensitiveWordsQueryOptions() {
  return {
    queryKey: ["console-policy-sensitive-words"],
    queryFn: getConsoleSensitiveWordsData,
    staleTime: 30_000,
  } as const;
}

export function getConsoleErrorRulesQueryOptions() {
  return {
    queryKey: ["console-policy-error-rules"],
    queryFn: getConsoleErrorRulesData,
    staleTime: 30_000,
  } as const;
}

export function getConsoleRequestFiltersQueryOptions() {
  return {
    queryKey: ["console-policy-request-filters"],
    queryFn: getConsoleRequestFiltersData,
    staleTime: 30_000,
  } as const;
}

export function getConsoleClientVersionsQueryOptions() {
  return {
    queryKey: ["console-policy-client-versions"],
    queryFn: getConsoleClientVersionsData,
    staleTime: 30_000,
  } as const;
}

export function getConsoleTrafficQuotaQueryOptions(screenId: ConsoleScreenId) {
  return {
    queryKey: ["console-traffic-quota-data", screenId],
    queryFn: getConsoleTrafficQuotaData,
    staleTime: 30_000,
  } as const;
}

export function getConsoleTrafficKeyQuotaQueryOptions(subview: string) {
  return {
    queryKey: ["console-traffic-key-quota-data", subview],
    queryFn: getConsoleTrafficKeyQuotaData,
    staleTime: 30_000,
  } as const;
}

export function getConsoleUserInsightsQueryOptions(userId: number) {
  return {
    queryKey: ["console-overview-user-insights", userId],
    queryFn: () => getConsoleLeaderboardUserContext(userId),
    staleTime: 30_000,
  } as const;
}

import { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";
import {
  DASHBOARD_BENTO_DEFAULT_TIME_RANGE,
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
import { buildConsoleBootstrap } from "@/lib/console/console-bootstrap";

const mocks = vi.hoisted(() => ({
  getConsoleDashboardContext: vi.fn(async () => ({
    currentUser: {
      id: 1,
      name: "admin",
      description: "",
      role: "admin" as const,
      rpm: null,
      dailyQuota: null,
      providerGroup: null,
      tags: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      dailyResetMode: "fixed" as const,
      dailyResetTime: "00:00",
      isEnabled: true,
    },
    systemSettings: {
      allowGlobalUsageView: true,
      billingModelSource: "system" as const,
      currencyDisplay: "USD" as const,
    },
    serverTimeZone: "UTC",
  })),
  getOverviewData: vi.fn(async () => ({
    ok: true as const,
    data: {
      concurrentSessions: 2,
      todayRequests: 12,
      todayCost: 3.45,
      avgResponseTime: 780,
      todayErrorRate: 0.1,
      yesterdaySamePeriodRequests: 10,
      yesterdaySamePeriodCost: 2.9,
      yesterdaySamePeriodAvgResponseTime: 800,
      recentMinuteRequests: 4,
    },
  })),
  getUserStatistics: vi.fn(async (timeRange: string) => ({
    ok: true as const,
    data: {
      chartData: [{ date: "2026-03-21T00:00:00.000Z", "user-1_cost": 3.45, "user-1_calls": 12 }],
      users: [{ id: 1, name: "admin", dataKey: "user-1" }],
      timeRange,
      resolution: timeRange === DASHBOARD_BENTO_DEFAULT_TIME_RANGE ? "hour" : "day",
      mode: "users" as const,
    },
  })),
  getActiveSessions: vi.fn(async () => ({
    ok: true as const,
    data: [],
  })),
  getLeaderboardWithCache: vi.fn(async (_period: string, _currency: string, scope: string) => {
    if (scope === "user") {
      return [{ userId: 7, userName: "alice", totalRequests: 9, totalTokens: 99, totalCost: 1.23 }];
    }
    if (scope === "provider") {
      return [
        {
          providerId: 8,
          providerName: "Provider A",
          totalRequests: 8,
          totalTokens: 88,
          totalCost: 2.34,
        },
      ];
    }
    return [{ model: "gpt-5.4", totalRequests: 7, totalTokens: 77, totalCost: 3.45 }];
  }),
  getProviders: vi.fn(async () => []),
  getProvidersHealthStatus: vi.fn(async () => ({
    11: {
      circuitState: "closed" as const,
      failureCount: 0,
      lastFailureTime: null,
      circuitOpenUntil: null,
      recoveryMinutes: null,
    },
  })),
  getProviderStatisticsAsync: vi.fn(async () => ({ 11: { requestCount: 20 } })),
  getProviderVendors: vi.fn(async () => []),
}));

vi.mock("@/components/console-app/adapters/dashboard-bootstrap", () => ({
  getConsoleDashboardContext: mocks.getConsoleDashboardContext,
  getConsoleLeaderboardUserContext: vi.fn(),
  getConsoleTrafficQuotaData: vi.fn(),
  getConsoleTrafficKeyQuotaData: vi.fn(),
}));

vi.mock("@/actions/overview", () => ({
  getOverviewData: mocks.getOverviewData,
}));

vi.mock("@/actions/statistics", () => ({
  getUserStatistics: mocks.getUserStatistics,
}));

vi.mock("@/actions/active-sessions", () => ({
  getActiveSessions: mocks.getActiveSessions,
}));

vi.mock("@/lib/redis", () => ({
  getLeaderboardWithCache: mocks.getLeaderboardWithCache,
}));

vi.mock("@/actions/providers", () => ({
  getProviders: mocks.getProviders,
  getProvidersHealthStatus: mocks.getProvidersHealthStatus,
  getProviderStatisticsAsync: mocks.getProviderStatisticsAsync,
}));

vi.mock("@/actions/provider-endpoints", () => ({
  getProviderVendors: mocks.getProviderVendors,
}));

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

describe("console route hydration prefetch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("prefetches overview-home cache entries for the initial console route", async () => {
    const queryClient = createQueryClient();
    const { prefetchConsoleInitialRouteData } = await import(
      "@/lib/console/console-route-hydration"
    );

    await prefetchConsoleInitialRouteData(
      queryClient,
      buildConsoleBootstrap({
        locale: "en",
        pathname: "/console/overview",
        role: "admin",
      })
    );

    expect(
      queryClient.getQueryData(getConsoleDashboardContextQueryOptions().queryKey)
    ).toMatchObject({
      currentUser: { role: "admin" },
      systemSettings: { currencyDisplay: "USD" },
    });
    expect(queryClient.getQueryData(getOverviewDataQueryOptions().queryKey)).toMatchObject({
      todayRequests: 12,
      todayCost: 3.45,
    });
    expect(
      queryClient.getQueryData(
        getStatisticsQueryOptions(DASHBOARD_BENTO_DEFAULT_TIME_RANGE).queryKey
      )
    ).toMatchObject({
      timeRange: DASHBOARD_BENTO_DEFAULT_TIME_RANGE,
    });
    expect(queryClient.getQueryData(getActivityStatisticsQueryOptions().queryKey)).toMatchObject({
      timeRange: "30days",
    });
    expect(queryClient.getQueryData(getActiveSessionsQueryOptions().queryKey)).toEqual([]);
    expect(queryClient.getQueryData(getDashboardLeaderboardQueryOptions("user").queryKey)).toEqual([
      {
        id: "user-7",
        name: "alice",
        totalRequests: 9,
        totalTokens: 99,
        totalCost: 1.23,
      },
    ]);
    expect(
      queryClient.getQueryData(getDashboardLeaderboardQueryOptions("provider").queryKey)
    ).toEqual([
      {
        id: "provider-8",
        name: "Provider A",
        totalRequests: 8,
        totalTokens: 88,
        totalCost: 2.34,
      },
    ]);
    expect(queryClient.getQueryData(getDashboardLeaderboardQueryOptions("model").queryKey)).toEqual(
      [
        {
          id: "model-gpt-5.4",
          name: "gpt-5.4",
          totalRequests: 7,
          totalTokens: 77,
          totalCost: 3.45,
        },
      ]
    );
  });

  test("prefetches providers-inventory cache entries for the initial console route", async () => {
    const queryClient = createQueryClient();
    const { prefetchConsoleInitialRouteData } = await import(
      "@/lib/console/console-route-hydration"
    );

    await prefetchConsoleInitialRouteData(
      queryClient,
      buildConsoleBootstrap({
        locale: "en",
        pathname: "/console/providers/inventory",
        role: "admin",
      })
    );

    expect(
      queryClient.getQueryData(getConsoleDashboardContextQueryOptions().queryKey)
    ).toMatchObject({
      currentUser: { role: "admin" },
    });
    expect(queryClient.getQueryData(getProvidersQueryOptions().queryKey)).toEqual([]);
    expect(queryClient.getQueryData(getProvidersHealthQueryOptions().queryKey)).toEqual({
      11: {
        circuitState: "closed",
        failureCount: 0,
        lastFailureTime: null,
        circuitOpenUntil: null,
        recoveryMinutes: null,
      },
    });
    expect(queryClient.getQueryData(getProvidersStatisticsQueryOptions().queryKey)).toEqual({
      11: { requestCount: 20 },
    });
    expect(queryClient.getQueryData(getProviderVendorsQueryOptions().queryKey)).toEqual([]);
    expect(
      queryClient.getQueryData(getProviderManagerSystemSettingsQueryOptions().queryKey)
    ).toEqual({
      currencyDisplay: "USD",
    });
  });
});

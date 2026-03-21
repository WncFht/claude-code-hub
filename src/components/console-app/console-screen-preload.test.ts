import type { QueryClient } from "@tanstack/react-query";
import { beforeEach, describe, expect, test, vi } from "vitest";

const dashboardBootstrapMocks = vi.hoisted(() => ({
  getConsoleDashboardContext: vi.fn(),
}));

const overviewActionMocks = vi.hoisted(() => ({
  getOverviewData: vi.fn(),
}));

const activeSessionMocks = vi.hoisted(() => ({
  getActiveSessions: vi.fn(),
}));

const statisticsActionMocks = vi.hoisted(() => ({
  getUserStatistics: vi.fn(),
}));

const providerActionMocks = vi.hoisted(() => ({
  getProviders: vi.fn(),
  getProvidersHealthStatus: vi.fn(),
  getProviderStatisticsAsync: vi.fn(),
}));

const providerEndpointActionMocks = vi.hoisted(() => ({
  getProviderVendors: vi.fn(),
}));

vi.mock("@/components/console-app/adapters/dashboard-bootstrap", () => dashboardBootstrapMocks);
vi.mock("@/actions/overview", () => overviewActionMocks);
vi.mock("@/actions/active-sessions", () => activeSessionMocks);
vi.mock("@/actions/statistics", () => statisticsActionMocks);
vi.mock("@/actions/providers", () => providerActionMocks);
vi.mock("@/actions/provider-endpoints", () => providerEndpointActionMocks);

function createQueryClientMock() {
  const ensureQueryData = vi.fn(async (options: { queryFn: () => Promise<unknown> }) => {
    return options.queryFn();
  });
  const fetchQuery = vi.fn(async (options: { queryFn: () => Promise<unknown> }) => {
    return options.queryFn();
  });
  const prefetchQuery = vi.fn(async (options: { queryFn: () => Promise<unknown> }) => {
    await options.queryFn();
  });

  return {
    ensureQueryData,
    fetchQuery,
    prefetchQuery,
  } as unknown as QueryClient & {
    ensureQueryData: typeof ensureQueryData;
    fetchQuery: typeof fetchQuery;
    prefetchQuery: typeof prefetchQuery;
  };
}

describe("console screen data preload", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    dashboardBootstrapMocks.getConsoleDashboardContext.mockResolvedValue({
      currentUser: {
        role: "admin",
      },
      systemSettings: {
        allowGlobalUsageView: true,
        currencyDisplay: "USD",
      },
      serverTimeZone: "UTC",
    });
    overviewActionMocks.getOverviewData.mockResolvedValue({
      ok: true,
      data: {
        concurrentSessions: 3,
        todayRequests: 12,
        todayCost: 4,
        avgResponseTime: 200,
        todayErrorRate: 0.1,
        yesterdaySamePeriodRequests: 10,
        yesterdaySamePeriodCost: 3,
        yesterdaySamePeriodAvgResponseTime: 210,
        recentMinuteRequests: 1,
      },
    });
    activeSessionMocks.getActiveSessions.mockResolvedValue({
      ok: true,
      data: [],
    });
    statisticsActionMocks.getUserStatistics.mockResolvedValue({
      ok: true,
      data: {
        timeRange: "today",
        totalCost: 0,
        totalRequests: 0,
        totalTokens: 0,
        byDate: [],
      },
    });
    providerActionMocks.getProviders.mockResolvedValue([]);
    providerActionMocks.getProvidersHealthStatus.mockResolvedValue({});
    providerActionMocks.getProviderStatisticsAsync.mockResolvedValue({});
    providerEndpointActionMocks.getProviderVendors.mockResolvedValue([]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url.startsWith("/api/leaderboard")) {
          return {
            ok: true,
            json: async () => [],
          };
        }

        if (url === "/api/system-settings") {
          return {
            ok: true,
            json: async () => ({
              currencyDisplay: "USD",
            }),
          };
        }

        throw new Error(`Unexpected fetch: ${url}`);
      })
    );
  });

  test("preloads overview-home dashboard context and its heavy dependent queries together", async () => {
    const { preloadConsoleScreenData } = await import("./console-screen-preload");
    const queryClient = createQueryClientMock();

    await preloadConsoleScreenData("overview-home", {
      pathname: "/console/overview",
      queryClient,
    });

    expect(queryClient.ensureQueryData).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["console-dashboard-context"],
      })
    );
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["overview-data"],
      })
    );
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["statistics", "today"],
      })
    );
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["statistics", "activity", "30days"],
      })
    );
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["active-sessions"],
      })
    );

    const fetchMock = vi.mocked(fetch);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/leaderboard?period=daily&scope=user",
      expect.objectContaining({ credentials: "include" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/leaderboard?period=daily&scope=provider",
      expect.objectContaining({ credentials: "include" })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/leaderboard?period=daily&scope=model",
      expect.objectContaining({ credentials: "include" })
    );
  });

  test("preloads the providers inventory page queries before the route transition starts", async () => {
    const { preloadConsoleScreenData } = await import("./console-screen-preload");
    const queryClient = createQueryClientMock();

    await preloadConsoleScreenData("providers-inventory", {
      pathname: "/console/providers/inventory",
      queryClient,
    });

    expect(queryClient.ensureQueryData).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["console-dashboard-context"],
      })
    );
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["providers"],
      })
    );
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["providers-health"],
      })
    );
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["providers-statistics"],
      })
    );
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["system-settings"],
      })
    );
    expect(queryClient.prefetchQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ["provider-vendors"],
      })
    );
  });
});

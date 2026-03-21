/**
 * @vitest-environment happy-dom
 */
import fs from "node:fs";
import path from "node:path";
import type { ReactNode } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { DashboardBento } from "@/app/[locale]/dashboard/_components/bento/dashboard-bento";
import { DashboardMain } from "@/app/[locale]/dashboard/_components/dashboard-main";
import type { OverviewData } from "@/actions/overview";
import type { UserStatisticsData } from "@/types/statistics";

const routingMocks = vi.hoisted(() => ({
  usePathname: vi.fn(),
}));
vi.mock("@/i18n/routing", () => ({
  usePathname: routingMocks.usePathname,
}));

const overviewMocks = vi.hoisted(() => ({
  getOverviewData: vi.fn(),
}));
vi.mock("@/actions/overview", () => overviewMocks);

const activeSessionsMocks = vi.hoisted(() => ({
  getActiveSessions: vi.fn(),
}));
vi.mock("@/actions/active-sessions", () => activeSessionsMocks);

const statisticsMocks = vi.hoisted(() => ({
  getUserStatistics: vi.fn(),
}));
vi.mock("@/actions/statistics", () => statisticsMocks);

vi.mock("@/app/[locale]/dashboard/_components/bento/live-sessions-panel", () => ({
  LiveSessionsPanel: () => <div data-testid="live-sessions-panel" />,
}));

vi.mock("@/app/[locale]/dashboard/_components/bento/leaderboard-card", () => ({
  LeaderboardCard: () => <div data-testid="leaderboard-card" />,
}));

vi.mock("@/app/[locale]/dashboard/_components/bento/statistics-chart-card", () => ({
  StatisticsChartCard: () => <div data-testid="statistics-chart-card" />,
}));

const customsMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "messages/en/customs.json"), "utf8")
);
const dashboardMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "messages/en/dashboard.json"), "utf8")
);

const mockOverviewData: OverviewData = {
  concurrentSessions: 2,
  todayRequests: 12,
  todayCost: 1.23,
  avgResponseTime: 456,
  todayErrorRate: 0.1,
  yesterdaySamePeriodRequests: 10,
  yesterdaySamePeriodCost: 1.01,
  yesterdaySamePeriodAvgResponseTime: 500,
  recentMinuteRequests: 3,
};

const mockStatisticsData: UserStatisticsData = {
  chartData: [],
  users: [],
  timeRange: "today",
  resolution: "hour",
  mode: "users",
};

const mockActivityStatisticsData: UserStatisticsData = {
  chartData: [
    {
      date: "2026-02-20",
      "user-1_calls": 2,
      "user-2_calls": 1,
      "user-1_cost": "0.2",
      "user-2_cost": "0.1",
    },
    {
      date: "2026-03-19",
      "user-1_calls": 8,
      "user-2_calls": 3,
      "user-1_cost": "0.8",
      "user-2_cost": "0.3",
    },
    {
      date: "2026-03-20",
      "user-1_calls": 12,
      "user-2_calls": 4,
      "user-1_cost": "1.2",
      "user-2_cost": "0.4",
    },
  ],
  users: [
    { id: 1, name: "Alpha", dataKey: "user-1" },
    { id: 2, name: "Beta", dataKey: "user-2" },
  ],
  timeRange: "30days",
  resolution: "day",
  mode: "users",
};

function renderSimple(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(node);
  });

  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function renderWithProviders(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

  act(() => {
    root.render(
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider
          locale="en"
          messages={{ customs: customsMessages, dashboard: dashboardMessages }}
          timeZone="UTC"
        >
          {node}
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  });

  return {
    container,
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

function findByClassToken(root: ParentNode, token: string) {
  return Array.from(root.querySelectorAll<HTMLElement>("*")).find((el) =>
    el.classList.contains(token)
  );
}

function findClosestWithClasses(element: Element | null, classes: string[]) {
  let current = element?.parentElement ?? null;
  while (current) {
    const hasAll = classes.every((cls) => current.classList.contains(cls));
    if (hasAll) return current;
    current = current.parentElement;
  }
  return null;
}

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = "";
  overviewMocks.getOverviewData.mockResolvedValue({ ok: true, data: mockOverviewData });
  activeSessionsMocks.getActiveSessions.mockResolvedValue({ ok: true, data: [] });
  statisticsMocks.getUserStatistics.mockImplementation(async (timeRange?: string) => {
    if (timeRange === "30days") {
      return { ok: true, data: mockActivityStatisticsData };
    }
    return { ok: true, data: mockStatisticsData };
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DashboardMain layout classes", () => {
  test("pathname /dashboard has max-w-7xl and px-6", () => {
    routingMocks.usePathname.mockReturnValue("/dashboard");
    const { container, unmount } = renderSimple(
      <DashboardMain>
        <div data-testid="content" />
      </DashboardMain>
    );

    const main = container.querySelector("main");
    expect(main).toBeTruthy();
    expect(main?.className).toContain("px-6");
    expect(main?.className).toContain("max-w-7xl");
    expect(main?.className).toContain("xl:px-8");

    unmount();
  });

  test("pathname /dashboard/logs keeps max-w-7xl", () => {
    routingMocks.usePathname.mockReturnValue("/dashboard/logs");
    const { container, unmount } = renderSimple(
      <DashboardMain>
        <div data-testid="content" />
      </DashboardMain>
    );

    const main = container.querySelector("main");
    expect(main).toBeTruthy();
    expect(main?.className).toContain("max-w-7xl");

    unmount();
  });
});

describe("DashboardBento admin layout", () => {
  test("renders four-column layout with LiveSessionsPanel in last column", async () => {
    const { container, unmount } = renderWithProviders(
      <DashboardBento
        isAdmin={true}
        currencyCode="USD"
        allowGlobalUsageView={false}
        initialStatistics={mockStatisticsData}
      />
    );
    await flushPromises();

    const grid = findByClassToken(container, "lg:grid-cols-[1fr_1fr_1fr_280px]");
    expect(grid).toBeTruthy();

    const livePanel = container.querySelector('[data-testid="live-sessions-panel"]');
    expect(livePanel).toBeTruthy();

    expect(grid?.contains(livePanel as HTMLElement)).toBe(true);

    unmount();
  });

  test("renders overview hero, grouped sections, and page-level time range controls", async () => {
    const { container, unmount } = renderWithProviders(
      <DashboardBento
        isAdmin={true}
        currencyCode="USD"
        allowGlobalUsageView={true}
        initialStatistics={mockStatisticsData}
        initialOverview={mockOverviewData}
      />
    );
    await flushPromises();

    expect(container.querySelector('[data-slot="page-hero"]')).toBeTruthy();
    expect(container.textContent).toContain("Operations overview");
    expect(container.textContent).toContain("Traffic pulse");
    expect(container.textContent).toContain("Request activity");
    expect(container.textContent).toContain("Usage curve");
    expect(container.textContent).toContain("Rankings and live queue");
    expect(container.querySelector('[data-slot="dashboard-activity-panel"]')).toBeTruthy();
    const futureDayCount = Math.max(0, 6 - new Date().getDay());
    expect(container.querySelectorAll('[data-slot="activity-cell"]').length).toBe(
      54 * 7 - futureDayCount
    );

    const todayButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Today")
    );
    const last7DaysButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Last 7 Days")
    );

    expect(todayButton?.getAttribute("data-active")).toBe("true");
    expect(last7DaysButton?.getAttribute("data-active")).toBe("false");

    const overviewMainGrid = container.querySelector('[data-slot="dashboard-overview-main-grid"]');
    expect(overviewMainGrid).toBeTruthy();
    expect(overviewMainGrid?.className).toContain("grid-cols-1");
    expect(overviewMainGrid?.className).not.toContain("xl:grid-cols-[360px_minmax(0,1fr)]");

    act(() => {
      last7DaysButton?.click();
    });

    expect(last7DaysButton?.getAttribute("data-active")).toBe("true");
    expect(todayButton?.getAttribute("data-active")).toBe("false");

    unmount();
  });
});

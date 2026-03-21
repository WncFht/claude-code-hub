/**
 * @vitest-environment happy-dom
 */

import type { ReactNode } from "react";
import { act } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { buildConsoleBootstrap } from "@/lib/console/console-bootstrap";

const routingState = vi.hoisted(() => ({
  pathname: "/console/overview",
  search: "",
}));

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
}));

const dashboardState = vi.hoisted(() => ({
  allowGlobalUsageView: false,
}));

vi.mock("@/lib/auth", () => authMocks);

vi.mock("@/repository/system-config", () => ({
  getSystemSettings: vi.fn(async () => ({
    allowGlobalUsageView: dashboardState.allowGlobalUsageView,
    currencyDisplay: "USD",
    billingModelSource: "original",
  })),
}));

vi.mock("@/lib/utils/timezone", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/utils/timezone")>("@/lib/utils/timezone");

  return {
    ...actual,
    resolveSystemTimezone: vi.fn(async () => "UTC"),
  };
});

vi.mock("@/actions/users", () => ({
  getUsers: vi.fn(async () => [
    {
      id: 7,
      name: "Operator",
      note: "",
      role: "user",
      rpm: null,
      dailyQuota: null,
      providerGroup: "default",
      tags: [],
      keys: [
        {
          id: 91,
          name: "alpha-key",
          maskedKey: "sk-****",
          canCopy: false,
          expiresAt: null,
          status: "enabled" as const,
          todayUsage: 0,
          todayCallCount: 0,
          todayTokens: 0,
          lastUsedAt: null,
          lastProviderName: null,
          modelStats: [],
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          createdAtFormatted: "2026-01-01 00:00:00",
          canLoginWebUi: true,
          limit5hUsd: 10,
          limitDailyUsd: 20,
          dailyResetMode: "fixed" as const,
          dailyResetTime: "00:00",
          limitWeeklyUsd: null,
          limitMonthlyUsd: null,
          limitTotalUsd: null,
          limitConcurrentSessions: 2,
          costResetAt: null,
          providerGroup: "default",
        },
      ],
      isEnabled: true,
      dailyResetMode: "fixed",
      dailyResetTime: "00:00",
    },
  ]),
  getUserLimitUsage: vi.fn(async () => ({
    ok: true,
    data: {
      userLimit5hUsd: null,
      userLimitDailyUsd: null,
      userLimitWeeklyUsd: null,
      userLimitMonthlyUsd: null,
      userLimitTotalUsd: null,
      userCurrent5hUsd: 0,
      userCurrentDailyUsd: 0,
      userCurrentWeeklyUsd: 0,
      userCurrentMonthlyUsd: 0,
      userCurrentTotalUsd: 0,
      userCurrentConcurrentSessions: 0,
      keyLimit5hUsd: null,
      keyLimitDailyUsd: null,
      keyLimitWeeklyUsd: null,
      keyLimitMonthlyUsd: null,
      keyLimitTotalUsd: null,
      keyCurrent5hUsd: 0,
      keyCurrentDailyUsd: 0,
      keyCurrentWeeklyUsd: 0,
      keyCurrentMonthlyUsd: 0,
      keyCurrentTotalUsd: 0,
      keyCurrentConcurrentSessions: 0,
      userRpmLimit: null,
      userLimitConcurrentSessions: null,
      userExpiresAt: null,
      userProviderGroup: "default",
      userName: "Operator",
      userIsEnabled: true,
      keyProviderGroup: "default",
      keyName: "default-key",
      keyIsEnabled: true,
      userAllowedModels: [],
      userAllowedClients: [],
      expiresAt: null,
      dailyResetMode: "fixed",
      dailyResetTime: "00:00",
    },
  })),
}));

vi.mock("@/actions/providers", () => ({
  getProviders: vi.fn(async () => [
    {
      id: 101,
      name: "Provider A",
      providerType: "openai",
      isEnabled: true,
      priority: 1,
      weight: 1,
      dailyResetMode: "fixed",
      dailyResetTime: "00:00",
      limit5hUsd: null,
      limitDailyUsd: null,
      limitWeeklyUsd: null,
      limitMonthlyUsd: null,
      limitConcurrentSessions: 0,
    },
  ]),
  getProviderLimitUsageBatch: vi.fn(async () => {
    const usage = new Map<number, unknown>();
    usage.set(101, {
      limit5hUsd: null,
      limitDailyUsd: null,
      limitWeeklyUsd: null,
      limitMonthlyUsd: null,
      limitConcurrentSessions: 0,
      current5hUsd: 0,
      currentDailyUsd: 0,
      currentWeeklyUsd: 0,
      currentMonthlyUsd: 0,
      currentConcurrentSessions: 0,
    });
    return usage;
  }),
}));

vi.mock("@/actions/my-usage", () => ({
  getMyQuota: vi.fn(async () => ({
    ok: true,
    data: {
      keyLimit5hUsd: null,
      keyLimitDailyUsd: null,
      keyLimitWeeklyUsd: null,
      keyLimitMonthlyUsd: null,
      keyLimitTotalUsd: null,
      keyLimitConcurrentSessions: 0,
      keyCurrent5hUsd: 0,
      keyCurrentDailyUsd: 0,
      keyCurrentWeeklyUsd: 0,
      keyCurrentMonthlyUsd: 0,
      keyCurrentTotalUsd: 0,
      keyCurrentConcurrentSessions: 0,
      userLimit5hUsd: null,
      userLimitDailyUsd: null,
      userLimitWeeklyUsd: null,
      userLimitMonthlyUsd: null,
      userLimitTotalUsd: null,
      userLimitConcurrentSessions: null,
      userRpmLimit: null,
      userCurrent5hUsd: 0,
      userCurrentDailyUsd: 0,
      userCurrentWeeklyUsd: 0,
      userCurrentMonthlyUsd: 0,
      userCurrentTotalUsd: 0,
      userCurrentConcurrentSessions: 0,
      userExpiresAt: null,
      userProviderGroup: "default",
      userName: "Operator",
      userIsEnabled: true,
      keyProviderGroup: "default",
      keyName: "default-key",
      keyIsEnabled: true,
      userAllowedModels: [],
      userAllowedClients: [],
      expiresAt: null,
      dailyResetMode: "fixed",
      dailyResetTime: "00:00",
    },
  })),
}));

vi.mock("@/actions/key-quota", () => ({
  getKeyQuotaUsage: vi.fn(async () => ({
    ok: true,
    data: {
      keyName: "alpha-key",
      currencyCode: "USD",
      items: [
        { type: "limit5h", current: 1, limit: 10 },
        { type: "limitDaily", current: 2, limit: 20, mode: "fixed", time: "00:00" },
        { type: "limitWeekly", current: 3, limit: null },
        { type: "limitMonthly", current: 4, limit: null },
        { type: "limitTotal", current: 5, limit: null },
        { type: "limitSessions", current: 0, limit: 2 },
      ],
    },
  })),
}));

vi.mock("@/repository/user", () => ({
  findUserById: vi.fn(async (id: number) =>
    id === 7
      ? {
          id: 7,
          name: "Operator",
        }
      : null
  ),
}));

vi.mock("@/repository/statistics", () => ({
  sumUserTotalCostBatch: vi.fn(async () => new Map([[7, 0]])),
  sumKeyTotalCostBatchByIds: vi.fn(async () => new Map()),
}));

vi.mock("@/i18n/routing", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  usePathname: () => routingState.pathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(routingState.search),
  useParams: () => {
    const parts = routingState.pathname.split("/").filter(Boolean);
    const sessionIndex = parts.indexOf("sessions");
    return {
      slug: parts.slice(2),
      sessionId:
        sessionIndex >= 0 && parts[sessionIndex + 1] && parts[sessionIndex + 2] === "messages"
          ? parts[sessionIndex + 1]
          : undefined,
    };
  },
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));

vi.mock("@/components/section", () => ({
  Section: ({
    title,
    actions,
    children,
    ...rest
  }: {
    title?: string;
    actions?: ReactNode;
    children: ReactNode;
    [key: string]: unknown;
  }) => (
    <section data-slot="section" data-title={title} {...rest}>
      {actions}
      {children}
    </section>
  ),
}));

vi.mock("@/app/[locale]/dashboard/_components/bento/dashboard-bento", () => ({
  DashboardBento: ({
    isAdmin,
    allowGlobalUsageView,
  }: {
    isAdmin: boolean;
    allowGlobalUsageView: boolean;
  }) => (
    <div
      data-slot="dashboard-bento"
      data-is-admin={isAdmin ? "true" : "false"}
      data-allow-global-usage-view={allowGlobalUsageView ? "true" : "false"}
    />
  ),
}));

vi.mock("@/app/[locale]/dashboard/leaderboard/_components/leaderboard-view", () => ({
  LeaderboardView: ({ isAdmin }: { isAdmin: boolean }) => (
    <div data-slot="leaderboard-view" data-is-admin={isAdmin ? "true" : "false"} />
  ),
}));

vi.mock("@/app/[locale]/dashboard/availability/_components/availability-dashboard", () => ({
  AvailabilityDashboard: () => <div data-slot="availability-dashboard" />,
}));

vi.mock(
  "@/app/[locale]/dashboard/leaderboard/user/[userId]/_components/user-insights-view",
  () => ({
    UserInsightsView: ({ userId, userName }: { userId: number; userName: string }) => (
      <div data-slot="user-insights-view" data-user-id={String(userId)} data-user-name={userName} />
    ),
  })
);

vi.mock("@/app/[locale]/dashboard/rate-limits/_components/rate-limit-dashboard", () => ({
  RateLimitDashboard: () => <div data-slot="rate-limit-dashboard" />,
}));

vi.mock("@/app/[locale]/dashboard/quotas/keys/_components/keys-quota-manager", () => ({
  KeysQuotaManager: ({ users }: { users: Array<{ id: number }> }) => (
    <div data-slot="keys-quota-manager" data-count={String(users.length)} />
  ),
}));

vi.mock("@/components/customs/active-sessions-list", () => ({
  ActiveSessionsList: () => <div data-slot="active-sessions-list" />,
}));

vi.mock("@/app/[locale]/dashboard/logs/_components/usage-logs-view-virtualized", () => ({
  UsageLogsViewVirtualized: ({
    isAdmin,
    userId,
    serverTimeZone,
  }: {
    isAdmin: boolean;
    userId: number;
    serverTimeZone?: string;
  }) => (
    <div
      data-slot="usage-logs-view"
      data-is-admin={isAdmin ? "true" : "false"}
      data-user-id={String(userId)}
      data-server-time-zone={serverTimeZone}
    />
  ),
}));

vi.mock("@/app/[locale]/dashboard/users/users-page-client", () => ({
  UsersPageClient: ({
    currentUser,
  }: {
    currentUser: {
      id: number;
      role: "admin" | "user";
    };
  }) => (
    <div
      data-slot="users-page-client"
      data-user-id={String(currentUser.id)}
      data-role={currentUser.role}
    />
  ),
}));

vi.mock("@/app/[locale]/dashboard/sessions/_components/active-sessions-client", () => ({
  ActiveSessionsClient: () => <div data-slot="active-sessions-client" />,
}));

vi.mock(
  "@/app/[locale]/dashboard/sessions/[sessionId]/messages/_components/session-messages-client",
  () => ({
    SessionMessagesClient: ({ sessionId }: { sessionId?: string }) => (
      <div data-slot="session-messages-client" data-session-id={sessionId} />
    ),
  })
);

vi.mock("@/app/[locale]/my-usage/_components/quota-cards", () => ({
  QuotaCards: () => <div data-slot="quota-cards" />,
}));

vi.mock("@/app/[locale]/dashboard/quotas/users/_components/users-quota-client", () => ({
  UsersQuotaClient: () => <div data-slot="users-quota-client" />,
}));

vi.mock("@/app/[locale]/dashboard/quotas/providers/_components/providers-quota-manager", () => ({
  ProvidersQuotaManager: () => <div data-slot="providers-quota-manager" />,
}));

function makeSession(role: "admin" | "user") {
  return {
    user: {
      id: role === "admin" ? 1 : 7,
      name: role === "admin" ? "Admin" : "Operator",
      description: "",
      role,
      rpm: null,
      dailyQuota: null,
      providerGroup: "default",
      tags: [],
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      dailyResetMode: "fixed" as const,
      dailyResetTime: "00:00",
      isEnabled: true,
      limit5hUsd: null,
      limitWeeklyUsd: null,
      limitMonthlyUsd: null,
      limitTotalUsd: null,
      limitConcurrentSessions: null,
      expiresAt: null,
      allowedClients: [],
      blockedClients: [],
      allowedModels: [],
    },
    key: {
      canLoginWebUi: true,
      name: "default-key",
      providerGroup: "default",
      isEnabled: true,
      expiresAt: null,
      dailyResetMode: "fixed" as const,
      dailyResetTime: "00:00",
    },
  };
}

function makeBootstrap(pathname: string, role: "admin" | "user" = "admin") {
  return {
    ...buildConsoleBootstrap({
      locale: "en",
      pathname,
      role,
    }),
    currentUser: makeSession(role).user,
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

async function flushPromises() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

async function flushAll() {
  await flushPromises();
  await flushPromises();
}

async function waitForSelector(container: HTMLElement, selector: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (container.querySelector(selector)) {
      return;
    }

    await act(async () => {
      await flushAll();
    });
  }

  throw new Error(`Timed out waiting for selector: ${selector}`);
}

async function render(node: ReactNode) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const queryClient = createQueryClient();

  const wrapped = (currentNode: ReactNode) => (
    <QueryClientProvider client={queryClient}>{currentNode}</QueryClientProvider>
  );

  await act(async () => {
    root.render(wrapped(node));
    await flushAll();
  });

  return {
    container,
    rerender: async (nextNode: ReactNode) => {
      await act(async () => {
        root.render(wrapped(nextNode));
        await flushAll();
      });
    },
    unmount: async () => {
      await act(async () => {
        root.unmount();
        await flushAll();
      });
      queryClient.clear();
      container.remove();
    },
  };
}

describe("overview and traffic console screens", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
    routingState.pathname = "/console/overview";
    routingState.search = "";
    dashboardState.allowGlobalUsageView = false;
    authMocks.getSession.mockResolvedValue(makeSession("admin"));
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  test("loads overview home, leaderboard, and availability screens through the runtime registry", async () => {
    routingState.pathname = "/console/overview";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(<ConsoleApp bootstrap={makeBootstrap("/console/overview")} />);
    await waitForSelector(view.container, '[data-slot="dashboard-bento"]');

    expect(view.container.querySelector('[data-slot="overview-home-screen"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="dashboard-bento"]')).not.toBeNull();

    routingState.pathname = "/console/overview/leaderboard";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/overview/leaderboard")} />);
    await waitForSelector(view.container, '[data-slot="leaderboard-view"]');

    expect(
      view.container.querySelector('[data-slot="overview-leaderboard-screen"]')
    ).not.toBeNull();
    expect(view.container.querySelector('[data-slot="leaderboard-view"]')).not.toBeNull();

    routingState.pathname = "/console/overview/availability";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/overview/availability")} />);
    await waitForSelector(view.container, '[data-slot="availability-dashboard"]');

    expect(
      view.container.querySelector('[data-slot="overview-availability-screen"]')
    ).not.toBeNull();
    expect(view.container.querySelector('[data-slot="availability-dashboard"]')).not.toBeNull();

    await view.unmount();
  });

  test("keeps leaderboard permission gating for non-admin users when global usage view is disabled", async () => {
    dashboardState.allowGlobalUsageView = false;
    authMocks.getSession.mockResolvedValue(makeSession("user"));
    routingState.pathname = "/console/overview/leaderboard";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <ConsoleApp bootstrap={makeBootstrap("/console/overview/leaderboard", "user")} />
    );
    await waitForSelector(view.container, '[data-slot="leaderboard-permission-state"]');

    expect(
      view.container.querySelector('[data-slot="overview-leaderboard-screen"]')
    ).not.toBeNull();
    expect(
      view.container.querySelector('[data-slot="leaderboard-permission-state"]')
    ).not.toBeNull();
    expect(view.container.querySelector('[data-slot="leaderboard-view"]')).toBeNull();

    await view.unmount();
  });

  test("loads traffic logs, users, sessions, and quota screens from console routes", async () => {
    authMocks.getSession.mockResolvedValue(makeSession("admin"));
    routingState.pathname = "/console/traffic/logs";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(<ConsoleApp bootstrap={makeBootstrap("/console/traffic/logs")} />);
    await waitForSelector(view.container, '[data-slot="active-sessions-list"]');
    await waitForSelector(view.container, '[data-slot="usage-logs-view"]');

    expect(view.container.querySelector('[data-slot="traffic-logs-screen"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="active-sessions-list"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="usage-logs-view"]')).not.toBeNull();

    routingState.pathname = "/console/traffic/users";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/traffic/users")} />);
    await waitForSelector(view.container, '[data-slot="users-page-client"]');

    expect(view.container.querySelector('[data-slot="traffic-users-screen"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="users-page-client"]')).not.toBeNull();

    routingState.pathname = "/console/traffic/sessions";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/traffic/sessions")} />);
    await waitForSelector(view.container, '[data-slot="active-sessions-client"]');

    expect(view.container.querySelector('[data-slot="traffic-sessions-screen"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="active-sessions-client"]')).not.toBeNull();

    routingState.pathname = "/console/traffic/quotas";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/traffic/quotas")} />);
    await waitForSelector(view.container, '[data-slot="users-quota-client"]');

    expect(
      view.container
        .querySelector('[data-slot="traffic-quota-screen"]')
        ?.getAttribute("data-quota-mode")
    ).toBe("admin");
    expect(view.container.querySelector('[data-slot="users-quota-client"]')).not.toBeNull();

    await view.unmount();
  });

  test("renders session message detail in full-bleed mode and keeps my quota role-aware", async () => {
    authMocks.getSession.mockResolvedValue(makeSession("admin"));
    routingState.pathname = "/console/traffic/sessions/session-1/messages";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <ConsoleApp bootstrap={makeBootstrap("/console/traffic/sessions/session-1/messages")} />
    );
    await waitForSelector(view.container, '[data-slot="session-messages-client"]');

    expect(
      view.container.querySelector('[data-slot="traffic-session-messages-screen"]')
    ).not.toBeNull();
    expect(
      view.container.querySelector('[data-slot="console-stage"]')?.getAttribute("data-stage-mode")
    ).toBe("full-bleed");
    expect(view.container.querySelector('[data-slot="session-messages-client"]')).not.toBeNull();
    expect(
      view.container
        .querySelector('[data-slot="session-messages-client"]')
        ?.getAttribute("data-session-id")
    ).toBe("session-1");

    authMocks.getSession.mockResolvedValue(makeSession("user"));
    routingState.pathname = "/console/traffic/my-quota";
    await view.rerender(
      <ConsoleApp bootstrap={makeBootstrap("/console/traffic/my-quota", "user")} />
    );
    await waitForSelector(view.container, '[data-slot="quota-cards"]');

    expect(
      view.container
        .querySelector('[data-slot="traffic-quota-screen"]')
        ?.getAttribute("data-quota-mode")
    ).toBe("self");
    expect(view.container.querySelector('[data-slot="quota-cards"]')).not.toBeNull();

    await view.unmount();
  });

  test("loads remaining overview detail and traffic diagnostic screens from console routes", async () => {
    authMocks.getSession.mockResolvedValue(makeSession("admin"));
    routingState.pathname = "/console/overview/leaderboard/users/7";
    const { ConsoleApp } = await import("@/components/console-app/console-app");

    const view = await render(
      <ConsoleApp bootstrap={makeBootstrap("/console/overview/leaderboard/users/7")} />
    );
    await waitForSelector(view.container, '[data-slot="user-insights-view"]');

    expect(
      view.container.querySelector('[data-slot="overview-user-insights-screen"]')
    ).not.toBeNull();
    expect(view.container.querySelector('[data-slot="user-insights-view"]')).not.toBeNull();
    expect(
      view.container.querySelector('[data-slot="user-insights-view"]')?.getAttribute("data-user-id")
    ).toBe("7");

    routingState.pathname = "/console/traffic/rate-limits";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/traffic/rate-limits")} />);
    await waitForSelector(view.container, '[data-slot="rate-limit-dashboard"]');

    expect(view.container.querySelector('[data-slot="traffic-rate-limits-screen"]')).not.toBeNull();
    expect(view.container.querySelector('[data-slot="rate-limit-dashboard"]')).not.toBeNull();

    routingState.pathname = "/console/traffic/quotas/keys";
    await view.rerender(<ConsoleApp bootstrap={makeBootstrap("/console/traffic/quotas/keys")} />);
    await waitForSelector(view.container, '[data-slot="keys-quota-manager"]');

    expect(
      view.container
        .querySelector('[data-slot="traffic-quota-screen"]')
        ?.getAttribute("data-quota-subview")
    ).toBe("keys");
    expect(view.container.querySelector('[data-slot="keys-quota-manager"]')).not.toBeNull();

    await view.unmount();
  });
});
